import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function POST(req: Request) {
  requireSession(req, 'admin');
  const { title, body, group_ids, type, expires_at, pinned } = await req.json();
  if (!title) return json({ ok:false, error:'Falta títol' }, 400);

  const sb = supabaseAdmin();
  let inserted = await sb.from('posts').insert({
    title,
    body: body || '',
    type: (type || 'news'),
    pinned: !!pinned,
    expires_at: expires_at || null,
    archived: false,
    is_global: !group_ids?.length
  }).select('*').single();

  // Si encara no has aplicat la migració de columnes (type, pinned, etc.),
  // Supabase retornarà error de columna inexistent. Reintentem amb l'esquema antic.
  if (inserted.error && /column .* does not exist/i.test(inserted.error.message)) {
    inserted = await sb.from('posts').insert({ title, body: body || '' }).select('*').single();
  }
  const { data: post, error } = inserted;
  if (error) return json({ ok:false, error: error.message }, 500);

  if (group_ids?.length) {
    const rows = group_ids.map((gid:string)=>({ post_id: post.id, group_id: gid }));
    const { error: e2 } = await sb.from('post_groups').insert(rows);
    if (e2) return json({ ok:false, error: e2.message }, 500);
  }

  return json({ ok:true });
}
