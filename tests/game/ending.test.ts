// tests/game/ending.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { reduce5 } from '../../src/core/reduce';
import { buildEnding } from '../../src/core/ending';
import { ageShort } from '../../src/core/words';
import { autoplay5 } from '../../src/core/autoplay';
import { emptyMeta5, recordLife } from '../../src/core/meta';
import { applyFx } from '../../src/core/fx';
import { addValues } from '../../src/core/values';
import { openTurning } from '../../src/core/turning';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { VALUE_NAME } from '../../src/data/values';
import { STANDING_FROM_CHILD, STANDING_PHRASE } from '../../src/data/standings';
import { V } from '../../src/data/balance';
import type { Life5 } from '../../src/core/types';

function live(seed: number): Life5 {
  let s = newLife5(seed);
  for (let i = 0; i < 6000 && s.pending?.kind !== 'ending'; i++) {
    if (!s.pending) s = reduce5(s, { type: 'step' });
    else if (s.pending.kind === 'door') s = reduce5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
    else s = reduce5(s, { type: 'answer', index: 0 });
  }
  return s;
}

describe('엔딩 자료', () => {
  const s = live(77), e = buildEnding(s, emptyMeta5());
  it('어떤 사람이었는지 가치관의 말로 적고, 숫자는 넣지 않는다', () => {
    expect(Object.values(VALUE_NAME).some((n) => e.persona.includes(n))).toBe(true);
    expect(e.persona).not.toMatch(/\d/);
  });
  it('한 줄 인생에 태어난 곳과 죽은 나이가 들어 있다', () => {
    expect(e.oneLine).toContain(s.hero.town);
    expect(e.oneLine).toContain(`${ageShort(s.ended!.age)}에`);
  });
  it('가지 않은 길은 셋 이하이고, 깨진 글자가 없다', () => {
    expect(e.unchosen.length).toBeLessThanOrEqual(3);
    expect(JSON.stringify(e)).not.toMatch(/undefined|\{[a-z]+\}/);
  });
  it('끝내 몰랐던 진짜 성씨를 알려 준다', () => {
    let o: Life5 | null = null;
    for (let i = 0; i < 3000 && !o; i++) { const x = newLife5(i); if (x.hero.secretSurname) o = x; }
    o!.pending = { kind: 'ending', cause: '노환' }; o!.ended = { cause: '노환', age: 70 };
    expect(buildEnding(o!, emptyMeta5()).secret).toContain(o!.hero.secretSurname!);
  });
  it('이름이 알려지지 않은 인생은 고향의 소문 한 줄로 기억된다', () => {
    const q = live(78); q.hero.fame = 0;
    expect(buildEnding(q, emptyMeta5()).remembered).toContain(q.hero.town);
  });
});

describe('도감', () => {
  it('골라 본 문이 무엇을 올렸는지 남고, 두 번째 인생에서 새로 채운 항목만 센다', () => {
    const s = live(77);
    const m1 = recordLife(emptyMeta5(), s);
    expect(Object.keys(m1.doors).length).toBe(new Set(s.tried).size);
    expect(m1.lives).toBe(1);
    expect(m1.hall).toHaveLength(1);
    expect(buildEnding(s, m1).newCodex).toHaveLength(0);
    expect(buildEnding(s, emptyMeta5()).newCodex.length).toBeGreaterThan(0);
  });
});

/** 문 하나 없이 막 태어난 사람을 그대로 끝낸 인생 */
function bare(seed: number, age = 40, cause = '노환'): Life5 {
  const s = newLife5(seed); s.pending = { kind: 'ending', cause }; s.ended = { cause, age }; s.age = age; s.hero.alive = false;
  return s;
}

