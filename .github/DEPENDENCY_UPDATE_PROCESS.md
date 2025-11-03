# Dependency Update Process - Quick Reference

This is a quick reference guide for the automated dependency update process. For comprehensive documentation, see [docs/DEPENDENCY_MANAGEMENT.md](../docs/DEPENDENCY_MANAGEMENT.md).

## 🤖 What Runs Automatically

### Daily (9:00 AM PST)

- ✅ **Security updates** for all packages
- ✅ Auto-approved and auto-merged after CI passes
- ✅ Notifications sent for high/critical vulnerabilities

### Weekly (Mondays, 9:00 AM PST)

- ✅ **Regular updates** (patch and minor versions)
- ✅ Grouped by category (React, testing, etc.)
- ✅ Auto-merged after CI passes
- ⚠️ **Major updates** require manual review

### On Every PR

- ✅ **Dependency review** checks for vulnerabilities
- ✅ **License compliance** checks
- ✅ Fails PR if moderate+ severity issues found

### Weekly (Mondays, 6:00 AM UTC) + Every Push/PR

- ✅ **CodeQL security analysis** for code vulnerabilities
- ✅ Results available in Security tab

## 👀 What Needs Your Attention

### Immediate Action Required

1. **High/Critical security alerts**
   - Check: Security tab → Dependabot alerts
   - Action: Review and merge the auto-generated PR within 1 day
2. **Failed CI on Dependabot PRs**
   - Check: PR checks section
   - Action: Review errors, fix issues, or close PR

3. **CodeQL high severity alerts**
   - Check: Security tab → Code scanning
   - Action: Create issue and fix within 1 day

### Weekly Review

4. **Major version updates**
   - Check: PRs labeled `dependencies` without `automerge`
   - Action: Review changelog, test locally, approve/reject

5. **Blocked Dependabot PRs**
   - Check: Open Dependabot PRs older than 1 week
   - Action: Review, test, and merge or close with reason

### Monthly Audit (First Monday)

6. **Dependency health check**
   - Run: `npm outdated`, `npm audit`
   - Action: Review and plan updates for outdated packages
7. **Consolidate dependencies**
   - Review: Look for duplicate or unnecessary packages
   - Action: Remove unused dependencies

## 📋 Quick Commands

```bash
# Check outdated packages
npm outdated
cd web && npm outdated

# Security audit
npm audit
cd web && npm audit

# Test Dependabot PR locally
gh pr checkout <PR-NUMBER>
npm ci --legacy-peer-deps
npm test && npm run lint

# Deduplicate dependencies
npm dedupe
cd web && npm dedupe

# Manual security fix (use with caution)
npm audit fix
```

## ✅ Review Checklist for Dependabot PRs

**Patch/Minor Updates** (usually auto-merged):

- [ ] CI checks pass (green checkmarks)
- [ ] No unexpected file changes (only package.json, lock files)
- [ ] Auto-merge label present

**Major Updates** (manual review required):

- [ ] Read release notes and changelog
- [ ] Check for breaking changes
- [ ] Review diff for unexpected changes
- [ ] Test locally: `gh pr checkout <PR>` → `npm test`
- [ ] Verify builds: `npm run build`
- [ ] Manual testing if critical package
- [ ] Approve and merge OR close with reason

## 🚨 When to Reject an Update

Close the PR and create an issue if:

- ❌ Introduces breaking changes we can't accommodate
- ❌ Causes test failures that aren't easily fixable
- ❌ Significantly increases bundle size without justification
- ❌ Has known bugs reported in recent issues
- ❌ License changed to incompatible terms
- ❌ Package is deprecated or unmaintained

## 📊 Where to Find Information

| What             | Where                                                         |
| ---------------- | ------------------------------------------------------------- |
| Dependabot PRs   | [Pull Requests](../../pulls) filtered by `dependencies` label |
| Security alerts  | [Security tab](../../security/dependabot) → Dependabot        |
| CodeQL results   | [Security tab](../../security/code-scanning) → Code scanning  |
| Workflow runs    | [Actions tab](../../actions)                                  |
| Failed checks    | Click PR → Checks tab                                         |
| Dependency graph | [Insights tab](../../network/dependencies) → Dependency graph |

## 🔧 Configuration Files

- **Dependabot**: `.github/dependabot.yml`
- **Auto-merge**: `.github/workflows/dependabot-auto-merge.yml`
- **CodeQL**: `.github/workflows/codeql-analysis.yml`
- **Dependency Review**: `.github/workflows/dependency-review.yml`

## 🆘 Troubleshooting

### Dependabot not creating PRs?

1. Check: Insights → Dependency graph → Dependabot
2. Look for errors or paused updates
3. Manually trigger: Click "Check for updates"

### Auto-merge not working?

1. Verify CI passes
2. Check update type (major versions don't auto-merge)
3. Review Actions tab for workflow errors

### Security alert not resolved?

1. Check if Dependabot PR exists
2. If no PR, may need manual update
3. Check if vulnerability is in transitive dependency

## 📚 Full Documentation

For detailed information:

- **Complete guide**: [docs/DEPENDENCY_MANAGEMENT.md](../docs/DEPENDENCY_MANAGEMENT.md)
- **Security policy**: [SECURITY_POLICY.md](../SECURITY_POLICY.md)
- **Contributing**: [CONTRIBUTING.md](../CONTRIBUTING.md)

## 💬 Getting Help

- Open a [GitHub Discussion](../../discussions)
- Email: security@subculture.io
- Review existing [dependency issues](../../issues?q=label%3Adependencies)
