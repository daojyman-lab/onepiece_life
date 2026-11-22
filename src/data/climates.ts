// 섬의 기후 (특별한 장소). 바다의 날씨(weather.ts)와 별개로, 그 섬에 머무는 동안 섬이 가진 기후가 일상에 끼어든다.
// 펑크 해저드의 불과 얼음, 하늘섬의 구름 바다, 코끼리 등 위의 조우처럼 원작에서 이름난 섬만 적는다. 적지 않은 섬은 기후가 없다.
// 그 섬에서 나고 자란 사람 · 그 땅의 종족은 몸이 기후에 익어서 다치지 않는다 (core/climate.ts).
import type { Species } from '../shared/core/types';
import type { WeatherTilt } from './weather';
import { hasWorldEvent, historyTick, worldTick, type WorldClock } from './world-history';

export interface IslandClimate {
  name: string;                                // 기후의 이름 (장면 · 기록)
  p: number;                                   // 섬에 머무는 한 토막마다 기후가 끼어들 확률
  lines: readonly string[];                    // 끼어들 때의 기록 (하나를 고른다)
  hp?: number;                                 // 끼어들 때 체력 변화 (익숙한 사람은 받지 않는다. 날씨로는 죽지 않는다)
  natives?: readonly Species[];                // 이 종족은 이 기후에 익숙하다
  /** 해마다 정해진 토막(0~3)에 오는 큰 기후. 아쿠아 라구나처럼 섬 사람 모두가 대비한다 */
  season?: { part: 0 | 1 | 2 | 3; p: number; line: string; hp: number };
  /** 이 섬으로 가는 뱃길: 날씨 확률 보정과 닿을 때의 장면 */
  approach?: { tilt?: WeatherTilt; arrive?: string; hp?: number };
}

const SKY: IslandClimate = {
  name: '하늘섬', p: 0.3, natives: ['skypiean'],
  lines: ['발밑의 구름이 폭신하게 꺼졌다가 다시 차올랐다.', '구름 바다 위로 쏟아지는 햇볕이 지상보다 따가웠다.', '섬 둘레로 하얀 구름이 강처럼 흘렀다.',
    '숨이 조금 가빴다. 땅이 하늘 한가운데에 떠 있다는 것이 아직 실감 나지 않았다.'],
  hp: -2,
  approach: { arrive: '바다 한가운데서 치솟은 노크업 스트림이 배를 하늘 끝까지 밀어 올렸다. 정신을 차리니 구름 위였다.', hp: -8 },
};
const FISHMAN: IslandClimate = {
  name: '해저 만 미터', p: 0.25, natives: ['fishman', 'merfolk'],
  lines: ['거품 막 너머로 커다란 물고기 떼가 지나갔다.', '햇빛 대신 태양나무 이브의 뿌리가 끌어온 빛이 거리를 비췄다.', '머리 위의 거품 막이 출렁일 때마다 귀가 먹먹했다.'],
  hp: -2,
  approach: { arrive: '코팅한 배가 거품에 싸여 깊은 바닷속으로 가라앉았다. 해류와 해왕류를 지나 만 미터 아래 거품의 섬이 보였다.', hp: -5 },
};
const WANO: IslandClimate = {
  name: '쇄국의 나라', p: 0.2,
  lines: ['벚꽃잎이 바람을 타고 처마 끝까지 날아들었다.', '높은 절벽 너머로 바다 소리만 아득했다.', '쿠리 쪽 강물이 검게 흐린 채 흘러갔다. 공장 굴뚝의 연기 때문이라 했다.'],
  approach: { arrive: '절벽 너머로 와노쿠니의 지붕들이 보였다. 쿠리 쪽 하늘에는 공장 굴뚝에서 나온 연기가 띠를 이루고 있었다.', hp: -6 },
};

