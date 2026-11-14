import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { actions, dispatch, useStore } from '../../app/store';
import { B } from '../../data/balance';
import { sfx } from '../../app/sound';
import { getSkill } from '../../core/growth/skillbook';
import type { BattleEvent, BattleState, CUnit, LifeState, Pending } from '../../core/types';
import { Face, Gauge, heroWho, Modal, RISK_NAMES } from '../common';
import { drawScene, weaponOfSkills, type Who } from '../pixel/pixelArt';
import { josa } from '../../core/josa';

type BP = Extract<Pending, { kind: 'battle' | 'intervene' }>;

const unitWho = (s: LifeState, u: CUnit): Who => u.hero ? heroWho(s) : { key: u.faceKey ?? u.key + u.name, gender: u.gender, age: u.age, species: u.species, faction: u.faction, form: u.form, weapon: weaponOfSkills(u.skills.map((k) => k.id)) };

function hpAt(b: BattleState, upto: number) {
  const hp = b.units.map((u) => u.maxHp);
  for (let i = 0; i < upto; i++) {
    const e = b.events[i];
    if (e.k === 'act') hp[e.target] = Math.max(0, hp[e.target] - e.dmg);
    else if (e.k === 'heal') hp[e.target] = Math.min(b.units[e.target].maxHp, hp[e.target] + e.amount);
    else if (e.k === 'item' && e.item === 'potion') hp[e.who] = Math.min(b.units[e.who].maxHp, hp[e.who] + Math.round(b.units[e.who].maxHp * 0.3));
    else if (e.k === 'drown') hp[e.who] = 0;
  }
  return hp;
}

function line(b: BattleState, e: BattleEvent): string {
  return josa(rawLine(b, e));
}
function rawLine(b: BattleState, e: BattleEvent): string {
  const n = (i: number) => b.units[i]?.name ?? '?';
  switch (e.k) {
    case 'round': return `── ${e.n}합 ──`;
    case 'act': return e.skill === 'bound' ? `${n(e.who)}: ${e.name}` : `${n(e.who)} ▶ ${n(e.target)} 「${e.name}」 ${e.dodge ? (e.note ?? '빗나갔다') : e.dmg > 0 ? `${e.dmg}${e.crit ? ' 치명타!' : ''}${e.note ? ` (${e.note})` : ''}` : (e.note ?? '')}`;
    case 'heal': return `${n(e.who)} 「${e.name}」 ${n(e.target)} 체력 +${e.amount}`;
    case 'guard': return `${n(e.who)} 「${e.name}」`;
    case 'down': return `${n(e.who)}이(가) 쓰러졌다!`;
    case 'join': return `${n(e.who)}이(가) ${e.side === 'L' ? '우리 편 싸움에 합세했다' : '적의 싸움에 합세했다'}`;
    case 'retreat': return e.ok ? `${n(e.who)}이(가) 물러났다` : `${n(e.who)}이(가) 물러나려다 실패했다`;
    case 'item': return `${n(e.who)}이(가) ${e.name}을(를) 썼다`;
    case 'drown': return `${n(e.who)}이(가) 바다에 빠졌다! 힘이 빠진다…`;
    case 'rest': return `${n(e.who)}이(가) 숨을 고른다`;
    case 'end': return e.result === 'win' ? '★ 승리 ★' : e.result === 'retreat' ? '물러났다' : '패배…';
  }
}

