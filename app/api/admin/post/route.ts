import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function POST(req: Request) {
  requireSession(req, 'admin');
  const { title, body, group_ids } = await req.json();
  if (!title) return json({ ok:false, error:'Falta títol' }, 400);

  const sb = supabaseAdmin();
  const { data: post, error } = await sb.from('posts').insert({
    title, body: body || '', is_global: !group_ids?.length
  }).select('*').single();

  if (error) return json({ ok:false, error: error.message }, 500);

  if (group_ids?.length) {
    const rows = group_ids.map((gid:string)=>({ post_id: post.id, group_id: gid }));
    const { error: e2 } = await sb.from('post_groups').insert(rows);
    if (e2) return json({ ok:false, error: e2.message }, 500);
  }

  return json({ ok:true });
}
