# 노트 C — 이벤트 시스템 & 시뮬레이션 틱 엔진 (그랜드 트레저 v3.3.3)

분석 대상: `trunc.html` 1868~3024줄(섹션 8·9·10) 전부 정독. 보조로 확인한 줄: 344~360(배속 버튼), 466~473(로그 필터), 1340~1361(CANON_BOUNTY_BOARD), 1512~1620(초기 상태), 3185~3192(나이대 문구), 3310~3373(이벤트 카드·로그 렌더), 4287~4320(setSimSpeed), 4364~4375(버튼 리스너), 4575~4578(계급표), 4683~4700·4714~4720(같은 메인 스크립트 안의 재선언).
표기: (L1234) = 근거 줄 번호. "미확인" = 내 범위 밖이라 확인하지 않은 것.

---

## 0. 가장 중요한 전제 — 이 범위의 상당 부분은 "죽은 코드"다

메인 스크립트는 하나의 `<script>` 블록(L758~L4724)이다. 그 안에서 같은 이름의 `function` 선언이 뒤쪽에 다시 나오며, JS 호이스팅 규칙상 **뒤 선언이 이긴다.** 따라서 아래 3개 원본은 실행 시점에 이미 교체되어 있다.

| 내 범위의 원본 | 같은 스크립트 내 재선언 | 결과 |
|---|---|---|
| `generateYearlyWorldNews` (L1951~2015) | L4714~4720 | 원본의 "세계적 대사건/지역 단위 사건/일반 소식" 3단 풀은 실행되지 않음 |
| `buildAdultAdventureEvent` (L2248~2779) | L4699 `function buildAdultAdventureEvent(s){return buildDistinctAdultEvent(s);}` | 원본 성인기·원작 조우 이벤트 풀 8종 전체가 실행되지 않음 |
| `buildDistinctAdultEvent` (L2849) | L4698 | 원본의 "4회 재추첨 + encounterHistory 24건 중복 방지" 로직은 실행되지 않음 |

- 근거: `ev_gaimon_kuro` 등 성인 이벤트 id와 `usedAdultEvents`는 L2254~2546 외에 파일 어디에서도 참조되지 않는다(Grep). `opp_bandit_alvida` 호출(L2642)도 죽은 코드 안에 있다.
- 추가로 4725줄 이후 확장 스크립트가 여러 함수를 다시 대입한다(11절 목록).
- 이 노트는 원본 코드(설계 의도)를 빠짐없이 기록하되, 각 항목에 **[실행됨] / [죽은 코드]** 를 표시한다.

---

## 1. 시간 모델

### 1.1 틱 단위
- 틱 함수는 `stepSimulationMonth()` (L2851). 이름은 "Month"지만 1틱 경과량은 나이에 따라 다르다 (L2856):
  - `p.age >= 16 && p.age <= 25` → **1틱 = 1개월**
  - 그 외(1~15세, 26세 이상) → **1틱 = 3개월(1분기)**
- 시작값: `age: 1, month: 1, year: 1505` (L1521~1523). 따라서 유년기는 1년 = 4틱, 16~25세는 1년 = 12틱, 26세부터 다시 1년 = 4틱.
- 해 넘김: `p.month > 12`이면 `month -= 12; age += 1; year += 1` (L2920~2923). 생일과 새해가 동일 시점이다(1월 시작이므로).
- 분기 판정(L2857~2861): `G.meta.pacing332 = {quarterMonths: ((p.month-1) % 3), steps: 0}`를 최초 1회 생성. 매 틱 `steps += 1`, `quarterMonths += elapsedMonths`, `quarterMonths >= 3`이면 `quarterDue = true`, `quarterMonths -= 3`, `G.meta.seasonSerial += 1`.
  - 3개월 틱 구간에서는 매 틱이 분기 정산, 1개월 틱 구간에서는 3틱마다 한 번.
  - 주석(L2886): "Calendar-quarter settlement: monthly play must not multiply passive income."

### 1.2 자동 진행·일시정지·배속
- `setSimSpeed(speed)` (L4298~4320): 기존 타이머 `clearInterval` 후 `G.meta.speed = speed`.
  - speed 0 = 정지(타이머 없음, 표시등 `bg-rose-500`)
  - speed 1 = **1400ms**마다 1틱, speed 2 = **750ms**, 그 외(4) = **380ms** (L4318)
- 버튼 라벨(L346~360): `⏸ 정지`(0) / `▶ 1배속`(1) / `⏩ 2배속`(2) / `⚡ 4배속`(4).
- 캐릭터 생성 완료 시 `setSimSpeed(1)`로 시작(L4283).
- 수동 1틱 버튼 `btnStepMonth` (L4370~4375): 열린 모달(`[id^=modal]` 중 hidden 아님)이 있으면 무시, 아니면 `G.meta.pausedForPopup = false` 후 `stepSimulationMonth()` 직접 호출.
- 틱 차단 조건(L2852): `!G || !G.player.isAlive || G.meta.pausedForPopup || G.meta.activeEvent` 중 하나라도 참이면 즉시 return. 즉 주요 사건 팝업이 떠 있는 동안 시간은 흐르지 않는다.
- 초기 `meta.speed: 1`, `pausedForPopup: false`, `activeEvent: null` (L1607~1609).

### 1.3 나이대 구간
표시용 문구 `getAgeStageText` (L3185~3192):

| 나이 | 표시 |
|---|---|
| ≤4 | 영유아기 |
| 5~11 | 유년기 |
| 12~15 | 소년/소녀기 |
| 16~34 | 청년기 |
| 35~49 | 중년기 |
| ≥50 | 노년기 베테랑 |

엔진이 실제로 쓰는 경계:
- `age <= 15`: 유년기 처리 분기(연 1회 생활 로그, 4·9·14세 주요 사건) (L2936~2952)
- `age === 16`: 자동 출항 전환 (L2955)
- `16~25`: 월 단위 틱 (L2856)
- `age >= 18`: 연간 질병/풍랑 판정 시작 (L2964)
- `age >= 72`: 노환 사망 판정 시작 (L2977)
- `age >= 12`: (원본 뉴스) 세계적 대사건 발생 가능 [죽은 코드] (L1956)

### 1.4 출항 조건
- 16세 생일 틱에 `p.age === 16 && !p.hasSailed`이면 자동으로 `hasSailed = true` (L2955~2956). 플레이어 선택이나 능력치 조건 없음.
- 배가 없으면(`!G.management.ship.owned`) `{ owned: true, name: "여명의 카라벨호", tier: 1, hull: 100, maxHull: 100 }` 지급 (L2957~2959). 14세 진로 사건에서 이미 배를 받았다면 유지.
- 로그(event): `🌊 [16세 성인 & 첫 출항] 드디어 유년기를 마치고 대양으로 나아갈 나이가 되었다! 이제 목적지를 선택해 원작 인물들과 조우하고 세계의 중심에 도전할 수 있다.` (L2960)
- 판정이 `=== 16` 한 번뿐이라, 16세 생일 틱을 건너뛰면 다시 기회가 없다(정상 흐름에서는 건너뛸 수 없음).

### 1.5 수명·사망·엔딩
- 사망 경로는 이 범위에 2개뿐:
  1. 연간 질병/풍랑으로 `health <= 0` (L2964~2969)
  2. 72세 이상 매년 25% 노환 (L2977~2980)
- 최대 수명 상한 없음. 72세 이후 매년 생존 확률 0.75 → 80세 생일까지 9회 판정 통과 확률 약 7.5%(계산값).
- 승리/클리어 엔딩 처리는 이 범위에 없음(칭호 "해적왕"은 roleTitle 갱신일 뿐, L2828). 엔딩은 사망 팝업 하나뿐(10절).

---

## 2. 틱 1회의 처리 순서 (`stepSimulationMonth`, L2851~2995, 코드 순서 그대로)

1. **차단 검사** (L2852) — 1.2절.
2. `ensureV310(G)` (L2855) — 버전 보정(내용은 L4684, 타 담당).
3. `elapsedMonths` 결정: 16~25세 1, 그 외 3 (L2856).
4. **분기 카운터** 갱신, `quarterDue` 판정, `seasonSerial += 1` (L2857~2861).
5. **복무 분기 누적**: `quarterDue && factionKey(p) !== "other"`이면 `p.career.service += 1; refreshCareerTitle(G)` (L2862). `factionKey`는 affiliation에 '해군' 포함 → navy, '혁명군' 포함 → rev, 나머지 other (L4683).
6. `p.month += elapsedMonths` (L2863).
7. `ensureV301State(G)` 후 **교전 기회 만료 정리**: `battleOpportunities`에서 `expiresAge >= p.age`인 것만 유지 (L2864~2865).
8. **항해 진행** (L2868~2884): `sailingMonthsLeft > 0`일 때
   - `pixelMode = "sail"`, `sailingMonthsLeft = max(0, sailingMonthsLeft - elapsedMonths)`
   - 0이 되었고 `destination`이 있으면: `DESTINATIONS_DB`에서 찾아 `location/locationId` 갱신, `destination = null`, `portVisits[locationId] += 1`, `storyNextAt = seasonSerial`, `pixelMode = "village"`, 로그(event) `⛵ [입항 완료] 항해 끝에 '${p.location}'에 무사히 닻을 내렸다!`
   - 그 외: 로그(auto) `항해 중... 목적지까지 순항하며 선원들과 파도를 헤치고 있다.` (매 틱)
