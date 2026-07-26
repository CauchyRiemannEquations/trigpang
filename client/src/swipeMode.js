/* 일반각 팡: sin(π−x) 등을 4방향으로 축약 분류. 오답이면 단위원 리플레이 */
import { SINV, COSV, fmt, SW_TIME, SW_X, SW_T, bestOf, saveBestOf } from './gameConstants.js';
import { $, openCard, closeVeil, showGameOver, hideWelcome, registerStopper, drawBests } from './ui.js';

let swScore = 0, swStreak = 0, swMaxStreak = 0, swHits = 0, swMiss = 0;
let swTime = SW_TIME, swPlaying = false, swRaf = 0, swPrev = 0, swCard = null, swLock = false;

function swDeal(){
  let fn, t;
  do {
    fn = Math.random() < .5 ? 'sin' : 'cos';
    t = SW_T[Math.floor(Math.random() * SW_T.length)];
  } while (swCard && swCard.fn === fn && swCard.t === t);
  swCard = {fn, t, ans: t[fn]};
  $('sw-card').innerHTML = `<span class="fn ${fn}">${fn}</span>(${fmt(t.arg)})`;
  $('sw-card').classList.remove('good','bad');
}
function swSay(){
  $('sw-streak').textContent = swStreak >= 2 ? `${swStreak}연속 정답!` : '이 식은 무엇과 같을까?';
}
function swTick(ts){
  if (!swPlaying) return;
  if (swPrev) swTime -= (ts - swPrev)/1000;
  swPrev = ts;
  if (swTime <= 0){ swTime = 0; swDrawTime(); swOver(); return; }
  swDrawTime();
  swRaf = requestAnimationFrame(swTick);
}
function swDrawTime(){
  $('sw-timen').textContent = swTime.toFixed(1);
  const f = $('sw-timefill');
  f.style.width = (swTime/SW_TIME*100) + '%';
  f.classList.toggle('crit', swTime <= 8);
}
function swPause(){ swPlaying = false; cancelAnimationFrame(swRaf); }
function swResume(){ if (swTime <= 0) return; swPlaying = true; swPrev = 0; swRaf = requestAnimationFrame(swTick); }
function swStop(){ swPause(); swLock = false; }

export function startSwipe(){
  swScore = 0; swStreak = 0; swMaxStreak = 0; swHits = 0; swMiss = 0;
  swTime = SW_TIME; swCard = null; swLock = false;
  $('sw-score').textContent = '0';
  closeVeil();
  hideWelcome();
  $('swipemode').classList.remove('hide');
  swDeal(); swSay(); swDrawTime();
  swPlaying = true; swPrev = 0; swRaf = requestAnimationFrame(swTick);
}
function swOver(){
  swStop();
  const prevBest = bestOf('swipe');
  saveBestOf('swipe', swScore);
  drawBests();
  showGameOver({
    score: swScore,
    subHTML: `일반각 모드 · 정답 ${swHits} · 오답 ${swMiss} · 최대 연속 ${swMaxStreak}<br>최고 기록 <b>${Math.max(swScore, prevBest)}</b>`,
    onRetry: startSwipe,
  });
}
const swPadOf = a => document.querySelector(`.sw-pad[data-ans="${a}"]`);
function swAnswer(ans){
  if (!swPlaying || swLock) return;
  const card = $('sw-card');
  if (ans === swCard.ans){
    swHits++; swStreak++; swMaxStreak = Math.max(swMaxStreak, swStreak);
    const pts = 100 + Math.min(swStreak - 1, 10) * 20;
    swScore += pts;
    $('sw-score').textContent = swScore;
    card.classList.add('good');
    const pad = swPadOf(ans); pad.classList.add('hit');
    swLock = true;
    setTimeout(() => { pad.classList.remove('hit'); swLock = false; swDeal(); swSay(); }, 220);
  } else {
    swMiss++; swStreak = 0;
    card.classList.add('bad');
    const wrongPad = swPadOf(ans), rightPad = swPadOf(swCard.ans);
    wrongPad.classList.add('miss'); rightPad.classList.add('hit');
    swLock = true;
    swPause();
    setTimeout(() => {
      wrongPad.classList.remove('miss'); rightPad.classList.remove('hit');
      swReplay();
    }, 550);
  }
}
function swReplay(){
  const {fn, t, ans} = swCard;
  const T = t.deg(SW_X);
  const FNV = fn === 'sin' ? SINV : COSV;
  const ansAt30 = ans.replace('x', SW_X + '°');
  $('rp-x').style.transform = `rotate(${-SW_X}deg)`;
  $('rp-t').style.transform = `rotate(${-SW_X}deg)`;
  $('rp-cap').innerHTML = `${fn}(${fmt(t.arg)}) = ${fmt(ans)}`;
  $('rp-sub').innerHTML = `x = ${SW_X}° 라면 : ${fn} ${T}° = ${fmt(FNV[T])} = ${fmt(ansAt30)}`;
  openCard('replaycard');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    $('rp-t').style.transform = `rotate(${-T}deg)`;
  }));
}

export function initSwipe(){
  $('rp-continue').addEventListener('click', () => {
    closeVeil();
    swLock = false; swDeal(); swSay(); swResume();
  });
  document.querySelectorAll('.sw-pad').forEach(p =>
    p.addEventListener('click', () => swAnswer(p.dataset.ans)));

  /* 카드 스와이프 제스처 */
  const card = $('sw-card');
  let sx = 0, sy = 0, on = false;
  card.addEventListener('pointerdown', e => {
    on = true; sx = e.clientX; sy = e.clientY;
    try { card.setPointerCapture(e.pointerId); } catch {}
  });
  card.addEventListener('pointerup', e => {
    if (!on) return; on = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    swAnswer(Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? '−cos x' : 'cos x')
      : (dy > 0 ? '−sin x' : 'sin x'));
  });

  document.addEventListener('keydown', e => {
    if (!swPlaying) return;
    const map = {ArrowUp:'sin x', ArrowDown:'−sin x', ArrowLeft:'cos x', ArrowRight:'−cos x'};
    if (map[e.key]){ e.preventDefault(); swAnswer(map[e.key]); }
  });

  registerStopper(swStop);
}
