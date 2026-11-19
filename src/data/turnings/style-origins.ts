import { COMBAT_STYLE_BY_ID } from '../combat-styles';
import { STYLE_ORIGINS } from '../style-origins';
import type { DreamId, Turning } from '../../core/types';

export const STYLE_TURNINGS: Turning[] = STYLE_ORIGINS.flatMap((o): Turning[] => {
  const def = COMBAT_STYLE_BY_ID[o.style];
  const dream: DreamId = def.branch === 'sword' ? 'bestSword' : def.branch === 'fist' ? 'bestFist' : def.branch === 'gun' ? 'bestShot' : 'bestWeapon';
  return [
    {
      id: `style_meet_${o.style}`, kind: 'door', speaker: 'hero', repeat: 'once', weight: 0.35,
      when: [{ c: 'age', min: 10 }, { c: 'standing', is: ['child', 'civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp'] },
        { c: 'styleBond', style: o.style, phase: 'new' }, ...o.when],
      title: o.title, body: o.body,
      doors: [
        { label: '그 사람에게 기초부터 배우겠다고 청한다', hint: o.practice, values: {}, fx: [{ op: 'beginStyle', style: o.style }] },
        { label: '이야기를 듣고 지금 걷던 길로 돌아간다', hint: '새 수련 약속은 맺지 않는다', values: {}, closes: true, fx: [{ op: 'log', text: '가르침은 마음에 남겼지만 새로운 수련 약속은 맺지 않았다.', weight: 'light' }] },
      ],
    },
    {
      id: `style_adopt_${o.style}`, kind: 'door', speaker: { relation: `${def.name}의 인연` }, repeat: { years: 1 }, weight: 8,
      when: [{ c: 'styleBond', style: o.style, phase: 'ready' }],
      title: `${def.name}을(를) 나의 길로`, body: `${o.teacher}와(과) 약속한 기초 연습을 마쳤다. 이제 수련의 결과를 보일 때다. 이 가르침을 자신의 주력으로 이어 갈지 정해야 한다.`,
      doors: [
        { label: '배운 것을 자신의 주력으로 삼는다', hint: def.weapon ? '손에 맞춘 무기를 쓰며 이 길을 갈고닦는다' : '익힌 동작을 자신의 싸움법으로 삼는다', values: {}, fx: [{ op: 'adoptStyle', style: o.style }] },
        { label: '이 길의 정점에 서겠다고 다짐하고 주력으로 삼는다', hint: '자신이 익힌 싸움법으로 가장 높은 곳에 닿고 싶다', when: [{ c: 'dream', has: false }], values: { dominion: 4 }, fx: [{ op: 'adoptStyle', style: o.style }, { op: 'dream', id: dream }] },
        { label: '조금 더 생각하고 나중에 돌아온다', hint: '연습과 인연은 남긴다', values: {}, fx: [{ op: 'log', text: `${o.teacher}에게 아직 마음을 정하지 못했다고 말했다. 배운 자세를 되짚으며 연습하던 곳으로 돌아왔다.`, weight: 'light' }] },
      ],
    },
    {
      id: `style_refine_${o.style}`, kind: 'door', speaker: { relation: `${def.name}의 인연` }, repeat: 'once', weight: 5,
      when: [{ c: 'styleBond', style: o.style, phase: 'refine' }],
      title: `${o.teacher}의 다음 가르침`, body: `${def.name}의 기초를 넘어 자신의 버릇이 생겼다. 겪은 시련과 실전 이야기를 들은 ${o.teacher} 앞에서 익힌 것을 보인다. 이제 더 높은 경지로 갈 수 있다며 익숙한 동작 속의 빈틈을 짚어 준다.`,
      doors: [
        { label: '처음 배웠던 자세로 돌아가 빈틈을 고친다', hint: o.follow, values: {}, fx: [{ op: 'refineStyle', style: o.style }] },
        { label: '지금의 버릇을 자신의 방식으로 더 다듬는다', hint: '가르쳐 준 사람에게 감사하고 자신의 길을 간다', values: { freedom: 4 }, fx: [{ op: 'log', text: '처음 배운 때를 돌아보고 지금의 방식으로 계속 나아가기로 했다.', weight: 'light' }] },
      ],
    },
  ];
});
