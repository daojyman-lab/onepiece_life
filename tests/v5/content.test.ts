// tests/v5/content.test.ts — 사건 데이터의 짜임. 내용 과제마다 개수 검사를 더한다.
import { describe, expect, it } from 'vitest';
import { TURNINGS } from '../../src/v5/data/turnings';
import { VALUE_NAME } from '../../src/v5/data/values';
import { RELATION_KIND } from '../../src/v5/data/words';
import type { Fx, Need } from '../../src/v5/core/types';

const doorTurnings = TURNINGS.filter((t) => t.kind === 'door' || t.kind === 'moment' || t.kind === 'fortune');
/** 글에 이 낱말이 나오면 이 필요가 적혀 있어야 한다 */
const WORD_NEEDS: [RegExp, Need][] = [
  [/동료(들)?(을|를|이|가|에게|와|과|의)/, 'crew'], [/아내|남편|배우자/, 'spouse'], [/자식|아들|딸/, 'child'],
  [/동생|형제|누이|오빠|언니|누나/, 'sibling'], [/헤엄|바다에 뛰어|바다로 뛰어/, 'swim'],
];
/** 낱말은 나오지만 필요가 아닌 경우 (전환점 id → 까닭). 여기에 더할 때는 까닭을 적는다 */
const EXEMPT: Record<string, string> = {
  after_fight: '「동료가 되라고 손을 내민다」는 쓰러뜨린 적을 동료로 얻는 문이다',
};
/** 효과 목록 안의 모든 효과 (chance의 then · else까지) */
const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);

describe('사건 데이터의 짜임', () => {
  it('id가 겹치지 않는다', () => {
    expect(new Set(TURNINGS.map((t) => t.id)).size).toBe(TURNINGS.length);
  });
  it('문은 2~3개이고, 특별한 문은 많아야 하나 더', () => {
    for (const t of doorTurnings) {
      const plain = t.doors.filter((d) => !d.special).length, special = t.doors.length - plain;
      expect(plain, t.id).toBeGreaterThanOrEqual(2); expect(plain, t.id).toBeLessThanOrEqual(3); expect(special, t.id).toBeLessThanOrEqual(1);
    }
  });
  it('문의 글에 가치관의 이름이 없다', () => {
    const names = Object.values(VALUE_NAME);
    for (const t of doorTurnings) for (const d of t.doors) for (const n of names) expect(`${d.label} ${d.hint}`, `${t.id}`).not.toContain(n);
  });
  it('글이 전제하는 것은 needs에 적혀 있다', () => {
    for (const t of doorTurnings) {
      if (EXEMPT[t.id]) continue;
      for (const [re, need] of WORD_NEEDS) {
        if (re.test(`${t.title} ${t.body}`)) expect(t.needs ?? [], `${t.id} 본문 → ${need}`).toContain(need);
        for (const d of t.doors) if (re.test(`${d.label} ${d.hint}`)) expect([...(t.needs ?? []), ...(d.needs ?? [])], `${t.id} 문 '${d.label}' → ${need}`).toContain(need);
      }
    }
  });
  it('문이 그 필요한 것을 주는 사건은 예외에 까닭이 적혀 있다', () => {
    for (const [id, why] of Object.entries(EXEMPT)) { expect(TURNINGS.some((t) => t.id === id), id).toBe(true); expect(why.length, id).toBeGreaterThan(3); }
  });
  it('가족을 만드는 사건은 관계의 갈래 낱말만 쓴다', () => {
    const words = Object.values(RELATION_KIND).flat();
    for (const t of TURNINGS) for (const e of [...allFx(t.fx), ...t.doors.flatMap((d) => allFx(d.fx))])
      if (e.op === 'person' && e.kind === 'family') expect(words, `${t.id} '${e.relation}'`).toContain(e.relation);
  });
});
