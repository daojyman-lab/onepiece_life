// tests/v5/turning.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { reduce5 } from '../../src/v5/core/reduce';
import { openTurning, resolveDoors } from '../../src/v5/core/turning';
import { addValues } from '../../src/v5/core/values';
import { TURNINGS } from '../../src/v5/data/turnings';
import { VALUE_NAME } from '../../src/v5/data/values';
import { STRENGTHS } from '../../src/v5/data/strengths';
import { V } from '../../src/v5/data/balance';
import type { Life5, Turning } from '../../src/v5/core/types';

const T: Turning = {
  id: 't_kneel', kind: 'door', when: [], weight: 1, repeat: 'once', speaker: 'hero',
  title: '무릎', body: '해군 대령이 무릎을 꿇으라고 한다.',
  doors: [
    { label: '꿇는다', hint: '오늘은 넘어간다', values: { peace: V.value.door }, fx: [] },
    { label: '거절하고 끌려간다', hint: '갇힌다', values: { freedom: V.value.door }, mark: 'rebel', fx: [{ op: 'standing', to: 'prisoner' }] },
    { label: '대령을 쓰러뜨린다', hint: '되돌릴 수 없다', special: 'dominion', values: { dominion: V.value.door }, fx: [{ op: 'fame', add: 100 }] },
    { label: '뇌물을 준다', hint: '돈으로 넘어간다', when: [{ c: 'money', min: 999999999 }], fx: [] },
  ],
};

describe('문', () => {
  it('새 인생은 유년기의 첫 문이 떠 있는 채로 시작한다', () => {
    const s = newLife5(1);
    expect(s.pending?.kind).toBe('door');
  });
  it('특별한 문은 그 가치관이 깊어야 열리고, 잠긴 이유가 적힌다', () => {
    const s = newLife5(1);
    const d = resolveDoors(s, T);
    expect(d[2].special).toBe(true);
    expect(d[2].locked).toMatch(/패도/);
    expect(d[3].locked).not.toBeNull();
    addValues(s, { dominion: V.value.deep });
    expect(resolveDoors(s, T)[2].locked).toBeNull();
  });
  it('선택지에 가치관 이름이나 점수가 미리 보이지 않는다', () => {
    const s = newLife5(1); s.pending = null; openTurning(s, T);
    const p = s.pending as unknown as Extract<Life5['pending'], { kind: 'door' }>;
    for (const d of p.doors.filter((x) => !x.locked)) expect(d.label + d.hint).not.toMatch(/평온|자유|패도|\+\d/);
  });
  it('고르면 점수가 오르고, 고른 뒤에 드러나는 문장이 기록에 남는다', () => {
    let s = newLife5(1); s.pending = null; openTurning(s, T);
    s = reduce5(s, { type: 'answer', index: 1 });
    expect(s.values.freedom).toBe(V.value.door);
    expect(s.log.some((l) => /자유/.test(l.text))).toBe(true);
    expect(s.hero.standing).toBe('prisoner');
    expect(s.marks.rebel).toBe(1);
    expect(s.pending).toBeNull();
  });
  it('고르지 않은 열린 문은 가지 않은 길로 남고, 고른 문은 골라 본 문으로 남는다', () => {
    let s = newLife5(1); s.pending = null; openTurning(s, T);
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.unchosen.map((u) => u.door)).toContain('거절하고 끌려간다');
    expect(s.unchosen.map((u) => u.door)).not.toContain('뇌물을 준다');
    expect(s.tried).toContain('t_kneel#0');
  });
  it('잠긴 문은 고를 수 없다', () => {
    const s = newLife5(1); s.pending = null; openTurning(s, T);
    expect(reduce5(s, { type: 'answer', index: 3 })).toEqual(s);
  });
  it('큰 계기는 점수를 세 배로 움직인다', () => {
    let s = newLife5(1); s.pending = null; openTurning(s, { ...T, id: 't_m', kind: 'moment' });
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.values.peace).toBe(V.value.moment);
  });
  it('열린 문이 하나도 없는 전환점은 뜨지 않는다', () => {
    const s = newLife5(1); s.pending = null;
    const locked: Turning = { ...T, id: 't_l', doors: [T.doors[3]] };
    expect(openTurning(s, locked)).toBe(false);
    expect(s.pending).toBeNull();
  });
  it('문이 떠 있는 상태를 JSON으로 되살려도 같은 답에 같은 결과가 나온다', () => {
    const s = newLife5(1); s.pending = null; openTurning(s, T);
    const back = JSON.parse(JSON.stringify(s));
    expect(reduce5(back, { type: 'answer', index: 1 })).toEqual(reduce5(s, { type: 'answer', index: 1 }));
  });
});

