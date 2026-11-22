// 사건의 글이 전제하는 것(동료, 가족, 헤엄, 칼 …)이 이 사람에게 있는가.
// 전환점의 needs가 안 맞으면 그 전환점은 오지 않고, 문의 needs가 안 맞으면 그 문은 잠긴다.
import { RELATION_KIND } from '../data/words';
import { COMBAT_STYLE_BY_ID } from '../data/combat-styles';
import { rivalPerson } from './rival';
import { primaryStyle } from './styles';
import type { ContactRole, Life5, Need, Person } from './types';

/** 이 사람이 그 갈래(함께 싸우는 동료, 배우자 · 자식 · 형제 · 부모)인가 */
export function personIs(p: Person, who: 'crew' | keyof typeof RELATION_KIND): boolean {
  return who === 'crew' ? p.crew !== undefined : RELATION_KIND[who].includes(p.relation);
}

export function hasRelation(p: Person, relation: string): boolean {
  return p.relation === relation || p.aliases?.includes(relation) === true;
}

export function livingContact(s: Life5, by: { relation: string } | { who: ContactRole }): Person | undefined {
  if ('relation' in by) return livingRelation(s, by.relation);
  return s.people.find(p => p.alive && personIs(p, by.who) && (by.who !== 'crew' || !p.crew?.separatedMonths));
}

export function livingRelation(s: Life5, relation: string): Person | undefined {
  if (relation === '어릴 적 맞수') {
    const p = rivalPerson(s);
    return p?.alive && !p.missing ? p : undefined;
  }
  return s.people.find(p => p.alive && hasRelation(p, relation));
}

export function fillContacts(s: Life5, text: string): string {
  return text.replace(/\{person:([^{}]+)\}/g, (_, relation: string) => livingContact(s, { relation })?.name ?? relation);
}

const usable = (x: string) => x !== 'lost';

export function needOk(s: Life5, n: Need): boolean {
  switch (n) {
    case 'crew': return s.people.some((p) => p.alive && p.crew && !p.crew.separatedMonths);
    case 'spouse': case 'child': case 'sibling': case 'parent': return s.people.some((p) => p.alive && personIs(p, n));
    case 'swim': return s.hero.fruit === null;
    case 'sword': case 'gun': case 'fist': {
      const active = primaryStyle(s);
      return s.growth.tier[n] >= 1 && (!active || COMBAT_STYLE_BY_ID[active].branch === n);
    }
    case 'arms': return usable(s.hero.limbs.armL) || usable(s.hero.limbs.armR);
    case 'ship': return s.flags.includes('ship');
  }
}

export function needsOk(s: Life5, ns?: Need[]): boolean {
  return !ns || ns.every((n) => needOk(s, n));
}

const WHY: Record<Need, string> = {
  crew: '함께할 동료가 없다',
  spouse: '곁에 짝이 없다',
  child: '자식이 없다',
  sibling: '형제가 없다',
  parent: '부모가 곁에 없다',
  swim: '열매를 먹은 몸은 헤엄칠 수 없다',
  sword: '칼을 쓸 줄 모른다',
  gun: '총을 쓸 줄 모른다',
  fist: '주먹을 쓸 줄 모른다',
  arms: '쓸 수 있는 팔이 없다',
  ship: '배가 없다',
};

/** 처음 걸리는 것의 까닭. 모두 맞으면 null */
export function whyNeed(s: Life5, ns?: Need[]): string | null {
  const bad = ns?.find((n) => !needOk(s, n));
  return bad ? WHY[bad] : null;
}
