// v5 본 화면. 과제 5에서는 주인공 이름과 '처음으로' 단추만 있는 틀이다 (과제 6에서 채운다).
import { actions, useStore } from '../../app/store';
import { fullName } from '../../core/birth';

export function Main() {
  const st = useStore();
  const s = st.life;
  if (!s) return null;
  return (
    <div class="app">
      <div class="frame frame-pad row between">
        <b>{fullName(s.hero).trim()}</b>
        <button class="btn small" onClick={() => actions.toStart()}>처음으로</button>
      </div>
    </div>
  );
}
