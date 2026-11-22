import type { CrewRole, SiblingCareer } from '../shared/core/types';
import { josa } from '../shared/core/josa';
import { crewPowerFor } from '../shared/core/people';
import { hashString, rngOf } from '../shared/core/rng';
import { SEA_BY_ID, SEAS } from '../shared/data/seas';
import { HOMES } from '../data/homes';
import { V } from '../data/balance';
import { SIBLING_REUNION } from '../data/turnings/sibling-reunion';
import { logLine } from './log';
import { personIs } from './needs';
import type { Life5, Person, SiblingReunionAction } from './types';

const ADULT = 18;
const RETIRE = 62;
const NAVY_LETTER = '임관 소식을 보낸 형제';

const CAREERS: Record<SiblingCareer, { label: string; role: CrewRole; ports: readonly string[]; visit: string; news: readonly string[] }> = {
  merchant: {
    label: '상인', role: 'navigator', visit: '짐을 내려놓고 거래처가 문을 열기를 기다리고 있었다',
    ports: ['시럽 마을', '로그타운', '위스키 피크', '알라바스타 왕국', '샤본디 제도', '드레스로자', '엘바프'],
    news: ['새 거래처에서 물건을 맡아 달라는 부탁을 받았다', '장부를 다시 써서 적자였던 항로를 살렸다', '장터에서 고향 물건을 알아보는 사람을 만났다'],
  },
  medic: {
    label: '의사', role: 'medic', visit: '왕진 가방을 들고 환자의 집에서 돌아오는 길이었다',
    ports: ['후샤 마을', '로그타운', '드럼 왕국', '알라바스타 왕국', '샤본디 제도', '드레스로자', '에그헤드'],
    news: ['진료소가 없는 마을을 돌며 환자를 살폈다', '열병이 돌던 동네가 안정을 되찾았다', '다른 섬의 의사와 진료 기록을 나눴다'],
  },
  shipwright: {
    label: '조선공', role: 'shipwright', visit: '수리를 마친 배를 물에 띄우고 작업 도구를 정리하고 있었다',
    ports: ['해상 레스토랑 발라티에', '로그타운', '리버스 마운틴', '워터 세븐', '샤본디 제도', '드레스로자', '에그헤드'],
    news: ['가라앉을 뻔한 배를 고쳐 다시 띄웠다', '견습에게 이음새를 맞추는 법을 가르쳤다', '먼바다에서 돌아온 배의 용골을 손봤다'],
  },
  marine: {
    label: '해군', role: 'support', visit: '순찰을 마치고 다음 배속 명령을 기다리고 있었다',
    ports: ['후샤 마을', '로그타운', '리틀 가든', '에니에스 로비', '샤본디 제도', '펑크 해저드', '에그헤드'],
    news: ['조난당한 배를 발견해 선원들을 구조했다', '순찰대에 새로 들어온 사람들을 가르쳤다', '임무를 마치고 다음 근무지로 옮겼다'],
  },
};
const CAREER_IDS: readonly SiblingCareer[] = ['merchant', 'medic', 'shipwright', 'marine'];
const PORT_STAGE = new Map(SEAS.flatMap((sea) => sea.ports.map((port) => [port, sea.stage] as const)));

export function isSiblingCareer(value: unknown): value is SiblingCareer {
  return CAREER_IDS.some((career) => career === value);
}

function siblingKey(s: Life5, p: Person): number {
  return hashString(`${s.rng.seed}:${p.id}`);
}

function firstCareer(s: Life5, key: number): SiblingCareer {
  const navyRecruitment = s.hero.home === 'loguetown' || s.hero.home === 'water7';
  return CAREER_IDS[key % (navyRecruitment ? CAREER_IDS.length : CAREER_IDS.length - 1)];
}

function nextIsland(s: Life5, p: Person, career: SiblingCareer, key: number): string {
  if (p.age === ADULT || p.age >= RETIRE) return s.hero.town;
  const years = p.age - ADULT;
  const reach = SEA_BY_ID[HOMES[s.hero.home].sea].stage + Math.floor(years / 8);
  const ports = CAREERS[career].ports.filter((port) => (PORT_STAGE.get(port) ?? Infinity) <= reach);
  return ports[(key + Math.floor(years / 2)) % ports.length] ?? s.hero.town;
}

export function siblingCareerLabel(p: Person): string | undefined {
  const career = p.siblingLife?.career;
  if (!career) return;
  return p.age >= RETIRE ? `은퇴한 ${CAREERS[career].label}` : CAREERS[career].label;
}

