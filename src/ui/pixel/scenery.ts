import type { Weather } from '../../data/weather';
import type { Landscape, SceneLocation } from './locations';

type Point = readonly [number, number];
type Colors = readonly [string, string, string];
type Surface = 'stone' | 'earth' | 'snow' | 'sand' | 'cloud' | 'wood';

const SKY: Record<Landscape, Colors> = {
  harbor: ['#5087ac', '#86bbce', '#ddded1'],
  windmill: ['#548dc0', '#9dccc8', '#f6e8b6'],
  square: ['#5b7ba4', '#9fb9bf', '#f0d6ae'],
  hills: ['#588eb7', '#98c4c2', '#ebe3af'],
  orchard: ['#568f9d', '#a5c4aa', '#f1dea1'],
  dojo: ['#678f9e', '#a5bdb4', '#e6dcbb'],
  market: ['#6286af', '#acd0cf', '#ffdfb0'],
  fortress: ['#607798', '#9cabb7', '#ead8bd'],
  ruins: ['#656881', '#a19c9d', '#e1b991'],
  canal: ['#5c8bb8', '#a0c7d2', '#f2dfc7'],
  desert: ['#b97061', '#dfa276', '#ffdc9d'],
  winter: ['#536d98', '#8da8c4', '#d9ebeb'],
  sky: ['#737eba', '#a4b3e3', '#f9e5e3'],
  underwater: ['#193053', '#23466f', '#347e91'],
  castle: ['#66608c', '#a17eaa', '#f8c3ab'],
  forest: ['#395e72', '#64938b', '#bdcf9c'],
  mist: ['#302c4b', '#514763', '#857689'],
  rift: ['#5c607b', '#827e93', '#d5a695'],
  lab: ['#405980', '#778cac', '#d1f2eb'],
  coast: ['#435f98', '#7b9bbb', '#f0cba1'],
};

const SEA_SKY: Record<Weather, Colors> = {
  clear: ['#4b80b1', '#83b6ce', '#e8ddbd'],
  tailwind: ['#527da8', '#94bbce', '#f8dba9'],
  calm: ['#7a7dab', '#b2aac7', '#f3ceb4'],
  fog: ['#627383', '#82939d', '#b9c0be'],
  storm: ['#2a304c', '#404965', '#7a8296'],
  anomaly: ['#45334e', '#78516b', '#ca8079'],
};

const SURFACES: Record<Surface, Colors> = {
  stone: ['#aa9389', '#7c747a', '#5f5b6d'],
  earth: ['#c0a075', '#8c734f', '#685a47'],
  snow: ['#d0e8ec', '#a8c3d4', '#6e8aa7'],
  sand: ['#e5ad75', '#c18b60', '#9b674e'],
  cloud: ['#fff2eb', '#d9cce0', '#a9add4'],
  wood: ['#b88465', '#92654f', '#684c49'],
};

const ISLAND_SURFACE: Record<Landscape, Surface> = {
  harbor: 'wood', windmill: 'earth', square: 'stone', hills: 'earth', orchard: 'earth',
  dojo: 'earth', market: 'stone', fortress: 'stone', ruins: 'earth', canal: 'stone',
  desert: 'sand', winter: 'snow', sky: 'cloud', underwater: 'stone', castle: 'stone',
  forest: 'earth', mist: 'wood', rift: 'stone', lab: 'stone', coast: 'wood',
};

export class Scenery {
  constructor(readonly ctx: CanvasRenderingContext2D, readonly w: number, readonly h: number) {}

  x(fraction: number) { return Math.round(this.w * fraction); }

  rect(x: number, y: number, w: number, h: number, color: string) {
    const left = Math.round(x), top = Math.round(y);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(left, top, Math.round(x + w) - left, Math.round(y + h) - top);
  }