export const ISLAND_CLIMATE: Record<string, IslandClimate> = {
  // ---------------- 위대한 항로 입구
  '리버스 마운틴': {
    name: '거꾸로 흐르는 산', p: 0.2,
    lines: ['네 바다의 물이 산꼭대기로 거슬러 올라 한데 부딪혔다.', '산 아래 쌍둥이 곶에서 고래 우는 소리가 들려왔다.'],
    approach: { arrive: '해류가 배를 산비탈 위로 끌어 올렸다. 꼭대기에서 네 바다가 만나 위대한 항로 쪽으로 쏟아졌다.', hp: -4 },
  },
  '리틀 가든': {
    name: '태고의 밀림', p: 0.35, hp: -3,
    lines: ['공룡 울음이 밀림을 흔들었다.', '숨 막히게 덥고 끈적한 공기가 옷에 들러붙었다.', '섬 한가운데 화산이 연기를 뿜었다. 거인들의 결투가 다시 시작된다는 신호라 했다.',
      '어른 키만 한 벌레가 나뭇가지 사이를 기어갔다.'],
    approach: { tilt: { fog: +10 } },
  },
  '드럼 왕국': {
    name: '겨울섬', p: 0.4, hp: -4,
    lines: ['눈보라에 앞이 보이지 않았다. 손끝이 얼어 감각이 없었다.', '산꼭대기 성 쪽에서 눈사태가 우르르 쏟아졌다.', '발목까지 빠지는 눈길을 헤치고 걸었다.',
      '벚꽃 하나 피지 않는 섬이라고 사람들이 말했다.'],
    approach: { tilt: { storm: +5, fog: +5 }, arrive: '바다 위에 얼음 조각이 떠다녔다. 눈 덮인 산이 하늘을 찌르는 겨울섬이 보였다.' },
  },
  // ---------------- 위대한 항로 전반
  '알라바스타 왕국': {
    name: '가뭄에 마른 사막', p: 0.4, hp: -3,
    lines: ['우물 벽에 그어진 눈금보다 한참 아래에서 두레박이 물에 닿았다.', '한낮의 열기에 물통이 금세 바닥났다.', '물장수가 오자 마을 사람이 그릇을 들고 그늘 밖으로 나왔다.'],
    approach: { tilt: { clear: 15, storm: -15 }, arrive: '나노하나 부두에 빈 물통이 줄지어 있었다. 닻이 닿기도 전에 사공들이 마실 물을 싣고 왔느냐고 소리쳤다.' },
  },
  '스카이피아': SKY, '엔젤섬': SKY, '샨디아 마을': SKY,
  '워터 세븐': {
    name: '물의 도시', p: 0.2,
    lines: ['수로를 따라 블루를 타고 도시를 가로질렀다.', '해마다 조금씩 물에 잠겨 가는 도시라고 했다. 아래층 창문이 물에 닿아 있었다.'],
    season: { part: 2, p: 0.6, hp: -12, line: '아쿠아 라구나가 왔다. 도시를 삼킬 듯한 해일이 밀려들어 모두 높은 곳으로 피했다.' },
  },
  '에니에스 로비': {
    name: '밤이 없는 섬', p: 0.25,
    lines: ['한밤중인데도 하늘이 대낮처럼 밝았다. 밤이 오지 않는 섬이라 했다.', '섬 밑으로 뚫린 거대한 구멍으로 바닷물이 끝없이 쏟아져 내렸다.'],
    approach: { arrive: '바다 한가운데 거대한 구멍이 입을 벌리고 있었다. 그 한복판에 정부의 섬이 떠 있었다.' },
  },
  // ---------------- 샤본디 · 어인섬
  '샤본디 제도': {
    name: '비눗방울 숲', p: 0.25,
    lines: ['거대한 맹그로브 뿌리에서 비눗방울이 둥실둥실 떠올랐다.', '비눗방울 하나에 올라탄 아이들이 웃으며 머리 위를 지나갔다.'],
  },
  '스릴러 바크': {
    name: '마의 삼각지대', p: 0.35, hp: -2,
    lines: ['짙은 안개가 걷히지 않았다. 해가 뜨는지 지는지도 알 수 없었다.', '안개 속에서 누군가 웃는 소리가 들렸다. 돌아보면 아무도 없었다.'],
    approach: { tilt: { fog: +30, clear: -20 }, arrive: '안개 속에서 섬만 한 배가 소리 없이 다가왔다. 마의 삼각지대였다.' },
  },
  '플로리안 트라이앵글': {
    name: '마의 삼각지대', p: 0.35, hp: -2,
    lines: ['안개에 젖은 뱃전에서 물시계만 내려다보았다.', '낡은 부표에서 녹슨 종이 울렸다. 그 너머에 무엇이 있는지는 보이지 않았다.'],
    approach: { tilt: { fog: +30, clear: -20 }, arrive: '견시대 아래까지 안개가 차올랐다. 낡은 부표만 남은 마의 삼각지대에 닿았다.' },
  },
  '어인섬': FISHMAN, '어인가': FISHMAN, '류구 왕국': FISHMAN, '바다의 숲': FISHMAN,
  '아마존 릴리': {
    name: '바람 없는 바다의 섬', p: 0.2,
    lines: ['섬을 둘러싼 바다에 바람 한 점 없었다.', '밀림 깊은 곳에서 커다란 뱀이 미끄러지듯 지나갔다.'],
  },
  // ---------------- 신세계
  '펑크 해저드': {
    name: '불과 얼음의 섬', p: 0.45, hp: -5,
    lines: ['섬의 반쪽은 땅이 불타고, 다른 반쪽은 눈보라가 몰아쳤다. 그 경계에서 숨이 턱 막혔다.',
      '불타는 땅을 지나는데 발바닥이 녹아내릴 듯 뜨거웠다.', '얼음 땅의 칼바람이 살갗을 베었다. 두 대장이 싸운 자리라고 했다.',
      '독가스가 흘렀다는 골짜기에 아직도 퍼런 연기가 고여 있었다.'],
    approach: { tilt: { anomaly: +15 }, arrive: '바다 위로 불길과 얼음 안개가 동시에 피어올랐다. 반은 불타고 반은 얼어붙은 섬이었다.' },
  },
  '드레스로자': {
    name: '정열의 나라', p: 0.15,
    lines: ['한낮의 볕이 뜨겁고 바람은 꽃향기로 가득했다.', '광장마다 탱고 가락이 흘렀다. 장난감들이 사람처럼 거리를 걸어 다녔다.'],
    approach: { arrive: '태엽을 등에 단 장난감이 부두의 짐을 받아 어깨에 척 올렸다.' },
  },
  '조우': {
    name: '코끼리 등 위의 섬', p: 0.35, hp: -2, natives: ['mink'],
    lines: ['줌보가 크게 걸음을 내딛자 온 땅이 한쪽으로 기울었다.', '거대한 코끼리가 몸을 씻는지 하늘에서 소나기 같은 물이 쏟아졌다.',
      '천 년을 걸었다는 코끼리 등 위에도 숲과 강이 있었다.'],
    approach: { arrive: '바다를 걷는 거대한 코끼리 줌보가 보였다. 배를 대고 다리를 따라 끝없이 기어올라 그 등 위의 섬에 닿았다.', hp: -6 },
  },
  '홀케이크 아일랜드': {
    name: '과자의 나라', p: 0.3,
    lines: ['구름에 얼굴이 있었다. 말을 걸어 오는 구름이었다.', '길가의 나무에서 사탕이 열렸다. 집 벽을 뜯어 먹는 아이가 있었다.', '꽃들이 노래를 불렀다. 해도 달도 웃는 얼굴이었다.'],
  },
  // ---------------- 신세계 후반
  '와노쿠니': WANO, '하나노미야코': WANO, '쿠리': WANO, '에비스 마을': WANO,
  '엘바프': {
    name: '거인의 나라', p: 0.25,
    lines: ['구름을 뚫고 솟은 거대한 나무 아래로 하루 종일 그늘이 졌다.', '거인들의 발소리에 땅이 울렸다.'],
    approach: { arrive: '수평선 너머로 하늘까지 닿는 나무가 보였다. 거인들의 나라였다.' },
  },
  '에그헤드': {
    name: '미래의 섬', p: 0.25,
    lines: ['겨울섬인데 눈 한 송이 없이 따뜻했다. 섬 전체를 기계가 데운다고 했다.', '하늘에 떠 있는 공장에서 이상한 기계 소리가 났다.'],
  },
  '라프텔 근해': {
    name: '마지막 섬의 바다', p: 0.3, hp: -4,
    lines: ['나침반 바늘이 제멋대로 돌았다. 어떤 기록지침도 이 바다를 가리키지 않았다.', '바다가 끓듯이 거품을 일으켰다. 이 너머에 뭔가 있다는 소문만 무성했다.'],
    approach: { tilt: { anomaly: +10, storm: +10, clear: -20 } },
  },
};
const LOGUETOWN_STORM: IslandClimate = {
  name: '처형대의 폭풍', p: 0.8, hp: -2,
  lines: ['번개가 내리치자 처형대 꼭대기가 하얗게 번쩍였다. 광장에 모였던 사람들이 처마 밑으로 뛰었다.', '비바람에 생선 가게 차양이 뒤집혔다. 주인과 함께 젖은 천을 걷었다.'],
  approach: { tilt: { clear: -30, tailwind: -10, storm: 40 }, arrive: '빗속에서 로그타운의 종이 울렸다. 부두 사람들이 끊어진 계류줄 대신 밧줄을 던져 주었다.' },
};
const ALABASTA_BEFORE: IslandClimate = {
  name: '사막의 나라', p: 0.3, hp: -2,
  lines: ['강가의 종려나무 아래에서 물주머니를 채웠다. 물가를 떠나 모래 언덕에 오르니 금세 목이 말랐다.', '사막의 밤은 낮과 달리 뼈가 시리게 추웠다.'],
  approach: { arrive: '바닷바람에 모래 냄새가 섞여 들었다. 끝없는 모래 언덕 사이로 산도라강이 바다에 닿았다.' },
};
const ALABASTA_AFTER: IslandClimate = {
  name: '사막에 돌아온 물길', p: 0.3, hp: -1,
  lines: ['밭 사이로 물길이 흘렀다. 농부가 발뒤꿈치로 흙을 밀어 다음 고랑에도 물이 들게 했다.', '우물 곁에서 염소들이 물을 마셨다. 돌벽에는 가뭄 때 두레박 줄을 이었던 매듭이 걸려 있었다.'],
  approach: { arrive: '산도라강 어귀에서 짐배와 마주쳤다. 뱃사공이 손을 흔들자 갑판에 쌓인 보릿단에서 낟알이 떨어졌다.' },
};
const PUNK_BEFORE: IslandClimate = {
  name: '정부 연구소의 섬', p: 0.2,
  lines: ['연구소 철문에 세계정부의 표식이 붙어 있었다. 바람이 불 때마다 경첩이 끼익 울었다.', '바닷물이 밀려왔다 빠지는 사이 연구동 아래 암초가 모습을 드러냈다.'],
  approach: { arrive: '해안에서 연구소로 이어지는 철책이 보였다. 세계정부의 표식을 단 문은 바다 쪽에서도 알아볼 수 있었다.' },
};
const ENIES_AFTER: IslandClimate = {
  name: '밤이 없는 사법 섬의 폐허', p: 0.25,
  lines: ['한밤중에도 대낮처럼 밝았다. 무너진 재판소의 창틀만 섬 바닥에 그림자를 드리웠다.', '섬 아래 거대한 구멍으로 바닷물이 쏟아졌다. 그 소리만 포격 전과 같다고 뱃사람이 말했다.'],
  approach: { arrive: '대낮처럼 환한 바다 한가운데 사법 섬의 폐허가 드러났다. 포격에 무너진 법정 너머로 바닷물이 끝없이 떨어졌다.' },
};
const DRESSROSA_BEFORE: IslandClimate = {
  name: '꽃향기 어린 항구', p: 0.15,
  lines: ['해바라기밭을 건너온 바람에서 흙냄새가 났다.', '돌바닥에 탱고 구둣발 소리가 울렸다. 지나는 사람들이 걸음을 늦추고 박자를 맞췄다.'],
  approach: { arrive: '해바라기가 고개를 든 언덕 아래 옹기종기 모인 붉은 지붕들이 보였다.' },
};
const DRESSROSA_AFTER: IslandClimate = {
  name: '새장이 걷힌 꽃의 나라', p: 0.15,
  lines: ['햇볕에 달궈진 돌계단에 꽃 한 송이가 놓여 있었다. 새장이 지나간 날 헤어졌던 가족이 여기서 다시 만났다고 했다.', '광장에서 탱고를 추던 사람이 곁에 선 딸에게 손을 내밀었다. 둘이 박자를 놓칠 때마다 같은 얼굴로 웃었다.'],
  approach: { arrive: '항구에 배가 닿자 꽃다발을 든 가족들이 앞으로 나섰다. 선원 하나가 난간 너머로 두 손을 흔들었다.' },
};
const WANO_AFTER: IslandClimate = {
  name: '매연이 걷힌 하늘', p: 0.2,
  lines: ['연기가 멎은 굴뚝에 제비가 앉았다. 강둑에서는 사람들이 검은 진흙을 삽으로 퍼냈다.', '쿠리로 가는 수레에 깨끗한 물이 실렸다. 아이들이 물 한 동이를 나눠 들고 집으로 돌아갔다.'],
  approach: { arrive: '여전히 높은 절벽이 나라를 둘러싸고 있었다. 그 위로 보이던 공장의 검은 연기는 걷혔다.', hp: -6 },
};

