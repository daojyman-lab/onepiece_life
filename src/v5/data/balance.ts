export const V = {
  partsPerYear: 4,
  value: { max: 100, door: 6, moment: 18, deep: 55, leanBase: 10 },
  stopsPerYear: [ { to: 9, n: 1.5 }, { to: 15, n: 1.5 }, { to: 35, n: 2.5 }, { to: 200, n: 1.0 } ],
  stopsQuiet: 0.4,                             // 정점 이후, 은퇴 후
  lines: { dailyP: 0.8, minorP: 0.35, quietDailyP: 0.3 },
  growth: { perPart: 2.2, ageMult: [ { to: 15, m: 0.8 }, { to: 30, m: 1.0 }, { to: 45, m: 0.6 }, { to: 59, m: 0.25 }, { to: 200, m: 0 } ],
            masterMult: 2, paidCap: 4, stallP: 0.08, breakP: 0.03, breakAdd: 25 },
  hardship: { poor: 10, orphan: 15, outcast: 10, limb: 20, loss: 12, defeat: 6, afterFortune: 0.5 },
  fortune: { baseP: 0.004, perHardship: 0.0003, capP: 0.06, minAge: 12 },
  fight: { injuryBase: 0.15, injuryPerGap: 0.5, limbPerGap: 0.25, limbCap: 0.25, wonMult: 0.4, deathPerGap: 0.5, deathCap: 0.5, minorP: 0.25 },
  limb: { eye: { spd: 0.9, gun: 0.7 }, bothEyes: 0.6, arm: { str: 0.75 }, leg: { spd: 0.65 }, basic: 0.5, superior: 1.1, floor: 0.2 },
  risk: { illnessP: 0.03, illnessAge: 50, illnessPerYear: 0.005, accidentP: 0.003, oldFrom: 60, oldK: 0.0015, treatCost: 30000 },
  wealthMoney: { poor: 0, common: 20000, comfortable: 150000, noble: 800000 },
} as const;
