// 무술 3유파, 패기 3색의 기술 트리. 열매 기술은 fruits.ts 의 틀에서 만든다.
import type { BranchId, Skill } from '../core/types';

type S = Omit<Skill, 'tags' | 'requires'> & { tags?: Skill['tags']; requires?: Skill['requires'] };
const sk = (s: S): Skill => ({ tags: [], requires: {}, ...s });

export const BRANCH_NAMES: Record<BranchId, string> = {
  'martial.fist': '체술',
  'martial.sword': '검술',
  'martial.gun': '사격',
  'haki.observation': '견문색',
  'haki.armament': '무장색',
  'haki.conqueror': '패왕색',
  'fruit': '악마의 열매',
};

export const GATE_NAMES: Record<string, string> = {
  'martial.fist.master': '체술 오의',
  'martial.fist.grand': '체술 극의',
  'martial.sword.master': '검술 오의',
  'martial.sword.grand': '검술 극의',
  'martial.gun.master': '사격 오의',
  'martial.gun.grand': '사격 극의',
  'haki.observation.awaken': '견문색 눈뜸',
  'haki.observation.sharp': '견문색 단련',
  'haki.observation.future': '미래 보기',
  'haki.armament.awaken': '무장색 눈뜸',
  'haki.armament.hard': '무장색 경화',
  'haki.armament.flow': '무장색 유동',
  'haki.conqueror.awaken': '패왕색 눈뜸',
  'haki.conqueror.coat': '패왕색 두르기',
  'fruit.awaken': '열매 각성',
};

