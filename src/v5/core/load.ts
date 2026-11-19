import { AMAZON_ROADS } from '../data/training-routes';
// 저장 읽기: 저장해 둔 JSON을 인생 · 도감으로 되살린다. 옛 저장에 빠진 칸은 기본값으로 채운다.
import { V } from '../data/balance';
import { seaOfPort } from '../data/navigation';
import { VALUE_IDS } from '../data/values';
import { mainBranch } from './year';
import { emptyMeta5, type Meta5 } from './meta';
import { invariants5 } from './reduce';
import { emptyLife } from './state';
import { buildVoyage, UNNAMED_ISLET, VOYAGE_PREFIX } from './voyage';
import { resolveDoors } from './turning';
import { TURNING_BY_ID } from '../data/turnings';
import { fillText } from './fx';
import { updateRival } from './rival';
import type { Life5 } from './types';

type Obj = Record<string, unknown>;

const OLD_RIVAL_CHOICES = ['life_rival_invitation', 'life_rival_date', 'life_rival_promise'];

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

/** 인생의 맨 위 칸 가운데 목록이어야 하는 것과 객체여야 하는 것 */
const LIFE_ARRAYS = ['log', 'timeline', 'people', 'flags', 'queue', 'tried', 'known', 'closed', 'recentLines'] as const;
const LIFE_OBJECTS = ['hero', 'growth', 'values', 'stats', 'seenCount'] as const;

/**
 * 떠 있는 일의 모양이 맞는가: null이거나, 종류(door · fight · battle · ending)에 따라 화면이 읽는 칸을 갖춘 객체.
 * door: doors 목록과 글자 title · body / fight · battle: foe 객체 / battle: battle.events · battle.units 목록 / ending: 글자 cause
 */
function pendingOk(p: unknown): boolean {
  if (p === null) return true;
  if (!isObj(p)) return false;
  switch (p.kind) {
    case 'door': return Array.isArray(p.doors) && typeof p.title === 'string' && typeof p.body === 'string';
    case 'fight': return isObj(p.foe);
    case 'battle': return isObj(p.foe) && isObj(p.battle) && Array.isArray(p.battle.events) && Array.isArray(p.battle.units);
    case 'ending': return typeof p.cause === 'string';
    default: return false;
  }
}

/** got에 빠진(undefined인) 칸을 def의 값으로 채운 새 객체 */
function withDefaults(got: Obj, def: object): Obj {
  const out: Obj = { ...got };
  for (const [k, v] of Object.entries(def)) if (out[k] === undefined) out[k] = v;
  return out;
}

/**
 * 저장된 인생을 읽는다. schema가 5가 아니거나 객체가 아니면 null.
 * 빠진 칸은 emptyLife(seed)의 값으로 채운다(맨 위 칸과 stats · hero · growth의 칸). 채운 뒤에도 불변 조건을 어기거나\n * 떠 있는 일의 모양이 틀리면 null.
 */
