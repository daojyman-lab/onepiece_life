import { useState } from 'preact/hooks';
import { actions } from '../../app/store';
import { requirementsMet } from '../../core/growth/growth';
import { branchSkills, skillSummary } from '../../core/growth/skillbook';
import type { BranchId, LifeState, MetaState, Skill } from '../../core/types';
import { BRANCH_NAMES, GATE_NAMES } from '../../data/skills';
import { Gauge, Modal, STAT_NAMES } from '../common';
import { FRUIT_PASSIVES } from '../../data/passives';
import { FRUIT_BY_ID } from '../../data/fruits';
import { getSkill } from '../../core/growth/skillbook';

const BRANCHES: BranchId[] = ['martial.fist', 'martial.sword', 'martial.gun', 'haki.observation', 'haki.armament', 'haki.conqueror', 'fruit'];

function req(sk: Skill) {
  const out: string[] = [];
  for (const x of sk.requires.skills ?? []) out.push(`「${getSkill(x.id)?.name ?? x.id}」 숙련 ${x.mastery}`);
  for (const [k, v] of Object.entries(sk.requires.base ?? {})) out.push(`${STAT_NAMES[k as keyof typeof STAT_NAMES]} ${v}`);
  if (sk.requires.gate) out.push(`큰 단계 「${GATE_NAMES[sk.requires.gate] ?? sk.requires.gate}」 (스승 · 사건)`);
  return out.join(' · ') || '조건 없음';
}

export function GrowthModal({ s, meta }: { s: LifeState; meta: MetaState }) {
  const [br, setBr] = useState<BranchId>(s.growth.focus ?? 'martial.fist');
  const list = branchSkills(br, s.hero.fruit?.id ?? null);
  return (
    <Modal title="기술 트리" onClose={() => actions.close()} wide>
      <div class="row" style={{ marginBottom: 8 }}>
        {BRANCHES.map((b) => (
          <button class={`btn small ${br === b ? 'on' : ''}`} onClick={() => setBr(b)}>
            {BRANCH_NAMES[b]}{s.growth.focus === b ? ' ★' : s.growth.haki === b ? ' ◆' : b === 'fruit' && s.hero.fruit ? ' ●' : ''}
          </button>
        ))}
      </div>
      <div class="t9 soft" style={{ marginBottom: 6 }}>★ 주력 (무술) · ◆ 패기 칸 · ● 열매 칸(패시브). 칸은 따로 자란다. 칸은 중대한 선택에서만 바뀐다. 다음 단계와 도감에 있는 기술은 미리 보인다.</div>
      {br === 'fruit' && !s.hero.fruit && <div class="empty">열매를 먹지 않았다. 먹지 않으면 그만큼 무술과 패기를 더 깊이 올릴 수 있다.</div>}
      {br === 'fruit' && s.hero.fruit && FRUIT_PASSIVES[s.hero.fruit.id] && (
        <div class="paper stack">
          <b>{FRUIT_BY_ID[s.hero.fruit.id]?.name} — 패시브</b>
          <div>{FRUIT_PASSIVES[s.hero.fruit.id].text}</div>
          <div class="t9 soft">열매 숙련 {Math.floor(s.growth.fruitMastery ?? 0)} / 100 · 숙련이 오를수록 효과가 60%에서 100%까지 세진다</div>
          {FRUIT_PASSIVES[s.hero.fruit.id].awakenText
            ? <div><b>각성하면</b> {FRUIT_PASSIVES[s.hero.fruit.id].awakenText} <span class="t9 soft">(숙련 100에서 스승의 수련이나 죽을 고비로 연다)</span></div>
            : <div class="t9 soft">이 열매는 각성하지 않는다.</div>}
        </div>
      )}
      {br === 'haki.conqueror' && !s.hero.traits.includes('conqueror') && <div class="paper t9" style={{ marginBottom: 6 }}>패왕색은 타고난 자질이 있어야 한다.</div>}
      <div class="tree">
        {list.map((sk) => {
          const k = s.growth.skills[sk.id];
          const prereqLearned = (sk.requires.skills ?? []).every((x) => s.growth.skills[x.id]);
          const visible = !!k || prereqLearned || meta.skillCodex.includes(sk.id);
          if (!visible) return <div class="skill hidden"><b>???</b><div class="t9">{sk.tier}단계 · 앞 기술을 익히면 보인다</div></div>;
          const ready = !k && requirementsMet(s, sk);
          return (
            <div class={`skill ${k ? 'learned' : 'locked'}`}>
              <div class="row between"><b>{sk.name}</b><span class="tag">{sk.tier}단계</span></div>
              <div class="t9"><b>{skillSummary(sk)}</b></div>
              <div class="t9 soft">{sk.text}</div>
              {k ? <><div class="t9">숙련 {Math.floor(k.mastery)}{s.loadout.skills.includes(sk.id) ? ' · 장착' : ''}</div><Gauge value={k.mastery} max={100} kind="sp" thin /></>
                : <div class="t9">{ready ? '곧 익힌다 (이 갈래를 키우면)' : `조건: ${req(sk)}`}</div>}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
