// 해역, 임무, 보스, 적 만들기.
import { B } from '../../data/balance';
import { BOSSES, BOSS_BY_ID, statsAround } from '../../data/bosses';
import { ENEMY_NAMES, MISSIONS, MISSION_BY_ID } from '../../data/missions';
import { SEA_BY_ID } from '../../data/seas';
import { SKILLS } from '../../data/skills';
import { FRUITS } from '../../data/fruits';
import { ARCHETYPES } from '../../data/enemies';
import { EPITHETS } from '../../data/epithets';
import type { SideFoe } from '../../data/sideStories';
import { PORT_FOES, type PortFoe } from '../../data/portFoes';
import { crewUnit } from '../combat/units';
import { faceKeyOf } from '../people';
import { int, pick, rngOf, shuffle, type Rng } from '../rng';
import type { BranchId, EnemySpec, LifeState, MissionProgress, SeaId, Stage } from '../types';
import { absMonth, findPerson, log } from '../util';

export const sea = (s: LifeState) => SEA_BY_ID[s.world.seaId];

function routeKey(s: LifeState): 'pirate' | 'marine' {
  return s.hero.route === 'marine' ? 'marine' : 'pirate';
}

export function bossFor(seaId: SeaId, route: 'pirate' | 'marine') {
  return BOSSES.find((b) => b.sea.includes(seaId) && b.route === route)
    ?? BOSSES.find((b) => b.sea.includes(seaId) && b.route === 'any')
    ?? BOSSES.find((b) => b.sea.includes(seaId))!;
}

function drawMission(s: LifeState, exclude: string[]): MissionProgress | null {
  const r = rngOf(s.rng);
  const rk = routeKey(s);
  const pool = MISSIONS.filter((m) =>
    (m.route === rk || m.route === 'any') && (m.stages === 'any' || m.stages.includes(s.world.stage)) && !exclude.includes(m.id));
  if (!pool.length) return null;
  const m = pick(r, pool);
  return { id: m.id, state: 'open', step: 0, monthsInStep: 0, port: pick(r, sea(s).ports) };
}

/** 해역에 들어선다. 임무 3개를 뽑고 보스를 정한다 */
export function enterSea(s: LifeState, seaId: SeaId) {
  s.world.seaId = seaId;
  s.world.stage = SEA_BY_ID[seaId].stage;
  s.stats.maxStage = Math.max(s.stats.maxStage, s.world.stage);
  s.world.missions = [];
  s.world.refillAt = null;
  if (s.hero.route !== 'none') {
    for (let i = 0; i < B.world.missionsPerSea; i++) {
      const mp = drawMission(s, s.world.missions.map((x) => x.id));
      if (mp) s.world.missions.push(mp);
    }
    const b = bossFor(seaId, routeKey(s));
    s.world.boss = { id: b.id, state: 'hidden', attempts: 0, nextAskAt: 0 };
  }
}

export function missionDoneCount(s: LifeState) {
  return s.world.missions.filter((m) => m.state === 'done').length;
}

/** 실패한 임무를 모두 새 임무로 바꾼다 (새로 뽑을 게 없으면 같은 임무를 다시 연다) */
export function refillFailed(s: LifeState) {
  for (let idx = s.world.missions.findIndex((m) => m.state === 'failed'); idx >= 0; idx = s.world.missions.findIndex((m) => m.state === 'failed')) {
    const mp = drawMission(s, s.world.missions.map((x) => x.id));
    s.world.missions[idx] = mp ?? { ...s.world.missions[idx], state: 'open', step: 0, monthsInStep: 0 };
  }
}

export function missionTitle(mp: MissionProgress) {
  return MISSION_BY_ID[mp.id].title.replace('{port}', mp.port);
}

