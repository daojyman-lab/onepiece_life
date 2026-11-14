// 한 달의 처리 (docs/02_설계/03_진행과_선택.md 3장).
import { B } from '../../data/balance';
import { MISSION_BY_ID } from '../../data/missions';
import { maybeRaiseChoice } from '../choice/choice';
import { createBattle, defaultAssign, winRate } from '../combat/battle';
import { runBattle } from '../combat/engine';
import { applyBattle, tryAdvanceSea } from '../combat/outcome';
import { applyEffects, kill } from '../effects';
import { monthlyGrowth } from '../growth/growth';
import { crewOf } from '../people';
import { chance, int, pick, rngOf } from '../rng';
import type { LifeState, StatKey } from '../types';
import { absMonth, fill, log } from '../util';
import { genEnemy, missionTitle, refillFailed, resolveEnemy, sea } from '../world/world';
import { monthlyLifeEvent } from './lifeEvents';
import type { Encounter } from '../types';

const BD = B.body;

function calendar(s: LifeState): { newYear: boolean; birthday: boolean } {
  s.time.month += 1;
  let newYear = false;
  if (s.time.month > 12) { s.time.month = 1; s.time.year += 1; newYear = true; }
  const birthday = s.time.month === s.hero.birth.month;
  if (birthday) {
    s.hero.age += 1;
    for (const p of s.people) if (p.alive) p.age += 1;
  }
  return { newYear, birthday };
}

function missions(s: LifeState) {
  if (s.hero.route === 'none' || s.hero.age < B.world.routeAge || s.pending) return;
  const now = absMonth(s);
  if (s.world.refillAt !== null && now >= s.world.refillAt) { refillFailed(s); s.world.refillAt = null; }
  // 무거운 부상 중에는 임무가 멈춘다
  if (s.hero.injuries.some((i) => i.severity === 'heavy')) return;
  let idx = s.world.missions.findIndex((m) => m.state === 'active');
  if (idx < 0) {
    idx = s.world.missions.findIndex((m) => m.state === 'open');
    if (idx < 0) return;
    s.world.missions[idx].state = 'active';
    log(s, `임무 시작: 「${missionTitle(s.world.missions[idx])}」`, 'world');
  }
  const mp = s.world.missions[idx];
  const def = MISSION_BY_ID[mp.id];
  const step = def.steps[mp.step];
  if (!step) return;
  const v = { port: mp.port };
  if (step.kind === 'story') {
    mp.monthsInStep += 1;
    if (mp.monthsInStep >= step.months) {
      log(s, fill(step.text, v), 'world');
      applyEffects(s, step.effects);
      mp.step += 1;
      mp.monthsInStep = 0;
    }
    return;
  }
  // 강적전 단계
  log(s, fill(step.text, v), 'battle');
  const enc: Encounter = { source: 'mission', enemy: resolveEnemy(s, step.enemy), elite: step.elite, lethal: true, spar: false, atSea: !!step.atSea, missionIdx: idx };
  // 넉넉히 이길 상대면 멈추지 않고 저장된 편성으로 싸운다. 위험한 상대만 준비 화면을 띄운다
  const assign = defaultAssign(s, enc, s.loadout);
  if (winRate(s, enc, s.loadout, assign, B.autoElite.runs) >= B.autoElite.minRate) {
    const r = rngOf(s.rng);
    const b = createBattle(s, enc, s.loadout, assign, int(r, 1, 2 ** 30));
    runBattle(b, true);
    s.stats.autoElite = (s.stats.autoElite ?? 0) + 1;
    applyBattle(s, enc, b, 'safe');
    return;
  }
  s.pending = { kind: 'prep', encounter: enc };
}

function routineBattle(s: LifeState) {
  if (s.pending || s.hero.age < 12) return;
  const r = rngOf(s.rng);
  const base = B.combat.routine.chance[s.hero.route];
  const p = base + (s.world.missions.some((m) => m.state === 'active') ? B.combat.routine.missionAdd : 0);
  if (!chance(r, p)) return;
  const enemy = genEnemy(s, 'grunt', r);
  const enc = { source: 'routine' as const, enemy, elite: false, lethal: false, spar: false, atSea: false };
  const b = createBattle(s, enc, s.loadout, defaultAssign(s, enc, s.loadout), int(r, 1, 2 ** 30));
  runBattle(b, true);
  applyBattle(s, enc, b, 'safe');
}

