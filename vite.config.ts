import adapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { taskwatchPort } from './scripts/port.mjs';

export default defineConfig(({ command }) => {
  const browser = process.env.TASKWATCH_STORAGE === 'browser';
  return {
    define: { __TASKWATCH_BROWSER__: JSON.stringify(browser) },
    plugins: [sveltekit({
      outDir: browser ? '.svelte-kit/browser' : '.svelte-kit/node',
      adapter: browser ? staticAdapter({ pages: 'build', assets: 'build', strict: true }) : adapter({ out: 'build-node' }),
      files: { routes: browser ? 'src/routes-browser' : 'src/routes' }
    })],
    server: { host: '127.0.0.1', port: command === 'serve' ? taskwatchPort() : 5211, strictPort: true }
  };
});
