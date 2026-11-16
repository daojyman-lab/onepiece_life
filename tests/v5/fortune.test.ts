// tests/v5/fortune.test.ts
import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { fortuneP, rollFortune, rollMisfortune, revealSurname } from '../../src/v5/core/fortune';
import { applyFx } from '../../src/v5/core/fx';
import { reduce5 } from '../../src/v5/core/reduce';
import { addValues } from '../../src/v5/core/values';
import { TURNINGS } from '../../src/v5/data/turnings';
import { rngOf } from '../../src/core/rng';
import { V } from '../../src/v5/data/balance';
import type { Life5 } from '../../src/v5/core/types';

describe('기연', () => {
  it('시련이 쌓일수록 확률이 오르고, 상한을 넘지 않는다', () => {
    const s = newLife5(1); s.age = 20; s.hardship = 0;
    const p0 = fortuneP(s); s.hardship = 60;
    expect(fortuneP(s)).toBeGreaterThan(p0);
    s.hardship = 100000;
    expect(fortuneP(s)).toBe(V.fortune.capP);
  });
  it('어린아이에게는 오지 않는다', () => {
    const s = newLife5(1); s.age = V.fortune.minAge - 1; s.hardship = 100;
    expect(fortuneP(s)).toBe(0);
  });
  it('가장 높은 가치관에 맞는 기연이 온다', () => {
    let hit = 0, match = 0;
    for (let i = 0; i < 4000; i++) {
      const s = newLife5(i); s.pending = null; s.age = 25; s.hero.standing = 'pirate'; s.hardship = 100000; addValues(s, { inquiry: 80 });
      if (rollFortune(s, rngOf(s.rng)) && (s.pending as Life5['pending'])?.kind === 'door') { hit++; if (TURNINGS.find((t) => t.id === (s.pending as { turning: string }).turning)!.fortuneOf === 'inquiry') match++; }
    }
    expect(hit).toBeGreaterThan(50);
    expect(match).toBe(hit);
  });
  it('기연을 받으면 시련이 절반으로 준다', () => {
    const s = newLife5(2); s.pending = null; s.age = 25; s.hero.standing = 'pirate'; s.hardship = 100000; addValues(s, { loyalty: 80 });
    for (let i = 0; i < 400 && !s.stats.fortunes; i++) rollFortune(s, rngOf(s.rng));
    expect(s.stats.fortunes).toBe(1);
    expect(s.hardship).toBe(100000 * V.hardship.afterFortune);
  });
  it('가치관마다 기연이 하나 이상 있다', () => {
    const f = new Set(TURNINGS.filter((t) => t.kind === 'fortune').map((t) => t.fortuneOf));
    expect(f.size).toBe(9);
  });
  it('이미 떠 있는 일이 있으면 기연이 그것을 덮지 않는다', () => {
    const s = newLife5(3); s.age = 25; s.hardship = 100000; addValues(s, { justice: 80 });
    const before = s.pending;
    for (let i = 0; i < 200; i++) expect(rollFortune(s, rngOf(s.rng))).toBe(false);
    expect(s.pending).toEqual(before);
  });
  it('기연에는 받는 문과 받지 않는 문이 있다', () => {
    for (const t of TURNINGS.filter((x) => x.kind === 'fortune')) {
      expect(t.doors.some((d) => d.label.includes('받지 않는다')), t.id).toBe(true);
      expect(t.doors.some((d) => d.label.includes('받는다') && !d.label.includes('받지')), t.id).toBe(true);
    }
  });
  it('성씨를 밝히는 기연은 숨은 성이 있는 사람에게만 온다', () => {
    const reveals = TURNINGS.filter((t) => t.kind === 'fortune' && t.doors.some((d) => d.fx.some((e) => e.op === 'reveal')));
    expect(reveals.length).toBeGreaterThan(0);
    for (const t of reveals) expect(t.when).toContainEqual({ c: 'secret', known: false });
  });
  it('기연의 받는 문은 스승을 들이면 돈으로 산 스승보다 높이 가르친다', () => {
    for (const t of TURNINGS.filter((x) => x.kind === 'fortune'))
      for (const d of t.doors) for (const e of d.fx)
        if (e.op === 'master') { expect(e.paid, t.id).toBe(false); expect(e.cap, t.id).toBeGreaterThan(V.growth.paidCap); }
  });
});

