// v5 상태 보관, 명령 전달, 자동 진행 타이머, 저장. 화면은 여기만 본다. (v4 src/app/store.ts와 같은 짜임)
import { useEffect, useState } from 'preact/hooks';
import { setSound, sfx } from '../../app/sound';
import { knownDoors, recordLife, type Meta5 } from '../core/meta';
import { reduce5 } from '../core/reduce';
import { newLife5 } from '../core/state';
import type { Command5, Life5 } from '../core/types';
import { lastLogId, nextHidden, nextTick } from './flow';
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

/** 명령을 보내고 저장한다. 저장 시점: answer 뒤, step 뒤에 나이가 바뀌었거나 떠 있는 일이 생겼을 때 */
export function dispatch(cmd: Command5): void {
  const prev = state.life;
  if (!prev) return;
  const next = reduce5(prev, cmd);
  if (cmd.type === 'answer' || next.age !== prev.age || (!prev.pending && next.pending)) save.saveLife(next);
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
    save.saveLife(life);
    // 정지해 둔 채로 새 인생을 시작하면 아무것도 떠오르지 않으므로 1배속으로 시작한다
    const settings = state.settings.speed === 0 ? { ...state.settings, speed: 1 as const } : state.settings;
    if (settings !== state.settings) save.saveSettings(settings);
    set({ life, screen: 'main', modal: null, shownId: -1, settings });   // 태어난 이야기부터 한 줄씩
  },
  continueLife() { if (state.life) set({ screen: 'main' }); },
  toStart() { set({ screen: 'start', modal: null }); },
  /** 엔딩을 확인하고 도감에 남긴 뒤 시작 화면으로 */
  endLife() {
    const life = state.life;
    if (!life || life.pending?.kind !== 'ending') return;
    const meta = recordLife(state.meta, life);
    save.saveMeta(meta);
    save.clearLife();
    set({ meta, life: null, screen: 'start', modal: null, shownId: -1 });
  },
  setSpeed(speed: Settings['speed']) { updateSettings({ speed }); },
  setBattleSpeed(battleSpeed: Settings['battleSpeed']) { updateSettings({ battleSpeed }); },
  toggleSound(kind: 'sfx' | 'bgm') {
    const settings = updateSettings({ [kind]: !state.settings[kind] });
    setSound({ [kind]: settings[kind] });
  },
  open(modal: ManageModal) { set({ modal }); },
  close() { set({ modal: null }); },
  saveNow() { if (state.life && save.saveLife(state.life)) toast('저장했다.'); },
  replace(life: Life5 | null, meta: Meta5 | null) {
    if (meta) save.saveMeta(meta);
    if (life) save.saveLife(life);
    const nextLife = life ?? state.life;
    set({ life: nextLife, meta: meta ?? state.meta, screen: life ? 'main' : state.screen, modal: null, shownId: lastLogId(nextLife) });
    toast('불러왔다.');
  },
  toast,
  setReading(reading: boolean) { if (state.reading !== reading) set({ reading }); },
  /** 기다리는 기록을 한꺼번에 보여 준다 */
  showAll() { set({ shownId: lastLogId(state.life) }); },
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
    set({ shownId: t.id });
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
  const t = flowNow();
  if (t.do === 'wait') { if (timer) { clearTimeout(timer); timer = null; } return; }
  if (timer) return;
  schedule(t.do === 'reveal' ? 250 : t.wait);
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', kick);
