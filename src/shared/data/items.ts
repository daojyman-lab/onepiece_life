// 무기 · 장비 · 소모품. 강화는 없다.
import type { Item } from '../core/types';

export const ITEMS: Item[] = [
  // 검
  { id: 'sw1', name: '무명 검', kind: 'weapon', grade: 1, branch: 'martial.sword', mult: 1.05, price: 3000, text: '대장간에서 흔히 파는 검.' },
  { id: 'sw2', name: '양업물 검', kind: 'weapon', grade: 2, branch: 'martial.sword', mult: 1.15, price: 25000, text: '이름 있는 대장장이의 검.' },
  { id: 'sw3', name: '대업물 검', kind: 'weapon', grade: 3, branch: 'martial.sword', mult: 1.25, price: 150000, text: '세상에 21자루뿐인 명검 중 하나.' },
  { id: 'sw4', name: '최상대업물 검', kind: 'weapon', grade: 4, branch: 'martial.sword', mult: 1.4, price: 900000, text: '바다에 12자루뿐인 최상의 검.' },
  { id: 'sw_ss', name: '해루석 십수', kind: 'weapon', grade: 2, branch: 'martial.sword', mult: 1.05, seastone: true, price: 18000, text: '끝에 해루석을 박은 쇠몽둥이. 검술 기술이 자연계에 닿는다.' },
  { id: 'sw5', name: '흑도', kind: 'weapon', grade: 5, branch: 'martial.sword', mult: 1.5, price: 0, text: '패기에 길든 검은 칼날. 사고팔 수 없다.' },
  // 체술
  { id: 'fi1', name: '가죽 장갑', kind: 'weapon', grade: 1, branch: 'martial.fist', mult: 1.05, price: 2500, text: '주먹을 보호한다.' },
  { id: 'fi2', name: '강철 너클', kind: 'weapon', grade: 2, branch: 'martial.fist', mult: 1.15, price: 22000, text: '때리는 힘이 무겁다.' },
  { id: 'fi_ss', name: '해루석 장갑', kind: 'weapon', grade: 2, branch: 'martial.fist', mult: 1.05, seastone: true, price: 16000, text: '손등에 해루석 조각을 박았다. 체술 기술이 자연계에 닿는다.' },
  { id: 'fi3', name: '해루석 너클', kind: 'weapon', grade: 3, branch: 'martial.fist', mult: 1.25, seastone: true, price: 160000, text: '통째로 해루석인 너클. 체술 기술이 자연계에 닿는다.' },
  { id: 'fi4', name: '거인족의 건틀릿', kind: 'weapon', grade: 4, branch: 'martial.fist', mult: 1.4, price: 850000, text: '엘바프 장인이 만든 건틀릿.' },
  // 총
  { id: 'gu1', name: '낡은 권총', kind: 'weapon', grade: 1, branch: 'martial.gun', mult: 1.05, price: 3500, text: '한 발씩 장전한다.' },
  { id: 'gu2', name: '플린트록 쌍권총', kind: 'weapon', grade: 2, branch: 'martial.gun', mult: 1.15, price: 26000, text: '두 자루라 빠르다.' },
  { id: 'gu3', name: '장거리 저격총', kind: 'weapon', grade: 3, branch: 'martial.gun', mult: 1.25, price: 170000, text: '수평선 너머를 노린다.' },
  { id: 'gu_ss', name: '해루석 작살총', kind: 'weapon', grade: 2, branch: 'martial.gun', mult: 1.05, seastone: true, price: 20000, text: '해루석 촉을 쏘는 작살총. 사격 기술이 자연계에 닿는다.' },
  { id: 'gu4', name: '명총 「카부토」', kind: 'weapon', grade: 4, branch: 'martial.gun', mult: 1.4, price: 880000, text: '저격의 왕이 쓰던 것과 같은 모델.' },
  // 방어구
  { id: 'ar1', name: '가죽 조끼', kind: 'armor', grade: 1, armor: 4, price: 2000, text: '조금 덜 아프다.' },
  { id: 'ar2', name: '쇠사슬 셔츠', kind: 'armor', grade: 2, armor: 10, price: 20000, text: '칼날을 막는다.' },
  { id: 'ar3', name: '본부 코트', kind: 'armor', grade: 3, armor: 18, price: 140000, text: '두툼한 정의의 코트.' },
  { id: 'ar4', name: '사황의 망토', kind: 'armor', grade: 4, armor: 28, price: 800000, text: '걸치기만 해도 기가 산다.' },
  // 장신구
  { id: 'ch1', name: '행운의 동전', kind: 'charm', grade: 1, bonus: { luk: 5 }, price: 4000, text: '운 +5.' },
  { id: 'ch2', name: '기합 머리띠', kind: 'charm', grade: 2, bonus: { wil: 8 }, price: 30000, text: '정신 +8.' },
  { id: 'ch3', name: '바람 장화', kind: 'charm', grade: 2, bonus: { spd: 8 }, price: 30000, text: '속도 +8.' },
  { id: 'ch4', name: '전설의 해도', kind: 'charm', grade: 3, bonus: { int: 12, luk: 6 }, price: 200000, text: '지능 +12, 운 +6.' },
  // 소모품
  { id: 'potion', name: '회복약', kind: 'consumable', grade: 1, use: 'heal', price: 1500, text: '체력이 절반 아래일 때 30%를 되찾는다.' },
  { id: 'meat', name: '뼈 붙은 고기', kind: 'consumable', grade: 1, use: 'sp', price: 800, text: '기력이 바닥일 때 기력 40을 되찾는다.' },
  { id: 'seastone', name: '해루석 탄환', kind: 'consumable', grade: 1, use: 'seastone', price: 6000, text: '맞은 능력자는 3합 동안 열매 기술을 못 쓰고, 자연계는 그동안 실체가 잡혀 모든 공격이 그대로 들어간다.' },
  { id: 'net', name: '해루석 그물', kind: 'consumable', grade: 1, use: 'net', price: 5000, text: '첫 합에 던진다. 맞으면 상대가 한 합 묶이고, 묶인 자연계는 실체가 드러난다.' },
  { id: 'smoke', name: '연막 구슬', kind: 'consumable', grade: 1, use: 'smoke', price: 3000, text: '물러날 때 반드시 성공한다.' },
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i])) as Record<string, Item>;
