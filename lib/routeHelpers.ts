import { getSessionFromRequest, type Session } from './auth';

export function requireSession(req: Request, role?: Session['role']): Session {
  const s = getSessionFromRequest(req);
  if (!s) throw new Response(JSON.stringify({ ok:false, error:'No session' }), { status: 401 });
  if (role && s.role !== role) throw new Response(JSON.stringify({ ok:false, error:'Forbidden' }), { status: 403 });
  return s;
}

export function json(data: any, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
}
