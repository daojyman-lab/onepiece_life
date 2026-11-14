# 노트 A — UI / 화면 / 렌더링 (그랜드 트레저 v3.3.3)

분석 대상: `trunc.html` (원본 `그랜드_트레저_v3.3.3.html`과 줄 번호 동일, 총 5529줄).
읽은 범위: 1~758 전체, 3020~3440 전체, 5384~5391. 103줄은 사본에서 잘려 있어 원본에서 나머지를 직접 확인함.
버튼→함수 연결 확인을 위해 담당 밖인 1498~1510, 1640~1642, 3437~3462, 4205~4590, 4704~4711, 5370~5384, 5443~5456, 5524도 참고로 읽음(해당 부분은 "참고"로 표기).
괄호 안 숫자는 근거 줄 번호.

---

## 1. 기술 스택 · 디자인 토큰 · 비주얼 컨셉

### 1.1 기술 스택 / 외부 의존성
- 단일 HTML 파일. `<html lang="ko" class="dark">` (2).
- Tailwind CSS CDN(Play CDN 스크립트): `https://cdn.tailwindcss.com/3.4.17` (7). 마크업 대부분이 Tailwind 유틸리티 클래스.
- Google Fonts: `Noto Sans KR` (wght 400/500/700/900), `Press Start 2P` (8~10). preconnect 2건.
- 프레임워크 없음. 순수 DOM API(`getElementById`, `innerHTML`, `addEventListener`) + Canvas 2D + Web Audio(SoundFX, 769~ 참고) + localStorage(4500, 4521 참고).
- 초상화 이미지 4장은 webp base64 data URI로 인라인(763~766), `<img id="playerPortraitImg">` 초기 src에도 child 이미지와 동일한 접두부의 base64가 직접 박혀 있음(273).
- 스크립트/스타일 블록 구성: `<style>` 3개(11~75 기본 다크 테마, 76~101 "v3.3.3 handheld adventure interface" 스킨, 101~104 `#combat-comparison-v331`), 본체 `<script>`(758~4724), 확장 스크립트 `v320-family-crisis-extension`(4725~5079), `v330-flow-extension`(5081~5386), `<style id="v330-flow-style">`(5387~5390), `v332-life-pacing`(5393~5457), `v333-family-names-fruits`(5460~5527).

### 1.2 뷰포트 · 반응형 기준
- viewport: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no` (5) — 확대 금지.
- `html, body`: `overflow-x:hidden; max-width:100vw` (25~34). body 클래스 `min-h-screen flex flex-col select-none`(106) — 전체 텍스트 선택 불가.
- 브레이크포인트(스킨 CSS 기준):
  - `min-width:1024px`: `#mobileBottomNav` 숨김 (96).
  - `1024~1200px`: 3열 그리드 `200px / 1fr / 240px`, gap 12px, `#gameScreen` padding 16px, 캔버스 높이 245px (97).
  - `max-width:1023px`: 메인 그리드를 세로 flex로 전환, 순서 `adventurePanel(0) → leftProfilePanel(1) → rightNavRelationPanel(2)`, 프로필 패널은 2열 그리드, 우측 패널은 2열 그리드, 하단 내비 표시, `#topStatusBar` 숨김, 캔버스 높이 270px, `#gameScreen` 하단 padding 100px (98).
  - `max-width:600px`: 헤더·대시보드·이벤트 카드·모달 축소, `#canvasCaptionRight` 숨김, `#goalNextTargetText` 숨김, 캔버스 245px, 타임로그 300px, 목적지 그리드 1열 등 (99).
  - 전투 모달 전용 `max-width:480px` (103 후반).
  - `prefers-reduced-motion: reduce` → 모든 animation 제거 (100).
- Tailwind 기본 브레이크포인트 `sm:`(640), `md:`(768), `lg:`(1024)도 마크업에서 사용.

### 1.3 디자인 토큰

**(a) 1차 `:root` (다크/네이비 테마, 12~20)** — 이후 스킨에 대부분 덮임
| 변수 | 값 |
|---|---|
| `--bg-ocean` | `#0b1120` |
| `--bg-card` | `#131c31` |
| `--bg-panel` | `#1a2642` |
| `--gold` | `#f59e0b` |
| `--gold-light` | `#fcd34d` |
| `--crimson` | `#ef4444` |
| `--sea` | `#0ea5e9` |

**(b) 2차 `:root` (v3.3.3 스킨, 77)**
| 변수 | 값 |
|---|---|
| `--ink` | `#193453` |
| `--paper` | `#fff5ce` |
| `--frame` | `#244979` |
| `--blue` | `#244e87` |
| `--gold` | `#e4b85d` (1차 값을 덮어씀) |

**(c) 실제 적용 색(스킨의 `!important` 오버라이드)**
- 페이지 배경 `#8dbbc8` + 가로 스캔라인 `repeating-linear-gradient(0deg,#ffffff08 0 2px, transparent 2px 5px)`; 본문 글자 `var(--ink)`, 기본 `font-size:14px; line-height:1.65` (78).
- 헤더: 배경 `#183758`, 하단 테두리 `4px solid #efd193`, 그림자 `0 4px 0 #45647b`, 글자 `#f9f0c8`, `position:relative`(원래 sticky를 해제), 헤더 버튼 배경 `#315674`/테두리 `2px solid #8babbc`/radius 2px (80).
- 상태 칩: 배경 `#254965`, 테두리 `#688aa1` (81).
- 패널(양피지): `bg-slate-9*` → `#fcf1cd`, `bg-slate-8*` → `#e6d8a9` (83). 글자: `text-white`→`#193c60`, `text-slate`→`#4d5e62`, `text-amber`→`#81521c`, `text-sky`→`#24698b`, `text-emerald`→`#246955`, `text-indigo`→`#66518b`, `text-rose`→`#a64043` (84).
- 모든 `rounded*` → `border-radius:2px` (85) — 각진 레트로.
- 중앙/우측 패널 박스: `3px solid #244979`, `inset 0 0 0 2px #fff5d8, 3px 4px 0 #597687` 하드 섀도 (85). 좌측 패널: 배경 `#f7e9b9`, `4px solid #294c70`, 섀도 `3px 4px 0 #42576b` (82).
- 버튼(게임 화면): `min-height:36px`, border 2px, 섀도 `0 2px 0 #b2ab89`, hover `brightness(1.06)` + `translateY(-1px)`, active `translateY(1px)`; `bg-amber*` 버튼 → `#e6ba5e`/글자 `#293b4b`/테두리 `#9b7339`; `bg-sky*` 버튼 → `#72b3c3`/글자 `#143d59` (87).
- 포커스: `button:focus-visible{outline:3px solid #f9ce5e; outline-offset:3px}` (79).
- 모달: 오버레이 `#102a43b8`, 박스 `#fff2cc`, `5px double #284f7d`, 섀도 `6px 7px 0 #102b45`, `max-height:90dvh`; h3 `#234f7b` 20px; 버튼 min-height 40px (92).
- 시작 화면 배경: `linear-gradient(#88c3d1 0 35%, #398faf 35% 60%, #d2c78e 60%)`(하늘/바다/모래 3단 띠), 카드 `5px double #2d5178`, 배경 `#fff3cf`, 섀도 `6px 7px 0 #3f626c` (94).
- 모바일 하단 내비: 배경 `#183956`, 상단 테두리 `3px solid #e5c787`, 버튼 `#305b7a`/글자 `#f3e7bc`, min-height 44px, safe-area inset 반영 (95).

**(d) 타이포**
- 본문 `Noto Sans KR` (33, 78). `.pixel-font{font-family:'Press Start 2P'}` 정의(35~37)는 있으나 마크업 어디에도 쓰이지 않음(전체 파일 grep 결과 35줄 1건).
- 대시보드 kicker·항로 번호 버튼은 `monospace` bold 10px (86).
- 주요 크기: 헤더 h1 20px(모바일 17px), `#routeDashboard h2` 23px(1023 이하 22px, 600 이하 20px), 이벤트 제목 19px, 이벤트 본문 14px/line-height 1.95, 타임로그 12px/1.8, 모달 h3 20px·h4 15px.

**(e) 공용 유틸 클래스(1차 스타일)**
- `.gold-border`(1px rgba(245,158,11,.35)), `.gold-glow`(box-shadow 18px), `.wanted-poster`, `.custom-scroll`(6px 스크롤바, 금색 thumb), `.event-active-glow`(keyframes `pulse-border` 1.6s 무한, 스킨에서 `#activeEventCard{animation:none!important}`로 무효화됨 — 89), `.portrait-img` (38~74).

### 1.4 비주얼 컨셉
- 버전 라벨 "v3.3.3 · 항구 이야기 · 도트 RPG판"(117, 181). 스킨 주석 "handheld adventure interface"(76).
- 원래 다크 네이비+금색 테마(Tailwind slate/amber) 위에, 속성 선택자(`[class*="bg-slate-9"]` 등) + `!important`로 "양피지(크림)+네이비 프레임+하드 드롭섀도+2px 모서리+이중선 테두리"의 레트로 휴대용 게임기풍 스킨을 덧씌운 구조.
- 현상수배서(WANTED 포스터) 모티프의 프로필 카드, 8비트 도트 항구 캔버스, 항로 번호 트레일.

---

## 2. 화면 목록과 전환 흐름

화면은 3개 영역의 `hidden` 토글로 전환한다(SPA식).
`#startScreen`(초기 표시) ↔ `#gameScreen`(초기 hidden) + `#mobileBottomNav`(초기 hidden) + `#topStatusBar`(초기 hidden).

