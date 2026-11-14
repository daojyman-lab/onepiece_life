// 인생에서 흘러가는 작은 사건. 플레이어가 고르지 않는다. 자동으로 일어나 기록에 한 줄 남는다.
// 결과(능력치 소폭 상승 등)는 효과에서 자동으로 문구를 만든다 (core/sim/lifeEvents.ts).
// 자리표시: {place} 고향, {port} 지금 항구, {sea} 해역, {rival} 라이벌, {father} {mother}, {crew} 동료 한 명
import type { Condition, Effect } from '../core/types';

export interface LifeEvent {
  id: string;
  when: Condition[];
  weight: number;
  cooldown: number;            // 다시 일어나기까지의 달 수
  text: string[];              // 이 중 하나
  effects: Effect[];
}

const e = (x: LifeEvent) => x;
const child: Condition = { c: 'age', max: 9 };
const teen: Condition = { c: 'age', min: 10, max: 15 };
const adult: Condition = { c: 'age', min: 16 };
const atSea: Condition = { c: 'route', is: ['pirate', 'marine', 'revolution'] };
const pirate: Condition = { c: 'route', is: ['pirate', 'revolution'] };
const marine: Condition = { c: 'route', is: ['marine'] };
const hasCrew: Condition = { c: 'crew', min: 1 };

