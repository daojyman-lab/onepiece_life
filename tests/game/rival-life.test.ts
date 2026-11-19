import { stepPastPublicScenes } from './step-past-public-scenes';
import { describe, expect, it } from 'vitest';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { apply5 } from '../../src/core/reduce';
import { rivalPerson, rivalPosition, updateRival } from '../../src/core/rival';
import { newLife5 } from '../../src/core/state';
import type { HomeId, Life5 } from '../../src/core/types';
import { portOf, seaOfPort } from '../../src/data/navigation';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { EXTRA_CAREERS } from '../../src/data/rival-careers';
import { workLetterId } from '../../src/data/rival-letters';

type Career = NonNullable<Life5['rival']>['career'];

/** 옛 저장에 들어 있는 것은 유년기 선택이 만든 실제 인물과 표시뿐이다. */
function childhoodRival(seed: number, home: HomeId = 'loguetown') {
  const s = newLife5(seed, { home, lineage: 'commoner' });
  s.pending = null;
  s.age = 6;
  applyFx(s, [
    { op: 'person', kind: 'rival', relation: '어릴 적 맞수', name: '솔' },
    { op: 'flag', id: 'kidRival' },
  ]);
  return s;
}

function careersAtSixteen(home: HomeId) {
  const found = new Map<Career, Life5>();
  for (let seed = 1; seed <= 450; seed++) {
    const s = childhoodRival(seed, home);
    s.age = 16;
    updateRival(s);
    if (!s.rival) throw new Error('열여섯 살에 맞수의 진로가 없다');
    found.set(s.rival.career, s);
  }
  return found;
}

function reportAt(s: Life5, age: number) {
  const from = s.log.length;
  s.age = age;
  updateRival(s);
  return s.log.slice(from).map(line => line.text).join(' ');
}

