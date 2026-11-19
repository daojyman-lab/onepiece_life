import { describe, expect, it } from 'vitest';
import { newLife5 } from '../../src/v5/core/state';
import { apply5 } from '../../src/v5/core/reduce';
import { normalizeLife5 } from '../../src/v5/core/load';
import { openTurning } from '../../src/v5/core/turning';
import { buildVoyage, voyageChoices, voyageId } from '../../src/v5/core/voyage';
import { voyage } from '../../src/v5/core/year';
import { seaOfPort } from '../../src/v5/data/navigation';
import { rngOf } from '../../src/core/rng';
import type { Life5 } from '../../src/v5/core/types';

function atPort(port: string, age = 25) {
  const s = newLife5(4);
  s.pending = null; s.age = age; s.hero.island = port;
  s.hero.sea = seaOfPort(port) ?? 'east'; s.hero.standing = 'pirate';
  return s;
}
const pending = (s: Life5) => s.pending;
function depart(s: Life5, target: string) {
  const choices = voyageChoices(s, rngOf(s.rng))!;
  const t = buildVoyage(voyageId(s, choices))!;
  const i = t.doors.findIndex(d => d.fx.some(f => f.op === 'sail' && f.island === target));
  expect(i, target).toBeGreaterThanOrEqual(0);
  openTurning(s, t);
  apply5(s, { type: 'answer', index: i });
}

