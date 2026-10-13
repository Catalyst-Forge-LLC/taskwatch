import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const [storage, ...args] = process.argv.slice(2);
if (!['browser', 'file'].includes(storage)) throw new Error('Expected browser or file storage.');
const result = spawnSync(process.execPath, [resolve('node_modules/vite/bin/vite.js'), ...args], {
  env: { ...process.env, TASKWATCH_STORAGE: storage }, stdio: 'inherit', windowsHide: true
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
