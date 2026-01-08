import { clearSessionCookie } from '../../../lib/auth';
import { json } from '../../../lib/routeHelpers';

export async function POST() {
  return new Response(JSON.stringify({ ok:true }), {
    headers: { 'content-type':'application/json', 'set-cookie': clearSessionCookie() }
  });
}
