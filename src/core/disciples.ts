import { COMBAT_STYLE_BY_ID, isCombatStyle, type CombatStyle } from '../data/combat-styles';
import { focusedStyle, isMartialBranch, styleTier } from './styles';
import { npcName } from './names';
import { pick, rngOf } from '../shared/core/rng';
import type { DiscipleRecord, DiscipleStage, Life5 } from './types';

const lessons: Record<CombatStyle, string> = {
  boxing: '주먹보다 먼저 발과 턱을 지키는 법', kicking: '차고 난 발을 거두며 중심을 되찾는 법',
  karate: '호흡과 정권의 힘을 한곳에 모으는 법', fishmanKarate: '물의 흐름을 느끼고 손바닥에 힘을 모으는 법',
  rokushiki: '발을 옮기기 전에 몸의 힘을 모으는 법', grappling: '상대의 중심을 읽고 다치지 않게 낙법하는 법',
  oneSword: '칼끝을 들기 전에 발을 놓는 법', twoSword: '두 칼 사이에 빈틈을 남기지 않는 법', threeSword: '세 칼의 무게를 한 호흡으로 받는 법', iai: '뽑기 전까지 칼집을 흔들지 않는 법',
  spear: '찌른 창을 거두며 거리를 지키는 법', naginata: '긴 자루를 돌릴 때 동료의 자리를 비워 두는 법', staff: '봉을 맞댄 채 상대의 힘을 흘리는 법',
  hammer: '해머의 무게에 몸이 끌려가지 않는 법', club: '몽둥이를 휘두른 뒤 빈틈을 거두는 법', pipe: '좁은 골목에서 파이프를 짧게 쓰는 법',
  pistol: '방아쇠보다 먼저 호흡과 조준을 가다듬는 법', rifle: '견착한 어깨와 조준선을 흔들지 않는 법', sniper: '바람을 읽고 쏘지 않을 순간을 고르는 법', slingshot: '새총의 탄도를 가늠하고 줄을 놓는 법', dial: '다이얼의 반동을 받아내는 법',
};

function currentStyle(s: Life5): CombatStyle | null {
  const branch = s.growth.path;
  const style = branch && isMartialBranch(branch) ? focusedStyle(s, branch) : s.growth.primaryStyle;
  return isCombatStyle(style) ? style : null;
}
export function teachingStyle(s: Life5): CombatStyle | null {
  const style = currentStyle(s);
  return style && styleTier(s, style) >= 2 ? style : null;
}
export function discipleFor(s: Life5, stage: DiscipleStage): DiscipleRecord | undefined {
  return s.disciples?.find(d => {
    if (!s.people.some(p => p.id === d.personId && p.alive) || d.outcome) return false;
    if (stage === 'training') return d.trainedAt === undefined && s.age - d.since >= 3;
    if (stage === 'sailing') return d.trainedAt !== undefined && d.sailedAt === undefined && s.age - d.trainedAt >= 2 && s.age >= (d.readyAt ?? 0);
    if (stage === 'reunion') return d.sailedAt !== undefined && s.age - d.sailedAt >= 8;
    return false;
  });
}
export const discipleReady = (s: Life5, stage: DiscipleStage): boolean => stage === 'meeting'
  ? teachingStyle(s) !== null : discipleFor(s, stage) !== undefined;

export function acceptDisciple(s: Life5): string | undefined {
  const style = teachingStyle(s); if (!style) return;
  const r = rngOf(s.rng), gender = pick(r, ['m', 'f'] as const);
  const used = new Set([s.hero.name, ...s.people.map(p => p.name)]);
  let name = npcName(s, r, gender);
  for (let i = 0; used.has(name) && i < 100; i++) name = npcName(s, r, gender);
  if (used.has(name)) { const base = name; let n = 2; while (used.has(name)) name = `${base} ${n++}세`; }
  const personId = `p${s.seq++}`;
  s.people.push({ id: personId, name, gender, age: 14, kind: 'ally', relation: `${COMBAT_STYLE_BY_ID[style].name} 문하의 제자`,
    aliases: ['무예를 가르친 제자'], canon: null, bond: 40, faction: 'civil', species: s.hero.species, alive: true });
  (s.disciples ??= []).push({personId, style, since:s.age, island:s.hero.island});
  return personId;
}

export function discipleWords(s: Life5, personId?: string): Record<string, string> {
  const d = s.disciples?.find(x => x.personId === personId);
  const style = d?.style ?? teachingStyle(s);
  const current = currentStyle(s);
  return {
    discipleName: s.people.find(p => p.id === personId)?.name ?? '아이',
    discipleStyle: style ? COMBAT_STYLE_BY_ID[style].name : '무예',
    discipleLesson: style ? lessons[style] : '기본 자세를 지키는 법',
    discipleSince: String(d?.since ?? s.age), discipleIsland: d?.island ?? s.hero.island,
    discipleYears: String(d ? s.age - d.since : 0), discipleSailedYears: String(d?.sailedAt !== undefined ? s.age - d.sailedAt : 0),
    discipleChange: d && current && current !== d.style ? `지금은 ${COMBAT_STYLE_BY_ID[current].name}의 길을 걷지만, 제자가 기억하는 것은 그때 배운 ${COMBAT_STYLE_BY_ID[d.style].name}이다.` : '',
  };
}
