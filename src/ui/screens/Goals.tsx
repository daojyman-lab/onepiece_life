// v7 항해의 목표와 성장: 인물 칸의 목표 판 · 레벨 판, 이야기 위의 목표 띠, 장면 위의 레벨 업 알림.
import { goalsView, type PromiseView } from '../../core/goals';
import { levelView } from '../../core/level';
import type { Life5, LogLine } from '../../core/types';
import { Gauge, fmt } from '../common';

const pct = (x: number) => `${Math.round(x * 100)}%`;

function PromiseRow({ p }: { p: PromiseView }) {
  const mark = p.status === 'kept' ? '✔' : p.status === 'lost' ? '✕' : '◇';
  return (
    <div class={`goal-row ${p.status}`}>
      <div class="row between"><span><b>{mark} {p.name}</b> <span class="soft">· {p.relation}{p.orphaned ? ' · 유언' : ''}</span></span>
        <span class="soft">{p.status === 'kept' ? `${p.doneAt}살에 지킴` : p.status === 'lost' ? '지킬 수 없음' : pct(p.frac)}</span></div>
      <div>「{p.words}」</div>
      {p.status === 'active' && <><Gauge value={p.frac} max={1} kind="gold" thin /><div class="soft">목표: {p.goal}</div></>}
    </div>
  );
}

/** 인물 칸: 꿈의 서약과 인연의 약속 */
export function GoalsPanel({ s }: { s: Life5 }) {
  const v = goalsView(s);
  return (
    <div class="paper t9 goals-panel">
      <div class="row between"><b>🎯 항해의 목표</b>{v.focus.length > 0 && <span class="soft">끌리는 쪽: {v.focus.join(' · ')}</span>}</div>
      {v.dream ? (
        <div class="goal-row main">
          <div class="row between"><span><b>★ 꿈 · {v.dream.name}</b></span><span class="soft">{v.dream.cleared}/{v.dream.total}{v.dream.streak >= 2 ? ` · 연속 ${v.dream.streak}` : ''}</span></div>
          <Gauge value={v.dream.cleared} max={v.dream.total} kind="gold" thin />
          <div class="soft">{v.dream.to ? `${v.dream.to}에게 한 약속` : '스스로에게 한 약속'} · {v.dream.done ? '꿈을 이루었다' : `다음 길목: ${v.dream.next ?? '—'}`}</div>
        </div>
      ) : <div class="soft">아직 꿈이 없다. 열세 살 무렵 수평선 너머를 보게 될 것이다.</div>}
      {v.promises.map((p) => <PromiseRow key={p.id} p={p} />)}
      {v.promises.length === 0 && <div class="soft">아직 누구와도 약속하지 않았다. 소중한 사람과의 약속이 목표가 된다.</div>}
    </div>
  );
}

/** 이야기 칸 위의 한 줄: 지금 가장 가까운 목표 */
export function GoalStrip({ s }: { s: Life5 }) {
  const v = goalsView(s);
  const active = v.promises.filter((p) => p.status === 'active').sort((a, b) => b.frac - a.frac);
  const dream = v.dream && !v.dream.done ? `★ ${v.dream.name} ${v.dream.cleared}/${v.dream.total} → ${v.dream.next ?? ''}` : v.dream ? `★ ${v.dream.name} · 이루었다` : null;
  const promise = active[0] ? `◇ ${active[0].name}: ${active[0].words} ${pct(active[0].frac)}` : null;
  const lv = levelView(s);
  return (
    <div class="goal-strip t9" aria-label="지금의 목표">
      <span class="lv-chip">Lv {lv.level} · {lv.grade}</span>
      <span class="goal-strip-text">{[dream, promise].filter(Boolean).join('  |  ') || '아직 정한 목표가 없다'}{active.length > 1 ? `  (+약속 ${active.length - 1})` : ''}</span>
    </div>
  );
}

/** 전투력의 궤적 (해마다 끝의 전투력) */
export function PowerSpark({ points, w = 180, h = 34 }: { points: { age: number; rating: number }[]; w?: number; h?: number }) {
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.rating), 1);
  const a0 = points[0].age, a1 = points[points.length - 1].age;
  const xy = points.map((p) => `${((p.age - a0) / Math.max(1, a1 - a0)) * (w - 4) + 2},${h - 2 - (p.rating / max) * (h - 4)}`).join(' ');
  return (
    <svg class="spark" viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`전투력의 궤적 ${a0}살부터 ${a1}살까지, 가장 높을 때 ${fmt(max)}`}>
      <polyline points={xy} fill="none" stroke="currentColor" stroke-width="2" />
    </svg>
  );
}

/** 인물 칸: 레벨 · 등급 · 다음 레벨까지 · 전투력의 궤적 */
export function LevelCard({ s, power }: { s: Life5; power: string }) {
  const v = levelView(s);
  return (
    <div class="paper t9 level-card">
      <div class="row between"><span class="lv-big">Lv {v.level}</span><span class="grade-badge">{v.grade}급</span></div>
      <Gauge value={v.frac} max={1} kind="sp" thin />
      <div class="row between soft"><span>전투력 {fmt(v.rating)}</span><span>{v.next ? `다음 레벨 ${fmt(v.next)}` : '정점'}</span></div>
      <div class="soft">{power}</div>
      {v.history.length >= 2 && <><PowerSpark points={v.history} /><div class="soft">최고 Lv {v.peakLevel} · {v.peakGrade}급</div></>}
    </div>
  );
}

/** 장면 위: 방금 떠오른 레벨 업 · 등급 상승 · 약속을 지킨 줄 */
export function LevelBanner({ s, shownId }: { s: Life5; shownId: number }) {
  let hit: LogLine | undefined;
  for (let i = s.log.length - 1; i >= 0 && i >= s.log.length - 400; i--) {
    const l = s.log[i];
    if (l.id > shownId) continue;
    if (shownId - l.id > 2) break;
    if (l.type === 'growth' && (l.text.startsWith('▲') || l.text.startsWith('★') || l.text.includes('약속을 지켰다'))) { hit = l; break; }
  }
  if (!hit) return null;
  const kind = hit.text.startsWith('★') ? 'grade' : hit.text.startsWith('▲') ? 'level' : 'promise';
  const text = kind === 'promise' ? '약속을 지켰다!' : hit.text.split('.')[0];
  return <div key={hit.id} class={`level-banner ${kind}`} role="status">{text}</div>;
}