export function normalizeLife5(x: unknown): Life5 | null {
  if (!isObj(x) || x.schema !== 5) return null;
  const seed = isObj(x.rng) && typeof x.rng.seed === 'number' ? x.rng.seed : 0;
  const def = emptyLife(seed);
  // 처지가 된 나이를 모르는 옛 저장은 지금부터 센다
  const s = withDefaults(x, { ...def, standingSince: typeof x.age === 'number' ? x.age : def.standingSince });
  // 큰 칸의 모양이 틀리면(목록이어야 할 곳에 객체가 있는 등) 고쳐 읽지 않는다
  if (LIFE_ARRAYS.some((k) => !Array.isArray(s[k])) || LIFE_OBJECTS.some((k) => !isObj(s[k]))) return null;
  if (!pendingOk(s.pending)) return null;      // 손으로 고친 파일의 깨진 창이 화면을 무너뜨리지 않게
  // 태어난 형편을 모르는 옛 저장은 지금의 형편으로 (몰락을 세지 않는다)
  if (isObj(s.hero) && s.hero.bornWealth === undefined) s.hero = { ...s.hero, bornWealth: s.hero.wealth };
  for (const k of ['stats', 'hero', 'growth'] as const) s[k] = withDefaults(s[k] as Obj, def[k]);
  const life = s as unknown as Life5;
  if (life.hero.gender === 'm' && life.hero.island === '아마존 릴리' && !life.pending && !life.passage) life.hero.island = AMAZON_ROADS;
  if ((life.hero.island === UNNAMED_ISLET) !== !!life.passage) return null;
  if (life.passage && (!seaOfPort(life.passage.destination) ||
    !['calm', 'dream', 'wild', 'drift', 'transfer'].includes(life.passage.route))) return null;
  if (!Number.isInteger(life.hero.provisions) || life.hero.provisions < 0 || life.hero.provisions > V.voyage.storesMax) return null;
  const p = life.pending;
  if (p?.kind === 'door' && typeof p.turning === 'string' && p.turning.startsWith(VOYAGE_PREFIX)) {
    const id = life.age > 18 ? p.turning.replaceAll('스릴러 바크', '플로리안 트라이앵글') : p.turning;
    const updated = buildVoyage(id)!;
    life.pending = { ...p, turning: updated.id, doors: resolveDoors(life, updated) };
  }
  if (life.hero.island === '조') life.hero.island = '조우';
  life.flags = life.flags.map((f) => f === 'at:조' ? 'at:조우' : f);
  // 4단계에서 헌신(devotion)이 빠지고 탐욕(greed)이 들어왔다: 옛 점수는 버린다
  if (isObj(life.values)) delete (life.values as Record<string, unknown>).devotion;
  // 선호도가 없는 옛 저장: 지금까지 간 만큼(단계와 숙련)을 선호도로 삼고, 지금의 길은 알린 것으로 친다
  const g = life.growth;
  if (isObj(g) && isObj(g.pref) && isObj(g.tier) && isObj(g.mastery) && Object.values(g.pref).every((v) => !v)) {
    for (const b of Object.keys(g.pref) as (keyof typeof g.pref)[]) g.pref[b] = (g.tier[b] ?? 0) * V.growth.tierUp + (g.mastery[b] ?? 0);
    if (life.age >= V.growth.pref.pathAge) g.path = mainBranch(life);
  }
  try {
    // 예전 연애 질문을 열어 둔 저장은 같은 시점에서 이어 간다. 이미 내린 관계 결정은 보존한다.
    if (life.pending?.kind === 'door' && OLD_RIVAL_CHOICES.includes(life.pending.turning)) life.pending = null;
    life.queue = life.queue.filter(id => !OLD_RIVAL_CHOICES.includes(id));
    // 저장 당시 이미 열려 있던 선택지도 새 본문을 쓴다. 그때 열려 있던 문의 자격은 그대로 둔다.
    const open = life.pending;
    if (open?.kind === 'door') {
      const t = TURNING_BY_ID[open.turning];
      const reunion = t?.id === 'life_rival_reunion';
      if (t && (t.doors.length === open.doors.length || (reunion && open.doors.length === 4))) {
        const oldReunion = reunion && !life.rival;
        if (oldReunion) updateRival(life);
        const doors = resolveDoors(life, t).map((current, i) => {
          const previous = open.doors[i];
          if (!previous || oldReunion) return current;
          return { ...previous, label: current.label, hint: current.hint };
        });
        life.pending = { ...open, title: fillText(life, t.title), body: fillText(life, t.body), doors };
      }
    }
    return invariants5(life, true).length === 0 ? life : null;
  } catch {
    return null;                               // 칸의 모양이 깨져 확인조차 못 하면 읽지 않는다
  }
}

/** 저장된 도감을 읽는다. 못 읽으면 빈 도감, 빠지거나 모양이 틀린 칸은 빈 값으로 채운다. */
export function normalizeMeta5(x: unknown): Meta5 {
  const def = emptyMeta5();
  if (!isObj(x) || x.schema !== 5) return def;
  const m = withDefaults(x, def);
  if (!isObj(m.doors)) m.doors = def.doors;
  // 없어진 가치관(헌신)은 도감에서 지운다
  else for (const [k, v] of Object.entries(m.doors)) if (Array.isArray(v)) (m.doors as Obj)[k] = v.filter((x) => VALUE_IDS.includes(x as never));
  for (const k of ['fruits', 'people', 'hall'] as const) if (!Array.isArray(m[k])) m[k] = def[k];
  if (typeof m.lives !== 'number' || !Number.isFinite(m.lives)) m.lives = def.lives;
  return m as unknown as Meta5;
}