export function BattleModal({ s, p }: { s: LifeState; p: BP }) {
  const st = useStore();
  const b = p.battle;
  const [idx, setIdx] = useState(0);
  const total = b.events.length;
  const ms = B.battleLineMs / st.settings.battleSpeed;
  useEffect(() => {
    if (idx >= total) return;
    const id = setTimeout(() => setIdx((i) => Math.min(total, i + 1)), b.events[idx]?.k === 'round' ? ms * 0.6 : ms);
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
  const heroDuel = b.duels.find((d) => d.l === heroI && !d.over) ?? b.duels.find((d) => d.l === heroI);
  const round = [...b.events.slice(0, idx)].reverse().find((e) => e.k === 'round') as { n: number } | undefined;

  // 장면
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    let raf = 0, t = 0;
    const loop = () => {
      t++;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const ctx = c.getContext('2d');
      const foeU = heroDuel ? b.units[heroDuel.r] : null;
      if (ctx && w) drawScene(ctx, w, h, t, {
        hero: heroWho(s), crew: [], foe: foeU && !(done && b.result === 'win') ? unitWho(s, foeU) : null,
        sailing: p.encounter.atSea, place: `${round ? `${round.n}합` : '대치'} · ${p.encounter.enemy.name}`,
        islandColor: '#c8b070', flag: 'pirate', aura: null,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [heroDuel?.r, done, round?.n]);

  const result = b.result;
  const summary = Object.entries(b.usage).map(([id, u]) => ({ name: id === 'basic' ? '기본 공격' : getSkill(id)?.name ?? id, ...u })).sort((a, z) => z.damage - a.damage);
  const awaiting = done && p.kind === 'intervene';

  return (
    <Modal title={`${p.encounter.spar ? '대련' : p.encounter.source === 'boss' ? '해역 보스전' : '강적전'} · ${RISK_NAMES[p.risk]}`} wide>
      <div class="frame" style={{ padding: 0, margin: '0 0 8px' }}><canvas ref={cv} class="scene" style={{ height: 150 }} aria-label="전투 장면" /></div>
      <div class="grid2" style={{ alignItems: 'start' }}>
        <div class="stack">
          {b.duels.map((d) => {
            const L = b.units[d.l], R = b.units[d.r];
            return (
              <div class={`paper duel ${d.over && done ? 'dim' : ''}`}>
                <div class="side"><Face who={unitWho(s, L)} size="sm" /><div><div class="t9"><b>{L.name}</b>{d.helpersL.length ? ` +${d.helpersL.length}` : ''}</div><Gauge value={hp[d.l]} max={L.maxHp} /></div></div>
                <div class="t9 soft" style={{ textAlign: 'center' }}>VS</div>
                <div class="side"><Face who={unitWho(s, R)} size="sm" /><div><div class="t9"><b>{R.name}</b>{R.leader ? ' (우두머리)' : ''}{d.helpersR.length ? ` +${d.helpersR.length}` : ''}</div><Gauge value={hp[d.r]} max={R.maxHp} /></div></div>
              </div>
            );
          })}
          {b.units.filter((u) => u.side === 'L' && (u.role === 'medic' || u.role === 'navigator')).map((u) => <div class="t9 soft">{u.name} · {u.role === 'medic' ? '뒤에서 치료' : '항해 지원'}</div>)}
        </div>
        <div class="stack">
          <div class="paper battle-log" ref={logRef}>
            {b.events.slice(0, idx).map((e) => {
              const me = (e.k === 'act' && e.who === heroI);
              return <div class={`${e.k === 'act' && e.crit ? 'crit' : ''} ${me ? 'me' : ''}`}>{line(b, e)}</div>;
            })}
          </div>
          <div class="row">
            {!done && <button class="btn" onClick={() => setIdx(total)}>건너뛰기 ▶▶</button>}
            <span class="t9">재생 속도</span>
            {([1, 2, 4] as const).map((x) => <button class={`btn small ${st.settings.battleSpeed === x ? 'on' : ''}`} onClick={() => actions.setBattleSpeed(x)}>×{x}</button>)}
          </div>
        </div>
      </div>

      {awaiting && (
        <div class="paper" style={{ marginTop: 8 }}>
          <b>내 상대를 쓰러뜨렸다! 남은 체력 {hp[heroI]} / {b.units[heroI].maxHp}. 누구를 도우러 갈까?</b>
          <div class="stack" style={{ marginTop: 6 }}>
            {b.duels.filter((d) => !d.over).map((d) => (
              <button class="opt" onClick={() => dispatch({ type: 'intervene', duel: d.id })}>
                <b>{b.units[d.l].name}</b> vs <b>{b.units[d.r].name}</b>{b.units[d.r].leader ? ' (우두머리)' : ''}
                <span class="hint">이 교전에 들어간다. 남은 체력 그대로 싸운다</span>
              </button>
            ))}
            <button class="opt" onClick={() => dispatch({ type: 'intervene', duel: -1 })}><b>숨 고르기</b><span class="hint">한 합 쉬며 기력을 되찾는다. 그동안 다른 교전은 흐른다</span></button>
          </div>
        </div>
      )}

      {done && result && p.kind === 'battle' && (
        <div class="paper" style={{ marginTop: 8 }}>
          <div class="t14" style={{ textAlign: 'center' }}><b class={result === 'win' ? 'gold' : 'red'}>{result === 'win' ? '승리!' : result === 'retreat' ? '물러났다' : '패배'}</b></div>
          <div class="t9 soft" style={{ textAlign: 'center' }}>{b.round}합</div>
          <table class="px" style={{ marginTop: 6 }}>
            <thead><tr><th>기술</th><th class="num">사용</th><th class="num">피해</th></tr></thead>
            <tbody>{summary.map((x) => <tr><td>{x.name}</td><td class="num">{x.uses}</td><td class="num">{x.damage}</td></tr>)}</tbody>
          </table>
          {summary.length === 0 && <div class="t9 soft">공격하지 못했다.</div>}
          <button class="btn gold block" style={{ marginTop: 8 }} onClick={() => dispatch({ type: 'ackBattle' })}>확인</button>
        </div>
      )}
    </Modal>
  );
}
