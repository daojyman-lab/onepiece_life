// 정신적 강점 여섯 가지. 같은 표시가 marks번 쌓이면 얻는다.
export interface Strength { id: string; name: string; marks: number; text: string }

export const STRENGTHS: Strength[] = [
  { id: 'unyielding', name: '불굴', marks: 3, text: '지고도 다시 붙는다' },
  { id: 'obsession', name: '집념', marks: 3, text: '한 사람 · 한 목표를 끝까지 쫓는다' },
  { id: 'rebel', name: '반골', marks: 3, text: '윗사람을 거스른다' },
  { id: 'composure', name: '냉철', marks: 3, text: '위기에서 물러설 줄 안다' },
  { id: 'fellowship', name: '동료애', marks: 3, text: '남을 위해 대가를 치른다' },
  { id: 'daring', name: '승부사', marks: 3, text: '큰 것을 건다' },
];
