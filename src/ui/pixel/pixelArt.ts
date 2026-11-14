// 코드로 그리는 도트 캐릭터(얼굴 24×24, 전신 20×24)와 도트 장면. v3.4.0 pixel-art.js 를 옮겼다.
// 같은 인물은 언제나 같은 모습이다 (docs/01_기획/04_UI_그래픽_방향.md 3장).
import type { Species } from '../../core/types';

type Pair = [string, string];
const SKIN: Record<'human' | 'fish' | 'mink' | 'sky', Pair[]> = {
  human: [['#f6c89a', '#d99a6c'], ['#eab183', '#c98458'], ['#c98a5c', '#a0643c'], ['#fbd9b5', '#e0aa80']],
  fish: [['#8cc8d8', '#5a9ab0'], ['#9ad0b0', '#62a084'], ['#a8b4e0', '#7482b8']],
  mink: [['#f0dcc0', '#c8ac88'], ['#e8b070', '#b87c40'], ['#d8d8e0', '#a0a0b0']],
  sky: [['#fbe2c4', '#e2b48c'], ['#f6c89a', '#d99a6c']],
};
const HAIR: Pair[] = [['#2a2430', '#16121c'], ['#5a3a22', '#3a2412'], ['#c8742a', '#96501a'], ['#e8c860', '#b8963a'],
  ['#b8322a', '#84201a'], ['#3a6a9a', '#244a70'], ['#3f8a5a', '#2a6440'], ['#e8a0b8', '#b86e88'], ['#7a52a8', '#55387a']];
const GRAY: Pair = ['#dcdfe6', '#a8acb8'];
const CIVIL: Pair[] = [['#4a8ac8', '#2f6498'], ['#58a070', '#3a7850'], ['#c89040', '#98682a'], ['#a868b0', '#7a4884']];

export interface Who {
  key: string;                // 고정 무작위의 씨앗 (id나 이름)
  gender?: 'm' | 'f'; age?: number; species?: Species;
  faction?: 'civil' | 'pirate' | 'marine' | 'rev';
}
interface Desc {
  seed: number; gender: 'm' | 'f'; species: 'human' | 'fish' | 'mink' | 'sky'; faction: NonNullable<Who['faction']>;
  stage: 'child' | 'adult' | 'old'; skin: Pair; hair: Pair; style: number; civil: Pair; smile: number; key: string;
}

