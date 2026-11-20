// tests/game/leave-skiff.test.ts — 볼일을 마치면 스스로 섬을 떠난다. 배가 없으면 어느 포구에서나 나룻배를 산다
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/core/state';
import { reduce5, invariants5 } from '../../src/core/reduce';
import { answerDoor } from '../../src/core/turning';
import { V } from '../../src/data/balance';
import { SKIFF, SKIFF_EXIT, leaveBlock, leaveView, skiffFare, VOYAGE_PREFIX } from '../../src/core/voyage';
import type { Life5 } from '../../src/core/types';

/** 이스트 블루의 마을에 사는 뭍사람 어른 하나 */
function civilian(seed = 5, money = 20000): Life5 {
  const s = newLife5(seed);
  s.pending = null;
  s.queue = [];
  s.age = 20;
  s.hero.standing = 'civil';
  s.hero.sea = 'east';
  s.hero.island = '시럽 마을';
  s.hero.money = money;
  s.flags = s.flags.filter(f => f !== 'ship' && f !== SKIFF);
  return s;
}
const leave = (s: Life5) => reduce5(s, { type: 'leave' });
const step = (s: Life5) => reduce5({ ...s, pending: null }, { type: 'step' });
/** 떠 있는 항로 고르기에서 첫 번째로 떠나는 문을 고른다 */
function chooseFirstRoute(s: Life5): void {
  expect(s.pending?.kind).toBe('door');
  if (s.pending?.kind !== 'door') return;
  const i = s.pending.doors.findIndex((d) => !d.locked);
  answerDoor(s, i);
}

describe('떠날 수 있는가', () => {
  it('배가 없는 뭍사람은 나룻배 값 5,000베리를 내고 떠날 수 있다', () => {
    const s = civilian();
    expect(skiffFare(s)).toEqual({ buy: V.skiff.price });
    expect(V.skiff.price).toBe(5000);
    expect(leaveBlock(s)).toBeNull();
    expect(leaveView(s).note).toContain('5,000베리');
  });
  it('돈이 모자라면 까닭을 말해 준다', () => {
    const s = civilian(5, 4999);
    expect(leaveBlock(s)).toMatch(/돈이 모자라다.*5,000베리/);
    expect(leave(s).pending).toBeNull();
  });
  it('해적처럼 바다를 다니는 처지나 배가 있는 사람은 값 없이 떠난다', () => {
    const p = civilian(5, 0);
    p.hero.standing = 'pirate';
    expect(skiffFare(p)).toBeUndefined();
    expect(leaveBlock(p)).toBeNull();
    const owner = civilian(5, 0);
    owner.flags.push('ship');
    expect(leaveBlock(owner)).toBeNull();
  });
  it('어린아이 · 갇힌 몸 · 해군 · 끝나지 않은 일이 있으면 떠나지 못한다', () => {
    const kid = civilian(); kid.age = 12;
    expect(leaveBlock(kid)).toMatch(/16살/);
    expect(leaveView(kid).show).toBe(false);
    const jailed = civilian(); jailed.hero.standing = 'prisoner';
    expect(leaveBlock(jailed)).toMatch(/갇힌/);
    const marine = civilian(); marine.hero.standing = 'marine';
    expect(leaveBlock(marine)).toMatch(/전근/);
    const busy = civilian(); busy.queue = ['ep_loguetown_2'];
    expect(leaveBlock(busy)).toMatch(/끝나지 않은 일/);
    const sailing = civilian(); sailing.passage = { to: '코노미 제도', route: 'calm', partsLeft: 1, partsSpent: 0, maxParts: 4 };
    expect(leaveBlock(sailing)).toMatch(/바다 위/);
  });
  it('하늘섬 · 어인섬 · 와노에서는 원작의 나가는 길 값을 더 치르고, 조우는 나룻배만으로 된다', () => {
    const sky = civilian(5, 0); sky.hero.sea = 'gl_first'; sky.hero.island = '스카이피아';
    expect(skiffFare(sky)).toEqual({ buy: 5000, gate: 'sky' });
    expect(leaveBlock(sky)).toMatch(/구름 끝 길잡이/);
    const fish = civilian(5, 0); fish.hero.sea = 'sabaody'; fish.hero.island = '어인섬';
    expect(skiffFare(fish)?.gate).toBe('fishman');
    const zou = civilian(5, 0); zou.hero.sea = 'nw_first'; zou.hero.island = '조우';
    expect(skiffFare(zou)?.gate).toBeUndefined();
  });
});

