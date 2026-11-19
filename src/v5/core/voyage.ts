// 항로 고르기 (통합 기획 7.4 · 7.5)
// 해적 · 혁명군 · 현상금 사냥꾼 · 칠무해는 섬을 옮길 때가 되면(year.ts voyage) 다음 멈춤에 세 갈래 항로 중 하나를 고른다.
// 고르는 장면은 그때그때 만들어지는 전환점이다: id에 후보 섬이 담겨 있어 저장 · 불러오기 뒤에도 다시 지을 수 있다.
import { josa } from '../../core/josa';
import { chance, pick, rngOf, weighted, type Rng } from '../../core/rng';
import { V } from '../data/balance';
import { DEFERRED_ROUTE } from '../data/turnings/route-stories';
import { DREAMS } from '../data/dreams';
import { DREAM_ISLANDS, ROUTE, dangerOf, offshoreDays } from '../data/voyage';
import { logLine } from './log';
import { connectedPorts, contentClass, destinationAt, portOf, seaOfPort } from '../data/navigation';
import type { DreamId, Door, Fx, Life5, SeaId, Turning } from './types';

import { AMAZON_ROADS, trainingLanding } from '../data/training-routes';

export type Route = 'calm' | 'dream' | 'wild';
export const VOYAGE_PREFIX = 'voyage:';
export const UNNAMED_ISLET = '이름 없는 섬';
type PassageRoute = NonNullable<Life5['passage']>['route'];
type Choices = { calm?: string; dream?: string; wild?: string; coastal?: string };

/** 지금 바다에서 갈 수 있는 섬 가운데 세 갈래의 후보. 고를 섬이 둘도 안 되면 null */
export function voyageChoices(s: Life5, r: Rng, departureAge = s.age): Choices | null {
  if (s.passage) return null;
  const ports = connectedPorts(s.hero.island, s.hero.sea, s.flags, departureAge);
  if (!ports.length) return null;
  const fresh = (p: string) => (s.flags.includes(`at:${p}`) ? 1 : V.voyage.fresh);
  const top = Math.max(...ports.map(dangerOf));
  const wild = top >= 3 ? weighted(r, ports.filter((p) => dangerOf(p) === top), fresh) ?? undefined : undefined;
  let rest = ports.filter((p) => p !== wild);
  const low = Math.min(...rest.map(dangerOf));
  const calm = weighted(r, rest.filter((p) => dangerOf(p) === low), fresh) ?? undefined;
  rest = rest.filter((p) => p !== calm);
  const tagged = s.dream ? rest.filter((p) => DREAM_ISLANDS[s.dream!.id].includes(p)) : [];
  const dream = rest.length ? pick(r, tagged.length ? tagged : rest) : undefined;
  const coastal = wild ? undefined : rest.find(port => port !== dream);
  return { calm, dream, wild, coastal };
}

/** 후보를 담은 전환점 id: voyage:<나이>:<꿈 id 또는 ->:<잔잔>|<꿈>|<험함> (빈칸이면 그 갈래 없음). 나이가 들어 있어 해마다 다른 장면이다 */
export function voyageId(s: Life5, c: Choices): string {
  const d = s.dream && c.dream && DREAM_ISLANDS[s.dream.id].includes(c.dream) ? s.dream.id : '-';
  return `${VOYAGE_PREFIX}${s.age}:${d}:${c.calm ?? ''}|${c.dream ?? ''}|${c.wild ?? ''}|${c.coastal ?? ''}:${portOf(s.hero.island)}`;
}

const sail = (island: string, route: Route): Fx => ({ op: 'sail', island, route });