describe('엔딩 자료의 세부', () => {
  it('확정된 주·부성향을 엔딩에서 함께 말한다', () => {
    const s = bare(19);
    s.personality = { row: 2, col: 0, pullRow: 0, pullCol: 0, choices: 3, hold: 0, established: true };
    s.values.ambition = 55;
    const line = buildEnding(s, emptyMeta5()).persona;
    expect(line).toContain('야망 · 성취');
    expect(line).not.toMatch(/\d/);
  });
  it('원피스에 대한 답도 현재 부성향을 따른다', () => {
    const s = bare(20);
    s.values.greed = 80;
    s.personality = { row: 0, col: 1, pullRow: 0, pullCol: 0, choices: 3, hold: 0, established: true };
    expect(buildEnding(s, emptyMeta5()).onePiece).toContain('함께 바다를 건넜던 사람들');
  });
  it('가치관이 없으면 알 수 없는 사람이었다고 적고, 강점이 있으면 그 구절로 맺는다', () => {
    expect(buildEnding(bare(1), emptyMeta5()).persona).toBe('무엇을 좇았는지 끝내 알 수 없는 사람이었다.');
    const s = bare(1); addValues(s, { loyalty: 40, freedom: 20 }); s.strengths = ['unyielding'];
    const p = buildEnding(s, emptyMeta5()).persona;
    expect(p).toContain('의리');
    expect(p).toContain('자유');
    expect(p).toContain('꺾이지 않았다');
    expect(p).not.toMatch(/\d/);
  });
  it('처지가 바뀌면 연표에 짧게 남고, 한 줄 인생은 그 지점을 셋까지만 잇는다', () => {
    const s = bare(2, 55);
    for (const to of ['pirate', 'prisoner', 'civil', 'marine'] as const) applyFx(s, [{ op: 'standing', to }]);
    applyFx(s, [{ op: 'standing', to: 'marine' }]);                       // 바뀌지 않으면 남기지 않는다
    expect(s.timeline.filter((t) => t.standing).map((t) => t.text))
      .toEqual(['pirate', 'prisoner', 'civil', 'marine'].map((x) => STANDING_PHRASE[x as keyof typeof STANDING_PHRASE]));
    const line = buildEnding(s, emptyMeta5()).oneLine;
    expect(line.startsWith(`${s.hero.town}에서 태어나`)).toBe(true);
    expect(line).toContain('쉰다섯에 노환으로 죽었다.');
    const shown = Object.values(STANDING_PHRASE).filter((p) => line.includes(p.replace(/다$/, '')));
    expect(shown.length).toBe(3);
  });
  it('아이에서 곧장 뭍의 일로 건너가면 "돌아왔다"고 적지 않는다 (과제 14)', () => {
    const s = bare(2, 55); s.hero.standing = 'child';
    applyFx(s, [{ op: 'standing', to: 'civil' }]);
    expect(s.timeline.at(-1)?.text).toBe(STANDING_FROM_CHILD.civil);
    applyFx(s, [{ op: 'standing', to: 'pirate' }, { op: 'standing', to: 'civil' }]);
    expect(s.timeline.at(-1)?.text).toBe(STANDING_PHRASE.civil);
  });
  it('몸을 잃은 인생은 한 줄 인생에 잃은 일이 연표의 차례대로 적힌다 (설계 5.7)', () => {
    const s = bare(2, 55);
    applyFx(s, [{ op: 'standing', to: 'pirate' }]);
    applyFx(s, [{ op: 'loseLimb', limb: 'armL' }]);
    applyFx(s, [{ op: 'standing', to: 'settled' }]);
    const line = buildEnding(s, emptyMeta5()).oneLine;
    expect(line).toContain('왼팔을 잃었고');
    const pirate = STANDING_PHRASE.pirate.replace(/다$/, ''), settled = STANDING_PHRASE.settled.replace(/다$/, '');
    expect(line.indexOf(pirate)).toBeLessThan(line.indexOf('왼팔'));
    expect(line.indexOf('왼팔')).toBeLessThan(line.indexOf(settled));
    expect(buildEnding(bare(2, 55), emptyMeta5()).oneLine).not.toContain('잃었');
  });
  it('싸움에서 쓰러진 죽음은 그 말 그대로 맺는다', () => {
    const line = buildEnding(bare(3, 30, '도끼손 모건에게 쓰러졌다'), emptyMeta5()).oneLine;
    expect(line.endsWith('서른에 도끼손 모건에게 쓰러졌다.')).toBe(true);
  });
  it('이름이 알려진 인생은 신문 1면에 실린다', () => {
    const s = bare(4); s.hero.standing = 'pirate'; s.hero.fame = V.ending.knownFame;
    const r = buildEnding(s, emptyMeta5()).remembered;
    expect(r).not.toContain('가끔 그 이름을 떠올린다');
    expect(r).toContain(s.hero.name);
  });
  it('원작 인물의 한마디는 셋까지, 유대에 따라 말이 다르고, 모르는 인물은 흔한 말로 대신한다', () => {
    const s = bare(5);
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '상관', name: '스모커', canon: 'smoker' }]);
    const low = buildEnding(s, emptyMeta5()).canonWords[0];
    s.people.find((p) => p.canon === 'smoker')!.bond = V.person.bondMax;   // 앞에는 가족이 있다
    const high = buildEnding(s, emptyMeta5()).canonWords[0];
    expect(low.who).toBe('스모커');
    expect(low.line).not.toBe(high.line);
    for (const [name, canon] of [['루피', 'luffy'], ['드래곤', 'dragon'], ['누군가', 'nobody']])
      applyFx(s, [{ op: 'person', kind: 'ally', relation: '아는 사이', name, canon }]);
    const words = buildEnding(s, emptyMeta5()).canonWords;
    expect(words).toHaveLength(3);
    expect(JSON.stringify(words)).not.toMatch(/undefined|\{[a-z]+\}/);
    const unknown = bare(6);
    applyFx(unknown, [{ op: 'person', kind: 'ally', relation: '아는 사이', name: '누군가', canon: 'nobody' }]);
    expect(buildEnding(unknown, emptyMeta5()).canonWords[0].line.length).toBeGreaterThan(0);
  });
  it('긴은 실제로 밥을 얻어먹었을 때만 그릇을 기억하고, 먼저 떠난 인물은 추도사를 남기지 않는다', () => {
    const s = bare(17);
    applyFx(s, [{ op: 'person', kind: 'ally', relation: '항구에서 만난 사내', canon: 'gin' }]);
    const gin = s.people.find(p => p.canon === 'gin')!;
    gin.bond = V.person.bondMax;
    const words = () => buildEnding(s, emptyMeta5()).canonWords;
    expect(words()[0].line).not.toMatch(/밥|그릇/);
    s.tried.push('isl_baratie_gin#1');
    expect(words()[0].line).toContain('밥 한 그릇');
    gin.alive = false;
    expect(words()).toEqual([]);
  });

  it('원작 인물이 말한 전환점에서 고른 일은 겹친 원작 순간으로 남는다', () => {
    let s = newLife5(7); s.pending = null; s.age = 15; s.hero.standing = 'civil';
    expect(openTurning(s, TURNING_BY_ID.path_smoker)).toBe(true);
    s = reduce5(s, { type: 'answer', index: 1 });
    expect(s.timeline.at(-1)!.canon).toBe('smoker');                      // 연표에는 원작 인물의 id가 남는다
    s.ended = { cause: '노환', age: 70 }; s.pending = { kind: 'ending', cause: '노환' };
    const e = buildEnding(s, emptyMeta5());
    expect(e.canonMoments.some((m) => m.includes('흰 연기의 대령'))).toBe(true);
  });
  it('가지 않은 길은 큰 계기와 길을 바꾸는 전환점을 먼저 꼽는다', () => {
    const s = bare(8);
    s.unchosen = [
      { age: 10, turning: 'kid_bully', title: '골목대장', door: '못 본 척 지나간다' },
      { age: 11, turning: 'kid_dice', title: '부두의 노름판', door: '경비대에 알린다' },
      { age: 12, turning: 'kid_bread', title: '빵집 앞', door: '빵집 일을 거들고 얻어먹는다' },
      { age: 20, turning: 'path_marine_join', title: '해군 모병', door: '말단 수병으로 지원한다' },
      { age: 30, turning: 'moment_loss', title: '남겨진 사람', door: '이렇게 만든 세상을 바로잡는다' },
    ];
    const u = buildEnding(s, emptyMeta5()).unchosen;
    expect(u).toHaveLength(3);
    expect(u[0]).toBe("스무 살, 해군 모병: '말단 수병으로 지원한다'를 고르지 않았다.");
    expect(u[1]).toContain('남겨진 사람');
  });
  it('기록에는 나이 · 원인 · 가장 높은 단계 · 명성 · 전적이 든다', () => {
    const s = bare(9, 61); s.growth.tier.sword = 3; s.hero.fame = 12; s.stats.fights = 5; s.stats.wins = 3;
    expect(buildEnding(s, emptyMeta5()).record).toEqual({ age: 61, cause: '노환', topTier: 3, fame: 12, fights: 5, wins: 3, limbsLost: 0, fortunes: 0 });
  });
});