function body(s: LifeState, newYear: boolean, birthday: boolean) {
  const h = s.hero;
  const r = rngOf(s.rng);
  const hasMedic = crewOf(s).some((p) => p.crew?.role === 'medic');
  const hasCook = crewOf(s).some((p) => p.crew?.role === 'cook');
  // 부상
  for (const inj of h.injuries) if (inj.monthsLeft > 0) inj.monthsLeft -= 1;
  const healed = h.injuries.filter((i) => i.severity !== 'scar' && i.monthsLeft <= 0);
  if (healed.length) { h.injuries = h.injuries.filter((i) => !healed.includes(i)); log(s, '상처가 아물었다.', 'info'); }
  for (const p of crewOf(s)) if (p.crew && p.crew.injuredMonths > 0) p.crew.injuredMonths -= 1;
  // 스스로 치료
  const stage = s.world.stage;
  for (const inj of h.injuries) {
    if (inj.severity !== 'heavy' || inj.treated) continue;
    const cost = B.money.treatInjury.heavy * stage * (hasMedic ? BD.illness.medicMult : 1);
    if (h.money >= cost) {
      h.money -= cost; inj.treated = true; inj.monthsLeft = Math.ceil(inj.monthsLeft * BD.injury.treatMult);
      log(s, `치료비 ${Math.round(cost).toLocaleString('ko-KR')} 베리를 내고 상처를 치료했다.`, 'money');
    }
  }
  // 질병
  if (h.illness) {
    h.illness.months += 1;
    const cost = B.money.treatIllness * stage * (hasMedic ? BD.illness.medicMult : 1);
    if (h.money >= cost) {
      h.money -= cost; h.illness = null;
      log(s, `치료비 ${Math.round(cost).toLocaleString('ko-KR')} 베리를 내고 병을 고쳤다.`, 'money');
    } else if (h.illness.months % BD.illness.worsenEvery === 0 && h.illness.stage < 3) {
      h.illness.stage = (h.illness.stage + 1) as 1 | 2 | 3;
      log(s, h.illness.stage === 3 ? '병이 위중해졌다. 이대로면 죽는다.' : '병이 깊어졌다. 성장이 멈췄다.', 'danger');
    }
    if (h.illness && h.illness.stage === 3 && chance(r, BD.illness.stage3DeathMonthly)) { kill(s, '병'); return; }
  } else if (h.age >= 10) {
    let yearly = BD.illness.yearly + Math.max(0, h.age - BD.illness.ageFrom) * BD.illness.agePerYear;
    if (h.injuries.some((i) => i.severity === 'heavy')) yearly += BD.illness.heavyInjuryAdd;
    if (hasMedic) yearly *= BD.illness.medicMult;
    if (chance(r, yearly / 12)) applyEffects(s, [{ op: 'illness', id: pick(r, ['열병', '괴혈병', '풍토병', '폐병']) }]);
  }
  // 노화
  if (birthday && h.age >= BD.aging.from1) {
    const rate = h.age >= BD.aging.from2 ? BD.aging.rate2 : BD.aging.rate1;
    for (const k of ['str', 'spd', 'vit'] as StatKey[]) h.base[k] *= 1 - rate;
  }
  // 건강
  if (!h.illness && !h.injuries.some((i) => i.severity === 'heavy')) h.hp = Math.min(100, h.hp + BD.healthRecover * (hasCook ? 1.5 : 1));
  else if (h.illness) h.hp = Math.max(5, h.hp - 3 * h.illness.stage);
  // 노환
  if (newYear && h.age >= BD.oldAge.from) {
    const p = (h.age - BD.oldAge.from + 1) ** 2 * BD.oldAge.k;
    if (chance(r, p)) kill(s, '노환');
  }
}

function money(s: LifeState) {
  const h = s.hero;
  if (h.age < 16) return;
  const hasCook = crewOf(s).some((p) => p.crew?.role === 'cook');
  h.money -= B.money.living * s.world.stage * (hasCook ? 0.5 : 1);
  if (h.route === 'marine') h.money += B.money.marineSalary * (h.rank + 1) * s.world.stage;
  else if (h.route !== 'none') h.money += B.money.pirateIncome * s.world.stage * (1 + Math.min(1, h.fame / 2000));
  if (h.money < -50000) h.money = -50000;
}

function yearly(s: LifeState) {
  const r = rngOf(s.rng);
  s.choice.thisYear = 0;
  s.choice.pauses = 0;
  // 주력을 3년 넘게 이어 왔으면 갈림길이 후보가 된다
  if (s.growth.focus && s.hero.age - s.growth.focusSince >= B.choice.retrainYears && !s.choice.flags.includes('rethink_ready')) {
    s.choice.flags.push('rethink_ready');
  }
  // 동료 레벨
  for (const p of crewOf(s)) {
    if (!p.crew || p.crew.level >= B.crew.maxLevel) continue;
    p.crew.level += 1;
    p.crew.power += B.crew.powerPerLevel * 0.5 + s.world.stage;
  }
  // 라이벌도 자란다
  for (const p of s.people) if (p.kind === 'rival' && p.alive && p.power) p.power = Math.round(p.power * (1.04 + r() * 0.05));
  // 뉴스
  const sx = sea(s);
  const news = [
    `${pick(r, sx.ports)}에서 대형 해적단이 해군과 맞붙었다.`,
    `해군 본부가 ${sx.name}에 지원 함대를 보냈다.`,
    `${pick(r, sx.ports)}에 정체 모를 악마의 열매가 나돈다는 소문.`,
    '세계 정부가 새 현상금 목록을 발표했다.',
    '혁명군이 또 한 나라를 해방했다.',
  ];
  const text = pick(r, news);
  s.world.news.push({ year: s.time.year, text });
  if (s.world.news.length > 30) s.world.news.splice(0, s.world.news.length - 30);
  log(s, `[항구 통신] ${text}`, 'world');
}

/** 한 달이 흐른다. pending이 있으면 아무것도 하지 않는다 */
export function tick(s: LifeState): boolean {
  if (s.pending || !s.hero.alive) return false;
  const { newYear, birthday } = calendar(s);
  monthlyGrowth(s);
  missions(s);
  routineBattle(s);
  body(s, newYear, birthday);
  if (!s.hero.alive) return true;
  money(s);
  monthlyLifeEvent(s);
  if (s.choice.flags.includes('need_ship')) tryAdvanceSea(s);
  if (!s.pending) maybeRaiseChoice(s);
  if (newYear) yearly(s);
  return true;
}