```
[시작 화면 #startScreen]
  └ #creationStep1 (이름·성별)
       ├ [🧭 성향 질문 10문항 진행 후 시작] → startPersonalityQuiz() → #creationStep2
       └ [⚡ 질문 건너뛰고 즉시 출생하기] → quizAnswers=[]; finalizeCharacterCreation()
  └ #creationStep2 (성향 문답 10문항)
       ├ 선택지 클릭 ×10 → finalizeCharacterCreation()
       ├ [← 이름/성별 다시 설정] → Step1 복귀
       └ [남은 문항 자동 응답 후 바로 출생 →] → finalizeCharacterCreation()
finalizeCharacterCreation(): startScreen 숨김, gameScreen·mobileBottomNav 표시,
  renderAll() → startPixelCanvasLoop() → setSimSpeed(1) → openBirthProfileModal()   (4277~4284 참고)
[메인 화면 #gameScreen] + 출생 프로필 모달이 먼저 뜸
  └ 헤더 [🔄 새 인생] → resetToStartScreen() → 시작 화면 Step1 (확인 대화상자 없음, 4494~4496 / 4287~4296)
  └ 저장 모달 [저장된 인생 불러오기] → 시작 화면에서도 바로 메인 화면 진입 가능 (4530~4559)
```

### 2.1 공통 헤더 (109~172) — 모든 화면에 항상 표시
- 좌: ⚓ 아이콘 배지, h1 "그랜드 트레저", 버전 배지 "v3.3.3 · 항구 이야기 · 도트 RPG판", 서브 문구 `#topSubStatus` 초기값 "대해적 시대의 항로 · 인생 시뮬레이터"(119).
  - load 시 확장 스크립트가 `#topSubStatus` 안에 `<span id="v330Badge">· 능력치 비교 교전 v3.3.3</span>`을 추가(5384). 단 renderAll이 `textContent`를 덮어쓰므로(3209) 게임 시작 후에는 사라짐.
- 중: `#topStatusBar` 상태 칩(게임 시작 전 hidden) — 5절 참조.
- 우 버튼 3개:
  | ID | 라벨 | 동작 |
  |---|---|---|
  | `btnSoundToggle` | "🔊 효과음" (title "효과음 켜기/끄기") | `SoundFX.enabled` 토글, 라벨 "🔊 효과음" ↔ "🔇 음소거" (4489~4492) |
  | `btnOpenSaveModal` | "💾 저장/로드" | localStorage 슬롯 상태 문구 갱신 후 `openModal("modalSaveLoad")` (4498~4512) |
  | `btnQuickRestart` | "🔄 새 인생" | `resetToStartScreen()` (4494) |

### 2.2 시작 화면 `#startScreen` (175~259)
- 중앙 카드(max-w-2xl). 상단 고정 영역:
  - 배지: "원피스 세계관 기반 텍스트 RPG / 인생 시뮬레이터" (179)
  - h2: "그랜드 트레저 v3.3.3 · 항구 이야기 · 도트 RPG판" (181)
  - 설명: "작은 항구에서 시작해 바다 저편으로! 가족과 동료를 만나고, 발라티에부터 와노쿠니까지 각 섬의 이야기 속으로 떠나세요." (183)

#### 생성 1단계 `#creationStep1` (188~232)
1. **이름 입력** — 라벨 "1. 캐릭터 이름 입력 (성씨는 세계관 고증에 맞춰 무작위 부여됩니다)" (191)
   - `<input id="inputPlayerName" type="text" maxlength="12" value="" placeholder="사용할 이름을 입력하세요">` (193). 기본값 없음.
   - `btnRandomName` "🎲 이름 추천" → 다음 8개 중 무작위: `"카이", "로건", "하란", "유진", "세이라", "벨라", "레온", "아스카"` (4341~4343).
   - 빈 이름이면 토스트 "사용할 이름을 입력해 주세요." + 입력란 focus (4208, 4253).
2. **성별 선택** — 라벨 "2. 성별 선택 (성별에 따라 보아 가문·아마존 릴리 등 고증 조건이 자동 반영됩니다)" (202)
   - `btnGenderMale` `data-gender="남성"` "♂ 남성 모험가" — 기본 선택 상태(금색 2px 테두리, 204~207). 상태 변수 `selectedGender = "남성"`(1506).
   - `btnGenderFemale` `data-gender="여성"` "♀ 여성 모험가" (208~211).
   - 선택 시 `.gender-btn` className 전체 교체로 강조 토글 (4327~4338). 옵션은 이 2개뿐.
3. **안내 박스** "⚓ v3.3.3 출생 & 고증 시스템 안내" (215~219)
   - "성씨·종족·출생지 연동": '보아(Boa)'는 여성 전용·여인섬 아마존 릴리 출생, 어인족 성씨(피셔, 아론, 호디), 거인족(재규어, 헤이르딘), 밍크족(페드로, 캐럿), 천룡인(돈키호테, 로즈워드, 차르로스).
   - "운명의 성향 문답": "60개의 성향 질문 풀에서 중복 없이 무작위 10문항을 진행하거나, 즉시 출생으로 바로 시작" (218).
4. **진행 버튼** (222~231)
   | ID | 라벨 | 호출 |
   |---|---|---|
   | `btnStartQuiz` | "🧭 성향 질문 10문항 진행 후 시작 (권장)" | `SoundFX.play("event")` → `startPersonalityQuiz()` (4346~4349) |
   | `btnSkipQuizStart` | "⚡ 질문 건너뛰고 즉시 출생하기" | `SoundFX.play("event")` → `quizAnswers=[]` → `finalizeCharacterCreation()` (4350~4354) |

- 시작 화면에 "인생 과업(목표) 선택" UI는 없음. 다만 JS에는 `.goal-select-btn` 리스너와 `selectedLifeGoal = "pirate_king"` 변수가 남아 있음(1507, 4378~4389) → 9절 참조.

#### 생성 2단계 `#creationStep2` (235~257) — 성향 문답
- 상단: `#quizCategoryBadge` "분야: {cat}" (초기 "분야: 위험 감수"), `#quizProgressText` "문항 {n} / {총}" (초기 "문항 1 / 10").
- 진행바: `#quizProgressBar` 폭 = `round((index+1)/총 × 100)%`, `transition-all duration-300` (241, 4226).
- 질문: `#quizQuestionText`. 선택지: `#quizOptionsContainer`에 버튼 동적 생성, 라벨 `"{i+1}. {opt.t}"`, 선택지 순서는 매번 무작위 셔플 (4229~4248). 스킨에서 버튼은 네이비(`#244e7a`) 배경·`3px double #98b2c2` (94).
- 선택 클릭: `SoundFX.play("tick")`, `quizAnswers.push(opt)`, 마지막 문항이면 `finalizeCharacterCreation()` 아니면 `renderQuizStep()`.
- 문항 추출 규칙(참고, 4207~4213): 최근 출제 ID(`recentQuestionIds`)를 제외한 풀에서 셔플 후 10개. 풀이 10개 미만이면 전체 풀 사용. 최근 ID가 40개 초과 시 앞 20개 삭제.
- 하단 링크형 버튼:
  | ID | 라벨 | 동작 |
  |---|---|---|
  | `btnBackToStep1` | "← 이름/성별 다시 설정" | Step2 숨김, Step1 표시 (4355~4358) |
  | `btnFinishQuizEarly` | "남은 문항 자동 응답 후 바로 출생 →" | `finalizeCharacterCreation()` 직접 호출 (4359~4361) |

---

## 3. 메인 화면 레이아웃 `#gameScreen` (262~542)

- 컨테이너: Tailwind `max-w-7xl` → 스킨에서 `max-width:1500px`, padding `22px 24px 32px` (81).
- 데스크톱(≥1024): `grid-template-columns: 242px minmax(0,1fr) 282px`, gap 20px, `align-items:start` (81). (원본 Tailwind는 12칼럼 3/6/3.)
- 1024~1200: `200px / 1fr / 240px` (97).
- ≤1023: 세로 flex, 순서 중앙 → 좌 → 우 (98).

### 3.1 좌측 패널 `aside#leftProfilePanel` (266~329) — 캐릭터 프로필
1. **현상수배서 카드** `.wanted-poster` (268~289)
   - 헤더 문구 "WANTED / PROFILE".
   - 초상화 `img#playerPortraitImg.portrait-img` (스킨: 컨테이너 높이 180px, 이미지 max-height 200px, `object-fit:contain` — 90).
   - 좌상단 배지 `#ageStageBadge` (초기 "유년기 · 1세"), 우하단 배지 `#traitBadge` (초기 "모험형").
   - `#posterFullName` (초기 "이름 미정"), `#posterTitleSub` (초기 "이스트 블루 · 인간").
   - "BOUNTY" 행: `#posterBounty` (초기 "฿ 0").
2. **신상 정보 박스** (292~313) — 라벨/값 5행
   | 라벨 | ID | 초기값 |
   |---|---|---|
   | 출생지 | `profBirthplace` | "-" |
   | 가정환경 | `profHousehold` | "-" |
   | 현재 소속/직위 | `profAffiliationRole` | "-" |
   | 보유 능력/재능 | `profAbility` | "-" |
   | 건강 상태 | `profCondition` | "건강함 (100/100)" |
3. **능력치 박스** (316~322): 제목 "📊 능력치 현황", `#profCombatPower` "종합 전투력: 0", `#statsListContainer`(스탯 바 8개, 7절).
4. **인벤토리 박스** (325~328): 제목 "🎒 보유 보물 & 항해 도구", `#inventoryTags`(아이템 칩).

모바일(≤1023): 패널 자체가 2열 그리드 `minmax(120px,1fr) minmax(140px,1.4fr)` (98). ≤600: `1fr 1.1fr`, 3번째 자식부터는 전체 폭(`grid-column:1/-1`) → 수배서+신상 정보가 나란히, 능력치·인벤토리는 아래 전폭 (99).

