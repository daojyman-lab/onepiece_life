// 동료의 성격. 한눈에 알아보게: 꼬리표 이름 · 한 줄 설명 · 싸우는 방식(전법 · 능력치 · 상시 효과) · 이야기에 나오는 버릇.
import type { Stats, Tactic } from '../core/types';

export interface CrewTrait {
  id: string; name: string;
  desc: string;                     // 화면에 보이는 한 줄
  bias: Partial<Stats>;             // 능력치에 곱한다
  tactic: Tactic;
  passive: { guard?: number; dodge?: number; buff?: number };
  lines: string[];                  // 이야기에 나오는 버릇. {name}
  feast: string;                    // 회식 때의 반응
}

export const CREW_TRAITS: CrewTrait[] = [
  { id: 'hot', name: '다혈질', desc: '먼저 뛰어든다 · 공세 · 피해 +10%', bias: { str: 1.15 }, tactic: 'offense', passive: { buff: 0.1 },
    feast: '{name}이(가) 옆 테이블과 팔씨름을 붙어 다섯 판을 내리 이겼다.',
    lines: ['{name}이(가) 시비를 건 뱃사람과 주먹다짐을 벌였다. 이겼다며 의기양양했다.', '{name}이(가) "다 덤벼!"라며 혼자 앞장서 뛰어나갔다.', '{name}이(가) 사소한 일로 버럭 화를 냈다가 금세 잊어버렸다.'] },
  { id: 'careful', name: '신중파', desc: '살피고 움직인다 · 수비 · 받는 피해 −10%', bias: { int: 1.15, vit: 1.05 }, tactic: 'defense', passive: { guard: 0.1 },
    feast: '{name}은(는) 한 잔만 마시고 끝까지 계산을 맞췄다.',
    lines: ['{name}이(가) 해도를 세 번이나 다시 확인했다.', '{name}이(가) 출항 전에 식량과 물을 하나하나 셌다.', '{name}이(가) "서두르면 죽는다"며 모두를 붙잡았다.'] },
  { id: 'loyal', name: '의리파', desc: '등을 맡길 수 있다 · 피해 +5%, 받는 피해 −5%', bias: { vit: 1.1, wil: 1.1 }, tactic: 'offense', passive: { guard: 0.05, buff: 0.05 },
    feast: '{name}이(가) 잔을 들고 "우리 선장을 위하여!"를 외쳤다.',
    lines: ['{name}이(가) "선장이 가는 곳이 내가 가는 곳"이라며 웃었다.', '{name}이(가) 다친 동료의 몫까지 밤 경계를 섰다.', '{name}이(가) 네 험담을 하던 술꾼을 혼내 주었다고 한다.'] },
  { id: 'glutton', name: '먹보', desc: '잘 먹고 잘 버틴다 · 체력이 크다', bias: { vit: 1.3 }, tactic: 'endurance', passive: {},
    feast: '{name}이(가) 고기를 열 접시 비우고도 디저트를 시켰다.',
    lines: ['{name}이(가) 식량 창고의 고기를 몰래 먹다 걸렸다.', '{name}이(가) 항구에 내리자마자 식당 세 곳을 돌았다.', '{name}의 배에서 나는 꼬르륵 소리에 모두 잠을 깼다.'] },
  { id: 'braggart', name: '허풍쟁이', desc: '말은 크지만 운이 좋다 · 치명타가 잦다', bias: { luk: 1.6, spd: 1.05 }, tactic: 'offense', passive: { buff: 0.05 },
    feast: '{name}의 무용담에 선술집 손님들까지 모여들었다.',
    lines: ['{name}이(가) "해왕류를 맨손으로 잡은 적이 있다"고 떠벌렸다.', '{name}의 무용담이 어제보다 두 배로 부풀어 있었다.', '{name}이(가) 아이들에게 거짓 모험담을 들려주며 박수를 받았다.'] },
  { id: 'coward', name: '겁쟁이', desc: '무서우면 더 잘 피한다 · 회피 +12%', bias: { spd: 1.15 }, tactic: 'defense', passive: { dodge: 0.12 },
    feast: '{name}이(가) 처음으로 큰 소리로 웃었다.',
    lines: ['{name}이(가) 갈매기 그림자에 놀라 돛대 뒤에 숨었다.', '{name}이(가) "섬에 들어가면 안 되는 병"이 도졌다며 배에 남았다.', '{name}이(가) 떨면서도 끝까지 자리를 지켰다.'] },
  { id: 'cold', name: '냉정한', desc: '틈을 노린다 · 반격 · 피해 +8%', bias: { spd: 1.1, int: 1.05 }, tactic: 'counter', passive: { buff: 0.08 },
    feast: '{name}은(는) 구석에서 조용히 잔을 들어 보였다. 그게 최고의 칭찬이다.',
    lines: ['{name}은(는) 소란 속에서도 표정 하나 바꾸지 않았다.', '{name}이(가) 말없이 칼을 갈았다.', '{name}이(가) 적의 버릇을 하나하나 적어 두었다.'] },
  { id: 'optimist', name: '낙천가', desc: '지지 않는 마음 · 정신이 강하다 · 받는 피해 −5%', bias: { wil: 1.25 }, tactic: 'endurance', passive: { guard: 0.05 },
    feast: '{name}이(가) 노래를 시작하자 모두가 따라 불렀다.',
    lines: ['{name}이(가) "어떻게든 되겠지!"라며 크게 웃었다.', '폭풍 속에서도 {name}은(는) 노래를 불렀다.', '{name} 덕분에 침울하던 배에 웃음이 돌았다.'] },
  { id: 'drinker', name: '술고래', desc: '취할수록 강하다 · 지구전 · 힘이 세다', bias: { str: 1.1, vit: 1.1 }, tactic: 'endurance', passive: { buff: 0.04 },
    feast: '{name}이(가) 술통을 통째로 들고 마시다 탁자 위에서 잠들었다.',
    lines: ['{name}이(가) 술통 하나를 혼자 비우고 갑판에서 잤다.', '{name}이(가) 항구 술집에서 술 겨루기를 해서 이겼다.', '{name}이(가) 아침부터 술 냄새를 풍겼다.'] },
  { id: 'romantic', name: '로맨티스트', desc: '멋을 안다 · 빠르고 운이 좋다', bias: { spd: 1.1, luk: 1.2 }, tactic: 'offense', passive: { dodge: 0.04 },
    feast: '{name}이(가) 선술집 주인에게 꽃을 건네다 퇴짜를 맞았다.',
    lines: ['{name}이(가) 항구의 꽃 파는 사람에게 반해 하루 종일 꽃을 샀다.', '{name}이(가) 달을 보며 시를 읊었다. 아무도 듣지 않았다.', '{name}이(가) 편지를 쓰다 지우기를 반복했다.'] },
  { id: 'prankster', name: '장난꾸러기', desc: '종잡을 수 없다 · 빠르다 · 회피 +6%', bias: { spd: 1.2 }, tactic: 'offense', passive: { dodge: 0.06 },
    feast: '{name}이(가) 모두의 잔에 고추를 몰래 넣었다. 다들 웃다가 울었다.',
    lines: ['{name}이(가) 잠든 동료 얼굴에 수염을 그렸다.', '{name}이(가) 소금과 설탕 통을 바꿔 놓았다. 저녁이 엉망이었다.', '{name}의 장난에 모두 화를 내다가 결국 웃었다.'] },
  { id: 'stoic', name: '과묵한 무인', desc: '말 대신 칼 · 힘과 정신 · 피해 +6%', bias: { str: 1.1, wil: 1.1 }, tactic: 'counter', passive: { buff: 0.06 },
    feast: '{name}은(는) 말없이 고개를 끄덕이며 끝까지 자리를 지켰다.',
    lines: ['{name}이(가) 새벽부터 해 질 때까지 말없이 수련했다.', '{name}이(가) 고개만 한 번 끄덕였다. 그걸로 충분했다.', '{name}의 수련 소리가 갑판을 울렸다.'] },
];

export const CREW_TRAIT_BY_ID = Object.fromEntries(CREW_TRAITS.map((t) => [t.id, t])) as Record<string, CrewTrait>;
