export const V = {
  partsPerYear: 4,
  value: { max: 100, door: 6, moment: 18, deep: 55, leanBase: 10 },
  stopsPerYear: [ { to: 9, n: 1.5 }, { to: 15, n: 1.5 }, { to: 35, n: 2.5 }, { to: 200, n: 1.0 } ],
  stopsQuiet: 0.4,                             // 정점 이후, 은퇴 후
  lines: { dailyP: 0.8, minorP: 0.35, quietDailyP: 0.3 },
  growth: { perPart: 2.2, ageMult: [ { to: 15, m: 0.8 }, { to: 30, m: 1.0 }, { to: 45, m: 0.6 }, { to: 59, m: 0.25 }, { to: 200, m: 0 } ],
            masterMult: 2, paidCap: 4, stallP: 0.08, breakP: 0.03, breakAdd: 25,
            tierUp: 100, maxTier: 6, noMasterCap: 3,
            tierPower: 0.25,                   // 힘 = 능력치 합 × (1 + 가장 높은 단계 × tierPower)
            studyObs: 0.5,                     // study가 견문색 숙련에 주는 몫 (perPart의 배수)
            // 활동마다 능력치가 1 오를 확률 (나이 배율을 곱한다)
            statP: { train: 0.9, study: 0.6, roam: 0.6 },
            branchStats: { fist: ['str', 'vit'], sword: ['str', 'spd'], gun: ['spd', 'luk'], observation: ['int', 'wil'],
                           armament: ['vit', 'wil'], conqueror: ['wil'], fruit: ['wil', 'vit'] },
            bareStats: ['str', 'spd', 'vit'],  // 갈래가 아직 없을 때 수련이 올리는 몸
            workMoney: 3000, familyBond: 2, restHp: 10 },
  // 한 토막의 활동: 기본 가중치 + Σ 가치관 점수 × 계수 + 처지
  activity: {
    base: 10,
    lean: {
      ambition: { train: 0.5 }, dominion: { train: 0.4, roam: 0.1 }, justice: { train: 0.25, work: 0.2 },
      devotion: { family: 0.4, work: 0.15 }, romance: { roam: 0.4 }, inquiry: { study: 0.5 },
      loyalty: { family: 0.25, train: 0.2 }, freedom: { roam: 0.5 }, peace: { rest: 0.35, family: 0.25 },
    },
    poorWork: 60, poorKidWork: 90, kidAge: 15, dutyWork: 30,
    lineBoost: 3,                              // 활동과 같은 쪽으로 기운 일상 기록이 뽑힐 배율
  },
  hardship: { poor: 10, orphan: 15, outcast: 10, limb: 20, loss: 12, defeat: 6, afterFortune: 0.5 },
  fortune: { baseP: 0.004, perHardship: 0.0003, capP: 0.06, minAge: 12 },
  surname: { revealMult: 3 },                  // 숨은 성이 밝혀지면 그 성씨의 bonus를 이만큼 곱해 한 번 더 더한다
  fight: { injuryBase: 0.15, injuryPerGap: 0.5, limbPerGap: 0.25, limbCap: 0.25, wonMult: 0.4, deathPerGap: 0.5, deathCap: 0.5, minorP: 0.25 },
  limb: { eye: { spd: 0.9, gun: 0.7 }, bothEyes: 0.6, arm: { str: 0.75 }, leg: { spd: 0.65 }, basic: 0.5, superior: 1.1, floor: 0.2 },
  risk: { illnessP: 0.03, illnessAge: 50, illnessPerYear: 0.005, accidentP: 0.003, oldFrom: 60, oldK: 0.0015, treatCost: 30000 },
  wealthMoney: { poor: 0, common: 20000, comfortable: 150000, noble: 800000 },
  birth: { stat: 5, statFloor: 1, talents: { min: 2, max: 3 }, startAge: 3 },
  hp: { max: 100 },
  log: { keep: 400 },                          // 기록은 최근 이만큼만 남긴다
  person: { bond: 50, bondMax: 100 },          // 새로 만난 사람의 처음 유대, 유대의 끝
} as const;
