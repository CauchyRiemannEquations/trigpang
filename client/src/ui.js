/* 화면 전환 · 공용 모달(베일) · 최고 기록 표시 */
import { DIFFS, bestOf } from './gameConstants.js';

export const $ = id => document.getElementById(id);

const CARD_IDS = ['overcard', 'roundcard', 'replaycard', 'htpcard', 'notescard'];
const stoppers = [];
let retryHandler = null;

/* goHome 때 실행할 정지 훅 (타이머 취소 등) */
export const registerStopper = fn => stoppers.push(fn);

export function openCard(id){
  CARD_IDS.forEach(c => { $(c).hidden = c !== id; });
  $('veil').hidden = false;
}
export function closeVeil(){
  $('veil').hidden = true;
  CARD_IDS.forEach(c => { $(c).hidden = true; });
}

export function showGameOver({score, subHTML, onRetry}){
  retryHandler = onRetry;
  $('finalscore').textContent = score;
  $('finalsub').innerHTML = subHTML;
  openCard('overcard');
}

export function drawBests(){
  [...Object.keys(DIFFS), 'swipe'].forEach(k => {
    const el = $('best-' + k);
    if (el) el.textContent = '최고 ' + bestOf(k);
  });
}

export function hideWelcome(){ $('welcome').classList.add('hide'); }

export function goHome(){
  stoppers.forEach(f => f());
  closeVeil();
  $('swipemode').classList.add('hide');
  drawBests();
  $('welcome').classList.remove('hide');
}

export function initUI(){
  $('retrybtn').addEventListener('click', () => { if (retryHandler) retryHandler(); });
  $('homebtn').addEventListener('click', goHome);
  drawBests();
}
