// 원작 인물을 배(분대)에 태우는 전환점. data/recruits.ts의 한 줄이 전환점 하나가 된다 (rec_<id>).
// 그 인물이 있는 섬에 닿아야 열린다 (항해: core/year.ts의 voyage). 태우는 문은 제 배가 있어야(해군은 분대장이어야) 열리고,
// 배가 없어도 인연은 맺을 수 있다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { CANON } from '../canon';
import { RECRUITS, TEMPS, type RecruitRow, type TempRow } from '../recruits';
import { SQUAD } from './marine';
import { age, at, sea, st } from './paths';
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
  mihawk: 30, kuzan: 29, yamato: 24, killer: 16, xdrake: 16, ulti: 15, ashura: 15, karasu: 15, lindbergh: 15, morley: 15, betty: 15,
  dorry: 14, brogy: 14, kawamatsu: 14, kikunojo: 14, chinjao: 14, pageone: 14, hyogoro: 12, raizo: 12, pedro: 12, sentomaru: 12,
  daz: 10, kaku: 10, orlumbus: 10, jabra: 9, senorpink: 9, kalifa: 8, blueno: 8, perona: 8, wiper: 8, bellamy: 8, hina: 8,
};
/** 아무나 태울 수 없는 사람: 이름값이 있어야 말을 붙일 수 있고, 쿠잔은 해군을 떠난 뒤(원작 두 해 뒤)에만 만난다 */
const GATE: Record<string, Cond[]> = {
  mihawk: [fame(300), { c: 'tier', branch: 'any', min: 4 }], kuzan: [fame(150), { c: 'canonAge', id: 'kuzan', min: 49 }],
  yamato: [fame(100)], killer: [fame(60)],
  zoro: [{ c: 'age', min: 16, max: 17 }], vivi: [{ c: 'age', min: 17, max: 19 }], ace: [{ c: 'age', min: 16, max: 19 }],
  law: [fame(60)], crocodile: [fame(100)], marco: [fame(100)], kid: [fame(100)], sabo: [fame(40)],
};
const JOIN_VALUES = ['loyalty', 'romance', 'ambition', 'dominion', 'freedom'] as const;

function recruit(row: RecruitRow, i: number): Turning {
  const [id, name, , , faction, , island, role, who, epithet, body] = row;
  const squad = who === 'M';
  const join: Door = squad
    ? { label: '분대로 데려온다', hint: '분대에 사람이 하나 는다. 이름난 사람은 다루기도 그만큼 어렵다', when: [OFFICER], values: { [JOIN_VALUES[i % 5]]: D },
        fx: [{ op: 'person', kind: 'crew', relation: `${SQUAD} · ${epithet}`, canon: id, role, ...(LEVEL[id] ? { level: LEVEL[id] } : {}) },
             { op: 'log', text: `${name}이(가) 분대에 들어왔다.`, weight: 'heavy' }, { op: 'timeline', text: `${name}을(를) 분대로 데려왔다`, canon: id }] }
    : { label: '같이 가자고 손을 내민다', hint: '배에 식구가 하나 는다. 이름난 사람을 태우면 쫓는 눈도 는다', needs: ['ship'], values: { [JOIN_VALUES[i % 5]]: D },
        fx: [{ op: 'person', kind: 'crew', relation: epithet, canon: id, role, ...(LEVEL[id] ? { level: LEVEL[id] } : {}) }, { op: 'fame', add: 5 },
             { op: 'log', text: `${name}이(가) 배에 올랐다.`, weight: 'heavy' }, { op: 'timeline', text: `${name}을(를) 배에 태웠다`, canon: id }] };
  const meet: Door[] = [
    { label: '술 한잔을 나누고 이름만 주고받는다', hint: '인연은 남는다', values: { romance: D }, fx: [{ op: 'person', kind: 'ally', relation: epithet, canon: id }] },
    { label: '사정을 끝까지 들어 준다', hint: '다시 만나면 알아볼 사이가 된다', values: { inquiry: D }, fx: [{ op: 'person', kind: 'ally', relation: epithet, canon: id }, { op: 'base', key: 'int', add: 1 }] },
    { label: '가진 것을 조금 나눠 주고 헤어진다', hint: '빚을 진 쪽은 잊지 않는다', values: { peace: D }, fx: [{ op: 'money', add: -2000 }, { op: 'person', kind: 'ally', relation: epithet, canon: id }] },
    { label: '한판 붙어 누가 위인지 가린다', hint: '멍이 든다. 서로 얼굴은 잊지 않는다', values: { dominion: D }, fx: [{ op: 'hp', add: -8 }, { op: 'person', kind: 'rival', relation: epithet, canon: id }] },
  ];
  const pass: Door[] = [
    { label: '갈 길이 다르다며 지나친다', hint: '아무 일도 일어나지 않는다', values: { freedom: D }, fx: [] },
    { label: '억울한 사정이 있는지만 묻고 지나친다', hint: '대답은 듣지 못한다', values: { justice: D }, fx: [] },
    { label: '솜씨만 눈여겨보고 떠난다', hint: '본 것은 남는다', values: { ambition: D }, fx: [{ op: 'base', key: 'wil', add: 1 }] },
    { label: '목에 걸린 값이 있는지 수배서부터 뒤져 본다', hint: '쓸 만한 값이면 초소에 귀띔한다. 주머니가 조금 찬다', values: { greed: D }, fx: [{ op: 'money', add: 12000 }] },
  ];
  const p = i % 4 === 3 && faction !== 'pirate' ? 1 : i % 4;
  return {
    id: `rec_${id}`, kind: 'door', when: at(age(16), WHO[who], place(island), ...(GATE[id] ?? [])), weight: 3, repeat: 'once', speaker: { canon: id },
    title: `「${epithet}」 ${name}`, body, doors: [join, meet[(i + 1) % 4], pass[p]],
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
         { op: 'log', text: `${name}과(와) 한동안 같은 길을 가기로 했다.`, weight: 'heavy' }, { op: 'timeline', text: `${name}과(와) 한동안 동행했다`, canon: id }],
  };
  const meet: Door = { label: '길은 따로 가되 소식은 주고받기로 한다', hint: '인연은 남는다', values: { peace: D }, fx: [{ op: 'person', kind: 'ally', relation: epithet, canon: id }] };
  const pass: Door = i % 2 === 0
    ? { label: '얽히면 일이 커진다며 물러선다', hint: '아무 일도 일어나지 않는다', values: { freedom: D }, fx: [] }
    : { label: '무엇을 쫓는 사람인지만 캐묻고 헤어진다', hint: '세상 돌아가는 것이 조금 보인다', values: { inquiry: D }, fx: [{ op: 'base', key: 'int', add: 1 }] };
  return {
    id: `tmp_${id}`, kind: 'door', when: at(age(16), WHO[who], place(where), ...(GATE[id] ?? [])), weight: 5, repeat: 'once', speaker: { canon: id },
    title: `「${epithet}」 ${name}`, body, doors: [go, meet, pass],
  };
}

export const RECRUIT_TURNINGS: Turning[] = [...RECRUITS.map(recruit), ...TEMPS.map(companion)];