describe('고를 수 없는 불행', () => {
  it('불행은 여섯 가지 이상이고, 문이 없고, 하나하나가 시련을 올린다', () => {
    const ms = TURNINGS.filter((t) => t.kind === 'misfortune');
    expect(ms.length).toBeGreaterThanOrEqual(6);
    for (const t of ms) {
      expect(t.doors, t.id).toEqual([]);
      expect(t.fx?.some((e) => e.op === 'hardship' && e.add > 0), t.id).toBe(true);
      expect(t.weight, t.id).toBeGreaterThanOrEqual(0.01);
      expect(t.weight, t.id).toBeLessThanOrEqual(0.04);
    }
  });
  it('걸리면 시련이 오르고 무겁게 기록되며, 문은 뜨지 않는다', () => {
    let found: Life5 | null = null;
    for (let i = 0; i < 2000 && !found; i++) {
      const s = newLife5(i); s.pending = null; s.age = 30; s.hero.standing = 'pirate';
      const h0 = s.hardship; const log0 = s.log.length;
      if (rollMisfortune(s, rngOf(s.rng))) {
        expect(s.hardship).toBeGreaterThan(h0);
        expect(s.log.slice(log0).some((l) => l.weight === 'heavy')).toBe(true);
        expect((s.pending as Life5['pending'])?.kind).not.toBe('door');
        found = s;
      }
    }
    expect(found).not.toBeNull();
  });
  it('불행이 예약하는 큰 계기는 정해진 목록 안에 있다', () => {
    const allowed = ['moment_loss', 'moment_ruin', 'moment_betrayed', 'moment_defeat', 'moment_saved', 'moment_limb', 'moment_child', 'moment_demoted'];   // 과제 11이 둘을 더했다
    for (const t of TURNINGS.filter((x) => x.kind === 'misfortune'))
      for (const e of t.fx ?? []) if (e.op === 'queue') expect(allowed, t.id).toContain(e.turning);
  });
  it('한 인생에 평균 두세 번쯤 겪는다', () => {
    let total = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const s = newLife5(i); s.pending = null; s.hero.standing = 'pirate';
      for (let age = 5; age <= 65; age++) { s.age = age; s.pending = null; if (rollMisfortune(s, rngOf(s.rng))) total++; }
    }
    expect(total / N).toBeGreaterThanOrEqual(1.5);
    expect(total / N).toBeLessThanOrEqual(4.5);
  });
  it('한 번뿐인 불행은 다시 오지 않는다', () => {
    const once = TURNINGS.filter((t) => t.kind === 'misfortune' && t.repeat === 'once').map((t) => t.id);
    const s = newLife5(5); s.hero.standing = 'pirate';
    for (const id of once) s.seen[id] = 10;
    for (let age = 11; age < 200; age++) {
      s.age = age; s.pending = null;
      const seen = { ...s.seen };
      rollMisfortune(s, rngOf(s.rng));
      for (const id of once) expect(s.seen[id]).toBe(seen[id]);
    }
  });
});

describe('해가 바뀔 때', () => {
  it('오래 흘려도 불행과 기연이 섞여 일어나고 상태가 망가지지 않는다', () => {
    let fortunes = 0, misfortunes = 0;
    for (let seed = 1; seed <= 40; seed++) {
      let s = newLife5(seed);
      for (let i = 0; i < 4 * 50 && s.hero.alive; i++) {
        if (s.pending?.kind === 'door') s = reduce5(s, { type: 'answer', index: s.pending.doors.findIndex((d) => !d.locked) });
        else if (s.pending?.kind === 'fight') s = reduce5(s, { type: 'answer', index: 1 });   // 물러난다
        else if (s.pending?.kind === 'battle') s = reduce5(s, { type: 'answer', index: 0 });
        else if (s.pending) break;
        s = reduce5(s, { type: 'step' });
      }
      fortunes += s.stats.fortunes;
      misfortunes += Object.keys(s.seen).filter((id) => TURNINGS.find((t) => t.id === id)?.kind === 'misfortune').length;
    }
    expect(misfortunes).toBeGreaterThan(0);
    expect(fortunes).toBeGreaterThan(0);
  });
});

describe('고아의 비밀 성씨', () => {
  it('밝혀지면 성씨를 되찾고 잠재 능력이 깨어난다', () => {
    let s: Life5 | null = null;
    for (let i = 0; i < 3000 && !s; i++) { const x = newLife5(i); if (x.hero.secretSurname) s = x; }
    const before = Object.values(s!.hero.base).reduce((a, b) => a + b, 0);
    const name = s!.hero.secretSurname;
    revealSurname(s!);
    expect(s!.hero.surname).toBe(name);
    expect(s!.hero.secretSurname).toBeNull();
    expect(Object.values(s!.hero.base).reduce((a, b) => a + b, 0)).toBeGreaterThan(before);
    expect(s!.flags).toContain('surnameKnown');
  });
  it('밝혀지는 일은 무겁게 기록되고, reveal 효과도 같은 일을 한다', () => {
    let s: Life5 | null = null;
    for (let i = 0; i < 3000 && !s; i++) { const x = newLife5(i); if (x.hero.secretSurname) s = x; }
    const name = s!.hero.secretSurname!;
    const log0 = s!.log.length;
    applyFx(s!, [{ op: 'reveal' }]);
    expect(s!.hero.surname).toBe(name);
    expect(s!.flags).toContain('surnameKnown');
    expect(s!.log.slice(log0).some((l) => l.weight === 'heavy' && l.text.includes(name))).toBe(true);
  });
  it('밝혀지는 기록의 조사가 이름의 받침에 맞는다', () => {
    let s0: Life5 | null = null;
    for (let i = 0; i < 3000 && !s0; i++) { const x = newLife5(i); if (x.hero.secretSurname) s0 = x; }
    for (const [given, tail] of [['루피', '」였다'], ['진', '」이었다']] as const) {
      const s: Life5 = JSON.parse(JSON.stringify(s0));
      s.hero.name = given;
      revealSurname(s);
      const line = s.log[s.log.length - 1].text;
      expect(line, given).toContain(`${given}${tail}`);
      expect(line).not.toMatch(/\(이\)/);
    }
  });
  it('숨은 성이 없으면 아무 일도 없다', () => {
    let s: Life5 | null = null;
    for (let i = 0; i < 3000 && !s; i++) { const x = newLife5(i); if (!x.hero.secretSurname) s = x; }
    const copy = JSON.parse(JSON.stringify(s));
    revealSurname(s!);
    expect(s).toEqual(copy);
  });
});