9. **분기 정산** (`quarterDue`일 때만, L2887~2910)
   - **훈련 성장**: `management.trainingFocus`가 `str/spd/int/haki`면 해당 능력치 +1, 그 외(기본 `"balanced"`)는 `["str","spd","int","vit","sense","haki"]` 중 무작위 1개 +1. (lead·luck·exp·dfMastery는 여기서 오르지 않음)
   - **투자 배당**: 각 투자 `amount > 0`이면 `profit = round(amount * (yieldRate / 4))`, 합계를 `p.money`에 가산. 로그 없음.
10. **선의 패시브 회복** (L2912~2917): `hasDoctor` = crew 중 `role === "선의(의사)"` 또는 `specialty.includes("의술")`. `hasDoctor && health < maxHealth`이면 `health = min(maxHealth, health + (quarterDue ? 8 : 0))`, 그리고 `health > 75`이면 `condition = "건강함"`.
11. **해 넘김 처리** (`p.month > 12`, L2920~2984)
    1. `month -= 12; age += 1; year += 1`; `SoundFX.play("tick")`
    2. 모든 `relationships.list` 인물 `age += 1` (L2927)
    3. `generateYearlyWorldNews(G)` (L2930) — 실제 실행은 L4714 버전
    4. `updateAnnualBountyRanking(G)` (L2931)
    5. `refreshCareerTitle(G)` (L2932)
    6. `assignRoleMission(G)` (L2933) — 확장 스크립트 L5231에서 재대입됨
    7. **15세 이하** (L2936~2952): `pixelMode = "village"`, 유년기 자동 로그 1건, 그리고 `age === 4 || 9 || 14`이면 `triggerMajorEvent(G, buildChildhoodEvent(G)); return;`
    8. **16세 이상** (L2953~2983), 순서대로:
       - 16세 자동 출항 (1.4절)
       - 질병/풍랑 판정: `Math.random() < 0.14 && p.age >= 18` (10절)
       - 노환 판정: `p.age >= 72 && Math.random() < 0.25` (10절)
       - 연간 자동 로그(auto): 항해 중이면 `동료들과 돛을 조정하고 항로를 살폈다.`, 아니면 `${p.location}에서 보급과 선체 점검을 마쳤다.` (L2982)
12. **성인 사건 판정** (매 틱, L2986~2993): `p.age >= 16 && p.hasSailed && !activeEvent && !battleModalActive`일 때
    - `buildDistinctAdultEvent(G)`가 이벤트를 반환하면 `triggerMajorEvent` 후 return
    - 아니고 `sailingMonthsLeft > 0 && lastSeaEncounter !== seasonSerial && Math.random() < 0.12`이면 `lastSeaEncounter = seasonSerial`, `triggerMajorEvent(G, buildCombatEncounterEvent(G))` 후 return → **항해 중 틱당 12%, 분기(seasonSerial)당 최대 1회 해상 교전**
13. `renderAll()` (L2994)

이 틱 함수에 **없는 것**: 관계 수치(trust/intimacy)의 자연 증감, 플레이어 현상금의 자연 증감, 식비·유지비 등 지출, 선체(hull) 소모, 능력치 감소·노화. (확장 스크립트가 `stepSimulationMonth`를 3회 래핑하므로 거기서 추가될 수 있음 — 미확인)

---

## 3. 이벤트 시스템 구조

### 3.1 이벤트 객체 스키마
이벤트는 데이터 테이블이 아니라 **빌더 함수가 매번 만들어 반환하는 객체**다. id 필드는 객체에 없다(중복 방지용 문자열 키는 `state.meta.usedChildhoodEvents` / `usedAdultEvents`에만 기록).

```
{
  typeTag: string,          // 카드 상단 분류 태그
  title: string,
  relationContext: string,  // 관련 인물/상황 한 줄
  body: string,             // 본문
  choices: [
    { label: string, riskText: string, exec: () => void }
  ]
}
```
- 조건 필드·후속 이벤트 필드·가중치 필드 없음. 조건은 빌더 함수의 if 문, 효과는 `exec` 클로저 안의 직접 대입이다.
- 후속 연쇄는 `exec` 안에서 `setTimeout(() => triggerMajorEvent(state, battleEvent), 0)` 식으로 구현된 1건(L2642~2643, 죽은 코드)뿐.
- 선택지 수는 1~4개(사망 팝업 1개, 진로 4개, 심화 소속 4개, 나머지 3개).

### 3.2 팝업 표시와 선택 처리
- `triggerMajorEvent(state, eventObj)` (L2020~2025): `meta.activeEvent = eventObj; meta.pausedForPopup = true; SoundFX.play("event"); renderAll();`
- 렌더(L3310~3341): `activeEventCard`에 `typeTag`, `title`, `${p.location} · ${p.age}세`, `relationContext`, `body`를 채우고, 선택지를 `${idx+1}. ${label}` + `riskText` 버튼으로 생성.
- 버튼 클릭(L3331~3336): `ch.exec(); G.meta.activeEvent = null; G.meta.pausedForPopup = Boolean(G.meta.battleModalActive); renderAll();`
  - 별도의 "효과 적용 함수"는 없고 `exec()`가 전부다. 결과 화면도 없으며 결과는 `exec` 안의 `addLog`로만 전달된다.
  - 선택 취소·닫기 버튼 없음(반드시 하나를 골라야 시간이 재개됨).

### 3.3 주요 사건(팝업) vs 자동 로그 구분
- **주요 사건**: `triggerMajorEvent`를 거쳐 시간 정지 + 선택 필요. 발생 시점은 (a) 4·9·14세 생일, (b) 16세 이후 매 틱의 `buildDistinctAdultEvent` 결과, (c) 항해 중 12% 해상 교전, (d) 사망.
- **자동 로그**: `addLog(..., "auto", ...)`. 선택 없음, 시간 정지 없음. 발생 시점은 (a) 15세 이하 매년 1건, (b) 16세 이상 매년 1건, (c) 항해 중 매 틱 1건, (d) 질병으로 health < 45일 때.

### 3.4 발생 조건·쿨다운·중복 방지
- 유년기: `usedChildhoodEvents`에 id를 push하여 1회 한정 (L2034~2035, 2089~2090, 2141~2142). 트리거 자체가 4·9·14세 3회뿐.
- 성인기 원본[죽은 코드]: 지역 고정 이벤트 5종은 `usedAdultEvents`로 1회 한정. 무작위 3종은 id 없이 반복 가능하되, 원본 `buildDistinctAdultEvent`(L2849)가 최대 4회 재추첨하며 `ev.title || ev.typeTag`가 `encounterHistory`(최근 24건)에 없을 때만 채택 → 사실상 무작위 3종도 제목 기준으로 24건 이력에서 빠질 때까지 재발생 불가.
  - 이 원본 구조의 부작용: 재추첨 과정에서 `buildAdultAdventureEvent`가 `usedAdultEvents.push`를 먼저 실행하므로, 이력 중복으로 버려진 이벤트도 "사용됨" 처리될 수 있는 구조(실제로는 고정 5종의 제목이 이력에 먼저 있을 일이 거의 없어 영향 작음).
- 성인기 실제[실행됨, L4698]: 항해 중이면 null → `buildRegionalStory` → 없으면 `buildFactionEvent`. 쿨다운은 그쪽(`storyNextAt`, `storyReadyMonth332`, `lastDuty` 4분기, `lastOffer` 20분기 + 0.8%)에 있음. 상세는 타 담당.
- 해상 교전: `lastSeaEncounter !== seasonSerial`로 분기당 1회 제한, 확률 0.12 (L2989).
- 동시 발생 방지: 틱 진입 시 `activeEvent`/`pausedForPopup` 검사, 사건 판정 시 `!activeEvent && !battleModalActive` 검사.

---

## 4. 이벤트 풀 전체 목록

### 4.1 유년기 — `buildChildhoodEvent` (L2027~2245) [실행됨]
공통 참조: `rival` = `rel_child_rival`, `mentor` = `rel_local_mentor`, `sib` = `state.family.siblings[0]` (L2030~2032). 이름 폴백: 라이벌 "카일"/"라이벌", 스승 "스승"/"노인".

| id | typeTag | 제목 | 조건(코드) | 실제 발생 나이 | 선택지 수 |
|---|---|---|---|---|---|
| `ch_treasure_box` | 유년기 사건 · 호기심 | 해안가 동굴에 떠밀려온 수상한 나무 상자 | `age <= 6` & 미사용 | 4세 | 3 |
| `ch_pirate_raid` | 유년기 위기 · 가치관 형성 | 형제 있음: "항구를 덮친 약탈 해적단과 가족의 위기" / 없음: "항구를 덮친 약탈 해적단" | `7 <= age <= 11` & 미사용 | 9세 | 3 |
| `ch_departure_oath` | 출항 준비 · 진로 결단 | 16세 출항을 앞둔 언덕 위의 맹세와 소속 제안 | `12 <= age <= 15` & 미사용 | 14세 | 4 |
| (id 없음, 폴백) | 유년기 성장 사건 | 폭풍우 치는 밤의 등대 수색 | 위 3개가 모두 해당 없을 때 | 정상 흐름에서 도달 불가 | 3 |

