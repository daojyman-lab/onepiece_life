import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { answerDoor, openTurning } from '../../src/core/turning';
import { checkAll } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { buildEnding } from '../../src/core/ending';
import { emptyMeta5 } from '../../src/core/meta';
import { profileView } from '../../src/ui/view/profile';
import { fmtMoney } from '../../src/shared/core/util';
import { TURNING_BY_ID } from '../../src/data/turnings';

function pirate(fame = 100, seed = 1) {
  const s = newLife5(seed); s.pending = null; s.siblingBirths = [];
  s.age = 30; s.hero.standing = 'pirate'; s.standingSince = 16;
  s.hero.fame = fame;
  return s;
}
const poster = (amount: number) => `현상금 ${fmtMoney(amount)} 베리`;

describe('현상금과 이름값의 균형', () => {
  it.each([[0, 5_000_000], [2, 25_000_000], [4, 75_000_000], [6, 100_000_000]])(
    '같은 이름값도 성장 %i단계의 위협에 맞게 현상금을 산정한다', (tier, amount) => {
      const s = pirate(); s.growth.tier.fist = tier;
      expect(profileView(s).fame).toBe(poster(amount));
      expect(s.hero.fame).toBe(100);
    });
  it('소문과 반복 사건만 쌓은 초보는 수억 현상금이나 칠무해·해적왕 조건에 닿지 않는다', () => {
    const s = pirate(5000);
    expect(profileView(s).fame).toBe(poster(5_000_000));
    expect(checkAll(s, TURNING_BY_ID.path_warlord.when)).toBe(false);
    expect(checkAll(s, TURNING_BY_ID.path_apex_pirate.when)).toBe(false);
    s.growth.tier.fist = 6;
    expect(checkAll(s, TURNING_BY_ID.path_apex_pirate.when)).toBe(true);
  });
  it('정부와 시비가 붙은 것과 실제 금서 해독·세력 장악을 구분한다', () => {
    const s = pirate(); s.flags.push('govEnemy');
    expect(profileView(s).fame).toBe(poster(5_000_000));
    s.flags.push('readForbidden');
    expect(profileView(s).fame).toBe(poster(100_000_000));
  });
  it('명성·해군 공적은 보존하고 옛 저장과 부상에서도 같은 현상금을 표시한다', () => {
    const s = pirate(); s.growth.tier.fist = 2;
    const before = profileView(s).fame;
    s.hero.injuries.push({ severity: 'heavy', monthsLeft: 18 }); s.hero.limbs.armL = 'lost';
    expect(profileView(s).fame).toBe(before);
    expect(profileView(normalizeLife5(JSON.parse(JSON.stringify(s)))!).fame).toBe(before);
    s.hero.standing = 'marine';
    expect(profileView(s).fame).toBe(`이름값 ${fmtMoney(100)}`);
  });
  it('엔딩 신문도 프로필과 같은 현상금을 쓴다', () => {
    const s = pirate();
    expect(buildEnding(s, emptyMeta5()).remembered).toContain(fmtMoney(5_000_000));
    expect(buildEnding(s, emptyMeta5()).remembered).not.toContain(fmtMoney(100_000_000));
  });
  it('해군의 엔딩 공적은 현상금 감산을 받지 않는다', () => {
    const s = pirate(); s.hero.standing = 'marine';
    expect(buildEnding(s, emptyMeta5()).remembered).toContain(fmtMoney(100_000_000));
  });
  it('옛 폭동 탈옥 저장은 이미 보도된 성공으로 복원하고 반복 보상을 주지 않는다', () => {
    const s = pirate(60);
    s.timeline.push({ age: 28, text: '죄수들을 이끌고 탈옥했다' });
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    applyFx(loaded, [{ op: 'escapeNotoriety', riot: true }]);
    expect(loaded.hero.fame).toBe(60);
    expect(profileView(loaded).fame).toBe(poster(5_000_000));
    expect(normalizeLife5(JSON.parse(JSON.stringify(loaded)))!.flags).toEqual(loaded.flags);
  });
  it('실패한 탈옥에는 악명 보상이나 성공 표시가 붙지 않는다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = pirate(0, seed);
      s.hero.standing = 'prisoner';
      openTurning(s, TURNING_BY_ID.prison_escape); answerDoor(s, 0);
      if (s.hero.standing !== 'prisoner') continue;
      expect(s.hero.fame).toBe(0);
      expect(s.flags.some((f) => f.startsWith('bounty:'))).toBe(false);
      return;
    }
    throw new Error('실패한 탈옥을 재현하지 못했다');
  });
  it('체포와 정상 출소는 이름값을 더하지 않는다', () => {
    const s = pirate(0);
    applyFx(s, TURNING_BY_ID.mis_arrest.fx!);
    expect(s.hero.fame).toBe(0);
    expect(openTurning(s, TURNING_BY_ID.prison_release)).toBe(true);
    answerDoor(s, 0);
    expect(s.hero.fame).toBe(0);
  });
  it('폭동 탈옥을 세 번 반복해도 첫 악명만 남는다', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = pirate(0, seed); s.values.dominion = 100;
      let completed = true;
      for (let i = 0; i < 3; i++) {
        applyFx(s, TURNING_BY_ID.mis_arrest.fx!);
        expect(openTurning(s, TURNING_BY_ID.prison_escape)).toBe(true);
        answerDoor(s, 1);
        if (s.hero.standing === 'prisoner') { completed = false; break; }
        expect(s.hero.fame).toBe(6);
        s.age += 2;
      }
      if (!completed) continue;
      expect(profileView(s).fame).toBe(poster(600_000));
      return;
    }
    throw new Error('세 번의 성공한 탈옥을 재현하지 못했다');
  });
  it('조용한 탈옥 후 폭동을 일으켜도 악명은 폭동 수준까지만 오른다', () => {
    let succeeded = false;
    for (let seed = 1; seed <= 50; seed++) {
      const s = newLife5(seed); s.pending = null; s.age = 30; s.hero.fame = 0; s.values.dominion = 100;
      applyFx(s, [{ op: 'standing', to: 'prisoner' }]);
      openTurning(s, TURNING_BY_ID.prison_escape); answerDoor(s, 0);
      if (s.hero.standing === 'prisoner') continue;
      expect(s.hero.fame).toBe(2);
      s.age += 2; applyFx(s, [{ op: 'standing', to: 'prisoner' }]);
      openTurning(s, TURNING_BY_ID.prison_escape); answerDoor(s, 1);
      expect(s.hero.fame).toBe(6);
      succeeded = true; break;
    }
    expect(succeeded).toBe(true);
  });
});
