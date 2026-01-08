import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function GET(req: Request) {
  const s = requireSession(req, 'family');
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('students').select('*').eq('family_id', s.family_id!).order('course');
  if (error) return json({ ok:false, error: error.message }, 500);
  return json({ ok:true, students: data || [] });
}
