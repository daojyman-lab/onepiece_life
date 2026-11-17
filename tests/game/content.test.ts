// tests/game/content.test.ts — 사건 데이터의 짜임. 내용 과제마다 개수 검사를 더한다.
import { describe, expect, it } from 'vitest';
import { TURNINGS } from '../../src/data/turnings';
import { VALUE_IDS, VALUE_NAME } from '../../src/data/values';
import { RELATION_KIND } from '../../src/data/words';
import type { Fx, Need, ValueId } from '../../src/core/types';
import { WORD_NEEDS } from './wordNeeds';

const doorTurnings = TURNINGS.filter((t) => t.kind === 'door' || t.kind === 'moment' || t.kind === 'fortune');
/** 낱말은 나오지만 그 필요가 아닌 경우 (전환점 id → 걸리지 않게 할 필요와 까닭). 여기에 더할 때는 까닭을 적는다 */
const EXEMPT: Record<string, { need: Need; why: string }> = {
  after_fight: { need: 'crew', why: '「동료가 되라고 손을 내민다」는 쓰러뜨린 적을 동료로 얻는 문이다' },
  path_sea_newworld: { need: 'swim', why: '「바다 밑으로」는 코팅한 배로 내려가는 길이다. 헤엄이 아니다' },
};
const exempt = (id: string, need: Need) => EXEMPT[id]?.need === need;
/** 효과 목록 안의 모든 효과 (chance의 then · else까지) */
const allFx = (fx: Fx[] = []): Fx[] => fx.flatMap((e) => e.op === 'chance' ? [e, ...allFx(e.then), ...allFx(e.else)] : [e]);

describe('선의 영입', () => {
  it('떠돌이 의사를 태우면 치료 능력을 가진 선의가 된다', () => {
    const event = TURNINGS.find((t) => t.id === 'pirate_doctor');
    expect(event?.kind).toBe('door');
    if (event?.kind !== 'door') return;
    for (const door of [event.doors[0], event.doors[2]]) {
      const doctor = allFx(door.fx).find((fx) => fx.op === 'person' && fx.kind === 'crew');
      expect(doctor).toMatchObject({ op: 'person', role: 'medic' });
    }
  });
});

describe('낱말 검사 자체', () => {
  const hits = (text: string) => WORD_NEEDS.filter(([re]) => re.test(text)).map(([, n]) => n);
  it('가족 · 동료 · 헤엄을 전제하는 글은 잡는다', () => {
    const must: [string, Need][] = [
      ['아내가 기다린다', 'spouse'], ['남편의 배', 'spouse'], ['그의 아들', 'child'], ['막내딸이 운다', 'child'], ['외동아들', 'child'],
      ['딸이 태어났다', 'child'], ['자식을 맡긴다', 'child'], ['동생에게 편지를 쓴다', 'sibling'], ['누이의 손', 'sibling'], ['형제가 다툰다', 'sibling'],
      ['동료를 먼저 보낸다', 'crew'], ['옛 동료가 웃는다', 'crew'], ['바다에 뛰어든다', 'swim'], ['물에 뛰어들어', 'swim'],
      ['바다 밑으로 피한다', 'swim'], ['헤엄쳐 간다', 'swim'],
    ];
    for (const [text, need] of must) expect(hits(text), text).toContain(need);
  });
  it('낱말 속에 우연히 든 글자는 잡지 않는다', () => {
    const mustNot = ['청혼을 받아들인다', '손님을 맞아들인다', '말을 알아들었다', '건달을 쫓아내는', '인간을 몰아내자', '딸기를 판다', '딸꾹질', '몸을 누이고', '공동료비'];
    for (const text of mustNot) expect(hits(text), text).toEqual([]);
  });
});

describe('사건 데이터의 짜임', () => {
  it('id가 겹치지 않는다', () => {
    expect(new Set(TURNINGS.map((t) => t.id)).size).toBe(TURNINGS.length);
  });
  it('문은 2~3개이고, 특별한 문은 많아야 하나 더', () => {
    for (const t of doorTurnings) {
      const plain = t.doors.filter((d) => !d.special).length, special = t.doors.length - plain;
      // 크로커다일의 거절은 거래를 제안하지 않고 끝내는 강제 장면이다.
      if (t.id === 'crocodile_port_dismissed') { expect(plain).toBe(1); continue; }
      expect(plain, t.id).toBeGreaterThanOrEqual(2); expect(plain, t.id).toBeLessThanOrEqual(3); expect(special, t.id).toBeLessThanOrEqual(1);
    }
  });
  it('문의 글에 가치관의 이름이 없다', () => {
    const names = Object.values(VALUE_NAME);
    for (const t of doorTurnings) for (const d of t.doors) for (const n of names) expect(`${d.label} ${d.hint}`, `${t.id}`).not.toContain(n);
  });
  it('글이 전제하는 것은 needs에 적혀 있다', () => {
    for (const t of doorTurnings) {
      for (const [re, need] of WORD_NEEDS) {
        if (exempt(t.id, need)) continue;
        if (re.test(`${t.title} ${t.body}`)) expect(t.needs ?? [], `${t.id} 본문 → ${need}`).toContain(need);
        for (const d of t.doors) if (re.test(`${d.label} ${d.hint}`)) expect([...(t.needs ?? []), ...(d.needs ?? [])], `${t.id} 문 '${d.label}' → ${need}`).toContain(need);
      }
    }
  });
  it('문이 그 필요한 것을 주는 사건은 예외에 까닭이 적혀 있다', () => {
    for (const [id, { why }] of Object.entries(EXEMPT)) { expect(TURNINGS.some((t) => t.id === id), id).toBe(true); expect(why.length, id).toBeGreaterThan(3); }
  });
  it('가족을 만드는 사건은 관계의 갈래 낱말만 쓴다', () => {
    const words = Object.values(RELATION_KIND).flat();
    for (const t of TURNINGS) for (const e of [...allFx(t.fx), ...t.doors.flatMap((d) => allFx(d.fx))])
      if (e.op === 'person' && e.kind === 'family') expect(words, `${t.id} '${e.relation}'`).toContain(e.relation);
  });
});

describe('3단계 전체 (과제 13)', () => {
  it('조건 없는 문의 가치관 표시가 고르다', () => {
    const n = Object.fromEntries(VALUE_IDS.map((v) => [v, 0])) as Record<ValueId, number>;
    for (const t of TURNINGS) for (const d of t.doors) if (!d.special && !d.when?.length && !d.needs?.length)
      for (const v of VALUE_IDS) if ((d.values?.[v] ?? 0) > 0) n[v]++;
    const total = Object.values(n).reduce((a, b) => a + b, 0);
    for (const v of VALUE_IDS) { expect(n[v] / total, v).toBeGreaterThanOrEqual(0.07); expect(n[v] / total, v).toBeLessThanOrEqual(0.17); }
  });
  it('전환점이 240개 이상이다', () => { expect(TURNINGS.length).toBeGreaterThanOrEqual(240); });
});
