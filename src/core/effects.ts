// 효과 적용기. 선택지 · 임무 · 전투 결과가 모두 이것 하나를 쓴다.
import { B } from '../data/balance';
import { FRUITS, FRUIT_BY_ID, fruitHints, GRADE_NAMES } from '../data/fruits';
import { ITEM_BY_ID } from '../data/items';
import { MASTER_BY_ID } from '../data/masters';
import { FRUIT_PASSIVES, HERO_TRAIT_BY_ID } from '../data/passives';
import { SIDE_BY_ID } from '../data/sideStories';
import { SHIP_BY_ID } from '../data/seas';
import { addPerson, crewLabel, crewOf, recruit, roleName } from './people';
import { SPECIES_NAMES } from '../data/births';
import { NAMED_CREW_BY_ID } from '../data/namedCrew';
import { capture, jailbreak, prisonExtend, release, startHunt } from './sim/prison';
import { davyBack, dbfFinal } from './sim/davyback';
import { startTrial, trialDone } from './sim/trial';
import { rngOf, weighted, pick } from './rng';
import type { Effect, LifeState, StatKey } from './types';
import { absMonth, clamp, findPerson, fmtMoney, log, talentMult, talentsOf, timeline, uid } from './util';
import { learn, openGate, setFocus } from './growth/growth';
import { branchSkills } from './growth/skillbook';
import { enterSea, resolveEnemy, sea } from './world/world';

const STATS: StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const STAT_NAMES: Record<StatKey, string> = { str: '힘', spd: '속도', vit: '체력', int: '지능', wil: '정신', luk: '운' };

export function crewCapacity(s: LifeState) {
  if (s.hero.route === 'marine') {
    // 분대장(하사)이 되어야 자기 분대를 꾸린다
    const M = B.marine;
    return s.hero.rank < M.squadRank ? 0 : Math.min(M.squadMax, M.squadBase + Math.floor((s.hero.rank - M.squadRank) / 2));
  }
  const ship = s.world.ship ? SHIP_BY_ID[s.world.ship] : null;
  return ship ? ship.crew : 0;
}

export const RANKS = {
  pirate: ['풋내기 해적', '해적 선장', '이름난 선장', '대형 루키', '초신성', '사황 후보', '사황', '해적왕'],
  marine: ['이등병', '일등병', '상등병', '하사 (분대장)', '중사', '상사', '소위', '중위', '대위', '소령', '중령', '대령', '준장', '중장', '대장', '원수'],
  revolution: ['혁명군 병사', '혁명군 간부', '군대장', '참모', '참모총장', '혁명의 영웅'],
  none: ['민간인'],
};
export function rankName(s: LifeState) {
  const list = RANKS[s.hero.route];
  return list[Math.min(list.length - 1, s.hero.rank)];
}

function fruitWeight(grade: number) {
  return ({ 1: 30, 2: 28, 3: 22, 4: 13, 5: 7 } as Record<number, number>)[grade];
}

export function findFruit(s: LifeState, pool: string) {
  const r = rngOf(s.rng);
  const held = new Set([s.hero.fruit?.id, ...s.inventory.unknownFruits.map((u) => u.fruitId)]);
  let cands = FRUITS.filter((f) => !held.has(f.id));
  if (pool === 'gradeMin3') cands = cands.filter((f) => f.grade >= 3);
  else if (pool !== 'any') cands = cands.filter((f) => f.id === pool);
  const f = weighted(r, cands, (x) => fruitWeight(x.grade));
  if (!f) return;
  const known = s.known.fruits.includes(f.id);
  s.inventory.unknownFruits.push({
    uid: uid(s, 'f'), fruitId: f.id, foundAt: absMonth(s), asked: false,
    hints: known ? [`도감에 있다: ${f.name} (${GRADE_NAMES[f.grade]})`] : [],
  });
  log(s, known ? `${f.name}을(를) 손에 넣었다! 도감에서 본 열매다.` : '정체 모를 악마의 열매를 손에 넣었다!', 'good');
}

