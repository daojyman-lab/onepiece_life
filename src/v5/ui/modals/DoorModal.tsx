// 선택 창: 떠 있는 문에 답한다. 창을 닫는 길은 답하는 것뿐이다. (v4 src/ui/modals/ChoiceModal.tsx와 같은 마크업 · 클래스)
import { dispatch } from '../../app/store';
import type { Life5, Pending5 } from '../../core/types';
import { Face, Modal } from '../common';
import { ageWord, doorView } from '../view';

/** 붉은 표시로 다는 문 표시 */
const RED_TAG = '위험';

export function DoorModal({ s, p }: { s: Life5; p: Extract<Pending5, { kind: 'door' }> }) {
  const v = doorView(s, p);
  return (
    <Modal title={v.heading} cls={`pend ${v.moment ? 'moment' : ''}`}>
      <div class="speaker">
        <div>
          <Face who={v.speaker.who} size="big" />
          <div class="name">{v.speaker.name}</div>
        </div>
        <div class="scroll" style={{ flex: 1 }}>{v.body}</div>
      </div>
      <div class="pend-doors">
        {v.doors.map((d) => (
          <button key={d.index} class={`opt ${d.tags.includes(RED_TAG) ? 'danger' : ''}`} disabled={!!d.locked}
            onClick={() => dispatch({ type: 'answer', index: d.index })}>
            <b>{d.label}</b>
            {d.tags.map((t) => <span key={t} class={`tag ${t === RED_TAG ? 'red' : ''}`} style={{ marginLeft: 6 }}>{t}</span>)}
            <span class="hint">{d.hint}</span>
          </button>
        ))}
      </div>
      <div class="t9 soft pend-foot">{ageWord(s.age)} · 고르는 동안 시간이 멈춘다.</div>
    </Modal>
  );
}
