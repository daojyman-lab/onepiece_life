// 해군의 추격과 임펠 다운 수감.
// 현상금(명성 × 1만 베리)에 맞는 계급의 해군이 오되, 조금 흔들리고 아주 드물게 훨씬 강한 해군이 온다.
// 지면 해적단은 흩어지고 배를 잃으며, 주인공은 임펠 다운에 갇힌다. 갇힌 동안에는 벌이 · 임무 · 선택이 멈춘다.
import { IMPEL_LEVELS, PRISON_LINES, PURSUER_TIERS } from '../../data/pursuers';
import { resolveChoice } from '../choice/choice';
import { crewOf } from '../people';
import { chance, int, pick, rngOf } from '../rng';
import type { EnemySpec, LifeState } from '../types';
import { fmtMoney, log, timeline } from '../util';
import { sea, sideEnemy } from '../world/world';

export const bountyOf = (s: LifeState) => Math.max(0, s.hero.fame) * 10000;

/** 현상금에 맞는 계급 (흔들기 전) */
export function bountyTier(fame: number): number {
  let t = 0;
  PURSUER_TIERS.forEach((x, i) => { if (fame >= x.minFame) t = i; });
  return t;
}

/** 실제로 오는 계급. 65% 제 계급, 20% 한 계급 아래, 12% 한 계급 위, 3% 중장 이상 (아주 운이 나쁨) */
export function rollTier(s: LifeState): { tier: number; luck: 'normal' | 'lucky' | 'unlucky' | 'cursed' } {
  const r = rngOf(s.rng);
  const base = bountyTier(s.hero.fame);
  const top = PURSUER_TIERS.length - 1;
  const x = r();
  if (x < 0.03) return { tier: Math.min(top, Math.max(base + 2, 3)), luck: 'cursed' };
  if (x < 0.15 && base < top) return { tier: base + 1, luck: 'unlucky' };
  if (x < 0.35 && base > 0) return { tier: base - 1, luck: 'lucky' };
  return { tier: base, luck: 'normal' };
}

/** 쫓아온 해군의 전투 값. 힘은 계급의 절대값을 지금 해역 기준 배율로 바꿔 넣는다 */
export function pursuerEnemy(s: LifeState, tier: number): EnemySpec {
  const r = rngOf(s.rng);
  const T = PURSUER_TIERS[tier];
  const foe = pick(r, T.foes);
  const [lo, hi] = sea(s).enemyPower;
  const mult = Math.max(0.75, T.power / (lo + (hi - lo) * 0.8));
  const e = sideEnemy(s, `hunt${tier}`, s.rng.cursor, {
    ...foe, mult, officers: (foe.officers ?? []).map((o) => ({ ...o, mult: o.mult * mult })),
  });
  // 대장 · 중장은 패기를 쓴다
  if (tier >= 3) { e.armament = Math.max(e.armament, tier === 4 ? 3 : 2) as EnemySpec['armament']; e.observation = Math.max(e.observation, 2) as EnemySpec['observation']; }
  return e;
}

/** 해군의 추격. flee면 먼저 달아나 본다 */
export function startHunt(s: LifeState, flee: boolean) {
  const r = rngOf(s.rng);
  const { tier, luck } = rollTier(s);
  const T = PURSUER_TIERS[tier];
  const enemy = pursuerEnemy(s, tier);
  log(s, `현상금 ${fmtMoney(bountyOf(s))} 베리. 그 목을 노리고 온 것은 ${enemy.title} ${enemy.name}(이)었다.`, 'danger');
  if (luck === 'cursed') log(s, `운이 지독히도 나빴다. 이 정도 현상금에 ${T.rank}이(가) 직접 나설 줄은 아무도 몰랐다.`, 'danger');
  else if (luck === 'unlucky') log(s, '생각보다 계급이 높은 해군이 왔다. 운이 나빴다.', 'danger');
  else if (luck === 'lucky') log(s, '다행히 생각보다 계급이 낮은 해군이다.', 'info');
  if (flee) {
    const nav = crewOf(s).some((p) => p.crew?.role === 'navigator' && !p.crew.injuredMonths);
    const p = Math.max(0.1, 0.5 + (nav ? 0.15 : 0) + Math.min(0.15, s.hero.base.spd / 600) - tier * 0.07);
    if (chance(r, p)) {
      const lost = Math.round(Math.max(0, s.hero.money) * 0.1);
      s.hero.money -= lost;
      log(s, `짐을 바다에 버리고 돛을 한껏 올렸다. 군함이 수평선 너머로 작아졌다${lost ? ` (버린 짐 ${fmtMoney(lost)} 베리어치)` : ''}.`, 'world');
      return;
    }
    log(s, '달아나려 했지만 군함이 앞을 막았다. 싸울 수밖에 없다!', 'danger');
  }
  s.pending = {
    kind: 'prep',
    encounter: {
      source: 'choice', enemy, elite: true, lethal: false, spar: false, atSea: true,
      reward: [{ op: 'fame', add: 10 * (tier + 1) }, { op: 'log', text: `해군 ${T.rank}을(를) 물리쳤다는 소식이 퍼졌다. 현상금이 껑충 뛰었다.`, type: 'good' }],
      onLose: [{ op: 'capture', tier }],
    },
  };
}

