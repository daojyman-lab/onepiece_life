import { useStore } from '../app/store';
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
  if (st.screen === 'start' || !s) return <><Start /><Toasts /></>;
  const p = s.pending;
  // 대기 중인 일이 화면을 정한다. 창을 닫는 길은 그 일을 끝내는 명령뿐이다
  let pendingView = null;
  if (p?.kind === 'choice') pendingView = <ChoiceModal key={`c${p.choiceId}${s.stats.choices}`} s={s} p={p} />;
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
      <Toasts />
    </>
  );
}

function Toasts() {
  const st = useStore();
  return <div class="toasts" aria-live="polite">{st.toasts.map((t) => <div class="paper t9">{t.text}</div>)}</div>;
}
