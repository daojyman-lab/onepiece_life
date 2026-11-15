import { describe, expect, it } from 'vitest';
import { ageWord, codexView, hallView, heroWho5, matchWord, profileView, riskWords, speakerOf, storyLines, valueWords, yearLabel } from '../../src/v5/ui/view';
import { newLife5 } from '../../src/v5/core/state';
import { addValues } from '../../src/v5/core/values';
import { autoplay5 } from '../../src/v5/core/autoplay';
import { emptyMeta5, recordLife } from '../../src/v5/core/meta';
import { V } from '../../src/v5/data/balance';
import { FOES } from '../../src/v5/data/foes';

describe('나이를 말로', () => {
  it.each([[3, '세 살'], [10, '열 살'], [17, '열일곱 살'], [20, '스무 살'], [21, '스물한 살'], [42, '마흔두 살'], [70, '일흔 살'], [99, '아흔아홉 살'], [100, '100살']])('%i → %s', (n, w) => {
    expect(ageWord(n)).toBe(w);
  });
  it('해 구분선', () => {
    expect(yearLabel({ age: 17, island: '로그타운' })).toBe('열일곱 살 · 로그타운');
    expect(yearLabel({ age: 17 })).toBe('열일곱 살');
  });
});

describe('가치관은 말로만', () => {
  it('높은 순으로 둘, 깊은 것은 깊다고 적는다', () => {
    const s = newLife5(1); for (const k of Object.keys(s.values)) s.values[k as keyof typeof s.values] = 0;
    expect(valueWords(s)).toEqual([]);
    addValues(s, { loyalty: V.value.deep + 1, freedom: 10, peace: 5 });
    expect(valueWords(s)).toEqual(['의리가 깊다', '자유를 안다']);
  });
  it('프로필 어디에도 가치관 숫자가 없다', () => {
    const s = autoplay5(77, 'random').s;
    const p = profileView(s);
    expect(JSON.stringify(p.values)).not.toMatch(/\d/);
    for (const v of Object.values(s.values)) if (v > 0 && !Number.isInteger(v)) expect(JSON.stringify(p)).not.toContain(String(v));
  });
});

describe('프로필', () => {
  it('성이 없는 고아의 이름에 null이나 앞뒤 빈칸이 없다', () => {
    const s = newLife5(5, { lineage: 'orphan' });
    const n = profileView(s).name;
    expect(n).not.toMatch(/null|undefined/); expect(n).toBe(n.trim()); expect(n.length).toBeGreaterThan(0);
  });
  it('잃은 부위만 몸 칸에 나온다', () => {
    const s = newLife5(1); expect(profileView(s).body).toEqual([]);
    s.hero.limbs.armL = 'lost'; s.hero.limbs.legR = 'basic';
    expect(profileView(s).body.length).toBe(2);
  });
  it('해적은 현상금으로, 0이면 빈 글자', () => {
    const s = newLife5(1); s.hero.standing = 'pirate'; s.hero.fame = 0;
    expect(profileView(s).fame).toBe('');
    s.hero.fame = 30; expect(profileView(s).fame).toContain('현상금');
  });
});

describe('싸움 앞에서 보이는 말', () => {
  it('위험은 숫자가 아니라 말이다', () => {
    expect(riskWords({ injury: 0.5, limb: 0.1, death: 0 })).toEqual({ injury: '매우 높다', limb: '낮다', death: '없다' });
    expect(riskWords({ injury: 0.01, limb: 0.2, death: 0.02 })).toEqual({ injury: '거의 없다', limb: '높다', death: '거의 없다' });
  });
  it('상대의 격: 아주 강한 주인공에게는 한참 아래, 아주 약한 주인공에게는 상대가 안 된다', () => {
    const foe = Object.values(FOES)[0];
    const strong = newLife5(1);
    for (const k of Object.keys(strong.hero.base)) strong.hero.base[k as keyof typeof strong.hero.base] = 100000;
    expect(matchWord(strong, foe)).toBe('한참 아래다');
    const weak = newLife5(1);
    for (const k of Object.keys(weak.hero.base)) weak.hero.base[k as keyof typeof weak.hero.base] = 1;
    expect(matchWord(weak, foe)).toBe('상대가 안 된다');
  });
});

describe('이야기', () => {
  it('떠오른 줄만, 큰일만 고르면 가벼운 줄이 빠진다', () => {
    const s = autoplay5(3, 'random').s;
    const mid = s.log[Math.floor(s.log.length / 2)].id;
    expect(storyLines(s, mid, false).every((l) => l.id <= mid)).toBe(true);
    expect(storyLines(s, mid, true).every((l) => l.weight !== 'light')).toBe(true);
    expect(storyLines(s, s.log[s.log.length - 1].id, false).length).toBeLessThanOrEqual(160);
  });
});

describe('말하는 사람', () => {
  it('떠 있는 문의 말하는 사람은 이름과 얼굴 열쇠를 가진다', () => {
    const s = newLife5(1);
    if (s.pending?.kind !== 'door') throw new Error('문이 떠 있어야 한다');
    const sp = speakerOf(s, s.pending);
    expect(sp.name.length).toBeGreaterThan(0); expect(sp.who.key.length).toBeGreaterThan(0);
  });
  it('주인공의 겉모습 열쇠는 인생마다 같다', () => {
    expect(heroWho5(newLife5(9)).key).toBe(heroWho5(newLife5(9)).key);
  });
});

describe('도감과 명예의 전당', () => {
  it('도감은 문을 제목과 이름, 가치관 이름으로 푼다', () => {
    const s = autoplay5(11, 'random').s;
    const meta = recordLife(emptyMeta5(), s);
    const c = codexView(meta);
    expect(c.doors.length).toBeGreaterThan(0);
    for (const d of c.doors) { expect(d.title).not.toContain('#'); expect(JSON.stringify(d.values)).not.toMatch(/\d/); }
    expect(codexView({ ...meta, doors: { 'no_such#0': [] } }).doors).toEqual([]);
  });
  it('명예의 전당은 최근 인생이 위다', () => {
    let meta = emptyMeta5();
    meta = recordLife(meta, autoplay5(1, 'random').s); meta = recordLife(meta, autoplay5(2, 'random').s);
    const h = hallView(meta);
    expect(h.length).toBe(2); expect(h[0].name).toBe(meta.hall[1].name);
  });
});
