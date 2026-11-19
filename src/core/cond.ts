// 조건 판정과 잠긴 이유. 조건은 값이다.
import { josa } from '../shared/core/josa';
import { lifePreparation } from './life-story';
import { fmtMoney } from '../shared/core/util';
import { canonAge } from '../data/canon';
import { STRENGTHS } from '../data/strengths';
import { GRADES, GRADE_TOP } from '../data/words';
import { VALUE_NAME } from '../data/values';
import { rating5 } from './power';
import { personIs } from './needs';
import { isDeep } from './values';
import { hasEntryContact } from './voyage';
import { styleBondReady, styleUsable } from './styles';
import type { Cond, Life5, Wealth } from './types';

const WEALTH_ORDER: readonly Wealth[] = ['poor', 'common', 'comfortable', 'noble'];
const wealthRank = (w: Wealth) => WEALTH_ORDER.indexOf(w);
const inRange = (n: number, min?: number, max?: number) => (min === undefined || n >= min) && (max === undefined || n <= max);
/** 아직 의수 · 의족을 달지 않은, 잃은 채로 남은 부위의 수 */
const lostLimbs = (s: Life5, only?: readonly string[]) => Object.entries(s.hero.limbs).filter(([k, x]) => x === 'lost' && (!only || only.includes(k))).length;
const strengthName = (id: string) => STRENGTHS.find((x) => x.id === id)?.name ?? id;

export function check(s: Life5, c: Cond): boolean {
  const h = s.hero;
  switch (c.c) {
    case 'styleBond': return c.phase === 'new' ? !s.growth.styleBonds[c.style] && styleUsable(s, c.style) : styleBondReady(s, c.style, c.phase);
    case 'lifePreparation': return lifePreparation(s, c.mode) === null;
    case 'age': return inRange(s.age, c.min, c.max);
    case 'standing': return c.is.includes(h.standing);
    case 'home': return c.is.includes(h.home);
    case 'wealth': return inRange(wealthRank(h.wealth),
      c.min === undefined ? undefined : wealthRank(c.min), c.max === undefined ? undefined : wealthRank(c.max));
    case 'lineage': return c.is.includes(h.lineage);
    case 'value': return isDeep(s, c.id) === c.deep;
    case 'strength': return s.strengths.includes(c.id) === c.has;
    case 'money': return h.money >= c.min;
    case 'entryContact': return hasEntryContact(s, c.gate);
    case 'weapon': return (h.weapon === c.id) === c.has;
    case 'fame': return h.fame >= c.min;
    case 'grade': return c.is.includes(GRADES.find(([limit]) => rating5(s) < limit)?.[1] ?? GRADE_TOP);
    case 'turningSeen': return ((s.seenCount[c.id] ?? 0) > 0) === c.has;
    case 'tier': {
      const t = c.branch === 'any' ? Math.max(...Object.values(s.growth.tier)) : s.growth.tier[c.branch];
      return t >= c.min;
    }
    case 'flag': return s.flags.includes(c.id) === c.has;
    case 'fruit': return (h.fruit !== null) === c.has;
    case 'limbLost': return lostLimbs(s, c.limbs) >= c.min;
    case 'sea': return c.is.includes(h.sea);
    case 'hardship': return s.hardship >= c.min;
    // 밝혀졌다 = 'surnameKnown' 표시가 있다. 모른다 = 아직 숨은 성이 남아 있다 (숨은 성이 없는 사람은 둘 다 아니다)
    case 'secret': return c.known ? s.flags.includes('surnameKnown') : h.secretSurname !== null;
    case 'town': return c.is.includes(h.town);
    case 'standingYears': return s.age - s.standingSince >= c.min;
    case 'island': return c.is.includes(h.island) !== (c.not ?? false);
    case 'species': return c.is.includes(h.species);
    case 'kin': return s.people.some((p) => p.alive && personIs(p, c.who)) === c.has;
    case 'person': return s.people.some((p) => p.alive && (p.relation === c.relation || p.aliases?.includes(c.relation)) && (!c.kinds || c.kinds.includes(p.kind))) === c.has;
    case 'path': return c.is.includes(s.growth.path ?? 'none');
    case 'canonAge': return inRange(canonAge(c.id, s.age), c.min, c.max);
    case 'dream': {
      const d = s.dream;
      if (!d) return !c.has;
      if (!c.has) return false;
      return (c.done === undefined || (d.done !== null) === c.done) && (!c.is || c.is.includes(d.id)) && (c.years === undefined || s.age - d.since >= c.years);
    }
  }
}