describe('전환점 데이터', () => {
  it('id가 겹치지 않고, 문이 있는 전환점은 조건 없는 문을 하나 이상 갖는다', () => {
    expect(new Set(TURNINGS.map((t) => t.id)).size).toBe(TURNINGS.length);
    for (const t of TURNINGS.filter((x) => x.kind !== 'misfortune'))
      expect(t.doors.some((d) => !d.when && !d.special), t.id).toBe(true);
  });
  it('유년기 전환점이 12개 이상이고, 아홉 가지 가치관이 모두 어느 문에서든 오른다', () => {
    const kids = TURNINGS.filter((t) => t.id.startsWith('kid_'));
    expect(kids.length).toBeGreaterThanOrEqual(12);
    const seen = new Set(kids.flatMap((t) => t.doors.flatMap((d) => Object.keys(d.values ?? {}))));
    expect(seen.size).toBe(9);
  });
});

describe('전환점의 흐름', () => {
  it('전환점 데이터의 문 말에는 가치관 이름도 숫자도 없다', () => {
    const names = new RegExp(Object.values(VALUE_NAME).join('|') + '|\d');
    for (const t of TURNINGS) for (const d of t.doors) expect(d.label + d.hint, t.id).not.toMatch(names);
  });
  it('본문의 자리표시가 채워지고 성씨가 들어가지 않는다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = newLife5(seed);
      const p = s.pending as Extract<Life5['pending'], { kind: 'door' }>;
      expect(p.turning.startsWith('kid_')).toBe(true);
      expect(p.title + p.body).not.toMatch(/[{}]/);
      if (s.hero.surname) expect(p.body).not.toContain(`${s.hero.surname} ${s.hero.name}`);
      expect(s.seen[p.turning]).toBe(s.age);
    }
  });
  it('문에 답하며 살면 해마다 멈추되 상한을 넘지 않고, 한 번뿐인 전환점은 다시 뜨지 않는다', () => {
    let s = newLife5(7);
    const opened: string[] = [];
    const perYear: Record<number, number> = {};
    for (let i = 0; i < 4 * 12 && s.hero.alive; i++) {
      if (s.pending?.kind === 'door') {
        opened.push(s.pending.turning);
        perYear[s.age] = (perYear[s.age] ?? 0) + 1;
        s = reduce5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
      }
      s = reduce5(s, { type: 'step' });
    }
    expect(opened.length).toBeGreaterThanOrEqual(6);
    expect(new Set(opened).size).toBe(opened.length);
    expect(s.stats.stops).toBe(opened.length);
    for (const n of Object.values(perYear)) expect(n).toBeLessThanOrEqual(Math.ceil(V.stopsPerYear[0].n) + 2);
  });
  it('문 말고 다른 것이 떠 있으면 답은 아무것도 하지 않는다', () => {
    const s: Life5 = { ...newLife5(1), pending: { kind: 'ending', cause: '시험' } };
    expect(reduce5(s, { type: 'answer', index: 0 })).toEqual(s);
  });
  it('효과가 죽음을 부르면 엔딩이 떠 있는 채로 남는다', () => {
    let s = newLife5(1); s.pending = null;
    openTurning(s, { ...T, id: 't_die', doors: [{ label: '뛰어내린다', hint: '돌아올 수 없다', fx: [{ op: 'die', cause: '절벽' }] }] });
    s = reduce5(s, { type: 'answer', index: 0 });
    expect(s.pending).toEqual({ kind: 'ending', cause: '절벽' });
  });
  it('문의 표시로 강점을 얻으면 그 이름이 무겁게 기록된다', () => {
    let s = newLife5(1); s.pending = null; s.marks.rebel = 2;
    openTurning(s, T);
    s = reduce5(s, { type: 'answer', index: 1 });
    expect(s.strengths).toContain('rebel');
    const name = STRENGTHS.find((x) => x.id === 'rebel')!.name;
    expect(s.log.some((l) => l.weight === 'heavy' && l.text.includes(name))).toBe(true);
  });
});
