// 고향과 무관한 생애 서약의 제안·결산·각성 장면.
import type { Turning } from '../../core/types';
import { VALUE_IDS, VALUE_NAME } from '../values';
import { LIFE_VOW_STORIES } from '../vow-life';

const COST_WORD = ['열', '열여덟', '스물여섯'] as const;
const FINAL_COST = [6, 10, 14] as const;

export const LIFE_VOW_TURNINGS: Turning[] = VALUE_IDS.flatMap((value) =>
  ([1, 2, 3] as const).flatMap((level) => {
    const id = `life_${level}_${value}`;
    const story = LIFE_VOW_STORIES[value];
    const rank = ['첫', '두 번째', '마지막'][level - 1];
    return [
      {
        id: `life_vow_offer_${level}_${value}`, kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
        title: `${rank} 서약 · ${VALUE_NAME[value]}`,
        body: `${story.promise[level - 1]}. 마음속으로만 품어 온 약속을 입 밖에 내면, 당장 편한 길을 포기하고 오래 버텨야 한다.`,
        doors: [
          { label: '이 약속을 내 삶에 건다', hint: `지금 체력이 ${COST_WORD[level - 1]}만큼 줄고, 다른 선택과 행동으로 증명한다`,
            fx: [{ op: 'vowStart', id }, { op: 'log', text: '편한 길을 떠나기로 하자 그날의 일부터 달라졌다.', weight: 'light' }] },
          { label: '아직 이 약속을 걸지 않는다', hint: '이번 인생의 서약은 여기서 끝난다',
            fx: [{ op: 'vowDecline' }, { op: 'log', text: '입 밖에 내지 않은 약속은 다시 마음속으로 돌아갔다.', weight: 'light' }] },
        ],
      },
      {
        id: `life_vow_settle_${level}_${value}`, kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
        title: `${rank} 서약 · 약속의 날`,
        body: `${story.promise[level - 1]}. 한 해 넘게 내디딘 걸음이 이 자리에 모였다. 준비가 모자랐다면 결심만으로 결과를 바꿀 수는 없다.`,
        doors: [
          { label: '마지막 대가를 치르고 약속을 지킨다', hint: '그동안의 서로 다른 행동과 선택이 충분했을 때만 각성한다',
            fx: [{ op: 'hp', add: -FINAL_COST[level - 1] }, { op: 'vowResolve', id },
              { op: 'log', text: '몸에 남은 피로를 감수하고 약속의 결과를 마주했다.', weight: 'light' }] },
          { label: '이제 그 약속을 놓는다', hint: '성장은 얻지 못하고 다음 서약도 열리지 않는다',
            fx: [{ op: 'vowFail', id }, { op: 'log', text: '붙잡고 있던 약속을 놓자 오래 모은 힘도 흩어졌다.', weight: 'light' }] },
        ],
      },
      {
        id: `life_vow_awakening_${level}_${value}`, kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
        title: `서약 각성 · ${VALUE_NAME[value]}`,
        body: story.awakening[level - 1],
        doors: [
          { label: '달라진 몸으로 다시 걸어간다', hint: '지킨 약속은 연표와 인물 칸에 남는다',
            fx: [{ op: 'log', text: '발걸음이 예전보다 분명해졌다.', weight: 'light' }] },
          { label: '잠시 눈을 감고 이 순간을 기억한다', hint: '그날의 감각을 오래 간직한다',
            fx: [{ op: 'log', text: '눈을 감자 방금 지킨 약속이 또렷이 떠올랐다.', weight: 'light' }] },
        ],
      },
    ];
  }),
);

LIFE_VOW_TURNINGS.push({
  id: 'sky_vow_awakening', kind: 'door', when: [], weight: 0, repeat: 'once', speaker: 'hero',
  title: '서약 각성 · 티카의 피난길',
  body: '티카가 마지막 웨이버를 안전한 구름길로 밀어 넣는다. 위험을 알면서도 곁을 지킨 약속이 몸 안에서 새 힘으로 깨어난다.',
  doors: [
    { label: '티카와 다시 구름길을 걷는다', hint: '지킨 약속은 연표에 남는다',
      fx: [{ op: 'log', text: '티카가 웨이버의 자리를 내 주었다. 구름길이 전보다 넓게 보였다.', weight: 'light' }] },
    { label: '피난길의 끝을 한 번 더 돌아본다', hint: '등불이 아직 켜져 있다',
      fx: [{ op: 'log', text: '멀리 켜진 등불들이 서로에게 돌아갈 길을 알려 주었다.', weight: 'light' }] },
  ],
});
