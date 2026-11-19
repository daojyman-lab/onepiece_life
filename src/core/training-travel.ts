import type { Life5 } from './types';
import { trainingReturn, type TrainingLine } from '../data/training-routes';
import { availableTrainingLines, seaOfPort } from '../data/navigation';
import { logLine } from './log';
import { depart } from './passage';
import { requestArrival } from './voyage';

function ride(s: Life5, line: TrainingLine, back: boolean) {
  const to = back ? line.from : line.island;
  logLine(s, back ? line.homeward : line.outward, 'light');
  if (line.id === 'balloon') {
    requestArrival(s, to, seaOfPort(to)!, 'story');
    if (!s.flags.includes('at:' + to)) s.flags.push('at:' + to);
  } else {
    depart(s, to, 'drift');
  }
}

export function takeTrainingLine(s: Life5, id: string) {
  const line = availableTrainingLines(s).find(candidate => candidate.id === id);
  if (!line) return;
  const back = s.hero.island === line.island;
  if (!back) {
    s.flags = s.flags.filter(flag => !flag.startsWith('training:line:'));
    s.flags.push('training:line:' + line.id);
  }
  ride(s, line, back);
}

export function returnFromTraining(s: Life5) {
  const line = trainingReturn(s.hero.island, s.flags);
  if (line && !s.passage) ride(s, line, true);
}
