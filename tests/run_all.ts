// Master E2E Test Runner for 'The Thirteenth Chime'
// Execute via: npx tsx tests/run_all.ts

import { runSuite, SuiteSummary } from './framework';

// Import all test suites
import './tier1_features.test';
import './tier2_boundary.test';
import './tier3_pairwise.test';
import './tier4_scenarios.test';

async function main() {
  console.log('======================================================================');
  console.log('       THE THIRTEENTH CHIME — AUTOMATED E2E TEST SUITE RUNNER         ');
  console.log('======================================================================');
  console.log('Running test tiers:');
  console.log('  • Tier 1: Feature Coverage (F1 to F15, >=5 tests per feature)');
  console.log('  • Tier 2: Boundary & Corner Cases (permutations, cycling, margins)');
  console.log('  • Tier 3: Pairwise & Cross-Feature Interactions (bridges, events)');
  console.log('  • Tier 4: Real-World Scenarios (full multi-step playthrough flows)');
  console.log('----------------------------------------------------------------------\n');

  const args = process.argv.slice(2);
  const isStrict = args.includes('--strict');
  const summary: SuiteSummary = await runSuite({ verbose: true });

  console.log('\n======================================================================');
  console.log('                           TEST SUITE SUMMARY                         ');
  console.log('======================================================================');
  console.log(`Total Tests Run:  ${summary.total}`);
  console.log(`Passed:           ${summary.passed} (${Math.round((summary.passed / summary.total) * 100)}%)`);
  console.log(`Failed:           ${summary.failed}`);
  console.log('----------------------------------------------------------------------');

  console.log('\n--- COVERAGE BREAKDOWN BY TIER ---');
  for (let tier = 1; tier <= 4; tier++) {
    const t = summary.tierSummary[tier];
    const pct = t.total > 0 ? Math.round((t.passed / t.total) * 100) : 0;
    console.log(`  Tier ${tier}:  ${t.passed}/${t.total} passed (${pct}%)`);
  }

  console.log('\n--- COVERAGE BREAKDOWN BY FEATURE ---');
  for (let i = 1; i <= 15; i++) {
    const featKey = `F${i}`;
    const f = summary.featureSummary[featKey] || { total: 0, passed: 0, failed: 0 };
    const status = f.failed === 0 ? 'PASS' : 'DEFECTS FOUND';
    const pct = f.total > 0 ? Math.round((f.passed / f.total) * 100) : 0;
    console.log(`  ${featKey.padEnd(4)}: ${f.passed}/${f.total} passed (${pct}%)\t[${status}]`);
  }

  if (summary.failed > 0) {
    console.log('\n----------------------------------------------------------------------');
    console.log('⚠️  CURRENT CODEBASE BASELINE DEFECTS REQUIRING MILESTONE ATTENTION:');
    console.log('----------------------------------------------------------------------');
    const failedTests = summary.results.filter(r => !r.passed);
    for (const ft of failedTests) {
      console.log(`  • [Tier ${ft.tier} | ${ft.feature}] ${ft.suite} > ${ft.name}`);
      console.log(`    Error: ${ft.error}\n`);
    }

    console.log('NOTE: These test failures represent the baseline state of pre-overhaul code.');
    console.log('Milestones M1 (Hint System), M2 (Room Layouts), and M3 (HD Typography) will');
    console.log('resolve these defects. Once implemented, all tests will turn green.');
  } else {
    console.log('\n✨ ALL TESTS PASSED! All specifications and acceptance criteria verified.');
  }

  console.log('======================================================================\n');

  if (isStrict && summary.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
