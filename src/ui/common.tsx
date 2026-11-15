import type { ComponentChildren } from 'preact';
import type { LifeState, Person, StatKey } from '../core/types';
import { faceURL, hash, type Weapon, type Who } from './pixel/pixelArt';
import { faceKeyOf } from '../core/people';

export const STAT_NAMES: Record<StatKey, string> = { str: '힘', spd: '속도', vit: '체력', int: '지능', wil: '정신', luk: '운' };
export const STAT_KEYS: StatKey[] = ['str', 'spd', 'vit', 'int', 'wil', 'luk'];
export const TACTIC_NAMES = { offense: '공세', defense: '수비', counter: '반격', endurance: '지구전' } as const;
export const TACTIC_HINT = {
  offense: '피해 +15%, 받는 피해 +15%. 위력 큰 기술부터',
  defense: '피해 −10%, 받는 피해 −20%. 방어 · 회복부터',
  counter: '받아치기 기술 +40%. 큰 기술을 쓰는 상대에게',
  endurance: '기력 소모 −30%. 10합 뒤 피해 +20%',
} as const;
export const ROUTE_NAMES = { none: '무소속', pirate: '해적', marine: '해군', revolution: '혁명군' } as const;
export const RISK_NAMES = { safe: '안전', danger: '위험', lethal: '치명' } as const;

export const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');
export const date = (s: LifeState) => `해원력 ${s.time.year}년 ${s.time.month}월`;
export const absToDate = (t: number) => `${Math.floor(t / 12)}.${(t % 12) + 1}`;

export function heroWho(s: LifeState): Who {
  const f = s.hero.route === 'marine' ? 'marine' : s.hero.route === 'pirate' ? 'pirate' : s.hero.route === 'revolution' ? 'rev' : 'civil';
  const focus = s.growth.focus;
  const weapon: Weapon = focus === 'martial.sword' ? 'sword' : focus === 'martial.gun' ? 'gun' : 'fist';
  return { key: `hero:${s.rng.seed}`, gender: s.hero.gender, age: s.hero.age, species: s.hero.species, faction: f, weapon };
}
// 원작 동료의 무기
const NAMED_WEAPON: Record<string, Weapon> = { coby: 'fist', helmeppo: 'sword', tashigi: 'sword', bartolomeo: 'fist', cavendish: 'sword', ideo: 'fist', koala: 'fist', hack: 'fist' };
/** 동료의 무기: 원작 인물은 정해진 것, 저격수는 총, 돌격대는 사람마다 칼 또는 주먹 */
function crewWeapon(p: Person): Weapon | undefined {
  if (p.canon && NAMED_WEAPON[p.canon]) return NAMED_WEAPON[p.canon];
  if (!p.crew) return undefined;
  if (p.crew.role === 'support') return 'gun';
  if (p.crew.role === 'vanguard') return hash(p.id) % 2 ? 'sword' : 'fist';
  return undefined;
}
export function personWho(p: Person): Who {
  return { key: faceKeyOf(p), gender: p.gender, age: p.age, species: p.species, faction: p.faction, weapon: crewWeapon(p) };
}

export function Face({ who, size = '', title }: { who: Who; size?: '' | 'big' | 'sm' | 'xs'; title?: string }) {
  return <img class={`face ${size}`} src={faceURL(who)} alt={title ?? ''} title={title} />;
}

export function Gauge({ value, max, kind = 'hp', thin }: { value: number; max: number; kind?: 'hp' | 'sp' | 'gold'; thin?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div class={`gauge ${kind} ${thin ? 'thin' : ''} ${kind === 'hp' && pct < 30 ? 'low' : ''}`} role="meter" aria-valuenow={Math.round(value)} aria-valuemax={Math.round(max)}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ title, children, onClose, wide, cls = '' }: { title: string; children: ComponentChildren; onClose?: () => void; wide?: boolean; cls?: string }) {
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div class={`modal frame frame-pad ${wide ? 'wide' : ''} ${cls}`}>
        <div class="head">
          <span class="sign">{title}</span>
          {onClose && <button class="btn small" onClick={onClose}>닫기 ✕</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Panel({ title, children, extra, cls = '' }: { title: string; children: ComponentChildren; extra?: ComponentChildren; cls?: string }) {
  return (
    <section class={`frame frame-pad ${cls}`}>
      <div class="row between" style={{ marginBottom: 6 }}>
        <span class="sign">{title}</span>
        {extra}
      </div>
      {children}
    </section>
  );
}
