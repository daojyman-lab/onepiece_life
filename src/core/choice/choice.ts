// 중대한 선택의 발생과 처리 (docs/02_설계/03_진행과_선택.md 5장).
import { B } from '../../data/balance';
import { BOSS_BY_ID } from '../../data/bosses';
import { CHOICE_BY_ID, CHOICES } from '../../data/choices';
import { MASTERS, MASTER_BY_ID } from '../../data/masters';
import { PREV_GATE, TRIAL_TEACH_MONTHS, trialOf } from '../../data/masterTrials';
import { SEA_BY_ID, SHIPS, SHIP_BY_ID, nextSea } from '../../data/seas';
import { BRANCH_NAMES, GATE_NAMES } from '../../data/skills';
import { checkAll, firstFailReason } from '../conditions';
import { applyEffects, crewCapacity } from '../effects';
import { activeBranches, blockedGates, MARTIAL } from '../growth/growth';
import { int, pick, rngOf, weighted } from '../rng';
import { crewOf, roleName, traitOf } from '../people';
import { FIRST_NAMES, HOMETOWNS } from '../../data/births';
import { SIDE_STORIES } from '../../data/sideStories';
import { FRUIT_PASSIVES, HERO_TRAITS, HERO_TRAIT_BY_ID } from '../../data/passives';
import type { BranchId, Choice, ChoiceCategory, Effect, LifeState, Pending, ResolvedOption } from '../types';
import { absMonth, fill, findPerson, fmtMoney, log, talentsOf, timeline } from '../util';
import { sea } from '../world/world';

import { IMPEL_LEVELS } from '../../data/pursuers';
import { josa } from '../josa';

type ChoicePending = Extract<Pending, { kind: 'choice' }>;

