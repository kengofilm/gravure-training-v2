// v2: data/ 配下のみ参照、スマホUI、寛容ローダー
const $ = s=>document.querySelector(s);
const $$ = s=>document.querySelectorAll(s);
const byId = id=>document.getElementById(id);
const STATE = {
  all: [], glossary: [], handbook:{chapters:[]},
  wrongIds: new Set(JSON.parse(localStorage.getItem('gravure_wrongIds')||'[]')),
  history: JSON.parse(localStorage.getItem('gravure_history')||'[]'),
  mastery: JSON.parse(localStorage.getItem('gravure_mastery')||'{}'),
};

// Bottom nav routing
$$('.nav button').forEach(b=>{
  b.addEventListener('click', ()=>{
    $$('.nav button').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const tab = b.dataset.tab;
    ['train','glossary','diagram','handbook'].forEach(name=> byId('tab-'+name).hidden = (name!==tab));
    if(tab==='handbook') renderHandbook();
  });
});

// 固定：/data 配下だけを見る
const DATA = {
  questions: ["./data/questions.json","./data/extra_questions.json"],
  glossary:  ["./data/glossary.json","./data/extra_glossary.json"],
  handbook:  ["./data/handbook.json"]
};
const STARTER = {
  questions: [
    {id:"S0001", cat:"基礎/方式", q:"グラビア印刷の版は？", choices:["凹版","凸版","孔版","平版"], answer:0, exp:"セルにインキを保持する凹版。", level:1, tags:["凹版"]},
    {id:"S0002", cat:"色/色校正", q:"ΔE*00の利点は？", choices:["知覚差に近い","RGB必須","測色不要","必ず0.0になる"], answer:0, exp:"CIEDE2000は知覚均等性に配慮。", level:1, tags:["ΔE"]},
    {id:"S0003", cat:"基材/表面処理", q:"OPPの前処理で一般的なのは？", choices:["コロナ処理","加硫","硫酸洗浄","UV硬化"], answer:0, exp:"ぬれ性向上のため。", level:1, tags:["ダイン"]},
  ],
  glossary: [
    {term:"デザイン入稿", cat:"工程", desc:"制作データを色管理条件とともに受け取る工程。プロファイル/白引き設計など要確認。"},
    {term:"色校正", cat:"色評価", desc:"標準見本・光源条件・測色ルールの合意のもとで行う評価。ΔE*00で判定することが多い。"},
    {term:"白引き", cat:"カラマネ", desc:"下地に白インキを敷き、基材色の影響を減らして発色を安定。"},
  ],
  handbook: {chapters:[{title:"スターター",sections:[{title:"概要",content:"data/ 配下に JSON を置くと自動で読み込みます。questions.json / glossary.json は最低限必要です。"}]}]}
};

function savePersist(){
  localStorage.setItem('gravure_wrongIds', JSON.stringify([...STATE.wrongIds]));
  localStorage.setItem('gravure_history', JSON.stringify(STATE.history));
  localStorage.setItem('gravure_mastery', JSON.stringify(STATE.mastery));
}
async function fetchFirst(urls){
  for(const u of urls){
    try{
      const res = await fetch(u + '?v=20250808', {cache:'no-store'});
      if(!res.ok) continue;
      return await res.json();
    }catch(e){ /* try next */ }
  }
  return null;
}
async function loadData(){
  const qd = await fetchFirst(DATA.questions);
  const gd = await fetchFirst(DATA.glossary);
  const hb = await fetchFirst(DATA.handbook);
  const qs = normalizeQuestions(qd);
  const gl = normalizeGlossary(gd);
  STATE.handbook = hb && hb.chapters ? hb : STARTER.handbook;
  STATE.all = qs.length ? qs : STARTER.questions;
  STATE.glossary = gl.length ? gl : STARTER.glossary;
  initUI();
}
function normalizeQuestions(any){
  let arr = Array.isArray(any) ? any : (any && (any.items||any.data) ? (any.items||any.data) : []);
  arr = arr.filter(q=> q && Array.isArray(q.choices) && typeof q.answer==='number' && typeof q.q==='string' && typeof q.id==='string' && typeof q.cat==='string' && q.answer>=0 && q.answer<q.choices.length);
  return arr;
}
function normalizeGlossary(any){
  let arr = Array.isArray(any) ? any : (any && (any.items||any.data) ? (any.items||any.data) : []);
  const mapped = (arr||[]).map(t=>{
    if(!t || typeof t!=='object') return null;
    const term = t.term || t.用語 || t.name || t.title;
    const cat  = t.cat  || t.category || t.カテゴリ || "";
    const desc = t.desc || t.description || t.meaning || t.explanation || t.説明;
    if(typeof term==='string' && typeof desc==='string'){
      return {term, cat, desc};
    }
    return null;
  }).filter(Boolean);
  return mapped;
}

