import { V } from '../balance';
import type { Cond, DiscipleStage, Turning } from '../../core/types';
const D = V.value.door;
const stage = (stage: DiscipleStage): Cond => ({ c: 'disciple', stage });

export const DISCIPLES: Turning[] = [
  {
    id: 'disciple_meeting', disciple: 'meeting', kind: 'door',
    when: [{ c: 'age', min: 25, max: 55 }, stage('meeting')], weight: 6, repeat: { years: 2 }, max: 12,
    speaker: { relation: '수련을 지켜보던 아이' }, title: '마당 끝의 작은 발자국',
    body: '며칠째 수련을 지켜보던 열네 살 아이가 오늘도 {discipleLesson}을 흉내 낸다. 바다에 나가기 전에 {discipleStyle}을 배우고 싶다며, 내일부터도 와도 되는지 묻는다. 한 번 자세를 고쳐 주는 일과 제자로 받는 일은 다르다.',
    doors: [
      { label: '이름을 묻고 정식으로 제자로 받는다', hint: '지금 익힌 무예를 몇 해에 걸쳐 가르친다', values: { loyalty: D }, fx: [
        { op: 'disciple', action: 'accept' },
        { op: 'log', text: '아이는 제 이름을 {discipleName}(이)라고 했다. {discipleIsland}에서 {discipleName}을(를) 제자로 받았다. {discipleStyle}의 첫 수업은 {discipleLesson}부터였다.', weight: 'heavy' },
        { op: 'timeline', text: '{discipleName}을(를) 제자로 받아 {discipleStyle}을(를) 가르치기 시작했다' }] },
      { label: '오늘 기본 자세만 고쳐 주고 다른 스승을 소개한다', hint: '한 번의 도움으로 사제 관계를 맺지는 않는다', values: { peace: D }, fx: [
        { op: 'log', text: '아이에게 기본 자세와 다른 수련장의 위치를 알려 주었다. 곁에 두고 가르치겠다는 약속은 하지 않았다.', weight: 'light' }] },
      { label: '꾸준히 가르칠 수 없다며 돌려보낸다', hint: '제자를 받지 않는다', values: { freedom: D }, fx: [
        { op: 'log', text: '끝까지 돌볼 자신이 없다며 제자로 받을 수 없다고 말했다. 아이는 마당에 고개를 숙이고 돌아갔다.', weight: 'light' }] },
    ],
  },
  {
    id: 'disciple_training', disciple: 'training', kind: 'door', when: [stage('training')],
    weight: 8, repeat: { years: 1 }, max: 12, speaker: { relation: '무예를 가르친 제자' },
    title: '{discipleName}의 첫 실전',
    body: '{discipleSince}살에 {discipleIsland}에서 제자로 받은 {discipleName}. {discipleYears}년 동안 함께 익힌 {discipleStyle}을 써서 항구에서 봉변당하던 사람을 구했다며 돌아왔다. 이겼다는 말 뒤에, 상대가 쓰러진 뒤에도 공격할 뻔했다는 고백이 따른다. 처음 가르친 {discipleLesson}을 다시 짚을 때다. {discipleChange}',
    doors: [
      { label: '{discipleName}에게 사람을 지킨 순간과 멈춘 순간을 함께 되짚게 한다', hint: '기술과 함께 힘을 거둘 책임을 가르친다', values: { justice: D }, fx: [
        { op: 'disciple', action: 'train' },
        { op: 'log', text: '{discipleName}과(와) 첫 실전을 되짚었다. {discipleStyle}으로 이기는 법만큼 멈추는 법도 가르쳤다. {discipleYears}년 전 첫 자세를 배우던 아이가 이제 제 판단을 설명했다.', weight: 'heavy' }] },
      { label: '빈틈을 되짚고 다시 수련한다', hint: '처음 배운 무예의 기본으로 돌아간다', values: { ambition: D }, fx: [
        { op: 'disciple', action: 'train' },
        { op: 'log', text: '{discipleName}에게 {discipleLesson}을 다시 보였다. {discipleStyle}을 배우기 시작한 날과 같은 자리에 서서, 서두르던 발을 고쳤다.', weight: 'light' }] },
    ],
  },
  {
    id: 'late_disciple_sails', disciple: 'sailing', kind: 'door', when: [stage('sailing')],
    weight: 7, repeat: { years: 1 }, max: Infinity, speaker: { relation: '무예를 가르친 제자' },
    title: '{discipleName}의 출항',
    body: '{discipleSince}살부터 {discipleStyle}을 가르친 {discipleName}이(가) 작은 배를 마련했다. 처음 마당 끝에 서 있던 날부터 {discipleYears}년이 흘렀다. 첫 실전을 되짚은 뒤에도 수련을 이어 온 제자는, 이제 스스로 겪고 돌아오겠다며 인사를 청한다. {discipleChange}',
    doors: [
      { label: '{discipleName}에게 수련 기록을 쥐여 보내 준다', hint: '처음 가르친 기본과 함께 제자의 길을 축복한다', values: { freedom: D }, fx: [
        { op: 'disciple', action: 'sail' },
        { op: 'log', text: '{discipleName}에게 {discipleStyle} 수련 기록을 건넸다. {discipleLesson}을 마지막으로 되짚고, 떠나는 배를 지켜보았다. 빈 마당에는 제자가 쓰던 자리가 남았다.', weight: 'heavy' },
        { op: 'timeline', text: '{discipleStyle}을 배운 제자 {discipleName}이(가) 출항했다' }] },
      { label: '한 해만 더 준비하고 가라고 붙잡는다', hint: '이 제자의 출항은 적어도 한 해 뒤로 미뤄진다', values: { dominion: D }, fx: [
        { op: 'disciple', action: 'delay' }, { op: 'hardship', add: 1 },
        { op: 'log', text: '{discipleName}에게 한 해만 더 남아 달라고 했다. 제자는 항구를 돌아본 뒤 수련 기록을 다시 펼쳤다. 아직 떠난 것은 아니었다.', weight: 'light' }] },
    ],
  },
  {
    id: 'late_r_student_pirate', disciple: 'reunion', kind: 'door',
    when: [{ c: 'age', min: 55 }, { c: 'standing', is: ['retired'] }, stage('reunion')],
    weight: 7, repeat: { years: 1 }, max: 12, speaker: { relation: '무예를 가르친 제자' },
    title: '{discipleName}의 도전',
    body: '{discipleSince}살에 {discipleIsland}에서 {discipleStyle}을 가르치기 시작한 {discipleName}이(가) 찾아왔다. 첫 수업에서 {discipleLesson}을 가르친 지 {discipleYears}년, 수련 기록을 쥐여 출항시킨 지 {discipleSailedYears}년 만이다. 이제 악명 높은 해적이 된 제자는 스승을 넘어야 제 길이 끝난다며 한 판을 청한다. {discipleChange}',
    doors: [
      { label: '{discipleName}의 도전을 받아들인다', hint: '늙은 몸으로 오래전 가르친 제자의 공격을 받는다', values: { ambition: D }, danger: true, fx: [
        { op: 'disciple', action: 'resolve', outcome: 'duel' }, { op: 'hp', add: -30 }, { op: 'chance', p: 0.3,
          then: [{ op: 'injury', severity: 'heavy' }, { op: 'log', text: '{discipleName}의 공격을 받아내다 깊은 상처를 입었다. 오랜 공방 끝에 제자가 먼저 무릎을 꿇었다. 처음 {discipleStyle}을 가르치던 날처럼, 지친 손으로 제자를 일으켰다.', weight: 'heavy' }],
          else: [{ op: 'log', text: '오랜 공방 끝에 {discipleName}이(가) 먼저 무릎을 꿇었다. {discipleStyle}의 첫 수업에서 짚었던 자세가 눈에 들어왔다. 지친 손을 내밀어 제자를 일으켰다.', weight: 'heavy' }] }] },
      { label: '싸우지 않고 {discipleName}에게 무엇을 위해 싸우는지 묻는다', hint: '첫 실전 뒤 나눴던 물음으로 돌아간다', values: { romance: D }, fx: [
        { op: 'disciple', action: 'resolve', outcome: 'reconciled' },
        { op: 'log', text: '{discipleName}에게 처음 {discipleStyle}을 배운 이유를 물었다. 제자는 공격할 자세를 풀었다. 첫 실전을 털어놓던 날처럼 오래 말을 고르다가, 혼자 바닷가로 걸어갔다.', weight: 'heavy' }] },
      { label: '해군에 {discipleName}의 행방을 알린다', hint: '직접 가르친 힘이 남을 해치는 것을 막는다', values: { justice: D }, fx: [
        { op: 'disciple', action: 'resolve', outcome: 'reported' }, { op: 'hardship', add: 4 },
        { op: 'log', text: '해군에 {discipleName}의 행방을 알렸다. {discipleStyle}의 수련 기록 곁에 제자의 수배서가 남았다. 해군이 떠난 뒤에도, 아이가 처음 제 이름을 말하던 목소리가 떠올랐다.', weight: 'heavy' }] },
    ],
  },
];
