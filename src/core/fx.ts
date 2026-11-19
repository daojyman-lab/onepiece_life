// 효과 적용. 효과는 값이고, 연산(op)마다 한 갈래씩 처리한다.
import { traitFactor, hasTrait, recordTraitEvent, initializeTraits, tradeCost, traitMastery } from './traits';
import { setDream } from './dreams';
import { loseShip, nameShip, ownedHull, partShip, repairShip, repairWords, takeShip } from './ship-memory';
import { recordWatchMeal, watchMealWords } from './watch-meal';
import { acceptDisciple, discipleWords } from './disciples';
import { lifeGuardMethod, lifeOutcome, recordLifeEvent, waitForLifeEvidence } from './life-story';
import { returnFromTraining } from './training-travel';
import { childhoodWords, rememberChildhood } from './childhood-memory';
import { rivalCrewRole, rivalPerson, rivalPosition } from './rival';
import { resumeVoyage } from './passage';
import { markPersonDead, parentFound, parentMissing, separateSpouse, welcomeSibling } from './family';
import { resolveSiblingReunion, siblingReunionWords } from './siblings';
import { awardEntryPass, requestArrival, resolveEntry, sailTo, boardSkiff } from './voyage';
import { deepWater, growthMultiplier, recoveryMultiplier } from './environment';
import { npcName } from './names';
import { enterPrime } from './stages';
import { FRUIT_BY_ID, NATURAL_FRUITS, SMILE_FRUITS } from '../shared/data/fruits';
import { ITEM_BY_ID } from '../shared/data/items';
import { SEA_BY_ID } from '../shared/data/seas';
import { BRANCH_NAMES } from '../shared/data/skills';
import { crewPowerFor } from '../shared/core/people';
import { chance, pick, rngOf, weighted } from '../shared/core/rng';
import { fill } from '../shared/core/util';
import { V } from '../data/balance';
import { CANON, canonAge } from '../data/canon';
import { FOES } from '../data/foes';
import { HOMES } from '../data/homes';
import { STANDING_FROM_CHILD, STANDING_PHRASE } from '../data/standings';
import { STRENGTHS } from '../data/strengths';
import { fitProsthetic, loseLimb } from './body';
import { askFight, rivalCombatStat, startKumaFight, startRivalDuel } from './fight';
import { fillContacts, hasRelation, livingContact } from './needs';
import { josa } from '../shared/core/josa';
import { revealSurname } from './fortune';
import { BRANCH_ID } from './power';
import { addStyleMastery, adoptStyle, beginStyle, equippedWeapon, focusedStyle, giveAwayWeapon, hasWeapon, isMartialBranch, receiveWeapon, refineStyle } from './styles';
import { logLine } from './state';
import { addMark } from './strengths';
import { isDeep } from './values';
import { notePrisonEscape } from './bounty';
import { beginVow, declineVow, resolveVow } from './vow';
import type { Branch, Fx, Life5, Person, StatKey } from './types';

