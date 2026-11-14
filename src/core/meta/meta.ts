// 인생 밖의 기록: 도감, 명예의 전당, 결산.
import { BOSS_BY_ID } from '../../data/bosses';
import { FRUIT_BY_ID } from '../../data/fruits';
import { rankName } from '../effects';
import { getSkill } from '../growth/skillbook';
import type { HallEntry, LifeState, MetaState } from '../types';

/** 상태에 쌓인 metaEvents를 도감에 옮긴다. 새 MetaState를 돌려준다 */
export function absorbMeta(meta: MetaState, s: LifeState): MetaState {
  if (!s.metaEvents.length) return meta;
  const m: MetaState = structuredClone(meta);
  for (const e of s.metaEvents) {
    if (e.k === 'fruit') {
      const c = (m.fruitCodex[e.id] ??= { eaten: 0, bestTier: 0 });
      c.eaten += 1; c.bestTier = Math.max(c.bestTier, e.grade);
    } else if (e.k === 'met') {
      const c = (m.peopleCodex[e.id] ??= { met: 0, taughtBy: false, defeated: false, where: e.where });
      c.met += 1; if (e.taught) c.taughtBy = true; c.where = e.where;
    } else if (e.k === 'defeated') {
      const c = (m.peopleCodex[e.id] ??= { met: 0, taughtBy: false, defeated: false, where: e.where });
      c.defeated = true; c.met += 1; c.where = e.where;
    } else if (e.k === 'skill') {
      if (!m.skillCodex.includes(e.id)) m.skillCodex.push(e.id);
    }
  }
  return m;
}

export function hallEntry(s: LifeState, endedAt: string): HallEntry {
  const top = Object.entries(s.growth.skills).sort((a, b) => b[1].mastery - a[1].mastery).slice(0, 3).map(([id]) => id);
  return {
    name: `${s.hero.surname} ${s.hero.name}`, route: s.hero.route, ageAtEnd: s.hero.age,
    cause: s.ended?.cause ?? '알 수 없음', stage: s.stats.maxStage, fame: Math.round(s.hero.fame),
    fruit: s.hero.fruit?.id ?? null, topSkills: top, endedAt,
  };
}

export function recordEnding(meta: MetaState, s: LifeState, endedAt: string): MetaState {
  const m = absorbMeta(meta, s);
  m.hall = [hallEntry(s, endedAt), ...m.hall].slice(0, 50);
  m.lives += 1;
  return m;
}

/** 결산 화면용 요약 */
export function summary(s: LifeState) {
  const fruit = s.hero.fruit ? FRUIT_BY_ID[s.hero.fruit.id] : null;
  return {
    title: rankName(s),
    fruit: fruit?.name ?? null,
    bosses: s.world.defeated.map((id) => BOSS_BY_ID[id]?.name ?? id),
    skills: Object.entries(s.growth.skills).sort((a, b) => b[1].mastery - a[1].mastery).slice(0, 5)
      .map(([id, k]) => ({ name: getSkill(id)?.name ?? id, mastery: Math.round(k.mastery) })),
  };
}