  // Draw diagonal edges on the same pixel grid as the sprites.
  shape(points: readonly Point[], color: string) {
    this.ctx.fillStyle = color;
    const top = Math.max(0, Math.floor(Math.min(...points.map((p) => p[1]))));
    const bottom = Math.min(this.h, Math.ceil(Math.max(...points.map((p) => p[1]))));
    for (let y = top; y < bottom; y++) {
      const edges: number[] = [];
      for (let i = 0, prev = points.length - 1; i < points.length; prev = i++) {
        const [ax, ay] = points[prev], [bx, by] = points[i];
        if ((ay > y + 0.5) !== (by > y + 0.5)) edges.push(ax + ((y + 0.5 - ay) * (bx - ax)) / (by - ay));
      }
      edges.sort((a, b) => a - b);
      for (let i = 0; i < edges.length; i += 2) {
        const left = Math.round(edges[i]), right = Math.round(edges[i + 1]);
        this.ctx.fillRect(left, y, right - left, 1);
      }
    }
  }

  disc(x: number, y: number, radius: number, color: string) {
    this.ctx.fillStyle = color;
    for (let row = -radius; row <= radius; row++) {
      const half = Math.floor(Math.sqrt(radius * radius - row * row));
      this.ctx.fillRect(Math.round(x) - half, Math.round(y) + row, half * 2 + 1, 1);
    }
  }
}

function cloud(s: Scenery, x: number, y: number, width: number, light: string, shade: string) {
  s.rect(x + width * 0.1, y + 8, width * 0.83, 3, shade);
  s.rect(x, y + 5, width, 3, light);
  s.rect(x + width * 0.12, y + 3, width * 0.76, 3, light);
  s.rect(x + width * 0.28, y, width * 0.39, 4, light);
  s.rect(x + width * 0.38, y - 2, width * 0.19, 2, light);
}

function sky(s: Scenery, colors: Colors, horizon: number, glow: string | null) {
  const gradient = s.ctx.createLinearGradient(0, 0, 0, horizon + 8);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(.47, colors[1]);
  gradient.addColorStop(1, colors[2]);
  s.ctx.fillStyle = gradient;
  s.ctx.fillRect(0, 0, s.w, s.h);
  if (glow) {
    s.disc(s.x(.77), horizon * .45, 12, '#ffe9bd29');
    s.disc(s.x(.77), horizon * .45, 8, glow);
  }
}

function ridge(s: Scenery, y: number, span: number, peaks: readonly number[], color: string) {
  const points: Point[] = peaks.map((height, i) => [Math.round(i * s.w / (peaks.length - 1)), y - height]);
  s.shape([...points, [s.w, y + span], [0, y + span]], color);
}

function water(s: Scenery, y: number, height: number, elapsed: number, colors: Colors, speed = 8) {
  s.rect(0, y, s.w, height, colors[0]);
  s.rect(0, y, s.w, 1, colors[2]);
  s.rect(0, y + height * .57, s.w, height * .43, colors[1]);
  for (let row = 0, dy = 3; dy < height; row++, dy += 3 + row) {
    const spacing = 23 + row * 9;
    const offset = Math.floor(row * 17 + elapsed * speed / (1 + 0.3 * row)) % spacing;
    for (let x = offset - spacing; x < s.w; x += spacing) {
      s.rect(x, y + dy, 3 + row * 2, 1, colors[2]);
      s.rect(x + 6 + row * 2, y + dy, 2, 1, colors[0]);
    }
  }
}

function surface(s: Scenery, ground: number, kind: Surface, seed: number) {
  const [top, middle, dark] = SURFACES[kind], height = s.h - ground;
  s.rect(0, ground, s.w, height, middle);
  s.rect(0, ground, s.w, 2, top);
  s.rect(0, ground + height * .70, s.w, height, dark);
  if (kind === 'stone' || kind === 'wood') {
    const rowHeight = kind === 'wood' ? 5 : 6;
    const tile = kind === 'wood' ? 38 : 19;
    for (let row = 0, y = ground + 4; y < s.h; row++, y += rowHeight) {
      s.rect(0, y, s.w, 1, dark);
      for (let x = (row * 13 + seed % 11) % tile; x < s.w; x += tile) {
        s.rect(x, y - rowHeight + 2, 1, rowHeight - 1, dark);
        s.rect(x + 2, y + 1, 6, 1, top);
      }
    }
  } else {
    for (let i = 0; i < s.w / 3; i++) {
      const x = (i * 47 + seed) % s.w;
      const y = ground + 3 + (i * 7 + seed % 19) % Math.max(1, height - 3);
      s.rect(x, y, 2 + i % 5, 1, i % 3 === 0 ? top : dark);
    }
  }
}

