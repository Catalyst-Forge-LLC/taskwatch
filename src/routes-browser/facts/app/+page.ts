import { redirect } from '@sveltejs/kit';
import { appFactsUrl } from '#lib/facts.ts';
export function load() { redirect(307, appFactsUrl, { external: ['https://appfacts.dev'] }); }
