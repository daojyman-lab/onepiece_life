// 원작 인물을 배(분대)에 태우는 전환점. data/recruits.ts의 한 줄이 전환점 하나가 된다 (rec_<id>).
// 그 인물이 있는 섬에 닿아야 열린다 (항해: core/year.ts의 voyage). 태우는 문은 제 배가 있어야(해군은 분대장이어야) 열리고,
// 배가 없어도 인연은 맺을 수 있다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { CANON } from '../canon';
import { RECRUITS, TEMPS, type RecruitRow, type TempRow } from '../recruits';
import { ZOU_CARD } from '../voyage';
import { SQUAD } from './marine';
import { afterHistory, beforeHistory, age, at, sea, st } from './paths';
import type { SeaId } from '../../core/types';
import type { Cond, Door, Turning } from '../../core/types';

const D = V.value.door;
const WHO: Record<RecruitRow[8], Cond> = {
  F: st('pirate', 'bountyHunter', 'revolution', 'warlord'), M: st('marine', 'cp'), R: st('revolution'),
};
const OFFICER: Cond = { c: 'flag', id: 'mnOfficer', has: true };
/** 만나는 곳: 섬 이름, '@바다id'면 그 바다 어디서나 */
const place = (p: string): Cond => (p.startsWith('@') ? sea(p.slice(1) as SeaId) : { c: 'island', is: [p] });
const fame = (min: number): Cond => ({ c: 'fame', min });
/** 이름난 사람은 처음부터 레벨이 높다 (없으면 V.person.crew.level) */
const LEVEL: Record<string, number> = {
  mihawk: 30, kuzan: 29, yamato: 24, killer: 16, xdrake: 16, ulti: 15, ashura: 15, karasu: 15, lindbergh: 15, betty: 15,
  kawamatsu: 14, kikunojo: 14, chinjao: 14, pageone: 14, hyogoro: 12, raizo: 12, pedro: 12, sentomaru: 12,
  daz: 10, kaku: 10, orlumbus: 10, jabra: 9, senorpink: 9, kalifa: 8, blueno: 8, perona: 8, wiper: 8, bellamy: 8, hina: 8,
};
const MEDICAL_SKILL: Record<string, number> = { hogback: 90, aladdin: 75 };
/** 아무나 태울 수 없는 사람: 이름값이 있어야 말을 붙일 수 있고, 쿠잔은 해군을 떠난 뒤(원작 두 해 뒤)에만 만난다 */
const GATE: Record<string, Cond[]> = {
  perona: [age(16, 18)], absalom: [age(16, 18)], hogback: [age(16, 18)], lola: [age(18, 18)],
  mihawk: [afterHistory('reverie'), fame(300), { c: 'tier', branch: 'any', min: 4 }],
  kuzan: [afterHistory('punkDuel'), fame(150), { c: 'canonAge', id: 'kuzan', min: 49 }],
  hatchan: [afterHistory('strawHatPoster')], kuroobi: [afterHistory('strawHatPoster')],
  mr5: [afterHistory('alabastaRain')], koza: [afterHistory('alabastaRain')], pell: [afterHistory('alabastaRain')],
  wiper: [afterHistory('skyBell')], ganfall: [beforeHistory('skyBell')], cricket: [afterHistory('skyBell')],
  zambai: [afterHistory('eniesLobby')], wadatsumi: [afterHistory('fishmanPact')], hyouzou: [beforeHistory('fishmanPact')],
  brownbeard: [afterHistory('punkDuel')], pedro: [beforeHistory('wholeCake')], ashura: [beforeHistory('wanoFree')],
  kawamatsu: [afterHistory('reverie')], kikunojo: [afterHistory('wanoFree')], ulti: [afterHistory('wanoFree')],
  yamato: [afterHistory('wanoFree'), fame(100)], killer: [fame(60)],
  zoro: [age(16, 17), beforeHistory('loguetownStorm')],
  vivi: [age(17, 19), beforeHistory('alabastaRain')], ace: [age(16, 19), beforeHistory('alabastaRain')],
  law: [afterHistory('fishmanPact'), beforeHistory('dressrosaFree'), fame(60)],
  smoker: [afterHistory('fishmanPact'), beforeHistory('dressrosaFree')],
  marco: [afterHistory('reverie'), beforeHistory('wanoFree'), fame(100)],
  kid: [afterHistory('reverie'), beforeHistory('wanoFree'), fame(100)],
  sabo: [afterHistory('fishmanPact'), beforeHistory('dressrosaFree'), fame(40)],
};
const JOIN_VALUES = ['loyalty', 'romance', 'ambition', 'dominion', 'freedom'] as const;

