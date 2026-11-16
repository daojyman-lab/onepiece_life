// v5 본 화면: 데스크톱은 세 칸(인물 · 장면과 이야기 · 인연과 연표), 휴대폰(760px 이하)은 탭 넷. (v4 src/ui/screens/Main.tsx와 같은 마크업 · 클래스)
import { useEffect, useRef, useState } from 'preact/hooks';
import { drawScene, type SceneInput } from '../../../ui/pixel/pixelArt';
import { caughtUp, shouldRead } from '../../app/flow';
import { actions, msSinceWindowClosed, useStore } from '../../app/store';
import type { Life5, Standing } from '../../core/types';
import { Face, Gauge, Panel } from '../common';
import { ageWord, heroWho5, peopleView, profileView, sceneOf, storyLines, timelineView, yearLabel } from '../view';

const SPEEDS = [0, 1, 2, 4, 8] as const;
/** 인물 칸 머리 글 (v4 포스터와 같다): 해적 · 칠무해는 WANTED, 해군은 MARINE, 그 밖은 PROFILE */
const WANTED_LABEL: Partial<Record<Standing, string>> = { pirate: 'WANTED', warlord: 'WANTED', marine: 'MARINE' };

/** 폰 화면인가 (760px 이하) */
function useMobile() {
  const q = '(max-width: 760px)';
  const [m, setM] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const f = () => setM(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return m;
}

/** 이야기가 따라잡는 동안에는 지금 보이는 줄의 나이와 섬을 보여 준다 */
function shownAt(s: Life5, shownId: number): { age: number; island: string } {
  if (caughtUp(s, shownId)) return { age: s.age, island: s.hero.island };
  let age = -1, island = '';
  for (let i = s.log.length - 1; i >= 0; i--) {
    const l = s.log[i];
    if (l.id > shownId) continue;
    if (age < 0) age = l.age;
    if (l.weight === 'year' && l.island) { island = l.island; break; }
  }
  return { age: Math.max(0, age < 0 ? 0 : age), island: island || s.hero.island };
}

function SpeedButtons() {
  const sp = useStore().settings.speed;
  return (
    <div class="row" role="group" aria-label="진행 속도" style={{ gap: 3 }}>
      {SPEEDS.map((x) => (
        <button key={x} class={`btn small ${sp === x ? 'on' : ''}`} onClick={() => actions.setSpeed(x)} aria-pressed={sp === x}
          aria-label={x === 0 ? '정지' : `${x}배속`}>{x === 0 ? '❚❚' : `▶${x > 1 ? x : ''}`}</button>
      ))}
    </div>
  );
}

type MobileTab = 'story' | 'hero' | 'people' | 'timeline';
const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: 'story', label: '이야기', icon: '📜' },
  { id: 'hero', label: '인물', icon: '🧭' },
  { id: 'people', label: '인연', icon: '🤝' },
  { id: 'timeline', label: '연표', icon: '🗓' },
];

