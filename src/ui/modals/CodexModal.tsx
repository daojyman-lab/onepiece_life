import { actions } from '../../app/store';
import type { MetaState } from '../../core/types';
import { BOSSES } from '../../data/bosses';
import { CLASS_NAMES, FRUITS, GRADE_NAMES } from '../../data/fruits';
import { MASTERS } from '../../data/masters';
import { SEA_BY_ID } from '../../data/seas';
import { SKILLS } from '../../data/skills';
import { Modal } from '../common';

export function CodexBody({ meta }: { meta: MetaState }) {
  const eaten = FRUITS.filter((f) => meta.fruitCodex[f.id]);
  const people = [...MASTERS.map((m) => ({ id: m.id, name: m.name, title: m.title, kind: '스승' })), ...BOSSES.map((b) => ({ id: b.id, name: b.name, title: b.title ?? '', kind: '보스' }))];
  const known = people.filter((p) => meta.peopleCodex[p.id]);
  return (
    <div class="stack">
      <div class="row t9"><span class="tag">지난 인생 {meta.lives}번</span><span class="tag">열매 {eaten.length}/{FRUITS.length}</span><span class="tag">인물 {known.length}/{people.length}</span><span class="tag">기술 {meta.skillCodex.filter((x) => !x.startsWith('fruit:')).length}/{SKILLS.length}</span></div>
      <div class="paper">
        <b>열매 도감</b> <span class="t9 soft">먹어 본 열매는 다음 인생에서 다시 발견하면 알아본다.</span>
        <div class="grid3" style={{ marginTop: 4 }}>
          {FRUITS.map((f) => meta.fruitCodex[f.id]
            ? <div class="t9"><b>{f.name}</b><div class="soft">{CLASS_NAMES[f.cls]} · {GRADE_NAMES[f.grade]} · 기술 {f.skills.length}</div></div>
            : <div class="t9 soft">??? </div>)}
        </div>
      </div>
      <div class="paper">
        <b>인물 도감</b> <span class="t9 soft">만난 스승, 쓰러뜨린 강적. 다음 인생에서 정찰로 모든 것을 본다.</span>
        {known.length === 0 && <div class="t9 soft">아직 없다.</div>}
        {known.map((p) => {
          const c = meta.peopleCodex[p.id];
          return <div class="t9">[{p.kind}] <b>{p.name}</b> {p.title} · {SEA_BY_ID[c.where]?.name}{c.taughtBy ? ' · 가르침을 받음' : ''}{c.defeated ? ' · 쓰러뜨림' : ''}</div>;
        })}
      </div>
    </div>
  );
}

export function CodexModal({ meta }: { meta: MetaState }) {
  return <Modal title="도감" onClose={() => actions.close()} wide><CodexBody meta={meta} /></Modal>;
}
