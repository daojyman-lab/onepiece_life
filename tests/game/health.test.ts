import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { recoverHealthPart } from '../../src/core/health';
import { partRisks } from '../../src/core/risk';
import { normalizeLife5 } from '../../src/core/load';
import { profileView } from '../../src/ui/view/profile';

function patient(skill?: number) {
  const s = newLife5(610);
  s.pending = null;
  s.age = 25;
  s.hero.standing = 'settled';
  s.hero.hp = 30;
  s.hero.money = 0;
  s.hero.injuries = [{ severity: 'heavy', part: 'armL', kind: 'cut', monthsLeft: 18 }];
  if (skill !== undefined) applyFx(s, [{ op: 'person', kind: 'crew', role: 'medic', relation: '선의', medicalSkill: skill }]);
  return s;
}

describe('치료와 휴식의 연결', () => {
  it('의료 솜씨가 높은 선의는 체력과 상처를 더 빨리 회복시키고 치료를 기록한다', () => {
    const alone = patient();
    const treated = patient(100);
    recoverHealthPart(alone, 'usual');
    recoverHealthPart(treated, 'usual');
    expect(treated.hero.hp).toBeGreaterThan(alone.hero.hp);
    expect(treated.hero.injuries[0].monthsLeft).toBeLessThan(alone.hero.injuries[0].monthsLeft);
    expect(treated.hero.injuries[0].treated).toBe(true);
    expect(treated.log.some((line) => line.text.includes('치료'))).toBe(true);
  });

  it.each(['dead', 'injured', 'separated'] as const)('%s 상태인 선의는 동행 치료를 하지 않는다', (status) => {
    const alone = patient();
    const unavailable = patient(100);
    const medic = unavailable.people.find((p) => p.crew?.role === 'medic')!;
    if (status === 'dead') medic.alive = false;
    if (status === 'injured') medic.crew!.injuredMonths = 6;
    if (status === 'separated') medic.crew!.separatedMonths = 6;
    recoverHealthPart(alone, 'usual');
    recoverHealthPart(unavailable, 'usual');
    expect(unavailable.hero.hp).toBe(alone.hero.hp);
    expect(unavailable.hero.injuries).toEqual(alone.hero.injuries);
  });

  it('자동 휴식과 직접 휴식 모두 상처 회복을 돕고 흉터는 남긴다', () => {
    const usual = patient();
    const auto = patient();
    const chosen = patient();
    for (const s of [usual, auto, chosen]) s.hero.injuries.push({ severity: 'scar', part: 'torso', kind: 'cut', monthsLeft: 0 });
    recoverHealthPart(usual, 'usual');
    recoverHealthPart(auto, 'rest');
    recoverHealthPart(chosen, 'chosenRest');
    expect(auto.hero.hp).toBeGreaterThan(usual.hero.hp);
    expect(chosen.hero.hp).toBeGreaterThan(auto.hero.hp);
    expect(auto.hero.injuries[0].monthsLeft).toBeLessThan(usual.hero.injuries[0].monthsLeft);
    for (let i = 0; i < 6; i++) recoverHealthPart(chosen, 'chosenRest');
    expect(chosen.hero.injuries).toEqual([{ severity: 'scar', part: 'torso', kind: 'cut', monthsLeft: 0 }]);
    expect(chosen.hero.hp).toBeLessThanOrEqual(100);
  });

  it('옛 저장의 부위 없는 상처·cough·의료 수치 없는 선의도 표시하고 치료한다', () => {
    const old = patient(100);
    old.hero.injuries = [{ severity: 'heavy', monthsLeft: 18 }];
    old.hero.illness = { id: 'cough', stage: 1, months: 0 };
    delete old.people.find((p) => p.crew?.role === 'medic')!.crew!.medicalSkill;
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(old)));
    expect(loaded).not.toBeNull();
    const s = loaded!;
    expect(profileView(s).hurts).toContain('폐렴');
    partRisks(s, () => 0);
    recoverHealthPart(s, 'usual');
    expect(s.hero.illness).toBeNull();
    expect(s.hero.injuries[0].treated).toBe(true);
    expect(s.hero.hp).toBeGreaterThan(30);
    expect(s.log.some((line) => /치료.*폐렴/.test(line.text))).toBe(true);
  });
});
