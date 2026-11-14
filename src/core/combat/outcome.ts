// 전투 결과를 상태에 적용한다 (docs/02_설계/04_전투.md 7장).
import { B } from '../../data/balance';
import { BOSS_BY_ID } from '../../data/bosses';
import { MISSION_BY_ID } from '../../data/missions';
import { SEA_BY_ID, nextSea } from '../../data/seas';
import { applyEffects, crewCapacity, kill, rankName } from '../effects';
import { battleMastery, openGate } from '../growth/growth';
import { getSkill } from '../growth/skillbook';
import { chance, rngOf } from '../rng';
import type { BattleState, Encounter, LifeState, Risk, StatKey } from '../types';
import { absMonth, log, timeline } from '../util';
import { enterSea, maybeRevealBoss, missionTitle } from '../world/world';
import { SHIP_BY_ID } from '../../data/seas';

const C = B.combat;

function injure(s: LifeState, table: { light?: number; heavy?: number; scar?: number }, r: () => number) {
  const roll = r();
  let acc = 0;
  for (const sev of ['scar', 'heavy', 'light'] as const) {
    acc += table[sev] ?? 0;
    if (roll < acc) { applyEffects(s, [{ op: 'injury', severity: sev }]); return; }
  }
}

function summarize(b: BattleState) {
  return Object.entries(b.usage)
    .map(([skill, u]) => ({ skill, name: skill === 'basic' ? '기본 공격' : getSkill(skill)?.name ?? skill, uses: u.uses, damage: u.damage }))
    .sort((a, z) => z.damage - a.damage);
}

/** 강적전 · 평소 교전의 결과 적용. 평소 교전이면 routine=true */
export function applyBattle(s: LifeState, enc: Encounter, b: BattleState, risk: Risk) {
  const r = rngOf(s.rng);
  const res = b.result ?? 'lose';
  const won = res === 'win';
  const routine = enc.source === 'routine';
  battleMastery(s, b.usage, enc.elite, won);

  if (routine) {
    if (won) {
      s.stats.routineWins++;
      if (s.hero.route === 'pirate' || s.hero.route === 'revolution') {
        const [lo, hi] = B.money.pirateLoot;
        s.hero.money += Math.round((lo + (hi - lo) * r()) * s.world.stage);
      }
      s.hero.fame += s.world.stage;
      log(s, `${enc.enemy.name}을(를) 쓰러뜨렸다.`, 'battle');
    } else {
      s.stats.routineLosses++;
      log(s, `${enc.enemy.name}에게 밀려 물러났다.`, 'battle');
      if (chance(r, C.routine.loseLight)) applyEffects(s, [{ op: 'injury', severity: 'light' }]);
    }
    return;
  }

  s.lastBattle = { name: enc.enemy.name, result: res, summary: summarize(b) };
  const heroUnit = b.units.find((u) => u.hero)!;
  s.hero.hp = Math.max(10, Math.round(100 * heroUnit.hp / heroUnit.maxHp * 0.5 + 50 * (won ? 1 : 0.5)));

  // 무거운 부상을 안고 싸웠으면 후유증
  if (s.hero.injuries.some((i) => i.severity === 'heavy') && chance(r, B.body.injury.heavyToScarIfFight)) {
    s.hero.injuries = s.hero.injuries.filter((i) => i.severity !== 'heavy');
    applyEffects(s, [{ op: 'injury', severity: 'scar' }]);
  }

  // 동료의 부상 · 죽음
  for (const u of b.units) {
    if (u.side !== 'L' || u.hero || u.hp > 0 || !u.personId) continue;
    const p = s.people.find((x) => x.id === u.personId);
    if (!p || !p.crew) continue;
    if (risk === 'lethal' && !enc.spar && chance(r, C.crewDeathLethal)) {
      p.alive = false;
      s.loadout.crew = s.loadout.crew.filter((c) => c.personId !== p.id);
      log(s, `${p.name}이(가) 전투에서 목숨을 잃었다…`, 'danger');
      timeline(s, `동료 ${p.name}을(를) 잃었다`);
    } else {
      p.crew.injuredMonths = C.crewInjuryMonths;
      log(s, `${p.name}이(가) 다쳐 몇 달 쉬어야 한다.`, 'danger');
    }
  }

  const label = enc.source === 'boss' ? '해역 보스' : enc.spar ? '대련' : '강적';
  if (won) {
    s.stats.eliteWins++;
    log(s, `${label} ${enc.enemy.name}을(를) 쓰러뜨렸다!`, 'good');
    if (!enc.spar) timeline(s, `${enc.enemy.title ? enc.enemy.title + ' ' : ''}${enc.enemy.name}을(를) 쓰러뜨렸다`);
    if (!enc.spar && chance(r, C.result.win.light)) applyEffects(s, [{ op: 'injury', severity: 'light' }]);
    // 강한 상대일수록 능력치가 오른다
    const foe = enc.enemy.base;
    const foeAvg = (foe.str + foe.spd + foe.vit) / 3;
    const mine = (s.hero.base.str + s.hero.base.spd + s.hero.base.vit) / 3;
    const gain = Math.max(0.3, Math.min(3, B.growth.eliteWinStat * foeAvg / Math.max(1, mine) * (enc.source === 'boss' ? 3 : 1)));
    for (const k of ['str', 'spd', 'vit', 'wil'] as StatKey[]) s.hero.base[k] += gain;
    if (!enc.spar) s.hero.fame += Math.round(foeAvg * (enc.source === 'boss' ? 2 : 0.6));
    if (enc.spar) for (const p of s.people) if (p.kind === 'rival' && p.alive) p.bond = Math.min(100, p.bond + 5);
    if (enc.reward) applyEffects(s, enc.reward);
  } else if (res === 'retreat') {
    log(s, `${enc.enemy.name}에게서 물러났다.`, 'battle');
    if (!enc.spar && chance(r, C.result.retreat.light)) applyEffects(s, [{ op: 'injury', severity: 'light' }]);
  } else {
    s.stats.eliteLosses++;
    log(s, `${label} ${enc.enemy.name}에게 졌다.`, 'danger');
    if (!enc.spar) {
      timeline(s, `${enc.enemy.name}에게 졌다`);
      injure(s, C.result.lose, r);
      const lost = Math.round(Math.max(0, s.hero.money) * B.money.loseMoneyPct);
      if (lost > 0) { s.hero.money -= lost; log(s, `${lost.toLocaleString('ko-KR')} 베리를 잃었다.`, 'money'); }
      if (enc.lethal) {
        const p = C.deathP[risk] * Math.max(0, 1 - s.hero.base.luk * C.deathLukReduce);
        if (chance(r, p)) {
          kill(s, `${enc.enemy.name}과(와)의 싸움`);
          return;
        }
        if (p > 0) {
          s.stats.nearDeaths++;
          log(s, '죽음의 문턱에서 살아 돌아왔다.', 'danger');
          if (chance(r, C.nearDeathGateP)) {
            const g = ['haki.observation.awaken', 'haki.armament.awaken', ...(s.hero.traits.includes('conqueror') ? ['haki.conqueror.awaken'] : [])]
              .find((x) => !s.growth.gates.includes(x));
            if (g) openGate(s, g);
          }
        }
      }
      // 자연계에게 무장색 없이 졌다면 길을 다시 생각하게 된다
      if (enc.enemy.fruitClass === 'logia' && !s.growth.gates.includes('haki.armament.awaken')) {
        if (!s.choice.flags.includes('rethink_ready')) s.choice.flags.push('rethink_ready');
        if (!s.choice.flags.includes('need_armament')) s.choice.flags.push('need_armament');
      }
    } else {
      s.hero.base.wil += 0.5;
    }
  }

  // 출처별 후속
  if (enc.source === 'mission' && enc.missionIdx !== undefined) {
    const mp = s.world.missions[enc.missionIdx];
    if (mp) {
      if (won) {
        mp.state = 'done';
        applyEffects(s, MISSION_BY_ID[mp.id].reward);
        log(s, `임무 「${missionTitle(mp)}」 완료!`, 'good');
        maybeRevealBoss(s);
      } else {
        mp.state = 'failed';
        s.world.refillAt = absMonth(s) + B.world.refillMonths;
        log(s, `임무 「${missionTitle(mp)}」 실패.`, 'danger');
      }
    }
  }
  if (enc.source === 'boss') {
    s.world.boss.attempts += 1;
    if (won) bossDefeated(s);
  }
  if (enc.source === 'choice' && s.choice.flags.includes('promo_mission')) {
    s.choice.flags = s.choice.flags.filter((f) => f !== 'promo_mission');
    if (won && s.hero.route === 'marine') { s.hero.rank += 1; log(s, `${rankName(s)}(으)로 진급했다!`, 'good'); }
  }
}

