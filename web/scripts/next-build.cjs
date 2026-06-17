const fs = require('fs');
const { spawnSync } = require('child_process');

const cwd = process.cwd();
const canonicalCwd = fs.realpathSync.native(cwd);

if (canonicalCwd !== cwd) {
  process.chdir(canonicalCwd);
  console.log(`[build] Normalized cwd: ${canonicalCwd}`);
}

const nextBin = require.resolve('next/dist/bin/next');
const result = spawnSync(process.execPath, [nextBin, 'build'], {
  stdio: 'inherit',
  env: process.env,
  cwd: process.cwd(),
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
