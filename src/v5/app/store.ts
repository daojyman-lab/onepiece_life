// v5 상태 보관, 명령 전달, 자동 진행 타이머, 저장. 화면은 여기만 본다. (v4 src/app/store.ts와 같은 짜임)
import { useEffect, useState } from 'preact/hooks';
import { setSound, sfx } from '../../app/sound';
import { knownDoors, recordLife, type Meta5 } from '../core/meta';
import { reduce5 } from '../core/reduce';
import { newLife5 } from '../core/state';
import type { Command5, Life5 } from '../core/types';
import { caughtUp, lastLogId, nextHidden, nextTick, shouldSave, windowDelay, windowReady } from './flow';
import { save, type Settings } from './save';

export type ManageModal = null | 'codex' | 'menu';

export interface AppState {
  screen: 'start' | 'main';
  life: Life5 | null;
  meta: Meta5;
  settings: Settings;
  modal: ManageModal;
  toasts: { id: number; text: string }[];
  reading: boolean;            // 기록 위에 마우스를 올려 읽는 중이면 시간이 멈춘다
  shownId: number;             // 떠오른 마지막 기록 id. -1이면 아무것도 못 봤다
  revealedAt: number;          // 마지막 줄이 떠오른 때(performance.now). 불러온 뒤 떠오른 줄이 없으면 -Infinity
}

const loaded = save.loadLife();
let state: AppState = {
  screen: 'start',
  life: loaded,
  meta: save.loadMeta(),
  settings: save.loadSettings(),
  modal: null,
  toasts: [],
  reading: false,
  shownId: lastLogId(loaded),  // 불러온 인생은 이미 본 것으로 친다
  revealedAt: -Infinity,       // 그래서 떠 있는 일의 창도 곧바로 뜬다
};
setSound({ sfx: state.settings.sfx, bgm: state.settings.bgm });
const subs = new Set<() => void>();
let toastSeq = 0;

function set(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
  kick();
}

export function getState(): AppState { return state; }

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

const SAVE_FAILED = '저장하지 못했다. 브라우저의 저장 공간을 확인해 달라.';
let saveFailWarned = false;

/** 인생을 저장한다. 실패하면 한 세션에 한 번만 알린다 (저장할 때마다 알리면 시끄럽다) */
function persistLife(life: Life5): boolean {
  const ok = save.saveLife(life);
  if (!ok && !saveFailWarned) { saveFailWarned = true; toast(SAVE_FAILED); }
  return ok;
}

/** 선택 · 싸움 창이나 관리 창이 마지막으로 닫힌 때 (읽는 중 멈춤의 유예에 쓴다) */
let windowClosedAt = -Infinity;

/** 창이 마지막으로 닫힌 뒤 지난 시간(밀리초). 닫힌 적이 없으면 Infinity */
export function msSinceWindowClosed(): number { return performance.now() - windowClosedAt; }

/** 명령을 보내고, 저장할 때(flow.ts shouldSave)면 저장한다 */
export function dispatch(cmd: Command5): void {
  const prev = state.life;
  if (!prev) return;
  const next = reduce5(prev, cmd);
  if (cmd.type === 'answer') windowClosedAt = performance.now();   // 답하는 것이 떠 있는 일의 창을 닫는 길이다
  if (shouldSave(prev, next, cmd)) persistLife(next);
  set({ life: next });
}

function updateSettings(patch: Partial<Settings>) {
  const settings = { ...state.settings, ...patch };
  save.saveSettings(settings);
  set({ settings });
  return settings;
}