describe('나룻배로 떠나기', () => {
  it('떠나기를 누르면 항로 고르기가 뜨고, 고르면 5,000베리에 나룻배를 사서 노를 저어 간다', () => {
    let s = leave(civilian(7, 20000));
    expect(s.pending?.kind).toBe('door');
    if (s.pending?.kind !== 'door') return;
    expect(s.pending.turning.startsWith(VOYAGE_PREFIX)).toBe(true);
    expect(s.pending.title).toBe('떠날 채비');
    expect(s.pending.doors.at(-1)!.label).toBe('아직은 이곳에 머문다');
    chooseFirstRoute(s);
    expect(s.hero.money).toBe(15000);
    expect(s.flags).toContain(SKIFF);
    expect(s.passage?.skiff).toBe(true);
    expect(s.log.some((l) => l.text.includes('나룻배 한 척을 5,000베리에 샀다'))).toBe(true);
    const to = s.passage!.to;
    let parts = 0;
    while (s.passage && parts < 12) { s = step(s); parts++; }
    expect(s.passage).toBeNull();
    expect([to, '플로리안 트라이앵글']).toContain(s.hero.island);
    expect(s.hero.standing).toBe('civil');
    expect(invariants5(s)).toEqual([]);
  });
  it('한 번 산 나룻배는 다시 사지 않는다', () => {
    const s = civilian(7, 20000);
    s.flags.push(SKIFF);
    expect(skiffFare(s)).toEqual({ buy: 0 });
    const t = leave(s);
    if (t.pending?.kind !== 'door') throw new Error('no door');
    chooseFirstRoute(t);
    expect(t.hero.money).toBe(20000);
  });
  it('머물기를 고르면 돈도 나룻배도 그대로다', () => {
    const s = leave(civilian(7, 20000));
    if (s.pending?.kind !== 'door') throw new Error('no door');
    answerDoor(s, s.pending.doors.length - 1);
    expect(s.hero.money).toBe(20000);
    expect(s.flags).not.toContain(SKIFF);
    expect(s.passage).toBeFalsy();
  });
  it('하늘섬을 떠나는 뭍사람은 길잡이 값까지 치르고 내려온다', () => {
    const s = civilian(9, 50000);
    s.hero.sea = 'gl_first'; s.hero.island = '스카이피아';
    const t = leave(s);
    if (t.pending?.kind !== 'door') throw new Error('no door');
    chooseFirstRoute(t);
    expect(t.hero.money).toBe(50000 - 5000 - SKIFF_EXIT.sky.cost);
    expect(t.log.some((l) => l.text.includes('문어 풍선'))).toBe(true);
  });
  it('해적은 값 없이 같은 항로 고르기로 떠난다', () => {
    const s = civilian(11, 0);
    s.hero.standing = 'pirate';
    const t = leave(s);
    if (t.pending?.kind !== 'door') throw new Error('no door');
    expect(t.pending.title).toBe('다음 항로');
    chooseFirstRoute(t);
    expect(t.passage).toBeTruthy();
    expect(t.passage?.skiff).toBeUndefined();
    expect(t.hero.money).toBe(0);
  });
  it('저장했다 불러온 떠날 채비도 같은 문을 짓는다', () => {
    const s = leave(civilian(7, 20000));
    const back: Life5 = JSON.parse(JSON.stringify(s));
    if (back.pending?.kind !== 'door') throw new Error('no door');
    chooseFirstRoute(back);
    expect(back.flags).toContain(SKIFF);
    expect(back.passage?.skiff).toBe(true);
  });
  it('나룻배는 폭풍에 더 다치지만 죽지는 않는다', () => {
    for (let seed = 0; seed < 40; seed++) {
      let s = civilian(seed, 20000);
      s.hero.hp = 5;
      s.flags.push(SKIFF);
      s = leave(s);
      if (s.pending?.kind !== 'door') continue;
      chooseFirstRoute(s);
      let parts = 0;
      while (s.passage && parts < 12) { s = step(s); parts++; }
      expect(s.hero.alive || s.ended?.cause !== '폭풍', `seed ${seed}`).toBe(true);
      expect(s.passage, `seed ${seed}`).toBeNull();
    }
  });
});
