// 스승의 시험 임무. 높은 단계를 가르치는 스승을 만났는데 그 아래 단계(오의 등)가 막혀 있으면,
// 스승이 먼저 시험을 내리고 통과하면 아래 단계부터 가르친다 (core/sim/trial.ts).
// 미호크가 "휴먼드릴부터 잡고 와라"라고 했던 것처럼.
import type { SideFoe } from './sideStories';

/** 큰 단계의 바로 아래 단계. 이것이 없으면 위 단계를 배울 수 없다 */
export const PREV_GATE: Record<string, string> = {
  'martial.fist.grand': 'martial.fist.master',
  'martial.sword.grand': 'martial.sword.master',
  'martial.gun.grand': 'martial.gun.master',
  'haki.armament.hard': 'haki.armament.awaken',
  'haki.armament.flow': 'haki.armament.hard',
  'haki.observation.sharp': 'haki.observation.awaken',
  'haki.observation.future': 'haki.observation.sharp',
};

/** 아래 단계 수련 기간 (보통의 1.5배) */
export const TRIAL_TEACH_MONTHS = 18;

export interface MasterTrial {
  order: string;          // 스승이 내리는 말
  short: string;          // 선택지 설명에 쓰는 짧은 말
  story: string[];        // 시험 동안의 기록 (한 달에 하나)
  foe: SideFoe;
  clear: string;          // 통과했을 때 스승의 말
}

const civil = (x: Omit<SideFoe, 'faction'>): SideFoe => ({ ...x, faction: 'civil' });