function eatFruit(s: LifeState, fuid: string) {
  const i = s.inventory.unknownFruits.findIndex((u) => u.uid === fuid);
  if (i < 0 || s.hero.fruit) return;
  const u = s.inventory.unknownFruits[i];
  s.inventory.unknownFruits.splice(i, 1);
  const f = FRUIT_BY_ID[u.fruitId];
  s.hero.fruit = { id: f.id, eatenAt: s.hero.age };
  s.metaEvents.push({ k: 'fruit', id: f.id, grade: f.grade });
  log(s, `열매를 먹었다. 끔찍한 맛… 그것은 ${f.name}이었다! (${GRADE_NAMES[f.grade]})`, f.grade >= 4 ? 'good' : 'growth');
  timeline(s, `${f.name}을(를) 먹었다 (${GRADE_NAMES[f.grade]})`);
  log(s, '이제 헤엄칠 수 없다. 해루석에 약해졌다.', 'danger');
  s.growth.fruitMastery = 0;
  const fp = FRUIT_PASSIVES[f.id];
  if (fp) log(s, `열매의 힘: ${fp.text}`, 'growth');
  log(s, '열매 칸에 들어갔다. 열매 숙련이 오를수록 힘이 세진다.', 'growth');
}

export function applyEffects(s: LifeState, effects: Effect[]) {
  for (const e of effects) apply(s, e);
}

