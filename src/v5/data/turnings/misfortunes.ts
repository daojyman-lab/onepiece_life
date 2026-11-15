// 고를 수 없는 불행. 문 없이 해가 바뀔 때 rollMisfortune이 판정한다. 가중치가 곧 그 해의 확률이다
// (한 인생에 평균 두세 번). 모두 시련을 올린다. 뒤에 큰 계기를 예약할 수 있다 (없는 id는 줄에서 버려진다).
// 본문은 기록에 그대로 남는다. 자리표시: {town}, {island} (이름은 쓰지 않는다).
import type { Cond, Turning } from '../../core/types';

const mis = (id: string, title: string, when: Cond[], weight: number, repeat: Turning['repeat'], body: string, fx: Turning['fx']): Turning =>
  ({ id, kind: 'misfortune', when, weight, repeat, speaker: 'hero', title, body, doors: [], fx });

export const MISFORTUNES: Turning[] = [
  mis('mis_house_ruin', '집안의 몰락', [{ c: 'age', min: 5 }, { c: 'wealth', min: 'common' }], 0.01, 'once',
    '빚과 모함이 겹쳐 집안이 하루아침에 무너졌다. 대대로 지켜 온 것이 모두 남의 손에 넘어갔다.',
    [{ op: 'money', add: -1000000 }, { op: 'wealth', to: 'poor' }, { op: 'hardship', add: 25 }, { op: 'queue', turning: 'moment_ruin' }]),
  mis('mis_home_fire', '고향의 화재', [{ c: 'age', min: 5 }], 0.01, 'once',
    '{town}에 큰불이 났다. 하룻밤 사이에 자란 집과 거리가 잿더미가 되었다.',
    [{ op: 'hp', add: -10 }, { op: 'money', add: -50000 }, { op: 'hardship', add: 15 }, { op: 'queue', turning: 'moment_loss' }]),
  mis('mis_shipwreck', '난파', [{ c: 'age', min: 15 }], 0.015, { years: 10 },
    '폭풍에 배가 부서졌다. 며칠을 표류한 끝에 낯선 해변에서 겨우 눈을 떴다.',
    [{ op: 'hp', add: -30 }, { op: 'injury', severity: 'heavy' }, { op: 'money', add: -20000 }, { op: 'hardship', add: 10 }]),
  mis('mis_arrest', '체포', [{ c: 'age', min: 15 }, { c: 'standing', is: ['pirate', 'revolution', 'bountyHunter'] }], 0.015, { years: 10 },
    '해군에게 붙잡혀 쇠사슬에 묶였다. 지닌 것을 모두 빼앗기고 매질을 당한 끝에 감옥에 갇혔다.',
    [{ op: 'hp', add: -15 }, { op: 'money', add: -1000000 }, { op: 'standing', to: 'prisoner' }, { op: 'hardship', add: 12 }, { op: 'queue', turning: 'moment_defeat' }]),
  mis('mis_betrayal', '동료의 배신', [{ c: 'age', min: 16 }], 0.01, { years: 15 },
    '믿었던 동료가 등을 돌렸다. 함께 모은 것을 들고 사라지면서 비밀까지 팔아넘겼다.',
    [{ op: 'money', add: -30000 }, { op: 'hardship', add: 12 }, { op: 'flag', id: 'betrayed' }, { op: 'queue', turning: 'moment_betrayed' }]),
  mis('mis_fever', '큰 병', [{ c: 'age', min: 12 }], 0.012, { years: 20 },
    '이름 모를 열병에 쓰러졌다. 몇 달을 앓아누운 끝에 겨우 자리에서 일어났다.',
    [{ op: 'hp', add: -40 }, { op: 'base', key: 'vit', add: -1 }, { op: 'hardship', add: 10 }, { op: 'illness', id: 'fever' }]),
];
