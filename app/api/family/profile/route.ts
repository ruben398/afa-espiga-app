import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function GET(req: Request) {
  const s = requireSession(req, 'family');
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('families').select('*').eq('id', s.family_id!).maybeSingle();
  if (error) return json({ ok:false, error: error.message }, 500);
  return json({ ok:true, family: data });
}

export async function POST(req: Request) {
  const s = requireSession(req, 'family');
  const payload = await req.json();
  const sb = supabaseAdmin();
  const allowed = {
    address: payload.address ?? null,
    email: payload.email ?? null,
    phone_father: payload.phone_father ?? null,
    phone_mother: payload.phone_mother ?? null,
    name_father: payload.name_father ?? null,
    name_mother: payload.name_mother ?? null,
    job_father: payload.job_father ?? null,
    job_mother: payload.job_mother ?? null,
    iban: payload.iban ?? null,
    allergies: payload.allergies ?? null,
    acollida: !!payload.acollida
  };
  const { error } = await sb.from('families').update(allowed).eq('id', s.family_id!);
  if (error) return json({ ok:false, error: error.message }, 500);
  return json({ ok:true });
}