describe('엔딩의 나이는 말로', () => {
  it.each([[68, '예순여덟'], [42, '마흔둘'], [20, '스물'], [21, '스물하나'], [3, '셋'], [10, '열'], [100, '100']])('ageShort(%i) → %s', (n, w) => {
    expect(ageShort(n)).toBe(w);
  });
  it('끝난 인생 30개의 엔딩 자료에 숫자 나이(68살, 14세)가 없다', () => {
    for (let i = 0; i < 30; i++) {
      const { s } = autoplay5(4000 + i, 'random');
      const { record: _record, ...rest } = buildEnding(s, emptyMeta5());
      expect(JSON.stringify(rest), `seed ${4000 + i}`).not.toMatch(/\d+(살|세)/);
    }
  });
  it('겹친 원작 순간은 "열네 살, …" 꼴이다', () => {
    const s = bare(14, 60);
    s.timeline.push({ age: 14, text: '흰 연기의 대령: 따른다', canon: 'smoker' });
    expect(buildEnding(s, emptyMeta5()).canonMoments).toEqual(['열네 살, 흰 연기의 대령: 따른다']);
  });
  it('이름이 알려진 인생의 신문 1면에도 나이를 말로 쓴다', () => {
    const s = bare(4, 68); s.hero.standing = 'pirate'; s.hero.fame = V.ending.knownFame;
    expect(buildEnding(s, emptyMeta5()).remembered).toContain('예순여덟 살로');
  });
});

