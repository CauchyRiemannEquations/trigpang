/* 효과음: Web Audio 합성 — 외부 오디오 파일 없이 동작 */

let ctx = null, master = null;

function ensureCtx(){
  if (!ctx){
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // 여러 음이 겹쳐도 깨지지 않게 컴프레서를 마스터 뒤에 둠
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(comp);
    comp.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* 브라우저 정책상 첫 사용자 입력 때 오디오를 깨워야 함 */
export function unlockAudio(){
  ensureCtx();
}

function tone({freq = 440, to = 0, type = 'triangle', dur = 0.15, vol = 0.5, delay = 0}){
  if (!ensureCtx()) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise({dur = 0.2, vol = 0.35, from = 900, to = 3200, delay = 0}){
  if (!ensureCtx()) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.Q.value = 1;
  bp.frequency.setValueAtTime(from, t0);
  bp.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + dur);
}

/* C 펜타토닉 사다리 — 사슬이 길어질수록 음이 올라감 */
const LADDER = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];

export const sfx = {
  /* 사슬에 타일 추가 (n = 현재 사슬 길이) */
  select(n){
    tone({freq: LADDER[Math.min(n - 1, LADDER.length - 1)], dur: 0.09, vol: 0.45});
  },
  /* 값이 다른 타일을 이으려 함 */
  deny(){
    tone({freq: 180, to: 130, type: 'square', dur: 0.12, vol: 0.22});
  },
  /* 팡! (n = 터진 타일 수) */
  pop(n, fever){
    const base = fever ? 659 : 523;
    const steps = n >= 6 ? [0, 4, 7, 12] : [0, 4, 7];
    steps.forEach((st, i) =>
      tone({freq: base * Math.pow(2, st / 12), delay: i * 0.05, dur: 0.14, vol: 0.5}));
    noise({dur: 0.22, vol: fever ? 0.4 : 0.3, from: 1200, to: 4200});
  },
  /* 피버 시작 */
  fever(){
    tone({freq: 330, to: 1320, type: 'sawtooth', dur: 0.45, vol: 0.35});
    [0, 4, 7, 12].forEach((st, i) =>
      tone({freq: 784 * Math.pow(2, st / 12), delay: 0.2 + i * 0.06, dur: 0.12, vol: 0.4}));
  },
  /* 보드 섞기 */
  shuffle(){
    noise({dur: 0.28, vol: 0.35, from: 500, to: 2400});
  },
  /* 라운드 클리어 팡파르 */
  round(){
    [523, 659, 784, 1047].forEach((f, i) =>
      tone({freq: f, delay: i * 0.11, dur: i === 3 ? 0.4 : 0.14, vol: 0.5}));
  },
  /* 게임 오버 */
  over(){
    [523, 415, 349, 262].forEach((f, i) =>
      tone({freq: f, type: 'sine', delay: i * 0.16, dur: i === 3 ? 0.5 : 0.2, vol: 0.45}));
  },
  /* 일반각 모드 정답 (streak = 연속 정답 수) */
  good(streak){
    const up = Math.min(streak, 8);
    tone({freq: 880 * Math.pow(2, up / 24), dur: 0.09, vol: 0.45});
    tone({freq: 1319 * Math.pow(2, up / 24), delay: 0.08, dur: 0.14, vol: 0.45});
  },
  /* 일반각 모드 오답 */
  bad(){
    tone({freq: 200, to: 120, type: 'square', dur: 0.3, vol: 0.3});
  },
  /* 버튼 클릭 */
  click(){
    tone({freq: 900, dur: 0.05, vol: 0.28});
  },
};
