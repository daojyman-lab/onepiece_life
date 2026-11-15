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
    [{ op: 'hp', add: -10 }, { op: 'money', add: -50000 }, { op: 'hardship', add: 8 }, { op: 'queue', turning: 'moment_loss' }]),
  mis('mis_shipwreck', '난파', [{ c: 'age', min: 15 }], 0.015, { years: 10 },
    '폭풍에 배가 부서졌다. 며칠을 표류한 끝에 낯선 해변에서 겨우 눈을 떴다.',
    [{ op: 'hp', add: -30 }, { op: 'injury', severity: 'heavy' }, { op: 'money', add: -20000 }, { op: 'hardship', add: 5 }]),
  mis('mis_arrest', '체포', [{ c: 'age', min: 15 }, { c: 'standing', is: ['pirate', 'revolution', 'bountyHunter'] }], 0.015, { years: 10 },
    '해군에게 붙잡혀 쇠사슬에 묶였다. 지닌 것을 모두 빼앗기고 매질을 당한 끝에 감옥에 갇혔다.',
    [{ op: 'hp', add: -15 }, { op: 'money', add: -1000000 }, { op: 'standing', to: 'prisoner' }, { op: 'hardship', add: 6 }, { op: 'queue', turning: 'moment_defeat' }]),
  mis('mis_betrayal', '동료의 배신', [{ c: 'age', min: 16 }], 0.01, { years: 15 },
    '믿었던 동료가 등을 돌렸다. 함께 모은 것을 들고 사라지면서 비밀까지 팔아넘겼다.',
    [{ op: 'money', add: -30000 }, { op: 'hardship', add: 6 }, { op: 'flag', id: 'betrayed' }, { op: 'queue', turning: 'moment_betrayed' }]),
  mis('mis_fever', '큰 병', [{ c: 'age', min: 12 }], 0.012, { years: 20 },
    '이름 모를 열병에 쓰러졌다. 몇 달을 앓아누운 끝에 겨우 자리에서 일어났다.',
    [{ op: 'hp', add: -40 }, { op: 'base', key: 'vit', add: -1 }, { op: 'hardship', add: 5 }, { op: 'illness', id: 'fever' }]),

  // ---------------------------------------------------------------- 과제 11: 처지마다 겪는 불행
  mis('mis_ship_lost', '배를 잃다', [{ c: 'age', min: 18 }, { c: 'standing', is: ['pirate', 'bountyHunter', 'warlord'] }, { c: 'flag', id: 'ship', has: true }], 0.01, { years: 15 },
    '정박한 밤에 배에 불이 붙었다. 누가 놓은 불인지 끝내 알 수 없었다. 아침에는 검게 탄 용골만 물 위에 떠 있었다.',
    [{ op: 'unflag', id: 'ship' }, { op: 'money', add: -40000 }, { op: 'hardship', add: 6 }, { op: 'queue', turning: 'moment_loss' }]),
  mis('mis_demoted', '좌천', [{ c: 'age', min: 22 }, { c: 'standing', is: ['marine', 'cp'] }, { c: 'standingYears', min: 3 }], 0.01, { years: 15 },
    '윗선의 실수를 덮어쓰고 외딴 초소로 쫓겨났다. 계급장 한 줄이 떨어지고, 아무도 배웅하지 않았다.',
    [{ op: 'rank', add: -1 }, { op: 'fame', add: -10 }, { op: 'hardship', add: 5 }, { op: 'queue', turning: 'moment_demoted' }]),
  mis('mis_comrades_caught', '붙잡힌 동지들', [{ c: 'age', min: 18 }, { c: 'standing', is: ['revolution'] }], 0.01, { years: 12 },
    '숨은 거점이 정부에 들통났다. 함께 일하던 동지들이 한꺼번에 붙잡혀 갔다. 그날 밤 그 거점에 있지 않았던 것은 운일 뿐이었다.',
    [{ op: 'hardship', add: 8 }, { op: 'fame', add: -5 }, { op: 'queue', turning: 'moment_loss' }]),
  mis('mis_shop_fire', '불탄 가게', [{ c: 'age', min: 20 }, { c: 'flag', id: 'shop', has: true }], 0.01, { years: 20 },
    '밤사이 가게에 불이 났다. 장부도 물건도 손때 묻은 간판도 하룻밤에 재가 되었다.',
    [{ op: 'unflag', id: 'shop' }, { op: 'money', add: -60000 }, { op: 'hardship', add: 6 }, { op: 'queue', turning: 'moment_loss' }]),
  { ...mis('mis_child_lost', '자식을 먼저 보내다', [{ c: 'age', min: 30 }], 0.01, 'once',
    '자식이 먼저 세상을 떠났다. 바다에서 돌아오지 못했다는 소식이 늦게 닿았다.',
    [{ op: 'losePerson', who: 'child' }, { op: 'hardship', add: 10 }, { op: 'queue', turning: 'moment_child' }]), needs: ['child'] },
];