### 3.2 중앙 패널 `section#adventurePanel` (332~478)
위에서 아래 순서:

1. **항로 대시보드 `#routeDashboard`** (334) — 네이비(`#214c79`) 배경, `4px double #f7e6ae`
   - kicker "GRAND TREASURE / ADVENTURE LOG"
   - `h2#routeChapter` (초기 "나의 첫 모험")
   - `p#routeProgress` (초기 "먼 바다를 향한 준비")
   - `div#routeTrail` — 항로 번호 버튼들(25×24px), `.here`(현재 위치, 금색 `#f4cc69`, 위로 2px), `.done`(완료, 녹색 `#548c78`) (86)
   - `p#routeHint` (초기 "원작 항로를 따라 펼쳐지는 항구 이야기")
   - 갱신 함수는 `updateVoyage310()`(4704, 참고): 챕터=항해 중이면 "항해 중 · 다음 섬으로", 아니면 `STORY_BOOK[locationId].chapter` 또는 "나의 첫 모험"; 진행="남은 항해 N개월" 또는 "지역 이야기 n/3" + " · {roleTitle}"; 트레일=`ROUTE_ORDER` 순서 번호 버튼(title=섬 이름, 클릭 시 `openDestinationsModal()`); 힌트="다음 추천 항구 · {이야기 3단계 미완료 첫 섬}" 또는 "다시 만날 동료와 새로운 항로".
   - 확장(5445~5451, 참고)이 `#routeHint` 바로 뒤에 `div#lifePace332`(진행 속도 안내: "{label} · 한 번 진행하면 {months}개월 / 현재 {age}세 {month}월")를 동적 삽입.

2. **시간·캔버스·과업·액션 박스** (336~425)
   - 상단 좌: `#timeStateIndicator`(10px 원형 점: 진행 중 `bg-emerald-400 animate-pulse`, 정지 `bg-rose-500` — 4311~4316), `#currentDateAgeText`(초기 "해원력 1505년 봄 · 1세"), `#currentSceneLabel`(초기 "고향 생활").
   - 상단 우 속도 버튼(`.speed-btn`, `data-speed`):
     | ID | data-speed | 라벨 | 호출 |
     |---|---|---|---|
     | `btnSpeedPause` | 0 | "⏸ 정지" | `setSimSpeed(0)` |
     | `btnSpeed1x` | 1 | "▶ 1배속" (초기 활성) | `setSimSpeed(1)` → 1400ms 간격 |
     | `btnSpeed2x` | 2 | "⏩ 2배속" | `setSimSpeed(2)` → 750ms |
     | `btnSpeed4x` | 4 | "⚡ 4배속" | `setSimSpeed(4)` → 380ms |
     | `btnStepMonth` | – | "+진행" (title "수동 진행") | 열린 모달이 없을 때만 `pausedForPopup=false` 후 `stepSimulationMonth()` 1회 (4370~4375) |
     활성 버튼은 `bg-amber-500 text-slate-950 border-amber-400`, 비활성은 `bg-slate-800 text-slate-300` (4302~4309). 타이머는 `setInterval(stepSimulationMonth, intervalMs)` (4318~4319).
   - **캔버스 스테이지** `.retro-scene` > `canvas#pixelCanvas` (370~380). 높이: 데스크톱 280px / 1024~1200 245px / ≤1023 270px / ≤600 245px. 테두리 `4px solid #173956`, `image-rendering:pixelated` (88).
     - 하단 오버레이 캡션 2개: `#canvasCaptionLeft`(초기 "8-BIT LIVE: 평화로운 유년기"), `#canvasCaptionRight`(초기 "선장 지시: 균형 성장"; ≤600에서 숨김). 캡션은 각 max-width 48%, 말줄임 (88).
   - **인생 과업 배너** (383~400): 배지 "인생 과업", `#goalBannerTitle`(초기 "👑 해적왕 되기"), 링크 버튼 `btnOpenAmbitionModal` "루트 로드맵 & 과업 변경 →" → `openAmbitionRoadmapModal()` (4400), 진행바 `#goalProgressBar`(초기 20%, amber→rose 그라디언트), `#goalCurrentStepText`(초기 "현재 단계: 1단계 (바다로의 출항)"), `#goalNextTargetText`(초기 "다음 목표: 현상금 3,000만 달성 또는 강적 격파"; ≤600에서 숨김).
   - **퀵 액션 툴바** (403~424, 모바일 2열 / sm 이상 5열):
     | ID | 초기 라벨 | 호출 |
     |---|---|---|
     | `btnOpenBattlePopup` (`data-event-only="true"`, 모바일 2칸 차지) | "⚔️ 실전결투·룰렛" | 대기 중 교전이 없으면 토스트 "항해 중 발생한 교전 발생 사건에서만 전투를 시작할 수 있습니다.", 있으면 `openBattleArenaModal(G.meta.battleOpportunities[0].opponentId, {fromEvent:true})` (4392~4398) |
     | `btnOpenManagePopup` | "⚙️ 관리·훈련·투자" | `openManagementModal()` (4401) |
     | `btnOpenSailPopup` | "🧭 항해·목적지 선택" | `openDestinationsModal()` (4402) |
     | `btnOpenNewsPopup` | "📰 세계정세·현상금순위" | `openWorldNewsModal()` (4403) |
     | `btnOpenBirthModal` | "📜 출생·가문 기록" | `openBirthProfileModal()` (4405) |

3. **인라인 이벤트 카드 `#activeEventCard`** (428~444, 초기 hidden) — 이벤트가 있을 때만 표시. 모달이 아니라 본문에 끼워지는 카드.
   - `#eventTypeTag`(초기 "중요 사건"), `h3#eventTitleText`, `#eventMetaLocation`(초기 "이스트 블루 · 7세"), `#eventRelationContext`(관련 인물 설명 박스), `p#eventBodyText`(`whitespace-pre-line`), `#eventChoicesContainer`(선택지 버튼).
   - 스킨: 네이비 `#1f4b80` 배경, `5px double #f8e7ae`, 제목 `#ffe197` 19px, 본문 `#fff5d7`; 선택지는 크림색 버튼 + 좌측 `▸` 마커(`:before`, 색 `#ba5c38`) (89). ≤600에서 선택지 min-height 55px.

4. **뉴스 티커** (447~459): `#newsGradeBadge`(초기 "세계경제신문"), `p#latestNewsHeadline`(초기 "모건즈의 갈매기 우편이 세계 곳곳의 최신 항해 소식을 전달합니다.", truncate), `btnMoreNewsInline` "전체보기 →" → `openWorldNewsModal()` (4404).

5. **인생 타임로그** (462~477): 제목 "📖 인생 타임로그", `#logCountBadge` "(0건 기록됨)", 필터 버튼(`.log-filter-btn`, `data-logfilter`):
   | data-logfilter | 라벨 |
   |---|---|
   | `all` (초기 활성) | 전체 |
   | `event` | 중요사건 |
   | `relation` | 관계/동료 |
   | `world` | 세계뉴스 |
   클릭 → `currentLogFilter` 변경, className 교체, `renderAll()` (4438~4448).
   목록 `#timeLogContainer`: 높이 380px(≤600: 300px), 세로 스크롤 (91).

### 3.3 우측 패널 `aside#rightNavRelationPanel` (481~540)
1. **항해 계기판 & 기상** (484~520): 제목 "🧭 항해 계기판 & 기상", 배지 `#navCapabilityBadge`(초기 "측정 불가").
   | 라벨 | ID | 초기값 |
   |---|---|---|
   | 현재 해역/섬 | `navCurrentIsland` | "-" |
   | 항해 목적지 | `navTargetIsland` | "미출항 (고향 체류)" |
   | 도착 예상 시간 | `navEtaText` | "항해사/기록지침 필요" |
   | 해역 기상/해류 | `navWeatherText` | "관측 도구 없음 (???)" |
   | 보유 선박 | `navShipName` | "보유 선박 없음" |
   - 고정 안내 `p#navHintNote`: "💡 항해사 동료나 기록지침(로그 포스) / 영구지침이 없으면 그랜드라인 기상과 도착 예상 시간을 정확히 측정할 수 없습니다." (517~519). JS에서 갱신되지 않음.
2. **관계도 현황** (523~539): 제목 "🤝 관계도 현황", `#relationTotalBadge`(초기 "0명"), 탭(`.rel-tab-btn`, `data-reltab`):
   | data-reltab | 라벨 |
   |---|---|
   | `all` (초기 활성) | 전체 |
   | `family` | 가족/형제 |
   | `crew` | 동료 |
   | `mentor` | 스승/친구 |
   | `rival` | 라이벌/앙숙 |
   클릭 → `currentRelTab` 변경, className 교체, `renderAll()` (4451~4461). 목록 `#relationshipsListContainer` max-height 390px 스크롤 (91).

모바일: ≤1023에서 두 박스가 2열 그리드로 나란히, ≤600에서 `display:block`(세로 적층) (98~99).

### 3.4 모바일 하단 고정 내비 `nav#mobileBottomNav` (545~563)
- 게임 시작 시 `hidden` 제거. ≥1024px에서는 CSS로 숨김(96). `position:fixed; bottom:0`, 5칸 그리드.
- 탭 전환이 아니라 **스크롤 이동 또는 모달 열기** 방식이다(4471~4486):
  | data-mobnav | 아이콘/라벨 | 동작 |
  |---|---|---|
  | `profile` | 👤 프로필 | `#leftProfilePanel.scrollIntoView({behavior:"smooth"})` |
  | `log` | 📖 타임로그 (마크업상 강조 스타일) | `#timeLogContainer.scrollIntoView(...)` |
  | `manage` | ⚙️ 관리/훈련 | `openManagementModal()` |
  | `sail` | 🧭 항해/목적지 | `openDestinationsModal()` |
  | `relations` | 🤝 관계/뉴스 | `#rightNavRelationPanel.scrollIntoView(...)` |
