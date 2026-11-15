// 자동 전투 창: 코어가 끝까지 돌린 전투의 사건을 한 줄씩 다시 보여 준다. 재생 중에는 묻지 않는다.
// (v4 src/ui/modals/BattleModal.tsx의 재생 타이머 · 소리 · 장면을 옮기고, 개입 · 준비 · 물건 · 물러나기 단추는 뺀다)
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sfx } from '../../../app/sound';
import { B } from '../../../data/balance';
import { drawScene } from '../../../ui/pixel/pixelArt';
import { battleSpeedOf } from '../../app/flow';
import { actions, dispatch, useStore } from '../../app/store';
import type { Life5, Pending5 } from '../../core/types';
import { Face, Gauge, Modal } from '../common';
import { battleLine, hpAt, resultLine, sceneOf, unitWho } from '../view';

/** '합' 구분 줄은 이 몫만큼 빨리 넘긴다 (v4와 같다) */
const ROUND_PACE = 0.6;
const SPEEDS = [1, 2, 4] as const;

export function BattleModal({ s, p }: { s: Life5; p: Extract<Pending5, { kind: 'battle' }> }) {
  const st = useStore();
  const b = p.battle;
  const total = b.events.length;
  const [idx, setIdx] = useState(0);
  const speed = battleSpeedOf(st.settings.battleSpeed, st.settings.speed);   // 이야기가 빠르면 전투도 그만큼 빠르게 (4배속까지)
  const ms = B.battleLineMs / speed;
  // 한 줄씩 저절로 넘긴다
  useEffect(() => {
    if (idx >= total) return;
    const id = setTimeout(() => setIdx((i) => Math.min(total, i + 1)), b.events[idx]?.k === 'round' ? ms * ROUND_PACE : ms);
    return () => clearTimeout(id);
  }, [idx, total, ms]);
  const hp = useMemo(() => hpAt(b, idx), [b, idx]);
  // 한 줄이 재생될 때마다 소리
  useEffect(() => {
    const e = b.events[idx - 1];
    if (!e) return;
    if (e.k === 'act') sfx(e.dodge ? 'miss' : e.crit ? 'crit' : e.dmg > 0 ? 'hit' : 'tick');
    else if (e.k === 'down') sfx('danger');
    else if (e.k === 'heal' || e.k === 'item') sfx('treasure');
    else if (e.k === 'end') sfx(e.result === 'win' ? 'win' : 'lose');
  }, [idx]);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight }); }, [idx]);

  const done = idx >= total;
  const heroI = b.units.findIndex((u) => u.hero);
  const duel = b.duels.find((d) => d.l === heroI && !d.over) ?? b.duels.find((d) => d.l === heroI);
  const foeI = duel ? duel.r : b.units.findIndex((u) => u.side === 'R' && u.leader);
  const hero = b.units[heroI], foe = b.units[foeI];
  const round = [...b.events.slice(0, idx)].reverse().find((e) => e.k === 'round') as { n: number } | undefined;

  // 장면: v4와 같은 캔버스. 공격하는 쪽이 번갈아 자세를 잡는다. 이기고 나면 상대가 사라진다
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const base = sceneOf(s, true);   // 전투 창은 이야기가 다 떠오른 뒤에 뜬다
    let raf = 0, t = 0;
    const loop = () => {
      t++;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = c.getContext('2d');
      if (ctx && w) drawScene(ctx, w, h, t, {
        ...base, crew: [],
        foe: foe && !(done && p.result === 'win') ? unitWho(s, foe) : null,
        sailing: b.atSea, place: `${round ? `${round.n}합` : '대치'} · ${p.foe.name}`,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [foeI, done, round?.n]);

  return (
    <Modal title={p.lethal ? `목숨을 건 싸움 · ${p.foe.name}` : `싸움 · ${p.foe.name}`} cls="pend battle5" wide>
      <div class="paper duel battle5-vs">
        {hero && <div class="side"><Face who={unitWho(s, hero)} size="sm" /><div><div class="t9"><b>{hero.name}</b></div><Gauge value={hp[heroI]} max={hero.maxHp} /></div></div>}
        <div class="t9 soft">VS</div>
        {foe && <div class="side"><Face who={unitWho(s, foe)} size="sm" /><div><div class="t9"><b>{foe.name}</b></div><Gauge value={hp[foeI]} max={foe.maxHp} /></div></div>}
      </div>
      <div class="frame battle5-scene"><canvas ref={cv} class="scene" aria-label="전투 장면" /></div>
      <div class="paper battle-log" ref={logRef}>
        {b.events.slice(0, idx).map((e, i) => {
          const me = e.k === 'act' && e.who === heroI;
          return <div key={i} class={`${e.k === 'act' && e.crit ? 'crit' : ''} ${me ? 'me' : ''}`}>{battleLine(b, e)}</div>;
        })}
      </div>
      {done ? (
        <div class="battle5-end">
          <div class="t14" style={{ textAlign: 'center' }}><b class={p.result === 'win' ? 'gold' : 'red'}>{resultLine(p.result)}</b> <span class="t9 soft">{b.round}합</span></div>
          <button class="btn gold block" onClick={() => dispatch({ type: 'answer', index: 0 })}>확인</button>
        </div>
      ) : (
        <div class="row battle5-bar">
          <button class="btn" onClick={() => setIdx(total)}>건너뛰기 ▶▶</button>
          <span class="t9">재생 속도</span>
          {SPEEDS.map((x) => <button key={x} class={`btn small ${speed === x ? 'on' : ''}`} aria-pressed={speed === x} onClick={() => actions.setBattleSpeed(x)}>{x}×</button>)}
        </div>
      )}
    </Modal>
  );
}
