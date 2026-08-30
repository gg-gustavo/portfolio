// Agente de teste headless — valida todos os jogos (funcional + estrutura)
// Uso: node tests.js
const fs = require('fs');
eval(fs.readFileSync('input.js','utf8'));

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
  const el = {
    classList:cls, children:[], _l:[], dataset:{},
    style:{ setProperty(k,v){this[k]=v;} },
    textContent:'', innerHTML:'', value:'', disabled:false, id:'',
    appendChild(e){this.children.push(e)},
    addEventListener(ev,fn){this._l.push([ev,fn])},
    replaceWith(){}, remove(){}, cloneNode(){return mkEl()},
    querySelectorAll(){return []}, querySelector(){return mkEl()},
    setAttribute(){}, getAttribute(){return null},
    getBoundingClientRect(){ return {left:0,top:0,width:0,height:0}; }
  };
  el.parentNode = el;
  el.insertBefore = function(e,r){ this.children.push(e); return e; };
  return el;
}

global.localStorage = { getItem:()=>null, setItem:()=>{} };

// executa o <script> do jogo + corpo de teste juntos (mesmo escopo)
function run(file, body){
  const els = {};
  const sel = {};
  const doc = {
    getElementById(id){ if(!els[id]) els[id]=mkEl(); return els[id]; },
    createElement(){ return mkEl(); },
    querySelector(s){ if(!sel[s]) sel[s]=mkEl(); return sel[s]; },
    querySelectorAll(){ return []; },
    elementFromPoint(){ return null; },
    addEventListener(){}, removeEventListener(){}
  };
  doc.documentElement = { getAttribute(){ return 'dark'; }, setAttribute(){} };
  global.document = doc;
  global.location = { href:'' };
  global.window = { addEventListener(){}, innerWidth: 1024 };
  const html = fs.readFileSync(file,'utf8');
  // todos os <script> sem src; o script de boot (setAttribute data-theme) é ignorado
  const scripts = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  const game = scripts.find(s=>!s.includes('setAttribute("data-theme"'));
  if(!game){ bad(file+' sem script de jogo'); return; }
  const inputSrc = fs.readFileSync('input.js','utf8');
  const env = { els, doc, sel };
  try{
    eval(inputSrc + '\n' + game + '\n;(' + body.toString() + ')(env);');
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
const GAME_FILES = ['index.html','ligue4.html','xadrez.html','dama.html','truco.html','paciencia.html','slide.html','2048.html','card-jitsu.html','tetris.html'];
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
  cards === 9 ? ok('menu renderiza 9 jogos') : bad('menu renderiza 9 jogos','tem '+cards);
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
  env.doc.getElementById('turnName').textContent === 'Verde'
    ? ok('turno alterna') : bad('turno alterna', env.doc.getElementById('turnName').textContent);
  // cpu: humano não joga na vez da IA
  click(env,'btnCpu'); click(env,'btnCpuStart'); click(env,'btnStart');
  turn===YELLOW ? ok('cpu pode começar') : bad('cpu pode começar', turn);
  const before=JSON.stringify(grid);
  colsEl.children[0]._l.find(x=>x[0]==='click')[1]();
  (JSON.stringify(grid)===before && turn===YELLOW) ? ok('bloqueado jogar na vez da IA') : bad('bloqueado jogar na vez da IA');
  aiMove();
  (JSON.stringify(grid)!==before && turn===RED) ? ok('cpu joga no turno dele') : bad('cpu joga no turno dele');
  click(env,'btnHumanStart'); click(env,'btnStart');
  turn===RED ? ok('humano pode começar') : bad('humano pode começar', turn);
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
  // maybeCpuTruco: mesmo time não pede truco 2x, independente de quem é o lead
  played=[null,null,null,null]; lastRaisedBy=1; stakeLocked=false; stakeIdx=0; phase='play';
  maybeCpuTruco(3) ? bad('adv não pede truco 2x') : ok('adv não pede truco 2x');
  lastRaisedBy=0;
  maybeCpuTruco(2) ? bad('parceiro não pede truco 2x') : ok('parceiro não pede truco 2x');
  // modal de decisão só quando o time adversário pediu
  lastRaisedBy=1; phase='trucoPending'; updateButtons();
  env.els['btnAccept'].classList.contains('hidden') ? bad('aceitar visível quando adversário pediu') : ok('aceitar visível quando adversário pediu');
  lastRaisedBy=0; updateButtons();
  env.els['btnAccept'].classList.contains('hidden') ? ok('aceitar oculto quando próprio time pediu') : bad('aceitar oculto quando próprio time pediu');
  env.els['btnRefuse'].classList.contains('hidden') ? ok('recusar oculto quando próprio time pediu') : bad('recusar oculto quando próprio time pediu');
  lastRaisedBy=null; phase='play';
  // canHumanTruco: só na vez do jogador
  mode='duo';
  players=[[deck.pop(),deck.pop(),deck.pop()],[deck.pop(),deck.pop(),deck.pop()]];
  lead=1; played=[null,null]; stakeLocked=false; stakeIdx=0;
  canHumanTruco() ? bad('sem truco fora da vez') : ok('sem truco fora da vez');
  lead=0;
  canHumanTruco() ? ok('truco na própria vez') : bad('truco na própria vez');
  // mão de ferro: 11×11 → cega, sem truco, vale partida
  teamPts=[11,11];
  nextRodada();
  maoDeFerro ? ok('mão de ferro em 11×11') : bad('mão de ferro em 11×11');
  canHumanTruco() ? bad('sem truco na mão de ferro') : ok('sem truco na mão de ferro');
  // freeze: aceitar truco no meio da vaza deve reagendar o turno do próximo CPU
  mode='dupla'; maoDeFerro=false; maoDe11=false;
  players=[[deck.pop(),deck.pop(),deck.pop()],[deck.pop(),deck.pop(),deck.pop()],[deck.pop(),deck.pop(),deck.pop()],[deck.pop(),deck.pop(),deck.pop()]];
  lead=0; played=[deck.pop(),null,null,null]; phase='trucoPending'; lastRaisedBy=1; stakeLocked=false; stakeIdx=0;
  const oldST=global.setTimeout; let scheduled=[];
  global.setTimeout=(fn,ms)=>{scheduled.push(fn);return 0;};
  click(env,'btnAccept');
  global.setTimeout=oldST;
  scheduled.length>0 ? ok('aceitar reagenda turno do CPU') : bad('aceitar reagenda turno do CPU');
  phase='play'; played=[null,null,null,null];
  // rotação de quem começa: mão nova avança assento fixo, independente de vencedor
  const oldST2=global.setTimeout; global.setTimeout=(fn,ms)=>{return 0;};
  mode='dupla'; teamPts=[0,0]; maoDe11=false; mao11Pending=false; maoDeFerro=false; starter=0; lead=0;
  nextRodada(); (starter===1&&lead===1) ? ok('rotação dupla assento 1') : bad('rotação dupla assento 1', starter);
  nextRodada(); (starter===2&&lead===2) ? ok('rotação dupla assento 2') : bad('rotação dupla assento 2', starter);
  nextRodada(); (starter===3&&lead===3) ? ok('rotação dupla assento 3') : bad('rotação dupla assento 3', starter);
  nextRodada(); (starter===0&&lead===0) ? ok('rotação dupla volta a 0') : bad('rotação dupla volta a 0', starter);
  mode='duo'; init(); starter=0; lead=0;
  nextRodada(); (starter===1&&lead===1) ? ok('rotação duo assento 1') : bad('rotação duo assento 1', starter);
  nextRodada(); (starter===0&&lead===0) ? ok('rotação duo volta a 0') : bad('rotação duo volta a 0', starter);
  // mão de onze: decisão + jogar não gira o assento duas vezes
  mode='duo'; teamPts=[1,11]; starter=0; lead=0;
  nextRodada();
  const afterPreview=starter;
  click(env,'btnPlay11');
  afterPreview===starter ? ok('mão de onze roda uma vez só') : bad('mão de onze roda uma vez só', afterPreview+'→'+starter);
  global.setTimeout=oldST2;
});