export function hash(str: string) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function describe(w: Who): Desc {
  const seed = hash(w.key);
  const age = w.age ?? 25;
  const gender = w.gender ?? (seed % 2 ? 'f' : 'm');
  const species = w.species === 'fishman' ? 'fish' : w.species === 'mink' ? 'mink' : w.species === 'skypiean' ? 'sky' : 'human';
  const faction = w.faction ?? 'civil';
  const stage = age <= 14 ? 'child' : age >= 55 ? 'old' : 'adult';
  const styles = gender === 'f' ? [2, 3, 5, 2, 3] : [0, 1, 0, 4, 1];
  return {
    seed, gender, species, faction, stage,
    skin: SKIN[species][(seed >>> 3) % SKIN[species].length],
    hair: stage === 'old' ? GRAY : HAIR[(seed >>> 6) % HAIR.length],
    style: styles[(seed >>> 10) % styles.length],
    civil: CIVIL[(seed >>> 13) % CIVIL.length],
    smile: (seed >>> 16) % 3,
    key: [seed, gender, species, faction, stage].join('|'),
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!; x.imageSmoothingEnabled = false;
  return [c, x];
}

/** 불투명 픽셀 둘레에 1픽셀 외곽선 */
function outline(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data, src = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) src[i] = d[i * 4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (src[i]) continue;
    if ((x > 0 && src[i - 1]) || (x < w - 1 && src[i + 1]) || (y > 0 && src[i - w]) || (y < h - 1 && src[i + w])) {
      d[i * 4] = 0x2a; d[i * 4 + 1] = 0x1a; d[i * 4 + 2] = 0x12; d[i * 4 + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function clothOf(d: Desc): Pair {
  if (d.stage === 'child') return ['#38a898', '#267868'];
  if (d.faction === 'marine') return ['#f0f4f8', '#b8c4d0'];
  if (d.faction === 'pirate') return ['#c8402e', '#902a1e'];
  if (d.faction === 'rev') return ['#3f6244', '#2a4430'];
  return d.civil;
}

const faceCache = new Map<string, string>();
export function faceURL(w: Who): string {
  const d = describe(w);
  const hit = faceCache.get(d.key);
  if (hit) return hit;
  const [c, x] = makeCanvas(24, 24);
  const r = (px: number, py: number, ww: number, hh: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, ww, hh); };
  const [sk, skS] = d.skin, [hc, hs] = d.hair, [cl, clS] = clothOf(d);
  const child = d.stage === 'child', old = d.stage === 'old';
  if (d.style === 2) { r(4, 6, 3, 14, hs); r(17, 6, 3, 14, hs); }
  if (d.style === 5) { r(4, 6, 3, 10, hs); r(17, 6, 3, 10, hs); }
  if (d.style === 3) { r(18, 3, 3, 4, hc); r(20, 7, 2, 7, hc); r(20, 12, 2, 2, hs); }
  if (d.faction === 'rev' && !child) r(4, 3, 16, 16, '#2a4430');
  r(4, 19, 16, 5, cl); r(3, 21, 18, 3, cl); r(4, 22, 16, 2, clS);
  r(10, 17, 4, 3, skS); r(10, 19, 4, 1, sk);
  if (d.faction === 'marine' && !child) { r(9, 20, 6, 2, '#2a4a8a'); r(11, 22, 2, 2, '#2a4a8a'); }
  if (d.faction === 'pirate' && !child) { r(10, 19, 4, 4, sk); r(4, 19, 2, 5, '#e8c040'); }
  r(7, 5, 10, 12, sk); r(6, 6, 12, 10, sk); r(8, 17, 8, 1, sk);
  r(16, 8, 2, 7, skS); r(8, 16, 8, 1, skS);
  r(5, 10, 1, 3, sk); r(18, 10, 1, 3, skS);
  if (d.species === 'fish') { r(4, 9, 2, 4, skS); r(18, 9, 2, 4, skS); r(7, 14, 1, 1, skS); r(7, 12, 1, 1, skS); }
  const eyeH = child ? 3 : 2, ey = 10;
  r(8, ey, 2, eyeH, '#1c1420'); r(14, ey, 2, eyeH, '#1c1420');
  r(8, ey, 1, 1, '#ffffff'); r(14, ey, 1, 1, '#ffffff');
  if (!child) { r(8, 8, 3, 1, hs); r(13, 8, 3, 1, hs); }
  r(12, 12, 1, 2, skS);
  if (d.smile === 0) { r(10, 14, 4, 1, '#8a3a2a'); r(9, 13, 1, 1, '#8a3a2a'); r(14, 13, 1, 1, '#8a3a2a'); }
  else if (d.smile === 1) r(10, 14, 4, 1, '#8a3a2a');
  else { r(10, 14, 4, 2, '#8a3a2a'); r(11, 14, 2, 1, '#ffffff'); }
  if (child) { r(6, 13, 2, 1, '#f09a8a'); r(16, 13, 2, 1, '#f09a8a'); }
  if (d.gender === 'f' && !child) { r(7, 9, 1, 1, '#1c1420'); r(16, 9, 1, 1, '#1c1420'); }
  if (old) {
    r(7, 12, 1, 1, skS); r(16, 12, 1, 1, skS);
    if (d.gender === 'm') { r(8, 15, 8, 3, hc); r(9, 18, 6, 1, hs); r(9, 13, 6, 1, hc); r(10, 14, 4, 1, '#8a3a2a'); }
  }
  if (d.style === 4) { r(7, 4, 10, 2, hs); r(6, 5, 1, 3, hs); r(17, 5, 1, 3, hs); }
  else {
    r(6, 3, 12, 4, hc); r(7, 2, 10, 1, hc); r(5, 5, 2, 5, hc); r(17, 5, 2, 5, hc);
    r(7, 7, 4, 1, hc); r(13, 7, 3, 1, hc); r(8, 3, 6, 1, hs);
    if (d.style === 1) { r(7, 1, 2, 1, hc); r(11, 0, 2, 2, hc); r(15, 1, 2, 1, hc); r(4, 4, 1, 2, hc); r(19, 4, 1, 2, hc); }
    if (d.style === 2 || d.style === 5) { r(5, 6, 2, 6, hc); r(17, 6, 2, 6, hc); }
  }
  if (d.species === 'mink') { r(5, 1, 3, 4, hc); r(16, 1, 3, 4, hc); r(6, 2, 1, 2, '#f0a8b0'); r(17, 2, 1, 2, '#f0a8b0'); r(11, 12, 2, 1, '#3a2a2a'); }
  if (d.species === 'sky') { r(2, 12, 3, 5, '#ffffff'); r(19, 12, 3, 5, '#ffffff'); }
  if (!child) {
    if (d.faction === 'marine') { r(6, 1, 12, 5, '#f4f8fa'); r(7, 0, 10, 1, '#f4f8fa'); r(5, 6, 14, 1, '#2a4a8a'); r(11, 2, 2, 2, '#2a4a8a'); r(6, 5, 12, 1, '#c4d0dc'); }
    else if (d.faction === 'pirate') { r(6, 2, 12, 4, '#c8322a'); r(7, 1, 10, 1, '#c8322a'); r(6, 5, 12, 1, '#902018'); r(18, 5, 2, 4, '#c8322a'); r(8, 3, 1, 1, '#f8e8b8'); r(12, 3, 1, 1, '#f8e8b8'); r(15, 2, 1, 1, '#f8e8b8'); }
    else if (d.faction === 'rev') { r(5, 2, 14, 4, '#3f6244'); r(6, 1, 12, 1, '#3f6244'); r(4, 5, 3, 9, '#3f6244'); r(17, 5, 3, 9, '#3f6244'); }
  }
  outline(x, 24, 24);
  const url = c.toDataURL('image/png');
  faceCache.set(d.key, url);
  return url;
}

const bodyCache = new Map<string, HTMLCanvasElement>();
export function bodySprite(w: Who, frame: number, pose: 'attack' | null): HTMLCanvasElement {
  const d = describe(w);
  const key = d.key + '|' + frame + '|' + (pose ?? '');
  const hit = bodyCache.get(key);
  if (hit) return hit;
  const [c, x] = makeCanvas(20, 24);
  const r = (px: number, py: number, ww: number, hh: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, ww, hh); };
  const [sk, skS] = d.skin, [hc, hs] = d.hair, [cl, clS] = clothOf(d);
  const child = d.stage === 'child', old = d.stage === 'old';
  const pants = d.faction === 'marine' ? '#2a4a8a' : child ? '#5a4634' : '#2c3a58';
  const legH = (child ? 2 : 4) - frame, torsoH = child ? 5 : 7;
  const legsTop = 21 - legH, torsoTop = legsTop - torsoH, headTop = torsoTop - 7;
  r(5, legsTop, 2, legH, pants); r(9, legsTop, 2, legH, pants);
  r(4, 21, 3, 1, '#3a2414'); r(9, 21, 3, 1, '#3a2414');
  r(4, torsoTop, 8, torsoH, cl); r(10, torsoTop + 1, 2, torsoH - 1, clS);
  r(4, torsoTop + torsoH - 2, 8, 1, d.faction === 'pirate' && !child ? '#e8c040' : clS);
  if (d.faction === 'pirate' && !child) r(7, torsoTop, 2, 4, sk);
  if (d.faction === 'marine' && !child) r(6, torsoTop, 4, 2, '#2a4a8a');
  r(2, torsoTop, 2, torsoH - 2, cl); r(2, torsoTop + torsoH - 2, 2, 1, sk);
  if (pose === 'attack') {
    r(12, torsoTop + 1, 3, 2, cl); r(15, torsoTop + 1, 1, 2, sk);
    r(15, torsoTop + 3, 3, 1, '#c8a040'); r(16, torsoTop - 5, 1, 8, '#e4ecf4'); r(17, torsoTop - 4, 1, 6, '#b0bccc');
  } else { r(12, torsoTop, 2, torsoH - 2, clS); r(12, torsoTop + torsoH - 2, 2, 1, sk); }
  r(4, headTop, 8, 7, sk); r(3, headTop + 1, 10, 5, sk); r(11, headTop + 2, 2, 4, skS);
  r(6, headTop + 3, 1, 2, '#1c1420'); r(10, headTop + 3, 1, 2, '#1c1420');
  if (old && d.gender === 'm') r(6, headTop + 5, 5, 2, hc);
  if (d.style === 2 || d.style === 5) { r(2, headTop + 2, 2, d.style === 2 ? 8 : 5, hs); r(3, headTop + 1, 1, 3, hc); }
  if (d.style === 3) { r(1, headTop + 1, 2, 2, hc); r(1, headTop + 3, 1, 4, hc); }
  if (d.style === 4) r(4, headTop - 1, 8, 1, hs);
  else {
    r(4, headTop - 1, 8, 2, hc); r(3, headTop, 10, 2, hc); r(3, headTop + 2, 2, 2, hc);
    if (d.style === 1) { r(5, headTop - 2, 2, 1, hc); r(9, headTop - 2, 2, 1, hc); }
  }
  if (d.species === 'mink') { r(3, headTop - 3, 2, 3, hc); r(10, headTop - 3, 2, 3, hc); }
  if (!child) {
    if (d.faction === 'marine') { r(3, headTop - 2, 10, 3, '#f4f8fa'); r(3, headTop + 1, 11, 1, '#2a4a8a'); }
    else if (d.faction === 'pirate') { r(3, headTop - 1, 10, 2, '#c8322a'); r(1, headTop + 1, 2, 2, '#c8322a'); }
    else if (d.faction === 'rev') { r(2, headTop - 2, 11, 3, '#3f6244'); r(2, headTop + 1, 2, 6, '#3f6244'); }
  }
  outline(x, 20, 24);
  bodyCache.set(key, c);
  return c;
}

// ---------------------------------------------------------------- 장면

export interface SceneInput {
  hero: Who; crew: Who[]; foe: Who | null;
  sailing: boolean; place: string; islandColor: string; flag: 'pirate' | 'marine' | 'rev' | 'civil';
  aura: string | null;
}

const [buf, bx] = typeof document !== 'undefined' ? makeCanvas(8, 8) : [null as unknown as HTMLCanvasElement, null as unknown as CanvasRenderingContext2D];

/** 저해상도로 그린 뒤 정수 배율로 키운다 */
export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, sc: SceneInput) {
  const S = w < 520 ? 2 : 3;
  const W = Math.ceil(w / S), H = Math.ceil(h / S);
  if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
  bx.imageSmoothingEnabled = false;
  const r = (px: number, py: number, rw: number, rh: number, col: string) => { bx.fillStyle = col; bx.fillRect(Math.round(px), Math.round(py), Math.round(rw), Math.round(rh)); };
  const tt = Math.floor(t / 10);
  const fighting = !!sc.foe;
  const hz = Math.floor(H * 0.46);
  const sky = fighting ? ['#e8845c', '#f4ac74', '#fcd49c'] : ['#58b0ec', '#80c8f4', '#b4e4f8'];
  r(0, 0, W, hz, sky[0]); r(0, hz * 0.45, W, hz, sky[1]); r(0, hz * 0.8, W, hz, sky[2]);
  r(W - 26, 7, 8, 10, '#fff4a8'); r(W - 27, 8, 10, 8, '#fff4a8'); r(W - 24, 9, 4, 5, '#ffffff');
  for (let i = 0; i < 4; i++) {
    const cx = Math.floor((i * 67 + t * 0.06) % (W + 40)) - 30, cy = 5 + (i % 3) * 9;
    r(cx + 3, cy, 9, 2, '#ffffff'); r(cx, cy + 2, 17, 3, '#ffffff'); r(cx + 2, cy + 5, 12, 1, '#d4ecf8');
  }
  r(0, hz, W, H - hz, '#2f8fd0'); r(0, hz, W, 2, '#8cd0ec'); r(0, hz + (H - hz) * 0.5, W, H, '#2a7fc0');
  for (let y = hz + 4, row = 0; y < H; y += 5, row++) {
    for (let i = 0; i < W / 22 + 1; i++) {
      const wx = (i * 22 + row * 9 + tt * 2) % (W + 12) - 6;
      r(wx, y, 5, 1, row % 2 ? '#7cc8ec' : '#b8e8f4');
    }
  }
  let ground: number;
  if (!sc.sailing) {
    const ic = sc.islandColor, ix = Math.floor(W * 0.52);
    r(ix + 10, hz - 22, W, 30, ic); r(ix + 2, hz - 14, W, 22, ic); r(ix - 4, hz - 6, W, 14, ic);
    r(ix + 18, hz - 26, 30, 4, ic); r(ix + 14, hz - 18, W, 3, '#ffffff22');
    r(ix - 8, hz + 4, W, 6, '#f0dca0'); r(ix - 8, hz + 9, W, 2, '#d8bc78');
    for (let i = 0; i < 3; i++) {
      const hx = ix + 8 + i * 22, hy = hz - 12 + (i % 2) * 3, roof = i % 2 ? '#c8503c' : '#3c6cb0';
      r(hx, hy, 14, 13, '#f8ecc0'); r(hx + 11, hy, 3, 13, '#dcc890');
      r(hx - 2, hy - 2, 18, 3, roof); r(hx, hy - 4, 14, 2, roof); r(hx + 3, hy - 6, 8, 2, roof);
      r(hx + 5, hy + 6, 4, 7, '#6a4426'); r(hx + 1, hy + 3, 3, 3, '#58a8dc'); r(hx + 10, hy + 3, 3, 3, '#58a8dc');
    }
    r(ix + 2, hz - 12, 2, 12, '#7a5030'); r(ix - 2, hz - 16, 10, 3, '#3f8a4a'); r(ix, hz - 19, 6, 3, '#58a85c');
    ground = Math.floor(H * 0.74);
    const dx = Math.floor(W * 0.06), dw = Math.floor(W * 0.80);
    r(dx, ground, dw, 3, '#d8a868'); r(dx, ground + 3, dw, 4, '#9c6a3c'); r(dx, ground + 7, dw, 1, '#6a4426');
    for (let i = 0; i <= dw; i += 12) r(dx + i, ground, 1, 3, '#b08048');
    for (let i = 4; i < dw; i += 24) { r(dx + i, ground + 7, 3, H, '#6a4426'); r(dx + i, ground + 7, 1, H, '#8a5c34'); }
  } else {
    const bob = tt % 4 < 2 ? 0 : 1, sx = Math.floor(W * 0.2), sw = Math.floor(W * 0.6), dy = Math.floor(H * 0.70) + bob;
    ground = dy;
    const mx = sx + Math.floor(sw * 0.5);
    r(mx, dy - 46, 2, 46, '#6a4426');
    r(mx + 3, dy - 42, 28, 24, '#f8f0d8'); r(mx + 3, dy - 30, 28, 3, '#d8483c'); r(mx + 27, dy - 42, 4, 24, '#dcd0b0');
    r(mx - 22, dy - 36, 20, 18, '#f8f0d8'); r(mx - 22, dy - 36, 3, 18, '#dcd0b0');
    const flag = sc.flag === 'marine' ? '#f4f8fa' : sc.flag === 'pirate' ? '#241c28' : sc.flag === 'rev' ? '#3f6244' : '#d8483c';
    r(mx + 2, dy - 52 + (tt % 2), 10, 6, flag); r(mx + 5, dy - 50 + (tt % 2), 3, 2, flag === '#f4f8fa' ? '#2a4a8a' : '#f8f0d8');
    r(sx, dy, sw, 3, '#d8a868'); r(sx + 2, dy + 3, sw - 4, 6, '#9c6a3c'); r(sx + 6, dy + 9, sw - 12, 4, '#7a4c28'); r(sx + 12, dy + 13, sw - 24, 3, '#5c3418');
    r(sx - 6, dy - 2, 8, 3, '#9c6a3c'); r(sx + sw - 2, dy - 4, 8, 4, '#9c6a3c');
    for (let i = 8; i < sw - 8; i += 14) r(sx + i, dy + 5, 3, 3, '#3a2414');
    r(sx - 4, dy + 15, sw + 8, 2, '#d8f0f8');
  }
  const frame = (tt >> 1) & 1;
  const put = (who: Who, cx: number, pose: 'attack' | null, flip: boolean) => {
    const sp = bodySprite(who, pose === 'attack' ? 0 : frame, pose), py = ground - 22;
    if (flip) { bx.save(); bx.translate(Math.round(cx) + 20, py); bx.scale(-1, 1); bx.drawImage(sp, 0, 0); bx.restore(); }
    else bx.drawImage(sp, Math.round(cx), py);
  };
  sc.crew.slice(0, 3).forEach((c, i) => put(c, W * (0.10 + i * 0.085), null, false));
  const lunge = fighting ? Math.round(Math.sin(t * 0.13) * 4) : 0;
  put(sc.hero, W * 0.36 + lunge, fighting && tt % 4 < 2 ? 'attack' : null, false);
  if (sc.foe) {
    put(sc.foe, W * 0.58 - lunge, tt % 4 >= 2 ? 'attack' : null, true);
    if (tt % 4 === 1 || tt % 4 === 3) {
      const fx = Math.floor(W * 0.5), fy = ground - 14;
      r(fx, fy - 4, 2, 10, '#fff8c0'); r(fx - 4, fy, 10, 2, '#fff8c0'); r(fx - 2, fy - 2, 6, 6, '#ffffff');
    }
  }
  if (sc.aura) {
    const ax = W * 0.36 + lunge;
    [[1, 4], [17, 9], [3, 15], [16, 1]].forEach(([ox, oy], i) => { if ((tt + i) % 4 < 2) r(ax + ox, ground - 22 + oy - ((tt + i) % 4), 1, 2, sc.aura!); });
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, 0, 0, W * S, H * S);
  // 지명 팻말
  const label = sc.place;
  ctx.font = "12px 'Galmuri11', sans-serif";
  const lw = Math.min(w - 16, Math.ceil(ctx.measureText(label).width) + 20);
  ctx.fillStyle = '#2c170b'; ctx.fillRect(8, 8, lw, 24);
  ctx.fillStyle = '#9c5f33'; ctx.fillRect(10, 10, lw - 4, 20);
  ctx.fillStyle = '#4b2a17'; ctx.fillRect(12, 12, lw - 8, 16);
  ctx.fillStyle = '#f8e8b8'; ctx.textBaseline = 'middle'; ctx.fillText(label, 18, 21);
  ctx.textBaseline = 'alphabetic';
}
