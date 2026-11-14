// 상태 보관, 명령 전달, 자동 진행 타이머, 저장. 화면은 여기만 본다.
import { useEffect, useState } from 'preact/hooks';
import { B } from '../data/balance';
import { reduce, type Command } from '../core/reduce';
import { newLife, type NewLifeOptions } from '../core/state';
import { absorbMeta, recordEnding } from '../core/meta/meta';
import type { LifeState, MetaState } from '../core/types';
import { save, type Settings } from './save';
import { setSound, sfx } from './sound';

export type ManageModal = null | 'growth' | 'loadout' | 'shop' | 'codex' | 'save' | 'people' | 'info';

export interface AppState {
  screen: 'start' | 'main';
  life: LifeState | null;
  meta: MetaState;
  settings: Settings;
  modal: ManageModal;
  toasts: { id: number; text: string }[];
  reading: boolean;            // 항해 일지 위에 마우스를 올려 읽는 중이면 시간이 멈춘다
  shownId: number;             // 이야기에 떠오른 마지막 기록 번호. 다 떠올라야 다음 달로 가고 선택이 뜬다
}

/** 기록의 마지막 번호 */
export function lastLogId(life: LifeState | null) {
  if (!life) return 0;
  for (let i = life.log.length - 1; i >= 0; i--) if (life.log[i].id !== undefined) return life.log[i].id!;
  return 0;
}
/** 이야기가 다 떠올랐는가 */
export function caughtUp(st: AppState = state) {
  return st.shownId >= lastLogId(st.life);
}

let state: AppState = {
  screen: 'start',
  life: save.loadLife(),
  meta: save.loadMeta(),
  settings: save.loadSettings(),
  modal: null,
  toasts: [],
  reading: false,
  shownId: 0,
};
state.shownId = lastLogId(state.life);   // 불러온 인생은 이미 본 것으로 친다
setSound({ sfx: state.settings.sfx, bgm: state.settings.bgm });
const subs = new Set<() => void>();
let toastSeq = 0;

function set(patch: Partial<AppState>) {
  state = { ...state, ...patch };
  subs.forEach((f) => f());
  kick();
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
    // 정지해 둔 채로 새 인생을 시작하면 아무것도 떠오르지 않으므로 1배속으로 시작한다
    const settings = state.settings.speed === 0 ? { ...state.settings, speed: 1 as const } : state.settings;
    if (settings !== state.settings) save.saveSettings(settings);
    set({ life, screen: 'main', modal: null, shownId: 0, settings });   // 태어난 이야기부터 한 줄씩
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
  toggleSound(kind: 'sfx' | 'bgm') {
    const settings = { ...state.settings, [kind]: !state.settings[kind] };
    save.saveSettings(settings); setSound({ [kind]: settings[kind] }); set({ settings });
  },
  setBattleSpeed(battleSpeed: Settings['battleSpeed']) { const settings = { ...state.settings, battleSpeed }; save.saveSettings(settings); set({ settings }); },
  open(modal: ManageModal) { set({ modal }); },
  close() { set({ modal: null }); },
  saveNow() { if (state.life && save.saveLife(state.life)) toast('저장했다.'); },
  replace(life: LifeState | null, meta: MetaState | null) {
    if (meta) save.saveMeta(meta);
    if (life) save.saveLife(life);
    set({ life: life ?? state.life, meta: meta ?? state.meta, screen: life ? 'main' : state.screen, modal: null, shownId: lastLogId(life ?? state.life) });
    toast('불러왔다.');
  },
  toast,
  setReading(reading: boolean) { if (state.reading !== reading) set({ reading }); },
  /** 기다리는 이야기를 한꺼번에 보여 준다 */
  showAll() { set({ shownId: lastLogId(state.life) }); },
};

// ---------------------------------------------------------------- 자동 진행
// 한 줄씩 떠오르게 하고, 다 떠오르면 한 달을 보낸다. 선택이 떠 있으면 기다린다.

let timer: ReturnType<typeof setTimeout> | null = null;

function active() {
  const s = state;
  return s.screen === 'main' && !!s.life && s.modal === null && s.settings.speed > 0 && !s.reading
    && (typeof document === 'undefined' || !document.hidden);
}

function nextHidden() {
  const life = state.life;
  if (!life) return null;
  return life.log.find((l) => l.id !== undefined && l.id > state.shownId) ?? null;
}

function step() {
  timer = null;
  if (!active()) return;
  const sp = state.settings.speed;
  const next = nextHidden();
  if (next) {
    // 다음 줄이 떠오른다
    set({ shownId: next.id! });
    lineSound(next.type, next.text);
    const after = nextHidden();
    const quick = after && B.clock.quickTypes.includes(after.type);
    schedule((quick ? B.clock.quickLineMs : B.clock.lineMs) / sp);
    return;
  }
  const life = state.life!;
  if (life.pending || !life.hero.alive) return;   // 선택 · 전투 · 결산을 기다린다
  dispatch({ type: 'tick' });
  if (!timer) schedule(B.clock.monthMs / sp);
}

/** 떠오르는 줄에 맞는 소리 */
function lineSound(type: string, text: string) {
  if (type === 'good') sfx(/열매|대업물|최상|흑도|얻었다/.test(text) ? 'treasure' : 'treasure');
  else if (type === 'danger') sfx('danger');
  else if (type === 'world' && /진급|분대장|들어섰다|정점/.test(text)) sfx('event');
  else if (type === 'day' || type === 'life') sfx('line');
}

function schedule(ms: number) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(step, ms);
}

/** 상태가 바뀔 때마다 진행을 이어 간다 */
function kick() {
  if (!active()) { if (timer) { clearTimeout(timer); timer = null; } return; }
  if (timer) return;
  const life = state.life!;
  const waiting = !nextHidden() && (life.pending || !life.hero.alive);
  if (!waiting) schedule(nextHidden() ? 250 : B.clock.monthMs / state.settings.speed);
}

if (typeof document !== 'undefined') document.addEventListener('visibilitychange', kick);
