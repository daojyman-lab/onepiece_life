// 한 철의 몸 회복. 선의의 의료 솜씨는 전투 레벨과 별개다.
import { V } from '../data/balance';
import { logLine } from './state';
import type { Life5 } from './types';

export function medicSkill(s: Life5): number {
  return Math.max(0, ...s.people.filter((p) => p.alive && p.kind === 'crew' && p.crew?.role === 'medic')
    .map((p) => Math.min(100, Math.max(0, p.crew!.medicalSkill ?? 50))));
}

export function recoverHealthPart(s: Life5, mode: 'usual' | 'rest' | 'chosenRest'): void {
  const skill = medicSkill(s);
  const rest = mode !== 'usual';
  const hp = V.hp.recovery + (mode === 'chosenRest' ? V.hp.chosenRest : rest ? V.growth.restHp : 0) + Math.round(skill / V.hp.medicPer);
  s.hero.hp = Math.min(V.hp.max, s.hero.hp + hp);
  const months = V.injury.monthsPerPart + (rest ? V.injury.restMonths : 0) + Math.floor(skill / 50) * V.injury.medicMonths;
  for (const wound of s.hero.injuries) {
    if (wound.severity === 'scar') continue;
    if (skill > 0 && !wound.treated) {
      wound.treated = true;
      logLine(s, '선의가 상처를 살피고 치료했다.', 'light', 'life');
    }
    wound.monthsLeft -= months;
  }
  s.hero.injuries = s.hero.injuries.filter((wound) => wound.severity === 'scar' || wound.monthsLeft > 0);
}
