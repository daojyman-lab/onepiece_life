// 명령 처리. 화면은 상태를 직접 고치지 않고 명령을 보낸다 (docs/02_설계/01_아키텍처.md 4장).
import { B } from '../data/balance';
import { ITEM_BY_ID } from '../data/items';
import { answerChoice, resolveChoice } from './choice/choice';
import { createBattle, riskOf, winRate, type Assign } from './combat/battle';
import { intervene, runBattle } from './combat/engine';
import { applyBattle } from './combat/outcome';
import { applyEffects, crewCapacity } from './effects';
import { int, rngOf } from './rng';
import { jumpToAge } from './state';
import { tick } from './sim/tick';
import type { LifeState, Loadout } from './types';
import { absMonth, clone, fmtMoney, log } from './util';
import { BOSS_BY_ID } from '../data/bosses';
import { missionTitle } from './world/world';
import { FRUIT_BY_ID } from '../data/fruits';

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
