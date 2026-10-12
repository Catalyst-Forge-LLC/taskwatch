import { json } from '@sveltejs/kit';
import { store, StoreError } from '#lib/server/store.ts';
import type { RequestHandler } from './$types';

const headers = { 'cache-control': 'no-store' };

export const GET: RequestHandler = async ({ url }) => {
  try {
    const state = await store.read();
    if (url.searchParams.has('download')) {
      return new Response(JSON.stringify(state, null, 2) + '\n', { headers: {
        ...headers, 'content-type': 'application/json', 'content-disposition': 'attachment; filename="taskwatch.json"'
      } });
    }
    return json({ state, serverNow: Date.now() }, { headers });
  } catch (error) {
    console.error('Taskwatch read failed:', error);
    return json({ message: 'Could not read the JSON file. Check the server terminal; your file has been left untouched.' }, { status: 500, headers });
  }
};

export const POST: RequestHandler = async ({ request, url }) => {
  // JSON endpoints need an explicit same-origin check, in addition to Kit's form protection.
  if (request.headers.get('origin') !== url.origin) {
    console.warn('Taskwatch origin mismatch', { origin: request.headers.get('origin'), expected: url.origin });
    return json({ message: 'Same-origin requests only.' }, { status: 403 });
  }
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ message: 'JSON required.' }, { status: 415 });
  let input;
  try { input = await request.json(); }
  catch { return json({ message: 'Invalid JSON.' }, { status: 400 }); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ message: 'Invalid request.' }, { status: 400 });
  try {
    return json({ state: await store.mutate(input), serverNow: Date.now() }, { headers });
  } catch (error) {
    if (error instanceof StoreError) return json({ message: error.message }, { status: error.status, headers });
    console.error('Taskwatch save failed:', error);
    return json({ message: 'Could not save the JSON file. Check the server terminal and try again.' }, { status: 500, headers });
  }
};
