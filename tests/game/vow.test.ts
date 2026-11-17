import { describe, expect, it } from 'vitest';
import { applyFx } from '../../src/core/fx';
import { normalizeLife5 } from '../../src/core/load';
import { newLife5 } from '../../src/core/state';
import { openTurning } from '../../src/core/turning';
import { reduce5 } from '../../src/core/reduce';
import { EP_SKYPIEA } from '../../src/data/episodes/skypiea';
import type { Life5 } from '../../src/core/types';

const vowId = 'sky_tika_guard';
function eligibleLife() {
  const s = newLife5(41);
  s.pending = null;
  s.values.loyalty = 55;
  s.flags.push('ep_skypiea_tika_trust', 'ep_skypiea_b_ledger');
  s.growth.pref.sword = 20;
  return s;
}

describe('서약', () => {
  it('깊은 신념과 앞선 인연이 없으면 서약할 수 없다', () => {
    const s = newLife5(41);
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    expect(s.vows?.active).toBeNull();
    s.values.loyalty = 55;
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    expect(s.vows?.active).toBeNull();
  });

  it('서약은 대상과 약속을 저장하고 동시에 둘을 진행하지 않는다', () => {
    const s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }, { op: 'vowStart', id: vowId }]);
    expect(s.vows?.active).toMatchObject({ id: vowId, value: 'loyalty', target: '티카' });
    expect(s.vows?.history).toEqual([]);
  });

  it('준비와 결전의 결과가 모자라면 보상 없이 실패한다', () => {
    const s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    applyFx(s, [{ op: 'vowResolve', id: vowId }]);
    expect(s.vows?.active).toBeNull();
    expect(s.vows?.history).toEqual([{ id: vowId, result: 'failed' }]);
    expect(s.growth.mastery.sword).toBe(0);
  });

  it('피난 준비와 결전 뒤 피난처까지 완성해야 주력 숙련을 얻고 재수령할 수 없다', () => {
    const s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    s.flags.push('ep_skypiea_b_evac', 'ep_skypiea_b_vow_prepared', 'ep_skypiea_b_vow_refuge');
    applyFx(s, [{ op: 'vowResolve', id: vowId }, { op: 'vowStart', id: vowId }, { op: 'vowResolve', id: vowId }]);
    expect(s.vows?.history).toEqual([{ id: vowId, result: 'kept' }]);
    expect(s.growth.mastery.sword).toBe(25);
  });

  it('도란과 거래하면 피난을 준비했어도 서약에 실패한다', () => {
    const s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    s.flags.push('ep_skypiea_b_evac', 'ep_skypiea_b_vow_prepared', 'ep_skypiea_b_vow_refuge', 'ep_skypiea_b_deal');
    applyFx(s, [{ op: 'vowResolve', id: vowId }]);
    expect(s.vows?.history).toEqual([{ id: vowId, result: 'failed' }]);
  });

  it('다른 장면에서 피난 표시를 얻어도 준비 기회를 바치지 않았다면 실패한다', () => {
    const s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    s.flags.push('ep_skypiea_b_evac', 'ep_skypiea_b_vow_refuge');
    applyFx(s, [{ op: 'vowResolve', id: vowId }]);
    expect(s.vows?.history).toEqual([{ id: vowId, result: 'failed' }]);
  });

  it('서약 도중 죽으면 보상 없이 실패로 기록한다', () => {
    const s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }, { op: 'die', cause: '결전' }]);
    expect(s.vows?.active).toBeNull();
    expect(s.vows?.history).toEqual([{ id: vowId, result: 'failed' }]);
  });

  it('진행 코어가 준비 선택의 결과를 활성 서약에 기록한다', () => {
    let s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    s.pending = null;
    const scene = EP_SKYPIEA.find((t) => t.id === 'ep_skypiea_b6p')!;
    expect(openTurning(s, scene)).toBe(true);
    const p = s.pending as unknown as Extract<Life5['pending'], { kind: 'door' }>;
    s = reduce5(s, { type: 'answer', index: p.doors.findIndex((d) => d.label.includes('구름길을 닦는다')) });
    expect(s.vows?.active?.progress).toContain('피난길 준비');
  });

  it('서약을 건 장편을 떠나면 진행 코어가 실패로 결산한다', () => {
    let s = eligibleLife();
    s.hero.island = '엔젤섬';
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    s.hero.island = '로그타운';
    s = reduce5(s, { type: 'step' });
    expect(s.vows?.active).toBeNull();
    expect(s.vows?.history).toEqual([{ id: vowId, result: 'failed' }]);
  });

  it('v6.8 저장에 서약 칸이 없어도 이어서 플레이한다', () => {
    const old = newLife5(41) as ReturnType<typeof newLife5> & { vows?: unknown };
    delete old.vows;
    expect(normalizeLife5(JSON.parse(JSON.stringify(old)))?.vows).toEqual({ active: null, history: [] });
  });

  it('초기 서약 저장의 진행 칸이 없어도 현재 위치에서 이어 간다', () => {
    const s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    const old = JSON.parse(JSON.stringify(s));
    delete old.vows.active.progress;
    delete old.vows.active.island;
    const loaded = normalizeLife5(old);
    expect(loaded?.vows?.active?.progress).toEqual([]);
    expect(loaded?.vows?.active?.island).toBe(s.hero.island);
  });
});