/** 섬에 있거나 그 섬으로 향하는 현재 토막의 풍경. 시계가 없는 자료 조회는 대표 기후를 보여 준다. */
export function climateOf(island: string, clock?: WorldClock): IslandClimate | undefined {
  const usual = ISLAND_CLIMATE[island === '조' ? '조우' : island];
  if (!clock) return usual;
  if (usual === WANO && hasWorldEvent(clock, 'wanoFree')) return WANO_AFTER;
  switch (island) {
    case '로그타운':
      return worldTick(clock) === historyTick('loguetownStorm') ? LOGUETOWN_STORM : usual;
    case '알라바스타 왕국':
      if (hasWorldEvent(clock, 'alabastaRain')) return ALABASTA_AFTER;
      return hasWorldEvent(clock, 'alabastaDrought') ? usual : ALABASTA_BEFORE;
    case '펑크 해저드':
      return hasWorldEvent(clock, 'punkDuel') ? usual : PUNK_BEFORE;
    case '에니에스 로비':
      return hasWorldEvent(clock, 'eniesLobby') ? ENIES_AFTER : usual;
    case '드레스로자':
      if (hasWorldEvent(clock, 'dressrosaFree')) return DRESSROSA_AFTER;
      return hasWorldEvent(clock, 'dressrosaCoup') ? usual : DRESSROSA_BEFORE;
    default:
      return usual;
  }
}