function house(s: Scenery, x: number, y: number, width: number, height: number, wall: string, roof: string) {
  const top = y - height;
  s.rect(x, top, width, height, wall);
  s.rect(x + width - 4, top, 4, height, '#262b4933');
  s.shape([[x - 3, top], [x + 4, top - 7], [x + width - 5, top - 7],
    [x + width + 3, top]], roof);
  s.rect(x - 2, top, width + 4, 2, '#342d49');
  s.rect(x + 3, top + 5, 4, 6, '#39465a');
  s.rect(x + 4, top + 6, 2, 3, '#ffda9b');
  s.rect(x + width - 10, top + 5, 4, 6, '#39465a');
  s.rect(x + width - 9, top + 6, 2, 3, '#efbd84');
  s.rect(x + width / 2 - 2, y - 8, 5, 8, '#534357');
}

function tree(s: Scenery, x: number, y: number, size: number, type: 'leaf' | 'pine' | 'bloom' | 'coral' = 'leaf') {
  const top = y - size, half = Math.floor(size / 3);
  s.rect(x - 1, top + 3, 3, size - 3, '#564554');
  if (type === 'pine') {
    for (let i = 0; i < 3; i++) {
      const cy = top + i * size / 6, span = half * (.56 + i * .23);
      s.shape([[x, cy], [x - span, cy + size / 3], [x + span, cy + size / 3]], '#3d6273');
      s.shape([[x, cy], [x - span, cy + size / 3], [x + 2, cy + size / 4]], '#c7e3e8');
    }
    return;
  }
  const [shade, light] = type === 'bloom' ? ['#995d89', '#e9a3b6']
    : type === 'coral' ? ['#4a547e', '#9b75a6'] : ['#356459', '#6a905e'];
  s.disc(x, top + half, half, shade);
  s.disc(x - half * .55, top + half, Math.round(half * .69), shade);
  s.disc(x + half * .36, top + half * .80, Math.round(half * .66), light);
  s.rect(x - half, top + half, 3, 1, light);
}

function tower(s: Scenery, x: number, y: number, width: number, height: number, wall: string, trim: string) {
  const top = y - height;
  s.rect(x, top, width, height, wall);
  s.rect(x + width - 4, top, 4, height, '#33345744');
  s.rect(x - 2, top, width + 4, 3, trim);
  for (let i = 0; i < width; i += 5) s.rect(x + i, top - 3, 3, 3, wall);
  s.rect(x + width / 2 - 1, top + 7, 3, 8, trim);
  s.rect(x + width / 2 - 2, y - 8, 5, 8, '#403e57');
}

function mountain(s: Scenery, x: number, y: number, w: number, h: number, face: Colors) {
  s.shape([[x - w * .51, y], [x - w * .12, y - h * .84], [x, y - h],
    [x + w * .28, y - h * .43], [x + w * .55, y]], face[0]);
  s.shape([[x, y - h], [x + w * .28, y - h * .43], [x + w * .55, y], [x + w * .15, y]], face[1]);
  s.shape([[x - w * .18, y - h * .70], [x - w * .12, y - h * .84], [x, y - h],
    [x + w * .14, y - h * .70], [x + w * .04, y - h * .77], [x - w * .03, y - h * .70],
    [x - w * .07, y - h * .77]], face[2]);
}

function pagoda(s: Scenery, x: number, ground: number, levels: number, roof: string, walls: string) {
  for (let level = 0; level < levels; level++) {
    const width = 46 - level * 10, y = ground - level * 12;
    s.rect(x - width / 2 + 4, y - 8, width - 8, 8, walls);
    s.rect(x - width / 2 + 8, y - 7, width - 16, 5, '#ffe0ab');
    for (let i = 4; i < width - 8; i += 6) s.rect(x - width / 2 + i, y - 7, 1, 7, '#795765');
    s.shape([[x - width / 2, y - 10], [x - width / 2 + 5, y - 10], [x - width / 2 + 10, y - 14],
      [x + width / 2 - 10, y - 14], [x + width / 2 - 5, y - 10], [x + width / 2, y - 10],
      [x + width / 2 - 3, y - 7], [x - width / 2 + 3, y - 7]], roof);
    s.rect(x - width / 2 + 4, y - 8, width - 8, 1, '#ffe2ba55');
  }
}