function vars(s: LifeState): Record<string, string> {
  const father = findPerson(s, '아버지');
  const mother = findPerson(s, '어머니');
  const rival = s.people.find((p) => p.kind === 'rival' || p.relation.startsWith('라이벌'));
  const active = s.world.missions.find((m) => m.state === 'active') ?? s.world.missions[0];
  return {
    name: s.hero.name, place: s.hero.birth.place, bounty: fmtMoney(Math.max(0, s.hero.fame) * 10000),
    prisonLevel: s.world.prison ? IMPEL_LEVELS[s.world.prison.level] : '임펠 다운',
    father: father?.name ?? '아버지', mother: mother?.name ?? '어머니', rival: rival?.name ?? '라이벌',
    commander: findPerson(s, '지휘관')?.name ?? '상관',
    lover: s.people.find((p) => p.alive && p.relation === '연인')?.name ?? '연인',
    spouse: s.people.find((p) => p.alive && p.relation === '배우자')?.name ?? '배우자',
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
  return { name: sp.canon, faction: sp.faction ?? 'civil', gender: sp.gender ?? 'm', age: sp.age ?? 40, ...(sp.face ? { faceKey: sp.face } : {}), ...(sp.species ? { species: sp.species } : {}) };
}

// ---------------------------------------------------------------- 틀

const ENTRY_LABEL: Record<BranchId, [string, string]> = {
  'martial.fist': ['체술 사범을 따른다', '힘과 체력. 맨손으로 싸운다'],
  'martial.sword': ['검술 도장에 들어간다', '힘과 속도. 칼로 벤다'],
  'martial.gun': ['사냥꾼에게 총을 배운다', '속도와 지능. 멀리서 꿰뚫는다'],
  'haki.observation': ['견문색을 갈고닦는다', '정신과 속도. 피하고 읽는다'],
  'haki.armament': ['무장색을 갈고닦는다', '정신과 체력. 자연계에도 닿는다'],
  'haki.conqueror': ['패왕색을 갈고닦는다', '정신. 상대를 짓누른다'],
  'fruit': ['열매의 힘을 파고든다', '지능과 정신. 열매 기술이 자란다'],
};

function talentHint(s: LifeState, b: BranchId) {
  if (b === 'martial.sword' && s.hero.traits.includes('swordTalent')) return ' (검술 재능!)';
  if (b === 'martial.gun' && s.hero.traits.includes('gunTalent')) return ' (사격 재능!)';
  if (b === 'martial.fist' && s.hero.traits.includes('fistTalent')) return ' (격투 재능!)';
  return '';
}

/** 입문 · 보조 · 갈림길: 주력과 보조는 무술 3유파 중에서만 고른다 */
function focusOptions(s: LifeState, ch: Choice): ResolvedOption[] {
  if (ch.id === 'en_dojo') {
    const town = HOMETOWNS.find((t) => t.name === s.hero.birth.place);
    const pick = (b: BranchId, label: string, hint: string): ResolvedOption => ({
      label, hint: hint + talentHint(s, b), disabled: null,
      effects: [{ op: 'focus', branch: b, slot: 'focus' }, ...(talentHint(s, b) ? [{ op: 'mastery', skill: 'focus', add: 10 } as const] : [])],
    });
    const opts = (town?.teachers ?? MARTIAL.map((b) => ({ label: ENTRY_LABEL[b][0], hint: ENTRY_LABEL[b][1], branch: b as typeof MARTIAL[number] })))
      .map((t) => pick(t.branch, t.label, t.hint));
    // 집안에서 배우기: 아버지 · 보호자가 하는 일에 따라
    const elder = findPerson(s, '아버지');
    if (elder) {
      const house = s.hero.birth.household + ' ' + elder.relation;
      const b: BranchId = /해군|검|도장|대장간|무기/.test(house) ? 'martial.sword' : /사냥|총|등대|포격/.test(house) ? 'martial.gun' : 'martial.fist';
      const who = elder.relation === '보호자' ? `날 거둬 준 ${elder.name}` : `아버지 ${elder.name}`;
      opts.push(pick(b, `${who}에게 배운다`, `${BRANCH_NAMES[b]} · 집안에서 매일 가르쳐 준다`));
    }
    return opts;
  }
  return [];
}

/** 패기 눈뜸: 붙잡으면 패기 칸에 든다. 칸이 차 있으면 바꿀지 고른다 */
function hakiOptions(s: LifeState, ch: Choice): ResolvedOption[] | null {
  const kind = ch.id === 'hk_observation' ? 'observation' : ch.id.startsWith('hk_armament') ? 'armament' : 'conqueror';
  const gate = `haki.${kind}.awaken`;
  const branch = `haki.${kind}` as BranchId;
  const bonus = talentsOf(s).reduce((x, t) => x + (t.hakiAwaken ?? 0), 0);
  const p = Math.min(0.95, (ch.id === 'hk_armament_need' ? B.haki.awakenNeedP : kind === 'conqueror' ? B.haki.awakenConquerorP : B.haki.awakenP) + bonus);
  const fail = [{ op: 'base', key: 'wil', add: 2 } as const, { op: 'log', text: '감각을 붙잡지 못했다. 다음 기회를 기다린다.', type: 'info' } as const];
  const cur = s.growth.haki ?? null;
  const pct = `성공 ${Math.round(p * 100)}%`;
  const opts: ResolvedOption[] = [];
  if (!cur) {
    opts.push({ label: '감각을 붙잡는다', hint: `「${BRANCH_NAMES[branch]}」이(가) 패기 칸에 든다. 주력 · 보조와 따로 자란다 · ${pct}`, disabled: null,
      effects: [{ op: 'chance', p, then: [{ op: 'gate', id: gate }], else: fail }] });
  } else {
    opts.push({ label: '감각을 붙잡고, 패기 칸을 바꾼다', hint: `패기 칸: 「${BRANCH_NAMES[cur]}」 → 「${BRANCH_NAMES[branch]}」 · ${pct}`, disabled: null,
      effects: [{ op: 'chance', p, then: [{ op: 'gate', id: gate }, { op: 'focus', branch, slot: 'haki' }], else: fail }] });
    opts.push({ label: '감각만 붙잡아 둔다', hint: `패기 칸은 「${BRANCH_NAMES[cur]}」 그대로. 눈뜸 기술만 익힌다 · ${pct}`, disabled: null,
      effects: [{ op: 'chance', p, then: [{ op: 'gate', id: gate }], else: fail }] });
  }
  opts.push({ label: '지금은 흘려보낸다', hint: '지금 수련에 집중한다', disabled: null, effects: [] });
  return opts;
}

/** 스승 후보. seek이면 지금까지 지나온 바다 어디서든, 지금 칸에 맞는 큰 단계를 가르칠 사람 */
export function masterCandidates(s: LifeState, seek = false) {
  const route = s.hero.route === 'revolution' ? 'pirate' : s.hero.route;
  const blocked = blockedGates(s).map((x) => x.gate);
  const needArmament = s.choice.flags.includes('need_armament') && !s.growth.gates.includes('haki.armament.awaken');
  const active = activeBranches(s);
  return MASTERS.filter((m) =>
    (seek ? m.seas.some((x) => SEA_BY_ID[x].stage <= s.world.stage) : m.seas.includes(s.world.seaId)) && m.minStage <= s.world.stage &&
    (m.route.includes('any') || m.route.includes(route as 'pirate' | 'marine')) &&
    m.teaches.some((t) => !s.growth.gates.includes(t.gate)
      && (t.gate !== 'fruit.awaken' || (!!s.hero.fruit && !!FRUIT_PASSIVES[s.hero.fruit.id]?.awaken && (s.growth.fruitMastery ?? 0) >= 100))
      && (blocked.includes(t.gate) || active.includes(t.branch)
      || (t.gate === 'haki.armament.awaken' && needArmament))));
}

function masterOffer(s: LifeState, seek = false, forceId?: string): { body: string; options: ResolvedOption[]; speaker: ChoicePending['speaker'] } | null {
  if (s.growth.master) return null;
  const blocked = blockedGates(s).map((x) => x.gate);
  let m = forceId ? MASTER_BY_ID[forceId] : undefined;
  if (!m) {
    const cands = masterCandidates(s, seek);
    if (!cands.length) return null;
    const r = rngOf(s.rng);
    m = cands.find((x) => x.teaches.some((t) => blocked.includes(t.gate))) ?? cands[int(r, 0, cands.length - 1)];
  }
  // 약속한 스승은 직접 가르친 제자이니 기술 숙련 조건은 보지 않는다
  const promisedTo = !!forceId && s.world.masterPromise?.master === forceId;
  const accepts = promisedTo ? m.accepts.filter((c) => c.c !== 'skill') : m.accepts;
  const ok = checkAll(s, accepts);
  const why = ok ? null : firstFailReason(s, accepts);
  const feeWhy = s.hero.money < m.fee ? `돈 ${fmtMoney(m.fee)} 필요` : null;
  const options: ResolvedOption[] = [];
  const trials: string[] = [];
  for (const t of m.teaches.filter((x) => !s.growth.gates.includes(x.gate))) {
    const prev = PREV_GATE[t.gate];
    // 아래 단계가 막혀 있다: 시험을 통과하면 그것부터 가르친다
    if (prev && !s.growth.gates.includes(prev)) {
      if (s.world.trial || trials.includes(prev)) continue;
      trials.push(prev);
      const tr = trialOf(m.id);
      options.push({
        label: `시험을 받고 「${GATE_NAMES[prev]}」부터 배운다`,
        hint: `시험: ${tr.short} (혼자 싸운다) → 통과하면 ${TRIAL_TEACH_MONTHS}개월 수련 · 준비가 되면 「${GATE_NAMES[t.gate]}」을(를) 가르치러 다시 온다`,
        disabled: null, danger: true,
        effects: [{ op: 'masterTrial', master: m.id, branch: t.branch, gate: prev, next: t.gate }],
      });
      continue;
    }
    options.push({
      label: `「${GATE_NAMES[t.gate]}」을(를) 배운다`,
      hint: `${t.months}개월 수련. ${BRANCH_NAMES[t.branch]}이(가) 두 배로 자란다${m.fee ? ` · 수업료 ${fmtMoney(m.fee)}` : ''}`,
      disabled: why ?? feeWhy,
      effects: [{ op: 'apprentice', master: m.id, branch: t.branch, gate: t.gate, months: t.months, fee: m.fee }],
    });
  }
  options.push({ label: '정중히 사양한다', hint: '지금의 수련을 이어 간다', disabled: null, effects: [] });
  const promised = promisedTo;
  const say = promised ? '약속대로 왔다. 이제 다음 단계다.'
    : trials.length ? `${GATE_NAMES[trials[0]]}도 모르는 자에게 그다음은 없다. 기초부터 다져 주마. 단, 시험이 먼저다.`
    : ok ? '가르쳐 줄 수 있다. 따라오겠나?' : '아직은 이르다. 더 강해져서 오너라.';
  return {
    body: `${promised ? '약속대로 ' : ''}${m.title} ${m.name}이(가) ${promised ? '다시 찾아왔다' : '너를 지켜보고 있었다'}. "${say}"`,
    options, speaker: { name: m.name, faceKey: m.id, faction: m.faction, gender: m.gender, age: m.age, species: m.species },
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
      ...s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew && !p.crew.fruit).slice(0, 3).map((p) => ({
        label: `${p.name}에게 먹인다`, hint: `${traitOf(p).name} · ${roleName(p.crew!.role)}. 동료가 강해진다. 헤엄칠 수 없게 된다`, disabled: null,
        effects: [{ op: 'feedFruit', uid: u.uid, who: p.id }],
      })),
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
    speaker: { name: b.name, faceKey: b.canon ?? b.id + b.name, faction: b.faction, gender: b.gender, age: b.age, species: b.species },
    options: [
      { label: '지금 도전한다', hint: '정찰과 준비 화면으로 간다', disabled: null, effects: [{ op: 'battle', enemy: b.id, elite: true, lethal: true }] },
      { label: '더 수련한다', hint: '1년 뒤 다시 묻는다. 해역 패널에서 언제든 도전할 수 있다', disabled: null, effects: [{ op: 'bossLater', months: B.world.bossRetryAskMonths }] },
    ],
  };
}

