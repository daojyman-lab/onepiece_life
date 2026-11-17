import { describe, expect, it } from 'vitest';
import { ageWord, battleFormation, battleLine, codexView, doorView, endingView, fightView, hallView, heroWho5, hpAt, matchWord, peopleView, profileView, resultLine, riskWords, sceneOf, speakerOf, storyLines, storyYearLabel, timelineView, unitWho, valueWords, yearLabel } from '../../src/ui/view';
import type { BattleEvent } from '../../src/shared/core/types';
import { TURNINGS } from '../../src/data/turnings';
import { askFight } from '../../src/core/fight';
import { VALUE_NAME } from '../../src/data/values';
import type { Pending5 } from '../../src/core/types';
import { newLife5 } from '../../src/core/state';
import { applyFx } from '../../src/core/fx';
import { addValues } from '../../src/core/values';
import { autoplay5 } from '../../src/core/autoplay';
import { emptyMeta5, recordLife } from '../../src/core/meta';
import { V } from '../../src/data/balance';
import { FOES } from '../../src/data/foes';

describe('나이를 말로', () => {
  it.each([[3, '세 살'], [10, '열 살'], [17, '열일곱 살'], [20, '스무 살'], [21, '스물한 살'], [42, '마흔두 살'], [70, '일흔 살'], [99, '아흔아홉 살'], [100, '100살']])('%i → %s', (n, w) => {
    expect(ageWord(n)).toBe(w);
  });
  it('해 구분선', () => {
    expect(yearLabel({ age: 17, island: '로그타운' })).toBe('열일곱 살 · 장소: 로그타운');
    expect(yearLabel({ age: 48, island: '조' })).toBe('마흔여덟 살 · 장소: 조');
    expect(yearLabel({ age: 17 })).toBe('열일곱 살');
  });
  it('이야기 구분선은 그해 시작한 섬과 나중에 이동한 섬을 구별한다', () => {
    expect(storyYearLabel({ age: 48, island: '조' })).toBe('마흔여덟 살 · 시작한 곳: 조');
    expect(storyYearLabel({ age: 48, island: '드레스로자', moved: true })).toBe('마흔여덟 살 · 이동한 곳: 드레스로자');
  });
  it('0살은 갓난아기', () => {
    expect(ageWord(0)).toBe('갓난아기');
    expect(yearLabel({ age: 0, island: '푸샤 마을' })).toBe('갓난아기 · 장소: 푸샤 마을');
  });
});

describe('가치관은 말로만', () => {
  it('숨은 점수만 바꿔서는 표시 성향을 즉시 확정하지 않는다', () => {
    const s = newLife5(1); for (const k of Object.keys(s.values)) s.values[k as keyof typeof s.values] = 0;
    expect(valueWords(s)).toEqual([]);
    addValues(s, { loyalty: V.value.deep + 1, freedom: 10, peace: 5 });
    expect(valueWords(s)).toEqual([]);
  });
  it('프로필 어디에도 가치관 숫자가 없다', () => {
    const s = autoplay5(77, 'random').s;
    const p = profileView(s);
    expect(JSON.stringify(p.values)).not.toMatch(/\d/);
    for (const v of Object.values(s.values)) if (v > 0 && !Number.isInteger(v)) expect(JSON.stringify(p)).not.toContain(String(v));
  });
});