- 접힘(아코디언) UI는 구현되어 있지 않다. HTML 주석에는 "Foldable/Bottom Bar", "Accordion/Panel", "Foldable Categories"라고 적혀 있으나(261, 480, 522) 실제로는 필터 탭뿐이다.
- 모바일(≤1023)에서는 헤더의 `#topStatusBar`가 통째로 숨겨진다(98).

---

## 4. 모달 전체 목록 (565~751)

공통: `fixed inset-0 z-50`, 초기 `hidden`, flex 중앙 정렬. ID가 모두 `modal`로 시작하며 스킨이 `[id^="modal"]` 선택자로 일괄 스타일링(92). JS도 `[id^=modal]`로 "열린 모달 존재 여부"를 판정(4372, 3459).
- `openModal(id)`: `G.meta.pausedForPopup = true` 후 hidden 제거 (3444~3447). → 모달이 열리면 시간 정지.
- `closeModal(id)` (3449~3462): 룰렛 회전 중(`isSpinningRoulette`)이면 전투 모달은 닫히지 않음. 전투 모달을 닫으면 `battleModalActive=false`, `activeEvent=null`, `pausedForPopup=false`, `pixelMode="village"`; 그 외 모달은 activeEvent가 없을 때 "다른 모달이 열려 있는지"로 `pausedForPopup` 재계산. 마지막에 `renderAll()`.
- 닫기 버튼은 `data-closemodal="{모달ID}"` 속성으로 일괄 바인딩(4464~4468). 오버레이 클릭/ESC 닫기 처리는 담당 범위 안에서는 확인되지 않음(미확인).

| # | ID | 폭 | 헤더(소제목 / 제목) | 내부 구성 | 버튼 |
|---|---|---|---|---|---|
| 1 | `modalBirthProfile` (566~581) | max-w-lg | "NEW LIFE BEGINS" / "📜 출생 프로필 및 가문 배경" | `#birthProfileModalContent`(동적) | "✕ 닫기", `btnConfirmBirthStart` "⚓ 1살 인생 시뮬레이션 시작하기"(둘 다 data-closemodal로 닫기만 함) |
| 2 | `modalManagement` (584~638) | max-w-2xl | "CAPTAIN & TRAINING MANAGEMENT (시간 일시정지됨)" / "⚙️ 캐릭터 훈련 · 선장 지시 · 자산 투자" | 탭 4개 + 섹션 4개(아래) | "✕ 닫기 (시간 재개)" |
| 3 | `modalDestinations` (641~653) | max-w-2xl | "GRAND LINE & BLUES CHART" / "🧭 출항 및 다음 항해 목적지 선택" | `.retro-notice` 고정 문구, `#sailStatusBanner`, `#destinationsGrid`(2열, ≤600 1열) | "✕ 닫기" |
| 4 | `modalWorldNews` (656~674) | max-w-2xl | "WORLD ECONOMY NEWS PAPER" / "📰 세계 정세 브리핑 & 연간 현상금 순위" | 탭 2개, `#newsFeedPanel`, `#bountyRankingPanel`(초기 hidden), 각 max-h-96 스크롤 | "✕ 닫기" |
| 5 | `modalPersonDetail` (677~685) | max-w-md | `h3#personModalTitle` "인물 상세 프로필" | `#personModalContent`(동적) | "✕ 닫기" |
| 6 | `modalSaveLoad` (688~715) | max-w-lg | "💾 저장 / 불러오기 & 버전 기록 (v3.3.3)" | 슬롯 저장 박스 + 변경 기록 박스 | "✕ 닫기", `btnSaveNow`, `btnLoadNow`, `btnExportJson` |
| 7 | `modalBattleArena` (718~737) | `min(760px,100%)` | "교전 발생 · 전력 분석" / `h3#battleCompareTitle` "능력치 비교" | 아래 상세 | `battleCompareClose` "접어두기", `btnSpinBattleRoulette`, `battleCompareDone` |
| 8 | `modalAmbitionRoadmap` (740~751) | max-w-2xl | "GRAND LIFE AMBITION & ROUTE" / "👑 인생 과업 로드맵 & 루트 변경" | `#ambitionRoadmapContent`(동적) | "✕ 닫기" |

### 4.1 `modalManagement` 탭 (597~636)
탭 버튼(`.mg-tab-btn`, `data-mgtab`), 클릭 시 className 교체 + 섹션 hidden 토글(4408~4421):
| data-mgtab | 라벨 | 섹션 ID | 섹션 내용 |
|---|---|---|---|
| `training` (초기) | 🥋 집중 훈련 | `mgSectionTraining` | 설명 "매달 자동으로 수행할 집중 훈련 종목과 즉시 단련을 선택할 수 있습니다. 선택한 훈련에 따라 힘, 속도, 지능, 패기 적성과 특기가 성장합니다." + `#trainingOptionsGrid`(2열) |
| `orders` | 🏴‍☠️ 선장 방침 | `mgSectionOrders` | 설명 "항해 및 행동 방침을 지시합니다. 선장의 방침에 따라 조우하는 사건 확률, 해군 추격 빈도, 보물 발견율, 동료 신뢰도가 달라집니다." + `#captainOrdersGrid`(2열) + h4 "👥 동료 임무 및 치료/보급" + `#crewAssignmentList` |
| `invest` | 💰 항구 투자 | `mgSectionInvest` | "현재 보유 자금: `#mgCurrentMoney`", "총 투자 원금: `#mgTotalInvested`" + `#investmentListContainer` |
| `faction` | 🎖️ 소속/선박 | `mgSectionFaction` | `#factionCareerPanel` (v3.1 확장이 `.career-sheet` "복무 수첩" 박스와 `.rank-track` 계급 트랙을 삽입 — 4703 참고) |

### 4.2 `modalDestinations` 고정 문구 (650)
- `.retro-notice`: "v3.3.3 · 원작 지역 연속 사건 21곳·63단계 / 단계별 계급 승진 / 드문 전향 제안 / 도트 항구 화면. v3.0.1 보존."
- 목적지 카드 `.port-card` 구조(4701 참고): `.port-number` "{01} / {region}", h4 섬 이름, 첫 이야기 제목, `.port-cast` 등장인물, "이야기 n/3 · 항해 N개월 · 위험 {danger}", 버튼 라벨 = "16세 이후 출항" / "항해 중" / "현재 머무는 항구" / "이곳으로 출항 ▸" (앞 3개는 disabled).

### 4.3 `modalWorldNews` 탭 (666~672)
| ID | 라벨 | 표시 패널 |
|---|---|---|
| `btnNewsTabFeed` (초기 활성) | 🗞️ 세계 정세 뉴스 기록 | `#newsFeedPanel` |
| `btnNewsTabBounty` | 🏆 대해적 현상금 랭킹 | `#bountyRankingPanel` |
(4424~4435)

### 4.4 `modalSaveLoad` (694~713)
- 박스 1 "로컬 브라우저 슬롯 저장": `#saveSlotStatusText`(초기 "현재 저장된 데이터 확인 중...").
  - 모달 열 때 문구: "저장된 캐릭터: {fullName} ({age}세, {affiliation}) · 저장 시각: {lastSavedAt 또는 '기록됨'}" / "현재 저장된 슬롯이 없습니다." / 예외 시 "브라우저 저장소 확인 완료." (4500~4510)
  - `btnSaveNow` "지금 상태 저장하기": G 없으면 토스트 "진행 중인 인생이 없습니다."; 성공 시 localStorage 키 `grand_treasure_v310_save`에 `JSON.stringify(G)`, 상태 문구 "저장 완료: {fullName} ({age}세) · {시각}", 토스트 "현재 인생 데이터가 저장되었습니다!"; 실패 토스트 "저장 중 오류가 발생했습니다." (4514~4528)
  - `btnLoadNow` "저장된 인생 불러오기": 키 `grand_treasure_v310_save` 우선, 없으면 `grand_treasure_v301_save`. 없으면 토스트 "저장된 데이터가 없습니다."; 성공 시 화면 전환 + 토스트 "'{fullName}'의 인생을 불러왔습니다!"; 실패 "데이터를 불러오지 못했습니다." (4530~4559)
  - `btnExportJson` "세이브 코드 복사": 임시 textarea + `document.execCommand("copy")`, 토스트 "세이브 JSON 데이터가 클립보드에 복사되었습니다!" (4561~4572). 세이브 코드를 **붙여넣어 불러오는(import) UI는 마크업에 없음**.
- 박스 2 "📌 그랜드 트레저 v3.3.3 변경 기록 (CHANGELOG)" (706~711) — 정적 텍스트:
  - "2026-11-14 · v3.3.3: 형제자매 0~3명 무작위 생성, 관계도 창작 인물 성씨 부여, 이름 기본값 제거, 열매 이름·계통·효과 표시. v3.3.2 보존."
  - "2026-11-14 · 교전 능력치 비교 팝업, 표시 승률과 실제 판정 통일, 동료 지원·부상 반영, 유년기 대련 확률 판정, 전투 결과 기록. v3.3.0 보존."
  - 불릿 5개: 버전(새 데이터 구조 및 UI 전면 재설계) / 성씨·종족·성별 고증 / 유년기 & 가족 서사("형제자매(1~3명)") / 항해 계기판 / 원작 조연 & 파워밸런스.

