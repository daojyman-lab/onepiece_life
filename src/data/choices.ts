// 중대한 선택. 조건과 효과는 값이다 (docs/02_설계/03_진행과_선택.md 5장).
// template가 있는 선택은 선택지를 상황에서 만든다 (core/choice/templates.ts).
// 자리표시: {name} 주인공 이름, {rival} 라이벌, {father} {mother}, {place} 고향, {port} 지금 항구, {sea} 해역
import type { Choice, Effect } from '../core/types';

const c = (x: Choice) => x;
const lightHurt: Effect = { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] };

export const CHOICES: Choice[] = [
  // ======================================================== 유년기 (3 · 6 · 9세)
  c({ id: 'ch_errand', category: 'childhood', when: [{ c: 'age', max: 9 }], weight: 10, repeat: 'once', speaker: { person: '아버지' },
    title: '집안일을 돕다', body: '{father}가 일손이 모자라다며 너를 불렀다. 무엇을 도울까?',
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
    title: '폭풍의 밤', body: '폭풍이 마을을 덮쳤다. {mother}가 지붕을 붙잡고 있다.',
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
  c({ id: 'en_rethink', category: 'entry', template: 'focus', when: [{ c: 'age', min: 16 }, { c: 'flag', id: 'rethink_ready', has: true }], weight: 8, repeat: 'cooldown', cooldownYears: 3, speaker: 'hero',
    title: '갈림길', body: '같은 길만 걸어온 지 오래다. 이대로 계속할까, 다른 것을 키울까?', options: [] }),
  c({ id: 'en_secondary', category: 'entry', template: 'focus', when: [{ c: 'age', min: 12 }, { c: 'flag', id: 'has_secondary', has: false }], weight: 14, repeat: 'cooldown', cooldownYears: 2, speaker: 'hero',
    title: '틈틈이 익힐 것', body: '주력 수련과 함께 틈틈이 익힐 것을 하나 정한다.', options: [] }),

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
    title: '집안의 빚', body: '{father}가 빚쟁이들에게 시달린다. 너도 무언가 해야 한다.',
    options: [
      { label: '부두에서 일한다', hint: '수련 시간이 준다', effects: [{ op: 'base', key: 'str', add: 2 }, { op: 'mastery', skill: 'focus', add: -5 }, { op: 'unflag', id: 'family_poor' }] },
      { label: '빚쟁이를 혼내 준다', hint: '위험하다. 이기면 빚이 사라진다', danger: true, effects: [{ op: 'chance', p: 0.5, then: [{ op: 'unflag', id: 'family_poor' }, { op: 'fame', add: 2 }], else: [{ op: 'injury', severity: 'heavy' }] }] },
    ] }),

  // ======================================================== 진로
  c({ id: 'cr_route', category: 'career', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['none'] }], weight: 100, repeat: 'cooldown', cooldownYears: 1, speaker: 'hero',
    title: '출항', body: '열여섯. {place}의 바다가 좁게 느껴진다. 어떤 길로 나갈까?',
    options: [
      { label: '해적이 된다', hint: '현상금이 명성이다. 자유롭지만 쫓긴다', effects: [{ op: 'route', to: 'pirate' }, { op: 'ship', id: 'raft', price: 0 }] },
      { label: '해군에 지원한다', hint: '공적과 계급이 명성이다. 봉급이 나온다', effects: [{ op: 'route', to: 'marine' }] },
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

  // ======================================================== 인연
  c({ id: 'bd_swordsman', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'marine', 'revolution'] }], weight: 9, repeat: 'cooldown', cooldownYears: 3, speaker: { canon: '떠돌이 검객', faction: 'civil', age: 22 },
    title: '떠돌이 검객', body: '{port}에서 칼 솜씨가 좋은 떠돌이를 만났다. 갈 곳이 없다고 한다.',
    options: [
      { label: '동료로 받아들인다', hint: '전위 동료가 생긴다', effects: [{ op: 'recruit', crew: { role: 'vanguard' } }] },
      { label: '대련만 하고 보낸다', hint: '숙련이 오른다', effects: [{ op: 'mastery', skill: 'focus', add: 6 }] },
    ] }),
  c({ id: 'bd_doctor', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'marine', 'revolution'] }], weight: 8, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '떠돌이 의사', faction: 'civil', age: 30 },
    title: '떠돌이 의사', body: '부상자를 공짜로 치료해 주는 의사를 만났다. 바다로 나가고 싶어 한다.',
    options: [
      { label: '배에 태운다', hint: '치료 동료가 생긴다. 병에 덜 걸린다', effects: [{ op: 'recruit', crew: { role: 'medic' } }] },
      { label: '치료만 받는다', hint: '부상이 낫는다', effects: [{ op: 'heal' }] },
    ] }),
  c({ id: 'bd_navigator', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'marine', 'revolution'] }], weight: 7, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '해도 그리는 소녀', faction: 'civil', age: 18, gender: 'f' },
    title: '해도 그리는 사람', body: '{port}의 등대에서 해도를 그리는 사람을 만났다. 바다를 읽는 눈이 남다르다.',
    options: [
      { label: '항해사로 데려간다', hint: '항해사 동료. 정찰이 좋아지고 물에 덜 빠진다', effects: [{ op: 'recruit', crew: { role: 'navigator' } }] },
      { label: '해도만 산다', hint: '지능이 오른다', effects: [{ op: 'money', add: -2000 }, { op: 'base', key: 'int', add: 2 }] },
    ] }),
  c({ id: 'bd_sniper', category: 'bond', when: [{ c: 'age', min: 16 }, { c: 'route', is: ['pirate', 'marine', 'revolution'] }], weight: 7, repeat: 'cooldown', cooldownYears: 4, speaker: { canon: '허풍쟁이 저격수', faction: 'civil', age: 19 },
    title: '허풍쟁이 저격수', body: '허풍이 심한 녀석인데, 새총 솜씨만은 진짜다.',
    options: [
      { label: '동료로 받아들인다', hint: '지원 동료가 생긴다', effects: [{ op: 'recruit', crew: { role: 'support' } }] },
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

  // ======================================================== 위기
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
  c({ id: 'cs_betrayal', category: 'crisis', when: [{ c: 'crew', min: 2 }], weight: 5, repeat: 'cooldown', cooldownYears: 5, speaker: 'hero',
    title: '배신의 기미', body: '동료 하나가 몰래 적과 연락하는 것 같다.',
    options: [
      { label: '믿고 맡긴다', hint: '좋은 결과일지도, 아닐지도', effects: [{ op: 'chance', p: 0.6, then: [{ op: 'base', key: 'wil', add: 2 }, { op: 'fame', add: 3 }], else: [{ op: 'moneyPct', pct: -0.3 }, { op: 'injury', severity: 'light' }] }] },
      { label: '추궁한다', hint: '진실을 밝힌다', effects: [{ op: 'base', key: 'int', add: 2 }] },
    ] }),
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

export const CHOICE_BY_ID = Object.fromEntries(CHOICES.map((x) => [x.id, x])) as Record<string, Choice>;
