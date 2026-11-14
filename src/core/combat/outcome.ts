// 전투 결과를 상태에 적용한다 (docs/02_설계/04_전투.md 7장).
import { B } from '../../data/balance';
import { BOSS_BY_ID } from '../../data/bosses';
import { MISSION_BY_ID } from '../../data/missions';
import { SIDE_BY_ID } from '../../data/sideStories';
import { FRUIT_PASSIVES } from '../../data/passives';
import { SEA_BY_ID, nextSea } from '../../data/seas';
import { applyEffects, crewCapacity, kill, promote } from '../effects';
import { battleMastery, openGate } from '../growth/growth';
import { getSkill } from '../growth/skillbook';
import { chance, pick, rngOf, type Rng } from '../rng';
import { ITEMS } from '../../data/items';
import type { BattleState, Encounter, EnemySpec, LifeState, Risk, StatKey } from '../types';
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

// ---------------------------------------------------------------- 쓰러뜨린 상대 설명
const STAT_KO: Record<StatKey, string> = { str: '힘', spd: '속도', vit: '체력', wil: '정신', int: '지능', luk: '운' };
const fmtB = (n: number) => n >= 1e8 ? `${(n / 1e8).toFixed(n % 1e8 ? 1 : 0)}억 베리` : `${Math.round(n / 1e4).toLocaleString('ko-KR')}만 베리`;

/** 상대의 이름값: 해적이면 현상금, 해군이면 계급, 그 밖엔 직함 */
export function renownOf(e: EnemySpec): string {
  if (e.form === 'seaking') return '바다의 왕';
  const avg = (e.base.str + e.base.spd + e.base.vit) / 3;
  if (e.faction === 'pirate' || e.faction === 'rev') return `현상금 ${fmtB(Math.max(1, Math.round(avg * avg * 400 / 1e4)) * 1e4)}`;
  return e.title ?? '무명';
}
/** 이름 뒤 괄호: 직함과 같으면 생략 */
const renownTag = (e: EnemySpec) => { const r = renownOf(e); return r === e.title ? '' : `(${r})`; };

/** 왜 싸웠는가 (평소 교전) */
function whyFight(s: LifeState, e: EnemySpec, r: Rng): string {
  if (e.form === 'seaking') return pick(r, ['배 밑에서 솟구쳐 뱃전을 들이받았다', '그물을 끊고 배를 덮쳐 왔다']);
  const route = s.hero.route;
  if (route === 'marine') {
    if (e.faction === 'pirate') return pick(r, ['마을을 털던 해적을 잡으러 나섰다', '상선을 노리던 해적선을 순찰 중에 붙잡았다', '항구에서 행패를 부리던 해적을 단속했다', '현상 수배서의 얼굴을 술집에서 알아보았다']);
    return pick(r, ['밀수꾼을 덮쳤다', '해군을 사칭하던 무법자를 붙잡았다']);
  }
  if (e.faction === 'marine') return pick(r, ['해군 순찰대가 길을 막아섰다', '항구 검문에서 정체가 들통났다', '현상금을 노린 해군 분대가 쫓아왔다']);
  if (e.faction === 'pirate') return pick(r, ['영역 다툼이 붙었다', '우리 배의 짐을 노리고 먼저 시비를 걸어왔다', '술집에서 어깨가 부딪혀 싸움이 났다', '마을 사람들을 괴롭히고 있어 그냥 지나칠 수 없었다']);
  return pick(r, ['길에서 시비가 붙었다', '현상금 사냥꾼이 덤벼들었다']);
}