/** 휴대폰: 탭 넷과 아래 내비게이션 */
function MobileMain({ s }: { s: Life5 }) {
  const st = useStore();
  const [tab, setTab] = useState<MobileTab>('story');
  const at = shownAt(s, st.shownId);
  return (
    <div class="app mobile m5">
      <header class="frame topbar m-topbar">
        <span class="tag">{ageWord(at.age)}</span>
        <span class="grow" />
        <SpeedButtons />
        <button class="btn small" onClick={() => actions.open('menu')} aria-label="메뉴">☰</button>
      </header>
      <div class={`m5-body ${tab === 'story' ? 'fill' : ''}`}>
        {tab === 'story' && <><Scene s={s} ready={caughtUp(s, st.shownId)} /><StoryPanel s={s} /></>}
        {tab === 'hero' && <Profile s={s} />}
        {tab === 'people' && <PeoplePanel s={s} />}
        {tab === 'timeline' && <TimelinePanel s={s} />}
      </div>
      <nav class="m-nav four" aria-label="화면">
        {MOBILE_TABS.map((x) => (
          <button key={x.id} class={tab === x.id ? 'on' : ''} aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>
            <span class="m-ico">{x.icon}</span><span>{x.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export function Main() {
  const st = useStore();
  const mobile = useMobile();
  const s = st.life;
  if (!s) return null;
  if (mobile) return <MobileMain s={s} />;
  return (
    <div class="app desk">
      <TopBar s={s} />
      <div class="cols">
        <div class="col left"><Profile s={s} /></div>
        <div class="col mid">
          <Scene s={s} ready={caughtUp(s, st.shownId)} />
          <StoryPanel s={s} />
        </div>
        <div class="col right"><SideTabs s={s} /></div>
      </div>
    </div>
  );
}

function TopBar({ s }: { s: Life5 }) {
  const st = useStore();
  const at = shownAt(s, st.shownId);
  return (
    <header class="frame topbar">
      <span class="title">그랜드 트레저</span>
      <span class="tag">{yearLabel(at)}</span>
      <span class="grow" />
      <SpeedButtons />
      <div class="row">
        <button class="btn small" onClick={() => actions.open('codex')}>도감</button>
        <button class="btn small" onClick={() => actions.open('menu')}>메뉴</button>
      </div>
    </header>
  );
}

function Profile({ s }: { s: Life5 }) {
  const st = useStore();
  const p = profileView(s);
  const at = shownAt(s, st.shownId);
  const age = at.age;
  return (
    <Panel title="인물">
      <div class="poster">
        <div class="wanted">{WANTED_LABEL[s.hero.standing] ?? 'PROFILE'}</div>
        <Face who={{ ...heroWho5(s), age }} size="big" />
        <div class="t14"><b>{p.name}</b></div>
        <div class="t9 soft">{yearLabel(at)}</div>
        <div class="row" style={{ justifyContent: 'center', marginTop: 4 }}><span class="tag">{p.who}</span><span class="tag">{p.standing}</span></div>
        {p.fame && <div style={{ marginTop: 4 }}><b>{p.fame}</b></div>}
      </div>
      <div class="stack" style={{ marginTop: 8 }}>
        <div class="t9">{p.born}</div>
        {p.values.length > 0 && <div class="paper">{p.values.slice(0, 2).map((v) => <div key={v}>{v}</div>)}</div>}
        {p.strengths.map((x) => <div key={x.name} class="t9"><b>{x.name}</b> <span class="soft">· {x.text}</span></div>)}
        {p.body.length > 0 && <div class="t9"><b>몸</b> {p.body.map((b) => `${b.limb} ${b.word}`).join(' · ')}</div>}
        {p.skills.length > 0 && <div class="t9"><b>익힌 것</b> {p.skills.map((k) => `${k.name} ${k.tier}`).join(' · ')}</div>}
        {p.master && <div class="t9"><b>스승</b> {p.master}</div>}
        {p.fruit && <div class="t9"><b>열매</b> {p.fruit}</div>}
        <div class="row between"><span>돈</span><b class={s.hero.money < 0 ? 'red' : ''}>{p.money}</b></div>
        <div>
          <div class="row between t9"><span>체력</span><span>{p.hp} / 100</span></div>
          <Gauge value={p.hp} max={100} />
        </div>
        {p.hurts.length > 0 && (
          <div class="paper t9" style={{ borderColor: 'var(--red)' }}>
            {p.hurts.map((h, i) => <div key={i} class="red">{h}</div>)}
          </div>
        )}
      </div>
    </Panel>
  );
}

/** 장면: v4 Scene과 같은 캔버스 반복 그리기. 인생이나 따라잡음이 바뀔 때만 그림 자료를 다시 만든다. ready 전에는 싸움 상대를 그리지 않는다 */
function Scene({ s, ready }: { s: Life5; ready: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef({ s, ready });
  live.current = { s, ready };
  useEffect(() => {
    const c = ref.current!;
    let raf = 0, t = 0;
    let last: Life5 | null = null, lastReady = false, input: SceneInput | null = null;
    const loop = () => {
      t += 1;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const cur = live.current;
      if (cur.s !== last || cur.ready !== lastReady || !input) { last = cur.s; lastReady = cur.ready; input = sceneOf(cur.s, cur.ready); }
      const ctx = c.getContext('2d');
      if (ctx && w > 0) drawScene(ctx, w, h, t, input);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div class="frame" style={{ padding: 0 }}>
      <canvas ref={ref} class="scene" aria-label="현재 장면" />
    </div>
  );
}

/** 이야기: 한 줄씩 아래에서 떠오른다. 다 떠올라야 다음 토막으로 가고 선택이 뜬다 */
function StoryPanel({ s }: { s: Life5 }) {
  const st = useStore();
  const [onlyHeavy, setOnlyHeavy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const lastTop = useRef(0);
  const items = storyLines(s, st.shownId, onlyHeavy);
  const waiting = s.log.filter((l) => l.id > st.shownId).length;
  const newest = items.length ? items[items.length - 1].id : undefined;
  useEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [newest, onlyHeavy]);
  // 마우스를 올린 채 칸이 사라지면(탭 바꿈 · 화면 바꿈) 멈춤이 남지 않게 푼다
  useEffect(() => () => actions.setReading(false), []);
  const onScroll = () => {
    const el = box.current;
    if (!el) return;   // 휴대폰에서 탭을 바꾸는 순간 이야기 칸이 사라질 수 있다
    // 맨 아래 가까이면 다시 따라가고, 읽는 사람이 위로 올렸을 때만 따라가기를 멈춘다.
    // (빠른 배속에서는 스크롤 사건이 오기 전에 새 줄이 붙어 틈이 벌어질 수 있으니 틈만 보고 멈추지 않는다)
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) stick.current = true;
    else if (el.scrollTop < lastTop.current) stick.current = false;
    lastTop.current = el.scrollTop;
  };
  // 마우스가 칸 안에서 실제로 움직일 때만 멈춘다(flow.ts shouldRead). 창이 닫혀 커서가 그 자리에 놓였을 뿐이면 흐름은 이어진다
  const onPointerMove = (e: PointerEvent) => {
    if (st.reading) return;
    const moved = e.movementX !== 0 || e.movementY !== 0;   // 화면이 바뀌어 생긴 가짜 움직임은 0이다
    if (shouldRead({ pointerType: e.pointerType, moved, msSinceWindowClosed: msSinceWindowClosed() })) actions.setReading(true);
  };
  const idle = st.settings.speed !== 0 && !st.reading && waiting === 0 && !s.pending;
  const status = st.settings.speed === 0 ? '❚❚ 정지 중 — ▶ 를 누르면 이야기가 이어진다'
    : st.reading ? '❚❚ 읽는 동안 멈춰 있다'
    : waiting > 0 ? `이야기가 이어지는 중… (${waiting}줄)`
    : s.pending ? '선택을 기다린다'
    : '마우스를 올려 두면 멈춘다';
  return (
    <Panel title="이야기" cls="story-panel" extra={
      <div class="row" style={{ gap: 4 }}>
        {([[false, '전체'], [true, '큰일만']] as const).map(([v, label]) => (
          <button key={label} class={`btn small ${onlyHeavy === v ? 'on' : ''}`} onClick={() => setOnlyHeavy(v)} aria-pressed={onlyHeavy === v}>{label}</button>
        ))}
      </div>
    }>
      <div class="story" ref={box} onScroll={onScroll} aria-live="polite"
        onPointerMove={onPointerMove} onPointerLeave={() => actions.setReading(false)}>
        {items.map((l) => l.weight === 'year'
          ? <div key={l.id} class={`story-year ${l.id === newest ? 'rise' : ''}`}>{yearLabel(l)}</div>
          : <div key={l.id} class={`line ${l.weight} ${l.id === newest ? 'rise' : ''}`}>{l.text}</div>)}
      </div>
      <div class="row between t9" style={{ marginTop: 4 }}>
        <span class={`soft ${idle ? 'story-idle' : ''}`}>{status}</span>
        {waiting > 0 && <button class="btn small" onClick={() => actions.showAll()}>▶▶ 바로 보기</button>}
      </div>
    </Panel>
  );
}

type SideTab = 'people' | 'timeline';
const SIDE_TABS: { id: SideTab; label: string }[] = [{ id: 'people', label: '인연' }, { id: 'timeline', label: '연표' }];

/** 데스크톱 오른쪽: 탭 하나만 보이고, 탭 안에서만 스크롤한다 */
function SideTabs({ s }: { s: Life5 }) {
  const [tab, setTab] = useState<SideTab>('people');
  return (
    <div class="side-tabs">
      <div class="side-tab-row" role="tablist" aria-label="인연과 연표">
        {SIDE_TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} class={`btn small ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div class="side-body" role="tabpanel">
        {tab === 'people' ? <PeoplePanel s={s} /> : <TimelinePanel s={s} />}
      </div>
    </div>
  );
}

function PeoplePanel({ s }: { s: Life5 }) {
  const people = peopleView(s);
  return (
    <Panel title="인연">
      <div class="stack">
        {people.length === 0 && <div class="soft">아무도 없다.</div>}
        {people.map((p) => (
          <div key={p.id} class={`row ${p.gone ? 'gone' : ''}`} style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
            <Face who={p.who} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div><b>{p.name}</b></div>
              <div class="t9 soft">{p.relation}{p.gone ? ' · 떠났다' : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/** 연표: 이야기가 따라잡는 동안에는 지금 보이는 나이까지만 */
function TimelinePanel({ s }: { s: Life5 }) {
  const age = shownAt(s, useStore().shownId).age;
  const rows = timelineView({ ...s, timeline: s.timeline.filter((e) => e.age <= age) });
  return (
    <Panel title="연표">
      <div class="stack">
        {rows.length === 0 && <div class="soft">아직 적힌 것이 없다.</div>}
        {rows.map((r, i) => (
          <div key={i} class="timeline-row t9"><b>{r.age}</b> <span>{r.text}</span></div>
        ))}
      </div>
    </Panel>
  );
}