export const actions = {
  newLife(opt: { name?: string; gender?: 'm' | 'f' } = {}) {
    const seed = (Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0;
    const life = newLife5(seed, { name: opt.name, gender: opt.gender, known: knownDoors(state.meta) });
    persistLife(life);
    // 정지해 둔 채로 새 인생을 시작하면 아무것도 떠오르지 않으므로 1배속으로 시작한다
    const settings = state.settings.speed === 0 ? { ...state.settings, speed: 1 as const } : state.settings;
    if (settings !== state.settings) save.saveSettings(settings);
    set({ life, screen: 'main', modal: null, shownId: -1, settings });   // 태어난 이야기부터 한 줄씩
  },
  continueLife() { if (state.life) set({ screen: 'main' }); },
  /** 인생은 저장된 채 시작 화면으로 */
  toStart() { if (state.life) persistLife(state.life); set({ screen: 'start', modal: null }); },
  /** 엔딩을 확인하고 도감에 남긴 뒤 시작 화면으로. 도감을 저장하지 못하면 인생을 지우지 않고 엔딩에 머문다 */
  endLife() {
    const life = state.life;
    if (!life || life.pending?.kind !== 'ending') return;
    const meta = recordLife(state.meta, life);
    if (!save.saveMeta(meta)) { toast(SAVE_FAILED); return; }
    save.clearLife();
    set({ meta, life: null, screen: 'start', modal: null, shownId: -1, revealedAt: -Infinity });
  },
  /** 배속을 바꾸면 돌던 타이머를 버린다: kick이 새 배속으로 다시 건다 (옛 배속으로 3초까지 기다리지 않게) */
  setSpeed(speed: Settings['speed']) {
    if (timer) { clearTimeout(timer); timer = null; }
    updateSettings({ speed });
  },
  setBattleSpeed(battleSpeed: Settings['battleSpeed']) { updateSettings({ battleSpeed }); },
  toggleSound(kind: 'sfx' | 'bgm') {
    const settings = updateSettings({ [kind]: !state.settings[kind] });
    setSound({ [kind]: settings[kind] });
  },
  open(modal: ManageModal) { set({ modal }); },
  close() { if (state.modal) windowClosedAt = performance.now(); set({ modal: null }); },
  /** 지금 저장: 누른 사람에게는 실패도 매번 알린다 */
  saveNow() {
    if (!state.life) return;
    toast(save.saveLife(state.life) ? '저장했다.' : SAVE_FAILED);
  },
  replace(life: Life5 | null, meta: Meta5 | null) {
    if (meta && !save.saveMeta(meta)) toast(SAVE_FAILED);
    if (life) persistLife(life);
    const nextLife = life ?? state.life;
    if (state.modal) windowClosedAt = performance.now();
    set({ life: nextLife, meta: meta ?? state.meta, screen: life ? 'main' : state.screen, modal: null, shownId: lastLogId(nextLife), revealedAt: -Infinity });
    toast('불러왔다.');
  },
  toast,
  setReading(reading: boolean) { if (state.reading !== reading) set({ reading }); },
  /** 기다리는 기록을 한꺼번에 보여 준다 (창은 마지막 줄을 읽을 틈을 둔 뒤에 뜬다) */
  showAll() { set({ shownId: lastLogId(state.life), revealedAt: performance.now() }); },
};

// ---------------------------------------------------------------- 자동 진행
// 타이머는 flow.ts의 nextTick이 말하는 대로 한다: 한 줄 띄우기, 다음 토막, 기다리기.

let timer: ReturnType<typeof setTimeout> | null = null;

function flowNow() {
  const s = state;
  return nextTick({
    life: s.life, shownId: s.shownId, speed: s.settings.speed, screen: s.screen,
    modalOpen: s.modal !== null, reading: s.reading,
    hidden: typeof document !== 'undefined' && document.hidden,
  });
}

function tick() {
  timer = null;
  const t = flowNow();
  if (t.do === 'wait') return;
  if (t.do === 'reveal') {
    const line = nextHidden(state.life, state.shownId);
    set({ shownId: t.id, revealedAt: performance.now() });
    if (line?.weight === 'heavy') sfx('event');
    else if (line?.weight === 'light') sfx('line');
  } else {
    dispatch({ type: 'step' });
  }
  schedule(t.wait);
}

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(tick, ms);
}

/** 상태가 바뀔 때마다 진행을 이어 가거나 멈춘다 */
function kick() {
  pokeWindow();
  const t = flowNow();
  if (t.do === 'wait') { if (timer) { clearTimeout(timer); timer = null; } return; }
  if (timer) return;
  schedule(t.do === 'reveal' ? 250 : t.wait);
}

// 떠 있는 일의 창은 마지막 줄이 떠오르고 잠깐 뒤에 뜬다(flow.ts windowReady). 그때 화면을 한 번 다시 그린다
let windowTimer: ReturnType<typeof setTimeout> | null = null;

function pokeWindow() {
  if (windowTimer) { clearTimeout(windowTimer); windowTimer = null; }
  const s = state;
  if (s.screen !== 'main' || !s.life?.pending || !caughtUp(s.life, s.shownId)) return;
  const since = performance.now() - s.revealedAt;
  if (windowReady(s.life, s.shownId, since, s.settings.speed)) return;
  windowTimer = setTimeout(() => { windowTimer = null; set({}); }, windowDelay(s.settings.speed) - since + 1);
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', kick);
