import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { apply5 } from '../../src/core/reduce';
import { normalizeLife5 } from '../../src/core/load';
import { dreamMet, onePieceAnswer } from '../../src/core/dreams';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { openTurning, resolveDoors } from '../../src/core/turning';
import { advanceLifeTime, lifePreparation, lifeStoryScene, recordLifeEvent } from '../../src/core/life-story';
import type { Life5 } from '../../src/core/types';
import { playLifeCourse } from '../../tools/life-course-policy';
import { growPart } from '../../src/core/year';
import { backOffChance, heroUnit5 } from '../../src/core/fight';
import { rollDice } from '../../src/shared/core/combat/engine';
import { rngOf } from '../../src/shared/core/rng';

const fresh = () => newLife5(23, { home: 'loguetown' });
function trained(mode: 'guard' | 'duel' = 'guard'): Life5 {
  const s = fresh(); s.pending = null;
  s.age = 16; s.hero.island = '알라바스타 왕국'; s.hero.sea = 'gl_first';
  s.hero.hp = 100; s.hero.injuries = []; s.hero.limbs.armL = 'ok'; s.hero.limbs.armR = 'ok';
  recordLifeEvent(s, `promise_${mode}`); recordLifeEvent(s, `trained_${mode}`);
  s.growth.tier.sword = 2;
  return s;
}
function choose(s: Life5, id: string, index: number) {
  expect(openTurning(s, TURNING_BY_ID[id]), id).toBe(true);
  apply5(s, { type: 'answer', index });
}

describe('한 생애의 사건과 실제 시간', () => {
  it('사건의 시점과 인물 ID를 한 번만 기록하고 저장 왕복을 유지한다', () => {
    const s = fresh();
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '부두의 기록꾼 페니', name: '페니' }]);
    recordLifeEvent(s, 'promise_guard', '부두의 기록꾼 페니');
    const first = structuredClone(s.lifeStory!.events[0]);
    s.age += 1; recordLifeEvent(s, 'promise_guard', '부두의 기록꾼 페니');
    expect(s.lifeStory!.events).toEqual([first]);
    expect(first.actorId).toBe(s.people.at(-1)!.id);
    expect(normalizeLife5(JSON.parse(JSON.stringify(s)))!.lifeStory).toEqual(s.lifeStory);
  });
  it('옛 성인 저장에는 유년기의 약속을 소급 생성하지 않는다', () => {
    const s = fresh(); s.age = 30; s.pending = null; delete s.lifeStory;
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(loaded).not.toBeNull();
    expect(lifeStoryScene(loaded)).toBeNull();
  });
  it('조사는 실제 한 토막 뒤 열리고 선택창에서는 시간이 흐르지 않는다', () => {
    const s = trained(); s.flags.push('ep_alabasta_p_ledger');
    choose(s, 'life_course_prepare', 1);
    const saved = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(lifeStoryScene(saved)).toBeNull();
    advanceLifeTime(saved);
    expect(lifeStoryScene(saved)).toBe('life_course_evidence');
    expect(lifeStoryScene(saved)).toBeNull();
  });
  it('조사 중 이탈·기한 경과는 실패로, 사망은 후속 없음으로 처리한다', () => {
    for (const cause of ['leave', 'expire', 'die']) {
      const s = trained(); choose(s, 'life_course_prepare', 1);
      if (cause === 'leave') s.hero.island = '자야';
      if (cause === 'expire') for (let i = 0; i < 4; i++) advanceLifeTime(s);
      if (cause === 'die') { s.hero.alive = false; s.pending = { kind: 'ending', cause: '사망' }; }
      expect(lifeStoryScene(s)).toBe(cause === 'die' ? null : 'life_course_missed');
    }
  });
  it('전성기 첫 바퀴에도 실제 진행 횟수는 한 토막씩 센다', () => {
    const s = trained(); s.prime = { from: 16, until: 25, lap: false };
    const before = s.lifeStory!.elapsed;
    advanceLifeTime(s);
    expect(s.lifeStory!.elapsed).toBe(before + 1);
  });
  it('조사 중 실제 진행은 회복과 시간을 한 번만 적용하고 후속 창에서는 멈춘다', () => {
    const s = trained(); s.flags.push('ep_alabasta_p_ledger');
    choose(s, 'life_course_prepare', 1);
    const before = s.lifeStory!.elapsed;
    apply5(s, { type: 'rest' });
    expect(s.lifeStory!.elapsed).toBe(before + 1);
    // 정상 진행 중 생긴 다른 선택부터 처리한다.
    if (s.pending?.kind === 'door') apply5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
    apply5(s, { type: 'step' });
    expect(s.pending?.kind === 'door' && s.pending.turning).toBe('life_course_evidence');
    const hp = s.hero.hp;
    apply5(s, { type: 'step' });
    expect(s.hero.hp).toBe(hp); expect(s.lifeStory!.elapsed).toBe(before + 1);
  });
  it('호위 코스에서 장편 에필로그로 돌아갈 때 막 사이의 쉼과 제목을 보존한다', () => {
    const s = trained();
    s.tried.push('ep_alabasta_p7#0');
    choose(s, 'life_course_prepare', 0);
    expect(s.storyRest).toBeGreaterThanOrEqual(3);
    expect(s.storyRest).toBeLessThanOrEqual(4);
    const age = s.age;
    apply5(s, { type: 'step' });
    expect(s.pending).toBeNull();
    expect(s.age).toBe(age);
    expect(s.log.some((line) => line.type === 'info' && line.text.includes('에필로그'))).toBe(true);
  });
  it('깨진 사건 기록과 미래의 시점은 저장에서 거부한다', () => {
    const s = trained();
    s.lifeStory!.events[0].elapsed = -1;
    expect(normalizeLife5(JSON.parse(JSON.stringify(s)))).toBeNull();
  });
});