**ch_treasure_box 선택지** (L2041~2085)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 상자를 부수고 안의 보물과 나침반을 챙긴다 (운·항해 도구 획득) | 위험도: 낮음 · 항해 자금 및 초기 아이템 확보 | money +18000, 아이템 "구형 기록지침"(미보유 시), luck +3, 로그 event, 효과음 treasure |
| 2 | 소용돌이 무늬의 이상한 열매를 과감히 베어 문다 (악마의 열매 각성 시도) | 위험도: 보통 · 수영 불가 대신 강력한 초인계/자연계 능력 각성 | 이미 능력자: vit +4, money +25000 / 아니면: `pick(DEVIL_FRUITS_POOL)` → `devilFruit = df.name`, abilities에 `악마의 열매: ${df.name}`, str +5, spd +4. 종족 제한 없음 |
| 3 | `${스승명}`에게 가져가 물건의 정체를 감정받는다 (지능·스승 신뢰 상승) | 위험도: 안전 · 패기 적성 및 스승 친밀도 상승 | int +3, haki +3, mentor.trust +15(상한 100), mentor.recentEvent 갱신, 로그 relation |

**ch_pirate_raid 선택지** (L2096~2137)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 단검을 쥐고 해적의 품으로 정면 돌격해 가족을/이웃 아이를 구한다 (힘·패기 각성) | 위험도: 높음 · 부상 위험이 있으나 패기 적성과 가족 신뢰 대폭 상승 | str +5, haki +5, `health = max(35, health - 18)`, 형제: trust +20(상한 100), `canJoinCrew = true`, recentEvent 갱신, pixelMode "battle", 로그 event |
| 2 | `${라이벌명}`과 협공해 골목 지형으로 유인한 뒤 쓰러뜨린다 (속도·통솔 상승) | 위험도: 보통 · 라이벌과의 유대 강화 및 전리품 획득 | spd +4, lead +4, money +12000, rival.trust +18(상한 100), 로그 relation |
| 3 | 주변 해군 순찰대와 마을 어른들을 즉각 지휘해 포위망을 짠다 (지능·해군 평판 상승) | 위험도: 낮음 · 해군 측의 주목을 받음 | int +5, lead +3, hidden.fame +10, 로그 event |

**ch_departure_oath 선택지** (L2148~2199) — 14세에 소속(진로)이 결정된다

| # | 라벨 | riskText | affiliation / roleTitle | 능력치·보상 | 지급 선박 |
|---|---|---|---|---|---|
| 1 | 누구의 밑에도 들어가지 않는다! 내 해적기를 걸고 자유로운 해적으로 출항 준비 (해적 진로) | 16세 출항 시 해적 선장으로 시작 · 소형 범선 및 초도 자금 확보 | 해적 / 신출내기 해적 선장 | lead +5, haki +4 | 새벽의 범선호 (tier 1, hull 100/100) |
| 2 | 바다의 질서와 약자를 지키기 위해 해군 장교 후보생으로 입대한다 (해군/CP9 진로) | 해군 소속 시작 · 정기 봉급 및 군함 탑승 · 추후 해군 대장/CP9 승진 또는 변절 가능 | 해군 / 해군 본부 소위 후보생 | str +4, vit +4, money +30000 | 해군 연안 순찰함 (tier 1, hull 110/110) |
| 3 | 부패한 세계정부를 뒤집기 위해 혁명군 비밀 행동대원으로 합류한다 (혁명군 진로) | 혁명군 소속 시작 · 정보망 및 진보벌레(전보벌레) 지급 | 혁명군 / 혁명군 동군 행동대원 | int +5, sense +5, 아이템 "암호 전보벌레" | 혁명군 위장 쾌속선 (tier 1, 100/100) |
| 4 | 특정 조직에 얽매이지 않는 현상금 사냥꾼 겸 자유 모험가로 나선다 | 자유 모험가 시작 · 해적 사냥 포상금 획득 가능 · 언제든 소속 전환 가능 | 현상금 사냥꾼 / 독립 항해자 | spd +5, luck +4 | 바람길 캐러벨 (tier 1, 100/100) |

- 1번의 riskText는 "초도 자금 확보"라고 쓰여 있으나 money 증가 코드가 없다(L2152~2159).
- 모든 선택지가 `[진로 확정] …` 로그(event)를 남긴다.

**폴백: 폭풍우 치는 밤의 등대 수색** (L2204~2244) — relationContext "어머니와 마을 주민들이 실종된 어선을 찾고 있다."

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 밧줄을 허리에 묶고 거친 파도 속으로 헤엄쳐 구조선을 연결한다 | 체력·힘 상승 · 악마의 열매 능력자는 위험 | 능력자: `health = max(25, health - 25)` / 비능력자: str +3, vit +4 |
| 2 | 등대 반사경을 수리해 암초의 위치와 안전 수로를 정확히 비춘다 | 지능·감각 상승 · 마을의 신뢰 획득 | int +4, sense +3, money +10000 |
| 3 | 형제와 함께 부두 방파제를 보강해 정박한 배들의 파손을 막는다 | 통솔·형제 친밀도 상승 | lead +4, sib.trust +10(상한 100) |

### 4.2 성인기·원작 조우 — 원본 `buildAdultAdventureEvent` (L2248~2779) [죽은 코드]
판정 순서는 위에서 아래로, 먼저 맞는 것 1개를 반환. `cp = computeCombatPower(p)`.

| 순서 | id | typeTag | 제목 | 발생 조건 | 선택지 수 |
|---|---|---|---|---|---|
| 1 | `ev_gaimon_kuro` | 원작 조연 조우 · 이스트 블루 | 보물상자에 몸이 낀 가이몬과 해안가의 검은 음모 | `locationId === "east_syrup"` & 미사용 | 3 |
| 2 | `ev_hachi_zeff` | 원작 조연 조우 · 발라티에 & 코코야시 | 붉은 발 제프의 주방과 문어 어인 하치와의 만남 | `locationId === "east_baratie"` & 미사용 | 3 |
| 3 | `ev_loguetown_clash` | 원작 조우 & 소속 분기 · 로그타운 | 처형대 광장의 폭풍: 스모커 대령과 광대 버기·알비다 동맹 | `locationId === "east_loguetown"` & 미사용 | 3 |
| 4 | `ev_rayleigh_haki` | 전설 조우 & 패기 개화 | 샤키의 바에서 만난 코팅 장인 '명왕 실버즈 레일리' | `locationId`가 `gl_sabaody` / `nw_wano` / `nw_dressrosa` 중 하나 & 미사용 | 3 |
| 5 | `ev_sibling_sea_reunion` | 혈육 재회 사건 | 거친 바다 한복판에서 다시 만난 `${sib.name}` | 형제 존재 & `age >= 17` & 미사용 | 3 |
| 6a | (id 없음) | 보물 & 항해 도구 발견 | 고대 해적선의 침몰 해역과 비밀 금고 | `roll < 0.35` (35%) | 3 |
| 6b | (id 없음) | 심화 소속 & 권력 제안 | 세계정부 밀사와 지하 세력의 은밀한 접촉 | `0.35 <= roll < 0.68` (33%) | 4 |
| 6c | (id 없음) | 원작 파워밸런스 · 거물 세력 조우 | 붉은 머리 해적단 및 해군 대장 함대와의 해상 대치 | `roll >= 0.68` (32%) | 3 |

**ev_gaimon_kuro** (L2261~2319)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 가이몬을 도와 바위 위 상자를 확인하고, 그의 숨겨진 비상금과 비블카드를 받는다 | 보물 & 비블카드 획득 · 가이몬과 우호 관계 형성 | money +35000, 아이템 "비블카드 조각", 관계 `rel_gaimon` 추가(가이몬, 43세, mentor, "친구 (진주섬의 수호자)", trust 85 / caution 0 / intimacy 80) |
| 2 | 캡틴 크로의 '무소음 걸음(샤크시)' 기습을 간파하고 정면으로 격파한다 | 전투 발생 · 승리 시 현상금/명성 및 항해사 동료 합류 계기 | pixelMode battle, spd +5, sense +4, money +45000, 해적이면 bounty +16,000,000, 동료 "세이라"(항해사, 천체 관측 및 해류 예측, 시럽 마을) 영입. 판정 없이 자동 승리 |
| 3 | 최면술사 장고와 캡틴 크로 일당을 해군에 넘기고 포상금을 챙긴다 | 자금 ฿ 50,000 획득 · 해군 공적 상승 | money +50000, hidden.fame +15 |

