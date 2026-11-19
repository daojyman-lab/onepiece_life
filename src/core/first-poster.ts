import { V } from '../data/balance';
import { TURNING_BY_ID } from '../data/turnings';
import { fmtMoney } from '../shared/core/util';
import { fullName } from './birth';
import { logLine } from './log';
import { publishIssue } from './world-news';
import { hasRelation, personIs } from './needs';
import type { Hero5, Life5, Person, Standing } from './types';

const wanted = (standing: Standing | undefined) => standing === 'pirate' || standing === 'warlord';

export function bountyAmount(hero: Hero5): number {
  return wanted(hero.standing) ? Math.max(0, Math.round(hero.fame)) * V.fame.bounty : 0;
}

/** 옛 저장은 현상금 변동 이력이 없다. 지난 해적 생활을 마친 인생에는 '최초'를 소급하지 않는다. */
export function hadBountyBeforeUpgrade(s: Life5): boolean {
  if (bountyAmount(s.hero) > 0 || s.seen.pirate_first_poster !== undefined || s.flags.includes('firstPoster')) return true;
  const postings = s.timeline.map(entry => entry.standing).filter((standing): standing is Standing => !!standing);
  if (postings.at(-1) !== s.hero.standing) postings.push(s.hero.standing);
  return postings.some((standing, i) => i + 1 < postings.length && wanted(standing) && !wanted(postings[i + 1]));
}

const available = (p: Person) => p.alive && !p.missing;
const TEACHER_ROLES = ['스승', '주먹의 스승', '어인 가라테 사범', '포로에서 돌아온 늙은 교관', '빼내 온 늙은 교관'];
const NAMED_MASTERS: Record<string, string> = { '코우시로 사범': 'koshiro', '가프 중장': 'garp', '어인 가라테 사범': 'hack' };

interface Teacher { name: string; person?: Person }

function findTeacher(s: Life5, listeners: Person[]): Teacher | undefined {
  const bonds = Object.values(s.growth.styleBonds);
  const teacher = listeners.find(p => p.kind === 'master' || bonds.some(b => b?.teacherId === p.id) || TEACHER_ROLES.some(role => hasRelation(p, role)));
  if (teacher) return { person: teacher, name: teacher.name };

  // 기간제 스승은 수업이 끝나면 growth.master에서 사라진다. 실제로 고른 입문 문만 읽는다.
  const names = new Set<string>();
  if (s.growth.master) names.add(s.growth.master.name);
  for (const choice of s.tried) {
    const [id, index] = choice.split('#');
    const master = TURNING_BY_ID[id]?.doors[Number(index)]?.fx.find(e => e.op === 'master');
    if (master) names.add(master.name);
    if (choice === 'town_shimo_dojo#1' || choice === 'go_shimo#0') names.add('코우시로 사범');
  }
  for (const name of names) {
    if (name === '부두 사범 엘모의 수련장') continue;
    const canon = NAMED_MASTERS[name];
    const contacts = s.people.filter(p => hasRelation(p, name) || (p.kind === 'master' && p.name === name) || (!!canon && p.canon === canon));
    const contact = contacts.find(p => listeners.includes(p));
    if (contacts.length && !contact) continue;
    return { name: contact?.name ?? name, person: contact };
  }
}

function teacherLine(s: Life5, { name, person }: Teacher): string {
  if (person?.canon === 'koshiro' || name === '코우시로 사범') return '코우시로 사범은 도장 벽에 걸린 목검 아래 수배서를 놓았다. “다음에 오면 차부터 한 잔 내줘야겠군요.”';
  if ((name === '엘모' || name === '부두 사범 엘모') && ['life_course_training#0', 'life_course_training#1'].some(key => s.tried.includes(key))) {
    const memory = s.tried.includes('life_course_training#0') ? '등 뒤에 누가 있는지부터 살피던 녀석이야.' : '내가 먼저 움직일 때까지 꼼짝도 안 하던 녀석이야.';
    return `엘모는 수배서를 보더니 입가에 웃음을 띠었다. “${memory} 어디 가서도 그걸 잊진 않았겠지.”`;
  }
  return `${name}은(는) 수배서를 접어 두었다. “내 제자 얼굴을 이런 데서 다 보네. 돌아오면 차근차근 들어 봐야겠어.”`;
}

const SIBLING_LINES = [
  '수배서가 접힌 자리를 손바닥으로 폈다. “얼굴 한번 보기가 이렇게 어렵네. 편지 한 줄이면 될 걸.”',
  '옆에서 액수를 세는 사람에게 종이를 돌려 달라고 했다. “잠깐만요. 얼굴 좀 더 보게요.”',
  '종이를 들어 빛에 비춰 봤다. “살아 있네. 얼굴 보니까 이제야 좀 안심된다.”',
];

