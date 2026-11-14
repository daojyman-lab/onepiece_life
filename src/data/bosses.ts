// 해역 보스. 해적의 길이면 그 바다의 해군이나 악당이, 해군의 길이면 그 바다의 해적이 보스다.
import type { Boss, EnemySpec, Stats } from '../core/types';

/** 힘 p를 중심으로 치우침을 준 능력치 */
export function statsAround(p: number, bias: Partial<Stats> = {}): Stats {
  const b = { str: 1, spd: 1, vit: 1, int: 0.8, wil: 0.8, luk: 0.5, ...bias };
  return {
    str: Math.round(p * b.str), spd: Math.round(p * b.spd), vit: Math.round(p * b.vit),
    int: Math.round(p * b.int), wil: Math.round(p * b.wil), luk: Math.round(p * b.luk),
  };
}

type O = Partial<EnemySpec> & { id: string; name: string; p: number; bias?: Partial<Stats> };
function enemy(o: O): EnemySpec {
  return {
    canon: null, fruitClass: null, armament: 0, observation: 0, tactic: 'offense', officers: [],
    faction: 'pirate', species: 'human', gender: 'm', age: 35, skills: [],
    ...o,
    base: statsAround(o.p, o.bias),
  };
}
type BO = O & { sea: Boss['sea']; stage: Boss['stage']; route: Boss['route']; drops?: Boss['drops']; intro: string };
function boss(o: BO): Boss {
  return { ...enemy(o), sea: o.sea, stage: o.stage, route: o.route, drops: o.drops ?? [], intro: o.intro };
}

