// /data 配下のみ参照（既存を使う）
var DATA = {
  questions: ["./data/questions.json","./data/extra_questions.json"],
  glossary:  ["./data/glossary.json","./data/extra_glossary.json"],
  handbook:  ["./data/handbook.json"]
};
var STARTER = {
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
function fetchFirst(urls){
  return new Promise(function(resolve){
    var i = 0;
    function tryNext(){
      if(i>=urls.length){ resolve(null); return; }
      var u = urls[i++] + '?v='+(Date.now()%1000000); // 強制キャッシュ回避
      fetch(u, {cache:'no-store'}).then(function(res){
        if(!res.ok){ tryNext(); return; }
        res.json().then(function(data){ resolve(data); }).catch(function(){ tryNext(); });
      }).catch(function(){ tryNext(); });
    }
    tryNext();
  });
}
function loadData(){
  Promise.all([fetchFirst(DATA.questions), fetchFirst(DATA.glossary), fetchFirst(DATA.handbook)]).then(function(arr){
    var qs = normalizeQuestions(arr[0]);
    var gl = normalizeGlossary(arr[1]);
    var hb = arr[2];
    STATE.handbook = (hb && hb.chapters) ? hb : STARTER.handbook;
    STATE.all = (qs && qs.length) ? qs : STARTER.questions;
    STATE.glossary = (gl && gl.length) ? gl : STARTER.glossary;
    initUI();
  });
}
// ===== alias対応版 normalizeGlossary =====
function normalizeGlossary(any){
  var arr = Array.isArray(any) ? any : (any && (any.items||any.data) ? (any.items||any.data) : []);
  var out = [];
  (arr||[]).forEach(function(t){
    if(!t || typeof t!=='object') return;

    var term = t.term || t['用語'] || t.name || t.title;
    var cat  = t.cat  || t.category || t['カテゴリ'] || "";
    var desc = t.desc || t.description || t.meaning || t.explanation || t['説明'];

    // alias 正規化
    var rawAlias = t.alias || t['別名'] || t.aka || null;
    var alias = [];
    if (Array.isArray(rawAlias)) {
      alias = rawAlias.filter(function(x){ return typeof x === 'string' && x.trim(); });
    } else if (typeof rawAlias === 'string') {
      alias = rawAlias.split(/[、,\/]/).map(function(x){ return x.trim(); }).filter(Boolean);
    }

    if(typeof term==='string' && typeof desc==='string'){
      out.push({term:term, cat:cat, desc:desc, alias:alias});
    }
  });
  return out;
}
