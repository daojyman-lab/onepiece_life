// tests/game/needs.test.ts
import { describe, expect, it } from 'vitest';
import { needOk, whyNeed } from '../../src/core/needs';
import { newLife5 } from '../../src/core/state';
import { resolveDoors, openTurning, openQueued, answerDoor } from '../../src/core/turning';
import { normalizeLife5 } from '../../src/core/load';
import { check, whyNot } from '../../src/core/cond';
import { applyFx } from '../../src/core/fx';
import { V } from '../../src/data/balance';
import { TURNING_BY_ID } from '../../src/data/turnings';
import type { Life5, Turning } from '../../src/core/types';

const adult = (seed = 1): Life5 => { const s = newLife5(seed); s.pending = null; s.age = 25; s.hero.standing = 'pirate'; s.people = []; return s; };
const T = (over: Partial<Turning>): Turning => ({ id: 'x', kind: 'door', when: [], weight: 5, repeat: { years: 1 }, speaker: 'hero', title: '제목', body: '본문',
  doors: [{ label: '받는다', hint: '', fx: [] }, { label: '거절한다', hint: '', fx: [], closes: true }], ...over });

describe('필요한 것', () => {
  it('열매를 먹으면 헤엄칠 수 없다', () => {
    const s = adult(); expect(needOk(s, 'swim')).toBe(true);
    s.hero.fruit = { id: 'f', eatenAt: 20 }; expect(needOk(s, 'swim')).toBe(false);
    expect(whyNeed(s, ['swim'])).toMatch(/헤엄/);
  });
  it('동료, 배우자, 형제는 살아 있는 사람이 있어야 한다', () => {
    const s = adult();
    for (const n of ['crew', 'spouse', 'child', 'sibling', 'parent'] as const) expect(needOk(s, n)).toBe(false);
  });
  it('두 팔을 다 잃으면 팔이 필요한 일을 못 한다', () => {
    const s = adult(); expect(needOk(s, 'arms')).toBe(true);
    s.hero.limbs.armL = 'lost'; expect(needOk(s, 'arms')).toBe(true);
    s.hero.limbs.armR = 'lost'; expect(needOk(s, 'arms')).toBe(false);
    s.hero.limbs.armR = 'basic'; expect(needOk(s, 'arms')).toBe(true);
  });
  it('문의 필요가 안 맞으면 까닭과 함께 잠긴다', () => {
    const s = adult(); s.hero.fruit = { id: 'f', eatenAt: 20 };
    const t = T({ doors: [{ label: '바다에 뛰어든다', hint: '', fx: [], needs: ['swim'] }, { label: '버틴다', hint: '', fx: [] }] });
    const d = resolveDoors(s, t);
    expect(d[0].locked).toMatch(/헤엄/); expect(d[1].locked).toBeNull();
  });
  it('전환점의 필요가 안 맞으면 열리지 않는다', () => {
    expect(openTurning(adult(), T({ needs: ['crew'] }))).toBe(false);
  });
});

describe('되풀이 막기', () => {
  it('거절한 제안은 그 인생에서 다시 열리지 않는다', () => {
    const s = adult(); const t = T({});
    expect(openTurning(s, t)).toBe(true);
    answerDoor(s, 1);                                   // closes 문
    expect(s.closed).toContain('x');
    s.age += 10; expect(openTurning(s, t)).toBe(false);
  });
  it('되풀이되는 전환점도 한 인생에 V.turning.maxRepeat번까지다', () => {
    const s = adult(); const t = T({});
    for (let i = 0; i < V.turning.maxRepeat; i++) { expect(openTurning(s, t)).toBe(true); answerDoor(s, 0); s.age += 2; }
    expect(openTurning(s, t)).toBe(false);
    expect(s.seenCount.x).toBe(V.turning.maxRepeat);
  });
  it('max를 적으면 그만큼만', () => {
    const s = adult(); const t = T({ max: 1 });
    expect(openTurning(s, t)).toBe(true); answerDoor(s, 0); s.age += 5;
    expect(openTurning(s, t)).toBe(false);
  });
});

describe('줄 선 전환점과 상한', () => {
  const queued = (s: Life5, id: string) => { s.queue = [id]; return openQueued(s); };
  it('줄에 선 전환점도 상한에 닿았으면 열리지 않고 줄에서 버려진다', () => {
    const s = adult(); const t = TURNING_BY_ID.prison_escape; s.hero.standing = 'prisoner';
    s.seenCount[t.id] = V.turning.maxRepeat;
    expect(queued(s, t.id)).toBe(false); expect(s.queue).toEqual([]); expect(s.pending).toBeNull();
  });
  it('닫힌 전환점도 줄에서 버려진다', () => {
    const s = adult(); s.hero.standing = 'prisoner'; s.closed = ['prison_escape'];
    expect(queued(s, 'prison_escape')).toBe(false); expect(s.queue).toEqual([]);
  });
  it('싸움 뒤의 문과 큰 계기(줄로만 오는 전환점)는 상한이 없다', () => {
    for (const id of ['after_fight', 'moment_loss']) {
      const s = adult(); s.seenCount[id] = V.turning.maxRepeat * 5;
      expect(queued(s, id), id).toBe(true); expect(s.pending?.kind === 'door' && s.pending.turning).toBe(id);
    }
  });
});

describe('잃는 사람', () => {
  it('losePerson의 갈래 crew는 관계 글과 상관없이 살아 있는 동료 하나를 잃는다', () => {
    const s = adult();
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '부두 건달 출신 선원' }]);
    expect(needOk(s, 'crew')).toBe(true);
    applyFx(s, [{ op: 'losePerson', who: 'crew' }]);
    expect(needOk(s, 'crew')).toBe(false);
  });
});

describe('전에 골라 본 문', () => {
  it('이번 인생에 고른 문에는 표시가 붙지 않는다', () => {
    const s = adult(); const t = T({});
    openTurning(s, t); answerDoor(s, 0); s.age += 2;
    expect(resolveDoors(s, t)[0].tried).toBe(false);
    s.known = ['x#0']; expect(resolveDoors(s, t)[0].tried).toBe(true);
  });
});

describe('옛 저장', () => {
  it('새 칸이 없는 저장을 기본값으로 채운다', () => {
    const s = JSON.parse(JSON.stringify(newLife5(1)));
    delete s.seenCount; delete s.closed; delete s.standingSince;
    const f = normalizeLife5(s)!;
    expect(f.seenCount).toEqual({}); expect(f.closed).toEqual([]); expect(f.standingSince).toBe(f.age);
  });
});

describe('마을 · 처지의 햇수 조건', () => {
  it('태어난 마을을 본다', () => {
    const s = adult(); s.hero.town = '항구 마을';
    expect(check(s, { c: 'town', is: ['항구 마을'] })).toBe(true);
    expect(check(s, { c: 'town', is: ['다른 마을'] })).toBe(false);
    expect(whyNot(s, [{ c: 'town', is: ['다른 마을'] }])).toMatch(/마을/);
  });
  it('처지가 바뀌면 그 나이부터 햇수를 센다', () => {
    const s = adult(); s.age = 20;
    applyFx(s, [{ op: 'standing', to: 'marine' }]);
    expect(s.standingSince).toBe(20);
    s.age = 22; expect(check(s, { c: 'standingYears', min: 3 })).toBe(false);
    s.age = 23; expect(check(s, { c: 'standingYears', min: 3 })).toBe(true);
  });
});
