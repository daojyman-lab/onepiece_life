// 전투 기록을 읽는 순수 변환기. 판정·난수와 분리하고 과거 문장에 마지막 상태를 소급하지 않는다.
import { getSkill } from '../growth/skillbook';
import { josa } from '../josa';
import type { BattleEvent, BattleState } from '../types';

export interface BattleProseLine {
  text: string;
  detail: string;
  phase: 'opening' | 'setup' | 'exchange' | 'turning' | 'ending';
}
type Act = Extract<BattleEvent, { k: 'act' }>;
interface Frame { hp: number[]; known: boolean[]; attacks: number; previous: Act | null }
const initialFrame = (b: BattleState): Frame => ({ hp: b.units.map((u, i) => b.initialHp?.[i] ?? u.maxHp),
  known: b.units.map((_, i) => typeof b.initialHp?.[i] === 'number'), attacks: 0, previous: null });
const name = (b: BattleState, i: number) => b.units[i]?.name ?? '누군가';

/** 능력을 갖고 있다는 이유만으로 발동을 꾸미지 않는다. 실제로 쓴 기술에만 동작을 붙인다. */
function motion(e: Act): string {
  if (e.proc) return `「${e.name}」의 추가 공격을 이어 갔다`;
  if (e.skill === 'basic') return '틈을 노려 공격을 뻗었다';
  if (e.skill === 'net') return '해루석 그물을 던져 상대의 움직임을 묶으려 했다';
  const sk = getSkill(e.skill);
  if (e.skill.startsWith('style:')) {
    const style = e.skill.split(':')[1];
    if (style === 'spear') return `창의 거리를 살려 「${e.name}」(으)로 파고들었다`;
    if (style === 'naginata') return `언월도의 긴 자루를 돌려 「${e.name}」을(를) 펼쳤다`;
    if (style === 'staff') return `봉의 간격을 살려 「${e.name}」(으)로 빈틈을 노렸다`;
    if (style === 'hammer') return `해머에 무게를 실어 「${e.name}」을(를) 밀어붙였다`;
    if (style === 'club') return `몽둥이의 무게를 실어 「${e.name}」을(를) 펼쳤다`;
    if (style === 'pipe') return `쇠파이프를 고쳐 쥐고 「${e.name}」(으)로 공세를 이었다`;
    if (style === 'slingshot') return `새총으로 표적을 겨누고 「${e.name}」을(를) 쏘았다`;
    if (style === 'dial') return `다이얼을 다잡고 「${e.name}」의 충격을 풀어냈다`;
    if (style === 'kicking') return `몸의 중심을 옮기며 「${e.name}」의 발차기를 뻗었다`;
    if (style === 'grappling') return `거리를 좁혀 「${e.name}」(으)로 상대의 중심을 노렸다`;
  }
  switch (sk?.branch) {
    case 'martial.sword': return `검의 간격을 잡고 「${e.name}」(으)로 공세를 펼쳤다`;
    case 'weapon.polearm': return `긴 자루의 거리를 살려 「${e.name}」을(를) 펼쳤다`;
    case 'weapon.blunt': return `무기에 힘을 실어 「${e.name}」(으)로 밀어붙였다`;
    case 'martial.gun': return `조준을 가다듬고 「${e.name}」을(를) 쏘았다`;
    case 'martial.fist': return `자세를 낮추고 「${e.name}」의 동작을 이어 갔다`;
    case 'haki.armament': return `무장색의 힘을 실어 「${e.name}」을(를) 펼쳤다`;
    case 'haki.observation': return `견문색을 가다듬으며 「${e.name}」을(를) 펼쳤다`;
    case 'haki.conqueror': return `패왕색을 끌어올려 「${e.name}」을(를) 펼쳤다`;
    case 'fruit': return `열매의 힘으로 「${e.name}」을(를) 펼쳤다`;
    default: return `「${e.name}」(으)로 상대를 압박했다`;
  }
}

