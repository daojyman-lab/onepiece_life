// 상점 · 소지품 (시안 B): 왼쪽 분류 메뉴 · 가운데 목록 · 오른쪽 상세.
// 창 높이를 화면에 맞추고, 분류를 바꿔 가며 보므로 창 전체가 스크롤되지 않는다.
import { useState } from 'preact/hooks';
import { actions, dispatch } from '../../app/store';
import type { Item, LifeState } from '../../core/types';
import { B } from '../../data/balance';
import { ITEMS, ITEM_BY_ID } from '../../data/items';
import { BRANCH_NAMES } from '../../data/skills';
import { fmt, Modal, STAT_NAMES } from '../common';
import { crewOf, traitOf } from '../../core/people';
import { CREW_GEAR, INTEL_PRICE, SHIP_PARTS, SURGERY_PRICE } from '../../data/upgrades';
import { BOSS_BY_ID } from '../../data/bosses';

type Cat = 'weapon' | 'armor' | 'charm' | 'consumable' | 'bag' | 'fruit' | 'ship' | 'gear' | 'service';
const BUY_CATS: { id: Cat; label: string }[] = [
  { id: 'weapon', label: '무기' }, { id: 'armor', label: '방어구' }, { id: 'charm', label: '장신구' }, { id: 'consumable', label: '소모품' },
];

/** 목록 한 줄 */
interface Row { key: string; name: string; side: string; dim?: boolean }

/** 물건 한 줄 설명 */
function itemEffect(it: Item) {
  if (it.branch) return `${BRANCH_NAMES[it.branch]} 공격 ×${it.mult}${it.seastone ? ' · 해루석: 자연계에 닿는다' : ''}`;
  if (it.armor) return `방어 +${it.armor}`;
  if (it.bonus) return Object.entries(it.bonus).map(([k, v]) => `${STAT_NAMES[k as keyof typeof STAT_NAMES]} +${v}`).join(' · ');
  return it.text;
}

/** 지금 편성에 든 같은 종류 물건 */
function equippedOf(s: LifeState, it: Item): Item | null {
  const id = it.kind === 'weapon' ? s.loadout.weapon : it.kind === 'armor' ? s.loadout.armor : it.kind === 'charm' ? s.loadout.charm : null;
  return id ? ITEM_BY_ID[id] ?? null : null;
}

