# Dependency Management Guide

This document outlines the automated dependency update process, security scanning procedures, and review guidelines for the Internet-ID project.

## Overview

The project uses automated tools to keep dependencies up-to-date and secure:

- **Dependabot**: Automated dependency updates via pull requests
- **CodeQL**: Advanced security vulnerability scanning
- **Dependency Review**: PR-based security checks for new dependencies
- **Auto-merge**: Automatic merging of safe updates after CI passes

## Automated Dependency Updates

### Dependabot Configuration

Dependabot is configured to automatically create pull requests for dependency updates. See `.github/dependabot.yml` for the complete configuration.

#### Update Schedule

- **Security updates**: Checked **daily** at 9:00 AM PST
  - High priority, auto-approved for merging after CI passes
  - Covers all vulnerability patches regardless of severity
  
- **Regular updates**: Checked **weekly** on Mondays at 9:00 AM PST
  - Grouped by category (React, testing tools, linting, etc.)
  - Patch and minor updates auto-merge after CI passes
  - Major updates require manual review

#### Update Categories

Dependencies are organized into logical groups to reduce noise:

**Root Package (`/`)**:
- `hardhat-and-ethers`: Blockchain tooling (Hardhat, Ethers.js, OpenZeppelin)
- `testing-tools`: Test frameworks (Chai, Mocha, Sinon, Supertest)
- `prisma`: Database ORM and related tools
- `security-tools`: Security packages (Sentry, Helmet, rate limiting)
- `linting-and-formatting`: ESLint, Prettier, and TypeScript ESLint
- `typescript`: TypeScript and type definitions

**Web Package (`/web`)**:
- `react`: React and React DOM
- `nextjs`: Next.js framework and plugins
- `auth`: NextAuth and authentication adapters
- `prisma-web`: Prisma client for web
- `playwright`: E2E testing framework
- `performance`: Lighthouse CI and performance tools

**CLI Package (`/cli`)**:
- `cli-tools`: Commander, Inquirer, Chalk, Ora
- `cli-shared`: Axios, Ethers, Dotenv

**SDK Package (`/sdk/typescript`)**:
- `sdk`: Axios and TypeScript

**Infrastructure**:
- `github-actions`: GitHub Actions workflow dependencies
- `docker`: Docker base images

### Auto-Merge Policy

Dependabot PRs are automatically merged based on the following rules:

✅ **Auto-merged** (after CI passes):
- Patch updates (e.g., 1.2.3 → 1.2.4)
- Minor updates (e.g., 1.2.0 → 1.3.0)
- Security patches (any severity)

⚠️ **Manual review required**:
- Major updates (e.g., 1.0.0 → 2.0.0)
- Breaking changes indicated in PR description
- Failed CI checks
- License changes

The auto-merge workflow:
1. Dependabot creates PR with update
2. CI runs automatically (linting, tests, build)
3. If update is patch/minor AND CI passes → Auto-approved and merged
4. If update is major → Comment added requesting manual review
5. Merged PRs are labeled with `automerged` tag

## Security Scanning

### CodeQL Analysis

CodeQL runs advanced security analysis on the codebase:

- **Schedule**: Weekly on Mondays + on every push/PR to main
- **Query Coverage**: `security-extended` and `security-and-quality` packs
- **Languages**: JavaScript/TypeScript
- **Results**: Available in Security tab → Code scanning alerts

#### Viewing CodeQL Results

1. Go to repository → **Security** tab
2. Click **Code scanning alerts**
3. Filter by severity, status, or tool
4. Click alert for detailed information and remediation steps

#### Responding to CodeQL Alerts

**Critical/High Severity**:
1. Create issue immediately
2. Assign to security team
3. Fix within 1 business day
4. Deploy patch as soon as CI passes

**Medium Severity**:
1. Create issue for tracking
2. Fix within 1 week
3. Include in next regular release

**Low/Informational**:
1. Review for false positives
2. Fix during regular maintenance
3. May defer if risk is acceptable

### Dependency Review

Every pull request is automatically scanned for:
- New vulnerabilities in dependencies
- Problematic licenses (GPL, AGPL, LGPL)
- Supply chain risks

**Configuration** (`.github/workflows/dependency-review.yml`):
- Fails PR on moderate+ severity vulnerabilities
- Warns on low severity issues
- Allows: MIT, Apache-2.0, BSD, ISC licenses
- Denies: GPL-3.0, AGPL-3.0, LGPL-3.0

#### Responding to Dependency Review Failures

If a PR fails dependency review:

1. **Identify the issue**: Check the PR comment for details
2. **Assess risk**: Review CVE details and CVSS score
3. **Take action**:
   - **Vulnerable dependency**: Update to patched version or find alternative
   - **License issue**: Replace with compatible library or get approval
   - **Supply chain risk**: Verify package authenticity, consider alternatives

### GitHub Security Alerts

Dependabot Security Alerts notify about vulnerabilities in dependencies:

- **Location**: Security tab → Dependabot alerts
- **Notifications**: Enabled for high/critical vulnerabilities
- **Auto-fix**: Dependabot creates PR with fix automatically

#### Configuring Notifications

Ensure you're subscribed to security notifications:

