import { hashString } from '../../core/rng';
import { portOf } from '../data/navigation';
import { fillText } from './fx';
import { logLine } from './log';
import { needOk } from './needs';
import { rivalPerson } from './rival';
import type { Life5, Person } from './types';

const THRESHOLD = { dating: 46, steady: 60, married: 76, anniversary: 88 };

function hasOtherPartner(s: Life5): boolean {
  return ['sweetheart', 'waitingLove', 'married'].some(flag => s.flags.includes(flag)) || needOk(s, 'spouse');
}

export function single(s: Life5): boolean {
  const love = s.rivalLove;
  const dating = love && love.status !== 'friends' && s.people.some(p => p.id === love.personId && p.alive);
  return !dating && !hasOtherPartner(s);
}

/** 사건 기여분은 저장에 이미 남는 선택과 결과에서 구한다. 같은 기록을 두 번 더하지 않는다. */
function historyPoints(s: Life5, rival: Person): number {
  let points = 5 + hashString(`${s.rng.seed}/${rival.id}/affinity`) % 14;
  if (s.tried.includes('kid_rival#0')) points += 2;
  if (s.tried.includes('kid_rival#1')) points += 7;
  if (s.tried.includes('bond_rival_errand#0')) points += 7;
  if (s.tried.includes('bond_rival_errand#1')) points += 5;
  if (s.tried.includes('bond_rival_errand#2')) points -= 9;
  if (s.tried.includes('bond_rival_ledger#0')) points += 7;
  if (s.tried.includes('bond_rival_ledger#1')) points += 5;
  if (s.flags.includes('homeCrisis:rival')) points += 15;
  if (s.flags.includes('homeCrisis:copy')) points += 4;
  if (s.flags.includes('homeCrisis:delivered')) points += 7;
  if (s.tried.some(key => key.startsWith('rival_letter_') && /#[01]$/.test(key))) points += 6;
  if (s.tried.includes('life_rival_reunion#0')) points += 5;
  if (s.tried.includes('life_rival_reunion#1')) points += 8;
  if (rival.crew) points += 10;
  return points;
}

function firstDate(s: Life5): string {
  if (s.flags.includes('homeCrisis:rival')) return '만두를 빚던 {rival}이(가) 밀가루 위에 {crisisLandmark} 그림을 그렸다. {name}은(는) {crisisTown}에서 단둘이 뛰어나갔던 날을 금세 알아봤다. 누구 다리가 더 떨렸는지 따지는 사이 만두피가 다 말랐다. 둘은 다음번 저녁도 함께 만들기로 했다.';
  if (s.tried.includes('kid_rival#1')) return '어릴 때 달리기로 겨루던 두 사람은 이번엔 누가 만두 열 개를 먼저 빚는지 내기를 했다. 급히 빚은 것부터 옆구리가 터졌다. {rival}이(가) 터진 만두를 제 접시로 가져가자 {name}은(는) 다음번엔 만두소를 맡기로 했다.';
  return '만두피를 밀던 {rival}의 콧등에 밀가루가 묻었다. {name}은(는) 어릴 때 둘이 처음 겨뤘던 날을 떠올리며 젖은 수건을 건넸다. 저녁을 다 먹고도 둘은 빈 접시를 사이에 두고 한참 더 앉아 있었다.';
}

/** 관계의 변화는 기록으로만 알린다. 한 해에 함께 머문 시간은 한 번만 세며, 실제로 만난 자리에서 진전한다. */
export function advanceRivalAffection(s: Life5): void {
  if (!s.hero.alive || (!s.flags.includes('kidRival') && !s.rival && !s.rivalLove)) return;
  const p = rivalPerson(s);
  if (!p?.alive || p.missing || s.hero.gender === p.gender) return;
  const love = s.rivalLove;
  if (love && love.personId !== p.id) return;
  const memories = historyPoints(s, p);
  if (s.rivalAffinity?.personId !== p.id) {
    const floor = love?.status === 'married' ? THRESHOLD.married : love?.status === 'dating' ? THRESHOLD.dating :
      love?.status === 'steady' ? THRESHOLD.steady : 0;
    s.rivalAffinity = { personId: p.id, timePoints: Math.max(0, floor - memories), lastSharedAge: -1 };
  }
  const shared = s.rivalAffinity;
  const adult = s.age >= 18 && p.age >= 18;
  const inHometown = s.hero.standing === 'child' && s.hero.island === s.hero.town && !s.flags.includes('left_home_young');
  const metAgain = !!love || s.tried.some(key => key.startsWith('life_rival_reunion#'));
  const inPerson = s.hero.standing !== 'prisoner' && (p.crew !== undefined ||
    (metAgain && !!s.rival?.port && s.rival.port === portOf(s.hero.island)));
  const annual = !adult && inHometown ? 2 : adult && inPerson ? (p.crew ? 5 : 3) : 0;
  if (annual && shared.lastSharedAge < s.age) {
    shared.timePoints = Math.min(100, shared.timePoints + annual);
    shared.lastSharedAge = s.age;
  }
  if (!adult || !inPerson) return;
  const score = Math.min(100, memories + shared.timePoints);
  if (love?.status === 'married') {
    if (p.relation === '배우자' && s.age >= love.since + 10 && score >= THRESHOLD.anniversary && !s.flags.includes('rival:anniversary')) {
      s.flags.push('rival:anniversary');
      const text = fillText(s, '혼인한 지 열 해가 지나 {rival}과(와) 오래된 편지 묶음을 풀었다. {name}이(가) 뒷면에 두 이름을 써 넣던 흉내를 내자 {rival}이(가) 손을 겹쳐 쥐었다. 이번에는 봉투 안에 오늘 날짜도 적어 넣었다.');
      logLine(s, text, 'heavy', 'life');
      s.timeline.push({ age: s.age, text });
    }
    return;
  }
  // 옛 저장에서 친구로 남거나 혼례 없이 살기로 한 선택도 지킨다.
  if (love?.status === 'friends' || love?.status === 'partners' || hasOtherPartner(s)) return;
  let status: 'dating' | 'steady' | 'married';
  let scene: string;
  if (!love && score >= THRESHOLD.dating) {
    status = 'dating';
    scene = '저녁을 먹고 일어선 {rival}이(가) {name}의 외투를 챙겼다. 늘 먼저 가려고 겨루던 길을 그날은 손을 잡고 천천히 걸었다. 그 뒤로 두 사람은 연인으로 지냈다.';
  } else if (love?.status === 'dating' && score >= THRESHOLD.steady && s.age >= love.since + 1) {
    status = 'steady';
    scene = firstDate(s);
  } else if (love?.status === 'steady' && score >= THRESHOLD.married && s.age >= love.since + 2) {
    status = 'married';
    p.relation = '배우자';
    s.flags.push('married');
    scene = '{name}과(와) {rival}이(가) 혼인했다. 둘이 처음 겨루던 날을 기억하는 사람들에게 손수 소식을 썼다. 봉투 뒷면에는 두 사람의 이름이 처음으로 나란히 들어갔다.';
  } else return;
  s.rivalLove = { personId: p.id, status, since: s.age };
  const text = fillText(s, scene);
  logLine(s, text, 'heavy', 'life');
  s.timeline.push({ age: s.age, text });
}
