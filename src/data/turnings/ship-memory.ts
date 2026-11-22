import type { Cond, Fx, Turning } from '../../core/types';
import { V } from '../balance';
import { GROWN, st } from './paths';

const D = V.value.door;
const dock = [st(...GROWN), { c: 'ashore' }] satisfies Cond[];
const note = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });
const named: Cond = { c: 'shipMemory', stage: 'named' };

export const SHIP_TURNINGS: Turning[] = [
  {
    id: 'ship_nameboard', kind: 'door', speaker: 'hero', when: [...dock, { c: 'shipMemory', stage: 'unnamed' }], needs: ['ship'],
    weight: 38, repeat: { years: 0 }, max: 20,
    title: '빈 이름판', body: '{island} 부두에서 물을 주문했다. “어느 배로 갖다 드려요?” 손가락으로 가리켰더니 같은 자리에 매인 배 세 척이 나란히 흔들렸다. 빈 이름판을 풀어 무릎에 놓고 붓에 페인트를 듬뿍 묻혔다.',
    doors: [
      { label: '물결 두 줄을 그리고 잔물결호라 쓴다', hint: '잔잔한 날이면 이름 아래 진짜 물결이 비친다', values: { peace: D },
        fx: [{ op: 'nameShip', name: '잔물결호' }, note('물장수가 물통을 내리며 “잔물결호, 두 통!” 하고 불렀다. 처음으로 제 배 이름을 남의 목소리로 들었다.')] },
      { label: '수평선에 불을 켜고 먼등불호라 쓴다', hint: '마지막 획에 노란 점을 찍는다', values: { inquiry: D },
        fx: [{ op: 'nameShip', name: '먼등불호' }, note('저녁 배들이 불을 밝히자 먼등불호의 노란 점이 물 위에 비쳤다. 물장수는 이름판을 읽고 곧장 갑판으로 올라왔다.')] },
      { label: '부두에서 밥장사를 해 보겠다며 한술더호라 쓴다', hint: '손님들이 찾기 쉽게 국자도 하나 그려 넣는다', values: { greed: D },
        fx: [{ op: 'nameShip', name: '한술더호' }, note('물장수가 “한술더호에 두 통 더!” 하고 외쳤다. 옆 배 주방장이 잘못 알아듣고 잔뜩 푼 국을 들고 나왔다.')] },
    ],
  },
  {
    id: 'ship_patchwork', kind: 'door', speaker: 'hero', when: [...dock, named], needs: ['ship'],
    weight: 32, repeat: { years: 2 },
    title: '맨발로 돌아보는 갑판', body: '{island}에 매어 둔 {shipName}의 갑판을 맨발로 걸었다. 키 앞 널판은 물을 먹어 한쪽이 들렸고, 손잡이의 삼줄도 손바닥에 보풀이 묻었다. 공구통 옆에 마른 널빤지 한 장과 새 줄 한 타래를 꺼냈다.',
    doors: [
      { label: '색이 다른 널판을 잘라 덧댄다', hint: '발밑이 꺼지던 자리를 메운다', values: { inquiry: D },
        fx: [{ op: 'repairShip', mark: 'plank' }, note('밝은 널판이 꼭 양말을 한쪽만 갈아 신은 것 같았다. 키 앞 구리못을 아무리 두드려도 한 걸음 돌아서면 머리가 조금 올라왔다. 다음엔 맨발로 지나갈 때 엄지발가락 조심.')] },
      { label: '키 손잡이의 묵은 삼줄을 새로 감는다', hint: '눈을 감고도 가운데를 찾도록 매듭 하나를 남긴다', values: { loyalty: D },
        fx: [{ op: 'repairShip', mark: 'helm' }, note('풀린 삼줄을 무릎 위에 감아 걷어 냈다. 새 줄의 마지막 매듭을 엄지 밑에 두고 키를 잡으니, 바퀴가 한 바퀴 돌아 제자리로 오는 순간이 손에 잡혔다.')] },
      { label: '공구를 넣고 오늘은 장을 보러 간다', hint: '재료는 다음 정박 때 꺼내 쓴다', values: { greed: D },
        fx: [note('널빤지와 삼줄을 비 맞지 않을 곳에 쌓고 부두에 내렸다. 저녁 장이 파하기 전에 말린 생선 한 묶음을 싸게 샀다.')] },
    ],
  },
  {
    id: 'ship_farewell', kind: 'moment', speaker: 'hero',
    when: [...dock, { c: 'shipMemory', stage: 'farewell' }, { c: 'money', min: 60000 }], needs: ['ship'],
    weight: 17, repeat: { years: 4 },
    title: '키를 빼기 전에', body: '{island} 부두에 새 배가 나왔다. 값을 물어 보니 손이 닿을 만큼 모아 두었다. {shipName}에 돌아와 키를 한 번 쥐고 수리 장부를 펼쳤다. 마지막 장에 내 글씨가 남아 있다. 「{shipRepair}.」',
    recall: [{ when: [{ c: 'watchMeal', stage: 'custom' }], text: '식기장을 여니 뚜껑 덮은 접시를 놓던 자리가 동그랗게 남아 있었다. 밤 당번 몫으로 이 칸만큼은 늘 비워 두었다.' }],
    doors: [
      { label: '옛 키를 떼어 새 배로 옮긴다', hint: '새 배를 사고, 이름판과 손때 묻은 키를 가져간다', values: { loyalty: D },
        fx: [{ op: 'money', add: -60000, trade: true }, { op: 'partShip', how: 'helm' },
          note('낯선 갑판에 두 발을 벌리고 손을 뻗었다. 키에서 엄지가 늘 닿던 자리를 찾았다. 뱃전에 달아 놓은 이름판이 새 나무보다 한 뼘 어두웠다.'),
          { op: 'timeline', text: '{shipName}의 이름과 키를 새 배에 옮겼다' }] },
      { label: '낡은 선체를 뭍에 올려 아이들에게 남긴다', hint: '이 배와 작별한다. 아이들이 오를 짧은 사다리를 단다', values: { peace: D },
        fx: [{ op: 'partShip', how: 'playground' }, { op: 'timeline', text: '{island} 아이들에게 배의 선체를 놀이터로 남겼다' },
          note('흔들리지 않도록 땅에 받침목을 묻고 난간에 사다리를 걸었다. 맨 먼저 올라선 꼬마가 키를 돌리며 “출항!” 하고 외쳤다. 모래밭인데도 다들 난간을 꽉 잡았다.')] },
      { label: '새 배 살 돈을 아끼고 이 배로 화물을 한 번 더 나른다', hint: '부두의 짧은 운송 일을 맡고 배를 계속 탄다', values: { greed: D },
        fx: [note('새 배 값을 적은 종이를 돌려주고 건너 부두까지 밀가루를 실어 날랐다. 자루를 다 내린 뒤 품삯을 세어 보니, 다음에 갈아야 할 널판 한 장 값은 나왔다.'), { op: 'money', add: 1500 }] },
    ],
  },
];
