// 전성기에 들어서는 순간 (통합 기획 5.2): 잠재력이 실현되고(어느 갈래든 높은 단계) + 인생의 결정적인 사건(이름을 떨침 · 큰 시련을 견딤).
// 어느 문을 골라도 전성기에 든다('prime' 표시 → core/stages.ts enterPrime). 문은 그 시절을 무엇에 쓸지를 고른다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다.
import { V } from '../balance';
import { ACTIVE, age, at, st } from './paths';
import type { Cond, Fx, Turning } from '../../core/types';

const D = V.value.door;
const P = V.prime;
/** 이름을 떨친 사람의 결정적 사건에 필요한 이름값 */
export const PRIME_FAME = 60;
/** 시련을 견뎌 낸 사람의 결정적 사건에 필요한 시련 */
export const PRIME_HARDSHIP = 30;
const ready: Cond[] = at(age(P.minAge, P.maxAge), st(...ACTIVE), { c: 'tier', branch: 'any', min: P.tier }, { c: 'flag', id: 'prime', has: false });
const prime: Fx = { op: 'flag', id: 'prime' };
const heavy = (text: string): Fx => ({ op: 'log', text, weight: 'heavy' });

export const PRIME: Turning[] = [
  {
    id: 'prime_deed', kind: 'door', when: [...ready, { c: 'fame', min: PRIME_FAME }], weight: 30, repeat: 'once', speaker: 'hero',
    title: '가장 빛나는 때', body: '어느 날 아침, {name}은(는) 문득 안다. 몸이 생각보다 먼저 움직이고, 오래 쌓아 온 것이 손끝에서 하나로 이어진다. 바다 곳곳에서 그 이름을 부른다. 지금이 인생에서 가장 높이 날 수 있는 때다. 이 시절을 어디에 쓸까.',
    doors: [
      { label: '세상의 강자들을 찾아 하나씩 겨룬다', hint: '가장 빛나는 때에 가장 높은 벽을 두드린다', values: { dominion: D },
        fx: [prime, { op: 'fame', add: 30 }, heavy('{name}은(는) 이름난 강자들의 소문을 모아 지도에 하나씩 표시했다.')] },
      { label: '곁의 사람들이 품은 꿈을 함께 이루는 데 쓴다', hint: '나 혼자 높이 오르기보다 함께 멀리 간다', values: { loyalty: D },
        fx: [prime, heavy('{name}은(는) 곁의 사람들에게 저마다의 꿈을 물었다. 이번에는 그 꿈들을 위해 돛을 올린다.')] },
      { label: '아무도 가 본 적 없는 곳으로 나선다', hint: '지도의 빈칸을 채우러 간다', values: { freedom: D },
        fx: [prime, heavy('{name}은(는) 지도의 가장 큰 빈칸을 손가락으로 짚었다.')] },
    ],
  },
  {
    id: 'prime_trial', kind: 'door', when: [...ready, { c: 'hardship', min: PRIME_HARDSHIP }], weight: 30, repeat: 'once', speaker: 'hero',
    title: '견뎌 낸 끝에서', body: '굶주림도, 패배도, 잃은 것도 많았다. 그런데 오늘, 쓰러질 것 같던 자리에서 {name}은(는) 처음으로 흔들리지 않았다. 지난 시간이 모두 이 순간을 위해 쌓였던 것처럼 몸과 마음이 맞물린다. 이 힘을 무엇에 쓸까.',
    doors: [
      { label: '나를 꺾었던 것들에게 차례로 되갚는다', hint: '다시는 지지 않는다는 것을 보여 준다', values: { dominion: D },
        fx: [prime, { op: 'base', key: 'wil', add: 1 }, heavy('{name}은(는) 한때 자신을 쓰러뜨린 이름들을 하나씩 떠올렸다.')] },
      { label: '나 같은 처지의 사람들을 끌어올린다', hint: '견뎌 본 사람만 아는 것이 있다', values: { justice: D },
        fx: [prime, heavy('{name}은(는) 지난날의 자신과 꼭 닮은 얼굴들에게 손을 내밀었다.')] },
      { label: '살아 있음을 실컷 누리며 노래한다', hint: '살아남았으니 이제 즐길 차례다', values: { romance: D },
        fx: [prime, { op: 'hp', add: 20 }, heavy('{name}은(는) 그날 밤 처음으로 아무 걱정 없이 노래를 불렀다.')] },
    ],
  },
];
