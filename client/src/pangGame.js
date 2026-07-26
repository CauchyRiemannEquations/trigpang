/* 특수각 팡: 5×5 보드 드래그 사슬 게임 */
import { N, GAUGE_MAX, FEVER_LEN, EXPRS, isNeg, fmt, tileHTML, DIFFS, RECIP, bestOf, saveBestOf } from './gameConstants.js';
import { $, openCard, closeVeil, showGameOver, hideWelcome, registerStopper, drawBests } from './ui.js';
import { sfx } from './sound.js';

let diffKey = 'easy', diff = DIFFS.easy;
let grid = [], idc = 0, chain = [], chainVal = null;
let score = 0, best = 0, pops = 0, longest = 0, roundIdx = 0, roundScore = 0;
let gauge = 0, fever = false, feverT = 0, hot = [];
let time = 40, playing = false, locked = false, dragging = false, raf = 0, prev = 0;

function roundCfg(){
  return {time: diff.time,
    target: Math.round(diff.target0 * Math.pow(diff.mult, roundIdx) / 100) * 100};
}
function roundPool(){
  const fnOk = e => e.fn && (e.fn !== 'tan' || diff.tan)
    && (!RECIP.includes(e.fn) || diff.recip)
    && diff.angles.includes(e.deg) && (diff.rad || !e.rad);
  const vals = new Set();
  EXPRS.forEach(e => { if (fnOk(e)) vals.add(e.val); });
  return EXPRS.filter(e => e.fn ? fnOk(e) : vals.has(e.val));
}

function tpx(){ const el = $('boardwrap'); return (el.clientWidth - (N-1)*6)/N; }
const posX = c => c * (tpx() + 6);
const posY = r => r * (tpx() + 6);

/* ---------- spawn ---------- */
function pool(){
  const base = roundPool();
  if (fever) return base.filter(e => hot.includes(e.val));
  const p = [];
  base.forEach(e => { p.push(e); if (!isNeg(e.val)) p.push(e); });
  return p;
}
function spawnExpr(){ const p = pool(); return p[Math.floor(Math.random()*p.length)]; }

function makeTile(r, c, fromAbove){
  const e = spawnExpr();
  const t = { id: idc++, r, c, expr: e, val: e.val, el: document.createElement('div') };
  const el = t.el;
  el.className = 'tile';
  el.innerHTML = tileHTML(e);
  el.style.left = posX(c) + 'px';
  el.style.top = (fromAbove ? posY(r) - (fromAbove)*(tpx()+6) - 20 : posY(r)) + 'px';
  $('boardwrap').appendChild(el);
  if (fromAbove) requestAnimationFrame(() => requestAnimationFrame(() => { el.style.top = posY(r) + 'px'; }));
  return t;
}

function buildBoard(){
  $('boardwrap').querySelectorAll('.tile').forEach(n => n.remove());
  grid = [];
  for (let r=0; r<N; r++){ grid[r] = []; for (let c=0; c<N; c++) grid[r][c] = makeTile(r, c, 0); }
  ensureMoves(true);
}

/* ---------- move detection ---------- */
function hasMove(){
  const seen = new Set();
  for (let r=0;r<N;r++) for (let c=0;c<N;c++){
    const t = grid[r][c]; if (!t || seen.has(t.id)) continue;
    let count = 0; const stack = [t]; const comp = new Set([t.id]);
    while (stack.length){
      const u = stack.pop(); count++;
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++){
        const nr=u.r+dr, nc=u.c+dc;
        if (nr<0||nr>=N||nc<0||nc>=N||(dr===0&&dc===0)) continue;
        const v = grid[nr][nc];
        if (v && v.val===t.val && !comp.has(v.id)){ comp.add(v.id); stack.push(v); }
      }
    }
    comp.forEach(id => seen.add(id));
    if (count >= 3) return true;
  }
  return false;
}
function reshuffleTiles(){
  const vals = [];
  for (let r=0;r<N;r++) for (let c=0;c<N;c++) vals.push(grid[r][c].expr);
  for (let i=vals.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [vals[i],vals[j]]=[vals[j],vals[i]]; }
  let k=0;
  for (let r=0;r<N;r++) for (let c=0;c<N;c++){
    const t = grid[r][c], e = vals[k++];
    t.expr = e; t.val = e.val;
    t.el.innerHTML = tileHTML(e);
  }
}
function ensureMoves(silent){
  let guard = 0;
  while (!hasMove() && guard++ < 20){
    reshuffleTiles();
    if (!silent) say('가능한 조합이 없어 자동으로 섞었어요', 'warn');
  }
}