### 4.5 `modalBattleArena` — 능력치 비교 교전 팝업 (718~737)
`<section class="combat-comparison" role="dialog" aria-modal="true" aria-labelledby="battleCompareTitle">`
- 헤더 `.combat-head`: small "교전 발생 · 전력 분석", h3 "능력치 비교", 버튼 `#battleCompareClose` "접어두기"(data-closemodal).
- `#battleCompareContext` (교전 상황 설명, 동적)
- `#battleOpponentsGrid` (상대 선택 버튼들, flex wrap)
- `#battleRouletteStage` (초기 hidden):
  - `.combat-versus` 3열(플레이어 | VS | 상대): `#battlePlayerName`, `#battlePlayerCondition` / `#roulEnemyTierBadge`, `#roulEnemyName`, `#roulEnemyPower`
  - `#battleStatBreakdown` (스탯 비교 표 `.combat-table`이 들어가는 자리; 우위 셀은 `.combat-ahead` 녹색)
  - `p#battleEnemyProfileNote.combat-note`
  - `.combat-totals` 2열: "내 유효 전투력" `#roulReadoutFinalMy` + `#battleMyBasePower` / "상대 유효 전투력" `#battleEnemyTotal` + `#battleEnemyStatus` (숫자 28px 굵게)
  - `#battleCrewCompare` (동료 지원 비교)
  - `.combat-odds`: "승리 확률 `#roulReadoutWinPct`" + `#battleLosePct`, 트랙 `.combat-odds-track`(배경 빨강 `#ce6a58`, 높이 20px) 안에 `#battleWinBar`(녹색 `#48a578`, 폭=승률), `p#battleOddsFormula`
  - `#battleStakes.combat-stakes` (승패 시 득실, 점선 박스)
  - `button#btnSpinBattleRoulette.combat-start` "이 확률로 교전 시작" → `executeBattleRouletteSpin` (4399)
  - `p#roulSpinStatusText` (role=status, aria-live=polite)
  - `#roulResultBanner` (초기 hidden; `.combat-result` + `.combat-win`(녹색) / `.combat-loss`(주황))
  - `button#battleCompareDone.combat-start.hidden` "결과 확인 · 모험으로" (data-closemodal)
- 전용 스타일(101~104): 배경 `#fff4d4`, `4px solid #274e78`, radius 14px, max-height 92dvh; 표 헤더 `#264f79`; `.combat-start` min-height 48px, 배경 `#315f8d`, disabled 시 opacity .5·cursor wait; ≤480px에서 padding 축소·VS 열 24px.
- 이 모달의 직계 자식은 `section`이어서 `[id^="modal"]>div` 스킨 규칙은 적용되지 않고 `.combat-comparison` 규칙만 적용됨.

### 4.6 v330-flow-style (5387~5390)
- `#btnOpenBattlePopup{font-weight:900!important; letter-spacing:.02em!important}`
- `.route-choice-note{padding:10px; background:#fff0c4; border:2px solid #b48b48; color:#244568}` — 사용처는 확장 스크립트 쪽(담당 밖, 미확인).

---

## 5. 공통 컴포넌트

### 5.1 헤더 상태 칩 `#topStatusBar` (124~157)
게임 시작(renderAll) 시 `hidden` 제거·`flex` 추가(3199~3200), `resetToStartScreen()`에서 다시 hidden(4292). ≤1023px에서는 CSS로 항상 숨김(98).
| 라벨 | ID | 값 포맷 | 표시 조건 |
|---|---|---|---|
| 이름 | `hdrName` | `p.fullName` | 항상 |
| 나이 | `hdrAge` | `{age}세` | 항상 |
| 종족 | `hdrSpecies` | `p.species` | `md` 이상 |
| 소속 | `hdrAffiliation` | `p.affiliation` | 항상 |
| 위치 | `hdrLocation` | `p.location` | `sm` 이상 |
| ♥ | `hdrHealth` | `{health}/{maxHealth}` | 항상 |
| ฿ | `hdrMoney` | `money.toLocaleString("ko-KR")` | 항상 |
| 현상금 | `hdrBounty` | `bounty.toLocaleString("ko-KR")` (금색 테두리 칩) | 항상 |
(3201~3208)

### 5.2 토스트 `#toastBanner` (754~756)
- 위치: `fixed bottom-16 lg:bottom-6 right-4 z-50` (모바일에서는 하단 내비 위). 금색 배경.
- `showToast(msg)`: textContent 설정 → hidden 제거 → 2600ms 후 hidden (3437~3442). 큐 없음(연속 호출 시 앞선 타이머가 뒤 토스트를 일찍 닫을 수 있음).

### 5.3 진행바
- 문답 진행바 `#quizProgressBar` (2.2절).
- 인생 과업 진행바 `#goalProgressBar` — 최소 12% (7절).
- 스탯 바 8개(높이 Tailwind `h-1.5` → 스킨에서 6px·각진 모서리, 90).
- 전투 승률 바 `#battleWinBar`.

### 5.4 시간 상태 표시등 `#timeStateIndicator`
- 진행: 에메랄드 점 + pulse / 정지(speed 0): 로즈 점 (4311~4316). 모달·이벤트로 인한 일시정지(`pausedForPopup`)는 이 표시등에 반영되지 않음(setSimSpeed에서만 갱신).

### 5.5 탭/필터 버튼 패턴
- 모든 토글 UI(`.gender-btn`, `.speed-btn`, `.mg-tab-btn`, `.log-filter-btn`, `.rel-tab-btn`, 뉴스 탭)는 "활성/비활성 className 문자열을 통째로 교체"하는 동일 패턴.

### 5.6 효과음
- `SoundFX.play("event")`(시작 버튼), `"tick"`(문답 선택) 등 Web Audio 오실레이터 합성(769~, 상세는 담당 밖).

---

## 6. 픽셀 캔버스 렌더러 (3026~3174 + 4707~4711 참고)

### 6.1 캔버스
- 캔버스는 **1개**: `canvas#pixelCanvas` (371). 전투 전용 캔버스 등은 없음.
- 내부 해상도: `resizeCanvas()`에서 부모 요소의 `getBoundingClientRect()` 기준 `width = max(300, floor(rect.width))`, `height = max(220, floor(rect.height))` (3034~3038). 초기 1회 + `window resize` 이벤트마다.
- 표시 높이는 CSS `.retro-scene`이 결정(280/245/270/245px).
- 2D 컨텍스트. `drawRetroHarbor`에서 `ctx.imageSmoothingEnabled=false`.

### 6.2 루프 / 애니메이션 방식
- `startPixelCanvasLoop()` (3029): `requestAnimationFrame(loop)` 무한 루프. 전역 `animTick`을 프레임마다 +1(3028, 3093). 시간 기반이 아닌 **프레임 카운터 기반**이라 주사율에 따라 속도가 달라짐.
- 재호출 시 기존 `pixelAnimFrame`을 `cancelAnimationFrame` 후 재시작(3172~3173).
- 호출 지점: `finalizeCharacterCreation()`(4282), 불러오기(4553).
- 매 프레임 읽는 상태(3098~3102): `G.meta.pixelMode`(G 없으면 "village"), `G.player.age`(없으면 10), `Boolean(G.player.devilFruit)`, `G.player.hakiTypes.length > 0`, `G.player.gender`(없으면 "남성").
- `pixelMode`로 대입되는 값(전체 grep): `"battle"`, `"treasure"`, `"sail"`, `"village"` 4종.

### 6.3 1차 레이어 — 레거시 장면 (3092~3166)
그리는 순서:
1. 하늘 그라디언트(세로): battle `#450a0a → #1e1b4b`, treasure `#422006 → #0f172a`, 그 외 `#0c4a6e → #0f172a`.
2. 구름/별: 흰색 35% 사각형(18×4) 8개, x = `(i*97 + animTick*0.4) % (w+40) - 20`, y = `16 + (i%3)*14`.
3. 파도: x를 12px 간격, `waveY = h - 28 + sin((x + animTick*2)*0.05)*4`, 본체 `#0284c7`, 물마루 `#38bdf8`(10×3).
4. 갑판/부두: `#78350f` (x 15%~85%, y h-42, 높이 16) + 상단 `#92400e` 4px.
5. 플레이어 스프라이트 `drawPixelSprite(px, py, pScale, age, hasDF, hasHaki, gender)`:
   - `pScale = age < 12 ? 2.4 : 3.2`
   - `px = battle ? w*0.35 + sin(animTick*0.25)*10 : w*0.42`, `py = h - 72`
6. 우측 오브젝트: battle → 적 사각형(`#ef4444`, 22×34, x=w*0.6) + 충돌 섬광(`#fde047` 14×14, `animTick % 6 < 3`일 때 점멸); treasure → 보물상자(`#d97706` 28×20 + `#fef08a` 띠); 그 외 crew 카테고리 동료가 1명 이상이면 동료 스프라이트 1개 `drawPixelSprite(w*0.58, py+2, 2.8, 22, false, false, "여성")`(항상 22세 여성 고정 외형).

**`drawPixelSprite(x, y, scale, age, hasDF, hasHaki, gender)`** (3042~3090) — 사각형 조합 캐릭터
| 부위 | 규칙 |
|---|---|
| 그림자 | `rgba(0,0,0,0.35)` |
| 오라 | hasHaki 또는 hasDF일 때. 패기 우선 `rgba(239,68,68,0.35)`(빨강), 열매만 있으면 `rgba(168,85,247,0.35)`(보라). `pulse = sin(animTick*0.15)*2`로 크기 맥동 |
| 머리카락 | `age >= 50` → `#e2e8f0`(은발); 아니면 여성 `#dc2626`(붉은색), 남성 `#1e293b`(검정) |
| 피부 | `#fbd38d` |
| 코트 | `age < 16` → `#0d9488`(청록), 이상 → `#1d4ed8`(파랑) + 금색(`#f59e0b`) 트림 |
| 수염 | `age >= 50 && gender === "남성"` → `#f8fafc` |
| 다리 | `#334155` 2개 |
| 무기 | `#cbd5e1` 가로 막대(검) — 나이 무관 항상 |
| 상하 흔들림 | `bob = floor(sin(animTick*0.12)*1.5)` (머리·몸통에만 적용, 다리는 고정) |

