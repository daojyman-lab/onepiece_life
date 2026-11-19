import type { Turning } from '../../core/types';

const lessons = [
  [16, 19, 2, '부두의 빈 수련장', '늙은 교관이 발을 옮기기 전에 중심부터 잡으라고 한다. 해가 질 때까지 자세를 고칠 시간이 있다.'],
  [20, 23, 3, '흔들리는 발판', '교관이 발판을 밧줄에 매달았다. 파도가 밀려올 때도 거리를 잃지 않는 법을 배울 수 있다.'],
  [24, 27, 4, '되받아치는 법', '상대의 첫 동작을 읽고 반격하는 훈련이다. 교관은 한 번에 끝내려 들지 말라고 한다.'],
  [28, 35, 4, '마지막 합', '교관이 자세를 잡고 기다린다. 이번에는 배운 자세를 자기 몸에 맞게 고쳐 써야 한다.'],
] as const;

const martial = ['fist', 'sword', 'gun'] as const;
const practice = {
  fist: '교관이 두 손으로 받쳐 든 가죽판에 주먹 자국이 찍혔다. 마지막 세 번은 같은 자리에 맞았다.',
  sword: '교관이 목검 끝에 묻혀 준 분필 가루가 기둥에 세 줄로 남았다. 손목을 낮추자 세 번째 줄이 가장 곧았다.',
  gun: '줄에 매단 빈 깡통이 흔들렸다. 숨을 내쉰 뒤 당긴 마지막 한 발에 깡통이 뒤집혔다.',
};

export const TRAINING: Turning[] = lessons.map(([min, max, tier, title, body]) => ({
  id: `focused_training_${min}`, kind: 'door', weight: 0, repeat: 'once', speaker: { relation: '수련장 교관' },
  when: [
    { c: 'age', min, max },
    { c: 'standing', is: ['civil', 'pirate', 'marine', 'revolution', 'bountyHunter', 'warlord', 'cp', 'shipwright', 'settled'] },
  ],
  title, body,
  doors: [
    ...martial.map((branch) => ({
      label: { fist: '주먹으로 수련한다', sword: '검으로 수련한다', gun: '총으로 수련한다' }[branch],
      ...(branch === 'gun' ? { special: 'inquiry' as const } : {}),
      hint: min >= 24 ? '반격을 몸에 익히며 체력과 자세를 한층 더 단련한다' : '체력을 조금 쓰고 몸과 무술을 단련한다',
      values: { ambition: 4 },
      fx: [
        { op: 'flag' as const, id: 'focused_training' },
        { op: 'pref' as const, branch, add: 10 },
        { op: 'tier' as const, branch, to: tier },
        { op: 'base' as const, key: 'all' as const, add: min >= 24 ? 4 : 2 },
        { op: 'hp' as const, add: -8 },
        { op: 'log' as const, text: practice[branch], weight: 'light' as const },
      ],
    })),
    { label: '이번 수련은 건너뛴다', hint: '지금 하던 일을 이어 간다', values: { freedom: 4, peace: 2 },
      fx: [{ op: 'log', text: '교관이 빌려줬던 수건을 받아 걸었다. 다음 차례를 기다리던 사람이 빈자리로 들어갔다.', weight: 'light' }] },
  ],
}));
