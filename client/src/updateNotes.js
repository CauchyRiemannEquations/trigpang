/* 업데이트 내역 모달 */
import { $, openCard, closeVeil } from './ui.js';

const NOTES = [
  {
    date: '2026-07-26 · v0.3',
    items: [
      '메인 화면 개편 — 특수각·일반각 모드 버튼, 난이도 가로 스크롤 선택',
      '플레이 방법 · 업데이트 내역 · Contact 추가',
      '홈 화면 설치(PWA) 지원 — 파인애플 아이콘',
      '시퀀스팡과 동일한 Vite 프로젝트 구조로 전환',
    ],
  },
  {
    date: '2026-07-26 · v0.2',
    items: [
      '난이도 선택제: 쉬움 · 보통 · 어려움 · 고수(tan) · 지옥(csc·sec·cot)',
      '일반각 모드 — 4방향 스와이프 분류, 오답 시 단위원 리플레이',
      '분수를 세로 분수꼴로 렌더링',
      '난이도별 최고 기록 저장',
    ],
  },
  {
    date: '2026-07-26 · v0.1',
    items: [
      '시퀀스팡 디자인 리스킨 — 파인애플 🍍 테마',
      '6×6 값 매칭 사슬 팡 · 단위원 게이지 피버 · 라운드제',
      '첫 공개 빌드 (trigpang.vercel.app)',
    ],
  },
];

export function initUpdateNotes(){
  $('notes-list').innerHTML = NOTES.map(n =>
    `<div class="note-item"><div class="note-date">${n.date}</div><ul>${n.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`
  ).join('');
  $('btn-notes').addEventListener('click', () => openCard('notescard'));
  $('notes-close').addEventListener('click', closeVeil);
}
