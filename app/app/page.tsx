'use client';

import { useEffect, useMemo, useState } from 'react';
import { STRINGS, type Lang } from '../../lib/i18n';

type Session = { role: 'admin'|'family', username: string, family_id?: string } | null;

function readLang(): Lang {
  const v = (typeof window !== 'undefined' && localStorage.getItem('lang')) || 'ca';
  return v === 'es' ? 'es' : 'ca';
}

function Chip({active, children, onClick}:{active:boolean, children:any, onClick:()=>void}) {
  return <button className={'chip'+(active?' active':'')} onClick={onClick}>{children}</button>;
}

function useApi(path:string, deps:any[] = []) {
  const [data,setData]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let live=true;
    setLoading(true);
    fetch(path).then(r=>r.json()).then(j=>{ if(live){ setData(j); setLoading(false);} });
    return ()=>{ live=false; };
  }, deps);
  return {data, loading};
}

export default function AppPage() {
  const [lang, setLang] = useState<Lang>('ca');
  const [session, setSession] = useState<Session>(null);
  const [tab, setTab] = useState<'login'|'signup'|'news'|'alerts'|'menu'|'surveys'|'children'|'family'|'settings'|'admin'>('login');
  const [err, setErr] = useState('');

  useEffect(()=>{ setLang(readLang()); }, []);
  useEffect(()=>{
    fetch('/api/session').then(r=>r.json()).then(j=>{
      setSession(j.session);
      if (j.session?.role==='admin') setTab('admin');
      else if (j.session?.role==='family') setTab('news');
      else setTab('login');
    });
  }, []);

  const S = useMemo(()=>STRINGS[lang],[lang]);

  async function login(username:string, password:string, role:'family'|'admin') {
    setErr('');
    const res = await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username,password,role})});
    const j = await res.json();
    if(!j.ok){ setErr(j.error || S.invalidLogin); return; }
    setSession(j.session);
    setTab(j.session.role==='admin'?'admin':'news');
  }

  async function logout() {
    await fetch('/api/logout',{method:'POST'});
    setSession(null);
    setTab('login');
  }

  return (
    <div className="container">
      <div className="topbar">
        <div className="brand">
          <div className="logo">A</div>
          <div>
            <div style={{fontWeight:900}}>AFA Espiga</div>
            <div className="sub">{S.demoNote}</div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'flex-end'}}>
          <button className="btn secondary" onClick={()=>{
            const next = lang==='ca'?'es':'ca';
            localStorage.setItem('lang', next);
            setLang(next);
          }}>{lang==='ca'?S.spanish:S.catalan}</button>
          {session ? <button className="btn ghost" onClick={logout}>{S.logout}</button> : null}
        </div>
      </div>

      {/* Nav */}
      {session?.role==='family' ? (
        <div className="nav" style={{marginTop:12}}>
          <Chip active={tab==='news'} onClick={()=>setTab('news')}>{S.news}</Chip>
          <Chip active={tab==='alerts'} onClick={()=>setTab('alerts')}>{S.alerts}</Chip>
          <Chip active={tab==='menu'} onClick={()=>setTab('menu')}>{S.menu}</Chip>
          <Chip active={tab==='surveys'} onClick={()=>setTab('surveys')}>{S.surveys}</Chip>
          <Chip active={tab==='children'} onClick={()=>setTab('children')}>{S.children}</Chip>
          <Chip active={tab==='family'} onClick={()=>setTab('family')}>{S.familyData}</Chip>
          <Chip active={tab==='settings'} onClick={()=>setTab('settings')}>{S.settings}</Chip>
        </div>
      ) : null}

      {session?.role==='admin' ? (
        <div className="nav" style={{marginTop:12}}>
          <Chip active={tab==='admin'} onClick={()=>setTab('admin')}>{S.adminPanel}</Chip>
          <Chip active={tab==='settings'} onClick={()=>setTab('settings')}>{S.settings}</Chip>
        </div>
      ) : null}

      <div style={{marginTop:12}}>
        {!session && tab==='login' ? <Login S={S} err={err} onLogin={login} onSignup={()=>setTab('signup')} /> : null}
        {!session && tab==='signup' ? <Signup S={S} onBack={()=>setTab('login')} /> : null}

        {session?.role==='family' && tab==='news' ? <News S={S} /> : null}
        {session?.role==='family' && tab==='alerts' ? <Alerts S={S} /> : null}
        {session?.role==='family' && tab==='menu' ? <Menu S={S} /> : null}
        {session?.role==='family' && tab==='surveys' ? <Surveys S={S} /> : null}
        {session?.role==='family' && tab==='children' ? <Children S={S} /> : null}
        {session?.role==='family' && tab==='family' ? <Family S={S} /> : null}
        {session && tab==='settings' ? <Settings S={S} session={session} /> : null}
        {session?.role==='admin' && tab==='admin' ? <Admin S={S} /> : null}
      </div>
    </div>
  );
}

