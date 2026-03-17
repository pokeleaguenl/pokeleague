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
echo "Input: ${VCF}"
echo "Samples: 84"
echo "Variants: 71,340 (ClinGen cardiac genes)"
echo "========================================"

# Step 1: Extract HIGH impact variants
echo ""
echo "[$(date)] Step 1: Extracting HIGH impact variants..."

bcftools +split-vep \
    -i 'IMPACT="HIGH"' \
    -c IMPACT,SYMBOL,Consequence,LoF,LoF_filter,gnomADe_AF,CADD_phred,REVEL_score,ClinVar_CLNSIG,HGVSc,HGVSp \
    -o ${OUT_DIR}/high_impact.vcf.gz \
    -O z \
    ${VCF}

bcftools index --tbi ${OUT_DIR}/high_impact.vcf.gz

N_HIGH=$(bcftools view -H ${OUT_DIR}/high_impact.vcf.gz | wc -l)
echo "  HIGH impact variants: ${N_HIGH}"

# Step 2: Filter for ultra-rare (AC ≤ 10, absent/ultra-rare in gnomAD)
echo ""
echo "[$(date)] Step 2: Filtering for ultra-rare variants..."

bcftools view \
    -i 'AC<=10' \
    -o ${OUT_DIR}/high_impact_ac10.vcf.gz \
    -O z \
    ${OUT_DIR}/high_impact.vcf.gz

bcftools index --tbi ${OUT_DIR}/high_impact_ac10.vcf.gz

# Further filter by gnomAD AF
bcftools +split-vep \
    -i 'gnomADe_AF="." || gnomADe_AF<0.0001' \
    -c gnomADe_AF \
    -o ${OUT_DIR}/high_impact_rare.vcf.gz \
    -O z \
    ${OUT_DIR}/high_impact_ac10.vcf.gz

bcftools index --tbi ${OUT_DIR}/high_impact_rare.vcf.gz

N_RARE=$(bcftools view -H ${OUT_DIR}/high_impact_rare.vcf.gz | wc -l)
echo "  Ultra-rare HIGH impact: ${N_RARE}"

# Step 3: Separate by LoF confidence
echo ""
echo "[$(date)] Step 3: Separating by LoF confidence..."

# HC = High Confidence LoF
bcftools +split-vep \
    -i 'LoF="HC"' \
    -c LoF \
    -o ${OUT_DIR}/lof_HC_rare.vcf.gz \
    -O z \
    ${OUT_DIR}/high_impact_rare.vcf.gz

bcftools index --tbi ${OUT_DIR}/lof_HC_rare.vcf.gz

N_HC=$(bcftools view -H ${OUT_DIR}/lof_HC_rare.vcf.gz | wc -l)
echo "  HIGH confidence LoF: ${N_HC}"

# Step 4: Get MODERATE impact variants
echo ""
echo "[$(date)] Step 4: Extracting MODERATE impact variants..."

bcftools +split-vep \
    -i 'IMPACT="MODERATE"' \
    -c IMPACT,REVEL_score,CADD_phred,SpliceAI_pred_DS_AG,SpliceAI_pred_DS_AL \
    -o ${OUT_DIR}/moderate_impact.vcf.gz \
    -O z \
    ${VCF}

bcftools index --tbi ${OUT_DIR}/moderate_impact.vcf.gz

# Filter for rare + damaging
bcftools view \
    -i 'AC<=10' \
    -o ${OUT_DIR}/moderate_rare.vcf.gz \
    -O z \
    ${OUT_DIR}/moderate_impact.vcf.gz

bcftools index --tbi ${OUT_DIR}/moderate_rare.vcf.gz

# Filter by pathogenicity scores (REVEL>0.7 OR CADD>25 OR SpliceAI>0.5)
bcftools +split-vep \
    -i 'REVEL_score>0.7 || CADD_phred>25 || SpliceAI_pred_DS_AG>0.5 || SpliceAI_pred_DS_AL>0.5' \
    -c REVEL_score,CADD_phred,SpliceAI_pred_DS_AG,SpliceAI_pred_DS_AL \
    -o ${OUT_DIR}/moderate_damaging_rare.vcf.gz \
    -O z \
    ${OUT_DIR}/moderate_rare.vcf.gz

