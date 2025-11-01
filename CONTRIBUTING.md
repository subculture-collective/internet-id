# Contributing to Internet-ID

Thank you for your interest in contributing to Internet-ID! This document provides guidelines and standards for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style Guide](#code-style-guide)
- [Git Workflow](#git-workflow)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation Standards](#documentation-standards)
- [Community Guidelines](#community-guidelines)

## Getting Started

Before contributing, please:

1. **Read the documentation**:
   - [Contributor Onboarding Guide](./docs/CONTRIBUTOR_ONBOARDING.md) - Complete setup instructions
   - [Architecture Overview](./docs/ARCHITECTURE.md) - System design and component interactions
   - [Development Environment Setup Guide](./docs/DEVELOPMENT_SETUP.md) - Detailed setup and troubleshooting
   - [Debugging Guide](./docs/DEBUGGING.md) - How to debug backend, frontend, and contracts

2. **Set up your development environment**:
   ```bash
   # Clone and install
   git clone https://github.com/subculture-collective/internet-id.git
   cd internet-id
   npm install --legacy-peer-deps
   
   # Configure environment
   cp .env.example .env
   # Edit .env and set required variables
   
   # Set up database
   npm run db:generate
   npm run db:migrate
   
   # Compile contracts
   npm run build
   
   # Run tests to verify setup
   npm test
   ```

3. **Familiarize yourself with the codebase**:
   - Explore the smart contracts in `contracts/`
   - Review the API server code in `scripts/`
   - Check out the Next.js web app in `web/`
   - Look at existing tests in `test/`

## Code Style Guide

### General Principles

- **Write clean, readable code**: Prioritize clarity over cleverness
- **Follow existing patterns**: Match the style of surrounding code
- **Keep it simple**: Avoid unnecessary complexity
- **Document complex logic**: Add comments for non-obvious code

### TypeScript / JavaScript

We use **ESLint** and **Prettier** for code quality and formatting.

#### ESLint Rules

Configuration is in `.eslintrc.json` (root) and `web/.eslintrc.json` (Next.js):

- **No explicit `any`**: Use proper types or `unknown` (warning level)
- **No unused variables**: Variables starting with `_` are allowed
- **TypeScript strict mode**: Enforce type safety
- **Prettier integration**: Auto-format on fix

#### Prettier Rules

Configuration is in `.prettierrc.json`:

```json
{
  "semi": true,              // Always use semicolons
  "trailingComma": "es5",    // Trailing commas in ES5-compatible places
  "singleQuote": false,      // Use double quotes
  "printWidth": 100,         // Line length limit
  "tabWidth": 2,             // 2 spaces for indentation
  "useTabs": false,          // Spaces, not tabs
  "arrowParens": "always",   // Always parentheses around arrow function params
  "endOfLine": "lf"          // Unix-style line endings
}
```

#### Running Linters

```bash
# Lint everything
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format

# Check formatting without changes
npm run format:check
```

#### TypeScript Best Practices

- **Use strict type checking**: Enable `strict` mode in `tsconfig.json`
- **Avoid `any`**: Use specific types or `unknown` with type guards
- **Use interfaces for objects**: Prefer `interface` over `type` for object shapes
- **Export types explicitly**: Make type definitions reusable
- **Use const assertions**: For literal types and readonly tuples

Example:
```typescript
// Good
interface UserData {
  address: string;
  username: string;
}

async function fetchUser(id: string): Promise<UserData> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }
  return response.json();
}

// Avoid
async function fetchUser(id: any): Promise<any> {
  return fetch(`/api/users/${id}`).then((r) => r.json());
}
```

### Solidity

Smart contract development follows industry best practices:

#### Style

- **Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)**
- **Contract layout order**:
  1. License identifier
  2. Pragma statements
  3. Import statements
  4. Interfaces
  5. Libraries
  6. Contracts
- **Function order within contracts**:
  1. Constructor
  2. Receive/fallback functions
  3. External functions
  4. Public functions
  5. Internal functions
  6. Private functions
- **Use NatSpec comments**: Document all public/external functions

Example:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/**
 * @title ContentRegistry
 * @notice Manages content provenance anchors on-chain
 * @dev Uses access control for creator-only operations
 */
contract ContentRegistry {
    /// @notice Emitted when content is registered
    event ContentRegistered(
        bytes32 indexed contentHash,
        address indexed creator,
        string manifestUri,
        uint256 timestamp
    );
    
    /**
     * @notice Register new content on-chain
     * @param contentHash SHA-256 hash of the content
     * @param manifestUri IPFS URI to the manifest JSON
     */
    function register(bytes32 contentHash, string memory manifestUri) external {
        // Implementation...
    }
}
```

#### Security Best Practices

- **Use OpenZeppelin contracts**: For standard patterns (access control, upgrades)
- **Follow checks-effects-interactions**: Prevent reentrancy
- **Use Solidity 0.8+**: Built-in overflow/underflow protection
- **Validate inputs**: Check for zero addresses, empty strings, etc.
- **Emit events**: For all state changes
- **Use modifiers**: For access control and input validation
- **Test thoroughly**: Unit tests, integration tests, edge cases

### React / Next.js

#### Component Guidelines

- **Use functional components**: Prefer function components with hooks
- **Keep components small**: Single responsibility principle
- **Use TypeScript**: Type all props and state
- **Proper prop types**: Use `interface` for component props
- **Use Server Components**: When possible (Next.js App Router)

Example:
```typescript
// app/components/ContentCard.tsx
interface ContentCardProps {
  contentHash: string;
  manifestUri: string;
  creator: string;
  timestamp: number;
}

export default function ContentCard({
  contentHash,
  manifestUri,
  creator,
  timestamp,
}: ContentCardProps) {
  return (
    <div className="content-card">
      <h3>{contentHash.slice(0, 10)}...</h3>
      <p>Creator: {creator}</p>
      <time>{new Date(timestamp * 1000).toLocaleDateString()}</time>
    </div>
  );
}
```

#### Hooks Best Practices

- **Use built-in hooks**: Prefer `useState`, `useEffect`, `useMemo`, etc.
- **Custom hooks for logic**: Extract reusable logic into custom hooks
- **Follow rules of hooks**: Only call at top level, only in functions
- **Clean up effects**: Return cleanup function when needed

### Naming Conventions

- **Files**: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- **Functions**: `camelCase` for functions and methods
- **Classes**: `PascalCase` for classes and interfaces
- **Constants**: `UPPER_SNAKE_CASE` for constants
- **Private members**: Prefix with `_` (e.g., `_privateMethod`)
- **Contracts**: `PascalCase` (e.g., `ContentRegistry.sol`)

### Comments

- **Use JSDoc/TSDoc**: For public APIs and exported functions
- **Explain "why", not "what"**: Code should be self-documenting
- **Keep comments up-to-date**: Update comments when code changes
- **TODO comments**: Use for temporary workarounds (include issue number)

Example:
```typescript
/**
 * Verifies content against its manifest and on-chain entry
 * @param contentHash - SHA-256 hash of the content
 * @param manifestUri - IPFS URI to manifest JSON
 * @returns Verification result with status and details
 * @throws {ValidationError} If manifest is malformed
 */
async function verifyContent(
  contentHash: string,
  manifestUri: string
): Promise<VerificationResult> {
  // Fetch manifest from IPFS
  const manifest = await fetchManifest(manifestUri);
  
  // TODO(#123): Add support for multiple signature algorithms
  const isValid = await verifySignature(manifest);
  
  return { isValid, manifest };
}
```

## Git Workflow

### Branching Strategy

We follow a **feature branch workflow**:

1. **Main branch** (`main`):
   - Always deployable
   - Protected - requires PR reviews
   - CI must pass before merge

2. **Feature branches**:
   - Create from `main`
   - Name format: `feature/<description>` or `fix/<description>`
   - Examples:
     - `feature/add-tiktok-verification`
     - `fix/manifest-validation-bug`
     - `docs/update-api-reference`

3. **Branch naming conventions**:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `docs/` - Documentation updates
   - `refactor/` - Code refactoring
   - `test/` - Test additions/improvements
   - `chore/` - Maintenance tasks

### Creating a Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Push to your fork
git push -u origin feature/your-feature-name
```

### Commit Message Conventions

We follow **Conventional Commits** specification:

#### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature/bug change)
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependencies
- `perf`: Performance improvements
- `ci`: CI/CD changes

#### Scope (optional)

- `contract`: Smart contract changes
- `api`: API server changes
- `web`: Web UI changes
- `db`: Database schema changes
- `cli`: CLI tool changes
- `extension`: Browser extension changes

#### Examples

```bash
# Feature
feat(api): add TikTok platform verification endpoint

# Bug fix
fix(contract): prevent duplicate content registration

# Documentation
docs: update deployment guide with multi-chain instructions

# Breaking change
feat(api)!: change verification response format

BREAKING CHANGE: The /api/verify endpoint now returns
{ verified: boolean, details: {...} } instead of { valid: boolean }
```

#### Writing Good Commit Messages

- **Use imperative mood**: "Add feature" not "Added feature"
- **Keep subject under 72 characters**: Be concise
- **Capitalize first letter**: "Add" not "add"
- **No period at end**: Subject line doesn't need punctuation
- **Explain "why" in body**: What problem does this solve?

Example:
```
feat(web): add one-shot upload flow with privacy option

Previously, users had to manually upload content, create manifest,
and register on-chain in separate steps. This adds a single-page
flow that handles all steps, with an opt-in checkbox for uploading
content to IPFS (privacy-preserving by default).

Closes #45
```

### Keeping Your Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase on main
git rebase upstream/main

# Force push (only on your feature branch!)
git push --force-with-lease origin feature/your-feature-name
```

## Pull Request Process

### Before Submitting

**Checklist**:

- [ ] Code follows style guide (ESLint/Prettier passing)
- [ ] All tests pass locally (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated (if applicable)
- [ ] Commit messages follow conventions
- [ ] Branch is up-to-date with `main`
- [ ] No merge conflicts
- [ ] Security implications considered
- [ ] Environment variables documented (if added)

### Submitting a PR

1. **Push your branch to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open PR on GitHub**:
   - Go to the main repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template

3. **PR Title Format**:
   Follow commit message format: `<type>(<scope>): <description>`
   
   Examples:
   - `feat(api): add batch platform binding endpoint`
   - `fix(web): resolve authentication redirect loop`
   - `docs: add debugging guide for smart contracts`

4. **PR Description Template**:
   ```markdown
   ## Description
   Brief description of changes (what and why)
   
   ## Type of Change
   - [ ] Bug fix (non-breaking change that fixes an issue)
   - [ ] New feature (non-breaking change that adds functionality)
   - [ ] Breaking change (fix or feature that changes existing functionality)
   - [ ] Documentation update
   
   ## Related Issues
   Closes #<issue-number>
   Related to #<issue-number>
   
   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing completed
   
   ## Checklist
   - [ ] Code follows style guide
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings generated
   - [ ] Tests pass locally
   - [ ] Dependent changes merged
   
   ## Screenshots (if applicable)
   Add screenshots for UI changes
   
   ## Additional Notes
   Any additional context or notes for reviewers
   ```

### PR Review Process

#### For Contributors

1. **Respond to feedback promptly**: Within 48 hours if possible
2. **Ask questions**: If feedback is unclear, ask for clarification
3. **Make requested changes**: Push new commits to your branch
4. **Mark conversations as resolved**: After addressing feedback
5. **Request re-review**: Once all feedback addressed

#### For Reviewers

Review checklist:

- [ ] **Code quality**: Readable, maintainable, follows style guide
- [ ] **Correctness**: Logic is sound, edge cases handled
- [ ] **Tests**: Adequate test coverage, tests are meaningful
- [ ] **Security**: No vulnerabilities introduced
- [ ] **Performance**: No obvious performance issues
- [ ] **Documentation**: Code is documented, README updated if needed
- [ ] **Breaking changes**: Clearly documented and justified

**Review comments should be**:
- Constructive and respectful
- Specific and actionable
- Explain the reasoning
- Distinguish between must-fix and suggestions

**Examples**:

Good:
```
Consider using a more descriptive variable name here. 
`userAddress` instead of `addr` would make this clearer.
```

Better to avoid:
```
This code is bad.
```

#### Approval Requirements

- **Minimum 1 approval** from maintainers
- **All CI checks passing**
- **No unresolved conversations**
- **Up-to-date with main branch**

### Merging

Once approved:

1. **Squash and merge** (preferred for feature branches):
   - Combines all commits into one
   - Keeps main branch history clean
   - Maintainer will merge

2. **Rebase and merge** (for larger features):
   - Preserves individual commits
   - Used for well-structured commit history

3. **Delete branch** after merge:
   - GitHub can auto-delete
   - Or manually: `git push origin --delete feature/your-feature-name`

## Testing Requirements

### Test Levels

1. **Unit Tests**: Test individual functions/components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete user flows (web app)
4. **Contract Tests**: Test smart contract logic

### Running Tests

```bash
# All tests (contracts + API)
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Test coverage report
npm run test:coverage

# Web E2E tests
cd web && npm run test:e2e

# Watch mode (auto-rerun on changes)
npm run test -- --watch
```

### Writing Tests

#### Smart Contract Tests (Hardhat + Chai)

```typescript
// test/ContentRegistry.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("ContentRegistry", function () {
  it("should register content with valid hash and URI", async function () {
    const [creator] = await ethers.getSigners();
    const ContentRegistry = await ethers.getContractFactory("ContentRegistry");
    const registry = await ContentRegistry.deploy();
    
    const contentHash = ethers.keccak256(ethers.toUtf8Bytes("test content"));
    const manifestUri = "ipfs://QmTest123";
    
    await expect(registry.register(contentHash, manifestUri))
      .to.emit(registry, "ContentRegistered")
      .withArgs(contentHash, creator.address, manifestUri, expect.any(Number));
    
    const entry = await registry.entries(contentHash);
    expect(entry.creator).to.equal(creator.address);
    expect(entry.manifestUri).to.equal(manifestUri);
  });
  
  it("should revert when registering duplicate content", async function () {
    // Test implementation...
  });
});
```

#### API Tests (Supertest + Mocha)

```typescript
// test/api/verify.test.ts
import request from "supertest";
import { expect } from "chai";
import app from "../scripts/api";