**ev_hachi_zeff** (L2331~2388)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 문어 어인 하치를 도와 해왕류를 쫓아내고 육도류 검술 교류와 동료의 연을 맺는다 | 어인 하치와 우호/동료 합류 · 수중 탐색 및 요리 보너스 | str +4, spd +4, 동료 "하치 (하찌)"(어인족(문어 어인), 전투원 겸 요리사, 육도류 검술 & 타코야키 조리, 어인섬) 영입 |
| 2 | 붉은 발 제프에게 족기술과 바다에서의 생존 식량 관리법을 배운다 | 힘·체력 상승 및 제프 스승 등록 | str +5, vit +5, 관계 `rel_zeff` 추가(붉은 발 제프, 65세, mentor, "스승 (발라티에 오너 셰프)", trust 80 / caution 5 / intimacy 75) |
| 3 | 코코야시 마을을 수탈하는 아론 파크를 습격해 부패 해군 네즈미의 금고를 턴다 | 전투 발생 · 현상금 상승 및 거액의 베리 획득 | pixelMode battle, money +85000, 해적이면 bounty +22,000,000, str +4, haki +4 |

**ev_loguetown_clash** (L2400~2471)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 광대 버기·알비다와 기상천외한 임시 동맹을 맺고 포위망을 돌파해 그랜드라인으로 출항한다! | 원작 IF 가능 전개 · 버기/알비다 협력자 등록 및 기록지침·자금 획득 | money +60000, 해적이면 bounty +30,000,000, 아이템 "그랜드라인 기록지침", 관계 `rel_buggy` 추가(광대 버기, 37세, **category "crew"**, "동맹 선장 (버기·알비다 연합)", trust 72 / caution 20 / intimacy 68) |
| 2 | 스모커·타시기와 협력해 해적들을 제압하고 해군 특별 직위(또는 칠무해 추천)를 타진한다 | 소속 전환 가능 (해군 장교/특별수사관) · 타시기와 검술 교류 | affiliation "해군", roleTitle "해군 본부 특별기동대 대령", **bounty = 0**, money +70000, str +5, haki +5, 관계 `rel_smoker` 추가(스모커, 34세, mentor, "상관 겸 협력자", trust 78 / caution 10 / intimacy 65) |
| 3 | 폭풍우를 틈타 잇폰마츠의 무기점에서 명검과 진보벌레를 챙겨 독자 돌파한다 | 명검 및 전보벌레 획득 · 스모커와 라이벌 관계 형성 | 아이템 "명검 설주(유바시리급)", "골드 전보벌레", str +6, spd +5, 해적이면 bounty +25,000,000. (riskText의 "스모커와 라이벌 관계 형성"은 코드에 없음) |

**ev_rayleigh_haki** (L2483~2539)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 레일리에게 무릎을 꿇지 않고 정면으로 눈을 맞추며 3색 패기의 극의를 사사받는다 | 무장색·견문색·패왕색 패기 개화 · 전투력 대폭 상승 | haki +16, str +8, sense +8, hakiTypes에 "무장색 패기", "견문색 패기" 추가, **haki >= 25(가산 후)** 이면 "패왕색 패기" 추가, 관계 `rel_rayleigh` 추가(실버즈 레일리, 76세, mentor, "대스승 (명왕)", trust 88 / caution 0 / intimacy 80) |
| 2 | 선박을 최상급 수지로 코팅하고 영구지침(어인섬·신세계행)을 넘겨받는다 | 선박 내구도 최대치 상승 · 신세계 영구지침 획득 | 아이템 "신세계 영구지침", ship.owned true, `tier = max(2, tier + 1)`, maxHull +60, hull = maxHull, sense +6 |
| 3 | 샤키에게 세계정부의 뒷거래 정보와 CP9·칠무해 동향을 매수한다 | 지능·정보력 상승 및 심화 소속 변경 기회 해금 | int +8, hidden.worldInfluence +20 (비용 차감 없음, "해금" 플래그 없음) |

**ev_sibling_sea_reunion** (L2552~2589)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | `${sib.name}`에게 내 배의 부선장(핵심 동료)으로 함께 바다 끝까지 가자고 손을 내민다 | 형제가 정식 동료(선원)로 합류 · 동료 소개 팝업 표시 | sib.category "crew", relType "형제 겸 부선장", affiliation `${p.name}의 선단`, trust 98, lead +6, `openPersonDetailModal(sib, true)`. (`sib.canJoinCrew` 검사 없음) |
| 2 | 각자의 배와 조직에서 정점에 오른 뒤 신세계에서 다시 만나자며 술잔을 나눈다 | 형제가 독립 세력 선장/장교로 성장 · 현상금 랭킹 경쟁 | 플레이어가 해군이면 sib.affiliation "신흥 대선단 선장", sib.bounty 180,000,000 / 아니면 "해군 본부 정예 장교", bounty 0. haki +5 |
| 3 | 고향의 부모님께 보낼 거액의 생활비와 전보벌레를 형제 편에 전달한다 | 자금 ฿ 20,000 지출 · 가문 신뢰 및 생존력 상승 | `money = max(0, money - 20000)`, hidden.familyTrust +25(상한 없음), vit +4 |

**6a 고대 해적선의 침몰 해역과 비밀 금고** (L2601~2646)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 가장 화려한 황금 상자를 열어 항해 자금과 항해 도구를 확보한다 | 자금 ฿ 55,000 ~ 95,000 및 비블카드/기록지침 획득 | money +randInt(55000, 95000), 아이템 `pick(["영구지침(워터 세븐)", "생명의 비블카드", "해루석 수갑", "골드 전보벌레"])`, pixelMode treasure |
| 2 | 철제 상자 속의 악마의 열매를 회수해 직접 먹거나 암시장에 매각한다 | 미능력자 시 악마의 열매 습득 / 기능력자 시 ฿ 120,000 획득 | `!devilFruit && species !== "어인족"`: 열매 습득, str +6, int +5 / 그 외: money +120000 |
| 3 | 추격해 온 해군/해적 선단을 유인해 격파하고 선원 동료를 구출한다 | 전투 승리 시 현상금 상승 및 신규 동료 영입 | pixelMode battle, str +4, lead +4, 해적이면 bounty +28,000,000, `recruitNewCompanion(state)`(무작위 동료), 이어서 `buildCombatEncounterEvent(state, "opp_bandit_alvida")`를 `setTimeout 0`으로 트리거 (보상이 전투 전에 선지급) |

**6b 세계정부 밀사와 지하 세력의 은밀한 접촉** (L2654~2717)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 해적일 때: "세계정부의 공인 해적 '왕하 칠무해' 자리를 수락해 합법적 특권을 누린다" / 그 외: "해적기를 높이 올리고 대해적(초신성·사황 후보)의 길로 전향한다" | 소속 심화/전환 · 칠무해 임명 또는 현상금 대폭 상승 | 해적: affiliation "왕하 칠무해", roleTitle "정부 공인 대해적 (칠무해)", money +100000, worldInfluence +30 / 그 외: affiliation "해적", roleTitle "최악의 세대 선장", `bounty = max(bounty + 80000000, 120000000)` |
| 2 | 세계정부 직속 비밀 첩보기관 'CP9 (또는 해군 본부 대장 후보)'으로 발탁된다 | 육식(六式) 체술 습득 · 정부 기밀 작전권 및 막대한 보수 획득 | `cp >= 220 && affiliation === "해군"`: affiliation "해군 본부 대장", roleTitle "해군 본부 최고 전력 (대장)" / 그 외: affiliation "CP9", roleTitle "세계정부 직속 암약 첩보원". 공통: bounty = 0, spd +7, str +6, 능력 "육식(지건·월보·철괴) 마스터", money +90000 |
| 3 | 혁명군 참모부의 제안을 받아 해방군 군대장 직책을 맡는다 | 혁명군 핵심 간부 등극 · 정부 위협도 상승 및 동맹 지원 강화 | affiliation "혁명군 간부", roleTitle "혁명군 권역 군대장", bounty +95,000,000, lead +7, haki +5 |
| 4 | 모든 제안을 거절하고 현재의 동료들과 나만의 신념을 지킨다 | 동료 전원 신뢰도 상승 및 패기(패왕색 잠재력) 강화 | haki +7, hidden.crewTrust +20(상한 100) |

**6c 붉은 머리 해적단 및 해군 대장 함대와의 해상 대치** (L2721~2776)
- `strongEnoughForYonko = cp >= 340 && crew 수 >= 2` (L2721)

