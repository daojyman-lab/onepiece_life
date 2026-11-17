// v5 도감: 골라 본 문(과 그 문이 올린 가치관), 먹어 본 열매, 만난 인물. 문이 올린 가치관은 여기서만 보인다.
import { actions } from '../../app/store';
import type { Meta5 } from '../../core/meta';
import { Modal } from '../common';
import { codexView } from '../view';

const EMPTY = '아직 채운 것이 없다.';

export function CodexBody({ meta }: { meta: Meta5 }) {
  const c = codexView(meta);
  return (
    <div class="stack">
      <div class="row t9"><span class="tag">지난 인생 {c.lives}번</span><span class="tag">문 {c.doors.length}</span><span class="tag">열매 {c.fruits.length}</span><span class="tag">인물 {c.people.length}</span></div>
      <div class="paper">
        <b>골라 본 문</b>
        {c.doors.length === 0 ? <div class="t9 soft">{EMPTY}</div> : c.doors.map((d) => (
          <div class="t9">{d.title} · <b>{d.door}</b>{d.values.length > 0 && <span class="soft"> — {d.values.join(' · ')}</span>}</div>
        ))}
      </div>
      <div class="paper">
        <b>먹어 본 열매</b>
        {c.fruits.length === 0 ? <div class="t9 soft">{EMPTY}</div> : <div class="t9">{c.fruits.join(' · ')}</div>}
      </div>
      <div class="paper">
        <b>만난 인물</b>
        {c.people.length === 0 ? <div class="t9 soft">{EMPTY}</div> : <div class="t9">{c.people.join(' · ')}</div>}
      </div>
    </div>
  );
}

export function CodexModal({ meta }: { meta: Meta5 }) {
  return <Modal title="도감" onClose={() => actions.close()} wide><CodexBody meta={meta} /></Modal>;
}
