import type { HomeId, RivalCareer, Turning } from '../core/types';
import { V } from './balance';

interface WorkLetter {
  career: 'shipwright' | 'surgeon' | 'dyer';
  homes: HomeId[];
  title: string;
  body: string;
  original: [string, string];
  alternative: [string, string];
  post: string;
  port: string;
  reports: [string, string];
}

const LETTERS: WorkLetter[] = [
  {
    career: 'shipwright', homes: ['loguetown', 'water7'], title: '물에 번진 설계도 두 장',
    body: '{rival}에게서 손바닥만 한 설계도 두 장이 왔다. 하나는 빌려 탈 어선이고, 다른 하나는 물이 불면 지붕까지 사람을 실어 올릴 밑바닥이 평평한 배다. 어느 배를 먼저 지을지 고민한 자리에 연필 자국이 패였다.',
    original: ['어선 도면에 그물을 놓을 자리를 그려 보낸다', '먼저 배를 빌릴 어부들이 무엇을 실을지 함께 적는다'],
    alternative: ['사람이 누울 자리를 표시해 두 번째 도면을 돌려보낸다', '맞수가 워터 세븐에서 침수 골목을 다닐 배를 짓는다'],
    post: '침수 골목의 구조정 조선공', port: '워터 세븐',
    reports: ['{rival}이(가) 워터 세븐의 좁은 수로에서도 방향을 틀 수 있는 구조정을 띄웠다. 첫날 나란히 누워 돌아온 승객은 발을 다친 노인과 노인이 끝내 두고 가지 않은 개였다.',
      '{rival}의 일터에는 창틀 높이가 적힌 나무자가 줄줄이 걸려 있다. 동네 목수들은 자기 골목 창턱과 높이가 맞는 배를 이제 직접 만든다.'],
  },
  {
    career: 'surgeon', homes: ['loguetown', 'water7'], title: '붕대 옆에 그린 손',
    body: '{rival}이(가) 부상당한 선원들의 손을 종이에 따라 그려 보냈다. 손가락을 다시 구부릴 때까지 머무를 방을 얻을지, 손을 다쳐도 쓸 수 있는 도구를 만드는 사람을 찾을지 묻는 편지다.',
    original: ['선원 한 명이 묵을 방과 끼니 값을 알아봐 준다', '맞수가 치료를 끝낸 선원의 재활을 맡는다'],
    alternative: ['한 손으로 잠글 수 있는 걸쇠를 구해 편지에 동봉한다', '맞수가 워터 세븐의 공방에서 선원들과 손잡이를 고친다'],
    post: '선원들의 보조기 제작자', port: '워터 세븐',
    reports: ['{rival}이(가) 한 손으로 조일 수 있는 공구 손잡이를 만들었다. 처음 써 본 갑판원이 풀린 나사 셋을 그 자리에서 고치고는 새 일감을 받으러 나갔다.',
      '공방 벽에는 {rival}이(가) 만든 손잡이가 크기 순으로 걸려 있다. 새로 온 손님을 맞는 사람은 예전에 손을 다쳐 그 손잡이를 처음 썼던 갑판원이다.'],
  },
  {
    career: 'dyer', homes: ['wano'], title: '두 조각의 쪽빛 천',
    body: '{rival}의 편지에는 색이 조금씩 다른 천이 두 조각 들어 있다. 혼례옷을 물들일 주문이 밀렸는데, 밤길에 서로를 알아볼 일꾼들의 작업옷도 만들어 보고 싶다고 한다.',
    original: ['혼례옷에 댈 천을 골라 낡은 솔기와 맞춰 보낸다', '맞수가 주민들이 맡긴 옷을 한 벌씩 되살린다'],
    alternative: ['등잔 아래서도 보이는 흰 실을 천 가장자리에 달아 보낸다', '맞수가 밤일하는 이들의 소매에 흰 테를 남겨 물들인다'],
    post: '일꾼들의 작업복 염색장', port: 'home',
    reports: ['{rival}이(가) 소매에 흰 줄을 남긴 작업옷을 지었다. 등불 너머에서 손짓을 알아본 짐꾼들이 수레를 한 번에 멈춘 뒤로 같은 옷을 찾는 이들이 늘었다.',
      '{rival}의 염색집에 해진 소매만 한 아름 도착했다. 수선해 줄 옷이냐고 물으니, 일을 마친 옛 동료들이 흰 줄에 제 이름을 한 자씩 수놓아 보낸 것이었다.'],
  },
];

export const workLetter = (career: RivalCareer) => LETTERS.find(letter => letter.career === career);
export const workLetterId = (career: RivalCareer) => 'rival_letter_' + career;
export const alternateWorkFlag = (career: RivalCareer) => 'rival:advice:' + career;

export const RIVAL_WORK_LETTERS: Turning[] = LETTERS.map(letter => ({
  id: workLetterId(letter.career), kind: 'door', weight: 0, repeat: 'once', speaker: 'hero',
  when: [{ c: 'home', is: letter.homes }, { c: 'age', min: 19, max: 23 }, { c: 'rivalAtWork', career: letter.career }],
  title: letter.title, body: letter.body,
  doors: [
    { label: letter.original[0], hint: letter.original[1], values: { loyalty: V.value.door }, fx: [] },
    { label: letter.alternative[0], hint: letter.alternative[1], values: { inquiry: V.value.door }, fx: [{ op: 'flag', id: alternateWorkFlag(letter.career) }] },
    { label: '편지를 접어 두고 맞수의 다음 소식을 기다린다', hint: '맞수가 먼저 생각했던 일을 계속한다', fx: [] },
  ],
}));