function apply(s: LifeState, e: Effect) {
  const h = s.hero;
  const r = rngOf(s.rng);
  switch (e.op) {
    case 'base':
      if (e.key === 'all') for (const k of STATS) h.base[k] = Math.max(1, h.base[k] + e.add);
      else h.base[e.key] = Math.max(1, h.base[e.key] + e.add);
      return;
    case 'hp': h.hp = clamp(h.hp + e.add, 0, 100); return;
    case 'money': h.money += e.add; if (e.add) log(s, `${e.add > 0 ? '+' : ''}${fmtMoney(e.add)} 베리`, 'money'); return;
    case 'moneyPct': { const d = Math.round(Math.max(0, h.money) * e.pct); h.money += d; log(s, `${fmtMoney(d)} 베리`, 'money'); return; }
    case 'fame': h.fame = Math.max(0, h.fame + e.add); return;
    case 'focus': setFocus(s, e.branch, e.slot); return;
    case 'learn': learn(s, e.skill); return;
    case 'mastery': {
      const ids = e.skill === 'focus'
        ? (s.growth.focus ? branchSkills(s.growth.focus, h.fruit?.id ?? null).map((x) => x.id) : [])
        : [e.skill];
      for (const id of ids) {
        const k = s.growth.skills[id];
        if (k) k.mastery = clamp(k.mastery + e.add, 0, 100);
      }
      return;
    }
    case 'gate': openGate(s, e.id); return;
    case 'apprentice': {
      const m = MASTER_BY_ID[e.master];
      h.money -= e.fee;
      s.growth.master = { personId: e.master, name: m?.name ?? e.master, branch: e.branch, gate: e.gate, monthsLeft: e.months };
      s.metaEvents.push({ k: 'met', id: e.master, where: s.world.seaId });
      if (m && !s.people.some((p) => p.canon === m.id)) {
        s.people.push({ id: uid(s, 'p'), name: m.name, gender: m.gender, age: m.age, kind: 'master', relation: `스승 · ${m.title}`, canon: m.id, bond: 60, faction: m.faction, species: m.species, alive: true });
      }
      log(s, `${m?.name ?? '스승'} 밑에서 ${e.months}개월 동안 수련한다.`, 'growth');
      timeline(s, `${m?.name ?? '스승'}의 제자가 되었다`);
      return;
    }
    case 'route': {
      const was = h.route;
      h.route = e.to;
      if (e.to === 'revolution') { h.rank = 0; log(s, '혁명군이 되었다.', 'world'); return; }
      h.rank = 0;
      log(s, e.to === 'pirate' ? '해적 깃발을 올렸다!' : e.to === 'marine' ? '해군 제복을 입었다!' : '길을 바꿨다.', 'world');
      if (was === 'none') enterSea(s, s.world.seaId);
      return;
    }
    case 'rank': promote(s, e.add); return;
    case 'flag': if (!s.choice.flags.includes(e.id)) s.choice.flags.push(e.id); return;
    case 'unflag': s.choice.flags = s.choice.flags.filter((f) => f !== e.id); return;
    case 'trait': if (!h.traits.includes(e.id)) h.traits.push(e.id); return;
    case 'persona': {
      const t = HERO_TRAIT_BY_ID[e.id];
      if (!t) return;
      const had = h.persona;
      h.persona = t.id;
      log(s, had ? `특성이 「${t.name}」(으)로 바뀌었다. ${t.desc}.` : `특성 「${t.name}」이(가) 몸에 배었다. ${t.desc}.`, 'good');
      timeline(s, `특성 「${t.name}」`);
      return;
    }
    case 'person': {
      const seed = { ...e.add };
      if (seed.kind === 'rival' && seed.power === undefined) {
        seed.power = Math.round((h.base.str + h.base.spd + h.base.vit) / 3 * (0.95 + r() * 0.2));
      }
      addPerson(s, seed);
      return;
    }
    case 'bond': { const p = findPerson(s, e.who); if (p) p.bond = clamp(p.bond + e.add, 0, 100); return; }
    case 'recruit': {
      const cap = crewCapacity(s);
      const navy = h.route === 'marine';
      if (crewOf(s).length >= cap) {
        log(s, navy ? (cap === 0 ? '아직 분대를 꾸릴 계급이 아니다. 하사(분대장)가 되어야 한다.' : '분대에 빈자리가 없다.') : '배에 자리가 없어 동료로 받지 못했다.', 'info');
        return;
      }
      const p = recruit(s, e.crew);
      if (!p) return;
      const extra = talentsOf(s).reduce((x, t) => x + (t.crewLevel ?? 0), 0);
      if (p.crew && extra) { p.crew.level += extra; p.crew.power += extra * B.crew.powerPerLevel * 0.5; }
      const named = e.crew.named ? NAMED_CREW_BY_ID[e.crew.named] : undefined;
      if (named) log(s, named.joinLog, 'good');
      const sp = p.species !== 'human' ? ` ${SPECIES_NAMES[p.species]}이다.` : '';
      log(s, (navy ? `${crewLabel(p)}을(를) 내 분대로 데려왔다!` : `${crewLabel(p)}이(가) 동료가 되었다!`) + sp, 'good');
      timeline(s, navy ? `${p.name}이(가) 분대원이 되었다` : `${p.name}이(가) 동료가 되었다`);
      if (s.loadout.crew.length < cap) s.loadout.crew.push({ personId: p.id, role: p.crew!.role });
      return;
    }
    case 'item': {
      const it = s.inventory.items.find((x) => x.id === e.id);
      if (it) it.count += e.count; else s.inventory.items.push({ id: e.id, count: e.count });
      s.inventory.items = s.inventory.items.filter((x) => x.count > 0);
      if (e.count > 0) log(s, `${ITEM_BY_ID[e.id]?.name ?? e.id}을(를) 얻었다.`, 'good');
      return;
    }
    case 'findFruit': findFruit(s, e.pool); return;
    case 'eatFruit': eatFruit(s, e.uid); return;
    case 'startSide': {
      const st = SIDE_BY_ID[e.id];
      if (!st || s.world.side) return;
      s.world.side = { id: st.id, step: 0, months: 0 };
      log(s, `곁가지 이야기 「${st.title}」를 맡았다. 그동안 해역 임무는 쉰다.`, 'world');
      return;
    }
    case 'crewBond':
      for (const p of crewOf(s)) p.bond = Math.min(100, Math.max(0, p.bond + e.add));
      return;
    case 'family': {
      if (e.act === 'lover') {
        const g: 'm' | 'f' = h.gender === 'm' ? 'f' : 'm';
        const p = addPerson(s, { kind: 'family', relation: '연인', gender: g, age: h.age + Math.round(r() * 6 - 3), bond: 70, faction: 'civil' });
        if (!s.choice.flags.includes('has_lover')) s.choice.flags.push('has_lover');
        log(s, `${p.name}와(과) 연인이 되었다.`, 'good');
        timeline(s, `${p.name}와(과) 사랑에 빠졌다`);
      } else if (e.act === 'marry') {
        const p = s.people.find((x) => x.alive && x.relation === '연인');
        if (!p) return;
        p.relation = '배우자'; p.bond = Math.min(100, p.bond + 20);
        s.choice.flags = s.choice.flags.filter((f) => f !== 'has_lover');
        if (!s.choice.flags.includes('married')) s.choice.flags.push('married');
        log(s, `${p.name}와(과) 결혼했다. ${h.birth.place}에 작은 집을 마련했다.`, 'good');
        timeline(s, `${p.name}와(과) 결혼했다`);
      } else if (e.act === 'breakup') {
        const p = s.people.find((x) => x.alive && x.relation === '연인');
        if (!p) return;
        p.kind = 'ally'; p.relation = '옛 연인'; p.bond = Math.max(0, p.bond - 40);
        s.choice.flags = s.choice.flags.filter((f) => f !== 'has_lover');
        log(s, `${p.name}와(과) 헤어졌다.`, 'danger');
      } else if (e.act === 'child') {
        const g = e.gender ?? (r() < 0.5 ? 'm' : 'f');
        const p = addPerson(s, { kind: 'family', relation: g === 'm' ? '아들' : '딸', gender: g, age: 0, bond: 90, faction: 'civil', name: `${h.surname} ${e.name ?? '아기'}` });
        log(s, `${g === 'm' ? '아들' : '딸'}이 태어났다! 이름은 ${p.name}.`, 'good');
        timeline(s, `${g === 'm' ? '아들' : '딸'} ${p.name}이(가) 태어났다`);
        if (!s.choice.flags.includes('has_child')) s.choice.flags.push('has_child');
      }
      return;
    }
    case 'feedFruit': {
      const i = s.inventory.unknownFruits.findIndex((u) => u.uid === e.uid);
      const p = s.people.find((x) => x.id === e.who && x.alive && x.kind === 'crew' && x.crew);
      if (i < 0 || !p || p.crew!.fruit) return;
      const f = FRUIT_BY_ID[s.inventory.unknownFruits[i].fruitId];
      s.inventory.unknownFruits.splice(i, 1);
      p.crew!.fruit = f.id;
      p.crew!.power = Math.round(p.crew!.power * (1 + B.crew.fruitPowerMult * f.grade) + B.crew.fruitPowerAdd * f.grade);
      p.bond = Math.min(100, p.bond + 10);
      log(s, `${p.name}이(가) 열매를 먹었다. 끔찍한 맛에 몸서리치더니… ${f.name}이었다! (${GRADE_NAMES[f.grade]})`, f.grade >= 4 ? 'good' : 'growth');
      log(s, `${p.name}은(는) 이제 헤엄칠 수 없다. 대신 ${FRUIT_PASSIVES[f.id]?.text ?? '열매의 힘을 얻었다'}.`, 'growth');
      timeline(s, `동료 ${p.name}이(가) ${f.name}을(를) 먹었다`);
      return;
    }
    case 'sellFruit': {
      const i = s.inventory.unknownFruits.findIndex((u) => u.uid === e.uid);
      if (i < 0) return;
      const f = FRUIT_BY_ID[s.inventory.unknownFruits[i].fruitId];
      s.inventory.unknownFruits.splice(i, 1);
      const price = B.money.fruitSell[f.grade];
      h.money += price;
      log(s, `열매를 ${fmtMoney(price)} 베리에 팔았다.`, 'money');
      return;
    }
    case 'appraise': {
      const u = s.inventory.unknownFruits.find((x) => x.uid === e.uid);
      if (!u) return;
      const all = fruitHints(FRUIT_BY_ID[u.fruitId]);
      const next = all.find((x) => !u.hints.includes(x));
      h.money -= e.fee;
      if (next) { u.hints.push(next); log(s, `감정 결과: ${next}`, 'info'); }
      else log(s, '감정사도 더는 알아낼 것이 없다고 한다.', 'info');
      return;
    }
    case 'injury': {
      if (e.severity === 'scar') {
        const k = pick(r, ['str', 'spd', 'vit'] as StatKey[]);
        h.base[k] = Math.max(1, h.base[k] - B.body.injury.scar.amount);
        h.injuries.push({ severity: 'scar', monthsLeft: -1, stat: k });
        log(s, `평생 남을 후유증을 얻었다. (${STAT_NAMES[k]} −${B.body.injury.scar.amount})`, 'danger');
      } else {
        const months = Math.max(1, Math.round(B.body.injury[e.severity].months * talentMult(s, 'injury')));
        h.injuries.push({ severity: e.severity, monthsLeft: months });
        log(s, e.severity === 'heavy' ? '크게 다쳤다. 한동안 제대로 움직일 수 없다.' : '가볍게 다쳤다.', 'danger');
      }
      return;
    }
    case 'heal':
      h.injuries = h.injuries.filter((i) => i.severity === 'scar');
      h.illness = null;
      h.hp = Math.max(h.hp, 80);
      log(s, '몸이 회복되었다.', 'good');
      return;
    case 'sellBest': {
      const best = s.inventory.items
        .map((x) => ({ x, it: ITEM_BY_ID[x.id] }))
        .filter((y) => y.it && y.it.price > 0)
        .sort((a, b) => b.it.price - a.it.price)[0];
      if (best) {
        best.x.count -= 1;
        s.inventory.items = s.inventory.items.filter((x) => x.count > 0);
        for (const k of ['weapon', 'armor', 'charm'] as const) if (s.loadout[k] === best.x.id && !s.inventory.items.some((x) => x.id === best.x.id)) s.loadout[k] = null;
        log(s, `${best.it.name}을(를) 팔았다.`, 'money');
      } else h.money -= 10000;
      return;
    }
    case 'illness':
      if (!h.illness) { h.illness = { id: e.id, stage: 1, months: 0 }; log(s, '병에 걸렸다.', 'danger'); }
      return;
    case 'battle': {
      const enemy = resolveEnemy(s, e.enemy);
      s.pending = {
        kind: 'prep',
        encounter: {
          source: e.enemy === 'rival' ? 'rival' : e.enemy.startsWith('b_') ? 'boss' : 'choice',
          enemy, elite: e.elite, lethal: e.lethal && !e.spar, spar: !!e.spar, atSea: false,
          solo: e.solo, reward: e.win, onLose: e.lose,
        },
      };
      return;
    }
    case 'leaveCrew': {
      const p = s.people.find((x) => x.id === e.who);
      if (!p || !p.alive || p.kind !== 'crew') return;
      s.loadout.crew = s.loadout.crew.filter((c) => c.personId !== p.id);
      if (s.world.firstMate === p.id) s.world.firstMate = undefined;
      if (e.why === 'betray') {
        p.kind = 'enemy'; p.relation = '배신자'; p.bond = 0; p.faction = 'pirate';
        let lost = 0;
        if (e.takeMoneyPct) { lost = Math.round(Math.max(0, h.money) * e.takeMoneyPct); h.money -= lost; }
        log(s, `${p.name}이(가) 배를 버리고 달아났다${lost ? `. 금고에서 ${fmtMoney(lost)} 베리가 사라졌다` : ''}. 자리 하나가 비었다.`, 'danger');
        timeline(s, `동료 ${p.name}이(가) 배신하고 달아났다`);
      } else if (e.why === 'hurt') {
        p.kind = 'ally'; p.relation = '떠나간 동료'; p.bond = Math.max(0, p.bond - 30);
        log(s, `의심받은 ${p.name}은(는) 말없이 짐을 싸서 배를 떠났다. 자리 하나가 비었다.`, 'danger');
        timeline(s, `동료 ${p.name}이(가) 배를 떠났다`);
      } else if (e.why === 'exposed') {
        p.kind = 'enemy'; p.relation = '배신자'; p.bond = 0;
        log(s, `${p.name}의 정체가 드러났다. 이제 동료가 아니다.`, 'danger');
        timeline(s, `동료 ${p.name}의 배신이 드러났다`);
      } else {
        p.kind = 'enemy'; p.relation = '쫓아낸 배신자'; p.bond = 0;
        log(s, `${p.name}을(를) 배에서 내쫓았다. 자리 하나가 비었다.`, 'world');
        timeline(s, `배신자 ${p.name}을(를) 쫓아냈다`);
      }
      return;
    }
    case 'ship': {
      const ship = SHIP_BY_ID[e.id];
      h.money -= e.price;
      s.world.ship = e.id;
      if (e.price > 0) { log(s, `${ship.name}을(를) 손에 넣었다!`, 'good'); timeline(s, `${ship.name}을(를) 샀다`); }
      // 임펠 다운에서 나온 뒤 새 배를 샀다: 흩어진 동료들이 소식을 듣고 돌아온다
      if (s.choice.flags.includes('lost_ship') && e.id !== 'raft') {
        s.choice.flags = s.choice.flags.filter((f) => f !== 'lost_ship');
        const r = rngOf(s.rng);
        const old = s.people.filter((p) => p.alive && p.relation === '흩어진 옛 동료' && p.crew).sort((a, z) => z.bond - a.bond);
        const back: string[] = [];
        for (const p of old) {
          if (crewOf(s).length >= crewCapacity(s)) break;
          if (r() < 0.6 + p.bond / 250) {
            p.kind = 'crew'; p.relation = `동료 · ${p.crew!.role === 'vanguard' ? '돌격대' : '동료'}`;
            if (s.loadout.crew.length < crewCapacity(s)) s.loadout.crew.push({ personId: p.id, role: p.crew!.role });
            back.push(p.name);
          }
        }
        if (back.length) { log(s, `소식을 듣고 옛 동료들이 돌아왔다: ${back.join(', ')}. "늦었잖아, 선장."`, 'good'); timeline(s, '흩어졌던 동료들이 돌아왔다'); }
      }
      return;
    }
    case 'hunt': startHunt(s, e.flee); return;
    case 'capture': capture(s, e.tier); return;
    case 'release': release(s, e.broke); return;
    case 'prisonExtend': prisonExtend(s, e.months); return;
    case 'jailbreak': jailbreak(s); return;
    case 'masterTrial': startTrial(s, e.master, e.branch, e.gate, e.next); return;
    case 'trialDone': trialDone(s, e.ok); return;
    case 'loot': {
      const r = rngOf(s.rng);
      const add = Math.round(e.base * s.world.stage * (0.7 + r() * 0.6) / 100) * 100;
      h.money += add;
      log(s, e.text.replace('{money}', fmtMoney(add)), 'money');
      return;
    }
    case 'davyBack': davyBack(s); return;
    case 'dbfRound': dbfFinal(s, e.won); return;
    case 'rejoin': {
      const p = s.people.find((x) => x.id === e.who);
      if (e.ship && s.world.lostShip) {
        const ship = SHIP_BY_ID[s.world.lostShip];
        s.world.ship = s.world.lostShip;
        s.world.lostShip = undefined;
        s.choice.flags = s.choice.flags.filter((f) => f !== 'lost_ship');
        log(s, `${p ? p.name + '이(가) ' : ''}해군 창고에서 빼낸 ${ship.name}이(가) 항구에 들어왔다. 우리 배가 돌아왔다!`, 'good');
        timeline(s, `압수된 ${ship.name}을(를) 되찾았다`);
      }
      if (!p || !p.alive || !p.crew) return;
      if (crewOf(s).length >= crewCapacity(s)) { log(s, '배에 자리가 없어 함께 가지 못했다.', 'info'); return; }
      p.kind = 'crew'; p.relation = `동료 · ${roleName(p.crew.role)}`; p.bond = Math.min(100, p.bond + 15);
      if (s.loadout.crew.length < crewCapacity(s)) s.loadout.crew.push({ personId: p.id, role: p.crew.role });
      log(s, `${p.name}이(가) 다시 배에 올랐다. "이번엔 끝까지 간다, 선장."`, 'good');
      timeline(s, `흩어졌던 ${p.name}이(가) 돌아왔다`);
      return;
    }
    case 'partWays': {
      const p = s.people.find((x) => x.id === e.who);
      if (!p) return;
      p.relation = '제 길을 간 옛 동료';
      log(s, `${p.name}은(는) 고개를 끄덕이고 자기 바다로 떠났다.`, 'info');
      return;
    }
    case 'bossLater': s.world.boss.nextAskAt = absMonth(s) + e.months; return;
    case 'queue': if (!s.choice.queue.includes(e.choice)) s.choice.queue.push(e.choice); return;
    case 'log': log(s, e.text, e.type); return;
    case 'timeline': timeline(s, e.text); return;
    case 'die': kill(s, e.cause); return;
    case 'retire': kill(s, '은퇴'); return;
    case 'chance':
      if (r() < e.p) applyEffects(s, e.then);
      else if (e.else) applyEffects(s, e.else);
      return;
  }
}