export function checkAll(s: Life5, cs?: Cond[]): boolean {
  return !cs || cs.every((c) => check(s, c));
}

/** 어긋난 조건 하나가 왜 막는지 한 줄 */
function reason(s: Life5, c: Cond): string {
  switch (c.c) {
    case 'styleBond': return '인연과 연습, 몸의 준비가 아직 맞지 않는다';
    case 'lifePreparation': return lifePreparation(s, c.mode) ?? '';
    case 'age': return c.min !== undefined && s.age < c.min ? `아직 ${c.min}살이 되지 않았다` : `${c.max}살을 넘겼다`;
    case 'standing': return '지금 처지로는 할 수 없다';
    case 'home': return '고향이 다르다';
    case 'wealth': return c.min !== undefined && wealthRank(s.hero.wealth) < wealthRank(c.min) ? '집안 형편이 따라 주지 않는다' : '집안이 너무 넉넉하다';
    case 'lineage': return '핏줄이 다르다';
    case 'value': return c.deep ? `${VALUE_NAME[c.id]}이(가) 아직 깊지 않다` : `${VALUE_NAME[c.id]}이(가) 너무 깊다`;
    case 'strength': return c.has ? `「${strengthName(c.id)}」이(가) 아직 없다` : `이미 「${strengthName(c.id)}」이(가) 있다`;
    case 'money': return `돈이 모자란다 (${fmtMoney(c.min)} 베리)`;
    case 'entryContact': return c.gate === 'zou' ? '비브르 카드가 없다' : '코팅을 도와줄 장인 인연이 없다';
    case 'weapon': return c.has ? '이 무기를 가지고 있지 않다' : '이미 이 무기를 가지고 있다';
    case 'fame': return '아직 이름이 알려지지 않았다';
    case 'grade': return '아직 상대가 인정할 전투력이 아니다';
    case 'turningSeen': return '이미 지나간 만남이다';
    case 'tier': return '아직 그 경지에 이르지 못했다';
    case 'flag': return '때가 맞지 않는다';
    case 'fruit': return c.has ? '열매 능력자만 할 수 있다' : '능력자는 할 수 없다';
    case 'limbLost': return c.limbs ? '잃은 팔다리가 없다' : '잃은 곳이 없다';
    case 'sea': return '이 바다에서는 할 수 없다';
    case 'hardship': return '아직 겪은 것이 모자란다';
    case 'secret': return c.known ? '아직 밝혀지지 않았다' : '숨은 것이 없다';
    case 'town': return '태어난 마을이 다르다';
    case 'standingYears': return '지금 처지가 된 지 얼마 되지 않았다';
    case 'island': return '여기서는 일어나지 않는다';
    case 'species': return '종족이 다르다';
    case 'kin': return '때가 맞지 않는다';
    case 'person': return c.has ? '그 사람과의 인연이 없다' : '이미 그 사람을 알고 있다';
    case 'path': return '걷는 길이 다르다';
    case 'canonAge': return '그 사람과 때가 맞지 않는다';
    case 'dream': return '마음에 품은 것이 다르다';
  }
}

/** 처음 어긋난 조건의 이유. 모두 맞으면 null */
export function whyNot(s: Life5, cs?: Cond[]): string | null {
  const bad = cs?.find((c) => !check(s, c));
  return bad ? josa(reason(s, bad)) : null;
}
