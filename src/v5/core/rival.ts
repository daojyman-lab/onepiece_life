import { hashString } from '../../core/rng';
import { josa } from '../../core/josa';
import { portOf } from '../data/navigation';
import { EXTRA_CAREERS, type ExtraCareerId } from '../data/rival-careers';
import { alternateWorkFlag, workLetter, workLetterId } from '../data/rival-letters';
import type { CrewRole } from '../../core/types';
import { logLine } from './log';
import type { HomeId, Life5, Person, RivalCareer } from './types';

type Rival = NonNullable<Life5['rival']>;
const EXTRA_IDS = Object.keys(EXTRA_CAREERS) as ExtraCareerId[];
const isExtraCareer = (career: RivalCareer): career is ExtraCareerId => Object.hasOwn(EXTRA_CAREERS, career);

function careersFor(home: HomeId): RivalCareer[] {
  const local = EXTRA_IDS.filter(id => (EXTRA_CAREERS[id].homes as readonly HomeId[]).includes(home));
  return home === 'loguetown' || home === 'water7' ? ['captain', 'fifth', 'marine', ...local] : ['warden', ...local];
}

export function rivalCrewRole(s: Life5): CrewRole {
  const career = s.rival?.career;
  return career && isExtraCareer(career) ? EXTRA_CAREERS[career].role : 'vanguard';
}

export function rivalCombatSkills(s: Life5): string[] | undefined {
  switch (s.rival?.career) {
    case 'wanderingBlade': case 'buggyMercenary': return ['sword_cut', 'sword_draw', 'sword_parry', 'sword_flash'];
    case 'sumoWrestler': return ['fist_jab', 'fist_guard', 'fist_counter', 'fist_quake'];
  }
}

function alternateWork(s: Life5, r: Rival) {
  return (r.stage === 3 || r.stage === 4) && s.flags.includes(alternateWorkFlag(r.career)) ? workLetter(r.career) : undefined;
}
// 선장이 열일곱, 열아홉, 스물넷, 서른다섯 살이 될 때 항구에 들리는 이야기.
const CAPTAIN_REPORTS: Record<string, string[]> = {
  '쪽빛제비 해적단': [
    '폭풍에 흩어진 우편선의 선원들을 찾아 고향으로 돌려보냈다. 마지막에 건네준 것은 물에 번진 편지 한 통이었다.',
    '암초에 걸린 우편선을 끌어내고 배달까지 마쳤다. 봉투마다 우체국 소인 옆에 작은 제비 발자국이 찍혀 있었다.',
    '두 번째 배를 띄웠다. 이번에는 편지 부칠 돈이 없는 섬사람들도 빈 과자 통에 편지를 넣어 부두에 매단다.',
    '첫 항해 때 되찾아 준 편지의 수신인이 자라서 새 배의 키를 잡았다. 선장은 그에게 첫 우편 자루를 직접 건넸다.',
  ],
  '세매듭 해적단': [
    '선원들 임금을 떼먹고 달아난 선주의 금고를 털었다. 선착장 기둥에 세 번 매듭지은 밧줄과 밀린 임금 봉투가 걸렸다.',
    '같은 매듭이 이번엔 빈 금고에서 발견됐다. 선주는 돈을 전부 빼앗겼다고 했는데, 장부에 적힌 선원 몫만 정확히 비어 있었다.',
    '해적단을 잡으러 들어온 경비선이 빈 부두를 돌았다. 품삯을 돌려받은 짐꾼들이 그날만은 하나같이 배 이름을 잊었다고 했다.',
    '처음 턴 금고의 낡은 장부를 항구에 돌려줬다. 밀린 돈을 받은 사람들 이름 옆에 서툰 글씨로 영수 표시가 가득했다.',
  ],
  '노란등 해적단': [
    '침몰선의 보물을 끌어올렸다는 소문이 돌았다. 갑판에 실린 것은 금화 대신 오래전 물에 잠긴 마을의 종이었다.',
    '밤새 밝힌 노란 등불 아래서 종이 다시 울렸다. 소리를 알아들은 옛 주민들이 배를 빌려 하나둘 찾아왔다.',
    '침몰선에서 건진 물건으로 갑판에 장터를 열었다. 물건의 원래 쓰임을 맞힌 사람에게는 값을 받지 않는 날이었다.',
    '수십 년 만에 주인을 찾은 물건들을 그림으로 엮었다. 항구 서점에는 보물지도인 줄 알고 책을 산 손님들의 항의가 붙었다.',
  ],
  '톱니조개 해적단': [
    '상선에서 비단 열두 필을 빼앗고 배 옆면에 조개 껍데기를 박아 놓았다. 비단값이 오르자 옷감 상인들이 먼저 그 배 이름을 외웠다.',
    '빼앗은 비단을 돛으로 달고 나타났다. 부두에서는 값비싼 자줏빛 돛이 보이면 거래를 일찍 접고 창고 문을 잠근다.',
    '나포한 두 번째 배에도 자줏빛 돛을 달았다. 같은 시각 서로 다른 항구에서 목격담이 들어와 신문사가 정정 기사를 냈다.',
    '낡은 첫 돛을 경매에 내놓았다. 예전에 비단을 빼앗긴 상인이 낙찰받고는 그 자리에서 외상 장부와 값을 맞춰 보였다.',
  ],
};
const CREWS = Object.keys(CAPTAIN_REPORTS);
const MILESTONES = [16, 17, 19, 24, 35, 50];
const FAME = [12, 35, 80, 210, 420, 420];
const POWER = [135, 190, 270, 420, 550, 350];
// 같은 직업의 맞수도 타고난 힘이 다르다. 새 진로는 생업에서 얼마나 자주 싸우는지도 성장에 반영한다.
const ROLE_POWER: Record<CrewRole, number> = { vanguard: 1.05, support: 0.85, navigator: 0.78, shipwright: 0.85, cook: 0.76, medic: 0.72 };
// statsAround의 기본 능력치 합계에 쓰는 계수.
export const RIVAL_STAT_TOTAL = 5.1;

