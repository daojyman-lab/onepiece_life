import { useEffect, useState } from 'preact/hooks';
import { dispatch } from '../../app/store';
import { defaultAssign, riskOf, scoutLevel, shownOdds, winRate, type Assign } from '../../core/combat/battle';
import { getSkill } from '../../core/growth/skillbook';
import { sanitizeLoadout } from '../../core/reduce';
import type { EnemySpec, LifeState, Loadout, Pending } from '../../core/types';
import { B } from '../../data/balance';
import { CLASS_NAMES } from '../../data/fruits';
import { Face, Modal, RISK_NAMES, STAT_KEYS, STAT_NAMES, TACTIC_NAMES } from '../common';
import { LoadoutEditor } from './LoadoutEditor';
import { logiaMult } from '../../core/combat/engine';
import { armamentLevel } from '../../core/growth/skillbook';
import { ITEM_BY_ID } from '../../data/items';

/** 자연계 대책: 지금 편성으로 얼마나 닿는지, 무엇으로 뚫을 수 있는지 */
function LogiaCounter({ s, lo }: { s: LifeState; lo: Loadout }) {
  const arm = armamentLevel(s);
  const w = lo.weapon ? ITEM_BY_ID[lo.weapon] : null;
  const me = { armament: arm, weapon: w?.branch ? { branch: w.branch, mult: w.mult ?? 1, seastone: !!w.seastone } : null };
  const foe = { fruitClass: 'logia' as const, sealed: 0, bound: 0 };
  const skills = lo.skills.map((id) => getSkill(id)).filter((k): k is NonNullable<typeof k> => !!k);
  const attacks = skills.filter((k) => k.kind === 'attack');
  const best = Math.max(logiaMult(me, foe, null).mult, ...attacks.map((k) => logiaMult(me, foe, k).mult));
  const pierce = attacks.filter((k) => k.tags.includes('pierce'));
  const binds = skills.filter((k) => k.effect?.type === 'bind');
  const ss = lo.consumables.filter((x) => x === 'seastone').length;
  const nets = lo.consumables.filter((x) => x === 'net').length;
  const ok = (b: boolean) => <span class={b ? 'green' : 'red'}>{b ? '✓' : '✕'}</span>;
  return (
    <div class="paper t9" style={{ borderColor: best < 0.5 ? 'var(--red)' : undefined }}>
      <div class="row between"><b>자연계 대책</b><span>지금 공격이 들어가는 비율 <b class={best < 0.5 ? 'red' : 'green'}>{Math.round(best * 100)}%</b></span></div>
      <div>{ok(arm > 0)} 무장색 {arm}단계 — 단계마다 25%씩 더 닿는다{arm === 0 ? ' (스승 · 사건으로 연다)' : ''}</div>
      <div>{ok(!!w?.seastone)} 해루석 무기 — 같은 갈래 기술이 한 단계 더 닿는다{!w?.seastone ? ' (상점: 해루석 십수 · 장갑 · 작살총)' : ''}</div>
      <div>{ok(pierce.length > 0)} 관통 기술 — 한 단계 더 닿는다{pierce.length ? `: ${pierce.map((k) => k.name).join(', ')}` : ''}</div>
      <div>{ok(ss > 0)} 해루석 탄환 {ss}개 — 맞히면 3합 동안 실체가 잡혀 모든 공격이 100%</div>
      <div>{ok(nets > 0 || binds.length > 0)} 묶기 — 묶인 동안 실체가 드러나 100%{binds.length ? `: ${binds.map((k) => k.name).join(', ')}` : ''}{nets ? ` · 해루석 그물 ${nets}개` : ''}</div>
    </div>
  );
}

const foeWho = (e: EnemySpec) => ({ key: e.canon ?? e.id + e.name, gender: e.gender, age: e.age, species: e.species, faction: e.faction, form: e.form });

