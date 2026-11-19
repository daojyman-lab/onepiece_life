import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { askFight, ackBattle, heroUnit5 } from '../../src/core/fight';
import { startBattle, runBattle } from '../../src/shared/core/combat/engine';
import { battleLine, battleLineDelay, battleReplayDelay, hpAt } from '../../src/ui/view/battle';
import { battleNarrative, battleOpening, battleRecap } from '../../src/shared/core/combat/narrative';
import type { BattleEvent, CUnit } from '../../src/shared/core/types';
import type { Pending5 } from '../../src/core/types';

function unit(name: string, side: 'L' | 'R'): CUnit {
  const u = heroUnit5(newLife5(91));
  return { ...u, name, key: name, side, hero: side === 'L', leader: true, hp: 100, maxHp: 100, maxSp: 200, sp: 200,
    st: { str: 25, spd: 25, vit: 25, int: 25, wil: 25, luk: 0 }, def: 5,
    armament: 0, observation: 0, fruitClass: null, weapon: null, consumables: [], mods: {},
    pBuff: 0, pGuard: 0, pDodge: 0, skills: [{ id: 'style:spear:1', mastery: 70, cd: 0 }], retreatAt: 0 };
}
function battle(events: BattleEvent[]) {
  const b = startBattle([unit('루카', 'L'), unit('산적', 'R')], { 0: 1 }, 46, false);
  b.events = events;
  return b;
}
const strike = (overrides: Partial<Extract<BattleEvent, { k: 'act' }>> = {}): BattleEvent =>
  ({ k: 'act', d: 0, who: 0, target: 1, skill: 'style:spear:1', name: '중단 찌르기', dmg: 30, crit: false, dodge: false, ...overrides });

