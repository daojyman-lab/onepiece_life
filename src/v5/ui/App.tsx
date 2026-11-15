// v5 화면의 뿌리. 시작 화면이거나 인생이 없으면 Start, 아니면 Main. (v4 src/ui/App.tsx와 같은 짜임)
import { useEffect } from 'preact/hooks';
import { music } from '../../app/sound';
import { caughtUp } from '../app/flow';
import { actions, useStore } from '../app/store';
import { CodexModal } from './modals/CodexModal';
import { Main } from './screens/Main';
import { Start } from './screens/Start';

export function App() {
  const st = useStore();
  const s = st.life;
  const p = s?.pending ?? null;
  const ready = !!s && caughtUp(s, st.shownId);
  // 배경음악: 시작 화면은 잔잔한 곡, 싸움이 뜨면 전투곡, 그 밖에는 바다
  const bgm = st.screen !== 'main' || !s ? 'home' : ready && p && (p.kind === 'fight' || p.kind === 'battle') ? 'battle' : 'sea';
  useEffect(() => { music(bgm); }, [bgm]);
  if (st.screen === 'start' || !s) return <><Start /><SoundToggles /><Toasts /></>;
  // 떠 있는 일(문 · 싸움 · 엔딩)의 창: 기록이 다 떠오른 뒤에 뜬다. 과제 7~9에서 붙인다
  const pendingView = null;
  // 관리용 창은 떠 있는 일의 창이 없을 때만
  let manage = null;
  if (!pendingView) {
    if (st.modal === 'codex') manage = <CodexModal meta={st.meta} />;
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
  return <div class="toasts" aria-live="polite">{st.toasts.map((t) => <div class="paper t9">{t.text}</div>)}</div>;
}
