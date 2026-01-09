import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabaseServer';
import { signSession, setSessionCookie } from '../../../lib/auth';
import { json } from '../../../lib/routeHelpers';
import { normalizeUsername } from '../../../lib/normalize';

export async function POST(req: Request) {
  const { username, password, role } = await req.json();

  // Normalitzem (MAJÚSCULES, sense accents) perquè sigui consistent.
  const userNorm = normalizeUsername(String(username || ''));

  if (!username || !password || (role !== 'family' && role !== 'admin')) {
    return json({ ok:false, error:'Bad request' }, 400);
  }

  if (role === 'admin') {
    const au = process.env.ADMIN_USERNAME || 'admin';
    const ap = process.env.ADMIN_PASSWORD || 'AFAESPIGA';
    if (userNorm !== normalizeUsername(au) || password !== ap) {
      return json({ ok:false, error:'Invalid admin credentials' }, 401);
    }
    const session = { role: 'admin' as const, username: userNorm };
    const token = signSession(session);
    return new Response(JSON.stringify({ ok:true, session }), {
      headers: { 'content-type':'application/json', 'set-cookie': setSessionCookie(token) }
    });
  }

  const sb = supabaseAdmin();
  // Acceptem usuari en qualsevol combinació (accents/majúscules) i el normalitzem.
  // A la BD recomanem guardar-lo ja normalitzat (majúscules sense accents),
  // però aquí ho fem tolerant per a evitar "Invalid credentials".
  const uNorm = normalizeUsername(String(username));
  // 1) Prova directa amb nom normalitzat
  let { data: fam, error } = await sb.from('families').select('*').eq('username', uNorm).maybeSingle();
  // 2) Fallback: prova tal com s'ha escrit (per quan encara no s'ha normalitzat la BD)
  if (!fam) {
    ({ data: fam, error } = await sb.from('families').select('*').eq('username', String(username).trim()).maybeSingle());
  }
  // 3) Fallback: cerca case-insensitive (accents no es poden "treure" aquí)
  if (!fam) {
    ({ data: fam, error } = await sb.from('families').select('*').ilike('username', String(username).trim()).maybeSingle());
  }
  if (error || !fam) return json({ ok:false, error:'Invalid credentials' }, 401);

  const stored = fam.password_hash || '';
  let ok = false;
  if (stored.startsWith('$2')) ok = await bcrypt.compare(password, stored);
  else ok = password === stored; // demo mode fallback

  if (!ok) return json({ ok:false, error:'Invalid credentials' }, 401);

  const session = { role: 'family' as const, username: fam.username, family_id: fam.id };
  const token = signSession(session);

  // update last_seen
  await sb.from('families').update({ last_seen_at: new Date().toISOString() }).eq('id', fam.id);

  return new Response(JSON.stringify({ ok:true, session }), {
    headers: { 'content-type':'application/json', 'set-cookie': setSessionCookie(token) }
  });
}
