// 조건 판정기. 조건은 값이다.
import type { Condition, LifeState } from './types';
import { fmtMoney } from './util';
import { BRANCH_NAMES, GATE_NAMES } from '../data/skills';
import { getSkill } from './growth/skillbook';

const crewCount = (s: LifeState) => s.people.filter((p) => p.alive && p.kind === 'crew').length;

export function check(s: LifeState, c: Condition): boolean {
  const h = s.hero;
  switch (c.c) {
    case 'age': return (c.min === undefined || h.age >= c.min) && (c.max === undefined || h.age <= c.max);
    case 'route': return c.is.includes(h.route);
    case 'stage': return (c.min === undefined || s.world.stage >= c.min) && (c.max === undefined || s.world.stage <= c.max);
    case 'base': return h.base[c.key] >= c.min;
    case 'skill': {
      const k = s.growth.skills[c.id];
      return !!k && (c.mastery === undefined || k.mastery >= c.mastery);
    }
    case 'gate': return s.growth.gates.includes(c.id) === c.has;
    case 'fruit': return (h.fruit !== null) === c.has;
    case 'flag': return s.choice.flags.includes(c.id) === c.has;
    case 'trait': return h.traits.includes(c.id) === c.has;
    case 'money': return h.money >= c.min;
    case 'fame': return h.fame >= c.min;
    case 'crew': {
      const n = crewCount(s);
      return (c.min === undefined || n >= c.min) && (c.max === undefined || n <= c.max);
    }
    case 'injured': return (h.injuries.some((i) => i.severity !== 'scar')) === c.is;
    case 'ill': return (h.illness !== null) === c.is;
    case 'birthSea': return c.is.includes(h.birth.seaId);
    case 'focus': return c.is.includes(s.growth.focus);
    case 'species': return c.is.includes(h.species);
    case 'person': return s.people.some((p) => p.alive && p.kind === c.kind) === c.has;
    case 'rank': return (c.min === undefined || h.rank >= c.min) && (c.max === undefined || h.rank <= c.max);
    case 'place': return c.is.includes(h.birth.place);
    case 'sea': return c.is.includes(s.world.seaId);
  }
}

export function checkAll(s: LifeState, cs: Condition[] | undefined) {
  return !cs || cs.every((c) => check(s, c));
}

/** 맞지 않는 조건의 이유 (선택지를 흐리게 보일 때) */
export function reason(c: Condition): string {
  switch (c.c) {
    case 'age': return c.min !== undefined ? `${c.min}세 이상` : `${c.max}세 이하`;
    case 'route': return `길: ${c.is.join('/')}`;
    case 'stage': return `${c.min ?? 1}단계 해역 이상`;
    case 'base': return `${({ str: '힘', spd: '속도', vit: '체력', int: '지능', wil: '정신', luk: '운' })[c.key]} ${c.min} 필요`;
    case 'skill': return `「${getSkill(c.id)?.name ?? c.id}」${c.mastery ? ` 숙련 ${c.mastery}` : ''} 필요`;
    case 'gate': return c.has ? `「${GATE_NAMES[c.id] ?? c.id}」 필요` : '이미 열었다';
    case 'fruit': return c.has ? '열매 능력자만' : '능력자는 안 된다';
    case 'flag': return '조건이 맞지 않는다';
    case 'trait': return '자질이 없다';
    case 'money': return `돈 ${fmtMoney(c.min)} 필요`;
    case 'fame': return `명성 ${c.min} 필요`;
    case 'crew': return c.max !== undefined ? '배에 자리가 없다' : `동료 ${c.min}명 필요`;
    case 'injured': return c.is ? '다쳤을 때만' : '다친 몸으로는 안 된다';
    case 'ill': return c.is ? '아플 때만' : '아픈 몸으로는 안 된다';
    case 'birthSea': return '출신 바다가 다르다';
    case 'focus': return `주력: ${c.is.map((b) => (b ? BRANCH_NAMES[b] : '없음')).join('/')}`;
    case 'species': return '종족이 다르다';
    case 'person': return c.has ? '그런 사람이 없다' : '이미 있다';
    case 'rank': return c.min !== undefined ? '계급이 모자라다' : '계급이 너무 높다';
    case 'place': return '고향이 다르다';
    case 'sea': return '이 바다에서는 안 된다';
  }
}

export function firstFailReason(s: LifeState, cs: Condition[] | undefined): string | null {
  if (!cs) return null;
  const bad = cs.find((c) => !check(s, c));
  return bad ? reason(bad) : null;
}