### 6.4 2차 레이어 — `drawRetroHarbor(ctx,w,h,t)` (4707~4711, 참고)
루프 끝(3168)에서 매 프레임 호출. **G가 있으면 캔버스 전체를 `#9cddf1`로 다시 칠해 1차 레이어를 완전히 덮는다.** 따라서 실제 화면에 보이는 것은 이 함수의 결과다.
- 하늘 `#9cddf1`, 구름 6개(`#edf8e8`, 42×8 + 23×6), x = `(i*83 + t*.22) % (w+70) - 40`.
- 바다 `#2d94c4`(y ≥ 43%), 물결 줄무늬(14×2, `#56bace`/`#a6e2d9`), x가 `t*.35`로 흐름.
- **정박 중(`sailingMonthsLeft <= 0`)**: 섬 덩어리(색 = `STORY_BOOK[locationId].color`, 없으면 `#70b582`), 모래사장 `#e7d5a3`, 집 4채(벽 `#f2e4af`, 지붕 `#965c65`/`#3e6a9e` 교대, 문 `#324760`), 부두(`#866346` + 상단 `#c39661`, 말뚝 9개 `#674931`).
- **항해 중**: 배 선체(`#8e5d42`, 난간 `#e3b66b`), 돛대 `#654b3c`, 돛 `#f5eed7`, 깃발 `#d45653`. 섬·부두는 그리지 않음.
- 내부 `sprite(x,y,col)`: 모자/머리(`#273b50`), 얼굴(`#f3bd8c`), 몸통(col), 다리(`#263d62`), 팔. `bob = floor(sin(t*.09 + x)*2)`.
  - 플레이어: x = `w*.35` (전투 시 `+ sin(t*.13)*14`), y = `h*.71`, 옷 색 = 소속에 "해군" 포함 시 `#e4eef2`, 아니면 `#d35c46`.
  - 동료: crew 카테고리 앞에서부터 **최대 3명**, x = `w*(.19 + i*.09)`, y+10, 색 `['#489b74','#b274ac','#d6a64c']`.
  - 전투(`pixelMode==='battle'`): 적 스프라이트 `#8b5688` (x = `w*.63 - sin(t*.13)*14`) + 십자 섬광(`#fff0a0`, `t % 30 < 7`일 때).
- 좌상단 라벨 박스(`#153860`, 최대 240×22): 항해 중 "SAILING / 다음 섬으로", 아니면 현재 섬 이름(없으면 "고향"), `bold 11px sans-serif`, 글자색 `#f9f1c7`.
- 이 레이어에서 **나이·성별·악마의 열매·패기·treasure 모드는 외형에 반영되지 않는다.**

### 6.5 캔버스 캡션 (DOM 오버레이)
- 좌: `항구 일지: {getAgeStageText(age)} ({affiliation})` (3300)
- 우: 선장 지시 라벨 — `balanced` "선장 지시: 균형 항해", `treasure` "선장 지시: 보물 우선 탐색", `cautious` "선장 지시: 해군 회피 & 안전 항해", `combat` "선장 지시: 현상금 사냥 & 전투 선호", 그 외 기본 "선장 지시: 균형 항해" (3294~3301)

---

## 7. UI 렌더링 함수 (3176~3432)

### 7.1 함수 목록
| 함수 | 줄 | 역할 |
|---|---|---|
| `getPortraitForPlayer(p)` | 3179 | 나이·성별로 초상화 data URI 선택 (8절) |
| `getAgeStageText(age)` | 3185 | 나이대 라벨 문자열 |
| `renderAll()` | 3194 | 메인 화면 전체 일괄 갱신(부분 갱신 없음). G 없으면 즉시 반환 |
| `formatBeli(num)` | 1640 (참고) | `"฿ " + Math.round(num).toLocaleString("ko-KR")` |
| `showToast(msg)` | 3437 | 토스트 2.6초 |
| `renderQuizStep()` | 4222 (참고) | 문답 화면 갱신 |
| `setSimSpeed(speed)` | 4298 (참고) | 속도 버튼·표시등·타이머 갱신 |
| `updateVoyage310()` | 4704 (참고) | 항로 대시보드 갱신 |

`renderAll`은 이후 확장 스크립트에서 4번 래핑된다(참고): 4706(`ensureV310` + 원본 + `updateVoyage310`), 5372(과업 미정 문구·전투 버튼 라벨 덮어쓰기), 5445(`#lifePace332` 삽입/갱신), 5524(`normalize` + `#statsPanel` title 설정 시도).

### 7.2 `getAgeStageText(age)` (3185~3192)
| 나이 | 라벨 |
|---|---|
| ≤ 4 | `영유아기 · {age}세` |
| 5~11 | `유년기 · {age}세` |
| 12~15 | `소년/소녀기 · {age}세` |
| 16~34 | `청년기 · {age}세` |
| 35~49 | `중년기 · {age}세` |
| ≥ 50 | `노년기 베테랑 · {age}세` |

### 7.3 `renderAll()` 상세

**(1) 헤더 (3199~3209)** — 5.1절 표. `#topSubStatus` = `{location} · {affiliation} ({roleTitle})`.

**(2) 좌측 프로필 (3212~3227)**
- `#playerPortraitImg.src` = `getPortraitForPlayer(p)`
- `#ageStageBadge` = `getAgeStageText(p.age)`
- `#traitBadge` = `p.trait`
- `#posterFullName` = `p.fullName`
- `#posterTitleSub` = `{species} · {gender} · {roleTitle}`
- `#posterBounty` = `formatBeli(p.bounty)` → "฿ 1,234,567"
- `#profBirthplace` = `p.birthplace`, `#profHousehold` = `p.household`
- `#profAffiliationRole` = `{affiliation} ({roleTitle})`
- `#profAbility` = `[...p.abilities, ...p.hakiTypes].join(", ")` (둘 다 비면 빈 문자열)
- `#profCondition` = `{condition} ({health}/{maxHealth})`
- `#profCombatPower` = `종합 전투력: {computeCombatPower(p)}`

**(3) 인생 과업 배너 (3230~3252)**
- `goalObj = LIFE_AMBITIONS_DB[p.lifeGoal] || LIFE_AMBITIONS_DB.unassigned`
- 단계를 순서대로 `stg.check(p)` 검사: 통과하면 `completedStages = stg.step`, 처음 실패한 단계가 `nextStageObj`가 되고 중단(순차 달성 방식).
- 진행률 `goalPct = max(12, round(completedStages / stages.length × 100))` → 최소 12%.
- `#goalBannerTitle` = `goalObj.title`
- `#goalCurrentStepText` = 완료 ≥5: `🎉 최종 과업 달성 완료! ({stages[4].name})` / 아니면 `달성도: {completedStages} / 5단계`
- `#goalNextTargetText` = 완료 ≥5: `전설의 정점에 올랐습니다!` / 아니면 `다음 목표 [{name}]: {reqText}`
- v3.3.0 래퍼(5375~5380 참고): `lifeGoal==='unassigned'`이면 제목 "소속 이후에 정하는 인생 과업", 다음 목표 "해군·해적·혁명군·민간인 중 하나를 선택한 뒤 소목표가 열립니다.", 현재 단계 "아직 과업을 정하지 않았습니다", 바 폭 4%.

**(4) 스탯 바 (3254~3282)**
- 렌더 중 상태 보정(부수효과): `p.stats.exp = p.stats.exp || 5`; `p.stats.dfMastery = p.devilFruit ? max(20, p.stats.dfMastery || 25) : 0`.
- 8개 항목(순서·라벨·바 색 클래스·값):
  | # | 키 | 라벨 | 색 클래스 | 값 |
  |---|---|---|---|---|
  | 1 | str | "힘 (공격력)" | `bg-rose-500` | `p.stats.str` |
  | 2 | spd | "스피드 (기동)" | `bg-sky-400` | `p.stats.spd` |
  | 3 | int | "지능 (전술)" | `bg-indigo-400` | `p.stats.int` |
  | 4 | dfMastery | 능력자: `{devilFruit} 숙련도` / 비능력자: "악마의 열매 (비능력자)" | `bg-fuchsia-500` | 능력자면 `p.stats.dfMastery`, 아니면 0 |
  | 5 | haki | "패기 (무장/견문/패왕)" | `bg-purple-500` | `p.stats.haki` |
  | 6 | exp | "경험 (실전 연륜)" | `bg-amber-400` | `p.stats.exp` |
  | 7 | health | "건강 (생명력)" | `bg-emerald-400` | `p.health` |
  | 8 | luck | "운 (룰렛 0.5~1.5x 보정)" | `bg-yellow-300` | `p.stats.luck` |
- 값이 undefined면 `p.stats[k] || 10`. 바 폭 `pct = min(100, round(val/100×100))` → **100을 만점으로 한 퍼센트, 100 초과는 바가 꽉 찬 상태로 고정**(숫자는 그대로 표시).
- 색상 임계값(값에 따라 색이 바뀌는 규칙)은 없음. 스탯별 고정 색. 스킨이 rose→`#bf6b59`, sky→`#5a9eb5`로 덮음(90).
- 다른 스탯(`lead`, `vit`, `sense` 등 — 4699줄에서 사용됨)은 이 목록에 표시되지 않음.

**(5) 인벤토리 (3285~3287)**: `p.items` 각각을 칩(`span`)으로. 빈 상태 문구 없음.

