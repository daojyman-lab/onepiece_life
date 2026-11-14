// 중대한 선택. 조건과 효과는 값이다 (docs/02_설계/03_진행과_선택.md 5장).
// template가 있는 선택은 선택지를 상황에서 만든다 (core/choice/templates.ts).
// 자리표시: {name} 주인공 이름, {rival} 라이벌, {father} {mother}, {place} 고향, {port} 지금 항구, {sea} 해역
import type { Choice, Effect } from '../core/types';
import { CANON_CHOICES } from './canonEvents';

import { NAMED_CREW_CHOICES } from './namedCrew';
const c = (x: Choice) => x;
const lightHurt: Effect = { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] };

export const CHOICES: Choice[] = [
  // ======================================================== 유년기 (3 · 6 · 9세)
  c({ id: 'ch_errand', category: 'childhood', when: [{ c: 'age', max: 9 }], weight: 10, repeat: 'once', speaker: { person: '아버지' },
    title: '집안일을 돕다', body: '{father}이(가) 일손이 모자라다며 너를 불렀다. 무엇을 도울까?',
    options: [
      { label: '그물을 끌어올린다', hint: '힘과 체력이 붙는다', effects: [{ op: 'base', key: 'str', add: 2 }, { op: 'base', key: 'vit', add: 2 }] },
      { label: '장부 정리를 돕는다', hint: '머리가 좋아진다', effects: [{ op: 'base', key: 'int', add: 3 }, { op: 'base', key: 'luk', add: 1 }] },
      { label: '몰래 빠져나가 논다', hint: '빨라지고 운이 붙는다', effects: [{ op: 'base', key: 'spd', add: 2 }, { op: 'base', key: 'luk', add: 2 }] },
    ] }),
  c({ id: 'ch_rival', category: 'childhood', when: [{ c: 'age', max: 9 }, { c: 'person', kind: 'rival', has: false }], weight: 30, repeat: 'once', speaker: 'hero',
    title: '지기 싫은 아이', body: '{place}에 너만큼이나 고집 센 아이가 있다. 오늘도 눈이 마주쳤다.',
    options: [
      { label: '주먹으로 결판낸다', hint: '라이벌이 생긴다. 힘이 붙는다', effects: [{ op: 'person', add: { kind: 'rival', relation: '라이벌', bond: 25 } }, { op: 'base', key: 'str', add: 2 }, { op: 'trait', id: 'fighter' }] },
      { label: '경주로 겨룬다', hint: '라이벌이 생긴다. 빨라진다', effects: [{ op: 'person', add: { kind: 'rival', relation: '라이벌', bond: 40 } }, { op: 'base', key: 'spd', add: 2 }] },
      { label: '친구가 되자고 한다', hint: '좋은 친구가 생긴다. 정신이 단단해진다', effects: [{ op: 'person', add: { kind: 'rival', relation: '라이벌이자 친구', bond: 65 } }, { op: 'base', key: 'wil', add: 2 }] },
    ] }),
  c({ id: 'ch_drown', category: 'childhood', when: [{ c: 'age', max: 9 }], weight: 10, repeat: 'once', speaker: 'hero',
    title: '바다에 빠졌다', body: '부두에서 놀다 발이 미끄러졌다. 차가운 물이 목까지 찬다.',
    options: [
      { label: '죽을힘을 다해 헤엄친다', hint: '체력과 정신이 붙는다', effects: [{ op: 'base', key: 'vit', add: 2 }, { op: 'base', key: 'wil', add: 2 }] },
      { label: '소리쳐 도움을 부른다', hint: '구해 준 어른과 인연이 생긴다', effects: [{ op: 'person', add: { kind: 'ally', relation: '생명의 은인', bond: 70, age: 40 } }, { op: 'base', key: 'luk', add: 3 }] },
    ] }),
  c({ id: 'ch_legend', category: 'childhood', when: [{ c: 'age', max: 9 }], weight: 12, repeat: 'once', speaker: { canon: '떠돌이 뱃사람', faction: 'pirate', age: 50 },
    title: '떠돌이의 무용담', body: '항구 술집에서 늙은 뱃사람이 위대한 항로 이야기를 한다. 모두 숨죽여 듣는다.',
    options: [
      { label: '해적이 되고 싶다', hint: '자유를 꿈꾼다', effects: [{ op: 'flag', id: 'dream_pirate' }, { op: 'base', key: 'wil', add: 2 }] },
      { label: '해군이 되어 지키고 싶다', hint: '정의를 꿈꾼다', effects: [{ op: 'flag', id: 'dream_marine' }, { op: 'base', key: 'int', add: 1 }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '그 보물 지도를 훔친다', hint: '운이 붙는다. 들키면 혼난다', effects: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 3000 }, { op: 'base', key: 'luk', add: 3 }], else: [{ op: 'base', key: 'vit', add: 1 }] }] },
    ] }),
  c({ id: 'ch_storm', category: 'childhood', when: [{ c: 'age', min: 5, max: 9 }], weight: 10, repeat: 'once', speaker: { person: '어머니' },
    title: '폭풍의 밤', body: '폭풍이 마을을 덮쳤다. {mother}이(가) 지붕을 붙잡고 있다.',
    options: [
      { label: '함께 지붕을 붙잡는다', hint: '힘과 정신이 붙는다', effects: [{ op: 'base', key: 'str', add: 1 }, { op: 'base', key: 'wil', add: 2 }, { op: 'bond', who: '어머니', add: 15 }] },
      { label: '이웃 아이들을 대피시킨다', hint: '마을의 신뢰를 얻는다', effects: [{ op: 'base', key: 'int', add: 1 }, { op: 'base', key: 'spd', add: 1 }, { op: 'fame', add: 1 }] },
    ] }),
  c({ id: 'ch_chest', category: 'childhood', when: [{ c: 'age', min: 5, max: 9 }], weight: 6, repeat: 'once', speaker: 'hero',
    title: '해변의 상자', body: '썰물 뒤 모래톱에 낡은 상자가 묻혀 있다.',
    options: [
      { label: '열어 본다', hint: '무엇이 나올지 모른다', effects: [{ op: 'chance', p: 0.08, then: [{ op: 'findFruit', pool: 'any' }], else: [{ op: 'money', add: 2000 }] }] },
      { label: '어른에게 알린다', hint: '착한 아이라는 말을 듣는다', effects: [{ op: 'base', key: 'wil', add: 1 }, { op: 'base', key: 'luk', add: 1 }] },
    ] }),
  c({ id: 'ch_fever', category: 'childhood', when: [{ c: 'age', max: 9 }], weight: 6, repeat: 'once', speaker: { person: '어머니' },
    title: '열병', body: '며칠째 열이 내리지 않는다. 약은 비싸다.',
    options: [
      { label: '비싼 약을 쓴다', hint: '집안 살림이 기운다', effects: [{ op: 'base', key: 'vit', add: 1 }, { op: 'flag', id: 'family_poor' }] },
      { label: '이를 악물고 견딘다', hint: '몸이 단단해지지만 위험하다', effects: [{ op: 'chance', p: 0.8, then: [{ op: 'base', key: 'vit', add: 3 }, { op: 'base', key: 'wil', add: 2 }], else: [{ op: 'injury', severity: 'scar' }] }] },
    ] }),
  c({ id: 'ch_marine_visit', category: 'childhood', when: [{ c: 'age', min: 6, max: 9 }], weight: 8, repeat: 'once', speaker: { canon: '해군 장교', faction: 'marine', age: 45 },
    title: '해군이 왔다', body: '해적을 쫓던 해군 군함이 {place}에 들렀다. 장교가 너를 내려다본다.',
    options: [
      { label: '훈련을 구경시켜 달라고 조른다', hint: '무엇이든 따라 배운다', effects: [{ op: 'base', key: 'all', add: 1 }, { op: 'flag', id: 'dream_marine' }] },
      { label: '해적 편을 들어 혼난다', hint: '반항심이 자란다', effects: [{ op: 'base', key: 'wil', add: 3 }, { op: 'flag', id: 'dream_pirate' }] },
    ] }),

  // ======================================================== 입문 · 성장 방향
  c({ id: 'en_dojo', category: 'entry', template: 'focus', when: [{ c: 'age', min: 10 }, { c: 'focus', is: [null] }], weight: 100, repeat: 'cooldown', cooldownYears: 1, speaker: 'hero',
    title: '무엇을 배울까', body: '열 살이 되자 {place}의 어른들이 저마다 너를 데려가려 한다. 누구를 따를까?', options: [] }),

  // ======================================================== 특성 (보조 칸 대신. 2026-11-14)
  c({ id: 'ps_choose', category: 'entry', template: 'persona', when: [{ c: 'age', min: 13 }], weight: 0, repeat: 'cooldown', cooldownYears: 1, speaker: 'hero',
    title: '어떤 사람이 되어 가나', body: '', options: [] }),
  c({ id: 'ps_change', category: 'entry', template: 'persona', when: [{ c: 'age', min: 22 }], weight: 2, repeat: 'cooldown', cooldownYears: 10, speaker: 'hero',
    title: '사람이 바뀌는 계기', body: '', options: [] }),

  // ======================================================== 패기
  c({ id: 'hk_observation', category: 'master', template: 'haki', when: [{ c: 'age', min: 15 }, { c: 'gate', id: 'haki.observation.awaken', has: false }, { c: 'base', key: 'wil', min: 18 }], weight: 5, repeat: 'once', speaker: 'hero',
    title: '기척이 느껴진다', body: '눈을 감았는데 등 뒤의 사람이 보이는 것 같았다. 이 감각을 붙잡을까?', options: [] }),
  c({ id: 'hk_armament', category: 'master', template: 'haki', when: [{ c: 'age', min: 16 }, { c: 'gate', id: 'haki.armament.awaken', has: false }, { c: 'stage', min: 2 }], weight: 6, repeat: 'once', speaker: 'hero',
    title: '보이지 않는 갑옷', body: '위대한 항로의 강자들은 팔을 검게 물들인다. 그 힘을 손에 넣고 싶다.', options: [] }),
  c({ id: 'hk_armament_need', category: 'master', template: 'haki', when: [{ c: 'age', min: 14 }, { c: 'gate', id: 'haki.armament.awaken', has: false }, { c: 'flag', id: 'need_armament', has: true }], weight: 0, repeat: 'cooldown', cooldownYears: 6, speaker: 'hero',
    title: '닿지 않는 주먹', body: '몸이 연기처럼 흩어지는 상대에게 주먹이 빠져나갔다. 그 몸을 붙잡으려면 보이지 않는 힘, 무장색이 필요하다.', options: [] }),
  c({ id: 'hk_conqueror', category: 'master', template: 'haki', when: [{ c: 'trait', id: 'conqueror', has: true }, { c: 'gate', id: 'haki.conqueror.awaken', has: false }, { c: 'age', min: 16 }], weight: 10, repeat: 'cooldown', cooldownYears: 3, speaker: 'hero',
    title: '왕의 자질', body: '분노가 치밀자 주위 사람들이 픽픽 쓰러졌다. 이 힘은 무엇인가?', options: [] }),

  // ======================================================== 스승 · 열매 · 도전 · 배 (틀)
  c({ id: 'sd_offer', category: 'bond', template: 'side', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'marine', 'revolution'] }], weight: 5, repeat: 'cooldown', cooldownYears: 2, speaker: 'hero',
    title: '곁가지 이야기', body: '', options: [] }),
  c({ id: 'ms_seek', category: 'master', template: 'master', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 0, speaker: 'hero',
    title: '찾아낸 스승', body: '', options: [] }),
  c({ id: 'ms_return', category: 'master', template: 'master', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 1, speaker: 'hero',
    title: '스승의 약속', body: '', options: [] }),
  c({ id: 'ms_offer', category: 'master', template: 'master', when: [{ c: 'age', min: 13 }], weight: 10, repeat: 'cooldown', cooldownYears: 2, speaker: 'hero',
    title: '스승을 만나다', body: '', options: [] }),
  c({ id: 'fr_found', category: 'fruit', template: 'fruit', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 0, speaker: 'hero',
    title: '정체 모를 열매', body: '', options: [] }),
  c({ id: 'bo_challenge', category: 'challenge', template: 'challenge', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 0, speaker: 'hero',
    title: '해역의 벽', body: '', options: [] }),
  c({ id: 'sh_buy', category: 'ship', template: 'ship', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 0, speaker: 'hero',
    title: '더 큰 배', body: '', options: [] }),

  // ======================================================== 수련기 (10~15)
  c({ id: 'tr_rival_duel', category: 'bond', when: [{ c: 'age', min: 12, max: 15 }, { c: 'person', kind: 'rival', has: true }, { c: 'focus', is: ['martial.fist', 'martial.sword', 'martial.gun'] }], weight: 40, repeat: 'once', speaker: { person: '라이벌' },
    title: '라이벌의 도전장', body: '{rival}이(가) 도전장을 내밀었다. "이번엔 진짜로 붙자."',
    options: [
      { label: '받아들인다', hint: '첫 강적전. 준비와 관전을 배운다. 죽지 않는다', effects: [{ op: 'battle', enemy: 'rival', elite: true, lethal: false, spar: true }] },
      { label: '아직은 때가 아니다', hint: '라이벌이 실망한다', effects: [{ op: 'bond', who: '라이벌', add: -10 }, { op: 'base', key: 'int', add: 1 }] },
    ] }),
  c({ id: 'tr_bully', category: 'crisis', when: [{ c: 'age', min: 10, max: 15 }], weight: 8, repeat: 'once', speaker: 'hero',
    title: '항구의 불량배', body: '항구의 불량배들이 어린아이의 돈을 빼앗고 있다.',
    options: [
      { label: '끼어들어 막는다', hint: '평판이 오른다. 다칠 수 있다', effects: [{ op: 'fame', add: 2 }, { op: 'base', key: 'wil', add: 2 }, lightHurt] },
      { label: '어른을 부른다', hint: '지혜롭게 넘긴다', effects: [{ op: 'base', key: 'int', add: 2 }] },
      { label: '못 본 척한다', hint: '마음이 무겁다', effects: [{ op: 'base', key: 'luk', add: 1 }] },
    ] }),
  c({ id: 'tr_wanderer', category: 'master', when: [{ c: 'age', min: 11, max: 15 }, { c: 'base', key: 'wil', min: 12 }], weight: 6, repeat: 'once', speaker: { canon: '떠돌이 무인', faction: 'civil', age: 60 },
    title: '지나가던 강자', body: '허름한 차림의 노인이 너를 한참 바라보더니 말했다. "눈이 좋구나. 한 수 보여 주마."',
    options: [
      { label: '한 수 배운다', hint: '견문색의 실마리를 얻을지도 모른다', effects: [{ op: 'chance', p: 0.2, then: [{ op: 'gate', id: 'haki.observation.awaken' }, { op: 'log', text: '노인의 한 수 끝에, 기척이 느껴지기 시작했다.', type: 'growth' }], else: [{ op: 'base', key: 'wil', add: 3 }] }] },
      { label: '대련을 청한다', hint: '숙련이 크게 오른다. 다칠 수 있다', effects: [{ op: 'mastery', skill: 'focus', add: 15 }, { op: 'chance', p: 0.5, then: [{ op: 'injury', severity: 'light' }] }] },
    ] }),
  c({ id: 'tr_debt', category: 'crisis', when: [{ c: 'age', min: 11, max: 15 }, { c: 'flag', id: 'family_poor', has: true }], weight: 20, repeat: 'once', speaker: { person: '아버지' },
    title: '집안의 빚', body: '{father}이(가) 빚쟁이들에게 시달린다. 너도 무언가 해야 한다.',
    options: [
      { label: '부두에서 일한다', hint: '수련 시간이 준다', effects: [{ op: 'base', key: 'str', add: 2 }, { op: 'mastery', skill: 'focus', add: -5 }, { op: 'unflag', id: 'family_poor' }] },
      { label: '빚쟁이를 혼내 준다', hint: '위험하다. 이기면 빚이 사라진다', danger: true, effects: [{ op: 'chance', p: 0.5, then: [{ op: 'unflag', id: 'family_poor' }, { op: 'fame', add: 2 }], else: [{ op: 'injury', severity: 'heavy' }] }] },
    ] }),

  // ======================================================== 진로
  c({ id: 'cr_route', category: 'career', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['none'] }], weight: 100, repeat: 'cooldown', cooldownYears: 1, speaker: 'hero',
    title: '출항', body: '열여섯. {place}의 바다가 좁게 느껴진다. 어떤 길로 나갈까?',
    options: [
      { label: '해적이 된다', hint: '현상금이 명성이다. 자유롭지만 쫓긴다', effects: [{ op: 'route', to: 'pirate' }, { op: 'ship', id: 'raft', price: 0 }] },
      { label: '해군에 지원한다', hint: '이등병으로 시작한다. 하사가 되면 내 분대를 꾸린다', effects: [{ op: 'route', to: 'marine' }, { op: 'person', add: { kind: 'ally', relation: '지휘관 · 해군 중령', faction: 'marine', age: 44, bond: 50 } }, { op: 'log', text: '해군 지부에 입대했다. 한 중령의 분대에 이등병으로 배속되었다.', type: 'world' }] },
      { label: '1년 더 고향에서 수련한다', hint: '주력 숙련이 오른다', effects: [{ op: 'mastery', skill: 'focus', add: 8 }, { op: 'base', key: 'all', add: 1 }] },
    ] }),
  c({ id: 'cr_revolution', category: 'career', when: [{ c: 'route', is: ['pirate'] }, { c: 'stage', min: 3 }, { c: 'flag', id: 'met_revolution', has: true }], weight: 30, repeat: 'once', speaker: { canon: '혁명군 참모', faction: 'rev', age: 30 },
    title: '혁명의 부름', body: '혁명군의 참모가 찾아왔다. "세계 정부와 싸울 힘을 빌려 달라."',
    options: [
      { label: '혁명군에 합류한다', hint: '길이 혁명군으로 바뀐다. 해적의 현상금은 그대로', effects: [{ op: 'route', to: 'revolution' }, { op: 'recruit', crew: { role: 'support' } }] },
      { label: '해적으로 남는다', hint: '자유가 먼저다', effects: [{ op: 'base', key: 'wil', add: 2 }] },
    ] }),
  c({ id: 'cr_rev_seed', category: 'bond', when: [{ c: 'route', is: ['pirate'] }, { c: 'stage', min: 2 }, { c: 'flag', id: 'met_revolution', has: false }], weight: 6, repeat: 'once', speaker: { canon: '수상한 망토의 사내', faction: 'rev', age: 35 },
    title: '천룡인의 행차', body: '{port}에서 천룡인이 사람을 노예로 끌고 간다. 모두 고개를 숙인다.',
    options: [
      { label: '끼어들어 구한다', hint: '현상금이 오른다. 누군가 지켜보고 있었다', effects: [{ op: 'fame', add: 15 }, { op: 'flag', id: 'met_revolution' }, lightHurt] },
      { label: '참는다', hint: '분노를 삼킨다', effects: [{ op: 'base', key: 'wil', add: 2 }] },
    ] }),
  c({ id: 'cr_retire', category: 'career', when: [{ c: 'age', min: 55 }], weight: 5, repeat: 'cooldown', cooldownYears: 4, speaker: 'hero',
    title: '은퇴를 생각하다', body: '몸이 예전 같지 않다. 바다를 떠날 때가 된 걸까?',
    options: [
      { label: '은퇴한다', hint: '인생을 마무리하고 결산한다', effects: [{ op: 'retire' }] },
      { label: '아직이다', hint: '계속 나아간다', effects: [{ op: 'base', key: 'wil', add: 1 }] },
    ] }),
  c({ id: 'cr_apex_retire', category: 'career', when: [{ c: 'flag', id: 'apex', has: true }], weight: 40, repeat: 'cooldown', cooldownYears: 2, speaker: 'hero',
    title: '정점에서', body: '바다의 정점에 섰다. 이제 무엇을 할까?',
    options: [
      { label: '전설로 남고 은퇴한다', hint: '인생을 마무리하고 결산한다', effects: [{ op: 'retire' }] },
      { label: '바다를 계속 누빈다', hint: '정점을 지킨다', effects: [{ op: 'fame', add: 20 }] },
    ] }),
  c({ id: cr('marine_promo'), category: 'career', when: [{ c: 'route', is: ['marine'] }, { c: 'age', min: 18 }], weight: 6, repeat: 'cooldown', cooldownYears: 3, speaker: { canon: '해군 상관', faction: 'marine', age: 50 },
    title: '상관의 제안', body: '상관이 너를 불렀다. "어려운 임무가 하나 있다. 맡아 보겠나?"',
    options: [
      { label: '맡는다', hint: '강적과 싸운다. 이기면 진급한다', effects: [{ op: 'battle', enemy: 'gen:elite:pirate_captain', elite: true, lethal: true }, { op: 'flag', id: 'promo_mission' }] },
      { label: '정중히 거절한다', hint: '평판이 조금 깎인다', effects: [{ op: 'fame', add: -3 }] },
    ] }),

  // ======================================================== 해군: 분대 생활과 분대원 스카우트 (하사부터)
  c({ id: 'mn_commander', category: 'bond', when: [{ c: 'route', is: ['marine'] }, { c: 'rank', max: 2 }, { c: 'age', min: 16 }], weight: 8, repeat: 'cooldown', cooldownYears: 2, speaker: { person: '지휘관' },
    title: '중령의 분대에서', body: '{commander} 중령의 분대에서 이등병 생활이 이어진다. 오늘은 고된 순찰이 잡혀 있다.',
    options: [
      { label: '앞장서서 순찰을 돈다', hint: '공적이 오른다. 다칠 수 있다', effects: [{ op: 'fame', add: 4 }, { op: 'bond', who: '지휘관', add: 8 }, { op: 'chance', p: 0.25, then: [{ op: 'injury', severity: 'light' }] }] },
      { label: '선임에게 요령을 배운다', hint: '숙련이 오른다', effects: [{ op: 'mastery', skill: 'focus', add: 6 }] },
      { label: '몰래 쉬다가 걸린다', hint: '혼나지만 운이 붙는다', effects: [{ op: 'bond', who: '지휘관', add: -5 }, { op: 'base', key: 'luk', add: 1 }] },
    ] }),
  c({ id: 'mn_soldier', category: 'bond', when: [{ c: 'route', is: ['marine'] }, { c: 'rank', min: 3 }], weight: 9, repeat: 'cooldown', cooldownYears: 3, speaker: { canon: '눈에 띄는 일병', faction: 'marine', age: 19 },
    title: '눈에 띄는 병사', body: '훈련이 끝난 뒤에도 연병장에 혼자 남아 목검을 휘두르는 일병이 있다. 자세가 남다르다.',
    options: [
      { label: '내 분대로 스카우트한다', hint: '돌격대 분대원이 된다', effects: [{ op: 'recruit', crew: { role: 'vanguard' } }] },
      { label: '상관에게 추천만 해 둔다', hint: '공적이 조금 오른다', effects: [{ op: 'fame', add: 3 }, { op: 'log', text: '그 일병은 다른 분대로 갔다. 언젠가 이름을 들을지도 모른다.', type: 'info' }] },
      { label: '지켜보기만 한다', hint: '아무 일도 일어나지 않는다', effects: [] },
    ] }),
  c({ id: 'mn_marksman', category: 'bond', when: [{ c: 'route', is: ['marine'] }, { c: 'rank', min: 3 }], weight: 7, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '사격장 수병', faction: 'marine', age: 21, gender: 'f' },
    title: '사격 훈련 만점', body: '사격장 표적판이 전부 한가운데에 구멍이 났다. 쏜 사람은 말수 적은 수병이다.',
    options: [
      { label: '내 분대로 스카우트한다', hint: '저격수 분대원이 된다', effects: [{ op: 'recruit', crew: { role: 'support', gender: 'f' } }] },
      { label: '사격 요령만 배운다', hint: '숙련이 오른다', effects: [{ op: 'mastery', skill: 'focus', add: 5 }] },
    ] }),
  c({ id: 'mn_medic', category: 'bond', when: [{ c: 'route', is: ['marine'] }, { c: 'rank', min: 3 }], weight: 6, repeat: 'cooldown', cooldownYears: 5, speaker: { canon: '기지 군의관 견습', faction: 'marine', age: 24 },
    title: '밤새 깨어 있는 군의관 견습', body: '토벌 작전 뒤 부상병 막사에서 밤새 붕대를 감는 견습 군의관을 봤다.',
    options: [
      { label: '내 분대 군의관으로 데려온다', hint: '선의 분대원. 병에 덜 걸리고 치료비가 준다', effects: [{ op: 'recruit', crew: { role: 'medic' } }] },
      { label: '치료만 받는다', hint: '부상이 낫는다', effects: [{ op: 'heal' }] },
    ] }),
  c({ id: 'mn_navigator', category: 'bond', when: [{ c: 'route', is: ['marine'] }, { c: 'rank', min: 4 }], weight: 5, repeat: 'cooldown', cooldownYears: 5, speaker: { canon: '항해과 수병', faction: 'marine', age: 22 },
    title: '해류를 읽는 수병', body: '폭풍 속에서 군함의 항로를 바로잡은 수병이 있다. 항해과에서도 손꼽힌다.',
    options: [
      { label: '내 분대 항해사로 데려온다', hint: '항해사 분대원. 정찰이 좋아지고 물에 덜 빠진다', effects: [{ op: 'recruit', crew: { role: 'navigator' } }] },
      { label: '해도 읽는 법만 배운다', hint: '지능이 오른다', effects: [{ op: 'base', key: 'int', add: 2 }] },
    ] }),
  c({ id: 'mn_cook', category: 'bond', when: [{ c: 'route', is: ['marine'] }, { c: 'rank', min: 3 }], weight: 4, repeat: 'once', speaker: { canon: '군함 취사병', faction: 'marine', age: 26 },
    title: '군함의 명물 취사병', body: '이 취사병이 끓인 카레 덕분에 함선 사기가 오른다는 소문이다.',
    options: [
      { label: '내 분대로 데려온다', hint: '요리사 분대원. 생활비가 줄고 건강이 빨리 돈다', effects: [{ op: 'recruit', crew: { role: 'cook' } }] },
      { label: '카레만 얻어먹는다', hint: '기운을 차린다', effects: [{ op: 'hp', add: 15 }] },
    ] }),

  // ======================================================== 가정 (결혼 적령기)
  c({ id: 'fm_meet', category: 'bond', when: [{ c: 'age', min: 18, max: 38 }, { c: 'flag', id: 'has_lover', has: false }, { c: 'flag', id: 'married', has: false }], weight: 7, repeat: 'cooldown', cooldownYears: 3, speaker: 'hero',
    title: '눈이 마주친 사람', body: '{port}에 들를 때마다 부둣가 꽃가게에서 자꾸 눈이 마주치는 사람이 있다. 오늘은 그쪽이 먼저 웃었다.',
    options: [
      { label: '마음을 전한다', hint: '연인이 될지도 모른다', effects: [{ op: 'chance', p: 0.7, then: [{ op: 'family', act: 'lover' }], else: [{ op: 'log', text: '"미안해요, 바다 사람은…" 정중하게 거절당했다.', type: 'info' }, { op: 'base', key: 'wil', add: 1 }] }] },
      { label: '꽃 한 송이만 산다', hint: '설렘만 남긴다', effects: [{ op: 'base', key: 'luk', add: 1 }, { op: 'money', add: -300 }] },
      { label: '바다가 먼저다', hint: '마음을 접는다', effects: [{ op: 'base', key: 'wil', add: 1 }] },
    ] }),
  c({ id: 'fm_marry', category: 'bond', when: [{ c: 'flag', id: 'has_lover', has: true }, { c: 'age', max: 50 }], weight: 12, repeat: 'cooldown', cooldownYears: 2, speaker: { person: '연인' },
    title: '함께 살까', body: '{lover}이(가) 조심스럽게 물었다. "우리, 이제 함께 살까? 네가 바다에 나가도 기다릴게."',
    options: [
      { label: '결혼한다', hint: '결혼식과 집 마련에 돈 4만이 든다. 가족을 부양하게 된다', when: [{ c: 'money', min: 40000 }], effects: [{ op: 'money', add: -40000 }, { op: 'family', act: 'marry' }, { op: 'base', key: 'wil', add: 2 }] },
      { label: '조금만 더 기다려 달라고 한다', hint: '사이가 조금 멀어진다', effects: [{ op: 'bond', who: '연인', add: -10 }] },
      { label: '헤어진다', hint: '바다만 보고 산다', effects: [{ op: 'family', act: 'breakup' }] },
    ] }),
  c({ id: 'fm_child', category: 'bond', template: 'child', when: [{ c: 'flag', id: 'married', has: true }, { c: 'age', max: 48 }], weight: 9, repeat: 'cooldown', cooldownYears: 3, speaker: { person: '배우자' },
    title: '아이가 태어났다', body: '', options: [] }),
  c({ id: 'fm_homecoming', category: 'bond', when: [{ c: 'flag', id: 'married', has: true }, { c: 'age', min: 20 }], weight: 4, repeat: 'cooldown', cooldownYears: 4, speaker: { person: '배우자' },
    title: '집에 들르다', body: '오랜만에 {place}의 집에 들렀다. {spouse}이(가) 문 앞에서 기다리고 있었다.',
    options: [
      { label: '한 달 푹 쉬다 간다', hint: '건강이 차오르고 가족과 가까워진다', effects: [{ op: 'hp', add: 30 }, { op: 'bond', who: '배우자', add: 15 }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '선물을 한 아름 안긴다', hint: '돈이 들고 가족이 기뻐한다', effects: [{ op: 'moneyPct', pct: -0.1 }, { op: 'bond', who: '배우자', add: 25 }, { op: 'base', key: 'luk', add: 2 }] },
      { label: '짐만 놓고 바로 떠난다', hint: '바다가 부른다', effects: [{ op: 'bond', who: '배우자', add: -10 }, { op: 'mastery', skill: 'focus', add: 4 }] },
    ] }),

  // ======================================================== 돈이 넘칠 때
  c({ id: 'rc_feast', category: 'bond', when: [{ c: 'route', is: ['pirate', 'revolution'] }, { c: 'crew', min: 1 }, { c: 'money', min: 150000 }], weight: 6, repeat: 'cooldown', cooldownYears: 2, speaker: 'hero',
    title: '넘치는 금고', body: '금고에 베리가 넘쳐난다. 동료들이 힐끔힐끔 금고와 너를 번갈아 본다.',
    options: [
      { label: '항구를 통째로 빌려 연회를 연다', hint: '돈의 15%. 동료의 정이 깊어지고 이름이 퍼진다', effects: [{ op: 'moneyPct', pct: -0.15 }, { op: 'crewBond', add: 15 }, { op: 'hp', add: 20 }, { op: 'fame', add: 5 }, { op: 'log', text: '사흘 밤낮 연회가 이어졌다. 동료들의 노랫소리가 항구 끝까지 울렸다.', type: 'good' }] },
      { label: '동료들에게 보너스를 나눠 준다', hint: '돈의 10%. 동료의 정이 깊어진다', effects: [{ op: 'moneyPct', pct: -0.1 }, { op: 'crewBond', add: 10 }] },
      { label: '아껴 둔다', hint: '언젠가 쓸 데가 있겠지', effects: [] },
    ] }),
  c({ id: 'rc_home', category: 'bond', when: [{ c: 'money', min: 120000 }, { c: 'age', min: 18 }], weight: 4, repeat: 'cooldown', cooldownYears: 4, speaker: { person: '어머니' },
    title: '고향에 보낼 돈', body: '{place}의 {mother}에게서 안부 편지가 왔다. 마을에 흉년이 들었다고 한다.',
    options: [
      { label: '큰돈을 보낸다', hint: '돈의 20%. 마을이 살아나고 마음이 든든하다', effects: [{ op: 'moneyPct', pct: -0.2 }, { op: 'bond', who: '어머니', add: 25 }, { op: 'base', key: 'wil', add: 2 }, { op: 'fame', add: 3 }, { op: 'log', text: '보낸 돈으로 마을 사람들이 겨울을 났다고 한다.', type: 'good' }] },
      { label: '조금만 보낸다', hint: '돈의 5%', effects: [{ op: 'moneyPct', pct: -0.05 }, { op: 'bond', who: '어머니', add: 8 }] },
    ] }),
  c({ id: 'rc_donate', category: 'bond', when: [{ c: 'money', min: 250000 }], weight: 4, repeat: 'cooldown', cooldownYears: 5, speaker: { canon: '고아원 원장', faction: 'civil', age: 60, gender: 'f' },
    title: '고아원의 지붕', body: '{port}의 고아원 지붕이 무너져 아이들이 비를 맞고 잔다고 한다.',
    options: [
      { label: '지붕을 새로 올려 준다', hint: '돈의 20%. 이름이 퍼지고 운이 붙는다', effects: [{ op: 'moneyPct', pct: -0.2 }, { op: 'fame', add: 12 }, { op: 'base', key: 'luk', add: 3 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '아이들이 네 이름을 부르며 손을 흔들었다.', type: 'good' }] },
      { label: '못 본 척한다', hint: '아무 일도 없다', effects: [] },
    ] }),

  // ======================================================== 인연
  c({ id: 'bd_swordsman', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'revolution'] }], weight: 9, repeat: 'cooldown', cooldownYears: 3, speaker: { canon: '떠돌이 검객', faction: 'civil', age: 22 },
    title: '떠돌이 검객', body: '{port}에서 칼 솜씨가 좋은 떠돌이를 만났다. 갈 곳이 없다고 한다.',
    options: [
      { label: '동료로 받아들인다', hint: '돌격대 동료가 생긴다', effects: [{ op: 'recruit', crew: { role: 'vanguard' } }] },
      { label: '대련만 하고 보낸다', hint: '숙련이 오른다', effects: [{ op: 'mastery', skill: 'focus', add: 6 }] },
    ] }),
  c({ id: 'bd_doctor', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'revolution'] }], weight: 8, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '떠돌이 의사', faction: 'civil', age: 30 },
    title: '떠돌이 의사', body: '부상자를 공짜로 치료해 주는 의사를 만났다. 바다로 나가고 싶어 한다.',
    options: [
      { label: '배에 태운다', hint: '선의 동료가 생긴다. 병에 덜 걸린다', effects: [{ op: 'recruit', crew: { role: 'medic' } }] },
      { label: '치료만 받는다', hint: '부상이 낫는다', effects: [{ op: 'heal' }] },
    ] }),
  c({ id: 'bd_navigator', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'revolution'] }], weight: 7, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '해도 그리는 소녀', faction: 'civil', age: 18, gender: 'f' },
    title: '해도 그리는 사람', body: '{port}의 등대에서 해도를 그리는 사람을 만났다. 바다를 읽는 눈이 남다르다.',
    options: [
      { label: '항해사로 데려간다', hint: '항해사 동료. 정찰이 좋아지고 물에 덜 빠진다', effects: [{ op: 'recruit', crew: { role: 'navigator' } }] },
      { label: '해도만 산다', hint: '지능이 오른다', effects: [{ op: 'money', add: -2000 }, { op: 'base', key: 'int', add: 2 }] },
    ] }),
  c({ id: 'bd_sniper', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'revolution'] }], weight: 7, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '허풍쟁이 저격수', faction: 'civil', age: 19 },
    title: '허풍쟁이 저격수', body: '허풍이 심한 녀석인데, 새총 솜씨만은 진짜다.',
    options: [
      { label: '동료로 받아들인다', hint: '저격수 동료가 생긴다', effects: [{ op: 'recruit', crew: { role: 'support' } }] },
      { label: '웃어넘긴다', hint: '기분이 좋아진다', effects: [{ op: 'base', key: 'luk', add: 2 }] },
    ] }),
  c({ id: 'bd_cook', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'revolution'] }], weight: 5, repeat: 'once', speaker: { canon: '수습 요리사', faction: 'civil', age: 20 },
    title: '배고픈 항해', body: '식량이 바닥났다. 해상 레스토랑의 수습 요리사가 같이 가겠다고 한다.',
    options: [
      { label: '요리사로 맞는다', hint: '요리사 동료. 생활비가 줄고 건강이 빨리 돈다', effects: [{ op: 'recruit', crew: { role: 'cook' } }] },
      { label: '거절한다', hint: '돈을 아낀다', effects: [{ op: 'money', add: 1000 }] },
    ] }),
  c({ id: 'bd_rival_reunion', category: 'bond', when: [{ c: 'age', min: 18 }, { c: 'person', kind: 'rival', has: true }], weight: 6, repeat: 'cooldown', cooldownYears: 5, speaker: { person: '라이벌' },
    title: '라이벌과의 재회', body: '{port}에서 {rival}을(를) 다시 만났다. 그사이 훨씬 강해진 것 같다.',
    options: [
      { label: '다시 붙는다', hint: '대련. 죽지 않는다', effects: [{ op: 'battle', enemy: 'rival', elite: true, lethal: false, spar: true }] },
      { label: '술잔을 기울인다', hint: '인연이 깊어진다', effects: [{ op: 'bond', who: '라이벌', add: 15 }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '함께 가자고 한다', hint: '인연이 깊으면 동료가 된다', when: [{ c: 'crew', max: 8 }], effects: [{ op: 'chance', p: 0.5, then: [{ op: 'recruit', crew: { role: 'vanguard', name: '{rival}' } }], else: [{ op: 'bond', who: '라이벌', add: 5 }] }] },
    ] }),

  // ======================================================== 해적의 돈벌이
  c({ id: 'mo_village_pirates', category: 'bond', when: [{ c: 'route', is: ['pirate', 'revolution'] }, { c: 'age', min: 16 }], weight: 8, repeat: 'cooldown', cooldownYears: 2, speaker: { canon: '마을 촌장', faction: 'civil', age: 65 },
    title: '마을을 괴롭히는 해적단', body: '{port} 근처 마을에 해적단이 눌러앉아 세금을 뜯고 있다. 촌장이 무릎을 꿇었다. "해적인 당신에게 부탁하는 건 이상하지만… 저놈들을 몰아내 주시오."',
    options: [
      { label: '해적단을 쳐부순다', hint: '강적전. 이기면 마을 사람들이 모은 사례금과 명성', danger: true,
        effects: [{ op: 'battle', enemy: 'gen:captain:pirate_captain', elite: true, lethal: false,
          win: [{ op: 'loot', base: 18000, text: '마을 사람들이 잔치를 열고, 모아 둔 사례금 {money} 베리를 내밀었다.' }, { op: 'fame', add: 6 }, { op: 'base', key: 'wil', add: 1 }],
          lose: [{ op: 'log', text: '해적단을 몰아내지 못했다. 마을 사람들의 눈빛이 무거웠다.', type: 'danger' }] }] },
      { label: '해적단의 금고만 턴다', hint: '몰래 숨어든다. 운이 좋으면 큰돈, 들키면 다친다',
        effects: [{ op: 'chance', p: 0.55, then: [{ op: 'loot', base: 14000, text: '한밤중 해적선 금고에서 {money} 베리를 챙겨 나왔다.' }], else: [{ op: 'log', text: '보초에게 들켜 쫓겨났다.', type: 'danger' }, { op: 'injury', severity: 'light' }] }] },
      { label: '모른 척한다', hint: '아무 일도 없다', effects: [] },
    ] }),
  c({ id: 'mo_treasure_map', category: 'bond', when: [{ c: 'route', is: ['pirate', 'revolution'] }, { c: 'age', min: 16 }], weight: 7, repeat: 'cooldown', cooldownYears: 2, speaker: { canon: '술 취한 늙은 뱃사람', faction: 'civil', age: 70 },
    title: '낡은 보물 지도', body: '{port}의 술집에서 늙은 뱃사람이 술값 대신 낡은 지도를 내밀었다. 무인도 하나에 붉은 X가 그려져 있다.',
    options: [
      { label: '보물을 찾아 나선다', hint: '보물일 수도, 함정일 수도, 다른 해적이 먼저 와 있을 수도 있다',
        effects: [{ op: 'chance', p: 0.35,
          then: [{ op: 'loot', base: 45000, text: '야자수 아래를 파 내려가자 금화가 가득 든 궤짝이 나왔다! {money} 베리어치 보물이다.' }, { op: 'base', key: 'luk', add: 1 }],
          else: [{ op: 'chance', p: 0.45,
            then: [{ op: 'log', text: '보물 구덩이 앞에 다른 해적단이 먼저 와 있었다. "이건 우리 거다!"', type: 'danger' },
              { op: 'battle', enemy: 'gen:elite:rival_crew', elite: true, lethal: false,
                win: [{ op: 'loot', base: 55000, text: '경쟁 해적단을 쫓아내고 보물을 독차지했다. {money} 베리!' }, { op: 'fame', add: 4 }],
                lose: [{ op: 'log', text: '보물은 경쟁 해적단이 가져갔다.', type: 'danger' }] }],
            else: [{ op: 'loot', base: 6000, text: '함정에 빠져 고생만 했다. 궤짝 바닥에 남은 건 {money} 베리어치 은화뿐.' }, { op: 'injury', severity: 'light' }] }] }] },
      { label: '지도를 되판다', hint: '확실한 돈', effects: [{ op: 'loot', base: 5000, text: '호사가에게 지도를 넘기고 {money} 베리를 받았다.' }] },
    ] }),
  c({ id: 'mo_sunken_ship', category: 'bond', when: [{ c: 'route', is: ['pirate', 'revolution'] }, { c: 'age', min: 16 }, { c: 'stage', min: 2 }], weight: 5, repeat: 'cooldown', cooldownYears: 3, speaker: 'hero',
    title: '가라앉은 보물선', body: '바다 밑에 옛 상선이 가라앉아 있다는 소문을 들었다. 물살이 거세고, 근처에 해왕류가 산다고 한다.',
    options: [
      { label: '잠수해서 건져 올린다', hint: '물에 빠질 위험. 어인 · 인어족이면 쉽다',
        effects: [{ op: 'chance', p: 0.6, then: [{ op: 'loot', base: 35000, text: '녹슨 금고를 끌어올렸다. 안에서 {money} 베리어치 금괴가 나왔다!' }], else: [{ op: 'hp', add: -20 }, { op: 'log', text: '거센 물살에 휩쓸려 겨우 살아 올라왔다.', type: 'danger' }] }] },
      { label: '해왕류부터 잡는다', hint: '강적전. 이기면 보물을 마음껏 건진다', danger: true,
        effects: [{ op: 'battle', enemy: 'gen:elite:seaking', elite: true, lethal: false, win: [{ op: 'loot', base: 50000, text: '해왕류가 사라진 바다에서 보물선을 통째로 털었다. {money} 베리!' }] }] },
      { label: '포기한다', hint: '아무 일도 없다', effects: [] },
    ] }),
  c({ id: 'mo_tyrant', category: 'bond', when: [{ c: 'route', is: ['pirate', 'revolution'] }, { c: 'age', min: 17 }, { c: 'stage', min: 2 }], weight: 5, repeat: 'cooldown', cooldownYears: 3, speaker: { canon: '섬의 소년', faction: 'civil', age: 10 },
    title: '섬의 폭군', body: '{port}의 섬을 폭군이 다스린다. 숨겨 둔 금고에는 섬사람들에게 빼앗은 재물이 산더미라고 한다. 소년이 네 소매를 붙잡았다.',
    options: [
      { label: '폭군을 쓰러뜨린다', hint: '강적전. 이기면 재물 일부를 사례로 받고, 나머지는 섬사람들에게 돌려준다', danger: true,
        effects: [{ op: 'battle', enemy: 'gen:captain:tyrant', elite: true, lethal: true,
          win: [{ op: 'loot', base: 30000, text: '폭군의 금고를 열어 섬사람들에게 돌려주었다. 섬사람들은 그중 {money} 베리를 굳이 네 배에 실어 주었다.' }, { op: 'fame', add: 10 }] }] },
      { label: '못 본 척한다', hint: '아무 일도 없다', effects: [] },
    ] }),
  c({ id: 'dbf_challenge', category: 'crisis', when: [{ c: 'route', is: ['pirate'] }, { c: 'crew', min: 2 }, { c: 'stage', min: 2 }], weight: 4, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '「은여우」 포크시', faction: 'pirate', age: 32 },
    title: '데비 백 파이트', body: '상대 해적단이 배를 나란히 대고 깃발을 흔들었다. "데비 백 파이트를 신청한다! 세 판 승부, 이긴 판마다 진 쪽 선원 하나를 데려간다!" 받아들이면 무를 수 없다.',
    options: [
      { label: '받아들인다', hint: '1판 레이스(속도 · 지능 · 항해사) · 2판 그로기 링(힘 · 체력 · 동료) · 3판 선장 결투. 진 판마다 가장 강한 동료를 빼앗긴다', danger: true,
        effects: [{ op: 'davyBack' }] },
      { label: '거절한다', hint: '겁쟁이 소리를 듣는다', effects: [{ op: 'fame', add: -3 }, { op: 'log', text: '"겁쟁이 해적단!" 비웃음을 뒤로하고 배를 돌렸다.', type: 'info' }] },
    ] }),

  // ======================================================== 위기
  c({ id: 'cs_marine_hunt', category: 'crisis', when: [{ c: 'route', is: ['pirate'] }, { c: 'age', min: 17 }, { c: 'fame', min: 20 }], weight: 5, repeat: 'cooldown', cooldownYears: 3, speaker: 'hero',
    title: '해군의 추격', body: '수평선 너머로 갈매기 깃발을 단 군함이 나타났다. 망원경 너머로 네 현상 수배서를 든 해군이 보인다. 지금 네 목에 걸린 현상금은 {bounty} 베리. 현상금이 높을수록 높은 계급이 온다.',
    options: [
      { label: '맞서 싸운다', hint: '강적전. 지면 해적단이 흩어지고 임펠 다운에 갇힌다', danger: true, effects: [{ op: 'hunt', flee: false }] },
      { label: '돛을 올려 달아난다', hint: '짐을 버리고 달아난다. 실패하면 싸운다. 항해사가 있으면 쉽다', effects: [{ op: 'hunt', flee: true }] },
    ] }),
  c({ id: 'sh_shipwright', category: 'ship', template: 'shipwright', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 1, speaker: 'hero',
    title: '조선공의 의뢰', body: '', options: [] }),
  c({ id: 'rc_reunion', category: 'bond', template: 'reunion', when: [], weight: 0, repeat: 'once', speaker: 'hero',
    title: '흩어진 동료', body: '', options: [] }),
  c({ id: 'pr_breakout', category: 'crisis', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 0, speaker: { canon: '옆 감방의 늙은 죄수', faction: 'pirate', age: 60 },
    title: '탈옥의 기회', body: '{prisonLevel}의 간수 교대 시간에 틈이 생겼다. 옆 감방 죄수가 열쇠 꾸러미를 훔쳤다며 속삭인다. "같이 나갈 테냐? 붙잡히면 더 깊은 곳으로 끌려간다."',
    options: [
      { label: '탈옥한다', hint: '혼자 간수장과 싸운다. 이기면 풀려나고 현상금이 오른다. 지면 형기 +6개월, 크게 다친다', danger: true, effects: [{ op: 'jailbreak' }] },
      { label: '형기를 채운다', hint: '조용히 버틴다. 정신이 단단해진다', effects: [{ op: 'base', key: 'wil', add: 2 }, { op: 'log', text: '고개를 저었다. 끝까지 버텨서 걸어 나가겠다.', type: 'info' }] },
    ] }),
  c({ id: 'cs_no_money_ill', category: 'crisis', when: [], weight: 0, repeat: 'cooldown', cooldownYears: 0, speaker: 'hero',
    title: '치료비가 없다', body: '몸이 말을 듣지 않는데 치료비가 없다.',
    options: [
      { label: '물건을 팔아 치료한다', hint: '가진 물건 중 가장 비싼 것을 판다', effects: [{ op: 'sellBest' }, { op: 'heal' }] },
      { label: '빚을 낸다', hint: '치료하고 빚을 진다', effects: [{ op: 'heal' }, { op: 'money', add: -20000 }, { op: 'flag', id: 'in_debt' }] },
      { label: '버틴다', hint: '위험하다', danger: true, effects: [{ op: 'chance', p: 0.5, then: [{ op: 'base', key: 'wil', add: 2 }], else: [{ op: 'hp', add: -30 }] }] },
    ] }),
  c({ id: 'cs_bounty_hunters', category: 'crisis', when: [{ c: 'route', is: ['pirate', 'revolution'] }, { c: 'age', min: 17 }], weight: 7, repeat: 'cooldown', cooldownYears: 3, speaker: 'hero',
    title: '현상금 사냥꾼', body: '현상금이 오르자 사냥꾼들이 몰려든다. 잠든 사이 포위당했다.',
    options: [
      { label: '정면으로 돌파한다', hint: '강적전. 이기면 명성이 오른다', effects: [{ op: 'battle', enemy: 'gen:elite:bounty_hunter', elite: true, lethal: true }] },
      { label: '돈을 쥐여 주고 빠져나간다', hint: '돈의 20%를 잃는다', effects: [{ op: 'moneyPct', pct: -0.2 }] },
      { label: '바다로 뛰어든다', hint: '능력자는 위험하다', danger: true, effects: [{ op: 'chance', p: 0.7, then: [{ op: 'base', key: 'vit', add: 1 }], else: [{ op: 'injury', severity: 'heavy' }] }] },
    ] }),
  c({ id: 'cs_corrupt', category: 'crisis', when: [{ c: 'route', is: ['marine'] }, { c: 'age', min: 18 }], weight: 6, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '부패한 상관', faction: 'marine', age: 48 },
    title: '썩은 정의', body: '상관이 해적에게 뇌물을 받는 장면을 봤다. 상관이 눈치챘다.',
    options: [
      { label: '고발한다', hint: '공적이 오르지만 적이 생긴다', effects: [{ op: 'fame', add: 10 }, { op: 'person', add: { kind: 'enemy', relation: '원한을 품은 상관', faction: 'marine', age: 48, bond: 0 } }] },
      { label: '입을 다문다', hint: '돈을 받는다', effects: [{ op: 'money', add: 15000 }, { op: 'base', key: 'wil', add: -1 }] },
      { label: '직접 혼낸다', hint: '강적전. 지면 위험하다', effects: [{ op: 'battle', enemy: 'gen:elite:corrupt_officer', elite: true, lethal: true }] },
    ] }),
  c({ id: 'cs_betrayal', category: 'crisis', template: 'betrayal', when: [{ c: 'crew', min: 2 }], weight: 5, repeat: 'cooldown', cooldownYears: 5, speaker: 'hero',
    title: '배신의 기미', body: '', options: [] }),
  c({ id: 'cs_push', category: 'crisis', when: [{ c: 'injured', is: true }, { c: 'age', min: 16 }], weight: 8, repeat: 'cooldown', cooldownYears: 2, speaker: 'hero',
    title: '다친 몸으로', body: '아직 상처가 다 낫지 않았지만 수련을 쉬기 싫다.',
    options: [
      { label: '무리해서 수련한다', hint: '숙련이 크게 오른다. 상처가 덧날 수 있다', danger: true, effects: [{ op: 'mastery', skill: 'focus', add: 12 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'scar' }] }] },
      { label: '푹 쉰다', hint: '상처가 낫는다', effects: [{ op: 'heal' }] },
    ] }),
  c({ id: 'cs_shipwreck', category: 'crisis', when: [{ c: 'stage', min: 2 }, { c: 'route', is: ['pirate', 'revolution'] }], weight: 5, repeat: 'cooldown', cooldownYears: 5, speaker: 'hero',
    title: '난파', body: '거대한 해왕류가 배를 들이받았다. 배가 기운다.',
    options: [
      { label: '배를 고친다', hint: '돈이 든다', effects: [{ op: 'moneyPct', pct: -0.25 }] },
      { label: '해왕류와 싸운다', hint: '강적전', effects: [{ op: 'battle', enemy: 'gen:elite:seaking', elite: true, lethal: true }] },
    ] }),
  c({ id: 'cs_treasure_rumor', category: 'crisis', when: [{ c: 'age', min: 16 }], weight: 2, repeat: 'cooldown', cooldownYears: 8, speaker: 'hero',
    title: '보물의 소문', body: '{port}의 경매장에 정체 모를 열매가 나왔다는 소문이 돈다.',
    options: [
      { label: '경매에 참가한다', hint: '돈 20만 필요. 낙찰받을 수 있을지는 모른다', when: [{ c: 'money', min: 200000 }], effects: [{ op: 'chance', p: 0.4, then: [{ op: 'money', add: -200000 }, { op: 'findFruit', pool: 'any' }], else: [{ op: 'log', text: '더 큰 손에게 밀려 낙찰받지 못했다.', type: 'info' }] }] },
      { label: '훔치러 간다', hint: '위험하다', danger: true, effects: [{ op: 'chance', p: 0.15, then: [{ op: 'findFruit', pool: 'any' }, { op: 'fame', add: 5 }], else: [{ op: 'injury', severity: 'heavy' }] }] },
      { label: '관심 없다', hint: '그냥 지나간다', effects: [] },
    ] }),
];

function cr(x: string) { return 'cr_' + x; }

CHOICES.push(...CANON_CHOICES, ...NAMED_CREW_CHOICES);

export const CHOICE_BY_ID = Object.fromEntries(CHOICES.map((x) => [x.id, x])) as Record<string, Choice>;
