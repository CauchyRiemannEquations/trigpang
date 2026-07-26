import './style.css';
import { $, initUI, goHome } from './ui.js';
import { initPang, startPang } from './pangGame.js';
import { initSwipe, startSwipe } from './swipeMode.js';
import { initHowToPlay } from './howToPlay.js';
import { initUpdateNotes } from './updateNotes.js';

initUI();
initPang();
initSwipe();
initHowToPlay();
initUpdateNotes();

/* 모드 선택: 특수각 → 난이도 가로 스크롤 펼치기 */
$('btn-special').addEventListener('click', () => {
  const sc = $('diff-scroll');
  sc.hidden = !sc.hidden;
});
document.querySelectorAll('.diff-card').forEach(b =>
  b.addEventListener('click', () => startPang(b.dataset.diff)));
$('btn-swipe').addEventListener('click', startSwipe);
$('sw-exit').addEventListener('click', goHome);

/* PWA 서비스 워커 */
if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