| # | 라벨 | riskText | 효과 |
|---|---|---|---|
| 1 | 충족: "축적한 패기와 동료들의 연합 진형으로 대등하게 무기를 맞대어 기량을 인정받는다! (연합/패기 조건 충족)" / 미충족: "아직 단독으로 사황·대장급을 꺾는 것은 불가능하다. 전술적 퇴로를 열어 동료를 보존한다" | 충족: "대등한 격돌 성공! 현상금 및 세계적 명성 폭등" / 미충족: "원작 파워밸런스 준수 · 무리한 단독 격파 대신 생존 및 실전 경험치 획득" | 충족: haki +10, str +6, affiliation에 "해적" 포함 시 bounty +250,000,000, 신문 1건 추가(grade "세계적 대사건", 제목 `신흥 강자 '${p.fullName}', 신세계 거물 세력과 대등한 패기 격돌!`) / 미충족: sense +5, vit +4 |
| 2 | 적대 의사가 없음을 밝히고 샹크스 측과 술잔을 나누며 신세계 항로 정보를 교류한다 | 평화적 교류 · 항해 정보 및 패기 조언 획득 | haki +5, lead +4 |
| 3 | 무모하게 단독 정면 승부를 걸어 한계를 시험한다 (심각한 부상 위험!) | 위험도: 극단적 · 파워밸런스상 패배 및 중상 위험 | pixelMode battle, `health = max(12, health - 55)`, condition "중상 (집중 치료 필요)", vit +3, 효과음 danger. 확정 패배(사망은 불가) |

### 4.3 성인기 — 실제 실행 경로 [실행됨, 내 범위 밖이라 이름만]
`stepSimulationMonth` L2987이 부르는 `buildDistinctAdultEvent`는 L4698 선언 → 이후 L5317, L5418에서 재대입. L4698 기준 흐름: 항해 중 null → `buildRegionalStory`(지역 이야기 3단계, `STORY_BOOK`) → `buildFactionEvent`(첫 진로 선택 "어떤 깃발 아래에서 떠날까", 희귀 전향 제안, 정기 임무). 이벤트 목록은 해당 담당 노트 참조.

### 4.4 해상 교전 이벤트 [실행됨, 정의는 L4700]
- 호출부: L2991 (항해 중 12%). typeTag "항로 사건 · 실제 교전", 제목 "보급선에서 올라온 구조 신호", 선택지 2개("동료들과 구조선의 퇴로를 확보한다" / "적의 위치를 알리고 안전한 수로로 우회한다" — 우회 시 항해 +3개월). 상세는 전투 담당.

### 4.5 사망 이벤트 [실행됨] (L3008~3022)
- typeTag "생애 마감 · 최종 항해 기록", 제목 `${p.fullName}의 전설, 바다의 역사로 남다 (향년 ${p.age}세)`, 선택지 1개 "🔄 새로운 시대의 새 인생 시작하기"(riskText "초기 생성 화면으로 이동") → `resetToStartScreen()`.

### 4.6 보스전
- 이 범위에 보스전 이벤트 정의는 없음. 보스 id는 `refreshPirateCareer`(L2828)에서 `p.defeatedBosses` 조회로만 등장: `boss_yonko_commander`, `boss_kaido_shanks`, `boss_pirate_king_trial`. (정의 L1373~1483, push는 L4066 — 타 담당)

### 4.7 동료 영입 헬퍼 `recruitNewCompanion(state, preset = null)` (L2781~2823)
- 원본은 죽은 이벤트에서만 호출되지만 함수 자체는 살아 있고 확장 스크립트 L5003에서 재대입됨.
- preset 없을 때 역할 풀(6종): 항해사 / 선의(의사) / 조선공 / 전투원(검사) / 요리사 / 저격수 (각 spec 문구 L2784~2789).
- 이름 `pick(FIRST_NAMES_POOL)`, 종족 `pick(["인간","인간","어인족","밍크족","하늘섬 주민"])`(인간 40%), 성별 무작위, 나이 `randInt(max(15, p.age-3), p.age+6)`.
- 고정 초기값: category "crew", trust 80, caution 5, intimacy 75, task "기본 임무 수행".
- 무작위 속성: trait 5종(돌파형/분석형/수호형/자유추구형/충성형), weakness 4종(방향치 기질/지나친 호기심/보물 앞에서 눈이 반짝임/선박 멀미), dream 4종(세계 지도를 완성하는 것/만병통치약을 만드는 것/꿈의 바다 올 블루를 찾는 것/최고의 명검을 벼려내는 것).
- 로그(relation) `🌟 [동료 영입] …` 후 `openPersonDetailModal(newComp, true)`. 인원 상한 검사 없음.

---

## 5. 로그 시스템

- `addLog(state, type, text)` (L1870~1883): `state.log.entries` **맨 앞에 unshift**(최신이 위). 항목 필드: `id`("log_"+Date.now()+"_"+난수 4자), `year`, `age`, `month`, `location`, `type`, `text`.
- **보관 상한 160건**: 초과 시 가장 오래된 1건 pop (L1880~1882).
- 타입 4종 (L1877 주석): `'auto' | 'event' | 'relation' | 'world'`.

| type | 필터 버튼 라벨 (L469~472) | 배지 색 (L3357~3363) | 용도 |
|---|---|---|---|
| (전체) | 전체 (`all`) | — | — |
| event | 중요사건 | amber | 사건 결과, 입항, 출항, 사망, 진급 |
| relation | 관계/동료 | emerald | 동료 영입, 관계 변화 |
| world | 세계뉴스 | indigo | 직책 임무(`📜 [직책 임무]`), (원본) 신문 |
| auto | 전용 필터 없음 | slate(회색) | 일상 자동 로그 |

- 표시(L3364~3371): 배지 `${age}세 · ${year}년`, 우측 `location`, 본문 `text`. `month`는 저장되지만 표시에 쓰이지 않음. 개수 배지 `(${entries.length}건 기록됨)`는 필터와 무관한 전체 수.
- **자동 로그 문장 풀 구성**
  - 유년기(15세 이하, 연 1회): 접두 `[${p.age}세 생활] ` + 6문장 중 `pick` (L2938~2946)
    1. `${p.birthplace}에서 부모님의 일손을 도우며 기초 체력을 길렀다.`
    2. `형제와 나무 막대기를 들고 대련하다가 나란히 저녁밥을 먹었다.`
    3. `항구에 들어온 상선 선원들의 그랜드라인 모험담을 밤늦도록 들었다.`
    4. `소꿉친구와 해안 절벽까지 달리기 시합을 하며 발놀림이 빨라졌다.`
    5. `마을 대장간과 조선소 주변을 맴돌며 무기와 배의 구조를 익혔다.`
    6. `스승님이 일러준 호흡법을 따라 하며 내면의 기운을 다스렸다.`
    - 문장 내용("체력을 길렀다", "발놀림이 빨라졌다")은 연출일 뿐 능력치 변화와 연결되지 않음. 형제가 없어도 2번 문장이 나올 수 있음.
  - 성인기(연 1회, L2982): 항해 중 `동료들과 돛을 조정하고 항로를 살폈다.` / 정박 중 `${p.location}에서 보급과 선체 점검을 마쳤다.` — 각 1문장 고정.
  - 항해 중(매 틱, L2882): `항해 중... 목적지까지 순항하며 선원들과 파도를 헤치고 있다.` 1문장 고정.
  - 질병(L2972): `⚠️ 항해 중 열병과 풍랑으로 체력이 감소했다. ` + 선의 유무에 따른 꼬리 문장.
- 16~25세 월 단위 항해에서는 "항해 중..." 로그가 매달 쌓여 160건 상한을 빠르게 밀어낸다.

---

## 6. 세계 뉴스와 현상금 랭킹

### 6.1 세계 뉴스 — 원본 (L1951~2015) [죽은 코드]
매년 1회, 우선순위 3단:
1. **세계적 대사건**: `yr - world.lastMajorEventYear >= 7 && age >= 12` (주석은 "6~8년"이지만 코드는 정확히 7년 이상). 초기 `lastMajorEventYear: 1502`(L1580), 시작 1505년. 3종 중 pick → 신문 추가 + 로그(world) `📰 [${grade}] ${title}`.
   - 해군 본부 및 왕하 칠무해 긴급 소집령 발동!
   - 혁명군 총사령관 드래곤, 노스 블루 왕국 해방 작전 지휘
   - 왕하 칠무해 일각의 공석 발생 및 세력 재편 논의
2. **지역 단위 사건**: `age % 3 === 0`. 3종 중 pick → 신문 + 로그(world).
   - 워터 세븐 아쿠아 라구나 수위 상승 및 갈레라 조선소 호황
   - 로그타운 스모커 대령, 동쪽 바다 해적단 12곳 연달아 검거
   - 해상 레스토랑 발라티에, 해적 습격 격퇴 후 신메뉴 출시
3. **일반 소식**: 그 외. 4종 중 pick → 신문만 추가(로그 없음).
   - 광대 버기 해적단, 동쪽 바다 항구에서 화려한 곡예 소동
   - 위대한 항로 이상 기후 관측, 기록지침 자기장 교란 주의보
   - 시럽 마을 인근 해역에서 최면술사 장고 목격담 잇따라
   - 샤본디 제도 야루키만 망그로브 코팅 장인 예약 대기 증가
- 신문 객체: `{ year, age, grade, title, body }`, `world.newspapers`에 unshift. 원본에는 보관 상한 없음.

