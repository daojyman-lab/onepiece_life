import { describe, expect, it } from 'vitest';
import { effectiveStats5 } from '../../src/core/body';
import { applyEnvironmentPart, localFightChance } from '../../src/core/environment';
import { heroUnit5 } from '../../src/core/fight';
import { applyFx } from '../../src/core/fx';
import { recoverHealthPart } from '../../src/core/health';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openQueued, openTurning } from '../../src/core/turning';
import { buildVoyage, sailTo, voyageId } from '../../src/core/voyage';
import { growPart, stepPart, voyage } from '../../src/core/year';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { checkAll } from '../../src/core/cond';
import { COATING_CONTACT, ZOU_CARD, entryPass } from '../../src/data/voyage';
import { V } from '../../src/data/balance';
import { rngOf } from '../../src/shared/core/rng';
import { doorView } from '../../src/ui/view/windows';

function traveler() {
  const s = newLife5(14, { home: 'loguetown' });
  s.pending = null;
  s.age = 24;
  Object.assign(s.hero, { island: '자야', sea: 'gl_first', standing: 'pirate', money: 80000, hp: 60 });
  return s;
}

describe('특수 섬 항해', () => {
  it('하이 웨스트를 고르기 전까지 도착과 항로 보상을 보류하고 저장 후에도 한 번만 처리한다', () => {
    const s = traveler();
    const route = buildVoyage(voyageId(s, { calm: '워터 세븐', dream: '스카이피아' }))!;
    expect(openTurning(s, route)).toBe(true);
    if (s.pending?.kind !== 'door') throw new Error('항로 창이 열리지 않았다');
    expect(doorView(s, s.pending).doors[1].hint).toContain('진입 관문');
    answerDoor(s, 1);
    expect(s.hero.island).toBe('자야');
    expect(s.flags).not.toContain('at:스카이피아');
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    if (loaded.pending?.kind !== 'door') throw new Error('진입 관문을 불러오지 못했다');
    expect(doorView(loaded, loaded.pending).doors[1].hint).toContain('삼만 베리');
    answerDoor(loaded, 1);
    expect(loaded.hero.island).toBe('스카이피아');
    expect(loaded.hero.money).toBeLessThan(s.hero.money);
    expect(loaded.hero.base.wil).toBe(s.hero.base.wil + 1);
    const money = loaded.hero.money;
    answerDoor(loaded, 1);
    expect(loaded.hero.money).toBe(money);
  });

  it('하늘섬 첫 토막의 신체 보정이 자동 진행 뒤 풀린다', () => {
    const s = traveler();
    s.hero.base.str = 20;
    sailTo(s, '스카이피아', 'calm');
    answerDoor(s, 1);
    const base = s.hero.base.str;
    expect(effectiveStats5(s).str).toBeCloseTo(base * 0.95);
    stepPart(s, 'rest');
    expect(effectiveStats5(s).str).toBe(s.hero.base.str);
  });

  it('지역 원주민의 귀향은 관문과 고산병을 면제한다', () => {
    const s = traveler();
    s.hero.home = 'sky';
    sailTo(s, '스카이피아', 'wild');
    expect(s.pending).toBeNull();
    expect(s.hero.island).toBe('스카이피아');
    expect(s.hero.hp).toBe(60);
    expect(effectiveStats5(s).str).toBe(s.hero.base.str);
  });

  it('해역을 넘는 이야기 이동도 관문에서 멈춘다', () => {
    const s = traveler();
    applyFx(s, [{ op: 'move', island: '와노쿠니', sea: 'nw_late' }]);
    expect(s.hero.sea).toBe('gl_first');
    expect(s.pending?.kind).toBe('door');
    answerDoor(s, 1);
    expect(s.hero.sea).toBe('nw_late');
    expect(s.hero.island).toBe('와노쿠니');
  });

  it('와노의 도검 수련과 스카이피아의 견문색 공부에 지역 보너스가 붙는다', () => {
    const inland = traveler();
    const regional = traveler();
    inland.growth.pref.sword = regional.growth.pref.sword = 10;
    regional.hero.island = '와노쿠니';
    growPart(inland, 'train', () => 0.9);
    growPart(regional, 'train', () => 0.9);
    expect(regional.growth.mastery.sword).toBeGreaterThan(inland.growth.mastery.sword);
    regional.hero.island = '스카이피아';
    growPart(inland, 'study', () => 0.9);
    growPart(regional, 'study', () => 0.9);
    expect(regional.growth.mastery.observation).toBeGreaterThan(inland.growth.mastery.observation);
  });

  it('와노 장편 초입에서 고향 출신자의 현지 인연이 열린다', () => {
    const s = traveler();
    s.hero.home = 'wano';
    s.age = 23;
    applyFx(s, [{ op: 'move', island: '와노쿠니', sea: 'nw_late' }]);
    expect(openTurning(s, TURNING_BY_ID.ep_wano_after_1)).toBe(true);
    expect(s.flags.some((flag) => /^ep_wano_after_.*_trust$/.test(flag))).toBe(true);
  });

  it('연말 자동 이동에서도 어인섬에 닿기 전에 관문을 먼저 연다', () => {
    const s = traveler();
    s.hero.sea = 'sabaody';
    s.hero.island = '샤본디 제도';
    s.sail = true;
    s.rng = rngFor(0.4);
    voyage(s);
    expect(s.hero.island).toBe('샤본디 제도');
    expect(s.pending).toMatchObject({ kind: 'door', title: '샤본디에서 심해로' });
  });

  it('연말에 다른 창이 열려 있으면 해군 전근 목적지의 관문을 저장해 다음에 연다', () => {
    const s = traveler();
    Object.assign(s.hero, { sea: 'sabaody', island: '샤본디 제도', standing: 'marine' });
    expect(openTurning(s, TURNING_BY_ID.path_sea_newworld)).toBe(true);
    s.sail = true;
    s.rng = rngFor(0.4);
    voyage(s);
    expect(s.pending).toMatchObject({ turning: 'path_sea_newworld' });
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    answerDoor(loaded, 1);
    expect(openQueued(loaded)).toBe(true);
    expect(loaded.pending).toMatchObject({ title: '샤본디에서 심해로' });
    answerDoor(loaded, 0);
    expect(loaded.hero.island).toBe('어인섬');
    expect(loaded.log.some((line) => line.text.includes('전근 명령'))).toBe(true);
  });

  it('코팅 장인 인연으로 비용을 면제받고 심해에 닿는다', () => {
    const s = traveler();
    s.hero.money = 0;
    s.flags.push(COATING_CONTACT);
    applyFx(s, [{ op: 'move', island: '어인섬', sea: 'sabaody' }]);
    expect(s.pending).toMatchObject({ doors: [{ locked: expect.any(String) }, { locked: null }, { locked: null }] });
    answerDoor(s, 0);
    expect(s.hero.island).toBe('자야');
    answerDoor(s, 1);
    expect(s.hero).toMatchObject({ island: '어인섬', money: 0, hp: 60 });
  });

  it('하치와 맺은 인연으로 코팅 문이 열린다', () => {
    const s = traveler();
    applyFx(s, [{ op: 'person', canon: 'hatchan', kind: 'ally', relation: '타코야키 주인' }]);
    applyFx(s, [{ op: 'move', island: '어인섬', sea: 'sabaody' }]);
    expect(s.pending?.kind === 'door' && s.pending.doors[1].locked).toBeNull();
  });

  it('와노 폭포에서 흩어진 동료는 한 토막 안에 재합류한다', () => {
    const s = traveler();
    s.hero.base.int = 0;
    s.rng = rngFor(0.1);
    applyFx(s, [{ op: 'person', name: '가람', gender: 'f', kind: 'crew', relation: '갑판의 선의', role: 'medic' }]);
    const medic = s.people.at(-1)!.crew!;
    applyFx(s, [{ op: 'move', island: '와노쿠니', sea: 'nw_late' }]);
    answerDoor(s, 0);
    expect(s.hero.island).toBe('와노쿠니');
    expect(medic.separatedMonths).toBe(3);
    expect(s.hero.hp).toBe(35);
    expect(localFightChance(s)).toBe(V.fight.minorP * 2);
    expect(checkAll(s, TURNING_BY_ID.pirate_marine_hunt.when)).toBe(false);
    recoverHealthPart(s, 'usual');
    expect(medic.separatedMonths).toBeUndefined();
  });

  it('조우를 찾지 못하면 출발지에 남고 비브르 카드가 있으면 도착한다', () => {
    const s = traveler();
    s.rng = rngFor(0.9);
    applyFx(s, [{ op: 'move', island: '조', sea: 'nw_first' }]);
    answerDoor(s, 1);
    expect(s.hero.island).toBe('자야');
    expect(s.flags).not.toContain('at:조');
    s.flags.push(ZOU_CARD);
    applyFx(s, [{ op: 'move', island: '조', sea: 'nw_first' }]);
    answerDoor(s, 0);
    expect(s.hero.island).toBe('조');
    const inland = traveler();
    s.growth.pref.fist = inland.growth.pref.fist = 10;
    growPart(s, 'train', () => 0.9);
    growPart(inland, 'train', () => 0.9);
    expect(s.growth.mastery.fist).toBeGreaterThan(inland.growth.mastery.fist);
  });

  it('장편의 증표 보상을 받은 방문객에게 재방문 관문과 지역 불이익을 면제한다', () => {
    const s = traveler();
    const episode = TURNING_BY_ID.ep_wano_after_dep;
    applyFx(s, [{ op: 'move', island: '와노쿠니', sea: 'nw_late' }]);
    answerDoor(s, 1);
    expect(s.flags).not.toContain(entryPass('wano'));
    s.flags.push('ep_wano_after_kisuke_trust');
    expect(openTurning(s, episode)).toBe(true);
    answerDoor(s, 0);
    expect(s.flags).toContain(entryPass('wano'));
    applyFx(s, [{ op: 'move', island: '엘바프', sea: 'nw_late' }]);
    sailTo(s, '와노쿠니', 'wild');
    expect(s.pending).toBeNull();
    expect(s.hero.island).toBe('와노쿠니');
    expect(localFightChance(s)).toBe(V.fight.minorP);
  });

  it('장편 후반에서 불러온 옛 저장도 증표를 받을 수 있다', () => {
    const s = traveler();
    Object.assign(s.hero, { sea: 'nw_late', island: '와노쿠니' });
    s.flags.push('ep_wano_after_kisuke_trust');
    expect(openTurning(s, TURNING_BY_ID.ep_wano_after_dep)).toBe(true);
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    answerDoor(loaded, 0);
    expect(loaded.flags).toContain(entryPass('wano'));
  });

  it('옛 저장에서 이미 보상을 골랐다면 증표를 복원한다', () => {
    const s = traveler();
    s.tried.push('ep_wano_after_dep#0', 'ep_skypiea_b9#2');
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(loaded.flags).toContain(entryPass('wano'));
    expect(loaded.flags).not.toContain(entryPass('sky'));
  });

  it('기후 적응과 해저 수압이 활동과 전투 조건에 맞게 작용한다', () => {
    const s = traveler();
    s.hero.island = '드럼 왕국';
    s.values.dominion = V.value.max;
    const initialVit = s.hero.base.vit;
    const initialTrial = s.hardship;
    applyEnvironmentPart(s, 'work', null);
    expect(s.hero.hp).toBe(55);
    expect(s.hero.base.vit).toBe(initialVit + 1);
    expect(s.hardship).toBe(initialTrial + 2);
    s.hero.island = '어인섬';
    const initialStr = s.hero.base.str;
    applyEnvironmentPart(s, 'train', 'sword');
    expect(s.hero.base.str).toBe(initialStr + 1);
    s.hero.fruit = { id: 'nika', eatenAt: s.age };
    applyEnvironmentPart(s, 'roam', null);
    expect(s.hero.hp).toBe(50);
    expect(heroUnit5(s, true).st.str).toBeCloseTo(heroUnit5(s).st.str * 0.85);
  });

  it('항구에서 산 무기의 값과 전투 효과가 함께 반영된다', () => {
    const s = traveler();
    s.hero.island = '워터 세븐';
    expect(openTurning(s, TURNING_BY_ID.port_weapon_water7)).toBe(true);
    answerDoor(s, 0);
    expect(s.hero.money).toBe(52000);
    expect(heroUnit5(s).weapon).toMatchObject({ branch: 'martial.sword', mult: 1.15 });
  });
});

function rngFor(target: number) {
  for (let seed = 0; seed < 1000; seed++) {
    if (Math.abs(rngOf({ seed, cursor: 0 })() - target) < 0.02) return { seed, cursor: 0 };
  }
  throw new Error('테스트 범위에 맞는 씨앗이 없다');
}