export function ShopModal({ s }: { s: LifeState }) {
  const [cat, setCat] = useState<Cat>('weapon');
  const [sel, setSel] = useState<string | null>(null);
  const forSale = ITEMS.filter((i) => i.price > 0 && i.grade <= s.world.stage + 1);
  const fee = B.money.appraise * s.world.stage;
  const parts = s.world.shipParts ?? [];
  const pirateShip = s.hero.route !== 'marine' && !!s.world.ship;
  const crew = crewOf(s);
  const boss = s.world.boss.state === 'revealed' ? BOSS_BY_ID[s.world.boss.id] : null;
  const intel = INTEL_PRICE * s.world.stage;
  const surgery = SURGERY_PRICE * s.world.stage;
  const scar = s.hero.injuries.find((i) => i.severity === 'scar');
  const bagCount = s.inventory.items.reduce((n, x) => n + x.count, 0);

  const menu: { group: string; items: { id: Cat; label: string; badge?: number; hide?: boolean }[] }[] = [
    { group: '사기', items: BUY_CATS },
    { group: '내 것', items: [
      { id: 'bag', label: '소지품', badge: bagCount },
      { id: 'fruit', label: '정체 모를 열매', badge: s.inventory.unknownFruits.length },
    ] },
    { group: '서비스', items: [
      { id: 'ship', label: '배 개조', hide: !pirateShip },
      { id: 'gear', label: s.hero.route === 'marine' ? '분대원 장비' : '동료 장비', hide: crew.length === 0 },
      { id: 'service', label: '정보상 · 명의', hide: !boss && !scar },
    ] },
  ];

  // 가운데 목록
  let rows: Row[] = [];
  if (BUY_CATS.some((c) => c.id === cat)) {
    rows = forSale.filter((i) => i.kind === cat).map((i) => ({ key: i.id, name: i.name, side: fmt(i.price), dim: s.hero.money < i.price }));
  } else if (cat === 'bag') {
    rows = s.inventory.items.map((x) => ({ key: x.id, name: `${ITEM_BY_ID[x.id]?.name ?? x.id} ×${x.count}`, side: ITEM_BY_ID[x.id]?.price ? fmt(ITEM_BY_ID[x.id].price * 0.5) : '—' }));
  } else if (cat === 'fruit') {
    rows = s.inventory.unknownFruits.map((u, i) => ({ key: u.uid, name: `소용돌이 열매 ${i + 1}`, side: `힌트 ${u.hints.length}/3` }));
  } else if (cat === 'ship') {
    rows = SHIP_PARTS.map((pt) => ({ key: pt.id, name: pt.name, side: parts.includes(pt.id) ? '달았다' : fmt(pt.price), dim: s.world.stage < pt.minStage }));
  } else if (cat === 'gear') {
    rows = crew.map((p) => { const g = p.crew!.gear ?? 0; return { key: p.id, name: p.name, side: CREW_GEAR[g].name }; });
  } else if (cat === 'service') {
    rows = [
      ...(boss ? [{ key: 'intel', name: `${boss.name}의 정보`, side: s.known.people.includes(boss.id) ? '안다' : fmt(intel) }] : []),
      ...(scar ? [{ key: 'surgery', name: '후유증 수술', side: fmt(surgery) }] : []),
    ];
  }
  const current = rows.find((r) => r.key === sel) ?? rows[0] ?? null;
  const pick = (c: Cat) => { setCat(c); setSel(null); };

  return (
    <Modal title="상점 · 소지품" onClose={() => actions.close()} wide cls="shop-modal">
      <div class="row between" style={{ marginBottom: 6 }}>
        <span>가진 돈 <b>{fmt(s.hero.money)} 베리</b></span>
        <span class="t9 soft">창이 열려 있는 동안 시간이 멈춘다</span>
      </div>
      <div class="shop">
        <nav class="shop-menu paper" aria-label="분류">
          {menu.filter((g) => g.items.some((x) => !x.hide)).map((g) => (
            <div class="shop-group">
              <div class="shop-group-title">{g.group}</div>
              {g.items.filter((x) => !x.hide).map((x) => (
                <button class={`shop-cat ${cat === x.id ? 'on' : ''}`} aria-pressed={cat === x.id} onClick={() => pick(x.id)}>
                  <span>{x.label}</span>{x.badge ? <span class="shop-badge">{x.badge}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div class="shop-list paper" role="listbox" aria-label="목록">
          {rows.length === 0 && <div class="soft t9" style={{ padding: 6 }}>{cat === 'bag' ? '소지품이 없다.' : cat === 'fruit' ? '정체 모를 열매가 없다.' : '지금 살 수 있는 것이 없다.'}</div>}
          {rows.map((r) => (
            <button role="option" aria-selected={current?.key === r.key} class={`shop-row ${current?.key === r.key ? 'on' : ''} ${r.dim ? 'dim' : ''}`} onClick={() => setSel(r.key)}>
              <span>{r.name}</span><span class="num t9">{r.side}</span>
            </button>
          ))}
        </div>
        <div class="shop-detail paper">
          {current ? <Detail s={s} cat={cat} keyId={current.key} fee={fee} intel={intel} surgery={surgery} /> : <div class="soft t9">왼쪽에서 분류를 고른다.</div>}
        </div>
      </div>
    </Modal>
  );
}

/** 오른쪽 상세: 설명 · 비교 · 버튼 */
function Detail({ s, cat, keyId, fee, intel, surgery }: { s: LifeState; cat: Cat; keyId: string; fee: number; intel: number; surgery: number }) {
  const money = s.hero.money;
  if (BUY_CATS.some((c) => c.id === cat) || cat === 'bag') {
    const it = ITEM_BY_ID[keyId];
    if (!it) return null;
    const eq = equippedOf(s, it);
    const owned = s.inventory.items.find((x) => x.id === it.id)?.count ?? 0;
    return (
      <div class="stack">
        <b class="t14">{it.name}</b>
        <div class="t9 soft">{it.text}</div>
        <div class="t9"><b>효과</b> {itemEffect(it)}</div>
        {it.kind !== 'consumable' && <div class="t9 soft">지금 든 것: {eq ? `${eq.name} · ${itemEffect(eq)}` : '없음'}</div>}
        {owned > 0 && <div class="t9 soft">가진 것 {owned}개</div>}
        <div class="shop-actions">
          {cat !== 'bag' && <button class="btn gold block" disabled={money < it.price} onClick={() => dispatch({ type: 'buy', id: it.id })}>{fmt(it.price)} 베리에 산다</button>}
          {owned > 0 && <button class="btn block" disabled={it.price <= 0} onClick={() => dispatch({ type: 'sell', id: it.id })}>{it.price > 0 ? `${fmt(it.price * 0.5)} 베리에 판다` : '팔 수 없다'}</button>}
          <div class="t9 soft">무기 · 방어구 · 소모품은 편성 창에서 챙긴다.</div>
        </div>
      </div>
    );
  }
  if (cat === 'fruit') {
    const u = s.inventory.unknownFruits.find((x) => x.uid === keyId);
    if (!u) return null;
    const eaters = s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew && !p.crew.fruit);
    return (
      <div class="stack">
        <b class="t14">소용돌이 무늬의 열매</b>
        <div class="t9 soft">먹으면 평생 헤엄칠 수 없다. 한 인생에 하나뿐이다.</div>
        <div class="t9">{u.hints.length ? u.hints.map((h) => <div>· {h}</div>) : '· 아직 아무것도 모른다.'}</div>
        <div class="shop-actions">
          <button class="btn red block" disabled={!!s.hero.fruit || !!s.pending} onClick={() => { if (confirm('먹으면 되돌릴 수 없다. 평생 헤엄칠 수 없다. 먹을까?')) dispatch({ type: 'eatFruit', uid: u.uid }); }}>{s.hero.fruit ? '이미 열매를 먹었다' : '먹는다'}</button>
          <button class="btn block" disabled={u.hints.length >= 3 || money < fee} onClick={() => dispatch({ type: 'appraise', uid: u.uid })}>감정 · 힌트 하나 더 ({fmt(fee)})</button>
          <button class="btn block" onClick={() => dispatch({ type: 'sellFruit', uid: u.uid })}>판다</button>
          {eaters.map((p) => (
            <button class="btn block" disabled={!!s.pending} onClick={() => { if (confirm(`${p.name}에게 먹일까? 되돌릴 수 없다.`)) dispatch({ type: 'feedFruit', uid: u.uid, who: p.id }); }}>{p.name}에게 먹인다 ({traitOf(p).name})</button>
          ))}
        </div>
      </div>
    );
  }
  if (cat === 'ship') {
    const pt = SHIP_PARTS.find((x) => x.id === keyId);
    if (!pt) return null;
    const has = (s.world.shipParts ?? []).includes(pt.id);
    const locked = s.world.stage < pt.minStage;
    return (
      <div class="stack">
        <b class="t14">{pt.name}</b>
        <div class="t9">{pt.text}</div>
        <div class="t9 soft">한 번 달면 배를 바꿔도 옮겨 단다.{locked ? ` ${pt.minStage}단계 해역부터 달 수 있다.` : ''}</div>
        <div class="shop-actions">
          {has ? <span class="tag green">이미 달았다</span>
            : <button class="btn gold block" disabled={locked || money < pt.price} onClick={() => dispatch({ type: 'buyPart', id: pt.id })}>{fmt(pt.price)} 베리에 단다</button>}
        </div>
      </div>
    );
  }
  if (cat === 'gear') {
    const p = s.people.find((x) => x.id === keyId);
    if (!p?.crew) return null;
    const g = p.crew.gear ?? 0;
    const next = CREW_GEAR[g + 1];
    return (
      <div class="stack">
        <b class="t14">{p.name}</b>
        <div class="t9">지금 장비: {CREW_GEAR[g].name} (힘 ×{CREW_GEAR[g].mult})</div>
        <div class="t9 soft">{next ? `다음: ${next.name} (힘 ×${next.mult})` : '이미 최고 장비다.'}</div>
        <div class="t9 soft">장비가 좋을수록 싸울 때 힘이 세진다.</div>
        <div class="shop-actions">
          {next && <button class="btn gold block" disabled={money < next.price} onClick={() => dispatch({ type: 'crewGear', who: p.id })}>{fmt(next.price)} 베리에 맞춰 준다</button>}
        </div>
      </div>
    );
  }
  if (cat === 'service') {
    if (keyId === 'intel') {
      const boss = BOSS_BY_ID[s.world.boss.id];
      const known = s.known.people.includes(boss.id);
      return (
        <div class="stack">
          <b class="t14">정보상</b>
          <div class="t9">{boss.title} {boss.name}의 능력치와 기술을 모두 알려 준다. 정찰 없이도 승률을 정확히 본다.</div>
          <div class="shop-actions">
            <button class="btn gold block" disabled={known || money < intel} onClick={() => dispatch({ type: 'buyIntel' })}>{known ? '이미 안다' : `${fmt(intel)} 베리에 산다`}</button>
          </div>
        </div>
      );
    }
    const scar = s.hero.injuries.find((i) => i.severity === 'scar');
    if (!scar) return null;
    return (
      <div class="stack">
        <b class="t14">명의의 수술</b>
        <div class="t9">후유증을 고쳐 {STAT_NAMES[scar.stat ?? 'str']} −3을 되돌린다.</div>
        <div class="shop-actions">
          <button class="btn gold block" disabled={money < surgery} onClick={() => dispatch({ type: 'surgery' })}>{fmt(surgery)} 베리에 수술받는다</button>
        </div>
      </div>
    );
  }
  return null;
}
