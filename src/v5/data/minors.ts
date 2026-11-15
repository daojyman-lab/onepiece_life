// 자잘한 일 (설계 5.2 분류표: 일상의 다툼과 화해, 부탁, 잡졸과의 시비, 장비 교체, 치료, 작은 내기, 생활비, 어느 일을 맡을지).
// 되돌릴 수 없는 일은 자잘한 일이 아니다: fx에 standing, loseLimb, die, fight를 쓰지 않는다.
// 기록이 한 줄로 끝나도록 스스로 기록을 남기는 효과(log, mark, mastery)도 쓰지 않는다.
// 결과마다 lean이 가치관 쪽으로 기울이고, lean이 빈 결과는 누구에게나 일어날 수 있다.
// id는 전환점과 seen을 함께 쓰므로 'm_'로 시작한다 (술집 시비 'brawl'만 예외).
// 자리표시: {name} 이름만, {town} 자란 마을, {island} 지금 있는 섬
import type { Cond, Minor, Standing } from '../core/types';

const kid: Cond = { c: 'age', min: 3, max: 15 };
const adult: Cond = { c: 'age', min: 16 };
const old: Cond = { c: 'age', min: 45 };
const FREE: Standing[] = ['civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'shipwright', 'cp', 'settled', 'retired'];
const free: Cond = { c: 'standing', is: FREE };
const ashore: Cond = { c: 'standing', is: ['civil', 'shipwright', 'settled', 'bountyHunter', 'retired'] };
const crew: Cond = { c: 'standing', is: ['pirate', 'marine', 'revolution'] };

export const MINORS: Minor[] = [
  // ======================================================== 어린 시절 (3~15살)
  {
    id: 'm_kid_quarrel', when: [kid], weight: 10, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['싸운 친구의 집 앞까지 찾아가 먼저 사과했다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['말다툼 끝에 친구를 밀쳐 넘어뜨렸다.'], fx: [] },
      { lean: { peace: 0.6, devotion: 0.4 }, text: ['다툰 친구에게 아끼던 사탕을 내밀며 화해했다.'], fx: [] },
      { lean: {}, text: ['친구와 다투고 사흘 동안 말을 하지 않았다.', '사소한 일로 친구와 토라졌다가 저녁 무렵 다시 놀았다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_errand', when: [kid], weight: 9, cooldownYears: 1,
    outcomes: [
      { lean: { devotion: 1 }, text: ['이웃 아주머니의 장바구니를 집까지 들어다 드렸다.'], fx: [{ op: 'money', add: 100 }] },
      { lean: { freedom: 1 }, text: ['심부름 가던 길에 바닷가로 새 버렸다가 꾸중을 들었다.'], fx: [] },
      { lean: {}, text: ['{town} 시장에 심부름을 다녀왔다.', '빵집 심부름을 하고 덤으로 빵 한 조각을 얻었다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_marbles', when: [kid], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['구슬치기 내기에서 골목 아이들의 구슬을 모두 땄다.'], fx: [] },
      { lean: { peace: 1 }, text: ['내기는 싫다며 구슬치기를 구경만 했다.'], fx: [] },
      { lean: { romance: 1 }, text: ['딴 구슬을 잃은 아이에게 도로 나눠 주었다.'], fx: [] },
      { lean: {}, text: ['구슬치기 내기에서 아끼던 유리구슬을 잃었다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_older_boys', when: [kid], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['어린 아이를 놀리던 큰 아이들에게 대들었다가 흠씬 맞았다.'], fx: [{ op: 'hp', add: -5 }] },
      { lean: { peace: 1 }, text: ['시비를 거는 큰 아이들을 피해 먼 길로 돌아서 집에 갔다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['시비를 거는 큰 아이의 정강이를 걷어차고 달아났다.'], fx: [] },
      { lean: {}, text: ['큰 아이들이 시비를 걸어 와 뛰어서 달아났다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_scrape', when: [kid], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { peace: 1 }, text: ['넘어져 무릎이 까진 뒤로 며칠 얌전히 지냈다.'], fx: [{ op: 'hp', add: 3 }] },
      { lean: { ambition: 0.6, freedom: 0.4 }, text: ['무릎이 까진 채로 다음 날 또 뛰어나갔다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: {}, text: ['넘어져 까진 무릎에 약초를 짓이겨 붙였다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_bookshop', when: [kid], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['책방 구석에서 찾은 낡은 항해 일지를 밤새 읽었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['책을 펴 놓고 창밖으로 지나가는 배만 바라보았다.'], fx: [] },
      { lean: {}, text: ['책방 주인이 빌려준 그림책을 돌려주러 갔다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_lean_supper', when: [kid, { c: 'wealth', max: 'poor' }], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { devotion: 1 }, text: ['모아 둔 동전을 몰래 쌀독에 넣어 두었다.'], fx: [{ op: 'money', add: -100 }] },
      { lean: { ambition: 1 }, text: ['묽은 죽을 비우며 언젠가 큰돈을 벌겠다고 이를 악물었다.'], fx: [] },
      { lean: {}, text: ['저녁이 묽은 죽 한 그릇뿐이었다.', '배가 고파 잠이 오지 않는 밤이었다.'], fx: [{ op: 'hp', add: -2 }] },
    ],
  },
  {
    id: 'm_kid_wooden_sword', when: [kid], weight: 6, cooldownYears: 2,
    outcomes: [
      { lean: { ambition: 1 }, text: ['부러진 목검 대신 단단한 떡갈나무로 새 목검을 깎았다.'], fx: [] },
      { lean: { romance: 1 }, text: ['주워 온 나무 막대에 이름을 새기고 보물처럼 아꼈다.'], fx: [] },
      { lean: {}, text: ['쓰던 나무칼이 부러져 바닷가에서 새 막대를 주워 왔다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_stray', when: [kid], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { devotion: 1 }, text: ['비 맞은 떠돌이 고양이에게 생선 대가리를 나눠 주었다.'], fx: [] },
      { lean: { justice: 1 }, text: ['떠돌이 개에게 돌을 던지던 아이들을 말렸다.'], fx: [] },
      { lean: {}, text: ['떠돌이 개에게 쫓겨 담장 위로 기어올랐다.'], fx: [] },
    ],
  },
  {
    id: 'm_kid_odd_job', when: [{ c: 'age', min: 8, max: 15 }], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['어른들도 꺼리는 생선 상자 나르기를 자청했다.'], fx: [{ op: 'money', add: 500 }, { op: 'hp', add: -2 }] },
      { lean: { inquiry: 1 }, text: ['항구 사무소에서 장부 옮겨 적는 일을 거들었다.'], fx: [{ op: 'money', add: 300 }] },
      { lean: {}, text: ['그물 손질을 거들고 동전 몇 닢을 받았다.'], fx: [{ op: 'money', add: 300 }] },
    ],
  },
  {
    id: 'm_kid_lost_child', when: [kid], weight: 5, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 0.5, devotion: 0.5 }, text: ['울고 있는 길 잃은 꼬마의 손을 잡고 집을 찾아 주었다.'], fx: [] },
      { lean: { peace: 1 }, text: ['길 잃은 꼬마를 어른에게 데려다주고 돌아왔다.'], fx: [] },
      { lean: {}, text: ['장터에서 길 잃은 꼬마를 보았지만 곧 엄마가 데려갔다.'], fx: [] },
    ],
  },

  // ======================================================== 어른 (16살부터)
  {
    id: 'brawl', when: [adult, free], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1, ambition: 0.3 }, text: ['술집 시비에 끼어들어 주먹을 날렸다.'], fx: [{ op: 'hp', add: -8 }, { op: 'chance', p: 0.5, then: [{ op: 'fame', add: 1 }] }] },
      { lean: { peace: 1 }, text: ['술집 시비를 피해 조용히 자리를 떴다.'], fx: [] },
      { lean: {}, text: ['시비가 붙은 술집 구석에서 술잔만 기울이다 나왔다.'], fx: [] },
    ],
  },
  {
    id: 'm_thugs', when: [adult, free], weight: 8, cooldownYears: 1,
    outcomes: [
      { lean: { justice: 1 }, text: ['노점상을 괴롭히던 건달 둘을 쫓아냈다.'], fx: [{ op: 'hp', add: -3 }, { op: 'fame', add: 1 }] },
      { lean: { peace: 1 }, text: ['건달들의 시비를 웃어넘기고 길을 비켜 주었다.'], fx: [] },
      { lean: { dominion: 1 }, text: ['길을 막은 건달들을 때려눕히고 가진 돈을 털었다.'], fx: [{ op: 'hp', add: -5 }, { op: 'money', add: 2000 }] },
      { lean: {}, text: ['건달들과 멱살잡이를 하다 순찰 해군이 오자 흩어졌다.'], fx: [{ op: 'hp', add: -2 }] },
    ],
  },
  {
    id: 'm_bet', when: [adult, free, { c: 'money', min: 3000 }], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['선술집 카드 내기에서 마지막 판에 가진 것을 다 걸었다.'],
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'money', add: 5000 }], else: [{ op: 'money', add: -3000 }] }] },
      { lean: { peace: 1 }, text: ['도박판에 끼라는 말을 정중히 거절했다.'], fx: [] },
      { lean: { ambition: 0.6, dominion: 0.4 }, text: ['팔씨름 내기에서 부두 장정들을 차례로 꺾었다.'], fx: [{ op: 'money', add: 1500 }] },
      { lean: {}, text: ['주사위 내기에서 조금 잃고 일어났다.'], fx: [{ op: 'money', add: -1000 }] },
    ],
  },
  {
    id: 'm_rent', when: [adult, ashore], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { freedom: 1 }, text: ['방세가 밀리자 짐을 싸서 더 싼 여관으로 옮겼다.'], fx: [{ op: 'money', add: -1000 }] },
      { lean: { devotion: 1 }, text: ['집주인 할머니의 지붕을 고쳐 주고 방세를 조금 깎았다.'], fx: [{ op: 'money', add: -1500 }] },
      { lean: {}, text: ['방세를 치르고 나니 주머니가 가벼워졌다.', '밀린 외상값을 갚았다.'], fx: [{ op: 'money', add: -3000 }] },
    ],
  },
  {
    id: 'm_groceries', when: [adult, free], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, text: ['생선 장수를 윽박질러 값을 반으로 깎았다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { devotion: 1 }, text: ['사정이 딱한 노점에서 일부러 넉넉히 샀다.'], fx: [{ op: 'money', add: -1500 }] },
      { lean: {}, text: ['{island} 시장에서 한 주 먹을 것을 샀다.'], fx: [{ op: 'money', add: -1000 }] },
    ],
  },
  {
    id: 'm_gear', when: [adult, free, { c: 'money', min: 10000 }], weight: 5, cooldownYears: 2,
    outcomes: [
      { lean: { ambition: 1 }, text: ['모은 돈을 털어 손에 꼭 맞는 무기를 새로 장만했다.'], fx: [{ op: 'money', add: -8000 }] },
      { lean: { romance: 0.7, loyalty: 0.3 }, text: ['낡은 무기를 버리지 못하고 대장간에 맡겨 고쳐 썼다.'], fx: [{ op: 'money', add: -2000 }] },
      { lean: {}, text: ['닳은 장화를 새것으로 바꿨다.', '해진 외투를 새로 맞췄다.'], fx: [{ op: 'money', add: -1500 }] },
    ],
  },
  {
    id: 'm_clinic', when: [adult, free], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 0.5, freedom: 0.5 }, text: ['욱신거리는 상처를 대충 동여매고 그냥 지나갔다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: { peace: 1 }, text: ['열이 내릴 때까지 며칠 푹 쉬었다.'], fx: [{ op: 'hp', add: 10 }] },
      { lean: {}, text: ['욱신거리던 상처를 의원에게 보이고 약을 받았다.'], fx: [{ op: 'money', add: -3000 }, { op: 'hp', add: 15 }] },
    ],
  },
  {
    id: 'm_cold', when: [adult], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['감기 기운에도 쉬지 않고 버텼다.'], fx: [{ op: 'hp', add: -10 }] },
      { lean: { peace: 0.6, devotion: 0.4 }, text: ['따뜻한 국을 끓여 먹고 푹 잤다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: {}, text: ['감기에 걸려 며칠 앓았다.', '상한 생선을 먹고 하루를 꼬박 앓았다.'], fx: [{ op: 'hp', add: -6 }] },
    ],
  },
  {
    id: 'm_favor', when: [adult, free], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { devotion: 1 }, text: ['이웃의 이삿짐을 하루 종일 날라 주었다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { freedom: 1 }, text: ['귀찮은 부탁을 이리저리 핑계 대며 피했다.'], fx: [] },
      { lean: {}, text: ['부탁받은 편지를 항구 사무소에 전해 주었다.'], fx: [] },
    ],
  },
  {
    id: 'm_loan', when: [adult, free, { c: 'money', min: 5000 }], weight: 5, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['오랜 친구가 돈을 빌려 달라기에 묻지 않고 내주었다.'], fx: [{ op: 'money', add: -3000 }] },
      { lean: { devotion: 0.5, justice: 0.5 }, text: ['빌려 달라는 돈 대신 일자리를 알아봐 주었다.'], fx: [] },
      { lean: {}, text: ['돈을 빌려 달라는 말에 형편이 어렵다며 거절했다.'], fx: [] },
    ],
  },
  {
    id: 'm_quarrel', when: [adult, free], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['사소한 일로 다툰 친구와 술 한잔으로 풀었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['잔소리하는 친구와 다투고 한동안 발길을 끊었다.'], fx: [] },
      { lean: { peace: 1 }, text: ['언성이 높아지기 전에 먼저 고개를 숙였다.'], fx: [] },
      { lean: {}, text: ['말다툼 끝에 어색하게 헤어졌다.'], fx: [] },
    ],
  },
  {
    id: 'm_job', when: [adult, ashore], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['가장 힘든 하역 일을 자청해 품삯을 두둑이 받았다.'], fx: [{ op: 'money', add: 2500 }, { op: 'hp', add: -3 }] },
      { lean: { inquiry: 1 }, text: ['고문서 정리하는 일을 맡아 낡은 기록을 읽었다.'], fx: [{ op: 'money', add: 1000 }] },
      { lean: { romance: 1 }, text: ['선술집에서 노래를 부르고 동전을 받았다.'], fx: [{ op: 'money', add: 800 }] },
      { lean: {}, text: ['항구에서 짐 나르는 일을 맡아 품삯을 받았다.'], fx: [{ op: 'money', add: 2000 }] },
    ],
  },
  {
    id: 'm_rumor', when: [adult, free], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['선술집에서 들은 먼 섬의 소문을 수첩에 적어 두었다.'], fx: [] },
      { lean: { romance: 0.6, freedom: 0.4 }, text: ['뱃사람의 허풍 섞인 모험담에 밤늦도록 귀를 기울였다.'], fx: [] },
      { lean: {}, text: ['뱃사람들의 소문을 흘려들었다.'], fx: [] },
    ],
  },
  {
    id: 'm_bookstall', when: [adult, free, { c: 'money', min: 2000 }], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { inquiry: 1 }, text: ['헌책방에서 오래된 해도 한 장을 샀다.'], fx: [{ op: 'money', add: -1500 }] },
      { lean: { romance: 1 }, text: ['헌책방에서 낡은 모험 소설 한 권을 샀다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: {}, text: ['헌책방을 한 바퀴 구경만 하고 나왔다.'], fx: [] },
    ],
  },
  {
    id: 'm_wallet', when: [adult, free], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 1 }, text: ['주운 지갑을 주인에게 돌려주고 사례도 마다했다.'], fx: [] },
      { lean: { dominion: 0.6, ambition: 0.4 }, text: ['주운 지갑의 돈을 챙기고 지갑은 바다에 던졌다.'], fx: [{ op: 'money', add: 2000 }] },
      { lean: {}, text: ['주운 지갑을 해군 초소에 맡겼다.'], fx: [] },
    ],
  },
  {
    id: 'm_pickpocket', when: [adult, free, { c: 'money', min: 2000 }], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { justice: 0.6, dominion: 0.4 }, text: ['소매치기를 끝까지 쫓아가 지갑을 되찾았다.'], fx: [] },
      { lean: { peace: 1 }, text: ['털린 돈은 잊기로 하고 그냥 집으로 갔다.'], fx: [{ op: 'money', add: -2000 }] },
      { lean: {}, text: ['시장 통에서 소매치기에게 지갑을 털렸다.'], fx: [{ op: 'money', add: -2000 }] },
    ],
  },
  {
    id: 'm_drunk_friend', when: [adult, free], weight: 4, cooldownYears: 1,
    outcomes: [
      { lean: { devotion: 0.5, loyalty: 0.5 }, text: ['술에 취한 친구를 업고 집까지 데려다주었다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['취한 친구를 선술집에 두고 먼저 돌아왔다.'], fx: [] },
      { lean: {}, text: ['취해서 우는 친구의 넋두리를 새벽까지 들어 주었다.'], fx: [] },
    ],
  },
  {
    id: 'm_festival', when: [adult, free], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { romance: 1 }, text: ['항구 축제에서 밤새 춤을 췄다.'], fx: [{ op: 'money', add: -500 }] },
      { lean: { peace: 1 }, text: ['축제 불꽃을 멀리 언덕에서 바라보았다.'], fx: [] },
      { lean: { ambition: 0.6, dominion: 0.4 }, text: ['축제 씨름판에 나가 장정들을 넘어뜨렸다.'], fx: [{ op: 'fame', add: 1 }] },
      { lean: {}, text: ['축제 노점에서 구운 오징어를 사 먹었다.'], fx: [{ op: 'money', add: -200 }] },
    ],
  },
  {
    id: 'm_arm_wrestle', when: [adult, free], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, text: ['힘자랑하던 장정을 바닥에 메다꽂았다.'], fx: [{ op: 'fame', add: 1 }] },
      { lean: { peace: 1 }, text: ['힘겨루기를 하자는 장정에게 져 주고 웃었다.'], fx: [] },
      { lean: {}, text: ['부두 장정과 팔씨름 한 판을 겨루고 비겼다.'], fx: [] },
    ],
  },
  {
    id: 'm_letter', when: [adult, free], weight: 4, cooldownYears: 2,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['오래 연락이 없던 {town}의 친구에게 편지를 썼다.'], fx: [] },
      { lean: { freedom: 1 }, text: ['고향에서 온 편지를 읽지 않고 서랍에 넣어 두었다.'], fx: [] },
      { lean: {}, text: ['쓰다 만 편지를 서랍에 넣어 두었다.'], fx: [] },
    ],
  },
  // ---------------- 배를 탄 처지 (해적 · 해군 · 혁명군)
  {
    id: 'm_deck_duty', when: [adult, crew], weight: 7, cooldownYears: 1,
    outcomes: [
      { lean: { loyalty: 1 }, text: ['밤 당번을 대신 서 달라는 동료의 부탁을 들어주었다.'], fx: [{ op: 'hp', add: -2 }] },
      { lean: { freedom: 1 }, text: ['갑판 청소 당번을 빼먹고 돛대 위에서 낮잠을 잤다.'], fx: [] },
      { lean: {}, text: ['하루 종일 갑판을 닦고 밧줄을 감았다.'], fx: [] },
    ],
  },
  {
    id: 'm_dock_grunts', when: [adult, crew], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { dominion: 1 }, text: ['항구에서 시비 건 남의 배 졸개들을 두들겨 팼다.'], fx: [{ op: 'hp', add: -4 }, { op: 'fame', add: 1 }] },
      { lean: { peace: 1 }, text: ['다른 배 선원들과의 시비를 피해 배로 돌아왔다.'], fx: [] },
      { lean: { loyalty: 1 }, text: ['졸개들에게 둘러싸인 동료 곁으로 달려가 함께 싸웠다.'], fx: [{ op: 'hp', add: -5 }] },
      { lean: {}, text: ['항구에서 남의 배 졸개들과 노려보다 헤어졌다.'], fx: [] },
    ],
  },
  // ---------------- 나이 든 뒤 (45살부터)
  {
    id: 'm_old_ache', when: [old], weight: 6, cooldownYears: 1,
    outcomes: [
      { lean: { ambition: 1 }, text: ['쑤시는 무릎을 무시하고 아침 수련을 나갔다.'], fx: [{ op: 'hp', add: -3 }] },
      { lean: { peace: 1 }, text: ['볕 좋은 날 툇마루에 앉아 하루를 쉬었다.'], fx: [{ op: 'hp', add: 5 }] },
      { lean: {}, text: ['쑤시는 무릎에 침을 맞았다.'], fx: [{ op: 'money', add: -2000 }, { op: 'hp', add: 10 }] },
    ],
  },
  {
    id: 'm_old_children', when: [old], weight: 5, cooldownYears: 1,
    outcomes: [
      { lean: { devotion: 0.6, romance: 0.4 }, text: ['동네 아이들에게 젊은 날의 바다 이야기를 들려주었다.'], fx: [] },
      { lean: { justice: 1 }, text: ['싸우는 아이들을 붙잡아 양쪽 말을 끝까지 들어 주었다.'], fx: [] },
      { lean: {}, text: ['공을 주워 달라는 아이들의 부탁을 들어주었다.'], fx: [] },
    ],
  },
];
