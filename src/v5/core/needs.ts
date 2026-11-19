// 사건의 글이 전제하는 것(동료, 가족, 헤엄, 칼 …)이 이 사람에게 있는가.
// 전환점의 needs가 안 맞으면 그 전환점은 오지 않고, 문의 needs가 안 맞으면 그 문은 잠긴다.
import { RELATION_KIND } from '../data/words';
import { rivalPerson } from './rival';
import type { Life5, Need, Person } from './types';

export function livingRelation(s: Life5, relation: string): Person | undefined {
  if (relation === '어릴 적 맞수') {
    const p = rivalPerson(s);
    return p?.alive ? p : undefined;
  }
  return s.people.find(p => p.alive && p.relation === relation);
}

/** 이 사람이 그 갈래(함께 싸우는 동료, 배우자 · 자식 · 형제 · 부모)인가 */
export function personIs(p: Person, who: 'crew' | keyof typeof RELATION_KIND): boolean {
  return who === 'crew' ? p.crew !== undefined : RELATION_KIND[who].includes(p.relation);
}

const usable = (x: string) => x !== 'lost';

export function needOk(s: Life5, n: Need): boolean {
  switch (n) {
    case 'crew': case 'spouse': case 'child': case 'sibling': case 'parent': return s.people.some((p) => p.alive && personIs(p, n));
    case 'swim': return s.hero.fruit === null;
    case 'sword': case 'gun': case 'fist': return s.growth.tier[n] >= 1;
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
