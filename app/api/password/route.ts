import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../../../lib/supabaseServer';
import { requireSession, json } from '../../../lib/routeHelpers';

export async function POST(req: Request) {
  const s = requireSession(req); // family or admin
  const { newPassword } = await req.json();
  if (!newPassword || String(newPassword).length < 4) return json({ ok:false, error:'Bad password' }, 400);

  if (s.role === 'admin') {
    // demo: admin password is env-based
    return json({ ok:false, error:'Admin password is configured in Vercel env vars in this demo.' }, 400);
  }

  const sb = supabaseAdmin();
  const hash = await bcrypt.hash(newPassword, 10);
  const { error } = await sb.from('families').update({ password_hash: hash }).eq('id', s.family_id!);
  if (error) return json({ ok:false, error: error.message }, 500);
  return json({ ok:true });
}