/** 보스가 드러나야 하는가 */
export function maybeRevealBoss(s: LifeState) {
  if (s.world.boss.state === 'hidden' && missionDoneCount(s) >= B.world.missionsPerSea) {
    s.world.boss.state = 'revealed';
    s.world.boss.nextAskAt = absMonth(s);
    const b = BOSS_BY_ID[s.world.boss.id];
    log(s, `${sea(s).name}의 벽, ${b.title} ${b.name}이(가) 모습을 드러냈다.`, 'world');
    if (b.fruitClass === 'logia' && !s.growth.gates.includes('haki.armament.awaken')) {
      log(s, '자연계 능력자라는 소문이다. 무장색, 해루석 무기 · 탄환 · 그물, 관통 기술이 있어야 몸에 닿는다고 한다.', 'danger');
      if (!s.choice.flags.includes('need_armament')) s.choice.flags.push('need_armament');
    }
  }
}

// ---------------------------------------------------------------- 적 만들기

const powerTier = (p: number) => (p < 20 ? 1 : p < 38 ? 2 : p < 65 ? 3 : p < 110 ? 4 : 5);

function genSkills(r: Rng, p: number, armament: number): string[] {
  const branch = pick(r, ['martial.fist', 'martial.sword', 'martial.gun'] as BranchId[]);
  const tier = powerTier(p);
  const list = SKILLS.filter((k) => k.branch === branch && k.tier <= tier).map((k) => k.id);
  if (armament >= 1) list.push('arm_strike');
  if (armament >= 2) list.push('arm_hard');
  return shuffle(r, list).slice(0, Math.min(6, 2 + tier));
}

/** 「이명」 이름. 이명은 한 인생 안에서 겹치지 않는다. 200개를 다 쓰면 처음부터 다시 */
function genName(s: LifeState, r: Rng, gender: 'm' | 'f') {
  const used = (s.world.usedEpithets ??= []);
  let pool = EPITHETS.filter((x) => !used.includes(x));
  if (!pool.length) { used.length = 0; pool = EPITHETS; }
  const ep = pick(r, pool);
  used.push(ep);
  return `「${ep}」 ${pick(r, gender === 'f' ? ENEMY_NAMES.firstF : ENEMY_NAMES.first)}`;
}

/** 지금 해역의 적. kind: grunt 잡졸, elite 우두머리, officer 간부, captain 간부를 거느린 우두머리 */
export function genEnemy(s: LifeState, kind: 'grunt' | 'elite' | 'officer' | 'captain', r: Rng = rngOf(s.rng), archetype?: string): EnemySpec {
  const ar = archetype ? ARCHETYPES[archetype] : undefined;
  const sx = sea(s);
  const [lo, hi] = sx.enemyPower;
  const mult = kind === 'grunt' ? 0.7 : kind === 'officer' ? 0.85 : kind === 'captain' ? 1.05 : 1.0;
  const base = kind === 'grunt' ? lo + (hi - lo) * r() * 0.8 : lo + (hi - lo) * (0.55 + r() * 0.45);
  const p = Math.max(5, Math.round(base * mult));
  const gender: 'm' | 'f' = r() < 0.25 ? 'f' : 'm';
  const heroMarine = s.hero.route === 'marine';
  const opposite = heroMarine ? 'pirate' : (r() < 0.6 ? 'marine' : 'pirate');
  const faction: EnemySpec['faction'] = !ar || ar.faction === 'opposite' ? opposite : ar.faction;
  const fruitRoll = r();
  const hasFruit = kind !== 'grunt' && (ar?.fruitAllowed ?? true) && fruitRoll < (kind === 'officer' ? 0.15 : 0.3);
  let fruitClass: EnemySpec['fruitClass'] = null;
  let skills = ar?.skills ? [...ar.skills] : genSkills(r, p, sx.armament);
  if (hasFruit) {
    const pool = FRUITS.filter((f) => f.grade <= Math.min(5, s.world.stage + 1));
    const f = pick(r, pool);
    fruitClass = f.cls;
    const n = Math.min(f.skills.length, 1 + powerTier(p) / 2 | 0);
    skills = [...Array.from({ length: n }, (_, i) => `fruit:${f.id}:${i}`), ...skills].slice(0, 6);
  }
  const titles = faction === 'marine' ? ENEMY_NAMES.marineTitle : heroMarine ? ENEMY_NAMES.pirateTitle : ENEMY_NAMES.villainTitle;
  const e: EnemySpec = {
    id: `gen_${s.rng.cursor}_${kind}`, name: ar?.names ? pick(r, ar.names) : genName(s, r, gender), canon: null,
    title: ar ? ar.title : kind === 'grunt' ? (faction === 'marine' ? '해군 병사' : '무법자') : kind === 'officer' ? '간부' : pick(r, titles),
    base: statsAround(p, ar?.bias ?? { str: 0.8 + r() * 0.4, spd: 0.8 + r() * 0.4, vit: 0.8 + r() * 0.4 }),
    fruitClass, armament: sx.armament as EnemySpec['armament'], observation: Math.max(0, sx.armament - 1) as EnemySpec['observation'],
    skills, tactic: pick(r, ['offense', 'defense', 'counter', 'endurance'] as const), officers: [],
    faction, species: ar?.species ?? (r() < 0.15 ? 'fishman' : 'human'), gender, age: int(r, 20, 50),
    form: ar?.form,
  };
  if (ar?.form) e.armament = 0;
  if (kind === 'captain' && !ar?.noOfficers) {
    const n = int(r, 1, 2);
    // 간부는 우두머리와 같은 편이다
    for (let i = 0; i < n; i++) { const o = genEnemy(s, 'officer', r); o.faction = e.faction; e.officers.push(o); }
  }
  return e;
}

