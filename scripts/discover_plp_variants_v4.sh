#!/bin/bash
set -euo pipefail

module load 2024
module load BCFtools/1.21-GCC-13.3.0

WORKDIR=/gpfs/work2/0/brugada/dominicz/WGS_SCA_2026
VCF=${WORKDIR}/vcf/cohort.raw.ClinGen_All_Genes.norm.vep.dbnsfp.spliceai.loftee.vcf.gz
OUT_DIR=${WORKDIR}/12_plp_candidates
mkdir -p ${OUT_DIR}

echo "[$(date)] ========================================"
echo "P/LP Variant Discovery Pipeline"
echo "========================================"

# Step 1: Extract HIGH impact variants
echo ""
echo "[$(date)] Step 1: HIGH impact variants..."

bcftools +split-vep \
    -i 'IMPACT="HIGH"' \
    -c IMPACT \
    -o ${OUT_DIR}/high_impact.vcf.gz \
    -O z \
    ${VCF}

bcftools index --tbi ${OUT_DIR}/high_impact.vcf.gz

N_HIGH=$(bcftools view -H ${OUT_DIR}/high_impact.vcf.gz | wc -l)
echo "  ✓ HIGH impact: ${N_HIGH}"

# Step 2: Filter for ultra-rare
echo ""
echo "[$(date)] Step 2: Ultra-rare filtering..."

bcftools view \
    -i 'AC<=10' \
    -o ${OUT_DIR}/high_rare.vcf.gz \
    -O z \
    ${OUT_DIR}/high_impact.vcf.gz

bcftools index --tbi ${OUT_DIR}/high_rare.vcf.gz

N_RARE=$(bcftools view -H ${OUT_DIR}/high_rare.vcf.gz | wc -l)
echo "  ✓ Ultra-rare HIGH: ${N_RARE}"

# Step 3: HC LoF only
echo ""
echo "[$(date)] Step 3: High-confidence LoF..."

bcftools +split-vep \
    -i 'LoF="HC"' \
    -c LoF \
    -o ${OUT_DIR}/lof_HC_rare.vcf.gz \
    -O z \
    ${OUT_DIR}/high_rare.vcf.gz

bcftools index --tbi ${OUT_DIR}/lof_HC_rare.vcf.gz

N_HC=$(bcftools view -H ${OUT_DIR}/lof_HC_rare.vcf.gz | wc -l)
echo "  ✓ HC LoF: ${N_HC}"

# Step 4: MODERATE impact
echo ""
echo "[$(date)] Step 4: MODERATE impact variants..."

bcftools +split-vep \
    -i 'IMPACT="MODERATE"' \
    -c IMPACT \
    -o ${OUT_DIR}/moderate_all.vcf.gz \
    -O z \
    ${VCF}

bcftools index --tbi ${OUT_DIR}/moderate_all.vcf.gz

# Rare MODERATE
bcftools view \
    -i 'AC<=10' \
    -o ${OUT_DIR}/moderate_rare.vcf.gz \
    -O z \
    ${OUT_DIR}/moderate_all.vcf.gz

bcftools index --tbi ${OUT_DIR}/moderate_rare.vcf.gz

# Use Python to filter by numeric scores (handles "." properly)
python3 << 'PYEOF'
import pysam
vcf_in = pysam.VariantFile("/gpfs/work2/0/brugada/dominicz/WGS_SCA_2026/12_plp_candidates/moderate_rare.vcf.gz")
vcf_out = pysam.VariantFile("/gpfs/work2/0/brugada/dominicz/WGS_SCA_2026/12_plp_candidates/moderate_damaging.vcf.gz", 'w', header=vcf_in.header)

for record in vcf_in:
    if 'CSQ' not in record.info:
        continue
    
    damaging = False
    for csq in record.info['CSQ']:
        fields = csq.split('|')
        
        # Extract scores (handle missing values)
        try:
            cadd = float(fields[65]) if fields[65] != '.' else 0
            revel = float(fields[71]) if fields[71] != '.' else 0
            spliceai_ag = float(fields[78]) if fields[78] != '.' else 0
            spliceai_al = float(fields[79]) if fields[79] != '.' else 0
            
            if cadd > 25 or revel > 0.7 or spliceai_ag > 0.5 or spliceai_al > 0.5:
                damaging = True
                break
        except:
            continue
    
    if damaging:
        vcf_out.write(record)

