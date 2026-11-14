// 기술 찾기, 열매 기술 만들기, 능력치 계산. 한 규칙은 여기 한 곳에만 둔다.
import { B } from '../../data/balance';
import { FRUIT_BY_ID, FRUIT_TEMPLATES } from '../../data/fruits';
import { ITEM_BY_ID } from '../../data/items';
import { HAKI_LEVEL_GATES, SKILLS } from '../../data/skills';
import type { BranchId, LifeState, Skill, Stats, StatKey } from '../types';

const SKILL_BY_ID: Record<string, Skill> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
const fruitSkillCache = new Map<string, Skill>();

/** 열매 기술 id: `fruit:<열매id>:<순번>` */
export function fruitSkillId(fruitId: string, idx: number) {
  return `fruit:${fruitId}:${idx}`;
}

export function getSkill(id: string): Skill | undefined {
  const s = SKILL_BY_ID[id];
  if (s) return s;
  if (!id.startsWith('fruit:')) return undefined;
  const hit = fruitSkillCache.get(id);
  if (hit) return hit;
  const [, fid, idxS] = id.split(':');
  const f = FRUIT_BY_ID[fid];
  const idx = Number(idxS);
  if (!f || !f.skills[idx]) return undefined;
  const t = FRUIT_TEMPLATES[f.skills[idx].template];
  const zoan = f.cls === 'zoan';
  const sk: Skill = {
    id, name: f.skills[idx].name, branch: 'fruit',
    tier: Math.min(6, idx + 1) as Skill['tier'],
    kind: t.kind, stat: zoan && t.stat === 'int' ? 'str' : t.stat, power: t.power, cost: t.cost, cooldown: t.cooldown, when: t.when,
    tags: [...t.tags], effect: t.effect ? { ...t.effect } : undefined,
    requires: idx === 0 ? {} : {
      skills: [{ id: fruitSkillId(fid, idx - 1), mastery: 25 + idx * 8 }],
      base: { int: 10 + idx * 12 },
      gate: t.id === 'awaken' ? 'fruit.awaken' : undefined,
    },
    text: `${f.name}의 힘. ${t.kind === 'attack' ? `위력 ${t.power}` : t.kind === 'passive' ? '늘 효과가 있다' : '보조 기술'}`,
  };
  fruitSkillCache.set(id, sk);
  return sk;
}

/** 한 갈래의 기술 목록. 열매는 주인공이 먹은 열매의 것 */
export function branchSkills(branch: BranchId, fruitId: string | null): Skill[] {
  if (branch !== 'fruit') return SKILLS.filter((s) => s.branch === branch);
  if (!fruitId) return [];
  const f = FRUIT_BY_ID[fruitId];
  return f ? f.skills.map((_, i) => getSkill(fruitSkillId(fruitId, i))!) : [];
}

export function armamentLevel(s: LifeState): 0 | 1 | 2 | 3 {
  return HAKI_LEVEL_GATES.armament.filter((g) => s.growth.gates.includes(g)).length as 0 | 1 | 2 | 3;
}
export function observationLevel(s: LifeState): 0 | 1 | 2 | 3 {
  return HAKI_LEVEL_GATES.observation.filter((g) => s.growth.gates.includes(g)).length as 0 | 1 | 2 | 3;
}

/** 부상과 장신구를 반영한 능력치 */
export function effectiveStats(s: LifeState): Stats {
  const h = s.hero;
  let mult = 1;
  for (const inj of h.injuries) {
    if (inj.severity === 'light') mult = Math.min(mult, B.body.injury.light.statMult);
    if (inj.severity === 'heavy') mult = Math.min(mult, B.body.injury.heavy.statMult);
  }
  const out = {} as Stats;
  const charm = s.loadout.charm ? ITEM_BY_ID[s.loadout.charm] : null;
  for (const k of Object.keys(h.base) as StatKey[]) {
    out[k] = Math.max(1, h.base[k] * mult + (charm?.bonus?.[k] ?? 0));
  }
  return out;
}

export function heavyInjured(s: LifeState) {
  return s.hero.injuries.some((i) => i.severity === 'heavy');
}

/** 전투력 (화면 표시와 대략적 비교용). 능력치 평균 × 배운 기술의 깊이 */
export function powerRating(s: LifeState) {
  const st = effectiveStats(s);
  const avg = (st.str + st.spd + st.vit + st.int + st.wil) / 5;
  const best = Math.max(1, ...Object.keys(s.growth.skills).map((id) => (getSkill(id)?.power ?? 1)));
  return Math.round(avg * (1 + best * 0.25) * (1 + armamentLevel(s) * 0.1));
}
