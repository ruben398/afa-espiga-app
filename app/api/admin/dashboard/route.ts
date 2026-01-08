import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function GET(req: Request) {
  requireSession(req, 'admin');
  const sb = supabaseAdmin();

  const { data: groups } = await sb.from('groups').select('*').order('name');
  const { data: requests } = await sb.from('signup_requests').select('id, cognoms, correu, tel_pare, tel_mare, created_at, status').eq('status','pending').order('created_at',{ascending:false});
  const { data: posts } = await sb.from('posts').select('*').order('created_at',{ascending:false}).limit(30);
  const { data: pg } = await sb.from('post_groups').select('post_id, groups(name), group_id');
  const { data: atts } = await sb.from('post_attachments').select('*');
  const byPost: Record<string, any[]> = {};
  (atts||[]).forEach((a:any)=>{ (byPost[a.post_id] ||= []).push(a); });

  const postGroups: Record<string, string[]> = {};
  (pg||[]).forEach((x:any)=>{ (postGroups[x.post_id] ||= []).push(x.groups?.name || ''); });

  const postsOut = (posts||[]).map((p:any)=>({ ...p, groups: postGroups[p.id] || (p.is_global?['(Global)']:[]), attachments: byPost[p.id] || [] }));

  // surveys summary
  const { data: surveys } = await sb.from('surveys').select('*').order('created_at',{ascending:false}).limit(30);
  const { data: sq } = await sb.from('survey_questions').select('*');
  const { data: sg } = await sb.from('survey_groups').select('survey_id, groups(name)');
  const { data: ans } = await sb.from('survey_answers').select('survey_id');

  const qBy: Record<string, any> = {};
  (sq||[]).forEach((q:any)=>{ if(!qBy[q.survey_id]) qBy[q.survey_id]=q; });

  const gBy: Record<string, string[]> = {};
  (sg||[]).forEach((x:any)=>{ (gBy[x.survey_id] ||= []).push(x.groups?.name || ''); });

  const aCount: Record<string, number> = {};
  (ans||[]).forEach((a:any)=>{ aCount[a.survey_id] = (aCount[a.survey_id]||0)+1; });

  const surveysOut = (surveys||[]).map((s:any)=>({
    id: s.id,
    title: s.title,
    question_text: qBy[s.id]?.text || '',
    groups: gBy[s.id] || (s.is_global?['(Global)']:[]),
    answer_count: aCount[s.id] || 0
  }));

  return json({ ok:true, groups: groups||[], requests: requests||[], posts: postsOut, surveys: surveysOut });
}
