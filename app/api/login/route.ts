import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabaseServer';
import { signSession, setSessionCookie } from '../../../lib/auth';
import { json } from '../../../lib/routeHelpers';

export async function POST(req: Request) {
  const { username, password, role } = await req.json();

  if (!username || !password || (role !== 'family' && role !== 'admin')) {
    return json({ ok:false, error:'Bad request' }, 400);
  }

  if (role === 'admin') {
    const au = process.env.ADMIN_USERNAME || 'admin';
    const ap = process.env.ADMIN_PASSWORD || 'AFAESPIGA';
    if (username !== au || password !== ap) return json({ ok:false, error:'Invalid admin credentials' }, 401);
    const session = { role: 'admin' as const, username };
    const token = signSession(session);
    return new Response(JSON.stringify({ ok:true, session }), {
      headers: { 'content-type':'application/json', 'set-cookie': setSessionCookie(token) }
    });
  }

  const sb = supabaseAdmin();
  const { data: fam, error } = await sb.from('families').select('*').eq('username', username).maybeSingle();
  if (error || !fam) return json({ ok:false, error:'Invalid credentials' }, 401);

  const stored = fam.password_hash || '';
  let ok = false;
  if (stored.startsWith('$2')) ok = await bcrypt.compare(password, stored);
  else ok = password === stored; // demo mode fallback

  if (!ok) return json({ ok:false, error:'Invalid credentials' }, 401);

  const session = { role: 'family' as const, username, family_id: fam.id };
  const token = signSession(session);

  // update last_seen
  await sb.from('families').update({ last_seen_at: new Date().toISOString() }).eq('id', fam.id);

  return new Response(JSON.stringify({ ok:true, session }), {
    headers: { 'content-type':'application/json', 'set-cookie': setSessionCookie(token) }
  });
}
