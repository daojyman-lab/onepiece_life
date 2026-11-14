// 중대한 선택의 발생과 처리 (docs/02_설계/03_진행과_선택.md 5장).
import { B } from '../../data/balance';
import { BOSS_BY_ID } from '../../data/bosses';
import { CHOICE_BY_ID, CHOICES } from '../../data/choices';
import { MASTERS } from '../../data/masters';
import { SEA_BY_ID, SHIPS, SHIP_BY_ID, nextSea } from '../../data/seas';
import { BRANCH_NAMES, GATE_NAMES } from '../../data/skills';
import { checkAll, firstFailReason } from '../conditions';
import { applyEffects, crewCapacity } from '../effects';
import { blockedGates } from '../growth/growth';
import { int, rngOf, weighted } from '../rng';
import type { BranchId, Choice, ChoiceCategory, LifeState, Pending, ResolvedOption } from '../types';
import { absMonth, fill, findPerson, fmtMoney, log, timeline } from '../util';
import { sea } from '../world/world';

type ChoicePending = Extract<Pending, { kind: 'choice' }>;

function vars(s: LifeState): Record<string, string> {
  const father = s.people.find((p) => p.relation === '아버지');
  const mother = s.people.find((p) => p.relation === '어머니');
  const rival = s.people.find((p) => p.kind === 'rival' || p.relation.startsWith('라이벌'));
  const active = s.world.missions.find((m) => m.state === 'active') ?? s.world.missions[0];
  return {
    name: s.hero.name, place: s.hero.birth.place,
    father: father?.name ?? '아버지', mother: mother?.name ?? '어머니', rival: rival?.name ?? '라이벌',
    port: active?.port ?? sea(s).ports[0], sea: sea(s).name,
  };
}

function speakerOf(s: LifeState, ch: Choice): ChoicePending['speaker'] {
  const sp = ch.speaker;
  if (sp === 'hero') return null;
  if ('person' in sp) {
    const p = findPerson(s, sp.person === '라이벌' ? 'rival' : sp.person);
    return p ? { name: p.name, personId: p.id, faction: p.faction, species: p.species, gender: p.gender, age: p.age } : null;
  }
  return { name: sp.canon, faction: sp.faction ?? 'civil', gender: sp.gender ?? 'm', age: sp.age ?? 40 };
}

// ---------------------------------------------------------------- 틀

const MARTIAL: BranchId[] = ['martial.fist', 'martial.sword', 'martial.gun'];
const ENTRY_LABEL: Record<BranchId, [string, string]> = {
  'martial.fist': ['체술 사범을 따른다', '힘과 체력. 맨손으로 싸운다'],
  'martial.sword': ['검술 도장에 들어간다', '힘과 속도. 칼로 벤다'],
  'martial.gun': ['사냥꾼에게 총을 배운다', '속도와 지능. 멀리서 꿰뚫는다'],
  'haki.observation': ['견문색을 갈고닦는다', '정신과 속도. 피하고 읽는다'],
  'haki.armament': ['무장색을 갈고닦는다', '정신과 체력. 자연계에도 닿는다'],
  'haki.conqueror': ['패왕색을 갈고닦는다', '정신. 상대를 짓누른다'],
  'fruit': ['열매의 힘을 파고든다', '지능과 정신. 열매 기술이 자란다'],
};

function availableBranches(s: LifeState): BranchId[] {
  const out: BranchId[] = [...MARTIAL];
  if (s.growth.gates.includes('haki.observation.awaken')) out.push('haki.observation');
  if (s.growth.gates.includes('haki.armament.awaken')) out.push('haki.armament');
  if (s.growth.gates.includes('haki.conqueror.awaken')) out.push('haki.conqueror');
  if (s.hero.fruit) out.push('fruit');
  return out;
}

function talentHint(s: LifeState, b: BranchId) {
  if (b === 'martial.sword' && s.hero.traits.includes('swordTalent')) return ' (검술 재능!)';
  if (b === 'martial.gun' && s.hero.traits.includes('gunTalent')) return ' (사격 재능!)';
  return '';
}

