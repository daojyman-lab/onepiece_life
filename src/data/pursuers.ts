// 현상금을 노리고 해적을 쫓아오는 해군. 현상금(명성 × 1만 베리)이 높을수록 높은 계급이 온다.
// 실제로 오는 계급은 조금 흔들리고, 아주 운이 나쁘면 훨씬 강한 해군이 온다 (core/sim/prison.ts).
import type { SideFoe } from './sideStories';

export interface PursuerTier {
  rank: string;
  minFame: number;            // 이 현상금(명성)부터 이 계급이 온다
  power: number;              // 대장 힘의 절대값 (해역 강적 힘과 같은 잣대)
  prisonMonths: [number, number];
  level: number;              // 갇히는 임펠 다운 층
  foes: SideFoe[];
}

const marine = (x: Omit<SideFoe, 'faction' | 'mult'>): SideFoe => ({ ...x, faction: 'marine', mult: 1 });

export const PURSUER_TIERS: PursuerTier[] = [
  { rank: '대위 · 소령', minFame: 0, power: 20, prisonMonths: [8, 12], level: 1,
    foes: [
      marine({ name: '「철권」 풀보디', title: '해군 대위', skills: ['fist_jab', 'fist_combo', 'fist_iron'], canon: 'fullbody',
        officers: [{ name: '해군 하사', mult: 0.6, skills: ['gun_shot'] }] }),
      marine({ name: '「도끼손」 모건', title: '해군 대령 (셸스 타운)', bias: { str: 1.3 }, skills: ['sword_draw', 'sword_flash'], canon: 'morgan',
        officers: [{ name: '해군 상병', mult: 0.55, skills: ['gun_shot'] }] }),
      marine({ name: '「총잡이」 리퍼', title: '해군 소령', skills: ['gun_shot', 'gun_volley', 'gun_quick'],
        officers: [{ name: '해군 하사', mult: 0.6, skills: ['sword_draw'] }] }),
    ] },
  { rank: '중령 · 대령', minFame: 150, power: 36, prisonMonths: [10, 16], level: 2,
    foes: [
      marine({ name: '「흰 사냥꾼」 스모커', title: '해군 대령', fruit: 'moku', bias: { vit: 1.2 }, canon: 'smoker',
        officers: [{ name: '조장 타시기', mult: 0.7, skills: ['sword_flash', 'sword_draw'] }] }),
      marine({ name: '「검은 우리」 히나', title: '해군 대령', bias: { int: 1.3 }, skills: ['gun_bind', 'fist_combo', 'gun_quick'], canon: 'hina',
        officers: [{ name: '쟝고', mult: 0.6, skills: ['fist_jab'] }, { name: '풀보디', mult: 0.65, skills: ['fist_combo'] }] }),
      marine({ name: '「철벽」 네즈미', title: '해군 대령', skills: ['gun_volley', 'gun_snipe', 'fist_guard'], canon: 'nezumi',
        officers: [{ name: '해군 중사', mult: 0.6, skills: ['gun_shot'] }] }),
    ] },
  { rank: '준장 · 소장', minFame: 600, power: 62, prisonMonths: [12, 20], level: 3,
    foes: [
      marine({ name: '「사냥개」 가디언', title: '해군 소장', bias: { spd: 1.2 }, skills: ['sword_flash', 'sword_wave', 'arm_strike'],
        officers: [{ name: '해군 대령', mult: 0.7, skills: ['gun_volley'] }, { name: '해군 중령', mult: 0.65, skills: ['fist_combo'] }] }),
      marine({ name: '「철갑」 브랜뉴드', title: '해군 준장', bias: { vit: 1.3 }, skills: ['fist_iron', 'fist_guard', 'arm_hard'],
        officers: [{ name: '해군 대령', mult: 0.7, skills: ['sword_draw'] }] }),
    ] },
  { rank: '중장', minFame: 1500, power: 105, prisonMonths: [18, 30], level: 4,
    foes: [
      marine({ name: '「귀신 거미」 오니구모', title: '해군 본부 중장', bias: { spd: 1.2 }, skills: ['sword_flash', 'sword_wave', 'gun_volley', 'arm_strike'], canon: 'onigumo',
        officers: [{ name: '본부 대령', mult: 0.7, skills: ['gun_volley'] }, { name: '본부 대령', mult: 0.7, skills: ['fist_combo'] }] }),
      marine({ name: '「정의의 칼」 모모우사기', title: '해군 본부 중장', skills: ['sword_flash', 'sword_wave', 'arm_strike', 'arm_hard'], canon: 'momousagi',
        officers: [{ name: '본부 대령', mult: 0.7, skills: ['sword_draw'] }] }),
      marine({ name: '「대참관」 도베르만', title: '해군 본부 중장', bias: { str: 1.2 }, skills: ['sword_wave', 'sword_flash', 'arm_strike'], canon: 'doberman',
        officers: [{ name: '퍼시피스타', mult: 0.8, skills: ['gun_snipe', 'gun_volley'] }] }),
    ] },
  { rank: '대장', minFame: 3500, power: 160, prisonMonths: [30, 48], level: 6,
    foes: [
      marine({ name: '「아카이누」 사카즈키', title: '해군 본부 대장', fruit: 'magu', bias: { str: 1.3 }, canon: 'akainu',
        officers: [{ name: '본부 중장', mult: 0.7, skills: ['arm_strike', 'fist_combo'] }] }),
      marine({ name: '「키자루」 볼사리노', title: '해군 본부 대장', fruit: 'pika', bias: { spd: 1.5 }, canon: 'kizaru',
        officers: [{ name: '퍼시피스타', mult: 0.75, skills: ['gun_snipe', 'gun_volley'] }] }),
      marine({ name: '「아오키지」 쿠잔', title: '해군 본부 대장', fruit: 'hie', bias: { vit: 1.2 }, canon: 'aokiji',
        officers: [{ name: '본부 중장', mult: 0.7, skills: ['sword_flash'] }] }),
    ] },
];

/** 임펠 다운 층 이름 */
export const IMPEL_LEVELS = ['', '레벨 1 진홍 지옥', '레벨 2 맹수 지옥', '레벨 3 굶주림 지옥', '레벨 4 초열 지옥', '레벨 5 극한 지옥', '레벨 6 무한 지옥'];

export const PRISON_LINES = [
  '해루석 수갑이 손목을 파고들었다. 힘이 빠진다.',
  '간수가 채찍을 휘두르며 지나갔다. 이를 악물었다.',
  '옆 감방의 늙은 해적이 옛 바다 이야기를 들려주었다.',
  '하루 한 번 나오는 묽은 죽으로 버텼다.',
  '어둠 속에서 팔굽혀펴기를 천 번 했다. 몸만은 지켜야 한다.',
  '먼저 들어온 죄수가 탈옥 소문을 속삭였다.',
  '흩어진 동료들의 얼굴이 떠올라 잠이 오지 않았다.',
  '간수가 "네 현상금 포스터가 새로 붙었더라"며 비웃었다.',
];