describe('준비와 결과가 다른 생애를 만든다', () => {
  it('생애 수련이 실제 검술 연습과 전투 기술로 이어진다', () => {
    const s = fresh(); s.pending = null; s.age = 10; s.hero.injuries = []; s.hero.illness = null;
    choose(s, 'life_course_training', 0);
    expect(s.growth.styleBonds.oneSword).toBeDefined();
    expect(s.hero.weapon).toBeUndefined();
    for (let i = 0; i < 3; i++) growPart(s, 'train', () => 0.9);
    applyFx(s, [{ op: 'adoptStyle', style: 'oneSword' }]);
    expect(heroUnit5(s).skills.some((skill) => skill.id.startsWith('style:oneSword:'))).toBe(true);
  });
  it('동일 출생의 일반 새 게임에서 세 해결법과 재회·전수까지 상태 조작 없이 도달한다', () => {
    const lives = (['guard', 'duel', 'evidence'] as const).map((mode) => playLifeCourse(16, mode));
    expect(lives.map((s) => s.hero.town)).toEqual(['로그타운', '로그타운', '로그타운']);
    const duelResult = lives[1].lifeStory!.events.some((e) => e.id === 'duel_won') ? 'duel_won' : 'duel_lost';
    const expected = ['escort', duelResult, 'evidence'];
    lives.forEach((s, i) => {
      const events = s.lifeStory!.events;
      expect(events.map((e) => e.id)).toEqual(expect.arrayContaining([expected[i], 'reunion', 'legacy']));
      if (expected[i] !== 'duel_lost') expect(events.some((e) => e.id === 'recognized')).toBe(true);
      expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
      expect(events.find((e) => e.id === 'departed')!.age).toBe(16);
      expect(events.find((e) => e.id === 'reunion')!.elapsed - events.find((e) => e.id === 'alabasta_done')!.elapsed).toBeGreaterThanOrEqual(8);
      expect(normalizeLife5(JSON.parse(JSON.stringify(s)))!.lifeStory).toEqual(s.lifeStory);
    });
    expect(new Set(lives.map((s) => onePieceAnswer(s, 'loyalty'))).size).toBe(3);
    const evidence = lives[2].lifeStory!.events;
    expect(evidence.find((e) => e.id === 'evidence')!.elapsed - evidence.find((e) => e.id === 'investigating')!.elapsed).toBe(1);
  });
  it('호위 검술은 호위를 열고, 중상·양팔 손실은 막으며 건강한 지원 인력이 대신할 수 있다', () => {
    const s = trained();
    expect(lifePreparation(s, 'guard')).toBeNull();
    s.hero.limbs.armL = 'lost'; s.hero.limbs.armR = 'lost';
    expect(lifePreparation(s, 'guard')).not.toBeNull();
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '호송 지원병', role: 'support' }]);
    expect(lifePreparation(s, 'guard')).toBeNull();
    s.people.at(-1)!.crew!.injuredMonths = 3;
    expect(lifePreparation(s, 'guard')).not.toBeNull();
    s.hero.limbs.armL = 'ok'; s.hero.injuries = [{ part: 'armL', kind: 'cut', severity: 'heavy', monthsLeft: 6 }];
    expect(lifePreparation(s, 'guard')).not.toBeNull();
  });
  it('지원 인력이 대신한 호위는 실제 담당자를 기록하고 검으로 막았다고 꾸미지 않는다', () => {
    const s = trained('duel'); s.hero.limbs.armL = 'lost'; s.hero.limbs.armR = 'lost';
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '호송 지원병', name: '라온', role: 'support' }]);
    const from = s.seq; choose(s, 'life_course_prepare', 0);
    const result = s.lifeStory!.events.find((e) => e.id === 'escort')!;
    expect(result.actorId).toBe(s.people.at(-1)!.id);
    expect(s.log.filter((l) => l.id >= from).map((l) => l.text).join('\n')).toContain('라온');
    expect(onePieceAnswer(s, 'loyalty')).toContain('지원');
  });
  it('두 수련은 다른 선택을 열고 하잠의 전력은 바꾸지 않는다', () => {
    const a = trained('guard'), b = trained('duel');
    const da = resolveDoors(a, TURNING_BY_ID.life_course_prepare);
    const db = resolveDoors(b, TURNING_BY_ID.life_course_prepare);
    expect(da[0].locked).toBeNull(); expect(da[2].locked).not.toBeNull();
    expect(db[0].locked).not.toBeNull(); expect(db[2].locked).toBeNull();
    choose(b, 'life_course_prepare', 2);
    expect(b.pending?.kind).toBe('fight');
    const foe = b.pending?.kind === 'fight' && structuredClone(b.pending.foe);
    const c = trained('duel'); c.hero.base.str *= 3;
    choose(c, 'life_course_prepare', 2);
    expect(c.pending?.kind === 'fight' && c.pending.foe).toEqual(foe);
  });
  it('기존 준비와 후일담을 새 결판·장기 재회에 연결한다', () => {
    const s = trained();
    choose(s, 'ep_alabasta_p7', 0);
    expect(s.queue).toContain('life_course_prepare'); expect(s.queue).not.toContain('ep_alabasta_p8');
    s.queue = []; choose(s, 'life_course_prepare', 0);
    expect(s.lifeStory!.events.some((e) => e.id === 'escort')).toBe(true);
    s.queue = []; choose(s, 'ep_alabasta_p11', 2);
    expect(lifeStoryScene(s)).toBeNull();
    for (let i = 0; i < 8; i++) advanceLifeTime(s);
    expect(lifeStoryScene(s)).toBe('life_course_reunion');
  });
  it('전투 전후 저장을 거쳐도 결과·치료비·시간을 중복 적용하지 않는다', () => {
    const s = trained('duel'); choose(s, 'life_course_prepare', 2);
    const beforeFight = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    apply5(beforeFight, { type: 'answer', index: 0 });
    expect(beforeFight.pending?.kind).toBe('battle');
    const savedBattle = normalizeLife5(JSON.parse(JSON.stringify(beforeFight)))!;
    const result = savedBattle.pending?.kind === 'battle' && savedBattle.pending.result === 'win' ? 'duel_won' : 'duel_lost';
    const elapsed = savedBattle.lifeStory!.elapsed;
    apply5(savedBattle, { type: 'answer', index: 0 });
    apply5(savedBattle, { type: 'step' });
    apply5(savedBattle, { type: 'answer', index: 0 });
    expect(savedBattle.lifeStory!.events.filter((e) => e.id === result)).toHaveLength(1);
    expect(savedBattle.lifeStory!.elapsed).toBe(elapsed);
    const after = normalizeLife5(JSON.parse(JSON.stringify(savedBattle)))!;
    const money = after.hero.money;
    apply5(after, { type: 'answer', index: 0 });
    expect(after.hero.money).toBe(money);
    expect(after.lifeStory!.events.filter((e) => e.id === result)).toHaveLength(1);
  });
  it('전투를 시작하지 않고 물러난 결과도 다른 사건으로 저장된다', () => {
    const s = trained('duel'); choose(s, 'life_course_prepare', 2);
    expect(s.pending?.kind).toBe('fight');
    const p = s.pending as Extract<Life5['pending'], { kind: 'fight' }>;
    // 물러난 후속 사건을 검증하므로 성공하는 주사위 차례를 고른다.
    while (!rollDice(rngOf({ ...s.rng }), backOffChance(s, p.foe, p.lethal, p.atSea)).ok) s.rng.cursor++;
    apply5(s, { type: 'answer', index: 1 });
    expect(s.pending).toBeNull();
    apply5(s, { type: 'step' });
    expect(s.pending?.kind === 'door' && s.pending.turning).toBe('life_course_back');
    apply5(s, { type: 'answer', index: 0 });
    expect(s.lifeStory!.events.some((e) => e.id === 'withdrew')).toBe(true);
    expect(s.stats.fights).toBe(0);
  });
  it('같은 꿈도 첫 약속과 알라바스타의 결과에 따라 다른 마지막 대답을 남긴다', () => {
    const a = trained('guard'), b = trained('duel');
    a.dream = b.dream = { id: 'bestSword', since: 10, done: null };
    recordLifeEvent(a, 'escort'); recordLifeEvent(b, 'duel_lost');
    const ea = onePieceAnswer(a, 'loyalty'), eb = onePieceAnswer(b, 'loyalty');
    expect(ea).toContain('약속'); expect(ea).toContain('물 수레');
    expect(eb).toContain('패배'); expect(ea).not.toBe(eb);
  });
  it('이 코스의 검객 꿈은 경지와 실제 성과의 인정이 함께 필요하다', () => {
    const s = trained(); s.growth.tier.sword = 6;
    expect(dreamMet(s, 'bestSword')).toBe(false);
    recordLifeEvent(s, 'escort'); recordLifeEvent(s, 'recognized');
    expect(dreamMet(s, 'bestSword')).toBe(true);
  });
  it('인정을 받고 추가 수련만 거절해도 증명한 꿈의 성과는 남는다', () => {
    const s = trained(); s.growth.tier.sword = 6;
    recordLifeEvent(s, 'escort'); recordLifeEvent(s, 'recognition_declined');
    expect(dreamMet(s, 'bestSword')).toBe(true);
  });
  it('군인 출항은 CP 신분을 유지하고 죽은 인연을 재회에서 되살리지 않는다', () => {
    const s = trained(); s.hero.standing = 'cp'; s.hero.island = '로그타운'; s.hero.sea = 'east';
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '부두의 기록꾼 페니', name: '페니' }]);
    const p = s.people.at(-1)!; p.alive = false;
    choose(s, 'life_course_departure', 1);
    expect(s.hero.standing).toBe('cp');
    s.queue = []; choose(s, 'life_course_reunion', 0);
    expect(s.people.filter((x) => x.name === '페니')).toEqual([p]);
    expect(p.alive).toBe(false);
  });
  it('기존 로그타운 지도 장편에서 페니를 다시 만나도 한 인물 ID를 유지한다', () => {
    const s = fresh(); s.pending = null; s.age = 8;
    choose(s, 'life_course_promise', 0);
    const id = s.lifeStory!.events[0].actorId;
    s.age = 13; s.hero.island = '로그타운'; s.hero.sea = 'east';
    choose(s, 'ep_loguetown_a1', 1);
    expect(s.people.filter((p) => p.name === '페니').map((p) => p.id)).toEqual([id]);
  });
  it('검을 들기 어려운 황혼기에도 전수받은 사람의 ID와 기록이 남는다', () => {
    const s = trained(); s.age = 41; s.hero.limbs.armL = 'lost'; s.hero.limbs.armR = 'lost';
    choose(s, 'life_course_legacy', 0);
    const legacy = s.lifeStory!.events.find((e) => e.id === 'legacy')!;
    const learner = s.people.find((p) => p.id === legacy.actorId);
    expect(learner?.relation).toBe('검술과 기록을 이어받은 견습');
    expect(learner?.alive).toBe(true);
    expect(onePieceAnswer(s, 'loyalty')).toContain('다음 사람');
  });
  it('기존 장편의 시대를 놓치거나 이미 장편을 시작했으면 새 소개장을 중복 제시하지 않는다', () => {
    for (const cause of ['late', 'seen', 'done']) {
      const s = trained(); s.hero.island = '로그타운'; s.hero.sea = 'east'; s.hero.standing = 'civil';
      if (cause === 'late') s.age = 17;
      if (cause === 'seen') s.seenCount.ep_alabasta_p1 = 1;
      if (cause === 'done') s.flags.push('ep_alabasta_pre_done');
      expect(lifeStoryScene(s), cause).toBeNull();
    }
  });
});