describe("POST /api/verify", function () {
  it("should verify valid content", async function () {
    const response = await request(app)
      .post("/api/verify")
      .attach("file", "test/fixtures/sample.txt")
      .field("manifestUri", "ipfs://QmTest123")
      .expect(200);
    
    expect(response.body).to.have.property("verified", true);
    expect(response.body).to.have.property("details");
  });
  
  it("should return false for invalid content", async function () {
    // Test implementation...
  });
});
```

#### React Component Tests (Jest + Testing Library)

```typescript
// web/app/components/__tests__/ContentCard.test.tsx
import { render, screen } from "@testing-library/react";
import ContentCard from "../ContentCard";

describe("ContentCard", () => {
  it("renders content information correctly", () => {
    render(
      <ContentCard
        contentHash="0xabc123"
        manifestUri="ipfs://QmTest"
        creator="0x1234567890123456789012345678901234567890"
        timestamp={1234567890}
      />
    );
    
    expect(screen.getByText(/0xabc123/)).toBeInTheDocument();
    expect(screen.getByText(/Creator:/)).toBeInTheDocument();
  });
});
```

### Test Coverage Goals

- **Smart contracts**: >90% coverage (critical paths 100%)
- **API endpoints**: >80% coverage
- **Utility functions**: >80% coverage
- **React components**: >70% coverage

### Before Submitting PR

```bash
# Run full test suite
npm run test:coverage

