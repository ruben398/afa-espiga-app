import { supabaseAdmin } from '../../../lib/supabaseServer';
import { json } from '../../../lib/routeHelpers';

export async function POST(req: Request) {
  const payload = await req.json();
  if (!payload?.cognoms) return json({ ok:false, error:'Falten cognoms' }, 400);

  const sb = supabaseAdmin();
  const { error } = await sb.from('signup_requests').insert({
    cognoms: payload.cognoms,
    correu: payload.correu || null,
    tel_pare: payload.tel_pare || null,
    tel_mare: payload.tel_mare || null,
    payload,
    status: 'pending'
  });
  if (error) return json({ ok:false, error: error.message }, 500);
  return json({ ok:true });
}