function Scout({ s, e, level }: { s: LifeState; e: EnemySpec; level: 0 | 1 | 2 }) {
  const strongest = e.skills.map((id) => getSkill(id)).filter(Boolean).sort((a, b) => b!.power - a!.power);
  return (
    <div class="paper stack">
      <div class="row">
        <Face who={foeWho(e)} size="big" />
        <div>
          <div class="t14"><b>{e.name}</b></div>
          <div class="t9 soft">{e.title ?? ''}</div>
          <div class="row" style={{ marginTop: 4 }}>
            <span class="tag">{e.fruitClass ? `${CLASS_NAMES[e.fruitClass]} 능력자` : '능력자 아님'}</span>
            <span class="tag">간부 {e.officers.length}명</span>
            {e.fruitClass === 'logia' && <span class="tag red">자연계: 무장색 없는 공격은 1/4</span>}
          </div>
        </div>
      </div>
      {level >= 1 ? (
        <div class="t9">전법 <b>{TACTIC_NAMES[e.tactic]}</b> · 주력 기술 {strongest.slice(0, 2).map((k) => `「${k!.name}」`).join(' ')}</div>
      ) : <div class="t9 soft">더 알려면 지능 {B.combat.scout.midInt} 이상이거나 항해사 동료가 있어야 한다.</div>}
      {level >= 2 ? (
        <div class="t9">
          {STAT_KEYS.map((k) => <span style={{ marginRight: 8 }}>{STAT_NAMES[k]} {e.base[k]}</span>)}
          <div>무장색 {e.armament} · 견문색 {e.observation} · 기술 {strongest.map((k) => k!.name).join(', ')}</div>
          {e.officers.map((o) => <div>간부 {o.name}: 힘 {o.base.str} 속도 {o.base.spd} 체력 {o.base.vit}{o.fruitClass ? ` · ${CLASS_NAMES[o.fruitClass]}` : ''}</div>)}
        </div>
      ) : level === 1 ? <div class="t9 soft">능력치를 보려면 지능 {B.combat.scout.fullInt} 이상이거나 도감에 있어야 한다.</div> : null}
      {s.known.people.includes(e.id) && <span class="tag gold">도감: 지난 인생에서 만난 상대</span>}
    </div>
  );
}

export function PrepModal({ s, p }: { s: LifeState; p: Extract<Pending, { kind: 'prep' }> }) {
  const enc = p.encounter;
  const [lo, setLo] = useState<Loadout>(() => sanitizeLoadout(s, s.loadout));
  const [assign, setAssign] = useState<Assign>(() => defaultAssign(s, enc, s.loadout));
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    setRate(null);
    const id = setTimeout(() => setRate(winRate(s, enc, sanitizeLoadout(s, lo), assign)), 30);
    return () => clearTimeout(id);
  }, [lo, assign]);
  const level = scoutLevel(s, s.known.people.includes(enc.enemy.id));
  const odds = rate === null ? null : shownOdds(s, rate);
  const risk = odds ? riskOf(odds.shown) : null;
  const what = enc.source === 'boss' ? '해역 보스' : enc.spar ? '대련' : '강적';
  return (
    <Modal title={`${what} · 정찰과 준비`} wide>
      <div class="grid2" style={{ alignItems: 'start' }}>
        <div class="stack">
          <Scout s={s} e={enc.enemy} level={level} />
          {(enc.enemy.fruitClass === 'logia' || enc.enemy.officers.some((o) => o.fruitClass === 'logia')) && <LogiaCounter s={s} lo={lo} />}
          <div class="paper">
            <div class="row between">
              <b>미리 본 승률</b>
              {odds ? <span class="t14"><b>{Math.round(odds.shown * 100)}%</b> <span class="t9 soft">±{Math.round(odds.noise)}%</span></span> : <span class="soft">계산 중…</span>}
            </div>
            {risk && (
              <div class="row" style={{ marginTop: 4 }}>
                <span class={`tag ${risk === 'safe' ? 'green' : risk === 'danger' ? 'gold' : 'red'}`}>{RISK_NAMES[risk]}</span>
                <span class="t9">{enc.spar ? '대련이라 죽지 않는다.' : !enc.lethal ? '지더라도 죽지 않는다.'
                  : risk === 'lethal' ? `지면 ${B.combat.deathP.lethal * 100}% 확률로 죽는다!` : risk === 'danger' ? `지면 ${B.combat.deathP.danger * 100}% 확률로 죽는다.` : '지더라도 죽지 않는다.'}</span>
              </div>
            )}
            {enc.atSea && s.hero.fruit && <div class="t9 red">바다 위 전투다. 능력자는 물에 빠질 수 있다.</div>}
            <div class="t9 soft">편성을 바꾸면 승률을 다시 낸다. 준비한 편성은 평소 교전에도 쓰인다.</div>
          </div>
          <div class="row">
            <button class="btn gold" onClick={() => dispatch({ type: 'confirmPrep', loadout: lo, assign })}>전투 시작</button>
            <button class="btn" onClick={() => dispatch({ type: 'withdrawPrep' })}>
              물리기 {enc.source === 'mission' ? '(임무 실패)' : enc.source === 'boss' ? '(불이익 없음)' : ''}
            </button>
          </div>
        </div>
        <LoadoutEditor s={s} lo={lo} setLo={setLo} enemy={enc.enemy} assign={assign} setAssign={setAssign} />
      </div>
    </Modal>
  );
}
