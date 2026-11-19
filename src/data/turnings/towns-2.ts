// 마을의 유년기 (towns.ts에서 나눈 나머지): 시럽 마을, 코코야시 마을, 시모츠키 마을, 로그타운.
// 원작의 때 (주인공은 루피와 같은 나이):
//   우솝은 주인공과 같은 나이. 클라하도르(쿠로)가 저택의 집사로 들어온 것은 원작 세 해 전, 주인공 열네 살 무렵.
//   아론 일당이 코코야시 마을을 차지하고 벨메일이 죽은 것은 주인공 아홉 살 무렵(나미 열 살).
//   쿠이나가 죽은 것은 주인공 아홉 살 무렵(조로 열한 살).
//   로저가 처형된 것은 주인공이 태어나기 전이다. 로그타운에서 그 일은 사람들이 들려주는 이야기다 (처형대: childhood.ts의 kid_scaffold).
// 주인공은 원작의 결말을 바꾸지 않는다. 아이가 어인에게 덤비면 아이가 덤빈 만큼으로 끝난다.
import { V } from '../balance';
import { POOR, RICH, kidIn, leaveTo } from './childhood';
import type { Turning } from '../../core/types';

const D = V.value.door;
const SYRUP = '시럽 마을', COCO = '코코야시 마을', SHIMO = '시모츠키 마을', LOGUE = '로그타운';