### 6.2 세계 뉴스 — 실제 실행 (L4714~4720) [실행됨]
- grade는 전부 `'항구 통신'`. 6개 기사를 `(year - 1505 + 600) % 6` 인덱스로 **순환(무작위 아님)**. 로그는 남기지 않음. `newspapers`는 80건으로 절단.
- 기사 제목 6종: 발라티에의 식량 보급선, 정기 항로 운항 / 워터 세븐 조선소, 선박 점검 예약 안내 / 샤본디 코팅 장인들의 정비 소식 / 해군 지부, 조난 신호 청취 시간 확대 / 로그타운 시장에 새 항해 물자 입고 / 심해 항해 선박에 구명 장비 점검 권고.
- 최신 신문은 메인 화면에 `[${year}년] ${title}` + grade 배지로 표시(L3344~3348).

### 6.3 현상금 랭킹 `updateAnnualBountyRanking` (L1914~1949) [실행됨]
- 호출: 해 넘김 시 연 1회(L2931). `bountyRankings`를 쓰는 곳은 여기뿐이라 첫 생일 전에는 빈 배열.
- 구성:
  1. `CANON_BOUNTY_BOARD` 20명 전원(`name, role, bounty`만 복사, `power`는 랭킹에 미사용)
  2. `relationships.list` 중 `r.bounty > 0`인 인물 — role은 `${r.relType} · ${r.affiliation}`
  3. `p.bounty > 0`이면 플레이어 — name `${p.fullName} (나)`, role `${p.affiliation} · ${p.roleTitle}`, `isPlayer: true`
- `bounty` 내림차순 정렬 후 `rank = idx + 1`. 동률 처리 규칙 없음(정렬 안정성에 의존).
- 원작 인물 현상금은 고정값이며 시간에 따라 변하지 않는다.
- `CANON_BOUNTY_BOARD` (L1341~1360): 흰수염 5,046,000,000 / 카이도 4,611,100,000 / 빅 맘 4,388,000,000 / 샹크스 4,048,900,000 / 미호크 3,590,000,000 / 티치 2,247,600,000 / 마르코 1,374,000,000 / 카타쿠리 1,057,000,000 / 행콕 1,659,000,000 / 징베 438,000,000 / 도플라밍고 340,000,000 / 키드 315,000,000 / 루피 300,000,000 / 로 200,000,000 / 크로커다일 81,000,000 / 아론 20,000,000 / 돈 클리크 17,000,000 / 캡틴 크로 16,000,000 / 버기 15,000,000 / 알비다 5,000,000.
- `p.prevBountyRank`(L1559)는 이 범위에서 읽거나 쓰지 않음(미확인).

### 6.4 플레이어 현상금 증감
- **공식이 없다.** 이 범위에서 현상금은 이벤트 선택지의 고정 가산뿐이며 전부 죽은 코드 안에 있다: +16,000,000(크로) / +22,000,000(아론 파크) / +30,000,000(버기 동맹) / +25,000,000(독자 돌파) / +28,000,000(침몰선 전투) / +95,000,000(혁명군 군대장) / +250,000,000(사황 격돌) / `max(bounty + 80000000, 120000000)`(해적 전향) / `= 0`(해군·CP9 편입).
- 대부분 `p.affiliation === "해적"`일 때만 가산(사황 격돌만 `includes("해적")`).
- 틱 엔진에는 현상금의 자연 증감·감쇠 없음. 실제 증감은 전투 결과(L4050~)·소속 변경(L4685, 4692)에서 일어남 — 타 담당.

---

## 7. 소속·진로와 칭호(roleTitle)

### 7.1 초기값과 진로 결정 지점
- 초기: affiliation "민간인", roleTitle "고향의 어린아이" (L1560~1561).
- 14세 `ch_departure_oath`에서 4진로 선택(4.1절 표): 해적 / 해군 / 혁명군 / 현상금 사냥꾼.
- 이후 소속 변경은 (죽은 코드) 로그타운·심화 소속 이벤트, (실행됨) `buildFactionEvent`/`enterFaction`(L4685~4692).
- 엔진의 세력 구분은 `factionKey` 3분류뿐: '해군' 포함 → navy, '혁명군' 포함 → rev, 그 외 전부 other(해적·현상금 사냥꾼·민간인·칠무해·CP9 포함).

### 7.2 이 범위 코드에 등장하는 affiliation / roleTitle 값 전부

| affiliation | roleTitle | 설정 위치 | 상태 |
|---|---|---|---|
| 해적 | 신출내기 해적 선장 | L2153~2154 | 실행됨 |
| 해군 | 해군 본부 소위 후보생 | L2165~2166 | 실행됨(곧 덮어써짐, 12절 참조) |
| 혁명군 | 혁명군 동군 행동대원 | L2178~2179 | 실행됨(곧 덮어써짐) |
| 현상금 사냥꾼 | 독립 항해자 | L2191~2192 | 실행됨 |
| 해군 | 해군 본부 특별기동대 대령 | L2432~2433 | 죽은 코드 |
| 왕하 칠무해 | 정부 공인 대해적 (칠무해) | L2662~2663 | 죽은 코드 |
| 해적 | 최악의 세대 선장 | L2668~2669 | 죽은 코드 |
| 해군 본부 대장 | 해군 본부 최고 전력 (대장) | L2680~2681 | 죽은 코드 |
| CP9 | 세계정부 직속 암약 첩보원 | L2683~2684 | 죽은 코드 |
| 혁명군 간부 | 혁명군 권역 군대장 | L2700~2701 | 죽은 코드 |

### 7.3 해적 칭호 승급 `refreshPirateCareer` (L2828) [실행됨]
- 호출 경로: `refreshCareerTitle`에서 `factionKey === 'other'`일 때(L4687). `refreshCareerTitle`은 분기마다(L2862, 단 navy/rev만)·매년(L2932)·공적 획득 시 호출.
  - 주의: L2862의 분기 호출은 `factionKey(p) !== "other"` 조건이라 해적에게는 실행되지 않는다. 해적 칭호 갱신은 **연 1회(L2932)** 뿐이다(이 범위 기준).
- 공통 전제: `p.affiliation === "해적" || p.affiliation.includes("대선단")`. `crewCount` = category "crew" 인원, `bosses` = `p.defeatedBosses`.
- 위에서부터 먼저 맞는 것 1개:

| 순위 | roleTitle | 조건 |
|---|---|---|
| 1 | 해적왕 | bosses에 `boss_pirate_king_trial` |
| 2 | 신세계 사황 | bosses에 `boss_kaido_shanks` & bounty ≥ 1,200,000,000 & crewCount ≥ 3 |
| 3 | 신세계 대선단장 | bosses에 `boss_yonko_commander` & bounty ≥ 350,000,000 |
| 4 | 최악의 세대 선장 | bounty ≥ 100,000,000 |

- 어느 것에도 해당하지 않으면 roleTitle을 건드리지 않는다(강등 없음, 기본값 복구 없음).
- 현상금 사냥꾼·민간인·칠무해·CP9는 other이지만 전제 조건에 걸려 칭호 변화 없음.

### 7.4 해군·혁명군 계급 승급 `refreshCareerTitle` (L4687, 내 범위 밖 — 틱 엔진이 호출하므로 교차 참조용)
- 계급표: `NAVY_CAREER` 18단계 = 이병, 일병, 상병, 병장, 하사, 중사, 상사, 준위, 소위, 중위, 대위, 소령, 중령, 대령, 준장, 소장, 중장, 대장 (L4575). `REV_CAREER` 8단계 = 일반 병사, 연락원, 분대장, 작전대원, 지역 책임자, 작전대장, 군대장 보좌, 군대장 (L4577).
- 다음 계급 `ni = rank + 1` 승급 조건(전부 충족):
  - 공적: 해군 `RANK_MERIT[ni]` = [0,8,20,36,58,86,120,160,210,270,340,420,520,640,800,990,1240,1600] / 혁명군 [0,20,65,150,310,560,950,1500][ni]
  - 최소 복무: 해군 `ni*2` 분기, 혁명군 `ni*4` 분기 (`career.service`는 틱 엔진 L2862에서 분기당 +1)
  - 직전 진급 후 2분기 이상 (`service - lastPromotion >= 2`)
  - 최종 계급만 추가: 전투력 ≥ 400 & 통솔(lead) ≥ 60 & service ≥ 80
- 1회 호출에 1계급만 승급. 승급 시 로그(event) `[진급] …` + 토스트.
- 매 호출 끝에 `p.roleTitle = '해군 '|'혁명군 ' + ranks[c.rank]`로 **무조건 덮어쓴다.**
- `c.faction !== k`이면 rank·merit·service·lastPromotion 0으로 초기화.

### 7.5 직책 임무 `assignRoleMission` (L2830~2847) — 확장 스크립트 L5231에서 재대입됨
- 연 1회 호출(L2933). `missionMap`의 키 중 `p.roleTitle.includes(k) || p.affiliation.includes(k)`인 **첫 번째** 키 사용, 없으면 아무 일도 안 함.

| 키 | 임무 문구 |
|---|---|
| 해적왕 | 로드 포네그리프 단서를 찾아 다음 섬의 동맹과 공유하라 |
| 사황 | 산하 해적단의 분쟁을 중재하고 항로를 지켜라 |
| 해군 본부 대장 | 민간인 피해를 줄이며 위험 해적단의 퇴로를 차단하라 |
| 해군 본부 원수 | 본부와 지부의 작전을 조율해 바다의 균형을 유지하라 |
| 혁명군 | 억압받는 항구에 구호품과 정보를 전달하라 |
| 왕하 칠무해 | 정부가 지정한 해적 세력을 견제하되 독자 세력을 보존하라 |

