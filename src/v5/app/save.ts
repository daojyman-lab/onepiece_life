// v5 저장 · 불러오기 · 내보내기 · 가져오기. 열쇠는 gt5.* (v4의 gt4.*는 읽지도 지우지도 않는다).
import { normalizeLife5, normalizeMeta5 } from '../core/load';
import { emptyMeta5, type Meta5 } from '../core/meta';
import { fullName } from '../core/state';
import type { Life5 } from '../core/types';

const K = { life: 'gt5.life', meta: 'gt5.meta', settings: 'gt5.settings' };

export interface Settings { speed: 0 | 1 | 2 | 4 | 8; battleSpeed: 1 | 2 | 4; sfx: boolean; bgm: boolean }
export const defaultSettings = (): Settings => ({ speed: 1, battleSpeed: 1, sfx: true, bgm: true });

const SPEEDS: readonly Settings['speed'][] = [0, 1, 2, 4, 8];
const BATTLE_SPEEDS: readonly Settings['battleSpeed'][] = [1, 2, 4];

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; }
}

/** 저장된 설정을 읽는다. 모양이 틀린 칸은 기본값 */
function normalizeSettings(x: unknown): Settings {
  const d = defaultSettings();
  if (typeof x !== 'object' || x === null) return d;
  const o = x as Partial<Record<keyof Settings, unknown>>;
  return {
    speed: SPEEDS.includes(o.speed as Settings['speed']) ? (o.speed as Settings['speed']) : d.speed,
    battleSpeed: BATTLE_SPEEDS.includes(o.battleSpeed as Settings['battleSpeed']) ? (o.battleSpeed as Settings['battleSpeed']) : d.battleSpeed,
    sfx: typeof o.sfx === 'boolean' ? o.sfx : d.sfx,
    bgm: typeof o.bgm === 'boolean' ? o.bgm : d.bgm,
  };
}

export const save = {
  loadLife(): Life5 | null { try { return normalizeLife5(read(K.life)); } catch { return null; } },
  saveLife(s: Life5) { return write(K.life, s); },
  clearLife() { try { localStorage.removeItem(K.life); } catch { /* 무시 */ } },
  loadMeta(): Meta5 { try { return normalizeMeta5(read(K.meta)); } catch { return emptyMeta5(); } },
  saveMeta(m: Meta5) { return write(K.meta, m); },
  loadSettings(): Settings { try { return normalizeSettings(read(K.settings)); } catch { return defaultSettings(); } },
  saveSettings(x: Settings) { return write(K.settings, x); },
};

export function exportFile(life: Life5 | null, meta: Meta5): void {
  const blob = new Blob([JSON.stringify({ app: 'grand-treasure', version: 5, life, meta })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const name = life ? `${fullName(life.hero)}_${life.age}세` : 'meta';
  a.download = `grand-treasure-v5-${name}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** 내보낸 파일의 글을 읽는다(순수 함수). 인생이 깨져 있으면 아무것도 받지 않고 이유를 돌려준다 */
export function parseImport(text: string): { life: Life5 | null; meta: Meta5 | null; error?: string } {
  let data: unknown;
  try { data = JSON.parse(text); } catch { return { life: null, meta: null, error: '파일을 읽지 못했다' }; }
  const d = (typeof data === 'object' && data !== null ? data : {}) as { app?: unknown; version?: unknown; life?: unknown; meta?: unknown };
  if (d.app !== 'grand-treasure' || d.version !== 5) return { life: null, meta: null, error: '그랜드 트레저 v5 저장 파일이 아니다' };
  let life: Life5 | null = null;
  if (d.life) {
    try { life = normalizeLife5(d.life); } catch { life = null; }
    if (!life) return { life: null, meta: null, error: '파일 속 인생이 깨져 있어 이어 갈 수 없다' };
  }
  const m = d.meta as { schema?: unknown } | null | undefined;
  const meta = typeof m === 'object' && m !== null && m.schema === 5 ? normalizeMeta5(m) : null;
  return { life, meta };
}

export async function importFile(file: File): Promise<ReturnType<typeof parseImport>> {
  try { return parseImport(await file.text()); } catch { return { life: null, meta: null, error: '파일을 읽지 못했다' }; }
}
