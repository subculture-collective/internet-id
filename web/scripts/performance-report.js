#!/usr/bin/env node

/**
 * Generate a performance report from the Next.js build
 * Usage: node scripts/performance-report.js
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, '..', '.next');
const REPORT_FILE = path.join(__dirname, '..', 'performance-report.json');

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getDirectorySize(dir) {
  let size = 0;
  try {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  return size;
}

function countFiles(dir, extension) {
  let count = 0;
  try {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        count += countFiles(filePath, extension);
      } else if (!extension || file.endsWith(extension)) {
        count++;
      }
    });
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  return count;
}

function generateReport() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('Build directory not found. Run `npm run build` first.');
    process.exit(1);
  }

  const totalSize = getDirectorySize(BUILD_DIR);
  const jsCount = countFiles(BUILD_DIR, '.js');
  const cssCount = countFiles(BUILD_DIR, '.css');
  
  const staticDir = path.join(BUILD_DIR, 'static');
  const staticSize = fs.existsSync(staticDir) ? getDirectorySize(staticDir) : 0;

  const report = {
    timestamp: new Date().toISOString(),
    buildSize: {
      total: totalSize,
      totalFormatted: formatBytes(totalSize),
      static: staticSize,
      staticFormatted: formatBytes(staticSize),
    },
    fileCount: {
      javascript: jsCount,
      css: cssCount,
      total: jsCount + cssCount,
    },
    budgets: {
      javascript: {
        limit: 800 * 1024, // 800 KB (baseline 736 KB)
        current: staticSize,
        status: staticSize < 800 * 1024 ? 'PASS' : 'FAIL',
      },
      total: {
        limit: 12 * 1024 * 1024, // 12 MB (baseline 10.22 MB)
        current: totalSize,
        status: totalSize < 12 * 1024 * 1024 ? 'PASS' : 'FAIL',
      },
    },
  };

  // Write report to file
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n📊 Performance Report\n');
  console.log('Build Information:');
  console.log(`  Total size: ${report.buildSize.totalFormatted}`);
  console.log(`  Static size: ${report.buildSize.staticFormatted}`);
  console.log(`  JavaScript files: ${report.fileCount.javascript}`);
  console.log(`  CSS files: ${report.fileCount.css}`);
  console.log('\nBudget Status:');
  console.log(`  JavaScript: ${report.budgets.javascript.status} (${formatBytes(report.budgets.javascript.current)} / ${formatBytes(report.budgets.javascript.limit)})`);
  console.log(`  Total: ${report.budgets.total.status} (${formatBytes(report.budgets.total.current)} / ${formatBytes(report.budgets.total.limit)})`);
  console.log(`\nReport saved to: ${REPORT_FILE}\n`);

  // Exit with error if budgets failed
  if (report.budgets.javascript.status === 'FAIL' || report.budgets.total.status === 'FAIL') {
    console.error('❌ Performance budgets exceeded!');
    process.exit(1);
  } else {
    console.log('✅ All performance budgets passed!');
  }
}

generateReport();
