// 코드로 그리는 도트 캐릭터(얼굴 24×24, 전신 20×24)와 도트 장면. v3.4.0 pixel-art.js 를 옮겼다.
// 같은 인물은 언제나 같은 모습이다 (docs/01_기획/04_UI_그래픽_방향.md 3장).
import type { Species } from '../../core/types';

type Pair = [string, string];
const SKIN: Record<'human' | 'fish' | 'mink' | 'sky' | 'luna', Pair[]> = {
  luna: [['#7a4a32', '#5a3220'], ['#8a5a3c', '#6a4028']],
  human: [['#f6c89a', '#d99a6c'], ['#eab183', '#c98458'], ['#c98a5c', '#a0643c'], ['#fbd9b5', '#e0aa80']],
  fish: [['#8cc8d8', '#5a9ab0'], ['#9ad0b0', '#62a084'], ['#a8b4e0', '#7482b8']],
  mink: [['#f0dcc0', '#c8ac88'], ['#e8b070', '#b87c40'], ['#d8d8e0', '#a0a0b0']],
  sky: [['#fbe2c4', '#e2b48c'], ['#f6c89a', '#d99a6c']],
};
const HAIR: Pair[] = [['#2a2430', '#16121c'], ['#5a3a22', '#3a2412'], ['#c8742a', '#96501a'], ['#e8c860', '#b8963a'],
  ['#b8322a', '#84201a'], ['#3a6a9a', '#244a70'], ['#3f8a5a', '#2a6440'], ['#e8a0b8', '#b86e88'], ['#7a52a8', '#55387a']];
const GRAY: Pair = ['#dcdfe6', '#a8acb8'];
const CIVIL: Pair[] = [['#4a8ac8', '#2f6498'], ['#58a070', '#3a7850'], ['#c89040', '#98682a'], ['#a868b0', '#7a4884']];

/** 들고 있는 무기. 평소 모습(칼집 · 권총집 · 붕대 감은 주먹)과 공격 자세 · 공격 효과가 달라진다 */
export type Weapon = 'sword' | 'fist' | 'gun';
/** 멀쩡하지 않은 부위. L/R은 인물 자신의 왼쪽/오른쪽 (앞을 보는 그림에서 L은 보는 이의 오른쪽) */
export type BodyMark = Partial<Record<'eyeL' | 'eyeR' | 'armL' | 'armR' | 'legL' | 'legR', 'lost' | 'basic' | 'superior'>>;
export interface Who {
  key: string;                // 고정 무작위의 씨앗 (id나 이름)
  gender?: 'm' | 'f'; age?: number; species?: Species;
  faction?: 'civil' | 'pirate' | 'marine' | 'rev';
  form?: 'seaking';
  weapon?: Weapon;
  body?: BodyMark;            // 안대 · 빈 소매 · 의족 (v5)
}

/** 기술 목록에서 무기를 정한다: 검술 기술이 있으면 칼, 사격이면 총, 아니면 맨주먹 */
export function weaponOfSkills(skills: readonly string[]): Weapon {
  const sword = skills.filter((k) => k.startsWith('sword_')).length;
  const gun = skills.filter((k) => k.startsWith('gun_')).length;
  const fist = skills.filter((k) => k.startsWith('fist_')).length;
  if (sword && sword >= gun && sword >= fist) return 'sword';
  if (gun && gun >= fist) return 'gun';
  return 'fist';
}
interface Desc {
  seed: number; gender: 'm' | 'f'; species: 'human' | 'fish' | 'mink' | 'sky' | 'luna'; faction: NonNullable<Who['faction']>;
  stage: 'child' | 'adult' | 'old'; skin: Pair; hair: Pair; style: number; civil: Pair; smile: number; key: string;
  body?: BodyMark;
}

/** 캐시 열쇠에 붙일 몸의 표시 (잃기 전의 그림이 다시 나오지 않게) */
function bodyKey(b: BodyMark | undefined): string {
  if (!b) return '';
  return (['eyeL', 'eyeR', 'armL', 'armR', 'legL', 'legR'] as const).map((k) => (b[k] ?? '').charAt(0) || '-').join('');
}
const PATCH = '#1c1420';
const GLASS_EYE: Pair = ['#b8bcc6', '#8a8e9a'];
const GOLD = '#ffd030';
const IRON: Pair = ['#c4c8d0', '#9a9ea8'];     // 돈으로 단 의수: 손, 팔
const STEEL: Pair = ['#c8d4e0', '#6a7484'];    // 기연으로 얻은 강철 팔다리: 밝은 면, 어두운 면
const PEG = '#8a5a2a';

