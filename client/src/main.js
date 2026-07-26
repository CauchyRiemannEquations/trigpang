import './style.css';
import { $, initUI, goHome } from './ui.js';
import { initPang, startPang } from './pangGame.js';
import { initSwipe, startSwipe } from './swipeMode.js';
import { initHowToPlay } from './howToPlay.js';
import { initUpdateNotes } from './updateNotes.js';
import { unlockAudio, sfx } from './sound.js';

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

/* 효과음: 첫 입력에서 오디오 잠금 해제 + 버튼 공통 클릭음 (정답 패드는 자체 효과음 사용) */
document.addEventListener('pointerdown', unlockAudio, { once: true });
document.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b && !b.classList.contains('sw-pad')) sfx.click();
});

/* PWA 서비스 워커 */
if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
