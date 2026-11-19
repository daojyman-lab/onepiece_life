import { describe, expect, it } from 'vitest';
import { TURNING_BY_ID, TURNINGS } from '../../src/data/turnings';
import { applyFx } from '../../src/core/fx';
import { newLife5 } from '../../src/core/state';
import type { Fx } from '../../src/core/types';

// 조건이 충족된 문에서 효과 적용기가 직접 결과를 기록하는 연산.
const SELF_NARRATING = new Set<string>(['buyWeapon', 'serviceWeapon', 'beginStyle', 'adoptStyle', 'refineStyle', 'welcomeSibling', 'siblingReunion']);

// 확률 분기의 모든 길을 따라간다. 전투와 엔딩은 별도 화면이 곧바로 반응한다.
function reactionPaths(fx: Fx[], reacted = false): boolean[] {
  let paths = [reacted];
  for (const op of fx) {
    if (op.op === 'chance') {
      paths = paths.flatMap((seen) => [
        ...reactionPaths(op.then, seen),
        ...reactionPaths(op.else ?? [], seen),
      ]);
    } else if (op.op === 'log' || op.op === 'fight' || op.op === 'die' || SELF_NARRATING.has(op.op)) {
      paths = paths.map(() => true);
    }
  }
  return paths;
}

function narration(fx: Fx[]): string[] {
  return fx.flatMap((op) => op.op === 'log' ? [op.text]
    : op.op === 'chance' ? [...narration(op.then), ...narration(op.else ?? [])] : []);
}

const normalized = (text: string): string => text.trim().replace(/[.!?。]+$/, '');

// RNG에 기대지 않고 중첩된 확률의 모든 경로를 실제 효과 적용기로 재생한다.
function effectPaths(fx: Fx[]): Fx[][] {
  return fx.reduce<Fx[][]>((paths, op) => op.op === 'chance'
    ? paths.flatMap((path) => [
        ...(op.p > 0 ? effectPaths(op.then) : []),
        ...(op.p < 1 ? effectPaths(op.else ?? []) : []),
      ].map((branch) => [...path, ...branch]))
    : paths.map((path) => [...path, op]), [[]]);
}

function chanceGaps(fx: Fx[]): string[] {
  return fx.flatMap((op) => op.op === 'chance'
    ? [...(reactionPaths(op.then).some((reacted) => !reacted) ? ['성공'] : []),
        ...(reactionPaths(op.else ?? []).some((reacted) => !reacted) ? ['실패'] : []),
        ...chanceGaps(op.then), ...chanceGaps(op.else ?? [])] : []);
}

