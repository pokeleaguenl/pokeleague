import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

const adminRoutes = await glob('src/app/api/**/admin/**/route.ts');

console.log(`\n=== Found ${adminRoutes.length} admin routes ===\n`);

for (const routePath of adminRoutes) {
  console.log(`Processing: ${routePath}`);
  
  let content = readFileSync(routePath, 'utf-8');
  
  // Check if already protected
  if (content.includes('requireAdmin')) {
    console.log('  ⏭️  Already protected\n');
    continue;
  }
  
  // Add import if not present
  if (!content.includes('import { requireAdmin }')) {
    // Find position after last import
    const importRegex = /^import .+;$/gm;
    const imports = [...content.matchAll(importRegex)];
    
    if (imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const insertPos = lastImport.index + lastImport[0].length;
      
      content = 
        content.slice(0, insertPos) + 
        '\nimport { requireAdmin } from "@/lib/auth/admin";' +
        content.slice(insertPos);
      
      console.log('  ✅ Added import');
    }
  }
  
  // Add auth check to each handler (GET, POST, PUT, DELETE, PATCH)
  const handlers = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  let modified = false;
  
  for (const method of handlers) {
    const handlerRegex = new RegExp(`export async function ${method}\\([^)]*\\)\\s*{`, 'g');
    const match = handlerRegex.exec(content);
    
    if (match) {
      const insertPos = match.index + match[0].length;
      
      // Check if auth already added right after function start
      const nextLines = content.slice(insertPos, insertPos + 200);
      if (nextLines.includes('requireAdmin')) {
        continue;
      }
      
      const authCheck = `
  // Admin auth check
  const adminUser = await requireAdmin();
  if (adminUser instanceof NextResponse) return adminUser;
`;
      
      content = 
        content.slice(0, insertPos) +
        authCheck +
        content.slice(insertPos);
      
      console.log(`  ✅ Added auth check to ${method}`);
      modified = true;
    }
  }
  
  if (modified) {
    writeFileSync(routePath, content, 'utf-8');
    console.log('  💾 Saved changes');
  }
  
  console.log('');
}

console.log('=== Done! ===\n');