/** 원작 항구의 임무 강적이면 무작위 이름 대신 그 항구의 원작 인물로 바꾼다 (간부도) */
export function canonizeFoe(s: LifeState, e: EnemySpec, port: string): EnemySpec {
  const list = PORT_FOES[port];
  if (!list || !list.length || e.form === 'seaking') return e;
  const r = rngOf(s.rng);
  const used = (s.world.usedPortFoes ??= []);
  const want = e.faction === 'marine' ? 'marine' : e.faction === 'pirate' ? 'pirate' : 'civil';
  const fresh = list.filter((x) => !used.includes(x.name));
  const pool = fresh.length ? fresh : list;
  const pickOne = (exclude: string[]) => {
    const cand = pool.filter((x) => !exclude.includes(x.name));
    const same = cand.filter((x) => x.f === want);
    return (same.length ? pick(r, same) : cand.length ? pick(r, cand) : null);
  };
  const lead = pickOne([]);
  if (!lead) return e;
  used.push(lead.name);
  const apply = (u: EnemySpec, f: PortFoe) => {
    u.name = f.name; u.title = f.title; u.canon = f.canon ?? null; u.faceKey = f.canon ?? `port:${f.name}`;
    if (f.species) u.species = f.species;
    if (f.gender) u.gender = f.gender;
  };
  apply(e, lead);
  const taken = [lead.name];
  for (const o of e.officers) {
    const f = pickOne(taken);
    if (!f) break;
    taken.push(f.name);
    apply(o, f);
  }
  return e;
}

