import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { apply5 } from '../../src/core/reduce';
import { normalizeLife5 } from '../../src/core/load';
import { openTurning } from '../../src/core/turning';
import { buildVoyage, voyageChoices, voyageId } from '../../src/core/voyage';
import type { Life5 } from '../../src/core/types';
import { KUMA_FOE, kumaSighting } from '../../src/data/kuma';
import { seaOfPort, portOf } from '../../src/data/navigation';
import { TRAINING_LINES } from '../../src/data/training-routes';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { passagePart } from '../../src/core/passage';

function traveler(port = '샤본디 제도', age = 19) {
  const s = newLife5(27, { home: 'loguetown', gender: 'm' });
  s.age = age; s.pending = null; s.queue = []; s.dream = null; s.growth.path = null;
  Object.assign(s.hero, { island: port, sea: seaOfPort(port), standing: 'pirate' });
  return s;
}
function nextDoor(s: Life5) {
  apply5(s, { type: 'step' });
  if (s.pending?.kind !== 'door') throw Error('기다리던 선택 창이 열리지 않았다');
  return s.pending;
}
function start(s: Life5) {
  expect(nextDoor(s).turning).toMatch(/^kuma_(grove|bark)$/);
  apply5(s, { type: 'answer', index: 0 });
  expect(s.pending).toMatchObject({ kind: 'battle', foe: { id: KUMA_FOE } });
}
function finishPassage(s: Life5) {
  for (let i = 0; s.passage && i < 20; i++) {
    passagePart(s, () => 0);
    if (s.pending?.kind === 'door' && s.pending.turning.startsWith('islet_')) apply5(s, { type: 'answer', index: 2 });
  }
  expect(s.passage).toBeFalsy();
}
const profiles: [string, string, (s: Life5) => void][] = [
  ['루스카이나', '아마존 릴리', s => { s.growth.path = 'armament'; }],
  ['쿠라이가나', '롱 링 롱 랜드', s => { s.growth.path = 'sword'; }],
  ['보인 열도', '알라바스타 왕국', s => { s.growth.path = 'gun'; }],
  ['웨더리아', '자야', s => { s.flags.push('chartSkill'); }],
  ['카마바카 왕국', '샤본디 제도', s => { s.growth.path = 'fist'; }],
  ['토리노 왕국', '드럼 왕국', s => { s.flags.push('medicApprentice'); }],
  ['벌지모아', '워터 세븐', s => { s.hero.standing = 'shipwright'; }],
];
const reload = (s: Life5) => normalizeLife5(JSON.parse(JSON.stringify(s)))!;
describe('쿠마에게 패배한 뒤의 수련', () => {
  it.each(profiles)('%s에서 두 실습과 네 결말을 거쳐 %s 쪽 항로로 복귀한다', (island, port, setup) => {
    for (const branch of [0, 1]) for (const ending of [0, 1]) {
      let s = traveler();
      setup(s);
      start(s);
      expect(s.pending).toMatchObject({ kind: 'battle', result: 'lose' });
      expect(s.hero.island).toBe('샤본디 제도');
      s = reload(s);
      apply5(s, { type: 'answer', index: 0 });
      expect(s.hero).toMatchObject({ island, sea: seaOfPort(island), alive: true });
      expect(s.passage).toBeFalsy();
      const course = TRAINING_LINES.find(l => l.island === island)!.course;
      expect(nextDoor(s).turning).toBe('field_' + course);
      apply5(s, { type: 'answer', index: branch });
      s = reload(s);
      const follow = nextDoor(s);
      expect(follow.turning).toMatch(new RegExp('^field_' + course + '_'));
      const growth = TURNING_BY_ID[follow.turning].doors[ending].fx.find(f => f.op === 'base' || f.op === 'mastery')!;
      const progress = () => growth.op === 'mastery' ? s.growth.mastery[growth.branch] :
        growth.op === 'base' && growth.key !== 'all' ? s.hero.base[growth.key] : NaN;
      const before = progress();
      apply5(s, { type: 'answer', index: ending });
      expect(progress()).toBeGreaterThan(before);
      expect(s.flags).toContain('training:done:' + course);
      finishPassage(s);
      expect(portOf(s.hero.island)).toBe(port);
      expect(s.stats.fights).toBe(1);
      expect(s.stats.wins).toBe(0);
      expect(s.timeline.filter(t => t.canon === 'kuma' && t.text.includes('떨어졌다'))).toHaveLength(1);
    }
  });
  it('어인섬에서 실제 항해로 샤본디에 닿아 쿠마를 마주친다', () => {
    const s = traveler('어인섬');
    const t = buildVoyage(voyageId(s, voyageChoices(s, () => 0.4)!))!;
    const i = t.doors.findIndex(d => d.fx.some(f => f.op === 'sail' && f.island === '샤본디 제도'));
    expect(i).toBeGreaterThanOrEqual(0);
    openTurning(s, t); apply5(s, { type: 'answer', index: i }); finishPassage(s);
    expect(nextDoor(s).turning).toBe('kuma_grove');
  });
  it('스릴러 바크에서 물러나면 뒤에 샤본디에서 다시 싸움을 권하지 않는다', () => {
    const s = traveler('스릴러 바크', 18);
    s.vows!.declined = true;
    for (const scene of ['bark_bell', 'florian_echo', 'florian_names']) {
      expect(nextDoor(s).turning).toBe(scene);
      apply5(s, { type: 'answer', index: 0 });
    }
    expect(nextDoor(s).turning).toBe('kuma_bark');
    apply5(s, { type: 'answer', index: 1 });
    expect(s.hero.island).toBe('스릴러 바크');
    expect(s.stats.fights).toBe(0);
    s.age = 19; s.hero.island = '샤본디 제도';
    apply5(s, { type: 'step' });
    expect(s.seenCount.kuma_grove).toBeUndefined();
  });
  it('피난로를 확보한 승리에서는 쿠마와 주인공 모두 현장에 살아남는다', () => {
    const s = traveler();
    for (const stat of Object.keys(s.hero.base) as (keyof typeof s.hero.base)[]) s.hero.base[stat] = 1600;
    start(s);
    expect(s.pending).toMatchObject({ result: 'win' });
    apply5(s, { type: 'answer', index: 0 });
    expect(s.hero.island).toBe('샤본디 제도');
    expect(s.stats.wins).toBe(1);
    expect(s.people.some(person => person.canon === 'kuma' && !person.alive)).toBe(false);
    expect(s.queue.some(id => id.startsWith('field_'))).toBe(false);
  });
  it('정상결전 뒤와 시기·장소가 다른 곳, 감옥과 항해 중에는 나타나지 않는다', () => {
    for (const [island, age] of [['샤본디 제도', 18], ['샤본디 제도', 20], ['스릴러 바크', 19], ['플로리안 트라이앵글', 18], ['자야', 19]] as const) {
      expect(kumaSighting(traveler(island, age))).toBeUndefined();
    }
    const s = traveler();
    s.hero.fruit = { id: 'nikyu', eatenAt: 17 };
    expect(kumaSighting(s)).toBeUndefined();
    s.hero.fruit = null; s.seenCount.cn_whitebeard_war = 1;
    expect(kumaSighting(s)).toBeUndefined();
    delete s.seenCount.cn_whitebeard_war; s.hero.standing = 'prisoner';
    expect(kumaSighting(s)).toBeUndefined();
    s.hero.standing = 'pirate'; s.passage = { to: '샤본디 제도', route: 'drift', partsLeft: 1, partsSpent: 0, maxParts: 3 };
    expect(kumaSighting(s)).toBeUndefined();
  });
  it('예전 저장의 수련선 선택지는 걷어 내고 남은 항로와 머물기 선택을 보존한다', () => {
    const s = traveler('자야', 24);
    const old = 'voyage:24:-:워터 세븐|||:자야:balloon';
    const t = buildVoyage(old)!;
    openTurning(s, t);
    if (s.pending?.kind !== 'door') throw Error('항로 창');
    s.pending.doors.splice(1, 0, { ...s.pending.doors[0], label: '수련 항로 · 웨더리아' });
    const saved = reload(s);
    expect(saved.pending?.kind === 'door' && saved.pending.doors.map(d => d.label)).toEqual(t.doors.map(d => d.label));
    apply5(saved, { type: 'answer', index: 1 });
    expect(saved.hero.island).toBe('자야');
    expect(saved.passage).toBeFalsy();
    for (const line of TRAINING_LINES) {
      const h = traveler(line.from, 22);
      const menu = buildVoyage(voyageId(h, voyageChoices(h, () => 0.2)!))!;
      expect(menu.doors.some(d => d.label.includes('수련 항로') || d.fx.some(f => f.op === 'sail' && f.island === line.island))).toBe(false);
    }
  });
  it('구판에서 이미 수련 중이던 여행자는 원래 귀항편을 이용한다', () => {
    const s = traveler('토리노 왕국', 30);
    s.flags.push('training:line:birds');
    openTurning(s, TURNING_BY_ID.field_torino);
    const saved = reload(s);
    expect(saved.pending).toMatchObject({ turning: 'field_torino' });
    apply5(saved, { type: 'answer', index: 2 });
    finishPassage(saved);
    expect(saved.hero.island).toBe('남쪽 산호초 항구');
  });
});