/** 진급 (해적은 이름이 오른다). 해군은 하사가 되면 분대를 꾸린다 */
export function promote(s: LifeState, add: number) {
  const h = s.hero;
  const before = h.rank;
  h.rank = Math.max(0, Math.min(RANKS[h.route].length - 1, h.rank + add));
  if (h.rank <= before) return;
  if (h.route === 'marine') {
    log(s, `${rankName(s)}(으)로 진급했다!`, 'good');
    if (before < B.marine.squadRank && h.rank >= B.marine.squadRank) {
      log(s, '분대장이 되었다. 이제 눈에 띄는 병사를 골라 내 분대를 꾸릴 수 있다.', 'good');
      timeline(s, '분대장이 되었다');
    }
  } else log(s, `${rankName(s)}(으)로 이름이 올랐다.`, 'good');
}

/** 인생을 끝낸다. 결산 창은 sim이 띄운다 */
export function kill(s: LifeState, cause: string) {
  if (!s.hero.alive) return;
  s.hero.alive = false;
  s.ended = { cause, age: s.hero.age };
  log(s, cause === '은퇴' ? `${s.hero.age}세, 바다를 떠나 은퇴했다.` : `${s.hero.age}세, ${cause}(으)로 생을 마쳤다.`, 'danger');
  timeline(s, cause === '은퇴' ? '은퇴했다' : `${cause}(으)로 세상을 떠났다`);
  s.pending = { kind: 'ending', cause };
}

export { sea };
