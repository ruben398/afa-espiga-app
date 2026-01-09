import { supabaseAdmin } from '../../../lib/supabaseServer';
import { json } from '../../../lib/routeHelpers';
import { requireSession } from '../../../lib/auth';

// Retorna un signed URL per a un fitxer de Storage.
// Serveix perquè les famílies puguin descarregar/visualitzar adjunts encara
// que el bucket NO sigui públic.

export async function GET(req: Request) {
  const session = requireSession(req);
  if (!session) return json({ ok:false, error:'Unauthorized' }, 401);

  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  const bucket = searchParams.get('bucket') || 'adjunts';
  if (!path) return json({ ok:false, error:'Bad request' }, 400);

  const sb = supabaseAdmin();
  const { data, error } = await sb.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24); // 24h
  if (error || !data?.signedUrl) return json({ ok:false, error: error?.message || 'Cannot sign url' }, 500);

  return json({ ok:true, url: data.signedUrl });
}
