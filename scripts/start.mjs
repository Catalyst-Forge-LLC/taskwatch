import { createServer } from 'node:http';
import { taskwatchPort } from './port.mjs';

const host = process.env.HOST ?? '127.0.0.1';
const port = process.env.PORT ? Number(process.env.PORT) : taskwatchPort();
// adapter-node assumes HTTPS by default. This local server uses HTTP, so supply
// its protocol explicitly and overwrite the header rather than trusting clients.
process.env.PROTOCOL_HEADER = 'x-taskwatch-protocol';
const { handler } = await import('../build/handler.js');
createServer((request, response) => {
  request.headers['x-taskwatch-protocol'] = 'http';
  handler(request, response);
}).listen(port, host, () => {
  console.log(`Taskwatch is running at http://${host}:${port}`);
});
