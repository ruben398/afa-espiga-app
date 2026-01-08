export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  requireSession(req, 'admin');

  const form = await req.formData();
  const postId = String(form.get('postId') || '');
  const file = form.get('file') as File | null;
  if (!postId || !file) return json({ ok:false, error:'Falten dades' }, 400);

  const max = 130 * 1024 * 1024;
  if (file.size > max) return json({ ok:false, error:'Fitxer massa gran (130MB màx)' }, 400);

  const sb = supabaseAdmin();

  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `posts/${postId}/${uuidv4()}.${ext}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error: upErr } = await sb.storage.from('adjunts').upload(path, bytes, {
    contentType: file.type || 'application/octet-stream',
    upsert: false
  });
  if (upErr) return json({ ok:false, error: upErr.message }, 500);

  const publicUrl = sb.storage.from('adjunts').getPublicUrl(path).data.publicUrl;

  const { error: dbErr } = await sb.from('post_attachments').insert({
    post_id: postId,
    filename: file.name,
    storage_path: path,
    public_url: publicUrl
  });
  if (dbErr) return json({ ok:false, error: dbErr.message }, 500);

  return json({ ok:true, publicUrl });
}
