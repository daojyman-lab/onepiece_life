import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { applyFx, fillText } from '../../src/core/fx';
import { needsOk } from '../../src/core/needs';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openTurning, resolveDoors } from '../../src/core/turning';
import type { Life5 } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';

function eligible(s: Life5, id: string): boolean {
  const t = TURNING_BY_ID[id];
  return checkAll(s, t.when) && needsOk(s, t.needs);
}

function choose(s: Life5, id: string, index: number): void {
  const t = TURNING_BY_ID[id];
  expect(eligible(s, id), id).toBe(true);
  expect(openTurning(s, t), id).toBe(true);
  expect(s.pending?.kind === 'door' && s.pending.doors[index].locked, id).toBeFalsy();
  answerDoor(s, index);
}

describe('섬에서 겪은 일이 뒤에 남는 선택', () => {
  it.each([0, 1, 2])('사막행 상선에 탄 뒤 동무를 배웅하는 문 %i가 그 사람을 기록한다', (door) => {
    const s = newLife5(17, { home: 'loguetown' });
    s.age = 20; s.hero.standing = 'civil'; s.hero.sea = 'east';
    choose(s, 'sea_merchant_hire', 0);
    const mate = s.people.find(p => p.relation === '사막행 상선의 동무')!;
    expect(s.log.some(l => l.text.includes(mate.name))).toBe(true);
    expect(eligible(s, 'sea_ashes_home')).toBe(false);
    s.age += 2;
    expect(eligible(s, 'sea_ashes_home')).toBe(true);
    mate.alive = false;
    expect(eligible(s, 'sea_ashes_home')).toBe(false);
    mate.alive = true;
    expect(fillText(s, TURNING_BY_ID.sea_ashes_home.body)).toContain(mate.name);
    choose(s, 'sea_ashes_home', door);
    expect(mate.alive).toBe(false);
  });

  it.each([0, 1, 2])('와노의 옛 노래는 노인의 노래를 들은 선택 %i를 구분한다', (door) => {
    const s = newLife5(15, { home: 'wano' });
    s.age = 10;
    choose(s, 'wanok_forbidden_name', door);
    s.age = 60; s.hero.standing = 'retired';
    s.flags.push('wano_heard_oden');
    expect(eligible(s, 'wanoa_old_song')).toBe(door !== 1);
    expect(eligible(s, 'wanoa_last_blade')).toBe(false);
  });

  it.each([0, 1, 2])('어릴 때 집안의 칼을 맡은 사람만 그 칼을 물려준다 (%i)', (door) => {
    const s = newLife5(15, { home: 'wano', lineage: 'samurai' });
    s.age = 10;
    choose(s, 'wanok_samurai_blade', door);
    s.age = 60; s.hero.standing = 'retired';
    expect(eligible(s, 'wanoa_last_blade')).toBe(door === 0);
    expect(resolveDoors(s, TURNING_BY_ID.wanoa_last_blade)[0].locked).toBeTruthy();
  });

  it('잃은 부모를 기다렸다는 대답과 그 뒤 재회는 같은 사람에게 이어진다', () => {
    const s = newLife5(7, { lineage: 'commoner', wealth: 'poor' });
    s.age = 8;
    choose(s, 'par_lost', 2);
    const absent = s.people.find(p => p.missing)!;
    s.age = 30; s.hero.standing = 'pirate';
    choose(s, 'par_reunion', 0);
    const echo = TURNING_BY_ID.par_reunion_echo;
    expect(eligible(s, echo.id)).toBe(true);
    expect(fillText(s, echo.body)).toContain(absent.name);
    expect(resolveDoors(s, echo)[0].locked).toBeTruthy();
    absent.alive = false;
    expect(s.people.some(p => p.alive && p.relation === '어머니')).toBe(true);
    expect(eligible(s, echo.id)).toBe(false);
  });

  it('은퇴한 목수는 예전에 들인 바로 그 견습에게 마지막 배를 맡긴다', () => {
    const s = newLife5(77, { home: 'water7' });
    s.age = 22; s.hero.standing = 'civil'; s.standingSince = 18;
    choose(s, 'w7_galley_hire', 0);
    s.age = 45;
    choose(s, 'w7a_apprentice', 0);
    const p = s.people.find(p => p.relation === '뒷골목에서 들인 견습')!;
    expect(p.age).toBe(13);
    expect(resolveDoors(s, TURNING_BY_ID.w7a_last_ship)[2].locked).toBeTruthy();
    s.age = 65; s.hero.standing = 'retired';
    const event = TURNING_BY_ID.w7a_last_ship;
    p.alive = false;
    expect(resolveDoors(s, event)[2].locked).toBeTruthy();
    p.alive = true;
    choose(s, event.id, 2);
    expect(p.relation).toBe('마지막 배를 지은 견습');
    expect(p.aliases).toContain('뒷골목에서 들인 견습');
    expect(s.timeline.some(l => l.text.includes(p.name))).toBe(true);
  });

  it('어린 코비를 만나고 살아 있는 같은 인물과 대령이 되어 다시 만난다', () => {
    const s = newLife5(17, { home: 'loguetown' });
    s.age = 21; s.hero.standing = 'marine'; s.hero.sea = 'gl_first';
    expect(eligible(s, 'cn_coby_colonel')).toBe(false);
    s.age = 16; s.hero.sea = 'east';
    choose(s, 'cn_coby_alvida', 2);
    const coby = s.people.find(p => p.canon === 'coby')!;
    s.age = 21; s.hero.sea = 'gl_first';
    coby.alive = false;
    expect(eligible(s, 'cn_coby_colonel')).toBe(false);
    coby.alive = true;
    choose(s, 'cn_coby_colonel', 0);
    expect(s.people.filter(p => p.canon === 'coby').map(p => p.id)).toEqual([coby.id]);
  });

  it('배신은 배에 남은 사람에게만 일어나며 그 사람의 이름과 신분이 이어진다', () => {
    const s = newLife5(23); s.age = 25;
    expect(eligible(s, 'mis_betrayal')).toBe(false);
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '항구의 요리사' }]);
    const p = s.people.at(-1)!;
    p.crew!.separatedMonths = 2;
    expect(eligible(s, 'mis_betrayal')).toBe(false);
    delete p.crew!.separatedMonths;
    expect(eligible(s, 'mis_betrayal')).toBe(true);
    expect(fillText(s, TURNING_BY_ID.mis_betrayal.body)).toContain(p.name);
    applyFx(s, TURNING_BY_ID.mis_betrayal.fx!);
    expect(p.kind).toBe('rival');
    expect(p.crew).toBeUndefined();
    expect(p.aliases).toContain('항구의 요리사');
    expect(p.relation).toBe('배신한 옛 동료');
    expect(fillText(s, TURNING_BY_ID.moment_betrayed.body)).toContain(p.name);
  });
});
