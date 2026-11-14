// 곁가지 이야기. 원작에서 짧게 지나가는 사건을 엮었다. 메인(해역 임무 · 보스)이 막혔을 때 능력치를 올리고 돌아오는 길.
// 해적과 해군을 나눴다. 해역에 맞는 것만 뜨고, 한 인생에 한 번씩. 진행하는 동안 해역 임무는 쉰다.
import type { Effect, SeaId, Stats } from '../core/types';

export interface SideFoe {
  name: string; title: string;
  mult: number;                       // 그 해역 강적 힘의 배율
  bias?: Partial<Stats>;
  skills?: string[];
  fruit?: string;                     // 열매 id (그 열매의 앞 기술을 쓴다)
  officers?: { name: string; mult: number; skills?: string[] }[];
  faction: 'pirate' | 'marine' | 'civil' | 'rev';
  canon?: string;
}
export type SideStep =
  | { kind: 'story'; months: number; text: string; effects?: Effect[] }
  | { kind: 'battle'; text: string; foe: SideFoe; atSea?: boolean };

export interface SideStory {
  id: string; title: string; route: 'pirate' | 'marine';
  seas: SeaId[];
  hook: string;                       // 제안할 때의 글
  steps: SideStep[];
  reward: Effect[];
  rewardText: string;
}

const P = (x: Omit<SideStory, 'route'>): SideStory => ({ ...x, route: 'pirate' });
const M = (x: Omit<SideStory, 'route'>): SideStory => ({ ...x, route: 'marine' });
const EAST: SeaId[] = ['east', 'west', 'north', 'south'];

