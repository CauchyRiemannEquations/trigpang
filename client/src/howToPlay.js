/* 플레이 방법 모달 */
import { $, openCard, closeVeil } from './ui.js';

export function initHowToPlay(){
  $('btn-howto').addEventListener('click', () => openCard('htpcard'));
  $('htp-close').addEventListener('click', closeVeil);
}
