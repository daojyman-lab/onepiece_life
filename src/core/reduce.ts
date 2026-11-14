// 명령 처리. 화면은 상태를 직접 고치지 않고 명령을 보낸다 (docs/02_설계/01_아키텍처.md 4장).
import { B } from '../data/balance';
import { ITEM_BY_ID } from '../data/items';
import { answerChoice, masterCandidates, resolveChoice } from './choice/choice';
import { createBattle, riskOf, winRate, type Assign } from './combat/battle';
import { intervene, runBattle } from './combat/engine';
import { applyBattle } from './combat/outcome';
import { applyEffects, crewCapacity } from './effects';
import { int, pick, rngOf } from './rng';
import { crewOf, mateTitle, traitOf } from './people';
import { jumpToAge } from './state';
import { tick } from './sim/tick';
import type { LifeState, Loadout } from './types';
import { absMonth, clone, fmtMoney, log, timeline } from './util';
import { BOSS_BY_ID } from '../data/bosses';
import { missionTitle } from './world/world';
import { FRUIT_BY_ID } from '../data/fruits';
import { CREW_GEAR, INTEL_PRICE, SHIP_PART_BY_ID, SURGERY_PRICE } from '../data/upgrades';

export type Command =
  | { type: 'tick' }
  | { type: 'answerChoice'; index: number }
  | { type: 'confirmPrep'; loadout: Loadout; assign: Assign }
  | { type: 'withdrawPrep' }
  | { type: 'intervene'; duel: number }
  | { type: 'ackBattle' }
  | { type: 'saveLoadout'; loadout: Loadout }
  | { type: 'challengeBoss' }
  | { type: 'buy'; id: string }
  | { type: 'sell'; id: string }
  | { type: 'appraise'; uid: string }
  | { type: 'eatFruit'; uid: string }
  | { type: 'sellFruit'; uid: string }
  | { type: 'feedFruit'; uid: string; who: string }
  | { type: 'buyPart'; id: string }
  | { type: 'appointMate'; who: string | null }
  | { type: 'treatCrew' }
  | { type: 'recallCrew'; id: string }
  | { type: 'seekMaster' }
  | { type: 'startTraining'; months: number }
  | { type: 'seekSide' }
  | { type: 'crewGear'; who: string }
  | { type: 'buyIntel' }
  | { type: 'surgery' }
  | { type: 'clearNotices' };

const count = (s: LifeState, id: string) => s.inventory.items.find((x) => x.id === id)?.count ?? 0;

/** 편성을 가진 것과 배운 것에 맞게 바로잡는다 */
export function sanitizeLoadout(s: LifeState, lo: Loadout): Loadout {
  const skills = [...new Set(lo.skills)].filter((id) => s.growth.skills[id]).slice(0, 6);
  const owned = (id: string | null, kind: string) => (id && count(s, id) > 0 && ITEM_BY_ID[id]?.kind === kind ? id : null);
  const cons: string[] = [];
  for (const id of lo.consumables) {
    if (ITEM_BY_ID[id]?.kind !== 'consumable') continue;
    if (cons.filter((x) => x === id).length < count(s, id)) cons.push(id);
    if (cons.length >= 3) break;
  }
  const cap = crewCapacity(s);
  const crew = lo.crew.filter((c) => s.people.some((p) => p.id === c.personId && p.alive && p.kind === 'crew')).slice(0, cap);
  return {
    skills, tactic: lo.tactic, retreatAt: lo.retreatAt,
    weapon: owned(lo.weapon, 'weapon'), armor: owned(lo.armor, 'armor'), charm: owned(lo.charm, 'charm'),
    consumables: cons, crew,
  };
}

function useConsumables(s: LifeState, used: string[]) {
  for (const id of used) {
    const it = s.inventory.items.find((x) => x.id === id);
    if (it) it.count -= 1;
  }
  s.inventory.items = s.inventory.items.filter((x) => x.count > 0);
  s.loadout.consumables = s.loadout.consumables.filter((id) => count(s, id) > 0);
}

function afterChildhoodAnswer(s: LifeState) {
  if (s.pending || s.hero.age >= B.childhood.startTickAge) return;
  const next = B.childhood.ages.find((a) => a > s.hero.age) ?? B.childhood.startTickAge;
  jumpToAge(s, next);
  if (next < B.childhood.startTickAge) {
    while (s.choice.queue.length && !s.pending) s.pending = resolveChoice(s, s.choice.queue.shift()!);
    if (s.pending) return;
  }
  jumpToAge(s, B.childhood.startTickAge);
  s.choice.queue = [];
  s.choice.nextAt = absMonth(s);
  log(s, '열 살이 되었다. 이제 스스로 길을 고를 때다.', 'world');
}

