import { useEffect, useRef, useState } from 'preact/hooks';
import { actions, dispatch, useStore } from '../../app/store';
import { absMonth } from '../../core/util';
import { rankName, crewCapacity } from '../../core/effects';
import { activeBranches } from '../../core/growth/growth';
import { armamentLevel, branchProgress, effectiveStats, getSkill, observationLevel, powerRating } from '../../core/growth/skillbook';
import { crewOf, isFighter, roleName, ROLE_DESC } from '../../core/people';
import { crewUnit } from '../../core/combat/units';
import type { BranchId, LifeState, LogEntry } from '../../core/types';
import { missionTitle } from '../../core/world/world';
import { BOSS_BY_ID } from '../../data/bosses';
import { CLASS_NAMES, FRUIT_BY_ID, GRADE_NAMES } from '../../data/fruits';
import { MISSION_BY_ID } from '../../data/missions';
import { SEA_BY_ID, SHIP_BY_ID } from '../../data/seas';
import { BRANCH_NAMES } from '../../data/skills';
import { SPECIES_NAMES } from '../../data/births';
import { absToDate, date, Face, fmt, Gauge, heroWho, Panel, personWho, ROUTE_NAMES, STAT_KEYS, STAT_NAMES } from '../common';
import { drawScene } from '../pixel/pixelArt';

export function Main() {
  const st = useStore();
  const s = st.life!;
  return (
    <div class="app">
      <TopBar s={s} />
      <div class="cols">
        <div class="col"><Profile s={s} /></div>
        <div class="col">
          <Scene s={s} />
          <SeaPanel s={s} />
          <LogPanel s={s} />
        </div>
        <div class="col right">
          <GrowthSummary s={s} />
          <CrewPanel s={s} />
          <PeoplePanel s={s} />
        </div>
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
      <span class="tag">{date(s)}</span>
      <span class="grow" />
      <div class="row" role="group" aria-label="진행 속도">
        {([0, 1, 2, 4] as const).map((x) => (
          <button class={`btn small ${sp === x ? 'on' : ''}`} onClick={() => actions.setSpeed(x)} aria-pressed={sp === x}>{x === 0 ? '❚❚ 정지' : `▶${x > 1 ? x : ''}`}</button>
        ))}
        <button class="btn small" disabled={!!s.pending} onClick={() => dispatch({ type: 'tick' })} title="한 달 진행">+1달</button>
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

function Profile({ s }: { s: LifeState }) {
  const h = s.hero;
  const eff = effectiveStats(s);
  const fruit = h.fruit ? FRUIT_BY_ID[h.fruit.id] : null;
  const fameLabel = h.route === 'marine' ? '공적' : '현상금';
  const fameValue = h.route === 'marine' ? fmt(h.fame) : `${fmt(h.fame * 10000)} 베리`;
  const maxStat = Math.max(40, ...STAT_KEYS.map((k) => eff[k]));
  return (
    <Panel title="인물">
      <div class="poster">
        <div class="wanted">{h.route === 'marine' ? 'MARINE' : h.route === 'none' ? 'PROFILE' : 'WANTED'}</div>
        <Face who={heroWho(s)} size="big" />
        <div class="t14"><b>{h.surname} {h.name}</b></div>
        <div class="t9 soft">{h.age}세 · {h.gender === 'm' ? '남' : '여'} · {SPECIES_NAMES[h.species]} · {h.birth.place}</div>
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
        <div class="row t9">
          <span class="tag blue">무장색 {armamentLevel(s)}</span>
          <span class="tag blue">견문색 {observationLevel(s)}</span>
        </div>
        <div class="paper t9">
          <b>열매</b> {fruit ? <>{fruit.name} <span class="soft">({CLASS_NAMES[fruit.cls]} · {GRADE_NAMES[fruit.grade]})</span></> : <span class="soft">없음 (헤엄칠 수 있다)</span>}
        </div>
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
          foe: foe ? { key: foe.canon ?? foe.id + foe.name, gender: foe.gender, age: foe.age, species: foe.species, faction: foe.faction, form: foe.form } : null,
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
      <NowBox s={s} />
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
          {s.choice.flags.includes('need_ship') && <div class="paper t9 red">다음 해역으로 가려면 더 좋은 배가 필요하다. 돈이 모이면 배를 사는 선택이 뜬다.</div>}
          {s.world.apex && <div class="paper gold"><b>바다의 정점에 섰다.</b></div>}
        </div>
      )}
    </Panel>
  );
}

const LOG_FILTERS = {
  all: { label: '전체', test: (_: LogEntry) => true },
  main: { label: '중요한 일', test: (l: LogEntry) => !['life', 'money', 'growth'].includes(l.type) },
  life: { label: '작은 사건', test: (l: LogEntry) => l.type === 'life' },
} as const;