function bossDefeated(s: LifeState) {
  const b = BOSS_BY_ID[s.world.boss.id];
  s.world.boss.state = 'defeated';
  s.world.defeated.push(b.id);
  s.metaEvents.push({ k: 'defeated', id: b.id, where: s.world.seaId });
  applyEffects(s, b.drops);
  s.hero.rank += B.world.rankFromBoss;
  log(s, `${rankName(s)}(으)로 이름이 올랐다.`, 'good');
  s.world.news.push({ year: s.time.year, text: `${s.hero.surname} ${s.hero.name}, ${b.name}을(를) 쓰러뜨리다!` });
  if (s.world.stage === 6) {
    s.world.apex = true;
    if (!s.choice.flags.includes('apex')) s.choice.flags.push('apex');
    const title = s.hero.route === 'marine' ? '해군 원수' : s.hero.route === 'revolution' ? '혁명의 영웅' : '해적왕';
    log(s, `바다의 정점에 섰다. 사람들은 이제 ${title}라 부른다!`, 'good');
    timeline(s, `${title}이(가) 되었다`);
    return;
  }
  tryAdvanceSea(s);
}

/** 다음 해역으로 넘어간다. 배가 모자라면 배를 사는 선택이 뜬다 */
export function tryAdvanceSea(s: LifeState): boolean {
  if (s.world.boss.state !== 'defeated') return false;
  const next = nextSea(s.world.seaId);
  if (!next) return false;
  const need = SEA_BY_ID[next].shipRequired;
  const tier = s.world.ship ? SHIP_BY_ID[s.world.ship].tier : -1;
  if (s.hero.route !== 'marine' && tier < need) {
    if (!s.choice.flags.includes('need_ship')) {
      s.choice.flags.push('need_ship');
      log(s, `${SEA_BY_ID[next].name}(으)로 가려면 더 좋은 배가 필요하다.`, 'world');
    }
    return false;
  }
  s.choice.flags = s.choice.flags.filter((f) => f !== 'need_ship');
  enterSea(s, next);
  log(s, `${SEA_BY_ID[next].name}에 들어섰다!`, 'world');
  timeline(s, `${SEA_BY_ID[next].name}에 들어섰다`);
  if (s.world.ship && crewCapacity(s) < s.loadout.crew.length) s.loadout.crew = s.loadout.crew.slice(0, crewCapacity(s));
  return true;
}
