export const V = {
  partsPerYear: 4,
  // 항해: 바다를 다니는 처지(해적 · 해군 · 혁명군 · 사냥꾼 · 칠무해 · CP)는 해마다 p의 확률로 같은 바다의 다른 섬으로 옮겨 간다.
  // 아직 들르지 않은 섬은 fresh배 더 잘 뽑힌다. 들른 섬은 표시 'at:섬'으로 남는다
  // 전투 등급(화면 표시): 종합 전투력 = 능력치 합 × (무술 단계의 배율 + fruit × (열매 단계의 배율 − 1) + haki × Σ(패기 단계의 배율 − 1)).
  // 싸움의 계산(power5)은 바꾸지 않는다. 등급의 경계는 data/words.ts의 GRADES
  grade: { fruit: 0.5, haki: 0.25 },
  voyage: { p: 0.45, minAge: 16, fresh: 3, longDays: 7, stopoverP: 0.35, storesMax: 6, rationHp: 3 },
  value: { max: 100, door: 6, moment: 18, deep: 55, leanBase: 10,
           greedProfit: 1.5,                   // 제 잇속을 택해 실제로 돈을 챙기는 선택
           greedMoney: 1.25,                   // 탐욕이 깊으면 들어오는 돈(효과 money의 양수)이 이만큼 불어난다 (돈 냄새를 맡는다)
           soften: 0.85 },                     // 과제 13: 높을수록 덜 오른다. 오르는 양 × (1 − 지금 점수/max × soften)
  stopsPerYear: [ { to: 9, n: 1.5 }, { to: 15, n: 1.5 }, { to: 35, n: 2.5 }, { to: 200, n: 0.9 } ],
  stopsQuiet: 0.4,
  // 전성기 (통합 기획 5장): minAge~maxAge살에 들어설 수 있고 years해 동안, 한 살에 토막을 두 바퀴 돈다
  prime: { minAge: 22, maxAge: 40, years: 5, tier: 3 },
  // 노화: from살부터 한 해에 rolls번, 확률 start + perYear×(나이−from) + wear×(잃은 부위 + 부상)로 근력 · 속도 · 체력 하나가 1 줄어든다 (cap까지)
  aging: { from: 50, start: 0.25, perYear: 0.03, wear: 0.1, cap: 0.9, rolls: 2, lineP: 0.35 },                             // 정점 이후, 은퇴 후
  queue: { maxTries: 8 },                      // 줄 선 전환점을 이만큼 열지 못하면 줄에서 버린다
  turning: { maxRepeat: 3 },                   // 되풀이되는 전환점도 한 인생에 많아야 이만큼 (Turning.max가 없을 때)
  lines: { dailyP: 0.8, minorP: 0.35, quietDailyP: 0.3,
           noRepeat: 12 },                    // 일상 · 자잘한 일의 글은 최근 이만큼 낸 것을 다시 뽑지 않는다
  growth: { perPart: 5, ageMult: [ { to: 15, m: 1.0 }, { to: 40, m: 1.0 }, { to: 50, m: 0.6 }, { to: 59, m: 0.25 }, { to: 200, m: 0 } ],
            masterMult: 10, paidCap: 4, stallP: 0.08, breakP: 0.03, breakAdd: 25,
            tierUp: 100, maxTier: 6, noMasterCap: 3,
            // 단계의 힘 배율 (0~6단계). 힘 = 능력치 합 × tierCurve[가장 높은 단계]. 전투에서도 주인공의 능력치에 곱한다
            tierCurve: [1, 1.3, 1.7, 2.2, 2.8, 3.6, 4.6],
            studyObs: 0.5,                     // study가 견문색 숙련에 주는 몫 (perPart의 배수)
            // 활동마다 능력치가 1 오를 확률 (나이 배율을 곱한다)
            statP: { train: 0.9, study: 0.6, roam: 0.6 },
            branchStats: { fist: ['str', 'vit'], sword: ['str', 'spd'], gun: ['spd', 'luk'], observation: ['int', 'wil'],
                           armament: ['vit', 'wil'], conqueror: ['wil'], fruit: ['wil', 'vit'] },
            bareStats: ['str', 'spd', 'vit'],  // 갈래가 아직 없을 때 수련이 올리는 몸
            workMoney: 3000, familyBond: 2, restHp: 10,
            kidWorkMoney: 500,
            // 선호도 (숙련과 별개, 설계 5.4): 수련할 갈래는 선호도가 가장 높은 갈래다.
            // 재능은 태어날 때 talent만큼, 수련은 한 토막에 train만큼, 고른 일의 숙련은 그 fromMastery 배만큼 쌓는다.
            // 스승을 들이면 그 갈래가 가장 높은 선호도보다 masterLead만큼 앞선다 (길이 바뀌는 큰 일). pathAge살부터 길을 기록에 알린다
            pref: { talent: 15, train: 1, fromMastery: 0.5, masterLead: 10, pathAge: 6 } },               // activity.kidAge 이하 아이가 일해서 제 손에 남는 돈 (나머지는 식구가 먹는다)
  // 한 토막의 활동: 기본 가중치 + Σ 가치관 점수 × 계수 + 처지
  activity: {
    base: 10,
    lean: {
      ambition: { train: 0.5 }, dominion: { train: 0.4, roam: 0.1 }, justice: { train: 0.25, work: 0.2 },
      greed: { work: 0.45 }, romance: { roam: 0.4 }, inquiry: { study: 0.5 },
      loyalty: { family: 0.25, train: 0.2 }, freedom: { roam: 0.5 }, peace: { rest: 0.35, family: 0.25 },
    },
    poorWork: 5, poorKidWork: 90, kidAge: 15, dutyWork: 30,
    lineBoost: 3,                              // 활동과 같은 쪽으로 기운 일상 기록이 뽑힐 배율
  },
  hardship: { poor: 40, orphan: 60, outcast: 10, limb: 20, loss: 6, defeat: 3, afterFortune: 0.5 },
  fortune: { baseP: 0.0002, perHardship: 0.0003, capP: 0.06, minAge: 16 },
  surname: { revealMult: 3 },                  // 숨은 성이 밝혀지면 그 성씨의 bonus를 이만큼 곱해 한 번 더 더한다
  fight: { injuryBase: 0.15, injuryPerGap: 0.5, limbPerGap: 0.25, limbCap: 0.25, wonMult: 0.4, deathPerGap: 0.5, deathCap: 0.5, minorP: 0.25,
           injuryFloor: 0.05, injuryCap: 0.9, injuryGapFrom: 0.8, limbGapFrom: 1, deathGapFrom: 0.6,
           minPower: 1,                       // 힘이 0이어도 나누기가 되도록
           officerShare: 0.5,                 // 상대의 힘에 더하는 간부의 몫
           hakiTier: 2, fruitTier: 1,         // 상대의 패기 1레벨 = 단계 2, 열매 = 단계 1 (힘을 셀 때)
           maxSkills: 6, skillMastery: { base: 60, span: 40, max: 100 },   // 기술 숙련 = base + span × 단계/최대단계
           passiveScale: { base: 0.7, span: 0.6 },   // 패시브 기술의 효과 = 값 × (base + span × 숙련/100), v4와 같다
           hakiLevelPer: 2, hakiLevelMax: 3,  // 전투의 패기 레벨 = min(3, ⌊단계 / 2⌋)
           retreat: { calm: 0.5, usual: 0.3, never: 0 },
           retreatDeath: 0.5,                 // 목숨을 건 싸움에서 몸을 빼낸 사람이 죽을 확률 = 죽을 확률 × 이것
           famePerPower: 0.1, minorFame: 1,
           // 이름 있는 상대의 능력치(간부 포함)에 곱하는 배율, 상대가 나오는 바다별 (v4 보스는 v4의 레벨 성장에 맞춰져 있다)
           foeScale: { east: 0.4, west: 0.4, north: 0.4, south: 0.4, gl_entry: 0.28, gl_first: 0.2, sabaody: 0.17, nw_first: 0.36, nw_late: 0.25 },
           dangerKidAge: 15 },                // 이 나이 이하로 고향 섬에 있으면 가장 낮은 바다의 위험 속에 산다
  adultAge: 16,                                // 아직 아이인 사람은 이 나이에 저절로 어른(civil)이 된다
  fame: { bounty: 1000000 },                   // 명성 1 = 현상금(해군은 공적) 100만 베리
  // 아무 열매나 먹을 때 등급(1 쓰레기 ~ 5 전설)마다 뽑힐 가중치. 원작 인물의 열매는 뽑지 않는다
  fruit: { gradeWeight: { 1: 40, 2: 30, 3: 15, 4: 6, 5: 2 },
           startTier: 1 },                     // 열매를 먹으면 열매 갈래가 적어도 이 단계에서 시작한다
  injury: { months: { light: 3, heavy: 9, scar: 0 }, monthsPerPart: 3,   // 흉터(scar)는 낫지 않는다
            statMult: { light: 0.95, heavy: 0.8 },   // 낫지 않은 상처 하나마다 모든 능력치에 곱한다
            scarAmount: 3 },                         // 흉터가 그 능력치 하나에서 빼는 만큼
  // eye.aim: 잃은 눈 하나마다 주인공의 공격이 덜 닿는 몫 (돈으로 단 눈은 그 절반, 기연으로 얻은 눈은 줄지 않는다)
  limb: { eye: { spd: 0.9, aim: 0.15 }, bothEyes: 0.6, arm: { str: 0.75 }, leg: { spd: 0.65 }, basic: 0.5, superior: 1.1, floor: 0.2,
          blindSight: 2 },                     // 견문색이 이 단계 이상이면 두 눈을 잃어도 bothEyes를 곱하지 않는다
  // 뭍에 자리 잡은(settled) · 물러난(retired) 사람이 해마다 버는 살림 돈 (밭 · 가게 · 모아 둔 것). 약값을 낼 수 있게 한다 (3단계 균형 보고)
  income: { settled: 4000, retired: 2500 },
  risk: { illnessP: 0.02, illnessAge: 50, illnessPerYear: 0.005, accidentP: 0.0015, oldFrom: 60, oldK: 0.0015, treatCost: 1200, calmGuard: 0.5,
          medicMult: 0.5,                      // 의사 동료가 있으면 병에 걸릴 확률에 곱한다
          monthsPerPart: 3, worsenMonths: 15,  // 못 고친 병은 worsenMonths마다 한 단계 나빠진다. 3단계에서 또 그만큼 버티지 못하면 죽는다
          maxStage: 3,
          // 사고는 바다 위의 처지에서만
          seaStandings: ['pirate', 'marine', 'revolution', 'bountyHunter', 'warlord'],
          wreckDeathP: 0.5, navigatorMult: 0.5,  // 폭풍에서 난파해 죽을 확률, 항해사 동료가 있으면 곱한다
          lukPer: 0.01, lukFloor: 0.3,           // 운 1마다 난파 확률을 이만큼 줄이되, 이 배율 아래로는 내려가지 않는다
          stormHp: 20,                           // 폭풍을 넘기며 잃는 체력
          // 가난: 이 처지는 벌이가 없다 (굶주림을 판정한다)
          idleStandings: ['child', 'retired'],
          kidAge: 15, kidHp: 30 },             // 이 나이 이하는 병 · 사고 · 굶주림으로 죽지 않고 체력만 잃는다
  wealthMoney: { poor: 0, common: 20000, comfortable: 150000, noble: 800000 },
  birth: { stat: 5, statFloor: 1, talents: { min: 2, max: 3 }, startAge: 3 },
  // 출생 때의 가족 (고아는 없다): 부모 둘은 주인공보다 parentOlder 사이로 많고, 형제는 0~maxSiblings명, 주인공과 siblingGap 차이.
  // siblings[형편][n]: 형제가 n명일 가중치. 가난한 집일수록 많다
  family: { parentOlder: [20, 38], maxSiblings: 3, siblingGap: [1, 8], olderP: 0.5,   // olderP: 형제가 손위일 확률
            siblings: { poor: [2, 3, 3, 2], common: [3, 4, 2, 1], comfortable: [4, 4, 2, 0.5], noble: [5, 3, 1, 0.5] },
            parentAtBirth: 17,                 // 부모는 맏이가 태어날 때도 이 나이 이상이다
            // 가족의 노환: oldFrom살부터 한 해에 oldP.start, 한 살마다 oldP.perYear씩 늘어 oldP.cap까지
            oldFrom: 70, oldP: { start: 0.04, perYear: 0.01, cap: 0.5 },
            // v6.7 고아의 사정 (씨앗으로 정한다, 백분율 구간): grand 조부모 손에 자람 · lost 부모가 행방불명 · lonely 아무 인연 없이 자람(단명)
            orphan: { grand: 35, lost: 30, lonely: 6 },
            grandOlder: [52, 68],
            // 아무 인연 없이 자란 사람: lonelyFrom살부터 한 해에 lonelyP의 확률로 쓸쓸한 끝을 맞는다
            lonelyFrom: 20, lonelyP: 0.12 },
  hp: { max: 100 },
  log: { keep: 400 },                          // 기록은 최근 이만큼만 남긴다
  person: { bond: 50, bondMax: 100,            // 새로 만난 사람의 처음 유대, 유대의 끝
            // 새 동료의 싸움 자리와 레벨. 힘은 v4 crewPowerFor(지금 바다의 단계, level)
            crew: { role: 'vanguard', level: 1, maxLevel: 30 } },
  ending: { knownFame: 10,                     // 이 명성(현상금 1,000만)부터 신문 1면에 실린다. 아래는 고향의 소문
            bondHigh: 70,                      // 원작 인물의 한마디: 유대가 이만큼이면 가까운 사이의 말
            canonWords: 3, unchosen: 3, oneLine: 3 },   // 엔딩에 꼽는 원작 인물 · 가지 않은 길 · 한 줄 인생의 처지 변화 수
} as const;
