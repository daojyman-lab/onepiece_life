// 돈을 쓸 곳: 배 개조, 동료 장비, 정보상, 후유증 수술 (2026-11-14 추가).
// 효과 규칙은 core에서 각 부품 id를 보고 적용한다. 값은 여기서 고친다.

export interface ShipPart { id: string; name: string; price: number; minStage: number; text: string }

/** 배 개조. 해적 · 혁명군만. 배를 바꿔도 개조는 옮겨 단다 */
export const SHIP_PARTS: ShipPart[] = [
  { id: 'crowsnest', name: '망루', price: 25000, minStage: 1, text: '강적의 정보가 한 단계 더 보인다' },
  { id: 'galley', name: '큰 주방', price: 40000, minStage: 1, text: '생활비 −30%' },
  { id: 'cannon', name: '갑판 대포', price: 60000, minStage: 2, text: '바다 위 강적전에서 적 모두가 처음에 체력 10%를 잃고 시작한다' },
  { id: 'infirmary', name: '의무실', price: 80000, minStage: 2, text: '내 부상이 두 배 빨리 낫고, 동료 부상 기간이 절반' },
  { id: 'ironhull', name: '철갑 선체', price: 150000, minStage: 3, text: '바다 위 강적전에서 동료가 쓰러져도 죽지 않는다' },
  { id: 'figurehead', name: '이름난 선수상', price: 300000, minStage: 4, text: '강적을 쓰러뜨려 얻는 명성 +20%' },
];
export const SHIP_PART_BY_ID = Object.fromEntries(SHIP_PARTS.map((p) => [p.id, p])) as Record<string, ShipPart>;

/** 동료 장비 단계: 값과 힘 배율 */
export const CREW_GEAR = [
  { name: '맨몸', price: 0, mult: 1 },
  { name: '쓸 만한 장비', price: 20000, mult: 1.12 },
  { name: '좋은 장비', price: 80000, mult: 1.25 },
  { name: '명품 장비', price: 250000, mult: 1.4 },
];

/** 정보상: 지금 해역 보스의 모든 것 (× 해역 단계) */
export const INTEL_PRICE = 15000;
/** 후유증 수술: 하나를 없애고 줄었던 능력치를 되돌린다 (× 해역 단계) */
export const SURGERY_PRICE = 50000;