const STAT_KEYS: readonly StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** 문장의 자리표시 {name} {town} {island} {parent}를 현재 상태로 채우고 조사를 고른다 */
export function fillText(s: Life5, text: string, discipleId?: string): string {
  if (!text.includes('{')) return josa(text);
  const vars: Record<string, string> = { name: s.hero.name, town: s.hero.town, island: s.hero.island };
  if (text.includes('{rival}')) vars.rival = rivalPerson(s)?.name ?? '맞수';
  if (text.includes('{rivalPost}')) vars.rivalPost = rivalPosition(s);
  if (text.includes('{crisis')) Object.assign(vars, childhoodWords(s));
  if (text.includes('{mentor}')) vars.mentor = livingContact(s, { relation: '스승' })?.name ?? '스승';
  if (text.includes('{destination}')) vars.destination = s.passage?.to ?? '';
  if (text.includes('{weapon}')) vars.weapon = equippedWeapon(s)?.name ?? '';
  if (text.includes('{shipName}')) vars.shipName = ownedHull(s)?.name ?? '배';
  if (text.includes('{shipRepair}')) vars.shipRepair = repairWords(ownedHull(s));
  if (text.includes('{parent}')) vars.parent = livingContact(s, { who: 'parent' })?.relation ?? '';
  if (text.includes('{friend}')) vars.friend = livingContact(s, { relation: '어릴 적 동무' })?.name ?? '동무';
  if (text.includes('{crew}')) vars.crew = livingContact(s, { who: 'crew' })?.name ?? '동료';
  if (text.includes('{firstWatch}') || text.includes('{nextWatch}')) Object.assign(vars, watchMealWords(s));
  if (text.includes('{sibling}')) vars.sibling = livingContact(s, { who: 'sibling' })?.name ?? '형제';
  if (text.includes('{dojoPartner}')) vars.dojoPartner = livingContact(s, { who: 'sibling' })?.name
    ?? s.people.find(p => p.alive && p.kind === 'rival' && hasRelation(p, '어릴 적 맞수'))?.name ?? '함께 겨룰 상대';
  if (text.includes('{siblingMeetingName}') || text.includes('{siblingVisit}')) Object.assign(vars, siblingReunionWords(s));
  if (text.includes('{child}')) vars.child = livingContact(s, { who: 'child' })?.name ?? '자식';
  if (text.includes('{spouse}')) vars.spouse = livingContact(s, { who: 'spouse' })?.name ?? '짝';
  if (text.includes('{lifeGuardMethod}')) vars.lifeGuardMethod = lifeGuardMethod(s);
  if (text.includes('{lifeOutcome}')) vars.lifeOutcome = lifeOutcome(s);
  if (text.includes('{defeatedFoe}')) vars.defeatedFoe = FOES[s.defeatedFoe ?? '']?.name ?? '상대';
  if (text.includes('{disciple')) Object.assign(vars, discipleWords(s, discipleId));
  return fill(fillContacts(s, text), vars);
}

/** 이 갈래에서 오를 수 있는 가장 높은 단계. 스승이 없으면 noMasterCap, 스승의 갈래는 스승이 정한다 (돈으로 들인 스승은 paidCap까지) */
export function tierCap(s: Life5, b: Branch): number {
  // 입문 자체는 상한을 바꾸지 않는다. 실제 시련·실전을 거친 재회의 고급 수련만 극의까지 연다.
  if (isMartialBranch(b) && s.growth.styleBonds[focusedStyle(s, b)]?.refined) return V.growth.maxTier;
  const m = s.growth.master;
  const baseCap = s.flags.includes('focused_training') && isMartialBranch(b) ? Math.max(4, V.growth.noMasterCap) : V.growth.noMasterCap;
  if (!m || m.branch !== b) return baseCap;
  return Math.max(baseCap, Math.min(m.cap, m.paid ? V.growth.paidCap : V.growth.maxTier));
}

/** 숙련을 더한다. tierUp에 닿으면 단계를 하나 올리고 숙련을 0으로 돌린다. 상한에 닿으면 숙련은 tierUp에서 멈춘다. */
export function addMastery(s: Life5, b: Branch, add: number): void {
  const g = s.growth;
  addStyleMastery(s, b, add, tierCap(s, b));
  g.mastery[b] = Math.max(0, g.mastery[b] + add);
  if (g.mastery[b] < V.growth.tierUp) return;
  if (g.tier[b] >= tierCap(s, b)) { g.mastery[b] = V.growth.tierUp; return; }
  g.tier[b] += 1;
  g.mastery[b] = 0;
  logLine(s, `${BRANCH_NAMES[BRANCH_ID[b]]}이(가) ${g.tier[b]}단계에 올랐다.`, 'heavy', 'growth');
}

export function applyFx(s: Life5, fx: Fx[], discipleId?: string): void {
  const context = { discipleId };
  for (const e of fx) applyOne(s, e, context);
}

/** 제 배를 가진 해적과 칠무해는 선장이다 (선장 · 선원에 따라 다른 글이 온다: 표시 'captain') */
function captainByShip(s: Life5): void {
  const st = s.hero.standing;
  if ((st === 'warlord' || (st === 'pirate' && s.flags.includes('ship'))) && !s.flags.includes('captain')) s.flags.push('captain');
}