function focusOptions(s: LifeState, ch: Choice): ResolvedOption[] {
  const avail = availableBranches(s);
  if (ch.id === 'en_dojo') {
    return MARTIAL.map((b) => ({
      label: ENTRY_LABEL[b][0], hint: ENTRY_LABEL[b][1] + talentHint(s, b), disabled: null,
      effects: [{ op: 'focus', branch: b, slot: 'focus' }, ...(talentHint(s, b) ? [{ op: 'mastery', skill: 'focus', add: 10 } as const] : [])],
    }));
  }
  if (ch.id === 'en_secondary') {
    return avail.filter((b) => b !== s.growth.focus).slice(0, 4).map((b) => ({
      label: ENTRY_LABEL[b][0].replace('따른다', '틈틈이 배운다').replace('들어간다', '다닌다'),
      hint: `보조 갈래. 절반 속도로 자란다. ${ENTRY_LABEL[b][1]}`, disabled: null,
      effects: [{ op: 'focus', branch: b, slot: 'secondary' }],
    }));
  }
  // 갈림길: 지금 길을 계속 / 다른 갈래로
  const keep: ResolvedOption = { label: '지금 길을 계속 간다', hint: `주력 「${s.growth.focus ? BRANCH_NAMES[s.growth.focus] : '없음'}」 유지`, disabled: null, effects: [{ op: 'unflag', id: 'rethink_ready' }] };
  const prefer = (b: BranchId) => (b === 'fruit' ? 0 : b === 'haki.armament' && s.choice.flags.includes('need_armament') ? 1 : b === s.growth.secondary ? 2 : 3);
  const alts = avail.filter((b) => b !== s.growth.focus).sort((a, z) => prefer(a) - prefer(z)).slice(0, 3);
  return [keep, ...alts.map((b) => ({
    label: `주력을 「${BRANCH_NAMES[b]}」(으)로 바꾼다`, hint: ENTRY_LABEL[b][1], disabled: null,
    effects: [{ op: 'focus', branch: b, slot: 'focus' } as const, { op: 'unflag', id: 'need_armament' } as const],
  }))];
}

function hakiOptions(s: LifeState, ch: Choice): ResolvedOption[] | null {
  const kind = ch.id === 'hk_observation' ? 'observation' : ch.id === 'hk_armament' ? 'armament' : 'conqueror';
  const gate = `haki.${kind}.awaken`;
  const branch = `haki.${kind}` as BranchId;
  const p = kind === 'conqueror' ? 1 : 0.7;
  const success = (slot: 'focus' | 'secondary') => [{ op: 'gate', id: gate } as const, { op: 'focus', branch, slot } as const];
  return [
    { label: '보조로 익힌다', hint: `「${BRANCH_NAMES[branch]}」을(를) 보조 갈래로. 실패할 수도 있다`, disabled: null,
      effects: [{ op: 'chance', p, then: success('secondary'), else: [{ op: 'base', key: 'wil', add: 2 }, { op: 'log', text: '감각을 붙잡지 못했다. 다음 기회를 기다린다.', type: 'info' }] }] },
    { label: '모든 것을 걸고 수련한다', hint: `「${BRANCH_NAMES[branch]}」을(를) 주력 갈래로. 실패할 수도 있다`, disabled: null,
      effects: [{ op: 'chance', p, then: success('focus'), else: [{ op: 'base', key: 'wil', add: 3 }, { op: 'log', text: '감각을 붙잡지 못했다.', type: 'info' }] }] },
    { label: '지금은 흘려보낸다', hint: '지금 갈래에 집중한다', disabled: null, effects: [] },
  ];
}

