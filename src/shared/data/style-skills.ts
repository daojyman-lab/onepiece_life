import { COMBAT_STYLES, STYLE_BRANCH_ID } from '../../data/combat-styles';
import type { Skill } from '../core/types';

// 도검·창·타격·사격의 동작을 섞지 않는다. 유파마다 여섯 경지의 기술을 둔다.
export const STYLE_SKILLS: Skill[] = COMBAT_STYLES.flatMap((s) => s.moves.map((name, i): Skill => ({
  id: `style:${s.id}:${i + 1}`, name, branch: STYLE_BRANCH_ID[s.branch], tier: (i + 1) as Skill['tier'],
  kind: 'attack', stat: s.stat, power: [1.3, 1.8, 2.4, 3.1, 3.7, 4.3][i],
  cost: [6, 12, 20, 30, 40, 50][i], cooldown: i === 0 ? 0 : Math.min(5, i + 1),
  when: i === 5 ? 'enemyHpBelow30' : 'always', tags: i >= 2 ? s.tags : [], requires: {},
  text: `${s.name}의 수련으로 익힌 동작.`,
})));
