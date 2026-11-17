# 원피스 라이프

v6.9 게임 소스의 로컬 개발 폴더다. 화면은 Preact, 빌드는 Vite, 테스트는 Vitest를 사용한다.

## 실행

Node.js 22 이상에서 실행한다.

```bash
npm ci
npm run dev
```

같은 Wi-Fi의 휴대폰에서 로컬 서버에 접속하려면 `npm run dev:lan`을 실행한다. 컴퓨터를 끄고 플레이할 때는 [배포된 게임](https://daojyman-lab.github.io/onepiece_life/)을 사용한다.

```bash
npm run build
npm test
npm run simulate5 -- 10 random
```

## 폴더

| 경로 | 역할 |
|---|---|
| `src/app/` | 진입점, 자동 진행, 저장, 상태 연결, 사운드 |
| `src/core/` | 현재 게임의 생애 진행, 성장, 전투 결과, 선택 처리 |
| `src/data/` | 현재 게임의 수치, 일상 기록, 전환점, 섬 에피소드 |
| `src/ui/` | 화면, 모달, 픽셀 그림, 스타일 |
| `src/shared/core/` | 재사용하는 난수, 기술 계산, 자동 전투 엔진 |
| `src/shared/data/` | 재사용하는 출생, 기술, 열매, 보스, 해역 데이터 |
| `src/assets/`, `src/music/` | 이미지·음악 자료 |
| `tests/game/` | 게임 테스트 |
| `tools/` | 생애 시뮬레이터와 콘텐츠 점검 도구 |
| `docs/` | 기획, 설계, 변경 기록, 검증 자료 |

현재 앱의 시작점은 `src/app/main.tsx`다. 이전 v2·v3 HTML은 Git 이력과 원본 작업 폴더에 남아 있다. 문서의 현재·과거 구분은 [문서 안내](docs/README.md)에 정리했다.
