// 얼굴: 주인공 · 곁의 사람 · 상대를 픽셀 그림의 Who로 바꾼다.
import { crewGrade } from './words';
import { weaponOfSkills, weaponOfStyle, type Who } from '../pixel/pixelArt';
import type { Item } from '../../shared/core/types';
import { LIMBS } from '../../core/body';
import { CANON, canonAge } from '../../data/canon';
import { TURNING_BY_ID } from '../../data/turnings';
import { SIBLING_REUNION_ID } from '../../data/turnings/sibling-reunion';
import { equippedWeapon, weaponStyleFor } from '../../core/styles';
import { rivalPosition } from '../../core/rival';
import { livingContact } from '../../core/needs';
import { meetingSibling, siblingCareerLabel } from '../../core/siblings';
import type { EnemySpec, Life5, Pending5, Person, Standing } from '../../core/types';

export function personWho5(p: Person): Who {
  return { key: p.canon ?? p.id + p.name, gender: p.gender, age: p.age, species: p.species, faction: p.faction };
}

/** 인연 목록: 줄마다 사람의 id(목록 열쇠로 쓴다) */
/** crew: 함께 다니는 동료면 그 자리와 레벨 (예: '돌격 · Lv.3', 다쳤으면 '다쳐 쉬는 중') */
const CREW_ROLE_NAME: Record<string, string> = { vanguard: '돌격', support: '지원', medic: '의사', navigator: '항해사', cook: '요리사', shipwright: '목수' };

function personRelation(s: Life5, p: Person): string {
  const labels = [p.relation];
  const love = s.rivalLove?.personId === p.id ? s.rivalLove.status : null;
  if (love === 'married') labels.unshift('어릴 적 맞수');
  else if (love && love !== 'friends') labels.push('연인');
  if (p.missing) labels.push('행방불명');
  else if (s.rival?.personId === p.id && p.alive && !p.crew) labels.push(rivalPosition(s), `명성 ${s.rival.fame}`, s.rival.port || '행방 미상');
  return labels.join(' · ');
}

export function peopleView(s: Life5): { id: string; name: string; relation: string; gone: boolean; who: Who; crew: string | null; news?: string; card?: string }[] {
  return s.people.map((p) => {
    const career = siblingCareerLabel(p);
    const life = p.siblingLife;
    const relation = [personRelation(s, p), ...(career ? [career] : [])].join(' · ');
    const card = life?.vivreCard ? p.missing ? '비블카드 · 움직임이 희미함'
      : !p.alive ? '비블카드 · 타서 사라짐'
      : p.crew && !p.crew.separatedMonths ? '비블카드 · 함께 이동 중'
      : `비블카드 · ${life.island} 방향` : undefined;
    return { id: p.id, name: p.name, relation, gone: !p.alive, who: personWho5(p),
      crew: p.alive && p.crew ? `${p.tempUntil !== undefined ? `임시 동행(${Math.max(1, p.tempUntil - s.age)}해 남음) · ` : ''}${crewGrade(s, p)}급 · ${CREW_ROLE_NAME[p.crew.role] ?? '동료'} · Lv.${p.crew.level}${p.crew.role === 'medic' ? ` · 의료 ${p.crew.medicalSkill ?? 50}` : ''}${p.crew.injuredMonths > 0 ? ' · 다쳐 쉬는 중' : ''}` : null,
      ...(life?.latestNews ? { news: life.latestNews } : {}), ...(card ? { card } : {}) };
  });
}

function factionOf(st: Standing): NonNullable<Who['faction']> {
  switch (st) {
    case 'pirate': case 'warlord': case 'bountyHunter': return 'pirate';
    case 'marine': case 'cp': return 'marine';
    case 'revolution': return 'rev';
    default: return 'civil';
  }
}

export function itemSprite(item: Item | undefined) {
  return item ? weaponOfStyle(weaponStyleFor(item)) : 'fist';
}

export function heroWho5(s: Life5, weapon = itemSprite(equippedWeapon(s))): Who {
  const who: Who = { key: `hero:${s.rng.seed}`, gender: s.hero.gender, age: s.age, species: s.hero.species, faction: factionOf(s.hero.standing), weapon };
  const body: NonNullable<Who['body']> = {};
  for (const k of LIMBS) { const st = s.hero.limbs[k]; if (st !== 'ok') body[k] = st; }
  if (Object.keys(body).length) who.body = body;
  return who;
}

/** 떠 있는 문의 말하는 사람: 주인공, 원작 인물(원작의 성별 · 나이 차로 그린다), 곁의 사람(없으면 관계 이름) */
export function speakerOf(s: Life5, p: Extract<Pending5, { kind: 'door' }>): { name: string; who: Who } {
  if (p.turning === SIBLING_REUNION_ID) {
    const sibling = meetingSibling(s);
    if (sibling) return { name: sibling.name, who: personWho5(sibling) };
  }
  const sp = TURNING_BY_ID[p.turning]?.speaker;
  if (!sp) return { name: p.speaker, who: { key: p.speaker } };
  if (sp === 'hero') return { name: p.speaker, who: heroWho5(s) };
  if ('canon' in sp) {
    const c = CANON[sp.canon];
    if (!c) return { name: p.speaker, who: { key: sp.canon } };
    return { name: p.speaker, who: { key: sp.canon, gender: c.gender, age: canonAge(sp.canon, s.age), species: c.species ?? 'human', faction: c.faction } };
  }
  const person = p.discipleId ? s.people.find(x => x.id === p.discipleId) : livingContact(s, sp);
  return person ? { name: person.name, who: personWho5(person) } : { name: p.speaker, who: { key: p.speaker } };
}

export function foeWho(e: EnemySpec): Who {
  return {
    key: e.faceKey ?? e.canon ?? e.id + e.name, gender: e.gender, age: e.age, species: e.species,
    faction: e.faction, form: e.form, weapon: weaponOfSkills(e.skills),
  };
}
