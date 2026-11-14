// 작은 사건 자동 시뮬레이션. 고르지 않고 일어나 기록에 한 줄 남는다.
// 예) "로그타운 뒷산에서 뛰어다니며 놀았다. 체력 소폭 상승"
import { B } from '../../data/balance';
import { LIFE_EVENTS, type LifeEvent } from '../../data/lifeEvents';
import { DAILY_LINES, seasonOf } from '../../data/dailyLines';
import { CANON_LIFE_EVENTS } from '../../data/canonEvents';
import { BIRTHDAY_LINES } from '../../data/birthdays';
import { checkAll } from '../conditions';
import { applyEffects } from '../effects';
import { crewOf, traitOf } from '../people';
import { pick, rngOf, weighted, type Rng } from '../rng';
import type { Effect, LifeState, StatKey } from '../types';
import { absMonth, fill, findPerson, log } from '../util';
import { sea } from '../world/world';

const STAT: Record<StatKey, string> = { str: '힘', spd: '속도', vit: '체력', int: '지능', wil: '정신', luk: '운' };

function vars(s: LifeState, r: Rng): Record<string, string> {
  const by = (rel: string) => findPerson(s, rel)?.name;
  const rival = s.people.find((p) => p.alive && (p.kind === 'rival' || p.relation.startsWith('라이벌')));
  const crew = crewOf(s);
  const active = s.world.missions.find((m) => m.state === 'active');
  return {
    place: s.hero.birth.place, sea: sea(s).name,
    port: active?.port ?? pick(r, sea(s).ports),
    father: by('아버지') ?? '아버지', mother: by('어머니') ?? '어머니',
    rival: rival?.name ?? '라이벌', crew: crew.length ? pick(r, crew).name : '동료',
    spouse: s.people.find((p) => p.alive && p.relation === '배우자')?.name ?? '배우자',
    lover: s.people.find((p) => p.alive && p.relation === '연인')?.name ?? '연인',
    child: (() => { const k = s.people.filter((p) => p.alive && (p.relation === '아들' || p.relation === '딸')); return k.length ? pick(r, k).name.split(' ').pop()! : '아이'; })(),
  };
}

/** 효과를 적용하고, 결과를 짧은 문구로 돌려준다. 돈은 따로 기록하지 않고 문구에 넣는다 */
function run(s: LifeState, effects: Effect[], r: Rng, out: string[]) {
  for (const e of effects) {
    switch (e.op) {
      case 'chance': run(s, r() < e.p ? e.then : e.else ?? [], r, out); break;
      case 'money':
        s.hero.money += e.add;
        out.push(`${e.add > 0 ? '+' : '−'}${Math.abs(e.add).toLocaleString('ko-KR')} 베리`);
        break;
      case 'base':
        applyEffects(s, [e]);
        if (e.key !== 'all') out.push(`${STAT[e.key]} ${e.add <= 0.5 ? '소폭 ' : ''}상승`);
        break;
      case 'hp':
        applyEffects(s, [e]);
        out.push(e.add < 0 ? '건강 조금 나빠짐' : '기운을 차림');
        break;
      case 'mastery': applyEffects(s, [e]); out.push('숙련 조금 오름'); break;
      case 'bond': applyEffects(s, [e]); out.push('정이 깊어짐'); break;
      case 'fame': applyEffects(s, [e]); out.push(s.hero.route === 'marine' ? '공적 조금 오름' : '이름이 조금 알려짐'); break;
      default: applyEffects(s, [e]);
    }
  }
}

function candidates(s: LifeState): LifeEvent[] {
  const now = absMonth(s);
  return [...LIFE_EVENTS, ...CANON_LIFE_EVENTS].filter((ev) => {
    const last = s.choice.seen[`ev:${ev.id}`];
    return (last === undefined || now - last >= ev.cooldown) && checkAll(s, ev.when);
  });
}

/** 작은 사건 하나를 일으킨다. 일어났으면 true */
export function fireLifeEvent(s: LifeState): boolean {
  const r = rngOf(s.rng);
  const ev = weighted(r, candidates(s), (x) => x.weight);
  if (!ev) return false;
  s.choice.seen[`ev:${ev.id}`] = absMonth(s);
  const text = fill(pick(r, ev.text), vars(s, r));
  const out: string[] = [];
  run(s, ev.effects, r, out);
  const tail = [...new Set(out)].join(', ');
  log(s, tail ? `${text} ${tail}` : text, 'life');
  s.stats.lifeEvents = (s.stats.lifeEvents ?? 0) + 1;
  return true;
}

/** 일상 한 줄. 능력치는 바뀌지 않는다 */
export function fireDailyLine(s: LifeState): boolean {
  const r = rngOf(s.rng);
  // 동료가 있으면 가끔 그 동료의 성격이 드러나는 한 줄
  const crew = crewOf(s);
  if (crew.length && r() < B.lifeEvents.crewTraitShare) {
    const p = pick(r, crew);
    log(s, pick(r, traitOf(p).lines).replace(/\{name\}/g, p.name), 'day');
    return true;
  }
  const now = absMonth(s);
  const season = seasonOf(s.time.month);
  const cands = DAILY_LINES.map((d, i) => ({ d, i })).filter(({ d, i }) => {
    const last = s.choice.seen[`day:${i}`];
    return (!d.season || d.season === season) && (last === undefined || now - last >= B.lifeEvents.dailyCooldown) && checkAll(s, d.when);
  });
  if (!cands.length) return false;
  const { d, i } = pick(r, cands);
  s.choice.seen[`day:${i}`] = now;
  log(s, fill(d.text, vars(s, r)), 'day');
  return true;
}

/** 하루를 그리는 한 줄: 능력치가 오르는 작은 사건이나 일상 한 줄 */
export function fireNarrative(s: LifeState) {
  const r = rngOf(s.rng);
  if (r() < B.lifeEvents.statShare) { if (fireLifeEvent(s)) return; }
  if (!fireDailyLine(s)) fireLifeEvent(s);
}

/** 생일 한 줄 */
export function fireBirthday(s: LifeState) {
  const r = rngOf(s.rng);
  const cands = BIRTHDAY_LINES.filter((b) => checkAll(s, b.when));
  const b = weighted(r, cands, (x) => x.weight ?? 1);
  if (!b) return;
  const v = { ...vars(s, r), age: String(s.hero.age) };
  const out: string[] = [];
  run(s, b.effects ?? [], r, out);
  const tail = [...new Set(out)].join(', ');
  log(s, `🎂 ${fill(b.text, v)}${tail ? ` ${tail}` : ''}`, 'good');
}

/** 달마다 한 줄 */
export function monthlyLifeEvent(s: LifeState) {
  if (s.pending || !s.hero.alive) return;
  fireNarrative(s);
}