export const TOWNS_2: Turning[] = [
  // ---------------------------------------------------------------- 시럽 마을: 언덕 위의 저택, 거짓말쟁이 소년
  {
    id: 'town_syrup_window', kind: 'door', when: kidIn(SYRUP, 5, 8), weight: 12, repeat: 'once', speaker: 'hero',
    title: '창가의 기침 소리', body: '코 긴 아이 우솝의 어머니가 오래 앓아누웠다. 우솝은 날마다 그 창가에 대고, 바다에 나간 아버지가 해적선을 타고 곧 돌아온다고 외친다.',
    doors: [
      { label: '산에 올라 기침에 좋다는 약초를 캐 온다', hint: '비탈에서 굴러 무릎이 찢어진다. 약초가 듣는지는 아무도 모른다', values: { peace: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '무릎을 끌며 약초를 창가에 놓았다. 우솝의 어머니는 고맙다고 말했지만 기침은 그날 밤에도 멈추지 않았다.', weight: 'light' }] },
      { label: '우솝 옆에 앉아 함께 수평선을 지켜본다', hint: '해가 지도록 아무 배도 오지 않는다. 마을 아이들의 놀림을 함께 받고, 우솝이 {name}을(를) 제 편으로 여긴다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '거짓말쟁이 동무', canon: 'usopp' }, { op: 'flag', id: 'usoppFriend' }, { op: 'log', text: '해가 저물도록 배는 나타나지 않았다. 아이들이 놀려도 우솝은 창가를 떠나지 않았고, {name}이(가) 곁에 앉아 있자 처음으로 내일도 오겠냐고 물었다.', weight: 'light' }] },
      { label: '의원을 따라다니며 무슨 병인지 묻는다', hint: '약봉지 심부름을 하며 병의 이름을 알게 된다. 고칠 수 없다는 것도 알게 된다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'hardship', add: 2 }, { op: 'log', text: '약봉지를 나르며 병의 이름을 배웠다. 의원은 고칠 수 없다는 말도 조용히 해 주었고, {name}은(는) 창가에서 외치는 우솝을 보며 입을 다물었다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'town_syrup_liar', kind: 'door', when: kidIn(SYRUP, 9, 13), weight: 10, repeat: 'once', speaker: 'hero',
    title: '해적이 온다', body: '아침마다 우솝이 해적이 쳐들어온다고 외치며 마을을 달린다. 어른들은 빗자루를 들고 쫓아가고, 아이들에게 그 녀석과 놀지 말라고 한다.',
    doors: [
      { label: '우솝과 함께 더 큰 거짓말을 지어 외친다', hint: '어른들의 빗자루가 {name}에게도 날아온다. 언덕의 꼬마들이 둘의 다음 이야기를 기다린다', values: { romance: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'liarFriend' }, { op: 'log', text: '어른들의 빗자루를 피해 언덕까지 달아났다. 거기 모인 꼬마들이 다음에는 어떤 해적이 오는지 묻자 우솝이 {name}에게 먼저 차례를 넘겼다.', weight: 'light' }] },
      { label: '빗자루를 든 어른들 앞을 막아선다', hint: '대신 얻어맞고 집에서도 혼난다. 우솝이 그날 일을 오래 기억한다', values: { loyalty: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'stoodForUsopp' }, { op: 'log', text: '빗자루가 {name}의 어깨에 떨어졌다. 집에서도 혼났지만 우솝은 사람들이 떠난 뒤 조용히 찾아와 왜 막아섰냐고 물었다.', weight: 'light' }] },
      { label: '어른들 편에 서서 우솝의 거짓말을 바로잡는다', hint: '어른들이 {name}을(를) 착한 아이라 부른다. 우솝은 다시는 {name}에게 이야기를 들려주지 않는다', values: { justice: D },
        fx: [{ op: 'flag', id: 'notALiar' }, { op: 'log', text: '어른들은 잘했다며 머리를 쓰다듬었다. 우솝은 다음 날에도 마을을 달렸지만 {name}이(가) 보이는 골목에서는 이야기를 멈췄다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_syrup_butler', kind: 'door', when: kidIn(SYRUP, 14, 15), weight: 14, repeat: 'once', speaker: 'hero',
    title: '저택의 새 집사', body: '언덕 위 카야 아가씨의 저택에 클라하도르라는 새 집사가 들어왔다. 손바닥으로 안경을 밀어 올리는 버릇이 있는 남자다. 그가 온 뒤로 저택의 일꾼들이 하나둘 바뀌고 있다.',
    doors: [
      { label: '새 집사의 눈빛이 수상하다고 늙은 집사 메리에게 말한다', hint: '증거는 없다. 거짓말쟁이 취급을 받고 저택 출입을 금지당한다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'flag', id: 'mansionBanned' }, { op: 'flag', id: 'doubtsKlahadore' }, { op: 'log', text: '메리는 증거 없는 의심이라며 문을 닫았다. 저택 출입은 막혔지만 {name}은(는) 새 집사가 일꾼 명단을 바꾸는 일을 계속 지켜보았다.', weight: 'light' }] },
      { label: '새 집사 밑에서 저택 일을 배운다', hint: '품삯이 좋고 일이 빨리 는다. 집사는 {name}의 약점을 하나씩 수첩에 적는다', values: { ambition: D },
        fx: [{ op: 'money', add: 5000 }, { op: 'flag', id: 'klahadoreAide' }, { op: 'log', text: '집사는 품삯을 제때 주고 맡기는 일을 늘렸다. 그러면서 {name}이(가) 무엇을 두려워하고 누구와 가까운지 수첩에 적어 갔다.', weight: 'light' }] },
      { label: '담을 넘어 아가씨의 창가에 바깥 이야기를 들려주러 다닌다', hint: '들키면 경비에게 쫓겨난다. 아가씨가 {name}의 발소리를 기다린다', values: { romance: D }, mark: 'daring',
        fx: [{ op: 'hp', add: -5 }, { op: 'person', kind: 'ally', relation: '저택의 아가씨', canon: 'kaya' }, { op: 'log', text: '경비를 피해 담을 넘다 손바닥을 긁혔다. 카야는 창문을 열고 바깥 마을 이야기를 들었고, 다음 밤에는 {name}의 발소리를 먼저 알아챘다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_syrup_sheep', kind: 'door', when: kidIn(SYRUP, 10, 14, POOR), needs: ['parent'], weight: 10, repeat: 'once', speaker: { relation: '목장 주인' },
    title: '언덕의 양떼', body: '집안의 빚 때문에 {name}은(는) 목장 주인의 양을 치게 되었다. 양 한 마리가 사라지자 목장 주인은 모아 둔 품삯을 깎겠다고 한다. 좋은 풀밭은 덩치 큰 목동들이 늘 먼저 차지한다.',
    doors: [
      { label: '밤새 숲을 뒤져 사라진 양을 찾는다', hint: '가시덤불에 온몸이 긁힌다. 양을 찾으면 품삯을 지킨다', values: { justice: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 1000 }, { op: 'log', text: '새벽녘 골짜기에서 우는 양을 찾아 업고 내려왔다.', weight: 'light' }], else: [{ op: 'log', text: '날이 밝을 때까지 양을 찾지 못했다. 가시덤불에 긁힌 채 돌아오자 목장 주인은 약속대로 품삯을 깎았다.', weight: 'light' }] }] },
      { label: '덩치 큰 목동들에게서 풀밭을 빼앗는다', hint: '한 번은 크게 얻어맞는다. 그 뒤로 언덕의 좋은 풀밭은 {name}의 양 차지다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'injury', severity: 'light' }, { op: 'flag', id: 'pastureBoss' }, { op: 'log', text: '목동들에게 얻어맞고도 다음 날 같은 풀밭에 양을 몰았다. 그 뒤로는 그들이 먼저 길을 비켰지만 멍은 오래 남았다.', weight: 'light' }] },
      { label: '목장 주인의 장부를 몰래 들여다본다', hint: '양 값이 부풀려 적힌 것을 찾아낼지 모른다. 들키면 일자리를 잃는다', values: { inquiry: D }, mark: 'composure',
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 1000 }, { op: 'log', text: '부풀린 숫자를 짚어 내자 목장 주인이 품삯을 도로 내놓았다.', weight: 'light' }],
               else: [{ op: 'hardship', add: 3 }, { op: 'flag', id: 'firedShepherd' }, { op: 'log', text: '장부를 뒤지다 들켜 목장에서 쫓겨났다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'go_syrup', kind: 'door', when: kidIn(SYRUP, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '조용한 마을의 열다섯', body: '시럽 마을은 해적 한 번 오지 않는 조용한 시골이다. 저택은 일꾼을 구하고, 마을 의원은 약 짓는 일을 거들 아이를 찾는다. 항구에는 로그타운으로 가는 상선이 사흘에 한 번 들른다.',
    doors: [
      { label: '저택의 고용인으로 들어간다', hint: '평생 일할 자리가 생긴다. 새 집사의 눈 밖에 나면 그 자리도 끝이다', values: { peace: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 3000 }, { op: 'flag', id: 'mansionStaff' }, { op: 'log', text: '저택에서 첫 품삯을 받았다. 새 집사는 일을 빨리 배운다고 말했지만 {name}은(는) 그의 시선을 의식하며 문을 닫았다.', weight: 'light' }] },
      { label: '마을 의원 밑에서 약 짓는 법을 배운다', hint: '삼 년은 품삯 없이 약재를 썬다. 사람 몸을 아는 손이 된다', values: { inquiry: D },
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'medicApprentice' }, { op: 'log', text: '의원은 약재를 구분해 늘어놓고 첫날부터 칼질을 시켰다. 품삯은 없었지만 {name}은(는) 병든 이가 찾아올 때마다 쓰는 약을 기록했다.', weight: 'light' }] },
      { label: '상선을 타고 로그타운으로 간다', hint: '언덕의 마을을 떠난다. 고향 동무들과는 편지로만 이어진다', values: { romance: D },
        fx: leaveTo(LOGUE, '사흘에 한 번 오는 상선의 마지막 자리에 탔다. 언덕 위 저택의 지붕이 오래 보였다.', '열다섯에 시럽 마을을 떠나 로그타운으로 갔다') },
    ],
  },

  // ---------------------------------------------------------------- 코코야시 마을: 귤밭과 어인
  {
    id: 'town_coco_arlong', kind: 'door', when: kidIn(COCO, 9, 10), weight: 25, repeat: 'once', speaker: { canon: 'arlong' },
    title: '어인이 온 날', body: '톱니 코의 어인 선장이 무리를 이끌고 코코야시 마을에 올라왔다. 어른은 다달이 10만, 아이는 5만 베리. 내지 못한 사람은 죽인다고 했다. 귤밭 언덕의 벨메일은 두 아이 몫부터 내밀었다.',
    doors: [
      { label: '어인들을 향해 돌을 던진다', hint: '돌은 닿기도 전에 떨어진다. 어인의 손등 한 번에 {name}은(는) 길바닥에 나뒹군다', values: { justice: D }, mark: 'unyielding', danger: true,
        fx: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'heavy' }, { op: 'flag', id: 'arlongDay' },
             { op: 'log', text: '어인은 {name}을(를) 돌아보지도 않았다. 일어났을 때 언덕 쪽에서 총성이 울렸다.', weight: 'heavy' },
             { op: 'timeline', text: '어인 해적이 코코야시 마을을 차지한 날, 돌을 던졌다' }] },
      { label: '겐조의 말대로 어린아이들을 데리고 귤밭 창고에 숨는다', hint: '아이들은 무사하다. 언덕에서 울린 총성을 창고 안에서 듣는다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '풍차 모자의 아저씨', canon: 'genzo' }, { op: 'flag', id: 'arlongDay' }, { op: 'log', text: '겐조가 창고 문을 닫는 동안 {name}은(는) 어린아이들을 안쪽으로 밀어 넣었다. 언덕의 총성에 모두 몸을 움츠렸지만 창고의 아이들은 살아남았다.', weight: 'heavy' },
             { op: 'timeline', text: '어인 해적이 코코야시 마을을 차지한 날, 아이들을 숨겼다' }] },
      { label: '공물을 세는 어인들의 얼굴을 하나하나 외워 둔다', hint: '아무것도 하지 못한 날로 남는다. 그 얼굴들은 평생 잊히지 않는다', mark: 'obsession',
        fx: [{ op: 'flag', id: 'arlongDay' }, { op: 'flag', id: 'arlongFaces' }, { op: 'hardship', add: 3 }, { op: 'log', text: '어인들이 동전 자루를 세는 동안 {name}은(는) 얼굴과 목소리를 외웠다. 언덕에서 총성이 났을 때도 꼼짝할 수 없었던 순간이 오래 남았다.', weight: 'heavy' },
             { op: 'timeline', text: '어인 해적이 코코야시 마을을 차지한 날을 지켜보았다' }] },
    ],
  },
  {
    id: 'town_coco_tribute', kind: 'door', when: kidIn(COCO, 10, 15, POOR), needs: ['parent'], weight: 10, repeat: 'once', speaker: { canon: 'genzo' },
    title: '모자란 공물', body: '공물을 걷는 날이 다가오자 부모가 밤새 동전을 셌다. 옆집 노인은 공물 자루를 도둑맞아 제 몫을 채우지 못하면 목숨을 잃을 처지다. 풍차 모자를 쓴 겐조가 자루를 훔친 자를 찾고 있다.',
    doors: [
      { label: '자루를 빼돌린 이웃을 겐조에게 알린다', hint: '노인은 산다. 그 이웃 집안과는 원수가 된다', values: { justice: D },
        fx: [{ op: 'person', kind: 'enemy', relation: '원한을 품은 이웃' }, { op: 'log', text: '겐조가 도둑맞은 자루를 찾아 노인에게 돌려주었다. 자루를 빼돌린 집은 {name}이(가) 지나갈 때마다 문을 닫았다.', weight: 'heavy' }] },
      { label: '집의 공물에서 노인 몫을 몰래 덜어 낸다', hint: '노인은 산다. 그달 {name}의 집은 공물을 채우려 굶는다', values: { freedom: D }, mark: 'fellowship',
        fx: [{ op: 'hp', add: -15 }, { op: 'hardship', add: 5 }, { op: 'log', text: '노인은 공물을 채워 살아남았다. {name}의 집에서는 빈 자루를 다시 채우느라 그달 내내 식사를 줄여야 했다.', weight: 'heavy' }] },
      { label: '아론 파크에 생선을 나르는 일을 맡아 노인 몫을 번다', hint: '어인들의 품삯으로 노인을 살린다. 마을 사람들이 {name}을(를) 어인 앞잡이라 부른다', values: { ambition: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'flag', id: 'arlongErrand' }, { op: 'log', text: '아론 파크에 생선을 나르고 받은 돈으로 노인의 공물을 메웠다. 돌아오는 길에 마을 사람들은 {name}에게 길을 내주고도 인사하지 않았다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'town_coco_ledger', kind: 'door', when: kidIn(COCO, 12, 15, RICH), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '상납 장부', body: '{name}의 집 가게는 아론 파크에 술과 쌀을 대며 섬에서 드물게 넉넉하다. 이웃들은 가게 앞을 지날 때마다 침을 뱉는다. 부모가 상납 장부를 물려줄 테니 일을 배우라고 했다.',
    doors: [
      { label: '집을 나와 귤밭 창고에서 지낸다', hint: '집안의 돈과 따뜻한 밥을 버린다. 이웃들이 처음으로 {name}에게 말을 건다', values: { freedom: D }, mark: 'rebel', closes: true,
        fx: [{ op: 'wealth', to: 'poor' }, { op: 'flag', id: 'leftShop' }, { op: 'log', text: '상납 장부를 두고 귤밭 창고로 옮겼다. 따뜻한 밥은 사라졌지만 이웃이 처음으로 {name}의 이름을 부르며 문을 열어 주었다.', weight: 'heavy' }, { op: 'timeline', text: '어인에게 기대 사는 집을 나왔다' }] },
      { label: '장부를 받아 어인들의 위세를 등에 업는다', hint: '마을 아이들 누구도 {name}에게 대들지 못한다. 마을 사람 모두의 미움을 산다', values: { dominion: D },
        fx: [{ op: 'money', add: 10000 }, { op: 'flag', id: 'arlongShadow' }, { op: 'log', text: '어인들은 장부를 들고 온 {name}에게 거래 대금을 건넸다. 마을 아이들은 길을 비켜 주었고, 어느 집도 다시 가게에 들어오지 않았다.', weight: 'heavy' }] },
      { label: '장부를 받되 이웃들의 공물 숫자를 몰래 줄여 적는다', hint: '이웃 몇 집의 공물이 가벼워진다. 들키면 어인들의 손에 집이 끝장난다', values: { inquiry: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.7, then: [{ op: 'flag', id: 'ledgerForger' }, { op: 'log', text: '이웃 몇 집의 공물 숫자가 줄어도 어인들은 알아채지 못했다. 그 집들은 한동안 숨을 돌렸고 {name}은(는) 장부를 덮을 때마다 손을 닦았다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'heavy' }, { op: 'wealth', to: 'poor' },
                      { op: 'log', text: '숫자가 들켰다. 어인들이 가게를 부수고 {name}을(를) 바닥에 내던졌다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'town_coco_charts', kind: 'door', when: kidIn(COCO, 11, 15), weight: 10, repeat: 'once', speaker: 'hero',
    title: '해도를 그리는 아이', body: '귤밭 집의 나미가 아론 파크에 드나들며 어인들의 해도를 그린다. 마을 아이들은 나미를 배신자라 부르지만 어른들은 아무 말도 하지 않는다. 나미가 해적들의 돈을 훔쳐 무언가를 모은다는 소문이 돈다.',
    doors: [
      { label: '나미에게 해안선 재는 법을 가르쳐 달라고 한다', hint: '어인 졸개에게 들켜 매운 경고를 받는다. 바다를 종이에 옮기는 눈이 생긴다', values: { inquiry: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'chartSkill' }, { op: 'log', text: '나미는 해안의 굽은 곳을 재는 법을 짧게 알려 주었다. 어인 졸개에게 들켜 매를 맞은 뒤에도 {name}은(는) 종이에 그 선을 다시 그려 보았다.', weight: 'light' }] },
      { label: '나미를 배신자라 부르는 아이들 앞을 막는다', hint: '또래들과 크게 싸우고 따돌림을 받는다. 나미는 고맙다는 말 대신 등을 돌린다', values: { loyalty: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'flag', id: 'namiDefender' }, { op: 'log', text: '또래들과 싸워 입술이 터졌다. 나미는 고맙다는 말 없이 지나갔지만 아이들이 더는 {name} 앞에서 그 말을 하지 않았다.', weight: 'light' }] },
      { label: '혼자 해적선에 숨어들어 돈을 훔쳐 본다', hint: '나미는 혼자 하는 일이라며 끼워 주지 않는다. 혼자 들어갔다가 크게 다칠 수도 있다', values: { greed: D }, mark: 'daring', danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 8000 }, { op: 'log', text: '술에 취한 해적의 돈주머니를 들고 갯바위 사이로 빠져나왔다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '해적에게 들켜 갑판에서 내던져졌다. 겨우 뭍에 기어올랐다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'go_coco', kind: 'door', when: kidIn(COCO, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '섬을 빠져나가는 쪽배', body: '공물이 오를 때마다 섬을 빠져나가려던 사람들이 하나둘 사라진다. 갯바위 뒤에 노 두 자루가 실린 쪽배가 숨겨져 있다. 어인 졸개 하나가 밤마다 혼자 해안을 돈다.',
    doors: [
      { label: '밤바다에 쪽배를 띄운다', hint: '졸개의 눈을 피하면 섬을 벗어난다. 들키면 아론 파크로 끌려간다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.6,
               then: leaveTo('해상 레스토랑 발라티에', '밤새 노를 저었다. 동틀 무렵 바다 위에 떠 있는 식당에 닿았다.', '열다섯에 쪽배로 코코야시 마을을 빠져나갔다'),
               else: [{ op: 'hp', add: -25 }, { op: 'injury', severity: 'heavy' }, { op: 'log', text: '졸개에게 들켜 아론 파크로 끌려갔다. 매를 맞고 사흘 만에 귤밭으로 돌아왔다.', weight: 'heavy' }] }] },
      { label: '귤밭에 남아 마을 사람들과 공물을 함께 갚는다', hint: '열여섯을 기다리지 않고 귤밭 일꾼이 된다. 이 섬을 벗어날 날은 기약이 없다', values: { loyalty: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'hardship', add: 5 }, { op: 'log', text: '쪽배는 갯바위 뒤에 둔 채 귤밭 일을 시작했다. 공물을 걷는 날마다 이웃과 동전을 모았지만 섬 밖 소식은 점점 뜸해졌다.', weight: 'heavy' }] },
      { label: '아론 파크의 일꾼 자리를 받는다', hint: '공물을 내지 않아도 되고 품삯도 받는다. 마을에는 {name}을(를) 반기는 집이 없어진다', values: { greed: D }, 
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 8000 }, { op: 'flag', id: 'arlongWorker' }, { op: 'log', text: '아론 파크에서 첫 품삯을 받고 공물 명단에서 이름이 빠졌다. 돌아오는 길에는 문을 열어 주는 이웃집이 없었다.', weight: 'heavy' }] },
    ],
  },

  // ---------------------------------------------------------------- 시모츠키 마을: 코우시로의 도장, 쿠이나와 조로
  {
    id: 'town_shimo_dojo', kind: 'door', when: kidIn(SHIMO, 6, 12, { c: 'flag', id: 'leftDojo', has: false }), weight: 12, repeat: 'once', speaker: { canon: 'koshiro' },
    title: '시모츠키 도장', body: '마을의 도장에서 코우시로 사범이 아이들에게 칼을 가르친다. 문틈으로 목검 부딪히는 소리가 새어 나온다. 수업료를 못 내는 아이들은 대숲에서 동작을 훔쳐 배운다.',
    doors: [
      { label: '수업료를 내고 입문한다', hint: '사범의 가르침을 정식으로 받는다. 집안의 돈이 적잖이 든다', when: [RICH], values: { ambition: D },
        fx: [{ op: 'money', add: -20000, trade: true }, { op: 'master', name: '코우시로 사범', branch: 'sword', cap: V.growth.paidCap, years: 6, paid: true }, { op: 'log', text: '수업료를 내고 도장 마루에 올랐다. 수업을 마치고 빌린 목검을 걸어 두자 코우시로가 내일도 같은 자리에 서라고 했다.', weight: 'light' }] },
      { label: '수업료 대신 도장 마당을 쓸고 물을 긷는다', hint: '새벽 일을 마치면 사범이 수업 동안 도장 목검을 빌려 준다', values: { romance: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'mastery', branch: 'sword', add: 10 }, { op: 'log', text: '물을 긷고 마당을 쓴 뒤 목검을 빌려 수업에 들어갔다. 수업이 끝나자 사범이 도장 벽에 빈 자리를 내 주었다. 목검을 돌려 걸고 우물가로 갔다.', weight: 'light' }] },
      { label: '대숲에서 혼자 흉내 낸다', hint: '돈도 품도 들지 않는다. 잘못 익힌 자세에 손목을 삔다', values: { freedom: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 6 }, { op: 'injury', severity: 'light' }, { op: 'log', text: '대숲에서 본 동작을 따라 하다 손목을 삐었다. 붕대를 감고도 다음 수업 때 다시 문틈에서 발의 위치를 살폈다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_shimo_kuina', kind: 'door', when: kidIn(SHIMO, 7, 9, { c: 'turningSeen', id: 'town_shimo_stairs', has: false }), weight: 14, repeat: 'once', speaker: 'hero',
    title: '도장의 소녀 검사', body: '도장에서 가장 센 아이는 사범의 맏이 쿠이나다. 두 살 위의 초록 머리 소년 조로는 날마다 덤볐다가 날마다 진다. 오늘은 쿠이나가 목검 끝으로 {name}을(를) 가리켰다.',
    doors: [
      { label: '목검을 들고 덤빈다', hint: '세 번 덤벼 세 번 바닥에 눕는다. 지는 법을 몸으로 배운다', values: { ambition: D }, mark: 'unyielding',
        fx: [{ op: 'hp', add: -10 }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'log', text: '세 번째로 바닥에 누웠을 때 쿠이나가 목검 끝을 내렸다. {name}은(는) 아픈 팔로 다시 일어나 다음에는 어디서 빗나갔는지 물었다.', weight: 'light' }] },
      { label: '대련을 사양하고 쿠이나와 조로의 승부를 지켜본다', hint: '목검 한 번 들지 않고 하루가 간다. 쿠이나가 {name}을(를) 겁쟁이라 부른다', values: { inquiry: D }, mark: 'composure',
        fx: [{ op: 'mastery', branch: 'observation', add: 6 }, { op: 'log', text: '쿠이나는 겁쟁이라며 돌아섰다. {name}은(는) 조로가 덤빌 때마다 쿠이나가 먼저 옮기는 발을 눈으로 좇았다.', weight: 'light' }] },
      { label: '조로와 손잡고 둘이서 쿠이나에게 덤빈다', hint: '둘이 덤벼도 진다. 조로는 그날부터 {name}을(를) 같이 지는 맞수로 여긴다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'person', kind: 'rival', relation: '도장의 맞수', canon: 'zoro' }, { op: 'log', text: '둘이 함께 덤볐지만 쿠이나의 목검에 차례로 넘어졌다. 조로는 흙을 털며 내일은 둘 중 누가 더 오래 버티는지 겨루자고 했다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_shimo_stairs', kind: 'door', when: kidIn(SHIMO, 9, 10), weight: 20, repeat: 'once', speaker: 'hero',
    title: '계단에서 끝난 약속', body: '쿠이나가 집 계단에서 굴러떨어져 세상을 떠났다. 조로는 그날 밤부터 쿠이나의 칼을 품고 대숲에서 혼자 칼을 휘두른다. 코우시로 사범은 아이들에게 오늘은 수련을 쉬라고만 했다.',
    doors: [
      { label: '대숲에서 조로 곁에 서서 같이 칼을 휘두른다', hint: '말 한마디 없이 밤을 샌다. 손바닥이 터지고, 끝까지 가겠다는 마음이 생긴다', values: { ambition: D }, mark: 'obsession',
        fx: [{ op: 'hp', add: -5 }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'flag', id: 'kuinaNight' }, { op: 'log', text: '조로와 나란히 목검을 휘두르다 날이 밝았다. 서로 말을 건네지 않았지만 터진 손바닥을 감싸며 둘 다 대숲을 떠나지 않았다.', weight: 'heavy' }] },
      { label: '사범의 집 일을 거들며 장례를 돕는다', hint: '도장의 수련은 한 철 멈춘다. 사범이 {name}의 이름을 부른다', values: { peace: D }, mark: 'fellowship',
        fx: [{ op: 'person', kind: 'ally', relation: '도장의 사범', canon: 'koshiro' }, { op: 'log', text: '수련 대신 장례에 쓸 물과 자리를 마련했다. 코우시로는 일을 마친 {name}의 이름을 부르고 잠시 곁에 앉아 달라고 했다.', weight: 'heavy' }] },
      { label: '목검을 돌려주고 도장을 떠난다', hint: '사람이 죽는 칼은 싫다. 다시는 도장 문을 넘지 않는다', when: [{ c: 'anyOf', conditions: [{ c: 'choiceAgo', turning: 'town_shimo_dojo', door: 0 }, { c: 'choiceAgo', turning: 'town_shimo_dojo', door: 1 }] }], values: { peace: D },
        fx: [{ op: 'flag', id: 'leftDojo' }, { op: 'log', text: '목검을 도장 벽에 기대어 놓았다. 안쪽에서 칼 부딪히는 소리가 다시 들리기 전에 {name}은(는) 문턱을 넘어 나왔다.', weight: 'heavy' }, { op: 'timeline', text: '쿠이나가 죽은 뒤 칼을 내려놓았다' }] },
    ],
  },
  {
    id: 'town_shimo_landlord', kind: 'door', when: kidIn(SHIMO, 10, 14, POOR), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '지주의 머슴', body: '빚을 갚지 못한 집은 논 한 마지기를 지주에게 넘겼다. 남은 빚 대신 {name}이(가) 지주 집 머슴으로 들어가게 되었다. 지주의 맏이는 머슴 아이들을 목검으로 때리기로 소문났다.',
    doors: [
      { label: '대숲으로 달아난다', hint: '사흘을 굶고 버티다 붙잡혀 돌아온다. 빚은 한 해치 늘어난다', values: { freedom: D }, mark: 'rebel',
        fx: [{ op: 'hp', add: -10 }, { op: 'hardship', add: 3 }, { op: 'flag', id: 'ranFromLandlord' }, { op: 'log', text: '대숲에서 사흘을 굶다가 지주 집 사람들에게 붙잡혔다. 돌아오자 빚 장부에는 한 해치가 더 적혀 있었다.', weight: 'light' }] },
      { label: '목검을 든 지주의 맏이와 맞붙는다', hint: '머슴이 주인집 아이를 치면 매질이 기다린다. 그래도 맞기만 하지는 않는다', values: { dominion: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'injury', severity: 'light' }, { op: 'mastery', branch: 'sword', add: 6 }, { op: 'log', text: '지주의 맏이와 맞붙었다가 매를 맞고 돌아왔다. 다음 날 다시 목검을 마주했을 때는 어디로 피해야 하는지 한 걸음 먼저 알았다.', weight: 'light' }] },
      { label: '묵묵히 머슴살이를 하며 빚을 갚는다', hint: '삼 년이면 빚이 끝난다. 그동안 도장 근처에는 갈 수 없다', values: { loyalty: D },
        fx: [{ op: 'hp', add: -5 }, { op: 'base', key: 'str', add: 1 }, { op: 'flag', id: 'servedDebt' }, { op: 'log', text: '논일을 마칠 때마다 빚 장부의 줄이 조금씩 지워졌다. 도장에서 목검 소리가 들려도 돌아볼 틈 없이 다시 짐을 들었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'go_shimo', kind: 'door', when: kidIn(SHIMO, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '칼을 멘 열다섯', body: '초록 머리 조로는 칼을 메고 마을을 떠났다. 도장에는 사범 곁을 지킬 사람이 필요하고, 마을 대장간은 칼을 벼릴 견습을 구한다. 부두의 상선은 로그타운까지 간다.',
    doors: [
      { label: '도장에 남아 사범 곁에서 어린 문하생을 가르친다', hint: '사범을 도와 후배들의 연습을 지켜본다', when: [{ c: 'flag', id: 'leftDojo', has: false }, { c: 'anyOf', conditions: [{ c: 'choiceAgo', turning: 'town_shimo_dojo', door: 0 }, { c: 'choiceAgo', turning: 'town_shimo_dojo', door: 1 }] }], values: { loyalty: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'flag', id: 'dojoHeir' }, { op: 'log', text: '코우시로 곁에 서서 어린 문하생들의 자세를 고쳤다. 조로가 떠난 자리는 비었지만 도장의 아침 수련은 계속되었다.', weight: 'light' }] },
      { label: '칼 한 자루를 메고 로그타운으로 간다', hint: '마을을 떠나 큰 항구에서 칼로 먹고살 길을 찾는다', values: { ambition: D },
        fx: leaveTo(LOGUE, '칼 한 자루와 주먹밥 세 개를 들고 상선에 올랐다.', '열다섯에 시모츠키 마을을 떠나 로그타운으로 갔다') },
      { label: '대장간 견습이 되어 칼을 벼린다', hint: '불 앞에서 손에 화상이 는다. 칼을 쥐는 대신 만드는 사람이 된다', values: { inquiry: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'base', key: 'vit', add: 1 }, { op: 'flag', id: 'smithApprentice' }, { op: 'log', text: '대장장이는 칼날을 불에 넣고 빼는 때부터 가르쳤다. {name}은(는) 데인 손을 식히고 다시 숫돌 앞에 앉았다.', weight: 'light' }] },
    ],
  },

  // ---------------------------------------------------------------- 로그타운: 무기점, 항구 (처형대는 childhood.ts의 kid_scaffold)
  {
    id: 'town_logue_ippon', kind: 'door', when: kidIn(LOGUE, 11, 15), weight: 10, repeat: 'once', speaker: 'hero',
    title: '무기점의 견습', body: '로그타운 큰길의 무기점 주인 잇폰마츠가 칼 닦을 아이를 구한다. 해군 순찰이 늘면서, 칼을 사러 오는 손님보다 몰래 칼을 맡기러 오는 손님이 많아졌다.',
    doors: [
      { label: '견습으로 들어가 칼 닦는 일부터 한다', hint: '몇 해는 칼을 닦기만 한다. 좋은 칼과 나쁜 칼을 가리는 눈이 생긴다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 5 }, { op: 'flag', id: 'ipponApprentice' }, { op: 'log', text: '잇폰마츠는 칼날에 남은 흠집을 먼저 보라고 했다. 하루 종일 칼을 닦으며 {name}은(는) 손님마다 맡기는 칼의 무게와 상태를 구분하기 시작했다.', weight: 'light' }] },
      { label: '맡겨진 칼 한 자루를 몰래 빼 들고 광장에서 휘둘러 본다', hint: '진짜 칼의 무게를 손이 기억한다. 들키면 칼값을 물어내야 한다', values: { romance: D }, mark: 'daring',
        fx: [{ op: 'mastery', branch: 'sword', add: 8 },
             { op: 'chance', p: 0.5, then: [{ op: 'log', text: '광장 구석에서 칼을 휘두른 뒤 흠집 없이 칼집에 돌려놓았다. 잇폰마츠는 눈치채지 못했지만 진짜 칼의 무게는 손에 남았다.', weight: 'light' }], else: [{ op: 'money', add: -5000 }, { op: 'log', text: '칼집에 남은 흠집이 들켜 몇 달 치 품삯을 물어냈다.', weight: 'light' }] }] },
      { label: '칼을 맡기러 오는 해적들의 얼굴을 해군 초소에 알린다', hint: '해적 몇이 잡혀간다. 뒷골목이 {name}을(를) 고자질쟁이로 기억한다', values: { justice: D },
        fx: [{ op: 'flag', id: 'informerKid' }, { op: 'chance', p: 0.4, then: [{ op: 'hp', add: -15 }, { op: 'log', text: '뒷골목에서 복면 쓴 사내들에게 둘러싸여 얻어맞았다.', weight: 'heavy' }], else: [{ op: 'log', text: '해군이 해적 몇을 끌고 갔다. 뒷골목 사람들은 누가 초소에 알렸는지 눈치챘지만 그날은 아무도 {name}에게 다가오지 않았다.', weight: 'light' }] }] },
    ],
  },
  {
    id: 'town_logue_docks', kind: 'door', when: kidIn(LOGUE, 10, 14, POOR), weight: 10, repeat: 'once', speaker: { relation: '부두의 우두머리' },
    title: '부두의 우두머리', body: '바람 센 로그타운 항구의 짐꾼 아이들은 덩치 큰 갈로가 다스린다. 품삯의 절반을 바치면 일감을 나눠 주고, 거절한 아이는 부두에서 밀려난다.',
    doors: [
      { label: '혼자 일감을 찾아 항구 끝 부두를 돈다', hint: '일감이 적어 굶는 날이 는다. 누구에게도 바치지 않는다', values: { freedom: D }, closes: true,
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: '항구 끝에서 배가 드문 날에는 빈손으로 돌아왔다. 그래도 갈로의 아이들에게 품삯을 내지 않고 자기 몫의 짐을 직접 찾았다.', weight: 'light' }] },
      { label: '갈로에게 덤빈다', hint: '크게 다친다. 이기든 지든 부두의 아이들이 {name}을(를) 다시 본다', values: { dominion: D }, mark: 'daring', danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'chance', p: 0.4,
               then: [{ op: 'flag', id: 'kidBoss' }, { op: 'log', text: '갈로가 먼저 무릎을 꿇었다. 그날부터 짐꾼 아이들의 일감은 {name}이(가) 나눴다.', weight: 'heavy' }],
               else: [{ op: 'injury', severity: 'light' }, { op: 'log', text: '갈로의 주먹에 부두 바닥을 뒹굴었다.', weight: 'light' }] }] },
      { label: '절반을 바치고 일감을 받는다', hint: '끼니는 해결된다. 갈로의 심부름으로 더 어린아이들의 품삯을 걷게 된다', values: { ambition: D },
        fx: [{ op: 'money', add: 1000 }, { op: 'flag', id: 'galloCollector' }, { op: 'log', text: '갈로는 일감을 나눠 주며 더 어린아이들의 품삯도 걷어 오라고 했다. 배를 채운 저녁, 아이 하나가 {name} 앞에서 동전을 세었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'town_logue_wanted', kind: 'door', when: kidIn(LOGUE, 11, 15), needs: ['parent'], weight: 9, repeat: 'once', speaker: 'hero',
    title: '폭풍 밤의 수배범', body: '폭풍이 몰아친 밤, 부모 한 분이 열이 올라 쓰러졌다. 약을 사러 부두를 달리던 {name}은(는) 상인을 찌르고 달아나는 수배범을 보았다. 사내는 다친 다리를 끌며 처형대 쪽 골목으로 사라졌다.',
    doors: [
      { label: '해군 초소로 달려가 알린다', hint: '사내는 붙잡히고 포상금이 나온다. 약이 늦어 집의 앓는 날이 길어진다', values: { justice: D },
        fx: [{ op: 'money', add: 3000 }, { op: 'hardship', add: 5 }, { op: 'flag', id: 'reportedWanted' }, { op: 'log', text: '해군이 수배범을 잡아 포상금을 건넸다. 약을 들고 집에 돌아왔을 때 부모의 열은 더 올라 있었고, 앓는 날이 길어졌다.', weight: 'heavy' }] },
      { label: '약을 품에 안고 곧장 집으로 돌아간다', hint: '열은 그날 밤 내린다. 사내는 이튿날 아침 항구를 빠져나간다', values: { loyalty: D },
        fx: [{ op: 'flag', id: 'letWantedGo' }, { op: 'log', text: '약을 먹인 뒤 밤새 곁을 지키자 부모의 열이 내렸다. 이튿날 항구에서는 다친 수배범이 배를 타고 사라졌다는 소식이 돌았다.', weight: 'heavy' }] },
      { label: '사내를 직접 뒤쫓는다', hint: '골목에서 사내의 칼이 먼저 나온다. 집은 그 밤 내내 비어 있다', values: { ambition: D }, mark: 'daring', danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'injury', severity: 'light' },
             { op: 'chance', p: 0.4, then: [{ op: 'fame', add: 2 }, { op: 'log', text: '경비대가 올 때까지 사내의 다리를 붙잡고 놓지 않았다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '사내는 골목 끝 어둠 속으로 사라졌다. 피 묻은 소매로 집에 돌아오니 날이 밝아 있었다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'town_logue_trading', kind: 'door', when: kidIn(LOGUE, 10, 14, RICH), needs: ['parent'], weight: 10, repeat: 'once', speaker: 'hero',
    title: '상회의 빚 문서', body: '{name}의 집은 로그타운 항구의 상회다. 계산대 앞에 또래 아이가 서 있다. 자기네 빚을 조금만 덜어 주면 집을 팔고 떠나지 않아도 된다며 동전 몇 닢을 내민다. 빚 문서는 상회 금고 안에 있다.',
    doors: [
      { label: '부모에게 아이네 빚을 덜어 달라고 조른다', hint: '아이는 떠나지 않는다. 그 대가로 몇 해 동안 상회 장부 일에 매인다', values: { loyalty: D }, mark: 'fellowship',
        fx: [{ op: 'money', add: -20000 }, { op: 'person', kind: 'ally', relation: '빚에서 건진 동무' }, { op: 'flag', id: 'tradeBound' }, { op: 'log', text: '부모는 빚을 덜어 주는 대신 상회 장부를 맡겼다. 집에 남게 된 {person:빚에서 건진 동무}이(가) 자기 이름을 알려 주었다. 저녁이면 계산대의 {name}에게 손을 흔들고 지나갔다.', weight: 'heavy' }] },
      { label: '빚 문서의 허점을 찾아 셈을 다시 따진다', hint: '이자가 잘못 붙은 것을 찾으면 빚이 준다. 부모는 상회의 손해를 {name}의 탓으로 돌린다', values: { inquiry: D }, mark: 'composure',
        fx: [{ op: 'base', key: 'int', add: 1 }, { op: 'chance', p: 0.6, then: [{ op: 'log', text: '잘못 붙은 이자를 짚어 냈다. 아이네 빚이 절반으로 줄어 떠나지 않아도 되었다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '셈은 맞았다. 아이는 떠났고, 부모는 한동안 {name}을(를) 상회에 들이지 않았다.', weight: 'light' }] }] },
      { label: '상회 일을 배우며 빚 문서 다루는 법부터 익힌다', hint: '아이는 떠난다. 상회의 후계로 인정받는다', values: { ambition: D },
        fx: [{ op: 'money', add: 5000 }, { op: 'flag', id: 'merchantHeir' }, { op: 'log', text: '아이가 떠나는 배를 배웅한 뒤 상회로 돌아왔다. 부모는 금고 열쇠를 맡기며 이제 장부 일을 배울 때라고 했다.', weight: 'heavy' }] },
    ],
  },
  {
    id: 'go_logue', kind: 'door', when: kidIn(LOGUE, 14, 15), weight: 16, repeat: 'once', speaker: 'hero',
    title: '시작과 끝의 항구에서', body: '처형대 광장의 해군 초소가 잔심부름꾼을 구한다는 방을 붙였다. 장을 보러 온 바다 위 식당 발라티에의 요리사가 잡일꾼을 찾는다. 상점가의 가게들도 열다섯 살 일꾼을 받는다.',
    doors: [
      { label: '해군 초소의 잔심부름꾼이 된다', hint: '광장을 지키는 일을 곁에서 배운다. 해적들이 {name}의 얼굴을 알아 둔다', values: { justice: D },
        fx: [{ op: 'flag', id: 'marinePost' }, { op: 'mastery', branch: 'fist', add: 5 }, { op: 'log', text: '초소에서 서류와 물자를 나르며 순찰 교대 시간을 익혔다. 수배서를 보러 온 해적들이 이제 {name}의 얼굴을 알아보고 눈길을 돌렸다.', weight: 'light' }] },
      { label: '발라티에의 잡일꾼으로 간다', hint: '로그타운을 떠나 바다 한가운데 식당에서 접시를 닦는다', values: { romance: D },
        fx: leaveTo('해상 레스토랑 발라티에', '요리사들의 고함 속에서 첫 접시를 깼다. 바다 위의 식당이 새 집이 되었다.', '열다섯에 로그타운을 떠나 발라티에의 잡일꾼이 되었다') },
      { label: '상점가의 가게에서 일하며 로그타운에 남는다', hint: '열여섯을 기다리지 않고 제 밥벌이를 한다. 큰 항구의 소식이 모두 이 거리를 지나간다', values: { peace: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 3000 }, { op: 'log', text: '상점가의 가게 문을 열고 닫으며 첫 품삯을 받았다. 처형대 광장과 항구를 오가는 사람들의 소식이 매일 계산대 앞에 쌓였다.', weight: 'light' }] },
    ],
  },
];