describe('선택 후 장면', () => {
  it('조건부 자동 결과도 모든 확률 경로에 반응을 남긴다', () => {
    const missing = TURNINGS.flatMap((t) => t.automatic
      ? [
          ...(reactionPaths(t.automatic.fx).some((seen) => !seen) ? [t.id] : []),
          ...chanceGaps(t.automatic.fx).map((branch) => `${t.id}: ${branch}`),
        ] : []);
    expect(missing).toEqual([]);
  });

  it('뒤따르는 장면은 존재하며 실제 선택 또는 자동 결과를 가진다', () => {
    const missing = TURNINGS.flatMap((t) => [
      ...t.doors.map((d) => d.fx), ...(t.automatic ? [t.automatic.fx] : []),
    ].flatMap(effectPaths).flatMap((path) => path.flatMap((fx) => {
      const targets = fx.op === 'queue' ? [fx.turning]
        : fx.op === 'fight' ? Object.values(fx.next ?? {}) : [];
      return targets.filter((id) => {
        const next = TURNING_BY_ID[id];
        // openTurning은 automatic보다 먼저 열린 문이 있는지 검사한다.
        return !next || !next.doors.length;
      }).map((id) => `${t.id} → ${id}`);
    })));
    expect(missing).toEqual([]);
  });

  it('눈만 남아 있는 무작위 손실 경로에서 팔다리를 잃었다고 단정하지 않는다', () => {
    const wrong: string[] = [];
    for (const t of TURNINGS) for (const [index, d] of t.doors.entries()) {
      for (const path of effectPaths(d.fx)) {
        if (!path.some((fx) => fx.op === 'loseLimb' && fx.limb === 'random')) continue;
        const s = newLife5(1); s.pending = null;
        for (const limb of ['armL', 'armR', 'legL', 'legR'] as const) s.hero.limbs[limb] = 'lost';
        const from = s.seq;
        applyFx(s, path);
        expect(s.hero.limbs.eyeL === 'lost' || s.hero.limbs.eyeR === 'lost').toBe(true);
        if (s.log.some((line) => line.id >= from && /팔다리 하나를 잃|잃은 팔 또는 다리/.test(line.text))) wrong.push(`${t.id}#${index}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('혼자 나선 거물 사냥의 모든 결과는 없는 동료를 만들어 내지 않는다', () => {
    for (const path of effectPaths(TURNING_BY_ID.hunter_big_game.doors[0].fx)) {
      const s = newLife5(1); s.pending = null; s.people = [];
      const from = s.seq;
      applyFx(s, path);
      expect(s.log.filter((line) => line.id >= from).map((line) => line.text).join('\n')).not.toContain('동료');
    }
  });

  it('배만 가진 해적이 대선단에 도전했다 실패해도 없는 선원이 구해 주지 않는다', () => {
    for (const path of effectPaths(TURNING_BY_ID.pirate_big_fleet.doors[2].fx)) {
      // 성공하면 선원을 실제로 얻는다. 실패의 두 경로에는 동료 효과가 없다.
      if (path.some((fx) => fx.op === 'person')) continue;
      const s = newLife5(1); s.pending = null; s.people = []; s.flags.push('ship');
      const from = s.seq;
      applyFx(s, path);
      expect(s.log.filter((line) => line.id >= from).map((line) => line.text).join('\n')).not.toContain('남은 선원');
    }
  });

  it('분대 실전의 체력 손실은 주인공이 다친 장면으로 설명한다', () => {
    for (const path of effectPaths(TURNING_BY_ID.mn_squad_drill.doors[2].fx)) {
      const s = newLife5(1); s.pending = null; s.hero.hp = 100;
      const from = s.seq;
      applyFx(s, path);
      if (s.hero.hp < 100) expect(s.log.filter((line) => line.id >= from).some((line) => line.text.includes(s.hero.name))).toBe(true);
    }
  });

  it('노름에서 건 돈만 잃었다면 남은 재산까지 사라졌다고 말하지 않는다', () => {
    for (const path of effectPaths(TURNING_BY_ID.kid_dice.doors[0].fx)) {
      const s = newLife5(1); s.pending = null; s.hero.money = 50000;
      const from = s.seq;
      applyFx(s, path);
      expect(s.hero.money).toBeGreaterThan(0);
      expect(s.log.filter((line) => line.id >= from).map((line) => line.text).join('\n')).not.toContain('빈 주머니');
    }
  });

  it('돈이 없는 아이의 노름 실패는 소유하지 않은 동전이 넘어갔다고 말하지 않는다', () => {
    for (const path of effectPaths(TURNING_BY_ID.kid_dice.doors[0].fx)) {
      const s = newLife5(1); s.pending = null; s.hero.money = 0;
      const from = s.seq;
      applyFx(s, path);
      if (s.hero.money === 0) expect(s.log.filter((line) => line.id >= from).map((line) => line.text).join('\n')).not.toContain('내놓은 동전');
    }
  });
  it('모든 선택과 확률 분기는 성향 문구 외에 즉시 보이는 반응을 남긴다', () => {
    const missing = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      reactionPaths(door.fx).some((reacted) => !reacted) ? [`${turning.id}#${index}: ${door.label}`] : [],
    ));
    expect(missing.slice(0, 30).concat(missing.length > 30 ? [`외 ${missing.length - 30}개`] : [])).toEqual([]);
  });

  it('선택 전에 보인 힌트를 선택 후 장면으로 되풀이하지 않는다', () => {
    const copied = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      narration(door.fx).some((text) => normalized(text) === normalized(door.hint))
        ? [`${turning.id}#${index}: ${door.label}`] : [],
    ));
    expect(copied.slice(0, 30).concat(copied.length > 30 ? [`외 ${copied.length - 30}개`] : [])).toEqual([]);
  });

  it('확률로 갈린 결과마다 각각의 반응을 보여 준다', () => {
    const missing = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      chanceGaps(door.fx).map((branch) => `${turning.id}#${index}: ${branch}`),
    ));
    expect(missing.slice(0, 30).concat(missing.length > 30 ? [`외 ${missing.length - 30}개`] : [])).toEqual([]);
  });

  it('반응 문장에 깨진 글자가 없다', () => {
    const broken = TURNINGS.flatMap((turning) => turning.doors.flatMap((door, index) =>
      narration(door.fx).some((text) => /�|\?{3,}/.test(text)) ? [`${turning.id}#${index}`] : [],
    ));
    expect(broken).toEqual([]);
  });
});
