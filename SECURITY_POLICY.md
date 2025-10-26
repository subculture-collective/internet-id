# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Model

### Smart Contract Security

The ContentRegistry smart contract has been analyzed using automated security tools and follows Solidity best practices. Key security features:

- ✅ No external calls (no reentrancy risk)
- ✅ Access control via `onlyCreator` modifier
- ✅ Integer overflow protection (Solidity 0.8+)
- ✅ Event emission for all state changes
- ✅ Gas-optimized operations
- ✅ No funds held in contract

For details, see: [Smart Contract Audit Report](docs/SMART_CONTRACT_AUDIT.md)

### API Security

The API implements comprehensive security measures:

- ✅ Input validation using Zod schemas
- ✅ XSS prevention with HTML entity escaping
- ✅ SQL injection protection via Prisma ORM
- ✅ Command injection prevention
- ✅ Path traversal protection
- ✅ File upload security with size limits and type restrictions
- ✅ Rate limiting (when configured with Redis)

For details, see: 
- [Input Validation Documentation](docs/VALIDATION.md)
- [Security Implementation Summary](SECURITY_IMPLEMENTATION_SUMMARY.md)

## Reporting a Vulnerability

We take security vulnerabilities seriously and appreciate responsible disclosure from the security community.

### What to Report

Please report any security issues including:

**Smart Contract Issues:**
- Authorization bypasses
- Unexpected state changes
- Gas griefing attacks
- Front-running vulnerabilities
- Any behavior that violates contract invariants

**API/Backend Issues:**
- Authentication/authorization bypasses
- Injection attacks (XSS, SQL, command)
- Path traversal vulnerabilities
- Denial of service vectors
- Information disclosure
- Cryptographic weaknesses

**General Security Issues:**
- Dependency vulnerabilities (with exploit potential)
- Configuration weaknesses
- Infrastructure security issues

### How to Report

#### Preferred Method: Private Disclosure

**Email**: security@subculture.io

Please include:
1. **Description**: Clear explanation of the vulnerability
2. **Impact**: Potential security impact and affected components
3. **Reproduction Steps**: Detailed steps to reproduce the issue
4. **Proof of Concept**: Code or commands demonstrating the issue (if applicable)
5. **Suggested Fix**: Your recommendation for fixing (optional but appreciated)
6. **Your Contact Info**: For follow-up questions and coordination

#### Alternative: GitHub Security Advisory

For GitHub-hosted security issues, you can use:
https://github.com/subculture-collective/internet-id/security/advisories/new

### What NOT to Do

Please **DO NOT**:
- ❌ Open a public GitHub issue for security vulnerabilities
- ❌ Disclose the vulnerability publicly before it's fixed
- ❌ Test vulnerabilities on mainnet or production systems
- ❌ Access, modify, or delete data belonging to others
- ❌ Perform denial of service attacks
- ❌ Use social engineering against project team or users

### Response Timeline

We are committed to addressing security issues promptly:

1. **Acknowledgment**: Within 48 hours of report
2. **Initial Assessment**: Within 5 business days
3. **Status Updates**: Every 7 days during investigation/fix
4. **Fix Timeline**: 
   - Critical: 7 days
   - High: 14 days
   - Medium: 30 days
   - Low: 60 days
5. **Public Disclosure**: 90 days after fix is deployed (or sooner by mutual agreement)

### Coordinated Disclosure

We follow coordinated disclosure principles:

- We will work with you to understand and validate the issue
- We will develop and test fixes privately
- We will credit you in our security advisory (unless you prefer anonymity)
- We will coordinate public disclosure timing with you
- We aim for 90-day disclosure deadline after fix deployment

## Bug Bounty Program

### Status: Planning Phase

We are planning to establish a bug bounty program with the following structure:

### Proposed Reward Structure

| Severity | Smart Contract | API/Backend | Example |
|----------|---------------|-------------|---------|
| **Critical** | $10,000 - $50,000 | $5,000 - $15,000 | Contract takeover, fund theft, complete auth bypass |
| **High** | $5,000 - $10,000 | $2,000 - $5,000 | Unauthorized state changes, privilege escalation |
| **Medium** | $1,000 - $5,000 | $500 - $2,000 | Denial of service, rate limit bypass |
| **Low** | $100 - $1,000 | $50 - $500 | Information disclosure, minor logic errors |

**Note**: These are proposed ranges. Final structure will be announced when program launches.

### Eligibility

To be eligible for rewards:
- ✅ Report must be original (not previously reported)
- ✅ Vulnerability must be reproducible
- ✅ Vulnerability must be in scope
- ✅ You must follow responsible disclosure
- ✅ You must not exploit the vulnerability beyond PoC
- ✅ You must not access/modify other users' data

### Out of Scope

