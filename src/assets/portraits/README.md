# 초상화 그림 파일

이 폴더에 그림 파일(png · gif · webp · jpg)을 넣으면, 게임이 코드로 그리는 픽셀 초상화 대신 그 파일을 씁니다.
파일이 없으면 지금처럼 픽셀 초상화가 나옵니다. 다시 빌드(`npm run build` 또는 `play.bat`)해야 반영됩니다.

## 이름 규칙 (확장자는 무엇이든, 대소문자 구분 없음)

한 사람에게 아래 이름을 차례로 찾아 처음 나오는 파일을 씁니다.

1. **그 사람만의 이름**
   - 원작 인물: `src/v5/data/canon.ts`의 id. 예: `smoker.png`, `koby.gif`
   - 주인공: `hero-m.png`(남), `hero-f.png`(여)
   - 이름 있는 상대: `src/data/bosses.ts`의 faceKey · canon · id
2. `종족-진영-성별` 예: `fishman-pirate-m.png`, `human-marine-f.png`
3. `진영-성별` 예: `pirate-m.png`, `rev-f.gif`
4. `종족-성별` 예: `mink-f.png`
5. `성별` 예: `m.png`, `f.png`

열세 살 미만이면 같은 이름 끝에 `-child`를 붙인 파일을 먼저 찾습니다. 예: `hero-f-child.png`

- 진영: `civil`(뭍사람) · `pirate` · `marine` · `rev`(혁명군)
- 종족: `human` · `fishman` · `merfolk` · `mink` · `giant` · `longarm` · `longleg` · `threeeye` · `tontatta` · `skypiean` · `buccaneer` · `lunarian`
- 성별: `m` · `f`

## 크기

정사각형을 권합니다(예: 96×96, 128×128). 화면이 정사각형 칸에 맞춰 줄이거나 늘립니다.
픽셀 그림이면 작게 그려도(24×24 등) 계단 모양 그대로 확대됩니다.
