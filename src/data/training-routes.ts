import type { SeaId } from '../core/types';

// 수련 뒤의 귀항편. 구판에서 출항한 저장도 같은 목적지로 돌아간다.
export interface TrainingLine {
  id: string; course: string; from: string; island: string; sea: SeaId;
  vessel: string; homeward: string; days?: number;
}

export const AMAZON_ROADS = '아마존 릴리 외해 정박지';
export const TRAINING_LINES: TrainingLine[] = [
  { id: 'kuja', course: 'rusukaina', from: '아마존 릴리', island: '루스카이나', sea: 'sabaody', vessel: '쿠자 경비선',
    homeward: '경비선이 약속한 바위턱에 배를 대고 여인섬 앞바다까지 태워 주었다.' },
  { id: 'chart', course: 'kuraigana', from: '롱 링 롱 랜드', island: '쿠라이가나', sea: 'gl_first', vessel: '폐허 측량선',
    homeward: '측량 기사가 귀항 해도를 폈다. 안개가 트인 자리로 배가 빠져나갔다.' },
  { id: 'botany', course: 'boin', from: '알라바스타 왕국', island: '보인 열도', sea: 'gl_first', vessel: '식물 탐사선', days: 8,
    homeward: '표본 상자를 묶은 탐사선이 접히는 잎 끝을 벗어나 나노하나로 향했다.' },
  { id: 'balloon', course: 'weatheria', from: '자야', island: '웨더리아', sea: 'gl_first', vessel: '기상 관측 기구',
    homeward: '관측반이 자야의 지붕을 알아보고 기구의 고도를 낮췄다. 구름 사이로 지면이 가까워졌다.' },
  { id: 'pantry', course: 'kamabakka', from: '샤본디 제도', island: '카마바카 왕국', sea: 'gl_first', vessel: '식재료 보급선', days: 9,
    homeward: '보급선이 다음 기항지로 떠나기 전에 돌아갈 배편을 물었다. 모모이로섬의 요리사가 귀항선을 소개했다.' },
  { id: 'birds', course: 'torino', from: '남쪽 산호초 항구', island: '토리노 왕국', sea: 'south', vessel: '약재 교역선',
    homeward: '약재상이 빈 광주리를 갑판에 포개고 산호초 항구로 돌아갈 물때를 짚었다.' },
  { id: 'relief', course: 'torino', from: '드럼 왕국', island: '토리노 왕국', sea: 'south', vessel: '사우스 블루 구호선', days: 12,
    homeward: '회항하는 구호 선단이 약재 목록을 인수했다. 호위함 뒤에 붙어 드럼으로 돌아가는 배에 올랐다.' },
  { id: 'workshop', course: 'baldimore', from: '워터 세븐', island: '벌지모아', sea: 'gl_first', vessel: '기계 부품 운반선', days: 7,
    homeward: '부품을 내린 배가 빈 나무틀을 실었다. 도크로 돌아가는 배 안에서 젖은 장갑을 말렸다.' },
];

export const trainingDays = (from: string, to: string) => TRAINING_LINES.find(line =>
  (line.from === from && line.island === to) || (line.island === from && line.from === to))?.days;

export const trainingSite = (place: string) => TRAINING_LINES.find(line => line.island === place);
export function trainingLanding(place: string, flags: string[]): string | undefined {
  const site = trainingSite(place);
  if (!site) return;
  return 'field_' + site.course + (flags.includes('training:done:' + site.course) ? '_return' : '');
}

export function trainingReturn(place: string, flags: string[]) {
  return TRAINING_LINES.find(line => line.island === place && flags.includes('training:line:' + line.id)) ?? trainingSite(place);
}