**(6) 중앙 상단 (3290~3308)**
- 날짜: `해원력 {year}년 {계절} · {age}세`, 계절 맵 `{1:"봄", 4:"여름", 7:"가을", 10:"겨울"}`, 맵에 없는 달은 "봄"으로 폴백.
- `#currentSceneLabel` = `sailingMonthsLeft > 0 ? "항해 중" : p.location`
- 캔버스 캡션 2개(6.5절)
- 전투 버튼 `#btnOpenBattlePopup`: `G.meta.battleOpportunities[0]` 유무로 라벨 "⚔️ 발생한 교전 이어가기" / "⚔️ 교전 발생 대기 중", 없으면 `opacity-60` 클래스, title = 대기 교전의 `reason` 또는 "항해 중 사건으로 전투가 발생하면 이곳에서 이어집니다." → 이후 v3.3.0 래퍼가 라벨을 "⚔️ 교전 발생 이어가기" / "⚔️ 교전 발생 대기 중", title 기본값을 "섬 스토리·항해·라이벌 대련에서 교전이 발생합니다."로 다시 덮음(5382 참고).

**(7) 이벤트 카드 (3311~3341)**
- `G.meta.activeEvent`가 있으면 표시: `typeTag`, `title`, `{location} · {age}세`, `relationContext`, `body`(textContent).
- 선택지: `ev.choices` 각각 버튼 — 1행 `{idx+1}. {ch.label}`, 2행 `{ch.riskText}`(작은 회색 글씨). label/riskText는 innerHTML로 삽입.
- 클릭 시: `ch.exec()` → `G.meta.activeEvent = null` → `G.meta.pausedForPopup = Boolean(G.meta.battleModalActive)` → `renderAll()`.
- 없으면 카드 hidden.

**(8) 뉴스 티커 (3344~3348)**: `G.world.newspapers[0]`이 있으면 배지=`latest.grade`, 헤드라인=`[{year}년] {title}`.

**(9) 타임로그 (3351~3373)**
- 필터: `currentLogFilter === "all"`이면 전체, 아니면 `item.type === currentLogFilter`.
- `#logCountBadge` = `({전체 entries 수}건 기록됨)` — 필터와 무관하게 전체 건수.
- 각 항목: 배지 `{age}세 · {year}년`(type별 색), 우측 `location`, 본문 `text`(innerHTML).
- 배지 색 규칙: `event` → amber, `relation` → emerald, `world` → indigo, 그 외(`auto` 등) → slate 회색.
- 배열 순서 그대로 출력(정렬 로직 없음). 가상 스크롤·건수 제한 없음(렌더 측 기준).

**(10) 항해 계기판 (3376~3403)**
- `hasNavigator` = crew 카테고리 동료 중 `role === "항해사"` 또는 `specialty`에 "항해" 포함, **또는** 플레이어 `abilities`에 "항해" 포함.
- `hasLogPose` = `items` 중 "기록지침" 또는 "영구지침" 포함.
- `canMeasureNav = hasNavigator || hasLogPose`.
- 배지 `#navCapabilityBadge`:
  | 조건 | 문구 | 색 |
  |---|---|---|
  | 둘 다 | "정밀 관측 가동" | emerald |
  | 하나만 | "기록지침 관측 중" (항해사만 있어도 이 문구) | emerald |
  | 없음 | "측정 불가 (도구/항해사 없음)" | rose |
- `#navCurrentIsland` = `p.location`
- `#navTargetIsland` = 목적지 있으면 `targetDestObj.name`, 없으면 `p.hasSailed ? "정박 중 (목적지 대기)" : "미출항 (고향 체류)"`
- `#navEtaText` = 목적지 있음: 측정 가능 `약 {sailingMonthsLeft}개월 소요 예상` / 불가 "측정 불가 (항해사/기록지침 필요)"; 목적지 없음: 가능 "목적지 설정 시 즉시 산출" / 불가 "측정 불가"
- `#navWeatherText` = 측정 가능 시 목적지(없으면 현재 섬)의 `weather`, 불가 시 "관측 불가 (항해사 또는 기록지침 필요)"
- `#navShipName` = 보유 시 `{name} (내구도 {hull}/{maxHull})`, 아니면 "보유 선박 없음"
- 현재 섬 객체는 `DESTINATIONS_DB.find(id === p.locationId) || DESTINATIONS_DB[0]`.

**(11) 관계 목록 (3406~3431)**
- 필터: `currentRelTab === "all"` 또는 `r.category === currentRelTab`.
- `#relationTotalBadge` = `총 {전체 인원}명`.
- 카드: `{name} ({age}세)`, 우측 배지 `relType`, 2행 `{affiliation} · 특기: {specialty}`(truncate), 3행 `신뢰도 {trust}`(emerald) · `친밀도 {intimacy}`(amber) · "상세보기"(밑줄).
- 카드 클릭 → `openPersonDetailModal(r, false)`.
- 신뢰도/친밀도는 숫자만 표시, 게이지·등급 라벨 없음.

### 7.4 숫자 포맷 정리
- 금액/현상금: `toLocaleString("ko-KR")` 천 단위 콤마. 헤더는 기호 없이 숫자만(칩에 ฿ 기호 별도), 포스터는 `formatBeli` → "฿ 1,234" (반올림).
- 만/억 단위 축약 표기는 렌더 함수에 없음.
- 체력: `{현재}/{최대}`.

---

## 8. 초상화(PORTRAITS) 선택 규칙

- `PORTRAITS` 키 4개: `child`, `maleYoung`, `femaleYoung`, `veteran` (763~766). 모두 `data:image/webp;base64,...`.
- `getPortraitForPlayer(p)` (3179~3183):
  | 조건(위에서부터 순서대로) | 이미지 |
  |---|---|
  | `p.age <= 14` | `PORTRAITS.child` (성별 무관 공용) |
  | `p.age >= 50` | `PORTRAITS.veteran` (성별 무관 공용) |
  | 15~49세, `gender === "여성"` | `PORTRAITS.femaleYoung` |
  | 15~49세, 그 외 | `PORTRAITS.maleYoung` |
- 종족·소속·악마의 열매는 초상화에 영향 없음.
- 초기 `<img>` src(273)는 `PORTRAITS.child`와 같은 접두부의 base64가 인라인되어 있음(동일 이미지 중복 내장으로 보이나 전체 바이트 비교는 하지 않음 — 미확인).
- 초상화 경계(14/15세, 49/50세)와 `getAgeStageText` 경계(15/16세 청년기, 49/50세 노년기), 캔버스 스프라이트 경계(12세 크기, 16세 코트, 50세 백발)가 서로 다름.
- 인물 상세 모달 등 다른 곳에서의 초상화 사용 여부는 담당 범위 밖(`PORTRAITS.` 참조는 전체 파일에서 3180~3182줄뿐임을 grep으로 확인).

---

## 9. 발견한 버그 · 어색한 점 · 중복 · 죽은 코드

### 죽은 코드 / 죽은 마크업
1. **레거시 캔버스 장면이 통째로 가려짐**: `loop()`가 하늘·파도·갑판·`drawPixelSprite`·보물상자 등을 그린 뒤(3104~3166) `drawRetroHarbor`가 캔버스 전체를 다시 칠한다(4707). G가 있는 동안 나이별 머리색·수염·코트색, 패기/열매 오라, 성별 머리색, treasure 모드 보물상자, 크기 차이(2.4/3.2)는 **화면에 전혀 보이지 않고** 매 프레임 낭비 렌더만 된다. 섹션 제목 "(Aging, Abilities, Ship, Battle)"과 실제 표시가 불일치.
2. `pixelMode === "treasure"`는 현재 보이는 레이어에 대응 그림이 없음. `"sail"`/`"village"` 값도 `drawRetroHarbor`는 쓰지 않고 `sailingMonthsLeft`로 판정.
3. `.goal-select-btn` 클릭 리스너와 `selectedLifeGoal`(1507, 4378~4389): 해당 클래스의 마크업이 파일에 없음. 주석은 "Life Goal selection on Start Screen".
4. `.pixel-font` 클래스(35)는 미사용 → `Press Start 2P` 폰트를 내려받기만 하고 쓰지 않음.
5. `data-event-only="true"`(404): 참조하는 코드 없음.
6. `.event-active-glow` 애니메이션: 스킨이 `animation:none!important`로 무효화(89).
7. 1차 `:root` 변수(`--bg-ocean` 등 12~20)와 `.gold-glow` 등 다크 테마 스타일 대부분이 스킨에 의해 덮여 실효 없음. Tailwind 다크 클래스 위에 `[class*=...]` + `!important` 오버라이드를 쌓은 구조라 유지보수가 어려움.
8. `#statsPanel`(5524 참고)은 존재하지 않는 ID — 열매 설명 title 설정이 동작하지 않음(실제 컨테이너는 `#statsListContainer`).
9. `#v330Badge`(5384): load 시 `#topSubStatus`에 붙지만 첫 `renderAll`의 `textContent` 대입(3209)으로 제거됨.
10. 초기 마크업 문구 다수가 렌더 후에는 절대 나오지 않음: "8-BIT LIVE: 평화로운 유년기", "선장 지시: 균형 성장", "⚔️ 실전결투·룰렛", "현재 단계: 1단계 (바다로의 출항)", "관측 도구 없음 (???)" 등.
11. `#navHintNote`는 정적 문구로 상태와 무관하게 항상 표시(항해사·지침을 갖춰도 "없으면 측정할 수 없습니다" 안내가 남음).

