import { describe, expect, it } from 'vitest';
import { HOMETOWNS } from '../../src/data/births';
import { newLife5 } from '../../src/v5/core/state';
import { apply5 } from '../../src/v5/core/reduce';
import { applyFx, fillText } from '../../src/v5/core/fx';
import { normalizeLife5 } from '../../src/v5/core/load';
import type { Life5 } from '../../src/v5/core/types';
import { CHILDHOOD_INCIDENTS, INCIDENTS_BY_TOWN } from '../../src/v5/data/childhood-incidents';

function atHome(town: typeof HOMETOWNS[number], seed: number) {
  const s = newLife5(seed, { home: town.home, lineage: 'commoner' });
  s.hero.town = s.hero.island = town.name;
  s.age = 8;
  s.pending = null;
  return s;
}

function scene(s: Life5) {
  if (s.pending?.kind !== 'door') throw new Error('열린 선택지가 없다');
  return s.pending;
}

function playTo(s: Life5, turningPrefix: string) {
  for (let i = 0; i < 100 && s.hero.alive; i++) {
    if (s.pending?.kind === 'door' && s.pending.turning.startsWith(turningPrefix)) return scene(s);
    if (!s.pending) apply5(s, { type: 'step' });
    else {
      const index = s.pending.kind === 'door' ? s.pending.doors.findIndex(d => !d.locked && !d.danger) : 0;
      apply5(s, { type: 'answer', index: Math.max(0, index) });
    }
  }
  throw new Error(turningPrefix + ' 미도달');
}