function recruit(row: RecruitRow, i: number): Turning {
  const [id, name, , , faction, , island, role, who, epithet, body] = row;
  const squad = who === 'M';
  const join: Door = squad
    ? { label: '분대로 데려온다', hint: '분대에 사람이 하나 는다. 이름난 사람은 다루기도 그만큼 어렵다', when: [OFFICER], values: { [JOIN_VALUES[i % 5]]: D },
        fx: [{ op: 'person', kind: 'crew', relation: `${SQUAD} · ${epithet}`, canon: id, role, ...(LEVEL[id] ? { level: LEVEL[id] } : {}), ...(MEDICAL_SKILL[id] ? { medicalSkill: MEDICAL_SKILL[id] } : {}) },
             { op: 'log', text: `${name}에게 분대의 자리를 내주었다. 새 동료는 각자의 얼굴을 익힌 뒤 정식으로 임무에 합류했다.`, weight: 'heavy' }, { op: 'timeline', text: `${name}을(를) 분대로 데려왔다`, canon: id }] }
    : { label: '같이 가자고 손을 내민다', hint: '배에 식구가 하나 는다. 이름난 사람을 태우면 쫓는 눈도 는다', needs: ['ship'], values: { [JOIN_VALUES[i % 5]]: D },
        fx: [{ op: 'person', kind: 'crew', relation: epithet, canon: id, role, ...(LEVEL[id] ? { level: LEVEL[id] } : {}), ...(MEDICAL_SKILL[id] ? { medicalSkill: MEDICAL_SKILL[id] } : {}) }, { op: 'fame', add: 5 },
             { op: 'log', text: `${name}에게 내민 손을 거두지 않았다. 새 식구가 갑판에 오르자 배의 빈자리가 하나 채워졌다.`, weight: 'heavy' }, { op: 'timeline', text: `${name}을(를) 배에 태웠다`, canon: id }] };
  const meet: Door[] = [
    { label: '술 한잔을 나누고 이름만 주고받는다', hint: '인연은 남는다', values: { romance: D }, fx: [{ op: 'person', kind: 'ally', relation: epithet, canon: id }, { op: 'log', text: `${name}과(와) 잔을 부딪쳤다. 헤어질 때는 서로의 이름을 잊지 않겠다고 했다.`, weight: 'light' }] },
    { label: '사정을 끝까지 들어 준다', hint: '다시 만나면 알아볼 사이가 된다', values: { inquiry: D }, fx: [{ op: 'person', kind: 'ally', relation: epithet, canon: id }, { op: 'base', key: 'int', add: 1 }, { op: 'log', text: `${name}의 사정을 끝까지 듣고 궁금한 점을 다시 물었다. 헤어질 때는 연락할 방법을 서로 남겼다.`, weight: 'light' }] },
    { label: '가진 것을 조금 나눠 주고 헤어진다', hint: '빚을 진 쪽은 잊지 않는다', values: { peace: D }, fx: [{ op: 'money', add: -2000 }, { op: 'person', kind: 'ally', relation: epithet, canon: id }, { op: 'log', text: `${name}에게 여비를 조금 건넸다. 받지 않겠다는 손을 밀어 주자, 상대는 다음에 갚겠다며 웃었다.`, weight: 'light' }] },
    { label: '한판 붙어 누가 위인지 가린다', hint: '멍이 든다. 서로 얼굴은 잊지 않는다', values: { dominion: D }, fx: [{ op: 'hp', add: -8 }, { op: 'person', kind: 'rival', relation: epithet, canon: id }, { op: 'log', text: `${name}과(와) 맞붙다 멍이 들었다. 승부가 끝난 뒤에도 서로 눈을 피하지 않았다.`, weight: 'light' }] },
  ];
  const pass: Door[] = [
    { label: '갈 길이 다르다며 지나친다', hint: '아무 일도 일어나지 않는다', values: { freedom: D }, fx: [{ op: 'log', text: `${name}에게 짧게 인사하고 각자의 길로 돌아섰다. 뒤에서 붙잡는 목소리는 없었다.`, weight: 'light' }] },
    { label: '억울한 사정이 있는지만 묻고 지나친다', hint: '대답은 듣지 못한다', values: { justice: D }, fx: [{ op: 'log', text: `${name}에게 억울한 일이 있는지 물었지만 대답은 돌아오지 않았다. 더 캐묻지 않고 길을 비켰다.`, weight: 'light' }] },
    { label: '솜씨만 눈여겨보고 떠난다', hint: '본 것은 남는다', values: { ambition: D }, fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'log', text: `${name}의 움직임을 눈에 새겼다. 돌아서는 길에 방금 본 동작을 혼자 흉내 내 보았다.`, weight: 'light' }] },
    { label: '목에 걸린 값이 있는지 수배서부터 뒤져 본다', hint: '쓸 만한 값이면 초소에 귀띔한다. 주머니가 조금 찬다', values: { greed: D }, fx: [{ op: 'money', add: 12000 }, { op: 'log', text: `${name}의 이름이 적힌 수배서를 찾아 초소에 정보를 팔았다. 손에 쥔 돈은 묵직했지만 서로의 인연은 거기서 끝났다.`, weight: 'light' }] },
  ];
  const p = i % 4 === 3 && faction !== 'pirate' ? 1 : i % 4;
  const friendly = meet[(i + 1) % 4];
  if (id === 'lindbergh' || id === 'pekoms' || id === 'pedro') {
    for (const door of [join, friendly]) {
      if (door.fx?.some((e) => e.op === 'person' && (e.kind === 'ally' || e.kind === 'crew'))) {
        door.fx.push({ op: 'flag', id: ZOU_CARD },
          { op: 'log', text: '밍크 전사가 고향을 찾을 때 쓰라며 비블카드 조각을 건넸다. 손바닥 위에 놓자 한쪽 귀퉁이가 조우를 향해 움직였다.', weight: 'light' });
      }
    }
  }
  return {
    id: `rec_${id}`, kind: 'door', when: at(age(16), WHO[who], place(island), ...(GATE[id] ?? [])), weight: 3, repeat: 'once', speaker: { canon: id },
    title: `「${epithet}」 ${name}`, body, doors: [join, friendly, pass[p]],
  };
}