function windmill(s: Scenery, x: number, base: number, t: number) {
  house(s, x - 10, base, 20, 22, '#e0c7a1', '#865660');
  const pivot = base - 24;
  for (let i = 0; i < 4; i++) {
    const a = t * .95 + i * Math.PI / 2 + .26;
    const c = Math.cos(a), d = Math.sin(a);
    const blade = (length: number, width: number): Point => [x + length * c - width * d, pivot + length * d + width * c];
    s.shape([blade(0, -1), blade(19, -1), blade(19, 1), blade(0, 1)], '#615064');
    s.shape([blade(7, 0), blade(19, 0), blade(19, 5), blade(8, 4)], '#fff1ce');
    s.shape([blade(8, 3), blade(19, 4), blade(19, 5), blade(8, 5)], '#cfae91');
  }
  s.rect(x - 2, pivot - 2, 4, 4, '#6b4751');
}

function bubbles(s: Scenery, t: number, y: number, color: string) {
  for (let i = 0; i < 14; i++) {
    const x = s.x(((i * 37 + 9) % 101) / 101) + Math.round(Math.sin(t + i) * 2);
    const py = y - ((i * 19 + Math.floor(t * (7 + i % 3))) % y);
    const size = 2 + i % 4;
    s.rect(x + 1, py, size, 1, color);
    s.rect(x, py + 1, 1, size, color);
    s.rect(x + size + 1, py + 1, 1, size, color);
    s.rect(x + 1, py + size + 1, size, 1, color);
  }
}

function particles(s: Scenery, t: number, seed: number, color: string, count: number, vx: number, vy: number, width: number) {
  for (let i = 0; i < count; i++) {
    const x = ((i * 47 + seed + Math.floor(t * vx)) % s.w + s.w) % s.w;
    const y = (i * 29 + seed % 53 + Math.floor(t * vy)) % s.h;
    s.rect(x, y, width + i % 2, 1 + (i % 5 === 0 ? 1 : 0), color);
  }
}

export function landGround(s: Scenery) { return Math.round(s.h * .76); }

