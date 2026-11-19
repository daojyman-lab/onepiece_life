import type { Cond, Turning } from '../../core/types';

export const NEWBORN_SIBLING = '갓 태어난 동생';
export const SIBLING_BIRTH_ID = 'family_sibling_birth';
export const SIBLING_BIRTH_AWAY_ID = 'family_sibling_birth_away';

const newborn: Cond = { c: 'person', relation: NEWBORN_SIBLING, has: true, kinds: ['family'] };

export const SIBLING_BIRTH_TURNINGS: Turning[] = [
  {
    id: SIBLING_BIRTH_ID, kind: 'door', weight: 0, repeat: { years: 1 }, when: [newborn], needs: ['sibling'],
    speaker: { relation: '어머니' }, title: '동생이 태어난 날',
    body: '포대기에 싸인 아기가 눈을 떴다. 어머니가 자리를 내주며 말했다. 「이리 와 봐. 네 동생이야. 아직 이름도 정하지 못했단다.」',
    doors: [
      { label: '동생을 처음 품에 안아 본다', hint: '어머니가 아기를 안는 법을 가르쳐 준다', fx: [{ op: 'welcomeSibling', action: 'hold' }] },
      { label: '어머니와 동생 이름을 함께 짓는다', hint: '함께 정한 이름을 동생에게 불러 준다', fx: [{ op: 'welcomeSibling', action: 'name' }] },
    ],
  },
  {
    id: SIBLING_BIRTH_AWAY_ID, kind: 'door', weight: 0, repeat: { years: 1 }, when: [newborn], needs: ['sibling'],
    speaker: 'hero', title: '고향에서 온 출생 소식',
    body: '고향에서 온 편지에 동생이 태어났다고 적혀 있다. 아기는 잘 먹고 잘 잔다고 한다. 끝에는 이름이 아직 정해지지 않았다는 말이 덧붙어 있다.',
    doors: [
      { label: '동생에게 축하 편지를 보낸다', hint: '동생이 글을 배울 때까지 편지를 간직해 달라고 부탁한다', fx: [{ op: 'welcomeSibling', action: 'letter' }] },
      { label: '편지로 동생의 이름을 제안한다', hint: '고향 식구들에게 떠오른 이름을 적어 보낸다', fx: [{ op: 'welcomeSibling', action: 'name' }] },
    ],
  },
];
