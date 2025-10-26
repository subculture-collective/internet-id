#!/bin/bash

# Setup git-secrets for Internet-ID project
# Prevents committing secrets to the repository

set -e

echo "========================================="
echo "Git-Secrets Setup"
echo "========================================="
echo ""

# Check if git-secrets is installed
if ! command -v git-secrets &> /dev/null; then
    echo "git-secrets is not installed. Installing..."
    
    # Detect OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        echo "Installing git-secrets on Linux..."
        
        if command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            sudo apt-get update
            sudo apt-get install -y git-secrets
        elif command -v yum &> /dev/null; then
            # CentOS/RHEL
            sudo yum install -y git-secrets
        else
            # Manual installation
            echo "Installing from source..."
            cd /tmp
            git clone https://github.com/awslabs/git-secrets.git
            cd git-secrets
            sudo make install
            cd -
        fi
        
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        echo "Installing git-secrets on macOS..."
        
        if command -v brew &> /dev/null; then
            brew install git-secrets
        else
            echo "Homebrew not found. Installing from source..."
            cd /tmp
            git clone https://github.com/awslabs/git-secrets.git
            cd git-secrets
            sudo make install
            cd -
        fi
        
    else
        echo "Unsupported OS: $OSTYPE"
        echo "Please install git-secrets manually from: https://github.com/awslabs/git-secrets"
        exit 1
    fi
fi

# Verify installation
if command -v git-secrets &> /dev/null; then
    echo "✓ git-secrets is installed"
    git-secrets --version || echo "git-secrets is installed"
else
    echo "✗ Failed to install git-secrets"
    exit 1
fi

echo ""
echo "Configuring git-secrets for this repository..."

# Install git-secrets hooks in the repository
git secrets --install -f

echo "✓ Git hooks installed"

# Register AWS secret patterns
git secrets --register-aws

echo "✓ AWS patterns registered"

# Add custom patterns for Internet-ID
echo "Adding custom patterns..."

# Private keys (Ethereum/blockchain)
git secrets --add '0x[a-fA-F0-9]{64}'

# Generic API keys
git secrets --add '(api_key|apikey|api-key|API_KEY)\s*[:=]\s*["\047][a-zA-Z0-9_-]{20,}["\047]'

# Generic secrets
git secrets --add '(secret|SECRET)\s*[:=]\s*["\047][^"\047]{20,}["\047]'

# Database URLs with credentials
git secrets --add 'postgresql://[^:]+:[^@]+@'
git secrets --add 'mysql://[^:]+:[^@]+@'

# JWT/Auth secrets
git secrets --add '(jwt_secret|JWT_SECRET|NEXTAUTH_SECRET)\s*[:=]\s*["\047][^"\047]{20,}["\047]'

# IPFS provider credentials
git secrets --add '(IPFS_PROJECT_SECRET|PINATA_JWT|WEB3_STORAGE_TOKEN)\s*[:=]\s*["\047][^"\047]{10,}["\047]'

# GitHub tokens
git secrets --add 'ghp_[a-zA-Z0-9]{36}'
git secrets --add 'gho_[a-zA-Z0-9]{36}'

# Slack tokens
git secrets --add 'xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}'

# SendGrid
git secrets --add 'SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}'

# Stripe
git secrets --add 'sk_live_[a-zA-Z0-9]{24,}'

# SSH/TLS private keys
git secrets --add -- '-----BEGIN.*PRIVATE KEY-----'

echo "✓ Custom patterns added"

# Add allowed patterns (false positives)
echo "Adding allowed patterns..."

# Allow .env.example files
git secrets --add --allowed '\.env\.example'

# Allow documentation examples
git secrets --add --allowed 'example.com'
git secrets --add --allowed 'your_.*_here'
git secrets --add --allowed 'REPLACE_WITH'
git secrets --add --allowed 'placeholder'

# Allow test fixtures
git secrets --add --allowed 'test_secret'
git secrets --add --allowed 'test-secret'

echo "✓ Allowed patterns configured"

echo ""
echo "Testing git-secrets configuration..."

# Create a test file with a fake secret pattern
TEST_FILE="/tmp/test-secret-$$"
# Use obviously fake pattern for testing
echo "api_key=\"FAKE-KEY-FOR-TESTING-PURPOSES-ONLY-1234567890\"" > "$TEST_FILE"

# Test scanning
if git secrets --scan "$TEST_FILE" 2>&1 | grep -q "MATCHED"; then
    echo "✓ git-secrets is working correctly (detected test secret)"
    rm "$TEST_FILE"
else
    echo "⚠ git-secrets may not be configured correctly"
    rm "$TEST_FILE"
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Git-secrets is now configured for this repository."
echo ""
echo "Available commands:"
echo "  - git secrets --scan           # Scan staged files"
echo "  - git secrets --scan-history   # Scan entire git history"
echo "  - git secrets --list           # List registered patterns"
echo ""
echo "The pre-commit hook will automatically prevent commits with secrets."
echo ""
echo "To scan the entire repository history, run:"
echo "  git secrets --scan-history"
echo ""
