// v6.7 가족 서사 더하기 (통합 기획 6.2 · 6.4): 조부모 손에 자란 아이, 바다에서 돌아오지 않은 부모와의 재회, 아무 인연 없이 자란 아이.
// 조부모가 있으면 스승 대신 조부모의 이야기가 오고(bonds.ts men_meet), 아무 인연이 없으면 맞수도 스승도 오지 않는다.
// 어느 고향에서나 열리도록 바닷가 · 해군의 낱말은 재회(바다에 나간 뒤)에만 쓴다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { kid } from './childhood';
import { ACTIVE, GROWN, age, at, st } from './paths';
import type { Cond, Fx, Turning } from '../../core/types';

const D = V.value.door;
const has = (id: string): Cond => ({ c: 'flag', id, has: true });
const not = (id: string): Cond => ({ c: 'flag', id, has: false });
const flag = (id: string): Fx => ({ op: 'flag', id });
const heavy = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const line = (text: string): Fx => ({ op: 'timeline', text });
const livingGrand: Cond = { c: 'anyOf', conditions: [
  { c: 'person', relation: '할머니', has: true }, { c: 'person', relation: '할아버지', has: true },
] };
const goneGrand: Fx[] = [{ op: 'losePerson', relation: '할머니' }, { op: 'losePerson', relation: '할아버지' }, flag('grandGone')];