### 버그 / 버그 가능성
12. **계절 표기**: 계절 맵이 1·4·7·10월만 정의(3290). v3.3.2 페이싱은 16~25세에 1개월 단위로 진행한다고 안내하므로(5450 title) 그 외 달에는 모두 "봄"으로 표시될 수 있음(실제 `p.month` 값 범위는 엔진 담당 확인 필요).
13. **`btnFinishQuizEarly` 라벨과 동작 불일치**: "남은 문항 자동 응답 후 바로 출생"이지만 자동 응답 로직 없이 지금까지의 `quizAnswers`만으로 `finalizeCharacterCreation()` 호출(4359~4361).
14. `resetToStartScreen()`(4287~4296): 확인 절차 없이 진행 중 인생 폐기. `cancelAnimationFrame`을 하지 않아 숨겨진 캔버스에서 rAF 루프가 계속 돎(G=null이라 레거시 장면을 그림). 이름 입력값·성별 선택·열려 있던 모달도 초기화하지 않음.
15. `startPixelCanvasLoop()`를 호출할 때마다 `window resize` 리스너가 추가되고 제거되지 않음(3040) — 새 인생/불러오기 반복 시 누적.
16. 애니메이션이 프레임 카운터 기반(`animTick++`)이라 고주사율 화면에서 더 빨리 움직임. `prefers-reduced-motion`은 CSS 애니메이션만 끄고 캔버스는 그대로.
17. 스탯 바가 100 기준 고정 스케일(3269) — 100을 넘는 값은 바로 구분 불가.
18. `renderAll` 안에서 상태를 변경(`p.stats.exp`, `p.stats.dfMastery` 보정, 3255~3256) — 렌더 함수의 부수효과.
19. 과업 단계 수를 5로 하드코딩(`>= 5`, `stages[4]`, "/ 5단계", 3246~3251)하면서 진행률은 `stages.length`로 계산 — 단계 수가 5가 아닌 과업이 있으면 어긋남(DB 확인은 담당 밖).
20. `#profAbility`: 능력·패기가 없으면 빈 문자열(초기 "-"가 사라짐). 인벤토리·타임로그·관계 목록도 빈 상태 안내 문구 없음.
21. `navCapabilityBadge`: 항해사만 있고 지침이 없어도 "기록지침 관측 중"으로 표시(3383).
22. 이벤트 선택지 클릭 핸들러가 `ch.exec()` 뒤 무조건 `activeEvent = null`(3332~3333) — exec 안에서 후속 이벤트를 `activeEvent`에 넣어도 지워짐.
23. 타임로그 본문·선택지 라벨·관계 카드가 `innerHTML`로 삽입(3327~3330, 3370, 3417~3427). 플레이어 이름(자유 입력, 최대 12자)이 로그 문장에 섞이면 HTML로 해석될 수 있음.
24. `renderAll`이 매 틱 전체 DOM을 다시 만든다(타임로그 전체 `innerHTML` 재생성 포함) — 로그가 길어지면 성능 저하 및 스크롤 위치 유지 문제 가능(로그 상한은 엔진 담당 확인 필요).
25. 토스트: 타이머 중첩 관리 없음(3441).
26. `#timeStateIndicator`는 `setSimSpeed`에서만 바뀌므로 이벤트/모달로 멈춘 동안에도 녹색 점멸 유지.
27. **모바일에서 소지금 미표시**: ≤1023px에서 `#topStatusBar`가 숨겨지는데(98), 소지금(`hdrMoney`)은 메인 화면에서 헤더 칩에만 있음(그 외는 관리 모달 투자 탭 `#mgCurrentMoney`). 이름·나이·체력·현상금은 프로필 패널에 중복 표시되지만 소지금·종족 칩은 대체 표시가 없음(종족은 포스터 부제에 있음).
28. 모바일 하단 내비의 활성 표시가 정적 — "타임로그" 버튼만 마크업상 강조되어 있고 클릭해도 강조가 바뀌지 않음(4471~4486). "관계/뉴스" 버튼은 관계 패널로 스크롤만 하고 뉴스는 열지 않음.
29. viewport `user-scalable=no`, body `select-none` — 접근성(확대, 텍스트 선택) 제한. 모달에 `role="dialog"`가 있는 것은 전투 모달뿐.
30. 세이브 "코드 복사"만 있고 가져오기 UI가 없음. 저장 키 이름이 `grand_treasure_v310_save`로 버전 표기와 불일치(v3.3.3).

### 문구 불일치 / 중복
31. CHANGELOG 내 모순: "형제자매 0~3명 무작위 생성"(706) vs "형제자매(1~3명)"(709).
32. 구버전 용어 잔존: 모달 주석 "COMBAT ARENA & LUCK (0.5x~1.5x) ROULETTE"(717), 스탯 라벨 "운 (룰렛 0.5~1.5x 보정)"(3265), ID `btnSpinBattleRoulette`·`roul*` — 현재 UI 문구는 "능력치 비교 / 이 확률로 교전 시작".
33. 전투 버튼 라벨을 `renderAll` 원본(3305)과 v3.3.0 래퍼(5382)가 서로 다른 문구로 이중 설정.
34. HTML 주석의 "Foldable/Accordion"(261, 480, 522)은 미구현.
35. 헤더 Tailwind 클래스 `sticky top-0`(109)을 스킨이 `position:relative!important`로 해제(80) — 스크롤 시 헤더가 따라오지 않음.
36. 캔버스 컨테이너의 `h-36 sm:h-44`(370)도 스킨 높이에 덮여 무의미.
37. 시작 화면 문구 "60개의 성향 질문 풀"(218) — 실제 `PERSONALITY_QUESTIONS` 개수는 담당 밖이라 미확인.

---

## 부록: 담당 범위 내 요소 ID 색인

- 헤더: `topSubStatus`, `topStatusBar`, `hdrName`, `hdrAge`, `hdrSpecies`, `hdrAffiliation`, `hdrLocation`, `hdrHealth`, `hdrMoney`, `hdrBounty`, `btnSoundToggle`, `btnOpenSaveModal`, `btnQuickRestart`
- 시작/생성: `startScreen`, `creationStep1`, `inputPlayerName`, `btnRandomName`, `btnGenderMale`, `btnGenderFemale`, `btnStartQuiz`, `btnSkipQuizStart`, `creationStep2`, `quizCategoryBadge`, `quizProgressText`, `quizProgressBar`, `quizQuestionText`, `quizOptionsContainer`, `btnBackToStep1`, `btnFinishQuizEarly`
- 좌 패널: `leftProfilePanel`, `playerPortraitImg`, `ageStageBadge`, `traitBadge`, `posterFullName`, `posterTitleSub`, `posterBounty`, `profBirthplace`, `profHousehold`, `profAffiliationRole`, `profAbility`, `profCondition`, `profCombatPower`, `statsListContainer`, `inventoryTags`
- 중앙 패널: `adventurePanel`, `routeDashboard`, `routeChapter`, `routeProgress`, `routeTrail`, `routeHint`, (`lifePace332` 동적), `timeStateIndicator`, `currentDateAgeText`, `currentSceneLabel`, `btnSpeedPause`, `btnSpeed1x`, `btnSpeed2x`, `btnSpeed4x`, `btnStepMonth`, `pixelCanvas`, `canvasCaptionLeft`, `canvasCaptionRight`, `goalBannerTitle`, `btnOpenAmbitionModal`, `goalProgressBar`, `goalCurrentStepText`, `goalNextTargetText`, `btnOpenBattlePopup`, `btnOpenManagePopup`, `btnOpenSailPopup`, `btnOpenNewsPopup`, `btnOpenBirthModal`, `activeEventCard`, `eventTypeTag`, `eventTitleText`, `eventMetaLocation`, `eventRelationContext`, `eventBodyText`, `eventChoicesContainer`, `newsGradeBadge`, `latestNewsHeadline`, `btnMoreNewsInline`, `logCountBadge`, `timeLogContainer`
- 우 패널: `rightNavRelationPanel`, `navCapabilityBadge`, `navCurrentIsland`, `navTargetIsland`, `navEtaText`, `navWeatherText`, `navShipName`, `navHintNote`, `relationTotalBadge`, `relationshipsListContainer`
- 기타: `mobileBottomNav`, `toastBanner`
- 모달: `modalBirthProfile`(`birthProfileModalContent`, `btnConfirmBirthStart`), `modalManagement`(`mgSectionTraining`, `trainingOptionsGrid`, `mgSectionOrders`, `captainOrdersGrid`, `crewAssignmentList`, `mgSectionInvest`, `mgCurrentMoney`, `mgTotalInvested`, `investmentListContainer`, `mgSectionFaction`, `factionCareerPanel`), `modalDestinations`(`sailStatusBanner`, `destinationsGrid`), `modalWorldNews`(`btnNewsTabFeed`, `btnNewsTabBounty`, `newsFeedPanel`, `bountyRankingPanel`), `modalPersonDetail`(`personModalTitle`, `personModalContent`), `modalSaveLoad`(`saveSlotStatusText`, `btnSaveNow`, `btnLoadNow`, `btnExportJson`), `modalBattleArena`(`battleCompareTitle`, `battleCompareClose`, `battleCompareContext`, `battleOpponentsGrid`, `battleRouletteStage`, `battlePlayerName`, `battlePlayerCondition`, `roulEnemyTierBadge`, `roulEnemyName`, `roulEnemyPower`, `battleStatBreakdown`, `battleEnemyProfileNote`, `roulReadoutFinalMy`, `battleMyBasePower`, `battleEnemyTotal`, `battleEnemyStatus`, `battleCrewCompare`, `roulReadoutWinPct`, `battleLosePct`, `battleWinBar`, `battleOddsFormula`, `battleStakes`, `btnSpinBattleRoulette`, `roulSpinStatusText`, `roulResultBanner`, `battleCompareDone`), `modalAmbitionRoadmap`(`ambitionRoadmapContent`)
