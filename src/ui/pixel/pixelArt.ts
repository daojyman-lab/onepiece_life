// 코드로 그리는 도트 캐릭터(얼굴 24×24, 전신 20×24)와 도트 장면. v3.4.0 pixel-art.js 를 옮겼다.
// 같은 인물은 언제나 같은 모습이다 (docs/01_기획/04_UI_그래픽_방향.md 3장).
import type { Species } from '../../shared/core/types';
import { isCombatStyle, type CombatStyle } from '../../data/combat-styles';
import type { Weather } from '../../data/weather';
import type { SceneLocation } from './locations';
import { drawLand, drawLandAir, drawSea, drawSeaAir, landGround, Scenery } from './scenery';

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
export type Weapon = 'sword' | 'fist' | 'gun' | 'spear' | 'naginata' | 'staff' | 'hammer' | 'club' | 'pipe' | 'rifle' | 'sniper' | 'slingshot' | 'dial';
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

export function weaponOfStyle(style: CombatStyle): Weapon {
  switch (style) {
    case 'boxing': case 'kicking': case 'karate': case 'fishmanKarate': case 'rokushiki': case 'grappling': return 'fist';
    case 'oneSword': case 'twoSword': case 'threeSword': case 'iai': return 'sword';
    case 'pistol': return 'gun';
    default: return style;
  }
}

/** 장비 정보가 없는 상대는 기술 목록에서 무기를 정한다. */
export function weaponOfSkills(skills: readonly string[]): Weapon {
  const style = skills.find((k) => k.startsWith('style:'))?.split(':')[1];
  if (isCombatStyle(style)) return weaponOfStyle(style);
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

// 브룩의 빈 눈구멍과 쵸파의 뿔은 사람 얼굴에 모자를 씌워서는 표현되지 않는다.
function musicianOrDoctor(key: 'brook' | 'chopper'): string {
  const [canvas, ctx] = makeCanvas(24, 24);
  const paint = (color: string, x: number, y: number, width: number, height: number) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  };
  if (key === 'brook') {
    const hair = '#3a3044', bone = '#f6e7c3', socket = '#342939';
    paint(hair, 2, 7, 20, 10);
    paint(hair, 4, 5, 16, 15);
    paint('#252036', 7, 1, 10, 6);
    paint('#ac643f', 7, 5, 10, 2);
    paint('#252036', 4, 7, 16, 2);
    paint(bone, 6, 10, 12, 8);
    paint(bone, 8, 17, 8, 4);
    paint(socket, 7, 12, 4, 3);
    paint(socket, 13, 12, 4, 3);
    paint(socket, 11, 15, 2, 2);
    paint(socket, 8, 18, 8, 1);
    for (let tooth = 9; tooth <= 15; tooth += 2) paint(socket, tooth, 19, 1, 1);
    paint('#e9a342', 7, 21, 4, 2);
    paint('#e9a342', 13, 21, 4, 2);
  } else {
    const antler = '#835432', fur = '#c98955', hat = '#e16b95';
    for (const x of [1, 19]) {
      paint(antler, x, 3, 3, 5);
      paint(antler, x + 2, 1, 2, 4);
      paint(antler, x + 1, 7, 3, 2);
    }
    paint(fur, 2, 12, 20, 3);
    paint(fur, 5, 13, 14, 7);
    paint('#efbc86', 8, 17, 8, 5);
    paint('#362538', 7, 15, 2, 2);
    paint('#362538', 15, 15, 2, 2);
    paint('#329cdd', 10, 17, 4, 2);
    paint('#634033', 11, 20, 3, 1);
    paint(hat, 5, 4, 14, 8);
    paint('#c44877', 3, 11, 18, 2);
    for (let i = 0; i < 5; i++) {
      paint('#fff0dc', 9 + i, 5 + i, 2, 1);
      paint('#fff0dc', 13 - i, 5 + i, 2, 1);
    }
  }
  outline(ctx, 24, 24);
  return canvas.toDataURL('image/png');
}