function shipOffer(s: LifeState): { body: string; options: ResolvedOption[] } | null {
  const next = s.choice.flags.includes('lost_ship') ? s.world.seaId : nextSea(s.world.seaId);
  if (!next) return null;
  const need = SEA_BY_ID[next].shipRequired;
  const ships = SHIPS.filter((x) => x.tier >= need && x.tier <= need + 1);
  if (!ships.length) return null;
  return {
    body: `${SEA_BY_ID[next].name}(으)로 가려면 ${SHIPS.find((x) => x.tier === need)?.name} 이상의 배가 필요하다. 지금 가진 돈은 ${fmtMoney(s.hero.money)} 베리.`,
    options: [
      ...ships.map((x) => {
        const price = shipPrice(s, x.price);
        return {
          label: `${x.name}을(를) 산다`, hint: `${fmtMoney(price)} 베리 · 동료 ${x.crew}명${price < x.price ? ' · 목수 할인' : ''}`,
          disabled: s.hero.money < price ? `돈 ${fmtMoney(price)} 필요` : null,
          effects: [{ op: 'ship', id: x.id, price } as const],
        };
      }),
      { label: '돈을 더 모은다', hint: '임무와 교전으로 돈을 번다', disabled: null, effects: [] },
    ],
  };
}

/** 배 값. 목수 동료가 있으면 깎아 준다 */
export function shipPrice(s: LifeState, price: number) {
  const wright = s.people.some((p) => p.alive && p.kind === 'crew' && p.crew?.role === 'shipwright' && p.crew.injuredMonths <= 0);
  return Math.round(price * (wright ? B.crew.shipwrightDiscount : 1));
}

