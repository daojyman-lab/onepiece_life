import type { ChildhoodOutcome, Cond, Door, Fx, Turning } from '../../core/types';
import { CHILDHOOD_INCIDENTS, INCIDENTS_BY_TOWN, type ChildhoodIncident } from '../childhood-incidents';
import { V } from '../balance';
import { kid } from './childhood';

const D = V.value.door;
const HOMETOWNS = Object.keys(INCIDENTS_BY_TOWN);
const flag = (id: string): Fx => ({ op: 'flag', id });
const log = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const timeline = (text: string): Fx => ({ op: 'timeline', text });

function crisis(story: ChildhoodIncident): Turning[] {
  const towns = Object.keys(INCIDENTS_BY_TOWN).filter(town => INCIDENTS_BY_TOWN[town].includes(story.id));
  const id = `child_crisis_${story.id}`;
  const when: Cond[] = [...kid(8, 9), { c: 'town', is: towns }, { c: 'island', is: towns }];
  const shared = { kind: 'door', weight: 0, repeat: 'once', speaker: 'hero' } as const;
  const begin = flag('homeCrisis');
  const remember = (outcome: ChildhoodOutcome): Fx => ({ op: 'rememberChildhood', storyId: story.id, outcome });
  return [
    {
      ...shared, id, when: [...when, { c: 'flag', id: 'homeCrisis', has: false }],
      title: story.title, body: story.body,
      doors: [
        { label: story.rescue, hint: '가까이 있는 주민부터 돕는다', values: { [story.rescueValue ?? 'justice']: D },
          fx: [begin, log(story.safe), timeline(story.safe)] },
        { label: '혼자 나서지 않고 도와줄 사람을 찾는다', hint: '마을 사람들에게 알리거나 곁에 있는 사람과 함께 나선다',
          fx: [begin, { op: 'queue', turning: id + '_help' }] },
        { label: story.parentChoice ?? '부모와 함께 남은 주민들을 대피시킨다', hint: '{parent}이(가) 마지막 사람 곁에 남는다. 목숨을 잃을 수 있다',
          needs: ['parent'], danger: true, values: { loyalty: D },
          fx: [begin, { op: 'chance', p: 0.30,
            then: [remember('loss'), log(story.loss), timeline('{crisisTown}의 「{crisisTitle}」 때 {crisisPerson}을(를) 잃었다'), { op: 'losePerson', who: 'parent' }, flag('homeCrisis:loss')],
            else: [remember('parentSafe'), log('마지막 사람이 빠져나온 뒤 {parent}이(가) 뒤따라 나왔다. {name}은(는) 그 손을 잡고 함께 집으로 돌아갔다.'), timeline('「{crisisTitle}」 때 {crisisPerson}과(와) 이웃들을 구하고 집에 돌아왔다')] }] },
      ],
    },
    {
      // 이미 고른 옛 사건의 다음 장면은 마을별 추첨 목록이 바뀌어도 열려야 한다.
      ...shared, id: id + '_help', when: [...kid(8, 9), { c: 'town', is: HOMETOWNS }, { c: 'island', is: HOMETOWNS }, { c: 'flag', id: 'homeCrisis', has: true }], title: story.title + ' · 함께 나선 사람들',
      body: '{name}이(가) 소식을 전하자 주민들이 하던 일을 내려놓고 모여든다.',
      doors: [
        { label: '주민들에게 방금 본 일을 알리고 현장으로 안내한다', hint: '직접 본 아이가 앞장서면 어른들이 뒤를 따른다',
          values: { justice: D }, fx: [log('현장을 본 주민들은 먼저 아이들을 물리고 다친 사람을 챙겼다.'), timeline(`${story.title} 때 주민들을 불러 모았다`)] },
        { label: story.rivalChoice ?? '맞수와 함께 주민들 앞에 나선다', hint: '{rival}이(가) 앞장서고 이웃들이 힘을 보탠다', when: [{ c: 'relation', is: '어릴 적 맞수' }],
          values: { loyalty: D }, fx: [remember('rival'), log(story.rival), flag('homeCrisis:rival'), timeline('「{crisisTitle}」 때 {crisisPerson}과(와) 힘을 합쳐 이웃들을 지켰다')] },
        { label: story.mentorChoice ?? '스승에게 달려가 함께 사람들을 구한다', hint: '사람들을 돕던 {mentor}이(가) 다친다. 곁에서 손을 보탠다', when: [{ c: 'relation', is: '스승' }],
          values: { ambition: D }, fx: [remember('mentor'), log(story.mentor), flag('homeCrisis:mentor'), timeline('「{crisisTitle}」 때 다친 스승 {crisisPerson}을(를) 돌봤다'), { op: 'queue', turning: 'child_mentor_recovery' }] },
      ],
    },
  ];
}

function memory(outcome: string, title: string, body: string, doors: Door[]): Turning {
  return { id: `child_memory_${outcome}`, kind: 'door', weight: 0, repeat: 'once', speaker: 'hero',
    when: [{ c: 'age', min: 12, max: 15 }, { c: 'flag', id: `homeCrisis:${outcome}`, has: true }], title, body, doors };
}

