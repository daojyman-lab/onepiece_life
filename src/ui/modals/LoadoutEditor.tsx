// 편성 편집기. 강적 준비 화면과 편성 창이 함께 쓴다.
import { crewCapacity } from '../../core/effects';
import { getSkill } from '../../core/growth/skillbook';
import { crewOf, roleName } from '../../core/people';
import type { EnemySpec, LifeState, Loadout } from '../../core/types';
import { ITEM_BY_ID } from '../../data/items';
import { BRANCH_NAMES } from '../../data/skills';
import { TACTIC_HINT, TACTIC_NAMES } from '../common';
import type { Assign } from '../../core/combat/battle';

export function LoadoutEditor({ s, lo, setLo, enemy, assign, setAssign }: {
  s: LifeState; lo: Loadout; setLo: (l: Loadout) => void;
  enemy?: EnemySpec; assign?: Assign; setAssign?: (a: Assign) => void;
}) {
  const learned = Object.keys(s.growth.skills).map((id) => ({ id, sk: getSkill(id)!, m: s.growth.skills[id].mastery })).filter((x) => x.sk);
  const toggleSkill = (id: string) => {
    const has = lo.skills.includes(id);
    if (!has && lo.skills.length >= 6) return;
    setLo({ ...lo, skills: has ? lo.skills.filter((x) => x !== id) : [...lo.skills, id] });
  };
  const owned = (kind: string) => s.inventory.items.filter((x) => ITEM_BY_ID[x.id]?.kind === kind);
  const cons = owned('consumable');
  const countIn = (id: string) => lo.consumables.filter((x) => x === id).length;
  const crew = crewOf(s);
  const cap = crewCapacity(s);
  const foes = enemy ? [enemy, ...enemy.officers] : [];

  return (
    <div class="stack">
      <div>
        <div class="row between"><b>기술 ({lo.skills.length}/6)</b><span class="t9 soft">전투 중 조건이 맞으면 자동으로 쓴다</span></div>
        <div class="grid2" style={{ marginTop: 4 }}>
          {learned.map(({ id, sk, m }) => {
            const on = lo.skills.includes(id);
            return (
              <button class={`btn small ${on ? 'on' : ''}`} style={{ justifyContent: 'space-between' }} onClick={() => toggleSkill(id)} title={sk.text} aria-pressed={on}>
                <span>{sk.name}</span>
                <span class="t9">{sk.kind === 'attack' ? `×${sk.power}` : sk.kind === 'passive' ? '상시' : sk.kind === 'guard' ? '방어' : '보조'} · {Math.floor(m)}</span>
              </button>
            );
          })}
          {learned.length === 0 && <span class="soft t9">배운 기술이 없다</span>}
        </div>
      </div>
      <div>
        <b>전법</b>
        <div class="row" style={{ marginTop: 4 }}>
          {(Object.keys(TACTIC_NAMES) as Loadout['tactic'][]).map((t) => (
            <button class={`btn small ${lo.tactic === t ? 'on' : ''}`} onClick={() => setLo({ ...lo, tactic: t })} title={TACTIC_HINT[t]} aria-pressed={lo.tactic === t}>{TACTIC_NAMES[t]}</button>
          ))}
        </div>
        <div class="t9 soft">{TACTIC_HINT[lo.tactic]}</div>
      </div>
      <div class="row">
        <b>물러날 기준</b>
        {([0, 0.3, 0.5] as const).map((x) => (
          <button class={`btn small ${lo.retreatAt === x ? 'on' : ''}`} onClick={() => setLo({ ...lo, retreatAt: x })}>{x === 0 ? '끝까지' : `체력 ${x * 100}%`}</button>
        ))}
      </div>
      <div class="grid3">
        {(['weapon', 'armor', 'charm'] as const).map((slot) => (
          <label class="stack t9">{({ weapon: '무기', armor: '방어구', charm: '장신구' })[slot]}
            <select value={lo[slot] ?? ''} onChange={(e) => setLo({ ...lo, [slot]: (e.target as HTMLSelectElement).value || null })}>
              <option value="">없음</option>
              {owned(slot).map((x) => {
                const it = ITEM_BY_ID[x.id];
                const extra = it.branch ? ` (${BRANCH_NAMES[it.branch]} ×${it.mult})` : it.armor ? ` (방어 +${it.armor})` : '';
                return <option value={x.id}>{it.name}{extra}</option>;
              })}
            </select>
          </label>
        ))}
      </div>
      <div>
        <div class="row between"><b>소모품 ({lo.consumables.length}/3)</b><span class="t9 soft">조건이 맞으면 자동으로 쓴다</span></div>
        <div class="row" style={{ marginTop: 4 }}>
          {cons.length === 0 && <span class="soft t9">가진 소모품이 없다. 상점에서 산다.</span>}
          {cons.map((x) => {
            const n = countIn(x.id);
            return (
              <span class="row">
                <span class="tag">{ITEM_BY_ID[x.id].name} {n}/{x.count}</span>
                <button class="btn small" disabled={n >= x.count || lo.consumables.length >= 3} onClick={() => setLo({ ...lo, consumables: [...lo.consumables, x.id] })}>+</button>
                <button class="btn small" disabled={n === 0} onClick={() => { const i = lo.consumables.indexOf(x.id); setLo({ ...lo, consumables: lo.consumables.filter((_, j) => j !== i) }); }}>−</button>
              </span>
            );
          })}
        </div>
      </div>
      <div>
        <div class="row between"><b>동료 ({lo.crew.length}/{cap})</b>{enemy && <span class="t9 soft">누가 누구를 맡을지 정한다</span>}</div>
        {crew.length === 0 && <div class="soft t9">동료가 없다.</div>}
        {crew.map((p) => {
          const on = lo.crew.some((c) => c.personId === p.id);
          const fighter = p.crew!.role === 'vanguard' || p.crew!.role === 'support';
          return (
            <div class="row" style={{ marginTop: 4 }}>
              <button class={`btn small ${on ? 'on' : ''}`} disabled={!on && lo.crew.length >= cap} aria-pressed={on}
                onClick={() => setLo({ ...lo, crew: on ? lo.crew.filter((c) => c.personId !== p.id) : [...lo.crew, { personId: p.id, role: p.crew!.role }] })}>
                {p.name} · {roleName(p.crew!.role)} Lv.{p.crew!.level}{p.crew!.injuredMonths > 0 ? ' (부상)' : ''}
              </button>
              {enemy && on && fighter && assign && setAssign && foes.length > 1 && (
                <select value={assign[p.id] ?? 0} onChange={(e) => setAssign({ ...assign, [p.id]: Number((e.target as HTMLSelectElement).value) })}>
                  {foes.map((f, i) => <option value={i}>맡을 상대: {f.name}{i === 0 ? ' (우두머리)' : ''}</option>)}
                </select>
              )}
              {on && !fighter && <span class="t9 soft">{p.crew!.role === 'medic' ? '3합마다 회복' : '싸우지 않는다'}</span>}
            </div>
          );
        })}
      </div>
      {enemy && foes.length > 1 && assign && setAssign && (
        <label class="row t9"><b>내가 맡을 상대</b>
          <select value={assign.hero ?? 0} onChange={(e) => setAssign({ ...assign, hero: Number((e.target as HTMLSelectElement).value) })}>
            {foes.map((f, i) => <option value={i}>{f.name}{i === 0 ? ' (우두머리)' : ''}</option>)}
          </select>
        </label>
      )}
    </div>
  );
}
