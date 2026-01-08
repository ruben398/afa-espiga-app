import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function POST(req: Request) {
  requireSession(req, 'admin');
  const { title, question, options, group_ids } = await req.json();
  if (!title || !question) return json({ ok:false, error:'Falten dades' }, 400);

  const opts = String(options||'').split(';').map((s:string)=>s.trim()).filter(Boolean);
  if (opts.length < 2) return json({ ok:false, error:'Opcions insuficients' }, 400);

  const sb = supabaseAdmin();
  const { data: survey, error } = await sb.from('surveys').insert({
    title, is_global: !group_ids?.length
  }).select('*').single();
  if (error) return json({ ok:false, error: error.message }, 500);

  const { error: e2 } = await sb.from('survey_questions').insert({
    survey_id: survey.id, text: question, options: opts
  });
  if (e2) return json({ ok:false, error: e2.message }, 500);

  if (group_ids?.length) {
    const rows = group_ids.map((gid:string)=>({ survey_id: survey.id, group_id: gid }));
    const { error: e3 } = await sb.from('survey_groups').insert(rows);
    if (e3) return json({ ok:false, error: e3.message }, 500);
  }

  return json({ ok:true });
}