// ---- paciencia ----
section('paciencia');
run('paciencia.html', env=>{
  const dealt = tableau.reduce((a,c)=>a+c.length,0);
  dealt === 28 ? ok('28 cartas no tabuleiro') : bad('28 cartas no tabuleiro', dealt);
  stock.length===24 ? ok('24 cartas no monte') : bad('24 no monte', stock.length);
  env.doc.getElementById('foundations').children.length === 4 ? ok('4 fundações') : bad('4 fundações');
  // alternância de cor: só vermelho sobre preto e vice-versa
  tableau=Array.from({length:7},()=>[]);
  tableau[0].push({s:'♥',r:5,up:true});
  canPlaceTableau({s:'♦',r:4,up:true},0) ? bad('vermelho sobre vermelho') : ok('vermelho sobre vermelho bloqueado');
  canPlaceTableau({s:'♠',r:4,up:true},0) ? ok('vermelho sobre preto permitido') : bad('vermelho sobre preto permitido');
  tableau[0]=[{s:'♠',r:5,up:true}];
  canPlaceTableau({s:'♣',r:4,up:true},0) ? bad('preto sobre preto') : ok('preto sobre preto bloqueado');
  canPlaceTableau({s:'♦',r:4,up:true},0) ? ok('preto sobre vermelho permitido') : bad('preto sobre vermelho permitido');
  // arrastar carta do descarte para tableau/fundação
  tableau=Array.from({length:7},()=>[]);
  tableau[0].push({s:'♥',r:5,up:true});
  waste=[{s:'♠',r:4,up:true}];
  dropWaste({kind:'tab',c:0});
  (waste.length===0&&tableau[0].length===2) ? ok('descarte arrastável p/ tableau') : bad('descarte arrastável p/ tableau', waste.length+'/'+tableau[0].length);
  foundations=SUITS.map(()=>[]);
  waste=[{s:'♦',r:1,up:true}];
  dropWaste({kind:'found',i:1});
  (waste.length===0&&foundations[1].length===1) ? ok('descarte arrastável p/ fundação') : bad('descarte arrastável p/ fundação', waste.length+'/'+foundations[1].length);
  waste=[]; tableau=Array.from({length:7},()=>[]);
});

