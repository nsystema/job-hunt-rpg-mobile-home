#!/usr/bin/env node
'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const projectRoot = process.cwd();
const expoPackageJsonPath = path.join(projectRoot, 'node_modules', 'expo', 'package.json');
const expoCliPath = path.join(
  projectRoot,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'expo.cmd' : 'expo'
);

if (!fs.existsSync(expoPackageJsonPath)) {
  console.error(
    'Expo package not found. Install project dependencies with `npm install` before running this test.'
  );
  process.exit(1);
}

if (!fs.existsSync(expoCliPath)) {
  console.error(
    'Expo CLI binary is missing. Ensure the Expo CLI is available in node_modules/.bin by reinstalling dependencies.'
  );
  process.exit(1);
}

const readinessPatterns = [
  /Waiting on (?:https?:\/\/|exp:\/\/|ws:\/\/)/i,
  /Metro waiting on (?:https?:\/\/|exp:\/\/|ws:\/\/)/i,
  /Logs for your project will appear below/i,
];
const readyTimeoutMs = Number.parseInt(process.env.EXPO_START_TEST_TIMEOUT_MS || '120000', 10);
const maxAggregatedLength = 20000;
const canUseProcessGroup = process.platform !== 'win32';

async function tryListen(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once('error', (error) => {
      server.close(() => reject(error));
    });
    server.listen(port, () => {
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
        } else {
          resolve(actualPort);
        }
      });
    });
  });
}

async function findAvailablePort(preferredPort) {
  const preferredNumber = Number.parseInt(preferredPort, 10);
  if (Number.isInteger(preferredNumber) && preferredNumber > 0) {
    try {
      const actualPort = await tryListen(preferredNumber);
      return { port: actualPort, usedPreferred: true };
    } catch (error) {
      if (error.code !== 'EADDRINUSE') {
        throw error;
      }
      console.warn(`Port ${preferredNumber} is already in use. Selecting an available port automatically.`);
    }
  }

  const fallbackPort = await tryListen(0);
  return { port: fallbackPort, usedPreferred: false };
}

