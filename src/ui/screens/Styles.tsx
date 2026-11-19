import { COMBAT_STYLES, type CombatStyle } from '../../data/combat-styles';
import { aggregateStyleMastery, canEquipWeapon, equippedWeapon, hasStyle, ownedWeapons, styleTier, styleUsable } from '../../core/styles';
import { TIER_WORD } from '../../data/words';
import { dispatch } from '../../app/store';
import type { Life5 } from '../../core/types';

export function Styles({ s, disabled }: { s: Life5; disabled: boolean }) {
  const known = COMBAT_STYLES.filter((x) => hasStyle(s, x.id));
  const learning = COMBAT_STYLES.filter((x) => s.growth.styleBonds[x.id]);
  const equipped = equippedWeapon(s);
  const weapons = ownedWeapons(s);
  const hasStowed = weapons.some((item) => item.id !== equipped?.id);
  if (!known.length && !learning.length && !hasStowed) return null;
  return <details class="paper t9">
    <summary>유파·무기와 인연</summary>
    <div class="stack" style={{ marginTop: 6 }}>
      <div>체술 숙련 {Math.floor(aggregateStyleMastery(s, 'martial'))} · 무기술 숙련 {Math.floor(aggregateStyleMastery(s, 'weapon'))}</div>
      <div class="soft">무기술 · 도검 / 장병기 / 둔기 / 사격</div>
      {known.length > 0 && <label>주력 유파
        <select class="btn block" aria-label="주력 유파" value={s.growth.primaryStyle ?? ''} disabled={disabled}
          onChange={(e) => dispatch({ type: 'style', style: e.currentTarget.value as CombatStyle })}>
          <option value="" disabled>익힌 유파를 고른다</option>
          {known.map((x) => <option key={x.id} value={x.id} disabled={!styleUsable(s, x.id)}>{x.name} · {TIER_WORD[styleTier(s, x.id)]}</option>)}
        </select>
      </label>}
      {hasStowed && <label>보유 무기
        <select class="btn block" aria-label="보유 무기" value={equipped?.id ?? ''} disabled={disabled}
          onChange={(e) => dispatch({ type: 'equipWeapon', id: e.currentTarget.value })}>
          {!equipped && <option value="" disabled>장착한 무기 없음</option>}
          {weapons.map((item) => {
            const usable = canEquipWeapon(s, item.id);
            return <option key={item.id} value={item.id} disabled={!usable}>{item.name}{!usable ? ' · 지금은 장착 불가' : ''}</option>;
          })}
        </select>
      </label>}
      {known.map((x) => <div key={x.id}>{x.group === 'weapon' ? '무기술' : '체술'} · <b>{x.name}</b> · {TIER_WORD[styleTier(s, x.id)]} · 숙련 {Math.floor(s.growth.styleMastery[x.id] ?? 0)}</div>)}
      {learning.map((x) => {
        const b = s.growth.styleBonds[x.id]!;
        const teacher = s.people.find((p) => p.id === b.teacherId);
        return <div key={x.id}><b>{teacher?.name ?? '스승'}</b> · {x.name}<br />
          <span class="soft">{b.island} · {b.refined ? '다시 만나 가르침을 다듬었다' : b.adopted ? '주력으로 익혔다' : `함께한 연습 ${b.practice} / 3`}{teacher && !teacher.alive ? ' · 이제는 곁에 없는 사람' : ''}</span>
        </div>;
      })}
    </div>
  </details>;
}