function Login({S, err, onLogin, onSignup}:{S:any, err:string, onLogin:(u:string,p:string,r:any)=>void, onSignup:()=>void}) {
  const [u,setU]=useState(''); const [p,setP]=useState('');
  const [au,setAu]=useState('admin'); const [ap,setAp]=useState('');
  return (
    <div className="grid cols2">
      <div className="card">
        <div className="h1">{S.loginTitle} (Famílies)</div>
        <p className="p">Usuari: cognoms · Contrasenya inicial: <b>AFAESPIGA</b></p>
        <div style={{marginTop:12}}>
          <label>{S.username}</label>
          <input value={u} onChange={e=>setU(e.target.value)} placeholder="Ex: Pérez García"/>
        </div>
        <div style={{marginTop:10}}>
          <label>{S.password}</label>
          <input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="AFAESPIGA"/>
        </div>
        <div style={{marginTop:12, display:'flex',gap:10,flexWrap:'wrap'}}>
          <button className="btn" onClick={()=>onLogin(u,p,'family')}>{S.login}</button>
          <button className="btn secondary" onClick={onSignup}>{S.requestSignup}</button>
        </div>
        {err ? <div className="err" style={{marginTop:10}}>{err}</div> : null}
      </div>

      <div className="card">
        <div className="h1">{S.loginTitle} (Admin)</div>
        <p className="p">Accés només per a l’administració (tu).</p>
        <div style={{marginTop:12}}>
          <label>{S.username}</label>
          <input value={au} onChange={e=>setAu(e.target.value)}/>
        </div>
        <div style={{marginTop:10}}>
          <label>{S.password}</label>
          <input type="password" value={ap} onChange={e=>setAp(e.target.value)} placeholder="AFAESPIGA"/>
        </div>
        <div style={{marginTop:12}}>
          <button className="btn" onClick={()=>onLogin(au,ap,'admin')}>{S.login}</button>
        </div>
      </div>
    </div>
  );
}

