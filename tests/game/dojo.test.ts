import { describe, expect, it } from 'vitest';
import { applyFx, tierCap } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning, pickTurning } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { rngOf } from '../../src/shared/core/rng';

const branches = { sword: '검술', gun: '총술', fist: '권법' } as const;

function child() {
  const s = newLife5(88, { home: 'loguetown', wealth: 'poor' });
  s.traits!.active = []; // 특성과 섬 보정이 없는 기본 수업료와 숙련을 확인한다.
  s.pending = null;
  s.queue = [];
  s.age = 12;
  return s;
}

describe('공통 도장의 입문', () => {
  it.each(Object.entries(branches))('%s 도장은 돈 없이 훔쳐볼 수 있고 가끔 그 갈래의 요령만 배운다', (branch, name) => {
    const dojo = TURNING_BY_ID[`pp_dojo_${branch}`];
    expect(dojo.title).toContain(name);
    const results = new Set<number>();
    for (let seed = 1; seed <= 24; seed++) {
      const s = child();
      s.rng = { seed, cursor: 0 };
      expect(openTurning(s, dojo)).toBe(true);
      const saved = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
      expect(saved.pending).toMatchObject({ title: expect.stringContaining(name), doors: [
        { locked: expect.any(String) }, { label: expect.stringContaining('담 너머'), locked: null }, {},
      ] });
      const from = saved.seq;
      answerDoor(saved, 1);
      const mastery = saved.growth.mastery[branch as keyof typeof branches];
      results.add(mastery);
      expect(saved.hero.money).toBe(0);
      expect(saved.pending).toBeNull();
      expect(saved.queue).toEqual([]);
      expect(saved.growth.master).toBeNull();
      expect(saved.log.some((line) => line.id >= from && line.text.includes('사범이 안으로 불렀다'))).toBe(mastery === 18);
    }
    expect([...results].sort((a, b) => a - b)).toEqual([8, 18]);
  });

  it.each(['sibling', 'rival'] as const)('실제 %s와 대련할 수 있고 상대가 없으면 문이 잠긴다', (partner) => {
    const s = child();
    s.people = [];
    expect(openTurning(s, TURNING_BY_ID.pp_dojo_fist)).toBe(true);
    expect(s.pending).toMatchObject({ doors: [{}, {}, { locked: expect.any(String) }] });
    s.seenCount = {};
    s.pending = null;
    applyFx(s, [{ op: 'person', kind: partner === 'sibling' ? 'family' : 'rival',
      relation: partner === 'sibling' ? '형' : '어릴 적 맞수', name: '카이' }]);
    expect(openTurning(s, TURNING_BY_ID.pp_dojo_fist)).toBe(true);
    expect(s.pending).toMatchObject({ doors: [{}, {}, { label: expect.stringContaining('카이'), locked: null }] });
    answerDoor(s, 2);
    expect(s.log.some((line) => line.text.includes('카이') && line.text.includes('겨뤘다'))).toBe(true);
    expect(s.growth.master).toBeNull();
  });

  it('유료 입문은 기본 25만 베리이며 만난 사범의 갈래를 배운다', () => {
    const s = child();
    s.hero.money = 250000;
    expect(TURNING_BY_ID.pp_dojo_gun).toBeDefined();
    expect(openTurning(s, TURNING_BY_ID.pp_dojo_gun)).toBe(true);
    answerDoor(s, 0);
    expect(s.hero.money).toBe(0);
    expect(s.growth.master).toMatchObject({ branch: 'gun', paid: true, yearsLeft: 8, cap: 4 });
    expect(tierCap(s, 'gun')).toBe(4);
  });

  it('일반 사건 추첨에서 세 갈래 도장이 모두 나올 수 있다', () => {
    const s = child();
    const rng = rngOf({ seed: 88, cursor: 0 });
    const opened = new Set(Array.from({ length: 400 }, () => pickTurning(s, rng)?.id));
    expect([...opened].filter((id) => id?.startsWith('pp_dojo_')).sort()).toEqual([
      'pp_dojo_fist', 'pp_dojo_gun', 'pp_dojo_sword',
    ]);
    expect(opened).not.toContain('pp_dojo');
    expect(opened).not.toContain('pp_fist_dojo');
  });
});