/** 임시 동행: 약속한 햇수만 함께 싸우고 제 길로 떠난다 (core/year.ts의 partCompanions). 배가 없어도 동행한다 */
function companion(row: TempRow, i: number): Turning {
  const [id, where, years, level, who, epithet, body] = row;
  const name = CANON[id].name;
  const go: Door = {
    label: who === 'M' ? '합동 작전을 받아들인다' : '갈 길이 갈릴 때까지 한 뱃길을 간다', hint: '한동안 곁에서 함께 싸운다. 때가 되면 제 길로 떠난다',
    values: { [JOIN_VALUES[(i + 1) % 5]]: D },
    fx: [{ op: 'person', kind: 'crew', relation: `임시 동행 · ${epithet}`, canon: id, role: 'vanguard', level, years }, { op: 'fame', add: 8 },
         { op: 'log', text: who === 'M'
           ? `${name}과(와) 합동 작전의 임무를 나눴다. 서로의 싸움 방식을 맞춰 보며 당분간 같은 편에 서기로 했다.`
           : `${name}과(와) 함께할 항로를 정했다. 서로의 싸움 방식을 맞춰 보며 당분간 같은 편에 서기로 했다.`, weight: 'heavy' }, { op: 'timeline', text: `${name}과(와) 한동안 동행했다`, canon: id }],
  };
  const meet: Door = { label: '길은 따로 가되 소식은 주고받기로 한다', hint: '인연은 남는다', values: { peace: D }, fx: [{ op: 'person', kind: 'ally', relation: epithet, canon: id }, { op: 'log', text: `${name}과(와) 헤어질 장소를 정하고 연락할 방법을 남겼다. 다음 만남을 기약하며 각자 길을 택했다.`, weight: 'light' }] };
  const pass: Door = i % 2 === 0
    ? { label: '얽히면 일이 커진다며 물러선다', hint: '아무 일도 일어나지 않는다', values: { freedom: D }, fx: [{ op: 'log', text: `${name}의 제안에 고개를 저었다. 상대는 더 붙잡지 않았고, 두 사람은 다른 방향으로 떠났다.`, weight: 'light' }] }
    : { label: '무엇을 쫓는 사람인지만 캐묻고 헤어진다', hint: '세상 돌아가는 것이 조금 보인다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'log', text: `${name}이(가) 쫓는 목표와 그 이유를 들었다. 함께 가지는 않았지만 그 이야기는 이후의 판단에 남았다.`, weight: 'light' }] };
  return {
    id: `tmp_${id}`, kind: 'door', when: at(age(16), WHO[who], place(where), ...(GATE[id] ?? [])), weight: 5, repeat: 'once', speaker: { canon: id },
    title: `「${epithet}」 ${name}`, body, doors: [go, meet, pass],
  };
}

/** 옛 저장에 열린 tmp_crocodile 문의 글과 선택 효과를 남기되 새 게임의 추첨에서는 뺀다. */
const companions = TEMPS.map((row, i) => {
  const t = companion(row, i);
  return row[0] === 'crocodile' ? { ...t, when: at(age(999)), weight: 0 } : t;
});

// 정상결전(cn_whitebeard_war)은 주인공 19~20세에 일어난다.
const CROCODILE_PORT_WHEN: Cond[] = at(age(21), WHO.F, sea('nw_first'), fame(100),
  { c: 'flag', id: 'crocodilePortMet', has: false }, { c: 'turningSeen', id: 'tmp_crocodile', has: false });
const CROCODILE_PORT_DOORS: Door[] = [
  { label: '순찰선을 유인하고 출항로를 확보한다', hint: '크로커다일은 장부를 가져가고, 두 배는 각자의 길로 떠난다',
    values: { ambition: D }, danger: true,
    fx: [{ op: 'hp', add: -10 }, { op: 'fame', add: 8 }, { op: 'person', kind: 'ally', relation: '항구 봉쇄선을 뚫은 거래 상대', canon: 'crocodile' },
         { op: 'flag', id: 'crocodilePortMet' },
         { op: 'log', text: '{name}의 배가 순찰선을 끌어낸 사이 크로커다일이 창고에서 장부를 빼냈다. 봉쇄가 흐트러지자 두 배는 다른 수로로 출항했다.', weight: 'heavy' },
         { op: 'timeline', text: '크로커다일과 항구 봉쇄선을 뚫었다', canon: 'crocodile' }] },
  { label: '거래를 거절하고 다른 수로를 찾는다', hint: '해군의 눈을 피해 스스로 항구를 빠져나간다',
    values: { freedom: D },
    fx: [{ op: 'hp', add: -8 }, { op: 'flag', id: 'crocodilePortMet' },
         { op: 'log', text: '{name}은(는) 크로커다일의 제안을 거절하고 얕은 수로로 배를 돌렸다. 검문선의 탐조등을 피해 돌아 나오는 동안 크로커다일은 제 배에서 제 일을 처리했다.', weight: 'light' }] },
  { label: '장부의 위치를 해군에 알린다', hint: '봉쇄는 풀리지만 크로커다일과 적이 된다',
    values: { justice: D }, danger: true,
    fx: [{ op: 'hp', add: -15 }, { op: 'fame', add: 10 }, { op: 'person', kind: 'rival', relation: '장부의 행방을 알린 적', canon: 'crocodile' },
         { op: 'flag', id: 'crocodilePortMet' },
         { op: 'log', text: '{name}이(가) 장부의 위치를 해군에 흘리자 병력이 창고로 몰렸다. 빈틈이 생긴 봉쇄선을 빠져나왔지만 크로커다일은 누가 거래를 깨뜨렸는지 알아챘다.', weight: 'heavy' },
         { op: 'timeline', text: '크로커다일의 거래를 깨뜨렸다', canon: 'crocodile' }] },
];
const CROCODILE_PORT_INTRO = '정상전쟁이 끝난 뒤, 신세계의 한 항구. 해군이 압수한 화물을 창고로 옮기며 출항로를 봉쇄했다. 화물 속에는 크로커다일이 찾는 암시장 거래 장부가 있다. 배를 빼려던 {name} 앞에 갈고리 손의 사내가 시가를 물고 나타난다. 그의 배는 항구 반대편에 대기 중이다.';
const CROCODILE_PORT_OFFER = ' “네 배가 순찰선을 끌어내라. 그동안 장부는 내가 가져가지. 봉쇄가 풀리면 넌 출항하고, 난 내 배로 떠난다. 부하를 구하는 게 아니다. 서로 필요한 걸 얻자는 거지. 장부에 손댈 생각만 없다면.”';
const crocodilePort = (id: string, grades: string[], body: string, doors: Door[]): Turning => ({
  id, kind: 'door', when: at(...CROCODILE_PORT_WHEN, { c: 'grade', is: grades }), needs: ['ship'],
  weight: 5, repeat: 'once', speaker: { canon: 'crocodile' }, title: '「모래의 사내」 크로커다일', body, doors,
});
const CROCODILE_PORT: Turning[] = [
  crocodilePort('crocodile_port_dismissed', ['F', 'E', 'D', 'C'],
    `${CROCODILE_PORT_INTRO} 크로커다일은 {name}을(를) 훑어보더니 시선을 거둔다. “꺼져라, 떨거지. 네 힘으론 순찰선 하나도 못 묶어 둬.” 그는 더 말하지 않고 자기 배로 돌아간다.`, [
      { label: '말없이 물러난다', hint: '크로커다일은 거래를 제안하지 않는다', values: { freedom: D },
        fx: [{ op: 'flag', id: 'crocodilePortMet' }, { op: 'log', text: '크로커다일은 {name}에게 거래를 제안하지 않았다. 봉쇄선 앞에서 두 사람의 길이 갈렸다.', weight: 'light' }] },
    ]),
  crocodilePort('crocodile_port_b', ['B'],
    `${CROCODILE_PORT_INTRO} 크로커다일이 {name}을(를) 재고는 코웃음 친다. “제법 쓸 만하군. 어디까지나 내 아래지만.”${CROCODILE_PORT_OFFER}`, CROCODILE_PORT_DOORS),
  crocodilePort('crocodile_port_a', ['A', 'S', 'SS', 'SSS'],
    `${CROCODILE_PORT_INTRO} 크로커다일이 {name}을(를) 오래 바라본다. “여기서 맞붙으면 나도 번거로워지겠군.”${CROCODILE_PORT_OFFER}`, CROCODILE_PORT_DOORS),
];

export const RECRUIT_TURNINGS: Turning[] = [...RECRUITS.map(recruit), ...companions, ...CROCODILE_PORT];
