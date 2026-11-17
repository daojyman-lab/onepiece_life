import { describe, expect, it } from 'vitest';
import { emptyLife } from '../../src/v5/core/state';
import { answerDoor, openTurning } from '../../src/v5/core/turning';
import { isDeep } from '../../src/v5/core/values';
import { valueWords } from '../../src/v5/ui/view/words';
import { standingTitle } from '../../src/v5/ui/view/profile';
import type { Life5, Turning, Values } from '../../src/v5/core/types';

type Place = { row: number; col: number; pullRow: number; pullCol: number; choices: number; hold: number; established: boolean };
const place = (s: Life5): Place | undefined => (s as Life5 & { personality?: Place }).personality;

function choose(s: Life5, n: number, values: Partial<Values>): void {
  const t: Turning = {
    id: `personality_choice_${n}`, kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '성향 선택', body: '어떻게 할까?', doors: [{ label: '선택한다', hint: '결과', values, fx: [] }],
  };
  expect(openTurning(s, t)).toBe(true);
  answerDoor(s, 0);
}

describe('성향표 이동', () => {
  it('같은 방향의 선택 세 번이 쌓인 뒤 한 칸 이동해 주·부성향을 정한다', () => {
    const s = emptyLife(1);
    expect(valueWords(s)).toEqual([]);
    choose(s, 1, { justice: 6 });
    choose(s, 2, { justice: 6 });
    expect(place(s)).toMatchObject({ row: 1, col: 1, choices: 2 });
    expect(valueWords(s)).toEqual([]);
    choose(s, 3, { justice: 6 });
    expect(place(s)).toMatchObject({ row: 0, col: 0, choices: 3 });
    expect(valueWords(s)).toEqual(['주성향 마음', '부성향 정의']);
  });

  it('성향이 확정되기 전 두 선택은 인물의 호칭을 바꾸지 않는다', () => {
    const s = emptyLife(6);
    s.hero.standing = 'pirate'; s.hero.fame = 60;
    choose(s, 1, { justice: 6 });
    choose(s, 2, { justice: 6 });
    expect(standingTitle(s)).toBe('이름난 해적');
    choose(s, 3, { justice: 6 });
    expect(standingTitle(s)).toBe('정의로운 이름난 해적');
  });

  it('반대 방향 선택은 누적 이동을 상쇄한다', () => {
    const s = emptyLife(2);
    choose(s, 1, { justice: 6 });
    choose(s, 2, { justice: 6 });
    choose(s, 3, { dominion: 6 });
    choose(s, 4, { dominion: 6 });
    expect(place(s)).toMatchObject({ row: 1, col: 1, pullRow: 0, pullCol: 0 });
  });

  it('현재 칸을 다시 고르면 다른 칸으로 쌓이던 방향이 약해진다', () => {
    const s = emptyLife(5);
    choose(s, 1, { justice: 6 });
    choose(s, 2, { justice: 6 });
    choose(s, 3, { romance: 6 });
    expect(place(s)).toMatchObject({ row: 1, col: 1, pullRow: -1, pullCol: -1 });
  });

  it('중앙을 한 번 고른 것만으로 중앙의 낭만을 확정하지 않는다', () => {
    const s = emptyLife(7);
    choose(s, 1, { justice: 6 });
    choose(s, 2, { justice: 6 });
    choose(s, 3, { romance: 6 });
    expect(valueWords(s)).toEqual([]);
    choose(s, 4, { romance: 6 });
    choose(s, 5, { romance: 6 });
    expect(valueWords(s)).toEqual([]);
    choose(s, 6, { romance: 6 });
    expect(valueWords(s)).toEqual([]);
    choose(s, 7, { romance: 6 });
    expect(valueWords(s)).toEqual(['주성향 진취', '부성향 낭만']);
  });

  it('성취와 패도를 고른 결과가 선택하지 않은 탐욕이 되지 않는다', () => {
    const s = emptyLife(8);
    choose(s, 1, { ambition: 6 });
    choose(s, 2, { dominion: 6 });
    choose(s, 3, { ambition: 6 });
    expect(valueWords(s)[0]).toBe('주성향 야망');
    expect(valueWords(s)[1]).not.toBe('부성향 탐욕');
  });

  it('기존 야망의 선택 결과는 세부 이름 성취로 보여 준다', () => {
    const s = emptyLife(9);
    choose(s, 1, { ambition: 6 });
    expect(s.log.at(-1)?.text).toContain('성취');
  });

  it('같은 주성향 안에서 부성향이 먼저 바뀌고, 다음 행으로 가면 주성향이 바뀐다', () => {
    const s = emptyLife(3);
    for (let i = 1; i <= 3; i++) choose(s, i, { justice: 6 });
    for (let i = 4; i <= 6; i++) choose(s, i, { loyalty: 6 });
    expect(valueWords(s)).toEqual(['주성향 마음', '부성향 의리']);
    for (let i = 7; i <= 9; i++) choose(s, i, { romance: 6 });
    expect(valueWords(s)).toEqual(['주성향 진취', '부성향 낭만']);
  });

  it('한 번의 복합 선택은 이동시키지 않으면서 두 이야기 가치관을 모두 남긴다', () => {
    const s = emptyLife(4);
    choose(s, 1, { greed: 6, dominion: 6 });
    expect(place(s)).toMatchObject({ row: 1, col: 1, choices: 1 });
    expect(s.values.greed).toBeGreaterThan(0);
    expect(s.values.dominion).toBeGreaterThan(0);
    s.values.greed = 55;
    s.values.dominion = 55;
    expect(isDeep(s, 'greed')).toBe(true);
    expect(isDeep(s, 'dominion')).toBe(true);
  });
});