/** 각자 진로에 맞춰 이동하고, 주인공이 읽은 최신 소식은 인연 목록에 남긴다. */
export function siblingYear(s: Life5): void {
  for (const p of s.people) {
    if (!p.alive || p.canon || !personIs(p, 'sibling') || p.age < ADULT) continue;
    if (p.crew) {
      if (p.siblingLife && !s.passage && !p.crew.separatedMonths) p.siblingLife.island = s.hero.island;
      continue;
    }
    const key = siblingKey(s, p);
    const previous = p.siblingLife;
    const career = p.aliases?.includes(NAVY_LETTER) ? 'marine' : previous?.career ?? firstCareer(s, key);
    const life = p.siblingLife ??= { career, island: nextIsland(s, p, career, key), nextNewsAt: s.age, latestNews: '' };
    const enteredCareer = !previous || life.career !== career;
    const returningHome = p.age >= RETIRE && (p.age === RETIRE || life.island !== s.hero.town);
    life.career = career;
    if (career === 'marine') p.faction = 'marine';
    if (enteredCareer || (p.age - ADULT) % 2 === 0 || returningHome) life.island = nextIsland(s, p, career, key);
    if (!enteredCareer && !returningHome && s.age < life.nextNewsAt) continue;

    const { label, news } = CAREERS[career];
    const update = returningHome ? '일을 내려놓고 고향으로 돌아갔다'
      : p.age > RETIRE ? '고향에서 인사를 전했다. 잘 지내고 있으니 언젠가 들러 달라고 했다'
      : enteredCareer ? `${life.island}에서 ${label}(으)로 일하기 시작했다`
      : `${life.island}에서 ${news[(key + p.age) % news.length]}`;
    life.latestNews = josa(update + '.');
    life.nextNewsAt = s.age + 3 + (key + p.age) % 3;
    if (enteredCareer || returningHome) s.timeline.push({ age: s.age, text: josa(`${p.name}이(가) ${update}`) });
    logLine(s, `${p.relation} ${p.name}의 소식이 왔다. ${life.latestNews}`, 'heavy', 'life');
  }
}

function canMeetAtCurrentPort(s: Life5): boolean {
  return s.hero.alive && !s.passage && s.age >= V.voyage.minAge && s.hero.standing !== 'prisoner' &&
    s.hero.island !== s.hero.town;
}

function isAtMeetingPort(s: Life5, p: Person): boolean {
  return p.alive && !p.crew && personIs(p, 'sibling') && p.siblingLife?.island === s.hero.island;
}

export function findSiblingReunion(s: Life5): Person | undefined {
  if ((s.seenCount[SIBLING_REUNION.id] ?? 0) >= (SIBLING_REUNION.max ?? V.turning.maxRepeat)) return;
  if (!canMeetAtCurrentPort(s)) return;
  return s.people.find((p) => {
    const life = p.siblingLife;
    if (!life || !isAtMeetingPort(s, p) || (life.metAt !== undefined && s.age - life.metAt < 4)) return false;
    const roll = rngOf({ seed: siblingKey(s, p), cursor: s.age * V.partsPerYear + s.part })();
    return roll < (life.vivreCard ? 0.65 : 0.26);
  });
}

export function meetingSibling(s: Life5): Person | undefined {
  if (s.siblingMeeting === undefined || !canMeetAtCurrentPort(s)) return;
  return s.people.find((p) => p.id === s.siblingMeeting && isAtMeetingPort(s, p));
}

export function siblingReunionAllowed(s: Life5, action?: 'share' | 'join'): boolean {
  const p = meetingSibling(s);
  if (!p?.siblingLife) return false;
  if (action === 'share') return !p.siblingLife.vivreCard;
  return action !== 'join' || p.siblingLife.career !== 'marine' || !['pirate', 'revolution'].includes(s.hero.standing);
}

export function siblingReunionWords(s: Life5): Record<string, string> {
  const p = meetingSibling(s);
  return p?.siblingLife ? { siblingMeetingName: p.name, siblingVisit: CAREERS[p.siblingLife.career].visit } : {};
}

export function resolveSiblingReunion(s: Life5, action: SiblingReunionAction): void {
  const p = meetingSibling(s);
  const life = p?.siblingLife;
  delete s.siblingMeeting;
  if (!p || !life) return;
  life.metAt = s.age;
  if (action !== 'part' && !life.vivreCard) {
    life.vivreCard = true;
    logLine(s, `${p.name}와(과) 서로의 비블카드를 찢어 한 조각씩 챙겼다. 종잇조각이 ${p.name} 쪽으로 조금씩 움직였다.`, 'heavy', 'choice');
  }
  if (action === 'join') {
    const { level } = V.person.crew;
    const { role } = CAREERS[life.career];
    p.kind = 'crew';
    p.tempUntil = s.age + 1;
    p.crew = { role, level, power: crewPowerFor(SEA_BY_ID[s.hero.sea].stage, level), skills: [], injuredMonths: 0,
      ...(role === 'medic' ? { medicalSkill: 50 } : {}) };
    logLine(s, `${p.name}이(가) 다음 해까지 함께 가겠다고 했다. 다음 출발 때 쓸 짐을 나란히 꾸렸다.`, 'heavy', 'choice');
  } else {
    logLine(s, `${p.name}와(과) 서로 어떻게 지냈는지 이야기했다. 다음에 길이 겹치면 또 보자고 인사했다.`, 'heavy', 'choice');
  }
}
