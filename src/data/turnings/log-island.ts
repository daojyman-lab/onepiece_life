import type { Cond, Fx, Turning } from '../../core/types';
import { V } from '../balance';
import { MORO_PLUMB } from '../keepsakes';

export const MORO = '모로섬';
export const MORO_LANDING = 'moro_landing';
const SUNSET = 'moro_sunset';
const MORO_NEEDLE = 'moro_needle';
const D = V.value.door;
const here: Cond[] = [{ c: 'sea', is: ['gl_entry'] }, { c: 'island', is: [MORO] }];
const chose = (turning: string, door: number): Cond => ({ c: 'choiceAgo', turning, door });
const log = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const next = (turning: string): Fx => ({ op: 'queue', turning });

// 둘째 날 실제로 고른 일만 셋째 날과 재기항 때 되짚는다.
const MORO_OUTCOMES = [
  { nextMorning: '어제 구한 약병들이 약국 창가에 나란히 섰다. 마지막 한 병을 받으러 온 아이가 빈 우유병을 들고 줄을 서 있다.',
    returnVisit: '부두 약국의 수레가 지나갔다. 지난번에 약병을 살린 세 번째 고리는 새로 놋쇠를 입혀 반짝였다.' },
  { nextMorning: '생선 장수가 종탑을 향해 손을 흔든다. “어제 세 번 울린 게 당신이오? 덕분에 생선도 나도 통째로 살았지.”',
    returnVisit: '종이 세 번 울리자 장수들이 일제히 고개를 들었다. 지난번 직접 당겼던 붉은 종줄이 창밖으로 보였다.' },
  { nextMorning: '시장 사람들이 어제 함께 받쳐 든 천막을 꿰맨다. 팽팽했던 천 한복판에 수레바퀴 자국이 동그랗게 남았다.',
    returnVisit: '시장 천막 천에 동그란 덧댐이 생겼다. 지난번에 함께 수레를 받은 자리였다.' },
];

