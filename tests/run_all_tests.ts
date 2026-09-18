import { execSync } from 'node:child_process';
import path from 'node:path';

console.log('===========================================================');
console.log('🚀 RESCOM FULL TEST SUITE HARNESS');
console.log('===========================================================\n');

const tests = [
  'crypto_security.test.ts',
  'mesh_routing.test.ts',
  'heavy_load_stress_test.ts',
];

let allPassed = true;

for (const test of tests) {
  const testPath = path.resolve(__dirname, test);
  console.log(`\n▶️ Executing ${test}...`);
  try {
    execSync(`npx tsx "${testPath}"`, { stdio: 'inherit' });
  } catch {
    console.error(`❌ Suite ${test} failed!`);
    allPassed = false;
  }
}

console.log('\n===========================================================');
if (allPassed) {
  console.log('🎉 ALL TEST SUITES PASSED CLEANLY! DEPLOYMENT-READY.');
} else {
  console.error('⚠️ SOME TESTS FAILED. PLEASE CHECK LOGS.');
  process.exit(1);
}
console.log('===========================================================\n');