/** 상대에게서 무기를 빼앗는다 (주력에 맞는 것을 먼저) */
function lootWeapon(s: LifeState, r: Rng): string | null {
  const grade = Math.min(3, Math.max(1, s.world.stage - 1));
  const pool = ITEMS.filter((i) => i.kind === 'weapon' && i.price > 0 && i.grade <= grade);
  const mine = pool.filter((i) => i.branch === s.growth.focus);
  const it = pick(r, mine.length && r() < 0.7 ? mine : pool);
  if (!it) return null;
  const have = s.inventory.items.find((x) => x.id === it.id);
  if (have) have.count += 1; else s.inventory.items.push({ id: it.id, count: 1 });
  return it.name;
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
      const e = enc.enemy;
      const gains: string[] = [];
      const [lo, hi] = B.money.pirateLoot;
      const loot = Math.round((lo + (hi - lo) * r()) * s.world.stage * (s.hero.route === 'marine' ? 0.5 : 1));
      if (s.hero.route !== 'none' && e.form !== 'seaking') {
        s.hero.money += loot;
        gains.push(s.hero.route === 'marine' ? `포상금 ${loot.toLocaleString('ko-KR')}베리` : `전리품 ${loot.toLocaleString('ko-KR')}베리`);
      }
      s.hero.fame += s.world.stage;
      gains.push(`명성 +${s.world.stage}`);
      const k = pick(r, ['str', 'spd', 'vit', 'wil'] as StatKey[]);
      s.hero.base[k] += 0.2;
      gains.push(`싸움의 경험으로 ${STAT_KO[k]} +0.2`);
      if (e.form !== 'seaking' && chance(r, 0.06)) { const w = lootWeapon(s, r); if (w) gains.push(`노획한 무기 「${w}」`); }
      log(s, `${e.title ? e.title + ' ' : ''}${e.name}${renownTag(e)} — ${whyFight(s, e, r)}. 쓰러뜨렸다. 얻은 것: ${gains.join(' · ')}`, 'battle');
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
    const ironhull = enc.atSea && s.world.shipParts?.includes('ironhull');
    if (risk === 'lethal' && !enc.spar && !ironhull && chance(r, C.crewDeathLethal)) {
      p.alive = false;
      if (s.world.firstMate === p.id) s.world.firstMate = undefined;
      s.loadout.crew = s.loadout.crew.filter((c) => c.personId !== p.id);
      log(s, `${p.name}이(가) 전투에서 목숨을 잃었다…`, 'danger');
      timeline(s, `동료 ${p.name}을(를) 잃었다`);
    } else {
      p.crew.injuredMonths = Math.ceil(C.crewInjuryMonths / (s.world.shipParts?.includes('infirmary') ? 2 : 1));
      log(s, `${p.name}이(가) 다쳐 몇 달 쉬어야 한다.`, 'danger');
    }
  }

  const label = enc.source === 'boss' ? '해역 보스' : enc.spar ? '대련' : '강적';
  if (won) {
    s.stats.eliteWins++;
    if (!enc.spar) timeline(s, `${enc.enemy.title ? enc.enemy.title + ' ' : ''}${enc.enemy.name}을(를) 쓰러뜨렸다`);
    if (!enc.spar && chance(r, C.result.win.light)) applyEffects(s, [{ op: 'injury', severity: 'light' }]);
    // 강한 상대일수록 능력치가 오른다
    const foe = enc.enemy.base;
    const foeAvg = (foe.str + foe.spd + foe.vit) / 3;
    const mine = (s.hero.base.str + s.hero.base.spd + s.hero.base.vit) / 3;
    const gain = Math.max(0.3, Math.min(3, B.growth.eliteWinStat * foeAvg / Math.max(1, mine) * (enc.source === 'boss' ? 3 : 1)));
    for (const k of ['str', 'spd', 'vit', 'wil'] as StatKey[]) s.hero.base[k] += gain;
    const fameGain = enc.spar ? 0 : Math.round(foeAvg * (enc.source === 'boss' ? 2 : 0.6) * (s.world.shipParts?.includes('figurehead') ? 1.2 : 1));
    s.hero.fame += fameGain;
    const gains = [`싸움의 경험으로 힘·속도·체력·정신 +${gain.toFixed(1)}`];
    if (fameGain) gains.push(`명성 +${fameGain}`);
    if (!enc.spar && enc.enemy.form !== 'seaking') {
      const bounty = enc.enemy.faction === 'pirate' && s.hero.route === 'marine';
      const purse = Math.round((B.money.pirateLoot[1] * s.world.stage) * (enc.source === 'boss' ? 4 : 1.5) * (0.7 + r() * 0.6));
      s.hero.money += purse;
      gains.push(`${bounty ? '현상금 포상' : '빼앗은 돈'} ${purse.toLocaleString('ko-KR')}베리`);
      if (chance(r, enc.source === 'boss' ? 0.4 : 0.2)) { const w = lootWeapon(s, r); if (w) gains.push(`노획한 무기 「${w}」`); }
    }
    const who = `${enc.enemy.title ? enc.enemy.title + ' ' : ''}${enc.enemy.name}`;
    log(s, enc.spar ? `대련에서 ${enc.enemy.name}을(를) 꺾었다! ${gains.join(' · ')}` : `${label} ${who}${renownTag(enc.enemy)}을(를) 쓰러뜨렸다! 얻은 것: ${gains.join(' · ')}`, 'good');
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
            const g = ['haki.observation.awaken', 'haki.armament.awaken', ...(s.hero.traits.includes('conqueror') ? ['haki.conqueror.awaken'] : []),
              ...(s.hero.fruit && (s.growth.fruitMastery ?? 0) >= 100 && FRUIT_PASSIVES[s.hero.fruit.id]?.awaken ? ['fruit.awaken'] : [])]
              .find((x) => !s.growth.gates.includes(x));
            if (g) openGate(s, g);
          }
        }
      }
      // 자연계에게 무장색 없이 졌다면 길을 다시 생각하게 된다
      if (enc.enemy.fruitClass === 'logia' && !s.growth.gates.includes('haki.armament.awaken')) {
        if (!s.choice.flags.includes('need_armament')) s.choice.flags.push('need_armament');
      }
    } else {
      s.hero.base.wil += 0.5;
    }
  }

  if (!won && enc.onLose) applyEffects(s, enc.onLose);

  // 출처별 후속
  if (enc.source === 'mission' && enc.missionIdx !== undefined) {
    const mp = s.world.missions[enc.missionIdx];
    if (mp) {
      if (won) {
        mp.state = 'done';
        log(s, `임무 「${missionTitle(mp)}」 완료!`, 'good');
        // 해군은 임무를 마칠 때마다 진급한다 (분대장이 되면 보상으로 분대원을 데려올 수 있다)
        if (s.hero.route === 'marine') promote(s, 1);
        applyEffects(s, MISSION_BY_ID[mp.id].reward);
        maybeRevealBoss(s);
      } else {
        mp.state = 'failed';
        s.world.refillAt = absMonth(s) + B.world.refillMonths;
        log(s, `임무 「${missionTitle(mp)}」 실패.`, 'danger');
      }
    }
  }
  if (enc.source === 'side' && s.world.side) {
    const st = SIDE_BY_ID[s.world.side.id];
    if (won) {
      s.world.side.step += 1; s.world.side.months = 0;
      if (st && s.world.side.step >= st.steps.length) finishSide(s);
    } else {
      log(s, `곁가지 이야기 「${st?.title ?? ''}」에서 물러났다. 언젠가 다시 기회가 올 것이다.`, 'danger');
      s.world.side = undefined;
    }
  }
  if (enc.source === 'boss') {
    s.world.boss.attempts += 1;
    if (won) bossDefeated(s);
  }
  if (enc.source === 'choice' && s.choice.flags.includes('promo_mission')) {
    s.choice.flags = s.choice.flags.filter((f) => f !== 'promo_mission');
    if (won && s.hero.route === 'marine') promote(s, 1);
  }
}