// ---- tetris ----
section('tetris');
run('tetris.html', env=>{
  init();
  state='play';
  board[19]=Array(COLS).fill('#2ed573');
  clearFullRows();
  (lines===1 && board[19].every(v=>!v)) ? ok('limpa linha completa') : bad('limpa linha completa', lines);
  score===100 ? ok('pontua 100 por linha') : bad('pontua 100 por linha', score);
  current={type:'T',x:8,y:0,rot:0};
  collides(9,0,0)&&collides(-1,0,0) ? ok('colisão nas bordas') : bad('colisão nas bordas');
  const rx=current.x, rr=current.rot;
  rotate();
  (current.rot!==rr||current.x!==rx) ? ok('rotação com wall kick') : bad('rotação com wall kick');
  spawn();
  current ? ok('spawn cria peça') : bad('spawn cria peça');
  ROTS.I.length===2&&ROTS.T.length===4 ? ok('rotações I(2) e T(4)') : bad('rotações I(2) e T(4)', ROTS.I.length+'/'+ROTS.T.length);
  // próxima peça do preview bate com a que realmente vem
  init();
  bag=[]; current=null; next=null;
  state='play';
  spawn();
  const preview=next, first=current.type;
  lockPiece();
  (current.type===preview && current.type!==first) ? ok('próxima peça = preview') : bad('próxima peça = preview', current.type+' vs '+preview+' (primeira: '+first+')');
});

// ---- slide ----
section('slide');
run('slide.html', env=>{
  env.doc.getElementById('board').children.length === 9 ? ok('9 blocos') : bad('9 blocos');
  click(env,'btnShuffle');
  ok('embaralhar não quebra');
});

// ---- input.js: swipe ----
section('input.js (swipe)');
function S(x0,y0,x1,y1,t){ return swipeFrom(x0,y0,x1,y1,t); }
S(0,0,40,0,20)==='right' ? ok('swipe right') : bad('swipe right',S(0,0,40,0,20));
S(0,0,-40,0,20)==='left' ? ok('swipe left') : bad('swipe left',S(0,0,-40,0,20));
S(0,0,0,40,20)==='down' ? ok('swipe down') : bad('swipe down',S(0,0,0,40,20));
S(0,0,0,-40,20)==='up' ? ok('swipe up') : bad('swipe up',S(0,0,0,-40,20));
S(0,0,5,3,20)===null ? ok('abaixo do threshold → null') : bad('abaixo do threshold',S(0,0,5,3,20));
S(0,0,30,29,20)==='right' ? ok('dominância axial right sobre down') : bad('dominância axial',S(0,0,30,29,20));
S(0,0,-30,-29,20)==='left' ? ok('dominância axial left sobre up') : bad('dominância axial',S(0,0,-30,-29,20));
S(0,0,-29,-30,20)==='up' ? ok('dominância axial up sobre left') : bad('dominância axial',S(0,0,-29,-30,20));