describe('프로필', () => {
  it('확정된 부성향이 과거의 최고 점수와 달라도 현재 칸으로 호칭을 붙인다', () => {
    const s = newLife5(9);
    s.hero.standing = 'pirate'; s.hero.fame = 60;
    s.values.dominion = 80;
    s.personality = { row: 0, col: 1, pullRow: 0, pullCol: 0, choices: 3, hold: 0, established: true };
    expect(profileView(s).standing).toBe('의리 있는 이름난 해적');
  });
  it('해적은 이름값에 따라, 해군은 자리에 따라 이름이 오르고, 신참 · 병사를 벗어나면 가장 높은 가치관의 말이 붙는다', () => {
    const s = newLife5(9); s.hero.standing = 'pirate'; s.values.ambition = 30; s.values.romance = 10;
    s.hero.fame = 5; expect(profileView(s).standing).toBe('신참 해적');
    s.hero.fame = 60; expect(profileView(s).standing).toBe('성취를 좇는 이름난 해적');
    s.hero.fame = 200; expect(profileView(s).standing).toBe('성취를 좇는 악명 높은 해적');
    s.hero.fame = 900; expect(profileView(s).standing).toBe('성취를 좇는 바다를 뒤흔드는 대해적');
    const m = newLife5(9); m.hero.standing = 'marine'; m.values.romance = 30;
    expect(profileView(m).standing).toBe('해군 병사');
    m.flags.push('mnOfficer'); expect(profileView(m).standing).toBe('낭만적인 해군 부사관');
    m.hero.rank = 3; expect(profileView(m).standing).toBe('낭만적인 해군 장교');
  });
  it('성별과 종족이 나온다', () => {
    const s = newLife5(5, { home: 'fishman' });
    s.hero.gender = 'f'; s.hero.species = 'merfolk';
    expect(profileView(s).who).toBe('여자 · 인어족');
    s.hero.gender = 'm'; s.hero.species = 'human';
    expect(profileView(s).who).toBe('남자 · 인간');
  });
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
  it('부상 부위와 종류를 상태에 표시한다', () => {
    const s = newLife5(1);
    s.hero.injuries.push({ severity: 'heavy', monthsLeft: 12, part: 'armL', kind: 'fracture' });
    expect(profileView(s).hurts).toContain('왼팔 골절 · 무거운 부상');
  });
  it('해적은 현상금으로, 0이면 빈 글자', () => {
    const s = newLife5(1); s.hero.standing = 'pirate'; s.hero.fame = 0;
    expect(profileView(s).fame).toBe('');
    s.hero.fame = 30; expect(profileView(s).fame).toContain('현상금');
  });
});

