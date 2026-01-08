import { supabaseAdmin } from '../../../../lib/supabaseServer';
import { requireSession, json } from '../../../../lib/routeHelpers';

export async function GET(req: Request) {
  const s = requireSession(req, 'family');
  const sb = supabaseAdmin();

  const { data: kids } = await sb.from('students').select('id, first_name, last_name, course').eq('family_id', s.family_id!);
  const kidIds = (kids||[]).map((k:any)=>k.id);

  // groups for these kids
  const { data: sg } = await sb.from('student_groups').select('student_id, group_id').in('student_id', kidIds);
  const groupIds = Array.from(new Set((sg||[]).map((x:any)=>x.group_id)));

  // surveys for these groups or global
  const { data: sgs } = await sb.from('survey_groups').select('survey_id, group_id');
  const surveyIds = new Set<string>();
  (sgs||[]).forEach((x:any)=>{ if (groupIds.includes(x.group_id)) surveyIds.add(x.survey_id); });

  const { data: globalSurveys } = await sb.from('surveys').select('*').eq('is_global', true).order('created_at',{ascending:false}).limit(50);
  (globalSurveys||[]).forEach((sv:any)=>surveyIds.add(sv.id));

  const ids = Array.from(surveyIds);
  const surveys = ids.length ? (await sb.from('surveys').select('*').in('id', ids).order('created_at',{ascending:false}).limit(50)).data : (globalSurveys||[]);
  const { data: questions } = await sb.from('survey_questions').select('*').in('survey_id', ids);

  const qBySurvey: Record<string, any> = {};
  (questions||[]).forEach((q:any)=>{ if(!qBySurvey[q.survey_id]) qBySurvey[q.survey_id]=q; });

  // answers
  const { data: ans } = await sb.from('survey_answers').select('survey_id, student_id').eq('family_id', s.family_id!);

  const answeredSet = new Set((ans||[]).map((a:any)=>a.survey_id + ':' + a.student_id));

  const out: any[] = [];
  (surveys||[]).forEach((sv:any)=>{
    const q = qBySurvey[sv.id];
    if (!q) return;
    (kids||[]).forEach((k:any)=>{
      // show if any of kid's groups intersects survey groups, or survey global
      const kidGroupIds = (sg||[]).filter((x:any)=>x.student_id===k.id).map((x:any)=>x.group_id);
      const svGroupIds = (sgs||[]).filter((x:any)=>x.survey_id===sv.id).map((x:any)=>x.group_id);
      const targeted = sv.is_global || svGroupIds.some((gid:any)=>kidGroupIds.includes(gid));
      if (!targeted) return;
      out.push({
        survey_id: sv.id,
        title: sv.title,
        question_id: q.id,
        question_text: q.text,
        options: q.options,
        student_id: k.id,
        student_name: k.first_name + ' ' + k.last_name,
        student_course: k.course,
        already_answered: answeredSet.has(sv.id + ':' + k.id)
      });
    });
  });

  return json({ ok:true, surveys: out });
}
