import { describe, expect, it } from 'vitest';
import { EPISODE_TURNINGS } from '../../src/data/episodes';
import type { Fx } from '../../src/core/types';

function effects(fx: Fx[] = []): Fx[] {
  return fx.flatMap((e) => e.op === 'chance' ? [e, ...effects(e.then), ...effects(e.else)] : [e]);
}

describe('v6.9 주요 섬 시나리오', () => {
  it('원작의 결판을 가로채는 보스전이 없다', () => {
    const reserved = new Set(['b_buggy', 'b_mr2', 'b_crocodile', 'b_mr1_ab', 'b_enel', 'b_hody', 'b_doflamingo', 'b_king', 'b_kaido', 'b_satori', 'b_shura', 'b_gedatsu', 'b_ohm', 'b_dosun', 'b_zeo']);
    for (const t of EPISODE_TURNINGS) for (const e of effects([...t.fx ?? [], ...t.doors.flatMap((d) => effects(d.fx))])) {
      if (e.op === 'fight') expect(reserved.has(e.foe), `${t.id}: ${e.foe}`).toBe(false);
    }
  });

  it('원작에 없는 후일담을 확정된 사실처럼 말하지 않는다', () => {
    const prose = EPISODE_TURNINGS.map((t) => `${t.title} ${t.body} ${t.doors.map((d) => `${d.label} ${d.hint}`).join(' ')}`).join('\n');
    expect(prose).not.toContain('임펠 다운을 나온 크로커다일');
    expect(prose).not.toContain('기억의 약');
    expect(prose).not.toContain('실패한 인조 열매를 갈아 넣은 약');
    expect(prose).not.toContain('열린 항구');
  });

  it('여섯 섬 후일담은 결전에서도 비전투 해결책을 고를 수 있다', () => {
    const routes: Record<string, string> = {
      ep_loguetown_c8: 'ep_loguetown_c8w',
      ep_alabasta_a9: 'ep_alabasta_a10',
      ep_skypiea_a7: 'ep_skypiea_a8',
      ep_fishman_a_8: 'ep_fishman_a_win',
      ep_dressrosa_c8: 'ep_dressrosa_c8w',
      ep_wano_after_8: 'ep_wano_after_end1',
    };
    for (const [id, destination] of Object.entries(routes)) {
      const t = EPISODE_TURNINGS.find((scene) => scene.id === id);
      expect(t, id).toBeDefined();
      expect(t?.doors.some((d) => {
        const fx = effects(d.fx);
        return fx.some((e) => e.op === 'queue' && e.turning === destination) && !fx.some((e) => e.op === 'fight');
      }), id).toBe(true);
    }
  });
});