/** 지금 맡을 수 있는 곁가지 이야기 */
export function sideCandidates(s: LifeState) {
  if (s.world.side || s.hero.route === 'none') return [];
  const route = s.hero.route === 'marine' ? 'marine' : 'pirate';
  const done = s.world.sideDone ?? [];
  return SIDE_STORIES.filter((x) => x.route === route && x.seas.includes(s.world.seaId) && !done.includes(x.id));
}

function sideOffer(s: LifeState): { body: string; options: ResolvedOption[]; title: string } | null {
  const c = sideCandidates(s);
  if (!c.length) return null;
  const r = rngOf(s.rng);
  const st = c[int(r, 0, c.length - 1)];
  const reward = st.reward.filter((e) => e.op === 'base').map((e) => (e as { key: string; add: number })).map((e) => `${({ str: '힘', spd: '속도', vit: '체력', int: '지능', wil: '정신', luk: '운' } as Record<string, string>)[e.key]} +${e.add}`).join(', ');
  return {
    title: `곁가지 이야기 · ${st.title}`,
    body: `${st.hook}\n\n(맡으면 끝날 때까지 해역 임무는 쉰다. 지더라도 죽지는 않는다.)`,
    options: [
      { label: '맡는다', hint: `보상: ${reward}, 숙련 · 명성`, disabled: null, effects: [{ op: 'startSide', id: st.id }] },
      { label: '지금은 바쁘다', hint: '다음 기회에', disabled: null, effects: [] },
    ],
  };
}

/** 특성 고르기 (보조 칸 대신): 셋 중 하나. 이미 있으면 바꿀지 묻는다 */
function personaOffer(s: LifeState): { body: string; options: ResolvedOption[] } | null {
  const r = rngOf(s.rng);
  const cur = s.hero.persona ? HERO_TRAIT_BY_ID[s.hero.persona] : null;
  const pool = HERO_TRAITS.filter((t) => t.id !== cur?.id);
  const picks: typeof pool = [];
  while (picks.length < (cur ? 2 : 3) && pool.length) picks.push(pool.splice(int(r, 0, pool.length - 1), 1)[0]);
  const opts: ResolvedOption[] = picks.map((t) => ({ label: `「${t.name}」`, hint: t.desc, disabled: null, effects: [{ op: 'persona', id: t.id }] }));
  if (cur) opts.unshift({ label: `지금처럼 「${cur.name}」`, hint: cur.desc, disabled: null, effects: [] });
  return {
    body: cur
      ? `오랜 세월 「${cur.name}」으로 살아왔다. 큰일을 겪고 나니 마음가짐이 달라진 것 같다.`
      : '수련과 싸움을 거듭하며 몸에 밴 버릇이 생겼다. 어떤 사람이 되어 가고 있을까?',
    options: opts,
  };
}