export const SIDE_STORIES: SideStory[] = [
  // ======================================================== 해적
  P({ id: 'sp_kuro', title: '시럽 마을의 집사', seas: EAST,
    hook: '시럽 마을의 코 긴 소년이 울먹이며 매달린다. "아가씨네 집사가 사실 해적이야! 아무도 내 말을 안 믿어!"',
    steps: [
      { kind: 'story', months: 2, text: '언덕 위 저택을 지켜보다가, 집사가 해적들과 몰래 만나는 장면을 엿들었다. "내일 새벽, 아가씨의 유산을 차지한다."' },
      { kind: 'story', months: 1, text: '새벽, 비탈길에서 검은 고양이 해적단이 몰려왔다. 소년과 함께 길목을 막았다.', effects: [{ op: 'base', key: 'spd', add: 1 }] },
      { kind: 'battle', text: '안경을 손바닥으로 밀어 올리는 집사가 칼날 달린 장갑을 꼈다. "백 가지 계획 중 하나가 어긋났군."',
        foe: { name: '백계의 쿠로', title: '검은 고양이 해적단 전 선장', mult: 1.05, bias: { spd: 1.5, vit: 0.8 }, skills: ['sword_flash', 'sword_draw', 'fist_combo'], faction: 'pirate', canon: 'kuro',
          officers: [{ name: '냥반 형제 시암', mult: 0.7, skills: ['fist_jab'] }] } },
    ],
    reward: [{ op: 'base', key: 'spd', add: 3 }, { op: 'base', key: 'wil', add: 2 }, { op: 'mastery', skill: 'focus', add: 8 }, { op: 'money', add: 10000 }, { op: 'fame', add: 6 }],
    rewardText: '아가씨는 무사했고, 소년은 "나도 언젠가 바다로 나갈 거야"라며 웃었다.' }),
  P({ id: 'sp_baratie', title: '해상 레스토랑의 습격', seas: EAST,
    hook: '해상 레스토랑 발라티에에 굶주린 해적 함대가 쳐들어온다는 소문이다. 요리장은 손님을 내보내지 않겠다고 버틴다.',
    steps: [
      { kind: 'story', months: 2, text: '요리사들과 함께 바다 위 레스토랑에서 지냈다. 다리로만 싸우는 금발 요리사가 "음식은 사람을 살리는 거야"라고 했다.', effects: [{ op: 'hp', add: 15 }] },
      { kind: 'battle', atSea: true, text: '거대한 갤리선이 다가왔다. 온몸에 무기를 두른 제독이 갑판에 내려섰다. "이 배를 내놓아라!"',
        foe: { name: '수괴 돈 크리크', title: '크리크 해적 함대 제독', mult: 1.15, bias: { vit: 1.4, str: 1.2 }, skills: ['gun_shot', 'gun_volley', 'fist_iron', 'fist_combo'], faction: 'pirate', canon: 'krieg',
          officers: [{ name: '귀인 긴', mult: 0.8, skills: ['fist_jab', 'fist_combo'] }, { name: '철벽의 펄', mult: 0.7, skills: ['fist_guard', 'fist_jab'] }] } },
    ],
    reward: [{ op: 'base', key: 'vit', add: 3 }, { op: 'base', key: 'str', add: 2 }, { op: 'mastery', skill: 'focus', add: 8 }, { op: 'item', id: 'meat', count: 3 }, { op: 'fame', add: 8 }],
    rewardText: '요리장이 고맙다며 배가 터지도록 먹여 주었다. "언제든 배고프면 오너라."' }),
  P({ id: 'sp_littlegarden', title: '리틀 가든의 백 년 결투', seas: ['gl_entry'],
    hook: '태고의 섬 리틀 가든에서 두 거인이 백 년째 결투를 하고 있다. 그런데 누군가 몰래 결투를 더럽히려 한다는 소문이다.',
    steps: [
      { kind: 'story', months: 2, text: '거인 동리와 브로기를 만났다. 둘은 이유도 잊은 채 백 년을 싸워 왔지만, 서로를 누구보다 존중했다.', effects: [{ op: 'base', key: 'wil', add: 1 }] },
      { kind: 'story', months: 1, text: '거인의 술통에 폭탄이 숨겨져 있었다. 밀랍으로 만든 촛불 같은 탑이 섬 한가운데 솟아 있었다.' },
      { kind: 'battle', text: '머리에 숫자 3을 단 사내가 밀랍으로 만든 갑옷을 둘렀다. "결투? 내 예술 작품의 소재일 뿐이지."',
        foe: { name: '미스터 3', title: '바로크 워크스 간부', mult: 1.05, bias: { int: 1.4 }, fruit: 'doru', faction: 'civil', canon: 'mr3',
          officers: [{ name: '미스 골든위크', mult: 0.7, skills: ['gun_smoke'] }] } },
    ],
    reward: [{ op: 'base', key: 'str', add: 3 }, { op: 'base', key: 'wil', add: 3 }, { op: 'mastery', skill: 'focus', add: 10 }, { op: 'fame', add: 10 }],
    rewardText: '두 거인이 결투를 이어 가며 함께 웃었다. "엘바프의 전사는 은혜를 잊지 않는다!"' }),
  P({ id: 'sp_whiskey', title: '위스키 피크의 환영 파티', seas: ['gl_entry'],
    hook: '위스키 피크 사람들이 해적을 열렬히 환영한다며 성대한 파티를 열어 준다고 한다. 어딘가 수상하다.',
    steps: [
      { kind: 'story', months: 1, text: '밤새 술과 노래가 이어졌다. 취한 척 눈을 감자, 마을 사람들이 밧줄과 칼을 꺼내 들었다.' },
      { kind: 'battle', text: '마을 전체가 현상금 사냥꾼이었다. 롤빵 머리의 신사가 첼로를 들고 앞에 섰다.',
        foe: { name: '이가람', title: '위스키 피크 촌장 (현상금 사냥꾼)', mult: 1.0, bias: { int: 1.2 }, skills: ['gun_shot', 'gun_quick', 'gun_snipe'], faction: 'civil', canon: 'igaram',
          officers: [{ name: '미스터 9', mult: 0.6, skills: ['fist_jab'] }, { name: '미스 먼데이', mult: 0.65, skills: ['fist_combo'] }] } },
    ],
    reward: [{ op: 'base', key: 'int', add: 3 }, { op: 'base', key: 'spd', add: 2 }, { op: 'mastery', skill: 'focus', add: 8 }, { op: 'money', add: 25000 }],
    rewardText: '사냥꾼들은 사실 한 나라를 구하려 숨어든 사람들이었다. 이가람이 깊이 고개를 숙였다.' }),
  P({ id: 'sp_jaya', title: '하늘섬으로 가는 지도', seas: ['gl_first'],
    hook: '자야의 해안에서 금빛 성을 그린 옛 지도를 가진 노인 크리켓을 만났다. "하늘섬은 정말 있다. 거짓말쟁이 몽블랑 놀란드의 말은 진짜였어."',
    steps: [
      { kind: 'story', months: 3, text: '크리켓과 원숭이 형제들과 함께 바다 밑을 뒤졌다. 해저에서 황금 종의 흔적을 찾았다.', effects: [{ op: 'base', key: 'vit', add: 1 }] },
      { kind: 'battle', text: '꿈을 비웃는 해적이 크리켓의 집을 부수고 금을 빼앗아 갔다. "꿈 같은 소리를 하는 놈들은 시대에 뒤처진 거다!"',
        foe: { name: '하이에나 벨라미', title: '벨라미 해적단 선장', mult: 1.05, bias: { spd: 1.3 }, fruit: 'bari', faction: 'pirate', canon: 'bellamy',
          officers: [{ name: '사킷', mult: 0.75, skills: ['sword_cut', 'sword_flash'] }] } },
    ],
    reward: [{ op: 'base', key: 'wil', add: 3 }, { op: 'base', key: 'luk', add: 3 }, { op: 'mastery', skill: 'focus', add: 10 }, { op: 'money', add: 40000 }],
    rewardText: '빼앗긴 금을 돌려주자 크리켓이 웃었다. "꿈을 비웃는 놈들에게 지지 마라."' }),
  P({ id: 'sp_auction', title: '샤본디의 인간 경매장', seas: ['sabaody'],
    hook: '샤본디 제도의 인간 경매장에 인어 소녀가 상품으로 올랐다고 한다. 천룡인들이 값을 부르고 있다.',
    steps: [
      { kind: 'story', months: 1, text: '경매장 뒷문으로 숨어들었다. 무대 위 수조 안에서 인어 소녀가 떨고 있었다.' },
      { kind: 'battle', text: '경매장의 경비대장이 앞을 막았다. 바깥에서는 해군 대장이 온다는 소문이 돌았다.',
        foe: { name: '경매장 경비대장 디스코', title: '인간 경매장 사회자', mult: 1.1, bias: { vit: 1.2 }, skills: ['gun_snipe', 'gun_volley', 'fist_guard'], faction: 'civil',
          officers: [{ name: '경매장 경비병', mult: 0.7, skills: ['gun_shot'] }, { name: '경매장 경비병', mult: 0.7, skills: ['gun_shot'] }] } },
      { kind: 'story', months: 1, text: '인어 소녀를 수조째 들고 도망쳤다. 뒤에서 대장의 빛이 번쩍였다.', effects: [{ op: 'fame', add: 15 }] },
    ],
    reward: [{ op: 'base', key: 'str', add: 4 }, { op: 'base', key: 'spd', add: 3 }, { op: 'mastery', skill: 'focus', add: 12 }, { op: 'fame', add: 15 }],
    rewardText: '어인섬까지 데려다주자 인어들이 진주 목걸이를 걸어 주었다. 현상금이 껑충 뛰었다.' }),
  P({ id: 'sp_thriller', title: '스릴러 바크의 그림자', seas: ['sabaody'],
    hook: '안개 낀 바다에서 거대한 유령선이 나타났다. 거기 끌려간 선원들이 그림자를 빼앗긴 채 돌아왔다.',
    steps: [
      { kind: 'story', months: 2, text: '유령선 안은 좀비투성이였다. 아프로 머리의 해골 음악가가 바이올린을 켜며 "요호호" 웃었다.', effects: [{ op: 'base', key: 'wil', add: 1 }] },
      { kind: 'battle', text: '그림자를 훔치는 거대한 사내가 가위를 들었다. "네 그림자도 내 군대에 넣어 주마."',
        foe: { name: '겟코 모리아', title: '칠무해', mult: 1.2, bias: { vit: 1.5, int: 1.2 }, skills: ['fist_combo', 'fist_quake', 'fist_iron'], faction: 'pirate', canon: 'moria',
          officers: [{ name: '좀비 장군 류마', mult: 0.85, skills: ['sword_draw', 'sword_flash', 'sword_finish'] }] } },
    ],
    reward: [{ op: 'base', key: 'wil', add: 4 }, { op: 'base', key: 'vit', add: 3 }, { op: 'mastery', skill: 'focus', add: 12 }, { op: 'fame', add: 12 }],
    rewardText: '해가 뜨기 전에 그림자들이 주인에게 돌아갔다. 해골 음악가가 감사의 노래를 불러 주었다.' }),
  P({ id: 'sp_punkhazard', title: '펑크 해저드의 아이들', seas: ['nw_first'],
    hook: '불타는 섬과 얼어붙은 섬이 붙은 펑크 해저드. 연구소 안에 거인처럼 커져 버린 아이들이 갇혀 있다고 한다.',
    steps: [
      { kind: 'story', months: 2, text: '연구소 안의 아이들은 "집에 가고 싶어"라며 울었다. 매일 먹은 사탕에 약이 섞여 있었다.' },
      { kind: 'battle', text: '가스를 뿜는 과학자가 웃었다. "슈로로로… 내 실험체를 데려가겠다고?"',
        foe: { name: '시저 클라운', title: '미친 과학자', mult: 1.15, bias: { int: 1.5 }, fruit: 'moku', faction: 'civil', canon: 'caesar',
          officers: [{ name: '설녀 모네', mult: 0.85, skills: ['fist_combo'] }] } },
    ],
    reward: [{ op: 'base', key: 'int', add: 4 }, { op: 'base', key: 'wil', add: 4 }, { op: 'mastery', skill: 'focus', add: 14 }, { op: 'fame', add: 15 }],
    rewardText: '아이들을 해군 G-5에 맡겨 고향으로 보냈다. 아이들이 그린 네 얼굴 그림을 받았다.' }),

  // ======================================================== 해군
  M({ id: 'sm_nezumi', title: '썩은 대령의 장부', seas: EAST,
    hook: '코노미 제도 주재소의 대령이 해적에게 뇌물을 받고 마을을 눈감아 준다는 투서가 들어왔다. 조사 임무가 떨어졌다.',
    steps: [
      { kind: 'story', months: 2, text: '귤 농장 마을 사람들의 이야기를 들었다. 해적이 들어와도 해군은 오지 않았다고 한다.', effects: [{ op: 'base', key: 'int', add: 1 }] },
      { kind: 'story', months: 1, text: '대령의 금고에서 해적에게 받은 돈의 장부를 찾았다. "쥐도 새도 모르게…"' },
      { kind: 'battle', text: '들킨 대령이 부하들을 불러 모았다. "본부에 보고하기 전에 입을 막아라!"',
        foe: { name: '쥐 대령 네즈미', title: '제16지부 대령', mult: 1.0, bias: { int: 1.2, vit: 0.9 }, skills: ['sword_cut', 'gun_shot', 'gun_smoke'], faction: 'marine', canon: 'nezumi',
          officers: [{ name: '부패한 부관', mult: 0.7, skills: ['sword_cut'] }] } },
    ],
    reward: [{ op: 'base', key: 'int', add: 3 }, { op: 'base', key: 'wil', add: 2 }, { op: 'mastery', skill: 'focus', add: 8 }, { op: 'fame', add: 10 }, { op: 'rank', add: 1 }],
    rewardText: '장부가 본부에 올라가 대령은 해임되었다. 마을 사람들이 처음으로 해군에게 웃어 주었다.' }),
  M({ id: 'sm_loguetown', title: '로그타운 처형대', seas: EAST,
    hook: '해적왕이 처형된 로그타운 광장에서 해적들이 처형대를 부수겠다는 협박장을 보냈다. 경비 임무가 내려왔다.',
    steps: [
      { kind: 'story', months: 2, text: '시가를 문 대령 밑에서 광장을 경비했다. "해적은 이 섬을 지나 위대한 항로로 간다. 여기서 막아야 한다."', effects: [{ op: 'base', key: 'vit', add: 1 }] },
      { kind: 'battle', text: '폭풍우 치는 밤, 해적들이 처형대에 불을 질렀다. 광대 분장의 선장이 칼을 휘둘렀다.',
        foe: { name: '광대 버기', title: '버기 해적단 선장', mult: 1.0, bias: { spd: 1.2 }, fruit: 'bara', faction: 'pirate', canon: 'buggy',
          officers: [{ name: '맹수 조련사 모지', mult: 0.7, skills: ['fist_jab'] }, { name: '곡예사 카바지', mult: 0.7, skills: ['sword_cut'] }] } },
    ],
    reward: [{ op: 'base', key: 'vit', add: 3 }, { op: 'base', key: 'str', add: 2 }, { op: 'mastery', skill: 'focus', add: 8 }, { op: 'fame', add: 8 }, { op: 'money', add: 8000 }],
    rewardText: '처형대는 무사했다. 대령이 시가 연기를 내뿜으며 "쓸 만하군" 하고 지나갔다.' }),
  M({ id: 'sm_drum', title: '드럼 왕국의 폭군', seas: ['gl_entry'],
    hook: '눈의 나라 드럼 왕국에서 나라를 버리고 도망친 왕이 해적을 데리고 돌아왔다. 백성들이 해군에 도움을 청했다.',
    steps: [
      { kind: 'story', months: 2, text: '눈보라 속에서 마을 사람들을 성 아래 동굴로 피신시켰다. 늙은 마녀 의사가 술병을 들고 웃었다.', effects: [{ op: 'base', key: 'vit', add: 1 }] },
      { kind: 'battle', text: '무엇이든 먹어 치우는 왕이 대포를 삼켰다. "백성? 다 내 거다!"',
        foe: { name: '양철 와포루', title: '드럼 왕국의 폭군', mult: 1.05, bias: { vit: 1.3, str: 1.2 }, skills: ['fist_jab', 'fist_combo', 'fist_iron'], faction: 'civil', canon: 'wapol',
          officers: [{ name: '체스', mult: 0.7, skills: ['gun_shot'] }, { name: '쿠로마리모', mult: 0.7, skills: ['fist_jab'] }] } },
    ],
    reward: [{ op: 'base', key: 'vit', add: 3 }, { op: 'base', key: 'wil', add: 3 }, { op: 'mastery', skill: 'focus', add: 10 }, { op: 'fame', add: 10 }, { op: 'item', id: 'potion', count: 3 }],
    rewardText: '성 꼭대기에 분홍 벚꽃 같은 눈이 흩날렸다. 백성들이 새 나라를 세우겠다고 했다.' }),
  M({ id: 'sm_baroque', title: '바로크 워크스 잠입', seas: ['gl_entry', 'gl_first'],
    hook: '위대한 항로 곳곳에서 숫자로 불리는 비밀 조직이 움직인다. 정체를 캐내라는 비밀 명령이 떨어졌다.',
    steps: [
      { kind: 'story', months: 3, text: '현상금 사냥꾼으로 위장해 조직의 말단에 들어갔다. 보스의 정체는 칠무해라는 소문이 돌았다.', effects: [{ op: 'base', key: 'int', add: 2 }] },
      { kind: 'battle', text: '정체가 들통났다. 발레 슈즈를 신은 오카마 간부가 빙글빙글 돌며 다가왔다. "친구라도 봐주지 않아!"',
        foe: { name: '미스터 2 봉 클레이', title: '바로크 워크스 간부', mult: 1.1, bias: { spd: 1.3 }, skills: ['fist_jab', 'fist_combo', 'fist_counter'], faction: 'civil', canon: 'bonclay' } },
    ],
    reward: [{ op: 'base', key: 'int', add: 3 }, { op: 'base', key: 'spd', add: 3 }, { op: 'mastery', skill: 'focus', add: 10 }, { op: 'fame', add: 12 }, { op: 'rank', add: 1 }],
    rewardText: '빼낸 정보가 본부로 올라갔다. 봉 클레이는 "다음에 만나면 친구야!"라며 사라졌다.' }),
  M({ id: 'sm_watervii', title: '아쿠아 라구나 피난', seas: ['gl_first'],
    hook: '물의 도시 워터 세븐에 해마다 오는 거대한 해일, 아쿠아 라구나가 다가온다. 주민 피난을 도우라는 명령이다.',
    steps: [
      { kind: 'story', months: 1, text: '시장 아이스버그와 함께 뒷골목 주민들을 고지대로 옮겼다. 해일이 다가오는 소리가 땅을 울렸다.', effects: [{ op: 'base', key: 'str', add: 1 }] },
      { kind: 'battle', atSea: true, text: '해일 틈을 노려 빈집을 터는 해적단이 나타났다. "지금이 기회다!"',
        foe: { name: '「해일」 도적단 두목', title: '빈집털이 해적', mult: 1.05, skills: ['sword_cut', 'sword_wave', 'gun_volley'], faction: 'pirate',
          officers: [{ name: '도적단 부두목', mult: 0.75, skills: ['fist_jab', 'fist_combo'] }] } },
    ],
    reward: [{ op: 'base', key: 'str', add: 3 }, { op: 'base', key: 'vit', add: 3 }, { op: 'mastery', skill: 'focus', add: 10 }, { op: 'fame', add: 10 }],
    rewardText: '해일이 지나간 도시에 아무도 다치지 않았다. 조선공들이 "해군도 괜찮은 놈들이 있군" 하며 술을 샀다.' }),
  M({ id: 'sm_impel', title: '임펠 다운 호송', seas: ['sabaody'],
    hook: '거물 해적을 바다 밑 대감옥 임펠 다운으로 호송하는 임무다. 호송선을 노리는 해적들이 있다고 한다.',
    steps: [
      { kind: 'story', months: 2, text: '호송선이 칼름 벨트를 지났다. 바다 밑에서 해왕류들이 배를 올려다보았다.', effects: [{ op: 'base', key: 'wil', add: 1 }] },
      { kind: 'battle', atSea: true, text: '죄수를 빼내려는 해적단이 호송선에 올라탔다.',
        foe: { name: '「쇠사슬」 바르토', title: '탈옥 청부 해적', mult: 1.1, bias: { str: 1.2 }, skills: ['fist_combo', 'fist_quake', 'arm_strike'], faction: 'pirate',
          officers: [{ name: '탈옥 청부인', mult: 0.75, skills: ['gun_snipe'] }, { name: '탈옥 청부인', mult: 0.75, skills: ['sword_flash'] }] } },
      { kind: 'story', months: 1, text: '독의 감옥장이 호송선을 맞이했다. "수고했다. 여기서부터는 내 일이다."' },
    ],
    reward: [{ op: 'base', key: 'wil', add: 4 }, { op: 'base', key: 'str', add: 3 }, { op: 'mastery', skill: 'focus', add: 12 }, { op: 'fame', add: 15 }, { op: 'rank', add: 1 }],
    rewardText: '호송은 무사히 끝났다. 감옥장이 독이 든 줄도 모르는 차를 권했다. 사양했다.' }),
  M({ id: 'sm_tenryu', title: '천룡인 호위', seas: ['sabaody'],
    hook: '샤본디 제도를 행차하는 천룡인을 호위하라는 명령이다. 길에서 사람들이 무릎을 꿇는다.',
    steps: [
      { kind: 'story', months: 1, text: '천룡인이 지나가던 사람에게 총을 겨눴다. 호위인 너는 지켜볼 수밖에 없었다… 혹은?', effects: [{ op: 'base', key: 'wil', add: 2 }] },
      { kind: 'battle', text: '그 틈에 천룡인을 노린 무법자들이 들이닥쳤다. 지켜야 할 것이 무엇인지 헷갈리는 싸움이었다.',
        foe: { name: '해방의 칼날', title: '천룡인 습격범', mult: 1.1, bias: { spd: 1.3 }, skills: ['sword_flash', 'sword_wave', 'obs_strike'], faction: 'rev',
          officers: [{ name: '습격범', mult: 0.75, skills: ['gun_snipe'] }] } },
    ],
    reward: [{ op: 'base', key: 'wil', add: 4 }, { op: 'base', key: 'spd', add: 3 }, { op: 'mastery', skill: 'focus', add: 12 }, { op: 'fame', add: 12 }, { op: 'money', add: 50000 }],
    rewardText: '천룡인은 고맙다는 말 한마디 없었다. 대신 습격범 하나가 사라지기 전에 남긴 말이 귀에 남았다. "정의는 누구 편이지?"' }),
  M({ id: 'sm_g5', title: 'G-5 지부의 골칫덩이', seas: ['nw_first'],
    hook: '신세계의 G-5 지부는 해군 중에서도 거칠기로 유명하다. 지원 명령을 받고 가 보니 해적보다 무서운 병사들이 기다린다.',
    steps: [
      { kind: 'story', months: 2, text: '"본부 놈이 왔다!" 병사들이 시비를 걸었다. 주먹다짐 끝에 겨우 인정받았다. 시가를 문 중장이 이곳 지휘관이었다.', effects: [{ op: 'base', key: 'str', add: 2 }] },
      { kind: 'battle', atSea: true, text: '지부를 노린 신세계 해적단이 쳐들어왔다. G-5 병사들이 "우리 지부는 우리가 지킨다!"며 함께 섰다.',
        foe: { name: '「역병」 카르텔', title: '신세계 해적단 선장', mult: 1.15, bias: { vit: 1.2 }, fruit: 'doku', faction: 'pirate',
          officers: [{ name: '독안개 부선장', mult: 0.8, skills: ['gun_volley', 'gun_smoke'] }] } },
    ],
    reward: [{ op: 'base', key: 'str', add: 4 }, { op: 'base', key: 'vit', add: 4 }, { op: 'mastery', skill: 'focus', add: 14 }, { op: 'fame', add: 15 }, { op: 'rank', add: 1 }],
    rewardText: 'G-5 병사들이 "다음에도 와라, 본부 놈!"이라며 등을 두드렸다.' }),

  // ======================================================== 임펠 다운 · 정상 전쟁 (큰 이야기)
  P({ id: 'sp_impeldown', title: '대감옥 임펠 다운', seas: ['sabaody', 'nw_first'],
    hook: '흰수염 해적단 2번대 대장이 바다 밑 대감옥 임펠 다운에 갇혔다. 공개 처형 날짜가 발표되었다. 감옥에 숨어들 길을 안다는 오카마가 손짓한다.',
    steps: [
      { kind: 'story', months: 1, text: '해군 군함 밑바닥에 숨어 칼름 벨트를 건넜다. 바다 밑으로 내려가는 거대한 문이 열렸다.' },
      { kind: 'story', months: 1, text: '레벨 1 진홍 지옥 — 칼날 숲. 레벨 2 맹수 지옥 — 괴물들. 발바닥이 찢어지도록 내려갔다.', effects: [{ op: 'hp', add: -15 }, { op: 'base', key: 'vit', add: 1 }] },
      { kind: 'battle', text: '레벨 3 굶주림 지옥. 채찍을 든 간수장이 웃었다. "죄수가 내려오다니, 즐겁네!"',
        foe: { name: '고문 간수장 사디짱', title: '임펠 다운 간수장', mult: 1.15, bias: { spd: 1.3 }, skills: ['gun_bind', 'fist_combo', 'gun_quick'], faction: 'marine', canon: 'sadi',
          officers: [{ name: '옥졸수 미노타우로스', mult: 0.9, skills: ['fist_quake', 'fist_iron'] }] } },
      { kind: 'story', months: 1, text: '레벨 4 초열 지옥. 그러나 2번대 대장은 이미 마린포드로 이송된 뒤였다. 남은 길은 탈옥뿐.', effects: [{ op: 'base', key: 'wil', add: 2 }] },
      { kind: 'battle', text: '독의 구름이 복도를 메웠다. 감옥장 본인이 앞을 막았다. "여기서 나간 놈은 없다."',
        foe: { name: '독의 마젤란', title: '임펠 다운 감옥장', mult: 1.35, bias: { vit: 1.4, int: 1.3 }, fruit: 'doku', faction: 'marine', canon: 'magellan',
          officers: [{ name: '부감옥장 한니발', mult: 0.85, skills: ['fist_guard', 'fist_combo'] }] } },
      { kind: 'story', months: 1, text: '탈옥수들과 함께 정의의 문을 부수고 바다로 뛰쳐나왔다. 임펠 다운 역사상 첫 대탈옥이었다.', effects: [{ op: 'fame', add: 30 }, { op: 'flag', id: 'impel_escape' }] },
    ],
    reward: [{ op: 'base', key: 'vit', add: 6 }, { op: 'base', key: 'wil', add: 5 }, { op: 'base', key: 'str', add: 3 }, { op: 'mastery', skill: 'focus', add: 18 }, { op: 'fame', add: 25 }],
    rewardText: '현상금이 몇 배로 뛰었다. 탈옥수 가운데 몇몇이 "이 은혜는 잊지 않는다"며 고개를 숙였다.' }),
  P({ id: 'sp_marineford', title: '정상 전쟁', seas: ['sabaody', 'nw_first'],
    hook: '해군 본부 마린포드에서 「불주먹」의 공개 처형이 열린다. 흰수염 해적단과 산하 해적 마흔세 척이 해군 본부로 쳐들어간다. 너도 그 싸움에 뛰어들 것인가?',
    steps: [
      { kind: 'story', months: 1, text: '마린포드 앞바다가 해적선으로 가득 찼다. 처형대 위에서 주근깨 청년이 고개를 숙이고 있었다. 세상 사람들이 영상 전전충을 지켜보았다.', effects: [{ op: 'base', key: 'wil', add: 2 }] },
      { kind: 'battle', atSea: true, text: '얼어붙은 만 위를 달렸다. 해군 중장들이 진을 치고 있었다. "해적 한 놈도 광장에 들이지 마라!"',
        foe: { name: '해군 중장 모모우사기', title: '본부 중장', mult: 1.2, skills: ['sword_flash', 'sword_wave', 'arm_strike', 'arm_hard'], faction: 'marine',
          officers: [{ name: '본부 중장', mult: 0.85, skills: ['fist_combo', 'arm_strike'] }, { name: '퍼시피스타', mult: 0.85, skills: ['gun_snipe', 'gun_volley'] }] } },
      { kind: 'story', months: 1, text: '포위벽이 솟아올랐다. 하늘에서 군함이 떨어지고, 임펠 다운의 탈옥수들이 끼어들었다. 처형대가 바로 저기였다.', effects: [{ op: 'hp', add: -10 }] },
      { kind: 'battle', text: '빛의 속도로 발차기가 날아왔다. "이거 참 무섭네~"',
        foe: { name: '해군 대장 키자루', title: '본부 대장', mult: 1.4, bias: { spd: 1.5 }, fruit: 'pika', faction: 'marine', canon: 'kizaru' } },
      { kind: 'story', months: 1, text: '불주먹은 풀려났다. 그러나 마그마의 주먹이 동생을 감싼 그의 가슴을 꿰뚫었다. "사랑해 줘서… 고마워." 흰수염도 선 채로 숨을 거두었다. 빨간 머리의 사황이 나타나 전쟁을 끝냈다.',
        effects: [{ op: 'base', key: 'wil', add: 3 }, { op: 'flag', id: 'saw_marineford' }] },
    ],
    reward: [{ op: 'base', key: 'wil', add: 6 }, { op: 'base', key: 'str', add: 5 }, { op: 'base', key: 'spd', add: 4 }, { op: 'mastery', skill: 'focus', add: 20 }, { op: 'fame', add: 40 }],
    rewardText: '바다는 새 시대로 넘어갔다. 살아남은 자들의 현상금이 모두 크게 뛰었다. 너의 이름도 그 명단에 있었다.' }),

  M({ id: 'sm_impelriot', title: '임펠 다운 대탈옥', seas: ['sabaody', 'nw_first'],
    hook: '바다 밑 대감옥 임펠 다운에 침입자가 들었고, 죄수들이 들고일어났다. 본부가 지원 병력을 급히 보낸다.',
    steps: [
      { kind: 'story', months: 1, text: '정의의 문을 지나 감옥에 도착했다. 아래층에서 죄수들의 함성이 울려 올라왔다.' },
      { kind: 'battle', text: '레벨 4 계단에서 탈옥수들이 몰려 올라왔다. 앞장선 건 머리가 큰 오카마 왕이었다.',
        foe: { name: '기적의 이완코프', title: '오카마 왕 · 혁명군 간부', mult: 1.25, bias: { wil: 1.3, vit: 1.2 }, skills: ['fist_combo', 'fist_quake', 'con_burst'], faction: 'rev', canon: 'ivankov',
          officers: [{ name: '탈옥수 이나즈마', mult: 0.85, skills: ['sword_cut', 'sword_flash'] }] } },
      { kind: 'battle', atSea: true, text: '정의의 문 앞. 탈옥수들이 훔친 군함으로 달아나려 한다. 모래의 칠무해와 어인 무인도 섞여 있었다.',
        foe: { name: '사막의 왕 크로커다일', title: '탈옥수 · 전 칠무해', mult: 1.3, bias: { int: 1.3 }, fruit: 'suna', faction: 'pirate', canon: 'crocodile' } },
      { kind: 'story', months: 1, text: '탈옥수 절반은 놓쳤지만 감옥은 지켰다. 감옥장이 독에 지친 얼굴로 "수고했다"고 했다.', effects: [{ op: 'fame', add: 15 }] },
    ],
    reward: [{ op: 'base', key: 'vit', add: 5 }, { op: 'base', key: 'wil', add: 5 }, { op: 'mastery', skill: 'focus', add: 16 }, { op: 'fame', add: 20 }, { op: 'rank', add: 1 }],
    rewardText: '감옥장의 추천서가 본부에 올라갔다. 정의의 문을 지킨 해군으로 이름이 남았다.' }),
  M({ id: 'sm_marineford', title: '정상 전쟁', seas: ['sabaody', 'nw_first'],
    hook: '해군 본부 마린포드. 「불주먹」의 공개 처형에 흰수염 해적단이 쳐들어온다. 전 해군에 총동원령이 내려졌다. 너의 분대도 광장 방어선에 선다.',
    steps: [
      { kind: 'story', months: 1, text: '원수가 처형대 위에서 연설했다. 해군 대장 셋이 그 아래에 앉아 있었다. 만을 메운 해적선이 수평선을 가렸다.', effects: [{ op: 'base', key: 'wil', add: 2 }] },
      { kind: 'battle', atSea: true, text: '흰수염이 공기를 깨뜨리자 해일이 일었다. 얼어붙은 바다 위로 산하 해적들이 몰려왔다.',
        foe: { name: '산하 해적 선장 스쿼드', title: '대도 · 흰수염 산하', mult: 1.2, bias: { str: 1.3 }, skills: ['sword_wave', 'sword_flash', 'arm_strike'], faction: 'pirate', canon: 'squard',
          officers: [{ name: '산하 해적', mult: 0.8, skills: ['gun_volley'] }, { name: '산하 해적', mult: 0.8, skills: ['fist_combo'] }] } },
      { kind: 'story', months: 1, text: '포위벽이 올라갔지만 해적들은 멈추지 않았다. 밀짚모자의 소년이 처형대를 향해 달렸다.', effects: [{ op: 'hp', add: -10 }] },
      { kind: 'battle', text: '푸른 불꽃의 새가 광장에 내려앉았다. 아무리 베어도 상처가 불꽃으로 아물었다.',
        foe: { name: '불사조 마르코', title: '흰수염 해적단 1번대 대장', mult: 1.4, bias: { vit: 1.3, spd: 1.2 }, fruit: 'tori_phoenix', faction: 'pirate', canon: 'marco' } },
      { kind: 'story', months: 1, text: '불주먹이 쓰러지고, 흰수염도 선 채로 숨을 거두었다. 빨간 머리의 사황이 "이 전쟁을 끝내러 왔다"며 나타났다. 원수는 이를 받아들였다.',
        effects: [{ op: 'base', key: 'wil', add: 3 }, { op: 'flag', id: 'saw_marineford' }] },
    ],
    reward: [{ op: 'base', key: 'wil', add: 6 }, { op: 'base', key: 'vit', add: 5 }, { op: 'base', key: 'str', add: 4 }, { op: 'mastery', skill: 'focus', add: 20 }, { op: 'fame', add: 30 }, { op: 'rank', add: 2 }],
    rewardText: '전쟁은 끝났다. 해군 본부는 신세계로 옮겨 가고, 살아남은 병사들은 저마다 무엇이 정의였는지 곱씹었다. 너는 두 계급 진급했다.' }),
];

export const SIDE_BY_ID = Object.fromEntries(SIDE_STORIES.map((x) => [x.id, x])) as Record<string, SideStory>;
