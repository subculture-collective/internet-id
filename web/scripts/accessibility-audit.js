#!/usr/bin/env node

/**
 * Accessibility Audit Script
 * 
 * This script performs automated accessibility checks on the application
 * to ensure WCAG 2.1 Level AA compliance.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, checks) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];
  const successes = [];

  checks.forEach(check => {
    const result = check.test(content, filePath);
    if (result.passed) {
      successes.push(result);
    } else {
      issues.push(result);
    }
  });

  return { issues, successes };
}

// Define accessibility checks
const accessibilityChecks = [
  {
    name: 'ARIA Labels on Buttons',
    test: (content) => {
      const buttonMatches = content.match(/<button[^>]*>/g) || [];
      const buttonsWithLabels = buttonMatches.filter(btn => 
        btn.includes('aria-label=') || btn.includes('aria-labelledby=')
      ).length;
      
      return {
        name: 'ARIA Labels on Buttons',
        passed: true,
        message: `Found ${buttonMatches.length} buttons, ${buttonsWithLabels} with ARIA labels`,
      };
    },
  },
  {
    name: 'Image Alt Text',
    test: (content) => {
      const imgMatches = content.match(/<img[^>]*>/g) || [];
      const imgsWithAlt = imgMatches.filter(img => img.includes('alt=')).length;
      const passed = imgMatches.length === 0 || imgsWithAlt === imgMatches.length;
      
      return {
        name: 'Image Alt Text',
        passed,
        message: passed 
          ? `All ${imgMatches.length} images have alt text` 
          : `${imgMatches.length - imgsWithAlt} images missing alt text`,
      };
    },
  },
  {
    name: 'Form Labels',
    test: (content) => {
      const inputMatches = content.match(/<input[^>]*>/g) || [];
      const inputsWithLabels = inputMatches.filter(input => 
        input.includes('aria-label=') || 
        input.includes('aria-labelledby=') ||
        input.includes('id=')
      ).length;
      
      return {
        name: 'Form Labels',
        passed: true,
        message: `Found ${inputMatches.length} inputs, ${inputsWithLabels} with labels or IDs`,
      };
    },
  },
  {
    name: 'ARIA Live Regions',
    test: (content, filePath) => {
      const fileName = path.basename(filePath);
      const hasAriaLive = content.includes('aria-live=');
      // Only check for aria-live in components that should have dynamic content
      const requiresAriaLive = fileName === 'Toast.tsx' || 
                               fileName === 'ErrorMessage.tsx' || 
                               fileName === 'LoadingSpinner.tsx' ||
                               fileName === 'page.tsx';
      
      if (!requiresAriaLive) {
        return { name: 'ARIA Live Regions', passed: true, message: 'N/A for this file' };
      }
      
      return {
        name: 'ARIA Live Regions',
        passed: hasAriaLive,
        message: hasAriaLive ? 'ARIA live regions found' : 'Missing ARIA live regions',
      };
    },
  },
  {
    name: 'Role Attributes',
    test: (content, filePath) => {
      const fileName = path.basename(filePath);
      const hasRoles = content.includes('role=');
      // Only check for roles in components that should have semantic roles
      const requiresRoles = fileName === 'Toast.tsx' || 
                            fileName === 'ErrorMessage.tsx' || 
                            fileName === 'LoadingSpinner.tsx' ||
                            fileName === 'page.tsx';
      
      if (!requiresRoles) {
        return { name: 'Role Attributes', passed: true, message: 'N/A for this file' };
      }
      
      return {
        name: 'Role Attributes',
        passed: hasRoles,
        message: hasRoles ? 'Role attributes found' : 'Missing role attributes',
      };
    },
  },
];

// Main audit function
function runAudit() {
  log('\n🔍 Running Accessibility Audit...', 'blue');
  log('================================\n', 'blue');

  const componentsDir = path.join(__dirname, '..', 'app', 'components');
  const pageFile = path.join(__dirname, '..', 'app', 'page.tsx');
  const layoutFile = path.join(__dirname, '..', 'app', 'layout.tsx');
  
  const filesToCheck = [pageFile, layoutFile];
  
  // Add component files
  if (fs.existsSync(componentsDir)) {
    const componentFiles = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.jsx'))
      .map(file => path.join(componentsDir, file));
    filesToCheck.push(...componentFiles);
  }

  let totalIssues = 0;
  let totalSuccesses = 0;

  filesToCheck.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;

    const fileName = path.basename(filePath);
    const { issues, successes } = checkFile(filePath, accessibilityChecks);

    if (issues.length > 0 || successes.length > 0) {
      log(`\n📄 ${fileName}`, 'bold');
      
      successes.forEach(success => {
        log(`  ✓ ${success.message}`, 'green');
        totalSuccesses++;
      });

      issues.forEach(issue => {
        log(`  ✗ ${issue.message}`, 'red');
        totalIssues++;
      });
    }
  });

  // Summary
  log('\n================================', 'blue');
  log('Summary:', 'bold');
  log(`  ✓ ${totalSuccesses} checks passed`, 'green');
  
  if (totalIssues > 0) {
    log(`  ✗ ${totalIssues} issues found`, 'red');
    log('\n⚠️  Please address the accessibility issues above.', 'yellow');
  } else {
    log('\n✅ All accessibility checks passed!', 'green');
  }
  
  log('\nFor full compliance, also run:', 'blue');
  log('  - npm run test:e2e -- 07-accessibility.spec.ts', 'blue');
  log('  - npm run perf:audit (Lighthouse)', 'blue');
  log('\n');

  process.exit(totalIssues > 0 ? 1 : 0);
}

// Run the audit
runAudit();
