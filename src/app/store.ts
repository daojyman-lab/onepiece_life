// 상태 보관, 명령 전달, 자동 진행 타이머, 저장. 화면은 여기만 본다.
import { useEffect, useState } from 'preact/hooks';
import { B } from '../data/balance';
import { reduce, type Command } from '../core/reduce';
import { newLife, type NewLifeOptions } from '../core/state';
import { absorbMeta, recordEnding } from '../core/meta/meta';
import type { LifeState, MetaState } from '../core/types';
import { save, type Settings } from './save';

export type ManageModal = null | 'growth' | 'loadout' | 'shop' | 'codex' | 'save' | 'people' | 'info';

export interface AppState {
  screen: 'start' | 'main';
  life: LifeState | null;
  meta: MetaState;
  settings: Settings;
  modal: ManageModal;
  toasts: { id: number; text: string }[];
  reading: boolean;            // 항해 일지 위에 마우스를 올려 읽는 중이면 시간이 멈춘다
}

let state: AppState = {
  screen: 'start',
  life: save.loadLife(),
  meta: save.loadMeta(),
  settings: save.loadSettings(),
  modal: null,
  toasts: [],
  reading: false,
};
const subs = new Set<() => void>();
let toastSeq = 0;

function set(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
  syncClock();
}

export function getState() { return state; }

export function useStore(): AppState {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((x) => x + 1);
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return state;
}

function toast(text: string) {
  const id = ++toastSeq;
  set({ toasts: [...state.toasts, { id, text }].slice(-4) });
  setTimeout(() => set({ toasts: state.toasts.filter((t) => t.id !== id) }), 4500);
}

/** 명령을 보내고, 도감 · 알림 · 저장을 처리한다 */
export function dispatch(cmd: Command) {
  const prev = state.life;
  if (!prev) return;
  const next = reduce(prev, cmd);
  if (next === prev) return;
  let meta = state.meta;
  if (next.metaEvents.length) { meta = absorbMeta(meta, next); save.saveMeta(meta); }
  const notices = next.notices;
  next.metaEvents = [];
  next.notices = [];
  // 저장 시점: 해가 바뀔 때, 선택에 답한 뒤, 전투가 끝난 뒤 (tick이 아닌 명령 뒤)
  if (cmd.type !== 'tick' || next.time.year !== prev.time.year || next.pending) save.saveLife(next);
  set({ life: next, meta });
  for (const n of notices) toast(n);
}

export const actions = {
  newLife(opt: NewLifeOptions = {}) {
    const seed = (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
    const life = newLife(seed, state.meta, opt);
    save.saveLife(life);
    set({ life, screen: 'main', modal: null });
  },
  continueLife() { if (state.life) set({ screen: 'main' }); },
  toStart() { set({ screen: 'start', modal: null }); },
  /** 결산을 확인하고 기록을 남긴다 */
  endLife() {
    const life = state.life;
    if (!life || life.pending?.kind !== 'ending') return;
    const meta = recordEnding(state.meta, life, new Date().toISOString().slice(0, 10));
    save.saveMeta(meta);
    save.clearLife();
    set({ meta, life: null, screen: 'start', modal: null });
  },
  setSpeed(speed: Settings['speed']) { const settings = { ...state.settings, speed }; save.saveSettings(settings); set({ settings }); },
  setBattleSpeed(battleSpeed: Settings['battleSpeed']) { const settings = { ...state.settings, battleSpeed }; save.saveSettings(settings); set({ settings }); },
  open(modal: ManageModal) { set({ modal }); },
  close() { set({ modal: null }); },
  saveNow() { if (state.life && save.saveLife(state.life)) toast('저장했다.'); },
  replace(life: LifeState | null, meta: MetaState | null) {
    if (meta) save.saveMeta(meta);
    if (life) save.saveLife(life);
    set({ life: life ?? state.life, meta: meta ?? state.meta, screen: life ? 'main' : state.screen, modal: null });
    toast('불러왔다.');
  },
  toast,
  setReading(reading: boolean) { if (state.reading !== reading) set({ reading }); },
};

// ---------------------------------------------------------------- 자동 진행

let timer: ReturnType<typeof setInterval> | null = null;
let timerMs = 0;

function shouldRun() {
  const s = state;
  return s.screen === 'main' && !!s.life && !s.life.pending && s.life.hero.alive && s.modal === null && s.settings.speed > 0 && !s.reading
    && (typeof document === 'undefined' || !document.hidden);
}

function syncClock() {
  const want = shouldRun() ? B.clock.speeds[state.settings.speed] : 0;
  if (want === timerMs) return;
  if (timer) clearInterval(timer);
  timer = null;
  timerMs = want;
  if (want) timer = setInterval(() => dispatch({ type: 'tick' }), want);
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', syncClock);
