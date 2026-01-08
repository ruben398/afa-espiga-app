import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function POST(req: Request) {
  requireSession(req, 'admin');
  const { id } = await req.json();
  if (!id) return json({ ok:false, error:'Bad request' }, 400);

  const sb = supabaseAdmin();
  const { data: reqRow, error } = await sb.from('signup_requests').select('*').eq('id', id).maybeSingle();
  if (error || !reqRow) return json({ ok:false, error:'Not found' }, 404);

  const p = reqRow.payload || {};
  const username = p.cognoms;

  const { data: existing } = await sb.from('families').select('id').eq('username', username).maybeSingle();
  if (existing) return json({ ok:false, error:'Ja existeix una família amb aquests cognoms (usuari).' }, 400);

  const { data: fam, error: e2 } = await sb.from('families').insert({
    username,
    password_hash: 'AFAESPIGA', // demo fallback, can be changed in settings
    email: p.correu || null,
    address: p.adreca || null,
    phone_father: p.tel_pare || null,
    phone_mother: p.tel_mare || null,
    name_father: p.nom_pare || null,
    name_mother: p.nom_mare || null,
    job_father: p.prof_pare || null,
    job_mother: p.prof_mare || null,
    iban: p.iban || null,
    allergies: p.allergies || null,
    acollida: p.acollida === 'Sí'
  }).select('*').single();

  if (e2) return json({ ok:false, error: e2.message }, 500);

  const alumnes = Array.isArray(p.alumnes) ? p.alumnes : [];
  const rows = alumnes.map((a:any)=>({
    family_id: fam.id,
    first_name: a.nom || '',
    last_name: username,
    course: a.curs || '',
    menjador: a.menjador === 'Sí',
    bus1: a.bus1 === 'Sí',
    bus2: a.bus2 === 'Sí',
    acollida: a.acollida === 'Sí',
    allergies: a.allergies || null
  }));
  if (rows.length) {
    const { error: e3 } = await sb.from('students').insert(rows);
    if (e3) return json({ ok:false, error: e3.message }, 500);
  }

  await sb.from('signup_requests').update({ status:'approved' }).eq('id', id);

  return json({ ok:true });
}