# Check coverage report
# Open coverage/index.html in browser

# Ensure new code has adequate tests
# Coverage should not decrease
```

## Documentation Standards

### What to Document

1. **Code**: 
   - Public APIs and exported functions
   - Complex algorithms or logic
   - Non-obvious decisions

2. **Features**:
   - How to use new features
   - Configuration options
   - Examples

3. **Architecture**:
   - System design decisions
   - Component interactions
   - Data flow

4. **Operations**:
   - Deployment procedures
   - Troubleshooting guides
   - Monitoring and alerts

### Documentation Locations

- **Code comments**: In-line with code (JSDoc/NatSpec)
- **README files**: In each major directory
- **docs/ directory**: Comprehensive guides and references
- **API docs**: Generated from OpenAPI/Swagger specs
- **CHANGELOG**: Track all notable changes

### Writing Documentation

#### Guidelines

- **Be clear and concise**: Use simple language
- **Use examples**: Show, don't just tell
- **Keep it updated**: Update docs when code changes
- **Test your examples**: Ensure code samples work
- **Use proper markdown**: Headers, lists, code blocks

#### Example Structure

```markdown
# Feature Name

## Overview
Brief description of what this does and why it exists.

## Prerequisites
- Required tools or setup
- Dependencies

## Usage
Step-by-step instructions with examples.

