// 해역 임무. {port}는 임무가 뽑힐 때 그 해역의 항구로 채운다.
// 강적전 단계의 적: 'gen:elite'는 우두머리 한 명, 'gen:captain'은 간부를 거느린 우두머리.
import type { Mission } from '../core/types';

const m = (x: Mission) => x;

export const MISSIONS: Mission[] = [
  // ---------------- 해적
  m({ id: 'p_crewhunt', stages: 'any', route: 'pirate', title: '{port}에서 동료 찾기',
    steps: [
      { kind: 'story', months: 4, text: '{port}의 술집과 부두를 돌며 쓸 만한 사람을 찾는다.', effects: [{ op: 'fame', add: 2 }] },
      { kind: 'battle', enemy: 'gen:elite:thug', elite: true, text: '눈여겨본 사람을 노리는 놈이 나타났다.' },
    ],
    reward: [{ op: 'recruit', crew: { role: 'vanguard' } }, { op: 'money', add: 6000 }] }),
  m({ id: 'p_treasure', stages: 'any', route: 'pirate', title: '{port} 앞바다의 보물',
    steps: [
      { kind: 'story', months: 5, text: '낡은 해도를 따라 {port} 앞바다를 뒤진다.', effects: [{ op: 'chance', p: 0.05, then: [{ op: 'findFruit', pool: 'any' }] }] },
      { kind: 'story', months: 3, text: '보물섬의 동굴 입구를 찾았다.', effects: [{ op: 'money', add: 5000 }] },
      { kind: 'battle', enemy: 'gen:captain:rival_crew', elite: true, atSea: true, text: '같은 보물을 노리는 해적단과 마주쳤다.' },
    ],
    reward: [{ op: 'money', add: 15000 }, { op: 'fame', add: 6 }] }),
  m({ id: 'p_breakout', stages: 'any', route: 'pirate', title: '{port} 해군 감옥 습격',
    steps: [
      { kind: 'story', months: 4, text: '{port} 감옥에 붙잡힌 사람들이 있다는 소문을 들었다.', effects: [] },
      { kind: 'story', months: 3, text: '경비 교대 시간을 알아냈다.', effects: [{ op: 'base', key: 'int', add: 1 }] },
      { kind: 'battle', enemy: 'gen:captain:marine_officer', elite: true, text: '감옥을 지키는 장교가 앞을 막는다.' },
    ],
    reward: [{ op: 'fame', add: 10 }, { op: 'money', add: 8000 }, { op: 'chance', p: 0.5, then: [{ op: 'recruit', crew: { role: 'support' } }] }] }),
  m({ id: 'p_tyrant', stages: 'any', route: 'pirate', title: '{port}의 폭군 몰아내기',
    steps: [
      { kind: 'story', months: 5, text: '{port} 사람들이 지배자의 횡포에 시달린다.', effects: [{ op: 'base', key: 'wil', add: 1 }] },
      { kind: 'battle', enemy: 'gen:captain:tyrant', elite: true, text: '폭군의 저택으로 쳐들어간다.' },
    ],
    reward: [{ op: 'fame', add: 12 }, { op: 'money', add: 12000 }] }),
  m({ id: 'p_rival_crew', stages: 'any', route: 'pirate', title: '{port} 앞바다의 해적 사냥꾼',
    steps: [
      { kind: 'story', months: 4, text: '현상금 사냥꾼이 우리 목을 노린다는 소식이 {port}에서 들려왔다.', effects: [] },
      { kind: 'battle', enemy: 'gen:elite:bounty_hunter', elite: true, atSea: true, text: '해적 사냥꾼이 배에 올라탔다.' },
    ],
    reward: [{ op: 'fame', add: 8 }, { op: 'item', id: 'potion', count: 2 }] }),
  m({ id: 'p_supply', stages: 'any', route: 'pirate', title: '{port}에서 배 손보기',
    steps: [
      { kind: 'story', months: 6, text: '{port}의 조선소에서 배를 고치며 일거리를 받는다.', effects: [{ op: 'money', add: 8000 }] },
      { kind: 'battle', enemy: 'gen:elite:thug', elite: true, text: '조선소를 털러 온 무리를 쫓아낸다.' },
    ],
    reward: [{ op: 'money', add: 10000 }, { op: 'chance', p: 0.4, then: [{ op: 'recruit', crew: { role: 'shipwright' } }] }] }),

  // ---------------- 해군
  m({ id: 'n_patrol', stages: 'any', route: 'marine', title: '{port} 연안 순찰',
    steps: [
      { kind: 'story', months: 4, text: '{port} 연안을 돌며 해적선의 흔적을 쫓는다.', effects: [{ op: 'fame', add: 2 }] },
      { kind: 'battle', enemy: 'gen:elite:pirate_captain', elite: true, atSea: true, text: '해적선을 따라잡았다. 선장이 갑판에 나섰다.' },
    ],
    reward: [{ op: 'fame', add: 8 }, { op: 'money', add: 6000 }] }),
  m({ id: 'n_escort', stages: 'any', route: 'marine', title: '{port} 상선 호위',
    steps: [
      { kind: 'story', months: 5, text: '{port}로 가는 상선단을 호위한다.', effects: [{ op: 'money', add: 4000 }] },
      { kind: 'battle', enemy: 'gen:captain:pirate_captain', elite: true, atSea: true, text: '해적단이 상선을 덮쳤다.' },
    ],
    reward: [{ op: 'fame', add: 10 }, { op: 'money', add: 10000 }] }),
  m({ id: 'n_hideout', stages: 'any', route: 'marine', title: '{port} 해적 소굴 소탕',
    steps: [
      { kind: 'story', months: 4, text: '{port} 뒷골목에서 해적 소굴의 위치를 캐낸다.', effects: [{ op: 'base', key: 'int', add: 1 }] },
      { kind: 'story', months: 3, text: '부하들과 포위망을 짠다.', effects: [{ op: 'chance', p: 0.5, then: [{ op: 'recruit', crew: { role: 'vanguard' } }] }] },
      { kind: 'battle', enemy: 'gen:captain:pirate_captain', elite: true, text: '소굴의 두목과 간부들이 버틴다.' },
    ],
    reward: [{ op: 'fame', add: 12 }, { op: 'money', add: 12000 }] }),
  m({ id: 'n_wanted', stages: 'any', route: 'marine', title: '{port}의 현상수배범 체포',
    steps: [
      { kind: 'story', months: 5, text: '{port}에 숨어든 현상수배범을 쫓는다.', effects: [] },
      { kind: 'battle', enemy: 'gen:elite:wanted', elite: true, text: '수배범이 궁지에 몰려 칼을 뽑았다.' },
    ],
    reward: [{ op: 'fame', add: 10 }, { op: 'money', add: 9000 }, { op: 'chance', p: 0.03, then: [{ op: 'findFruit', pool: 'any' }] }] }),
  m({ id: 'n_rescue', stages: 'any', route: 'marine', title: '{port} 납치 사건',
    steps: [
      { kind: 'story', months: 4, text: '{port}에서 사람들이 사라진다. 인신매매 조직의 짓이다.', effects: [{ op: 'base', key: 'wil', add: 1 }] },
      { kind: 'battle', enemy: 'gen:captain:slaver', elite: true, atSea: true, text: '노예선을 따라잡았다.' },
    ],
    reward: [{ op: 'fame', add: 12 }, { op: 'chance', p: 0.5, then: [{ op: 'recruit', crew: { role: 'medic' } }] }] }),
  m({ id: 'n_training', stages: 'any', route: 'marine', title: '{port} 신병 교관',
    steps: [
      { kind: 'story', months: 6, text: '{port} 지부에서 신병을 가르친다.', effects: [{ op: 'mastery', skill: 'focus', add: 4 }] },
      { kind: 'battle', enemy: 'gen:elite:pirate_captain', elite: true, text: '지부를 노린 해적이 쳐들어왔다.' },
    ],
    reward: [{ op: 'fame', add: 8 }, { op: 'recruit', crew: { role: 'support' } }] }),

  // ---------------- 공통
  m({ id: 'a_storm', stages: 'any', route: 'any', title: '{port} 근해의 폭풍',
    steps: [
      { kind: 'story', months: 3, text: '{port} 근해에서 거센 폭풍을 만났다.', effects: [{ op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] }] },
      { kind: 'battle', enemy: 'gen:elite:seaking', elite: true, atSea: true, text: '폭풍이 지나가자 거대한 해왕류가 배를 덮쳤다!' },
    ],
    reward: [{ op: 'money', add: 7000 }, { op: 'base', key: 'vit', add: 1 }] }),
  m({ id: 'a_arena', stages: 'any', route: 'any', title: '{port} 투기장',
    steps: [
      { kind: 'story', months: 4, text: '{port}에서 열리는 투기 대회에 이름을 올렸다.', effects: [{ op: 'fame', add: 2 }] },
      { kind: 'battle', enemy: 'gen:elite:arena', elite: true, text: '결승 상대가 링에 올랐다.' },
    ],
    reward: [{ op: 'money', add: 15000 }, { op: 'chance', p: 0.04, then: [{ op: 'findFruit', pool: 'any' }] }] }),
];

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((x) => [x.id, x])) as Record<string, Mission>;

/** 강적전 상대 이름 */
export const ENEMY_NAMES = {
  first: ['바르토', '그린', '크로우', '도노반', '레오', '마르코스', '세이지', '로렌', '가스파', '자크', '말코', '오스카', '테오', '하겐', '브루노', '카를로', '유진', '렉스'],
  firstF: ['라일라', '엘사', '모네', '카렌', '셀린', '도나', '이리스'],
  epithet: ['쇠주먹', '독사', '피바다', '외눈', '광견', '검은 돛', '천둥', '해골', '붉은 칼', '모래', '철갑', '사냥개', '해일', '그림자'],
  pirateTitle: ['해적 선장', '해적단 두목', '현상수배범'],
  marineTitle: ['해군 대령', '해군 중령', '지부 대령'],
  villainTitle: ['현상금 사냥꾼', '무법자 두목', '인신매매 조직 보스'],
};