describe('실제 공방을 읽는 전투 서사', () => {
  it('긴 본문은 읽을 시간을 주며 재생 속도와 시작 체력을 그대로 반영한다', () => {
    const text = '공격의 궤도를 비켜선 루카가 창의 거리를 다시 잡았다. '.repeat(4);
    expect(battleLineDelay(text, 1)).toBeGreaterThan(battleLineDelay('첫 공방.', 1));
    expect(battleLineDelay(text, 2)).toBe(battleLineDelay(text, 1) / 2);
    const a = unit('루카', 'L'); a.hp = 60;
    const b = startBattle([a, unit('산적', 'R')], { 0: 1 }, 3, false);
    expect(hpAt(b, 0)).toEqual([60, 100]);
  });

  it('긴 공격 뒤에 짧은 합 구분이 와도 현재 보이는 공격의 읽기 시간을 보장한다', () => {
    const b = battle([strike({ crit: true, dmg: 80 }), { k: 'round', n: 2 }]);
    const rows = battleNarrative(b);
    expect(battleReplayDelay(b, rows, 1, 1)).toBe(battleLineDelay(rows[0].text, 1));
    expect(battleReplayDelay(b, rows, 2, 1)).toBe(battleLineDelay(rows[1].text, 1) * 0.6);
  });

  it('시작 체력이 없는 옛 기록의 회복량과 위기 시점을 추측해 단정하지 않는다', () => {
    const b = battle([{ k: 'heal', d: -1, who: 0, target: 0, amount: 25, name: '재생' }, strike({ dmg: 80 })]);
    delete b.initialHp;
    const rows = battleNarrative(b);
    expect(rows[0].detail).toContain('25');
    expect(rows[0].detail).not.toContain('실제');
    expect(rows[1].text).not.toContain('남은 힘이 크게 줄었다');
  });
  it('기존 battleLine 진입점도 창 공격을 기술 나열 대신 공방 문장으로 반환한다', () => {
    const e = strike(), b = battle([e]);
    expect(battleLine(b, e)).not.toContain('▶');
    expect(battleLine(b, e)).toContain('창');
    expect(battleLine(b, e)).toContain('산적');
    expect(battleNarrative(b)[0].detail).toContain('피해 30');
    expect(battleNarrative(b)[0].detail).toContain('중단 찌르기');
  });

  it('회피와 면역을 타격이나 부상으로 쓰지 않고 실제 수치를 보존한다', () => {
    const b = battle([strike({ dodge: true, dmg: 0 }), strike({ dmg: 0, note: '전혀 통하지 않는다' })]);
    const lines = battleNarrative(b);
    expect(lines[0].text).toMatch(/피했|비켜|벗어|스쳤/);
    expect(lines[0].text).not.toMatch(/맞았|명중|상처|쓰러/);
    expect(lines[1].text).toMatch(/통하지|닿지|막혔/);
    expect(lines[1].detail).toContain('피해 0');
  });

  it('뒤에 패기·위기·승패를 붙여도 앞선 문장에 미래 정보가 새지 않는다', () => {
    const b = battle([{ k: 'round', n: 1 }, strike()]);
    const before = battleNarrative(b);
    b.events.push({ k: 'guard', d: 0, who: 1, name: '무장색 경화' }, { k: 'deathmatch', who: 0 }, { k: 'end', result: 'lose' });
    b.units[1].armament = 3;
    expect(battleNarrative(b).slice(0, 2)).toEqual(before);
    expect(before.map((x) => x.text).join('')).not.toMatch(/패기|무장색|패배|목숨/);
  });

  it('이미 다른 회피 효과로 상한에 닿은 공격을 견문색 덕분이라고 꾸미지 않는다', () => {
    const a = unit('루카', 'L'), t = unit('산적', 'R');
    t.pDodge = 1; t.observation = 3;
    const b = runBattle(startBattle([a, t], { 0: 1 }, 46, false), true);
    const dodges = b.events.filter((e) => e.k === 'act' && e.target === 1 && e.dodge);
    expect(dodges.length).toBeGreaterThan(0);
    for (const e of dodges) {
      if (e.k !== 'act') continue;
      expect(e.facts?.observation).toBe(false);
      expect(battleLine(b, e)).not.toContain('견문색');
    }
  });

  it('치료·협공·속박·후퇴는 해당 기록에서만 묘사하고 판정승을 사망으로 꾸미지 않는다', () => {
    const b = battle([strike({ who: 1, target: 0, dmg: 20 }), { k: 'heal', d: -1, who: 0, target: 0, amount: 50, name: '응급 치료' },
      strike({ name: '협공', skill: 'basic' }), strike({ skill: 'bound', name: '묶여서 움직이지 못한다', dmg: 0 }),
      { k: 'retreat', who: 0, ok: false, roll: 81, need: 35 }, { k: 'end', result: 'win' }]);
    const rows = battleNarrative(b);
    expect(rows[1].text).toMatch(/치료|회복/);
    expect(rows[1].detail).toContain('20'); // 실제 회복은 상한까지 20
    expect(rows[2].text).toMatch(/협공|공격에 가세/);
    expect(rows[3].text).toMatch(/묶|속박/);
    expect(rows[4].text).toMatch(/실패|막혔|붙잡/);
    expect(rows[4].detail).toContain('81'); expect(rows[4].detail).toContain('35');
    expect(rows[5].text).not.toMatch(/죽|숨이 끊|쓰러뜨|쓰러졌/);
  });

  it('옛 저장은 없는 능력을 추가하지 않고 변환은 판정·RNG를 변경하지 않는다', () => {
    const b = battle([strike(), { k: 'end', result: 'win' }]);
    delete b.initialHp;
    const before = JSON.stringify(b);
    const text = [battleOpening(b), ...battleNarrative(b).map((x) => x.text), battleRecap(b)].join(' ');
    expect(text).not.toMatch(/패기|열매|동료|보급|부상|사망/);
    expect(text).not.toMatch(/undefined|을\(를\)|이\(가\)/);
    expect(JSON.stringify(b)).toBe(before);
    expect(battleNarrative(JSON.parse(before))).toEqual(battleNarrative(b));
  });

  it('첫 공격보다 먼저 회복한 전투의 회고도 실제 사건 순서를 지킨다', () => {
    const b = battle([{ k: 'heal', d: -1, who: 0, target: 0, amount: 20, name: '재생' }, strike(), { k: 'end', result: 'win' }]);
    b.initialHp = [60, 100];
    expect(battleRecap(b).startsWith(battleNarrative(b)[0].text)).toBe(true);
  });

  it('실제 엔진의 각 사건이 보존되고 전투를 넘겨도 생애 기록에 공방이 남는다', () => {
    const b = runBattle(startBattle([unit('루카', 'L'), unit('산적', 'R')], { 0: 1 }, 46, false), true);
    expect(battleNarrative(b)).toHaveLength(b.events.length);
    expect(b.events.some((e) => e.k === 'act' && !!e.facts)).toBe(true);
    const s = newLife5(18); s.age = 22; s.pending = null as Pending5;
    askFight(s, 'b_alvida', false, true);
    if (s.pending?.kind !== 'battle') throw new Error('전투가 시작되지 않았다');
    const recap = battleRecap(s.pending.battle);
    ackBattle(s);
    expect(s.log.some((l) => l.type === 'battle' && l.text.includes(recap))).toBe(true);
  });
});