/** 아이의 이름 짓기: 성별은 이 선택이 뜰 때 정해진다 */
function childOffer(s: LifeState): { body: string; options: ResolvedOption[] } | null {
  const r = rngOf(s.rng);
  const g: 'm' | 'f' = r() < 0.5 ? 'm' : 'f';
  const pool = [...FIRST_NAMES[g]];
  const names: string[] = [];
  while (names.length < 3 && pool.length) names.push(pool.splice(int(r, 0, pool.length - 1), 1)[0]);
  const spouse = s.people.find((p) => p.alive && p.relation === '배우자')?.name ?? '배우자';
  return {
    body: `${spouse}이(가) 갓난 ${g === 'm' ? '아들' : '딸'}을 안고 웃는다. "이름을 지어 줘."`,
    options: [
      ...names.map((n) => ({ label: `「${n}」라고 짓는다`, hint: `${s.hero.surname} ${n}. 가족이 늘면 생활비가 는다`, disabled: null, effects: [{ op: 'family', act: 'child', name: n, gender: g } as const] })),
    ],
  };
}

/**
 * 배신의 기미: 동료 하나가 의심받는다. 진짜 배신자인지는 이 선택이 뜰 때 정해지고 플레이어에게는 보이지 않는다.
 * 추궁하면 배신자와 1대1, 믿으면 달아나고, 지켜보면 지능에 따라 잡거나 놓친다.
 */
function betrayalOffer(s: LifeState): { body: string; options: ResolvedOption[]; speaker: ChoicePending['speaker'] } | null {
  const crew = s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew);
  if (crew.length < 2) return null;
  const r = rngOf(s.rng);
  const p = crew[int(r, 0, crew.length - 1)];
  const BT = B.betrayal;
  const traitor = r() < BT.traitorP;
  const watchP = Math.min(BT.watchMax, BT.watchBase + s.hero.base.int * BT.watchPerInt);
  const n = p.name;
  const trust: ResolvedOption['effects'] = traitor
    ? [{ op: 'leaveCrew', who: p.id, why: 'betray', takeMoneyPct: BT.stealPct }]
    : [{ op: 'log', text: `의심은 오해였다. ${n}은(는) 오히려 배를 노리던 첩자를 먼저 알아채 쫓아냈다.`, type: 'good' }, { op: 'bond', who: p.id, add: 20 }, { op: 'base', key: 'wil', add: 2 }];
  const confront: ResolvedOption['effects'] = traitor
    ? [
      { op: 'log', text: `${n}의 얼굴이 굳었다. "…눈치챘나." 칼을 뽑는다!`, type: 'danger' },
      { op: 'leaveCrew', who: p.id, why: 'exposed' },
      { op: 'battle', enemy: `crew:${p.id}`, elite: true, lethal: false, solo: true,
        win: [{ op: 'log', text: `${n}을(를) 쓰러뜨려 묶었다. 다음 항구에서 넘겼다.`, type: 'good' }, { op: 'fame', add: 5 }, { op: 'base', key: 'wil', add: 1 }],
        lose: [{ op: 'moneyPct', pct: -BT.duelLoseStealPct }, { op: 'log', text: `${n}은(는) 금고를 털어 밤바다로 사라졌다.`, type: 'danger' }] },
    ]
    : [
      { op: 'log', text: `${n}은(는) 아무 짓도 하지 않았다. 고향의 가족에게 편지를 보내고 있었을 뿐이다.`, type: 'info' },
      { op: 'chance', p: BT.hurtLeaveP, then: [{ op: 'leaveCrew', who: p.id, why: 'hurt' }],
        else: [{ op: 'bond', who: p.id, add: -25 }, { op: 'log', text: `${n}은(는) 억울해하면서도 배에 남았다. 사이가 서먹해졌다.`, type: 'info' }] },
    ];
  const watch: ResolvedOption['effects'] = traitor
    ? [{ op: 'chance', p: watchP,
      then: [{ op: 'log', text: `밤늦게 ${n}이(가) 적에게 밀서를 넘기는 현장을 잡았다.`, type: 'good' }, { op: 'leaveCrew', who: p.id, why: 'expelled' }, { op: 'fame', add: 2 }],
      else: [{ op: 'log', text: `며칠을 지켜봤지만 ${n}은(는) 한 발 빨랐다.`, type: 'danger' }, { op: 'leaveCrew', who: p.id, why: 'betray', takeMoneyPct: BT.stealPct }] }]
    : [{ op: 'log', text: `며칠을 지켜봤지만 ${n}에게 수상한 점은 없었다. 오해였다.`, type: 'info' }, { op: 'base', key: 'int', add: 1 }];
  return {
    body: `${n}(${roleName(p.crew!.role)})이(가) 밤마다 몰래 누군가와 연락하는 것 같다. 요즘 금고 근처를 서성이는 모습도 보였다.`,
    speaker: { name: n, personId: p.id, faction: p.faction, species: p.species, gender: p.gender, age: p.age },
    options: [
      { label: '믿고 맡긴다', hint: '의심을 거둔다. 정말 배신자라면 돈을 들고 달아날 것이다', disabled: null, effects: trust },
      { label: '불러서 추궁한다', hint: '진실을 밝힌다. 배신자라면 1대1로 싸운다. 아니라면 상처받아 떠날 수 있다', disabled: null, effects: confront },
      { label: '몰래 지켜본다', hint: `현장을 잡으면 조용히 쫓아낸다 · 알아챌 확률 ${Math.round(watchP * 100)}% (지능)`, disabled: null, effects: watch },
    ],
  };
}