export function hash(str: string) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.codePointAt(0)!; h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function describe(w: Who): Desc {
  const seed = hash(w.key);
  const age = w.age ?? 25;
  const gender = w.gender ?? (seed % 2 ? 'f' : 'm');
  const species = w.species === 'fishman' || w.species === 'merfolk' ? 'fish' : w.species === 'mink' ? 'mink' : w.species === 'skypiean' ? 'sky' : w.species === 'lunarian' ? 'luna' : 'human';
  const faction = w.faction ?? 'civil';
  const stage = age <= 14 ? 'child' : age >= 55 ? 'old' : 'adult';
  const styles = gender === 'f' ? [2, 3, 5, 2, 3] : [0, 1, 0, 4, 1];
  return {
    seed, gender, species, faction, stage,
    skin: SKIN[species][(seed >>> 3) % SKIN[species].length],
    hair: stage === 'old' || species === 'luna' ? GRAY : HAIR[(seed >>> 6) % HAIR.length],
    style: styles[(seed >>> 10) % styles.length],
    civil: CIVIL[(seed >>> 13) % CIVIL.length],
    smile: (seed >>> 16) % 3,
    key: [seed, gender, species, faction, stage].join('|'),
    ...(w.body ? { body: w.body } : {}),
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

// ---------------- 해왕류: 사람이 아닌 모습
const SEAKING: Pair[] = [['#3f9a6a', '#2a6a48'], ['#3a7ac0', '#24508a'], ['#9a5ab0', '#6a3a80'], ['#c0703a', '#8a4a24']];
function seakingFace(w: Who): string {
  const seed = hash(w.key);
  const [c1, c2] = SEAKING[seed % SEAKING.length];
  const [c, x] = makeCanvas(24, 24);
  const r = (px: number, py: number, ww: number, hh: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, ww, hh); };
  r(8, 0, 3, 4, c2); r(13, 0, 3, 4, c2); r(10, 1, 4, 3, c2);           // 등지느러미
  r(4, 4, 16, 14, c1); r(3, 6, 18, 10, c1); r(5, 18, 14, 4, c1);        // 머리
  r(4, 14, 16, 2, c2); r(6, 20, 12, 4, c2);                             // 턱 그림자
  r(5, 8, 5, 4, '#f6e04a'); r(14, 8, 5, 4, '#f6e04a');                   // 눈
  r(7, 8, 1, 4, '#1c1420'); r(16, 8, 1, 4, '#1c1420');
  r(6, 15, 12, 3, '#5a1a1a'); for (let i = 0; i < 6; i++) r(6 + i * 2, 15, 1, 1, '#ffffff');   // 입과 이빨
  r(1, 9, 2, 1, c2); r(0, 10, 2, 1, c2); r(21, 9, 2, 1, c2); r(22, 10, 2, 1, c2);              // 수염
  outline(x, 24, 24);
  return c.toDataURL('image/png');
}
function seakingBody(w: Who, frame: number): HTMLCanvasElement {
  const seed = hash(w.key);
  const [c1, c2] = SEAKING[seed % SEAKING.length];
  const [c, x] = makeCanvas(20, 24);
  const r = (px: number, py: number, ww: number, hh: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, ww, hh); };
  const sw = frame ? 1 : 0;
  r(2, 18, 16, 5, c1); r(1, 19, 18, 3, c2);                              // 물에 잠긴 똬리
  r(12 - sw, 10, 5, 9, c1); r(10 - sw, 6, 7, 6, c1); r(9 - sw, 2, 8, 6, c1); // 목과 머리
  r(10 - sw, 0, 2, 2, c2); r(14 - sw, 0, 2, 2, c2);
  r(10 - sw, 3, 2, 2, '#f6e04a'); r(10 - sw, 3, 1, 2, '#1c1420');
  r(9 - sw, 6, 4, 1, '#ffffff');
  r(3, 14, 3, 5, c1); r(4, 12, 2, 2, c2);                                // 꼬리 끝
  outline(x, 20, 24);
  return c;
}

