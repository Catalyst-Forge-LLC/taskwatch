import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { taskwatchPort } from './scripts/port.mjs';

export default defineConfig(({ command }) => ({
  plugins: [sveltekit({ adapter: adapter() })],
  server: { host: '127.0.0.1', port: command === 'serve' ? taskwatchPort() : 5211, strictPort: true }
}));