export function drawLand(s: Scenery, location: SceneLocation, t: number, seed: number) {
  const { landscape, name } = location;
  const g = landGround(s), h = Math.round(s.h * .48), x = (p: number) => s.x(p);
  const base = g - 4;
  const dark = landscape === 'underwater' || landscape === 'mist' || landscape === 'rift';
  sky(s, SKY[landscape], h, dark ? null : '#fff1c5');
  if (landscape !== 'underwater') {
    for (let i = 0; i < 3; i++) {
      const offset = (i * (s.w + 42) / 3 + seed % 83 + t * (2 + i)) % (s.w + 42);
      cloud(s, offset - 41, h * (.25 + i * .13), 30 + i * 7, dark ? '#9b8b9a77' : '#fff0dd9c', '#ece3e23d');
    }
  }

  switch (landscape) {
    case 'windmill':
    case 'hills':
    case 'orchard':
    case 'dojo': {
      ridge(s, base, 8, [19, 33, 24, 48, 28, 35, 19, 30, 18], '#7ea38b');
      ridge(s, base, 8, [8, 17, 10, 23, 18, 15, 24, 15, 11], '#517b63');
      if (landscape === 'windmill') {
        for (const [p, width] of [[.1, 19], [.23, 23], [.48, 18], [.86, 23]]) {
          house(s, x(p) - width / 2, base + 2, width, 12, '#d5b390', '#a06258');
        }
        windmill(s, x(.69), base, t);
      } else if (landscape === 'hills') {
        house(s, x(.62) - 22, base - 15, 44, 21, '#efddbc', '#746179');
        tree(s, x(.19), base + 3, 28);
        for (let i = 0; i < 8; i++) {
          const px = x(.07 + i * .11), py = base - 3 - i % 3 * 3;
          s.rect(px, py, 4, 2, '#f0e2bd');
          s.rect(px + 4, py + 1, 1, 2, '#65586a');
        }
      } else if (landscape === 'orchard') {
        for (let i = 0; i < 7; i++) {
          const px = x(.06 + i * .145), size = 20 + i % 3 * 5, py = base + 2 - i % 2 * 5;
          tree(s, px, py, size);
          s.rect(px - 4, py - size + 6, 2, 2, '#f5ae62');
          s.rect(px + 4, py - size + 9, 2, 2, '#f8bd73');
        }
      } else {
        pagoda(s, x(.68), base + 2, 1, '#536d6e', '#cfb699');
        for (let i = 0; i < 18; i++) {
          const px = x(i * .054), height = 15 + (i * 11) % 27;
          s.rect(px, base + 2 - height, 2, height, '#5f8066');
          s.rect(px - 3, base + 3 - height, 5, 1, '#a0af7b');
        }
      }
      s.rect(0, base + 3, s.w, 2, '#a8a373');
      break;
    }
    case 'square':
    case 'market':
    case 'fortress':
    case 'ruins': {
      const ruin = landscape === 'ruins';
      const fort = landscape === 'fortress';
      const market = landscape === 'market';
      ridge(s, base, 4, [22, 25, 29, 20, 27, 22, 33, 19], ruin ? '#999096' : '#969baa');
      if (fort || ruin) {
        s.rect(0, base - 17, s.w, 18, ruin ? '#948b90' : '#adabb0');
        for (let i = 0; i < 7; i++) {
          tower(s, x(i / 6) - 8, base + 1, 18, (ruin ? 18 : 26) + (seed + i * 7) % 13, '#bdb3af', '#716f84');
        }
      } else {
        const walls = ['#d1a894', '#ddbe9e', '#c1948c', '#eed7ae'];
        for (let i = 0; i < 6; i++) {
          const width = Math.min(39, Math.max(20, s.w / 7));
          house(s, x(.035 + i * .18) - width / 2, base, width, 17 + (seed % 17 + i * 7) % 17, walls[i % 4], i % 2 ? '#77647a' : '#97666d');
        }
      }
      if (name === '로그타운') {
        const px = x(.70);
        s.rect(px - 14, base - 9, 28, 3, '#513e48');
        s.rect(px - 10, base - 30, 2, 24, '#513e48');
        s.rect(px + 10, base - 30, 2, 24, '#513e48');
        s.rect(px - 11, base - 30, 25, 2, '#6d4c4a');
        for (let i = 0; i < 5; i++) s.rect(px + 12 + i * 2, base - 7 + i, 3, 1, '#78595c');
      } else if (market) {
        for (let j = 0; j < 4; j++) {
          const px = x(.17 + j * .22);
          s.rect(px - 9, base - 10, 18, 11, '#745454');
          for (let i = 0; i < 5; i++) s.rect(px - 12 + i * 5, base - 12, 5, 5, i % 2 ? '#f1d9a7' : ['#bc655d', '#538271', '#a478ad', '#bf8553'][j]);
        }
      }
      s.rect(0, base, s.w, 4, ruin ? '#797075' : '#776e7b');
      break;
    }
    case 'canal': {
      const bridge = x(.63);
      for (let i = 0; i < 8; i++) {
        const w = Math.max(17, Math.min(30, s.w / 9));
        house(s, x(.02 + i * .139) - w / 2, h + 8, w, 16 + (i * 11 + seed % 21) % 22, ['#c99e97', '#e2c6a8', '#99abb8'][i % 3], '#917081');
      }
      water(s, h + 7, g - h, t, ['#4f91a5', '#396879', '#aad1cd'], 9);
      const rise = h + 3;
      s.shape([[bridge - 31, base], [bridge - 23, rise + 2], [bridge - 11, rise - 2],
        [bridge + 11, rise - 2], [bridge + 23, rise + 2], [bridge + 32, base],
        [bridge + 22, base], [bridge + 18, rise + 8], [bridge + 8, rise + 5],
        [bridge - 8, rise + 5], [bridge - 18, rise + 8], [bridge - 22, base]], '#b6a5a4');
      s.rect(bridge - 11, rise - 3, 22, 2, '#e7d2be');
      const boat = ((Math.floor(t * 8) + seed % 67) % (s.w + 28)) - 14;
      s.shape([[boat - 9, base - 6], [boat + 11, base - 6], [boat + 7, base - 3], [boat - 6, base - 3]], '#5a4560');
      s.rect(boat - 4, base - 8, 9, 2, '#daa782');
      break;
    }
    case 'desert': {
      ridge(s, base, 4, [15, 22, 13, 17, 34, 32, 23, 12, 18], '#d79a73');
      ridge(s, base, 4, [5, 12, 15, 8, 12, 16, 10, 21, 17], '#e4ae78');
      const px = x(.66);
      s.rect(px - 27, base - 17, 54, 17, '#b47e70');
      s.disc(px, base - 18, 13, '#c5957a');
      s.rect(px - 2, base - 34, 4, 7, '#9c6b65');
      s.rect(px - 5, base - 11, 10, 11, '#775861');
      tower(s, px - 37, base, 11, 31, '#d0a184', '#8c6264');
      tower(s, px + 27, base, 11, 31, '#d0a184', '#8c6264');
      for (const p of [.14, .25, .89]) tree(s, x(p), base, 17, 'leaf');
      break;
    }
    case 'winter':
    case 'rift': {
      const winter = landscape === 'winter';
      const frost: Colors = ['#809cbb', '#576f95', '#e1edf0'];
      mountain(s, x(.14), base + 1, 86, h * .83, frost);
      mountain(s, x(.43), base + 1, 110, h * 1.25, frost);
      mountain(s, x(.79), base + 1, 107, h * 1.07, winter ? frost : ['#8d555f', '#62425e', '#eb946d']);
      ridge(s, base, 5, [7, 5, 3, 8, 5, 4, 9, 6], winter ? '#acc8dc' : '#65566f');
      if (winter) {
        tower(s, x(.69), base - 10, 20, 23, '#d0cfdb', '#636986');
        for (const [p, size] of [[.12, 25], [.20, 16], [.91, 30], [.83, 23]]) tree(s, x(p), base + 3, size, 'pine');
      } else {
        s.shape([[x(.60), base + 1], [x(.54), base - 13], [x(.57), base - 21], [x(.59), base - 10],
          [x(.66), base + 1]], '#e98361');
      }
      break;
    }
    case 'sky': {
      for (let i = 0; i < 8; i++) {
        cloud(s, x((i * .19 + t * .008) % 1.23 - .2), h + i % 4 * 7, 48 + i % 4 * 15, '#fff1e9', '#c0b7df');
      }
      const px = x(.69);
      s.shape([[px - 32, base - 15], [px + 32, base - 15], [px + 22, base - 4], [px + 4, base + 1],
        [px - 18, base - 6]], '#a595ae');
      s.rect(px - 34, base - 17, 68, 4, '#ccbd98');
      house(s, px - 22, base - 16, 44, 16, '#e7d3be', '#b0849d');
      cloud(s, px - 52, base - 8, 42, '#fff6ed', '#c1afd2');
      cloud(s, px + 18, base - 12, 44, '#fff6ed', '#c1afd2');
      break;
    }
    case 'underwater': {
      s.shape([[x(.13), 0], [x(.28), 0], [x(.43), base], [x(.01), base]], '#7ce7dd1d');
      s.shape([[x(.59), 0], [x(.67), 0], [x(.91), base], [x(.53), base]], '#9df6f028');
      const px = x(.65);
      s.disc(px, base - 5, Math.min(37, x(.28)), '#64a9b940');
      s.disc(px, base - 5, Math.min(35, x(.27)), '#4b8498');
      pagoda(s, px, base + 2, 3, '#856a9c', '#b991b4');
      for (const [p, size] of [[.08, 26], [.17, 17], [.90, 23], [.98, 34]]) tree(s, x(p), base + 5, size, 'coral');
      for (let i = 0; i < 7; i++) {
        const fx = (x(.12 + i * .04) + Math.floor(t * 12)) % (s.w + 12) - 6, fy = h * .55 + i % 3 * 4;
        s.rect(fx, fy, 4, 2, '#82b6c2');
        s.rect(fx - 1, fy - i % 2, 1, 3, '#82b6c2');
      }
      break;
    }
    case 'castle': {
      ridge(s, base, 5, [22, 33, 29, 42, 26, 41, 32, 35, 27], '#916d9b');
      ridge(s, base, 5, [15, 18, 12, 19, 22, 15, 33, 14], '#75647f');
      pagoda(s, x(.67), base + 1, 3, '#46415f', '#d7a18e');
      tree(s, x(.16), base + 5, 39, 'bloom');
      tree(s, x(.29), base + 5, 25, 'bloom');
      tree(s, x(.93), base + 5, 33, 'bloom');
      for (const p of [.40, .84]) {
        s.rect(x(p), base - 15, 1, 15, '#674959');
        s.rect(x(p) - 2, base - 14, 5, 6, '#f9ac75');
        s.rect(x(p) - 1, base - 13, 3, 3, '#ffdaa6');
      }
      break;
    }
    case 'forest': {
      ridge(s, base, 5, [23, 33, 28, 39, 34, 23, 31, 24], '#658f78');
      for (let i = 0; i < 16; i++) tree(s, x(.02 + i * .068), base + 5, 18 + (i * 13 + seed % 19) % 27);
      if (name === '리틀 가든') {
        const px = x(.70), peak = base - 12 - h * .73;
        mountain(s, px, base - 12, 58, h * .73, ['#4e6268', '#3c535a', '#be987c']);
        for (let i = 0; i < 4; i++) {
          const rise = (t * 3 + i * 4) % 16;
          s.disc(px + rise, peak - rise, 2 + i % 2, '#d5b2997b');
        }
      } else if (name === '샤본디 제도' || name === '엘바프') {
        for (const p of [.19, .76]) {
          const px = x(p), height = Math.round(h * .93);
          s.shape([[px - 19, base + 2], [px - 6, base - 16], [px - 3, base - height], [px + 7, base - height],
            [px + 9, base - 14], [px + 23, base + 2]], '#455c56');
          s.disc(px + 4, base - height, 20, '#527865');
          s.disc(px - 1, base - height - 5, 14, '#7b9f76');
        }
      } else {
        house(s, x(.67) - 15, base, 30, 18, '#ac9479', '#575264');
      }
      break;
    }
    case 'lab': {
      ridge(s, base, 4, [17, 12, 30, 19, 19, 33, 18, 21], '#748ca8');
      const px = x(.67);
      s.rect(px - 29, base - 23, 58, 23, '#768d9f');
      s.disc(px, base - 22, 24, '#abbcc8');
      s.disc(px - 3, base - 25, 17, '#e0dfdc');
      s.rect(px - 29, base - 18, 58, 11, '#54667f');
      s.rect(px - 28, base - 15, 56, 2, '#8ff2d9');
      s.rect(px - 2, base - 49, 2, 9, '#86bac5');
      s.rect(px - 3, base - 50, 4, 2, '#d9f7df');
      for (const p of [.16, .32, .91]) tower(s, x(p) - 5, base, 10, 19, '#8795a9', '#4f677d');
      break;
    }
    case 'mist':
    case 'coast':
    case 'harbor': {
      const mist = landscape === 'mist';
      water(s, h, g - h + 1, t, mist ? ['#575b78', '#454b67', '#9a8e9a'] : ['#6b9eaa', '#44788a', '#afc9c4']);
      ridge(s, h + 3, 2, [10, 14, 9, 2, 0, 5, 12, 9, 8], mist ? '#61566f' : '#799087');
      const px = x(.72);
      if (mist) {
        pagoda(s, px, h + 5, 2, '#3c344e', '#695872');
        tower(s, px + 21, h + 5, 12, 28, '#60506a', '#35314a');
      } else if (name === '해상 레스토랑 발라티에') {
        s.shape([[px - 42, h + 7], [px + 40, h + 7], [px + 30, h + 16], [px - 30, h + 16]], '#71534e');
        house(s, px - 30, h + 7, 57, 14, '#d8bc8e', '#977862');
        s.disc(px + 34, h + 3, 8, '#c1a773');
        s.rect(px + 35, h + 1, 2, 2, '#4b4656');
      } else if (name === '리버스 마운틴') {
        const peak = h - Math.round(h * .76);
        mountain(s, px, h + 13, 100, h + 13 - peak, ['#8b7b8a', '#596783', '#c0b8ac']);
        s.shape([[px - 1, peak + 4], [px + 28, h + 9], [px + 19, h + 11], [px - 3, peak + 6]], '#accfd8');
        for (let i = 0; i < 7; i++) {
          const rise = ((i * 6 - Math.floor(t * 14)) % 42 + 42) % 42 / 42;
          s.rect(px + rise * 24, peak + 5 + rise * (h - peak + 3), 3, 1, '#edf5ec');
        }
      } else if (landscape === 'coast') {
        s.shape([[px - 30, h + 9], [px - 14, h - 1], [px + 23, h - 1], [px + 38, h + 9]], '#6c7b78');
        s.rect(px - 4, h - 26, 9, 25, '#e1c7b1');
        s.rect(px - 4, h - 19, 9, 4, '#b98179');
        s.rect(px - 6, h - 28, 13, 3, '#56516b');
        s.rect(px - 3, h - 25, 7, 3, '#ffe0a1');
      } else {
        for (let i = 0; i < 4; i++) house(s, x(.43 + i * .17), h + 8, 19 + (seed + i * 5) % 8, 12 + (seed + i * 7) % 9, '#cdaa91', i % 2 ? '#926b72' : '#6b7788');
      }
      break;
    }
  }
  surface(s, g, ISLAND_SURFACE[landscape], seed);
}