/** 붙잡혔다: 해적단 해체 · 배 몰수 · 임펠 다운 수감 */
export function capture(s: LifeState, tier: number) {
  if (s.lastBattle?.result === 'retreat') {
    log(s, '포위망의 틈으로 간신히 빠져나왔다. 붙잡히지는 않았다.', 'danger');
    return;
  }
  const r = rngOf(s.rng);
  const T = PURSUER_TIERS[tier];
  const months = int(r, T.prisonMonths[0], T.prisonMonths[1]);
  // 해적단 해체
  const crew = crewOf(s);
  for (const p of crew) { p.kind = 'ally'; p.relation = '흩어진 옛 동료'; }
  s.loadout.crew = [];
  s.world.firstMate = undefined;
  if (s.world.ship && s.world.ship !== 'raft') s.world.lostShip = s.world.ship;
  s.world.ship = null;
  const taken = Math.round(Math.max(0, s.hero.money) * 0.7);
  s.hero.money -= taken;
  s.world.training = undefined;
  s.world.seeking = undefined;
  if (s.world.side) { log(s, '하던 곁가지 이야기는 끝을 보지 못했다.', 'info'); s.world.side = undefined; }
  if (!s.choice.flags.includes('lost_ship')) s.choice.flags.push('lost_ship');
  s.world.prison = { left: months, total: months, level: T.level, asked: false };
  log(s, '해루석 수갑이 채워졌다. 힘이 빠져나갔다.', 'danger');
  log(s, crew.length
    ? `동료들은 뿔뿔이 흩어졌고(${crew.map((p) => p.name).join(', ')}), 배는 해군에 압수되었다. 해적단은 해체되었다.`
    : '배는 해군에 압수되었다.', 'danger');
  if (taken) log(s, `가진 돈 ${fmtMoney(taken)} 베리를 몰수당했다.`, 'money');
  log(s, `호송선이 칼름 벨트를 건넜다. 바다 밑 대감옥 임펠 다운 ${IMPEL_LEVELS[T.level]}에 갇혔다. 형기 ${months}개월.`, 'danger');
  timeline(s, `해군에 붙잡혀 임펠 다운 ${IMPEL_LEVELS[T.level]}에 갇혔다`);
}

/** 감옥에서 한 달. 갇혀 있으면 true */
export function prisonTick(s: LifeState): boolean {
  const p = s.world.prison;
  if (!p) return false;
  const r = rngOf(s.rng);
  p.left -= 1;
  // 버티는 동안 몸과 마음이 단단해진다
  s.hero.base.vit += 0.1;
  s.hero.base.wil += 0.15;
  if (p.left <= 0) { release(s, false); return false; }
  if (!p.asked && p.left <= Math.floor(p.total / 2)) {
    p.asked = true;
    const c = resolveChoice(s, 'pr_breakout');
    if (c) { s.pending = c; return true; }
  }
  if (r() < 0.55) log(s, `[${IMPEL_LEVELS[p.level]}] ${pick(r, PRISON_LINES)}`, 'danger');
  return true;
}

/** 풀려나거나 탈옥했다. 작은 배 한 척으로 다시 시작한다 */
export function release(s: LifeState, broke: boolean) {
  const p = s.world.prison;
  if (!p) return;
  s.world.prison = undefined;
  s.world.ship = 'raft';
  if (broke) {
    s.hero.fame += 30;
    if (!s.choice.flags.includes('jailbreaker')) s.choice.flags.push('jailbreaker');
    log(s, '간수들을 쓰러뜨리고 정의의 문 밖으로 뛰쳐나왔다. 훔친 작은 배에 몸을 실었다. 「탈옥수」라는 이름이 현상금에 붙었다.', 'good');
    timeline(s, '임펠 다운에서 탈옥했다');
  } else {
    log(s, `${p.total}개월의 형기를 마치고 풀려났다. 남은 것은 낡은 뗏목 하나. 다시 시작이다.`, 'world');
    timeline(s, '형기를 마치고 임펠 다운에서 풀려났다');
  }
  if (s.people.some((x) => x.alive && x.relation === '흩어진 옛 동료')) log(s, '흩어진 동료들의 소식을 수소문했다. 살아 있다면 어딘가에서 네 소식을 듣고 있을 것이다.', 'world');
}

/** 탈옥: 간수장과 싸운다 */
export function jailbreak(s: LifeState) {
  const p = s.world.prison;
  if (!p) return;
  const deep = p.level >= 4;
  const enemy = sideEnemy(s, 'jail', s.rng.cursor, deep
    ? { name: '독의 마젤란', title: '임펠 다운 감옥장', mult: 1.3, bias: { vit: 1.4, int: 1.3 }, fruit: 'doku', faction: 'marine', canon: 'magellan' }
    : { name: '고문 간수장 사디짱', title: '임펠 다운 간수장', mult: 1.05, bias: { spd: 1.3 }, skills: ['gun_bind', 'fist_combo', 'gun_quick'], faction: 'marine', canon: 'sadi',
      officers: [{ name: '옥졸수 미노타우로스', mult: 0.8, skills: ['fist_iron', 'fist_combo'] }] });
  log(s, deep ? '복도 끝에서 독의 구름이 밀려왔다. 감옥장이 직접 나섰다.' : '감방 문을 열고 달렸다. 채찍 소리가 뒤따라왔다.', 'danger');
  s.pending = {
    kind: 'prep',
    encounter: {
      source: 'choice', enemy, elite: true, lethal: false, spar: false, atSea: false, solo: true,
      reward: [{ op: 'release', broke: true }],
      onLose: [{ op: 'prisonExtend', months: 6 }, { op: 'injury', severity: 'heavy' }],
    },
  };
}

export function prisonExtend(s: LifeState, months: number) {
  const p = s.world.prison;
  if (!p) return;
  p.left += months; p.total += months;
  log(s, `탈옥은 실패했다. 더 깊은 감방으로 끌려갔고 형기가 ${months}개월 늘었다.`, 'danger');
}
