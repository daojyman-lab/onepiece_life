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
  void fruitId;
  return [];   // 열매는 기술이 아니라 패시브다 (data/passives.ts)
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

const WHEN_TEXT: Record<Skill['when'], string> = {
  always: '', opening: '첫 2합에만', hpBelow50: '내 체력이 절반 아래일 때', enemyHpBelow30: '상대 체력이 30% 아래일 때',
  afterEnemyBig: '상대가 큰 기술을 쓴 직후', allyDown: '우리 편이 쓰러졌을 때',
};

/** 기술이 무엇을 하는지 한 줄로: "공격 · 위력 1.8배 · 기력 14 · 2합마다 · 여럿에게(피하기 어려움)" */
export function skillSummary(sk: Skill): string {
  const parts: string[] = [];
  const statName = { str: '힘', spd: '속도', int: '지능', wil: '정신' }[sk.stat];
  if (sk.kind === 'attack') parts.push(`공격 · 위력 ${sk.power}배 (${statName})`);
  else if (sk.kind === 'passive') {
    const e = sk.effect;
    parts.push(e?.type === 'guard' ? `늘 받는 피해 −${Math.round(e.value * 100)}%` : e?.type === 'dodge' ? `늘 회피 +${Math.round(e.value * 100)}%` : e?.type === 'buff' ? `늘 피해 +${Math.round(e.value * 100)}%` : '늘 효과');
  } else {
    const e = sk.effect;
    if (e?.type === 'guard') parts.push(`방어 · ${e.turns}합 동안 받는 피해 −${Math.round(e.value * 100)}%`);
    else if (e?.type === 'dodge') parts.push(`회피 · ${e.turns}합 동안 회피 +${Math.round(e.value * 100)}%`);
    else if (e?.type === 'heal') parts.push(`회복 · 체력 ${Math.round(e.value * 100)}%`);
    else if (e?.type === 'bind') parts.push(`묶기 · ${Math.round(e.value * 100)}% 확률로 상대가 한 합 못 움직임`);
    else parts.push('보조');
  }
  if (sk.kind !== 'passive') {
    parts.push(`기력 ${sk.cost}`);
    if (sk.cooldown > 0) parts.push(`${sk.cooldown + 1}합에 한 번`);
  }
  if (WHEN_TEXT[sk.when]) parts.push(WHEN_TEXT[sk.when]);
  if (sk.tags.includes('area')) parts.push('여럿에게 · 피하기 어려움');
  if (sk.tags.includes('pierce')) parts.push('자연계에 한 단계 더 닿음');
  return parts.join(' · ');
}

/** 한 갈래의 숙련 측정: 배운 기술 수, 전체 기술 수, 배운 기술의 평균 숙련 */
export function branchProgress(s: LifeState, branch: BranchId) {
  const list = branchSkills(branch, s.hero.fruit?.id ?? null);
  const learned = list.filter((k) => s.growth.skills[k.id]);
  const avg = learned.length ? learned.reduce((x, k) => x + s.growth.skills[k.id].mastery, 0) / learned.length : 0;
  return { learned: learned.length, total: list.length, mastery: avg };
}

/** 전투력 (화면 표시와 대략적 비교용). 능력치 평균 × 배운 기술의 깊이 */
export function powerRating(s: LifeState) {
  const st = effectiveStats(s);
  const avg = (st.str + st.spd + st.vit + st.int + st.wil) / 5;
  const best = Math.max(1, ...Object.keys(s.growth.skills).map((id) => (getSkill(id)?.power ?? 1)));
  return Math.round(avg * (1 + best * 0.25) * (1 + armamentLevel(s) * 0.1));
}