export function drawLandAir(s: Scenery, location: SceneLocation, t: number, seed: number) {
  const { landscape, name } = location;
  const g = landGround(s);
  switch (landscape) {
    case 'underwater': bubbles(s, t, g + 2, '#bfece7a6'); break;
    case 'winter': particles(s, t, seed, '#fcf2ecc2', 34, -11, 13, 1); break;
    case 'castle': particles(s, t, seed, '#ffaec5bd', 21, -14, 8, 1); break;
    case 'desert': particles(s, t, seed, '#ffe2aa95', 21, 32, 3, 4); break;
    case 'rift': particles(s, t, seed, '#ffc17a90', 27, -23, 17, 1); break;
    case 'forest':
      if (name === '샤본디 제도') bubbles(s, t, g, '#d8ead29b');
      else particles(s, t, seed, '#d6d68793', 13, 7, 4, 1);
      break;
    case 'mist':
      for (let i = 0; i < 4; i++) cloud(s, (t * (4 + i) + i * s.w * .3) % (s.w + 85) - 85, g - 13 - i * 10, 82, '#d3c4d045', '#b2a5c72b');
      break;
  }
}

export function drawSea(s: Scenery, t: number, weather: Weather) {
  const h = Math.round(s.h * .50);
  const storm = weather === 'storm' || weather === 'anomaly';
  const colors = Object.hasOwn(SEA_SKY, weather) ? SEA_SKY[weather] : SEA_SKY.clear;
  sky(s, colors, h, storm || weather === 'fog' ? null : '#fff1c7');
  for (let i = 0; i < 6; i++) {
    const width = (storm ? 60 : 34) + i * 4;
    const x = (i * (s.w + 70) / 6 + t * (storm ? 17 : 5)) % (s.w + 70) - 68;
    cloud(s, x, 7 + i % 4 * 7, width, storm ? '#383d5890' : '#f3e8d990', '#e7ddd844');
  }
  water(s, h, s.h - h, t, storm ? ['#47667e', '#344b66', '#a0bec6'] : ['#588fa8', '#356886', '#adccd1'],
    storm ? 26 : weather === 'tailwind' ? 18 : weather === 'calm' ? 1 : 7);
  const amplitude = storm ? 3 : weather === 'calm' ? 0 : 1;
  return Math.round(s.h * .72 + Math.sin(t * (storm ? 3.5 : 2.0)) * amplitude);
}

export function drawSeaAir(s: Scenery, t: number, weather: Weather, seed: number) {
  if (weather === 'storm' || weather === 'anomaly') {
    for (let i = 0; i < s.w / 4; i++) {
      const x = ((i * 67 + seed - Math.floor(t * 69)) % s.w + s.w) % s.w;
      const y = (i * 23 + Math.floor(t * 86)) % s.h;
      for (let step = 0; step < 4; step++) s.rect(x - step, y + step, 1, 1, '#c3d7e294');
    }
  } else if (weather === 'fog') {
    for (let i = 0; i < 5; i++) cloud(s, (i * s.w * .28 + t * 7) % (s.w + 80) - 80, 14 + i * 11, 78, '#d4dcd870', '#c9d5d23a');
  } else if (weather === 'tailwind') {
    particles(s, t, seed, '#fff6d56b', 17, 26, 4, 5);
  }
}
