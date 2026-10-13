import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function inspect(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, item.name);
    if (item.isDirectory()) {
      if (['api', 'data', 'server', 'node_modules'].includes(item.name)) throw new Error(`Private directory in public build: ${file}`);
      await inspect(file);
    } else if (/\.(js|html|json)$/.test(item.name)) {
      const contents = await readFile(file, 'utf8');
      if (/\/api\/watch|TASKWATCH_DATA_FILE|node:fs|data\/taskwatch\.json/.test(contents)) throw new Error(`Server storage reference in public build: ${file}`);
    }
  }
}
await inspect('build');
console.log('Public build verified: no API, local data, or Node storage references.');