export const CHILDHOOD_MEMORIES = [
  memory('loss', '그림 뒷면의 이름', '{crisisTown}에서 온 봉투에 「{crisisTitle}」 때 살아난 이웃의 그림이 들었다. {crisisLandmark} 옆에 사람 둘이 손을 잡고 서 있다. 이웃은 그림 뒷면에 그날 자기 손을 잡아 준 이가 {crisisPerson}(이)었다고 적었다.', [
    { label: '그림을 보내 준 이웃에게 그날 이야기를 더 들려 달라고 쓴다', hint: '누가 누구의 손을 잡았는지 한 사람씩 적어 둔다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, timeline('{crisisPerson}이(가) 구한 이웃에게서 「{crisisTitle}」 때 곁에 있던 사람들의 이름을 받아 적었다')] },
    { label: '그림 뒷면에 내가 기억하는 모습을 그린다', hint: '집에서 늘 보던 표정을 그려 넣고, 접어서 품에 넣는다', values: { peace: D }, fx: [{ op: 'base', key: 'wil', add: 1 }, timeline('{crisisPerson}의 웃는 얼굴을 그려 넣은 그림을 품에 간직했다')] },
  ]),
  memory('mentor', '아직 빈 쪽이 남은 수첩', '짐 속에서 스승 {crisisPerson}의 수첩이 나온다. 「{crisisTitle}」 때 다친 스승을 돌보며 갖게 된 수첩이다. {crisisCare} 그때 문밖에서 심부름꾼이 아픈 이웃의 집을 아느냐고 묻는다. 아는 길이다.', [
    { label: '이웃집까지 가는 길을 그려 심부름꾼에게 건넨다', hint: '수첩의 빈 쪽에 지나칠 만한 갈림길을 표시한다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, timeline('스승 {crisisPerson}의 수첩에 심부름꾼이 길을 찾을 지도를 그렸다')] },
    { label: '심부름꾼과 함께 이웃집까지 뛰어간다', hint: '제때 도착한 두 사람을 보고 이웃이 이불 속에서 손을 내민다', values: { loyalty: D }, fx: [{ op: 'base', key: 'vit', add: 1 }, timeline('스승 {crisisPerson}을(를) 돌보던 때처럼 아픈 이웃에게 심부름을 다녀왔다')] },
  ]),
  memory('rival', '두 사람이 적힌 기록', '{crisisTown} 사람들이 돌려 읽던 「{crisisTitle}」 기록이 {name}에게 왔다. 여백에 {crisisLandmark} 그림이 있고 그 밑에 {crisisPerson}과(와) {name}의 서명이 붙어 있다. 그날 첫 글자를 너무 크게 쓴 탓에 둘째 이름은 마지막 글자만 유난히 작다.', [
    { label: '맞수의 몫까지 한 장 더 베껴 둔다', hint: '다시 만날 때 건넬 수 있도록 그림도 둘의 이름도 그대로 옮긴다', values: { loyalty: D }, fx: [flag('homeCrisis:copy'), timeline('{crisisPerson}에게 줄 「{crisisTitle}」 기록을 한 장 베꼈다')] },
    { label: '그날 손을 보탠 다른 이웃들의 이름도 적는다', hint: '기억이 희미해진 자리는 다음 사람이 써넣도록 남겨 둔다', values: { justice: D }, fx: [timeline('{crisisPerson}과(와) 지킨 {crisisTown}의 기록에 다른 이웃들의 이름을 더했다')] },
  ]),
];

const clinic: Turning = {
  id: 'child_clinic_apprentice', kind: 'door', when: [...kid(7, 7), { c: 'flag', id: 'mentor', has: false }],
  weight: 0, repeat: 'once', speaker: 'hero', title: '약봉지 접는 법',
  body: '{town}의 의원이 왕진에서 돌아와 약봉지를 접는다. 작은 손이 더 야무지겠다며 빈 종이를 내민다. 귀퉁이를 맞춰 접으니 봉투가 벌어지지 않는다. 의원은 다음에 오면 환자의 말을 받아 적는 일도 가르쳐 주겠다고 한다.',
  doors: [
    { label: '약봉지를 마저 접고 내일 다시 배우러 온다', hint: '왕진을 따라다니며 아픈 이웃들을 돌보는 법을 배운다', values: { inquiry: D },
      fx: [{ op: 'person', kind: 'ally', relation: '스승', age: { older: 30 } }, flag('clinicApprentice'), timeline('{town}의 의원 {mentor}을(를) 스승으로 모셨다')] },
    { label: '오늘 쓸 약봉지만 접어 두고 돌아간다', hint: '의원이 종이 한 장을 더 내줘 집에서도 봉투를 접어 볼 수 있다',
      fx: [log('집에 돌아와 남은 종이를 다시 접었다. 이번에는 모서리가 조금 비뚤어졌다.')] },
  ],
};

const mentorRecovery: Turning = {
  id: 'child_mentor_recovery', kind: 'door', when: [...kid(8, 9), { c: 'flag', id: 'homeCrisis:mentor', has: true }],
  weight: 0, repeat: 'once', speaker: 'hero', title: '수업을 쉬는 날',
  body: '「{crisisTitle}」 뒤 첫 수업 날, 스승 {crisisPerson}은(는) 조금 더 쉬어야 한다. 문병 온 이웃들이 저마다 무얼 가져올지 묻는다. 스승은 침상 옆의 작은 수첩을 {name}에게 건네며 이웃들의 말을 받아 적어 달라고 한다.',
  doors: [
    { label: '약봉지를 가져오고 다시 받을 날을 적어 둔다', hint: '스승이 직접 가지 않아도 매번 약을 제때 받는다', values: { inquiry: D },
      fx: [timeline('{crisisPerson}의 약 심부름을 맡고 약을 받아 온 날짜를 수첩에 적었다')] },
    { label: '이웃들과 밥상을 나를 차례를 정한다', hint: '날짜 옆에 한 사람씩 서명한다. 다음 끼니를 누가 맡았는지 한눈에 보인다', values: { loyalty: D },
      fx: [timeline('{crisisPerson}의 끼니를 번갈아 챙긴 이웃들과 수첩을 채웠다')] },
  ],
};

export const CHILDHOOD_CRISES = [clinic, mentorRecovery, ...Object.values(CHILDHOOD_INCIDENTS).flatMap(crisis)];
