#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, createWriteStream } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import process from 'node:process';

const usage = [
  'Usage: node scripts/package-android-sdk.mjs [--profile <profile>] [--output <path>]',
  '',
  'Options:',
  '  --profile <name>   EAS build profile to use (default: development)',
  '  --output <path>    Where to save the downloaded APK (default: dist/job-hunt-rpg-mobile-<profile>.apk)',
  '  --help             Show this message',
].join('\n');

const args = process.argv.slice(2);
let profile = 'development';
let outputPath;

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];

  if (arg === '--help' || arg === '-h') {
    console.log(usage);
    process.exit(0);
  }

  if (arg === '--profile') {
    const value = args[i + 1];
    if (!value) {
      console.error('Missing value for --profile option.');
      console.log(usage);
      process.exit(1);
    }
    profile = value;
    i += 1;
    continue;
  }

  if (arg.startsWith('--profile=')) {
    profile = arg.split('=')[1] ?? '';
    if (!profile) {
      console.error('Missing value for --profile option.');
      process.exit(1);
    }
    continue;
  }

  if (arg === '--output') {
    const value = args[i + 1];
    if (!value) {
      console.error('Missing value for --output option.');
      console.log(usage);
      process.exit(1);
    }
    outputPath = value;
    i += 1;
    continue;
  }

  if (arg.startsWith('--output=')) {
    outputPath = arg.split('=')[1] ?? '';
    if (!outputPath) {
      console.error('Missing value for --output option.');
      process.exit(1);
    }
    continue;
  }

  console.error(`Unknown argument: ${arg}`);
  console.log(usage);
  process.exit(1);
}

const defaultFileName = `job-hunt-rpg-mobile-${profile}.apk`;
const resolvedOutputPath = resolve(process.cwd(), outputPath ?? join('dist', defaultFileName));
const outputDir = dirname(resolvedOutputPath);
mkdirSync(outputDir, { recursive: true });

const easArgs = [
  'eas',
  'build',
  '--platform',
  'android',
  '--profile',
  profile,
  '--non-interactive',
  '--wait',
  '--json',
];

console.log('🚀 Starting Expo EAS build (this may take a few minutes)...');
const result = spawnSync('npx', easArgs, {
  stdio: ['inherit', 'pipe', 'inherit'],
  encoding: 'utf8',
});

if (result.error) {
  console.error('Failed to run npx eas build:', result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  if (result.stdout) {
    console.error(result.stdout);
  }
  console.error('EAS build command failed. Ensure you are logged in with "npx eas login" and that your project is configured.');
  process.exit(result.status ?? 1);
}

const rawOutput = result.stdout.trim();
if (!rawOutput) {
  console.error('No build information returned from EAS.');
  console.error('Double-check your Expo account credentials with "npx eas whoami".');
  process.exit(1);
}

let builds;
try {
  builds = JSON.parse(rawOutput);
} catch (error) {
  console.error('Could not parse build output as JSON. Received:');
  console.error(rawOutput);
  console.error('Original error:', error.message);
  process.exit(1);
}

const build = Array.isArray(builds) ? builds[0] : builds;
const artifactUrl = build?.artifacts?.buildUrl;

if (!artifactUrl) {
  console.error('The build completed but no artifact URL was returned.');
  console.error('Full build response:', JSON.stringify(build, null, 2));
  process.exit(1);
}

console.log(`📦 Build finished. Downloading artifact from ${artifactUrl}`);

const downloadArtifact = async () => {
  const response = await fetch(artifactUrl);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download artifact (status ${response.status}).`);
  }

  const fileStream = createWriteStream(resolvedOutputPath);
  await pipeline(Readable.fromWeb(response.body), fileStream);
};

try {
  await downloadArtifact();
  console.log(`✅ Android package saved to ${resolvedOutputPath}`);
  console.log('Transfer the APK to your Android device to install and test the app.');
} catch (error) {
  console.error('Failed to download the Android package:', error.message);
  process.exit(1);
}