describe('하늘섬 서약 장편', () => {
  const scene = (id: string) => EP_SKYPIEA.find((t) => t.id === id)!;
  it('제안 뒤 서약을 먼저 묻고, 성공 결말에서만 피난처 증표를 얻는다', () => {
    const s = eligibleLife();
    expect(openTurning(s, scene('ep_skypiea_b6'))).toBe(true);
    const proposal = s.pending;
    expect(proposal?.kind).toBe('door');
    if (proposal?.kind !== 'door') return;
    const reject = proposal.doors.findIndex((d) => d.label.includes('모자를 집어'));
    const after = reduce5(s, { type: 'answer', index: reject });
    expect(after.queue).toContain('ep_skypiea_b6v');
    after.pending = null;
    expect(openTurning(after, scene('ep_skypiea_b6v'))).toBe(true);
    const vowWindow = after.pending as unknown as Extract<Life5['pending'], { kind: 'door' }>;
    expect(vowWindow.kind).toBe('door');
    const pledge = vowWindow.doors.findIndex((d) => d.label.includes('티카'));
    expect(vowWindow.doors[pledge].locked).toBeNull();
    const vowed = reduce5(after, { type: 'answer', index: pledge });
    expect(vowed.vows?.active?.id).toBe(vowId);
    expect(vowed.queue).toContain('ep_skypiea_b6p');
    expect(scene('ep_skypiea_b8').doors.some((d) => d.fx.some((e) => e.op === 'flag' && e.id === 'ep_skypiea_b_vow_refuge'))).toBe(true);
  });

  it('피난길을 닦고 결전 뒤 피난처를 연 플레이에서 작별 시 보상을 지급한다', () => {
    let s = eligibleLife();
    applyFx(s, [{ op: 'vowStart', id: vowId }]);
    const answer = (id: string, label: string) => {
      s.pending = null;
      expect(openTurning(s, scene(id))).toBe(true);
      const p = s.pending as unknown as Extract<Life5['pending'], { kind: 'door' }>;
      const index = p.doors.findIndex((d) => d.label.includes(label));
      expect(index).toBeGreaterThanOrEqual(0);
      s = reduce5(s, { type: 'answer', index });
    };
    answer('ep_skypiea_b6p', '구름길을 닦는다');
    answer('ep_skypiea_b8', '숨을 곳을 연다');
    expect(s.vows?.active?.id).toBe(vowId);
    answer('ep_skypiea_b9', '깃 장식을 받는다');
    expect(s.vows?.history).toEqual([{ id: vowId, result: 'kept' }]);
    expect(s.growth.mastery.sword).toBe(25);
  });
});
