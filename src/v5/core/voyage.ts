// 항로 고르기 (통합 기획 7.4 · 7.5)
// 해적 · 혁명군 · 현상금 사냥꾼 · 칠무해는 섬을 옮길 때가 되면(year.ts voyage) 다음 멈춤에 세 갈래 항로 중 하나를 고른다.
// 고르는 장면은 그때그때 만들어지는 전환점이다: id에 후보 섬이 담겨 있어 저장 · 불러오기 뒤에도 다시 지을 수 있다.
import { josa } from '../../core/josa';
import { pick, weighted, type Rng } from '../../core/rng';
import { SEA_BY_ID } from '../../data/seas';
import { V } from '../data/balance';
import { DREAMS } from '../data/dreams';
import { DREAM_ISLANDS, dangerOf } from '../data/voyage';
import { depart } from './passage';
import type { DreamId, Door, Fx, Life5, Turning } from './types';

export type Route = 'calm' | 'dream' | 'wild';
export const VOYAGE_PREFIX = 'voyage:';

/** 지금 바다에서 갈 수 있는 섬 가운데 세 갈래의 후보. 고를 섬이 둘도 안 되면 null */
export function voyageChoices(s: Life5, r: Rng): { calm?: string; dream?: string; wild?: string } | null {
  const ports = SEA_BY_ID[s.hero.sea].ports.filter((p) => p !== s.hero.island);
  if (ports.length < 2) return null;
  const fresh = (p: string) => (s.flags.includes(`at:${p}`) ? 1 : V.voyage.fresh);
  const top = Math.max(...ports.map(dangerOf));
  const wild = top >= 3 ? weighted(r, ports.filter((p) => dangerOf(p) === top), fresh) ?? undefined : undefined;
  let rest = ports.filter((p) => p !== wild);
  const low = Math.min(...rest.map(dangerOf));
  const calm = weighted(r, rest.filter((p) => dangerOf(p) === low), fresh) ?? undefined;
  rest = rest.filter((p) => p !== calm);
  const tagged = s.dream ? rest.filter((p) => DREAM_ISLANDS[s.dream!.id].includes(p)) : [];
  const dream = rest.length ? pick(r, tagged.length ? tagged : rest) : undefined;
  return [calm, dream, wild].filter(Boolean).length >= 2 ? { calm, dream, wild } : null;
}

/** 후보를 담은 전환점 id: voyage:<나이>:<꿈 id 또는 ->:<잔잔>|<꿈>|<험함> (빈칸이면 그 갈래 없음). 나이가 들어 있어 해마다 다른 장면이다 */
export function voyageId(s: Life5, c: { calm?: string; dream?: string; wild?: string }): string {
  const d = s.dream && c.dream && DREAM_ISLANDS[s.dream.id].includes(c.dream) ? s.dream.id : '-';
  return `${VOYAGE_PREFIX}${s.age}:${d}:${c.calm ?? ''}|${c.dream ?? ''}|${c.wild ?? ''}`;
}

const sail = (island: string, route: Route): Fx => ({ op: 'sail', island, route });

/** id로 항로 고르기 전환점을 짓는다. 문은 잔잔 · 꿈(또는 소문) · 험함 순서 */
export function buildVoyage(id: string): Turning | undefined {
  if (!id.startsWith(VOYAGE_PREFIX)) return undefined;
  const [, dreamId, rest = ''] = id.slice(VOYAGE_PREFIX.length).split(':');
  const [calm, dream, wild] = rest.split('|');
  const doors: Door[] = [];
  if (calm) doors.push({ label: josa(`잔잔한 뱃길로 ${calm}에 간다`), hint: '쉬어 가며 숨을 고른다', fx: [sail(calm, 'calm')] });
  if (dream) {
    const d = dreamId !== '-' ? DREAMS[dreamId as DreamId] : null;
    doors.push(d
      ? { label: josa(`${dream}(으)로 뱃머리를 돌린다`), hint: josa(`${d.name}에 한 걸음 가까워질 것 같은 소문이 있다`), fx: [sail(dream, 'dream')] }
      : { label: josa(`소문을 따라 ${dream}(으)로 간다`), hint: '술집에서 들은 이야기가 자꾸 마음에 걸린다', fx: [sail(dream, 'dream')] });
  }
  if (wild) doors.push({ label: josa(`험한 바다를 건너 ${wild}(으)로 간다`), hint: '위험하지만 이름을 떨칠 기회가 있다', danger: true, fx: [sail(wild, 'wild')] });
  return {
    id, kind: 'door', when: [], weight: 0, repeat: { years: 0 }, speaker: 'hero',
    title: '다음 항로', body: '{island}에서의 날들이 끝나 간다. 해도를 펼치자 갈 만한 섬이 몇 보인다. 어디로 뱃머리를 돌릴까.',
    doors,
  };
}

/** 고른 섬으로 출항한다. 섬은 바다를 건너 닿을 때 바뀐다 (core/passage.ts) */
export function sailTo(s: Life5, island: string, route: Route): void {
  depart(s, island, route);
}