## Configuration
List of options with descriptions.

## Troubleshooting
Common issues and solutions.

## Related Documentation
Links to related docs.
```

### Documenting New Features

When adding a new feature:

1. **Update relevant docs**:
   - Main README (if user-facing)
   - Architecture docs (if design change)
   - API docs (if new endpoints)

2. **Add examples**:
   - Code snippets showing usage
   - CLI commands if applicable

3. **Document configuration**:
   - New environment variables
   - Configuration options

4. **Update CHANGELOG**:
   - Add entry under "Unreleased"
   - Follow format: `- Added: New feature description (#PR-number)`

## Community Guidelines

### Code of Conduct

Be respectful, inclusive, and professional:

- **Be welcoming**: Friendly to newcomers
- **Be respectful**: Disagree constructively
- **Be collaborative**: Work together toward common goals
- **Be patient**: Everyone has different skill levels
- **Give credit**: Acknowledge others' contributions

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussion
- **Pull Requests**: Code review and technical discussion
- **Discord** (if applicable): Real-time chat

### Getting Help

- **Check documentation first**: README, docs/, and guides
- **Search existing issues**: Your question may be answered
- **Ask in discussions**: For general questions
- **Open an issue**: For bugs or feature requests

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:
1. Run command X
2. Do action Y
3. See error

**Expected behavior**
What should happen

**Actual behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 13.0]
- Node version: [e.g., 20.12.0]
- Package version: [e.g., 0.1.0]

**Additional context**
Any other relevant information
```

### Suggesting Features

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Description of the problem or use case

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Other approaches you've thought about

**Additional context**
Any other relevant information, mockups, examples
```

## Recognition

Contributors are recognized in:

- **CHANGELOG**: Notable contributions
- **README**: Core contributors
- **GitHub**: Contributor graph

Thank you for contributing to Internet-ID! 🎉

## Additional Resources

- [Contributor Onboarding Guide](./docs/CONTRIBUTOR_ONBOARDING.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Development Setup Guide](./docs/DEVELOPMENT_SETUP.md)
- [Debugging Guide](./docs/DEBUGGING.md)
- [Environment Variables Reference](./docs/ENVIRONMENT_VARIABLES.md)
- [Security Policy](./SECURITY_POLICY.md)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).