bcftools index --tbi ${OUT_DIR}/moderate_damaging_rare.vcf.gz

N_MOD=$(bcftools view -H ${OUT_DIR}/moderate_damaging_rare.vcf.gz | wc -l)
echo "  Damaging MODERATE impact: ${N_MOD}"

# Step 5: ClinVar P/LP
echo ""
echo "[$(date)] Step 5: Extracting ClinVar P/LP variants..."

bcftools +split-vep \
    -i 'ClinVar_CLNSIG~"Pathogenic" || ClinVar_CLNSIG~"Likely_pathogenic"' \
    -c ClinVar_CLNSIG \
    -o ${OUT_DIR}/clinvar_plp.vcf.gz \
    -O z \
    ${VCF}

bcftools index --tbi ${OUT_DIR}/clinvar_plp.vcf.gz

N_CLINVAR=$(bcftools view -H ${OUT_DIR}/clinvar_plp.vcf.gz | wc -l)
echo "  ClinVar P/LP variants: ${N_CLINVAR}"

# Step 6: Combine all candidates
echo ""
echo "[$(date)] Step 6: Creating combined candidate VCF..."

bcftools concat \
    --allow-overlaps \
    --remove-duplicates \
    -o ${OUT_DIR}/all_plp_candidates.vcf.gz \
    -O z \
    ${OUT_DIR}/lof_HC_rare.vcf.gz \
    ${OUT_DIR}/moderate_damaging_rare.vcf.gz \
    ${OUT_DIR}/clinvar_plp.vcf.gz

bcftools index --tbi ${OUT_DIR}/all_plp_candidates.vcf.gz

N_TOTAL=$(bcftools view -H ${OUT_DIR}/all_plp_candidates.vcf.gz | wc -l)
echo "  Total P/LP candidates: ${N_TOTAL}"

# Step 7: Generate TSV summary
echo ""
echo "[$(date)] Step 7: Generating TSV summary..."

bcftools +split-vep \
    -f '%CHROM\t%POS\t%REF\t%ALT\t%AC\t%AF\t%SYMBOL\t%Consequence\t%IMPACT\t%LoF\t%LoF_filter\t%gnomADe_AF\t%CADD_phred\t%REVEL_score\t%ClinVar_CLNSIG\t%HGVSc\t%HGVSp\n' \
    -c SYMBOL,Consequence,IMPACT,LoF,LoF_filter,gnomADe_AF,CADD_phred,REVEL_score,ClinVar_CLNSIG,HGVSc,HGVSp \
    ${OUT_DIR}/all_plp_candidates.vcf.gz \
    > ${OUT_DIR}/all_plp_candidates.tsv

echo "  TSV summary: ${OUT_DIR}/all_plp_candidates.tsv"

# Step 8: Carrier report
echo ""
echo "[$(date)] Step 8: Generating carrier report..."

bcftools query \
    -f '%CHROM\t%POS\t%REF\t%ALT\t%AC[\t%SAMPLE=%GT]\n' \
    ${OUT_DIR}/all_plp_candidates.vcf.gz | \
    awk 'BEGIN{OFS="\t"} {for(i=6;i<=NF;i++) if($i !~ /=0[\/|]0/) print $1,$2,$3,$4,$5,$i}' | \
    sed 's/=/\t/2' > ${OUT_DIR}/carriers_per_variant.tsv

echo "  Carriers: ${OUT_DIR}/carriers_per_variant.tsv"

# Summary
echo ""
echo "[$(date)] ========================================"
echo "SUMMARY"
echo "========================================"
echo "HIGH impact total: ${N_HIGH}"
echo "  └─ Ultra-rare: ${N_RARE}"
echo "     └─ HC LoF: ${N_HC}"
echo "MODERATE damaging: ${N_MOD}"
echo "ClinVar P/LP: ${N_CLINVAR}"
echo "========================================"
echo "TOTAL CANDIDATES: ${N_TOTAL}"
echo "========================================"
echo ""
echo "[$(date)] Done!"