describe('싸움 앞에서 보이는 말', () => {
  it('위험은 숫자가 아니라 말이다', () => {
    expect(riskWords({ injury: 0.5, limb: 0.1, death: 0 }, false)).toEqual({ injury: '매우 높다', limb: '낮다', death: '없다' });
    expect(riskWords({ injury: 0.01, limb: 0.2, death: 0.02 }, true)).toEqual({ injury: '거의 없다', limb: '높다', death: '거의 없다' });
  });
  it('띠의 경계 값은 위 띠의 말이다', () => {
    expect(riskWords({ injury: 0.4, limb: 0.15, death: 0.03 }, true)).toEqual({ injury: '매우 높다', limb: '높다', death: '낮다' });
    expect(riskWords({ injury: 0, limb: 0.0299, death: 0.3999 }, true)).toEqual({ injury: '거의 없다', limb: '거의 없다', death: '높다' });
    expect(riskWords({ injury: 1, limb: 1, death: 1 }, true)).toEqual({ injury: '매우 높다', limb: '매우 높다', death: '매우 높다' });
  });
  it('목숨을 건 싸움은 죽을 위험이 0이어도 "없다"가 아니라 "거의 없다"다', () => {
    expect(riskWords({ injury: 0, limb: 0, death: 0 }, true).death).toBe('거의 없다');
    expect(riskWords({ injury: 0, limb: 0, death: 0 }, false).death).toBe('없다');
    expect(riskWords({ injury: 0, limb: 0, death: 0.5 }, false).death).toBe('없다');   // 목숨을 걸지 않으면 죽지 않는다
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

describe('선택 창과 싸움 앞의 물음', () => {
  it('문 표시: 특별한 문, 전에 골라 본 문, 위험, 잠긴 까닭', () => {
    const s = newLife5(1); if (s.pending?.kind !== 'door') throw new Error();
    const p = { ...s.pending, moment: true, doors: [
      { label: '가', hint: '힌트', locked: null, special: true, tried: true, danger: true },
      { label: '나', hint: '힌트2', locked: '돈이 모자라다', special: false, tried: false, danger: false },
    ] };
    const v = doorView(s, p);
    expect(v.heading.startsWith('큰 계기')).toBe(true);
    expect(v.doors[0].tags).toEqual([{ text: '특별한 문', red: false }, { text: '전에 골라 본 문', red: false }, { text: '위험', red: true }]);
    expect(v.doors[1]).toMatchObject({ index: 1, locked: '돈이 모자라다', tags: [] });
  });
  it('선택 창의 자료에 가치관 이름이 새어 나가지 않는다', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = newLife5(seed); if (s.pending?.kind !== 'door') continue;
      const v = doorView(s, s.pending);
      for (const d of v.doors) for (const t of d.tags) expect(Object.values(VALUE_NAME)).not.toContain(t.text);
    }
  });
  it('싸움 앞: 목숨을 걸지 않으면 죽을 위험은 없다', () => {
    const s = newLife5(1); s.pending = null as Pending5; s.age = 22;   // as: 아래 askFight 뒤에도 null로 좁혀지지 않게
    askFight(s, Object.keys(FOES)[0], true, false);
    if (s.pending?.kind !== 'fight') throw new Error();
    const v = fightView(s, { ...s.pending, lethal: false, risk: { injury: 0.5, limb: 0.1, death: 0 } });
    expect(v.risk.map((r) => r.word)).toEqual(['매우 높다', '낮다', '없다']);
    expect(v.name.length).toBeGreaterThan(0);
  });
  it('싸움 앞: 목숨을 걸면 죽을 위험은 위험의 띠에서 나온 말이다', () => {
    const s = newLife5(1); s.pending = null as Pending5; s.age = 22;
    askFight(s, Object.keys(FOES)[0], true, false);
    if (s.pending?.kind !== 'fight') throw new Error();
    expect(fightView(s, { ...s.pending, lethal: true, risk: { injury: 0.5, limb: 0.1, death: 0.2 } }).risk[2].word).toBe('높다');
    expect(fightView(s, { ...s.pending, lethal: true, risk: { injury: 0.5, limb: 0.1, death: 0 } }).risk[2].word).toBe('거의 없다');
  });
  it('주인공이 말하는 문의 말하는 사람은 {이름} (나)', () => {
    const s = newLife5(1); if (s.pending?.kind !== 'door') throw new Error();
    const t = TURNINGS.find((x) => x.speaker === 'hero')!;
    expect(doorView(s, { ...s.pending, turning: t.id, speaker: '루피' }).speaker.name).toBe('루피 (나)');
  });
  it('문마다 위험 여부가 따로 있다', () => {
    const s = newLife5(1); if (s.pending?.kind !== 'door') throw new Error();
    const p = { ...s.pending, doors: [
      { label: '가', hint: '', locked: null, special: false, tried: false, danger: true },
      { label: '나', hint: '', locked: null, special: false, tried: false, danger: false },
    ] };
    expect(doorView(s, p).doors.map((d) => d.danger)).toEqual([true, false]);
  });
  it('잠긴 문의 힌트 자리에는 잠긴 까닭, 큰 계기가 아니면 제목만', () => {
    const s = newLife5(1); if (s.pending?.kind !== 'door') throw new Error();
    const p = { ...s.pending, moment: false, doors: [{ label: '나', hint: '힌트2', locked: '돈이 모자라다', special: false, tried: false, danger: false }] };
    const v = doorView(s, p);
    expect(v.heading).toBe(p.title);
    expect(v.doors[0].hint).toBe('✕ 돈이 모자라다');
  });
  it('선택 전에는 결과 문구를 숨기고 잠긴 까닭은 보여 준다', () => {
    const s = newLife5(1); if (s.pending?.kind !== 'door') throw new Error();
    const p = { ...s.pending, doors: [
      { label: '족쇄를 푼다', hint: '죄수가 달아나고 섬 전체가 쫓는다', locked: null, special: false, tried: false, danger: true },
      { label: '기록실에 들어간다', hint: '무죄 판결이 없다', locked: '열쇠가 없다', special: false, tried: false, danger: false },
    ] };
    const doors = doorView(s, p).doors;
    expect(doors[0]).toMatchObject({ label: '족쇄를 푼다', hint: '', danger: true });
    expect(doors[1].hint).toBe('✕ 열쇠가 없다');
  });
});

describe('자동 전투 창', () => {
  it('참전자에 따라 1대1과 집단전의 양쪽 명단을 나눈다', () => {
    const s = newLife5(1); s.pending = null as Pending5; s.age = 22;
    askFight(s, 'b_alvida', false, true);
    if (s.pending?.kind !== 'battle') throw new Error();
    expect(battleFormation(s.pending.battle)).toEqual({ mode: 'duel', left: [0], right: [1] });
    askFight(s, 'b_morgan', false, true);
    if (s.pending?.kind !== 'battle') throw new Error();
    expect(battleFormation(s.pending.battle)).toEqual({ mode: 'group', left: [0], right: [1, 2] });
    const b = s.pending.battle;
    b.units.splice(1, 0, { ...b.units[0], key: 'crew', name: '동료', hero: false, leader: false });
    expect(battleFormation(b)).toEqual({ mode: 'group', left: [0, 1], right: [2, 3] });
  });
  it('전투 재생: 끝까지 가면 진 쪽의 체력이 0이다', () => {
    let s = newLife5(1); s.pending = null as Pending5; s.age = 22; s.hero.standing = 'pirate';   // as: askFight 뒤에도 null로 좁혀지지 않게
    for (const k of Object.keys(s.hero.base) as (keyof typeof s.hero.base)[]) s.hero.base[k] = 60;
    askFight(s, Object.keys(FOES)[0], false, true);
    if (s.pending?.kind !== 'battle') throw new Error();
    const b = s.pending.battle;
    expect(hpAt(b, 0)).toEqual(b.units.map((u) => u.maxHp));
    const end = hpAt(b, b.events.length);
    expect(end.some((h) => h === 0) || s.pending.result === 'retreat').toBe(true);
    for (const e of b.events) { const t = battleLine(b, e); expect(t).not.toMatch(/undefined|\(이\)가|을\(를\)/); }
    expect(resultLine(s.pending.result).length).toBeGreaterThan(0);
  });
  it('결과 줄과 모든 사건의 글', () => {
    expect(resultLine('win')).toBe('이겼다.');
    expect(resultLine('lose')).toBe('졌다.');
    expect(resultLine('retreat')).toBe('물러났다.');
    const s = newLife5(1); s.pending = null as Pending5; s.age = 22;
    askFight(s, Object.keys(FOES)[0], false, true);
    if (s.pending?.kind !== 'battle') throw new Error();
    const b = s.pending.battle;
    const kinds: BattleEvent[] = [
      { k: 'item', d: 0, who: 0, item: 'potion', name: '회복약' }, { k: 'retreat', who: 0, ok: false },
      { k: 'drown', who: 0 }, { k: 'rest', who: 0 }, { k: 'join', d: 0, who: 0, side: 'L' },
    ];
    for (const e of kinds) expect(battleLine(b, e)).not.toMatch(/undefined|\(이\)가|을\(를\)/);
    expect(unitWho(s, b.units.find((u) => u.hero)!)).toEqual(heroWho5(s));
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
  it('선의의 의료 능력이 동료 목록에 보인다', () => {
    const s = newLife5(1);
    applyFx(s, [{ op: 'person', kind: 'crew', relation: '떠돌이 의사', role: 'medic', medicalSkill: 65 }]);
    expect(peopleView(s).find((p) => p.relation === '떠돌이 의사')?.crew).toContain('의료 65');
  });
  it('떠 있는 문의 말하는 사람은 이름과 얼굴 열쇠를 가진다', () => {
    const s = newLife5(1);
    if (s.pending?.kind !== 'door') throw new Error('문이 떠 있어야 한다');
    const sp = speakerOf(s, s.pending);
    expect(sp.name.length).toBeGreaterThan(0); expect(sp.who.key.length).toBeGreaterThan(0);
  });
  it('인연 목록의 줄은 사람마다 다른 id를 가진다', () => {
    const s = autoplay5(3, 'random').s;
    const v = peopleView(s);
    expect(v.length).toBeGreaterThan(1);
    expect(v.map((p) => p.id)).toEqual(s.people.map((p) => p.id));
    expect(new Set(v.map((p) => p.id)).size).toBe(v.length);
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
    for (const d of c.doors) { expect(d.title).not.toContain('#'); expect(d.door).not.toContain('{'); expect(JSON.stringify(d.values)).not.toMatch(/\d/); }
    expect(codexView({ ...meta, doors: { 'no_such#0': [] } }).doors).toEqual([]);
  });
  it('명예의 전당은 최근 인생이 위다', () => {
    let meta = emptyMeta5();
    meta = recordLife(meta, autoplay5(1, 'random').s); meta = recordLife(meta, autoplay5(2, 'random').s);
    const h = hallView(meta);
    expect(h.length).toBe(2); expect(h[0].name).toBe(meta.hall[1].name);
  });
  it('명예의 전당의 끝은 "…살, 까닭", 까닭이 없으면 나이만', () => {
    const meta = { ...emptyMeta5(), hall: [
      { name: '가', persona: '', oneLine: '', age: 72, cause: '노환' },
      { name: '나', persona: '', oneLine: '', age: 30, cause: '' },
    ] };
    expect(hallView(meta).map((h) => h.end)).toEqual(['서른 살', '일흔두 살, 노환']);
  });
  it('엔딩 자료: 빈 칸 없이 채워지고 가치관 숫자가 없다', () => {
    const s = autoplay5(21, 'random').s;
    const v = endingView(s, emptyMeta5());
    expect(v.persona.length).toBeGreaterThan(0); expect(v.oneLine.length).toBeGreaterThan(0); expect(v.remembered.length).toBeGreaterThan(0);
    expect(v.end).toContain('살');
    expect(v.record.length).toBeGreaterThanOrEqual(5);
    expect(v.newCodex.length).toBeGreaterThan(0);                       // 첫 인생이면 새로 채운 것이 있다
    expect(endingView(s, recordLife(emptyMeta5(), s)).newCodex).toEqual([]);   // 이미 든 도감이면 없다
    for (const x of Object.values(s.values)) if (x > 0 && !Number.isInteger(x)) expect(JSON.stringify(v)).not.toContain(String(x));
  });
  it('엔딩 기록: 끝난 까닭이 없으면 그 줄을 뺀다', () => {
    const s = autoplay5(21, 'random').s;
    s.ended = { age: s.ended?.age ?? s.age, cause: '' };
    const v = endingView(s, emptyMeta5());
    expect(v.record.map((r) => r.value)).not.toContain('-');
    expect(v.record.map((r) => r.label)).not.toContain('까닭');
  });
  it('엔딩의 끝은 명예의 전당과 같은 꼴이다', () => {
    const s = autoplay5(21, 'random').s;
    expect(endingView(s, emptyMeta5()).end).toBe(hallView(recordLife(emptyMeta5(), s))[0].end);
  });
});

describe('연표', () => {
  it('나이를 말로, 같은 나이 · 같은 글이 연달아 나오면 한 번만', () => {
    const s = newLife5(1);
    s.timeline = [
      { age: 0, text: '태어났다' },
      { age: 17, text: '바다로 나갔다' },
      { age: 17, text: '바다로 나갔다' },
      { age: 18, text: '바다로 나갔다' },
      { age: 17, text: '바다로 나갔다' },
    ];
    expect(timelineView(s)).toEqual([
      { age: '갓난아기', text: '태어났다' },
      { age: '열일곱 살', text: '바다로 나갔다' },
      { age: '열여덟 살', text: '바다로 나갔다' },
      { age: '열일곱 살', text: '바다로 나갔다' },
    ]);
  });
});

describe('장면', () => {
  it('장면에 그리는 동료는 셋까지 (v4 장면이 그리던 만큼)', () => {
    const s = newLife5(1);
    const base = s.people[0];
    s.people = Array.from({ length: 6 }, (_, i) => ({ ...base, id: `c${i}`, name: `동료${i}`, kind: 'crew' as const, alive: true }));
    expect(sceneOf(s, true).crew.length).toBe(3);
    s.people = s.people.slice(0, 2);
    expect(sceneOf(s, true).crew.length).toBe(2);
  });
  it('싸움 상대는 이야기가 따라잡은 뒤에야 장면에 나온다', () => {
    const s = newLife5(1); s.pending = null as Pending5; s.age = 22;
    askFight(s, Object.keys(FOES)[0], true, false);
    if (s.pending?.kind !== 'fight') throw new Error();
    expect(sceneOf(s, false).foe).toBeNull();
    expect(sceneOf(s, true).foe).not.toBeNull();
    expect(sceneOf(newLife5(1), true).foe).toBeNull();                    // 싸움이 아니면 상대가 없다
  });
});
