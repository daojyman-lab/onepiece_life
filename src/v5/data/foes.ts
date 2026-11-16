// 싸움의 상대. 이름 있는 상대는 v4의 해역 보스를 그대로 가리키고, 이름 없는 상대는 바다의 세기에 맞춰 만든다.
import { BOSSES, statsAround } from '../../data/bosses';
import type { EnemySpec, SeaId, Standing, Values } from '../core/types';

/** v4 보스에 없던 이스트 블루의 원작 상대 (과제 10). 힘은 이스트 블루의 보스(모건 26 · 아론 28) 둘레에 둔다 */
const EAST: (Omit<EnemySpec, 'base' | 'officers' | 'armament' | 'observation' | 'fruitClass' | 'species'> & { p: number; bias?: Parameters<typeof statsAround>[1] })[] = [
  { id: 'b_alvida', name: '쇠몽둥이 알비다', title: '알비다 해적단 선장', canon: 'alvida', p: 20, bias: { vit: 1.2, spd: 0.8 }, faction: 'pirate', gender: 'f', age: 25,
    skills: ['fist_jab', 'fist_combo', 'fist_guard'], tactic: 'offense' },
  { id: 'b_buggy', name: '광대 버기', title: '버기 해적단 선장', canon: 'buggy', p: 24, bias: { spd: 1.1, int: 1 }, faction: 'pirate', gender: 'm', age: 37,
    skills: ['sword_cut', 'sword_draw', 'gun_shot'], tactic: 'counter' },
  { id: 'b_kuro', name: '백 개의 계략 쿠로', title: '검은 고양이 해적단 전 선장', canon: 'kuro', p: 27, bias: { spd: 1.4, vit: 0.8 }, faction: 'pirate', gender: 'm', age: 33,
    skills: ['sword_cut', 'sword_flash', 'sword_draw'], tactic: 'offense' },
  { id: 'b_krieg', name: '돈 크리크', title: '크리크 해적 함대 제독', canon: 'krieg', p: 28, bias: { vit: 1.3, str: 1.1 }, faction: 'pirate', gender: 'm', age: 42,
    skills: ['gun_shot', 'gun_quick', 'fist_guard'], tactic: 'defense' },
];
/** sea: 이름 있는 상대가 나오는 바다 (v4 보스의 sea와 같은 꼴) */
const EAST_FOES: EnemySpec[] = EAST.map(({ p, bias, ...o }) => ({
  ...o, base: statsAround(p, bias), officers: [], armament: 0, observation: 0, fruitClass: null, species: 'human', sea: ['east'],
}) as EnemySpec);

/** 이름 있는 상대: id → 상대. 약한 바다의 상대부터 */
export const FOES: Record<string, EnemySpec> = Object.fromEntries([...EAST_FOES, ...BOSSES].map((b) => [b.id, b]));
/** 이름 있는 상대의 바다 (v4 보스가 나오는 첫 바다) */
export const FOE_SEA: Record<string, SeaId> = {
  ...Object.fromEntries(EAST_FOES.map((b) => [b.id, 'east' as SeaId])),
  ...Object.fromEntries(BOSSES.map((b) => [b.id, b.sea[0]])),
};

/** 이름 없는 상대의 이름 */
export const MINOR_FOE_NAMES: string[] = ['술 취한 깡패', '떠돌이 해적', '현상금 사냥꾼', '해군 졸병', '항구의 건달', '좀도둑 무리'];

/** 사소한 싸움이 일어나는 처지 */
export const MINOR_FIGHT_STANDINGS: Standing[] = ['pirate', 'marine', 'bountyHunter'];

/** 사소한 싸움에서 붙을지 피할지. 가치관 쪽으로 기울여 고른다 */
export const MINOR_FIGHT_CHOICE: { engage: boolean; lean: Partial<Values> }[] = [
  { engage: true, lean: { dominion: 1, ambition: 1, justice: 1 } },
  { engage: false, lean: { peace: 1, freedom: 1 } },
];

/** 사소한 싸움의 기록. {foe}는 상대의 이름 */
export const MINOR_FIGHT_TEXT = {
  avoid: ['{foe}이(가) 시비를 걸어왔지만, 상대하지 않고 자리를 떴다.', '{foe}과(와) 눈이 마주쳤다. 굳이 붙을 일은 아니었다.'],
  win: ['{foe}과(와) 붙어 가볍게 쓰러뜨렸다.', '{foe}이(가) 덤벼들었다. 오래 걸리지 않았다.'],
  lose: ['{foe}에게 호되게 당하고 물러났다.', '{foe}과(와) 붙었다가 흠씬 두들겨 맞았다.'],
};
