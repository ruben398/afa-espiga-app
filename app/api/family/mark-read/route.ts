import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function POST(req: Request) {
  const s = requireSession(req, 'family');
  const { post_id } = await req.json();
  if (!post_id) return json({ ok:false, error:'Missing post_id' }, 400);

  const sb = supabaseAdmin();
  await sb.from('post_reads').upsert({ post_id, family_id: s.family_id || s.user_id || s.id }, { onConflict: 'post_id,family_id' });
  return json({ ok:true });
}
