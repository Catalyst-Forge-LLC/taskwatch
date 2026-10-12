import { execSync } from 'node:child_process';

// Read the named lease without loading LocalSlip's database into this app.
export function taskwatchPort() {
  try {
    const output = execSync('localslip get taskwatch', {
      encoding: 'utf8', timeout: 5000, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
    });
    const port = Number(output.trim());
    if (Number.isInteger(port) && port > 0 && port <= 65535) return port;
  } catch { /* Standalone use still works when LocalSlip is unavailable. */ }
  console.warn('Taskwatch: LocalSlip claim unavailable; using port 5211.');
  return 5211;
}