export const MASTER_TRIALS: Record<string, MasterTrial> = {
  m_mihawk: {
    order: '"오의도 모르는 자에게 극의는 없다. 쿠라이가나 섬의 휴먼드릴 우두머리를 베고 와라. 녀석들은 본 대로 칼을 흉내 낸다."',
    short: '쿠라이가나 섬의 휴먼드릴 우두머리를 벤다',
    story: ['폐허가 된 성 둘레 숲에서 칼을 든 휴먼드릴 무리가 덤벼들었다.', '원숭이들이 내 칼 쓰는 법을 그대로 흉내 냈다. 등골이 서늘했다.'],
    foe: civil({ name: '휴먼드릴 우두머리', title: '쿠라이가나의 비비', mult: 0.85, bias: { str: 1.2, spd: 1.1 }, skills: ['sword_flash', 'sword_wave', 'sword_draw'],
      officers: [{ name: '칼 든 휴먼드릴', mult: 0.45, skills: ['sword_cut'] }, { name: '칼 든 휴먼드릴', mult: 0.45, skills: ['sword_cut'] }] }),
    clear: '"…흉내 내는 원숭이를 넘었군. 좋다, 오의부터 가르쳐 주마."',
  },
  m_yasopp: {
    order: '"저 바위섬 꼭대기의 깃발, 한 발로 떨어뜨려 봐. 섬을 지키는 저격대 녀석들을 뚫고 말이야."',
    short: '바위섬 저격대를 뚫고 깃발을 쏘아 떨어뜨린다',
    story: ['파도 너머 바위섬에서 총알이 날아왔다. 몸을 숨기고 바람을 읽었다.', '사흘 밤낮 저격대와 숨바꼭질을 했다.'],
    foe: civil({ name: '「천리안」 저격대장', title: '바위섬 저격대', mult: 0.85, bias: { spd: 1.3 }, skills: ['gun_snipe', 'gun_quick', 'gun_shot'],
      officers: [{ name: '저격대원', mult: 0.45, skills: ['gun_shot'] }] }),
    clear: '"하하, 제법이잖아! 좋아, 사격의 오의부터 알려 주지."',
  },
  m_garp: {
    order: '"주먹이 가볍구먼! 콜보산 산적 두목을 맨주먹으로 잡아 와라. 그 전엔 밥도 없다!"',
    short: '콜보산 산적 두목을 맨주먹으로 잡는다',
    story: ['콜보산의 깊은 골짜기에서 곰과 멧돼지에게 쫓겼다.', '산적 소굴을 찾아냈다. 술 냄새가 진동했다.'],
    foe: civil({ name: '산적 두목 히그마', title: '콜보산 산적', mult: 0.85, bias: { str: 1.2 }, skills: ['fist_combo', 'fist_iron', 'sword_cut'], canon: 'higuma',
      officers: [{ name: '산적', mult: 0.45, skills: ['fist_jab'] }] }),
    clear: '"으하하하! 사랑의 주먹을 받을 자격이 생겼구먼!"',
  },
  m_rayleigh: {
    order: '"패기는 몸으로 깨닫는 거다. 루스카이나 섬에서 맹수들 틈에 살아남아 그 섬의 왕을 쓰러뜨려 봐라."',
    short: '루스카이나 섬의 맹수 왕을 쓰러뜨린다',
    story: ['계절이 하루에도 몇 번씩 바뀌는 섬. 맹수들이 밤낮없이 덤벼들었다.', '맹수의 기척을 먼저 느끼기 시작했다.'],
    foe: civil({ name: '루스카이나의 맹수 왕', title: '섬의 주인', mult: 0.85, bias: { str: 1.3, vit: 1.2 }, skills: ['fist_iron', 'fist_quake', 'fist_combo'] }),
    clear: '"살아 돌아왔군. 그럼 시작하자."',
  },
  m_hyogoro: {
    order: '"흐름을 알고 싶으면 먼저 단단함을 알아야지. 광산 간수장을 쓰러뜨리고 오너라."',
    short: '광산 간수장을 쓰러뜨린다',
    story: ['광산의 어둠 속에서 쇠사슬 소리가 울렸다.', '죄수들이 몰래 주먹밥을 나눠 주었다.'],
    foe: civil({ name: '광산 간수장', title: '감옥 광산', mult: 0.85, bias: { vit: 1.3 }, skills: ['arm_strike', 'arm_hard', 'fist_iron'] }),
    clear: '"그래, 그 단단함이다. 이제 흐르게 해 보자."',
  },
  m_seo: {
    order: '"보는 눈부터 갈고닦아라. 안개 계곡의 그림자 사냥꾼을 눈을 가린 채 쓰러뜨리고 오너라."',
    short: '안개 계곡의 그림자 사냥꾼을 쓰러뜨린다',
    story: ['안개가 짙어 한 발 앞도 보이지 않았다. 귀와 피부로 길을 찾았다.', '그림자 사냥꾼의 기척이 등 뒤에서 사라졌다 나타났다.'],
    foe: civil({ name: '그림자 사냥꾼', title: '안개 계곡', mult: 0.85, bias: { spd: 1.4 }, skills: ['sword_flash', 'gun_quick', 'fist_combo'] }),
    clear: '"눈을 감고도 보았구나. 이제 앞날을 보는 법을 배우자."',
  },
  m_nyon: {
    order: '"여인섬의 투기장에서 전사장을 꺾고 오너라. 그 정도는 해야 가르칠 맛이 나지."',
    short: '여인섬 투기장의 전사장을 꺾는다',
    story: ['투기장 관중석이 함성으로 떠나갈 듯했다.', '활과 창을 쓰는 전사들이 차례로 덤볐다.'],
    foe: civil({ name: '구사 전사장', title: '여인섬 투기장', mult: 0.85, bias: { spd: 1.2 }, skills: ['gun_snipe', 'fist_combo', 'arm_strike'] }),
    clear: '"흥, 제법이구나. 따라오너라."',
  },
};

/** 시험이 따로 없는 스승의 기본 시험 */
export const DEFAULT_TRIAL: MasterTrial = {
  order: '"아직 이르다. 이 섬을 괴롭히는 패거리 두목을 혼자서 잡아 오너라. 그러면 기초부터 다져 주마."',
  short: '섬을 괴롭히는 패거리 두목을 혼자 잡는다',
  story: ['패거리의 소굴을 찾아 섬을 뒤졌다.', '두목이 밤마다 항구를 턴다는 이야기를 들었다.'],
  foe: civil({ name: '패거리 두목', title: '섬의 무법자', mult: 0.85, skills: ['fist_combo', 'sword_cut', 'gun_shot'] }),
  clear: '"좋다. 약속대로 가르쳐 주마."',
};

export const trialOf = (masterId: string) => MASTER_TRIALS[masterId] ?? DEFAULT_TRIAL;