function masterOffer(s: LifeState): { body: string; options: ResolvedOption[]; speaker: ChoicePending['speaker'] } | null {
  const route = s.hero.route === 'revolution' ? 'pirate' : s.hero.route;
  const blocked = blockedGates(s).map((x) => x.gate);
  const active = [s.growth.focus, s.growth.secondary];
  const cands = MASTERS.filter((m) =>
    m.seas.includes(s.world.seaId) && m.minStage <= s.world.stage &&
    (m.route.includes('any') || m.route.includes(route as 'pirate' | 'marine')) &&
    m.teaches.some((t) => !s.growth.gates.includes(t.gate) && (blocked.includes(t.gate) || active.includes(t.branch))));
  if (!cands.length || s.growth.master) return null;
  const r = rngOf(s.rng);
  const m = cands.find((x) => x.teaches.some((t) => blocked.includes(t.gate))) ?? cands[int(r, 0, cands.length - 1)];
  const ok = checkAll(s, m.accepts);
  const why = ok ? null : firstFailReason(s, m.accepts);
  const options: ResolvedOption[] = m.teaches.filter((t) => !s.growth.gates.includes(t.gate)).map((t) => ({
    label: `「${GATE_NAMES[t.gate]}」을(를) 배운다`,
    hint: `${t.months}개월 수련. ${BRANCH_NAMES[t.branch]}이(가) 두 배로 자란다${m.fee ? ` · 수업료 ${fmtMoney(m.fee)}` : ''}`,
    disabled: why ?? (s.hero.money < m.fee ? `돈 ${fmtMoney(m.fee)} 필요` : null),
    effects: [{ op: 'apprentice', master: m.id, branch: t.branch, gate: t.gate, months: t.months, fee: m.fee }],
  }));
  options.push({ label: '정중히 사양한다', hint: '지금의 수련을 이어 간다', disabled: null, effects: [] });
  return {
    body: `${m.title} ${m.name}이(가) 너를 지켜보고 있었다. "${ok ? '가르쳐 줄 수 있다. 따라오겠나?' : '아직은 이르다. 더 강해져서 오너라.'}"`,
    options, speaker: { name: m.name, faction: m.faction, gender: m.gender, age: m.age, species: m.species },
  };
}

function fruitOffer(s: LifeState): { body: string; options: ResolvedOption[] } | null {
  const u = s.inventory.unknownFruits.find((x) => !x.asked) ?? s.inventory.unknownFruits[s.inventory.unknownFruits.length - 1];
  if (!u) return null;
  u.asked = true;
  const fee = B.money.appraise * s.world.stage;
  const hints = u.hints.length ? u.hints.map((h) => `· ${h}`).join('\n') : '· 아직 아무것도 모른다.';
  return {
    body: `소용돌이 무늬의 열매를 손에 들고 있다. 먹으면 평생 헤엄칠 수 없다. 한 인생에 하나뿐이다.\n${hints}`,
    options: [
      { label: '먹는다', hint: '무엇이 될지 모른다. 되돌릴 수 없다', danger: true, disabled: s.hero.fruit ? '이미 열매를 먹었다' : null, effects: [{ op: 'eatFruit', uid: u.uid }] },
      { label: '감정을 맡긴다', hint: `힌트 하나를 더 얻는다 · ${fmtMoney(fee)} 베리`, disabled: u.hints.length >= 3 ? '더 알아낼 것이 없다' : s.hero.money < fee ? `돈 ${fmtMoney(fee)} 필요` : null,
        effects: [{ op: 'appraise', uid: u.uid, fee }, { op: 'queue', choice: 'fr_found' }] },
      { label: '판다', hint: '값은 열매에 따라 다르다', disabled: null, effects: [{ op: 'sellFruit', uid: u.uid }] },
      { label: '간직한다', hint: '나중에 소지품에서 먹을 수 있다', disabled: null, effects: [] },
    ].map((o) => ({ ...o, effects: o.effects as ResolvedOption['effects'] })),
  };
}

function challengeOffer(s: LifeState): { body: string; options: ResolvedOption[]; speaker: ChoicePending['speaker'] } | null {
  if (s.world.boss.state !== 'revealed') return null;
  const b = BOSS_BY_ID[s.world.boss.id];
  return {
    body: `${b.title} ${b.name}. ${b.intro}\n이 벽을 넘어야 다음 바다로 갈 수 있다.`,
    speaker: { name: b.name, faction: b.faction, gender: b.gender, age: b.age, species: b.species },
    options: [
      { label: '지금 도전한다', hint: '정찰과 준비 화면으로 간다', disabled: null, effects: [{ op: 'battle', enemy: b.id, elite: true, lethal: true }] },
      { label: '더 수련한다', hint: '1년 뒤 다시 묻는다. 해역 패널에서 언제든 도전할 수 있다', disabled: null, effects: [{ op: 'bossLater', months: B.world.bossRetryAskMonths }] },
    ],
  };
}

