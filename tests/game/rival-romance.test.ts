import { stepPastPublicScenes } from './step-past-public-scenes';
import { describe, expect, it } from 'vitest';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { needOk } from '../../src/core/needs';
import { apply5 } from '../../src/core/reduce';
import { advanceRivalAffection, single } from '../../src/core/rival-romance';
import { newLife5 } from '../../src/core/state';
import { openTurning } from '../../src/core/turning';
import type { Life5 } from '../../src/core/types';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { peopleView } from '../../src/ui/view/faces';

const reunion = TURNING_BY_ID.life_rival_reunion;
const obsolete = ['life_rival_invitation', 'life_rival_date', 'life_rival_promise'];
const reload = (s: Life5) => normalizeLife5(JSON.parse(JSON.stringify(s)))!;

function childhood() {
  const s = newLife5(42, { home: 'loguetown', gender: 'm', lineage: 'commoner' });
  s.pending = null;
  s.age = 6;
  openTurning(s, TURNING_BY_ID.kid_rival);
  apply5(s, { type: 'answer', index: 1 });
  const p = s.people.find(p => p.relation === '어릴 적 맞수')!;
  Object.assign(p, { gender: 'f', name: '단비' });
  return { s, p };
}

function shareChildhood(s: Life5) {
  for (let age = 6; age < 16; age++) {
    s.age = age;
    advanceRivalAffection(s);
  }
  s.flags.push('homeCrisis:rival', 'homeCrisis:copy');
}

function backAtPort(s: Life5, age = 21) {
  const p = s.people.find(p => p.name === '단비')!;
  s.age = p.age = age;
  Object.assign(s.hero, { island: '로그타운', sea: 'east', standing: 'pirate' });
  s.rival = { personId: p.id, career: 'captain', crewName: '파도 해적단', fame: 48, stage: 2, port: '로그타운' };
  s.flags.push('rival:free');
}

