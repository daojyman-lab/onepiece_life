// 어느 고향에서나 이어지는 서약의 세 생애 장면. 행동 증거는 core/vow.ts가 판정한다.
import type { Activity, StatKey, ValueId } from '../core/types';

export interface LifeVowStory {
  stat: StatKey;
  activities: readonly [Activity, Activity];
  promise: readonly [string, string, string];
  awakening: readonly [string, string, string];
}

export const LIFE_VOW_STORIES: Record<ValueId, LifeVowStory> = {
  justice: {
    stat: 'wil', activities: ['work', 'family'],
    promise: ['무시받는 스승과 약한 이의 편에 선다', '소속이 내린 부당한 명령을 거부한다', '다음 사람이 같은 수모를 겪지 않게 길을 바꾼다'],
    awakening: ['모두가 고개를 돌린 자리에서 스승이 내민 손을 잡는다. 오래 참았던 말이 힘이 되어 목소리가 선명해진다.', '명령이 떨어져도 발은 움직이지 않는다. 뒤에 선 사람들의 숨소리를 듣고, 스스로 옳다고 여긴 쪽에 선다.', '어린 이가 겁먹지 않고 문턱을 넘는다. 그 모습을 보자 한때 자신을 묶던 두려움이 끝내 끊어진다.'],
  },
  greed: {
    stat: 'luk', activities: ['work', 'study'],
    promise: ['제 손으로 모은 첫 몫을 지킨다', '큰 이익 앞에서도 약속한 몫을 빼앗지 않는다', '모은 것을 다음 사람에게 책임 있게 넘긴다'],
    awakening: ['빈 주머니에서 시작한 손이 처음으로 제 몫의 무게를 안다. 남의 것을 뺏지 않고도 얻어 냈다.', '더 큰 금화가 눈앞에 쌓여도 손을 거둔다. 지킨 약속이 어느 보물보다 오래 남는다.', '열쇠를 넘기는 손끝이 떨리지 않는다. 쌓은 것의 값보다 그것을 지킬 사람을 믿게 되었다.'],
  },
  ambition: {
    stat: 'str', activities: ['train', 'work'],
    promise: ['함께 자란 사람과 서로 강해지기로 약속한다', '제 이름으로 길을 연다', '뒤따르는 사람에게 설 자리를 남긴다'],
    awakening: ['함께 넘어진 사람이 먼저 일어난다. 그 손을 잡고 다시 일어서자 전에는 들리지 않던 힘이 몸에서 깨어난다.', '처음 제 이름을 걸고 선 자리에서 물러나지 않는다. 오래 꿈꾸던 높이가 이제 손끝에 닿는다.', '뒤따라오는 발소리를 듣고도 혼자 달리지 않는다. 쌓은 힘이 처음으로 다른 사람의 길이 된다.'],
  },
  romance: {
    stat: 'spd', activities: ['roam', 'family'],
    promise: ['소중한 사람과 품은 이야기를 끝까지 따른다', '편한 안식보다 함께 꾸던 일을 고른다', '꿈의 흔적을 다음 사람에게 전한다'],
    awakening: ['빛바랜 약속의 말을 다시 꺼낸다. 잊었다고 여긴 장면이 눈앞에 되살아나 발걸음을 밀어 준다.', '돌아갈 따뜻한 자리가 보인다. 그래도 함께 그렸던 먼 풍경을 향해 한 걸음 더 내딛는다.', '이야기를 듣던 어린 눈이 반짝인다. 끝난 줄 알았던 꿈이 다른 사람 안에서 다시 시작된다.'],
  },
  inquiry: {
    stat: 'int', activities: ['study', 'train'],
    promise: ['무시받는 스승에게 배운 것을 제 힘으로 증명한다', '위험한 진실을 끝까지 검증해 드러낸다', '알아낸 것을 가두지 않고 다음 사람에게 가르친다'],
    awakening: ['스승의 낡은 기록 한 줄이 새로 읽힌다. 남들이 비웃던 가르침의 뜻이 손끝에서 증명된다.', '서로 맞지 않던 조각들이 한순간 이어진다. 숨겨진 사실이 분명한 모습으로 눈앞에 선다.', '제자가 막혔던 답을 찾아낸다. 자신의 한계를 넘어선 배움이 다른 사람 안에서 자라난다.'],
  },
  loyalty: {
    stat: 'vit', activities: ['family', 'train'],
    promise: ['가까운 사람이 위험할 때 곁을 지킨다', '함께하는 사람을 버리고 얻는 이익을 거절한다', '다음 세대가 나의 수모를 되풀이하지 않게 지킨다'],
    awakening: ['넘어져 있던 그 사람의 이름을 듣는다. 다시 일어선 다리는 전보다 단단하게 땅을 딛는다.', '뒤에서 부르는 소리에 발을 멈춘다. 혼자 달릴 때 없던 힘이 몸을 지탱한다.', '아이의 앞을 가로막은 그림자 사이로 들어선다. 한때 자신을 꺾었던 두려움이 이번에는 등을 밀어 준다.'],
  },
  freedom: {
    stat: 'spd', activities: ['roam', 'study'],
    promise: ['남의 기대를 떠나 나만의 자유를 찾는다', '안전을 포기하고 스스로 고른 길을 간다', '다른 사람도 제 길을 고를 수 있게 한다'],
    awakening: ['누군가 그어 둔 선에서 발을 떼자 숨이 깊어진다. 처음으로 제 걸음의 속도를 알게 된다.', '안전한 길이 뒤에 남는다. 앞으로 열린 낯선 풍경에 몸을 던지자 발끝이 가벼워진다.', '닫힌 문을 열어 다른 사람이 먼저 나가게 한다. 자유가 혼자만의 탈출이 아니었다는 걸 깨닫는다.'],
  },
  dominion: {
    stat: 'str', activities: ['train', 'work'],
    promise: ['제 힘으로 무리의 앞에 선다', '힘을 쓴 대가를 남에게 떠넘기지 않는다', '권세를 지키려고 아랫사람을 희생하지 않는다'],
    awakening: ['두려운 눈들이 자신을 바라본다. 물러서지 않고 맨 앞에 서자 손에 쥔 힘의 무게가 달라진다.', '무너진 자리의 책임을 직접 받는다. 비로소 다른 사람을 움직이는 힘이 무엇인지 안다.', '쉬운 희생을 명할 수 있는 자리에서 스스로 앞으로 나선다. 그 순간 권세가 아닌 힘이 남는다.'],
  },
  peace: {
    stat: 'wil', activities: ['family', 'rest'],
    promise: ['가족이나 이웃의 다툼을 멈추게 한다', '보복 대신 회복을 택한다', '오래갈 안전한 터전을 마련한다'],
    awakening: ['맞서 외치는 소리 사이에서 천천히 손을 든다. 두 사람의 숨이 가라앉을 때 자신의 마음도 흔들리지 않는다.', '돌려줄 수 있는 상처를 되돌리지 않는다. 참아 낸 침묵이 더 큰 싸움을 멈춘다.', '누군가 안심하고 잠드는 모습을 지켜본다. 지켜 낸 고요가 무엇보다 단단한 힘이 되었다.'],
  },
};

export const LIFE_VOW_AGES = [10, 22, 36] as const;
export const LIFE_VOW_ACTIVITY_NEEDS = [1, 1, 2] as const;
export const LIFE_VOW_CHOICE_NEEDS = [1, 2, 2] as const;
export const LIFE_VOW_HP_COST = [10, 18, 26] as const;
export const LIFE_VOW_STAT_GAIN = [2, 3, 4] as const;
