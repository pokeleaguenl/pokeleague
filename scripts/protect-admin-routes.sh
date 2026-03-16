#!/bin/bash

echo "=== Adding admin protection to all admin API routes ==="
echo ""

# Find all admin API routes
ADMIN_ROUTES=$(find src/app/api -type f -path "*/admin/*" -name "route.ts")

for route in $ADMIN_ROUTES; do
  echo "Processing: $route"
  
  # Check if already protected
  if grep -q "requireAdmin" "$route"; then
    echo "  ⏭️  Already protected"
    continue
  fi
  
  # Create backup
  cp "$route" "$route.backup"
  
  # Add import at top (after existing imports)
  if ! grep -q "import.*requireAdmin" "$route"; then
    # Find the last import line
    last_import=$(grep -n "^import" "$route" | tail -1 | cut -d: -f1)
    
    if [ -n "$last_import" ]; then
      # Insert after last import
      sed -i "${last_import}a import { requireAdmin } from \"@/lib/auth/admin\";" "$route"
      echo "  ✅ Added import"
    fi
  fi
  
  # Add auth check at start of each exported function (GET, POST, etc.)
  # This is safer to do manually, so we'll just flag it
  echo "  ⚠️  Need to manually add auth check - see the route file"
done

echo ""
echo "=== Summary ==="
echo "Admin routes found: $(echo "$ADMIN_ROUTES" | wc -l)"
echo ""
echo "Next: Manually add this line at the start of each handler function:"
echo ""
echo "  const adminUser = await requireAdmin();"
echo "  if (adminUser instanceof NextResponse) return adminUser;"
echo ""