/** 곁가지 이야기의 이름 있는 적. 힘은 지금 해역 강적의 배율로 정한다 */
export function sideEnemy(s: LifeState, storyId: string, step: number, foe: SideFoe): EnemySpec {
  const r = rngOf(s.rng);
  const [lo, hi] = sea(s).enemyPower;
  const base = lo + (hi - lo) * 0.8;
  const mk = (name: string, mult: number, skills: string[] | undefined, bias: SideFoe['bias'] | undefined, fruitId: string | undefined, idx: number): EnemySpec => {
    const p = Math.max(5, Math.round(base * mult));
    let sk = skills ? [...skills] : genSkills(r, p, sea(s).armament);
    const f = fruitId ? FRUITS.find((x) => x.id === fruitId) : undefined;
    if (f) sk = [...f.skills.slice(0, Math.min(f.skills.length, 3)).map((_, i) => `fruit:${f.id}:${i}`), ...sk].slice(0, 6);
    return {
      id: `side_${storyId}_${step}_${idx}`, name, canon: idx === 0 ? foe.canon ?? null : null, title: idx === 0 ? foe.title : '간부',
      base: statsAround(p, bias ?? {}), fruitClass: f?.cls ?? null,
      armament: sea(s).armament as EnemySpec['armament'], observation: Math.max(0, sea(s).armament - 1) as EnemySpec['observation'],
      skills: sk, tactic: idx === 0 ? 'offense' : 'defense', officers: [],
      faction: foe.faction, species: 'human', gender: 'm', age: 35,
    };
  };
  const e = mk(foe.name, foe.mult, foe.skills, foe.bias, foe.fruit, 0);
  e.officers = (foe.officers ?? []).map((o, i) => mk(o.name, o.mult, o.skills, undefined, undefined, i + 1));
  return e;
}

/** 동료였던 사람과 싸울 때의 전투 값 (배신자) */
export function crewAsEnemy(s: LifeState, id: string): EnemySpec {
  const p = s.people.find((x) => x.id === id);
  const power = p?.crew?.power ?? p?.power ?? 20;
  const u = p?.crew ? crewUnit(p, s.world.stage) : null;
  const skills = u?.skills.map((k) => k.id) ?? ['fist_jab'];
  return {
    id: `crew_${id}`, name: p?.name ?? '배신자', canon: null, title: '배신자', faceKey: p ? faceKeyOf(p) : undefined,
    base: u ? { ...u.st } : statsAround(power), fruitClass: null,
    armament: (u?.armament ?? 0) as EnemySpec['armament'], observation: 0,
    skills: skills.length ? skills : ['fist_jab', 'fist_combo'], tactic: 'offense', officers: [],
    faction: p?.faction ?? 'pirate', species: p?.species ?? 'human', gender: p?.gender ?? 'm', age: p?.age ?? 30,
  };
}

/** 라이벌의 전투 값. 주인공 나이와 라이벌의 힘에서 만든다 */
export function rivalEnemy(s: LifeState): EnemySpec {
  const rv = findPerson(s, 'rival');
  const r = rngOf(s.rng);
  const avg = (s.hero.base.str + s.hero.base.spd + s.hero.base.vit) / 3;
  // 라이벌은 언제나 나와 비슷하거나 조금 강하다. 첫 강적전이다
  const p = Math.round(Math.max(rv?.power ?? 0, avg * (1.05 + r() * 0.2)));
  if (rv) rv.power = Math.round(p * 1.08);
  return {
    id: 'rival', name: rv?.name ?? '라이벌', canon: null, title: '라이벌', faceKey: rv ? faceKeyOf(rv) : undefined,
    base: statsAround(p, { int: 0.7, wil: 0.8 }), fruitClass: null, armament: s.world.stage >= 3 ? 1 : 0, observation: 0,
    skills: genSkills(r, p, 0), tactic: pick(r, ['offense', 'counter'] as const), officers: [],
    faction: rv?.faction ?? 'civil', species: rv?.species ?? 'human', gender: rv?.gender ?? 'm', age: rv?.age ?? s.hero.age,
  };
}

export function resolveEnemy(s: LifeState, ref: string): EnemySpec {
  if (ref === 'rival') return rivalEnemy(s);
  if (ref.startsWith('crew:')) return crewAsEnemy(s, ref.slice(5));
  // 'gen:<elite|captain|grunt>[:원형]'
  const m = /^gen:(elite|captain|grunt)(?::(\w+))?$/.exec(ref);
  if (m) return genEnemy(s, m[1] as 'elite' | 'captain' | 'grunt', rngOf(s.rng), m[2]);
  const b = BOSS_BY_ID[ref];
  if (b) return structuredClone(b);
  return genEnemy(s, 'elite');
}

export function stageOf(seaId: SeaId): Stage {
  return SEA_BY_ID[seaId].stage;
}
