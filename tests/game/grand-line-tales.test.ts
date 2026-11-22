import { describe, expect, it } from 'vitest';
import { checkAll } from '../../src/core/cond';
import { normalizeLife5 } from '../../src/core/load';
import { depart, passagePart } from '../../src/core/passage';
import { newLife5 } from '../../src/core/state';
import { answerDoor, openQueued, resolveDoors } from '../../src/core/turning';
import type { Life5 } from '../../src/core/types';
import { hasEntryContact } from '../../src/core/voyage';
import { TURNING_BY_ID } from '../../src/data/turnings';
import { profileView } from '../../src/ui/view/profile';

function life(island: string, age: number) {
  const s = newLife5(77);
  s.pending = null;
  s.age = age;
  s.hero.standing = age < 16 ? 'child' : 'civil';
  s.hero.island = island;
  return s;
}

const fits = (s: Life5, id: string) => checkAll(s, TURNING_BY_ID[id].when);

function scene(s: Life5, id: string) {
  s.queue.push(id);
  expect(openQueued(s), id).toBe(true);
  if (s.pending?.kind !== 'door' || s.pending.turning !== id) throw new Error(id);
  return s.pending;
}

describe('항해를 따라 쌓이는 원작의 흔적', () => {
  it('은퇴한 전보벌레를 맡은 이에게만 한 해 뒤 그 우체국장의 전화가 온다', () => {
    const s = life('시럽 마을', 9);
    scene(s, 'gl_post_snail');
    const declined = structuredClone(s);
    answerDoor(declined, 1);
    declined.age++;
    expect(fits(declined, 'gl_post_call')).toBe(false);
    expect(profileView(declined).keepsakes).toEqual([]);

    answerDoor(s, 0);
    expect(fits(s, 'gl_post_call')).toBe(false);
    s.age++;
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    expect(profileView(loaded).keepsakes).toEqual(['우체국 전보벌레 달팽이콩']);
    loaded.hero.island = '로그타운';
    expect(scene(loaded, 'gl_post_call').speaker).toBe('포포');
    answerDoor(loaded, 0);
    expect(loaded.flags).toContain('postCallAnswered');
    loaded.people.find(p => p.name === '포포')!.alive = false;
    expect(fits(loaded, 'gl_post_call')).toBe(false);
  });

  it('도선사의 카드는 주인만 가리키고 실제로 건넨 조각은 소지품에서 빠진다', () => {
    const s = life('워터 세븐', 24);
    scene(s, 'gl_vivre_pilot');
    const declined = structuredClone(s);
    answerDoor(declined, 1);
    declined.age++;
    expect(fits(declined, 'gl_vivre_reunion')).toBe(false);
    answerDoor(s, 0);
    expect(fits(s, 'gl_vivre_reunion')).toBe(false);
    s.age++;
    s.hero.island = '샤본디 제도';
    expect(hasEntryContact(s, 'zou')).toBe(false);
    scene(s, 'gl_vivre_reunion');
    const kept = structuredClone(s);
    answerDoor(kept, 0);
    expect(profileView(kept).keepsakes).toContain('도선사 마레의 비블카드');
    answerDoor(s, 1);
    expect(profileView(s).keepsakes).toEqual([]);
    expect(s.flags).toContain('pilotRescued');
    s.flags.push('zouVivreCard');
    expect(hasEntryContact(s, 'zou')).toBe(true);
    expect(profileView(s).keepsakes).toEqual(['조우를 가리키는 비블카드']);
  });

  it('에이스는 유년기 선택을 기억하고, 식탁을 나눈 뒤에만 전쟁 중 그날을 회상한다', () => {
    const s = life('후샤 마을', 11);
    s.hero.town = '후샤 마을';
    scene(s, 'cn_ace_thugs');
    answerDoor(s, 0);
    s.age = 17;
    s.hero.sea = 'gl_first';
    s.hero.island = '알라바스타 왕국';
    s.hero.standing = 'pirate';
    expect(scene(s, 'cn_ace_bar').body).toContain('고깃덩이를 반');
    const stranger = life('알라바스타 왕국', 17);
    stranger.hero.sea = 'gl_first';
    expect(scene(stranger, 'cn_ace_bar').body).not.toContain('그레이 터미널');
    answerDoor(s, 0);
    expect(s.people.filter(p => p.canon === 'ace')).toHaveLength(1);
    s.age = 19;
    expect(fits(s, 'cn_ace_bar')).toBe(false);
    expect(scene(s, 'cn_whitebeard_war').body).toContain('모자에 계산서');
  });

  it('브룩의 후렴을 배운 뒤 리버스 마운틴에서 라분에게 노래할 수 있다', () => {
    const s = life('스릴러 바크', 19);
    scene(s, 'gl_brook_song');
    const tea = structuredClone(s);
    answerDoor(tea, 1);
    tea.hero.island = '리버스 마운틴';
    expect(fits(tea, 'gl_laboon_refrain')).toBe(false);
    answerDoor(s, 0);
    expect(fits(s, 'gl_laboon_refrain')).toBe(false);
    s.hero.island = '리버스 마운틴';
    scene(s, 'gl_laboon_refrain');
    answerDoor(s, 0);
    expect(s.timeline.some(x => x.canon === 'brook' && x.text.includes('라분에게 들려주었다'))).toBe(true);
  });

  it('드럼을 떠나기 전의 쵸파와 출항 전 프랑키는 해당 도시에 닻을 내렸을 때만 만난다', () => {
    const s = life('리틀 가든', 17);
    s.hero.sea = 'gl_entry';
    expect(fits(s, 'cn_chopper_drum')).toBe(false);
    s.hero.island = '드럼 왕국';
    expect(fits(s, 'cn_chopper_drum')).toBe(true);
    s.age = 19;
    expect(fits(s, 'cn_chopper_drum')).toBe(false);
    s.hero.sea = 'gl_first';
    s.hero.island = '워터 세븐 뒷골목';
    s.age = 17;
    expect(fits(s, 'cn_franky_backstreet')).toBe(true);
    depart(s, '자야', 'dream');
    expect(fits(s, 'cn_franky_backstreet')).toBe(false);
  });

  it('프랑키와 펌프를 고친 경험이 있어야 이듬해 다른 도크의 기계를 알아본다', () => {
    const s = life('워터 세븐 뒷골목', 16);
    s.hero.sea = 'gl_first';
    scene(s, 'cn_franky_backstreet');
    const fought = structuredClone(s);
    answerDoor(fought, 2);
    fought.age++;
    fought.hero.island = '로그타운';
    expect(fits(fought, 'gl_cola_drydock')).toBe(false);
    answerDoor(s, 1);
    s.hero.island = '로그타운';
    expect(fits(s, 'gl_cola_drydock')).toBe(false);
    s.age++;
    expect(scene(s, 'gl_cola_drydock').body).toContain('프랑키와 함께');
    answerDoor(s, 1);
    expect(s.people.some(p => p.relation === '함께 콜라 펌프를 살린 수리공')).toBe(true);
  });

  it('아이도 잔칫상에서 먹고 연주할 수 있고 술을 마시는 선택은 어른에게 열린다', () => {
    const s = life('워터 세븐', 8);
    const t = TURNING_BY_ID.gl_quayside_feast;
    expect(resolveDoors(s, t).map(d => !!d.locked)).toEqual([false, true, false]);
    s.age = 25;
    expect(resolveDoors(s, t).every(d => !d.locked)).toBe(true);
  });

  it('실제 칼름벨트 항해에서만 해왕류의 기억을 얻고 반복 조우를 연표에 중복하지 않는다', () => {
    const s = life('샤본디 제도', 25);
    s.hero.sea = 'sabaody';
    s.hero.standing = 'pirate';
    depart(s, '스릴러 바크', 'dream');
    passagePart(s, () => 0);
    expect(s.flags).not.toContain('sawCalmBeltKing');
    for (let i = 0; i < 2; i++) {
      depart(s, '아마존 릴리', 'dream');
      passagePart(s, () => 0);
    }
    expect(s.timeline.filter(x => x.text.includes('해왕류와 눈이 마주쳤다'))).toHaveLength(1);
  });
});