describe('기항과 항해 중 보급', () => {
  it.each([
    ['후샤 마을', '셸스 타운', 'shells_ledger'],
    ['셸스 타운', '오렌지 마을', 'orange_sign'],
    ['오렌지 마을', '진귀한 동물의 섬', 'rare_tracks'],
    ['셸스 타운', '시모츠키 마을', 'shimotsuki_dojo'],
    ['자야', '롱 링 롱 랜드', 'longring_tide'],
  ])('%s에서 %s에 기항하면 섬 고유 사건이 열린다', (from, to, scene) => {
    const s = atPort(from); depart(s, to);
    expect(s.hero.island).toBe(to);
    apply5(s, { type: 'step' });
    expect(pending(s)).toMatchObject({ kind: 'door', turning: scene });
    apply5(s, { type: 'answer', index: 0 });
    expect(s.timeline.at(-1)?.text).toBeTruthy();
    expect(voyageChoices(s, rngOf(s.rng))).toBeTruthy();
  });
  it.each([[18, '스릴러 바크', 'bark_bell'], [19, '플로리안 트라이앵글', 'florian_bell']] as const)(
    '%i세 항로에서 안개 속 조난선을 구조하고 샤본디로 나간다', (age, to, scene) => {
      const s = atPort('워터 세븐', age); depart(s, to);
      if (s.hero.island === '이름 없는 섬') { apply5(s, { type: 'step' }); apply5(s, { type: 'answer', index: 2 }); }
      apply5(s, { type: 'step' }); expect(pending(s)).toMatchObject({ turning: scene });
      for (let i = 0; i < 3; i++) {
        apply5(s, { type: 'answer', index: 0 });
        if (i < 2) apply5(s, { type: 'step' });
      }
      expect(s.flags).toContain('florian:rescued');
      depart(s, '샤본디 제도'); expect(s.hero.island).toBe('샤본디 제도');
    });
  it('장거리 정박은 확률적이고 저장 뒤에도 보급과 원래 항로의 도착 효과가 한 번만 적용된다', () => {
    let stopped = 0;
    for (let seed = 0; seed < 200; seed++) {
      const s = atPort('워터 세븐', 18); s.hero.hp = 60; s.rng = { seed, cursor: 0 };
      const t = buildVoyage(voyageId(s, { wild: '스릴러 바크' }))!;
      openTurning(s, t); apply5(s, { type: 'answer', index: 0 });
      if (s.hero.island !== '이름 없는 섬') { expect(s.hero.island).toBe('스릴러 바크'); continue; }
      stopped++;
      expect(s.flags).not.toContain('at:스릴러 바크');
      expect(s.hero.hp).toBe(60);
      const intermediate = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
      apply5(intermediate, { type: 'step' });
      expect(pending(intermediate)).toMatchObject({ turning: 'islet_resupply' });
      const resumed = normalizeLife5(JSON.parse(JSON.stringify(intermediate)))!;
      apply5(resumed, { type: 'answer', index: 0 });
      expect(resumed.hero.island).toBe('스릴러 바크'); expect(resumed.hero.sea).toBe('sabaody');
      expect(resumed.hero.provisions).toBe(3); expect(resumed.hero.hp).toBe(50);
      apply5(resumed, { type: 'answer', index: 0 });
      expect(resumed.hero.provisions).toBe(3);
      apply5(resumed, { type: 'step' }); expect(pending(resumed)).toMatchObject({ turning: 'bark_bell' });
    }
    expect(stopped).toBeGreaterThan(40); expect(stopped).toBeLessThan(100);
  });
  it('인사 발령 중 들른 섬에서도 명령받은 목적지로 복귀하고 항해 식량을 사용한다', () => {
    let stopped = false;
    for (let seed = 0; seed < 100 && !stopped; seed++) {
      const s = atPort('리틀 가든'); s.rng = { seed, cursor: 0 }; s.sail = true;
      s.hero.standing = 'marine'; s.hero.provisions = 1; s.hero.hp = 50;
      voyage(s); if (s.hero.island !== '이름 없는 섬') continue;
      stopped = true; expect(s.hero.provisions).toBe(0);
      apply5(s, { type: 'step' }); apply5(s, { type: 'answer', index: 2 });
      expect(s.hero.island).toBe('알라바스타 왕국'); expect(s.hero.hp).toBe(53);
      expect(s.log.at(-1)?.text).toContain('명령');
    }
    expect(stopped).toBe(true);
  });
  it.each([
    ['셸스 타운', '오렌지 마을', ''],
    ['샤본디 제도', '어인섬', 'route:coating'],
    ['자야', '스카이피아', 'route:sky'],
  ])('%s에서 %s로 갈 때 보급섬을 만나거나 비축분을 소비하지 않는다', (from, to, permit) => {
    for (let seed = 0; seed < 30; seed++) {
      const s = atPort(from); if (permit) s.flags.push(permit);
      s.rng = { seed, cursor: 0 }; s.hero.provisions = 2;
      depart(s, to);
      expect(s.hero.island).toBe(to); expect(s.hero.provisions).toBe(2);
    }
  });
  it('휴식과 적재 한도를 적용하고, 도착 뒤 같은 보급을 되풀이하지 않는다', () => {
    const s = atPort('이름 없는 섬'); s.hero.provisions = 6; s.hero.hp = 80;
    s.passage = { destination: '오렌지 마을', route: 'drift' };
    apply5(s, { type: 'step' }); apply5(s, { type: 'answer', index: 1 });
    expect(s.hero.provisions).toBe(6); expect(s.hero.hp).toBe(88);
    expect(s.passage).toBeUndefined();
    apply5(s, { type: 'step' }); expect(pending(s)).toMatchObject({ turning: 'orange_sign' });
  });
  it('옛 저장의 식량은 0이고 목적지가 사라진 정박 저장은 거른다', () => {
    const s = atPort('워터 세븐');
    const { provisions, ...oldHero } = s.hero;
    expect(normalizeLife5({ ...s, hero: oldHero })?.hero.provisions).toBe(0);
    expect(normalizeLife5({ ...s, hero: { ...s.hero, island: '이름 없는 섬' } })).toBeNull();
    expect(normalizeLife5({ ...s, passage: { destination: '알 수 없는 곳', route: 'wild' } })).toBeNull();
  });
  it('18세 마지막 토막에 예약한 출항도 선택 화면과 도착 시점이 일치한다', () => {
    for (let seed = 0; seed < 100; seed++) {
      const s = atPort('워터 세븐', 18); s.sail = true; s.part = 3;
      s.seenCount.focused_training_16 = 1; s.rng = { seed, cursor: 0 };
      apply5(s, { type: 'step' });
      const p = pending(s);
      if (p?.kind !== 'door' || !p.turning.startsWith('voyage:')) continue;
      expect(s.age).toBe(19);
      expect(p.doors.some(d => d.label.includes('플로리안 트라이앵글'))).toBe(true);
      return;
    }
    throw new Error('해가 바뀌는 출항 선택이 한 번도 열리지 않았다');
  });
  it('옛 출항 선택을 불러와도 후기 해역을 표시하고 그 목적지에 닿는다', () => {
    const s = atPort('워터 세븐', 19);
    openTurning(s, buildVoyage('voyage:18:-:|스릴러 바크|')!);
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    const p = pending(loaded);
    expect(p?.kind === 'door' && p.doors[0].label).toContain('플로리안 트라이앵글');
    apply5(loaded, { type: 'answer', index: 0 });
    expect(loaded.passage?.destination ?? loaded.hero.island).toBe('플로리안 트라이앵글');
  });
});
