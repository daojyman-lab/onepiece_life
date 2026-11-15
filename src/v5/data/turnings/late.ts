// 서른여섯 이후와 노년 (과제 11). 로그타운에서 태어난 사람에게 열린다.
// 처지마다(바다: 해적 · 사냥꾼 · 칠무해 / 깃발: 해군 · CP · 혁명군 / 뭍: 시민 · 조선공 · 정착 / 은퇴) 따로 오고,
// 어느 처지에서나 오는 것(옛 동료의 부고, 몸이 예전 같지 않음, 죽기 전에 풀 일, 제자의 출항)이 있다.
// 다루는 일: 제자를 들임, 옛 맞수, 젊은이의 도전, 물려줄 것, 마지막 항해, 은퇴 뒤의 삶, 오래된 빚과 죄.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { GROWN, age, at, st } from './paths';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const SEA_G = st('pirate', 'bountyHunter', 'warlord');
const FLAG_G = st('marine', 'cp', 'revolution');
const LAND_G = st('civil', 'shipwright', 'settled');
const RET = st('retired');
const years = (min: number): Cond => ({ c: 'standingYears', min });
const has = (id: string): Cond => ({ c: 'flag', id, has: true });

const SEA_LATE: Turning[] = [
  // ---------------------------------------------------------------- 바다 (해적 · 사냥꾼 · 칠무해)
  {
    id: 'late_old_rival_blade', kind: 'door', when: at(age(36, 70), SEA_G),
    weight: 5, repeat: 'once', speaker: { relation: '묵은 승부의 검객' },
    title: '묵은 승부', body: '스무 해 전 결판을 미룬 검객이 낡은 칼 한 자루를 보내왔다. 칼집에 묶인 쪽지에는 날짜와 섬 이름만 적혀 있다. 둘 다 머리가 희끗해졌을 것이다.',
    doors: [
      { label: '그 섬으로 가서 결판을 낸다', hint: '늙은 몸끼리의 승부다. 어느 쪽이 쓰러질지 모른다', values: { ambition: D }, mark: 'obsession', danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'mastery', branch: 'sword', add: 10 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'heavy' }] },
             { op: 'log', text: '해 질 녘까지 칼을 맞댔다. 끝나고 나서 둘이서 바위에 앉아 오래 웃었다.', weight: 'heavy' }] },
      { label: '칼 대신 술 두 병을 들고 간다', hint: '승부는 접는다. 스무 해의 이야기를 나눈다', values: { peace: D },
        fx: [{ op: 'person', kind: 'ally', relation: '술잔을 나눈 옛 맞수', age: { older: 2 } }] },
      { label: '칼을 바다에 던지고 답하지 않는다', hint: '지난날에 매이지 않는다', values: { freedom: D }, closes: true, fx: [{ op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'late_deck_challenger', kind: 'door', when: at(age(40, 70), st('pirate'), has('captain'), years(4)),
    weight: 5, repeat: 'once', needs: ['crew'], speaker: { relation: '젊은 갑판장' },
    title: '갑판의 도전자', body: '젊은 갑판장이 선원들 앞에서 선장 자리를 내놓으라고 한다. 늙은 선장의 시대는 끝났다고, 승부를 내지 않으면 마음 맞는 선원들을 데리고 배를 떠나겠다고 한다.',
    doors: [
      { label: '갑판 한가운데서 맞붙는다', hint: '선장의 자리를 주먹으로 지킨다. 늙은 몸이 버틸지 모른다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'chance', p: 0.6, then: [{ op: 'fame', add: 10 }, { op: 'log', text: '젊은 갑판장이 갑판에 드러누웠다. 선원들이 다시 {name}의 이름을 외쳤다.', weight: 'heavy' }],
               else: [{ op: 'unflag', id: 'captain' }, { op: 'hardship', add: 4 }, { op: 'log', text: '갑판에 쓰러진 쪽은 {name}이었다. 선장실의 열쇠를 넘겼다.', weight: 'heavy' }] }] },
      { label: '선장 자리를 넘기고 고문으로 남는다', hint: '키는 젊은 손에 맡긴다. 배는 더 멀리 갈지도 모른다', values: { devotion: D },
        fx: [{ op: 'unflag', id: 'captain' }, { op: 'person', kind: 'ally', relation: '선장 자리를 물려받은 갑판장', age: { younger: 20 } }, { op: 'timeline', text: '젊은 갑판장에게 선장 자리를 넘겼다' }] },
      { label: '떠날 사람은 떠나라며 배를 나눈다', hint: '선원 절반이 떠난다. 남은 사람들과 다시 시작한다', values: { freedom: D },
        fx: [{ op: 'losePerson', who: 'crew' }, { op: 'person', kind: 'rival', relation: '배를 나눠 떠난 갑판장', age: { younger: 20 } }] },
    ],
  },
  {
    id: 'late_old_keel', kind: 'door', when: at(age(40, 72), SEA_G, has('ship')),
    weight: 4, repeat: 'once', speaker: { relation: '늙은 조선공' },
    title: '금 간 용골', body: '스무 해를 함께한 배의 용골에 금이 갔다. 늙은 조선공은 고쳐 봐야 먼바다는 못 버틴다고, 뜯어서 새 배를 짓는 게 낫다고 한다. 갑판의 칼자국 하나하나에 날짜가 있다.',
    doors: [
      { label: '가진 돈을 털어 같은 이름의 새 배를 짓는다', hint: '빈털터리가 된다. 이름과 깃발은 이어진다', values: { romance: D },
        fx: [{ op: 'money', add: -60000 }, { op: 'log', text: '옛 배의 키를 떼어 새 배에 달았다.', weight: 'heavy' }, { op: 'timeline', text: '평생의 배를 새로 지었다' }] },
      { label: '배를 뭍에 올려 집으로 삼는다', hint: '바다의 일은 접는다. 배는 언덕 위에서 늙는다', values: { peace: D },
        fx: [{ op: 'unflag', id: 'ship' }, { op: 'standing', to: 'settled' }, { op: 'timeline', text: '금 간 배를 뭍에 올려 집으로 삼았다' }] },
      { label: '덧대고 때워 한 번 더 먼바다로 나간다', hint: '언제 갈라질지 모르는 배다', values: { ambition: D }, danger: true,
        fx: [{ op: 'chance', p: 0.3, then: [{ op: 'hp', add: -30 }, { op: 'unflag', id: 'ship' }, { op: 'log', text: '폭풍 속에서 용골이 끝내 갈라졌다. 판자 조각에 매달려 살아남았다.', weight: 'heavy' }],
               else: [{ op: 'money', add: 20000 }] }] },
    ],
  },
  {
    id: 'late_crew_will', kind: 'door', when: at(age(38, 72), SEA_G),
    weight: 4, repeat: 'once', needs: ['crew'], speaker: 'hero',
    title: '남겨진 몫', body: '오래 함께한 선원이 싸움에서 돌아오지 못했다. 그가 남긴 상자에는 고향의 가족에게 보낼 몫과, 누구에게도 보이지 말라는 봉한 편지 한 통이 들어 있다.',
    doors: [
      { label: '몫을 들고 그 가족을 직접 찾아간다', hint: '먼 뱃길을 돌아간다. 그 집의 울음을 듣는다', values: { loyalty: D },
        fx: [{ op: 'losePerson', who: 'crew' }, { op: 'money', add: -10000 }, { op: 'hardship', add: 2 }] },
      { label: '봉한 편지를 열어 본다', hint: '그가 숨긴 것을 알게 된다. 되돌릴 수 없다', values: { inquiry: D },
        fx: [{ op: 'losePerson', who: 'crew' }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '편지에는 그가 해군의 끄나풀이었다는 고백과, 끝내 아무것도 넘기지 않았다는 말이 적혀 있었다.', weight: 'heavy' }] },
      { label: '그 몫을 배에 남은 선원들에게 나눈다', hint: '산 사람이 먼저라고 여긴다. 그 가족은 소식을 듣지 못한다', values: { ambition: D },
        fx: [{ op: 'losePerson', who: 'crew' }, { op: 'money', add: 15000 }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'late_loot_rule', kind: 'door', when: at(age(36, 65), st('pirate'), has('captain')),
    weight: 4, repeat: 'once', speaker: { relation: '흥분한 선원들' },
    title: '선원들이 데려온 사람들', body: '젊은 선원들이 중립 항구의 상선을 털고 화물과 함께 선원들까지 묶어 왔다. 몸값을 받든 팔든 선장이 정하라고 한다. 묶인 사람 가운데 수염도 안 난 견습이 있다.',
    doors: [
      { label: '모두 풀어 주고 배의 규칙을 새로 정한다', hint: '사람은 털지 않는다고 못 박는다. 젊은 선원들이 투덜댄다', values: { justice: D },
        fx: [{ op: 'fame', add: -3 }, { op: 'flag', id: 'crewCode' }, { op: 'log', text: '그날 정한 규칙을 돛대에 새겼다.', weight: 'heavy' }] },
      { label: '상선의 회사에 몸값을 받아 낸다', hint: '배가 두둑해진다. 이 바다에 소문이 난다', values: { ambition: D },
        fx: [{ op: 'money', add: 40000 }, { op: 'fame', add: 8 }] },
      { label: '선원들 앞에서 데려온 자를 벌주고 사람들은 돌려보낸다', hint: '선장의 허락 없는 일은 없다는 것을 보인다', values: { dominion: D },
        fx: [{ op: 'flag', id: 'feared' }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'late_last_route', kind: 'door', when: at(age(45, 75), SEA_G),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '돌아온 지도 조각', body: '젊은 날 실패한 항해에서 잃어버린 지도 조각이 고물상의 좌판에서 나왔다. 지도의 끝에는 아직 아무도 닿지 못한 해역이 그려져 있다. 그때 함께 갔던 사람들은 이제 거의 남지 않았다.',
    doors: [
      { label: '마지막으로 그 끝까지 간다', hint: '돌아오지 못할 수도 있다. 그래도 이번에는 끝을 본다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'fame', add: 20 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 100000 }, { op: 'log', text: '지도의 끝에서 이름 없는 섬을 찾았다. 섬에 첫 발자국을 남겼다.', weight: 'heavy' }] },
             { op: 'timeline', text: '젊은 날의 지도 끝까지 마지막 항해를 했다' }] },
      { label: '지도를 젊은 뱃사람에게 물려준다', hint: '끝은 남이 본다. 이야기는 이어진다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '지도를 물려받은 젊은 뱃사람', age: { younger: 25 } }] },
      { label: '지도를 수집가에게 비싸게 판다', hint: '돈은 남는다. 그 끝은 영영 모른다', values: { ambition: D },
        fx: [{ op: 'money', add: 50000 }] },
    ],
  },
  {
    id: 'late_old_hunter', kind: 'door', when: at(age(45, 72), st('bountyHunter')),
    weight: 4, repeat: 'once', speaker: { relation: '젊은 수배범' },
    title: '젊디젊은 사냥감', body: '새 수배서의 얼굴은 스무 살 남짓한 젊은 해적이다. 사냥 끝에 골목에 몰리자, 젊은 해적은 칼을 겨누며 웃는다. 늙은 사냥꾼한테는 안 잡힌다고.',
    doors: [
      { label: '늙은 사냥꾼의 솜씨를 보여 준다', hint: '젊은 몸의 칼끝은 빠르다. 다칠 수 있다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'chance', p: 0.6, then: [{ op: 'money', add: 40000 }, { op: 'fame', add: 5 }], else: [{ op: 'injury', severity: 'light' }] }] },
      { label: '칼을 내리게 하고 무엇이 그를 바다로 내몰았는지 듣는다', hint: '사냥감이 사람으로 보인다. 현상금은 놓친다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '놓아준 젊은 해적', age: { younger: 25 } }] },
      { label: '사냥은 젊은 사냥꾼들에게 넘기고 수배서를 내려놓는다', hint: '긴 사냥이 여기서 끝난다', values: { peace: D },
        fx: [{ op: 'standing', to: 'settled' }, { op: 'timeline', text: '사냥꾼의 일을 내려놓았다' }] },
    ],
  },
];

const FLAG_LATE: Turning[] = [
  // ---------------------------------------------------------------- 깃발 (해군 · CP · 혁명군)
  {
    id: 'late_disobeyed_order', kind: 'door', when: at(age(36, 62), st('marine'), years(4)),
    weight: 5, repeat: 'once', speaker: { relation: '본부의 감찰관' },
    title: '무너진 명령', body: '{name}의 부하 장교들이 해적 토벌 명령을 어기고 마을 사람들의 대피를 먼저 했다. 본부의 감찰관이 명령 불복종자들의 이름을 적어 내라고 한다. 지휘관의 책임도 묻겠다고.',
    doors: [
      { label: '부하들의 판단이 옳았다고 보고서에 적는다', hint: '부하들을 지킨다. 본부의 눈 밖에 난다', values: { justice: D },
        fx: [{ op: 'fame', add: -5 }, { op: 'person', kind: 'ally', relation: '지켜 준 부하 장교', age: { younger: 15 } }] },
      { label: '모든 책임을 제가 지겠다고 한다', hint: '계급장 한 줄이 떨어진다. 부하들은 무사하다', values: { devotion: D },
        fx: [{ op: 'rank', add: -1 }, { op: 'hardship', add: 2 }, { op: 'person', kind: 'ally', relation: '목숨을 빚진 부하 장교', age: { younger: 15 } }] },
      { label: '규율대로 이름을 적어 낸다', hint: '명령은 명령이다. 부대의 공기가 차가워진다', values: { loyalty: D },
        fx: [{ op: 'rank', add: 1 }, { op: 'hardship', add: 3 }] },
    ],
  },
  {
    id: 'late_ambitious_officer', kind: 'door', when: at(age(38, 62), st('marine', 'cp'), years(5)),
    weight: 4, repeat: 'once', speaker: { relation: '새로 부임한 젊은 장교' },
    title: '빈자리를 노리는 눈', body: '솜씨 좋은 젊은 장교가 부임했다. 빨리 올라가고 싶다는 속내를 숨기지 않고, {name}의 자리를 대놓고 바라본다. 실력은 진짜다.',
    doors: [
      { label: '제 것을 모두 가르쳐 키운다', hint: '언젠가 자리를 내주게 된다. 좋은 장교가 하나 는다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '가르쳐 키운 젊은 장교', age: { younger: 20 } }, { op: 'base', key: 'wil', add: 1 }] },
      { label: '험한 임무만 골라 맡겨 꺾어 놓는다', hint: '자리를 지킨다. 원한이 남는다', values: { dominion: D },
        fx: [{ op: 'person', kind: 'rival', relation: '이를 가는 젊은 장교', age: { younger: 20 } }] },
      { label: '실력으로 겨루자며 같은 임무에 나선다', hint: '누가 먼저 공을 세우나 본다. 늙은 몸으로 버텨야 한다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 10 }] },
    ],
  },
  {
    id: 'late_hq_offer', kind: 'door', when: at(age(40, 60), st('marine'), has('mnOfficer'), years(6)),
    weight: 4, repeat: 'once', speaker: { relation: '본부의 인사 장교' },
    title: '본부의 자리', body: '본부에서 고위 장교 자리를 내주겠다는 명령서가 왔다. 대신 오래 이끈 현장 부대를 떠나 책상 앞에 앉아야 한다. 부대원들은 아무 말도 하지 않는다.',
    doors: [
      { label: '본부로 올라간다', hint: '높은 자리에서 큰 바다를 본다. 현장의 얼굴들과 멀어진다', values: { ambition: D },
        fx: [{ op: 'rank', add: 1 }, { op: 'fame', add: 15 }, { op: 'timeline', text: '해군 본부의 고위 장교가 되었다' }] },
      { label: '현장의 부대에 남는다', hint: '진급은 여기서 멈춘다. 부대원들과 끝까지 간다', values: { loyalty: D }, closes: true,
        fx: [{ op: 'person', kind: 'ally', relation: '끝까지 함께한 부대원', age: { younger: 15 } }] },
      { label: '이참에 제복을 벗는다', hint: '긴 복무를 끝낸다. 바다는 이제 남의 일이다', values: { peace: D },
        fx: [{ op: 'standing', to: 'retired' }, { op: 'money', add: 30000 }, { op: 'timeline', text: '해군에서 물러났다' }] },
    ],
  },
  {
    id: 'late_captive_teacher', kind: 'door', when: at(age(40, 65), st('marine', 'cp')),
    weight: 4, repeat: 'once', speaker: { relation: '혁명군의 협상가' },
    title: '포로가 된 스승', body: '젊은 날 {name}에게 싸우는 법을 가르친 늙은 교관이 혁명군에 붙잡혔다. 혁명군은 붙잡힌 동지 열둘과 맞바꾸자고 한다. 본부는 협상하지 말라고 한다.',
    doors: [
      { label: '명령을 어기고 맞바꾼다', hint: '스승은 돌아온다. 본부가 그 일을 기억한다', values: { loyalty: D },
        fx: [{ op: 'rank', add: -1 }, { op: 'person', kind: 'ally', relation: '포로에서 돌아온 늙은 교관', age: { older: 25 } }] },
      { label: '본부의 명령을 따른다', hint: '스승은 돌아오지 않는다', values: { justice: D },
        fx: [{ op: 'hardship', add: 5 }, { op: 'fame', add: 5 }] },
      { label: '몰래 혁명군의 거점에 들어가 스승을 빼낸다', hint: '맞바꾸지도 버리지도 않는다. 살아 나올지 모른다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'chance', p: 0.5, then: [{ op: 'fame', add: 15 }, { op: 'person', kind: 'ally', relation: '빼내 온 늙은 교관', age: { older: 25 } }], else: [{ op: 'injury', severity: 'heavy' }] }] },
    ],
  },
  {
    id: 'late_cp_heir', kind: 'door', when: at(age(40, 68), st('cp', 'retired', 'settled', 'civil'), has('cpNameless')),
    weight: 5, repeat: 'once', speaker: { relation: '낯선 젊은이' },
    title: '지운 이름의 핏줄', body: '낯선 젊은이가 {name}을(를) 찾아왔다. 스무 해 전 기관의 명령으로 지워진 사람의 핏줄이라고, 그날 밤 누가 문을 두드렸는지 알고 있다고 한다. 손에는 아무것도 들려 있지 않다.',
    doors: [
      { label: '그날 밤의 일을 숨김없이 털어놓는다', hint: '젊은이가 무엇을 할지는 젊은이의 몫이다', values: { justice: D },
        fx: [{ op: 'hardship', add: 4 }, { op: 'chance', p: 0.5, then: [{ op: 'log', text: '젊은이는 끝까지 듣고 아무 말 없이 돌아갔다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'log', text: '젊은이의 주먹이 날아왔다. 피하지 않았다.', weight: 'heavy' }] }] },
      { label: '그 집에 몰래 돈을 보내 온 것을 밝힌다', hint: '젊은이는 처음 듣는 이야기다', values: { devotion: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'person', kind: 'ally', relation: '지운 이름의 핏줄', age: { younger: 25 } }] },
      { label: '그런 사람은 모른다고 문을 닫는다', hint: '기관의 일은 무덤까지 가져간다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'enemy', relation: '문 앞에서 돌아선 젊은이', age: { younger: 25 } }] },
    ],
  },
  {
    id: 'late_rev_young_wave', kind: 'door', when: at(age(40, 72), st('revolution'), years(5)),
    weight: 4, repeat: 'once', speaker: { relation: '젊은 혁명가' },
    title: '낡은 방식', body: '기지의 젊은 혁명가들이 {name}의 방식이 너무 느리다고 한다. 왕궁 하나를 통째로 날려 버리면 될 일을 몇 해씩 끈다고. 그 계획에는 왕궁의 하인들도 들어 있다.',
    doors: [
      { label: '계획을 막고 하인들의 이름을 하나하나 읽어 준다', hint: '젊은이들은 실망한다. 몇 사람은 남는다', values: { justice: D },
        fx: [{ op: 'fame', add: -5 }, { op: 'person', kind: 'ally', relation: '마음을 돌린 젊은 혁명가', age: { younger: 25 } }] },
      { label: '젊은이들에게 지휘를 넘기고 뒤에서 돕는다', hint: '제 시대가 끝났음을 받아들인다', values: { peace: D },
        fx: [{ op: 'standing', to: 'retired' }, { op: 'timeline', text: '혁명군의 지휘를 젊은이들에게 넘겼다' }] },
      { label: '그 계획을 제 손으로 더 크게 다시 짠다', hint: '빠르고 크게 간다. 무엇을 잃을지 알면서 간다', values: { ambition: D }, danger: true,
        fx: [{ op: 'fame', add: 25 }, { op: 'hardship', add: 4 }, { op: 'flag', id: 'govEnemy' }] },
    ],
  },
  {
    id: 'late_rev_ten_years', kind: 'door', when: at(age(45, 75), st('revolution', 'retired', 'settled'), has('ruler')),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '열 해 뒤의 나라', body: '{name}이(가) 무너뜨리고 세운 나라에 열 해 만에 들렀다. 거리는 깨끗해졌지만, 광장에는 새 동상이 서 있고 사람들은 그 앞에서 고개를 숙인다. 동상의 얼굴이 낯익다.',
    doors: [
      { label: '동상을 끌어내리고 사람들 앞에서 말한다', hint: '제가 세운 것을 제 손으로 무너뜨린다', values: { justice: D }, danger: true,
        fx: [{ op: 'unflag', id: 'ruler' }, { op: 'fame', add: 20 }, { op: 'hp', add: -15 }] },
      { label: '동상 앞을 조용히 지나간다', hint: '이 나라는 이제 이 나라 사람들의 것이다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 2 }] },
      { label: '동상을 그대로 두고 그 나라를 손에 쥔다', hint: '고개 숙이는 사람들 위에 선다', values: { dominion: D },
        fx: [{ op: 'money', add: 100000 }, { op: 'flag', id: 'feared' }] },
    ],
  },
];

FLAG_LATE.push({
  id: 'late_flag_last_mission', kind: 'door', when: at(age(45, 68), FLAG_G, years(8)),
  weight: 4, repeat: 'once', speaker: { relation: '함께 늙은 옛 전우들' },
  title: '마지막 임무', body: '함께 늙어 온 전우 몇이 은퇴를 앞두고 찾아왔다. 이 바다를 다시 휘젓는 해적단이 있다고, 젊은 날 끝내 잡지 못한 그 깃발이라고. 마지막으로 다 같이 나가자고 한다.',
  doors: [
    { label: '늙은 전우들과 마지막으로 출항한다', hint: '젊은 날의 빚을 갚으러 간다. 늙은 몸들이 버틸지 모른다', values: { loyalty: D }, danger: true,
      fx: [{ op: 'hp', add: -25 }, { op: 'fame', add: 20 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'heavy' }] },
           { op: 'log', text: '그 깃발을 끝내 꺾었다. 돌아오는 갑판에서 늙은 전우들이 젊은 날처럼 웃었다.', weight: 'heavy' }] },
    { label: '작전을 짜 주고 젊은 부대에 맡긴다', hint: '공은 젊은이들의 몫이다. 늙은 전우들이 서운해한다', values: { inquiry: D },
      fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'fame', add: 5 }] },
    { label: '이제는 붙잡지 않아도 된다며 전우들을 말린다', hint: '쫓던 깃발도 함께 늙었다. 싸움 대신 술잔을 나눈다', values: { peace: D },
      fx: [{ op: 'person', kind: 'ally', relation: '함께 늙은 옛 전우' }] },
  ],
});

const LAND_LATE: Turning[] = [
  // ---------------------------------------------------------------- 뭍 (시민 · 조선공 · 정착)
  {
    id: 'late_workshop_heir', kind: 'door', when: at(age(40, 72), st('shipwright', 'settled'), years(6)),
    weight: 5, repeat: 'once', speaker: { relation: '오래 일한 견습' },
    title: '작업장의 후계', body: '오래 일한 견습이 독립을 앞두고, 평생 감춰 온 기술을 물려 달라고 한다. 손은 누구보다 좋지만 돈 앞에서 눈빛이 흔들리는 걸 몇 번 보았다.',
    doors: [
      { label: '숨김없이 다 물려준다', hint: '기술은 이어진다. 그 손이 어디에 쓰일지는 그의 몫이다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '기술을 물려받은 견습', age: { younger: 25 } }] },
      { label: '마지막 한 가지만 남기고 가르친다', hint: '제 것은 지킨다. 견습은 서운해한다', values: { ambition: D },
        fx: [{ op: 'money', add: 15000 }, { op: 'hardship', add: 1 }] },
      { label: '한 해 동안 돈 안 되는 일만 맡겨 마음을 본다', hint: '견습이 버티면 물려준다', values: { justice: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'person', kind: 'ally', relation: '한 해를 버틴 견습', age: { younger: 25 } }], else: [{ op: 'log', text: '견습은 석 달 만에 짐을 쌌다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'late_last_dose', kind: 'door', when: at(age(40, 78), LAND_G),
    weight: 4, repeat: 'once', speaker: { relation: '마을의 약재상' },
    title: '마지막 약재', body: '{island}에 돌림병이 돌았다. 약재상이 겨우 구한 귀한 약은 한 사람 몫뿐이다. 오래 거래해 온 늙은 어부와, 이웃집 어린아이가 같은 날 쓰러졌다. 약재상이 {name}에게 정해 달라고 한다.',
    doors: [
      { label: '아이에게 쓴다', hint: '앞날이 긴 쪽을 살린다. 어부의 식구들이 등을 돌린다', values: { devotion: D },
        fx: [{ op: 'hardship', add: 3 }, { op: 'person', kind: 'ally', relation: '약을 먹고 살아난 아이', age: 6 }] },
      { label: '먼저 쓰러진 어부에게 쓴다', hint: '순서를 지킨다. 아이의 집에서 울음이 그치지 않는다', values: { justice: D },
        fx: [{ op: 'hardship', add: 4 }] },
      { label: '약재상에게 돈을 대고 섬 밖에서 약을 더 구해 오게 한다', hint: '모아 둔 돈이 크게 나간다. 늦지 않을지 모른다', values: { loyalty: D },
        fx: [{ op: 'money', add: -40000 }, { op: 'chance', p: 0.6, then: [{ op: 'log', text: '사흘 만에 약배가 닿았다. 둘 다 살았다.', weight: 'heavy' }], else: [{ op: 'hardship', add: 4 }] }] },
    ],
  },
  {
    id: 'late_harbor_rights', kind: 'door', when: at(age(40, 72), st('civil', 'settled')),
    weight: 4, repeat: 'once', speaker: { relation: '상단의 주인' },
    title: '항구의 제안', body: '큰 상단의 주인이 낡은 창고와 항구의 운송권을 함께 넘기겠다고 한다. 받으면 {island}의 물자가 모두 {name}의 손을 거친다. 작은 배를 부리는 이웃들의 일감은 줄어든다.',
    doors: [
      { label: '운송권을 받는다', hint: '섬의 물자를 손에 쥔다. 이웃들의 눈길이 달라진다', values: { dominion: D }, 
        fx: [{ op: 'money', add: 80000 }, { op: 'person', kind: 'rival', relation: '일감을 잃은 이웃 뱃사람' }] },
      { label: '운송권을 받아 이웃 뱃사람들과 나눈다', hint: '돈은 적게 남는다. 섬이 함께 먹고산다', values: { justice: D },
        fx: [{ op: 'money', add: 20000 }, { op: 'person', kind: 'ally', relation: '일감을 나눠 받은 뱃사람' }] },
      { label: '그런 짐은 지지 않겠다고 거절한다', hint: '매인 데 없는 지금이 좋다', values: { freedom: D }, closes: true, fx: [] },
    ],
  },
  {
    id: 'late_seawall', kind: 'door', when: at(age(40, 78), LAND_G),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '무너진 방파제', body: '폭풍이 지나간 뒤 {island}의 방파제가 무너져 창고와 집들이 바닷물에 잠겼다. 젊은이들은 섬을 떠나자고 하고, 늙은이들은 다시 쌓자고 한다. 사람들이 {name}의 얼굴을 본다.',
    doors: [
      { label: '앞장서서 돌을 나르며 다시 쌓자고 한다', hint: '늙은 몸으로 한 철을 버틴다. 섬은 남는다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -15 }, { op: 'base', key: 'vit', add: 1 }, { op: 'fame', add: 2 }] },
      { label: '젊은이들이 새 섬에 자리 잡게 돕는다', hint: '떠나는 사람들의 길을 연다. 저는 남는다', values: { devotion: D },
        fx: [{ op: 'money', add: -20000 }, { op: 'person', kind: 'ally', relation: '새 섬으로 간 젊은이', age: { younger: 30 } }] },
      { label: '물에 잠긴 창고들을 헐값에 사들인다', hint: '물이 빠지면 값이 오른다', values: { dominion: D }, 
        fx: [{ op: 'money', add: 30000 }, { op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'late_old_design', kind: 'door', when: at(age(45, 78), st('shipwright', 'settled', 'civil')),
    weight: 4, repeat: 'once', speaker: { relation: '돌아온 옛 동무' },
    title: '돌아온 꿈', body: '젊은 날 함께 배를 짓던 동무가 누렇게 바랜 도면을 들고 찾아왔다. 하늘을 나는 배를 짓자던 그때의 그림이다. 둘 다 이제 손이 떨린다.',
    doors: [
      { label: '남은 날을 걸고 그 배를 짓는다', hint: '돈도 몸도 다 든다. 뜨든 안 뜨든 끝을 본다', values: { romance: D }, mark: 'obsession',
        fx: [{ op: 'money', add: -40000 }, { op: 'hp', add: -10 }, { op: 'chance', p: 0.35, then: [{ op: 'fame', add: 30 }, { op: 'log', text: '바람이 센 날, 배가 언덕에서 한 뼘 떠올랐다. 둘은 어린애처럼 울었다.', weight: 'heavy' }, { op: 'timeline', text: '하늘을 나는 배를 띄웠다' }]}] },
      { label: '도면을 함께 다듬으며 저녁마다 술잔을 나눈다', hint: '배는 짓지 않는다. 그때의 이야기를 한다', values: { peace: D },
        fx: [{ op: 'person', kind: 'ally', relation: '도면을 들고 온 옛 동무', age: { older: 1 } }] },
      { label: '도면을 조선 회사에 판다', hint: '꿈은 남의 손에서 이루어질지 모른다. 동무가 서운해한다', values: { ambition: D },
        fx: [{ op: 'money', add: 50000 }, { op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'late_witness', kind: 'door', when: at(age(45, 78), LAND_G),
    weight: 4, repeat: 'once', speaker: { relation: '불에 식구를 잃은 상인' },
    title: '잊힌 증언', body: '스무 해 전 항구의 큰불로 식구를 잃은 상인이 찾아왔다. 그날 밤 불을 놓는 사람을 본 사람이 {name}뿐이라는 걸 알아냈다고 한다. 불을 놓은 사람은 지금 이 섬의 어른이다.',
    doors: [
      { label: '광장에서 그날 본 것을 증언한다', hint: '섬이 뒤집힌다. 어른의 사람들이 앙갚음을 다짐한다', values: { justice: D }, danger: true,
        fx: [{ op: 'fame', add: 5 }, { op: 'person', kind: 'enemy', relation: '죄가 드러난 섬의 어른', age: { older: 5 } }] },
      { label: '상인에게만 조용히 털어놓는다', hint: '그 뒤의 일은 상인이 정한다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '진실을 들은 상인' }, { op: 'hardship', add: 1 }] },
      { label: '아무것도 보지 못했다고 한다', hint: '섬은 조용하다. 상인의 등이 굽는다', fx: [{ op: 'hardship', add: 3 }] },
    ],
  },
  {
    id: 'late_last_contract', kind: 'door', when: at(age(45, 72), st('shipwright')),
    weight: 4, repeat: 'once', speaker: { relation: '선박 회사의 주인' },
    title: '마지막 큰 공사', body: '오래 거래한 선박 회사가 마지막으로 큰 공사를 맡겼다. 해내면 평생 걱정 없을 돈이다. 그런데 넘겨받은 설계대로면, 그 배는 해적을 실어 나르는 노예선이 된다.',
    doors: [
      { label: '공사를 물린다', hint: '평생의 돈을 놓친다', values: { justice: D }, closes: true,
        fx: [{ op: 'person', kind: 'rival', relation: '공사를 물린 일을 잊지 않는 회사 주인' }] },
      { label: '배를 짓고 돈을 받는다', hint: '설계는 설계일 뿐이라고 여긴다', values: { ambition: D },
        fx: [{ op: 'money', add: 150000 }, { op: 'hardship', add: 4 }] },
      { label: '짓되 밑창의 우리를 일부러 약하게 만든다', hint: '들키면 회사가 가만있지 않는다', values: { devotion: D }, danger: true,
        fx: [{ op: 'money', add: 80000 }, { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -20 }, { op: 'person', kind: 'enemy', relation: '속은 것을 안 회사 주인' }] }] },
    ],
  },
];

const RETIRED_LATE: Turning[] = [
  // ---------------------------------------------------------------- 은퇴한 뒤
  {
    id: 'late_r_old_mates', kind: 'door', when: at(age(55), RET),
    weight: 5, repeat: 'once', speaker: { relation: '옛 항해의 동무들' },
    title: '다시 열린 바다', body: '조용히 사는 {name}에게 옛 동무들의 편지가 왔다. 젊은 날 끝내 찾지 못한 섬을 향해, 죽기 전에 한 번 더 돛을 올리자고. 다들 지팡이를 짚는다고 적혀 있다.',
    doors: [
      { label: '지팡이를 짚고 배에 오른다', hint: '늙은 동무들과 마지막 항해를 한다. 몸이 버틸지 모른다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: '섬은 끝내 찾지 못했다. 그래도 돌아오는 갑판에서 다들 젊은 날처럼 노래를 불렀다.', weight: 'heavy' },
             { op: 'timeline', text: '늙은 동무들과 마지막 항해를 했다' }] },
      { label: '항해 비용을 대고 항구에서 손을 흔든다', hint: '함께 가지 않는다. 마음은 그 배에 실려 간다', values: { loyalty: D },
        fx: [{ op: 'money', add: -30000 }] },
      { label: '이제 바다는 창밖으로 보겠다고 답장한다', hint: '조용한 날들을 지킨다', values: { peace: D }, fx: [] },
    ],
  },
  {
    id: 'late_r_student_pirate', kind: 'door', when: at(age(55), RET),
    weight: 4, repeat: 'once', speaker: { relation: '이름난 해적이 된 옛 제자' },
    title: '제자의 칼끝', body: '젊은 날 칼을 가르친 아이가 악명 높은 해적이 되어 찾아왔다. 스승의 칼을 넘어서야 제 길이 끝난다며, 늙은 스승에게 한 판을 청한다.',
    doors: [
      { label: '마지막으로 칼을 든다', hint: '늙은 손으로 제자의 칼을 받는다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'heavy' }] },
             { op: 'log', text: '칼이 부딪친 뒤 제자가 먼저 무릎을 꿇었다. 이긴 것은 칼이 아니었다.', weight: 'heavy' }] },
      { label: '칼은 들지 않고 제자에게 무엇을 위해 싸우는지 묻는다', hint: '제자는 오래 대답하지 못한다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '칼을 거둔 옛 제자', age: { younger: 25 } }] },
      { label: '해군에 제자의 행방을 알린다', hint: '제가 키운 칼이 세상을 베는 것을 막는다', values: { justice: D },
        fx: [{ op: 'hardship', add: 4 }, { op: 'person', kind: 'enemy', relation: '스승을 원망하는 옛 제자', age: { younger: 25 } }] },
    ],
  },
  {
    id: 'late_r_old_sin', kind: 'door', when: at(age(55), RET),
    weight: 4, repeat: 'once', speaker: { relation: '찾아온 늙은 상인' },
    title: '남은 사과', body: '젊은 날 돈을 받고 흘린 말 한마디 때문에 식구를 잃었다는 늙은 상인이 찾아왔다. {name}은(는) 그 일을 잊고 살았다. 상인은 화도 내지 않고, 이유만 알고 싶다고 한다.',
    doors: [
      { label: '무릎을 꿇고 그날의 일을 다 털어놓는다', hint: '용서받을지 모른다. 그래도 말해야 한다', values: { justice: D },
        fx: [{ op: 'hardship', add: 3 }, { op: 'chance', p: 0.5, then: [{ op: 'log', text: '상인은 한참 울다가 {name}의 손을 잡았다.', weight: 'heavy' }] }] },
      { label: '남은 재산을 그 상인의 손주들에게 넘긴다', hint: '말보다 남은 것으로 갚는다', values: { devotion: D },
        fx: [{ op: 'money', add: -60000 }] },
      { label: '그런 일은 없었다고 잡아뗀다', hint: '상인은 말없이 돌아간다', values: { dominion: D },
        fx: [{ op: 'hardship', add: 5 }] },
    ],
  },
  {
    id: 'late_r_teach_guards', kind: 'door', when: at(age(60), RET),
    weight: 5, repeat: 'once', speaker: { relation: '마을의 젊은 경비대' },
    title: '낡은 몸', body: '오래된 상처가 도져 혼자 걷기도 힘들어졌다. 마을의 젊은 경비대원들이 찾아와, 마지막으로 싸우는 법을 가르쳐 달라고 한다. 이 섬에도 해적이 들기 시작했다.',
    doors: [
      { label: '의자에 앉은 채로 가르친다', hint: '몸은 움직이지 못해도 눈과 말은 남았다', values: { devotion: D },
        fx: [{ op: 'person', kind: 'ally', relation: '가르친 젊은 경비대원', age: { younger: 40 } }, { op: 'hp', add: -5 }] },
      { label: '평생 익힌 것을 책 한 권에 적는다', hint: '가르치는 대신 남긴다. 겨울 내내 붓을 든다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'timeline', text: '평생 익힌 것을 책 한 권에 적었다' }] },
      { label: '이제는 쉬고 싶다고 돌려보낸다', hint: '남은 날을 조용히 보낸다', values: { peace: D }, fx: [{ op: 'hp', add: 10 }] },
    ],
  },
  {
    id: 'late_r_house', kind: 'door', when: at(age(60), RET),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '남겨질 집', body: '오래 산 집을 물려받고 싶다는 먼 친척과, 그 집을 마을의 진료소로 쓰고 싶다는 의사가 같은 날 찾아왔다. 어느 쪽이든 {name}이(가) 떠난 뒤의 일이다.',
    doors: [
      { label: '친척에게 물려주겠다고 적어 둔다', hint: '집은 피붙이에게 간다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '집을 물려받을 먼 친척' }] },
      { label: '진료소로 쓰라고 내놓는다', hint: '마을 사람들이 그 집에서 낫는다', values: { devotion: D },
        fx: [{ op: 'fame', add: 3 }, { op: 'hp', add: 10 }, { op: 'timeline', text: '살던 집을 마을의 진료소로 내놓았다' }] },
      { label: '집을 팔아 남은 날 가 보지 못한 섬들을 돈다', hint: '돌아올 집은 없다. 발길 닿는 대로 산다', values: { freedom: D },
        fx: [{ op: 'money', add: 40000 }, { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'late_r_lighthouse', kind: 'door', when: at(age(60), RET),
    weight: 4, repeat: 'once', speaker: { relation: '항구의 젊은 관리' },
    title: '불 꺼진 등대', body: '{island}의 등대를 지키던 노인이 더는 계단을 오르지 못한다. 항구의 젊은 관리는 저절로 켜지는 새 등불을 달겠다고 한다. 노인은 {name}에게 마지막으로 불을 맡아 달라고 한다.',
    doors: [
      { label: '등대지기 노인의 일을 이어받는다', hint: '날마다 계단을 오른다. 밤바다의 배들이 그 불을 보고 돌아온다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'vit', add: 1 }, { op: 'person', kind: 'ally', relation: '불을 맡긴 등대지기 노인', age: { older: 10 } }] },
      { label: '새 등불이 어떻게 켜지는지 관리에게 배운다', hint: '늙은 머리로 새것을 익힌다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '노인 곁에 앉아 밤마다 등대 이야기를 듣는다', hint: '불은 새 등불에 맡긴다. 노인의 마지막 겨울을 함께 보낸다', values: { devotion: D },
        fx: [{ op: 'hardship', add: 1 }] },
    ],
  },
  {
    id: 'late_r_grandkids', kind: 'door', when: at(age(58), RET),
    weight: 4, repeat: 'once', speaker: { relation: '동네 아이들' },
    title: '이야기를 조르는 아이들', body: '동네 아이들이 {name}의 집 마당에 모여 바다 이야기를 조른다. 그런데 아이들이 듣고 싶어 하는 건 칼싸움과 보물 이야기뿐이다. {name}이(가) 겪은 바다는 그것만이 아니었다.',
    doors: [
      { label: '피 튀기는 모험담을 실컷 들려준다', hint: '아이들 눈이 반짝인다. 몇은 바다로 나가겠다고 한다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '모험담을 듣던 아이', age: 8 }] },
      { label: '잃은 사람들 이야기부터 들려준다', hint: '아이들이 조용해진다. 그날 이야기는 오래 남는다', values: { justice: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }] },
      { label: '이야기 대신 매듭 묶는 법을 가르친다', hint: '아이들은 투덜대다 금세 빠져든다', values: { inquiry: D },
        fx: [{ op: 'hp', add: 5 }] },
    ],
  },
];

const ANY_LATE: Turning[] = [
  // ---------------------------------------------------------------- 어느 처지에서나
  {
    id: 'late_obituary', kind: 'door', when: at(age(40), st(...GROWN)),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '옛 뱃동무의 부고', body: '신문 귀퉁이에 낯익은 이름이 실렸다. 젊은 날 함께 바다를 누빈 사람의 부고다. 장례는 사흘 뒤, 먼 섬에서 열린다고 한다.',
    doors: [
      { label: '하던 일을 멈추고 장례에 간다', hint: '먼 뱃길이다. 남은 식구들의 얼굴을 본다', values: { loyalty: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'hardship', add: 2 }, { op: 'log', text: '무덤 앞에 그와 즐겨 마시던 술을 따랐다.', weight: 'heavy' }] },
      { label: '그가 좋아하던 바다에 술 한 잔을 붓는다', hint: '가지는 않는다. 혼자서 보낸다', values: { romance: D },
        fx: [{ op: 'hardship', add: 1 }] },
      { label: '남은 식구들에게 다달이 돈을 보낸다', hint: '그 집이 기울지 않게 돕는다', values: { devotion: D },
        fx: [{ op: 'money', add: -25000 }] },
    ],
  },
  {
    id: 'late_body_decline', kind: 'door', when: at(age(48), st('pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp', 'shipwright')),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '예전 같지 않은 몸', body: '아침에 일어나면 무릎이 먼저 소리를 낸다. 예전에는 한 번에 넘던 난간에 손을 짚는다. 젊은 사람들이 {name}을(를) 배려하는 눈빛이 오히려 아프다.',
    doors: [
      { label: '새벽마다 더 오래 단련한다', hint: '몸을 억지로 끌어올린다. 다칠 수 있다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '힘 대신 눈과 머리로 싸우는 법을 익힌다', hint: '싸우는 방식을 바꾼다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch: 'observation', add: 8 }] },
      { label: '앞자리를 젊은이들에게 내주고 뒤를 맡는다', hint: '앞에 서는 일을 그만둔다', values: { devotion: D },
        fx: [{ op: 'fame', add: -3 }, { op: 'hp', add: 10 }] },
    ],
  },
  {
    id: 'late_unfinished', kind: 'door', when: at(age(62), st(...GROWN)),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '죽기 전에 풀 일', body: '밤에 잠이 오지 않는다. 젊은 날 등을 돌린 채 헤어진 사람의 얼굴이 떠오른다. 아직 살아 있다면, {town}의 바닷가 마을에 있을 것이다.',
    doors: [
      { label: '{town}(으)로 찾아가 먼저 손을 내민다', hint: '먼 길을 간다. 받아 줄지는 모른다', values: { loyalty: D },
        fx: [{ op: 'moveHome' }, { op: 'chance', p: 0.6, then: [{ op: 'log', text: '마주 앉은 두 늙은이는 한참 말이 없다가, 동시에 웃었다.', weight: 'heavy' }], else: [{ op: 'log', text: '그 사람은 지난겨울에 세상을 떠났다고 했다.', weight: 'heavy' }] },
             { op: 'timeline', text: '등 돌렸던 사람을 찾아 고향에 갔다' }] },
      { label: '편지 한 장을 써서 부친다', hint: '할 말은 다 적는다. 답장은 오지 않을 수도 있다', values: { romance: D },
        fx: [{ op: 'hardship', add: -1 }] },
      { label: '지난 일은 지난 일로 덮는다', hint: '마음 한쪽은 끝내 풀리지 않는다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'late_disciple_sails', kind: 'door', when: at(age(50), st(...GROWN)),
    weight: 4, repeat: 'once', speaker: { relation: '떠나는 제자' },
    title: '제자의 출항', body: '오래 곁에 두고 가르친 젊은이가 제 배를 띄우겠다고 한다. 아직 모자란 데가 보인다. 그 나이의 {name}도 그랬다.',
    doors: [
      { label: '아끼던 칼 한 자루를 쥐여 보낸다', hint: '제자의 길을 축복한다. 곁이 빈다', values: { freedom: D },
        fx: [{ op: 'person', kind: 'ally', relation: '칼을 받아 떠난 제자', age: { younger: 30 } }] },
      { label: '한 해만 더 배우고 가라고 붙잡는다', hint: '제자는 남는다. 그 눈빛이 조급하다', values: { dominion: D }, 
        fx: [{ op: 'person', kind: 'ally', relation: '한 해를 더 배운 제자', age: { younger: 30 } }, { op: 'hardship', add: 1 }] },
      { label: '그 배의 항해사로 함께 오른다', hint: '늙은 몸으로 젊은이의 바다를 따라간다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'mastery', branch: 'observation', add: 6 }] },
    ],
  },
];

export const LATE: Turning[] = [...SEA_LATE, ...FLAG_LATE, ...LAND_LATE, ...RETIRED_LATE, ...ANY_LATE];