function applyOne(s: Life5, e: Fx, context: { discipleId?: string }): void {
  const h = s.hero;
  switch (e.op) {
    case 'nameShip': nameShip(s, e.name); return;
    case 'repairShip': repairShip(s, e.mark); return;
    case 'partShip': partShip(s, e.how); return;
    case 'watchMeal': recordWatchMeal(s, e.action); return;
    case 'recruitDefeated': {
      const foe = FOES[s.defeatedFoe ?? ''];
      if (foe) applyOne(s, { op: 'person', kind: 'crew', relation: '쓰러뜨린 적이었던 동료',
        name: foe.name, canon: foe.canon ?? undefined, reuseName: true, gender: foe.gender, age: foe.age, species: foe.species, faction: foe.faction }, context);
      return;
    }
    case 'disciple': {
      if (e.action === 'accept') { context.discipleId = acceptDisciple(s); return; }
      const d = s.disciples?.find(x => x.personId === context.discipleId);
      if (!d) return;
      if (e.action === 'train') d.trainedAt = s.age;
      if (e.action === 'sail') d.sailedAt = s.age;
      if (e.action === 'delay') d.readyAt = s.age + 1;
      if (e.action === 'resolve') {
        d.outcome = e.outcome;
        const p = s.people.find(x => x.id === d.personId);
        if (p) { p.faction = 'pirate'; p.kind = e.outcome === 'reported' ? 'enemy' : e.outcome === 'duel' ? 'rival' : 'ally'; }
      }
      return;
    }
    case 'beginStyle': {
      const contact = e.teacherRelation ? livingContact(s, { relation: e.teacherRelation }) : undefined;
      if (!e.teacherRelation || contact) beginStyle(s, e.style, contact);
      return;
    }
    case 'adoptStyle': adoptStyle(s, e.style); return;
    case 'refineStyle': refineStyle(s, e.style); return;
    case 'lifeMilitary':
      if (h.standing !== 'marine' && h.standing !== 'cp') applyOne(s, { op: 'standing', to: 'marine' }, context);
      return;
    case 'lifeEvent': recordLifeEvent(s, e.id, e.actor); return;
    case 'lifeWait': waitForLifeEvidence(s, e.ready, e.otherwise); return;
    case 'base':
      for (const k of e.key === 'all' ? STAT_KEYS : [e.key]) h.base[k] = Math.max(0, h.base[k] + e.add);
      return;
    case 'hp': {
      const before = h.hp;
      h.hp = clamp(h.hp + (e.add > 0 ? Math.round(e.add * traitFactor(s, 'healing') * recoveryMultiplier(s)) : e.add), 0, V.hp.max);
      if (h.hp > before && before < 70) recordTraitEvent(s, 'recover', '', s.traitSource ?? String(s.age));
      return;
    }
    case 'money': { // 탐욕이 깊으면 들어오는 돈이 불어난다 (나가는 돈은 그대로)
      const add = e.add > 0 && isDeep(s, 'greed') ? Math.round(e.add * V.value.greedMoney) : e.add;
      const cost = e.trade && add < 0 ? -tradeCost(s, -add) : add;
      h.money = Math.max(0, h.money + cost);
      if (e.trade && add < 0) recordTraitEvent(s, 'trade', '', s.traitSource ?? String(s.age));
      return;
    }
    case 'fame': h.fame = Math.max(0, h.fame + e.add); return;
    case 'escapeNotoriety': notePrisonEscape(s, e.riot ?? false); return;
    case 'rank': h.rank = Math.max(0, h.rank + e.add); return;
    // 처지가 실제로 바뀔 때만 연표에 짧게 남긴다 (한 줄 인생이 이 줄들을 잇는다)
    case 'standing':
      if (h.standing === e.to) return;
      const text = (h.standing === 'child' && STANDING_FROM_CHILD[e.to]) || STANDING_PHRASE[e.to];
      h.standing = e.to;
      s.standingSince = s.age;
      captainByShip(s);
      s.timeline.push({ age: s.age, text, standing: e.to });
      return;
    case 'kumaFight': startKumaFight(s); return;
    case 'trainingReturn': returnFromTraining(s); return;
    case 'move': requestArrival(s, e.island, e.sea, 'story'); return;
    case 'moveHome': requestArrival(s, h.town, HOMES[h.home].sea, 'home'); return;
    case 'flag':
      if (e.id === 'ship') takeShip(s, e.newHull);
      else if (!s.flags.includes(e.id)) s.flags.push(e.id);
      captainByShip(s);
      if (e.id === 'prime') enterPrime(s);
      return;
    case 'dream': setDream(s, e.id); return;
    case 'vowStart': beginVow(s, e.id); return;
    case 'vowDecline': declineVow(s); return;
    case 'vowFail': resolveVow(s, e.id, true); return;
    case 'vowResolve': {
      const result = resolveVow(s, e.id);
      if (result?.reward) {
        addMastery(s, result.reward, result.amount);
        s.growth.pref[result.reward] += result.amount * V.growth.pref.fromMastery;
      }
      return;
    }
    case 'parentMissing': parentMissing(s); return;
    case 'parentFound': parentFound(s); return;
    case 'welcomeSibling': welcomeSibling(s, e.action); return;
    case 'siblingReunion': resolveSiblingReunion(s, e.action); return;
    case 'sail': sailTo(s, e.island, e.route); return;
    case 'skiff': boardSkiff(s, e); return;
    case 'entry': resolveEntry(s, e); return;
    case 'entryPass': awardEntryPass(s, e.gate); return;
    case 'deepWater': deepWater(s); return;
    case 'buyWeapon': {
      const item = ITEM_BY_ID[e.id];
      if (item?.kind !== 'weapon' || !item.price || hasWeapon(s, item.id)) return;
      const cost = tradeCost(s, item.price);
      if (h.money < cost) return;
      h.money -= cost;
      receiveWeapon(s, item.id, 'purchase');
      recordTraitEvent(s, 'trade', '', s.traitSource ?? String(s.age));
      return;
    }
    case 'receiveWeapon': receiveWeapon(s, e.id, e.stow ? 'stow' : 'gift'); return;
    case 'giveAwayWeapon': giveAwayWeapon(s, e.id); return;
    case 'serviceWeapon': {
      const item = equippedWeapon(s);
      const branch = item && (['sword', 'polearm', 'blunt', 'gun', 'fist'] as const).find((b) => BRANCH_ID[b] === item.branch);
      if (branch && item?.weaponStyles?.includes(focusedStyle(s, branch))) addMastery(s, branch, 4);
      logLine(s, branch ? '장인이 무기를 손질하고 손잡이를 손에 맞춰 줬다.' : '공방 뒤뜰에서 장인들의 이야기를 들으며 한숨 돌렸다.', 'light');
      return;
    }
    case 'unflag':
      if (e.id === 'ship') loseShip(s);
      else s.flags = s.flags.filter(f => f !== e.id);
      return;
    case 'mark': {
      const got = addMark(s, e.id);
      const st = got ? STRENGTHS.find((x) => x.id === got) : undefined;
      if (st) logLine(s, `마음속에 「${st.name}」이(가) 자리 잡았다. ${st.text}.`, 'heavy', 'good');
      return;
    }
    case 'hardship': s.hardship = Math.max(0, s.hardship + e.add); return;
    case 'person': {
      const matches = e.canon ? s.people.filter(p => p.canon === e.canon)
        : e.reuseName && e.name ? s.people.filter(p => !p.canon &&
          (p.storyName === e.name || p.name === e.name && hasRelation(p, e.relation))) : [];
      // 예전 저장에 중복 인물이 남아 있다면 이미 동행 중인 그 사람을 우선한다.
      const existing = matches.find(p => p.alive && p.crew) ?? matches.find(p => p.alive) ?? matches[0];
      if (existing && !existing.alive) return;
      if (existing && e.reuseName && e.name) existing.storyName = e.name;
      if (existing && e.kind !== 'crew') {
        if (!existing.crew && (e.kind === 'enemy' || e.kind === 'rival')) {
          existing.aliases = [...new Set([...(existing.aliases ?? []), existing.relation])];
          existing.relation = e.relation;
          existing.kind = e.kind;
        } else {
          existing.aliases = [...new Set([...(existing.aliases ?? []), e.relation])];
        }
        return;
      }
      if (existing?.crew) {
        existing.aliases = [...new Set([...(existing.aliases ?? []), e.relation])];
        if (!e.years) delete existing.tempUntil;
        return;
      }
      const r = rngOf(s.rng);
      const c = e.canon ? CANON[e.canon] : undefined;
      const gender = existing?.gender ?? c?.gender ?? e.gender ?? pick(r, ['m', 'f'] as const);
      const localCompanion = e.relation === '어릴 적 맞수' || e.relation === '스승';
      const natives = HOMES[h.home].species;
      const p: Person = existing ?? {
        id: `p${s.seq++}`, name: c?.name ?? e.name ?? npcName(s, r, gender), gender, age: personAge(s, e),
        ...(e.reuseName && !e.canon && e.name ? { storyName: e.name } : {}),
        kind: e.kind, relation: e.relation, canon: e.canon ?? null,
        bond: V.person.bond, faction: c?.faction ?? e.faction ?? 'civil', species: c?.species ?? e.species ?? (localCompanion ? (natives.includes(h.species) ? h.species : natives[0]) : 'human'), alive: true,
      };
      // 동료는 싸움에 함께 나선다: v4 동료와 같은 꼴의 싸움 정보를 지금 바다에 맞춰 준다
      if (e.kind === 'crew') {
        const { role, maxLevel } = V.person.crew;
        const traits = initializeTraits(s);
        const identity = e.canon ?? e.name ?? e.relation;
        const known = traits.crewSeen.includes(identity);
        if (!known) traits.crewSeen.push(identity);
        const bonus = !known && !e.years && hasTrait(s, 'charisma') ? 2 : 0;
        const level = Math.min(maxLevel, (e.level ?? V.person.crew.level) + bonus);
        if (existing) {
          p.aliases = [...new Set([...(p.aliases ?? []), p.relation])];
          p.relation = e.relation;
          p.kind = 'crew';
        }
        if (e.years) p.tempUntil = s.age + e.years;
        const power = p.canon === 'bellamy' ? V.person.crew.bellamyPower : crewPowerFor(SEA_BY_ID[h.sea].stage, level);
        p.crew = { role: e.role ?? role, level, power, skills: [], injuredMonths: 0,
          ...((e.role ?? role) === 'medic' ? { medicalSkill: e.medicalSkill ?? 50 } : {}) };
      }
      if (!existing) s.people.push(p);
      if (p.crew && !e.years) recordTraitEvent(s, 'crew', '', e.canon ?? e.name ?? e.relation);
      return;
    }
    case 'personChange': {
      const p = livingContact(s, e);
      if (!p) return;
      if (e.alias && e.alias !== p.relation) p.aliases = [...new Set([...(p.aliases ?? []), e.alias])];
      if (e.rename && e.rename !== p.relation) {
        p.aliases = [...new Set([...(p.aliases ?? []), p.relation])];
        p.relation = e.rename;
      }
      if (e.bond) p.bond = clamp(p.bond + e.bond, 0, V.person.bondMax);
      if (e.kind) {
        p.kind = e.kind;
        if (e.kind === 'crew' && !p.crew) {
          const { role, level } = V.person.crew;
          p.crew = { role, level, power: crewPowerFor(SEA_BY_ID[h.sea].stage, level), skills: [], injuredMonths: 0 };
        } else if (e.kind !== 'crew') {
          delete p.crew;
          delete p.tempUntil;
        }
      }
      return;
    }
    case 'crewTrain': {
      const stage = SEA_BY_ID[h.sea].stage;
      for (const p of s.people) {
        if (!p.alive || !p.crew) continue;
        p.crew.level = Math.min(V.person.crew.maxLevel, p.crew.level + e.add);
        p.crew.power = Math.max(p.crew.power, crewPowerFor(stage, p.crew.level));
      }
      return;
    }
    case 'partCrew':
      for (const p of s.people) if (p.alive && p.crew && p.relation.startsWith(e.prefix)) { delete p.crew; p.kind = 'ally'; }
      return;
    case 'rememberChildhood': rememberChildhood(s, e.storyId, e.outcome); return;
    case 'separateSpouse': separateSpouse(s); return;
    case 'resumeVoyage': resumeVoyage(s, e.stores); return;
    case 'rivalDuel': startRivalDuel(s); return;
    case 'recruitRival': {
      const rival = rivalPerson(s);
      if (!rival?.alive || rival.kind === 'crew' || h.standing === 'marine' || !s.flags.includes('rival:free')) return;
      rival.kind = 'crew';
      rival.crew = { role: rivalCrewRole(s), level: V.person.crew.level, power: rivalCombatStat(rival), skills: [], injuredMonths: 0 };
      if (rival.crew.role === 'medic') rival.crew.medicalSkill = 50;
      recordTraitEvent(s, 'crew', '', rival.id);
      s.flags = s.flags.filter(id => id !== 'rival:free');
      s.timeline.push({ age: s.age, text: fillText(s, '어릴 적 맞수 {rival}과(와) 동료가 되었다.') });
      return;
    }
    case 'losePerson': {
      const p = livingContact(s, e);
      if (!p) return;
      markPersonDead(s, p);
      recordTraitEvent(s, 'loss', '', p.id);
      s.hardship += V.hardship.loss;
      return;
    }
    case 'queue': if (!s.queue.includes(e.turning)) s.queue.push(e.turning); return;
    case 'log': logLine(s, fillText(s, e.text, context.discipleId), e.weight); return;
    case 'timeline': s.timeline.push({ age: s.age, text: fillText(s, e.text, context.discipleId), ...(e.canon ? { canon: e.canon } : {}) }); return;
    case 'die':
      if (!h.alive) return;
      h.alive = false;
      if (s.vows?.active) resolveVow(s, s.vows.active.id);
      s.ended = { cause: e.cause, age: s.age };
      s.pending = { kind: 'ending', cause: e.cause };
      return;
    case 'chance':
      applyFx(s, chance(rngOf(s.rng), e.skillCheck && e.p > 0 && e.p < 1 ? clamp(e.p + traitFactor(s, 'chance'), 0, 1) : e.p) ? e.then : (e.else ?? []), context.discipleId);
      return;
    case 'mastery': {
      const gain = e.add > 0 ? e.add * traitMastery(s, e.branch) * growthMultiplier(s, e.branch) : e.add;
      addMastery(s, e.branch, gain);
      if (gain > 0) s.growth.pref[e.branch] += gain * V.growth.pref.fromMastery;
      return;
    }
    case 'pref': s.growth.pref[e.branch] = Math.max(0, s.growth.pref[e.branch] + e.add); return;
    // 단계를 그 자리까지 끌어올린다. 이미 더 높으면 그대로 둔다
    case 'traitAwaken': {
      if (s.growth.tier[e.branch] > 0 || (e.branch === 'conqueror' && !hasTrait(s, 'conqueror'))) return;
      const success = e.branch === 'conqueror' || chance(rngOf(s.rng), .4 + (hasTrait(s, 'hakiTalent') ? .25 : 0));
      if (success) {
        s.growth.tier[e.branch] = e.branch === 'conqueror' ? 2 : 1;
        logLine(s, '배운 감각이 힘으로 이어졌다. 새로운 패기가 열렸다.', 'heavy', 'growth');
      } else logLine(s, '잠깐 스친 감각을 놓쳤다. 훈련을 이어가면 다음 해에 한 번 더 시도할 수 있다.', 'light');
      return;
    }
    case 'tier': {
      s.growth.tier[e.branch] = Math.max(s.growth.tier[e.branch], clamp(e.to, 0, V.growth.maxTier));
      if (isMartialBranch(e.branch)) {
        const id = focusedStyle(s, e.branch);
        s.growth.styleMastery[id] = Math.max(s.growth.styleMastery[id] ?? 0, clamp(e.to, 0, V.growth.maxTier) * V.growth.tierUp);
      }
      return;
    }
    case 'master':
      s.growth.master = { name: e.name, branch: e.branch, cap: e.cap, yearsLeft: e.years, paid: e.paid };
      // 스승을 들이면 그 갈래가 앞선다. 길이 바뀌면 year.ts의 notePath가 큰 일로 남긴다
      s.growth.pref[e.branch] = Math.max(...Object.values(s.growth.pref)) + V.growth.pref.masterLead;
      return;
    case 'reveal': revealSurname(s); return;
    // 흉터는 낫지 않는다 (monthsLeft를 줄이지 않는다)
    case 'injury': {
      if (e.severity === 'scar') { h.injuries.push({ severity: e.severity, monthsLeft: 0, ...(e.part ? { part: e.part } : {}), ...(e.kind ? { kind: e.kind } : {}) }); return; }
      const parts = V.injury.months[e.severity] * traitFactor(s, 'injury') / V.injury.monthsPerPart;
      const whole = Math.floor(parts);
      const fraction = parts - whole;
      const duration = (whole + (fraction > 0 && chance(rngOf(s.rng), fraction) ? 1 : 0)) * V.injury.monthsPerPart;
      if (duration > 0) h.injuries.push({ severity: e.severity, monthsLeft: duration, ...(e.part ? { part: e.part } : {}), ...(e.kind ? { kind: e.kind } : {}) });
      return;
    }
    case 'fight': askFight(s, e.foe, e.lethal, e.forced, e.next, e.atSea); return;
    case 'loseLimb': loseLimb(s, e.limb, rngOf(s.rng)); return;
    case 'prosthetic': fitProsthetic(s, e.grade); return;
    // 이미 앓는 병이 있으면 새로 걸리지 않는다. 진행과 치료는 risk.ts의 partRisks가 맡는다
    case 'illness': if (!h.illness) h.illness = { id: e.id, stage: 1, months: 0 }; return;
    case 'wealth': h.wealth = e.to; return;
    case 'eatFruit': eatFruit(s, e.id); return;
  }
}