export function reduce(prev: LifeState, cmd: Command): LifeState {
  const next = reduceInner(prev, cmd);
  // 멈춤 세기: 새로 선택이나 강적 준비가 떴으면 한 번
  const was = prev.pending?.kind;
  const now = next.pending?.kind;
  if (next !== prev && (now === 'choice' || now === 'prep') && was !== now && next.hero.age >= 10) {
    next.choice.pauses = (next.choice.pauses ?? 0) + 1;
    next.stats.pauses = (next.stats.pauses ?? 0) + 1;
  }
  return next;
}

function reduceInner(prev: LifeState, cmd: Command): LifeState {
  const s = clone(prev);
  const p = s.pending;
  switch (cmd.type) {
    case 'tick':
      if (!tick(s)) return prev;
      return s;

    case 'answerChoice':
      if (!answerChoice(s, cmd.index)) return prev;
      afterChildhoodAnswer(s);
      return s;

    case 'confirmPrep': {
      if (!p || p.kind !== 'prep') return prev;
      s.loadout = sanitizeLoadout(s, cmd.loadout);
      const rate = winRate(s, p.encounter, s.loadout, cmd.assign);
      const risk = riskOf(rate);
      const r = rngOf(s.rng);
      const b = createBattle(s, p.encounter, s.loadout, cmd.assign, int(r, 1, 2 ** 30));
      runBattle(b, false);
      s.pending = { kind: b.awaiting ? 'intervene' : 'battle', encounter: p.encounter, battle: b, risk };
      return s;
    }

    case 'withdrawPrep': {
      if (!p || p.kind !== 'prep') return prev;
      const enc = p.encounter;
      s.pending = null;
      if (enc.source === 'mission' && enc.missionIdx !== undefined) {
        const mp = s.world.missions[enc.missionIdx];
        mp.state = 'failed';
        s.world.refillAt = absMonth(s) + B.world.refillMonths;
        log(s, `임무 「${missionTitle(mp)}」을(를) 포기했다.`, 'danger');
      } else if (enc.source === 'boss') {
        s.world.boss.nextAskAt = absMonth(s) + B.world.bossRetryAskMonths;
        log(s, `${BOSS_BY_ID[s.world.boss.id]?.name ?? '보스'}와의 싸움을 미뤘다.`, 'info');
      } else log(s, '싸움을 피했다.', 'info');
      return s;
    }

    case 'intervene': {
      if (!p || p.kind !== 'intervene') return prev;
      intervene(p.battle, cmd.duel);
      runBattle(p.battle, false);
      s.pending = { kind: p.battle.awaiting ? 'intervene' : 'battle', encounter: p.encounter, battle: p.battle, risk: p.risk };
      return s;
    }

    case 'ackBattle': {
      if (!p || p.kind !== 'battle' || !p.battle.result) return prev;
      s.pending = null;
      const hero = p.battle.units.find((u) => u.hero)!;
      // 쓴 소모품 = 챙긴 것 − 남은 것
      const left = [...hero.consumables];
      const used: string[] = [];
      for (const id of s.loadout.consumables) {
        const i = left.indexOf(id);
        if (i >= 0) left.splice(i, 1); else used.push(id);
      }
      useConsumables(s, used);
      applyBattle(s, p.encounter, p.battle, p.risk);
      return s;
    }

    case 'saveLoadout':
      s.loadout = sanitizeLoadout(s, cmd.loadout);
      return s;

    case 'challengeBoss': {
      if (p || s.world.boss.state !== 'revealed') return prev;
      applyEffects(s, [{ op: 'battle', enemy: s.world.boss.id, elite: true, lethal: true }]);
      return s;
    }

    case 'buy': {
      const it = ITEM_BY_ID[cmd.id];
      if (!it || it.price <= 0 || s.hero.money < it.price || it.grade > s.world.stage + 1) return prev;
      s.hero.money -= it.price;
      applyEffects(s, [{ op: 'item', id: it.id, count: 1 }]);
      return s;
    }
    case 'sell': {
      const it = ITEM_BY_ID[cmd.id];
      if (!it || count(s, cmd.id) <= 0) return prev;
      const price = Math.round(it.price * 0.5);
      applyEffects(s, [{ op: 'item', id: it.id, count: -1 }]);
      s.hero.money += price;
      log(s, `${it.name}을(를) ${fmtMoney(price)} 베리에 팔았다.`, 'money');
      s.loadout = sanitizeLoadout(s, s.loadout);
      return s;
    }
    case 'appraise': {
      const fee = B.money.appraise * s.world.stage;
      const u = s.inventory.unknownFruits.find((x) => x.uid === cmd.uid);
      if (!u || s.hero.money < fee || u.hints.length >= 3) return prev;
      applyEffects(s, [{ op: 'appraise', uid: cmd.uid, fee }]);
      return s;
    }
    case 'eatFruit':
      if (p || s.hero.fruit || !s.inventory.unknownFruits.some((x) => x.uid === cmd.uid)) return prev;
      applyEffects(s, [{ op: 'eatFruit', uid: cmd.uid }]);
      return s;
    case 'appointMate': {
      if (cmd.who === null) { s.world.firstMate = undefined; return s; }
      const p = s.people.find((x) => x.id === cmd.who && x.alive && x.kind === 'crew');
      if (!p || s.world.firstMate === p.id) return prev;
      s.world.firstMate = p.id;
      p.bond = Math.min(100, p.bond + 10);
      log(s, `${p.name}을(를) ${mateTitle(s)}(으)로 임명했다. "맡겨 줘."`, 'good');
      timeline(s, `${p.name}을(를) ${mateTitle(s)}(으)로 임명했다`);
      return s;
    }
    case 'seekSide': {
      if (p || s.world.side || s.world.training || s.world.seeking || s.world.prison) return prev;
      const offer = resolveChoice(s, 'sd_offer');
      if (!offer) return prev;
      s.pending = offer;
      return s;
    }
    case 'startTraining': {
      if (p || s.world.training || s.world.seeking || s.world.prison || s.hero.age < B.training.minAge || !B.training.options.includes(cmd.months)) return prev;
      s.world.training = { left: cmd.months, total: cmd.months };
      log(s, `${cmd.months}개월 동안 일을 쉬고 수련에만 매달리기로 했다.`, 'world');
      return s;
    }
    case 'seekMaster': {
      const cost = B.seek.cost * s.world.stage;
      if (p || s.growth.master || s.world.seeking || s.world.prison || s.hero.age < 14 || s.hero.money < cost) return prev;
      s.hero.money -= cost;
      const r = rngOf(s.rng);
      const nav = s.people.some((x) => x.alive && x.kind === 'crew' && x.crew?.role === 'navigator');
      const pFind = Math.min(B.seek.max, B.seek.base + s.hero.base.luk * B.seek.perLuk + (nav ? B.seek.navigator : 0));
      // 가르쳐 줄 사람이 아예 없으면 아무리 찾아도 못 찾는다 (플레이어에게는 알려 주지 않는다)
      const found = masterCandidates(s, true).length > 0 && r() < pFind;
      s.world.seeking = { month: 0, foundAt: found ? int(r, 2, B.seek.months) : null };
      log(s, `스승을 찾아 길을 나섰다. 여비 ${fmtMoney(cost)} 베리. 길게는 1년이 걸릴 것이다.`, 'world');
      return s;
    }
    case 'recallCrew': {
      const q = s.people.find((x) => x.id === cmd.id && x.alive && x.relation === '흩어진 옛 동료' && x.crew);
      const cost = B.crew.recallCost * s.world.stage;
      if (!q || p || s.world.prison || !s.choice.flags.includes('crew_contacts') || s.hero.money < cost || crewOf(s).length >= crewCapacity(s)) return prev;
      s.hero.money -= cost;
      log(s, `전보벌레로 ${q.name}을(를) 불렀다. (여비 ${cost.toLocaleString('ko-KR')} 베리)`, 'world');
      applyEffects(s, [{ op: 'rejoin', who: q.id, ship: false }]);
      return s;
    }
    case 'treatCrew': {
      const crew = crewOf(s);
      const cost = B.crew.feastCostPer * crew.length * s.world.stage;
      if (!crew.length || s.hero.money < cost || p) return prev;
      s.hero.money -= cost;
      s.world.feastUntil = absMonth(s) + B.crew.feastMonths;
      for (const c of crew) c.bond = Math.min(100, c.bond + B.crew.feastBond);
      s.hero.hp = Math.min(100, s.hero.hp + 10);
      const r = rngOf(s.rng);
      const port = s.world.missions.find((m) => m.state === 'active')?.port ?? s.hero.birth.place;
      log(s, `한턱 쐈다! ${port}의 선술집을 통째로 빌려 동료들과 회식을 했다. (${cost.toLocaleString('ko-KR')} 베리)`, 'good');
      const who = pick(r, crew);
      log(s, traitOf(who).feast.replace(/\{name\}/g, who.name), 'day');
      log(s, `사기가 올랐다. ${B.crew.feastMonths}개월 동안 동료들이 더 힘을 낸다.`, 'growth');
      return s;
    }
    case 'buyPart': {
      const part = SHIP_PART_BY_ID[cmd.id];
      const parts = (s.world.shipParts ??= []);
      if (!part || parts.includes(part.id) || s.hero.route === 'marine' || !s.world.ship || s.world.stage < part.minStage || s.hero.money < part.price) return prev;
      s.hero.money -= part.price; parts.push(part.id);
      log(s, `배에 ${part.name}을(를) 달았다. ${part.text}.`, 'good');
      return s;
    }
    case 'crewGear': {
      const p = s.people.find((x) => x.id === cmd.who && x.alive && x.kind === 'crew' && x.crew);
      const next = (p?.crew?.gear ?? 0) + 1;
      if (!p || next >= CREW_GEAR.length || s.hero.money < CREW_GEAR[next].price) return prev;
      s.hero.money -= CREW_GEAR[next].price; p.crew!.gear = next; p.bond = Math.min(100, p.bond + 5);
      log(s, `${p.name}에게 ${CREW_GEAR[next].name}을(를) 맞춰 주었다. 눈빛이 달라졌다.`, 'good');
      return s;
    }
    case 'buyIntel': {
      const price = INTEL_PRICE * s.world.stage;
      const id = s.world.boss.id;
      if (s.world.boss.state !== 'revealed' || s.known.people.includes(id) || s.hero.money < price) return prev;
      s.hero.money -= price; s.known.people.push(id);
      log(s, `정보상에게 ${BOSS_BY_ID[id]?.name ?? '보스'}의 능력치와 기술을 전부 사들였다.`, 'info');
      return s;
    }
    case 'surgery': {
      const price = SURGERY_PRICE * s.world.stage;
      const scar = s.hero.injuries.find((i) => i.severity === 'scar');
      if (!scar || s.hero.money < price) return prev;
      s.hero.money -= price;
      s.hero.injuries.splice(s.hero.injuries.indexOf(scar), 1);
      if (scar.stat) s.hero.base[scar.stat] += B.body.injury.scar.amount;
      log(s, '명의에게 수술을 받아 후유증이 사라졌다.', 'good');
      return s;
    }
    case 'feedFruit':
      if (p || !s.inventory.unknownFruits.some((x) => x.uid === cmd.uid)) return prev;
      applyEffects(s, [{ op: 'feedFruit', uid: cmd.uid, who: cmd.who }]);
      return s;
    case 'sellFruit':
      if (!s.inventory.unknownFruits.some((x) => x.uid === cmd.uid)) return prev;
      applyEffects(s, [{ op: 'sellFruit', uid: cmd.uid }]);
      return s;
    case 'clearNotices':
      s.notices = [];
      s.metaEvents = [];
      return s;
  }
}

/** 불변 조건. 불러온 상태와 테스트에서 검사한다. 깨진 것의 목록을 돌려준다 */
export function invariants(s: LifeState): string[] {
  const bad: string[] = [];
  if (s.schema !== 1) bad.push('schema');
  if (s.hero.hp < 0 || s.hero.hp > 100) bad.push('hp 범위');
  if (s.loadout.skills.length > 6) bad.push('기술 칸 초과');
  if (s.loadout.skills.some((id) => !s.growth.skills[id])) bad.push('배우지 않은 기술 장착');
  if (s.hero.fruit && !FRUIT_BY_ID[s.hero.fruit.id]) bad.push('없는 열매');
  if (!s.hero.alive && (!s.pending || s.pending.kind !== 'ending')) bad.push('죽었는데 결산이 없다');
  if (s.pending?.kind === 'choice' && !s.pending.options.some((o) => !o.disabled)) bad.push('고를 수 없는 선택');
  if (s.world.missions.some((m) => m.state === 'active') && s.world.missions.filter((m) => m.state === 'active').length > 1) bad.push('진행 중 임무 둘 이상');
  return bad;
}
