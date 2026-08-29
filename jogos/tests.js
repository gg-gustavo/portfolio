// Agente de teste headless — valida todos os jogos (funcional + estrutura)
// Uso: node tests.js
const fs = require('fs');

let pass = 0, fail = 0;
const report = [];
function ok(name){ pass++; report.push('  ✔ ' + name); }
function bad(name, detail){ fail++; report.push('  ✘ ' + name + (detail ? ' — ' + detail : '')); }
function section(t){ report.push('[' + t + ']'); }

// ---- DOM stub ----
function mkEl(){
  const cls = { _s:new Set(),
    add(x){this._s.add(x)}, remove(x){this._s.delete(x)},
    toggle(x,f){f?this._s.add(x):this._s.delete(x)}, contains(x){return this._s.has(x)} };
  return {
    classList:cls, children:[], _l:[],
    textContent:'', innerHTML:'', value:'', disabled:false, style:{}, id:'',
    appendChild(e){this.children.push(e)},
    addEventListener(ev,fn){this._l.push([ev,fn])},
    replaceWith(){}, querySelectorAll(){return []},
    setAttribute(){}, getAttribute(){return null}
  };
}

global.localStorage = { getItem:()=>null, setItem:()=>{} };

// executa o <script> do jogo + corpo de teste juntos (mesmo escopo)
function run(file, body){
  const els = {};
  const doc = {
    getElementById(id){ if(!els[id]) els[id]=mkEl(); return els[id]; },
    createElement(){ return mkEl(); },
    querySelector(){ return mkEl(); },
    querySelectorAll(){ return []; }
  };
  global.document = doc;
  global.location = { href:'' };
  const html = fs.readFileSync(file,'utf8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if(!m){ bad(file+' sem <script>'); return; }
  const env = { els, doc };
  try{
    eval(m[1] + '\n;(' + body.toString() + ')(env);');
  }catch(e){
    bad(file + ' — execução', e.message);
  }
}

function click(env, id){
  const el = env.els[id];
  const h = el._l.find(x=>x[0]==='click');
  if(h) h[1]();
}

// ---- estrutural ----
section('Estrutura');
const GAME_FILES = ['index.html','ligue4.html','xadrez.html','dama.html','truco.html','paciencia.html','slide.html'];
for(const f of GAME_FILES){
  fs.existsSync(f) ? ok(f+' existe') : bad(f+' existe','não encontrado');
}
const idx = fs.readFileSync('index.html','utf8');
for(const h of [...idx.matchAll(/href:'([a-z0-9]+\.html)'/g)].map(m=>m[1])){
  fs.existsSync(h) ? ok('menu link '+h) : bad('menu link '+h,'arquivo não existe');
}
for(const f of GAME_FILES){
  const ids = [...fs.readFileSync(f,'utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]);
  const dup = ids.filter((x,i)=>ids.indexOf(x)!==i);
  dup.length ? bad(f+' ids duplicados', dup.join(',')) : ok(f+' sem ids duplicados');
}

// ---- index ----
section('index (menu)');
run('index.html', env=>{
  const cards = env.doc.getElementById('grid').children.length;
  cards === 6 ? ok('menu renderiza 6 jogos') : bad('menu renderiza 6 jogos','tem '+cards);
});

// ---- ligue4 ----
section('ligue4');
run('ligue4.html', env=>{
  const cells = env.doc.getElementById('cols').children.length;
  cells === 7 ? ok('7 colunas') : bad('7 colunas', cells);
  env.doc.getElementById('btn2p')._l.find(x=>x[0]==='click')[1]();
  const col0 = env.doc.getElementById('cols').children[0];
  col0._l.find(x=>x[0]==='click')[1]();
  ok('jogada inicial não quebra');
  env.doc.getElementById('turnName').textContent === 'Amarelo'
    ? ok('turno alterna') : bad('turno alterna', env.doc.getElementById('turnName').textContent);
});

// ---- dama ----
section('dama');
run('dama.html', env=>{
  env.doc.getElementById('board').children.length === 64 ? ok('64 casas') : bad('64 casas');
  const red = board.flat().filter(p=>p&&p.p==='r').length;
  const blk = board.flat().filter(p=>p&&p.p==='b').length;
  (red===12&&blk===12) ? ok('12×12 peças') : bad('12×12 peças', red+'/'+blk);
  getMoves(2,1).length>0 ? ok('movimentos gerados') : bad('movimentos gerados');
});

// ---- xadrez ----
section('xadrez');
run('xadrez.html', env=>{
  env.doc.getElementById('board').children.length === 64 ? ok('64 casas') : bad('64 casas');
  const w = legalMovesFor(W).length, b = legalMovesFor(B).length;
  (w===20&&b===20) ? ok('20 movimentos iniciais cada') : bad('20 movimentos iniciais', w+'/'+b);
  function play(from,to){const mm=legalMovesFor(turn).find(x=>x.from===from&&x.to===to); doMove(mm);}
  play(53,45); play(12,28); play(54,38); play(3,39);
  legalMovesFor(W).length===0 ? ok('xeque-mate detectado') : bad('xeque-mate detectado', legalMovesFor(W).length+' movimentos');
});

// ---- truco ----
section('truco');
run('truco.html', env=>{
  newDeck().length === 40 ? ok('baralho 40 cartas') : bad('baralho 40 cartas', newDeck().length);
  init();
  const nonMan=RANKS.find(r=>r!==manilhaRank);
  strength({s:'♣',r:manilhaRank}) > strength({s:'♣',r:nonMan}) ? ok('manilha mais forte') : bad('manilha mais forte');
  (players[0].length===3&&players[1].length===3) ? ok('mão 3+3') : bad('mão 3+3', players[0].length+'/'+players[1].length);
  dealRodada();
  canHumanTruco() ? ok('pode pedir truco no início') : bad('pode pedir truco no início');
  lastRaisedBy=0;
  canHumanTruco() ? bad('não pode pedir de novo após pedir') : ok('não pode pedir de novo após pedir');
  lastRaisedBy=1;
  canHumanTruco() ? ok('pode subir quando adversário pediu') : bad('pode subir quando adversário pediu');
  stakeLocked=true;
  canHumanTruco() ? bad('aposta travada após aceitar') : ok('aposta travada após aceitar');
  stakeLocked=false;
  players[0]=[];
  canHumanTruco() ? bad('sem truco após última carta') : ok('sem truco após última carta');
  players[0]=[deck.pop(),deck.pop(),deck.pop()];
  const bt=env.els['btnTruco'];
  stakeIdx=1; updateButtons();
  bt.textContent==='6' ? ok('botão mostra 6 valendo 3') : bad('botão mostra 6 valendo 3', bt.textContent);
  stakeIdx=2; updateButtons();
  bt.textContent==='9' ? ok('botão mostra 9 valendo 6') : bad('botão mostra 9 valendo 6', bt.textContent);
  stakeIdx=3; updateButtons();
  bt.textContent==='12' ? ok('botão mostra 12 valendo 9') : bad('botão mostra 12 valendo 9', bt.textContent);
  stakeIdx=0; updateButtons();
  bt.textContent==='Truco!' ? ok('botão Truco! valendo 1') : bad('botão Truco! valendo 1', bt.textContent);
  // duo: vaza idêntica à lógica anterior (empate → quem jogou primeiro)
  const c2=[deck.pop(),deck.pop()];
  lead=0; teamRounds=[0,0];
  played=[c2[0],c2[1]];
  resolveRound();
  const exp2=strength(c2[0])>=strength(c2[1])?0:1;
  lead===exp2 ? ok('vaza duo idêntica ao anterior') : bad('vaza duo idêntica ao anterior', lead+' vs '+exp2);
  // dupla: 4 jogadores, vaza por time
  mode='dupla'; init();
  players.length===4 ? ok('dupla 4 jogadores') : bad('dupla 4 jogadores', players.length);
  (players[0].length===3&&players[1].length===3&&players[2].length===3&&players[3].length===3) ? ok('dupla mão 4×3') : bad('dupla mão 4×3');
  const c=[deck.pop(),deck.pop(),deck.pop(),deck.pop()];
  const str=c.map(strength);
  lead=0; teamRounds=[0,0];
  played=[c[0],c[1],c[2],c[3]];
  resolveRound();
  const max=Math.max(...str);
  const exp=str.indexOf(max);
  lead===exp ? ok('vaza dupla vence maior carta') : bad('vaza dupla vence maior carta', lead+' vs '+exp);
  teamRounds[exp%2]===1 ? ok('vaza conta por time') : bad('vaza conta por time');
  // mão de ferro: 11×11 → cega, sem truco, vale partida
  teamPts=[11,11];
  nextRodada();
  maoDeFerro ? ok('mão de ferro em 11×11') : bad('mão de ferro em 11×11');
  canHumanTruco() ? bad('sem truco na mão de ferro') : ok('sem truco na mão de ferro');
});

// ---- paciencia ----
section('paciencia');
run('paciencia.html', env=>{
  const dealt = tableau.reduce((a,c)=>a+c.length,0);
  dealt === 28 ? ok('28 cartas no tabuleiro') : bad('28 cartas no tabuleiro', dealt);
  stock.length===24 ? ok('24 cartas no monte') : bad('24 no monte', stock.length);
  env.doc.getElementById('foundations').children.length === 4 ? ok('4 fundações') : bad('4 fundações');
});

// ---- slide ----
section('slide');
run('slide.html', env=>{
  env.doc.getElementById('board').children.length === 9 ? ok('9 blocos') : bad('9 blocos');
  click(env,'btnShuffle');
  ok('embaralhar não quebra');
});

// ---- resumo ----
console.log(report.join('\n'));
console.log('\n' + (fail===0?'✅ TODOS PASSARAM':'❌ FALHAS: '+fail) + ' — ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail===0?0:1);