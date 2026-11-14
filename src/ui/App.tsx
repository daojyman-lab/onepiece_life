import { useEffect } from 'preact/hooks';
import { actions, caughtUp, useStore } from '../app/store';
import { music, sfx } from '../app/sound';
import { Main } from './screens/Main';
import { Start } from './screens/Start';
import { ChoiceModal } from './modals/ChoiceModal';
import { PrepModal } from './modals/PrepModal';
import { BattleModal } from './modals/BattleModal';
import { EndingModal } from './modals/EndingModal';
import { GrowthModal } from './modals/GrowthModal';
import { ShopModal } from './modals/ShopModal';
import { CodexModal } from './modals/CodexModal';
import { LoadoutModal, SaveModal } from './modals/SaveModal';

export function App() {
  const st = useStore();
  const s = st.life;
  const p = s?.pending ?? null;
  const ready = !!s && caughtUp(st);
  // 배경음악: 전투 중이면 전투곡, 바다에 나가 있으면 바다, 고향이면 잔잔한 곡
  const bgm = st.screen !== 'main' || !s ? 'home' : ready && p && (p.kind === 'battle' || p.kind === 'intervene' || p.kind === 'prep') ? 'battle' : s.hero.route === 'none' ? 'home' : 'sea';
  useEffect(() => { music(bgm); }, [bgm]);
  // 선택 · 강적이 나타나면 알림음
  const popup = ready && p ? `${p.kind}:${p.kind === 'choice' ? p.choiceId + s!.stats.choices : ''}` : '';
  useEffect(() => {
    if (!popup) return;
    if (p?.kind === 'choice' || p?.kind === 'prep') sfx('event');
    else if (p?.kind === 'ending') sfx('lose');
  }, [popup]);
  if (st.screen === 'start' || !s) return <><Start /><SoundToggles /><Toasts /></>;
  // 대기 중인 일이 화면을 정한다. 창을 닫는 길은 그 일을 끝내는 명령뿐이다
  let pendingView = null;
  // 이야기가 다 떠오른 뒤에 선택 · 준비 · 결산 창을 띄운다
  if (!caughtUp(st)) { /* 기다린다 */ }
  else if (p?.kind === 'choice') pendingView = <ChoiceModal key={`c${p.choiceId}${s.stats.choices}`} s={s} p={p} />;
  else if (p?.kind === 'prep') pendingView = <PrepModal key={`prep${p.encounter.enemy.id}`} s={s} p={p} />;
  else if (p?.kind === 'battle' || p?.kind === 'intervene') pendingView = <BattleModal key={`battle${p.battle.rng.seed}`} s={s} p={p} />;
  else if (p?.kind === 'ending') pendingView = <EndingModal s={s} />;
  // 관리용 창은 pending이 없을 때만 (열려 있는 동안 타이머만 멈춘다)
  let manage = null;
  if (!pendingView) {
    if (st.modal === 'growth') manage = <GrowthModal s={s} meta={st.meta} />;
    else if (st.modal === 'loadout') manage = <LoadoutModal s={s} />;
    else if (st.modal === 'shop') manage = <ShopModal s={s} />;
    else if (st.modal === 'codex') manage = <CodexModal meta={st.meta} />;
    else if (st.modal === 'save') manage = <SaveModal />;
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

/** 소리 조절: 화면 구석에 떠 있어서 선택 · 전투 창이 열려 있어도 누를 수 있다 */
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
  return <div class="toasts" aria-live="polite">{st.toasts.map((t) => <div class="paper t9">{t.text}</div>)}</div>;
}