export function rivalPerson(s: Life5): Person | undefined {
  if (s.rival) return s.people.find(p => p.id === s.rival!.personId);
  if (s.rivalLove) return s.people.find(p => p.id === s.rivalLove!.personId);
  // 옛 저장은 영입한 맞수를 별도 인물로 보관했다. 이미 함께 타고 있으면 바깥 소식을 만들지 않는다.
  return s.people.find(p => p.relation === '함께하게 된 어릴 적 맞수' && p.crew)
    ?? s.people.find(p => p.relation === '어릴 적 맞수');
}

export function rivalPosition(s: Life5): string {
  const r = s.rival;
  if (!r) return '어릴 적 맞수';
  if (r.stage === 5) return '고향으로 돌아온 맞수';
  const alternate = alternateWork(s, r);
  if (alternate) return alternate.post;
  switch (r.career) {
    case 'captain': return r.crewName + ' 선장';
    case 'fifth':
      if (r.stage === 0) return '흰수염 해적단 5번대 대원';
      if (r.stage === 1) return '연락 두절 · 마지막 소속은 흰수염 해적단 5번대';
      return '전 흰수염 해적단 5번대 대원 · 구조선 항해사';
    case 'marine': return r.stage >= 3 ? '해군 구조정 정장' : '해군 구조정 수병';
    case 'warden': return r.stage >= 3 ? '고향 수색대장' : '고향 수색대 길잡이';
    default: return EXTRA_CAREERS[r.career].titles[r.stage >= 3 ? 1 : 0];
  }
}

function station(s: Life5, r: Rival): string {
  const home = portOf(s.hero.town);
  if (r.stage === 5 || r.career === 'warden') return home;
  if (isExtraCareer(r.career)) {
    const port = alternateWork(s, r)?.port ?? EXTRA_CAREERS[r.career].ports[r.stage];
    return port === 'home' ? home : portOf(port);
  }
  if (r.career === 'fifth') return ['샤본디 제도', '', '샤본디 제도', '드럼 왕국', '워터 세븐'][r.stage];
  if (r.career === 'marine') return [home, s.hero.home === 'water7' ? '워터 세븐' : '셸스 타운', '로그타운', '샤본디 제도', '워터 세븐'][r.stage];
  return [home, s.hero.home === 'water7' ? home : '로그타운', s.hero.home === 'water7' ? '자야' : '쌍둥이 곶', '자야', '워터 세븐'][r.stage];
}

