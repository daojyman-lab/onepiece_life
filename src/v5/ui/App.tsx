// v5 화면의 뿌리. 시작 화면이거나 인생이 없으면 Start, 아니면 Main. (v4 src/ui/App.tsx와 같은 짜임)
import { useEffect } from 'preact/hooks';
import { music, sfx } from '../../app/sound';
import { caughtUp } from '../app/flow';
import { actions, dispatch, useStore } from '../app/store';
import type { Pending5, Standing } from '../core/types';
import { Modal } from './common';
import { CodexModal } from './modals/CodexModal';
import { DoorModal } from './modals/DoorModal';
import { FightModal } from './modals/FightModal';
import { MenuModal } from './modals/MenuModal';
import { Main } from './screens/Main';
import { Start } from './screens/Start';

/** 바다의 처지: 이 처지에서는 바다 음악이 흐른다 */
const SEA_STANDINGS: readonly Standing[] = ['pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp'];

export function App() {
  const st = useStore();
  const s = st.life;
  const p = s?.pending ?? null;
  const ready = !!s && caughtUp(s, st.shownId);
  // 배경음악: 싸움 창이 떠 있으면 전투곡, 바다의 처지는 바다, 시작 화면과 뭍의 처지는 잔잔한 곡
  const bgm = st.screen !== 'main' || !s ? 'home'
    : ready && p && (p.kind === 'fight' || p.kind === 'battle') ? 'battle'
    : SEA_STANDINGS.includes(s.hero.standing) ? 'sea' : 'home';
  useEffect(() => { music(bgm); }, [bgm]);
  // 떠 있는 일이 화면에 뜨는 순간을 가르는 열쇠 (같은 일이면 같은 열쇠)
  const popup = st.screen === 'main' && ready && p ? `${p.kind}:${p.kind === 'door' ? p.turning : ''}:${s!.log.length}` : '';
  useEffect(() => {
    if (popup && p?.kind === 'door') sfx('event');
  }, [popup]);
  if (st.screen === 'start' || !s) return <><Start /><SoundToggles /><Toasts /></>;
  // 떠 있는 일(문 · 싸움 · 엔딩)의 창: 기록이 다 떠오른 뒤에 뜬다. 창을 닫는 길은 답하는 것뿐이다
  let pendingView = null;
  if (!ready) { /* 기다린다 */ }
  else if (p?.kind === 'door') pendingView = <DoorModal key={popup} s={s} p={p} />;
  else if (p?.kind === 'fight') pendingView = <FightModal key={popup} s={s} p={p} />;
  else if (p?.kind === 'battle') pendingView = <BattleStub key={popup} p={p} />;
  // 엔딩(과제 9)은 아직 창이 없다
  // 관리용 창은 떠 있는 일의 창이 없을 때만
  let manage = null;
  if (!pendingView) {
    if (st.modal === 'codex') manage = <CodexModal meta={st.meta} />;
    else if (st.modal === 'menu') manage = <MenuModal />;
  }
  return (
    <>
      <Main />
      {pendingView}
      {manage}
      <SoundToggles />
      <Toasts />
    </>
  );
}

const RESULT_WORD = { win: '이겼다', lose: '졌다', retreat: '물러났다' } as const;

/** 임시 싸움 창: 결과만 보이고 확인으로 넘긴다. 과제 8의 싸움 창이 이 자리를 대신한다 */
function BattleStub({ p }: { p: Extract<Pending5, { kind: 'battle' }> }) {
  return (
    <Modal title="싸움" cls="pend">
      <div class="scroll">{p.foe.name} · {RESULT_WORD[p.result]}</div>
      <div class="pend-doors">
        <button class="opt" onClick={() => dispatch({ type: 'answer', index: 0 })}><b>확인</b></button>
      </div>
    </Modal>
  );
}

/** 소리 조절: 화면 구석에 떠 있어서 선택 · 싸움 창이 열려 있어도 누를 수 있다 */
function SoundToggles() {
  const st = useStore();
  const { sfx: fx, bgm } = st.settings;
  return (
    <div class="sound-toggles" role="group" aria-label="소리">
      <button class={`btn small ${fx ? 'on' : ''}`} aria-pressed={fx} aria-label={fx ? '효과음 켬' : '효과음 끔'} onClick={() => actions.toggleSound('sfx')}>{fx ? '🔊' : '🔇'}<span class="hide-sm">{fx ? ' 효과음 켬' : ' 효과음 끔'}</span></button>
      <button class={`btn small ${bgm ? 'on' : ''}`} aria-pressed={bgm} aria-label={bgm ? '음악 켬' : '음악 끔'} onClick={() => actions.toggleSound('bgm')}>{bgm ? '♪' : '♪̸'}<span class="hide-sm">{bgm ? ' 음악 켬' : ' 음악 끔'}</span></button>
    </div>
  );
}

function Toasts() {
  const st = useStore();
  return <div class="toasts" aria-live="polite">{st.toasts.map((t) => <div key={t.id} class="paper t9">{t.text}</div>)}</div>;
}
