import type { Fx, Turning } from '../../core/types';
import { V } from '../balance';
import { kid } from './childhood';

const D = V.value.door;
const log = (text: string): Fx => ({ op: 'log', text, weight: 'light' });

export const RIVAL_ERRANDS: Turning[] = [
  {
    id: 'bond_rival_errand', kind: 'door', weight: 0, repeat: 'once', speaker: { relation: '어릴 적 맞수' },
    when: [...kid(10, 11), { c: 'person', has: true, relation: '어릴 적 맞수' }],
    title: '두 몫의 심부름삯', body: '둘이 이불 두 채를 빨랫집에 날라다 주는 날이다. 반쯤 왔을 때 {rival}의 신발 끈이 끊어졌다. 가게 주인은 벌써 문을 닫으려고 평상을 들이고 있다.',
    doors: [
      { label: '두 채를 포개 들고 맞수가 끈을 묶을 때까지 문을 잡아 준다', hint: '둘이 나란히 들어가서 제 몫의 삯을 받는다', values: { loyalty: D },
        fx: [{ op: 'money', add: 500 }, { op: 'log', text: '먼저 끈을 고쳐 맨 {rival}이(가) 돌아오는 길에 빈 바구니 둘을 다 들었다.', weight: 'light' }] },
      { label: '먼저 가게로 뛰어가 평상을 도로 내리는 일을 거든다', hint: '주인이 기다려 준 덕에 두 번째 이불도 제때 도착한다', values: { inquiry: D },
        fx: [{ op: 'money', add: 500 }, log('주인이 두 몫을 세어 평상 위에 놓았다. {rival}이(가) 끈을 한 번 더 묶고 이번엔 함께 집으로 걸어갔다.')] },
      { label: '두 채를 먼저 들여놓고 심부름삯을 전부 챙긴다', hint: '맞수는 뒤늦게 와서 삯이 이미 지급됐다는 말을 듣는다', values: { greed: D },
        fx: [{ op: 'money', add: 1000 }, { op: 'log', text: '{rival}은(는) 빈 바구니를 내려놓고 혼자 집으로 돌아갔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'bond_rival_ledger', kind: 'door', weight: 0, repeat: 'once', speaker: 'hero',
    when: [{ c: 'age', min: 24, max: 34 }, { c: 'person', has: true, relation: '어릴 적 맞수' }],
    title: '빨랫집 장부에서 뜯은 한 쪽', body: '{rival}이(가) 부친 봉투에서 낡은 종이 한 장이 나왔다. 고향 빨랫집이 문을 닫으면서 돌려준 장부다. 이불 두 채 아래 어린 두 사람의 이름이 보인다. 주인이 종종 받아 보던 소식이 끊길까 아쉽다고 했단다.',
    doors: [
      { label: '지금 사는 곳을 그려 맞수와 옛 주인에게 한 장씩 보낸다', hint: '두 사람이 쓴 답장이 다른 날에 도착한다', values: { loyalty: D }, fx: [log('빨랫집 주인은 두 그림이 한 벽에 걸리도록 {rival}의 그림도 받아 두겠다고 답했다.')] },
      { label: '그날의 심부름삯을 어떻게 나눴는지 적어 답장을 쓴다', hint: '기억나는 대로 적고 맞수가 간직한 쪽과 맞춰 본다', values: { inquiry: D }, fx: [log('{rival}의 답장이 왔다. 삯을 얼마 받았는지보다 신발 끈이 하필 그날 끊어진 일을 더 또렷이 기억하고 있었다.')] },
      { label: '종이를 접어 짐 사이에 넣어 둔다', hint: '오늘은 답장을 쓰지 않고 하던 일을 마친다', values: { peace: D }, fx: [log('짐을 묶다 보니 낡은 종이 귀퉁이가 비어져 나왔다. 다시 반듯이 접어 옷 사이에 넣었다.')] },
    ],
  },
];
