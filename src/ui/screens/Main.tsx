import { useEffect, useRef, useState } from 'preact/hooks';
import { actions, caughtUp, dispatch, useStore } from '../../app/store';
import { absMonth } from '../../core/util';
import { rankName, crewCapacity } from '../../core/effects';
import { activeBranches } from '../../core/growth/growth';
import { armamentLevel, branchProgress, effectiveStats, getSkill, observationLevel, powerRating } from '../../core/growth/skillbook';
import { crewOf, feastLeft, firstMateOf, isFighter, mateTitle, roleName, ROLE_DESC, traitOf, epithetOf } from '../../core/people';
import { B } from '../../data/balance';
import { crewUnit } from '../../core/combat/units';
import type { BranchId, LifeState, LogEntry } from '../../core/types';
import { missionTitle } from '../../core/world/world';
import { BOSS_BY_ID } from '../../data/bosses';
import { CLASS_NAMES, FRUIT_BY_ID, GRADE_NAMES } from '../../data/fruits';
import { MISSION_BY_ID } from '../../data/missions';
import { SEA_BY_ID, SHIP_BY_ID } from '../../data/seas';
import { BRANCH_NAMES } from '../../data/skills';
import { FRUIT_PASSIVES, HERO_TRAIT_BY_ID, SPECIES_PASSIVES } from '../../data/passives';
import { NAMED_CREW_BY_ID } from '../../data/namedCrew';
import { trialOf } from '../../data/masterTrials';
import { MASTER_BY_ID } from '../../data/masters';
import { GATE_NAMES } from '../../data/skills';
import { josa } from '../../core/josa';
import { TALENT_BY_ID } from '../../data/talents';
import { heroAwakened } from '../../core/combat/mods';
import { SIDE_BY_ID } from '../../data/sideStories';
import { sideCandidates } from '../../core/choice/choice';
import { SPECIES_NAMES } from '../../data/births';
import { Face, fmt, Gauge, heroWho, Panel, personWho, ROUTE_NAMES, STAT_KEYS, STAT_NAMES } from '../common';
import { drawScene, weaponOfSkills } from '../pixel/pixelArt';

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

type MobileTab = 'story' | 'sea' | 'hero' | 'growth' | 'crew';
const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: 'story', label: '이야기', icon: '📜' },
  { id: 'sea', label: '바다', icon: '⚓' },
  { id: 'hero', label: '인물', icon: '🧭' },
  { id: 'growth', label: '성장', icon: '⚔' },
  { id: 'crew', label: '동료', icon: '🏴' },
];