describe('어릴 적 맞수의 행적', () => {
  it('인물 없는 표시는 새 사람을 만들지 않고, 실제 맞수도 열다섯까지는 소식을 내지 않는다', () => {
    const s = childhoodRival(9);
    expect(reportAt(s, 15)).toBe('');
    expect(s.rival).toBeUndefined();
    s.people = s.people.filter(p => p.relation !== '어릴 적 맞수');
    const ids = s.people.map(p => p.id);
    expect(reportAt(s, 24)).toBe('');
    expect(s.rival).toBeUndefined();
    expect(s.people.map(p => p.id)).toEqual(ids);
  });

  it('옛 저장을 불러와 한 해를 넘기면 같은 인물로 자라며, 다시 불러도 기사와 인물이 늘지 않는다', () => {
    const s = childhoodRival(13);
    s.age = 15;
    s.part = 3;
    const child = s.people.find(p => p.relation === '어릴 적 맞수')!;
    child.age = 15;
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    stepPastPublicScenes(loaded);
    expect(loaded.age).toBe(16);
    if (!loaded.rival) {
      if (loaded.pending?.kind === 'door') apply5(loaded, { type: 'answer', index: loaded.pending.doors.findIndex(d => !d.locked) });
      stepPastPublicScenes(loaded);
    }
    expect(rivalPerson(loaded)).toMatchObject({ id: child.id, name: child.name, age: 16 });
    expect(loaded.rival?.personId).toBe(child.id);
    expect(loaded.log.some(line => line.age === 16 && line.text.includes(child.name))).toBe(true);
    const restored = normalizeLife5(JSON.parse(JSON.stringify(loaded)))!;
    const before = [...restored.log];
    const timeline = [...restored.timeline];
    updateRival(restored);
    expect(restored.log).toEqual(before);
    expect(restored.timeline).toEqual(timeline);
    expect(restored.rival).toEqual(loaded.rival);
    expect(restored.people.map(p => p.id)).toEqual(loaded.people.map(p => p.id));
    expect(restored.people.filter(p => p.id === child.id)).toHaveLength(1);
  });

  it.each(['loguetown', 'water7'] as const)('%s에서는 서로 다른 인생에서 선장·5번대원·해군의 길이 열린다', home => {
    const cases = careersAtSixteen(home);
    expect([...cases.keys()]).toEqual(expect.arrayContaining(['captain', 'fifth', 'marine']));
    expect(cases.size).toBeGreaterThanOrEqual(10);
    const captain = cases.get('captain')!;
    const initial = { ...captain.rival! };
    expect(initial.crewName.trim()).not.toBe('');
    expect(initial.port.trim()).not.toBe('');
    reportAt(captain, 35);
    expect(captain.rival).toMatchObject({ personId: initial.personId, crewName: initial.crewName });
    expect(captain.rival!.fame).toBeGreaterThan(initial.fame);
    expect(captain.rival!.stage).toBeGreaterThan(initial.stage);
    expect(rivalPerson(captain)?.name).toBe('솔');
  });

  it('독립 선장은 해적단에 따라 다른 일로 이름을 알린다', () => {
    const reports = new Map<string, string>();
    for (let seed = 1; seed < 200 && reports.size < 4; seed++) {
      const s = childhoodRival(seed);
      reportAt(s, 16);
      if (s.rival?.career === 'captain') reports.set(s.rival.crewName, reportAt(s, 19));
    }
    expect(reports.get('쪽빛제비 해적단')).toContain('우편선');
    expect(reports.get('세매듭 해적단')).toContain('금고');
    expect(reports.get('노란등 해적단')).toContain('옛 주민');
    expect(reports.get('톱니조개 해적단')).toContain('비단');
  });

  it.each(['wano', 'zou', 'sky', 'fishman'] as const)('%s 안에서도 서로 다른 일을 하며 섬 안에서 소식을 보낸다', home => {
    const cases = careersAtSixteen(home);
    expect(cases.has('warden')).toBe(true);
    expect(cases.size).toBeGreaterThanOrEqual(5);
    for (const [career, s] of cases) {
      for (const age of [17, 19, 24, 35]) {
        reportAt(s, age);
        expect(s.rival?.career).toBe(career);
        expect(portOf(s.rival!.port)).toBe(portOf(s.hero.town));
      }
    }
  });

  it('추가 진로마다 배정 지역에서 살아 보고, 나이에 맞는 기사와 실제 행선지를 확인한다', () => {
    const found = new Set<Career>();
    for (const home of ['loguetown', 'water7', 'wano', 'fishman', 'sky', 'zou'] as const) {
      const cases = careersAtSixteen(home);
      for (const [id, def] of Object.entries(EXTRA_CAREERS)) {
        const eligible = (def.homes as readonly HomeId[]).includes(home);
        expect(cases.has(id as Career), home + '/' + id).toBe(eligible);
      }
      for (const [id, s] of cases) {
        if (!(id in EXTRA_CAREERS)) continue;
        found.add(id);
        for (const age of [17, 19, 24, 35, 50]) {
          const report = reportAt(s, age);
          expect(report).toContain('솔');
          expect(report).not.toMatch(/undefined|\{rival\}/);
          expect(seaOfPort(s.rival!.port)).toBeDefined();
          expect(rivalPosition(s)).toBeTruthy();
        }
      }
    }
    expect(found.size).toEqual(Object.keys(EXTRA_CAREERS).length);
  });

  it('비스타 휘하의 맞수는 전쟁 전의 대원과 전쟁 뒤의 구호 활동으로 구분된다', () => {
    const s = careersAtSixteen('water7').get('fifth')!;
    const early = s.log.filter(line => line.age === 16).map(line => line.text).join(' ');
    expect(early).toContain('비스타');
    expect(early + rivalPosition(s)).toMatch(/5번대|오번대/);
    expect(rivalPosition(s)).not.toMatch(/대장|지휘관/);
    const wartime = reportAt(s, 17);
    expect(wartime).toMatch(/끊|단절|행방|소식이 없/);
    expect(s.rival!.port).toBe('');
    expect(reportAt(s, 18)).toBe('');
    const after = reportAt(s, 19);
    expect(rivalPosition(s)).toMatch(/전\s|옛|출신/);
    expect(after + rivalPosition(s)).toMatch(/구호|구조|구하|돕|피난|구휼/);
    const oldSave = childhoodRival(s.rng.seed, 'water7');
    const belated = reportAt(oldSave, 24);
    expect(oldSave.rival?.career).toBe('fifth');
    expect(rivalPosition(oldSave)).toMatch(/전\s|옛|출신/);
    expect(belated).not.toMatch(/5번대에 (?:대원으로 )?(?:들어갔|합류했|입단했)/);
    for (const age of [25, 40]) {
      reportAt(s, age);
      expect(rivalPosition(s)).not.toMatch(/대장|지휘관/);
    }
  });

  it.each([
    ['shipwright', 'water7', '구조정', '워터 세븐'],
    ['surgeon', 'loguetown', '보조기', '워터 세븐'],
    ['dyer', 'wano', '작업복', '와노쿠니'],
  ] as const)('%s는 플레이어가 실제 편지에 보낸 답을 새 소식과 직책에 반영한다', (career, home, title, port) => {
    const s = careersAtSixteen(home).get(career)!;
    reportAt(s, 19);
    expect(s.queue).toContain(workLetterId(career));
    stepPastPublicScenes(s);
    expect(s.pending).toMatchObject({ turning: workLetterId(career) });
    const other = structuredClone(s);
    apply5(s, { type: 'answer', index: 1 });
    apply5(other, { type: 'answer', index: 0 });
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(reportAt(loaded, 24)).not.toBe(reportAt(other, 24));
    expect(rivalPosition(loaded)).toContain(title);
    expect(loaded.rival!.port).toBe(port);
    expect(loaded.rival!.personId).toBe(other.rival!.personId);
    expect(reportAt(loaded, 35)).not.toBe(reportAt(other, 35));
  });

  it('전에 결정된 직업은 새 진로를 추가한 뒤 불러와도 바뀌지 않는다', () => {
    const s = childhoodRival(5);
    const p = rivalPerson(s)!;
    s.rival = { personId: p.id, career: 'marine', crewName: '', stage: 1, fame: 35, port: '셸스 타운' };
    s.age = 18;
    const old = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    reportAt(old, 24);
    expect(old.rival).toMatchObject({ career: 'marine', personId: p.id, port: '샤본디 제도' });
    expect(rivalPosition(old)).toBe('해군 구조정 정장');
  });

  it('외과의로 자란 맞수가 영입되면 같은 사람이 선의가 된다', () => {
    const s = careersAtSixteen('water7').get('surgeon')!;
    reportAt(s, 50);
    s.hero.standing = 'pirate';
    const id = s.rival!.personId;
    applyFx(s, [{ op: 'recruitRival' }]);
    expect(s.people.find(p => p.id === id)).toMatchObject({ crew: { role: 'medic' } });
  });

  it('맞수의 항구에서만 재회하고 합류를 선택하면 기존 인물이 동료가 된다', () => {
    const s = careersAtSixteen('loguetown').get('captain')!;
    reportAt(s, 35);
    s.hero.standing = 'pirate';
    s.flags.push('ship');
    const person = rivalPerson(s)!;
    const port = s.rival!.port;
    const reunion = TURNING_BY_ID.life_rival_reunion;
    const elsewhere = structuredClone(s);
    elsewhere.hero.island = portOf(port) === '로그타운' ? '워터 세븐' : '로그타운';
    elsewhere.hero.sea = seaOfPort(elsewhere.hero.island)!;
    stepPastPublicScenes(elsewhere);
    expect(elsewhere.pending?.kind === 'door' && elsewhere.pending.turning === reunion.id).toBe(false);
    s.hero.island = port;
    s.hero.sea = seaOfPort(port)!;
    stepPastPublicScenes(s);
    expect(s.pending).toMatchObject({ kind: 'door', turning: reunion.id, speaker: person.name });
    const join = reunion.doors.findIndex(d => d.fx.some(f => f.op === 'recruitRival'));
    expect(join).toBeGreaterThanOrEqual(0);
    apply5(s, { type: 'answer', index: join });
    expect(s.people.filter(p => p.id === person.id)).toHaveLength(1);
    expect(s.people.filter(p => p.name === person.name && p.crew).map(p => p.id)).toEqual([person.id]);
    expect(reportAt(s, 50)).toBe('');
  });

  it('옛 방식으로 맞수를 영입한 저장을 불러와도 예전 인물의 소식이 따로 생기지 않는다', () => {
    const s = childhoodRival(7);
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '함께하게 된 어릴 적 맞수' }]);
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(reportAt(loaded, 25)).toBe('');
    const original = s.people.find(p => p.relation === '어릴 적 맞수')!;
    const joined = s.people.find(p => p.relation === '함께하게 된 어릴 적 맞수')!;
    expect(loaded.people).toHaveLength(s.people.length - 1);
    expect(loaded.people.find(p => p.id === original.id)).toMatchObject({ name: original.name, kind: 'crew', crew: joined.crew });
    expect(normalizeLife5(JSON.parse(JSON.stringify(loaded)))?.people).toEqual(loaded.people);
  });

  it('맞수가 세상을 떠난 뒤에는 외부 소식이 오지 않는다', () => {
    const s = childhoodRival(31);
    reportAt(s, 16);
    const person = rivalPerson(s)!;
    applyFx(s, [{ op: 'losePerson', relation: person.relation }]);
    expect(person.alive).toBe(false);
    expect(reportAt(s, 35)).toBe('');
  });
});