describe('도감의 세부', () => {
  it('기록해도 넘겨받은 도감은 바뀌지 않고, 문 하나 고르지 않은 인생도 기록된다', () => {
    const m0 = emptyMeta5();
    const before = JSON.parse(JSON.stringify(m0));
    const m1 = recordLife(m0, bare(10));
    expect(m0).toEqual(before);
    expect(m1.lives).toBe(1);
    expect(m1.doors).toEqual({});
    expect(m1.hall[0].age).toBe(40);
    const alive = newLife5(11); alive.pending = null; alive.tried = [];
    expect(recordLife(m1, alive).lives).toBe(2);
  });
  it('골라 본 문에는 그 문이 올린 가치관이 남고, 가치관이 없는 문은 빈 목록이다', () => {
    const s = bare(12);
    s.tried = ['kid_marine_parade#1', 'fortune_old_hero#1'];
    const m = recordLife(emptyMeta5(), s);
    expect(m.doors['kid_marine_parade#1'].sort()).toEqual(['justice', 'loyalty']);
    expect(m.doors['fortune_old_hero#1']).toEqual([]);
  });
  it('먹은 열매와 만난 원작 인물이 도감에 남는다', () => {
    const s = bare(13);
    applyFx(s, [{ op: 'eatFruit', id: 'random' }, { op: 'person', kind: 'ally', relation: '상관', name: '스모커', canon: 'smoker' }]);
    const m = recordLife(emptyMeta5(), s);
    expect(m.fruits).toEqual([s.hero.fruit!.id]);
    expect(m.people).toEqual(['smoker']);
    expect(buildEnding(s, emptyMeta5()).newCodex).toHaveLength(2);
    expect(buildEnding(s, m).newCodex).toHaveLength(0);
  });
});
