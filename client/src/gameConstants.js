/* 삼각팡 공통 상수: 값 테이블 · 난이도 · 일반각 변환 */

export const N = 6, GAUGE_MAX = 16, FEVER_LEN = 8;

/* sin·cos 특수각, 육십분법 + 호도법 */
export const SINV = {0:'0',30:'1/2',45:'√2/2',60:'√3/2',90:'1',120:'√3/2',135:'√2/2',150:'1/2',180:'0',210:'−1/2',225:'−√2/2',240:'−√3/2',270:'−1',300:'−√3/2',315:'−√2/2',330:'−1/2'};
export const COSV = {0:'1',30:'√3/2',45:'√2/2',60:'1/2',90:'0',120:'−1/2',135:'−√2/2',150:'−√3/2',180:'−1',210:'−√3/2',225:'−√2/2',240:'−1/2',270:'0',300:'1/2',315:'√2/2',330:'√3/2'};
export const RAD = {0:'0',30:'π/6',45:'π/4',60:'π/3',90:'π/2',120:'2π/3',135:'3π/4',150:'5π/6',180:'π',210:'7π/6',225:'5π/4',240:'4π/3',270:'3π/2',300:'5π/3',315:'7π/4',330:'11π/6'};
/* tan: 90°·270°는 정의되지 않으므로 제외. csc·sec·cot도 각각 정의되는 각만 수록 */
export const TANV = {0:'0',30:'√3/3',45:'1',60:'√3',120:'−√3',135:'−1',150:'−√3/3',180:'0',210:'√3/3',225:'1',240:'√3',300:'−√3',315:'−1',330:'−√3/3'};
export const CSCV = {30:'2',45:'√2',60:'2√3/3',90:'1',120:'2√3/3',135:'√2',150:'2',210:'−2',225:'−√2',240:'−2√3/3',270:'−1',300:'−2√3/3',315:'−√2',330:'−2'};
export const SECV = {0:'1',30:'2√3/3',45:'√2',60:'2',120:'−2',135:'−√2',150:'−2√3/3',180:'−1',210:'−2√3/3',225:'−√2',240:'−2',300:'2',315:'√2',330:'2√3/3'};
export const COTV = {30:'√3',45:'1',60:'√3/3',90:'0',120:'−√3/3',135:'−1',150:'−√3',210:'√3',225:'1',240:'√3/3',270:'0',300:'−√3/3',315:'−1',330:'−√3'};

export const EXPRS = [];
const pushFn = (fn, table) => {
  for (const d in table){
    const deg = +d;
    EXPRS.push({fn, arg:d+'°', deg, val:table[d], rad:false});
    EXPRS.push({fn, arg:RAD[d], deg, val:table[d], rad:true});
  }
};
pushFn('sin', SINV); pushFn('cos', COSV); pushFn('tan', TANV);
pushFn('csc', CSCV); pushFn('sec', SECV); pushFn('cot', COTV);
['0','1/2','√2/2','√3/2','1','−1/2','−√2/2','−√3/2','−1','√3/3','√3','−√3/3','−√3','2','√2','2√3/3','−2','−√2','−2√3/3']
  .forEach(v => EXPRS.push({fn:null, arg:v, deg:null, val:v, rad:false}));

export const isNeg = v => v.startsWith('−');

/* a/b 꼴을 세로 분수 마크업으로 변환 (예: 1/2, √3/2, 11π/6, −√2/2) */
export const fmt = s => String(s).replace(/(−?)([0-9√π]+)\/([0-9]+)/g,
  (_, sg, top, bot) => `${sg}<span class="frac"><span>${top}</span><span>${bot}</span></span>`);
export const tileHTML = e => e.fn
  ? `<span class="fn ${e.fn}">${e.fn}</span><b>${fmt(e.arg)}</b>`
  : `<b class="num">${fmt(e.arg)}</b>`;

/* 난이도 */
export const Q1 = [0,30,45,60,90];
export const HALF = [0,30,45,60,90,120,135,150,180];
export const ALLDEG = Object.keys(SINV).map(Number);
export const DIFFS = {
  easy:   {name:'쉬움',   desc:'1사분면 · 육십분법', angles:Q1,     rad:false, tan:false, time:40, target0:500,  mult:1.3},
  normal: {name:'보통',   desc:'둔각까지 · 호도법',  angles:HALF,   rad:true,  tan:false, time:45, target0:900,  mult:1.35},
  hard:   {name:'어려움', desc:'전 범위 일반각',     angles:ALLDEG, rad:true,  tan:false, time:45, target0:1300, mult:1.4},
  master: {name:'고수',   desc:'전 범위 + tan',      angles:ALLDEG, rad:true,  tan:true,  time:45, target0:1500, mult:1.4},
  hell:   {name:'지옥',   desc:'csc · sec · cot 총출동', angles:ALLDEG, rad:true, tan:true, recip:true, time:45, target0:1800, mult:1.45},
};
export const RECIP = ['csc','sec','cot'];

/* 난이도별 최고 기록 (localStorage) */
export const BEST_KEY = 'trigpang-best';
export const bestOf = key => +(localStorage.getItem(BEST_KEY + '-' + key) || (key === 'easy' ? localStorage.getItem(BEST_KEY) : 0) || 0);
export const saveBestOf = (key, score) => {
  if (score > bestOf(key)) localStorage.setItem(BEST_KEY + '-' + key, score);
};

/* 일반각 모드: 변환 7종 — 위=sin x, 아래=−sin x, 왼쪽=cos x, 오른쪽=−cos x */
export const SW_TIME = 60, SW_X = 30; // 리플레이 예시는 항상 x = 30°
export const SW_T = [
  {arg:'−x',       sin:'−sin x', cos:'cos x',  deg: x => (360 - x) % 360},
  {arg:'π − x',    sin:'sin x',  cos:'−cos x', deg: x => 180 - x},
  {arg:'π + x',    sin:'−sin x', cos:'−cos x', deg: x => 180 + x},
  {arg:'π/2 − x',  sin:'cos x',  cos:'sin x',  deg: x => 90 - x},
  {arg:'π/2 + x',  sin:'cos x',  cos:'−sin x', deg: x => 90 + x},
  {arg:'3π/2 − x', sin:'−cos x', cos:'−sin x', deg: x => 270 - x},
  {arg:'3π/2 + x', sin:'−cos x', cos:'sin x',  deg: x => 270 + x},
];
