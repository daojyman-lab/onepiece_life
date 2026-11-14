// 저장 · 불러오기 · 내보내기 · 가져오기 (docs/02_설계/02_상태와_데이터.md 4장).
import { invariants } from '../core/reduce';
import { emptyMeta } from '../core/state';
import type { LifeState, MetaState } from '../core/types';

const K = { life: 'gt4.life', meta: 'gt4.meta', settings: 'gt4.settings' };

export interface Settings { speed: 0 | 1 | 2 | 4 | 8; battleSpeed: 1 | 2 | 4; sfx: boolean; bgm: boolean }
export const defaultSettings = (): Settings => ({ speed: 1, battleSpeed: 1, sfx: true, bgm: true });

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch { return false; }
}

/** 불러온 인생을 검사한다. 문제가 있으면 이유를 돌려준다 */
export function validateLife(x: unknown): { ok: true; life: LifeState } | { ok: false; why: string } {
  const s = x as LifeState;
  if (!s || typeof s !== 'object') return { ok: false, why: '저장 데이터가 아니다' };
  if (s.schema === undefined) return { ok: false, why: 'v3.x 저장 데이터는 읽지 않는다 (규칙이 달라 옮길 수 없다)' };
  if (s.schema > 1) return { ok: false, why: '더 새 버전의 저장 데이터다' };
  const bad = invariants(s);
  if (bad.length) return { ok: false, why: `저장 데이터가 깨져 있다: ${bad.join(', ')}` };
  return { ok: true, life: s };
}

export const save = {
  loadLife(): LifeState | null {
    const x = read<LifeState>(K.life);
    if (!x) return null;
    const v = validateLife(x);
    return v.ok ? v.life : null;
  },
  saveLife(s: LifeState) { return write(K.life, s); },
  clearLife() { try { localStorage.removeItem(K.life); } catch { /* 무시 */ } },
  loadMeta(): MetaState { const m = read<MetaState>(K.meta); return m && m.schema === 1 ? m : emptyMeta(); },
  saveMeta(m: MetaState) { return write(K.meta, m); },
  loadSettings(): Settings { return { ...defaultSettings(), ...(read<Settings>(K.settings) ?? {}) }; },
  saveSettings(x: Settings) { return write(K.settings, x); },
};

export function exportFile(life: LifeState | null, meta: MetaState) {
  const blob = new Blob([JSON.stringify({ app: 'grand-treasure', version: 4, life, meta }, null, 0)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const name = life ? `${life.hero.surname}_${life.hero.name}_${life.hero.age}세` : 'meta';
  a.download = `grand-treasure-${name}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export async function importFile(file: File): Promise<{ life: LifeState | null; meta: MetaState | null; error?: string }> {
  try {
    const data = JSON.parse(await file.text());
    if (data?.app !== 'grand-treasure' || data.version !== 4) return { life: null, meta: null, error: '그랜드 트레저 v4 저장 파일이 아니다' };
    let life: LifeState | null = null;
    if (data.life) {
      const v = validateLife(data.life);
      if (!v.ok) return { life: null, meta: null, error: v.why };
      life = v.life;
    }
    const meta = data.meta?.schema === 1 ? (data.meta as MetaState) : null;
    return { life, meta };
  } catch {
    return { life: null, meta: null, error: '파일을 읽지 못했다' };
  }
}