function actLine(b: BattleState, e: Act, f: Frame): BattleProseLine {
  const a = name(b, e.who), t = name(b, e.target);
  const facts = e.facts;
  const detail = `${e.name} · 피해 ${e.dmg}${e.crit ? ' · 치명타' : ''}${e.dodge ? ' · 회피' : ''}${e.note ? ` · ${e.note}` : ''}`;
  if (e.skill === 'bound') return { text: josa(`${a}은(는) 속박을 풀지 못했다. 몸을 움직이려 했지만 이번 공방에는 나서지 못했다.`), detail: '속박 · 행동 불가', phase: 'exchange' };
  const helper = facts?.helper === true || e.name === '협공';
  const counter = f.previous?.who === e.target && f.previous.target === e.who && f.previous.dodge;
  const lead = helper ? `${a}이(가) 공격에 가세해 ${t}에게 협공을 이어 갔다.`
    : counter ? `${a}은(는) 앞선 공격을 피한 틈을 놓치지 않았다. ${motion(e)}.`
    : f.attacks === 0 ? `먼저 공격에 나선 것은 ${a}(이)었다. ${motion(e)}.`
    : `${a}은(는) ${motion(e)}.`;
  if (e.dodge) {
    const escape = facts?.observation ? `${t}은(는) 견문색으로 움직임을 읽으며 공격을 피했다.`
      : facts && facts.speedGap < 0 ? `더 빠른 ${t}이(가) 공격의 궤도에서 비켜섰다.`
      : `${t}이(가) 공격을 피해 궤도 밖으로 벗어났다.`;
    return { text: josa(`${lead} ${escape}`), detail, phase: f.attacks === 0 ? 'opening' : 'exchange' };
  }
  if (e.dmg <= 0) {
    const outcome = e.note?.includes('전혀 통하지') ? `${t}에게는 공격이 전혀 통하지 않았다.`
      : e.skill === 'net' || e.note?.includes('묶') ? `${t}의 움직임이 묶였다.`
      : e.note ? `${t}에게 닿은 결과는 분명했다. ${e.note}.` : `${t}에게 피해를 주지는 못했다.`;
    return { text: josa(`${lead} ${outcome}`), detail, phase: 'exchange' };
  }
  let impact = e.crit ? `${t}에게 치명적인 일격이 들어갔다.`
    : [`공격이 ${t}에게 닿았다.`, `${t}에게 충격이 전해졌다.`, `${t}이(가) 공격을 맞았다.`][f.attacks % 3];
  if (facts?.guarded) impact = `${t}의 방어가 충격 일부를 받아냈지만 공격을 완전히 막지는 못했다.`;
  if (e.note?.includes('자연계')) impact = `${t}의 자연계 몸에는 공격의 힘이 온전히 전해지지 않았다.`;
  else if (e.note?.includes('실체')) impact += ` ${e.note}.`;
  else if (e.note?.includes('잘 안 먹힌다')) impact = `${t}에게 닿았지만 공격의 힘은 줄어들었다.`;
  if (facts?.armament) impact += ' 무장색의 힘이 실체를 짚는 데 보탬이 되었다.';
  const before = facts?.targetHp ?? f.hp[e.target];
  const after = facts?.targetAfter ?? Math.max(0, before - e.dmg);
  const low = (facts !== undefined || f.known[e.target]) && after > 0 && after <= (b.units[e.target]?.maxHp ?? 1) * 0.3 && before > (b.units[e.target]?.maxHp ?? 1) * 0.3;
  if (e.note?.includes('쓰러지지 않고 버텼다')) impact += ` ${t}은(는) 쓰러질 듯한 순간에도 끝내 버텨 냈다.`;
  else if (low) impact += ` ${t}에게 남은 힘이 크게 줄었다. 다음 공방을 버텨야 했다.`;
  return { text: josa(`${lead} ${impact}`), detail, phase: low || e.crit ? 'turning' : f.attacks === 0 ? 'opening' : 'exchange' };
}