export const BOSSES: Boss[] = [
  // ---- 1단계
  boss({ id: 'b_morgan', name: '도끼손 모건', title: '해군 대령', canon: 'morgan', p: 26, bias: { str: 1.2, spd: 0.8 }, faction: 'marine', skills: ['fist_jab', 'fist_combo', 'fist_guard'], tactic: 'offense',
    officers: [enemy({ id: 'o_helmeppo', name: '헬메포', p: 14, faction: 'marine', age: 18, skills: ['sword_cut'] })],
    sea: ['east'], stage: 1, route: 'pirate', intro: '셸스 마을을 공포로 다스리는 해군 대령. 도끼 손이 번뜩인다.',
    drops: [{ op: 'money', add: 30000 }, { op: 'item', id: 'ar1', count: 1 }] }),
  boss({ id: 'b_arlong', name: '톱상어 아론', title: '아론 일당 선장', canon: 'arlong', p: 28, bias: { str: 1.3, vit: 1.2, int: 0.5 }, species: 'fishman', skills: ['fist_jab', 'fist_combo', 'fist_quake'], tactic: 'offense',
    officers: [enemy({ id: 'o_kuroobi', name: '쿠로오비', p: 18, species: 'fishman', skills: ['fist_jab', 'fist_guard'] }), enemy({ id: 'o_hachi', name: '하찌', p: 17, species: 'fishman', skills: ['sword_cut', 'sword_flash'] })],
    sea: ['east'], stage: 1, route: 'marine', intro: '코노미 제도를 지배하는 어인 해적. 인간을 깔본다.',
    drops: [{ op: 'money', add: 30000 }, { op: 'item', id: 'sw2', count: 1 }] }),
  boss({ id: 'b_pandas', name: '쇠사슬 판더스', title: '해군 지부 대령', p: 26, bias: { vit: 1.3 }, faction: 'marine', skills: ['fist_jab', 'fist_guard', 'fist_counter'], tactic: 'counter',
    sea: ['west'], stage: 1, route: 'pirate', intro: '해적을 쇠사슬로 묶어 끌고 다니는 지부 대령.', drops: [{ op: 'money', add: 30000 }] }),
  boss({ id: 'b_gambino', name: '총잡이 감비노', title: '마피아 해적단 두목', p: 27, bias: { spd: 1.2, int: 1 }, skills: ['gun_shot', 'gun_quick', 'gun_snipe'], tactic: 'offense',
    officers: [enemy({ id: 'o_gang', name: '행동대장 로코', p: 16, skills: ['gun_shot'] })],
    sea: ['west'], stage: 1, route: 'marine', intro: '항구를 손아귀에 쥔 마피아 해적.', drops: [{ op: 'money', add: 30000 }, { op: 'item', id: 'gu2', count: 1 }] }),
  boss({ id: 'b_baren', name: '얼음송곳 바렌', title: '해군 대령', p: 26, bias: { spd: 1.2 }, faction: 'marine', skills: ['sword_cut', 'sword_draw', 'sword_parry'], tactic: 'counter',
    sea: ['north'], stage: 1, route: 'pirate', intro: '북쪽 바다의 냉혹한 해군 대령.', drops: [{ op: 'money', add: 30000 }] }),
  boss({ id: 'b_drak', name: '검은 갈고리 드라크', title: '노예상 해적', p: 27, bias: { str: 1.2 }, skills: ['sword_cut', 'sword_flash', 'fist_guard'], tactic: 'offense',
    officers: [enemy({ id: 'o_hook', name: '갈고리 부하 지크', p: 15, skills: ['fist_jab'] })],
    sea: ['north'], stage: 1, route: 'marine', intro: '사람을 사고파는 북해의 악당.', drops: [{ op: 'money', add: 30000 }] }),
  boss({ id: 'b_elma', name: '모래폭풍 엘마', title: '해군 지부장', p: 26, gender: 'f', faction: 'marine', skills: ['gun_shot', 'gun_smoke', 'gun_snipe'], tactic: 'defense',
    sea: ['south'], stage: 1, route: 'pirate', intro: '남해 지부를 지키는 냉정한 여장부.', drops: [{ op: 'money', add: 30000 }] }),
  boss({ id: 'b_basil', name: '쇠뿔 바질', title: '해적 선장', p: 27, bias: { str: 1.25, vit: 1.1 }, skills: ['fist_jab', 'fist_combo', 'fist_counter'], tactic: 'offense',
    officers: [enemy({ id: 'o_horn', name: '부선장 토로', p: 16, skills: ['fist_jab'] })],
    sea: ['south'], stage: 1, route: 'marine', intro: '남해 상선을 털어 온 해적 선장.', drops: [{ op: 'money', add: 30000 }] }),

  // ---- 2단계
  boss({ id: 'b_smoker', name: '흰 사냥꾼 스모커', title: '해군 대령', canon: 'smoker', p: 44, bias: { vit: 1.1, wil: 1 }, faction: 'marine', fruitClass: 'logia', armament: 1, skills: ['fruit:moku:0', 'fruit:moku:1', 'fruit:moku:3', 'fist_jab'], tactic: 'defense',
    officers: [enemy({ id: 'o_tashigi', name: '타시기', p: 30, gender: 'f', faction: 'marine', age: 22, skills: ['sword_cut', 'sword_flash', 'sword_draw'] })],
    sea: ['gl_entry'], stage: 2, route: 'pirate', intro: '연기의 몸을 가진 해군. 무장색 없이는 손이 닿지 않는다.',
    drops: [{ op: 'money', add: 70000 }, { op: 'item', id: 'seastone', count: 2 }] }),
  boss({ id: 'b_mr1', name: '미스터 1', title: '바로크 워크스 최고 간부', canon: 'daz', p: 44, bias: { str: 1.2, vit: 1.2 }, skills: ['fruit:supa:0', 'fruit:supa:1', 'fruit:supa:2', 'sword_flash'], fruitClass: 'paramecia', tactic: 'offense',
    officers: [enemy({ id: 'o_doublefinger', name: '미스 더블핑거', p: 30, gender: 'f', skills: ['fist_jab', 'fist_combo'] })],
    sea: ['gl_entry'], stage: 2, route: 'marine', intro: '온몸이 칼날인 살인 청부업자.', drops: [{ op: 'money', add: 70000 }, { op: 'item', id: 'ar2', count: 1 }] }),

  // ---- 3단계
  boss({ id: 'b_lucci', name: '롭 루치', title: 'CP9 최강', canon: 'lucci', p: 66, bias: { str: 1.2, spd: 1.2 }, faction: 'marine', fruitClass: 'zoan', armament: 1, observation: 1, skills: ['fruit:neko_leo:0', 'fruit:neko_leo:1', 'fruit:neko_leo:2', 'fist_combo', 'fist_iron'], tactic: 'offense',
    officers: [enemy({ id: 'o_kaku', name: '카쿠', p: 50, faction: 'marine', skills: ['sword_cut', 'sword_wave', 'sword_flash'] }), enemy({ id: 'o_jabra', name: '자부라', p: 46, faction: 'marine', skills: ['fist_jab', 'fist_iron'] })],
    sea: ['gl_first'], stage: 3, route: 'pirate', intro: '세계 정부의 암살자. 육식이라 불리는 체술의 달인.',
    drops: [{ op: 'money', add: 150000 }, { op: 'item', id: 'sw3', count: 1 }] }),
  boss({ id: 'b_crocodile', name: '크로커다일', title: '칠무해 · 사막의 왕', canon: 'crocodile', p: 68, bias: { int: 1.1, wil: 1 }, fruitClass: 'logia', armament: 1, skills: ['fruit:suna:0', 'fruit:suna:1', 'fruit:suna:2', 'fruit:suna:3'], tactic: 'counter',
    officers: [enemy({ id: 'o_bon', name: '봉 클레이', p: 48, skills: ['fist_jab', 'fist_combo', 'fist_counter'] })],
    sea: ['gl_first'], stage: 3, route: 'marine', intro: '왕국을 노리는 모래의 사내. 물에 젖으면 몸이 굳는다.',
    drops: [{ op: 'money', add: 150000 }, { op: 'item', id: 'ch4', count: 1 }, { op: 'chance', p: 0.2, then: [{ op: 'findFruit', pool: 'gradeMin3' }] }] }),

  // ---- 4단계
  boss({ id: 'b_darc', name: '뇌격 다르크', title: '해군 본부 중장', p: 92, bias: { spd: 1.2, wil: 1 }, faction: 'marine', armament: 2, observation: 1, skills: ['sword_cut', 'sword_wave', 'sword_finish', 'arm_strike', 'arm_hard', 'obs_read'], tactic: 'counter',
    officers: [enemy({ id: 'o_pacifista1', name: '퍼시피스타 PX-3', p: 72, faction: 'marine', skills: ['gun_snipe', 'gun_volley'] }), enemy({ id: 'o_pacifista2', name: '퍼시피스타 PX-5', p: 72, faction: 'marine', skills: ['gun_snipe', 'gun_volley'] })],
    sea: ['sabaody'], stage: 4, route: 'pirate', intro: '샤본디를 봉쇄한 본부 중장과 인간 병기들.',
    drops: [{ op: 'money', add: 350000 }, { op: 'item', id: 'ar3', count: 1 }] }),
  boss({ id: 'b_hody', name: '호디 존스', title: '신어인 해적단 선장', canon: 'hody', p: 90, bias: { str: 1.3, vit: 1.2, int: 0.4 }, species: 'fishman', armament: 1, skills: ['fist_jab', 'fist_combo', 'fist_quake', 'fist_secret'], tactic: 'offense',
    officers: [enemy({ id: 'o_zeo', name: '제오', p: 66, species: 'fishman', skills: ['fist_jab', 'gun_smoke'] }), enemy({ id: 'o_daruma', name: '다루마', p: 64, species: 'fishman', skills: ['fist_combo'] })],
    sea: ['sabaody'], stage: 4, route: 'marine', intro: '에너지 스테로이드에 취한 증오의 어인.',
    drops: [{ op: 'money', add: 350000 }, { op: 'item', id: 'fi3', count: 1 }] }),

  // ---- 5단계
  boss({ id: 'b_fujitora', name: '후지토라', title: '해군 대장', canon: 'fujitora', p: 128, bias: { wil: 1.2, int: 1 }, faction: 'marine', fruitClass: 'paramecia', armament: 2, observation: 3, skills: ['sword_draw', 'sword_wave', 'sword_secret', 'arm_hard', 'fruit:gura:1', 'fruit:gura:2'], tactic: 'counter',
    sea: ['nw_first'], stage: 5, route: 'pirate', intro: '눈을 감고 운석을 떨어뜨리는 대장.',
    drops: [{ op: 'money', add: 900000 }, { op: 'gate', id: 'haki.observation.sharp' }] }),
  boss({ id: 'b_doflamingo', name: '돈키호테 도플라밍고', title: '칠무해 · 드레스로자 국왕', canon: 'doflamingo', p: 130, bias: { int: 1.2, spd: 1.1 }, fruitClass: 'paramecia', armament: 2, observation: 2, skills: ['fruit:ito:0', 'fruit:ito:1', 'fruit:ito:2', 'fruit:ito:3', 'con_burst'], tactic: 'offense',
    officers: [enemy({ id: 'o_trebol', name: '트레볼', p: 98, fruitClass: 'paramecia', skills: ['fruit:beta:0', 'fruit:beta:1', 'fist_guard'] }), enemy({ id: 'o_diamante', name: '디아만테', p: 96, skills: ['sword_wave', 'sword_flash'] })],
    sea: ['nw_first'], stage: 5, route: 'marine', intro: '실로 나라를 꼭두각시로 만든 하늘의 악마.',
    drops: [{ op: 'money', add: 900000 }, { op: 'item', id: 'sw4', count: 1 }] }),

  // ---- 6단계
  boss({ id: 'b_akainu', name: '아카이누', title: '해군 원수', canon: 'akainu', p: 178, bias: { str: 1.2, wil: 1.2 }, faction: 'marine', fruitClass: 'logia', armament: 3, observation: 2, skills: ['fruit:magu:0', 'fruit:magu:1', 'fruit:magu:2', 'fruit:magu:3', 'arm_flow'], tactic: 'offense',
    officers: [enemy({ id: 'o_kizaru', name: '키자루', p: 150, faction: 'marine', fruitClass: 'logia', armament: 2, skills: ['fruit:pika:0', 'fruit:pika:1', 'fruit:pika:2'] })],
    sea: ['nw_late'], stage: 6, route: 'pirate', intro: '철저한 정의의 원수. 이 산을 넘으면 해적왕이다.',
    drops: [{ op: 'money', add: 3000000 }] }),
  boss({ id: 'b_kaido', name: '백수 카이도', title: '사황', canon: 'kaido', p: 182, bias: { vit: 1.5, str: 1.3 }, fruitClass: 'zoan', armament: 3, observation: 2, skills: ['fist_combo', 'fist_secret', 'arm_flow', 'con_wave', 'con_coat'], tactic: 'endurance',
    officers: [enemy({ id: 'o_king', name: '화재의 킹', p: 150, fruitClass: 'zoan', armament: 2, skills: ['sword_wave', 'arm_hard', 'fist_iron'] }), enemy({ id: 'o_queen', name: '역병의 퀸', p: 145, fruitClass: 'zoan', armament: 2, skills: ['gun_volley', 'fist_quake'] })],
    sea: ['nw_late'], stage: 6, route: 'marine', intro: '세상에서 가장 강한 생물. 이 산을 넘으면 원수다.',
    drops: [{ op: 'money', add: 3000000 }] }),
];

export const BOSS_BY_ID = Object.fromEntries(BOSSES.map((b) => [b.id, b])) as Record<string, Boss>;

export { enemy as makeEnemy };
