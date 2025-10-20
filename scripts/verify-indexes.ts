#!/usr/bin/env ts-node
/**
 * Database Index Verification Script
 * 
 * This script verifies that all indexes from the 20251020124623_add_database_indexes
 * migration have been created successfully.
 * 
 * Usage:
 *   ts-node scripts/verify-indexes.ts
 * 
 * Requirements:
 *   - DATABASE_URL environment variable must be set
 *   - Prisma client must be generated
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Expected indexes from the migration
const expectedIndexes = [
  'User_createdAt_idx',
  'Content_creatorId_idx',
  'Content_createdAt_idx',
  'Content_creatorAddress_idx',
  'PlatformBinding_contentId_idx',
  'PlatformBinding_platform_idx',
  'PlatformBinding_createdAt_idx',
  'Verification_contentHash_idx',
  'Verification_status_idx',
  'Verification_createdAt_idx',
  'Verification_contentId_idx',
  'Verification_contentHash_createdAt_idx',
  'Verification_status_createdAt_idx',
  'Account_userId_idx',
  'Account_userId_provider_idx',
  'Account_username_idx',
  'Session_userId_idx',
  'Session_expires_idx',
  // Unique constraint indexes (ending in _key)
  'User_address_key',
  'User_email_key',
  'Content_contentHash_key',
  'PlatformBinding_platform_platformId_key',
  'Account_provider_providerAccountId_key',
  'Session_sessionToken_key',
  'VerificationToken_token_key',
  'VerificationToken_identifier_token_key',
];

interface IndexInfo {
  indexname: string;
  tablename: string;
}

async function verifyIndexes() {
  console.log('🔍 Verifying database indexes...\n');

  try {
    // Query to get all indexes (both _idx and _key suffixes)
    const result = await prisma.$queryRaw<IndexInfo[]>`
      SELECT indexname, tablename
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND (indexname LIKE '%_idx' OR indexname LIKE '%_key')
      ORDER BY tablename, indexname;
    `;

    const foundIndexes = result.map(r => r.indexname);
    
    console.log('📋 Expected indexes:', expectedIndexes.length);
    console.log('✅ Found indexes:', foundIndexes.length);
    console.log('');

    // Check each expected index
    let allFound = true;
    for (const expectedIndex of expectedIndexes) {
      const found = foundIndexes.includes(expectedIndex);
      const status = found ? '✅' : '❌';
      console.log(`${status} ${expectedIndex}`);
      if (!found) allFound = false;
    }

    console.log('');

    // Check for unexpected indexes
    const unexpected = foundIndexes.filter(f => !expectedIndexes.includes(f));
    if (unexpected.length > 0) {
      console.log('⚠️  Unexpected indexes found:');
      unexpected.forEach(idx => console.log(`   - ${idx}`));
      console.log('');
    }

    // Summary
    if (allFound && unexpected.length === 0) {
      console.log('✅ SUCCESS: All indexes are correctly created!');
      process.exit(0);
    } else if (allFound) {
      console.log('⚠️  WARNING: All expected indexes found, but unexpected indexes exist.');
      process.exit(0);
    } else {
      console.log('❌ FAILURE: Some expected indexes are missing!');
      console.log('');
      console.log('To fix, run: npm run db:migrate');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error verifying indexes:', error);
    console.log('');
    console.log('Make sure:');
    console.log('1. DATABASE_URL is set correctly');
    console.log('2. Database is accessible');
    console.log('3. Migration has been applied: npm run db:migrate');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkIndexUsage() {
  console.log('\n📊 Index Usage Statistics:\n');

  try {
    interface IndexStats {
      tablename: string;
      indexname: string;
      idx_scan: bigint;
      idx_tup_read: bigint;
      size: string;
    }

    const stats = await prisma.$queryRaw<IndexStats[]>`
      SELECT 
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND (indexname LIKE '%_idx' OR indexname LIKE '%_key')
      ORDER BY idx_scan DESC;
    `;

    if (stats.length === 0) {
      console.log('No index statistics available yet.');
      console.log('Indexes will show usage after queries are executed.\n');
      return;
    }

    console.log('Table              Index                                Scans    Tuples    Size');
    console.log('━'.repeat(90));

    // Dynamically determine the maximum index name length for padding
    const maxIndexNameLength = Math.max(...stats.map(s => s.indexname.length), 37);
    for (const stat of stats) {
      const table = stat.tablename.padEnd(18);
      const index = stat.indexname.padEnd(maxIndexNameLength);
      const scans = String(stat.idx_scan).padStart(8);
      const tuples = String(stat.idx_tup_read).padStart(9);
      const size = String(stat.size).padStart(8);
      
      console.log(`${table} ${index} ${scans} ${tuples} ${size}`);
    }

    console.log('');
  } catch (error) {
    console.error('⚠️  Could not retrieve index usage statistics:', error);
  }
}

// Main execution
(async () => {
  await verifyIndexes();
  await checkIndexUsage();
})();
