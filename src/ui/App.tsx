// v5 화면의 뿌리. 시작 화면이거나 인생이 없으면 Start, 아니면 Main. (v4 src/ui/App.tsx와 같은 짜임)
import { useEffect } from 'preact/hooks';
import { music, sfx } from '../app/sound';
import { windowReady } from '../app/flow';
import { actions, useStore } from '../app/store';
import type { Standing } from '../core/types';
import { BattleModal } from './modals/BattleModal';
import { CodexModal } from './modals/CodexModal';
import { DoorModal } from './modals/DoorModal';
import { EndingModal } from './modals/EndingModal';
import { FightModal } from './modals/FightModal';
import { MenuModal } from './modals/MenuModal';
import { NewsArchive } from './modals/NewsArchive';
import { Main } from './screens/Main';
import { Start } from './screens/Start';

/** 바다의 처지: 이 처지에서는 바다 음악이 흐른다 */
const SEA_STANDINGS: readonly Standing[] = ['pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp'];

export function App() {
  const st = useStore();
  const s = st.life;
  const p = s?.pending ?? null;
  // 창은 기록이 다 떠오르고, 마지막 줄을 읽을 틈(CLOCK.windowDelayMs ÷ 배속)이 지난 뒤에 뜬다. 그때 store가 다시 그리게 한다
  const ready = st.modal !== 'news' && windowReady(s, st.shownId, performance.now() - st.revealedAt, st.settings.speed);
  // 배경음악: 싸움 창이 떠 있으면 전투곡, 바다의 처지는 바다, 시작 화면과 뭍의 처지는 잔잔한 곡
  const bgm = st.screen !== 'main' || !s ? 'home'
    : ready && p && (p.kind === 'fight' || p.kind === 'battle') ? 'battle'
    : SEA_STANDINGS.includes(s.hero.standing) ? 'sea' : 'home';
  useEffect(() => { music(bgm); }, [bgm]);
  // 떠 있는 일이 화면에 뜨는 순간을 가르는 열쇠 (같은 일이면 같은 열쇠)
  const popup = st.screen === 'main' && ready && p ? `${p.kind}:${p.kind === 'door' ? p.turning : ''}:${s!.log.length}` : '';
  useEffect(() => {
    if (popup && p?.kind === 'door') sfx('event');
    else if (popup && p?.kind === 'ending') sfx('lose');
  }, [popup]);
  if (st.screen === 'start' || !s) return <><Start /><SoundToggles /><Toasts /></>;
  // 떠 있는 일(문 · 싸움 · 엔딩)의 창: 기록이 다 떠오르고 잠깐 뒤에 뜬다. 창을 닫는 길은 답하는 것뿐이다
  let pendingView = null;
  if (!ready) { /* 기다린다 */ }
  else if (p?.kind === 'door') pendingView = <DoorModal key={popup} s={s} p={p} />;
  else if (p?.kind === 'fight') pendingView = <FightModal key={popup} s={s} p={p} />;
  else if (p?.kind === 'battle') pendingView = <BattleModal key={popup} s={s} p={p} />;
  // 엔딩에는 이 인생을 더하기 전의 도감을 넘긴다 (endLife가 그 뒤에 더한다)
  else if (p?.kind === 'ending') pendingView = <EndingModal key={popup} s={s} meta={st.meta} />;
  // 관리용 창은 떠 있는 일의 창이 없을 때만
  let manage = null;
  if (!pendingView) {
    if (st.modal === 'codex') manage = <CodexModal meta={st.meta} />;
    else if (st.modal === 'menu') manage = <MenuModal />;
    else if (st.modal === 'news') manage = <NewsArchive s={s} shownId={st.shownId} />;
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