1. Go to repository settings
2. Click **Notifications** (left sidebar)
3. Enable notifications for:
   - Dependabot alerts
   - Security alerts
4. Set notification level to **Participating and @mentions** or **All activity**

For high/critical alerts:
1. Go to your GitHub profile settings
2. Click **Notifications** 
3. Enable **Email** for security alerts

## Review Guidelines

### Reviewing Dependabot PRs

Before merging a Dependabot PR (especially major updates):

1. **Read the changelog**: Click the release notes link in PR description
2. **Check for breaking changes**: Look for BREAKING CHANGE commits
3. **Review the diff**: Ensure only expected files changed (package.json, lock files)
4. **Verify CI passes**: All checks must be green
5. **Test locally** (major updates only):
   ```bash
   gh pr checkout <PR-NUMBER>
   npm install --legacy-peer-deps
   npm test
   npm run lint
   ```

### Testing Updates Locally

For critical updates or major versions:

```bash
# Checkout the Dependabot PR
gh pr checkout 123

# Install dependencies
npm ci --legacy-peer-deps
cd web && npm ci --legacy-peer-deps

# Run tests
npm test
cd web && npm run test:e2e

# Build and verify
npm run build
cd web && npm run build

# Manual testing if needed
npm run start:api  # Test API
cd web && npm run dev  # Test web app
```

### Rejecting Updates

If an update causes issues:

1. **Comment on PR** with details of the problem
2. **Close the PR** (don't merge)
3. **Snooze the update** in Dependabot settings if needed
4. **Create an issue** to track the problem and resolution

## Monthly Dependency Audit

Schedule a monthly review to maintain dependency health:

### Audit Checklist

**First Monday of each month** (1-2 hours):

- [ ] Review all open Dependabot PRs
  - Merge safe updates
  - Close outdated or problematic PRs
  - Test and merge blocked major updates
  
- [ ] Check Dependabot security alerts
  - Ensure all high/critical alerts are resolved
  - Review medium severity alerts
  - Document decisions on deferred alerts
  
- [ ] Review dependency health
  - Check for deprecated packages: `npm outdated`
  - Look for unmaintained dependencies (no updates in 1+ year)
  - Identify duplicate dependencies: `npm dedupe`
  
- [ ] Check for consolidation opportunities
  - Review if multiple packages solve the same problem
  - Consider removing unused dependencies
  - Evaluate lightweight alternatives to heavy packages
  
- [ ] Update documentation
  - Update dependency count in README if significant changes
  - Document any new critical dependencies
  - Update this guide if process changes

### Running Manual Dependency Checks

```bash
# Check for outdated packages
npm outdated
cd web && npm outdated
cd ../cli && npm outdated
cd ../sdk/typescript && npm outdated

# Check for security vulnerabilities
npm audit
cd web && npm audit
cd ../cli && npm audit
cd ../sdk/typescript && npm audit

# Fix vulnerabilities (with caution)
npm audit fix
# Note: Only run `npm audit fix --force` after careful review

# Deduplicate dependencies
npm dedupe
cd web && npm dedupe
```

### Dependency Metrics to Track

Monitor these metrics over time:

- Total number of dependencies (direct + transitive)
- Number of outdated packages
- Security vulnerabilities by severity
- Average age of dependencies
- Number of deprecated packages

## Troubleshooting

### Dependabot Not Creating PRs

**Check**:
1. Dependabot is enabled in repository settings
2. `.github/dependabot.yml` syntax is valid
3. Hit open PR limit (default: 10 per package manager)
4. Dependencies are already up-to-date

**Solution**:
- Go to Insights → Dependency graph → Dependabot
- Check for errors or paused updates
- Manually trigger update: Click "Check for updates"

### Auto-merge Not Working

**Check**:
1. CI checks are passing
2. PR is from `dependabot[bot]` user
3. Update type is patch or minor (not major)
4. Branch protection rules allow auto-merge

**Solution**:
- Review workflow runs in Actions tab
- Ensure required checks are configured correctly
- Verify repository settings allow auto-merge

### CodeQL Analysis Failing

**Check**:
1. Node.js version compatibility
2. Dependencies install successfully
3. Code compiles without errors

**Solution**:
- Review workflow logs in Actions tab
- Update Node.js version in workflow if needed
- Ensure dependencies are in sync across packages

### False Positive Security Alerts

**Process**:
1. Verify the alert is actually a false positive
2. Document why it's a false positive
3. Dismiss the alert in GitHub Security tab
4. Add reasoning for dismissal
5. Consider opening an issue with the security scanner

## Resources

### Official Documentation

- [Dependabot documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL documentation](https://codeql.github.com/docs/)
- [Dependency review](https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review)
- [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories)

### Internal Documentation

- [Security Policy](../SECURITY_POLICY.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [CI Setup](../.github/CI_SETUP.md)

### Security Resources

- [National Vulnerability Database](https://nvd.nist.gov/)
- [npm Security Advisories](https://www.npmjs.com/advisories)
- [Snyk Vulnerability Database](https://security.snyk.io/)

## Questions?

For questions about dependency management:
- Open a discussion in GitHub Discussions
- Contact the security team at security@subculture.io
- Review existing issues with the `dependencies` label
