import type { Life5 } from './types';
import { KUMA_MET, kumaDestination, kumaSighting, landingTrace } from '../data/kuma';
import { trainingReturn } from '../data/training-routes';
import { seaOfPort } from '../data/navigation';
import { logLine } from './log';
import { depart } from './passage';
import { requestArrival } from './voyage';

export function finishKumaFight(s: Life5, result: 'win' | 'lose' | 'retreat') {
  if (!s.flags.includes(KUMA_MET) || s.flags.includes('kuma:resolved') || !kumaSighting(s)) return;
  s.flags.push('kuma:resolved');
  s.stats.fights++;
  if (result === 'win') s.stats.wins++;
  const origin = s.hero.island;
  if (result !== 'lose') {
    const text = result === 'win'
      ? '쿠마가 손을 내뻗기 전에 마지막 들것이 빠져나갔다. 길을 확보하고 물러나자 쿠마도 추격을 멈췄다.'
      : '쿠마의 손이 닿기 전에 옆길로 몸을 빼냈다. 멀어지는 발소리가 잦아들기를 기다렸다.';
    logLine(s, text, 'heavy', 'battle');
    s.timeline.push({ age: s.age, text, canon: 'kuma' });
    return;
  }
  const site = kumaDestination(s);
  logLine(s, '쿠마의 손바닥이 몸에 닿았다. 땅이 발밑에서 멀어지고 사흘 밤낮 바람 소리만 들렸다.', 'heavy', 'battle');
  s.flags = s.flags.filter(flag => !flag.startsWith('training:line:'));
  // 토리노에서 돌아가는 구호선은 게임의 주 항로인 드럼에 닿는다.
  s.flags.push('training:line:' + (site.course === 'torino' ? 'relief' : site.id));
  s.sail = false;
  requestArrival(s, site.island, site.sea, 'story');
  if (!s.flags.includes('at:' + site.island)) s.flags.push('at:' + site.island);
  logLine(s, landingTrace[site.course], 'heavy', 'life');
  s.timeline.push({ age: s.age, text: origin + '에서 쿠마에게 밀려 ' + site.island + '에 떨어졌다', canon: 'kuma' });
}

export function returnFromTraining(s: Life5) {
  const line = trainingReturn(s.hero.island, s.flags);
  if (!line || s.passage) return;
  logLine(s, line.homeward, 'light');
  if (line.id === 'balloon') {
    requestArrival(s, line.from, seaOfPort(line.from)!, 'story');
    if (!s.flags.includes('at:' + line.from)) s.flags.push('at:' + line.from);
  } else {
    depart(s, line.from, 'drift');
  }
}