/** 새로 만나는 사람의 나이: 원작 인물은 원작의 나이 차, 적힌 나이, 주인공보다 n살 위/아래, 없으면 주인공과 같은 나이 */
function personAge(s: Life5, e: Extract<Fx, { op: 'person' }>): number {
  if (e.canon && CANON[e.canon]) return canonAge(e.canon, s.age);
  const a = e.age;
  if (a === undefined) return s.age;
  if (typeof a === 'number') return a;
  return 'older' in a ? s.age + a.older : Math.max(0, s.age - a.younger);
}

const SMILE_ISLANDS = new Set(['펑크 해저드', '드레스로자', '와노쿠니', '하나노미야코', '쿠리', '에비스 마을']);
const SUCCESSFUL_SMILES = SMILE_FRUITS.filter((f) => f.id !== 'smile_failed');

/** 악마의 열매를 먹는다. 관련 섬에서는 낮은 확률로 스마일을 만난다. 이미 능력자면 아무 일도 없다. */
function eatFruit(s: Life5, id: string): void {
  if (s.hero.fruit) return;
  const W = V.fruit.gradeWeight;
  const r = rngOf(s.rng);
  const f = id !== 'random' ? FRUIT_BY_ID[id]
    : SMILE_ISLANDS.has(s.hero.island) && r() < V.fruit.smileChance
      ? r() < V.fruit.smileSuccessChance ? pick(r, SUCCESSFUL_SMILES) : FRUIT_BY_ID.smile_failed
      : weighted(r, NATURAL_FRUITS, (x) => W[x.grade]);
  if (!f) return;
  s.hero.fruit = { id: f.id, eatenAt: s.age };
  s.growth.tier.fruit = f.id === 'smile_failed' ? 0 : Math.max(s.growth.tier.fruit, V.fruit.startTier);
  logLine(s, f.id === 'smile_failed'
    ? '스마일을 삼켰지만 능력은 깨어나지 않았다. 웃음만 남았고 다시는 헤엄칠 수 없다.'
    : `${f.name}을(를) 삼켰다. 몸속에서 낯선 힘이 꿈틀거린다. 다시는 헤엄칠 수 없다.`, 'heavy', 'growth');
}
