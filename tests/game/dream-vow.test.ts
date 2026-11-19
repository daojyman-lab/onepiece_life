// 꿈의 서약: 꿈을 품을 때 약속하고, 길목을 지날 때마다 강해지며, 꿈을 바꾸지 않고 이어 갈수록 보상이 커진다.
import { describe, expect, it } from 'vitest';
import { dreamVowView, dreamVowYear } from '../../src/core/dream-vow';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { DREAM_VOW_REWARD, DREAM_VOWS } from '../../src/data/dream-vows';
import { DREAM_IDS } from '../../src/data/dreams';

const fresh = (seed = 5) => { const s = newLife5(seed); s.pending = null; s.age = 15; return s; };

describe('꿈의 서약', () => {
  it('꿈마다 5~10개의 길목이 있고, 마지막 길목은 꿈을 이룬 것이다', () => {
    for (const id of DREAM_IDS) {
      const stages = DREAM_VOWS[id].stages;
      expect(stages.length, id).toBeGreaterThanOrEqual(5);
      expect(stages.length, id).toBeLessThanOrEqual(10);
      expect(stages.at(-1)!.all, id).toEqual([{ k: 'met' }]);
      expect(stages.slice(0, -1).every((st) => !st.all.some((c) => c.k === 'met')), id).toBe(true);
    }
  });

  it('꿈을 품으면 누군가에게(없으면 스스로에게) 약속한다', () => {
    const s = fresh();
    applyFx(s, [{ op: 'dream', id: 'pirateKing' }]);
    expect(s.log.some((l) => l.text.includes('해적왕이 되겠다고'))).toBe(true);
    expect(dreamVowView(s)).toMatchObject({ cleared: 0, total: DREAM_VOWS.pirateKing.stages.length, next: '바다로 나선다', streak: 0 });
  });

  it('길목을 지나면 능력치와 숙련이 오르고, 한 해에 한 길목만 지난다', () => {
    const s = fresh();
    applyFx(s, [{ op: 'dream', id: 'pirateKing' }]);
    s.hero.standing = 'pirate'; s.flags.push('ship');
    const wil = s.hero.base.wil;
    dreamVowYear(s);
    expect(dreamVowView(s)).toMatchObject({ cleared: 1, streak: 1 });
    expect(s.hero.base.wil).toBe(wil + DREAM_VOW_REWARD.stat);
    dreamVowYear(s);
    expect(dreamVowView(s)).toMatchObject({ cleared: 2, streak: 2 });
    dreamVowYear(s);                                   // 셋째 길목(수배서)은 아직
    expect(dreamVowView(s)?.cleared).toBe(2);
  });

  it('꿈을 바꾸어도 얻은 힘은 남고 벌은 없다. 연속만 새 꿈에서 다시 센다', () => {
    const s = fresh();
    applyFx(s, [{ op: 'dream', id: 'pirateKing' }]);
    s.hero.standing = 'pirate';
    dreamVowYear(s);
    const wil = s.hero.base.wil;
    applyFx(s, [{ op: 'dream', id: 'worldEnd' }]);
    expect(s.hero.base.wil).toBe(wil);
    expect(dreamVowView(s)).toMatchObject({ cleared: 0, streak: 0 });
    // 옛 꿈으로 돌아가도 이미 받은 길목은 다시 받지 않는다
    applyFx(s, [{ op: 'dream', id: 'pirateKing' }]);
    expect(dreamVowView(s)?.cleared).toBe(1);
  });

  it('연속이 쌓일수록 숙련 보상이 커지고, 정해진 연속에서 능력치를 하나 더 준다', () => {
    const s = fresh();
    applyFx(s, [{ op: 'dream', id: 'treasure' }]);
    const luk = s.hero.base.luk;
    s.hero.money = 20_000_000;
    for (let i = 0; i < 5; i++) dreamVowYear(s);
    const bonus = DREAM_VOW_REWARD.streakStat.filter((n) => n <= 5).length;
    expect(s.hero.base.luk).toBe(luk + 5 * DREAM_VOW_REWARD.stat + bonus);
    expect(s.log.some((l) => l.text.includes('꿈을 지킨 연속 5'))).toBe(true);
  });

  it('꿈을 바꾸지 않고 모든 길목을 지나면 그 갈래의 단계가 하나 오른다', () => {
    const s = fresh();
    s.growth.path = 'sword';
    applyFx(s, [{ op: 'dream', id: 'treasure' }]);
    s.hero.money = 40_000_000;
    const total = DREAM_VOWS.treasure.stages.length;
    for (let i = 0; i < total + 2; i++) { dreamVowYear(s); if (s.dream && s.dream.done === null && s.hero.money >= 30_000_000) s.dream.done = s.age; }
    expect(dreamVowView(s)).toMatchObject({ cleared: total, streak: total, next: null });
    expect(s.log.some((l) => l.text.includes('한 번도 바꾸지 않고 끝까지 지켰다'))).toBe(true);
  });

  it('옛 저장(꿈의 서약 칸 없음)도 이어서 플레이한다', () => {
    const s = fresh();
    applyFx(s, [{ op: 'dream', id: 'peace' }]);
    const old = JSON.parse(JSON.stringify(s));
    delete old.dreamVow;
    const loaded = normalizeLife5(old)!;
    expect(loaded).not.toBeNull();
    expect(dreamVowView(loaded)).toMatchObject({ cleared: 0, streak: 0 });
  });
});
