import { COMBAT_STYLE_BY_ID, type CombatStyle } from '../combat-styles';
import { STYLE_ORIGINS } from '../style-origins';
import type { Door, DreamId, Fx, Standing, Turning } from '../../core/types';

const usualStandings: Standing[] = ['child', 'civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp'];

function learnFromContact(style: CombatStyle, relation: string, islands: string[], label: string, hint: string): Door {
  return { label, hint, when: [{ c: 'island', is: islands }, { c: 'person', relation, has: true, kinds: ['ally', 'master'] }], values: {},
    fx: [{ op: 'beginStyle', style, teacherRelation: relation }] };
}

// 원래 만남의 수락(0), 거절(1)은 저장된 선택 기록에서도 같은 뜻을 유지한다.
const knownTeachers: Partial<Record<CombatStyle, Door>> = {
  hammer: learnFromContact('hammer', '갈레라 컴퍼니의 사장', ['워터 세븐', '워터 세븐 뒷골목'],
    '아이스버그에게 작업 해머를 들고 간다', '갈레라 창립 때 견습 자리를 얻었다면 옛 도크에서 사장과 함께 손볼 수 있다'),
  club: learnFromContact('club', '늙은 대장장이', ['와노쿠니', '쿠리', '에비스 마을', '하나노미야코'],
    '옛 영주의 무사에게 칼을 전해 준 대장간을 찾는다', '와노의 대장장이를 도운 인연이 있으면 그와 함께 몽둥이를 만든다'),
  dial: learnFromContact('dial', '다이얼 공방의 기록꾼 벨라', ['스카이피아', '엔젤섬'],
    '벨라에게 공방의 다이얼 기록을 함께 읽자고 한다', '집들의 이름을 되찾아 준 인연이 있으면 벨라와 수련할 수 있다'),
};

export const STYLE_TURNINGS: Turning[] = STYLE_ORIGINS.flatMap((o): Turning[] => {
  const def = COMBAT_STYLE_BY_ID[o.style];
  const teacher = `{person:${def.name}의 인연}`;
  const dream: DreamId = def.branch === 'sword' ? 'bestSword' : def.branch === 'fist' ? 'bestFist' : def.branch === 'gun' ? 'bestShot' : 'bestWeapon';
  const mentor = o.mentor;
  const relation = mentor ? `${o.teacher} ${mentor.name}` : undefined;
  const begin: Fx[] = mentor && relation ? [
    { op: 'person', kind: 'master', relation, ...mentor, reuseName: true },
    { op: 'beginStyle', style: o.style, teacherRelation: relation },
  ] : [{ op: 'beginStyle', style: o.style }];
  const known = knownTeachers[o.style];
  return [
    {
      id: `style_meet_${o.style}`, kind: 'door', speaker: 'hero', repeat: 'once', weight: mentor ? 2 : 0.35,
      when: [{ c: 'age', min: 10 }, { c: 'standing', is: mentor ? [...usualStandings, 'settled', 'retired'] : usualStandings },
        { c: 'styleBond', style: o.style, phase: 'new' }, ...o.when],
      title: o.title, body: o.body,
      doors: [
        { label: mentor ? `${mentor.name}에게 ${def.name}을(를) 배운다` : '그 사람에게 기초부터 배우겠다고 청한다', hint: o.practice, values: {}, fx: begin },
        { label: '이야기를 듣고 지금 걷던 길로 돌아간다', hint: '새 수련 약속은 맺지 않는다', values: {}, closes: true, fx: [{ op: 'log', text: '가르침은 마음에 남겼지만 새로운 수련 약속은 맺지 않았다.', weight: 'light' }] },
        ...(known ? [known] : []),
      ],
    },
    {
      id: `style_adopt_${o.style}`, kind: 'door', speaker: { relation: `${def.name}의 인연` }, repeat: { years: 1 }, weight: 8,
      when: [{ c: 'styleBond', style: o.style, phase: 'ready' }],
      title: `${def.name}을(를) 나의 길로`, body: def.weapon
        ? `약속한 연습을 마치고 ${teacher}에게 돌아왔다. 이제 「${def.weapon}」을(를) 맡아 ${def.name}을(를) 주력으로 삼을 수 있다.`
        : `${teacher}와(과) 약속한 기초 연습을 마쳤다. 함께 익힌 동작을 이제 자신의 싸움법으로 삼을 수 있다.`,
      doors: [
        { label: '배운 것을 자신의 주력으로 삼는다', hint: def.weapon ? '손에 맞춘 무기를 쓰며 이 길을 갈고닦는다' : '익힌 동작을 자신의 싸움법으로 삼는다', values: {}, fx: [{ op: 'adoptStyle', style: o.style }] },
        { label: '이 길의 정점에 서겠다고 다짐하고 주력으로 삼는다', hint: '자신이 익힌 싸움법으로 가장 높은 곳에 닿고 싶다', when: [{ c: 'dream', has: false }], values: { dominion: 4 }, fx: [{ op: 'adoptStyle', style: o.style }, { op: 'dream', id: dream }] },
        { label: '조금 더 생각하고 나중에 돌아온다', hint: '연습과 인연은 남긴다', values: {}, fx: [{ op: 'log', text: `${teacher}에게 아직 마음을 정하지 못했다고 말했다. 배운 자세를 되짚으며 연습하던 곳으로 돌아왔다.`, weight: 'light' }] },
      ],
    },
    {
      id: `style_refine_${o.style}`, kind: 'door', speaker: { relation: `${def.name}의 인연` }, repeat: 'once', weight: 5,
      when: [{ c: 'styleBond', style: o.style, phase: 'refine' }],
      title: `${teacher}의 다음 가르침`, body: `${def.name}의 기초를 넘어 자신의 버릇이 생겼다. 그동안 겪은 일을 들은 ${teacher} 앞에서 익힌 것을 보인다. 이제 더 높은 경지로 갈 수 있다며 익숙한 동작 속의 빈틈을 짚어 준다.`,
      doors: [
        { label: '처음 배웠던 자세로 돌아가 빈틈을 고친다', hint: `${teacher}에게 다음 가르침을 받는다`, values: {}, fx: [{ op: 'refineStyle', style: o.style }] },
        { label: '지금의 버릇을 자신의 방식으로 더 다듬는다', hint: '가르쳐 준 사람에게 감사하고 자신의 길을 간다', values: { freedom: 4 }, fx: [{ op: 'log', text: '처음 배운 때를 돌아보고 지금의 방식으로 계속 나아가기로 했다.', weight: 'light' }] },
      ],
    },
  ];
});