export const LIFE_EVENTS: LifeEvent[] = [
  // ======================================================== 유년기 (1~9세)
  e({ id: 'c_hill', when: [child], weight: 10, cooldown: 12, text: ['{place} 뒷산에서 뛰어다니며 놀았다.', '하루 종일 언덕을 오르내리며 술래잡기를 했다.'], effects: [{ op: 'base', key: 'vit', add: 0.6 }] }),
  e({ id: 'c_cold', when: [child], weight: 7, cooldown: 12, text: ['감기에 걸려서 며칠 푹 쉬었다.', '배탈이 나서 이틀을 꼬박 앓았다.'], effects: [{ op: 'hp', add: -5 }] }),
  e({ id: 'c_swim', when: [child], weight: 8, cooldown: 12, text: ['부두 아래에서 헤엄치기를 배웠다.', '바닷가에서 조개를 줍다 파도에 휩쓸릴 뻔했다.'], effects: [{ op: 'base', key: 'spd', add: 0.5 }] }),
  e({ id: 'c_book', when: [child], weight: 6, cooldown: 12, text: ['마을 책방 주인이 그림책을 읽어 주었다.', '낡은 해도를 보며 바다 저편을 상상했다.'], effects: [{ op: 'base', key: 'int', add: 0.6 }] }),
  e({ id: 'c_fight', when: [child], weight: 6, cooldown: 12, text: ['동네 아이들과 막대기 칼싸움을 했다.', '{rival}와(과) 주먹다짐을 하다 둘 다 혼났다.'], effects: [{ op: 'base', key: 'str', add: 0.5 }] }),
  e({ id: 'c_family', when: [child], weight: 6, cooldown: 12, text: ['{mother}와(과) 시장에 가서 생선을 샀다.', '{father}의 무릎에 앉아 바다 이야기를 들었다.'], effects: [{ op: 'base', key: 'wil', add: 0.4 }, { op: 'bond', who: '어머니', add: 2 }] }),
  e({ id: 'c_lucky', when: [child], weight: 4, cooldown: 24, text: ['모래사장에서 반짝이는 동전을 주웠다.', '떠돌이 장사꾼이 사탕을 공짜로 주었다.'], effects: [{ op: 'base', key: 'luk', add: 0.5 }, { op: 'money', add: 100 }] }),
  e({ id: 'c_scold', when: [child], weight: 4, cooldown: 18, text: ['몰래 배에 숨어들었다가 들켜 크게 혼났다.', '이웃집 감을 따다 들켜 한 시간 동안 벌을 섰다.'], effects: [{ op: 'base', key: 'wil', add: 0.5 }] }),

  // ======================================================== 수련기 (10~15세)
  e({ id: 't_run', when: [teen], weight: 9, cooldown: 6, text: ['새벽마다 {place} 바닷가를 달렸다.', '무거운 통나무를 지고 언덕을 올랐다.'], effects: [{ op: 'base', key: 'vit', add: 0.5 }, { op: 'base', key: 'spd', add: 0.3 }] }),
  e({ id: 't_drill', when: [teen, { c: 'focus', is: ['martial.fist', 'martial.sword', 'martial.gun'] }], weight: 9, cooldown: 4, text: ['손바닥이 터지도록 기본기를 반복했다.', '사범에게 자세를 고쳐 잡혔다.', '해가 질 때까지 같은 동작만 천 번 했다.'], effects: [{ op: 'mastery', skill: 'focus', add: 2 }] }),
  e({ id: 't_cold', when: [teen], weight: 6, cooldown: 12, text: ['감기에 걸려 수련을 며칠 쉬었다.', '무리하다 근육이 놀라 이틀 쉬었다.'], effects: [{ op: 'hp', add: -6 }] }),
  e({ id: 't_rival', when: [teen, { c: 'person', kind: 'rival', has: true }], weight: 6, cooldown: 8, text: ['{rival}이(가) 새 기술을 익혔다는 소문에 잠이 오지 않았다.', '{rival}와(과) 바닷가까지 달리기 시합을 했다.'], effects: [{ op: 'base', key: 'spd', add: 0.4 }, { op: 'bond', who: 'rival', add: 3 }] }),
  e({ id: 't_work', when: [teen], weight: 5, cooldown: 8, text: ['항구에서 짐을 나르며 용돈을 벌었다.', '어선에서 그물 손질을 거들었다.'], effects: [{ op: 'money', add: 400 }, { op: 'base', key: 'str', add: 0.3 }] }),
  e({ id: 't_study', when: [teen], weight: 5, cooldown: 8, text: ['밤늦게 항해술 책을 읽었다.', '별자리로 방향 찾는 법을 익혔다.'], effects: [{ op: 'base', key: 'int', add: 0.6 }] }),
  e({ id: 't_festival', when: [teen], weight: 4, cooldown: 12, text: ['{place}의 축제에서 밤새 춤을 췄다.', '마을 씨름 대회에 나가 3등을 했다.'], effects: [{ op: 'base', key: 'luk', add: 0.4 }, { op: 'base', key: 'wil', add: 0.3 }] }),
  e({ id: 't_news', when: [teen], weight: 4, cooldown: 12, text: ['신문에 실린 대해적의 현상금 기사를 오려 두었다.', '해군 함대가 수평선을 지나가는 것을 지켜봤다.'], effects: [{ op: 'base', key: 'wil', add: 0.4 }] }),
  e({ id: 't_letter', when: [teen], weight: 3, cooldown: 12, text: ['{mother}가 수련복을 새로 지어 주었다.', '{father}가 말없이 등을 두드려 주었다.'], effects: [{ op: 'bond', who: '아버지', add: 3 }, { op: 'base', key: 'wil', add: 0.3 }] }),
  e({ id: 't_scrape', when: [teen], weight: 4, cooldown: 10, text: ['절벽에서 뛰어내리다 무릎이 까졌다.', '목검에 손가락을 찧었다.'], effects: [{ op: 'hp', add: -4 }, { op: 'base', key: 'wil', add: 0.3 }] }),

  // ======================================================== 바다로 나간 뒤
  e({ id: 'a_storm', when: [adult, atSea], weight: 6, cooldown: 6, text: ['{sea}의 거친 파도 속에서 밤새 돛을 붙잡았다.', '갑작스런 스콜에 온몸이 젖었다.'], effects: [{ op: 'base', key: 'vit', add: 0.4 }] }),
  e({ id: 'a_cold', when: [adult], weight: 6, cooldown: 10, text: ['감기에 걸려 선실에서 좀 쉬었다.', '상한 생선을 먹고 하루 앓았다.', '{port}의 습한 날씨에 몸살이 났다.'], effects: [{ op: 'hp', add: -6 }] }),
  e({ id: 'a_train', when: [adult], weight: 8, cooldown: 3, text: ['갑판에서 혼자 수련했다.', '{port} 부둣가에서 땀을 흘렸다.', '파도 소리에 맞춰 호흡을 가다듬었다.'], effects: [{ op: 'mastery', skill: 'focus', add: 1.5 }] }),
  e({ id: 'a_port_food', when: [adult, atSea], weight: 5, cooldown: 6, text: ['{port}의 명물 요리를 배불리 먹었다.', '{port} 시장에서 처음 보는 과일을 맛봤다.'], effects: [{ op: 'hp', add: 6 }, { op: 'money', add: -300 }] }),
  e({ id: 'a_gamble', when: [adult, atSea], weight: 3, cooldown: 12, text: ['{port}의 도박장에서 한판 벌였다.'], effects: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 3000 }], else: [{ op: 'money', add: -2000 }] }] }),
  e({ id: 'a_odd_job', when: [adult, atSea], weight: 4, cooldown: 6, text: ['{port}에서 짐 나르는 일을 거들고 품삯을 받았다.', '난파선에서 쓸 만한 물건을 건져 팔았다.'], effects: [{ op: 'money', add: 1500 }] }),
  e({ id: 'a_map', when: [adult, atSea], weight: 3, cooldown: 12, text: ['{sea}의 해도를 새로 그려 넣었다.', '{port}의 늙은 항해사에게 해류 이야기를 들었다.'], effects: [{ op: 'base', key: 'int', add: 0.5 }] }),
  e({ id: 'a_seaking', when: [adult, atSea], weight: 3, cooldown: 12, text: ['배 옆으로 거대한 해왕류가 지나갔다. 숨을 죽였다.', '바다 위로 뛰어오른 날치 떼를 잡아 저녁으로 먹었다.'], effects: [{ op: 'base', key: 'luk', add: 0.3 }] }),
  e({ id: 'a_fruit_swim', when: [adult, { c: 'fruit', has: true }], weight: 3, cooldown: 18, text: ['갑판에서 미끄러져 바다에 빠질 뻔했다. 능력자의 몸이 원망스럽다.', '목욕물에 몸을 담그자 힘이 쭉 빠졌다.'], effects: [{ op: 'base', key: 'wil', add: 0.3 }] }),
  e({ id: 'a_fruit_play', when: [adult, { c: 'fruit', has: true }], weight: 4, cooldown: 8, text: ['열매의 힘을 이리저리 시험해 봤다.', '열매 능력으로 장난을 치다 동료에게 혼났다.'], effects: [{ op: 'base', key: 'int', add: 0.4 }] }),
  e({ id: 'a_letter', when: [adult], weight: 3, cooldown: 18, text: ['{place}에서 {mother}의 편지가 왔다. 건강하라는 말뿐이었다.', '고향 소식을 실은 신문을 읽었다.'], effects: [{ op: 'bond', who: '어머니', add: 4 }, { op: 'base', key: 'wil', add: 0.2 }] }),
  e({ id: 'a_rival_news', when: [adult, { c: 'person', kind: 'rival', has: true }], weight: 3, cooldown: 18, text: ['신문에 {rival}의 이름이 실렸다. 지고 싶지 않다.', '{port}에서 {rival}의 소문을 들었다.'], effects: [{ op: 'mastery', skill: 'focus', add: 2 }] }),
  e({ id: 'a_hurt', when: [adult], weight: 3, cooldown: 12, text: ['밧줄에 손바닥이 쓸렸다.', '술집 시비에 휘말려 멍이 들었다.'], effects: [{ op: 'hp', add: -5 }] }),

  // 해적
  e({ id: 'p_party', when: [adult, pirate, hasCrew], weight: 5, cooldown: 6, text: ['{crew}와(과) 갑판에서 밤새 연회를 열었다.', '{crew}가 노래를 부르고 모두 따라 불렀다.'], effects: [{ op: 'hp', add: 5 }, { op: 'base', key: 'wil', add: 0.3 }] }),
  e({ id: 'p_poster', when: [adult, pirate], weight: 4, cooldown: 12, text: ['{port} 게시판에 붙은 내 수배서를 봤다. 사진이 마음에 안 든다.', '해군 순찰선을 피해 섬 그늘에 숨었다.'], effects: [{ op: 'fame', add: 1 }] }),
  e({ id: 'p_loot', when: [adult, pirate], weight: 4, cooldown: 8, text: ['악덕 상인의 창고를 털었다.', '버려진 해적 아지트에서 금화 몇 닢을 찾았다.'], effects: [{ op: 'money', add: 2500 }] }),

  // 해군
  e({ id: 'n_drill', when: [adult, marine], weight: 6, cooldown: 4, text: ['기지에서 아침 점호와 구보를 했다.', '사격장에서 표적을 맞췄다.', '부하들의 훈련을 감독했다.'], effects: [{ op: 'base', key: 'vit', add: 0.3 }, { op: 'mastery', skill: 'focus', add: 1 }] }),
  e({ id: 'n_paper', when: [adult, marine], weight: 4, cooldown: 8, text: ['밀린 보고서를 밤새 썼다.', '상관에게 칭찬을 들었다.'], effects: [{ op: 'base', key: 'int', add: 0.4 }, { op: 'fame', add: 1 }] }),
  e({ id: 'n_patrol', when: [adult, marine], weight: 4, cooldown: 8, text: ['{port}의 치안을 살폈다. 아이들이 손을 흔들었다.', '조난당한 어선을 구조했다.'], effects: [{ op: 'fame', add: 2 }] }),

  // 동료
  e({ id: 'm_crew_talk', when: [adult, hasCrew], weight: 4, cooldown: 6, text: ['{crew}와(과) 꿈 이야기를 나눴다.', '{crew}에게 요리를 배웠다. 맛은 별로였다.', '{crew}와(과) 대련을 했다.'], effects: [{ op: 'base', key: 'wil', add: 0.3 }] }),

  // 나이
  e({ id: 'o_back', when: [{ c: 'age', min: 45 }], weight: 5, cooldown: 12, text: ['허리가 쑤셔 하루 쉬었다.', '예전처럼 몸이 따라 주지 않는다.'], effects: [{ op: 'hp', add: -5 }] }),
  e({ id: 'o_teach', when: [{ c: 'age', min: 40 }], weight: 4, cooldown: 12, text: ['젊은 선원에게 요령을 가르쳐 주었다.', '지난 항해를 떠올리며 일지를 정리했다.'], effects: [{ op: 'base', key: 'int', add: 0.4 }, { op: 'base', key: 'wil', add: 0.3 }] }),
];