- `meta.officeMissions`에 `{ year, title: "${roleTitle} 임무", text, status: "대기" }` unshift, **최대 8건**. 로그(world) `📜 [직책 임무] ${p.roleTitle}에게 임무가 내려왔다: ${text}`.
- 원본 기준으로는 임무를 완료·판정하는 코드가 이 범위에 없다(status "대기" 고정).

---

## 8. 전투 판정 (이 범위에 있는 것)

### 8.1 전투력 공식 `getCombatBreakdown(p)` (L1885~1908)
```
strScore    = round(str * 2.6)                         (str 없으면 10)
spdScore    = round(spd * 2.4)                         (없으면 10)
intScore    = round(int * 2.0)                         (없으면 10)
dfScore     = devilFruit ? round(75 + dfMastery * 2.2) : 0     (dfMastery가 0/없음이면 10으로 대체)
hakiScore   = round(haki * 3.0 + hakiTypes.length * 55)        (haki 없으면 8)
expScore    = round(exp * 1.8)                         (없으면 5)
healthFactor= max(0.4, health / maxHealth)             (health·maxHealth가 0/없음이면 100으로 대체)
healthScore = round(vit * 1.5 + health * 0.45)         (vit 없으면 10)
rawTotal    = 위 7개 점수 합
total       = round(rawTotal * (0.7 + 0.3 * healthFactor))
```
- 반환: 각 점수 + `luckStat`(luck, 없으면 10) + `total`. **luck, lead, sense는 total에 들어가지 않는다.**
- `computeCombatPower(p)` = `total` (L1910~1912).
- 체력 계수 범위: 0.82(체력 40% 이하) ~ 1.0(만체력).
- 초기 능력치(L1529~1540, 열매 없음, 체력 100) 대입 계산값: 26+24+20+0+24+9+63 = **166**.
- 열매 보유만으로 최소 +97(dfMastery 0 → 10 대체), 패기 종류 1개당 +55.

### 8.2 이 범위에서 전투력을 쓰는 임계값
- `cp >= 220` & 해군 → "해군 본부 대장" (L2679, 죽은 코드)
- `cp >= 340` & crew ≥ 2 → 사황급과 대등 격돌 (L2721, 죽은 코드)
- `cp >= 400` → 해군/혁명군 최종 계급 조건 (L4687)

### 8.3 승률·승패 처리
- 이 범위에는 확률 기반 전투 판정이 **없다.** 원본 이벤트의 "전투" 선택지는 전부 확정 결과(자동 승리 또는 확정 패배)다.
- 실제 전투(`calculateCombatComparison`, `resolveComparedCombat`, `executeBattleRouletteSpin`, L3990~4108)는 타 담당.
- 틱 엔진의 관여: 교전 기회 만료 정리(L2865), 해상 교전 발생 12%(L2989).

---

## 9. 투자·경제

### 9.1 투자 상품 (L1587~1593)

| id | 이름 | 설명 | yieldRate(연) | risk 라벨 |
|---|---|---|---|---|
| shipyard | 고향 조선소 지분 투자 | 선박 수리비 절감 및 분기별 배당 수익 | 0.08 | 낮음 |
| merchant | 블루해 정기 교역단 | 특산품 무역으로 안정적인 베리 수익 창출 | 0.12 | 보통 |
| salvage | 심해 보물 인양대 후원 | 변동성이 크지만 희귀 보물 및 악마의 열매 발견 확률 | 0.20 | 높음 |
| medical | 항구 의약품 상단 | 질병 저항 상승 및 안정적 의료 배당금 | 0.09 | 낮음 |
| intel | 지하 세계 정보망 | 해군 동향 파악 및 위험 사건 사전 경고 | 0.14 | 보통 |

### 9.2 수익 공식 (L2898~2908)
- 분기마다 상품별 `round(amount * yieldRate / 4)` 합산을 `money`에 가산. 원금은 변하지 않음(단리).
- **손실·변동·실패 확률 없음.** risk 라벨과 설명의 부가 효과(수리비 절감, 보물/열매 발견, 질병 저항, 사전 경고)는 틱 엔진에 구현되어 있지 않다. 투자/회수 UI와 다른 곳의 구현 여부는 미확인.
- 배당 로그·알림 없음.
- 유년기(1세부터)에도 분기 정산은 돌아간다.

### 9.3 그 외 돈의 흐름 (이 범위)
- 초기 자금 15,000 (L1557).
- 수입은 이벤트 선택지의 고정 보상뿐(실행되는 것: +18,000 / +25,000 / +12,000 / +30,000 / 폴백 +10,000).
- 정기 지출(식비, 봉급, 유지비)은 틱 엔진에 없음. 해군 진로 riskText의 "정기 봉급"도 틱 엔진에 구현 없음.
- 화폐 표기: 본문에서 `฿`, 포맷 함수 `formatBeli`(L1640, 타 담당).

---

## 10. 건강·부상·사망 규칙

- 상태값: `health: 100`, `maxHealth: 100`, `condition: "건강함"` (L1554~1556). maxHealth를 바꾸는 코드는 이 범위에 없음.
- 숨은 수치 `hidden.diseaseResist: 15`, `hidden.survival: 10`(L1542, 1548)은 이 범위의 판정에 **쓰이지 않는다.**

### 10.1 연간 질병/풍랑 판정 (L2963~2974)
- 조건: 해 넘김 틱 & `age >= 18` & `Math.random() < 0.14` (연 14%). 주석은 "if low health or high danger"이지만 체력·위험도 조건은 코드에 없음. 항해 여부도 무관.
- 피해: 선의 있으면 6, 없으면 16. `health = max(0, health - dmg)`.
- `health <= 0` → 사망, 사인: `거친 해역의 폭풍우와 누적된 부상이 악화되어 선실에서 마지막 숨을 거두었다.`
- `health < 45` → `condition = "고열 및 부상 (치료 필요)"` + 로그(auto) `⚠️ 항해 중 열병과 풍랑으로 체력이 감소했다. ` + (선의 있음: `선의의 응급처치로 큰 고비를 넘겼다.` / 없음: `관리 탭에서 치료가 필요하다.`)
- `health >= 45`이면 피해만 입고 로그·상태 변화 없음(플레이어에게 알림 없음).

### 10.2 노환 (L2976~2980)
- 해 넘김 틱 & `age >= 72` & `Math.random() < 0.25` → 사망, 사인: `수많은 바다와 전설을 뒤로한 채, 노년의 항해 끝에 평온히 눈을 감았다.`
- 체력·능력치와 무관.

### 10.3 회복
- 선의 패시브(L2912~2917): 분기당 +8(최대 maxHealth). `health > 75`이면 condition "건강함". 선의 판정: crew 중 `role === "선의(의사)"` 또는 `specialty`에 "의술" 포함.
- 선의가 없으면 **자연 회복이 없다**(이 범위 기준). "관리 탭에서 치료"는 L3496~ 관리 모달 — 타 담당.

### 10.4 이벤트로 인한 체력 변화
| 위치 | 변화 | 하한 | 상태 |
|---|---|---|---|
| ch_pirate_raid 1번 (L2103) | -18 | 35 | 실행됨 |
| 폴백 등대 1번, 능력자 (L2215) | -25 | 25 | 도달 불가 |
| 6c 3번 (L2769) | -55, condition "중상 (집중 치료 필요)" | 12 | 죽은 코드 |
- 이벤트 선택지로는 사망하지 않도록 전부 하한이 있다.

### 10.5 condition 문자열 (이 범위)
"건강함" / "고열 및 부상 (치료 필요)" / "중상 (집중 치료 필요)" / "사망". (L4694에 "작전 중 부상" 추가 존재)
- condition은 표시용 문자열이며 이 범위에서 판정에 쓰이지 않는다. 전투력에는 health 수치만 반영.

### 10.6 사망 처리 `handlePlayerDeath(state, causeText)` (L2997~3023)
1. `isAlive = false; health = 0; condition = "사망"; pausedForPopup = true;` 효과음 danger
2. 로그(event) `☠️ [생애 종료 · 향년 ${p.age}세] ${causeText}`
3. 사망 팝업(4.5절). relationContext `최종 소속: ${affiliation} (${roleTitle}) · 최종 현상금: ${formatBeli(bounty)}`. body에 마지막 장소·사망 경위·함께한 동료(crew 이름 나열, 없으면 "단독 항해").
4. 선택 → `resetToStartScreen()`(L4287~4296): 타이머 정지, `G = null`, 시작 화면 복귀. 계승·회차 보너스·점수 집계 없음.

---

## 11. 확장 스크립트(4725~5527줄)에서 재정의/래핑되는 이 범위 함수 (이름만)

