# 생애 통합 보강 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 로그타운의 첫 약속을 수련·항로·알라바스타·재회·전수·엔딩으로 연결한다.
**Architecture:** 기존 전환점을 재사용하고 별도 생애 사건 기록과 실제 토막 시계를 추가한다. 알라바스타 p7 뒤 코스 전용 준비를 연결하고 p10/p11 후일담으로 합류한다.
**Tech Stack:** TypeScript, Preact, Vitest.
**Spec:** `docs/superpowers/specs/2026-11-19-life-course-design.md`

## Global Constraints
- schema 5, 기존 장면 ID/문 번호, 기존 상대 전력, 50세 노화를 유지한다.
- 코스 밖 인생과 옛 저장에 완료 사실을 소급 부여하지 않는다.
- 현재 작업 폴더에서 진행한다. 기준 검증은 직전 검토의 592개 통과/빌드 성공이다.

## Review Focus
- 창/큐 중간에 시간·보상 중복, 저장 왕복 및 오래된 성인 저장.
- 죽은 페니, 중상/양팔 손실, 부상·이탈한 지원 인력.
- 기다리기와 전성기의 실제 시간, 대기 중 이탈/사망.
- 출항 전 신분 변화, 다른 장편과 코스 후속의 경쟁.
- 새 게임의 두 경로 도달성 및 동일한 고정 상대 전력.

### Task 1: 사건 기록과 시간
Files: `src/core/{types,state,load,fx,year,turning}.ts`, `src/core/life-story.ts`, `tests/game/life-story.test.ts`.
- [x] 사건 기록/중복/왕복/옛 저장/시간·이탈·사망 검증을 먼저 작성하고 실패를 확인한다.
- [x] `recordLifeEvent`, `lifeStoryScene`, `advanceLifeTime`, `lifePreparation` 구현과 효과·진행 연결.
- [x] 집중 테스트 통과.

### Task 2: 연결된 콘텐츠와 결산
Files: `src/data/turnings/life-course.ts`, `src/data/turnings/index.ts`, `src/core/{life-story,dreams}.ts`, `src/ui/screens/Main.tsx`.
- [x] 수련별 문 잠금, 다른 전투 결과/재회/전수/엔딩, 신분과 인물 생존 테스트를 작성하고 실패 확인.
- [x] 유년기부터 기존 알라바스타 p7/p11 후속 연결, 인물 안내와 사건 기반 마지막 대답 구현.
- [x] 콘텐츠 회귀 검사 및 집중 테스트 통과.

### Task 3: 생애 비교와 최종 검증
Files: `tests/game/life-story.test.ts`, `tools/simulate-life-course.ts`, `docs/05_검증/생애_통합_보강.md`, 제안서·변경 기록.
- [x] 같은 출생 두 정책의 일반 새 게임 통합 테스트 작성 및 실행.
- [x] 비교 도구에 시드/선택/성과/재회/엔딩을 남기고 문서 상태를 갱신한다.
- [x] 전체 `npm test`, `npm run build`, `git diff --check`와 독립 코드 리뷰를 실행하고 결과를 검증 문서에 기록한다.

## 실행 기록
- 구현 판단: 사용자가 보강안 적용을 요청했으므로 기존 제안서의 첫 범위로 실행한다. 별도 설계 승인 반복은 생략한다.
- 현재 clean `codex/v6-flat` 작업 폴더를 사용한다. 별도 worktree는 만들지 않는다.
- Task 1: complete — 신규 테스트의 모듈 부재 실패 후 사건·시간·저장 처리 구현.
- Task 2: complete — 직접 성과 없는 꿈 판정, 지원병의 잘못된 귀속, 늦은/중복 소개장, 기존 장편의 페니 중복, 전수받은 사람의 ID를 실패 테스트로 재현 후 수정.
- 구현 판단: 병행 무기술 변경의 `beginStyle`/실제 연습/채택 API로 수련을 연결했다. 공유 `DreamId` 확장에 따른 항로 세 종류와 픽셀 무기 nullable 검사 두 곳은 빌드 호환을 위해 보완했다.
- 독립 리뷰: 늦은/중복 소개장 발견 후 수정 확인. 추가 스타일 연결과 인물 별칭 검토에서도 중요 결함 없음.
- 확인: 생애 기능 22개, 관련 회귀 120개 통과. 시드 16의 정상 플레이 세 정책과 코스 영향 비교 40×2인생 완주. 전체 테스트의 병행 변경/밸런스 결과는 검증 문서에 기록한다.
- Task 3: complete — 전체 실행의 637/644 통과·7개 잔여 실패를 기록했다. 중간 제품 빌드는 통과했지만 최종 공유 폴더 재확인에서는 새 `styles.test.ts`의 타입 오류로 실패했다. 관련 120개는 최종 재실행에서도 통과했다. 전역 밸런스 조정 및 다른 무기술 기능 수정은 이번 첫 코스 범위에 포함하지 않는다.
- 후속 요청 완료 (2026-11-19 15:44): 남은 테스트·빌드 오류를 수정하고 통합 전체를 재검증했다. 54개 파일, 823개 테스트 통과, 실패 0개, 기존 todo 5개. `npm run build`와 두 diff 검사가 통과했다. 상세는 `docs/05_검증/테스트_빌드_회귀_수정.md`에 기록했다.