/** 조선공의 의뢰: 필요한 배를 살 돈이 없으면, 조선소를 괴롭히는 패거리를 쫓아내고 배를 받는다 */
function shipwrightOffer(s: LifeState): { body: string; options: ResolvedOption[]; speaker: ChoicePending['speaker'] } | null {
  const target = s.choice.flags.includes('lost_ship') ? s.world.seaId : nextSea(s.world.seaId);
  if (!target) return null;
  const need = SEA_BY_ID[target].shipRequired;
  const ship = SHIPS.find((x) => x.tier >= need && x.id !== 'raft') ?? SHIPS.find((x) => x.tier >= need);
  if (!ship) return null;
  const r = rngOf(s.rng);
  const water7 = s.world.stage >= 3;
  const town = water7 ? '물의 도시 워터 세븐' : pick(r, ['시럽 마을', '로그타운의 조선소 골목', '후샤 마을 옆 포구']);
  const who = water7 ? '갈레라 컴퍼니의 늙은 목수장' : '바닷가 조선소의 늙은 조선공';
  const gang = water7 ? '해체업자 패거리' : '조선소의 목재를 털어 가는 무법자들';
  const price = shipPrice(s, ship.price);
  const half = Math.round(price / 2);
  return {
    body: `돈이 모자라 ${ship.name}을(를) 살 수 없다는 소문이 돌자, ${town}의 ${who}이(가) 찾아왔다. "${gang} 때문에 일을 못 하고 있네. 녀석들을 쫓아내 주면 ${ship.name} 한 척을 공짜로 만들어 주지."`,
    speaker: { name: who, faction: 'civil', gender: 'm', age: 68 },
    options: [
      { label: '의뢰를 받는다', hint: `강적전. 이기면 ${ship.name}(동료 ${ship.crew}명)을(를) 공짜로 받는다`, disabled: null, danger: true,
        effects: [{ op: 'battle', enemy: 'gen:captain:thug', elite: true, lethal: false,
          win: [{ op: 'ship', id: ship.id, price: 0 }, { op: 'log', text: `조선공이 약속대로 ${ship.name}을(를) 내주었다. 새 나무 냄새가 났다.`, type: 'good' }, { op: 'timeline', text: `조선공의 의뢰를 들어주고 ${ship.name}을(를) 받았다` }, { op: 'fame', add: 5 }],
          lose: [{ op: 'log', text: '패거리를 쫓아내지 못했다. 조선공은 "몸부터 추스르고 다시 오게"라고 했다.', type: 'danger' }] }] },
      { label: `반값에 산다 (${fmtMoney(half)} 베리)`, hint: '조선소 일을 거들어 주는 조건으로 반값', disabled: s.hero.money < half ? `돈 ${fmtMoney(half)} 필요` : null,
        effects: [{ op: 'ship', id: ship.id, price: half }] },
      { label: '거절한다', hint: '돈을 모아 직접 산다', disabled: null, effects: [] },
    ],
  };
}