function row(b: BattleState, e: BattleEvent, f: Frame): BattleProseLine {
  const n = (i: number) => name(b, i);
  switch (e.k) {
    case 'round': return { text: e.n === 1 ? '첫 공방이 열렸다.' : `${e.n}번째 공방이 이어졌다.`, detail: `${e.n}합`, phase: e.n === 1 ? 'opening' : 'exchange' };
    case 'act': return actLine(b, e, f);
    case 'guard': {
      const action = e.effect === 'guard' ? '다음 공격을 받아낼 방어를 굳혔다'
        : e.effect === 'dodge' ? '공격을 피할 준비를 갖췄다'
        : e.effect === 'buff' ? '다음 공방을 위한 힘을 끌어올렸다' : '다음 공방을 준비했다';
      return { text: josa(`${n(e.who)}은(는) 「${e.name}」(으)로 ${action}.`), detail: e.name, phase: 'setup' };
    }
    case 'heal': {
      const amount = Math.max(0, Math.min(e.amount, (b.units[e.target]?.maxHp ?? 0) - f.hp[e.target]));
      const action = e.who === e.target ? `「${e.name}」(으)로 자신의 체력을 회복했다.` : `「${e.name}」(으)로 ${n(e.target)}을(를) 치료했다.`;
      return { text: josa(`${n(e.who)}이(가) ${action}`), detail: f.known[e.target] ? `${e.name} · 실제 체력 회복 +${amount}` : `${e.name} · 체력 회복 기록 +${e.amount}`, phase: 'turning' };
    }
    case 'down': return { text: josa(`${n(e.who)}은(는) 더는 공방을 버티지 못하고 쓰러졌다.`), detail: '전투 불능', phase: 'turning' };
    case 'join': return { text: josa(`${n(e.who)}이(가) ${e.side === 'L' ? '우리 편' : '상대 편'}의 싸움에 합류했다. 맞서야 할 공격의 수가 달라졌다.`), detail: '교전 합류', phase: 'setup' };
    case 'retreat': return { text: josa(e.ok ? `${n(e.who)}은(는) 공방에서 벗어나 물러나는 데 성공했다.` : `${n(e.who)}은(는) 물러나려 했지만 퇴로가 막혔다. 싸움을 이어 가야 했다.`), detail: `후퇴 ${e.ok ? '성공' : '실패'}${e.roll !== undefined && e.need !== undefined ? ` · 주사위 ${e.roll} / ${e.need} 이하 성공` : ''}`, phase: e.ok ? 'ending' : 'turning' };
    case 'deathmatch': return { text: josa(`${n(e.who)}이(가) 빈사 상태에 몰렸다. 이제 물러날 수 없는, 목숨을 건 싸움이 되었다.`), detail: '빈사 · 후퇴 불가', phase: 'turning' };
    case 'item': return { text: josa(`${n(e.who)}은(는) 「${e.name}」을(를) 사용하며 다음 공방에 대비했다.`), detail: e.name, phase: 'setup' };
    case 'drown': return { text: josa(`${n(e.who)}이(가) 바다에 빠졌다. 몸에서 힘이 빠져나가 더는 싸움을 이어 갈 수 없었다.`), detail: '바다에 빠짐 · 전투 불능', phase: 'turning' };
    case 'rest': return { text: josa(`${n(e.who)}은(는) 잠시 공세를 멈추고 숨을 고르며 기력을 추슬렀다.`), detail: '기력 회복', phase: 'setup' };
    case 'end': {
      const hero = b.units.find((u) => u.hero)?.name ?? '우리 편';
      return { text: josa(e.result === 'win' ? `공방 끝에 ${hero}의 우세로 승부가 갈렸다.` : e.result === 'retreat' ? '맞서던 싸움은 후퇴로 끝났다. 이번에는 승부를 내려놓았다.' : `${hero}은(는) 상대의 공세를 넘어서지 못했다. 승부는 패배로 끝났다.`), detail: e.result === 'win' ? '승리' : e.result === 'lose' ? '패배' : '후퇴', phase: 'ending' };
    }
  }
}

function advance(b: BattleState, e: BattleEvent, f: Frame): void {
  if (e.k === 'act') {
    f.hp[e.target] = e.facts?.targetAfter ?? Math.max(0, f.hp[e.target] - e.dmg);
    if (e.facts) f.known[e.target] = true;
    if (e.skill !== 'bound') { f.attacks++; f.previous = e; }
  } else if (e.k === 'heal') f.hp[e.target] = Math.min(b.units[e.target].maxHp, f.hp[e.target] + e.amount);
  else if (e.k === 'item' && e.item === 'potion') f.hp[e.who] = Math.min(b.units[e.who].maxHp, f.hp[e.who] + Math.round(b.units[e.who].maxHp * 0.3));
  else if (e.k === 'drown' || e.k === 'down') { f.hp[e.who] = 0; f.known[e.who] = true; }
}

/** 사건 기록과 같은 순서·길이로 변환한다. 출력에 난수를 소비하지 않는다. */
export function battleNarrative(b: BattleState): BattleProseLine[] {
  const f = initialFrame(b);
  return b.events.map((e) => { const line = row(b, e, f); advance(b, e, f); return line; });
}
/** 기존 한 줄 API. events 밖의 옛 사건도 보수적으로 변환한다. */
export function battleEventProse(b: BattleState, e: BattleEvent): BattleProseLine {
  const f = initialFrame(b), index = b.events.indexOf(e);
  if (index < 0) f.attacks = 1;
  else for (let i = 0; i < index; i++) advance(b, b.events[i], f);
  return row(b, e, f);
}
export function battleOpening(b: BattleState): string {
  const left = b.units.find((u) => u.hero) ?? b.units.find((u) => u.side === 'L');
  const right = b.units.find((u) => u.side === 'R' && u.leader) ?? b.units.find((u) => u.side === 'R');
  return josa(`${b.atSea ? '바다 위에서 ' : ''}${left?.name ?? '우리 편'}와(과) ${right?.name ?? '상대'}이(가) 마주섰다. 서로의 움직임을 살피며 첫 공방의 간격을 잡았다.`);
}
/** 건너뛰어도 남는 짧은 회고. 반드시 실제 기록에서 고른다. */
export function battleRecap(b: BattleState): string {
  // 예전 호출자나 결과만 보관한 기록에는 공방 자료가 없을 수 있다. 빈 이야기를 만들지 않는다.
  if (!b.events?.length || !b.units?.length) return '';
  const lines = battleNarrative(b);
  const indices = [b.events.findIndex((e) => e.k === 'act' && e.skill !== 'bound'),
    lines.findIndex((x) => x.phase === 'turning'), b.events.findIndex((e) => e.k === 'end')];
  return [...new Set(indices.filter((i) => i >= 0))].sort((a, z) => a - z).map((i) => lines[i].text).join(' ');
}
