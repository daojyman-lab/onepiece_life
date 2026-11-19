// 함께 자라는 사람의 이야기 (형제 · 부모 · 스승). 한 인생에 한 갈래를 깊게 다룬다.
//  - 형제가 있으면: 형제와 나누고 겨루는 이야기 (어릴 적 맞수 kid_rival은 오지 않는다)
//  - 부모가 있으면: 부모의 이야기. 부모가 없는 아이에게만 스승이 온다 (스승은 끝내 아이를 대신해 막아선다)
// 어릴 적의 고른 문이 표시로 남고, 어른이 된 뒤 같은 장면이 뒤집혀 돌아온다 (수미상관: *_echo_*).
// 어느 고향에서나 열리도록 바닷가 · 해군의 낱말을 쓰지 않는다. 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
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
const NO_PARENT: Cond = { c: 'kin', who: 'parent', has: false };
const active = st(...ACTIVE), grown = st(...GROWN);
const MENTOR = '스승';

// ================================================================ 형제
const SIBLING: Turning[] = [
  {
    id: 'sib_bread', kind: 'door', when: kid(4, 9), needs: ['sibling'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '하나 남은 빵', body: '저녁상에 빵이 하나뿐이다. 형제와 {name}의 손이 동시에 나갔다가 멈춘다. 둘 다 배에서 소리가 난다.',
    doors: [
      { label: '반으로 갈라 큰 쪽을 내민다', hint: '배는 덜 찬다. 형제는 그 저녁을 오래 기억한다', values: { loyalty: D }, mark: 'fellowship',
        fx: [flag('sibBread'), heavy('형제는 큰 쪽을 받아 들고 한참 {name}을(를) 보다가, 아무 말 없이 먹었다.')] },
      { label: '자로 잰 듯 똑같이 가르자고 한다', hint: '부스러기 하나까지 센다. 둘 다 불만은 없다', values: { justice: D },
        fx: [{ op: 'base', key: 'int', add: 1 }] },
      { label: '형제가 한눈파는 사이 통째로 입에 넣는다', hint: '배는 부르다. 형제는 며칠 동안 말을 걸지 않는다', values: { greed: D },
        fx: [{ op: 'hp', add: 5 }, flag('sibGrudge')] },
    ],
  },
  {
    id: 'sib_hill', kind: 'door', when: kid(7, 13), needs: ['sibling'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '언덕 위의 나무', body: '마을 뒤 언덕 꼭대기의 늙은 나무까지, 형제와 {name}은(는) 해마다 누가 먼저 닿는지 겨룬다. 올해는 중턱에서 형제가 돌부리에 걸려 넘어졌다.',
    doors: [
      { label: '뒤돌아보지 않고 나무를 먼저 짚는다', hint: '올해의 승자가 된다. 형제는 무릎을 털며 내년을 벼른다', values: { ambition: D }, mark: 'obsession',
        fx: [flag('sibHill'), flag('sibWon'), { op: 'base', key: 'spd', add: 1 }] },
      { label: '돌아가 형제를 업고 꼭대기까지 오른다', hint: '시합은 없던 일이 된다. 등이 며칠 뻐근하다', values: { loyalty: D }, mark: 'fellowship',
        fx: [flag('sibHill'), flag('sibCarried'), { op: 'base', key: 'vit', add: 1 }, heavy('형제를 업고 나무 아래까지 올랐다. 등에 업힌 형제는 다음번엔 자기가 업어 주겠다고 약속했다.')] },
      { label: '일으켜 세우고 그 자리에서 다시 겨룬다', hint: '봐주지 않는 시합이 된다. 누가 이기든 둘 다 숨이 턱에 닿는다', values: { justice: D },
        fx: [flag('sibHill'), { op: 'chance', p: 0.5, then: [{ op: 'base', key: 'spd', add: 1 }], else: [{ op: 'log', text: '한 걸음 차이로 졌다. 형제가 나무를 짚고 돌아보며 웃었다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'sib_jar', kind: 'door', when: kid(8, 14), needs: ['sibling'], weight: 8, repeat: 'once', speaker: 'hero',
    title: '깨진 항아리', body: '둘이 장난을 치다 집안 어른이 아끼던 항아리가 깨졌다. 발소리가 다가온다. 형제의 얼굴이 하얗게 질린다.',
    doors: [
      { label: '내가 깼다고 먼저 나선다', hint: '종아리가 붓도록 혼난다. 형제는 그 빚을 잊지 않는다', values: { loyalty: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -6 }, flag('sibCovered')] },
      { label: '형제의 손을 잡아끌고 뒷문으로 달아난다', hint: '해 질 때까지 둘이 숨어 지낸다. 저녁에는 곱절로 혼난다', values: { freedom: D }, mark: 'daring',
        fx: [{ op: 'hp', add: -4 }, heavy('헛간 지붕 위에 나란히 엎드려 해가 지기를 기다렸다. 둘 다 웃음을 참느라 혼났다.')] },
      { label: '형제가 깼다고 손가락으로 가리킨다', hint: '{name}은(는) 저녁을 먹는다. 형제는 굶는다', values: { greed: D },
        fx: [flag('sibGrudge')] },
    ],
  },
  {
    id: 'sib_roof', kind: 'door', when: kid(12, 15), needs: ['sibling'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '지붕 위의 약속', body: '잠이 오지 않는 밤, 형제와 지붕에 나란히 누웠다. 형제가 묻는다. 어른이 되면 무엇이 될 거냐고. 그리고 그때에도 우리는 지금 같을 거냐고.',
    doors: [
      { label: '누가 먼저 이름을 떨치는지 겨루자고 한다', hint: '평생 가는 내기가 된다', values: { ambition: D },
        fx: [flag('sibBet'), line('형제와 누가 먼저 이름을 떨치는지 내기했다')] },
      { label: '어디에 있든 언젠가 이 지붕에서 다시 만나자고 한다', hint: '지키기 어려운 약속이다. 그래도 한다', values: { romance: D },
        fx: [flag('sibRoof'), line('형제와 지붕 위에서 다시 만나기로 약속했다')] },
      { label: '세상이 어떻게 생겼는지 먼저 보고 와서 알려 주겠다고 한다', hint: '형제는 웃으며, 꼭 편지하라고 한다', values: { inquiry: D },
        fx: [flag('sibLetter')] },
    ],
  },
  {
    id: 'sib_news', kind: 'door', when: at(age(20, 45), active), needs: ['sibling'], weight: 6, repeat: 'once', speaker: 'hero',
    title: '형제의 소식', body: '{island}에 닿은 소식지 귀퉁이에 낯익은 이름이 있다. 형제가 제 자리에서 이름을 얻었다고 한다. {name}은(는) 그 줄을 몇 번이고 다시 읽는다.',
    doors: [
      { label: '질 수 없다며 소식지를 접어 품에 넣는다', hint: '그날부터 잠을 줄인다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'hardship', add: 1 }] },
      { label: '잘했다고 짧은 편지를 부친다', hint: '답장은 계절이 바뀐 뒤에야 온다', values: { peace: D },
        fx: [{ op: 'money', add: -1000 }, heavy('계절이 바뀌고 한 줄짜리 답장이 왔다. 형제도 {name}이(가) 잘 지낸다는 소식을 듣고 있었다.')] },
      { label: '형제의 이름을 대고 외상을 긋는다', hint: '술값과 밥값이 굳는다. 형제의 귀에 들어갈지도 모른다', values: { greed: D },
        fx: [{ op: 'money', add: 12000 }, { op: 'chance', p: 0.4, then: [flag('sibGrudge'), { op: 'log', text: '외상 장부가 형제에게까지 갔다는 소문이 들렸다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'sib_back', kind: 'door', when: at(age(22, 50), active), needs: ['sibling'], weight: 6, repeat: 'once', speaker: 'hero',
    title: '등 뒤의 목소리', body: '{island}의 뒷골목에서 건달 여럿에게 둘러싸였다. 그때 낯익은 목소리가 들린다. 볼일이 있어 이 섬에 와 있던 형제다. 형제가 말없이 {name}의 등 뒤에 선다.',
    doors: [
      { label: '어릴 적처럼 등을 맞대고 싸운다', hint: '둘 다 멍투성이가 된다. 골목에는 둘만 서 있게 된다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -12 }, { op: 'mastery', branch: 'fist', add: 10 }, { op: 'fame', add: 5 }, flag('sibBackToBack'),
             heavy('마지막 건달이 달아났다. 형제는 터진 입술로 웃으며 {name}의 주먹이 어릴 때보다 느려졌다고 놀렸다.')] },
      { label: '형제의 손목을 잡고 골목을 내달린다', hint: '깨진 항아리를 두고 달아나던 날처럼 뛴다', values: { freedom: D },
        fx: [{ op: 'base', key: 'spd', add: 1 }] },
      { label: '건달 두목이 무엇을 바라는지부터 캐묻는다', hint: '주먹 대신 돈이 나간다', values: { inquiry: D },
        fx: [{ op: 'money', add: -5000 }] },
    ],
  },
  // ---- 수미상관
  {
    id: 'sib_echo_bread', kind: 'door', when: at(age(38, 75), grown, has('sibBread')), needs: ['sibling'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '하나 남은 빵, 다시', body: '오랜만에 형제와 마주 앉았다. 상에 빵이 하나 남았다. 형제가 그것을 반으로 가르더니, 큰 쪽을 {name} 앞으로 민다. 어릴 적 저녁상에서 {name}이(가) 그랬던 것처럼.',
    doors: [
      { label: '웃으며 큰 쪽을 받는다', hint: '돌려받는 데 오래 걸린 저녁이다', values: { peace: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('형제가 말했다. 그날 그 빵이, 평생 먹은 것 가운데 가장 맛있었다고.'), line('형제와 빵 하나를 나눠 먹었다')] },
      { label: '받은 것을 다시 반으로 갈라 돌려준다', hint: '빵은 자꾸 작아지고 둘은 자꾸 웃는다', values: { romance: D },
        fx: [heavy('빵은 부스러기가 될 때까지 상 위를 오갔다. 둘 다 배가 아프도록 웃었다.'), line('형제와 빵 하나를 나눠 먹었다')] },
      { label: '그 저녁을 어떻게 여태 기억하느냐고 묻는다', hint: '형제의 이야기는 밤새 이어진다', values: { inquiry: D },
        fx: [heavy('형제는 그날 {name}이(가) 입었던 옷의 기운 자리까지 기억하고 있었다.'), line('형제와 빵 하나를 나눠 먹었다')] },
    ],
  },
  {
    id: 'sib_echo_hill', kind: 'door', when: at(age(42, 75), grown, has('sibHill')), needs: ['sibling'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '언덕 위의 나무, 다시', body: '형제에게서 편지가 왔다. 고향 언덕의 늙은 나무가 올겨울을 넘기기 어렵겠다고 한다. 그러니 마지막으로 한 번만 더 겨루자고.',
    doors: [
      { label: '돌아가서 숨이 턱에 닿도록 달린다', hint: '무릎이 예전 같지 않다. 형제의 무릎도 그렇다', values: { ambition: D },
        fx: [{ op: 'moveHome' }, { op: 'hp', add: -5 }, heavy('둘 다 중턱에서 주저앉아 웃었다. 나무는 끝내 아무도 먼저 짚지 못했다.'), line('형제와 고향 언덕을 마지막으로 달렸다')] },
      { label: '돌아가서 이번에는 나란히 걸어 오른다', hint: '이기는 사람도 지는 사람도 없다', values: { romance: D },
        fx: [{ op: 'moveHome' }, heavy('나무 아래에서 형제는 넘어졌던 그해에 {name}이(가) 돌아봐 주기를 기다렸다고 털어놓았다.'), line('형제와 고향 언덕을 나란히 올랐다')] },
      { label: '갈 수 없다고 답장을 쓴다', hint: '나무는 기다려 주지 않는다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 2 }, heavy('이듬해 봄, 형제가 나무껍질 한 조각을 편지에 넣어 보냈다.')] },
    ],
  },
];

// ================================================================ 부모
const PARENT: Turning[] = [
  {
    id: 'par_shoulders', kind: 'door', when: kid(3, 7), needs: ['parent'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '목말', body: '마을 잔칫날, 어른들 어깨 너머로는 아무것도 보이지 않는다. 부모가 말없이 {name}을(를) 번쩍 들어 목말을 태운다. 세상이 갑자기 넓어진다.',
    doors: [
      { label: '저 멀리 끝에는 무엇이 있느냐고 묻는다', hint: '부모는 저도 가 보지 못했다고 한다', values: { inquiry: D },
        fx: [flag('parShoulders')] },
      { label: '크면 내가 이렇게 태워 주겠다고 한다', hint: '부모가 크게 웃는다. 아이의 말이라고 여긴다', values: { loyalty: D },
        fx: [flag('parShoulders'), flag('parVow'), heavy('부모는 웃으며 말했다. 그래, 그날을 기다리마.')] },
      { label: '더 높이, 더 높이 올려 달라고 조른다', hint: '부모의 팔이 떨릴 때까지 내려오지 않는다', values: { ambition: D },
        fx: [flag('parShoulders')] },
    ],
  },
  {
    id: 'par_hands', kind: 'door', when: kid(6, 11), needs: ['parent'], weight: 8, repeat: 'once', speaker: 'hero',
    title: '부모의 손', body: '부모가 일하는 것을 하루 종일 지켜보았다. 굳은살 박인 손이 쉬지 않는다. 저녁에 부모가 그 손으로 {name}의 머리를 쓰다듬는다. 손바닥이 거칠다.',
    doors: [
      { label: '내일부터 일을 거들겠다고 한다', hint: '손에 물집이 잡힌다. 저녁상의 말수가 는다', values: { peace: D }, mark: 'fellowship',
        fx: [{ op: 'base', key: 'vit', add: 1 }, flag('parHelped')] },
      { label: '부모의 일을 물려받겠느냐는 말에 고개를 젓는다', hint: '하고 싶은 일을 직접 고르겠다고 하자 머리를 쓰다듬던 손이 멎는다', values: { ambition: D },
        fx: [flag('parDefy'), { op: 'base', key: 'wil', add: 1 }] },
      { label: '그 일이 어떻게 돌아가는지 하나하나 묻는다', hint: '부모는 귀찮아하면서도 다 일러 준다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'par_table', kind: 'door', when: kid(11, 15), needs: ['parent'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '식은 밥상', body: '부모와 크게 다투고 문을 박차고 나왔다. 밤이 깊어 창밖에서 들여다보니, 부모가 손도 대지 않은 밥상 앞에 그대로 앉아 있다.',
    doors: [
      { label: '들어가서 말없이 마주 앉아 식은 밥을 먹는다', hint: '누구도 먼저 사과하지 않는다. 그래도 밥그릇은 비운다', values: { peace: D },
        fx: [flag('parTable'), heavy('부모는 아무 말 없이 국을 다시 데워 왔다.')] },
      { label: '끝내 들어가지 않고 헛간에서 밤을 새운다', hint: '밥상은 아침까지 그대로 놓여 있다', values: { freedom: D }, mark: 'unyielding',
        fx: [flag('parSlam'), { op: 'hardship', add: 1 }] },
      { label: '들어가서 내 말이 왜 틀렸는지 끝까지 따져 묻는다', hint: '이야기는 새벽까지 이어진다', values: { justice: D },
        fx: [flag('parTable'), { op: 'base', key: 'wil', add: 1 }] },
    ],
  },
  {
    id: 'par_keepsake', kind: 'door', when: kid(13, 15), needs: ['parent'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '물려받은 것', body: '부모가 장롱 깊은 곳에서 낡은 물건 하나를 꺼낸다. 젊은 날 내내 품고 다니던 것이라고, 이제 {name}의 것이라고 한다. 건네는 손이 조금 떨린다.',
    doors: [
      { label: '품에 넣고 평생 지니겠다고 한다', hint: '어디를 가든 품 안이 조금 무겁다', values: { romance: D },
        fx: [flag('parKeepsake'), line('부모가 젊은 날 지니던 것을 물려받았다')] },
      { label: '이것에 얽힌 이야기를 전부 들려 달라고 한다', hint: '부모의 젊은 날을 처음으로 듣는다', values: { inquiry: D },
        fx: [flag('parKeepsake'), line('부모가 젊은 날 지니던 것을 물려받았다')] },
      { label: '장터에 들고 나가 값을 쳐 받는다', hint: '주머니가 제법 묵직해진다. 한동안 부모의 눈을 마주 보기 어렵다', values: { greed: D },
        fx: [{ op: 'money', add: 15000 }, flag('soldKeepsake')] },
    ],
  },
  // ---- 수미상관
  {
    id: 'par_echo_carry', kind: 'door', when: at(age(28, 60), grown, has('parShoulders')), needs: ['parent'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '목말, 다시', body: '오랜만에 {town}에 들렀다. 부모는 한 뼘은 작아져 있다. 마을 잔칫날, 부모가 사람들 어깨 너머를 보려고 까치발을 든다. 어릴 적 {name}이(가) 그랬던 것처럼.',
    doors: [
      { label: '말없이 부모를 등에 업는다', hint: '오래전에 한 말을 지킨다', values: { loyalty: D },
        fx: [{ op: 'moveHome' }, { op: 'base', key: 'wil', add: 1 }, heavy('등에 업힌 부모는 놀랄 만큼 가벼웠다. 부모는 사람들 어깨 너머로 펼쳐진 잔치 마당을 한참 바라보았다.'), line('늙은 부모를 업고 잔치를 구경했다')] },
      { label: '사람들을 헤치고 맨 앞에 자리를 낸다', hint: '아무도 {name}의 앞을 막지 않는다', values: { dominion: D },
        fx: [{ op: 'moveHome' }, heavy('부모는 맨 앞자리에 앉아서도 잔치보다 {name}의 얼굴을 더 오래 보았다.'), line('늙은 부모와 잔치를 구경했다')] },
      { label: '곁에 서서 보이는 것을 하나하나 일러 준다', hint: '부모는 고개를 끄덕이며 듣는다', values: { peace: D },
        fx: [{ op: 'moveHome' }, heavy('부모는 어린 {name}에게 잔치 구경을 시켜 주던 때를 떠올리며 웃었다.'), line('늙은 부모와 잔치를 구경했다')] },
    ],
  },
  {
    id: 'par_echo_table', kind: 'door', when: at(age(25, 60), active, has('parSlam')), weight: 8, repeat: 'once', speaker: 'hero',
    title: '식은 밥상, 다시', body: '오랜만에 {town}의 옛집 문을 연다. 부엌 한쪽에 밥상이 놓여 있다. 그날 밤 끝내 들어가지 않았던, 그 밥상이다.',
    doors: [
      { label: '밥상 앞에 앉아 그날 못 한 말을 한다', hint: '한참 늦은 말이다', values: { peace: D },
        fx: [{ op: 'moveHome' }, { op: 'base', key: 'wil', add: 1 }, heavy('듣는 이가 있든 없든 상관없었다. 미안하다는 말은 생각보다 짧았다.'), line('옛집의 밥상 앞에 다시 앉았다')] },
      { label: '밥상을 닦아 짊어지고 나온다', hint: '어디를 가든 그 상에서 밥을 먹게 된다', values: { romance: D },
        fx: [{ op: 'moveHome' }, flag('oldTable'), line('옛집의 밥상을 지고 나왔다')] },
      { label: '문을 도로 닫고 돌아선다', hint: '이번에도 들어가지 않는다', values: { freedom: D },
        fx: [{ op: 'hardship', add: 2 }] },
    ],
  },
  {
    id: 'par_echo_keepsake', kind: 'door', when: at(age(36, 72), grown, has('parKeepsake')), needs: ['child'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '물려주는 것', body: '{name}은(는) 품에서 낡은 물건을 꺼낸다. 부모가 젊은 날 품고 다녔고, {name}이(가) 평생 지녀 온 것이다. 다 자란 자식이 그것을 바라본다.',
    doors: [
      { label: '부모가 했던 말을 그대로 건넨다', hint: '건네는 손이 조금 떨린다', values: { romance: D },
        fx: [heavy('자식의 손에 물건을 쥐여 주고서야 그날 부모의 손이 왜 떨렸는지 알았다.'), line('부모에게 물려받은 것을 자식에게 물려주었다')] },
      { label: '이것이 지나온 길을 처음부터 들려준다', hint: '이야기는 부모의 젊은 날에서 시작한다', values: { inquiry: D },
        fx: [heavy('이야기를 다 들은 자식이 다음 이야기는 자기가 이어 가는 거냐고 물었다.'), line('부모에게 물려받은 것을 자식에게 물려주었다')] },
      { label: '아직은 내가 지니겠다며 도로 품에 넣는다', hint: '품 안이 여전히 조금 무겁다', values: { freedom: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }] },
    ],
  },
];

// ================================================================ 스승 (부모가 없는 아이)
const GONE: Fx[] = [{ op: 'losePerson', relation: MENTOR }, flag('menGone')];
const MENTORS: Turning[] = [
  {
    id: 'men_meet', kind: 'door', when: [...kid(5, 10), NO_PARENT, not('mentor'), not('clinicApprentice'), not('grandGuard'), not('lonely')], weight: 12, repeat: 'once', speaker: 'hero',
    title: '밥 한 그릇', body: '처마 밑에서 비를 긋는 {name} 앞에 늙은 떠돌이 하나가 멈춰 선다. 말없이 제 밥그릇을 반 덜어 내민다. 한쪽 다리를 절고, 허리에는 닳은 목검을 찼다.',
    doors: [
      { label: '밥을 비우고, 허리의 목검을 가리키며 저것을 가르쳐 달라고 한다', hint: '노인은 한참 웃는다. 그날부터 비를 긋는 처마가 하나 생긴다', values: { ambition: D },
        fx: [{ op: 'person', kind: 'ally', relation: MENTOR, age: { older: 45 } }, flag('mentor'), line('늙은 떠돌이를 스승으로 모셨다')] },
      { label: '왜 주느냐고 먼저 묻는다', hint: '노인은 저도 그렇게 얻어먹고 컸다고 한다', values: { inquiry: D },
        fx: [{ op: 'person', kind: 'ally', relation: MENTOR, age: { older: 45 } }, flag('mentor'), line('늙은 떠돌이를 스승으로 모셨다')] },
      { label: '밥그릇만 낚아채 달아난다', hint: '배는 찬다. 노인은 쫓아오지 않는다', values: { greed: D },
        fx: [{ op: 'hp', add: 5 }] },
    ],
  },
  {
    id: 'men_lesson', kind: 'door', when: [...kid(8, 14), has('mentor'), not('menGone')], weight: 12, repeat: 'once', speaker: { relation: MENTOR },
    title: '스승의 물음', body: '스승은 {name}에게 목검을 쥐여 주고는 온종일 물 긷는 일만 시킨다. 해 질 녘에 스승이 묻는다. 힘은 무엇에 쓰는 것이냐고.',
    doors: [
      { label: '지키는 데 쓴다고 답한다', hint: '스승은 고개를 끄덕이고, 이튿날 물동이를 하나 더 얹는다', values: { justice: D },
        fx: [flag('menLesson'), flag('menProtect'), { op: 'pref', branch: 'sword', add: 10 }, { op: 'base', key: 'vit', add: 1 }] },
      { label: '이기는 데 쓴다고 답한다', hint: '스승은 웃지 않는다. 이튿날부터 목검으로 진짜 매운맛을 보인다', values: { dominion: D },
        fx: [flag('menLesson'), { op: 'pref', branch: 'sword', add: 10 }, { op: 'base', key: 'str', add: 1 }, { op: 'hp', add: -5 }] },
      { label: '모르겠다고, 그래서 배우는 거라고 답한다', hint: '스승이 처음으로 소리 내어 웃는다', values: { inquiry: D },
        fx: [flag('menLesson'), { op: 'pref', branch: 'sword', add: 10 }, { op: 'base', key: 'int', add: 1 }] },
    ],
  },
  {
    id: 'men_back', kind: 'door', when: [...kid(12, 15), has('mentor'), has('menLesson'), not('menGone')], weight: 14, repeat: 'once', speaker: { relation: MENTOR },
    title: '스승의 등', body: '산적 떼가 마을을 덮쳤다. 달아나던 {name}의 앞을 칼 든 사내들이 막아선다. 그때 절뚝이는 발소리가 끼어든다. 스승이 닳은 목검 하나로 {name}의 앞에 선다. 뒤를 돌아보지 않은 채 제자에게 달아나라고 한다.',
    doors: [
      { label: '이를 악물고 달린다', hint: '뒤에서 나는 소리를 평생 잊지 못한다', values: { freedom: D },
        fx: [...GONE, flag('menRan'), heavy('스승은 돌아오지 않았다. 불탄 자리에는 닳은 목검만 남아 있었다.'), line('스승이 대신 막아서고 돌아오지 못했다')] },
      { label: '돌아서서 스승의 곁에 선다', hint: '스승의 말을 처음으로 어긴다. 크게 다친다', values: { loyalty: D }, danger: true,
        fx: [...GONE, flag('menStood'), { op: 'hp', add: -30 }, { op: 'injury', severity: 'light' }, { op: 'mastery', branch: 'sword', add: 15 },
             heavy('둘이서 버텼다. 산적들이 물러갔을 때, 스승은 {name}의 어깨에 기대어 제자가 잘 자랐다며 웃었다. 그것이 스승의 마지막 말이었다.'), line('스승이 대신 막아서고 돌아오지 못했다')] },
      { label: '몸을 숨기고 스승의 마지막 칼을 눈에 새긴다', hint: '한 번 본 것을 평생 되풀이해 휘두르게 된다', values: { inquiry: D },
        fx: [...GONE, flag('menWatched'), { op: 'pref', branch: 'sword', add: 15 }, { op: 'mastery', branch: 'sword', add: 25 },
             heavy('다리를 저는 노인의 칼이 그렇게 빠를 줄은 몰랐다. 스승은 셋을 쓰러뜨리고 넷째의 칼에 쓰러졌다.'), line('스승이 대신 막아서고 돌아오지 못했다')] },
    ],
  },
  // ---- 수미상관
  {
    id: 'men_echo_sword', kind: 'door', when: at(age(22, 55), active, has('menGone')), weight: 8, repeat: 'once', speaker: 'hero',
    title: '닳은 목검', body: '짐 속에서 스승의 닳은 목검이 나온다. 손잡이에는 스승의 손자국이 패어 있다. 쥐어 보니, {name}의 손이 이제 그 자국에 꼭 맞는다.',
    doors: [
      { label: '스승이 묻던 것을 스스로에게 다시 묻는다', hint: '힘은 무엇에 쓰는 것인가. 이제는 답이 조금 다르다', values: { justice: D },
        fx: [{ op: 'base', key: 'wil', add: 1 }, heavy('답은 그때와 달라졌다. 그래도 스승은 고개를 끄덕였을 것 같았다.')] },
      { label: '목검을 허리에 차고 다닌다', hint: '사람들이 웃는다. 상관하지 않는다', values: { romance: D },
        fx: [flag('menSword'), { op: 'pref', branch: 'sword', add: 10 }] },
      { label: '손자국에 손을 맞추고 스승의 칼을 되짚어 휘두른다', hint: '날이 샐 때까지 그만두지 못한다', values: { ambition: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 20 }, { op: 'hp', add: -5 }] },
    ],
  },
  {
    id: 'men_echo_stand', kind: 'door', when: at(age(34, 72), grown, has('menGone')), weight: 10, repeat: 'once', speaker: 'hero',
    title: '그 자리에 서다', body: '{island}의 장터에 무뢰배들이 들이닥쳤다. 달아나는 사람들 틈에서 아이 하나가 넘어진다. 칼 든 사내가 아이 앞에 선다. 정신을 차려 보니 {name}이(가) 그 사이에 서 있다. 그날 스승이 서 있던 자리다.',
    doors: [
      { label: '등 뒤의 아이에게 달아나라고 한다', hint: '그날 들었던 말을 이번에는 건넨다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'fame', add: 10 }, { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'light' }] },
             heavy('아이는 달렸다. {name}은(는) 그날 스승의 등이 왜 그렇게 커 보였는지 이제야 알았다.'), line('스승이 섰던 자리에 섰다')] },
      { label: '무뢰배를 쓰러뜨리고 갈 곳 없는 아이를 거둔다', hint: '비를 긋는 처마가 하나 더 생긴다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '거둔 아이', age: 9 },
             heavy('떨고 있는 아이에게 제 밥그릇을 반 덜어 내밀었다. 스승이 그랬던 것처럼.'), line('갈 곳 없는 아이를 거두었다')] },
      { label: '아이를 안아 들고 장터를 빠져나간다', hint: '싸우지 않는다. 아이는 다치지 않는다', values: { freedom: D },
        fx: [{ op: 'fame', add: 3 }, heavy('품에 안긴 아이가 물었다. 왜 구해 주느냐고. 나도 그렇게 컸다고 답했다.')] },
    ],
  },
];

export const BONDS: Turning[] = [...SIBLING, ...PARENT, ...MENTORS];
