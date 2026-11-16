// 초상화 그림 파일: src/assets/portraits/ 에 이름 규칙대로 png · gif · webp · jpg를 넣으면 픽셀 그림 대신 그 파일을 쓴다.
// 파일이 없으면 지금처럼 코드가 그리는 픽셀 그림(faceURL)을 쓴다. 이름 규칙은 src/assets/portraits/README.md.
import { faceURL, type Who } from '../../ui/pixel/pixelArt';

/** 파일 이름(확장자 뺀 것) → 주소. 빌드할 때 폴더를 훑어 모은다 */
const FILES: Record<string, string> = (() => {
  const found = import.meta.glob('../../assets/portraits/*.{png,gif,webp,jpg,jpeg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(found)) {
    const name = path.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase();
    out[name] = url;
  }
  return out;
})();

/** 어린아이로 그리는 나이 (이 나이 미만이면 '-child' 이름을 먼저 찾는다) */
const CHILD_AGE = 13;

/** 이 사람에게 맞는 파일 이름 후보: 자세한 것부터 */
export function portraitNames(who: Who): string[] {
  const key = who.key.startsWith('hero:') ? `hero-${who.gender ?? 'm'}` : who.key;
  const g = who.gender ?? 'm', f = who.faction ?? 'civil', sp = who.species ?? 'human';
  const base = [key, `${sp}-${f}-${g}`, `${f}-${g}`, `${sp}-${g}`, g].map((x) => x.toLowerCase());
  return (who.age !== undefined && who.age < CHILD_AGE) ? [...base.map((x) => `${x}-child`), ...base] : base;
}

/** 초상화 주소: 맞는 그림 파일이 있으면 그 파일, 없으면 픽셀 그림 */
export function portraitURL(who: Who): string {
  for (const n of portraitNames(who)) if (FILES[n]) return FILES[n];
  return faceURL(who);
}

/** 그림 파일을 쓰고 있는가 (픽셀 그림이 아닌가). 화면에서 확대 방식을 다르게 할 때 쓴다 */
export function hasPortraitFile(who: Who): boolean {
  return portraitNames(who).some((n) => FILES[n]);
}
