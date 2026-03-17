# Weekly Maintenance Checklist

## Every Monday (15 min)

- [ ] Run coverage checker
```bash
  export $(cat .env.local | grep -v '^#' | xargs)
  node scripts/automation/check-alias-coverage.mjs
```

- [ ] Run data refresh
```bash
  node scripts/automation/refresh-rk9-data.mjs
```

- [ ] Mobile check
  - [ ] Visit site on phone
  - [ ] Test navigation
  - [ ] Test search
  - [ ] Check one tournament page

- [ ] If coverage < 55%:
  - [ ] Add new high-entry decks
  - [ ] Commit and push

---

**Date:** _________  
**Coverage:** _____%  
**Issues Found:** _______________  
**Actions Taken:** _______________