function news(s: Life5, r: Rival, p: Person): string {
  const name = p.name, crew = r.crewName;
  if (r.stage === 5) return `${name}이(가) 현역에서 물러나 ${s.hero.town}(으)로 돌아왔다. 어린 시절을 적은 편지 끝에 다시 만나고 싶다는 말이 남아 있었다.`;
  if (isExtraCareer(r.career)) {
    const report = alternateWork(s, r)?.reports[r.stage - 3] ?? EXTRA_CAREERS[r.career].reports[r.stage];
    return report.replaceAll('{rival}', () => name);
  }
  switch (r.career) {
    case 'captain': {
      if (r.stage === 0) return `${name}이(가) 첫 배에 깃발을 올렸다. 고향에 남긴 출항 명부에 ${crew} 선장으로 이름을 썼다.`;
      const reports = CAPTAIN_REPORTS[crew] ?? CAPTAIN_REPORTS[CREWS[0]];
      return `${crew} 선장 ${name}의 소식이 들어왔다. ${reports[r.stage - 1]}`;
    }
    case 'fifth': return [
      `${name}이(가) 꽃검 비스타가 이끄는 흰수염 해적단 5번대에 대원으로 들어갔다. 첫 임무로 보급품을 인계했다는 편지가 왔다.`,
      `흰수염 해적단의 움직임을 전하는 호외가 돌았다. 5번대의 ${name}에게 보낸 편지가 되돌아왔고 그날부터 연락이 끊겼다.`,
      `정상전쟁 뒤 처음으로 ${name}의 편지가 닿았다. 예전에 5번대에서 익힌 항해술로 지금은 민간 구조선에서 표류자를 찾는다고 한다.`,
      `구조선의 항해사 ${name}이(가) 겨울 바다에서 조난 신호를 찾아냈다. 섬 신문에는 예전 소속보다 구조한 배의 이름이 크게 실렸다.`,
      `${name}이(가) 그동안 기록한 조난 지점을 다른 구조선에도 건넸다. 이제 여러 배가 같은 지도로 실종자를 찾고 있다.`,
    ][r.stage];
    case 'marine': return [
      `${name}이(가) 해군에 입대했다. 처음 배정받은 일은 작은 구조정의 야간 당번이었다.`,
      `${name}의 구조정이 밤새 표류한 어선을 항구로 데려왔다. 구조정의 수병 명단에 낯익은 고향 이름이 실렸다.`,
      `${name}이(가) 바다에서 건져 낸 우편 자루를 맡아 젖은 편지의 주인을 하나씩 찾아 주었다.`,
      `${name}이(가) 해군 구조정 한 척을 맡게 됐다. 고향으로 보낸 임명 통지서에는 새 정장의 이름이 적혀 있었다.`,
      `안개에 갇힌 상선이 ${name}의 구조정을 따라 무사히 귀항했다. 선주들이 감사장을 모아 정장에게 보냈다.`,
    ][r.stage];
    case 'warden': return [
      `${name}이(가) 고향의 수색대에 들어갔다. 사라진 사람의 마지막 행선지를 집집마다 물어 적는 일을 맡았다.`,
      `${name}이(가) 길 잃은 아이를 찾아 데려왔다. 그 뒤로 사람들이 수색대에 먼저 이름을 대고 도움을 청한다.`,
      `${name}이(가) 자주 길을 잃는 갈림길에 표지를 달았다. 주민들은 밤중에도 수색대를 부를 길을 알게 됐다.`,
      `${name}이(가) 고향 수색대장을 맡았다. 실종 신고를 받으면 누구를 어느 길로 보낼지 정하는 자리다.`,
      `${name}이(가) 수색 기록을 바탕으로 젊은 길잡이들을 가르치기 시작했다. 그동안 찾은 이들이 차례로 수색대를 찾아왔다.`,
    ][r.stage];
  }
}

/** 기존 저장도 현재 나이의 소식부터 이어 간다. 같은 단계는 다시 보도하지 않는다. */
export function updateRival(s: Life5): void {
  if (s.age < 16 || (!s.rival && !s.flags.includes('kidRival'))) return;
  const p = rivalPerson(s);
  if (!p?.alive || p.crew) return;
  if (!s.rival) {
    const h = hashString(`${s.rng.seed}/${p.id}/rival`);
    const eligible = careersFor(s.hero.home);
    const career = eligible[h % eligible.length];
    s.rival = { personId: p.id, career, crewName: career === 'captain' ? CREWS[(h >>> 8) % CREWS.length] : '', stage: -1, port: '', fame: 0 };
  }
  const r = s.rival, stage = MILESTONES.filter(age => s.age >= age).length - 1;
  if (stage <= r.stage) return;
  r.stage = stage;
  r.port = station(s, r);
  r.fame = FAME[stage];
  const extra = isExtraCareer(r.career) ? EXTRA_CAREERS[r.career] : undefined;
  if (extra) {
    const talent = 0.9 + (hashString(`${s.rng.seed}/${p.id}/rival-strength`) % 21) / 100;
    p.power = Math.round(POWER[stage] * ROLE_POWER[extra.role] * talent);
  } else p.power = POWER[stage];
  if (stage === 5) p.faction = 'civil';
  else if (extra) p.faction = extra.faction;
  else if (r.career === 'marine') p.faction = 'marine';
  else if (r.career === 'captain' || (r.career === 'fifth' && stage < 2)) p.faction = 'pirate';
  else p.faction = 'civil';
  p.epithet = rivalPosition(s);
  const free = stage === 5 || (extra && stage >= extra.freeFrom) || r.career === 'captain' || (r.career === 'fifth' && stage >= 2);
  if (free && !s.flags.includes('rival:free')) s.flags.push('rival:free');
  const report = news(s, r, p);
  const where = r.port ? ` 소식이 온 곳은 ${r.port}(이)다.` : '';
  logLine(s, report + where, 'heavy', 'world');
  s.timeline.push({ age: s.age, text: josa(report) });
  if (stage === 2 && workLetter(r.career)) {
    const id = workLetterId(r.career);
    if (!s.queue.includes(id) && !s.seenCount[id]) s.queue.push(id);
  }
}