const faceCache = new Map<string, string>();
export function faceURL(w: Who): string {
  if (w.form === 'seaking') {
    const k = 'seaking|' + w.key;
    const hit = faceCache.get(k);
    if (hit) return hit;
    const url = seakingFace(w); faceCache.set(k, url); return url;
  }
  const d = describe(w);
  const fkey = d.key + '|' + bodyKey(d.body);
  const hit = faceCache.get(fkey);
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
  // 눈: 오른눈(eyeR)은 보는 이의 왼쪽(x=8), 왼눈(eyeL)은 보는 이의 오른쪽(x=14)
  for (const [part, ex, inward] of [['eyeR', 8, 1], ['eyeL', 14, -1]] as const) {
    const st = d.body?.[part];
    if (st === 'lost') {
      // 검은 안대와 끈 (끈은 이마 쪽으로 올라가고 귀 쪽으로 내려간다)
      r(ex - 1, ey - 1, 4, eyeH + 2, PATCH);
      const top = inward > 0 ? ex + 3 : ex - 2;
      r(top, ey - 2, 1, 1, PATCH); r(top + inward, ey - 3, 1, 1, PATCH);
      r(inward > 0 ? ex - 2 : ex + 3, ey + eyeH, 1, 1, PATCH);
    } else if (st === 'basic') {
      // 회색 의안: 눈동자가 없다
      r(ex, ey, 2, eyeH, GLASS_EYE[0]); r(ex + 1, ey + eyeH - 1, 1, 1, GLASS_EYE[1]);
    } else if (st === 'superior') {
      // 빛나는 눈: 하이라이트 자리에 금색 한 점
      r(ex, ey, 1, 1, GOLD);
    }
  }
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
  faceCache.set(fkey, url);
  return url;
}

const bodyCache = new Map<string, HTMLCanvasElement>();
/** 공격 자세에서 뻗는 팔: 왼팔(armL)이 있으면 왼팔, 왼팔만 잃었으면 오른팔, 두 팔을 다 잃었으면 없다 */
export function attackArm(body: BodyMark): 'armL' | 'armR' | null {
  if (body.armL !== 'lost') return 'armL';
  return body.armR !== 'lost' ? 'armR' : null;
}

/**
 * 칼집 · 권총집에 무기가 꽂혀 있는가: 공격 자세에서 뻗는 팔이 있어 무기를 뽑아 든 동안만 아니다.
 * 두 팔을 다 잃으면 공격 자세에도 뽑아 들 팔이 없으니 꽂힌 채다 (공격 틀마다 깜빡이지 않게)
 */
export function holstered(pose: 'attack' | null, body: BodyMark): boolean {
  return pose !== 'attack' || attackArm(body) === null;
}

