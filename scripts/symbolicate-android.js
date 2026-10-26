#!/usr/bin/env node

/**
 * Symbolicates Android Hermes / React Native production stack traces reported by Google Play Console.
 *
 * Usage:
 *   1. Pipe stack trace from Play Console:
 *      cat crash.txt | npm run symbolicate:android
 *   2. Pass stack trace file:
 *      npm run symbolicate:android crash.txt
 *   3. Custom source map and stack file:
 *      npm run symbolicate:android path/to/index.android.bundle.map crash.txt
 *   4. Direct line and column lookup:
 *      npm run symbolicate:android 1 123456
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const DEFAULT_MAP_CANDIDATES = [
  path.join(PROJECT_ROOT, 'android/app/build/generated/sourcemaps/react/release/index.android.bundle.map'),
  path.join(PROJECT_ROOT, 'android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.map'),
  path.join(PROJECT_ROOT, 'dist/bundles/android.map'),
  '/tmp/test-bundle.map',
];

const METRO_SYMBOLICATE_BIN = path.join(PROJECT_ROOT, 'node_modules/.bin/metro-symbolicate');

if (!fs.existsSync(METRO_SYMBOLICATE_BIN)) {
  console.error('[Error] metro-symbolicate binary not found in node_modules/.bin/metro-symbolicate.');
  console.error('Run `npm install` or `npx metro-symbolicate` directly.');
  process.exit(1);
}

let args = process.argv.slice(2);
let mapPath = null;
let inputData = null;

// Check if first arg is a custom map file
if (args[0] && args[0].endsWith('.map')) {
  mapPath = path.resolve(args[0]);
  args = args.slice(1);
} else {
  for (const candidate of DEFAULT_MAP_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      mapPath = candidate;
      break;
    }
  }
}

if (!mapPath || !fs.existsSync(mapPath)) {
  console.error('\n[Error] Release source map file not found.');
  console.error('Checked locations:');
  DEFAULT_MAP_CANDIDATES.forEach((c) => console.error(` - ${c}`));
  console.error('\nTo generate the Android release bundle source map, run:');
  console.error('  cd android && ./gradlew bundleRelease');
  console.error('Or generate it directly via Metro with:');
  console.error('  npx expo export:embed --platform android --dev false --entry-file index.js --bundle-output /tmp/test-bundle.js --sourcemap-output /tmp/test-bundle.map\n');
  process.exit(1);
}

console.log(`[Symbolicate] Using source map: ${mapPath}`);

// If line and column are passed as args (e.g. symbolicate 1 1234)
if (args.length >= 1 && /^\d+$/.test(args[0])) {
  const line = args[0];
  const col = args[1] || '0';
  const result = spawnSync(METRO_SYMBOLICATE_BIN, [mapPath, line, col], {
    stdio: 'inherit',
  });
  process.exit(result.status || 0);
}

// If a file was passed
if (args[0] && fs.existsSync(args[0])) {
  inputData = fs.readFileSync(args[0], 'utf-8');
} else if (args[0]) {
  // Direct string passed
  inputData = args.join(' ');
} else if (!process.stdin.isTTY) {
  // Piped input
  inputData = fs.readFileSync(0, 'utf-8');
}

if (!inputData) {
  console.log('\nPaste your Google Play Console crash stack trace below, then press Ctrl+D (EOF):\n');
  try {
    inputData = fs.readFileSync(0, 'utf-8');
  } catch (err) {
    console.error('No input received.');
    process.exit(1);
  }
}

if (!inputData || !inputData.trim()) {
  console.error('No stack trace provided to symbolicate.');
  process.exit(1);
}

// Determine if input is Hermes JSON minidump or standard text stack trace
let isJsonMinidump = false;
try {
  const parsed = JSON.parse(inputData.trim());
  if (typeof parsed === 'object' && parsed !== null) {
    isJsonMinidump = true;
  }
} catch {
  isJsonMinidump = false;
}

const symbolicateArgs = [mapPath];
if (isJsonMinidump) {
  symbolicateArgs.push('--hermes-crash');
}

const proc = spawnSync(METRO_SYMBOLICATE_BIN, symbolicateArgs, {
  input: inputData,
  encoding: 'utf-8',
});

if (proc.stdout) {
  console.log('\n--- Symbolicated Stack Trace ---\n');
  console.log(proc.stdout);
}
if (proc.stderr) {
  console.error(proc.stderr);
}

process.exit(proc.status || 0);