vcf_in.close()
vcf_out.close()
PYEOF

bcftools index --tbi ${OUT_DIR}/moderate_damaging.vcf.gz

N_MOD=$(bcftools view -H ${OUT_DIR}/moderate_damaging.vcf.gz | wc -l)
echo "  ✓ Damaging MODERATE: ${N_MOD}"

# Step 5: ClinVar P/LP
echo ""
echo "[$(date)] Step 5: ClinVar P/LP..."

bcftools +split-vep \
    -i 'ClinVar_CLNSIG~"athogenic"' \
    -c ClinVar_CLNSIG \
    -o ${OUT_DIR}/clinvar_plp.vcf.gz \
    -O z \
    ${VCF}

bcftools index --tbi ${OUT_DIR}/clinvar_plp.vcf.gz

N_CLINVAR=$(bcftools view -H ${OUT_DIR}/clinvar_plp.vcf.gz | wc -l)
echo "  ✓ ClinVar P/LP: ${N_CLINVAR}"

# Step 6: Combine
echo ""
echo "[$(date)] Step 6: Combining candidates..."

bcftools concat \
    --allow-overlaps \
    --remove-duplicates \
    -o ${OUT_DIR}/all_plp_candidates.vcf.gz \
    -O z \
    ${OUT_DIR}/lof_HC_rare.vcf.gz \
    ${OUT_DIR}/moderate_damaging.vcf.gz \
    ${OUT_DIR}/clinvar_plp.vcf.gz

bcftools index --tbi ${OUT_DIR}/all_plp_candidates.vcf.gz

N_TOTAL=$(bcftools view -H ${OUT_DIR}/all_plp_candidates.vcf.gz | wc -l)

# Step 7: Generate tables
echo ""
echo "[$(date)] Step 7: Generating reports..."

bcftools +split-vep \
    -f '%CHROM\t%POS\t%REF\t%ALT\t%AC\t%AF\t%SYMBOL\t%Consequence\t%IMPACT\t%LoF\t%gnomADe_AF\t%CADD_phred\t%REVEL_score\t%ClinVar_CLNSIG\t%HGVSc\t%HGVSp\n' \
    -c SYMBOL,Consequence,IMPACT,LoF,gnomADe_AF,CADD_phred,REVEL_score,ClinVar_CLNSIG,HGVSc,HGVSp \
    ${OUT_DIR}/all_plp_candidates.vcf.gz \
    > ${OUT_DIR}/all_plp_candidates.tsv

bcftools query \
    -f '%CHROM\t%POS\t%REF\t%ALT\t%AC[\t%SAMPLE=%GT]\n' \
    ${OUT_DIR}/all_plp_candidates.vcf.gz | \
    awk 'BEGIN{OFS="\t"} {for(i=6;i<=NF;i++) if($i !~ /=0[\/|]0/) print $1,$2,$3,$4,$5,$i}' | \
    sed 's/=/\t/2' > ${OUT_DIR}/carriers.tsv

echo ""
echo "========================================"
echo "FINAL RESULTS"
echo "========================================"
echo "HIGH impact LoF (HC, rare): ${N_HC}"
echo "MODERATE damaging (rare): ${N_MOD}"
echo "ClinVar P/LP: ${N_CLINVAR}"
echo "========================================"
echo "TOTAL CANDIDATES: ${N_TOTAL}"
echo "========================================"
echo ""
echo "Output files:"
echo "  ${OUT_DIR}/all_plp_candidates.vcf.gz"
echo "  ${OUT_DIR}/all_plp_candidates.tsv"
echo "  ${OUT_DIR}/carriers.tsv"
echo ""
echo "[$(date)] Done!"