// ---- input.js: squareFromPoint ----
section('input.js (squareFromPoint)');
const RECT={left:0,top:0,width:340,height:340};
const CELL=(340-20)/8; // pad 10
squareFromPoint(RECT,10+CELL*2+5,10+CELL*3+5,8,8,10)===26 ? ok('casa correta c2r3') : bad('casa c2r3',squareFromPoint(RECT,10+CELL*2+5,10+CELL*3+5,8,8,10));
squareFromPoint(RECT,0,0,8,8,10)===-1 ? ok('fora do board → -1') : bad('fora do board',squareFromPoint(RECT,0,0,8,8,10));
squareFromPoint(RECT,10,10,8,8,10)===0 ? ok('canto 0') : bad('canto 0',squareFromPoint(RECT,10,10,8,8,10));
squareFromPoint(RECT,329,329,8,8,10)===63 ? ok('última célula 63') : bad('última célula 63',squareFromPoint(RECT,329,329,8,8,10));
squareFromPoint(RECT,339,339,8,8,10)===-1 ? ok('padding do board → -1') : bad('padding do board',squareFromPoint(RECT,339,339,8,8,10));

// ---- input.js: bindDrag registra listeners ----
section('input.js (bindDrag)');
run('xadrez.html', env=>{
  const board = env.doc.getElementById('board');
  const evs = board._l.map(x=>x[0]);
  ['pointerdown','pointermove','pointerup','pointercancel'].every(e=>evs.includes(e))
    ? ok('board tem pointer handlers') : bad('board tem pointer handlers', evs.join(','));
});
run('dama.html', env=>{
  const board = env.doc.getElementById('board');
  const evs = board._l.map(x=>x[0]);
  ['pointerdown','pointermove','pointerup','pointercancel'].every(e=>evs.includes(e))
    ? ok('board tem pointer handlers') : bad('board tem pointer handlers', evs.join(','));
});
run('paciencia.html', env=>{
  const tableau = env.doc.getElementById('tableau');
  const evs = tableau._l.map(x=>x[0]);
  ['pointerdown','pointermove','pointerup','pointercancel'].every(e=>evs.includes(e))
    ? ok('tableau tem pointer handlers') : bad('tableau tem pointer handlers', evs.join(','));
});
run('slide.html', env=>{
  const board = env.doc.getElementById('board');
  const evs = board._l.map(x=>x[0]);
  ['pointerdown','pointerup'].every(e=>evs.includes(e))
    ? ok('board tem swipe handlers') : bad('board tem swipe handlers', evs.join(','));
});

// ---- input.js: drag simulado ----
section('input.js (drag simulado)');
{
  const log=[];
  const el=mkEl();
  let down, move, drop;
  const handlers={
    onDown:s=>{down=s; log.push('down:'+s);},
    onMove:(s,dx,dy)=>{log.push('move:'+s+':'+dx+':'+dy);},
    onDrop:s=>{drop=s; log.push('drop:'+s);},
  };
  bindDrag(el,handlers,{pick:(e,px,py)=>(px>50?1:0), moveThreshold:10});
  function fire(type,cx,cy){
    const ev={pointerId:1,button:0,clientX:cx,clientY:cy,preventDefault(){},stopPropagation(){}};
    const h=el._l.find(x=>x[0]===type);
    h[1](ev);
  }
  fire('pointerdown',10,10);
  fire('pointermove',15,12);
  fire('pointermove',60,12); // > threshold → drag start
  fire('pointermove',70,12);
  fire('pointerup',70,12);
  (down===0 && drop===1) ? ok('drag: desce em 0, solta em 1') : bad('drag start/end', down+'/'+drop+' log='+log.join('|'));
  log.length>=4 ? ok('onDown+onMove*2+onDrop disparados') : bad('onMove múltiplos', log.join('|'));
  fire('pointerdown',10,10);
  fire('pointerup',12,11); // < threshold → tap
  handlers.onTap=s=>{log.push('tap:'+s);};
  // re-bind para capturar onTap
  el._l.length=0; log.length=0;
  const tapped=[];
  bindDrag(el,{onTap:s=>{tapped.push(s);}},{pick:(e,px,py)=>5, moveThreshold:10});
  fire('pointerdown',10,10); fire('pointerup',12,11);
  tapped[0]===5 ? ok('tap roteia pick') : bad('tap roteia pick', String(tapped[0]));
}

// ---- resumo ----
console.log(report.join('\n'));
console.log('\n' + (fail===0?'✅ TODOS PASSARAM':'❌ FALHAS: '+fail) + ' — ' + pass + ' pass / ' + fail + ' fail');
process.exit(fail===0?0:1);