| 함수 | 재정의 위치 | 형태 |
|---|---|---|
| `buildAdultAdventureEvent` | L4731 `originalAdultEvent` 저장, L4997 재대입 | 래핑 |
| `recruitNewCompanion` | L4730 `originalRecruit` 저장, L5003 재대입 | 래핑 |
| `stepSimulationMonth` | L4732 저장 → L5051 재대입 / L5090 `oldStep` 저장 → L5355 재대입 / L5434 `previousStep` 저장 → L5435 재대입 | 3중 래핑 |
| `assignRoleMission` | L5088 `oldAssign` 저장, L5231 재대입 | 래핑/교체 |
| `buildDistinctAdultEvent` | L5086 `oldDistinct` 저장, L5317 재대입 / L5417 `previousAdult` 저장, L5418 재대입 | 2중 |
| `triggerMajorEvent` | L5352 `originalTrigger` 저장, L5353 재대입 | 래핑 |

- 확장 스크립트에서 재정의되지 **않는** 것(Grep 기준): `addLog`, `getCombatBreakdown`, `computeCombatPower`, `updateAnnualBountyRanking`, `buildChildhoodEvent`, `refreshPirateCareer`, `handlePlayerDeath`, `generateYearlyWorldNews`(메인 스크립트 L4714에서만 재선언).
- 주의: `setSimSpeed`는 `setInterval(stepSimulationMonth, …)`에 **호출 시점의 함수 참조**를 넘긴다(L4319). 확장 스크립트 로드 후에 `setSimSpeed`가 호출되므로(게임 시작 시 L4283) 래핑된 최종 버전이 타이머에 걸린다. 수동 버튼(L4374)은 이름으로 호출하므로 역시 최종 버전.
- 같은 메인 스크립트 내 재선언(0절): `generateYearlyWorldNews`(L4714), `buildAdultAdventureEvent`(L4699), `buildDistinctAdultEvent`(L4698). 참고로 틱 엔진이 호출하는 `buildCombatEncounterEvent`도 L3948과 L4700에 중복 선언(L4700이 유효).

---

## 12. 발견한 버그·도달 불가 코드·밸런스 이상치

### 도달 불가 코드
1. **원본 성인기·원작 조우 이벤트 풀 전체(L2248~2779, 약 530줄)** — L4699 재선언으로 실행되지 않음. 가이몬/크로, 하치/제프, 로그타운, 레일리, 형제 재회, 침몰선, 심화 소속, 사황 대치 8종과 관계 인물 `rel_gaimon`, `rel_zeff`, `rel_buggy`, `rel_smoker`, `rel_rayleigh`, 동료 "세이라"·"하치 (하찌)", 소속 "왕하 칠무해"·"CP9"·"해군 본부 대장"·"혁명군 간부"가 함께 사라짐. `meta.usedAdultEvents`는 쓰이지 않는 상태값.
2. **원본 세계 뉴스 3단 풀(L1951~2015)** — L4714 재선언으로 실행되지 않음. `world.lastMajorEventYear`는 쓰이지 않는 상태값. "세계뉴스" 로그 필터에 들어올 신문 로그가 없어짐(직책 임무 로그만 world 타입).
3. **원본 `buildDistinctAdultEvent`(L2849)** — L4698 재선언으로 실행되지 않음.
4. **유년기 폴백 이벤트 "폭풍우 치는 밤의 등대 수색"(L2203~2244)** — 트리거가 4·9·14세뿐이고 각 나이에 고정 이벤트가 정확히 하나씩 대응하므로 정상 흐름에서 도달 불가.
5. `assignRoleMission`의 키 "해군 본부 대장", "해군 본부 원수", "왕하 칠무해" — 이 문자열을 만드는 코드가 죽은 이벤트에만 있음(L2662, 2680). 실행되는 해군 칭호는 `'해군 ' + 계급`("해군 대장")이라 "해군 본부 대장"과 불일치. "원수"는 계급표에도 없음. (확장 스크립트 L5231 교체본에서의 처리는 미확인)
6. `sib.canJoinCrew = true`(L2106) — 이 범위에서 읽는 곳 없음(L1797 정의, 사용처 미확인).

### 버그·불일치
7. **사망 팝업 버튼 클릭 시 예외 가능**: 선택지 `exec`가 `resetToStartScreen()`으로 `G = null`을 만든 직후, 클릭 핸들러가 `G.meta.activeEvent = null`을 실행(L3332~3333) → null 참조 TypeError. 화면 전환은 이미 끝난 뒤라 겉으로는 드러나지 않을 가능성이 높음(`renderAll` 래핑본이 이를 막는지는 미확인).
8. **14세 진로 칭호가 곧바로 덮어써짐**: `ensureV310`이 첫 틱에 `p.career = {faction:'other', …}`를 만든다(L4684). 14세에 해군/혁명군을 고르면 roleTitle이 "해군 본부 소위 후보생"/"혁명군 동군 행동대원"이 되지만, 다음 분기 `refreshCareerTitle`(L2862)이 faction 불일치로 계급을 0으로 초기화하고 roleTitle을 "해군 이병"/"혁명군 일반 병사"로 덮어쓴다. "장교 후보생" 설정이 1분기 만에 사라짐.
9. **복무 기간이 14세부터 누적**: 위와 같은 이유로 `career.service`가 출항 전 유년기(14~15세, 8분기)부터 쌓인다(L2862에 나이 조건 없음).
10. `dfScore`의 `(s.dfMastery || 10)` (L1890): 숙련도 0이 10으로 취급된다. 초기값이 `dfMastery: 0`이므로 숙련도 1~9가 0보다 낮은 점수를 내는 역전 발생(0 → 97점, 1 → 77점).
11. `(p.health || 100)` (L1893~1894): 체력 0이 100으로 취급됨(사망 직전 프레임 한정).
12. 주석과 코드 불일치: L1955 "every 6~8 years" vs 코드 `>= 7`; L2963 "if low health or high danger" vs 코드에 해당 조건 없음; L1576 category 주석에 없는 값 사용 가능성(미확인).
13. riskText와 실제 효과 불일치: 해적 진로 "초도 자금 확보"(자금 없음, L2151), 해군 진로 "정기 봉급"(틱에 없음), 로그타운 3번 "스모커와 라이벌 관계 형성"(없음), 레일리 3번 "심화 소속 변경 기회 해금"(플래그 없음), 가이몬 3번 "해군 공적 상승"(fame +15만).
14. 항해 로그 분기(L2871~2883): `sailingMonthsLeft`가 0이 됐는데 `destination`이 없거나 `DESTINATIONS_DB`에 없으면 도착 처리 없이 지나감(없는 id면 `destination`이 남은 채 로그도 없음).
15. `hasDoctor` 판정의 `r.specialty.includes` (L2913): crew 인물에 `specialty`가 없으면 TypeError로 틱 전체가 중단된다. 이 범위에서 만드는 crew는 모두 specialty가 있으나, 다른 경로로 추가되는 crew는 미확인.
16. 유년기 자동 로그가 형제·스승 존재 여부를 확인하지 않고 "형제와…", "스승님이…" 문장을 출력.
17. 4세 열매 선택지는 종족 제한이 없는데(L2057~2068), 성인 이벤트 쪽은 `species !== "어인족"` 제한이 있음(L2619) — 규칙 불일치.

### 밸런스 이상치
18. **노환 25%/년(72세~)**: 80세 도달 확률 약 7.5%, 기대 여명 약 4년. 체력·관리와 무관한 순수 확률.
19. **질병 14%/년, 피해 16**: 선의 없이는 자연 회복이 없어(이 범위 기준) 100 → 0까지 7회 누적이면 사망. 반대로 선의가 있으면 분기 +8(연 +32) 회복 대 연 기대 피해 0.84로 사실상 무해.
20. **질병 피해 무통보 구간**: health 45 이상에서는 피해를 입어도 로그가 없다.
21. **전투력에서 패기 종류의 비중**: 종류 1개당 +55 고정. 초기 전투력 166 대비 3종이면 +165. 열매 보유 +97도 동일하게 큼. 반면 luck·lead·sense는 0.
22. **분기 훈련 +1의 누적**: 1세부터 분기마다 +1(연 +4). 16세까지 약 60포인트가 훈련만으로 쌓인다. 집중 훈련(haki)이면 16세에 haki 약 68 → hakiScore만 200 이상. `trainingFocus`를 유년기에 바꿀 수 있는지는 UI 담당 확인 필요.
23. **16~25세 구간의 체감 속도**: 1년이 12틱(1배속 16.8초)으로 다른 구간(4틱, 5.6초)의 3배. 정산은 분기 단위로 맞췄지만, 매 틱 판정인 성인 사건(L2987)과 해상 교전 12%(분기 1회 제한)는 이 구간에서 판정 기회가 3배다.
24. 투자에 손실이 없어 "높음" 위험 상품(연 20%)이 무조건 최선. 원금 대비 단리 고정.
25. 현상금 랭킹의 원작 인물 수치가 고정이라 플레이어 현상금만 단조 증가 → 장기 플레이 시 순위는 올라가기만 한다(감소 요인은 소속 변경 시 0 초기화뿐).
