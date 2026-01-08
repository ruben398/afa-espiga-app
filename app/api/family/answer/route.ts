import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function POST(req: Request) {
  const s = requireSession(req, 'family');
  const { survey_id, student_id, answers } = await req.json();
  if (!survey_id || !student_id || !answers) return json({ ok:false, error:'Bad request' }, 400);

  const sb = supabaseAdmin();
  const entries = Object.entries(answers).map(([question_id, value])=>({
    survey_id, question_id, student_id, family_id: s.family_id!, answer: String(value)
  }));

  const { error } = await sb.from('survey_answers').insert(entries);
  if (error) return json({ ok:false, error: error.message }, 500);
  return json({ ok:true });
}
