---
name: Monthly Dependency Audit
about: Regular monthly audit of project dependencies
title: 'Dependency Audit - [MONTH YEAR]'
labels: dependencies, maintenance
assignees: ''

---

## Monthly Dependency Audit Checklist

**Schedule**: First Monday of each month  
**Time Required**: 1-2 hours  
**Due Date**: Within 1 week of creation

### 1. Review Open Dependabot PRs

- [ ] Review all open Dependabot PRs
- [ ] Merge safe patch/minor updates
- [ ] Test and approve major version updates
- [ ] Close outdated or problematic PRs with reasoning
- [ ] Document any blocked updates

**Summary**:
<!-- Number of PRs reviewed, merged, closed -->

---

### 2. Security Alerts

- [ ] Check Dependabot security alerts
- [ ] Ensure all high/critical alerts are resolved
- [ ] Review medium severity alerts
- [ ] Document decisions on deferred alerts

**High/Critical Alerts**: <!-- Number, status -->  
**Medium Alerts**: <!-- Number, status -->  

---

### 3. Dependency Health Check

Run health checks for all packages:

```bash
# Root package
npm outdated
npm audit

# Web package
cd web && npm outdated
npm audit

# CLI package
cd ../cli && npm outdated
npm audit

# SDK package
cd ../sdk/typescript && npm outdated
npm audit
```

- [ ] Identify deprecated packages (check npm warnings)
- [ ] Identify unmaintained packages (no updates in 1+ year)
- [ ] Check for duplicate dependencies

**Findings**:
<!-- List any concerning findings -->

---

### 4. Consolidation Opportunities

- [ ] Review for multiple packages solving the same problem
- [ ] Identify unused dependencies (`npm ls` + code search)
- [ ] Evaluate lightweight alternatives to heavy packages
- [ ] Run `npm dedupe` to consolidate duplicates

**Actions Taken**:
<!-- List any dependencies removed or consolidated -->

---

### 5. Update Documentation

- [ ] Update dependency count in README if significantly changed
- [ ] Document any new critical dependencies
- [ ] Update DEPENDENCY_MANAGEMENT.md if process changed
- [ ] Update .github/dependabot.yml if groups need adjustment

---

### 6. Metrics Tracking

**Package Metrics** (compare to last month):

| Package | Total Deps | Outdated | Vulnerabilities | Deprecated |
|---------|------------|----------|-----------------|------------|
| Root    | <!-- --> | <!-- --> | <!-- -->        | <!-- -->   |
| Web     | <!-- --> | <!-- --> | <!-- -->        | <!-- -->   |
| CLI     | <!-- --> | <!-- --> | <!-- -->        | <!-- -->   |
| SDK     | <!-- --> | <!-- --> | <!-- -->        | <!-- -->   |

**Trend**: <!-- Improving / Stable / Declining -->

---

### 7. Action Items

List any follow-up tasks or issues to create:

- [ ] <!-- Action item 1 -->
- [ ] <!-- Action item 2 -->

---

## Notes

<!-- Any additional observations or recommendations -->

---

## Sign-off

**Auditor**: <!-- Your GitHub username -->  
**Date Completed**: <!-- YYYY-MM-DD -->  
**Next Audit Due**: <!-- First Monday of next month -->

---

## Resources

- [Dependency Management Guide](../../docs/DEPENDENCY_MANAGEMENT.md)
- [Quick Reference](./../DEPENDENCY_UPDATE_PROCESS.md)
- [Dependabot Alerts](../../../security/dependabot)
- [CodeQL Results](../../../security/code-scanning)