/* ---------- chain / drag ---------- */
function cellAt(x, y){
  const bw = $('boardwrap');
  const rect = bw.getBoundingClientRect();
  const s = tpx() + 6;
  const c = Math.floor((x-rect.left)/s), r = Math.floor((y-rect.top)/s);
  if (r<0||r>=N||c<0||c>=N) return null;
  const cx = rect.left + posX(c) + tpx()/2, cy = rect.top + posY(r) + tpx()/2;
  if (Math.hypot(x-cx, y-cy) > tpx()*0.46) return null;
  return grid[r][c];
}
function drawChainLine(){
  const bw = $('boardwrap');
  const w = bw.clientWidth;
  $('bo').setAttribute('viewBox', `0 0 ${w} ${w}`);
  let h = '';
  if (chain.length > 1){
    const pts = chain.map(t => (posX(t.c)+tpx()/2)+','+(posY(t.r)+tpx()/2)).join(' ');
    h = `<polyline points="${pts}" fill="none" stroke="#f0a80a" stroke-width="9" stroke-linejoin="round" stroke-linecap="round" opacity=".3"/>`
      + `<polyline points="${pts}" fill="none" stroke="#ffd84d" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" opacity=".75"/>`;
  }
  $('bo').innerHTML = h;
}
function setSel(t, on){ t.el.classList.toggle('sel', on); }
function clearChain(){
  chain.forEach(t => setSel(t, false));
  chain = []; chainVal = null; drawChainLine();
}
function tryAdd(t){
  if (!t || locked) return;
  if (chain.length && t === chain[chain.length-2]){
    setSel(chain.pop(), false); drawChainLine(); sayChain(); return;
  }
  if (chain.includes(t)) return;
  if (!chain.length){ chain = [t]; chainVal = t.val; setSel(t, true); drawChainLine(); sayChain(); sfx.select(1); return; }
  const last = chain[chain.length-1];
  if (Math.abs(last.r-t.r) > 1 || Math.abs(last.c-t.c) > 1) return;
  if (t.val !== chainVal){
    t.el.classList.add('shake'); setTimeout(()=>t.el.classList.remove('shake'), 230);
    sfx.deny();
    return;
  }
  chain.push(t); setSel(t, true); drawChainLine(); sayChain(); sfx.select(chain.length);
}
function sayChain(){
  if (!chain.length){ say('같은 값끼리 드래그로 연결하세요'); return; }
  say(`${fmt(chainVal)} 사슬 · ${chain.length}개${chain.length>=3 ? ' — 놓으면 팡' : ''}`, chain.length>=3 ? 'good' : '');
}
function release(){
  if (!dragging) return;
  dragging = false;
  if (!playing || locked) { clearChain(); return; }
  if (chain.length >= 3) doPop();
  else { clearChain(); sayChain(); }
}

/* ---------- pop / gravity ---------- */
function doPop(){
  locked = true;
  const n = chain.length;
  const mult = fever ? 2 : 1;
  const pts = n*n*10*mult;
  score += pts; roundScore += pts; pops++; longest = Math.max(longest, n);
  $('score').textContent = score;
  drawTarget();
  if (!fever){ gauge = Math.min(gauge + n, GAUGE_MAX); drawGauge(gauge/GAUGE_MAX); }
  const mid = chain[Math.floor(n/2)];
  const fl = document.createElement('div');
  fl.className = 'float-pts' + (fever ? ' fv' : '');
  fl.textContent = '+' + pts;
  fl.style.left = (posX(mid.c)+tpx()/2)+'px'; fl.style.top = (posY(mid.r)+tpx()/2)+'px';
  $('bfx').appendChild(fl); setTimeout(()=>fl.remove(), 950);
  const ex = chain.find(t => t.expr.deg !== null) || chain[0];
  sweepTo(ex);
  sfx.pop(n, fever);
  say(`${fmt(chainVal)} × ${n} 팡  +${pts}`, 'good');
  chain.forEach(t => { t.el.classList.add('pop'); grid[t.r][t.c] = null; });
  const popped = chain.slice();
  chain = []; chainVal = null; drawChainLine();
  setTimeout(() => {
    popped.forEach(t => t.el.remove());
    gravity();
    setTimeout(() => {
      locked = false;
      if (roundScore >= roundCfg().target){ roundClear(); return; }
      if (!fever && gauge >= GAUGE_MAX) startFever();
      ensureMoves(false);
    }, 270);
  }, 230);
}
function gravity(){
  for (let c=0; c<N; c++){
    const colTiles = [];
    for (let r=N-1; r>=0; r--) if (grid[r][c]) colTiles.push(grid[r][c]);
    let r = N-1;
    colTiles.forEach(t => { grid[r][c] = t; t.r = r; t.el.style.top = posY(r)+'px'; r--; });
    const missing = r + 1;
    for (let i=r; i>=0; i--){
      const t = makeTile(i, c, missing);
      grid[i][c] = t;
    }
  }
}

/* ---------- unit circle ---------- */
function sweepTo(t){
  if (t.expr.deg === null) return;
  $('sweep').style.transform = `rotate(${-t.expr.deg}deg)`;
  const cap = $('caption');
  cap.innerHTML = t.expr.fn ? `${t.expr.fn} ${fmt(t.expr.arg)} = ${fmt(t.val)}` : '';
  cap.style.opacity = 1;
  clearTimeout(cap._t); cap._t = setTimeout(()=>cap.style.opacity=.45, 1800);
}
function drawGauge(f){
  $('gaugearc').style.strokeDashoffset = 182.2 * (1 - f);
}

