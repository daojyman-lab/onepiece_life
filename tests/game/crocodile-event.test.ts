import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { rating5 } from '../../src/core/power';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import type { ResolvedDoor } from '../../src/core/types';

const dismissed = TURNING_BY_ID.crocodile_port_dismissed;
const dealB = TURNING_BY_ID.crocodile_port_b;
const dealA = TURNING_BY_ID.crocodile_port_a;
const encounters = [dismissed, dealB, dealA];

function eligibleLife(rating = 500) {
  const life = newLife5(13);
  life.pending = null;
  life.age = 21;
  life.hero.sea = 'nw_first';
  life.hero.standing = 'pirate';
  life.hero.fame = 100;
  life.hero.base = { str: rating, spd: 0, vit: 0, int: 0, wil: 0, luk: 0 };
  life.growth.tier = { fist: 0, sword: 0, polearm: 0, blunt: 0, gun: 0, observation: 0, armament: 0, conqueror: 0, fruit: 0 };
  life.hero.fruit = null;
  life.flags.push('ship');
  expect(rating5(life)).toBe(rating);
  return life;
}

function available(rating: number) {
  const life = eligibleLife(rating);
  return encounters.filter((event) => event && checkAll(life, event.when)).map((event) => event.id);
}

describe('크로커다일의 봉쇄된 항구 거래', () => {
  it('화면의 전투 등급 경계에 따라 거절, B급 거래, A급 거래 중 하나만 나온다', () => {
    expect(available(499)).toEqual(['crocodile_port_dismissed']);
    expect(available(500)).toEqual(['crocodile_port_b']);
    expect(available(769)).toEqual(['crocodile_port_b']);
    expect(available(770)).toEqual(['crocodile_port_a']);
    expect(available(1500)).toEqual(['crocodile_port_a']);
    expect(dismissed.body).toContain('꺼져라, 떨거지');
    expect(dealB.body).toContain('내 아래');
    expect(dealA.body).toContain('맞붙으면 나도 번거로워');
    expect(dealA.body).not.toContain('나와 비슷');
  });

  it('전쟁 뒤 신세계에서 이름난 선원이 배를 가지고 있을 때만 열린다', () => {
    const life = eligibleLife(500);
    expect(checkAll(life, dealB.when)).toBe(true);
    expect(openTurning(life, dealB)).toBe(true);

    const beforeWar = eligibleLife(500); beforeWar.age = 20;
    expect(checkAll(beforeWar, dealB.when)).toBe(false);
    const otherSea = eligibleLife(500); otherSea.hero.sea = 'gl_first';
    expect(checkAll(otherSea, dealB.when)).toBe(false);
    const unknown = eligibleLife(500); unknown.hero.fame = 99;
    expect(checkAll(unknown, dealB.when)).toBe(false);
    const marine = eligibleLife(500); marine.hero.standing = 'marine';
    expect(checkAll(marine, dealB.when)).toBe(false);
    const noShip = eligibleLife(500); noShip.flags = noShip.flags.filter((flag) => flag !== 'ship');
    expect(openTurning(noShip, dealB)).toBe(false);
  });

  it('B 미만은 무시당하고 거래가 닫히며 관계도 생기지 않는다', () => {
    const life = eligibleLife(499);
    expect(openTurning(life, dismissed)).toBe(true);
    expect(life.pending?.kind === 'door' && life.pending.doors).toHaveLength(1);
    answerDoor(life, 0);
    expect(life.flags).toContain('crocodilePortMet');
    expect(life.people.some((person) => person.canon === 'crocodile')).toBe(false);
    expect(encounters.every((event) => !checkAll(life, event.when))).toBe(true);
  });

  it.each([
    [dealB, 0, 'ally'], [dealB, 1, null], [dealB, 2, 'rival'],
    [dealA, 0, 'ally'], [dealA, 1, null], [dealA, 2, 'rival'],
  ] as const)('거래 선택 뒤에는 계약에 맞는 관계만 남고 선원은 늘지 않는다', (event, choice, relation) => {
    const life = eligibleLife(event === dealB ? 500 : 770);
    expect(openTurning(life, event)).toBe(true);
    answerDoor(life, choice);

    const crocodile = life.people.filter((person) => person.canon === 'crocodile');
    expect(crocodile).toHaveLength(relation ? 1 : 0);
    if (relation) expect(crocodile[0].kind).toBe(relation);
    expect(crocodile.every((person) => person.crew === undefined && person.tempUntil === undefined)).toBe(true);
    expect(life.flags).toContain('crocodilePortMet');
    expect(life.pending).toBeNull();
  });

  it('옛 저장의 이미 열린 질문은 옛 선택 결과로 마무리한다', () => {
    const old = newLife5(13);
    const door = (label: string): ResolvedDoor => ({ label, hint: '', locked: null, special: false, tried: false, danger: false });
    old.pending = {
      kind: 'door', turning: 'tmp_crocodile', moment: false,
      title: '「모래의 사내」 크로커다일', body: '한 손이 갈고리인 사내가 시가를 물고 뱃전에 내려선다.', speaker: '크로커다일',
      doors: [door('갈 길이 갈릴 때까지 한 뱃길을 간다'), door('길은 따로 가되 소식은 주고받기로 한다'), door('무엇을 쫓는 사람인지만 캐묻고 헤어진다')],
    };
    const life = normalizeLife5(JSON.parse(JSON.stringify(old)))!;
    const before = life.hero.base.int;
    answerDoor(life, 2);
    expect(life.hero.base.int).toBe(before + 1);
    expect(life.people.some((person) => person.canon === 'crocodile')).toBe(false);
    expect(life.pending).toBeNull();
  });

  it('옛 크로커다일 만남을 이미 본 인생에는 새 거래가 다시 뜨지 않는다', () => {
    const life = eligibleLife(770);
    life.seenCount.tmp_crocodile = 1;
    expect(encounters.every((event) => !checkAll(life, event.when))).toBe(true);
  });

  it('크로커다일을 뺀 뒤에도 뒤 인물들의 공통 선택 계산은 유지된다', () => {
    const law = TURNING_BY_ID.tmp_law;
    const smoker = TURNING_BY_ID.tmp_smoker;
    expect(law.doors[0].values?.ambition).toBeGreaterThan(0);
    expect(law.doors[2].label).toBe('얽히면 일이 커진다며 물러선다');
    expect(smoker.doors[2].label).toBe('무엇을 쫓는 사람인지만 캐묻고 헤어진다');
  });
});