function initUI(){
  const cats = Array.from(new Set(STATE.all.map(q=>q.cat))).sort();
  const sel=byId('category'); sel.innerHTML=''; cats.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; sel.appendChild(o); });

  const gSel=byId('gCat'); gSel.innerHTML='<option value="all">すべて</option>';
  const gCats = Array.from(new Set(STATE.glossary.map(t=>t.cat))).sort();
  gCats.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; gSel.appendChild(o); });

  byId('stats').textContent = `問題:${STATE.all.length} | 用語:${STATE.glossary.length} | 誤答:${STATE.wrongIds.size}`;

  $$('.btn-qty').forEach(b=> b.addEventListener('click',()=>{ byId('count').value = b.dataset.n; }));
  byId('start').addEventListener('click', startGame);

  byId('gSearch').addEventListener('input', renderGlossary);
  byId('gCat').addEventListener('change', renderGlossary);
  renderGlossary();

  document.querySelectorAll('svg .node').forEach(n=>{
    n.addEventListener('click', ()=>{
      const term = n.getAttribute('data-term');
      const item = STATE.glossary.find(g=> g.term===term) || STATE.glossary.find(g=> (g.term||'').includes(term));
      $$('.nav button').forEach(x=>x.classList.remove('active'));
      $$(`.nav button[data-tab="glossary"]`)[0].classList.add('active');
      ['train','glossary','diagram','handbook'].forEach(name=> byId('tab-'+name).hidden = (name!=='glossary'));
      if(item){ showTerm(item); } else { alert('該当用語が見つかりません：'+term); }
      byId('gDetail').scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
}

// ===== Training =====
let session=null;
function startGame(){
  const mode=byId('mode').value;
  const count=Math.max(1, Math.min(200, parseInt(byId('count').value||'10')));
  let pool=STATE.all.slice();
  if(mode==='category'){
    const chosen=[...byId('category').selectedOptions].map(o=>o.value);
    if(chosen.length) pool=pool.filter(q=> chosen.includes(q.cat));
  } else if(mode==='wrong'){
    pool=pool.filter(q=> STATE.wrongIds.has(q.id));
  } else if(mode==='weak'){
    pool.sort((a,b)=> getWeakScore(b.id)-getWeakScore(a.id));
  }
  if(pool.length===0){ alert('選択条件に合う問題がありません。'); return; }
  shuffle(pool);
  const selected=pool.slice(0,count);
  session={ idx:0, list:selected, correct:0, total:selected.length, byCat:{} };
  byId('game').innerHTML='';
  showQuestion();
}
function getWeakScore(id){
  const m=STATE.mastery[id]||{seen:0,correct:0};
  if(m.seen===0) return 1;
  return 1 - (m.correct/m.seen);
}
function showQuestion(){
  const g=byId('game');
  const i=session.idx;
  const q=session.list[i];
  const card=document.createElement('div');
  card.className='qcard';
  card.innerHTML = `
    <div class="qhead">${escapeHtml(q.q)}</div>
    <div class="qmeta">${q.cat}　<span class="tag">難度:${q.level||2}</span> ${q.tags?.map(t=>`<span class="tag">${t}</span>`).join(' ')||''}</div>
    <div class="choices">
      ${q.choices.map((c,idx)=>`<button class="choice" data-i="${idx}">${escapeHtml(c)}</button>`).join('')}
    </div>
    <div class="feedback" style="padding:10px 14px"></div>
    <div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn nextBtn" style="flex:1">次へ</button>
      <button class="btn secondary skipBtn" style="flex:1">わからない（復習）</button>
    </div>
  `;
  g.appendChild(card);
  card.scrollIntoView({behavior:'smooth', block:'start'});
  card.querySelectorAll('.choice').forEach(btn=>{
    btn.addEventListener('click', ()=>selectChoice(card, q, parseInt(btn.dataset.i)));
  });
  card.querySelector('.nextBtn').addEventListener('click', nextQuestion);
  card.querySelector('.skipBtn').addEventListener('click', ()=>skipQuestion(q, card));
}
function skipQuestion(q, card){
  STATE.wrongIds.add(q.id); savePersist();
  const fb=card.querySelector('.feedback');
  fb.textContent='スキップ：復習モードに追加しました。';
  nextQuestion();
}
function selectChoice(card,q,i){
  const ok=(i===q.answer);
  const btns=card.querySelectorAll('.choice');
  btns.forEach((b,idx)=>{
    b.disabled=true;
    if(idx===q.answer) b.classList.add('correct');
    if(idx===i && !ok) b.classList.add('wrong');
  });
  const m=STATE.mastery[q.id]||{seen:0,correct:0};
  m.seen+=1; if(ok) m.correct+=1; STATE.mastery[q.id]=m;
  if(ok){ STATE.wrongIds.delete(q.id); session.correct+=1; }
  else { STATE.wrongIds.add(q.id); }
  savePersist();
  const fb=card.querySelector('.feedback');
  fb.innerHTML=(ok?`<span style="color:#16a34a">正解！</span>`:`<span style="color:#ef4444">不正解…</span> 正解は「${escapeHtml(q.choices[q.answer])}」。`) + ' ' + escapeHtml(q.exp||'');
  session.byCat[q.cat]=session.byCat[q.cat]||{c:0,t:0};
  session.byCat[q.cat].t+=1; if(ok) session.byCat[q.cat].c+=1;
}
function nextQuestion(){
  session.idx+=1;
  if(session.idx<session.list.length) showQuestion(); else endSession();
}
function endSession(){
  STATE.history.push({ts:Date.now(), correct:session.correct, total:session.total, byCat:session.byCat});
  savePersist();
  const g=byId('game');
  const res=document.createElement('div'); res.className='panel';
  const rate=Math.round(session.correct/session.total*100);
  res.innerHTML = `<h3>結果: ${session.correct} / ${session.total}（${rate}%）</h3>
    <div class="tag">苦手分野（正答率が低い順）</div>`;
  const arr=Object.entries(session.byCat).map(([k,v])=>[k, v.c/(v.t||1)]).sort((a,b)=>a[1]-b[1]);
  res.innerHTML += `<div style="margin-top:6px">${arr.map(([k,p])=>`<span class="tag">${k}: ${(p*100).toFixed(0)}%</span>`).join(' ')||'<span class="tag">データなし</span>'}</div>`;
  g.appendChild(res); res.scrollIntoView({behavior:'smooth'});
}

// ===== Glossary =====
function renderGlossary(){
  const q=byId('gSearch').value.trim().toLowerCase();
  const cat=byId('gCat').value;
  const list=byId('gList'); list.innerHTML='';
  const filtered=STATE.glossary.filter(t=>{
    const okCat=(cat==='all' || t.cat===cat);
    const okQ=(!q || (t.term||'').toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q));
    return okCat && okQ;
  });
  byId('gCount').textContent = filtered.length+' 語';
  filtered.forEach(t=>{
    const el=document.createElement('li'); el.className='term';
    el.innerHTML = `<div><b>${escapeHtml(t.term)}</b> <span class="tag">${escapeHtml(t.cat||'')}</span></div><div style="opacity:.9;margin-top:4px">${escapeHtml(t.desc||'')}</div>`;
    el.addEventListener('click', ()=> showTerm(t)); list.appendChild(el);
  });
  byId('gDetail').hidden=true;
}
function showTerm(t){
  const d=byId('gDetail'); d.hidden=false;
  d.innerHTML = `<b style="font-size:18px">${escapeHtml(t.term)}</b> <span class="tag">${escapeHtml(t.cat||'')}</span>
  <div style="margin-top:6px;line-height:1.6">${escapeHtml(t.desc||'')}</div>`;
}

// ===== Handbook =====
function renderHandbook(){
  const hb = STATE.handbook;
  const cSel = byId('hbChapter');
  const sSel = byId('hbSection');
  const content = byId('hbContent');
  if(!hb.chapters?.length){
    content.innerHTML = '<p class="tag">handbook.json が見つかりませんでした（任意）。</p>';
    return;
  }
  if(!cSel.options.length){
    hb.chapters.forEach((ch,i)=>{
      const o=document.createElement('option'); o.value=i; o.textContent=(i+1)+'. '+ch.title; cSel.appendChild(o);
    });
    cSel.addEventListener('change', ()=>{ populateSections(); renderPage(); });
    sSel.addEventListener('change', renderPage);
    populateSections();
  }
  renderPage();
  function populateSections(){
    sSel.innerHTML='';
    const ch = hb.chapters[cSel.value||0];
    (ch.sections||[]).forEach((s,i)=>{
      const o=document.createElement('option'); o.value=i; o.textContent=(i+1)+') '+s.title; sSel.appendChild(o);
    });
  }
  function renderPage(){
    const ch = hb.chapters[cSel.value||0];
    const sec = (ch.sections||[])[sSel.value||0] || {content:""};
    content.innerHTML = `<h4 style="margin:.2em 0">${escapeHtml(ch.title)}</h4><h5 style="margin:.2em 0;color:#9ca3af">${escapeHtml(sec.title||'')}</h5><p style="line-height:1.7">${(sec.content||'').split('\\n').map(escapeHtml).join('<br>')}</p>`;
  }
}

// Utils
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
function escapeHtml(s){ return String(s||'').replace(/[&<>\"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); }

(async function(){ await loadData(); })();