/** 흩어진 옛 동료가 찾아온다. 처음 찾아온 동료는 압수된 배를 되찾아 오기도 한다 */
function reunionOffer(s: LifeState): { body: string; options: ResolvedOption[]; speaker: ChoicePending['speaker'] } | null {
  const scattered = s.people.filter((p) => p.alive && p.relation === '흩어진 옛 동료' && p.crew).sort((a, z) => z.bond - a.bond);
  const p = scattered[0];
  if (!p) return null;
  const r = rngOf(s.rng);
  const port = pick(r, sea(s).ports);
  const ship = s.world.lostShip ? SHIP_BY_ID[s.world.lostShip] : null;
  const cap = ship ? Math.max(ship.crew, crewCapacity(s)) : crewCapacity(s);
  const room = crewOf(s).length < cap;
  const n = p.name;
  const body = ship
    ? `${port} 부두에 낯익은 배가 닻을 내렸다. 뱃머리에 선 것은 ${n}(${roleName(p.crew!.role)})이었다. "선장! 해군 창고에서 ${ship.name}을(를) 훔쳐 왔어. 다들 어디 있는지도 알아 뒀지." 아직 ${scattered.length - 1}명이 더 흩어져 있다.`
    : `${port}의 술집에서 누군가 네 어깨를 쳤다. ${n}(${roleName(p.crew!.role)})이었다. "살아 있었구나, 선장. 네가 풀려났다는 소문을 듣고 왔어."${scattered.length > 1 ? ` 다른 동료 ${scattered.length - 1}명의 행방도 들었다고 한다.` : ''}`;
  const contacts = scattered.length > 1 ? ' 나머지 동료들의 전보벌레 번호를 받아 두었다. 이제 동료 칸에서 연락해 다시 부를 수 있다.' : '';
  const flag = { op: 'flag', id: 'crew_contacts' } as const satisfies Effect;
  return {
    body: body + contacts,
    speaker: { name: n, personId: p.id, faction: p.faction, species: p.species, gender: p.gender, age: p.age },
    options: [
      { label: '다시 함께 간다', hint: ship ? `${ship.name}을(를) 되찾고 ${n}이(가) 돌아온다` : `${n}이(가) 다시 동료가 된다`, disabled: room ? null : '배에 자리가 없다 · 더 큰 배가 필요하다',
        effects: [{ op: 'rejoin', who: p.id, ship: !!ship }, flag] },
      { label: '각자의 길을 가자고 한다', hint: `${n}은(는) 떠난다. 다시 찾아오지 않는다`, disabled: null, effects: [...(ship ? [{ op: 'rejoin', who: '', ship: true } as const satisfies Effect] : []), { op: 'partWays', who: p.id }, flag] },
      { label: '나중에 부르겠다고 한다', hint: '동료 칸에서 연락해 언제든 다시 부를 수 있다', disabled: null, effects: [...(ship ? [{ op: 'rejoin', who: '', ship: true } as const satisfies Effect] : []), { op: 'log', text: `${n}은(는) 전보벌레 번호를 적어 주며 "부르면 바로 갈게"라고 웃었다.`, type: 'info' }, flag] },
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
    case 'master': { const o = masterOffer(s, ch.id === 'ms_seek', ch.id === 'ms_return' ? s.world.masterPromise?.master : undefined); if (!o) return null; options = o.options; body = o.body; speaker = o.speaker; break; }
    case 'fruit': { const o = fruitOffer(s); if (!o) return null; options = o.options; body = o.body; break; }
    case 'challenge': { const o = challengeOffer(s); if (!o) return null; options = o.options; body = o.body; speaker = o.speaker; break; }
    case 'ship': { const o = shipOffer(s); if (!o) return null; options = o.options; body = o.body; break; }
    case 'side': { const o = sideOffer(s); if (!o) return null; options = o.options; body = o.body; return { kind: 'choice', choiceId: ch.id, category: ch.category, title: o.title, body, speaker, options }; }
    case 'persona': { const o = personaOffer(s); if (!o) return null; options = o.options; body = o.body; break; }
    case 'child': { const o = childOffer(s); if (!o) return null; options = o.options; body = o.body; break; }
    case 'betrayal': { const o = betrayalOffer(s); if (!o) return null; options = o.options; body = o.body; speaker = o.speaker; break; }
    case 'shipwright': { const o = shipwrightOffer(s); if (!o) return null; options = o.options; body = o.body; speaker = o.speaker; break; }
    case 'reunion': { const o = reunionOffer(s); if (!o) return null; options = o.options; body = o.body; speaker = o.speaker; break; }
    default:
      options = ch.options.map((o) => ({
        label: fill(o.label, v), hint: fill(o.hint, v), effects: o.effects, next: o.next, danger: o.danger,
        disabled: firstFailReason(s, o.when),
      }));
  }
  if (!options || !options.length) return null;
  // 어떤 선택지를 골라도 나아가야 한다: 모두 막혀 있으면 마지막 것을 연다
  if (options.every((o) => o.disabled)) options[options.length - 1].disabled = null;
  options = options.map((o) => ({ ...o, label: josa(o.label), hint: josa(o.hint), disabled: o.disabled ? josa(o.disabled) : o.disabled }));
  return { kind: 'choice', choiceId: ch.id, category: ch.category, title: fill(ch.title, v), body: josa(body), speaker, options };
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
/** 지금 필요한 선택들 (03 문서 5장의 표). 앞에 있는 것부터 띄울 수 있는 것을 띄운다 */
function urgent(s: LifeState): string[] {
  const now = absMonth(s);
  const h = s.hero;
  const out: string[] = [];
  if (h.age >= 10 && !s.growth.focus) out.push('en_dojo');
  if (h.age >= 13 && !h.persona && cooledDown(s, CHOICE_BY_ID.ps_choose)) out.push('ps_choose');
  if (h.age >= B.world.routeAge && h.route === 'none' && cooledDown(s, CHOICE_BY_ID.cr_route)) out.push('cr_route');
  if (s.inventory.unknownFruits.some((u) => !u.asked && now - u.foundAt <= B.choice.fruitAskWithin)) out.push('fr_found');
  if (s.world.boss.state === 'revealed' && now >= s.world.boss.nextAskAt) out.push('bo_challenge');
  // 보스에게 막혔으면 곁가지 이야기를 먼저 권한다
  if (s.world.boss.state === 'revealed' && (s.world.boss.attempts > 0 || now < s.world.boss.nextAskAt) && sideCandidates(s).length
    && cooledDown(s, { ...CHOICE_BY_ID.sd_offer, cooldownYears: 1 })) out.push('sd_offer');
  if (s.choice.flags.includes('need_ship') || (s.choice.flags.includes('lost_ship') && !s.world.prison)) {
    const next = s.choice.flags.includes('lost_ship') ? s.world.seaId : nextSea(s.world.seaId);
    const need = next ? SEA_BY_ID[next].shipRequired : 99;
    const cheapest = SHIPS.find((x) => x.tier >= need);
    if (cheapest && h.money >= shipPrice(s, cheapest.price) && cooledDown(s, { ...CHOICE_BY_ID.sh_buy, cooldownYears: 1 })) out.push('sh_buy');
    // 살 돈이 없어 막혔다: 조선공의 의뢰
    else if (cheapest && h.money < shipPrice(s, cheapest.price) && h.route !== 'marine' && !s.world.prison && cooledDown(s, CHOICE_BY_ID.sh_shipwright)) out.push('sh_shipwright');
  }
  // 임펠 다운에서 나왔다: 흩어진 동료가 하나씩 찾아온다 (몇 달 간격)
  if (!s.world.prison && s.people.some((p) => p.alive && p.relation === '흩어진 옛 동료' && p.crew) && cooledDown(s, CHOICE_BY_ID.rc_reunion)) out.push('rc_reunion');
  if ((h.illness || h.injuries.some((i) => i.severity === 'heavy')) && h.money < treatCost(s) && cooledDown(s, { ...CHOICE_BY_ID.cs_no_money_ill, cooldownYears: 1 })) out.push('cs_no_money_ill');
  // 자연계에 막혔다: 무장색을 가르쳐 줄 스승, 없으면 스스로 깨우치는 선택
  if (s.choice.flags.includes('need_armament') && !s.growth.gates.includes('haki.armament.awaken') && h.age >= 14) {
    if (!s.growth.master && cooledDown(s, { ...CHOICE_BY_ID.ms_offer, cooldownYears: 1 })) out.push('ms_offer');
    if (cooledDown(s, CHOICE_BY_ID.hk_armament_need)) out.push('hk_armament_need');
  }
  if (blockedGates(s).length && !s.growth.master && cooledDown(s, CHOICE_BY_ID.ms_offer)) out.push('ms_offer');
  // 시험을 통과한 스승: 아래 단계를 익히고 조건을 채우면 약속대로 다시 찾아온다
  const pr = s.world.masterPromise;
  if (pr) {
    const pm = MASTER_BY_ID[pr.master];
    if (!pm || s.growth.gates.includes(pr.gate)) s.world.masterPromise = undefined;
    else if (!s.growth.master && !s.world.trial && s.growth.gates.includes(PREV_GATE[pr.gate] ?? pr.gate) && checkAll(s, pm.accepts.filter((c) => c.c !== 'skill')) && cooledDown(s, CHOICE_BY_ID.ms_return)) out.push('ms_return');
  }
  return [...new Set(out)];
}

/** 이번 달에 선택을 띄운다. 띄웠으면 true */
export function maybeRaiseChoice(s: LifeState): boolean {
  if (s.pending) return false;
  const now = absMonth(s);
  if (now < s.choice.nextAt) return false;
  const pauses = s.choice.pauses ?? 0;
  // 한 해에 멈추는 수의 상한. 출발에 꼭 필요한 선택만 넘을 수 있다
  const critical = s.hero.age >= 10 && !s.growth.focus ? 'en_dojo'
    : s.hero.age >= B.world.routeAge && s.hero.route === 'none' ? 'cr_route' : null;
  if (pauses >= B.choice.perYear) {
    if (!critical || !cooledDown(s, CHOICE_BY_ID[critical])) return false;
    const p = resolveChoice(s, critical);
    if (p) { s.pending = p; return true; }
    return false;
  }
  // 1. 예약된 것
  while (s.choice.queue.length) {
    const id = s.choice.queue.shift()!;
    const p = resolveChoice(s, id);
    if (p) { s.pending = p; return true; }
  }
  // 2. 지금 필요한 것 (한 해 상한을 넘어도 뜬다)
  for (const u of urgent(s)) {
    const p = resolveChoice(s, u);
    if (p) { s.pending = p; return true; }
  }
  if (pauses >= B.choice.randomCap) return false;
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
