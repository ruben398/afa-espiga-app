import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function GET(req: Request) {
  const s = requireSession(req, 'family');
  const sb = supabaseAdmin();

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get('type') || 'news').toLowerCase();

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
  let posts = ids.length ? (await sb.from('posts').select('*').in('id', ids).order('created_at',{ascending:false}).limit(60)).data : (globalPosts||[]);
  // Filtre per tipus (news | alert | menu). Si la columna no existeix encara, es considerarà 'news'.
  posts = (posts || []).filter((p:any)=> ((p.type || 'news').toLowerCase() === type) && !p.archived);
  const { data: atts } = await sb.from('post_attachments').select('*').in('post_id', ids);

  // determine "new" based on family last_seen_posts_at
  const { data: fam } = await sb.from('families').select('last_seen_posts_at').eq('id', s.family_id!).maybeSingle();
  const lastSeen = fam?.last_seen_posts_at ? new Date(fam.last_seen_posts_at).getTime() : 0;

  const byPost: Record<string, any[]> = {};
  // Afegim signedUrl perquè les famílies puguin obrir adjunts encara que el bucket sigui privat.
  for (const a of (atts || [])) {
    let signed_url: string | null = null;
    if (a.storage_path) {
      const { data } = await sb.storage.from(a.bucket || 'adjunts').createSignedUrl(a.storage_path, 60 * 60 * 24);
      signed_url = data?.signedUrl || null;
    }
    (byPost[a.post_id] ||= []).push({ ...a, signed_url });
  }

  // Marcat "llegit" pels avisos
  let read = new Set<string>();
  if (type === 'alert' && (posts||[]).length) {
    const { data: reads } = await sb.from('post_reads')
      .select('post_id')
      .eq('family_id', s.family_id!)
      .in('post_id', (posts||[]).map((p:any)=>p.id));
    (reads||[]).forEach((r:any)=>read.add(r.post_id));
  }

  const out = (posts||[]).map((p:any)=>({
    ...p,
    is_new: new Date(p.created_at).getTime() > lastSeen,
    is_read: type === 'alert' ? read.has(p.id) : undefined,
    attachments: byPost[p.id] || []
  }));

  // update last_seen_posts_at
  await sb.from('families').update({ last_seen_posts_at: new Date().toISOString() }).eq('id', s.family_id!);

  return json({ ok:true, posts: out });
}