export function faceURL(w: Who): string {
  if (w.key === 'brook' || w.key === 'chopper') {
    const face = faceCache.get(w.key) ?? musicianOrDoctor(w.key);
    faceCache.set(w.key, face);
    return face;
  }
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
    if (wp === 'spear' || wp === 'naginata' || wp === 'staff') {
      r(1, headTop - 1, 1, 23, '#88603c');
      if (wp !== 'staff') { r(1, headTop - 4, 1, 4, '#d8e4ec'); r(wp === 'naginata' ? 2 : 0, headTop - 2, 1, 2, '#a8b8c8'); }
    }
    if (wp === 'hammer' || wp === 'club' || wp === 'pipe') {
      r(0, torsoTop + 1, 1, 10, wp === 'pipe' ? '#9aa4b0' : '#88603c');
      if (wp === 'hammer') r(0, torsoTop - 1, 4, 3, '#8995a2');
      if (wp === 'club') r(0, torsoTop - 2, 2, 6, '#65505a');
    }
    if (wp === 'rifle' || wp === 'sniper') { r(0, torsoTop - 1, 1, 12, '#75818d'); r(0, legsTop - 2, 2, 5, '#785232'); }
    if (wp === 'slingshot') { r(12, torsoTop + 4, 1, 4, '#986a3f'); r(11, torsoTop + 3, 3, 1, '#b88745'); }
    if (wp === 'dial') r(12, torsoTop + 5, 3, 2, '#d9c2a2');
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
  } else if (atk && wp !== null && ['spear', 'naginata', 'staff', 'hammer', 'club', 'pipe'].includes(wp ?? '')) {
    r(sx, ay + 1, 15 - sx, 2, sleeve); wristL(14); r(15, ay + 1, 1, 2, handL);
    r(16, ay - 5, 1, 11, wp === 'pipe' ? '#a4b0bc' : '#91643e');
    if (wp === 'spear' || wp === 'naginata') { r(16, ay - 8, 1, 4, '#e0e8f0'); r(17, ay - 6, 1, 2, '#a8bdcc'); }
    if (wp === 'hammer') r(14, ay - 6, 5, 3, '#9ba8b6');
    if (wp === 'club') { r(15, ay - 6, 3, 5, '#65505a'); r(15, ay - 4, 3, 1, '#a0a5b0'); }
  } else if (atk && wp !== null && ['rifle', 'sniper', 'slingshot', 'dial'].includes(wp ?? '')) {
    r(sx, ay + 1, 15 - sx, 2, sleeve); wristL(14); r(15, ay + 1, 1, 2, handL);
    if (wp === 'dial') { r(16, ay, 3, 3, '#e5cfb0'); r(17, ay + 1, 1, 1, '#b29a77'); }
    else if (wp === 'slingshot') { r(17, ay - 2, 1, 6, '#a67740'); r(16, ay - 3, 3, 1, '#b88745'); }
    else { r(14, ay + 1, 4, 2, '#715033'); r(16, ay, 4, 1, '#acb8c4'); if (wp === 'sniper') r(16, ay - 1, 3, 1, '#455264'); }
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

export interface SceneStrike {
  hero: boolean;
  hit: boolean;
  dodge: boolean;
  critical: boolean;
}

export interface SceneInput {
  hero: Who; crew: Who[]; foe: Who | null;
  /** 남의 배에 탄 말단 선원일 때 모시는 선장. 있으면(싸우지 않을 때) 선장이 맨 앞에 서고 주인공은 줄 끝에 선다 */
  captain?: Who | null;
  sailing: boolean; place: string; location: SceneLocation; weather: Weather; flag: NonNullable<Who['faction']>;
  aura: string | null; strike?: SceneStrike;
}

const FLAGS = {
  pirate: ['#373245', '#c37767'],
  marine: ['#dbe7e3', '#57829f'],
  rev: ['#536e69', '#93a87d'],
  civil: ['#a96462', '#c89871'],
} as const;
const PROJECTILE_WEAPONS = new Set<Weapon>(['gun', 'rifle', 'sniper', 'slingshot']);

function ship(s: Scenery, y: number, t: number, weather: Weather, flag: SceneInput['flag']) {
  const cx = s.x(.53), half = Math.min(96, s.x(.39));
  const left = cx - half, right = cx + half;
  const mast = cx + Math.round(half * .25);
  const sailTop = Math.max(10, y - 52);
  const billow = weather === 'calm' ? 0 : Math.round(Math.sin(t * 4) * 2);
  const sailWidth = Math.min(43, half - 13);
  const [banner, stripe] = FLAGS[flag];
  s.shape([[left - 4, y], [right + 6, y], [right - 9, y + 12],
    [right - 24, y + 17], [left + 17, y + 17], [left + 7, y + 12]], '#533f49');
  s.shape([[left, y + 3], [right, y + 2], [right - 10, y + 9],
    [left + 10, y + 9]], '#a27055');
  s.rect(left + 13, y + 10, right - left - 28, 2, '#805748');
  s.rect(left - 1, y, right - left + 2, 2, '#e4b183');
  for (let px = left + 18; px < right - 13; px += 13) {
    s.rect(px, y + 5, 4, 4, '#4c3841');
    s.rect(px + 1, y + 6, 2, 2, '#e3af79');
  }
  s.rect(mast, sailTop - 5, 2, y - sailTop + 5, '#725360');
  s.shape([[mast - sailWidth + 5, sailTop + 3], [mast - 1, sailTop],
    [mast - 2 + billow, y - 17], [mast - sailWidth, y - 20], [mast - sailWidth + billow, sailTop + 11]], '#f1e1c6');
  s.shape([[mast - sailWidth, y - 20], [mast - 2 + billow, y - 17],
    [mast - 1 + billow, y - 21], [mast - sailWidth + 1, y - 24]], '#c7a578');
  s.rect(mast - sailWidth + 3, sailTop + 2, sailWidth - 4, 1, '#fff3d7');
  s.shape([[mast + 4, sailTop + 7], [mast + sailWidth * .62, y - 19], [mast + 3, y - 18]], '#d6c1a9');
  s.shape([[mast + 2, sailTop - 5], [mast + 18, sailTop - 4 + billow],
    [mast + 13, sailTop + billow], [mast + 2, sailTop + 1]], banner);
  s.rect(mast + 3, sailTop - 2, 10, 1, stripe);
  if (weather !== 'calm') {
    for (let i = 0; i < 5; i++) {
      const wave = (Math.floor(t * 11) + i * 9) % 45;
      s.rect(left - 22 + wave, y + 13 + i % 3 * 3, 3 + i, 1, '#c9dfdb');
    }
  }
  return { left, right };
}

function strikeEffect(s: Scenery, strike: SceneStrike, weapon: Weapon, from: number, to: number, y: number, phase: number) {
  const d = strike.hero ? 1 : -1;
  const accent = strike.critical ? '#ffe79d' : '#c1e7f1';
  if (PROJECTILE_WEAPONS.has(weapon)) {
    const shot = from + (to - from) * Math.min(1, Math.max(0, (phase - .23) * 4));
    if (phase < .4) s.rect(from - 2, y - 1, 4, 3, '#fff4d3');
    s.rect(shot - 2 * d, y, 5, 1, accent);
  } else if (weapon === 'sword' || weapon === 'naginata' || weapon === 'spear') {
    const center = to - d * (strike.hit ? 0 : 8);
    s.shape([[center - 9 * d, y + 7], [center - 4 * d, y - 4], [center + 8 * d, y - 8],
      [center + 2 * d, y - 4], [center - 3 * d, y]], '#fff3de');
    s.rect(center - 2 * d, y + 3, 3, 1, accent);
  }
  if (!strike.hit || phase < .39) return;
  for (let i = 0; i < (strike.critical ? 11 : 6); i++) {
    const a = i * 2.4, length = 3 + (phase - .39) * (12 + i % 3 * 4);
    s.rect(to + Math.cos(a) * length, y + Math.sin(a) * length, i % 3 ? 2 : 3, 1, accent);
  }
  if (phase < .53) {
    s.rect(to - 3, y, 7, 1, '#fffae1');
    s.rect(to, y - 3, 1, 7, '#fffae1');
  }
}

let buffer: ReturnType<typeof makeCanvas> | undefined;

/** Draw at a small, integer pixel scale. Times are seconds since this canvas mounted. */
export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, sc: SceneInput, strikeAge = 1) {
  const scale = 2;
  const W = Math.ceil(w / scale), H = Math.ceil(h / scale);
  const [buf, bx] = buffer ??= makeCanvas(W, H);
  if (buf.width !== W || buf.height !== H) { buf.width = W; buf.height = H; }
  bx.imageSmoothingEnabled = false;
  const art = new Scenery(bx, W, H);
  const seed = hash(sc.location.name);
  const ground = sc.sailing ? drawSea(art, t, sc.weather) : landGround(art);
  const deck = sc.sailing ? ship(art, ground, t, sc.weather, sc.flag) : null;
  if (!sc.sailing) drawLand(art, sc.location, t, seed);

  const size = W >= 220 && H >= 72 ? 2 : 1;
  const crew = sc.crew.slice(0, 3);
  const mid = deck ? (deck.left + deck.right) / 2 : art.x(.51);
  const fighting = !!sc.foe;
  const front = fighting ? 2 : 1;
  const leftCrew = Math.ceil(crew.length / 2);
  const gaps = Math.max(1, crew.length + front - 1);
  const stageWidth = Math.max(0, (deck ? deck.right - deck.left : W) - 20);
  const spacing = Math.min(size * (fighting ? 44 : 33), stageWidth / gaps);
  const slot = (index: number) => mid + (index - (crew.length + front - 1) / 2) * spacing;
  const strike = sc.foe && sc.strike && strikeAge < .54 ? sc.strike : null;
  const phase = strikeAge / .54;
  const reach = strike ? Math.sin(Math.PI * phase) * size : 0;
  const weapon = (strike?.hero ? sc.hero : sc.foe)?.weapon ?? 'fist';
  const ranged = PROJECTILE_WEAPONS.has(weapon);
  const move = ranged ? reach * -2 : reach * Math.max(0, spacing / size - 11);
  const guard = strike?.dodge ? reach * 5 : strike?.hit && phase > .45 ? reach * 3 : 0;
  const heroX = slot(leftCrew) + (strike?.hero ? move : -guard);
  const foeX = slot(leftCrew + 1) - (strike && !strike.hero ? move : -guard);

  const put = (who: Who, cx: number, zoom: number, pose: 'attack' | null, flip: boolean, y = ground) => {
    const idle = t !== 0 && (t + (hash(who.key) % 20) * .13) % 2.8 > 2.49 ? 1 : 0;
    const sp = bodySprite(who, pose ? 0 : idle, pose);
    // The body is left-aligned in its sprite so it has room to swing a weapon.
    const anchor = (who.form === 'seaking' ? 10 : 8) * zoom;
    const sx = Math.round(cx - (flip ? sp.width * zoom - anchor : anchor));
    const sy = y - 22 * zoom;
    art.rect(cx - 5 * zoom, y - 1, 10 * zoom, 2, '#33293766');
    art.rect(cx - 3 * zoom, y + 1, 6 * zoom, 1, '#33293744');
    if (flip) {
      bx.save();
      bx.translate(sx + sp.width * zoom, sy);
      bx.scale(-1, 1);
      bx.drawImage(sp, 0, 0, sp.width * zoom, sp.height * zoom);
      bx.restore();
    } else {
      bx.drawImage(sp, sx, sy, sp.width * zoom, sp.height * zoom);
    }
  };
  let auraX = heroX;
  if (sc.captain && !fighting) {
    // 남의 배의 말단 선원: 주인공(줄 끝) → 선배 선원들 → 모시는 선장(맨 앞, 오른쪽)
    const line = [sc.hero, ...crew, sc.captain];
    const step = Math.min(size * 30, stageWidth / Math.max(1, line.length - 1));
    const at = (i: number) => mid + (i - (line.length - 1) / 2) * step;
    crew.forEach((c, i) => put(c, at(i + 1), 1, null, false, ground - 1));
    put(sc.captain, at(line.length - 1), size, null, false);
    auraX = at(0);
    put(sc.hero, auraX, size, null, false);
  } else {
    crew.forEach((c, i) => {
      const right = i >= leftCrew;
      put(c, slot(right ? i + front : i), 1, null, right, ground - 1);
    });
    const attacking = phase >= .18 && phase < .78;
    put(sc.hero, heroX, size, strike?.hero && attacking ? 'attack' : null, false);
    if (sc.foe) put(sc.foe, foeX, size, strike && !strike.hero && attacking ? 'attack' : null, true);
    if (strike && phase >= .23 && phase < .90) {
      strikeEffect(art, strike, weapon, strike.hero ? heroX + 9 * size : foeX - 9 * size,
        strike.hero ? foeX - 3 * size : heroX + 3 * size, ground - 11 * size, phase);
    }
  }
  if (sc.aura) {
    const color = sc.aura;
    for (let i = 0; i < 5; i++) {
      const life = (t * 6 + i * 2) % 10;
      if (life < 7) art.rect(auraX + (i * 5 % 19 - 9) * size, ground - (5 + i + life) * size, 1, 2, color);
    }
  }
  if (sc.sailing) drawSeaAir(art, t, sc.weather, seed);
  else drawLandAir(art, sc.location, t, seed);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, 0, 0, W * scale, H * scale);
  ctx.font = "12px 'Galmuri11', sans-serif";
  const labelWidth = Math.max(0, Math.min(w - 34, Math.ceil(ctx.measureText(sc.place).width)));
  if (!labelWidth) return;
  ctx.fillStyle = '#292336dc'; ctx.fillRect(8, 8, labelWidth + 18, 22);
  ctx.fillStyle = '#c89e76'; ctx.fillRect(8, 8, 2, 22);
  ctx.fillStyle = '#fff0cf'; ctx.textBaseline = 'middle'; ctx.fillText(sc.place, 17, 19, labelWidth);
  ctx.textBaseline = 'alphabetic';
}
