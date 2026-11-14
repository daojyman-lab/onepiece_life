// 시작 화면의 해적 깃발 (코드로 그리는 도트). 해골 · 엇갈린 뼈 · 붉은 두건. 특정 해적단의 깃발이 아닌 이 게임만의 문양.
// 바람에 펄럭이도록 프레임마다 세로 물결을 준다.

const W = 56, H = 36;
const SKULL = [
  '....XXXXXX....',
  '..XXXXXXXXXX..',
  '.XXXXXXXXXXXX.',
  '.XXXXXXXXXXXX.',
  'XXX..XXXX..XXX',
  'XXX..XXXX..XXX',
  'XXXXXXX.XXXXXX',
  '.XXXXX...XXXX.',
  '..XXXXXXXXXX..',
  '..X.X.XX.X.X..',
  '...XXXXXXXX...',
];

let base: HTMLCanvasElement | null = null;

/** 깃발 한 장 (물결 없이) */
function drawBase(): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d')!;
  const r = (px: number, py: number, w: number, h: number, col: string) => { x.fillStyle = col; x.fillRect(px, py, w, h); };
  // 천
  r(0, 0, W, H, '#1e1824'); r(0, 0, W, 1, '#3a3044'); r(0, H - 1, W, 1, '#0e0a12');
  for (let i = 0; i < W; i += 7) r(i, 0, 1, H, '#241c2c');
  // 해진 끝자락
  for (const [px, py] of [[W - 1, 4], [W - 1, 5], [W - 2, 5], [W - 1, 17], [W - 1, 26], [W - 1, 27], [W - 2, 27], [W - 1, 32]]) x.clearRect(px, py, 1, 1);
  // 엇갈린 뼈 (해골 뒤)
  const bone = '#e8e2d0', boneS = '#b8b0a0';
  const cx = W / 2, cy = 19;
  for (let i = -21; i <= 21; i++) {
    const dy = Math.round(i * 0.62);
    r(cx + i - 1, cy + dy - 1, 3, 3, bone);
    r(cx - i - 2, cy + dy - 1, 3, 3, bone);
  }
  for (const [ox, oy] of [[-25, -16], [21, -16], [-25, 11], [21, 11]]) {
    r(cx + ox, cy + oy, 4, 5, bone); r(cx + ox + 1, cy + oy - 1, 2, 7, bone); r(cx + ox + 1, cy + oy + 4, 3, 1, boneS);
  }
  // 해골 (한 칸을 2×2로 크게)
  const P = 2;
  const sx = Math.round(cx - (SKULL[0].length * P) / 2), sy = 6;
  const px = (i: number, j: number, w: number, h: number, col: string) => r(sx + i * P, sy + j * P, w * P, h * P, col);
  SKULL.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') px(i, j, 1, 1, '#f4efe2'); }));
  px(12, 2, 1, 5, '#cfc6b4'); px(1, 7, 1, 1, '#cfc6b4'); px(4, 10, 6, 1, '#cfc6b4');
  // 눈 · 코: 비운 칸, 눈 속 붉은 빛
  px(3, 4, 2, 2, '#1e1824'); px(9, 4, 2, 2, '#1e1824');
  r(sx + 3 * P + 1, sy + 4 * P + 1, 2, 2, '#c8322a'); r(sx + 9 * P + 1, sy + 4 * P + 1, 2, 2, '#c8322a');
  // 붉은 두건과 매듭
  px(1, 1, 12, 2, '#c8322a'); px(2, 0, 10, 1, '#c8322a'); px(1, 2, 12, 1, '#962018');
  r(sx + 2 * P, sy + P, 2, 1, '#e85a48'); r(sx + 6 * P, sy + P, 3, 1, '#e85a48');
  px(13, 2, 2, 2, '#c8322a'); px(15, 3, 2, 1, '#c8322a'); px(15, 4, 1, 2, '#962018'); px(16, 1, 1, 2, '#c8322a');
  return c;
}

/** 깃대와 함께 그린다. t는 프레임 수 */
export function drawFlag(ctx: CanvasRenderingContext2D, scale: number, t: number) {
  base ??= drawBase();
  const pole = 4;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const s = scale;
  // 깃대
  ctx.fillStyle = '#6a4426'; ctx.fillRect(1 * s, 2 * s, 2 * s, (H + 14) * s);
  ctx.fillStyle = '#8a5c34'; ctx.fillRect(1 * s, 2 * s, 1 * s, (H + 14) * s);
  ctx.fillStyle = '#e8c040'; ctx.fillRect(0, 0, 4 * s, 3 * s);
  // 천: 세로 띠마다 물결만큼 내린다 (깃대 쪽은 거의 움직이지 않는다)
  for (let i = 0; i < W; i++) {
    const amp = (i / W) * 2.2;
    const dy = Math.round(Math.sin(t * 0.08 - i * 0.22) * amp);
    ctx.drawImage(base, i, 0, 1, H, (pole + i) * s, (3 + dy) * s, s, H * s);
    // 그늘: 물결이 내려간 곳은 조금 어둡게
    if (dy > 0) { ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect((pole + i) * s, (3 + dy) * s, s, H * s); }
  }
}

export const FLAG_SIZE = { w: W + 4, h: H + 16 };