/* ---------- fever ---------- */
function startFever(){
  fever = true; feverT = FEVER_LEN;
  const posVals = [...new Set(roundPool().filter(e => !isNeg(e.val)).map(e => e.val))];
  hot = posVals.sort(()=>Math.random()-.5).slice(0,4);
  $('boardshell').classList.add('fever');
  say('피버! 점수 2배', 'warn');
  sfx.fever();
}
function endFever(){
  fever = false; gauge = 0; drawGauge(0);
  $('boardshell').classList.remove('fever');
}

/* ---------- status / timer ---------- */
function say(msg, cls){ const s = $('status'); s.innerHTML = msg; s.className = cls || ''; }
function tick(ts){
  if (!playing) return;
  if (prev){
    const dt = (ts - prev)/1000;
    time -= dt;
    if (fever){ feverT -= dt; drawGauge(Math.max(feverT/FEVER_LEN, 0)); if (feverT <= 0) endFever(); }
  }
  prev = ts;
  if (time <= 0){ time = 0; updateTimer(); gameOver(); return; }
  updateTimer();
  raf = requestAnimationFrame(tick);
}
function updateTimer(){
  const f = $('timefill'), tn = $('timen');
  f.style.width = (time/roundCfg().time*100)+'%';
  const cls = time <= 5 ? 'crit' : time <= 12 ? 'low' : '';
  f.className = cls; tn.className = cls;
  tn.textContent = time.toFixed(1);
}

/* ---------- flow ---------- */
function drawTarget(){
  const cfg = roundCfg();
  $('targetfill').style.width = Math.min(roundScore/cfg.target*100, 100) + '%';
  $('targetlbl').textContent = '목표 ' + cfg.target;
}
function startRound(){
  const cfg = roundCfg();
  roundScore = 0; time = cfg.time; locked = false; chain = []; chainVal = null;
  $('roundlbl').textContent = `${diff.name} · 라운드 ${roundIdx+1}`;
  drawTarget(); buildBoard(); drawChainLine(); updateTimer();
  say(`${diff.name} 라운드 ${roundIdx+1} — ${diff.desc}`);
  closeVeil();
  playing = true; prev = 0; raf = requestAnimationFrame(tick);
}
function roundClear(){
  playing = false; dragging = false; cancelAnimationFrame(raf);
  clearChain();
  const bonus = Math.ceil(time) * 10;
  score += bonus; $('score').textContent = score;
  $('rtitle').textContent = `라운드 ${roundIdx+1} 클리어!`;
  roundIdx++;
  const next = roundCfg();
  $('rbonus').textContent = '+' + bonus;
  $('rnext').innerHTML = `남은 시간 보너스<br><br>다음 라운드 목표 <b>${next.target}점</b> · ${next.time}초`;
  openCard('roundcard');
  sfx.round();
}
function gameOver(){
  playing = false; dragging = false; cancelAnimationFrame(raf);
  clearChain();
  saveBestOf(diffKey, score);
  best = bestOf(diffKey);
  drawBests();
  sfx.over();
  showGameOver({
    score,
    subHTML: `${diff.name} · 라운드 ${roundIdx+1}에서 종료 · 최고 기록 <b>${best}</b><br>팡 ${pops}회 · 최장 사슬 ${longest}개`,
    onRetry: () => startPang(diffKey),
  });
}

export function startPang(key){
  diffKey = key; diff = DIFFS[key]; best = bestOf(key);
  score = 0; pops = 0; longest = 0; gauge = 0; roundIdx = 0;
  fever = false; feverT = 0; hot = [];
  $('score').textContent = '0'; drawGauge(0); $('boardshell').classList.remove('fever');
  $('caption').textContent = '';
  closeVeil();
  hideWelcome();
  startRound();
}

export function initPang(){
  const bw = $('boardwrap');
  bw.addEventListener('pointerdown', e => {
    if (!playing || locked) return;
    dragging = true; bw.setPointerCapture(e.pointerId);
    tryAdd(cellAt(e.clientX, e.clientY));
  });
  bw.addEventListener('pointermove', e => { if (dragging) tryAdd(cellAt(e.clientX, e.clientY)); });
  bw.addEventListener('pointerup', release);
  bw.addEventListener('pointercancel', release);

  $('nextbtn').addEventListener('click', () => { closeVeil(); startRound(); });
  $('shuffle').addEventListener('click', () => {
    if (!playing || locked) return;
    dragging = false; clearChain();
    time = Math.max(time - 2, 0.1);
    reshuffleTiles();
    ensureMoves(true);
    say('보드 섞음 −2초', 'warn');
    sfx.shuffle();
  });

  window.addEventListener('resize', () => {
    for (let r=0;r<N;r++) for (let c=0;c<N;c++){
      const t = grid[r]?.[c]; if (!t) continue;
      t.el.style.left = posX(c)+'px'; t.el.style.top = posY(r)+'px';
    }
    drawChainLine();
  });

  registerStopper(() => {
    playing = false; dragging = false; cancelAnimationFrame(raf);
    clearChain();
  });

  buildBoard(); // 웰컴 화면 뒤 배경 보드
}
