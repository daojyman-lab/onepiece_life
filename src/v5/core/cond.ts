// 조건 판정과 잠긴 이유. 조건은 값이다.
import { josa } from '../../core/josa';
import { fmtMoney } from '../../core/util';
import { STRENGTHS } from '../data/strengths';
import { VALUE_NAME } from '../data/values';
import { isDeep } from './values';
import type { Cond, Life5, Wealth } from './types';

const WEALTH_ORDER: readonly Wealth[] = ['poor', 'common', 'comfortable', 'noble'];
const wealthRank = (w: Wealth) => WEALTH_ORDER.indexOf(w);
const inRange = (n: number, min?: number, max?: number) => (min === undefined || n >= min) && (max === undefined || n <= max);
/** 아직 의수 · 의족을 달지 않은, 잃은 채로 남은 부위의 수 */
const lostLimbs = (s: Life5) => Object.values(s.hero.limbs).filter((x) => x === 'lost').length;
const strengthName = (id: string) => STRENGTHS.find((x) => x.id === id)?.name ?? id;

export function check(s: Life5, c: Cond): boolean {
  const h = s.hero;
  switch (c.c) {
    case 'age': return inRange(s.age, c.min, c.max);
    case 'standing': return c.is.includes(h.standing);
    case 'home': return c.is.includes(h.home);
    case 'wealth': return inRange(wealthRank(h.wealth),
      c.min === undefined ? undefined : wealthRank(c.min), c.max === undefined ? undefined : wealthRank(c.max));
    case 'lineage': return c.is.includes(h.lineage);
    case 'value': return isDeep(s, c.id) === c.deep;
    case 'strength': return s.strengths.includes(c.id) === c.has;
    case 'money': return h.money >= c.min;
    case 'fame': return h.fame >= c.min;
    case 'tier': {
      const t = c.branch === 'any' ? Math.max(...Object.values(s.growth.tier)) : s.growth.tier[c.branch];
      return t >= c.min;
    }
    case 'flag': return s.flags.includes(c.id) === c.has;
    case 'fruit': return (h.fruit !== null) === c.has;
    case 'limbLost': return lostLimbs(s) >= c.min;
    case 'sea': return c.is.includes(h.sea);
    case 'hardship': return s.hardship >= c.min;
    // 밝혀졌다 = 'surnameKnown' 표시가 있다. 모른다 = 아직 숨은 성이 남아 있다 (숨은 성이 없는 사람은 둘 다 아니다)
    case 'secret': return c.known ? s.flags.includes('surnameKnown') : h.secretSurname !== null;
    case 'town': return c.is.includes(h.town);
    case 'standingYears': return s.age - s.standingSince >= c.min;
  }
}

export function checkAll(s: Life5, cs?: Cond[]): boolean {
  return !cs || cs.every((c) => check(s, c));
}

/** 어긋난 조건 하나가 왜 막는지 한 줄 */
function reason(s: Life5, c: Cond): string {
  switch (c.c) {
    case 'age': return c.min !== undefined && s.age < c.min ? `아직 ${c.min}살이 되지 않았다` : `${c.max}살을 넘겼다`;
    case 'standing': return '지금 처지로는 할 수 없다';
    case 'home': return '고향이 다르다';
    case 'wealth': return c.min !== undefined && wealthRank(s.hero.wealth) < wealthRank(c.min) ? '집안 형편이 따라 주지 않는다' : '집안이 너무 넉넉하다';
    case 'lineage': return '핏줄이 다르다';
    case 'value': return c.deep ? `${VALUE_NAME[c.id]}이(가) 아직 깊지 않다` : `${VALUE_NAME[c.id]}이(가) 너무 깊다`;
    case 'strength': return c.has ? `「${strengthName(c.id)}」이(가) 아직 없다` : `이미 「${strengthName(c.id)}」이(가) 있다`;
    case 'money': return `돈이 모자란다 (${fmtMoney(c.min)} 베리)`;
    case 'fame': return '아직 이름이 알려지지 않았다';
    case 'tier': return '아직 그 경지에 이르지 못했다';
    case 'flag': return '때가 맞지 않는다';
    case 'fruit': return c.has ? '열매 능력자만 할 수 있다' : '능력자는 할 수 없다';
    case 'limbLost': return '잃은 곳이 없다';
    case 'sea': return '이 바다에서는 할 수 없다';
    case 'hardship': return '아직 겪은 것이 모자란다';
    case 'secret': return c.known ? '아직 밝혀지지 않았다' : '숨은 것이 없다';
    case 'town': return '태어난 마을이 다르다';
    case 'standingYears': return '지금 처지가 된 지 얼마 되지 않았다';
  }
}

/** 처음 어긋난 조건의 이유. 모두 맞으면 null */
export function whyNot(s: Life5, cs?: Cond[]): string | null {
  const bad = cs?.find((c) => !check(s, c));
  return bad ? josa(reason(s, bad)) : null;
}
