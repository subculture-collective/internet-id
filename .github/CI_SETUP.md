# CI Workflow Setup Guide

This document provides instructions for configuring GitHub branch protection rules to make the CI workflow required.

## Overview

The CI workflow (`.github/workflows/ci.yml`) includes two jobs:
- `backend` - Lints, builds contracts, and runs tests for the backend
- `web` - Lints and builds the Next.js web application

## Configuring Required Status Checks

To prevent merging code that fails CI checks, configure branch protection rules:

### Steps

1. Navigate to the repository on GitHub
2. Go to **Settings** > **Branches**
3. Click **Add branch protection rule** (or edit existing rule for `main`)
4. Configure the following:

   **Branch name pattern:** `main`
   
   **Protect matching branches:**
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
     - Search for and add these status checks:
       - `Backend (Lint, Build, Test)`
       - `Web (Lint, TypeScript)`
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings (recommended)

5. Click **Save changes**

### What This Does

Once configured:
- Pull requests cannot be merged until both CI jobs pass
- Contributors must update their branches if main has new commits
- Code quality standards are enforced automatically

## Testing the Workflow

The workflow will run automatically on:
- Every push to `main` branch
- Every pull request targeting `main` branch

You can also manually trigger the workflow from the Actions tab if needed.

## Troubleshooting

If status checks don't appear in the branch protection settings:
1. Ensure the workflow has run at least once (create a test PR or push to main)
2. Wait a few minutes for GitHub to register the status checks
3. Refresh the branch protection settings page

## Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Required Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches#require-status-checks-before-merging)
