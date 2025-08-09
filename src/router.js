// ===== Safe Bottom nav routing + tab switch =====
function getPanel(name){
  return document.getElementById('tab-'+name) || document.getElementById(name+'Panel');
}
function setActiveTab(tab){
  var names = ['train','glossary','diagram','handbook'];
  for(var i=0;i<names.length;i++){
    var n = names[i];
    var panel = getPanel(n);
    if(panel){ panel.hidden = (n !== tab); }
    var btn = document.getElementById('btn-'+n) || document.querySelector('.nav button[data-tab="'+n+'"]');
    if(btn){ btn.classList.toggle('active', n === tab); }
  }
  try{ localStorage.setItem('activeTab', tab); }catch(e){}
  if(tab==='handbook' && typeof renderHandbook==='function'){ renderHandbook(); }
}
(function(){
  var btns = document.querySelectorAll('.nav button');
  for(var i=0;i<btns.length;i++){
    (function(b){
      b.addEventListener('click', function(){
        var tab = b.getAttribute('data-tab') || 'train';
        setActiveTab(tab);
      });
    })(btns[i]);
  }
  var initial = (function(){ try{ return localStorage.getItem('activeTab') || 'train'; }catch(e){ return 'train'; }})();
  setActiveTab(initial);
})();
