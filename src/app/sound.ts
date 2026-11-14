// 효과음과 배경음악. 소리 파일 없이 Web Audio로 만든다 (v3.3.3의 SoundFX 4종을 옮기고 늘림).
// 브라우저는 사용자가 한 번 누르기 전까지 소리를 막으므로, 첫 클릭 때 시작한다.

type Sfx = 'tick' | 'event' | 'treasure' | 'danger' | 'hit' | 'crit' | 'miss' | 'click' | 'win' | 'lose' | 'line';
type Bgm = 'sea' | 'home' | 'battle' | null;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxOn = true;
let bgmOn = true;
let mode: Bgm = null;
let bgmTimer: ReturnType<typeof setInterval> | null = null;
let nextNoteAt = 0;
let step = 0;

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number, out: AudioNode | null = master) {
  if (!ctx || !out) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0008, at + dur);
  o.connect(g); g.connect(out);
  o.start(at); o.stop(at + dur + 0.02);
}

function noise(at: number, dur: number, gain: number) {
  if (!ctx || !master) return;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const g = ctx.createGain();
  g.gain.value = gain;
  src.buffer = buf; src.connect(g); g.connect(master);
  src.start(at);
}

/** 효과음 */
export function sfx(type: Sfx) {
  if (!sfxOn || !ensure() || !ctx) return;
  const t = ctx.currentTime;
  switch (type) {
    case 'tick': tone(520, t, 0.05, 'triangle', 0.03); break;
    case 'line': tone(880, t, 0.04, 'sine', 0.012); break;
    case 'click': tone(660, t, 0.03, 'square', 0.015); break;
    case 'event': tone(440, t, 0.12, 'square', 0.06); tone(660, t + 0.08, 0.16, 'square', 0.06); break;
    case 'treasure': tone(587.33, t, 0.12, 'sine', 0.08); tone(880, t + 0.09, 0.12, 'sine', 0.08); tone(1174.66, t + 0.18, 0.2, 'sine', 0.08); break;
    case 'danger': tone(220, t, 0.14, 'sawtooth', 0.07); tone(165, t + 0.12, 0.2, 'sawtooth', 0.07); break;
    case 'hit': noise(t, 0.06, 0.08); tone(150, t, 0.07, 'square', 0.04); break;
    case 'crit': noise(t, 0.12, 0.14); tone(110, t, 0.14, 'sawtooth', 0.07); tone(330, t + 0.05, 0.1, 'square', 0.04); break;
    case 'miss': tone(900, t, 0.05, 'sine', 0.02); tone(1200, t + 0.03, 0.05, 'sine', 0.015); break;
    case 'win': [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, t + i * 0.11, 0.22, 'square', 0.05)); break;
    case 'lose': [392, 349.23, 293.66, 220].forEach((f, i) => tone(f, t + i * 0.16, 0.3, 'triangle', 0.06)); break;
  }
}

// ---------------------------------------------------------------- 배경음악
// 8마디 진행을 되풀이한다. 바다는 장조 5음계로 느긋하게, 전투는 단조로 빠르게.
const N = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const SONGS = {
  sea: { bpm: 84, chords: [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], scale: [60, 62, 64, 67, 69, 72, 74, 76], lead: 'triangle' as OscillatorType, vol: 0.035 },
  home: { bpm: 72, chords: [[53, 57, 60], [50, 53, 57], [48, 52, 55], [48, 52, 55]], scale: [65, 67, 69, 72, 74, 77], lead: 'sine' as OscillatorType, vol: 0.04 },
  battle: { bpm: 132, chords: [[45, 48, 52], [41, 45, 48], [43, 47, 50], [40, 44, 47]], scale: [57, 60, 62, 64, 67, 69, 72], lead: 'square' as OscillatorType, vol: 0.022 },
};
// 걸음마다 멜로디 음 (음계 안의 번호, -1은 쉼). 손으로 짠 짧은 뱃노래 꼴
const MELODY = [0, -1, 2, 3, 4, -1, 3, 2, 1, -1, 2, 0, 1, -1, -1, -1, 2, -1, 3, 4, 5, -1, 4, 3, 4, -1, 3, 1, 0, -1, -1, -1];

function schedule() {
  if (!ctx || !musicBus || !mode) return;
  const song = SONGS[mode];
  const stepDur = 60 / song.bpm / 2; // 8분음표
  while (nextNoteAt < ctx.currentTime + 0.4) {
    const bar = Math.floor(step / 8) % song.chords.length;
    const chord = song.chords[bar];
    const s8 = step % 8;
    // 베이스: 마디 첫 박과 셋째 박
    if (s8 === 0 || s8 === 4) tone(N(chord[0] - 12), nextNoteAt, stepDur * 3.5, 'triangle', song.vol * 1.6, musicBus);
    // 화음 펼침
    if (s8 % 2 === 1) tone(N(chord[(s8 >> 1) % 3]), nextNoteAt, stepDur * 1.5, 'sine', song.vol * 0.7, musicBus);
    // 멜로디
    const m = MELODY[step % MELODY.length];
    if (m >= 0) tone(N(song.scale[m % song.scale.length]), nextNoteAt, stepDur * 1.8, song.lead, song.vol, musicBus);
    // 전투는 북소리
    if (mode === 'battle' && s8 % 2 === 0) noise(nextNoteAt, 0.04, 0.03);
    nextNoteAt += stepDur;
    step++;
  }
}

/** 배경음악을 바꾼다. 같은 곡이면 그대로 */
export function music(next: Bgm) {
  if (next === mode && bgmTimer) return;
  mode = next;
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  if (!bgmOn || !mode || !ensure() || !ctx) return;
  nextNoteAt = ctx.currentTime + 0.1;
  step = 0;
  bgmTimer = setInterval(schedule, 100);
}

/** 지금 소리 상태 (확인용) */
export function soundState() { return { sfx: sfxOn, bgm: bgmOn, mode, playing: !!bgmTimer }; }
if (typeof window !== 'undefined') (window as unknown as { __soundState?: typeof soundState }).__soundState = soundState;

export function setSound(opts: { sfx?: boolean; bgm?: boolean }) {
  if (opts.sfx !== undefined) sfxOn = opts.sfx;
  if (opts.bgm !== undefined) {
    bgmOn = opts.bgm;
    const m = mode;
    mode = null;
    if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    if (bgmOn) music(m);
    else mode = m;
  }
}

// 첫 클릭 때 소리를 깨우고, 버튼마다 작은 소리
if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', (e) => {
    const first = !ctx;
    ensure();
    if (first && bgmOn && mode) { const m = mode; mode = null; music(m); }
    const el = (e.target as HTMLElement | null)?.closest?.('button, .opt, select');
    if (el && !(el as HTMLButtonElement).disabled) sfx('click');
  }, { capture: true });
}
