// 얼굴: 주인공 · 곁의 사람 · 상대를 픽셀 그림의 Who로 바꾼다.
import { weaponOfSkills, type Weapon, type Who } from '../../../ui/pixel/pixelArt';
import { LIMBS } from '../../core/body';
import { TURNING_BY_ID } from '../../data/turnings';
import type { EnemySpec, Life5, Pending5, Person, Standing } from '../../core/types';

export function personWho5(p: Person): Who {
  return { key: p.canon ?? p.id + p.name, gender: p.gender, age: p.age, species: p.species, faction: p.faction };
}

/** 인연 목록: 줄마다 사람의 id(목록 열쇠로 쓴다) */
export function peopleView(s: Life5): { id: string; name: string; relation: string; gone: boolean; who: Who }[] {
  return s.people.map((p) => ({ id: p.id, name: p.name, relation: p.relation, gone: !p.alive, who: personWho5(p) }));
}

function factionOf(st: Standing): NonNullable<Who['faction']> {
  switch (st) {
    case 'pirate': case 'warlord': case 'bountyHunter': return 'pirate';
    case 'marine': case 'cp': return 'marine';
    case 'revolution': return 'rev';
    default: return 'civil';
  }
}

/** 단계가 가장 높은 무술 갈래의 무기 (모두 0이면 맨주먹) */
function heroWeapon(s: Life5): Weapon {
  const t = s.growth.tier;
  if (t.sword > 0 && t.sword >= t.gun && t.sword >= t.fist) return 'sword';
  if (t.gun > 0 && t.gun >= t.fist) return 'gun';
  return 'fist';
}

export function heroWho5(s: Life5): Who {
  const who: Who = { key: `hero:${s.rng.seed}`, gender: s.hero.gender, age: s.age, species: s.hero.species, faction: factionOf(s.hero.standing), weapon: heroWeapon(s) };
  const body: NonNullable<Who['body']> = {};
  for (const k of LIMBS) { const st = s.hero.limbs[k]; if (st !== 'ok') body[k] = st; }
  if (Object.keys(body).length) who.body = body;
  return who;
}

/** 떠 있는 문의 말하는 사람: 주인공, 원작 인물, 곁의 사람(없으면 관계 이름) */
export function speakerOf(s: Life5, p: Extract<Pending5, { kind: 'door' }>): { name: string; who: Who } {
  const sp = TURNING_BY_ID[p.turning]?.speaker;
  if (!sp) return { name: p.speaker, who: { key: p.speaker } };
  if (sp === 'hero') return { name: p.speaker, who: heroWho5(s) };
  if ('canon' in sp) return { name: p.speaker, who: { key: sp.canon } };
  const person = s.people.find((x) => x.alive && x.relation === sp.relation);
  return person ? { name: person.name, who: personWho5(person) } : { name: p.speaker, who: { key: p.speaker } };
}

export function foeWho(e: EnemySpec): Who {
  return {
    key: e.faceKey ?? e.canon ?? e.id + e.name, gender: e.gender, age: e.age, species: e.species,
    faction: e.faction, form: e.form, weapon: weaponOfSkills(e.skills),
  };
}
