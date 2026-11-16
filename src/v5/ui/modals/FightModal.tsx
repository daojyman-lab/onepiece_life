// 싸움 앞의 물음: 붙을지 물러날지 답한다. 창을 닫는 길은 답하는 것뿐이다.
import { dispatch } from '../../app/store';
import { BACK_OFF, ENGAGE } from '../../core/fight';
import type { Life5, Pending5 } from '../../core/types';
import { Face, Modal } from '../common';
import { fightView } from '../view';

export function FightModal({ s, p }: { s: Life5; p: Extract<Pending5, { kind: 'fight' }> }) {
  const v = fightView(s, p);
  return (
    <Modal title="싸움 앞" cls="pend">
      <div class="speaker">
        <div>
          <Face who={v.who} size="big" />
          <div class="name">{v.name}</div>
        </div>
        <div class="scroll stack" style={{ flex: 1 }}>
          <div><b>상대의 격: {v.match}</b></div>
          <div class="fight-stats t9">
            <div class="row between soft"><span>나</span><span>능력치</span><span>상대</span></div>
            {v.stats.map((x) => {
              const max = Math.max(1, x.me, x.foe);
              return (
                <div key={x.label} class="fight-stat">
                  <span class="bar me"><i style={{ width: `${(100 * x.me) / max}%` }} /></span>
                  <span class="num">{x.me}</span>
                  <span class="lab">{x.label}</span>
                  <span class="num">{x.foe}</span>
                  <span class="bar foe"><i style={{ width: `${(100 * x.foe) / max}%` }} /></span>
                </div>
              );
            })}
            {v.crew > 0 && <div class="soft">함께 싸울 동료 {v.crew}명</div>}
          </div>
          {v.risk.map((r) => <div key={r.label} class="row between"><span>{r.label}</span><b>{r.word}</b></div>)}
          {v.lethal && <div class="red"><b>목숨을 건 싸움이다. 물러나도 무사하다는 보장이 없다.</b></div>}
        </div>
      </div>
      <div class="pend-doors">
        <button class={`opt ${v.lethal ? 'danger' : ''}`} onClick={() => dispatch({ type: 'answer', index: ENGAGE })}><b>붙는다</b></button>
        <button class="opt" onClick={() => dispatch({ type: 'answer', index: BACK_OFF })}><b>물러난다</b></button>
      </div>
    </Modal>
  );
}
