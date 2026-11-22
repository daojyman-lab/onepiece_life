import { pick, rngOf } from '../shared/core/rng';
import { INCIDENTS_BY_TOWN } from '../data/childhood-incidents';
import { portOf } from '../data/navigation';
import { TURNING_BY_ID } from '../data/turnings';
import { CHILDHOOD_MEMORIES } from '../data/turnings/childhood-crises';
import { checkAll } from './cond';
import { fillText } from './fx';
import { logLine } from './log';
import { needsOk } from './needs';
import { rivalPerson, updateRival } from './rival';
import { advanceRivalAffection } from './rival-romance';
import { openTurning, repeatAllows } from './turning';
import type { Life5 } from './types';

/** 스스로 쉬는 철에도 맞수는 살아간다. 소식과 실제로 함께한 시간만 기록한다. */
export function advanceRestingRival(s: Life5): void {
  updateRival(s);
  advanceRivalAffection(s);
}

export function openChildhoodAndRival(s: Life5): boolean {
  if (!s.passage && openChildhoodStory(s)) return true;
  updateRival(s);
  if (!s.passage && openRivalErrand(s)) return true;
  advanceRivalAffection(s);
  if (s.passage) return false;
  const arrivalPort = portOf(s.hero.island);
  if (s.rival && s.age >= 20 && s.rival.port === arrivalPort) {
    const rival = rivalPerson(s), reunion = TURNING_BY_ID.life_rival_reunion;
    if (rival?.alive && !rival.crew && repeatAllows(s, reunion) && checkAll(s, reunion.when) && openTurning(s, reunion)) {
      if (s.flags.includes('homeCrisis:copy') && !s.flags.includes('homeCrisis:delivered')) {
        logLine(s, fillText(s, '고향에서 베껴 둔 기록을 {rival}에게 건넸다. {crisisLandmark} 그림 아래, {crisisTown}에서 함께 나섰던 두 사람의 이름이 나란히 적혀 있었다.'), 'heavy');
        s.flags.push('homeCrisis:delivered');
      }
      return true;
    }
  }
  return false;
}

function openRivalErrand(s: Life5): boolean {
  if (!s.flags.includes('kidRival')) return false;
  let id: string;
  if (s.age >= 10 && s.age <= 11 && s.hero.island === s.hero.town && !s.flags.includes('left_home_young')) {
    id = 'bond_rival_errand';
  } else if (s.age >= 24 && s.age <= 34 && s.seenCount.bond_rival_errand && s.rival?.port &&
    !rivalPerson(s)?.crew && (['loguetown', 'water7'].includes(s.hero.home) || portOf(s.hero.island) === s.rival.port)) {
    id = 'bond_rival_ledger';
  } else return false;
  const t = TURNING_BY_ID[id];
  return repeatAllows(s, t) && checkAll(s, t.when) && openTurning(s, t);
}

/** 고향 위기는 일반 사건 추첨에 묻히지 않게 연다. 그 전에 인연을 만날 기회가 한 번 있다. */
function openChildhoodStory(s: Life5): boolean {
  if (s.age >= 12 && s.age <= 15 && s.flags.includes('homeCrisis')) {
    const memory = CHILDHOOD_MEMORIES.find(t => repeatAllows(s, t) && checkAll(s, t.when));
    if (memory) return openTurning(s, memory);
  }
  if (s.age < 6 || s.age > 9 || s.hero.standing !== 'child' || s.hero.island !== s.hero.town || s.flags.includes('left_home_young')) return false;
  if (s.age < 8) {
    const familyAtHome = needsOk(s, ['parent']) || s.flags.includes('grandGuard');
    const t = TURNING_BY_ID[s.age === 6 ? 'kid_rival' : familyAtHome ? 'child_clinic_apprentice' : 'men_meet'];
    return repeatAllows(s, t) && checkAll(s, t.when) && openTurning(s, t);
  }
  const options = INCIDENTS_BY_TOWN[s.hero.town];
  if (!options || s.flags.includes('homeCrisis')) return false;
  return openTurning(s, TURNING_BY_ID['child_crisis_' + pick(rngOf(s.rng), options)]);
}