describe('함께한 일로 자라는 맞수와의 관계', () => {
  it('재회에는 대련·이야기·영입만 있고 연애 여부를 묻는 사건이 없다', () => {
    expect(reunion.doors).toHaveLength(3);
    expect(obsolete.every(id => !TURNING_BY_ID[id])).toBe(true);
    const { s } = childhood();
    backAtPort(s);
    stepPastPublicScenes(s);
    expect(s.pending).toMatchObject({ turning: reunion.id });
    const before = structuredClone(s.pending);
    apply5(s, { type: 'answer', index: 3 });
    expect(s.pending).toEqual(before);
    expect(s.rivalLove).toBeUndefined();
  });

  it('어릴 적 함께한 일과 답장·재회가 관계를 키우고, 같은 해에 머물거나 불러오면 거듭 오르지 않는다', () => {
    const { s, p } = childhood();
    const brief = structuredClone(s);
    shareChildhood(s);
    const points = s.rivalAffinity!.timePoints;
    for (let i = 0; i < 12; i++) advanceRivalAffection(s);
    expect(s.rivalAffinity!.timePoints).toBe(points);
    expect(s.rivalLove).toBeUndefined();
    for (const life of [s, brief]) {
      backAtPort(life);
      stepPastPublicScenes(life);
      apply5(life, { type: 'answer', index: 1 });
      stepPastPublicScenes(life);
    }
    expect(s.rivalLove).toMatchObject({ personId: p.id, status: 'dating' });
    expect(brief.rivalLove).toBeUndefined();
    const again = reload(s);
    const count = again.timeline.length;
    for (let i = 0; i < 20; i++) advanceRivalAffection(again);
    expect(again.rivalAffinity).toEqual(s.rivalAffinity);
    expect(again.timeline.length).toBe(count);
    expect(peopleView(s).find(person => person.id === p.id)?.relation).toContain('연인');
    expect(JSON.stringify(peopleView(s))).not.toMatch(/호감도|timePoints|lastSharedAge/);
  });

  it('멀리 떨어져 있는 동안 결혼하지 않고, 동료가 된 뒤에는 같은 인물로 교제와 혼인까지 이어진다', () => {
    const { s, p } = childhood();
    s.hero.gender = 'f';
    p.gender = 'm';
    shareChildhood(s);
    backAtPort(s);
    openTurning(s, reunion);
    apply5(s, { type: 'answer', index: 1 });
    advanceRivalAffection(s);
    expect(s.rivalLove?.status).toBe('dating');
    s.hero.island = '셸스 타운';
    const away = s.rivalAffinity!.timePoints;
    for (let age = 22; age <= 30; age++) { s.age = p.age = age; advanceRivalAffection(s); }
    expect(s.rivalLove?.status).toBe('dating');
    expect(s.rivalAffinity!.timePoints).toBe(away);
    s.hero.island = '로그타운';
    applyFx(s, [{ op: 'recruitRival' }]);
    const beforeCrew = structuredClone(p.crew);
    for (let age = 30; age <= 39; age++) { s.age = p.age = age; advanceRivalAffection(s); }
    expect(s.rivalLove).toMatchObject({ personId: p.id, status: 'married' });
    expect(needOk(s, 'spouse')).toBe(true);
    expect(s.timeline.filter(t => t.text.includes('혼인했다'))).toHaveLength(1);
    expect(s.people.filter(person => person.id === p.id)).toHaveLength(1);
    expect(p.crew).toEqual(beforeCrew);
    expect(p.relation).toBe('배우자');
    expect(s.timeline.some(t => t.text.includes('만두') && !t.text.includes('{'))).toBe(true);
    const veteran = reload(s);
    for (let age = 40; age < 55; age++) {
      veteran.age = age;
      advanceRivalAffection(veteran);
    }
    expect(veteran.timeline.filter(t => t.text.includes('오래된 편지 묶음'))).toHaveLength(1);
    const bereaved = reload(s);
    applyFx(bereaved, [{ op: 'losePerson', who: 'spouse' }]);
    expect(single(bereaved)).toBe(true);
    applyFx(s, [{ op: 'separateSpouse' }]);
    expect(s.rivalLove?.status).toBe('friends');
    advanceRivalAffection(s);
    expect(needOk(s, 'spouse')).toBe(false);
  });

  it('같은 맞수도 십대의 심부름삯을 나눈 인생과 가로챈 인생에서 다른 시기에 연인이 된다', () => {
    const { s } = childhood();
    s.age = 10;
    stepPastPublicScenes(s);
    expect(s.pending).toMatchObject({ turning: 'bond_rival_errand' });
    const selfish = reload(s);
    apply5(s, { type: 'answer', index: 0 });
    apply5(selfish, { type: 'answer', index: 2 });
    for (const life of [s, selfish]) {
      backAtPort(life);
      openTurning(life, reunion);
      apply5(life, { type: 'answer', index: 1 });
    }
    const ledger = reload(selfish);
    for (let age = 21; age <= 50 && !s.rivalLove; age++) {
      s.age = selfish.age = age;
      advanceRivalAffection(s);
      advanceRivalAffection(selfish);
    }
    expect(s.rivalLove?.status).toBe('dating');
    expect(selfish.rivalLove).toBeUndefined();
    ledger.age = 24;
    stepPastPublicScenes(ledger);
    expect(ledger.pending).toMatchObject({ turning: 'bond_rival_ledger' });
  });

  it('쉬기로 한 철에도 맞수의 소식과 함께 지낸 해가 쌓이고 재회 창이 휴식을 가로막지 않는다', () => {
    const { s, p } = childhood();
    backAtPort(s, 35);
    s.rival!.stage = 3;
    s.hero.island = '워터 세븐';
    s.hero.sea = 'gl_first';
    s.tried.push('life_rival_reunion#1');
    const before = s.stats.fights;
    apply5(s, { type: 'rest' });
    expect(s.rival).toMatchObject({ personId: p.id, stage: 4, port: '워터 세븐' });
    expect(s.rivalAffinity).toMatchObject({ personId: p.id, timePoints: 3, lastSharedAge: 35 });
    expect(s.log.some(l => l.text.includes('한 철 동안 위험한 일을 멈추고'))).toBe(true);
    expect(s.pending?.kind === 'door' && s.pending.turning === reunion.id).toBe(false);
    expect(s.stats.fights).toBe(before);
    expect(s.part).toBe(1);
  });

  it('항해 중에는 떠나온 항구에 있는 맞수를 만나지 않고, 떨어진 동료도 함께한 시간을 쌓지 않는다', () => {
    const { s, p } = childhood();
    shareChildhood(s);
    backAtPort(s);
    openTurning(s, reunion);
    apply5(s, { type: 'answer', index: 1 });
    const before = s.rivalAffinity!.timePoints;
    s.passage = { from: '로그타운', to: '시럽 마을', route: 'calm', partsLeft: 2, partsSpent: 0, maxParts: 2 };
    advanceRivalAffection(s);
    expect(s.rivalAffinity!.timePoints).toBe(before);
    expect(s.rivalLove).toBeUndefined();
    s.passage = null;
    applyFx(s, [{ op: 'recruitRival' }]);
    p.crew!.separatedMonths = 3;
    advanceRivalAffection(s);
    expect(s.rivalAffinity!.timePoints).toBe(before);
    expect(s.rivalLove).toBeUndefined();
    p.crew!.separatedMonths = 0;
    advanceRivalAffection(s);
    expect(s.rivalLove?.status).toBe('dating');
  });

  it.each(['same', 'heroYoung', 'rivalYoung', 'dead', 'missing', 'prisoner', 'sweetheart', 'waitingLove', 'married', 'spouse'])('%s인 때는 누적 점수가 높아도 관계가 시작되지 않는다', condition => {
    const { s, p } = childhood();
    shareChildhood(s);
    backAtPort(s);
    s.tried.push('life_rival_reunion#1');
    if (condition === 'same') s.hero.gender = p.gender;
    if (condition === 'heroYoung') s.age = 17;
    if (condition === 'rivalYoung') p.age = 17;
    if (condition === 'dead') p.alive = false;
    if (condition === 'missing') p.missing = true;
    if (condition === 'prisoner') s.hero.standing = 'prisoner';
    if (['sweetheart', 'waitingLove', 'married'].includes(condition)) s.flags.push(condition);
    if (condition === 'spouse') applyFx(s, [{ op: 'person', kind: 'family', relation: '배우자' }]);
    advanceRivalAffection(s);
    expect(s.rivalLove).toBeUndefined();
  });

  it.each(obsolete)('옛 저장에서 열려 있던 %s 질문을 건너뛰고 이미 정한 관계는 보존한다', id => {
    const { s, p } = childhood();
    backAtPort(s);
    openTurning(s, reunion);
    if (s.pending?.kind !== 'door') throw new Error('재회');
    s.pending.turning = id;
    s.queue.push(id);
    s.rivalLove = { personId: p.id, status: 'partners', since: 20 };
    const loaded = reload(s);
    expect(loaded.pending).toBeNull();
    expect(loaded.queue).not.toContain(id);
    loaded.age = 40;
    advanceRivalAffection(loaded);
    expect(loaded.rivalLove).toEqual(s.rivalLove);
  });

  it('옛 재회 창에는 기존 세 행동만 같은 순서로 남는다', () => {
    const { s } = childhood();
    backAtPort(s);
    openTurning(s, reunion);
    if (s.pending?.kind !== 'door') throw new Error('재회');
    const three = structuredClone(s.pending.doors);
    s.pending.doors.push({ ...three[0], label: '고백한다' });
    const loaded = reload(s);
    expect(loaded.pending).toMatchObject({ turning: reunion.id, doors: three });
  });
});
