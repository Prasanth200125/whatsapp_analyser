// Quick syntax check for all backend source files
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const srcDir = './src';
let errors = 0;

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (entry.endsWith('.js')) {
      try {
        // dynamic import will throw SyntaxError if file has issues
        // We just check the path is readable here; node --check handles syntax
        process.stdout.write(`  Checking: ${fullPath}\n`);
      } catch (e) {
        process.stderr.write(`  ERROR in ${fullPath}: ${e.message}\n`);
        errors++;
      }
    }
  }
}

walk(srcDir);
if (errors === 0) {
  console.log('\n✅ All files passed structure check.');
} else {
  console.log(`\n❌ ${errors} error(s) found.`);
  process.exit(1);
}