/** 곁가지 이야기를 마친다: 보상 */
export function finishSide(s: LifeState) {
  const sd = s.world.side;
  if (!sd) return;
  const st = SIDE_BY_ID[sd.id];
  s.world.side = undefined;
  if (!st) return;
  (s.world.sideDone ??= []).push(st.id);
  log(s, st.rewardText, 'good');
  log(s, `곁가지 이야기 「${st.title}」를 마쳤다!`, 'good');
  timeline(s, `곁가지 이야기 「${st.title}」를 마쳤다`);
  applyEffects(s, st.reward);
}

function bossDefeated(s: LifeState) {
  const b = BOSS_BY_ID[s.world.boss.id];
  s.world.boss.state = 'defeated';
  s.world.defeated.push(b.id);
  s.metaEvents.push({ k: 'defeated', id: b.id, where: s.world.seaId });
  applyEffects(s, b.drops);
  promote(s, B.world.rankFromBoss);
  s.world.news.push({ year: s.time.year, text: `${s.hero.surname} ${s.hero.name}, ${b.name}을(를) 쓰러뜨리다!` });
  if (s.world.stage === 6) {
    s.world.apex = true;
    if (!s.choice.flags.includes('apex')) s.choice.flags.push('apex');
    const title = s.hero.route === 'marine' ? '해군 원수' : s.hero.route === 'revolution' ? '혁명의 영웅' : '해적왕';
    log(s, `바다의 정점에 섰다. 사람들은 이제 ${title}(이)라 부른다!`, 'good');
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
