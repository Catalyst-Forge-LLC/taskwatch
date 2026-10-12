import { createServer } from 'node:http';

const host = process.env.HOST ?? '127.0.0.1';
const port = Number(process.env.PORT ?? 5187);
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