function LogPanel({ s }: { s: LifeState }) {
  const [filter, setFilter] = useState<keyof typeof LOG_FILTERS>('all');
  const now = absMonth(s);
  // 최신이 맨 위. 새 줄이 위에 쌓이므로 읽던 자리가 밀리지 않는다
  const items = s.log.filter(LOG_FILTERS[filter].test).slice(-150).reverse();
  const reading = useStore().reading;
  return (
    <Panel title="항해 일지" extra={
      <div class="row" style={{ gap: 4 }}>
        {(Object.keys(LOG_FILTERS) as (keyof typeof LOG_FILTERS)[]).map((k) => (
          <button class={`btn small ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)} aria-pressed={filter === k}>{LOG_FILTERS[k].label}</button>
        ))}
      </div>
    }>
      <div class="t9 soft" style={{ marginBottom: 4 }}>{reading ? '❚❚ 읽는 동안 시간이 멈춰 있다' : '마우스를 올려 두면 시간이 멈춘다 · 맨 위가 최신'}</div>
      <div class="log" aria-live="polite" onMouseEnter={() => actions.setReading(true)} onMouseLeave={() => actions.setReading(false)}>
        {items.map((l) => <div class={`l ${l.type} ${now - l.t <= 1 ? 'new' : ''}`}><span class="when t9">{absToDate(l.t)}</span>{l.text}</div>)}
      </div>
    </Panel>
  );
}

/** 장면 아래: 방금 일어난 일 세 줄 */
function NowBox({ s }: { s: LifeState }) {
  const recent = s.log.filter((l) => l.type !== 'money').slice(-3).reverse();
  return (
    <div class="nowbox">
      {recent.map((l, i) => <div class={`now ${i === 0 ? 'first' : ''} ${l.type}`}><span class="when t9">{absToDate(l.t)}</span>{l.text}</div>)}
    </div>
  );
}

function GrowthSummary({ s }: { s: LifeState }) {
  const m = s.growth.master;
  const branches = activeBranches(s);
  return (
    <Panel title="성장" extra={<button class="btn small" onClick={() => actions.open('growth')}>트리</button>}>
      <div class="stack">
        <SlotLine s={s} label="주력" hint="무술 · 저절로 자란다" branch={s.growth.focus} empty="10세에 정한다" />
        <SlotLine s={s} label="보조" hint="무술 · 절반 속도" branch={s.growth.secondary} empty="갈림길에서 정한다" />
        <SlotLine s={s} label="패기 칸" hint="주력 · 보조와 따로 자란다" branch={s.growth.haki ?? null} empty="패기를 깨우치면 들어간다" />
        <SlotLine s={s} label="열매 칸" hint="주력 · 보조와 따로 자란다" branch={s.hero.fruit ? 'fruit' : null} empty="열매를 먹으면 들어간다"
          name={s.hero.fruit ? FRUIT_BY_ID[s.hero.fruit.id]?.name : undefined} />
        {m && <div class="paper t9">스승 <b>{m.name}</b> 밑에서 수련 중 · {m.monthsLeft}개월 남음</div>}
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

function SlotLine({ s, label, hint, branch, empty, name }: { s: LifeState; label: string; hint: string; branch: BranchId | null; empty: string; name?: string }) {
  const pg = branch ? branchProgress(s, branch) : null;
  return (
    <div class="paper" style={{ padding: '4px 8px' }}>
      <div class="row between"><span><b>{label}</b> <span class="t9 soft">{hint}</span></span><b>{branch ? name ?? BRANCH_NAMES[branch] : <span class="soft t9">—</span>}</b></div>
      {pg ? (
        <>
          <div class="row between t9"><span>기술 {pg.learned}/{pg.total}</span><span>숙련 {Math.floor(pg.mastery)}</span></div>
          <Gauge value={pg.mastery} max={100} kind="sp" thin />
        </>
      ) : <div class="t9 soft">{empty}</div>}
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
  return (
    <Panel title="배 · 동료" extra={<button class="btn small" onClick={() => actions.open('loadout')}>편성</button>}>
      <div class="row between t9" style={{ marginBottom: 6 }}>
        <span>{s.hero.route === 'marine' ? `해군 함선 (계급에 따라 정원)` : ship ? ship.name : '배 없음'}</span>
        <span class="tag">정원 {crew.length}/{cap}</span>
      </div>
      {crew.length === 0 && <div class="soft t9">{cap === 0 ? '배가 없어 동료를 태울 수 없다. 출항하면 생긴다.' : '아직 동료가 없다. 인연 선택과 임무에서 만난다.'}</div>}
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
                    <b>{p.name}</b>
                    <span class="row" style={{ gap: 4 }}>
                      <span class={`tag ${fighter ? 'red' : 'blue'}`}>{roleName(c.role)}</span>
                      <span class="tag">Lv.{c.level}</span>
                    </span>
                  </div>
                  <div class="row t9" style={{ gap: 4, marginTop: 2 }}>
                    {inLoadout ? <span class="tag green">편성 중</span> : <span class="tag">대기</span>}
                    {c.injuredMonths > 0 && <span class="tag red">부상 {c.injuredMonths}달 · 출전 불가</span>}
                    <span class="soft">{p.age}세</span>
                  </div>
                </div>
              </div>
              <div class="t9 soft" style={{ marginTop: 4 }}>{ROLE_DESC[c.role]}</div>
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
              <div class="row between t9" style={{ marginTop: 4 }}><span class="soft">인연</span><span>{Math.round(p.bond)}</span></div>
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
