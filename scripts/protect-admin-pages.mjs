import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const adminPages = await glob('src/app/admin/**/page.tsx');

console.log(`\n=== Found ${adminPages.length} admin pages ===\n`);

for (const pagePath of adminPages) {
  console.log(`Processing: ${pagePath}`);
  
  let content = readFileSync(pagePath, 'utf-8');
  
  // Check if already protected
  if (content.includes('requireAdminPage') || content.includes('checkAdminAuth')) {
    console.log('  ⏭️  Already protected\n');
    continue;
  }
  
  // Add import if not present
  if (!content.includes('import { requireAdminPage }')) {
    // Find position after last import
    const importRegex = /^import .+;$/gm;
    const imports = [...content.matchAll(importRegex)];
    
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const insertPos = lastImport.index + lastImport[0].length;
      
      content = 
        content.slice(0, insertPos) + 
        '\nimport { requireAdminPage } from "@/lib/auth/admin";' +
        content.slice(insertPos);
      
      console.log('  ✅ Added import');
    }
  }
  
  // Find the default export function
  const functionMatch = content.match(/export default async function \w+\([^)]*\)\s*{/);
  
  if (functionMatch) {
    const insertPos = functionMatch.index + functionMatch[0].length;
    
    const authCheck = `
  // Admin auth check
  await requireAdminPage();
`;
    
    content = 
      content.slice(0, insertPos) +
      authCheck +
      content.slice(insertPos);
    
    console.log('  ✅ Added auth check');
    writeFileSync(pagePath, content, 'utf-8');
    console.log('  💾 Saved changes');
  }
  
  console.log('');
}

console.log('=== Done! ===\n');