export const SKILLS: Skill[] = [
  // ---------------- 체술
  sk({ id: 'fist_jab', name: '정권 지르기', branch: 'martial.fist', tier: 1, kind: 'attack', stat: 'str', power: 1.3, cost: 6, cooldown: 0, when: 'always', text: '단단히 쥔 주먹으로 곧게 지른다.' }),
  sk({ id: 'fist_guard', name: '철벽 자세', branch: 'martial.fist', tier: 1, kind: 'guard', stat: 'str', power: 0, cost: 8, cooldown: 3, when: 'afterEnemyBig', effect: { type: 'guard', value: 0.5, turns: 1 }, requires: { skills: [{ id: 'fist_jab', mastery: 15 }] }, text: '큰 공격 뒤에 자세를 굳혀 다음 피해를 절반으로 줄인다.' }),
  sk({ id: 'fist_combo', name: '백열 연타', branch: 'martial.fist', tier: 2, kind: 'attack', stat: 'str', power: 1.8, cost: 14, cooldown: 2, when: 'always', requires: { skills: [{ id: 'fist_jab', mastery: 35 }], base: { str: 18 } }, text: '눈에 보이지 않는 주먹을 쏟아붓는다.' }),
  sk({ id: 'fist_counter', name: '되받아치기', branch: 'martial.fist', tier: 2, kind: 'attack', stat: 'str', power: 2.2, cost: 12, cooldown: 2, when: 'afterEnemyBig', requires: { skills: [{ id: 'fist_guard', mastery: 30 }] }, text: '상대의 큰 기술을 흘리고 그 틈을 친다.' }),
  sk({ id: 'fist_quake', name: '진각', branch: 'martial.fist', tier: 3, kind: 'attack', stat: 'str', power: 2.4, cost: 22, cooldown: 3, when: 'always', tags: ['area'], requires: { skills: [{ id: 'fist_combo', mastery: 50 }], base: { str: 35 } }, text: '땅을 굴러 주변을 뒤흔든다. 피하기 어렵다.' }),
  sk({ id: 'fist_iron', name: '강철 몸', branch: 'martial.fist', tier: 3, kind: 'passive', stat: 'str', power: 0, cost: 0, cooldown: 0, when: 'always', effect: { type: 'guard', value: 0.08, turns: 0 }, requires: { skills: [{ id: 'fist_guard', mastery: 50 }], base: { vit: 30 } }, text: '단련한 몸이 받는 피해를 늘 8% 줄인다.' }),
  sk({ id: 'fist_secret', name: '오의 · 천붕권', branch: 'martial.fist', tier: 4, kind: 'attack', stat: 'str', power: 3.2, cost: 35, cooldown: 4, when: 'always', requires: { skills: [{ id: 'fist_quake', mastery: 60 }], base: { str: 55 }, gate: 'martial.fist.master' }, text: '하늘을 무너뜨린다는 일격. 스승에게서만 배운다.' }),
  sk({ id: 'fist_final', name: '극의 · 패도권', branch: 'martial.fist', tier: 5, kind: 'attack', stat: 'str', power: 4.2, cost: 50, cooldown: 5, when: 'always', requires: { skills: [{ id: 'fist_secret', mastery: 70 }], base: { str: 85 }, gate: 'martial.fist.grand' }, text: '체술의 끝. 주먹 하나로 섬을 가른다.' }),

  // ---------------- 검술
  sk({ id: 'sword_cut', name: '베기', branch: 'martial.sword', tier: 1, kind: 'attack', stat: 'str', power: 1.35, cost: 6, cooldown: 0, when: 'always', text: '기본에 충실한 한 칼.' }),
  sk({ id: 'sword_draw', name: '발도', branch: 'martial.sword', tier: 1, kind: 'attack', stat: 'spd', power: 1.9, cost: 10, cooldown: 3, when: 'opening', requires: { skills: [{ id: 'sword_cut', mastery: 15 }] }, text: '첫 합에 칼집에서 뽑으며 벤다.' }),
  sk({ id: 'sword_parry', name: '받아넘기기', branch: 'martial.sword', tier: 2, kind: 'guard', stat: 'spd', power: 0, cost: 10, cooldown: 3, when: 'afterEnemyBig', effect: { type: 'guard', value: 0.6, turns: 1 }, requires: { skills: [{ id: 'sword_cut', mastery: 30 }], base: { spd: 16 } }, text: '칼날로 공격을 흘린다.' }),
  sk({ id: 'sword_flash', name: '섬광 베기', branch: 'martial.sword', tier: 2, kind: 'attack', stat: 'spd', power: 2.0, cost: 14, cooldown: 2, when: 'always', requires: { skills: [{ id: 'sword_cut', mastery: 40 }], base: { spd: 20 } }, text: '보이지 않는 속도로 스쳐 지난다.' }),
  sk({ id: 'sword_wave', name: '나는 참격', branch: 'martial.sword', tier: 3, kind: 'attack', stat: 'str', power: 2.5, cost: 22, cooldown: 3, when: 'always', tags: ['area'], requires: { skills: [{ id: 'sword_flash', mastery: 50 }], base: { str: 32 } }, text: '참격을 날려 멀리 있는 적까지 벤다.' }),
  sk({ id: 'sword_finish', name: '일섬', branch: 'martial.sword', tier: 3, kind: 'attack', stat: 'spd', power: 3.0, cost: 20, cooldown: 3, when: 'enemyHpBelow30', requires: { skills: [{ id: 'sword_draw', mastery: 50 }], base: { spd: 32 } }, text: '약해진 상대를 단칼에 끝낸다.' }),
  sk({ id: 'sword_secret', name: '오의 · 사자 베기', branch: 'martial.sword', tier: 4, kind: 'attack', stat: 'str', power: 3.3, cost: 34, cooldown: 4, when: 'always', tags: ['pierce'], requires: { skills: [{ id: 'sword_wave', mastery: 60 }], base: { str: 50 }, gate: 'martial.sword.master' }, text: '숨을 읽어 무엇이든 벤다. 자연계에도 닿는다.' }),
  sk({ id: 'sword_final', name: '극의 · 천하무쌍', branch: 'martial.sword', tier: 5, kind: 'attack', stat: 'str', power: 4.3, cost: 50, cooldown: 5, when: 'always', tags: ['pierce', 'area'], requires: { skills: [{ id: 'sword_secret', mastery: 70 }], base: { str: 80 }, gate: 'martial.sword.grand' }, text: '세계 최강의 검이 닿는 곳.' }),

  // ---------------- 사격
  sk({ id: 'gun_shot', name: '조준 사격', branch: 'martial.gun', tier: 1, kind: 'attack', stat: 'spd', power: 1.3, cost: 5, cooldown: 0, when: 'always', text: '침착하게 겨누고 쏜다.' }),
  sk({ id: 'gun_quick', name: '속사', branch: 'martial.gun', tier: 1, kind: 'attack', stat: 'spd', power: 1.7, cost: 10, cooldown: 2, when: 'opening', requires: { skills: [{ id: 'gun_shot', mastery: 15 }] }, text: '상대가 움직이기 전에 연달아 쏜다.' }),
  sk({ id: 'gun_smoke', name: '연막탄', branch: 'martial.gun', tier: 2, kind: 'guard', stat: 'int', power: 0, cost: 10, cooldown: 4, when: 'hpBelow50', effect: { type: 'dodge', value: 0.4, turns: 2 }, requires: { skills: [{ id: 'gun_shot', mastery: 30 }], base: { int: 16 } }, text: '연기 속으로 숨어 두 합 동안 잘 피한다.' }),
  sk({ id: 'gun_snipe', name: '급소 저격', branch: 'martial.gun', tier: 2, kind: 'attack', stat: 'spd', power: 2.1, cost: 14, cooldown: 2, when: 'always', tags: ['pierce'], requires: { skills: [{ id: 'gun_shot', mastery: 40 }], base: { spd: 20 } }, text: '틈을 노려 꿰뚫는다.' }),
  sk({ id: 'gun_volley', name: '탄막', branch: 'martial.gun', tier: 3, kind: 'attack', stat: 'spd', power: 2.3, cost: 20, cooldown: 3, when: 'always', tags: ['area'], requires: { skills: [{ id: 'gun_quick', mastery: 50 }], base: { spd: 34 } }, text: '쏟아지는 총알로 피할 곳을 없앤다.' }),
  sk({ id: 'gun_bind', name: '그물탄', branch: 'martial.gun', tier: 3, kind: 'support', stat: 'int', power: 0, cost: 16, cooldown: 4, when: 'opening', effect: { type: 'bind', value: 0.6, turns: 1 }, requires: { skills: [{ id: 'gun_smoke', mastery: 40 }], base: { int: 28 } }, text: '그물을 쏘아 상대를 한 합 묶는다.' }),
  sk({ id: 'gun_secret', name: '오의 · 필중탄', branch: 'martial.gun', tier: 4, kind: 'attack', stat: 'spd', power: 3.2, cost: 32, cooldown: 4, when: 'always', tags: ['pierce'], requires: { skills: [{ id: 'gun_snipe', mastery: 60 }], base: { spd: 52 }, gate: 'martial.gun.master' }, text: '반드시 맞는 한 발.' }),
  sk({ id: 'gun_final', name: '극의 · 정복자의 탄환', branch: 'martial.gun', tier: 5, kind: 'attack', stat: 'spd', power: 4.1, cost: 48, cooldown: 5, when: 'always', tags: ['pierce', 'area'], requires: { skills: [{ id: 'gun_secret', mastery: 70 }], base: { spd: 82 }, gate: 'martial.gun.grand' }, text: '바다 끝까지 닿는 저격.' }),

  // ---------------- 견문색
  sk({ id: 'obs_sense', name: '기척 읽기', branch: 'haki.observation', tier: 1, kind: 'passive', stat: 'wil', power: 0, cost: 0, cooldown: 0, when: 'always', effect: { type: 'dodge', value: 0.03, turns: 0 }, requires: { gate: 'haki.observation.awaken' }, text: '사람의 기척을 느낀다. 견문색 1단계.' }),
  sk({ id: 'obs_read', name: '움직임 간파', branch: 'haki.observation', tier: 2, kind: 'guard', stat: 'wil', power: 0, cost: 10, cooldown: 3, when: 'afterEnemyBig', effect: { type: 'dodge', value: 0.8, turns: 1 }, requires: { skills: [{ id: 'obs_sense', mastery: 30 }], base: { wil: 20 } }, text: '다음 공격을 읽고 거의 반드시 피한다.' }),
  sk({ id: 'obs_strike', name: '급소 찌르기', branch: 'haki.observation', tier: 3, kind: 'attack', stat: 'spd', power: 2.2, cost: 15, cooldown: 2, when: 'always', requires: { skills: [{ id: 'obs_read', mastery: 40 }], gate: 'haki.observation.sharp' }, text: '읽어 낸 빈틈을 정확히 친다. 견문색 2단계.' }),
  sk({ id: 'obs_future', name: '미래 보기', branch: 'haki.observation', tier: 5, kind: 'passive', stat: 'wil', power: 0, cost: 0, cooldown: 0, when: 'always', effect: { type: 'dodge', value: 0.12, turns: 0 }, requires: { skills: [{ id: 'obs_strike', mastery: 60 }], base: { wil: 60 }, gate: 'haki.observation.future' }, text: '조금 앞의 미래가 보인다. 견문색 3단계.' }),

  // ---------------- 무장색
  sk({ id: 'arm_coat', name: '무장 두르기', branch: 'haki.armament', tier: 1, kind: 'passive', stat: 'wil', power: 0, cost: 0, cooldown: 0, when: 'always', effect: { type: 'buff', value: 0.05, turns: 0 }, requires: { gate: 'haki.armament.awaken' }, text: '보이지 않는 갑옷을 두른다. 자연계에 닿는다. 무장색 1단계.' }),
  sk({ id: 'arm_strike', name: '무장 일격', branch: 'haki.armament', tier: 2, kind: 'attack', stat: 'str', power: 2.0, cost: 14, cooldown: 2, when: 'always', tags: ['armament'], requires: { skills: [{ id: 'arm_coat', mastery: 30 }] }, text: '패기를 실은 한 방.' }),
  sk({ id: 'arm_guard', name: '경화 방어', branch: 'haki.armament', tier: 2, kind: 'guard', stat: 'wil', power: 0, cost: 12, cooldown: 3, when: 'hpBelow50', effect: { type: 'guard', value: 0.5, turns: 2 }, requires: { skills: [{ id: 'arm_coat', mastery: 30 }] }, text: '몸을 굳혀 두 합 동안 피해를 절반으로 줄인다.' }),
  sk({ id: 'arm_hard', name: '흑도', branch: 'haki.armament', tier: 3, kind: 'attack', stat: 'str', power: 2.6, cost: 22, cooldown: 3, when: 'always', tags: ['armament', 'pierce'], requires: { skills: [{ id: 'arm_strike', mastery: 50 }], base: { wil: 35 }, gate: 'haki.armament.hard' }, text: '검게 굳힌 일격. 무장색 2단계.' }),
  sk({ id: 'arm_flow', name: '유동 · 내부 파괴', branch: 'haki.armament', tier: 5, kind: 'attack', stat: 'str', power: 3.6, cost: 35, cooldown: 4, when: 'always', tags: ['armament', 'pierce'], requires: { skills: [{ id: 'arm_hard', mastery: 60 }], base: { wil: 60 }, gate: 'haki.armament.flow' }, text: '패기를 흘려 넣어 안에서 부순다. 무장색 3단계.' }),

  // ---------------- 패왕색
  sk({ id: 'con_burst', name: '위압', branch: 'haki.conqueror', tier: 2, kind: 'support', stat: 'wil', power: 0, cost: 20, cooldown: 5, when: 'opening', effect: { type: 'bind', value: 0.5, turns: 1 }, requires: { gate: 'haki.conqueror.awaken' }, text: '기세로 상대를 얼어붙게 한다.' }),
  sk({ id: 'con_wave', name: '패기 해방', branch: 'haki.conqueror', tier: 4, kind: 'attack', stat: 'wil', power: 2.8, cost: 30, cooldown: 4, when: 'always', tags: ['area'], requires: { skills: [{ id: 'con_burst', mastery: 50 }], base: { wil: 50 } }, text: '패기를 터뜨려 주위를 쓰러뜨린다.' }),
  sk({ id: 'con_coat', name: '패왕색 두르기', branch: 'haki.conqueror', tier: 6, kind: 'attack', stat: 'wil', power: 4.5, cost: 45, cooldown: 4, when: 'always', tags: ['armament', 'pierce'], requires: { skills: [{ id: 'con_wave', mastery: 60 }], base: { wil: 80 }, gate: 'haki.conqueror.coat' }, text: '정점에 선 자만 쓰는 일격.' }),
];

/** 무장색 · 견문색 단계를 정하는 큰 단계 */
export const HAKI_LEVEL_GATES = {
  armament: ['haki.armament.awaken', 'haki.armament.hard', 'haki.armament.flow'],
  observation: ['haki.observation.awaken', 'haki.observation.sharp', 'haki.observation.future'],
};

/** 기술이 갈래별로 처음 배우는 기술 (입문 때 바로 배운다) */
export const BRANCH_STARTER: Partial<Record<BranchId, string>> = {
  'martial.fist': 'fist_jab',
  'martial.sword': 'sword_cut',
  'martial.gun': 'gun_shot',
};
