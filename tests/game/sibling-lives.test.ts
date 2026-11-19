import { describe, expect, it } from 'vitest';
import { apply5, reduce5 } from '../../src/core/reduce';
import { peopleView } from '../../src/ui/view/faces';
import { normalizeLife5 } from '../../src/core/load';
import { personIs } from '../../src/core/needs';
import { newLife5 } from '../../src/core/state';
import { SEA_BY_ID } from '../../src/shared/data/seas';
import { findSiblingReunion, siblingYear } from '../../src/core/siblings';
import { answerDoor, openTurning } from '../../src/core/turning';
import { SIBLING_REUNION } from '../../src/data/turnings/sibling-reunion';
import type { Life5 } from '../../src/core/types';

const siblings = (s: Life5) => s.people.filter((p) => personIs(p, 'sibling'));

function grownFamily(seed: number): Life5 {
  const s = newLife5(seed, { home: 'loguetown', lineage: 'commoner', wealth: 'poor' });
  delete s.siblingBirths;
  s.age = 22;
  s.hero.standing = 'civil';
  for (const p of s.people) p.age += 19;
  return s;
}

function passYear(s: Life5): void {
  s.pending = null;
  s.queue = [];
  s.stopsThisYear = 100;
  s.part = 3;
  apply5(s, { type: 'rest' });
}

function saved(s: Life5): Life5 {
  const life = normalizeLife5(JSON.parse(JSON.stringify(s)));
  expect(life).not.toBeNull();
  return life!;
}

describe('형제의 생애', () => {
  it('같은 재회 선택창은 세 번까지만 열고 이후에도 형제의 소식은 이어진다', () => {
    const s = grownFamily(1100); passYear(s); s.pending = null;
    const p = siblings(s).find((person) => person.siblingLife)!;
    expect(p).toBeDefined();
    s.hero.island = p.siblingLife!.island;
    if (s.hero.island === s.hero.town) { s.hero.island = '워터 세븐'; p.siblingLife!.island = s.hero.island; }
    for (let i = 0; i < 3; i++) {
      s.siblingMeeting = p.id;
      expect(openTurning(s, SIBLING_REUNION)).toBe(true);
      answerDoor(s, 2);
      s.age += 4;
    }
    s.siblingMeeting = p.id;
    expect(openTurning(s, SIBLING_REUNION)).toBe(false);
    expect(findSiblingReunion(s)).toBeUndefined();
    p.siblingLife!.nextNewsAt = s.age;
    const logSize = s.log.length;
    siblingYear(s);
    expect(s.log.slice(logSize).some((line) => line.text.includes(p.name) && line.text.includes('소식'))).toBe(true);
  });
  it('성인이 된 각 형제가 자기 진로를 갖고 여러 해에 걸쳐 이름과 근황을 전한다', () => {
    const s = Array.from({ length: 80 }, (_, i) => grownFamily(1100 + i)).find((x) => siblings(x).length >= 2)!;
    const people = siblings(s);
    passYear(s);
    for (const p of people) {
      expect(p.siblingLife?.career).toBeDefined();
      expect(s.log.some((l) => l.age === 23 && l.text.includes(p.name))).toBe(true);
    }
    const careers = people.map((p) => p.siblingLife?.career);
    const resumed = saved(s);
    for (let i = 0; i < 6; i++) passYear(resumed);
    expect(siblings(resumed).map((p) => p.siblingLife?.career)).toEqual(careers);
    for (const p of siblings(resumed)) {
      expect(resumed.log.some((l) => l.age > 23 && l.text.includes(p.name) && l.text.includes('소식'))).toBe(true);
    }
  });

  it('실제 같은 섬에 온 형제만 재회하고 비블카드와 임시 동행을 저장한다', () => {
    let meeting: { life: Life5; personId: string } | undefined;
    for (let seed = 1100; seed < 1160 && !meeting; seed++) {
      const life = grownFamily(seed);
      passYear(life);
      const sibling = siblings(life).find((p) => p.siblingLife && p.siblingLife.island !== life.hero.town);
      if (!sibling?.siblingLife) continue;
      const { island } = sibling.siblingLife;
      for (const other of siblings(life)) if (other !== sibling) other.alive = false;
      life.hero.island = island;
      life.hero.sea = Object.values(SEA_BY_ID).find((sea) => sea.ports.includes(island))?.id ?? life.hero.sea;
      life.pending = null;
      life.queue = [];
      life.stopsThisYear = 100;
      const arrived = reduce5(life, { type: 'step' });
      if (arrived.pending?.kind === 'door' && arrived.pending.doors.some((d) => !d.locked && d.label.includes('동행한다'))) meeting = { life: arrived, personId: sibling.id };
    }
    expect(meeting).toBeDefined();
    const s = saved(meeting!.life);
    const p = s.people.find((x) => x.id === meeting!.personId)!;
    if (s.pending?.kind !== 'door') throw new Error('재회 선택창이 저장되지 않았다');
    expect(s.pending.speaker).toBe(p.name);
    expect(s.pending.body).toContain(s.hero.island);
    const wrongIsland = saved(s);
    wrongIsland.hero.island = wrongIsland.hero.town;
    expect(saved(wrongIsland).pending).toBeNull();
    const cardOnly = saved(s);
    apply5(cardOnly, { type: 'answer', index: s.pending.doors.findIndex((d) => d.label.includes('비블카드를 나누고 헤어진다')) });
    expect(cardOnly.people.find((x) => x.id === p.id)).toMatchObject({ kind: 'family', siblingLife: { vivreCard: true } });
    expect(cardOnly.people.find((x) => x.id === p.id)?.crew).toBeUndefined();
    expect(peopleView(cardOnly).find((x) => x.id === p.id)?.card).toContain(s.hero.island);

    apply5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => d.label.includes('동행한다')) });
    expect(p).toMatchObject({ kind: 'crew', tempUntil: s.age + 1, siblingLife: { vivreCard: true } });
    expect(personIs(p, 'sibling')).toBe(true);
    expect(s.people.filter((x) => x.id === p.id)).toHaveLength(1);
    const resumed = saved(s);
    passYear(resumed);
    expect(resumed.people.find((x) => x.id === p.id)).toMatchObject({ kind: 'family', siblingLife: { vivreCard: true } });
    expect(resumed.people.find((x) => x.id === p.id)?.crew).toBeUndefined();
    expect(resumed.log.some((l) => l.text.includes(p.name) && l.text.includes('동행을 마쳤다'))).toBe(true);
  });
});