export const LOG_ISLAND_TURNINGS: Turning[] = [
  {
    id: MORO_LANDING, kind: 'door', weight: 0, repeat: 'once', when: [...here, { c: 'flag', id: `at:${MORO}`, has: true }], speaker: 'hero',
    title: '첫날 · 옆으로 쏟아진 동전',
    body: '모로섬 부두에서 거스름돈을 받는데 동전이 손바닥에서 옆으로 떨어졌다. 해가 수평선에 걸린 동안에는 동쪽 벽이 바닥이 된다. 빵집 주인은 벽에 박아 둔 의자에 벌써 앉아 있었다.\n\n부두지기가 빙빙 도는 로그 포스를 들여다봤다. “셋째 날 아침이면 바늘이 잡힐 거요. 그 전에 동전부터 주워요. 해가 다 지면 저게 도로 머리 위로 떨어지니까.”',
    doors: [
      { label: '약사의 수레를 따라 동쪽 벽의 고리를 짚어 본다', hint: '수레를 어디에 매야 약병이 깨지지 않는지 배운다', values: { inquiry: D },
        fx: [log('약사는 수레의 짧은 줄을 들고 고리 두 개를 지나쳤다. 세 번째에 걸자 바퀴 네 개가 벽에 사뿐히 닿았다. 약병에서 달그락 소리 한 번 안 났다.'), next(SUNSET)] },
      { label: '종지기와 벽에 난 발판을 밟아 본다', hint: '땅이 돌아선 뒤에도 종탑에 들어가는 길을 익힌다', values: { romance: D },
        fx: [log('종탑의 옆창이 발아래 문턱이 되었다. 종지기가 붉은 줄을 가리켰다. “한 번은 해 질 때, 세 번은 길을 비울 때. 헷갈리면 온 시장이 저녁을 두 번 먹겠지.”'), next(SUNSET)] },
    ],
  },
  {
    id: SUNSET, kind: 'door', weight: 0, repeat: 'once', when: [...here, { c: 'anyOf', conditions: [chose(MORO_LANDING, 0), chose(MORO_LANDING, 1)] }], speaker: 'hero',
    title: '둘째 날 · 약수레가 달린다',
    body: '다음 날 해 질 무렵, 로그 포스 바늘이 반 바퀴씩만 흔들렸다. 시장에서 종이 한 번 울렸다. 사람들이 동쪽 벽에 발을 옮기는데 약수레의 줄이 끊어졌다. 수레가 아직 정리 중인 생선 좌판으로 떨어져 간다. 장수들은 차양 밑에 있어 위를 못 본다.',
    recall: [
      { when: [chose(MORO_LANDING, 0)], text: '약사가 보여 준 세 번째 고리가 손 닿는 곳에 있다. 짧은 줄은 수레 손잡이에 그대로 매여 있다.' },
      { when: [chose(MORO_LANDING, 1)], text: '종탑의 옆창이 발아래 있다. 어제 밟아 본 두 칸만 건너면 붉은 줄에 손이 닿는다.' },
    ],
    doors: [
      { label: '세 번째 고리에 수레의 짧은 줄을 건다', hint: '약사가 고르는 고리의 자리를 알아야 한다', when: [chose(MORO_LANDING, 0)], values: { loyalty: D },
        news: { title: '모로섬 약수레, 세 번째 고리에서 멈춰', body: '약국에서 약병 수를 다시 셌다. 깨진 것은 하나도 없었다. 수레가 지나간 자리에서 생선 장수들이 다시 손님을 받았다.' },
        fx: [log('바퀴가 벽을 짚으며 수레가 반원을 그렸다. 좌판 앞에서 멈춘 수레를 열어 보니 약병 마개까지 제자리에 있었다. 생선 장수는 그제야 고개를 들었다.'), next(MORO_NEEDLE)] },
      { label: '종탑 옆창을 넘어 경종을 세 번 울린다', hint: '종탑 옆창으로 가는 길과 경종의 신호를 알아야 한다', when: [chose(MORO_LANDING, 1)], values: { justice: D },
        news: { title: '모로섬 시장에 세 번 울린 경종', body: '종탑에서 경종이 울리자 장수들이 좌판을 비웠다. 떨어진 약수레가 부순 것은 빈 얼음통과 약병 몇 개였다.' },
        fx: [log('세 번째 종소리에 마지막 장수가 좌판을 떠났다. 수레가 빈 얼음통에 처박혀 병 몇 개가 깨졌다. 약사는 장수들부터 한 명씩 세어 보았다.'), next(MORO_NEEDLE)] },
      { label: '장수들을 불러 차양을 펼쳐 수레를 받는다', hint: '여럿이 천의 네 귀퉁이를 잡는다', values: { peace: D },
        news: { title: '생선 천막으로 약수레를 받은 모로섬 장수들', body: '시장 사람들이 차양 네 귀퉁이를 붙들어 수레를 받았다. 약사는 무사했고, 생선 장수들은 천막에 난 바퀴 자국을 어쩔지 의논 중이다.' },
        fx: [log('네 사람이 줄을 잡아당기자 수레가 생선 천막 한가운데 푹 꺼졌다. 장수도 약사도 다치지 않았다. 다만 오늘 저녁 대구에서는 기침약 냄새가 났다.'), next(MORO_NEEDLE)] },
    ],
  },
  {
    id: MORO_NEEDLE, kind: 'door', weight: 0, repeat: 'once', when: [...here, { c: 'anyOf', conditions: MORO_OUTCOMES.map((_, i) => chose(SUNSET, i)) }], speaker: 'hero',
    title: '셋째 날 · 바늘이 멎은 아침',
    body: '셋째 날 아침, 손목을 한 바퀴 돌려도 로그 포스 바늘 끝이 같은 곳으로 돌아왔다. 리틀 가든으로 향하는 물길이다. 부두지기는 새로 닿은 배를 맞으러 뛰어갔다. 또 누군가 거스름돈을 받으려는 참이었다.',
    recall: MORO_OUTCOMES.map((outcome, i) => ({ when: [chose(SUNSET, i)], text: outcome.nextMorning })),
    doors: [
      { label: '바늘이 가리키는 리틀 가든으로 출항한다', hint: '사흘 동안 기다린 항로를 따라 바다로 나간다', values: { freedom: D },
        fx: [log('부두지기가 작별 인사 대신 동전 하나를 던졌다. 대낮이라 동전은 얌전히 손에 떨어졌다. 다음 물길은 바늘이 가리키고 있었다.'), { op: 'sail', island: '리틀 가든', route: 'dream' }] },
      { label: '부두에 남아 새 손님에게 다림추 읽는 법을 보여 준다', hint: '부두지기가 여분의 놋쇠 다림추를 하나 건넨다', values: { inquiry: D },
        fx: [log('새 손님은 저녁 내내 추를 지켜보다 추가 기우는 순간 제 모자를 붙잡았다. 부두지기는 그제야 웃으며 여분의 놋쇠 다림추를 {name}의 손에 쥐여 주었다.'), { op: 'flag', id: MORO_PLUMB }] },
    ],
  },
];

export function moroReturnLine(tried: string[]): string | undefined {
  if (!tried.includes(`${MORO_NEEDLE}#0`) && !tried.includes(`${MORO_NEEDLE}#1`)) return;
  return MORO_OUTCOMES.find((_, i) => tried.includes(`${SUNSET}#${i}`))?.returnVisit;
}