function shipOffer(s: LifeState): { body: string; options: ResolvedOption[] } | null {
  const next = nextSea(s.world.seaId);
  if (!next) return null;
  const need = SEA_BY_ID[next].shipRequired;
  const ships = SHIPS.filter((x) => x.tier >= need && x.tier <= need + 1);
  if (!ships.length) return null;
  return {
    body: `${SEA_BY_ID[next].name}(으)로 가려면 ${SHIPS.find((x) => x.tier === need)?.name} 이상의 배가 필요하다. 지금 가진 돈은 ${fmtMoney(s.hero.money)} 베리.`,
    options: [
      ...ships.map((x) => ({
        label: `${x.name}을(를) 산다`, hint: `${fmtMoney(x.price)} 베리 · 동료 ${x.crew}명`,
        disabled: s.hero.money < x.price ? `돈 ${fmtMoney(x.price)} 필요` : null,
        effects: [{ op: 'ship', id: x.id, price: x.price } as const],
      })),
      { label: '돈을 더 모은다', hint: '임무와 교전으로 돈을 번다', disabled: null, effects: [] },
    ],
  };
}

// ---------------------------------------------------------------- 펼치기

export function resolveChoice(s: LifeState, id: string): ChoicePending | null {
  const ch = CHOICE_BY_ID[id];
  if (!ch) return null;
  const v = vars(s);
  let body = fill(ch.body, v);
  let speaker = speakerOf(s, ch);
  let options: ResolvedOption[] | null;
  switch (ch.template) {
    case 'focus': options = focusOptions(s, ch); break;
    case 'haki': options = hakiOptions(s, ch); break;
    case 'master': { const o = masterOffer(s); if (!o) return null; options = o.options; body = o.body; speaker = o.speaker; break; }
    case 'fruit': { const o = fruitOffer(s); if (!o) return null; options = o.options; body = o.body; break; }
    case 'challenge': { const o = challengeOffer(s); if (!o) return null; options = o.options; body = o.body; speaker = o.speaker; break; }
    case 'ship': { const o = shipOffer(s); if (!o) return null; options = o.options; body = o.body; break; }
    default:
      options = ch.options.map((o) => ({
        label: fill(o.label, v), hint: fill(o.hint, v), effects: o.effects, next: o.next, danger: o.danger,
        disabled: firstFailReason(s, o.when),
      }));
  }
  if (!options || !options.length) return null;
  // 어떤 선택지를 골라도 나아가야 한다: 모두 막혀 있으면 마지막 것을 연다
  if (options.every((o) => o.disabled)) options[options.length - 1].disabled = null;
  return { kind: 'choice', choiceId: ch.id, category: ch.category, title: fill(ch.title, v), body, speaker, options };
}

function cooledDown(s: LifeState, ch: Choice) {
  const last = s.choice.seen[ch.id];
  if (last === undefined) return true;
  if (ch.repeat === 'once') return false;
  return absMonth(s) - last >= (ch.cooldownYears ?? 1) * 12;
}

function treatCost(s: LifeState) {
  let cost = 0;
  if (s.hero.illness) cost += B.money.treatIllness * s.world.stage;
  if (s.hero.injuries.some((i) => i.severity === 'heavy')) cost += B.money.treatInjury.heavy * s.world.stage;
  return cost;
}