async function main() {
  const preferredPort = process.env.EXPO_START_TEST_PORT || '19010';
  let portInfo;
  try {
    portInfo = await findAvailablePort(preferredPort);
  } catch (error) {
    console.error('Unable to determine an available port for Expo CLI:', error);
    process.exit(1);
  }

  const testPort = String(portInfo.port);
  if (!portInfo.usedPreferred) {
    console.log(`Using fallback port ${testPort} for the Expo CLI readiness check.`);
  }

  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['--yes', 'expo', 'start', '--port', testPort];
  const env = {
    ...process.env,
    CI: '1',
    EXPO_OFFLINE: process.env.EXPO_OFFLINE || '1',
    EXPO_NO_TELEMETRY: '1',
  };

  console.log(`Starting Expo CLI readiness check on port ${testPort}...`);

  const expoProcess = spawn(command, args, {
    cwd: projectRoot,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: canUseProcessGroup,
  });

  let ready = false;
  let stopReason = null;
  let aggregatedOutput = '';
  const outputChunks = [];
  let gracefulStopTimer = null;
  let sigintTimer = null;
  let forceKillTimer = null;

  function appendOutput(source, data) {
    const text = data.toString();
    process.stdout.write(`[expo ${source}] ${text}`);
    outputChunks.push(`[${source}] ${text}`);
    if (outputChunks.length > 500) {
      outputChunks.shift();
    }
    aggregatedOutput = (aggregatedOutput + text).slice(-maxAggregatedLength);

    if (!ready) {
      const patternMatched = readinessPatterns.some((pattern) => pattern.test(aggregatedOutput));
      if (patternMatched) {
        ready = true;
        console.log('Expo CLI reported readiness.');
        scheduleGracefulStop();
      }
    }
  }

  function scheduleGracefulStop() {
    if (gracefulStopTimer) {
      return;
    }
    gracefulStopTimer = setTimeout(() => {
      stopExpoProcess('success');
    }, 1500);
  }

  function sendSignal(signal) {
    if (expoProcess.exitCode !== null) {
      return;
    }

    try {
      if (canUseProcessGroup && expoProcess.pid) {
        process.kill(-expoProcess.pid, signal);
      } else {
        expoProcess.kill(signal);
      }
    } catch (error) {
      if (error.code !== 'ESRCH') {
        console.warn(`Failed to send ${signal} to the Expo CLI process:`, error);
      }
    }
  }

  function stopExpoProcess(reason) {
    if (stopReason) {
      return;
    }
    stopReason = reason;

    if (expoProcess.exitCode !== null) {
      return;
    }

    if (expoProcess.stdin && !expoProcess.stdin.destroyed) {
      try {
        expoProcess.stdin.write('q');
        expoProcess.stdin.write('\n');
        expoProcess.stdin.end();
      } catch (error) {
        // Ignore stdin errors.
      }
    }

    if (!sigintTimer) {
      sigintTimer = setTimeout(() => {
        if (expoProcess.exitCode === null) {
          sendSignal('SIGINT');
        }
      }, 2000);
    }

    if (!forceKillTimer) {
      forceKillTimer = setTimeout(() => {
        if (expoProcess.exitCode === null) {
          console.warn('Expo CLI did not exit after SIGINT, sending SIGKILL.');
          sendSignal('SIGKILL');
        }
      }, 30000);
    }
  }

  const readyTimeout = setTimeout(() => {
    if (!ready) {
      console.error(`Timed out after ${readyTimeoutMs}ms waiting for the Expo CLI to become ready.`);
      stopExpoProcess('timeout');
    }
  }, readyTimeoutMs);

  expoProcess.stdout.on('data', (data) => appendOutput('stdout', data));
  expoProcess.stderr.on('data', (data) => appendOutput('stderr', data));

  expoProcess.on('error', (error) => {
    clearTimeout(readyTimeout);
    if (gracefulStopTimer) {
      clearTimeout(gracefulStopTimer);
    }
    if (sigintTimer) {
      clearTimeout(sigintTimer);
    }
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }
    console.error('Failed to start Expo CLI:', error);
    process.exit(1);
  });

  expoProcess.on('exit', (code, signal) => {
    clearTimeout(readyTimeout);
    if (gracefulStopTimer) {
      clearTimeout(gracefulStopTimer);
    }
    if (sigintTimer) {
      clearTimeout(sigintTimer);
    }
    if (forceKillTimer) {
      clearTimeout(forceKillTimer);
    }

    const combinedOutput = outputChunks.join('');
    const exitDescriptor = signal ? `signal ${signal}` : `exit code ${code}`;

    if (stopReason === 'success') {
      if (code === 0 || code === 130 || signal === 'SIGINT') {
        console.log('Expo CLI started successfully and shut down cleanly.');
        process.exit(0);
      }
      console.error(
        `Expo CLI exited with ${exitDescriptor} after reporting readiness. Output:\n${combinedOutput}`
      );
      process.exit(code || 1);
    }

    if (stopReason === 'timeout') {
      console.error(
        `Expo CLI did not become ready before the timeout and was terminated. Output:\n${combinedOutput}`
      );
      process.exit(1);
    }

    if (!ready) {
      console.error(
        `Expo CLI exited before reporting readiness (${exitDescriptor}). Output:\n${combinedOutput}`
      );
      process.exit(code || 1 || 1);
    }

    if (code === 0) {
      console.log('Expo CLI started and exited on its own with code 0.');
      process.exit(0);
    }

    console.error(
      `Expo CLI exited unexpectedly after reporting readiness (${exitDescriptor}). Output:\n${combinedOutput}`
    );
    process.exit(code || 1);
  });
}

main().catch((error) => {
  console.error('Expo CLI readiness check failed with an unexpected error:', error);
  process.exit(1);
});
