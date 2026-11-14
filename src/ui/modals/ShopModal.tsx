import { actions, dispatch } from '../../app/store';
import type { LifeState } from '../../core/types';
import { B } from '../../data/balance';
import { ITEMS, ITEM_BY_ID } from '../../data/items';
import { BRANCH_NAMES } from '../../data/skills';
import { fmt, Modal } from '../common';

export function ShopModal({ s }: { s: LifeState }) {
  const forSale = ITEMS.filter((i) => i.price > 0 && i.grade <= s.world.stage + 1);
  const fee = B.money.appraise * s.world.stage;
  return (
    <Modal title="상점 · 소지품" onClose={() => actions.close()} wide>
      <div class="row between" style={{ marginBottom: 6 }}><span>가진 돈 <b>{fmt(s.hero.money)} 베리</b></span><span class="t9 soft">창이 열려 있는 동안 시간이 멈춘다</span></div>
      <div class="grid2" style={{ alignItems: 'start' }}>
        <div class="paper">
          <b>살 수 있는 것</b>
          <table class="px" style={{ marginTop: 4 }}>
            <tbody>
              {forSale.map((it) => (
                <tr>
                  <td>{it.name}<div class="t9 soft">{it.branch ? `${BRANCH_NAMES[it.branch]} 무기 ×${it.mult}` : it.armor ? `방어 +${it.armor}` : it.text}</div></td>
                  <td class="num">{fmt(it.price)}</td>
                  <td><button class="btn small" disabled={s.hero.money < it.price} onClick={() => dispatch({ type: 'buy', id: it.id })}>사기</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div class="stack">
          <div class="paper">
            <b>소지품</b>
            {s.inventory.items.length === 0 && <div class="soft t9">아무것도 없다.</div>}
            <table class="px" style={{ marginTop: 4 }}>
              <tbody>
                {s.inventory.items.map((x) => {
                  const it = ITEM_BY_ID[x.id];
                  return (
                    <tr>
                      <td>{it.name} ×{x.count}</td>
                      <td class="num t9">{it.price > 0 ? `${fmt(it.price * 0.5)}` : '팔 수 없음'}</td>
                      <td><button class="btn small" disabled={it.price <= 0} onClick={() => dispatch({ type: 'sell', id: x.id })}>팔기</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div class="t9 soft">무기 · 방어구 · 소모품은 편성 창에서 챙긴다.</div>
          </div>
          <div class="paper">
            <b>정체 모를 열매</b>
            {s.inventory.unknownFruits.length === 0 && <div class="soft t9">없다.</div>}
            {s.inventory.unknownFruits.map((u) => (
              <div style={{ marginTop: 6 }}>
                <div class="t9">{u.hints.length ? u.hints.map((h) => <div>· {h}</div>) : '· 아직 아무것도 모른다.'}</div>
                <div class="row" style={{ marginTop: 4 }}>
                  <button class="btn small red" disabled={!!s.hero.fruit || !!s.pending} onClick={() => { if (confirm('먹으면 되돌릴 수 없다. 평생 헤엄칠 수 없다. 먹을까?')) dispatch({ type: 'eatFruit', uid: u.uid }); }}>먹는다</button>
                  <button class="btn small" disabled={u.hints.length >= 3 || s.hero.money < fee} onClick={() => dispatch({ type: 'appraise', uid: u.uid })}>감정 ({fmt(fee)})</button>
                  <button class="btn small" onClick={() => dispatch({ type: 'sellFruit', uid: u.uid })}>판다</button>
                </div>
              </div>
            ))}
            {s.hero.fruit && <div class="t9 soft">이미 열매를 먹었다. 한 인생에 하나뿐이다.</div>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