/** 모바일: 탭 다섯 개와 아래 내비게이션 */
function MobileMain({ s }: { s: LifeState }) {
  const st = useStore();
  const [tab, setTab] = useState<MobileTab>('story');
  const [menu, setMenu] = useState(false);
  const sp = st.settings.speed;
  const t = caughtUp(st) ? absMonth(s) : shownTime(s, st.shownId);
  return (
    <div class="app mobile">
      <header class="frame topbar m-topbar">
        <span class="tag">{Math.floor(t / 12)}년 {(t % 12) + 1}월</span>
        <span class="grow" />
        <div class="row" role="group" aria-label="진행 속도" style={{ gap: 3 }}>
          {([0, 1, 2, 4, 8] as const).map((x) => (
            <button class={`btn small ${sp === x ? 'on' : ''}`} onClick={() => actions.setSpeed(x)} aria-pressed={sp === x} aria-label={x === 0 ? '정지' : `${x}배속`}>{x === 0 ? '❚❚' : `▶${x > 1 ? x : ''}`}</button>
          ))}
          <button class="btn small" onClick={() => setMenu(true)} aria-label="메뉴">☰</button>
        </div>
      </header>
      {tab === 'story' && <><Scene s={s} /><StoryPanel s={s} /></>}
      {tab === 'sea' && <SeaPanel s={s} />}
      {tab === 'hero' && <><Profile s={s} /><ProfileDetails s={s} /></>}
      {tab === 'growth' && <GrowthSummary s={s} />}
      {tab === 'crew' && <><CrewPanel s={s} /><PeoplePanel s={s} /></>}
      <nav class="m-nav" aria-label="화면">
        {MOBILE_TABS.map((x) => (
          <button class={tab === x.id ? 'on' : ''} aria-pressed={tab === x.id} onClick={() => setTab(x.id)}>
            <span class="m-ico">{x.icon}</span><span>{x.label}</span>
          </button>
        ))}
      </nav>
      {menu && (
        <div class="overlay" role="dialog" aria-modal="true" aria-label="메뉴" onClick={() => setMenu(false)}>
          <div class="modal frame frame-pad" onClick={(e) => e.stopPropagation()}>
            <div class="head"><span class="sign">메뉴</span><button class="btn small" onClick={() => setMenu(false)}>닫기 ✕</button></div>
            <div class="stack">
              {([['growth', '기술 트리'], ['loadout', '편성'], ['shop', '상점 · 소지품'], ['codex', '도감'], ['save', '저장']] as const).map(([id, label]) => (
                <button class="btn block" onClick={() => { setMenu(false); actions.open(id); }}>{label}</button>
              ))}
              <button class="btn block" disabled={!!s.pending || !caughtUp(st)} onClick={() => { setMenu(false); dispatch({ type: 'tick' }); }}>한 달 진행 (+1달)</button>
              <div class="grid2">
                <button class={`btn ${st.settings.sfx ? 'on' : ''}`} aria-pressed={st.settings.sfx} onClick={() => actions.toggleSound('sfx')}>{st.settings.sfx ? '🔊 효과음 켬' : '🔇 효과음 끔'}</button>
                <button class={`btn ${st.settings.bgm ? 'on' : ''}`} aria-pressed={st.settings.bgm} onClick={() => actions.toggleSound('bgm')}>{st.settings.bgm ? '♪ 음악 켬' : '♪ 음악 끔'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Main() {
  const st = useStore();
  const s = st.life!;
  const mobile = useMobile();
  if (mobile) return <MobileMain s={s} />;
  return (
    <div class="app desk">
      <TopBar s={s} />
      <div class="cols">
        <div class="col left"><Profile s={s} /></div>
        <div class="col mid">
          <Scene s={s} />
          <StoryPanel s={s} />
        </div>
        <div class="col right"><SideTabs s={s} /></div>
      </div>
    </div>
  );
}

function TopBar({ s }: { s: LifeState }) {
  const st = useStore();
  const sp = st.settings.speed;
  return (
    <header class="frame topbar">
      <span class="title">그랜드 트레저</span>
      <span class="tag">{(() => { const t = caughtUp(st) ? absMonth(s) : shownTime(s, st.shownId); return `해원력 ${Math.floor(t / 12)}년 ${(t % 12) + 1}월`; })()}</span>
      <span class="grow" />
      <div class="row" role="group" aria-label="진행 속도">
        {([0, 1, 2, 4, 8] as const).map((x) => (
          <button class={`btn small ${sp === x ? 'on' : ''}`} onClick={() => actions.setSpeed(x)} aria-pressed={sp === x}>{x === 0 ? '❚❚ 정지' : `▶${x > 1 ? x : ''}`}</button>
        ))}
        <button class="btn small" disabled={!!s.pending || !caughtUp(st)} onClick={() => dispatch({ type: 'tick' })} title="한 달 진행">+1달</button>
      </div>
      <div class="row">
        <button class="btn small" onClick={() => actions.open('growth')}>기술 트리</button>
        <button class="btn small" onClick={() => actions.open('loadout')}>편성</button>
        <button class="btn small" onClick={() => actions.open('shop')}>상점 · 소지품</button>
        <button class="btn small" onClick={() => actions.open('codex')}>도감</button>
        <button class="btn small" onClick={() => actions.open('save')}>저장</button>
      </div>
    </header>
  );
}

/** 인물의 자세한 정보: 재능 · 패기 · 열매 · 종족 · 특성 (데스크톱은 오른쪽 탭, 모바일은 인물 탭 아래) */
function ProfileDetails({ s }: { s: LifeState }) {
  const h = s.hero;
  const fruit = h.fruit ? FRUIT_BY_ID[h.fruit.id] : null;
  const talents = h.traits.map((id) => TALENT_BY_ID[id]).filter((t) => t && t.id !== 'conqueror');
  return (
    <Panel title="자세히">
      <div class="stack t9">
        {talents.length > 0 && (
          <div><b>타고난 재능</b>
            <div class="row" style={{ gap: 3, marginTop: 3 }}>{talents.map((t) => <span class={`tag ${t.good ? 'green' : 'red'}`} title={t.desc}>{t.name}</span>)}</div>
            <div class="soft" style={{ marginTop: 3 }}>{talents.map((t) => `${t.name}: ${t.desc}`).join(' · ')}</div>
          </div>
        )}
        <div class="row">
          <span class="tag blue">무장색 {armamentLevel(s)}</span>
          <span class="tag blue">견문색 {observationLevel(s)}</span>
          {h.traits.includes('conqueror') && <span class="tag red">왕의 자질</span>}
        </div>
        <div class="paper">
          <b>열매</b> {fruit ? <>{fruit.name} <span class="soft">({CLASS_NAMES[fruit.cls]} · {GRADE_NAMES[fruit.grade]})</span>
            <div class="soft">{(heroAwakened(s) ? FRUIT_PASSIVES[fruit.id]?.awakenText : FRUIT_PASSIVES[fruit.id]?.text) ?? ''}</div></> : <span class="soft">없음 (헤엄칠 수 있다)</span>}
          {SPECIES_PASSIVES[h.species] && <div><b>{SPECIES_NAMES[h.species]}</b> · {SPECIES_PASSIVES[h.species]!.name} <span class="soft">· {SPECIES_PASSIVES[h.species]!.desc}{SPECIES_PASSIVES[h.species]!.who ? ` (원작: ${SPECIES_PASSIVES[h.species]!.who})` : ''}</span></div>}
          {h.persona && <div><b>특성</b> {HERO_TRAIT_BY_ID[h.persona]?.name} <span class="soft">· {HERO_TRAIT_BY_ID[h.persona]?.desc}</span></div>}
        </div>
      </div>
    </Panel>
  );
}

type SideTab = 'sea' | 'growth' | 'crew' | 'hero' | 'people';
const SIDE_TABS: { id: SideTab; label: string }[] = [
  { id: 'sea', label: '바다' }, { id: 'growth', label: '성장' }, { id: 'crew', label: '동료' }, { id: 'hero', label: '인물' }, { id: 'people', label: '사람들' },
];
/** 데스크톱 오른쪽: 탭 하나만 보이고, 탭 안에서만 스크롤한다 */
function SideTabs({ s }: { s: LifeState }) {
  const [tab, setTab] = useState<SideTab>(() => {
    try { const v = localStorage.getItem('gt4.sideTab'); return (SIDE_TABS.some((t) => t.id === v) ? v : 'sea') as SideTab; } catch { return 'sea'; }
  });
  const pick = (t: SideTab) => { setTab(t); try { localStorage.setItem('gt4.sideTab', t); } catch { /* 저장 안 되는 브라우저 */ } };
  return (
    <div class="side-tabs">
      <div class="side-tab-row" role="tablist" aria-label="자세한 정보">
        {SIDE_TABS.map((t) => (
          <button role="tab" aria-selected={tab === t.id} class={`btn small ${tab === t.id ? 'on' : ''}`} onClick={() => pick(t.id)}>{t.label}</button>
        ))}
      </div>
      <div class="side-body" role="tabpanel">
        {tab === 'sea' && <SeaPanel s={s} />}
        {tab === 'growth' && <GrowthSummary s={s} />}
        {tab === 'crew' && <CrewPanel s={s} />}
        {tab === 'hero' && <ProfileDetails s={s} />}
        {tab === 'people' && <PeoplePanel s={s} />}
      </div>
    </div>
  );
}

function Profile({ s }: { s: LifeState }) {
  const st = useStore();
  const h = s.hero;
  const shownAge = caughtUp(st) ? h.age : ageAt(s, shownTime(s, st.shownId));
  const eff = effectiveStats(s);
  const fameLabel = h.route === 'marine' ? '공적' : '현상금';
  const fameValue = h.route === 'marine' ? fmt(h.fame) : `${fmt(h.fame * 10000)} 베리`;
  const maxStat = Math.max(40, ...STAT_KEYS.map((k) => eff[k]));
  return (
    <Panel title="인물">
      <div class="poster">
        <div class="wanted">{h.route === 'marine' ? 'MARINE' : h.route === 'none' ? 'PROFILE' : 'WANTED'}</div>
        <Face who={{ ...heroWho(s), age: shownAge }} size="big" />
        <div class="t14"><b>{h.surname} {h.name}</b></div>
        <div class="t9 soft">{shownAge}세 · {h.gender === 'm' ? '남' : '여'} · {SPECIES_NAMES[h.species]} · {h.birth.place}</div>
        <div class="row" style={{ justifyContent: 'center', marginTop: 4 }}>
          <span class="tag">{ROUTE_NAMES[h.route]}</span>
          <span class="tag gold">{rankName(s)}</span>
          {h.traits.includes('conqueror') && <span class="tag red">왕의 자질</span>}
        </div>
        {h.route !== 'none' && <div style={{ marginTop: 4 }}>{fameLabel} <b>{fameValue}</b></div>}
      </div>
      <div class="stack" style={{ marginTop: 8 }}>
        <div class="row between"><span>돈</span><b class={h.money < 0 ? 'red' : ''}>{fmt(h.money)} 베리</b></div>
        <div class="row between"><span>전투력</span><b>{fmt(powerRating(s))}</b></div>
        <div>
          <div class="row between t9"><span>건강</span><span>{Math.round(h.hp)} / 100</span></div>
          <Gauge value={h.hp} max={100} />
        </div>
        {STAT_KEYS.map((k) => (
          <div class="stat t9">
            <span>{STAT_NAMES[k]}</span>
            <Gauge value={eff[k]} max={maxStat} kind="gold" thin />
            <span class="num">{Math.floor(eff[k])}</span>
          </div>
        ))}
        {(h.injuries.length > 0 || h.illness) && (
          <div class="paper t9" style={{ borderColor: 'var(--red)' }}>
            {h.injuries.map((i) => <div class="red">{i.severity === 'scar' ? `후유증 (${STAT_NAMES[i.stat ?? 'str']} −3)` : `${i.severity === 'heavy' ? '무거운' : '가벼운'} 부상 · ${i.monthsLeft}개월`}</div>)}
            {h.illness && <div class="red">{h.illness.id} {h.illness.stage}단계{h.illness.stage >= 2 ? ' · 성장 멈춤' : ''}</div>}
          </div>
        )}
      </div>
    </Panel>
  );
}

function Scene({ s }: { s: LifeState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(s);
  live.current = s;
  useEffect(() => {
    const c = ref.current!;
    let raf = 0, t = 0;
    const loop = () => {
      t += 1;
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const cur = live.current;
      const ctx = c.getContext('2d');
      if (ctx && w > 0) {
        const pend = cur.pending;
        const foe = pend && (pend.kind === 'prep' || pend.kind === 'battle' || pend.kind === 'intervene') ? pend.encounter.enemy : null;
        const sx = SEA_BY_ID[cur.world.seaId];
        const active = cur.world.missions.find((m) => m.state === 'active');
        const sailing = !!active && MISSION_BY_ID[active.id].steps[active.step]?.kind === 'story' && active.monthsInStep % 4 < 2 && cur.hero.route !== 'none';
        drawScene(ctx, w, h, t, {
          hero: heroWho(cur), crew: crewOf(cur).map(personWho),
          foe: foe ? { key: foe.faceKey ?? foe.canon ?? foe.id + foe.name, gender: foe.gender, age: foe.age, species: foe.species, faction: foe.faction, form: foe.form, weapon: weaponOfSkills(foe.skills) } : null,
          sailing, place: sailing ? `${sx.name} · 항해 중` : `${sx.name} · ${active?.port ?? cur.hero.birth.place}`,
          islandColor: ['#70b582', '#c8b070', '#8ab0d0', '#b0d890', '#d0a0a0', '#90c0a0'][cur.world.stage - 1],
          flag: cur.hero.route === 'marine' ? 'marine' : cur.hero.route === 'pirate' ? 'pirate' : cur.hero.route === 'revolution' ? 'rev' : 'civil',
          aura: cur.hero.fruit ? '#c890ff' : armamentLevel(cur) > 0 ? '#ff7060' : null,
        });
      }
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

function SeaPanel({ s }: { s: LifeState }) {
  const sx = SEA_BY_ID[s.world.seaId];
  const boss = s.world.boss.id ? BOSS_BY_ID[s.world.boss.id] : null;
  const ship = s.world.ship ? SHIP_BY_ID[s.world.ship] : null;
  return (
    <Panel title={`${sx.stage}단계 · ${sx.name}`} extra={<span class="tag">{s.hero.route === 'marine' ? '해군 함선' : ship ? `${ship.name} (동료 ${crewCapacity(s)}명)` : '배 없음'}</span>}>
      {s.hero.route === 'none' ? (
        <div class="soft">{s.hero.age < 16 ? `수련기. 16세가 되면 바다로 나간다. (지금 ${s.hero.age}세)` : '아직 길을 정하지 않았다.'}</div>
      ) : (
        <div class="stack">
          {s.world.missions.map((m) => {
            const def = MISSION_BY_ID[m.id];
            const steps = def.steps.length;
            const tagc = m.state === 'done' ? 'green' : m.state === 'failed' ? 'red' : m.state === 'active' ? 'gold' : '';
            const label = { open: '대기', active: '진행 중', done: '완료', failed: '실패 · 교체 대기' }[m.state];
            return (
              <div class="paper row between">
                <span>{missionTitle(m)}</span>
                <span class="row">
                  {m.state === 'active' && <span class="t9 soft">{m.step + 1}/{steps}단계{def.steps[m.step]?.kind === 'story' ? ` · ${m.monthsInStep}/${(def.steps[m.step] as { months: number }).months}달` : ' · 강적전'}</span>}
                  <span class={`tag ${tagc}`}>{label}</span>
                </span>
              </div>
            );
          })}
          {boss && (
            <div class="paper row between" style={{ background: s.world.boss.state === 'revealed' ? '#fbe0d0' : undefined }}>
              <span class="row">
                {s.world.boss.state === 'hidden' ? <span class="soft">해역 보스: ??? (임무 3개를 마치면 드러난다)</span> : (
                  <><Face who={{ key: boss.canon ?? boss.id + boss.name, gender: boss.gender, age: boss.age, species: boss.species, faction: boss.faction }} size="sm" />
                    <span><b>{boss.name}</b> <span class="t9 soft">{boss.title}{s.world.boss.attempts ? ` · 도전 ${s.world.boss.attempts}회` : ''}</span></span></>
                )}
              </span>
              {s.world.boss.state === 'revealed' && <button class="btn red" disabled={!!s.pending} onClick={() => dispatch({ type: 'challengeBoss' })}>도전</button>}
              {s.world.boss.state === 'defeated' && <span class="tag green">격파</span>}
            </div>
          )}
          {s.world.side && (() => {
            const st = SIDE_BY_ID[s.world.side.id];
            return st ? (
              <div class="paper row between" style={{ background: '#eef6e0' }}>
                <span><span class="tag green">곁가지</span> {st.title}</span>
                <span class="t9 soft">{s.world.side.step + 1}/{st.steps.length}단계 · 해역 임무는 쉬는 중</span>
              </div>
            ) : null;
          })()}
          {!s.world.side && s.world.boss.state === 'revealed' && sideCandidates(s).length > 0 && (
            <div class="paper row between t9">
              <span>보스가 버겁다면 곁가지 이야기로 힘을 길러 오자 · 남은 이야기 {sideCandidates(s).length}개</span>
              <button class="btn small" disabled={!!s.pending || !!s.world.training || !!s.world.seeking} onClick={() => dispatch({ type: 'seekSide' })}>곁가지 이야기 찾기</button>
            </div>
          )}
          {s.choice.flags.includes('need_ship') && <div class="paper t9 red">다음 해역으로 가려면 더 좋은 배가 필요하다. 돈이 모이면 배를 사는 선택이 뜬다.</div>}
          {s.world.apex && <div class="paper gold"><b>바다의 정점에 섰다.</b></div>}
        </div>
      )}
    </Panel>
  );
}

const LOG_FILTERS = {
  all: { label: '전체', test: (_: LogEntry) => true },
  main: { label: '중요한 일', test: (l: LogEntry) => !['day', 'life', 'money', 'growth'].includes(l.type) },
  life: { label: '일상', test: (l: LogEntry) => l.type === 'day' || l.type === 'life' },
} as const;

/** 기록 시점의 나이 */
/** 이야기가 따라잡는 동안에는 지금 보이는 줄의 시점으로 나이 · 날짜를 보여 준다 */
function shownTime(s: LifeState, shownId: number) {
  let t = absMonth(s);
  for (let i = s.log.length - 1; i >= 0; i--) {
    const l = s.log[i];
    if (l.id === undefined || l.id <= shownId) { t = l.id === undefined ? t : l.t; break; }
  }
  return Math.min(t, absMonth(s));
}

function ageAt(s: LifeState, t: number) {
  const since = (s.time.month - s.hero.birth.month + 12) % 12;
  const birthAbs = absMonth(s) - s.hero.age * 12 - since;
  return Math.max(0, Math.floor((t - birthAbs) / 12));
}

/** 이야기: 한 줄씩 아래에서 떠오른다. 다 떠올라야 다음 달로 가고 선택이 뜬다 */
function StoryPanel({ s }: { s: LifeState }) {
  const st = useStore();
  const [filter, setFilter] = useState<keyof typeof LOG_FILTERS>('all');
  const box = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const shown = s.log.filter((l) => l.id === undefined || l.id <= st.shownId);
  const items = shown.filter(LOG_FILTERS[filter].test).slice(-160);
  const waiting = s.log.length - shown.length;
  const newest = items.length ? items[items.length - 1].id : undefined;
  useEffect(() => {
    const el = box.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [newest, filter]);
  const onScroll = () => {
    const el = box.current;
    if (!el) return;   // 모바일에서 탭을 바꾸는 순간 이야기 칸이 사라질 수 있다
    stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };
  let lastYear = -1;
  return (
    <Panel title="이야기" cls="story-panel" extra={
      <div class="row" style={{ gap: 4 }}>
        {(Object.keys(LOG_FILTERS) as (keyof typeof LOG_FILTERS)[]).map((k) => (
          <button class={`btn small ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)} aria-pressed={filter === k}>{LOG_FILTERS[k].label}</button>
        ))}
      </div>
    }>
      <div class="story" ref={box} onScroll={onScroll} aria-live="polite"
        onPointerEnter={(e) => { if (e.pointerType === 'mouse') actions.setReading(true); }} onPointerLeave={() => actions.setReading(false)}>
        {items.map((l) => {
          const year = Math.floor(l.t / 12);
          const head = year !== lastYear;
          lastYear = year;
          return (
            <>
              {head && <div class="story-year" key={`y${year}`}>{year}년 · {ageAt(s, l.t)}세</div>}
              <div key={l.id ?? `${l.t}-${l.text}`} class={`line ${l.type} ${l.id !== undefined && l.id === newest ? 'rise' : ''}`}>
                <span class="when t9">{(l.t % 12) + 1}월</span>{l.text}
              </div>
            </>
          );
        })}
      </div>
      <div class="row between t9" style={{ marginTop: 4 }}>
        <span class="soft">{st.settings.speed === 0 ? '❚❚ 정지 중 — ▶ 를 누르면 이야기가 이어진다' : st.reading ? '❚❚ 읽는 동안 멈춰 있다' : waiting > 0 ? `이야기가 이어지는 중… (${waiting}줄)` : s.pending ? '선택을 기다린다' : '마우스를 올려 두면 멈춘다'}</span>
        {waiting > 0 && <button class="btn small" onClick={() => actions.showAll()}>▶▶ 바로 보기</button>}
      </div>
    </Panel>
  );
}

function GrowthSummary({ s }: { s: LifeState }) {
  const m = s.growth.master;
  const branches = activeBranches(s);
  return (
    <Panel title="성장" extra={<button class="btn small" onClick={() => actions.open('growth')}>트리</button>}>
      <div class="stack">
        <SlotLine s={s} label="주력" branch={s.growth.focus} />
        <PersonaLine s={s} />
        <SlotLine s={s} label="패기" branch={s.growth.haki ?? null} />
        <FruitLine s={s} />

        {m && <div class="paper t9">스승 <b>{m.name}</b> 밑에서 수련 중 · {m.monthsLeft}개월 남음</div>}
        {s.world.training ? (
          <div class="paper t9">집중 수련 중 · {s.world.training.left}개월 남음 · 성장 ×{B.training.mult}, 벌이 없음, 임무 쉼</div>
        ) : s.hero.age >= B.training.minAge && !s.world.seeking && (
          <div class="row" style={{ gap: 4 }}>
            {B.training.options.map((n) => (
              <button class="btn small" style={{ flex: 1 }} disabled={!!s.pending} title={`${n}개월 동안 벌이 없이 수련한다. 능력치 · 숙련이 ${B.training.mult}배로 자란다`}
                onClick={() => { if (confirm(`${n}개월 동안 일을 쉬고 수련할까? 벌이가 없고 임무도 쉰다. 생활비는 나간다.`)) dispatch({ type: 'startTraining', months: n }); }}>
                집중 수련 {n}개월
              </button>
            ))}
          </div>
        )}
        {s.world.trial && <div class="paper t9">스승의 시험 중 · {trialOf(s.world.trial.master).short} (그동안 임무는 쉰다)</div>}
        {!s.world.trial && s.world.masterPromise && !m && <div class="paper t9 soft">{MASTER_BY_ID[s.world.masterPromise.master]?.name}이(가) 「{GATE_NAMES[s.world.masterPromise.gate]}」을(를) 가르치러 다시 오기로 했다 (준비가 되면 찾아온다)</div>}
        {!m && s.world.seeking && <div class="paper t9">스승을 찾아 헤매는 중 · {s.world.seeking.month}개월째 (최대 {B.seek.months}개월). 그동안 임무는 쉰다</div>}
        {!m && !s.world.seeking && !s.world.training && s.hero.age >= 14 && (
          <button class="btn small block" disabled={!!s.pending || s.hero.money < B.seek.cost * s.world.stage}
            title="찾는다고 반드시 만나는 것은 아니다. 1년을 허비할 수도 있다"
            onClick={() => { if (confirm(`스승을 찾아 나설까? 여비 ${(B.seek.cost * s.world.stage).toLocaleString('ko-KR')} 베리. 최대 1년 동안 임무를 쉬고, 못 찾을 수도 있다.`)) dispatch({ type: 'seekMaster' }); }}>
            스승을 찾아 나선다 ({(B.seek.cost * s.world.stage).toLocaleString('ko-KR')} 베리 · 최대 1년)
          </button>
        )}
        <div class="t9 soft">장착한 기술 ({s.loadout.skills.length}/6)</div>
        {s.loadout.skills.map((id) => {
          const k = s.growth.skills[id];
          return <SkillLine id={id} mastery={k?.mastery ?? 0} />;
        })}
        {branches.length === 0 && <div class="soft t9">아직 배우는 것이 없다.</div>}
      </div>
    </Panel>
  );
}

/** 특성 칸: 성격적인 특성 하나 (보조 칸 대신) */
function PersonaLine({ s }: { s: LifeState }) {
  const t = s.hero.persona ? HERO_TRAIT_BY_ID[s.hero.persona] : null;
  return (
    <div class="paper" style={{ padding: '4px 8px' }}>
      <div class="row between"><b>특성</b><b>{t ? t.name : <span class="soft t9">—</span>}</b></div>
      {t && <div class="t9">{t.desc}</div>}
    </div>
  );
}

/** 열매 칸: 기술이 아니라 패시브. 숙련이 오를수록 세지고, 각성하면 바뀐다 */
function FruitLine({ s }: { s: LifeState }) {
  const f = s.hero.fruit ? FRUIT_BY_ID[s.hero.fruit.id] : null;
  const fp = f ? FRUIT_PASSIVES[f.id] : null;
  const m = s.growth.fruitMastery ?? 0;
  const awake = heroAwakened(s);
  return (
    <div class="paper" style={{ padding: '4px 8px' }}>
      <div class="row between"><b>열매</b><b>{f ? f.name : <span class="soft t9">—</span>}</b></div>
      {f && fp ? (
        <>
          <div class="t9">{awake ? <><span class="tag gold">각성</span> {fp.awakenText}</> : fp.text}</div>
          <div class="row between t9"><span>숙련</span><span>{Math.floor(m)}</span></div>
          <Gauge value={m} max={100} kind="sp" thin />
        </>
      ) : null}
    </div>
  );
}

function SlotLine({ s, label, branch }: { s: LifeState; label: string; branch: BranchId | null }) {
  const pg = branch ? branchProgress(s, branch) : null;
  return (
    <div class="paper" style={{ padding: '4px 8px' }}>
      <div class="row between"><b>{label}</b><b>{branch ? BRANCH_NAMES[branch] : <span class="soft t9">—</span>}</b></div>
      {pg ? (
        <>
          <div class="row between t9"><span>기술 {pg.learned}/{pg.total}</span><span>숙련 {Math.floor(pg.mastery)}</span></div>
          <Gauge value={pg.mastery} max={100} kind="sp" thin />
        </>
      ) : null}
    </div>
  );
}

function SkillLine({ id, mastery }: { id: string; mastery: number }) {
  const sk = getSkill(id);
  return (
    <div>
      <div class="row between t9"><span>{sk?.name ?? id}</span><span>{Math.floor(mastery)}</span></div>
      <Gauge value={mastery} max={100} kind="sp" thin />
    </div>
  );
}

function CrewPanel({ s }: { s: LifeState }) {
  const crew = crewOf(s);
  const cap = crewCapacity(s);
  const ship = s.world.ship ? SHIP_BY_ID[s.world.ship] : null;
  const heroPower = powerRating(s);
  const mate = firstMateOf(s);
  const feast = feastLeft(s);
  const treatCost = B.crew.feastCostPer * crew.length * s.world.stage;
  const scattered = s.people.filter((q) => q.alive && q.relation === '흩어진 옛 동료' && q.crew);
  return (
    <Panel title={s.hero.route === 'marine' ? '내 분대' : '배 · 동료'} extra={<button class="btn small" onClick={() => actions.open('loadout')}>편성</button>}>
      <div class="row between t9" style={{ marginBottom: 6 }}>
        <span>{s.hero.route === 'marine' ? (cap === 0 ? '분대원 없음 · 하사(분대장)부터 분대를 꾸린다' : '분대장 · 계급이 오르면 정원이 는다') : ship ? ship.name : '배 없음'}</span>
        <span class="tag">정원 {crew.length}/{cap}</span>
      </div>
      {crew.length > 0 && (
        <div class="paper t9" style={{ marginBottom: 6 }}>
          <div class="row between">
            <span>{mate ? <>{mateTitle(s)} <b>{mate.name}</b> · 본인 피해 +15%, 다른 동료 +5%</> : <span class="soft">{josa(`${mateTitle(s)}이(가) 없다. 동료 카드에서 임명한다`)}</span>}</span>
          </div>
          <div class="row between" style={{ marginTop: 4 }}>
            <span>{feast > 0 ? <b class="green">사기 충천 · {feast}개월 남음 (동료 피해 +10%)</b> : <span class="soft">한턱 쏘면 {B.crew.feastMonths}개월 동안 동료 피해 +10%, 정 +{B.crew.feastBond}</span>}</span>
            <button class="btn small gold" disabled={s.hero.money < treatCost || !!s.pending} onClick={() => dispatch({ type: 'treatCrew' })}>한턱 쏘기 ({treatCost.toLocaleString('ko-KR')})</button>
          </div>
        </div>
      )}
      {s.choice.flags.includes('crew_contacts') && scattered.length > 0 && (
        <div class="paper t9" style={{ marginBottom: 6 }}>
          <div><b>흩어진 옛 동료</b> <span class="soft">· 전보벌레로 불러 다시 태운다 (여비 {(B.crew.recallCost * s.world.stage).toLocaleString('ko-KR')} 베리)</span></div>
          {scattered.map((q) => (
            <div class="row between" style={{ marginTop: 3 }}>
              <span>{epithetOf(q) && <span class="soft">「{epithetOf(q)}」</span>}{q.name} <span class="tag">{roleName(q.crew!.role)}</span> <span class="soft">Lv.{q.crew!.level}</span></span>
              <button class="btn small" disabled={!!s.pending || !!s.world.prison || crew.length >= cap || s.hero.money < B.crew.recallCost * s.world.stage}
                title={crew.length >= cap ? '배에 자리가 없다' : ''} onClick={() => dispatch({ type: 'recallCrew', id: q.id })}>연락해서 부르기</button>
            </div>
          ))}
        </div>
      )}
      {crew.length === 0 && <div class="soft t9">{s.hero.route === 'marine'
        ? (cap === 0 ? `지금은 ${s.people.find((p) => p.relation.startsWith('지휘관'))?.name ?? '상관'} 중령 분대의 ${rankName(s)}이다. 임무를 마치면 진급한다.` : '눈에 띄는 병사를 만나면 스카우트할 수 있다.')
        : cap === 0 ? '배가 없어 동료를 태울 수 없다. 출항하면 생긴다.' : '아직 동료가 없다. 인연 선택과 임무에서 만난다.'}</div>}
      <div class="stack">
        {crew.map((p) => {
          const c = p.crew!;
          const u = crewUnit(p, s.world.stage);
          const fighter = isFighter(c.role);
          const power = Math.round((u.st.str + u.st.spd + u.st.vit + u.st.int + u.st.wil) / 5 * (1 + Math.max(1, ...u.skills.map((k) => getSkill(k.id)?.power ?? 1)) * 0.25));
          const inLoadout = s.loadout.crew.some((x) => x.personId === p.id);
          return (
            <div class="paper" style={{ padding: '6px 8px' }}>
              <div class="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <Face who={personWho(p)} size="sm" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div class="row between">
                    <span class="row" style={{ gap: 4 }}>
                      <b>{epithetOf(p) && <span class="soft">「{epithetOf(p)}」</span>}{p.name}</b>
                      {p.species !== 'human' && <span class="tag" title={SPECIES_PASSIVES[p.species] ? `${SPECIES_PASSIVES[p.species]!.name} · ${SPECIES_PASSIVES[p.species]!.desc}` : ''}>{SPECIES_NAMES[p.species]}</span>}
                      <span class={`tag ${fighter ? 'red' : 'blue'}`}>{roleName(c.role)}</span>
                      {p.canon && NAMED_CREW_BY_ID[p.canon] && <span class="tag" style={{ background: '#f8e0a0' }} title={NAMED_CREW_BY_ID[p.canon].potential}>원작</span>}
                      {mate?.id === p.id && <span class="tag gold">★ {mateTitle(s)}</span>}
                    </span>
                    <span class="tag">Lv.{c.level}</span>
                  </div>
                  <div class="row t9" style={{ gap: 4, marginTop: 2 }}>
                    <span class="tag gold" title={traitOf(p).desc}>{traitOf(p).name}</span>
                    {c.fruit && <span class="tag" style={{ background: '#e8d0f8' }}>{FRUIT_BY_ID[c.fruit]?.name}</span>}
                    {inLoadout ? <span class="tag green">편성 중</span> : <span class="tag">대기</span>}
                    {c.injuredMonths > 0 && <span class="tag red">부상 {c.injuredMonths}달 · 출전 불가</span>}
                    <span class="soft">{p.age}세</span>
                  </div>
                </div>
              </div>
              <div class="t9" style={{ marginTop: 4 }}><b>성격</b> {traitOf(p).desc}</div>
              {p.canon && NAMED_CREW_BY_ID[p.canon] && <div class="t9"><b>잠재력</b> {NAMED_CREW_BY_ID[p.canon].potential} (성장 ×{c.growth ?? 1})</div>}
              <div class="t9 soft">{ROLE_DESC[c.role]}</div>
              {fighter && (
                <div class="t9" style={{ marginTop: 4 }}>
                  <div class="row between"><span>전투력 <b>{power}</b></span><span class="soft">나의 {Math.round(power / Math.max(1, heroPower) * 100)}%</span></div>
                  <Gauge value={power} max={Math.max(power, heroPower)} kind="gold" thin />
                  <div class="row" style={{ gap: 8, marginTop: 2 }}>
                    <span>체력 {u.maxHp}</span><span>힘 {u.st.str}</span><span>속도 {u.st.spd}</span><span>방어 {Math.round(u.def)}</span>
                  </div>
                  <div class="soft">기술: {u.skills.map((k) => getSkill(k.id)?.name).filter(Boolean).join(', ') || '기본 공격'}</div>
                </div>
              )}
              <div class="row between t9" style={{ marginTop: 4 }}>
                <span class="soft">인연 {Math.round(p.bond)}</span>
                {mate?.id === p.id
                  ? <button class="btn small" onClick={() => dispatch({ type: 'appointMate', who: null })}>{mateTitle(s)} 해임</button>
                  : <button class="btn small" onClick={() => dispatch({ type: 'appointMate', who: p.id })}>{mateTitle(s)}로 임명</button>}
              </div>
              <Gauge value={p.bond} max={100} kind="gold" thin />
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function PeoplePanel({ s }: { s: LifeState }) {
  const people = s.people.filter((p) => p.alive && p.kind !== 'crew');
  return (
    <Panel title="사람들">
      <div class="stack">
        {people.length === 0 && <div class="soft">아무도 없다.</div>}
        {people.map((p) => (
          <div class="row" style={{ alignItems: 'center', flexWrap: 'nowrap' }}>
            <Face who={personWho(p)} size="sm" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div><b>{p.name}</b> <span class="t9 soft">{p.age}세</span></div>
              <div class="t9 soft">{p.relation}</div>
              <Gauge value={p.bond} max={100} kind="gold" thin />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
