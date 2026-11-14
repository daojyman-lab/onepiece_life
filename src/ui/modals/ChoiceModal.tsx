import { dispatch } from '../../app/store';
import type { LifeState, Pending } from '../../core/types';
import { Face, heroWho, Modal } from '../common';

const CAT_NAMES = { childhood: '유년기', entry: '입문', master: '스승', fruit: '열매', career: '진로', challenge: '도전', bond: '인연', crisis: '위기', ship: '배' } as const;

export function ChoiceModal({ s, p }: { s: LifeState; p: Extract<Pending, { kind: 'choice' }> }) {
  const sp = p.speaker;
  const who = sp
    ? { key: sp.personId ? (s.people.find((x) => x.id === sp.personId)?.canon ?? sp.personId + sp.name) : sp.name, gender: sp.gender, age: sp.age, species: sp.species, faction: sp.faction }
    : heroWho(s);
  return (
    <Modal title={`${CAT_NAMES[p.category]} · ${p.title}`}>
      <div class="speaker">
        <div>
          <Face who={who} size="big" />
          <div class="name">{sp ? sp.name : `${s.hero.name} (나)`}</div>
        </div>
        <div class="scroll" style={{ flex: 1 }}>{p.body}</div>
      </div>
      <div style={{ marginTop: 8 }}>
        {p.options.map((o, i) => (
          <button class={`opt ${o.danger ? 'danger' : ''}`} disabled={!!o.disabled} onClick={() => dispatch({ type: 'answerChoice', index: i })}>
            <b>{o.label}</b>{o.danger && <span class="tag red" style={{ marginLeft: 6 }}>위험</span>}
            <span class="hint">{o.disabled ? `✕ ${o.disabled}` : o.hint}</span>
          </button>
        ))}
      </div>
      <div class="t9 soft" style={{ marginTop: 6 }}>{s.hero.age}세 · 선택이 떠 있는 동안 시간이 멈춘다.</div>
    </Modal>
  );
}
