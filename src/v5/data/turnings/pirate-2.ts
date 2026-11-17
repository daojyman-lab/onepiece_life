// 해적의 길 (과제 7)의 둘째 묶음: 칠무해의 처지에서 오는 전환점과 신세계의 이름 있는 해적(원작 인물).
// pirate.ts가 500줄을 넘어 나누었다. pirate.ts의 PIRATE가 이 묶음을 함께 내보낸다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town}, {island}.
import { V } from '../balance';
import { age, at, sea, st } from './paths';
import type { Cond, Turning } from '../../core/types';

const D = V.value.door;
const PIR = st('pirate');
const WAR = st('warlord');
const settledIn = (n: number): Cond => ({ c: 'standingYears', min: n });
const fame = (min: number): Cond => ({ c: 'fame', min });
const LATE = sea('nw_first', 'nw_late');

export const PIRATE_2: Turning[] = [
  // ---------------------------------------------------------------- 칠무해
  {
    id: 'pirate_warlord_summons', kind: 'door', when: at(WAR, settledIn(2)),
    weight: 6, repeat: { years: 4 }, speaker: { relation: '정부의 전령' },
    title: '정부의 소집령', body: '정부의 전령이 소집령을 내민다. 이름 없는 해적단 하나를 쳐부수라는 명령이다. 그 선장은 {name}이(가) 깃발을 처음 올리던 시절 함께 술을 마시던 사람이다.',
    doors: [
      { label: '소집에 응해 그 해적단을 친다', hint: '정부의 신임을 얻고 옛 얼굴 하나를 잃는다', values: { ambition: D },
        fx: [{ op: 'fame', add: 30 }, { op: 'hardship', add: 3 }, { op: 'log', text: '옛 술친구의 배가 가라앉는 것을 끝까지 지켜보았다.', weight: 'heavy' }] },
      { label: '소집령을 찢어 버린다', hint: '칠무해의 자리를 잃을 수 있다', values: { freedom: D },
        fx: [{ op: 'chance', p: 0.5,
               then: [{ op: 'standing', to: 'pirate' }, { op: 'flag', id: 'govEnemy' },
                      { op: 'log', text: '정부가 칠무해의 자리를 거두어 갔다. 현상금이 다시 붙었다.', weight: 'heavy' }, { op: 'timeline', text: '칠무해의 자리를 잃었다' }],
               else: [{ op: 'fame', add: -10 }, { op: 'log', text: '정부는 경고장만 보내왔다. 아직은 쓸모가 있다는 뜻이었다.', weight: 'light' }] }] },
      { label: '응하는 척하며 그 해적단을 몰래 빼돌린다', hint: '들키면 정부 전체가 적이 된다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6,
               then: [{ op: 'fame', add: 10 }, { op: 'log', text: '포격 소리만 요란했다. 옛 술친구의 배는 안개 속으로 빠져나갔다.', weight: 'heavy' }],
               else: [{ op: 'standing', to: 'pirate' }, { op: 'flag', id: 'govEnemy' }, { op: 'fame', add: 40 },
                      { op: 'log', text: '정부가 모든 것을 알아챘다. 칠무해의 자리는 그날로 사라졌다.', weight: 'heavy' }, { op: 'timeline', text: '정부를 속인 것이 들켜 칠무해의 자리를 잃었다' }] }] },
    ],
  },
  {
    id: 'pirate_warlord_island', kind: 'door', when: at(WAR, settledIn(2)),
    weight: 5, repeat: 'once', speaker: { relation: '섬의 원로들' },
    title: '해적에게 바친 섬', body: '정부의 손이 닿지 않는 작은 섬의 원로들이 {name}을(를) 찾아왔다. 칠무해의 이름 아래 섬을 맡아 달라고, 대신 해마다 공물을 바치겠다고 한다.',
    doors: [
      { label: '섬을 제 나라로 삼는다', hint: '섬은 {name}의 것이 되고 원로들의 말은 줄어든다', values: { dominion: D },
        fx: [{ op: 'flag', id: 'ruler' }, { op: 'money', add: 100000 }, { op: 'fame', add: 20 }, { op: 'timeline', text: '섬 하나를 다스리게 되었다' }, { op: 'log', text: '원로들이 섬의 열쇠와 첫 공물을 내밀었다. {name}의 깃발이 항구에 오르자 회의에서 원로들은 더는 마지막 말을 하지 못했다.', weight: 'heavy' }] },
      { label: '공물은 받지 않고 섬의 바다만 지켜 준다', hint: '돈 대신 해마다 지킬 바다가 하나 는다', values: { romance: D },
        fx: [{ op: 'flag', id: 'guardian' }, { op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '섬의 원로' }, { op: 'log', text: '공물은 돌려보내고 섬 앞바다를 순찰했다. 첫 충돌에서 상처를 입었지만, 원로들은 다음 항해에도 항구를 열어 주겠다고 했다.', weight: 'heavy' }] },
      { label: '섬에 매이지 않겠다며 떠난다', hint: '원로들은 다른 해적을 찾을 것이다', values: { freedom: D }, fx: [{ op: 'log', text: '원로들에게 섬을 맡지 않겠다고 답하고 닻을 올렸다. 항구에서 그들은 다른 배가 오는지 한참 바다를 살폈다.', weight: 'light' }], closes: true },
    ],
  },

  // ---------------------------------------------------------------- 신세계의 이름 있는 해적 (원작 인물)
  {
    id: 'pirate_bartolomeo', kind: 'door', when: at(age(19), PIR, LATE, fame(100)),
    weight: 3, repeat: 'once', speaker: { canon: 'bartolomeo' },
    title: '닭벼슬 머리의 식인귀', body: '{island}의 항구에서 닭벼슬 머리의 해적이 혀를 내밀고 {name}을(를) 막아선다. 신문에서 봤다며, 이 바다에서 얼마나 버티나 보자고 웃는다. 보이지 않는 벽이 골목을 막는다.',
    doors: [
      { label: '함께 술 한잔하자고 손을 내민다', hint: '거친 녀석이지만 한번 믿으면 끝까지 간다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '닭벼슬 머리의 해적', canon: 'bartolomeo' }, { op: 'money', add: -10000 }, { op: 'log', text: '술값을 내자 바르톨로메오가 벽을 거두고 잔을 받았다. 헤어질 때는 다음에 만나면 서로 등을 맡기자며 큰소리쳤다.', weight: 'light' }] },
      { label: '보이지 않는 벽에 주먹을 날려 본다', hint: '손이 먼저 부서질지도 모른다', values: { ambition: D },
        fx: [{ op: 'hp', add: -20 }, { op: 'mastery', branch: 'fist', add: 15 }, { op: 'person', kind: 'rival', relation: '벽 너머의 맞수', canon: 'bartolomeo' }, { op: 'log', text: '보이지 않는 벽에 주먹을 거듭 부딪쳤다. 손등이 붓자 바르톨로메오는 웃으며 다음에는 더 세게 쳐 보라고 했다.', weight: 'light' }] },
      // 원작에서 바르톨로메오는 루피가 처형대에 섰던 날 로그타운에 있었다. 그날 그 웃음을 본 사람(sawLuffy)만 이 문을 연다
      { label: '로그타운 처형대 앞에서 본 얼굴임을 알아본다', hint: '같은 날 같은 웃음을 본 사이가 된다. 그 대신 그 배의 이야기를 밤새 들어야 한다',
        when: [{ c: 'flag', id: 'sawLuffy', has: true }], values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '그날 로그타운에 있던 해적', canon: 'bartolomeo' }, { op: 'hp', add: -5 },
             { op: 'log', text: '그날 벼락 아래서 웃던 소년 이야기가 나오자 닭벼슬 머리의 해적이 엉엉 울었다. 술자리는 새벽까지 이어졌다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'pirate_cavendish', kind: 'door', when: at(age(19), PIR, LATE, fame(80)),
    weight: 3, repeat: 'once', speaker: { canon: 'cavendish' },
    title: '백마의 귀공자', body: '흰 말을 탄 금발의 해적이 {island}의 광장에서 {name}을(를) 노려본다. 신문 첫 장의 자리를 빼앗아 간 자를 용서할 수 없다며 칼자루에 손을 얹는다.',
    doors: [
      { label: '신문의 자리를 걸고 겨룬다', hint: '이겨도 져도 평생 그 이름이 따라붙는다', values: { ambition: D }, danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'fame', add: 30 }, { op: 'person', kind: 'rival', relation: '백마의 귀공자', canon: 'cavendish' }, { op: 'log', text: '광장 한복판에서 캐번디시와 검을 맞댔다. 피가 흐른 자리까지 신문 기자들이 몰려왔고, 그는 다음 승부를 약속하며 말을 돌렸다.', weight: 'heavy' }] },
      { label: '그의 체면을 세워 주고 함께 싸울 날을 기약한다', hint: '신문의 주인공 자리는 그에게 넘긴다', values: { romance: D },
        fx: [{ op: 'fame', add: -10 }, { op: 'person', kind: 'ally', relation: '백마의 귀공자', canon: 'cavendish' }, { op: 'log', text: '캐번디시에게 기자들의 질문을 넘겼다. 그는 곧장 웃는 얼굴로 돌아섰고, 떠나기 전 다음 싸움에는 서로 돕자고 손을 내밀었다.', weight: 'light' }] },
      { label: '말 엉덩이를 걷어차고 달아난다', hint: '광장이 웃음바다가 되고 칼끝이 쫓아온다', values: { freedom: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 5 }, { op: 'flag', id: 'cavendishGrudge' }, { op: 'log', text: '말이 놀라 뛰자 광장에 웃음이 터졌다. 캐번디시가 칼을 빼 들고 쫓아왔고, {name}은(는) 한 대 맞은 뒤 골목으로 빠져나갔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'pirate_ideo', kind: 'door', when: at(age(19), PIR, LATE, fame(80)),
    weight: 3, repeat: 'once', speaker: { canon: 'ideo' },
    title: '파괴포의 권투사', body: '{island}의 투기장 뒤편에서 팔이 긴 권투사가 장갑 끈을 묶는다. 바다에서 제일 센 주먹을 찾고 있다며, {name}에게 한 판만 상대해 달라고 한다.',
    doors: [
      { label: '맨주먹으로 맞붙는다', hint: '뼈 몇 대는 각오해야 한다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'mastery', branch: 'fist', add: 20 }, { op: 'chance', p: 0.3,
               then: [{ op: 'injury', severity: 'heavy' }, { op: 'log', text: '이데오의 마지막 주먹에 크게 다쳐 링 바닥에 주저앉았다. 그는 쓰러진 {name}에게 손을 내밀고 다시 겨루자고 했다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '몇 번이나 맞고도 끝까지 주먹을 맞댔다. 이데오는 웃으며 장갑을 벗고 다음에 또 겨루자고 했다.', weight: 'heavy' }] },
             { op: 'person', kind: 'ally', relation: '주먹을 맞댄 권투사', canon: 'ideo' }] },
      { label: '그의 주먹을 끝까지 지켜보고 배운다', hint: '몸은 성하고 손에 남는 것은 적다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch: 'fist', add: 8 }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: '이데오의 발놀림을 보며 거리를 재는 법을 익혔다. 겨룸이 끝나자 그는 왜 붙지 않았느냐며 어깨를 으쓱했다.', weight: 'light' }] },
      { label: '투기장의 판돈을 챙겨 자리를 뜬다', hint: '권투사의 실망한 얼굴이 남는다', values: { greed: D }, 
        fx: [{ op: 'money', add: 45000 }, { op: 'log', text: '판돈을 챙겨 뒷문으로 나왔다. 이데오는 빈 링을 바라보다 장갑 끈을 풀고 돌아섰다.', weight: 'light' }] },
    ],
  },
];