describe('유년기의 고향 사건', () => {
  it('모든 출생 마을마다 서로 다른 다섯 사건이 실제 진행에서 열린다', () => {
    expect(Object.keys(INCIDENTS_BY_TOWN).sort()).toEqual(HOMETOWNS.map(t => t.name).sort());
    for (const town of HOMETOWNS) {
      const ids = INCIDENTS_BY_TOWN[town.name];
      expect(new Set(ids).size).toBe(5);
      const titles = new Set<string>();
      for (let seed = 1; seed <= 100 && titles.size < 5; seed++) {
        const s = atHome(town, seed);
        apply5(s, { type: 'step' });
        if (s.pending?.kind !== 'door') throw new Error(town.name);
        if (titles.has(s.pending.title)) continue;
        const story = CHILDHOOD_INCIDENTS[s.pending.turning.slice('child_crisis_'.length)];
        titles.add(s.pending.title);
        expect(scene(s).doors[2].label).toBe(fillText(s, story.parentChoice!));
        apply5(s, { type: 'answer', index: 1 });
        apply5(s, { type: 'step' });
        expect(scene(s).doors[1].label).toBe(fillText(s, story.rivalChoice!));
        expect(scene(s).doors[2].label).toBe(fillText(s, story.mentorChoice!));
      }
      expect([...titles].sort()).toEqual(ids.map(id => CHILDHOOD_INCIDENTS[id].title).sort());
    }
  });

  it('없는 인연은 부르지 않고, 같은 맞수와 함께 막은 기록을 저장한다', () => {
    const s = atHome(HOMETOWNS[0], 42);
    s.people = [];
    apply5(s, { type: 'step' });
    if (s.pending?.kind !== 'door') throw new Error('사건');
    expect(s.pending.doors[2].locked).toBeTruthy();
    apply5(s, { type: 'answer', index: 1 });
    apply5(s, { type: 'step' });
    if (s.pending?.kind !== 'door') throw new Error('도움');
    expect(s.pending.doors.map(d => !!d.locked)).toEqual([false, true, true]);
    const r = atHome(HOMETOWNS[0], 42);
    applyFx(r, [{ op: 'person', kind: 'rival', relation: '어릴 적 맞수', name: '솔' }]);
    apply5(r, { type: 'step' });
    apply5(r, { type: 'answer', index: 1 });
    apply5(r, { type: 'step' });
    const saved = structuredClone(r);
    apply5(saved, { type: 'answer', index: 1 });
    expect(saved.flags).toContain('homeCrisis:rival');
    expect(saved.timeline.some(t => t.text.includes('솔'))).toBe(true);
    const story = CHILDHOOD_INCIDENTS[scene(r).turning.slice('child_crisis_'.length, -'_help'.length)];
    expect(saved.childhoodMemory).toMatchObject({ storyId: story.id, outcome: 'rival', personName: '솔' });
    apply5(saved, { type: 'step' });
    expect(saved.pending?.kind === 'door' && saved.pending.turning.startsWith('child_crisis_')).toBe(false);
    saved.pending = null;
    saved.age = 12;
    apply5(saved, { type: 'step' });
    expect(scene(saved).body).toContain(story.title);
    expect(scene(saved).body).toContain('솔');
    expect(scene(saved).body).toContain(story.landmark);
    apply5(saved, { type: 'answer', index: 0 });
    expect(saved.flags).toContain('homeCrisis:copy');
  });

  it('대피한 부모는 살아 있고, 사망한 부모만 인물 목록과 연표에 반영된다', () => {
    const outcomes = new Set<boolean>();
    for (let seed = 1; seed < 100 && outcomes.size < 2; seed++) {
      const s = atHome(HOMETOWNS[0], seed);
      const mother = s.people.find(p => p.relation === '어머니')!;
      s.people.find(p => p.relation === '아버지')!.alive = false;
      apply5(s, { type: 'step' });
      const title = scene(s).title;
      apply5(s, { type: 'answer', index: 2 });
      const lost = s.flags.includes('homeCrisis:loss');
      outcomes.add(lost);
      expect(mother.alive).toBe(!lost);
      if (lost) {
        expect(mother.missing).toBeFalsy();
        expect(s.timeline.at(-1)?.text).toContain(mother.name);
        expect(s.childhoodMemory).toMatchObject({ outcome: 'loss', personId: mother.id, town: s.hero.town });
        const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
        loaded.age = 12;
        loaded.hero.island = '자야';
        apply5(loaded, { type: 'step' });
        expect(loaded.pending).toMatchObject({ turning: 'child_memory_loss' });
        expect(scene(loaded).body).toContain(title);
        expect(scene(loaded).body).toContain(mother.name);
        expect(scene(loaded).body).toContain('어머니');
        expect(scene(loaded).body).toContain(s.hero.town);
      } else {
        expect(s.childhoodMemory).toMatchObject({ outcome: 'parentSafe', personId: mother.id });
      }
    }
    expect([...outcomes].sort()).toEqual([false, true]);
  });

  it('부모가 있는 아이도 마을 의원에게 배우고, 다친 스승의 심부름을 훗날 다시 써먹는다', () => {
    const s = newLife5(9, { home: 'loguetown', lineage: 'commoner' });
    playTo(s, 'child_clinic_apprentice');
    expect(s.age).toBe(7);
    apply5(s, { type: 'answer', index: 0 });
    const mentor = s.people.find(p => p.relation === '스승')!;
    const title = playTo(s, 'child_crisis_').title;
    apply5(s, { type: 'answer', index: 1 });
    apply5(s, { type: 'step' });
    apply5(s, { type: 'answer', index: 2 });
    expect(s.flags).toContain('homeCrisis:mentor');
    expect(mentor.alive).toBe(true);
    expect(s.timeline.at(-1)?.text).toContain(mentor.name);
    expect(s.childhoodMemory).toMatchObject({ outcome: 'mentor', personId: mentor.id });
    apply5(s, { type: 'step' });
    expect(scene(s).turning).toBe('child_mentor_recovery');
    expect(scene(s).body).toContain(mentor.name);
    apply5(s, { type: 'answer', index: 0 });
    const recalled = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    recalled.age = 12;
    recalled.people.find(p => p.id === mentor.id)!.alive = false;
    applyFx(recalled, [{ op: 'person', kind: 'ally', relation: '스승', name: '다른 스승' }]);
    apply5(recalled, { type: 'step' });
    expect(scene(recalled).turning).toBe('child_memory_mentor');
    expect(scene(recalled).body).toContain(mentor.name);
    expect(scene(recalled).body).toContain(title);
    expect(scene(recalled).body).toContain('약봉지');
    const before = { ...recalled.growth.mastery };
    apply5(recalled, { type: 'answer', index: 1 });
    expect(recalled.growth.mastery.sword).toBe(before.sword);
    expect(recalled.timeline.at(-1)?.text).toContain(mentor.name);
  });

  it('구버전에서 고른 사건은 기억 정보가 없어도 같은 제목과 당시 기록으로 이어진다', () => {
    const s = atHome(HOMETOWNS[0], 17);
    const story = CHILDHOOD_INCIDENTS.patchwork_show;
    s.age = 12;
    s.flags.push('homeCrisis', 'homeCrisis:loss');
    s.seen['child_crisis_' + story.id] = 8;
    const mother = s.people.find(p => p.relation === '어머니')!;
    mother.alive = false;
    s.timeline.push({ age: 8, text: s.hero.town + '의 ' + story.title + ' 때 어머니를 잃었다' });
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    apply5(loaded, { type: 'step' });
    expect(scene(loaded).body).toContain(mother.name);
    expect(scene(loaded).body).toContain(story.title);
    expect(scene(loaded).body).not.toContain('{');
    loaded.seen = {};
    loaded.timeline = [];
    expect(fillText(loaded, '{crisisPerson} / {crisisTitle}')).not.toContain('{');
  });

  it('구버전에서 이미 도움을 구한 사건은 현재 마을의 다섯 후보에 없어도 끝낼 수 있다', () => {
    const s = atHome(HOMETOWNS[0], 3);
    const story = CHILDHOOD_INCIDENTS.syrup_piano;
    const next = 'child_crisis_' + story.id + '_help';
    expect(INCIDENTS_BY_TOWN[s.hero.town]).not.toContain(story.id);
    s.flags.push('homeCrisis');
    s.queue.push(next);
    const loaded = normalizeLife5(JSON.parse(JSON.stringify(s)))!;
    apply5(loaded, { type: 'step' });
    expect(scene(loaded).turning).toBe(next);
    apply5(loaded, { type: 'answer', index: 0 });
    expect(loaded.timeline.at(-1)?.text).toContain(story.title);
  });

  it('고립된 고향에서도 실제 선택으로 맞수를 만들고 같은 섬에서 다시 만난다', () => {
    for (const home of ['sky', 'zou', 'fishman', 'wano'] as const) {
      const town = HOMETOWNS.find(t => t.home === home)!;
      const s = atHome(town, 23);
      s.age = 6;
      s.people = s.people.filter(p => p.relation === '어머니' || p.relation === '아버지');
      apply5(s, { type: 'step' });
      expect(s.pending).toMatchObject({ turning: 'kid_rival' });
      apply5(s, { type: 'answer', index: 1 });
      const child = s.people.find(p => p.relation === '어릴 적 맞수')!;
      s.age = 24;
      s.hero.standing = 'civil';
      apply5(s, { type: 'step' });
      expect(s.rival).toMatchObject({ personId: child.id });
      expect(s.pending).toMatchObject({ turning: 'life_rival_reunion', speaker: child.name });
    }
  });
});
