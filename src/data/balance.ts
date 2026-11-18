// 수치 모음. 규칙 코드에 숫자를 직접 쓰지 않는다. 모두 출발값이며 대량 시뮬레이션으로 맞춘다.
import type { BranchId, StatKey, Tactic } from '../core/types';

export const B = {
  log: { max: 300 },
  // 한 달에 걸리는 시간(ms). 1배속은 1년이 18초. 기록을 읽을 수 있는 속도 (2026-11-14 600 → 1500)
  // 이야기 한 줄이 떠오르는 간격(ms)과 한 달 사이의 쉼. 배속으로 나눈다. 1배속이면 1년이 약 40초 (2026-11-14)
  clock: { lineMs: 2200, quickLineMs: 700, monthMs: 1000, quickTypes: ['money', 'growth'] as string[] },
  // 전투 기록 한 줄의 간격(ms). 배속으로 나눈다 (1배속 1120 = 예전 4배 느리게)
  battleLineMs: 1120,

  // ---- 시간 · 유년기
  childhood: { ages: [3, 6, 9], startTickAge: 10 },
  startYear: 1490,

  // ---- 자동 성장 (03 문서 4장)
  growth: {
    byAge: [
      { max: 15, rate: 0.5 }, { max: 30, rate: 0.6 }, { max: 45, rate: 0.35 }, { max: 59, rate: 0.15 }, { max: 999, rate: 0 },
    ],
    noFocusEach: 0.2 / 6,     // 주력이 없으면 여섯 능력치가 고르게 (월 0.2를 나눔)
    secondaryMult: 0.5,
    // 패기 칸 · 열매 칸은 주력 · 보조와 따로 자란다. 능력치는 조금, 숙련은 꾸준히
    slot: { hakiStat: 0.3, hakiMastery: 0.6, fruitStat: 0.35, fruitMastery: 0.7 },
    masterMult: 2,
    heavyInjuryMult: 0.5,
    split: {
      'martial.fist': { str: 0.5, vit: 0.3, spd: 0.2 },
      'martial.sword': { str: 0.4, spd: 0.4, wil: 0.2 },
      'martial.gun': { spd: 0.5, int: 0.3, luk: 0.2 },
      'haki.observation': { wil: 0.4, spd: 0.3, int: 0.3 },
      'haki.armament': { wil: 0.5, vit: 0.3, str: 0.2 },
      'haki.conqueror': { wil: 0.7, luk: 0.3 },
      'fruit': { int: 0.5, wil: 0.3, vit: 0.2 },
    } as Record<BranchId, Partial<Record<StatKey, number>>>,
    masteryPerMonth: 1.6,     // ÷ 기술 단계
    battleMastery: { routine: 0.5, elite: 2, winMult: 1.5 },
    eliteWinStat: 0.6,        // 강적을 이기면 오르는 능력치 (상대 힘 비율에 곱함)
  },

  // ---- 해군: 이 계급(하사)부터 자기 분대를 꾸린다. 정원 = base + (계급 − squadRank) ÷ 2
  marine: { squadRank: 3, squadBase: 2, squadMax: 10 },

  // ---- 집중 수련: 그동안 벌이가 없고 임무를 쉬는 대신 능력치 · 숙련이 mult배로 자란다
  training: { mult: 2, options: [3, 6], minAge: 15 },   // 유년기 · 수련기 초반에는 못 한다

  // ---- 스승 찾기: 최대 months개월. 찾을 확률 = base + 운 × perLuk + 항해사 동료, 찾는 달은 2~months. 여비 × 해역 단계
  seek: { months: 12, base: 0.45, perLuk: 0.004, navigator: 0.1, max: 0.85, cost: 8000 },

  // ---- 배신의 기미: 의심받는 동료가 진짜 배신자일 확률, 몰래 지켜볼 때 알아챌 확률(기본 + 지능마다)
  betrayal: { traitorP: 0.5, watchBase: 0.4, watchPerInt: 0.01, watchMax: 0.95, hurtLeaveP: 0.4, stealPct: 0.25, duelLoseStealPct: 0.2 },

  // ---- 패기 · 열매를 얻는 확률 (2026-11-14 낮춤)
  haki: { awakenP: 0.35, awakenNeedP: 0.4, awakenConquerorP: 0.5, conquerorSeed: 0.3, conquerorOther: 0.02 },

  // ---- 선택 (03 문서 5장)
  // perYear: 한 해에 멈추는 수(중대한 선택 + 강적 준비)의 상한. randomCap: 그중 무작위 선택이 뜰 수 있는 한도
  choice: { gapMin: 2, gapMax: 4, perYear: 5, randomCap: 4, fruitAskWithin: 6, retrainYears: 3 },
  // 작은 사건: 달마다 일어날 확률, 유년기에 건너뛰는 해마다 일어나는 수
  // 달마다 한 줄씩 하루를 그린다. 그중 statShare는 능력치가 오르는 작은 사건, 나머지는 일상 한 줄
  lifeEvents: { statShare: 0.4, childPerYear: 4, dailyCooldown: 24, crewTraitShare: 0.3 },
  // 임무 강적의 승률이 이 값 이상이면 준비 화면 없이 자동으로 싸운다
  autoElite: { minRate: 0.7, runs: 60 },

  // ---- 몸 (03 문서 7장)
  body: {
    injury: {
      light: { months: 2, statMult: 0.95 },
      heavy: { months: 6, statMult: 0.8 },
      scar: { amount: 3 },
      heavyToScarIfFight: 0.3,
      treatMult: 0.5,
    },
    illness: {
      yearly: 0.04, agePerYear: 0.005, ageFrom: 50, heavyInjuryAdd: 0.05,
      worsenEvery: 4, stage3DeathMonthly: 0.03, medicMult: 0.5,
    },
    aging: { from1: 46, rate1: 0.01, from2: 60, rate2: 0.03 },
    oldAge: { from: 60, k: 0.0015 },
    healthRecover: 4,         // 다치지 않았을 때 달마다 되찾는 건강
  },

  // ---- 돈 (03 문서 8장)
  money: {
    living: 300,              // × 해역 단계
    spouse: 250, child: 200,  // 가족 부양 (× 해역 단계, 달마다). 아이는 18세까지
    pirateIncome: 450,        // × 해역 단계. 해적 · 혁명군의 달마다 벌이 (약탈, 잡일)
    marineSalary: 900,        // × (계급+1) × 해역 단계
    pirateLoot: [800, 3000],  // × 해역 단계, 평소 교전 승리 때
    treatInjury: { light: 1000, heavy: 3000 },   // × 해역 단계
    treatIllness: 4000,      // × 해역 단계
    appraise: 5000,           // × 해역 단계
    fruitSell: [0, 20000, 60000, 150000, 400000, 1000000],   // 등급별
    loseMoneyPct: 0.2,
  },

  // ---- 전투 (04 문서)
  combat: {
    maxRounds: 20,
    hp: { base: 80, perVit: 8, healthFloor: 0.5 },
    sp: { base: 40, perWil: 4 },
    defPerVit: 0.6,
    initiativeRand: 10,
    basicRecover: 5,
    mastery: { min: 0.7, span: 0.6 },
    crit: { base: 0.05, perLuk: 0.001, mult: 1.5 },
    dodge: { base: 0.03, perSpd: 0.003, max: 0.25, perObs: 0.05, areaMult: 0.5 },
    logia: [0.25, 0.5, 0.75, 1],
    defenseK: 2,
    rand: [0.9, 1.1],
    bigPower: 2.0,
    tactic: {
      offense: { deal: 1.15, take: 1.15, cost: 1 },
      defense: { deal: 0.9, take: 0.8, cost: 1 },
      counter: { deal: 0.95, take: 1.0, cost: 1, counterDeal: 1.4 },
      endurance: { deal: 0.95, take: 0.95, cost: 0.7, lateRound: 10, lateDeal: 1.2 },
    } as Record<Tactic, { deal: number; take: number; cost: number; counterDeal?: number; lateRound?: number; lateDeal?: number }>,
    helperPower: 0.5, supportHelperPower: 0.7,
    medicEvery: 3, medicHeal: 0.15,
    restSp: 0.2,
    // 물러나기 주사위: 성공 확률 = base + perShare × (내 속도 몫 − 0.5), 내 속도 몫 = 내 속도 ÷ (내 속도 + 상대 속도).
    // 연막(smoke)은 확률에 smoke를 더한다. 확률은 min~max로 묶는다 (실패할 수 없는 물러나기는 없다)
    retreat: { base: 0.5, perShare: 0.8, min: 0.15, max: 0.9, smoke: 0.3 },
    // 누구라도 체력이 이 몫 아래로 떨어지면 목숨을 건 싸움으로 바뀌고 더는 물러날 수 없다
    // (보통 성향의 자동 물러나기 문턱 30%보다 낮게 두어, 물러날 틈이 먼저 온다)
    deathmatchBelow: 0.25,
    drown: { hpBelow: 0.3, p: 0.2, navigatorP: 0.1 },
    seastoneSeal: 3,
    preview: { runs: 200, noiseBase: 15, noisePerInt: 0.1 },
    risk: { safe: 0.7, danger: 0.35 },
    deathP: { safe: 0, danger: 0.05, lethal: 0.25 },
    deathLukReduce: 0.003,
    nearDeathGateP: 0.08,
    result: {
      win: { light: 0.1 },
      retreat: { light: 0.3 },
      lose: { light: 0.5, heavy: 0.35, scar: 0.15 },
    },
    crewDeathLethal: 0.05,
    crewInjuryMonths: 4,
    routine: {
      chance: { pirate: 0.12, marine: 0.15, revolution: 0.12, none: 0.03 }, missionAdd: 0.05, loseLight: 0.4,
    },
    scout: { midInt: 30, fullInt: 60 },
  },

  // ---- 세계
  world: {
    missionsPerSea: 3,
    refillMonths: 6,
    bossRetryAskMonths: 12,
    fameBossMult: 1,
    rankFromBoss: 1,
    routeAge: 16,
  },

  // ---- 동료
  // fruitPowerMult · fruitPowerAdd: 동료가 열매를 먹으면 힘 × (1 + 배율 × 등급) + 더함 × 등급
  crew: { powerPerLevel: 6, levelEveryMonths: 12, maxLevel: 30, shipwrightDiscount: 0.8, fruitPowerMult: 0.06, fruitPowerAdd: 3,
    // 부선장: 본인 피해 +15% · 받는 피해 −5%, 다른 동료 피해 +5%. 회식: 동료 피해 +10%가 feastMonths 동안, 값은 1인당 × 해역 단계
    mateBuff: 0.15, mateGuard: 0.05, mateLead: 0.05, feastBuff: 0.1, feastMonths: 6, feastCostPer: 3000, feastBond: 8,
    recallCost: 2000 },   // 흩어진 옛 동료를 전보벌레로 부르는 여비 (× 해역 단계)
};