function Signup({S,onBack}:{S:any,onBack:()=>void}) {
  const [ok,setOk]=useState(''); const [err,setErr]=useState('');
  const [form,setForm]=useState<any>({
    cognoms:'', correu:'', adreca:'', tel_pare:'', tel_mare:'',
    nom_pare:'', nom_mare:'', prof_pare:'', prof_mare:'',
    iban:'', allergies:'', acollida:'No',
    alumnes:[{nom:'', curs:'', menjador:'No', bus1:'No', bus2:'No', acollida:'No', allergies:''}]
  });

  async function submit(){
    setOk(''); setErr('');
    const res=await fetch('/api/signup-request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});
    const j=await res.json();
    if(!j.ok){setErr(j.error||'Error');return;}
    setOk('Enviat ✓');
  }

  return (
    <div className="card">
      <div className="row">
        <div>
          <div className="h1">{S.requestSignup}</div>
          <p className="p">{S.requestSignupDesc}</p>
        </div>
        <button className="btn secondary" onClick={onBack}>←</button>
      </div>

      <div className="grid cols2" style={{marginTop:12}}>
        <div><label>Cognoms (usuari)</label><input value={form.cognoms} onChange={e=>setForm({...form,cognoms:e.target.value})}/></div>
        <div><label>Correu electrònic</label><input value={form.correu} onChange={e=>setForm({...form,correu:e.target.value})}/></div>
        <div style={{gridColumn:'1 / -1'}}><label>Adreça</label><input value={form.adreca} onChange={e=>setForm({...form,adreca:e.target.value})}/></div>

        <div><label>Telèfon pare</label><input value={form.tel_pare} onChange={e=>setForm({...form,tel_pare:e.target.value})}/></div>
        <div><label>Telèfon mare</label><input value={form.tel_mare} onChange={e=>setForm({...form,tel_mare:e.target.value})}/></div>

        <div><label>Nom pare</label><input value={form.nom_pare} onChange={e=>setForm({...form,nom_pare:e.target.value})}/></div>
        <div><label>Nom mare</label><input value={form.nom_mare} onChange={e=>setForm({...form,nom_mare:e.target.value})}/></div>

        <div><label>Professió pare</label><input value={form.prof_pare} onChange={e=>setForm({...form,prof_pare:e.target.value})}/></div>
        <div><label>Professió mare</label><input value={form.prof_mare} onChange={e=>setForm({...form,prof_mare:e.target.value})}/></div>

        <div style={{gridColumn:'1 / -1'}}><label>IBAN</label><input value={form.iban} onChange={e=>setForm({...form,iban:e.target.value})}/></div>
        <div style={{gridColumn:'1 / -1'}}><label>Al·lèrgies</label><input value={form.allergies} onChange={e=>setForm({...form,allergies:e.target.value})}/></div>
        <div><label>Acollida (família)</label>
          <select value={form.acollida} onChange={e=>setForm({...form,acollida:e.target.value})}><option>No</option><option>Sí</option></select>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        <div className="h1" style={{fontSize:16}}>Alumnes</div>
        {form.alumnes.map((a:any, idx:number)=>(
          <div key={idx} className="grid cols2" style={{marginTop:10}}>
            <div><label>Nom alumne</label><input value={a.nom} onChange={e=>{
              const alumnes=[...form.alumnes]; alumnes[idx]={...a, nom:e.target.value}; setForm({...form, alumnes});
            }}/></div>
            <div><label>Curs / Classe</label><input value={a.curs} onChange={e=>{
              const alumnes=[...form.alumnes]; alumnes[idx]={...a, curs:e.target.value}; setForm({...form, alumnes});
            }}/></div>
            <div><label>Menjador</label><select value={a.menjador} onChange={e=>{const alumnes=[...form.alumnes]; alumnes[idx]={...a, menjador:e.target.value}; setForm({...form, alumnes});}}><option>No</option><option>Sí</option></select></div>
            <div><label>Bus 1</label><select value={a.bus1} onChange={e=>{const alumnes=[...form.alumnes]; alumnes[idx]={...a, bus1:e.target.value}; setForm({...form, alumnes});}}><option>No</option><option>Sí</option></select></div>
            <div><label>Bus 2</label><select value={a.bus2} onChange={e=>{const alumnes=[...form.alumnes]; alumnes[idx]={...a, bus2:e.target.value}; setForm({...form, alumnes});}}><option>No</option><option>Sí</option></select></div>
            <div><label>Acollida</label><select value={a.acollida} onChange={e=>{const alumnes=[...form.alumnes]; alumnes[idx]={...a, acollida:e.target.value}; setForm({...form, alumnes});}}><option>No</option><option>Sí</option></select></div>
            <div style={{gridColumn:'1 / -1'}}><label>Al·lèrgies (alumne)</label><input value={a.allergies} onChange={e=>{const alumnes=[...form.alumnes]; alumnes[idx]={...a, allergies:e.target.value}; setForm({...form, alumnes});}}/></div>
          </div>
        ))}
        <div style={{marginTop:10}}>
          <button className="btn secondary" onClick={()=>setForm({...form, alumnes:[...form.alumnes,{nom:'',curs:'',menjador:'No',bus1:'No',bus2:'No',acollida:'No',allergies:''}]})}>+ Afegir alumne</button>
        </div>
      </div>

      <div style={{marginTop:12, display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <button className="btn" onClick={submit}>{S.submit}</button>
        {ok ? <span className="ok">{ok}</span> : null}
        {err ? <span className="err">{err}</span> : null}
      </div>
    </div>
  );
}

function PostsList({S, type, title}:{S:any, type:'news'|'alert'|'menu', title:string}) {
  const [refresh, setRefresh] = useState(0);
  const {data, loading} = useApi(`/api/family/feed?type=${type}`,[S,type,refresh]);
  if(loading) return <div className="card"><p className="p">…</p></div>;
  const posts = data?.posts || [];
  return (
    <div className="card">
      <div className="h1">{title}</div>
      <div className="list">
        {posts.length===0 ? <p className="p">{S.noItems}</p> : posts.map((p:any)=>{
          const atts = p.attachments || [];
          return (
            <div className="item" key={p.id}>
              <h3>{p.title}</h3>
              {p.body ? <div className="small">{p.body}</div> : null}
              <div className="meta">
                <span className="badge">{new Date(p.created_at).toLocaleString()}</span>
                {p.is_new ? <span className="badge">{S.markNew}</span> : null}
                {type==='alert' ? (
                  p.is_read
                    ? <span className="badge">OK</span>
                    : <button
                        className="btn secondary"
                        onClick={async()=>{
                          await fetch('/api/family/mark-read',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({post_id:p.id})});
                          setRefresh(x=>x+1);
                        }}
                      >{S.markRead}</button>
                ) : null}
              </div>
              {atts.length ? (
                <div className="meta">
                  {atts.map((a:any)=>{
                    const href = a.signed_url || a.public_url;
                    return <a key={a.id} className="badge" href={href} target="_blank" rel="noreferrer">📎 {a.filename}</a>
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function News({S}:{S:any}){ return <PostsList S={S} type="news" title={S.news} />; }
function Alerts({S}:{S:any}){ return <PostsList S={S} type="alert" title={S.alerts} />; }
function Menu({S}:{S:any}){ return <PostsList S={S} type="menu" title={S.menu} />; }

function Surveys({S}:{S:any}) {
  const {data, loading} = useApi('/api/family/surveys',[S]);
  const [msg,setMsg]=useState('');
  if(loading) return <div className="card"><p className="p">…</p></div>;
  const items = data?.surveys || [];
  async function submit(survey_id:string, student_id:string, question_id:string, value:string){
    setMsg('');
    const res = await fetch('/api/family/answer',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({survey_id, student_id, answers:{[question_id]: value}})});
    const j=await res.json();
    setMsg(j.ok?'✓':(j.error||'Error'));
    window.location.reload();
  }
  return (
    <div className="card">
      <div className="h1">{S.surveys}</div>
      {msg ? <p className="small">{msg}</p> : null}
      <div className="list">
        {items.length===0 ? <p className="p">{S.noItems}</p> : items.map((it:any)=>(
          <div className="item" key={it.survey_id + it.student_id}>
            <h3>{it.title}</h3>
            <div className="small"><b>{it.student_name}</b> · {it.student_course}</div>
            <div className="small" style={{marginTop:6}}>{it.question_text}</div>
            {it.already_answered ? <div className="ok" style={{marginTop:8}}>Respost ✓</div> : (
              <div style={{marginTop:10}}>
                <select id={`s-${it.survey_id}-${it.student_id}`}>
                  {it.options.map((o:string)=><option key={o} value={o}>{o}</option>)}
                </select>
                <div style={{marginTop:10}}>
                  <button className="btn" onClick={()=>{
                    const v=(document.getElementById(`s-${it.survey_id}-${it.student_id}`) as HTMLSelectElement).value;
                    submit(it.survey_id,it.student_id,it.question_id,v);
                  }}>{S.submit}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Children({S}:{S:any}) {
  const {data, loading} = useApi('/api/family/children',[S]);
  if(loading) return <div className="card"><p className="p">…</p></div>;
  const kids = data?.students || [];
  return (
    <div className="card">
      <div className="h1">{S.children}</div>
      <div className="list">
        {kids.length===0 ? <p className="p">{S.noItems}</p> : kids.map((k:any)=>(
          <div className="item" key={k.id}>
            <h3>{k.first_name} {k.last_name}</h3>
            <div className="meta">
              <span className="badge">{k.course}</span>
              {k.menjador ? <span className="badge">Menjador</span> : null}
              {k.bus1 ? <span className="badge">Bus 1</span> : null}
              {k.bus2 ? <span className="badge">Bus 2</span> : null}
              {k.acollida ? <span className="badge">Acollida</span> : null}
            </div>
            {k.allergies ? <div className="small" style={{marginTop:8}}>Al·lèrgies: {k.allergies}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function Family({S}:{S:any}) {
  const {data, loading} = useApi('/api/family/profile',[S]);
  const [form,setForm]=useState<any>(null);
  const [msg,setMsg]=useState('');
  useEffect(()=>{ if(data?.family) setForm(data.family); }, [data?.family]);
  if(loading || !form) return <div className="card"><p className="p">…</p></div>;

  async function save(){
    setMsg('');
    const res=await fetch('/api/family/profile',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(form)});
    const j=await res.json();
    setMsg(j.ok?S.saved:(j.error||'Error'));
  }

  return (
    <div className="card">
      <div className="h1">{S.familyData}</div>
      <div className="grid cols2" style={{marginTop:12}}>
        <div style={{gridColumn:'1 / -1'}}><label>Adreça</label><input value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
        <div><label>Correu electrònic</label><input value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
        <div><label>IBAN</label><input value={form.iban||''} onChange={e=>setForm({...form,iban:e.target.value})}/></div>
        <div><label>Telèfon pare</label><input value={form.phone_father||''} onChange={e=>setForm({...form,phone_father:e.target.value})}/></div>
        <div><label>Telèfon mare</label><input value={form.phone_mother||''} onChange={e=>setForm({...form,phone_mother:e.target.value})}/></div>
        <div><label>Nom pare</label><input value={form.name_father||''} onChange={e=>setForm({...form,name_father:e.target.value})}/></div>
        <div><label>Nom mare</label><input value={form.name_mother||''} onChange={e=>setForm({...form,name_mother:e.target.value})}/></div>
        <div><label>Professió pare</label><input value={form.job_father||''} onChange={e=>setForm({...form,job_father:e.target.value})}/></div>
        <div><label>Professió mare</label><input value={form.job_mother||''} onChange={e=>setForm({...form,job_mother:e.target.value})}/></div>
        <div style={{gridColumn:'1 / -1'}}><label>Al·lèrgies</label><input value={form.allergies||''} onChange={e=>setForm({...form,allergies:e.target.value})}/></div>
        <div><label>Acollida (família)</label>
          <select value={form.acollida?'Sí':'No'} onChange={e=>setForm({...form,acollida:e.target.value==='Sí'})}><option>No</option><option>Sí</option></select>
        </div>
      </div>
      <div style={{marginTop:12, display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <button className="btn" onClick={save}>Desar</button>
        {msg ? <span className={msg.includes('Error')?'err':'ok'}>{msg}</span> : null}
      </div>
    </div>
  );
}

function Settings({S, session}:{S:any, session:any}) {
  const [np,setNp]=useState(''); const [cp,setCp]=useState(''); const [msg,setMsg]=useState('');
  async function update(){
    setMsg('');
    if(np!==cp){ setMsg(S.passwordMismatch); return; }
    const res=await fetch('/api/password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({newPassword:np})});
    const j=await res.json();
    setMsg(j.ok?S.passwordUpdated:(j.error||'Error'));
    setNp(''); setCp('');
  }
  return (
    <div className="card">
      <div className="h1">{S.settings}</div>
      <p className="p">{S.changePassword}</p>
      <div className="grid cols2" style={{marginTop:12}}>
        <div><label>{S.newPassword}</label><input type="password" value={np} onChange={e=>setNp(e.target.value)}/></div>
        <div><label>{S.confirmPassword}</label><input type="password" value={cp} onChange={e=>setCp(e.target.value)}/></div>
      </div>
      <div style={{marginTop:12, display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <button className="btn" onClick={update}>{S.updatePassword}</button>
        {msg ? <span className={msg.includes('no')||msg.includes('coinc')||msg.includes('Error')?'err':'ok'}>{msg}</span> : null}
      </div>
      <p className="small" style={{marginTop:10}}>Usuari: {session.username} · Rol: {session.role}</p>
    </div>
  );
}

function Admin({S}:{S:any}) {
  const {data, loading} = useApi('/api/admin/dashboard',[S]);
  const [msg,setMsg]=useState('');
  const [post,setPost]=useState({title:'',body:'',type:'news' as 'news'|'alert'|'menu',group_ids:[] as string[]});
  const [survey,setSurvey]=useState({title:'',question:'',options:'Sí;No',group_ids:[] as string[]});
  if(loading) return <div className="card"><p className="p">…</p></div>;
  const groups = data?.groups || [];
  const requests = data?.requests || [];
  const posts = data?.posts || [];
  const surveys = data?.surveys || [];

  const toggle = (arr:string[], id:string) => arr.includes(id) ? arr.filter(x=>x!==id) : [...arr,id];

  async function createPost(){
    setMsg('');
    const res=await fetch('/api/admin/post',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(post)});
    const j=await res.json(); setMsg(j.ok?'Creat ✓':(j.error||'Error')); window.location.reload();
  }
  async function createSurvey(){
    setMsg('');
    const res=await fetch('/api/admin/survey',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(survey)});
    const j=await res.json(); setMsg(j.ok?'Creat ✓':(j.error||'Error')); window.location.reload();
  }
  async function approve(id:string){
    setMsg('');
    const res=await fetch('/api/admin/approve',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id})});
    const j=await res.json(); setMsg(j.ok?'Aprovat ✓':(j.error||'Error')); window.location.reload();
  }
  async function upload(postId:string){
    setMsg('');
    const input = document.getElementById(`file-${postId}`) as HTMLInputElement;
    const f = input.files?.[0];
    if(!f) return;
    if(f.size > 130 * 1024 * 1024){ setMsg('Fitxer massa gran (130MB màx)'); return; }
    const fd = new FormData();
    fd.append('postId', postId);
    fd.append('file', f);
    const res = await fetch('/api/admin/attachment', { method:'POST', body: fd });
    const j = await res.json(); setMsg(j.ok?'Adjunt pujat ✓':(j.error||'Error')); window.location.reload();
  }

  return (
    <div className="grid">
      <div className="card">
        <div className="h1">{S.adminPanel}</div>
        {msg ? <p className="small">{msg}</p> : null}
        <p className="p">Admin únic · En proves. Avui marquem “Nou” dins l’app (push es pot afegir després).</p>
      </div>

      <div className="grid cols2">
        <div className="card">
          <div className="h1" style={{fontSize:18}}>{S.createPost}</div>
          <div style={{marginTop:10}}><label>{S.title}</label><input value={post.title} onChange={e=>setPost({...post,title:e.target.value})}/></div>
          <div style={{marginTop:10}}><label>{S.body}</label><textarea value={post.body} onChange={e=>setPost({...post,body:e.target.value})}/></div>
          <div style={{marginTop:10}}>
            <label>Tipus</label>
            <select value={post.type} onChange={e=>setPost({...post,type:e.target.value as any})}>
              <option value="news">Notícies</option>
              <option value="alert">Avisos</option>
              <option value="menu">Menú</option>
            </select>
          </div>
          <div style={{marginTop:10}}>
            <label>{S.groups}</label>
            <div className="nav">
              {groups.map((g:any)=>(
                <button key={g.id} className={'chip'+(post.group_ids.includes(g.id)?' active':'')} onClick={()=>setPost({...post,group_ids:toggle(post.group_ids,g.id)})}>{g.name}</button>
              ))}
            </div>
          </div>
          <div style={{marginTop:12}}><button className="btn" onClick={createPost}>Publicar</button></div>
        </div>

        <div className="card">
          <div className="h1" style={{fontSize:18}}>{S.createSurvey}</div>
          <div style={{marginTop:10}}><label>{S.title}</label><input value={survey.title} onChange={e=>setSurvey({...survey,title:e.target.value})}/></div>
          <div style={{marginTop:10}}><label>{S.question}</label><input value={survey.question} onChange={e=>setSurvey({...survey,question:e.target.value})}/></div>
          <div style={{marginTop:10}}><label>{S.options}</label><input value={survey.options} onChange={e=>setSurvey({...survey,options:e.target.value})}/></div>
          <div style={{marginTop:10}}>
            <label>{S.targetGroups}</label>
            <div className="nav">
              {groups.map((g:any)=>(
                <button key={g.id} className={'chip'+(survey.group_ids.includes(g.id)?' active':'')} onClick={()=>setSurvey({...survey,group_ids:toggle(survey.group_ids,g.id)})}>{g.name}</button>
              ))}
            </div>
          </div>
          <div style={{marginTop:12}}><button className="btn" onClick={createSurvey}>Crear</button></div>
        </div>
      </div>

      <div className="grid cols2">
        <div className="card">
          <div className="h1" style={{fontSize:18}}>{S.news}</div>
          <div className="list">
            {posts.map((p:any)=>(
              <div className="item" key={p.id}>
                <h3>{p.title}</h3>
                <div className="small">{p.body}</div>
                <div className="meta">
                  <span className="badge">{p.groups?.join(', ')}</span>
                  <span className="badge">{new Date(p.created_at).toLocaleString()}</span>
                </div>
                <div style={{marginTop:10}}>
                  <label>{S.addAttachment} (PDF/imatge)</label>
                  <input id={`file-${p.id}`} type="file" />
                  <div style={{marginTop:8}}>
                    <button className="btn secondary" onClick={()=>upload(p.id)}>{S.upload}</button>
                  </div>
                </div>
                {p.attachments?.length ? (
                  <div className="meta">
                    {p.attachments.map((a:any)=>(
                      <button
                        key={a.id}
                        className="badge"
                        style={{cursor:'pointer'}}
                        onClick={async()=>{
                          try{
                            // Use signed URL so families can open PDFs/images even if bucket is private
                            const qs = new URLSearchParams({ path: a.storage_path, bucket: 'adjunts' });
                            const res = await fetch(`/api/file/signed-url?${qs.toString()}`);
                            const j = await res.json();
                            if(j?.ok && j.url){
                              window.open(j.url, '_blank', 'noreferrer');
                            } else {
                              alert(j?.error || 'No es pot obrir el fitxer');
                            }
                          }catch(e:any){
                            alert('No es pot obrir el fitxer');
                          }
                        }}
                      >
                        📎 {a.filename}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="h1" style={{fontSize:18}}>{S.requests}</div>
          <div className="list">
            {requests.length===0 ? <p className="p">{S.noItems}</p> : requests.map((r:any)=>(
              <div className="item" key={r.id}>
                <h3>{r.cognoms}</h3>
                <div className="small">{r.correu} · {r.tel_pare} {r.tel_mare}</div>
                <div className="meta">
                  <span className="badge">{S.pending}</span>
                  <span className="badge">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <div style={{marginTop:10}}>
                  <button className="btn" onClick={()=>approve(r.id)}>{S.approve}</button>
                </div>
              </div>
            ))}
          </div>

          <div className="h1" style={{fontSize:18, marginTop:14}}>{S.surveys}</div>
          <div className="list">
            {surveys.map((s:any)=>(
              <div className="item" key={s.id}>
                <h3>{s.title}</h3>
                <div className="small">{s.question_text}</div>
                <div className="meta">
                  <span className="badge">{s.groups?.join(', ')}</span>
                  <span className="badge">Respostes: {s.answer_count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