// ================================================================ 조부모
const GRANDPARENTS: Turning[] = [
  {
    id: 'grand_tale', kind: 'door', when: [...kid(5, 10), has('grandGuard'), livingGrand], weight: 12, repeat: 'once', speaker: 'hero',
    title: '아궁이 앞의 옛이야기', body: '아궁이 불이 사위어 간다. 주름진 손이 {name}의 머리를 쓸어 넘긴다. 부모가 떠나던 날 아침 이야기를 꺼내다가 한동안 불만 바라본다.',
    doors: [
      { label: '부모가 그날 어디로 떠났는지 묻는다', hint: '장작을 한 토막 더 넣고 대답을 기다린다', values: { inquiry: D },
        fx: [flag('grandTold'), heavy('부모는 먼 곳으로 떠났다고 했다. 왜 떠났는지는 조금 더 자라면 알려 주겠다고 했다.'), line('보호자에게 부모의 이야기를 들었다')] },
      { label: '무릎을 베고 이야기를 들으며 잠든다', hint: '이야기보다 무릎의 온기가 오래 남는다', values: { peace: D },
        fx: [{ op: 'hp', add: 5 }, flag('grandLap'), heavy('잠결에 들리는 이야기는 끝을 알 수 없었다. 아침이 오자 무릎을 내어 준 사람의 손이 아직 머리 위에 있었다.')] },
      { label: '언젠가 부모를 찾아내겠다고 말한다', hint: '주름진 손이 잠깐 멈춘다', values: { romance: D },
        fx: [flag('seekParents'), heavy('보호자는 한동안 아궁이만 바라보다가, 찾게 되면 꼭 소식을 전하라고 말했다.'), line('언젠가 부모를 찾겠다고 다짐했다')] },
    ],
  },
  {
    id: 'grand_hands', kind: 'door', when: [...kid(9, 14), has('grandGuard'), livingGrand, not('grandGone')], weight: 10, repeat: 'once', speaker: 'hero',
    title: '거친 손', body: '새벽마다 먼저 일어나 일을 나가던 손이 요즘은 자주 떨린다. 오늘은 짐을 들다 주저앉았다. 괜찮다고, 늙으면 다 이렇다고 웃는다.',
    doors: [
      { label: '그날부터 짐을 대신 지고 나간다', hint: '어깨가 아프다. 그래도 그 손을 쉬게 할 수 있다', values: { loyalty: D },
        fx: [{ op: 'base', key: 'vit', add: 1 }, flag('grandCarry'), heavy('처음 며칠은 어깨에 멍이 들었다. 보호자는 빈손으로 앞서 걷다가 자꾸만 뒤를 돌아보았다.')] },
      { label: '돈을 벌어 오겠다고 일거리를 찾아 나선다', hint: '어린 손으로 할 수 있는 일은 많지 않다', values: { greed: D },
        fx: [{ op: 'money', add: 300 }, { op: 'hp', add: -5 }, heavy('온종일 잔심부름을 하고 동전 몇 닢을 받아 왔다. 보호자는 돈보다 갈라진 손바닥을 먼저 들여다보았다.')] },
      { label: '저 손이 다 낡기 전에 꼭 크게 되겠다고 다짐한다', hint: '그날 밤 오래 잠들지 못한다', values: { ambition: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('잠든 보호자의 손을 가만히 덮었다. 낮에 들지 못한 짐이 눈앞에 남아, 다음 날부터 할 일을 마음속으로 세었다.')] },
    ],
  },
  {
    id: 'grand_farewell', kind: 'door', when: [...kid(15, 17), has('grandGuard'), livingGrand, not('grandGone')], weight: 14, repeat: 'once', speaker: 'hero',
    title: '떠나는 날', body: '떠나는 날 아침, 보호자는 아무 말도 하지 않는다. 대신 낡은 보따리 하나를 내민다. 손때 묻은 부적 하나와 마른 주먹밥이 들어 있다. 문간에 선 등이 그새 많이 작아졌다.',
    doors: [
      { label: '부적을 목에 걸고 꼭 돌아오겠다고 말한다', hint: '평생 그 부적을 풀지 않는다', values: { loyalty: D },
        fx: [flag('grandKeepsake'), heavy('부적의 매듭을 묶어 주던 손이 오래 목덜미에 머물렀다. 보호자는 대답 대신 보따리 끈을 한 번 더 조여 주었다.'), line('보호자의 부적을 목에 걸고 길을 떠났다')] },
      { label: '한 해만 더 곁에 있겠다고 보따리를 내려놓는다', hint: '보호자는 화를 내다가 결국 웃는다', values: { peace: D },
        fx: [{ op: 'hp', add: 10 }, flag('grandStayed'), heavy('보따리는 문간에 그대로 놓였다. 둘은 그날 주먹밥을 나눠 먹었고, 보호자는 빈자리를 감추려 더 바쁘게 굴었다.')] },
      { label: '돌아보면 못 갈 것 같아 돌아보지 않고 걷는다', hint: '등 뒤에서 이름을 부르는 소리가 들린 것 같다', values: { freedom: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('끝내 돌아보지 않았다. 마을 어귀를 지날 때까지 등이 뜨거웠다.')] },
    ],
  },
  {
    id: 'grand_letter', kind: 'door', when: at(age(18, 40), st(...ACTIVE), has('grandGuard'), livingGrand, not('grandGone'), not('parentFound'), not('parentRefused')), weight: 8, repeat: 'once', speaker: 'hero',
    title: '마지막 편지', body: '고향에서 편지가 왔다. 보호자가 세상을 떠났다는 소식이다. 편지 끝에는 떨리는 글씨로 쓴 몇 줄이 덧붙어 있다. 부모가 바다 어딘가에 살아 있을지도 모른다는 내용이다. 마지막 줄에는 이 소식을 뒤늦게 전한 미안함이 담겨 있다.',
    doors: [
      { label: '하던 일을 모두 내려놓고 고향의 무덤을 찾아간다', hint: '무덤 앞에서 처음으로 소리 내어 운다', values: { loyalty: D },
        fx: [...goneGrand, { op: 'hp', add: -5 }, flag('parentsLost'), heavy('무덤 앞 흙은 이미 굳어 있었다. 편지를 펼쳐 놓고 늦게 와서 미안하다고 말하자, 참아 두었던 울음이 터졌다.'), line('보호자의 무덤 앞에서 울었다')] },
      { label: '편지를 품고 부모를 찾아 나서겠다고 다짐한다', hint: '바다가 조금 다르게 보인다', values: { inquiry: D },
        fx: [...goneGrand, flag('parentsLost'), flag('seekParents'), heavy('편지의 떨리는 글씨를 몇 번이고 읽었다. 보호자의 마지막 부탁처럼, 부모가 남겼을 흔적을 찾아 항구마다 묻기 시작했다.'), line('살아 있을지 모를 부모를 찾아 나섰다')] },
      { label: '편지를 접어 넣고 묵묵히 하던 길을 간다', hint: '보호자도 그걸 바랐을 거라고 믿는다', values: { ambition: D },
        fx: [...goneGrand, flag('parentsLost'), { op: 'base', key: 'wil', add: 1 }, heavy('편지를 품 안 깊숙이 넣었다. 걸음을 멈추지는 않았지만, 그날 밤에는 편지의 마지막 줄을 자꾸 다시 읽었다.')] },
    ],
  },
  {
    id: 'grand_echo', kind: 'door', when: at(age(50, 85), st(...GROWN), has('grandKeepsake')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '아궁이 앞에서', body: '{name}은(는) 어느새 그날의 보호자만큼 늙었다. 동네 아이 하나가 무릎 곁에 쪼그려 앉아 옛날이야기를 조른다. 목에 건 낡은 부적이 불빛에 흔들린다.',
    doors: [
      { label: '그날 들었던 이야기를 그대로 들려준다', hint: '말끝이 흐려지는 곳까지 똑같다', when: [has('grandTold')], values: { peace: D },
        fx: [heavy('아이는 이야기 속 꼬마가 어떻게 됐는지 물었다. 그 꼬마가 바로 {name}이란 걸 알고는 이야기를 처음부터 다시 들려 달라고 졸랐다.'), line('보호자에게 들은 이야기를 아이에게 들려주었다')] },
      { label: '부적을 풀어 아이의 목에 걸어 준다', hint: '목이 조금 허전하다. 마음은 가볍다', values: { loyalty: D },
        fx: [flag('grandPassed'), heavy('아이는 부적을 두 손으로 감싸 쥐고 왜 자신에게 주느냐고 물었다. {name}은(는) 오래전 같은 부적을 건네던 손을 떠올리며 매듭을 고쳐 주었다.'), line('평생 걸었던 부적을 아이에게 건넸다')] },
    ],
  },
];

// ================================================================ 행방불명된 부모
const LOST: Turning[] = [
  {
    id: 'par_lost', kind: 'door', when: [...kid(6, 12), { c: 'wealth', max: 'common' }], needs: ['parent'], weight: 1, repeat: 'once', speaker: 'hero',
    title: '돌아오지 않는 배', body: '{parent}이(가) 탄 배가 약속한 날이 지나도 돌아오지 않는다. 사흘이 지나고 열흘이 지난다. 어른들이 목소리를 낮춰 이야기한다. {name}은(는) 언덕에서 먼 곳을 본다.',
    doors: [
      { label: '돌아올 거라고 믿고 매일 언덕에 오른다', hint: '언덕 위의 바람이 익숙해진다', values: { loyalty: D },
        fx: [{ op: 'parentMissing' }, flag('lostWaited'), heavy('날이 어두워져도 배 그림자는 보이지 않았다. 집에서 부르는 소리가 들릴 때까지 언덕에 남는 날이 늘었다.'), line('부모가 탄 배가 돌아오지 않았다')] },
      { label: '집을 지키려고 일을 시작한다', hint: '어린 나이에 손이 거칠어진다', values: { peace: D },
        fx: [{ op: 'parentMissing' }, { op: 'money', add: 200 }, { op: 'base', key: 'vit', add: 1 }, heavy('남의 집 일을 거들고 받은 동전을 식탁 위에 올려놓았다. 내일 쓸 만큼만 덜어 내고 나머지는 천에 싸서 두었다.'), line('부모가 탄 배가 돌아오지 않았다')] },
      { label: '크면 직접 찾으러 가겠다고 다짐한다', hint: '그날부터 먼 곳의 지도를 모은다', values: { romance: D },
        fx: [{ op: 'parentMissing' }, flag('seekParents'), heavy('배가 다녔다는 항로를 종이마다 베껴 두었다. 모르는 바다 이름이 쌓여도, 찾아볼 곳이 하나씩 생겼다.'), line('부모가 탄 배가 돌아오지 않았다')] },
    ],
  },
  {
    id: 'par_reunion', kind: 'door', when: at(age(20, 55), st('pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp', 'shipwright'), has('parentsLost'), not('parentFound'), not('parentRefused')), weight: 4, repeat: 'once', speaker: 'hero',
    title: '낯선 곳의 노인', body: '{island}에서 이름을 대자, 길가에 앉아 있던 늙은 뱃사람이 손에 든 보따리를 떨어뜨린다. 한참을 {name}의 얼굴만 본다. 그리고 떨리는 목소리로 묻는다. 혹시, {town}에서 왔느냐고.',
    doors: [
      { label: '다가가 그 손을 붙잡는다', hint: '오래 비어 있던 자리가 채워진다', values: { loyalty: D },
        fx: [{ op: 'parentFound' }, { op: 'base', key: 'wil', add: 1 }, heavy('거칠고 주름진 손이었다. 그런데도 어딘가 익숙했다. 둘은 밤새 말없이 앉아 있었다.'), line('바다에서 잃었던 부모를 다시 만났다')] },
      { label: '왜 돌아오지 않았는지부터 묻는다', hint: '긴 이야기가 시작된다. 대답이 다 마음에 들지는 않는다', values: { justice: D },
        fx: [{ op: 'parentFound' }, heavy('폭풍, 노예선, 기억을 잃은 세월. 이유는 많았다. 다 듣고 나서도 화가 다 풀리지는 않았다. 그래도 자리를 뜨지는 않았다.'), line('바다에서 잃었던 부모를 다시 만났다')] },
      { label: '사람을 잘못 보셨다며 돌아선다', hint: '문을 나서는 등에 오래 시선이 머문다', values: { freedom: D },
        fx: [flag('parentRefused'), heavy('돌아서서 걸었다. 뒤에서 잔이 깨지는 소리가 났다. 돌아보지 않았다.'), line('부모일지 모를 사람에게서 돌아섰다')] },
    ],
  },
  {
    id: 'par_reunion_echo', kind: 'door', when: at(age(30, 80), st(...GROWN), has('parentFound'), { c: 'person', relation: '다시 만난 부모', has: true }), needs: ['parent'], weight: 8, repeat: 'once', speaker: 'hero',
    title: '함께 보는 수평선', body: '다시 만난 {person:다시 만난 부모}와(과) 언덕에 나란히 앉아 수평선을 본다. 먼저 입을 연 것은 부모 쪽이었다. 떨어져 있던 동안 어떻게 지냈느냐고 묻는다.',
    doors: [
      { label: '매일 기다렸다고 처음으로 말한다', hint: '부모의 어깨가 떨린다', when: [has('lostWaited')], values: { romance: D },
        fx: [heavy('매일 기다렸다고 했다. 부모는 아무 말 없이 {name}의 손을 잡았다. 한참이 지나도 손을 놓지 않았다.')] },
      { label: '이제는 기다리지 않아도 된다고만 말한다', hint: '그걸로 충분하다', values: { peace: D },
        fx: [{ op: 'hp', add: 10 }, heavy('부모는 한참 수평선을 보다가 {name}의 어깨에 기대었다. 두 사람은 해가 질 때까지 그 자리에 나란히 있었다.')] },
    ],
  },
];

// ================================================================ 아무 인연 없이 자란 아이 (드물다, 일찍 끝난다)
const LONELY: Turning[] = [
  {
    id: 'lonely_rain', kind: 'door', when: [...kid(8, 14), has('lonely')], weight: 14, repeat: 'once', speaker: 'hero',
    title: '아무도 부르지 않는 이름', body: '비가 오는 날이면 {name}은(는) 남의 집 처마 밑에서 밤을 보낸다. 창 너머로 저녁상에 둘러앉은 사람들이 보인다. 아무도 {name}의 이름을 부르지 않는다. 이름이 있다는 것을 잊을 것 같은 밤이다.',
    doors: [
      { label: '아무도 필요 없다고 스스로에게 말한다', hint: '마음이 단단해진다. 그만큼 차가워진다', values: { dominion: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('혼자서도 살 수 있다고 몇 번이고 되뇌었다. 그 말은 점점 진짜가 되어 갔다.')] },
      { label: '언젠가 저 창 안에 앉겠다고 생각한다', hint: '그 생각 하나로 겨울을 넘긴다', values: { romance: D },
        fx: [{ op: 'hp', add: 5 }, heavy('창 안의 웃음소리를 들으며 저 자리에 둘 의자를 상상했다. 빗줄기가 잦아든 뒤에도 그 생각 덕에 몸을 일으킬 수 있었다.')] },
      { label: '남의 부엌에서 먹을 것을 훔친다', hint: '배는 부르다. 아무도 쫓아오지 않는다는 게 더 서럽다', values: { greed: D },
        fx: [{ op: 'money', add: 50 }, heavy('찬 부엌에서 빵과 동전 몇 닢을 쥐고 나왔다. 뒤따르는 발소리가 없어 처마 밑에서 한참 서 있다가 혼자 빵을 베어 물었다.')] },
    ],
  },
];

export const KIN_TURNINGS: Turning[] = [...GRANDPARENTS, ...LOST, ...LONELY];