export function bodySprite(w: Who, frame: number, pose: 'attack' | null): HTMLCanvasElement {
  if (w.form === 'seaking') {
    const k = 'seaking|' + w.key + '|' + frame;
    const hit = bodyCache.get(k);
    if (hit) return hit;
    const c = seakingBody(w, frame); bodyCache.set(k, c); return c;
  }
  const d = describe(w);
  const wp = w.weapon ?? null;
  const key = d.key + '|' + frame + '|' + (pose ?? '') + '|' + (wp ?? '') + '|' + bodyKey(d.body);
  const hit = bodyCache.get(key);
  if (hit) return hit;
  const [c, x] = makeCanvas(20, 24);
  const r = (px: number, py: number, ww: number, hh: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, ww, hh); };
  const [sk, skS] = d.skin, [hc, hs] = d.hair, [cl, clS] = clothOf(d);
  const child = d.stage === 'child', old = d.stage === 'old';
  const pants = d.faction === 'marine' ? '#2a4a8a' : child ? '#5a4634' : '#2c3a58';
  const legH = (child ? 2 : 4) - frame, torsoH = child ? 5 : 7;
  const legsTop = 21 - legH, torsoTop = legsTop - torsoH, headTop = torsoTop - 7;
  const body = d.body ?? {};
  // 다리: 오른다리(legR)는 보는 이의 왼쪽(x=5), 왼다리(legL)는 보는 이의 오른쪽(x=9)
  const leg = (lx: number, shoeX: number, st: BodyMark['legL']) => {
    const thigh = Math.max(1, legH - 2);
    if (st === 'lost') { r(lx, legsTop, 2, thigh, pants); return; }                 // 짧은 그루터기, 신발 없음
    if (st === 'basic') { r(lx, legsTop, 2, thigh, pants); r(lx, legsTop + thigh, 1, 22 - legsTop - thigh, PEG); return; }  // 나무 의족
    if (st === 'superior') {                                                       // 강철 다리
      r(lx, legsTop, 2, thigh, pants); r(lx, legsTop + thigh, 2, 21 - legsTop - thigh, STEEL[1]);
      r(lx, legsTop + thigh, 1, 21 - legsTop - thigh, STEEL[0]); r(shoeX, 21, 3, 1, STEEL[1]); return;
    }
    r(lx, legsTop, 2, legH, pants); r(shoeX, 21, 3, 1, '#3a2414');
  };
  leg(5, 4, body.legR); leg(9, 9, body.legL);
  r(4, torsoTop, 8, torsoH, cl); r(10, torsoTop + 1, 2, torsoH - 1, clS);
  r(4, torsoTop + torsoH - 2, 8, 1, d.faction === 'pirate' && !child ? '#e8c040' : clS);
  if (d.faction === 'pirate' && !child) r(7, torsoTop, 2, 4, sk);
  if (d.faction === 'marine' && !child) r(6, torsoTop, 4, 2, '#2a4a8a');
  // 붕대 감은 주먹 (맨주먹 무술)
  const wrap = wp === 'fist' && !child ? '#f0ece0' : sk;
  // 팔: 오른팔(armR)은 보는 이의 왼쪽(x=2), 왼팔(armL)은 보는 이의 오른쪽(x=12, 공격하는 팔)
  const metal = (st: BodyMark['armL']): Pair | null => st === 'basic' ? IRON : st === 'superior' ? STEEL : null;
  const arm = (ax: number, sleeve: string, st: BodyMark['armL']) => {
    if (st === 'lost') { r(ax, torsoTop, 2, 2, sleeve); r(ax, torsoTop + 2, 1, 1, sleeve); return; }   // 빈 소매 끝만
    const m = metal(st);
    if (!m) { r(ax, torsoTop, 2, torsoH - 2, sleeve); r(ax, torsoTop + torsoH - 2, 2, 1, wrap); return; }
    r(ax, torsoTop, 2, 2, sleeve); r(ax, torsoTop + 2, 2, torsoH - 4, m[1]);                          // 회색 팔 · 강철 팔
    if (st === 'superior') r(ax, torsoTop + 2, 2, 1, GOLD);                                          // 금색 테
    r(ax, torsoTop + torsoH - 2, 2, 1, m[0]);
  };
  const armL = body.armL;
  const atk = pose === 'attack' ? attackArm(body) : null;
  // 왼팔을 잃으면 오른팔이 가슴을 가로질러 뻗는다: 오른팔은 옆에 그리지 않고, 한 줄 낮게 몸 앞을 지난다
  const cross = atk === 'armR';
  if (!cross) arm(2, cl, body.armR);
  const atkSt = cross ? body.armR : armL, mL = metal(atkSt);
  const handL = mL ? mL[0] : sk;
  const ay = cross ? torsoTop + 2 : torsoTop;          // 뻗은 팔의 높이
  const sx = cross ? 3 : 12, sleeve = cross ? clS : cl; // 소매가 시작하는 곳 · 몸 앞을 지나는 소매는 그늘색
  /** 뻗은 팔의 손목 쪽 한 칸: 의수는 팔 색, 강철 팔은 금색 테 */
  const wristL = (wx: number) => { if (mL) r(wx, ay + 1, 1, 2, atkSt === 'superior' ? GOLD : mL[1]); };
  // 평소 모습: 등 뒤 칼집 · 허벅지 권총집 (무기를 뽑아 든 동안에만 감춘다)
  if (holstered(pose, body) && !child) {
    if (wp === 'sword') { r(1, torsoTop - 2, 1, 2, '#c8a040'); r(1, torsoTop, 1, torsoH + 3, '#3a2a40'); r(0, torsoTop + 1, 1, torsoH + 1, '#5a4466'); }
    if (wp === 'gun') { r(11, legsTop, 2, 3, '#4a3020'); r(11, legsTop - 1, 1, 1, '#7a7a88'); }
  }
  // 잃은 왼팔은 자세와 상관없이 빈 소매 끝만 (두 팔을 다 잃으면 공격 효과는 장면이 그린다)
  if (armL === 'lost') arm(12, clS, armL);
  if (atk && wp === 'fist') {
    // 곧게 뻗은 주먹
    r(sx, ay + 1, 16 - sx, 2, sleeve); wristL(15);
    r(16, ay, 3, 4, mL ? mL[0] : wrap); r(18, ay + 1, 1, 2, mL ? mL[1] : skS); r(16, ay + 1, 1, 1, mL ? mL[1] : skS);
  } else if (atk && wp === 'gun') {
    // 팔을 뻗어 권총을 겨눈다
    r(sx, ay + 1, 15 - sx, 2, sleeve); wristL(14); r(15, ay + 1, 1, 2, handL);
    r(15, ay + 2, 1, 2, '#5a3a22'); r(15, ay, 4, 2, '#4a4a56'); r(16, ay, 3, 1, '#8a8a96');
  } else if (atk) {
    // 칼을 치켜든다 (무기가 정해지지 않았으면 칼)
    r(sx, ay + 1, 15 - sx, 2, sleeve); wristL(14); r(15, ay + 1, 1, 2, handL);
    r(15, ay + 3, 3, 1, '#c8a040'); r(16, ay - 5, 1, 8, '#e4ecf4'); r(17, ay - 4, 1, 6, '#b0bccc');
  } else if (armL !== 'lost') arm(12, clS, armL);
  r(4, headTop, 8, 7, sk); r(3, headTop + 1, 10, 5, sk); r(11, headTop + 2, 2, 4, skS);
  r(6, headTop + 3, 1, 2, '#1c1420'); r(10, headTop + 3, 1, 2, '#1c1420');
  // 눈: 오른눈(eyeR)은 보는 이의 왼쪽(x=6), 왼눈(eyeL)은 보는 이의 오른쪽(x=10)
  for (const [part, ex, inward] of [['eyeR', 6, 1], ['eyeL', 10, -1]] as const) {
    const st = body[part];
    if (st === 'lost') { r(inward > 0 ? ex - 1 : ex, headTop + 3, 2, 2, PATCH); r(ex + inward, headTop + 2, 1, 1, PATCH); r(ex + 2 * inward, headTop + 1, 1, 1, PATCH); }
    else if (st === 'basic') r(ex, headTop + 3, 1, 2, GLASS_EYE[0]);
    else if (st === 'superior') r(ex, headTop + 3, 1, 1, GOLD);
  }
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
  const crew = sc.crew.slice(0, 3);
  if (sc.sailing) {
    // 배 위: 갑판(폭의 20~80%) 안에 세운다. 싸우지 않을 때는 셋째를 돛대 오른쪽에
    const deckL = Math.floor(W * 0.2) + 2, heroX = W * 0.36;
    const behind = !fighting && crew.length === 3 ? crew.slice(0, 2) : crew;
    const span = Math.max(0, heroX - 14 - deckL);
    behind.forEach((c, i) => put(c, deckL + (behind.length > 1 ? (span * i) / (behind.length - 1) : span / 2), null, false));
    if (behind.length < crew.length) put(crew[2], W * 0.56, null, false);
  } else {
    crew.forEach((c, i) => put(c, W * (0.10 + i * 0.085), null, false));
  }
  const lunge = fighting ? Math.round(Math.sin(t * 0.13) * 4) : 0;
  put(sc.hero, W * 0.36 + lunge, fighting && tt % 4 < 2 ? 'attack' : null, false);
  if (sc.foe) {
    put(sc.foe, W * 0.58 - lunge, tt % 4 >= 2 ? 'attack' : null, true);
    if (tt % 4 === 1 || tt % 4 === 3) {
      // 공격하는 쪽의 무기에 맞는 효과: 칼은 베는 자국, 주먹은 충격파, 총은 총구 불꽃과 탄도
      const heroTurn = tt % 4 === 1;
      const wp = (heroTurn ? sc.hero.weapon : sc.foe.weapon) ?? 'sword';
      const heroX = W * 0.36 + lunge, foeX = W * 0.58 - lunge;
      const tx = heroTurn ? foeX + 10 : heroX + 10;          // 맞는 쪽 몸통
      const fy = ground - 14;
      if (wp === 'sword') {
        for (let i = 0; i < 11; i++) { r(tx - 6 + i, fy - 7 + i, 2, 1, '#ffffff'); r(tx - 5 + i, fy - 7 + i, 1, 1, '#bfe0ff'); }
        r(tx - 7, fy - 8, 2, 1, '#fff8c0'); r(tx + 5, fy + 4, 2, 1, '#fff8c0');
      } else if (wp === 'gun') {
        const mx = heroTurn ? heroX + 19 : foeX + 1, my = ground - 12;
        const hx = heroTurn ? foeX + 5 : heroX + 14;          // 맞는 쪽 몸의 앞면
        r(heroTurn ? mx : mx - 2, my - 1, 2, 3, '#fff8c0');
        const a = Math.min(mx, hx), b = Math.max(mx, hx);
        for (let x = a + 3; x < b - 2; x += 3) r(x, my, 2, 1, '#ffe080');
        r(hx, my - 1, 1, 1, '#ffd060'); r(hx + (heroTurn ? -1 : 1), my + 1, 1, 1, '#ffd060');
      } else {
        // 맞는 쪽 몸의 앞면, 가슴 높이에 작은 충격파
        const hx = heroTurn ? W * 0.58 - lunge + 4 : W * 0.36 + lunge + 15, cy = ground - 11;
        r(hx, cy - 3, 1, 7, '#fff8c0'); r(hx - 3, cy, 7, 1, '#fff8c0'); r(hx, cy, 1, 1, '#ffffff');
        [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([ox, oy]) => r(hx + ox, cy + oy, 1, 1, '#ffd890'));
      }
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