/** 지금 필요한 선택 (03 문서 5장의 표) */
function urgent(s: LifeState): string | null {
  const now = absMonth(s);
  const h = s.hero;
  if (h.age >= 10 && !s.growth.focus) return 'en_dojo';
  if (s.inventory.unknownFruits.some((u) => !u.asked && now - u.foundAt <= B.choice.fruitAskWithin)) return 'fr_found';
  if (s.world.boss.state === 'revealed' && now >= s.world.boss.nextAskAt) return 'bo_challenge';
  if (blockedGates(s).length && !s.growth.master && cooledDown(s, CHOICE_BY_ID.ms_offer)) return 'ms_offer';
  if (h.age >= B.world.routeAge && h.route === 'none' && cooledDown(s, CHOICE_BY_ID.cr_route)) return 'cr_route';
  if ((h.illness || h.injuries.some((i) => i.severity === 'heavy')) && h.money < treatCost(s) && cooledDown(s, { ...CHOICE_BY_ID.cs_no_money_ill, cooldownYears: 1 })) return 'cs_no_money_ill';
  if (s.choice.flags.includes('need_ship')) {
    const next = nextSea(s.world.seaId);
    const need = next ? SEA_BY_ID[next].shipRequired : 99;
    const cheapest = SHIPS.find((x) => x.tier >= need);
    if (cheapest && h.money >= cheapest.price && cooledDown(s, { ...CHOICE_BY_ID.sh_buy, cooldownYears: 1 })) return 'sh_buy';
  }
  return null;
}

/** 이번 달에 선택을 띄운다. 띄웠으면 true */
export function maybeRaiseChoice(s: LifeState): boolean {
  if (s.pending) return false;
  const now = absMonth(s);
  if (now < s.choice.nextAt) return false;
  // 1. 예약된 것
  while (s.choice.queue.length) {
    const id = s.choice.queue.shift()!;
    const p = resolveChoice(s, id);
    if (p) { s.pending = p; return true; }
  }
  // 2. 지금 필요한 것 (한 해 상한을 넘어도 뜬다)
  const u = urgent(s);
  if (u) { const p = resolveChoice(s, u); if (p) { s.pending = p; return true; } }
  if (s.choice.thisYear >= B.choice.perYear) return false;
  // 3. 나머지: 가중치로 뽑기
  const r = rngOf(s.rng);
  const pool = CHOICES.filter((ch) => ch.weight > 0 && ch.category !== 'childhood' && cooledDown(s, ch) && checkAll(s, ch.when));
  for (let tries = 0; tries < 4 && pool.length; tries++) {
    const ch = weighted(r, pool, (x) => x.weight)!;
    const p = resolveChoice(s, ch.id);
    if (p) { s.pending = p; return true; }
    pool.splice(pool.indexOf(ch), 1);
  }
  return false;
}

const TIMELINE_CATS: ChoiceCategory[] = ['entry', 'master', 'career', 'fruit', 'challenge'];

/** 선택에 답한다. 답하면 pending이 반드시 끝난다 */
export function answerChoice(s: LifeState, index: number): boolean {
  const p = s.pending;
  if (!p || p.kind !== 'choice') return false;
  const opt = p.options[index];
  if (!opt || opt.disabled) return false;
  s.pending = null;
  const now = absMonth(s);
  s.choice.seen[p.choiceId] = now;
  s.stats.choices += 1;
  log(s, `【${p.title}】 ${opt.label}`, 'choice');
  if (TIMELINE_CATS.includes(p.category) && opt.effects.length) timeline(s, `${p.title}: ${opt.label}`);
  applyEffects(s, opt.effects);
  if (opt.next) s.choice.queue.push(opt.next);
  const r = rngOf(s.rng);
  if (p.category !== 'childhood') {
    s.choice.nextAt = now + int(r, B.choice.gapMin, B.choice.gapMax);
    s.choice.thisYear += 1;
  }
  return true;
}

/** 유년기 선택 셋 (3 · 6 · 9세). 6세는 라이벌이 생기는 사건으로 정해 둔다 */
export function childhoodPick(s: LifeState): string[] {
  const r = rngOf(s.rng);
  const fits = (c: Choice, age: number) => c.when.every((w) => w.c !== 'age' || ((w.min ?? 0) <= age && age <= (w.max ?? 999)));
  const used = new Set(['ch_rival']);
  const pickFor = (age: number) => {
    const pool = CHOICES.filter((c) => c.category === 'childhood' && !used.has(c.id) && fits(c, age));
    const c = weighted(r, pool, (x) => x.weight);
    if (c) used.add(c.id);
    return c?.id;
  };
  const [a3, , a9] = B.childhood.ages;
  return [pickFor(a3), 'ch_rival', pickFor(a9)].filter((x): x is string => !!x);
}

export { crewCapacity, SHIP_BY_ID };