/** id로 항로 고르기 전환점을 짓는다. 문은 잔잔 · 꿈(또는 소문) · 험함 순서 */
export function buildVoyage(id: string): Turning | undefined {
  if (!id.startsWith(VOYAGE_PREFIX)) return undefined;
  const [, dreamId, rest = '', from = ''] = id.slice(VOYAGE_PREFIX.length).split(':');
  const [calm, dream, wild, coastal] = rest.split('|');
  const doors: Door[] = [];
  if (calm) doors.push({ label: josa(`잔잔한 뱃길로 ${calm}에 간다`), hint: '쉬어 가며 숨을 고른다', fx: [sail(calm, 'calm')] });
  if (dream) {
    const d = dreamId !== '-' ? DREAMS[dreamId as DreamId] : null;
    doors.push(d
      ? { label: josa(`${dream}(으)로 뱃머리를 돌린다`), hint: josa(`${d.name}에 한 걸음 가까워질 것 같은 소문이 있다`), fx: [sail(dream, 'dream')] }
      : { label: josa(`소문을 따라 ${dream}(으)로 간다`), hint: '술집에서 들은 이야기가 자꾸 마음에 걸린다', fx: [sail(dream, 'dream')] });
  }
  if (wild) doors.push({ label: josa(`험한 바다를 건너 ${wild}(으)로 간다`), hint: '위험하지만 이름을 떨칠 기회가 있다', danger: true, fx: [sail(wild, 'wild')] });
  if (coastal) doors.push({ label: josa(`뱃길을 따라 ${coastal}(으)로 간다`), hint: '갑판에서 숨을 고른다', fx: [sail(coastal, 'calm')] });
  const contentLabel = { major: '주요 이야기', regular: '지역 이야기', encounter: '인연·탐험', exploration: '탐험 거점' };
  for (const door of doors) {
    const destination = door.fx.find((fx) => fx.op === 'sail');
    if (destination?.op !== 'sail') continue;
    door.hint += ` · ${contentLabel[contentClass(destination.island)]}`;
    const days = offshoreDays(from, destination.island);
    if (days) door.hint += ` · 예상 ${days}일, 도중 보급 가능`;
  }
  doors.push({ label: '이곳에 더 머문다', hint: '준비와 탐색을 이어 간다', fx: [] });
  return {
    id, kind: 'door', when: [], weight: 0, repeat: { years: 0 }, speaker: 'hero',
    title: '다음 항로', body: '{island}에서의 날들이 끝나 간다. 해도를 펼치자 갈 만한 섬이 몇 보인다. 어디로 뱃머리를 돌릴까.',
    doors,
  };
}

/** 고른 섬으로 간다 */
export function sailTo(s: Life5, island: string, route: PassageRoute): void {
  if (s.passage) return;
  island = destinationAt(island, s.age);
  const days = offshoreDays(portOf(s.hero.island), island);
  if (days && days >= V.voyage.longDays) {
    if (s.hero.provisions > 0) {
      s.hero.provisions--;
      s.hero.hp = Math.min(V.hp.max, s.hero.hp + V.voyage.rationHp);
      logLine(s, '갑판에서 항해 식량 한 몫을 나눠 먹으며 기운을 냈다.', 'light');
    }
    if (chance(rngOf(s.rng), V.voyage.stopoverP)) {
      s.passage = { destination: island, route };
      moveTo(s, UNNAMED_ISLET, s.hero.sea);
      logLine(s, josa(`${island}(으)로 가던 길에 해도에 이름이 없는 섬을 발견했다. 빈 물통을 챙겨 닻을 내렸다.`), 'heavy');
      return;
    }
  }
  arrive(s, island, route);
}

export function resumeVoyage(s: Life5, stores: number): void {
  if (!s.passage) return;
  const { destination, route } = s.passage;
  delete s.passage;
  s.hero.provisions = Math.min(V.voyage.storesMax, s.hero.provisions + stores);
  arrive(s, destination, route);
}

/** 출항 또는 이야기로 항구를 떠나면, 그 방문에서 미뤘던 준비를 다시 제안할 수 있다. */
export function moveTo(s: Life5, island: string, sea: SeaId): void {
  if (portOf(s.hero.island) !== portOf(island) && s.flags.includes(DEFERRED_ROUTE)) {
    s.flags = s.flags.filter(flag => flag !== DEFERRED_ROUTE);
  }
  s.hero.island = island === '아마존 릴리' && s.hero.gender === 'm' ? AMAZON_ROADS : island;
  if (s.hero.island === AMAZON_ROADS) logLine(s, '쿠자 경비선이 여인섬의 상륙 금지선을 가리켰다. 배는 섬 밖의 정박지에 머문다.', 'light');
  const field = trainingLanding(island, s.flags);
  if (field && !s.queue.includes(field)) s.queue.unshift(field);
  s.hero.sea = sea;
}

function arrive(s: Life5, island: string, route: PassageRoute): void {
  const h = s.hero;
  const first = !s.flags.includes(`at:${island}`);
  moveTo(s, island, seaOfPort(island) ?? h.sea);
  if (first) s.flags.push(`at:${island}`);
  if (route === 'transfer') {
    logLine(s, josa(`명령에 따라 ${island} 근해에 도착해 본부에 보고했다.`), 'light');
    return;
  }
  logLine(s, josa(first ? `${h.island}에 처음 닻을 내렸다.` : `다시 ${h.island}(으)로 뱃머리를 돌렸다.`), 'light');
  if (route === 'drift') return;
  if (route === 'calm') h.hp = Math.min(V.hp.max, h.hp + ROUTE.calm.hp);
  else if (route === 'dream') h.base.wil += ROUTE.dream.wil;
  else {
    h.hp = Math.max(1, h.hp + ROUTE.wild.hp);
    h.fame += ROUTE.wild.fame;
    s.hardship += ROUTE.wild.hardship;
    logLine(s, '거친 파도와 낯선 적을 헤치고 겨우 닿았다. 그 뱃길을 건넜다는 소문이 먼저 퍼졌다.', 'light');
  }
}
