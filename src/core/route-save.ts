import { SEAS } from '../shared/data/seas';
import { offshoreDays, portOf, seaOfPort } from '../data/navigation';
import { MAX_PROVISIONS, UNNAMED_ISLET, type Passage } from './passage';
import { VOYAGE_PREFIX } from './voyage';
import type { Life5 } from './types';

const routes: readonly string[] = ['calm', 'dream', 'wild', 'drift'];
const resupplyIds = ['islet_resupply', 'islet_rainwater'];

/** 구판의 즉시 정박과 현행 날씨 항해를 같은 진행 상태로 읽는다. */
export function normalizeRouteSave(s: Life5): boolean {
  const h = s.hero;
  h.provisions ??= 0;
  if (!Number.isInteger(h.provisions) || h.provisions < 0 || h.provisions > MAX_PROVISIONS) return false;
  if (h.island === '조') h.island = '조우';
  if (s.flags.includes('at:조')) s.flags = [...new Set(s.flags.map(f => f === 'at:조' ? 'at:조우' : f))];
  let pending = s.pending?.kind === 'door' ? s.pending : null;
  if (pending && typeof pending.turning === 'string' && pending.turning.startsWith(VOYAGE_PREFIX) && s.age > 18) {
    pending = { ...pending, turning: pending.turning.replaceAll('스릴러 바크', '플로리안 트라이앵글') };
    s.pending = pending;
  }
  const raw: unknown = s.passage;
  if (raw == null) return h.island !== UNNAMED_ISLET && !(pending && resupplyIds.includes(pending.turning));
  if (typeof raw !== 'object') return false;
  if ('destination' in raw) {
    const { destination } = raw;
    if (h.island !== UNNAMED_ISLET || typeof destination !== 'string' || !seaOfPort(destination) ||
        !('route' in raw) || typeof raw.route !== 'string' || ![...routes, 'transfer'].includes(raw.route)) return false;
    // 옛 정박에는 출발지가 없다. 보급 가능한 같은 해역 항구 중 기록에서 가장 최근에 떠난 곳을 복원한다.
    const ports = SEAS.find(sea => sea.id === h.sea)?.ports ?? [];
    const origins = ports.filter(port => offshoreDays(port, portOf(destination)));
    let from = origins[0] ?? ports[0];
    for (const line of [...s.log].reverse()) {
      if (!line || typeof line.text !== 'string') continue;
      const recorded = origins.find(port => line.island === port || line.text.includes(port) &&
        (line.text.includes('닻을 내렸다') || line.text.includes('항구를 떠나')));
      if (recorded) { from = recorded; break; }
    }
    if (!from) return false;
    s.passage = { to: portOf(destination), from, route: raw.route === 'transfer' ? 'drift' : raw.route as Passage['route'],
      ...(raw.route === 'transfer' ? { order: true } : {}), stopover: 'islet_resupply', partsLeft: 0, partsSpent: 1, maxParts: 1 };
  }
  const p = s.passage!;
  if (typeof p.to !== 'string' || !seaOfPort(p.to) || !routes.includes(p.route) ||
      !Number.isInteger(p.partsLeft) || p.partsLeft < 0 || !Number.isInteger(p.partsSpent) || p.partsSpent < 0 ||
      !Number.isInteger(p.maxParts) || p.maxParts < 1 || p.partsSpent > p.maxParts) return false;
  const ashore = p.stopover !== undefined && resupplyIds.includes(p.stopover);
  if (p.stopover !== undefined && p.stopover !== 'planned' && !ashore) return false;
  if (ashore !== (h.island === UNNAMED_ISLET) || (ashore ? typeof p.from !== 'string' || !seaOfPort(p.from) : p.from !== undefined)) return false;
  return !pending || !resupplyIds.includes(pending.turning) || pending.turning === p.stopover;
}
