import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function GET(req: Request) {
  const s = requireSession(req, 'family');
  const sb = supabaseAdmin();

  // get student groups
  const { data: sg } = await sb.from('student_groups')
    .select('group_id, students!inner(family_id)')
    .eq('students.family_id', s.family_id!);

  const groupIds = Array.from(new Set((sg||[]).map((x:any)=>x.group_id)));

  // posts for these groups (or global posts with no group)
  const { data: pg } = await sb.from('post_groups').select('post_id, group_id');
  const postIds = new Set<string>();
  (pg||[]).forEach((x:any)=>{ if (groupIds.includes(x.group_id)) postIds.add(x.post_id); });

  const { data: globalPosts } = await sb.from('posts').select('*').eq('is_global', true).order('created_at',{ascending:false}).limit(30);
  (globalPosts||[]).forEach((p:any)=>postIds.add(p.id));

  const ids = Array.from(postIds);
  const posts = ids.length ? (await sb.from('posts').select('*').in('id', ids).order('created_at',{ascending:false}).limit(30)).data : (globalPosts||[]);
  const { data: atts } = await sb.from('post_attachments').select('*').in('post_id', ids);

  // determine "new" based on family last_seen_posts_at
  const { data: fam } = await sb.from('families').select('last_seen_posts_at').eq('id', s.family_id!).maybeSingle();
  const lastSeen = fam?.last_seen_posts_at ? new Date(fam.last_seen_posts_at).getTime() : 0;

  const byPost: Record<string, any[]> = {};
  (atts||[]).forEach((a:any)=>{ (byPost[a.post_id] ||= []).push(a); });

  const out = (posts||[]).map((p:any)=>({
    ...p,
    is_new: new Date(p.created_at).getTime() > lastSeen,
    attachments: byPost[p.id] || []
  }));

  // update last_seen_posts_at
  await sb.from('families').update({ last_seen_posts_at: new Date().toISOString() }).eq('id', s.family_id!);

  return json({ ok:true, posts: out });
}