The following are **NOT** eligible for rewards:

**General:**
- Issues in third-party dependencies without proof of exploitability
- Issues requiring physical access
- Social engineering attacks
- Issues in systems not owned/controlled by us

**Smart Contracts:**
- Known issues from audit reports
- Gas optimization recommendations
- Issues in test contracts or testnets

**API/Backend:**
- Rate limiting issues (when rate limiting not configured)
- Missing security headers (without demonstrated impact)
- Self-XSS or issues requiring user cooperation
- Issues in development/staging environments

**Other:**
- Spam or social engineering
- Physical attacks
- Attacks requiring MITM or compromised client

### Scope

**In Scope:**
- ContentRegistry.sol on mainnet (once deployed)
- API endpoints (production instance)
- Web UI (production instance)
- Database security

**Out of Scope:**
- Third-party services (IPFS providers, RPC endpoints)
- Test networks and development environments
- Documentation and examples

### Program Launch

We will announce the official bug bounty program launch on:
- Project README
- Project website
- Security mailing list
- Immunefi or HackerOne platform (TBD)

**Estimated Launch**: Q1 2026 (after mainnet deployment)

## Security Best Practices for Users

### For Content Creators

1. **Private Key Security**
   - Never share your private key
   - Use hardware wallets for significant value
   - Keep backups in secure locations
   - Consider multi-sig for high-value operations

2. **Content Security**
   - Keep master files in secure backup
   - Use strong hashes (SHA-256)
   - Verify uploads against original files
   - Monitor your registered content

3. **Platform Bindings**
   - Only bind content you control
   - Verify platform ownership
   - Keep records of bindings
   - Monitor for unauthorized bindings

### For Developers

1. **API Key Security**
   - Keep API keys in environment variables
   - Never commit keys to version control
   - Rotate keys periodically
   - Use different keys for dev/prod

2. **Input Validation**
   - Trust but verify all API responses
   - Validate contract data before use
   - Sanitize user inputs
   - Follow OWASP guidelines

3. **Contract Interactions**
   - Verify contract addresses
   - Check contract source code
   - Test transactions on testnet first
   - Monitor gas prices

## Security Monitoring

### What We Monitor

- Smart contract events and state changes
- API error rates and unusual patterns
- Failed authentication attempts
- Rate limit violations
- Database performance and integrity

### Incident Response

In case of security incident:

1. **Detection**: Automated monitoring and user reports
2. **Assessment**: Evaluate severity and impact
3. **Containment**: Implement immediate protective measures
4. **Eradication**: Fix root cause
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-incident analysis and improvements

## Security Updates

### How We Communicate Security Issues

Security updates will be announced via:
- GitHub Security Advisories
- Project README (for critical issues)
- Release notes
- Security mailing list (when established)

### Subscribing to Security Updates

To receive security notifications:
1. Watch this repository on GitHub
2. Subscribe to Security Advisories
3. Follow project social media
4. Join security mailing list (coming soon)

## Vulnerability Disclosure History

### Disclosed Vulnerabilities

None to date.

**Last Updated**: October 26, 2025

We will maintain a public log of disclosed vulnerabilities here after they are fixed and disclosed.

## Security Audits

### Completed Audits

**Automated Analysis**
- **Date**: October 26, 2025
- **Tool**: Slither v0.11.3
- **Status**: ✅ Passed
- **Report**: [docs/SMART_CONTRACT_AUDIT.md](docs/SMART_CONTRACT_AUDIT.md)
- **Findings**: 0 critical, 0 high, 1 medium (false positive), 4 low (accepted by design)

### Planned Audits

**Professional Audit** (Planned)
- **Timeline**: Before mainnet launch
- **Scope**: ContentRegistry.sol, deployment scripts, critical integrations
- **Estimated Cost**: $15k - $30k
- **Firms Under Consideration**: OpenZeppelin, Trail of Bits, Consensys Diligence

## Security Resources

### Documentation

- [Smart Contract Audit Report](docs/SMART_CONTRACT_AUDIT.md)
- [Input Validation Guide](docs/VALIDATION.md)
- [API Security Summary](SECURITY_IMPLEMENTATION_SUMMARY.md)
- [Rate Limiting Configuration](docs/RATE_LIMITING.md)

### External Resources

- [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Solidity Security Considerations](https://docs.soliditylang.org/en/latest/security-considerations.html)

## Contact

For security-related questions or concerns:

- **Security Issues**: security@subculture.io (or GitHub Security Advisory)
- **General Questions**: Open a GitHub discussion
- **Project Chat**: [To be announced]

## Acknowledgments

We would like to thank the following individuals and organizations for responsibly disclosing security issues:

*No disclosures yet. Your name could be here!*

---

**This security policy is subject to change. Last updated: October 26, 2025**