export function reportBountyChange(s: Life5, previousBounty: number, previousStanding: Standing): void {
  if (!s.hero.alive) return;
  if (s.hero.standing === 'warlord') {
    if (previousStanding !== 'warlord') {
      const name = fullName(s.hero);
      publishIssue(s, { id: `commission:${s.age}:${s.part}`, kind: 'world', title: `세계정부, ${name}의 칠무해 임명 발표`,
        body: `해군 지부에 ${name}의 수배를 정지하라는 공문이 도착했다. 게시판에서 수배서를 떼어 봉투에 넣고 공인장을 발급했다.` });
    }
    return;
  }
  const amount = bountyAmount(s.hero);
  if (previousStanding === 'warlord' && s.hero.standing === 'pirate' && s.firstBountyIssued && amount > 0) {
    const name = fullName(s.hero);
    s.publishedBounty = Math.max(s.publishedBounty ?? 0, amount);
    publishIssue(s, { id: `resumed:${s.age}:${s.part}`, kind: 'bounty', amount, title: `${name} 수배 재개 · ${fmtMoney(amount)} 베리`,
      body: `정부의 보호가 끝났다. 뉴스 쿠의 배달 가방에 ${name}의 수배서가 다시 실렸다.` });
    return;
  }
  if (amount <= previousBounty || amount <= (s.publishedBounty ?? 0)) return;
  const hero = fullName(s.hero);
  const price = `${fmtMoney(amount)} 베리`;
  if (s.firstBountyIssued || previousBounty > 0) {
    s.firstBountyIssued = true;
    s.publishedBounty = amount;
    publishIssue(s, { id: `wanted:${amount}`, kind: 'bounty', amount,
      title: `${hero} 수배액 인상 · ${price}`, body: `새 수배서가 해군 지부로 보내졌다. ${hero}의 이름 아래 새로 찍힌 액수는 ${price}다.` });
    return;
  }
  s.firstBountyIssued = true;
  s.publishedBounty = amount;
  const prize = `첫 현상금 ${fmtMoney(amount)} 베리`;
  s.timeline.push({ age: s.age, text: prize });
  const tell = (line: string) => logLine(s, line, 'heavy', 'world');
  const report = `뉴스 쿠가 신문과 함께 새 수배서를 실어 날랐다. ${hero}의 얼굴 아래 찍힌 첫 현상금은 ${price}였다.`;
  publishIssue(s, { id: 'first-wanted', kind: 'bounty', amount, title: `${hero}의 첫 수배서 · ${price}`, body: report }, report);

  const people = s.people.filter(available);
  const kin = people.filter(p => personIs(p, 'parent') || personIs(p, 'sibling'));
  const others = people.filter(p => !kin.includes(p));
  for (const p of kin.filter(p => personIs(p, 'parent'))) {
    const line = p.relation === '아버지'
      ? '수배서를 반듯하게 접어 안주머니에 넣었다. “그 녀석이라면 잘 있을 거다. …밥은 제때 먹으려나.”'
      : '손끝에 묻은 잉크를 닦고 얼굴을 다시 들여다봤다. “어디에 있든 좋으니 한 번만 기별을 주렴.”';
    tell(`${p.relation} ${p.name}은(는) ${line}`);
  }
  const teacher = findTeacher(s, others);
  if (teacher) tell(teacherLine(s, teacher));
  const siblings = kin.filter(p => personIs(p, 'sibling'));
  const soleSibling = s.people.filter(p => personIs(p, 'sibling')).length === 1;
  for (const [i, sibling] of siblings.entries()) {
    let line = SIBLING_LINES[i % SIBLING_LINES.length];
    if (sibling.age < 4) {
      line = '종이에 찍힌 낯익은 얼굴을 손가락으로 톡톡 두드렸다.';
    } else if (sibling.age < 13 && sibling.age < s.age) {
      const address = s.hero.gender === 'm' ? (sibling.gender === 'm' ? '형' : '오빠') : (sibling.gender === 'm' ? '누나' : '언니');
      line = `종이에 찍힌 얼굴을 콕 짚었다. “우리 ${address}이(가) 웃으면 눈이 이렇게 되는데, 그건 못 그렸네.”`;
    }
    if (soleSibling) {
      if (s.flags.includes('sibBet')) line = '현상금을 읽고 피식 웃었다. “밥 한 끼 걸고 한 내기였는데 판이 이렇게 커지네.”';
      else if (s.flags.includes('sibRoof')) line = '수배서를 접어 들고 지붕을 올려다봤다. “다시 만나기로 한 자리, 아직 그대로야.”';
    }
    tell(`${sibling.relation} ${sibling.name}은(는) ${line}`);
  }
  const rivals = others.filter(p => p !== teacher?.person);
  const childhoodRival = (p: Person) => hasRelation(p, '어릴 적 맞수') || hasRelation(p, '함께하게 된 어릴 적 맞수');
  const rival = rivals.find(childhoodRival) ?? rivals.find(p => p.kind === 'rival');
  if (rival) {
    const reaction = childhoodRival(rival)
      ? '얼굴을 알아보자마자 웃었다. “먼저 이름 좀 알렸다고 네가 이긴 건 아니거든. 다음엔 내 차례야.”'
      : rival.faction === 'marine' ? '액수보다 얼굴을 먼저 살폈다. “이제 어디서 마주칠지 모르겠군.”'
      : '금액을 입 안에서 한번 되뇌었다. “어디까지 가나 두고 보자고.”';
    tell(`맞수 ${rival.name}은(는) ${reaction}`);
  }
}
