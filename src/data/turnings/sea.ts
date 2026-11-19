// 바다 이동 (과제 10, 설계 5.6) 첫째: 이스트 블루를 떠나는 길과 거꾸로 돌아오는 길. 로그타운에서 태어난 사람에게 열린다.
// 떠나는 길은 바다에 나간 사람만의 것이 아니다: 표류, 납치, 징발, 전근, 상선 일자리처럼 뭍의 사람도 떠밀려 간다.
// 이스트 블루의 항구는 후샤 마을 · 시럽 마을 · 로그타운 · 해상 레스토랑 발라티에 · 코노미 제도다.
// 로그타운으로 못 박아 돌려보내지 않는다 (family.test). 고향으로 돌아가는 일은 moveHome이다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { SEAFARING, afterHistory, beforeHistory, age, at, home, sea, st } from './paths';
import type { Turning } from '../../core/types';

const D = V.value.door;
const GL_SEAS = ['gl_entry', 'gl_first', 'sabaody', 'nw_first', 'nw_late'] as const;

export const SEA_LEAVE: Turning[] = [
  // ---------------------------------------------------------------- 이스트 블루를 떠나는 길
  {
    id: 'sea_drift', kind: 'door', when: at(age(16, 50), st('civil', 'shipwright', 'settled', 'bountyHunter', 'pirate'), sea('east')),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '닷새째 표류', body: '고깃배를 빌려 나간 날 돌풍이 돛을 찢었다. 닷새째 물 위를 떠돈다. 해류는 붉은 산 쪽으로 배를 끌고 가고, 수평선에는 이따금 다른 배의 돛이 비친다.',
    doors: [
      { label: '해류에 몸을 맡기고 붉은 산까지 간다', hint: '돌아올 길은 모른다. 위대한 항로의 입구에 닿는다', values: { romance: D }, danger: true,
        fx: [{ op: 'hp', add: -20 }, { op: 'move', island: '리버스 마운틴', sea: 'gl_entry' },
             { op: 'log', text: '배가 붉은 산의 물길을 거슬러 올라가 반대편으로 떨어졌다. 정신을 차리니 거대한 고래가 울고 있었다.', weight: 'heavy' },
             { op: 'timeline', text: '표류 끝에 위대한 항로에 들어섰다' }] },
      { label: '젖은 옷을 깃발 삼아 지나가는 배를 부른다', hint: '닿을지 모른다. 닿으면 집으로 돌아간다', fx: [{ op: 'hp', add: -10 }, { op: 'chance', p: 0.6, then: [{ op: 'log', text: '상선 하나가 돛을 접고 다가왔다. 이레 만에 고향 부두를 밟았다.', weight: 'light' }],
        else: [{ op: 'hp', add: -15 }, { op: 'move', island: '리버스 마운틴', sea: 'gl_entry' }, { op: 'log', text: '아무도 보지 못했다. 해류가 배를 붉은 산 너머로 데려갔다.', weight: 'heavy' }] }] },
      { label: '해류를 거슬러 이를 악물고 노를 젓는다', hint: '손바닥이 다 터진다. 제 힘으로 돌아간다', mark: 'unyielding',
        fx: [{ op: 'hp', add: -25 }, { op: 'base', key: 'vit', add: 1 }, { op: 'log', text: "노를 놓지 않고 거센 해류를 거슬렀다. 닷새 만에 익숙한 해안이 보였을 때 손바닥은 피로 젖어 있었다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_kidnapped', kind: 'door', when: at(age(16, 35), st('civil', 'settled', 'shipwright'), sea('east')),
    weight: 3, repeat: 'once', speaker: 'hero',
    title: '노예선의 밑창', body: '{island}의 밤길에서 자루가 머리에 씌워졌다. 깨어나 보니 쇠사슬에 묶인 채 배 밑창이다. 같은 사슬에 묶인 사람들이 샤본디 제도의 경매장으로 간다고 속삭인다.',
    doors: [
      { label: '사슬의 녹슨 고리를 밤마다 간다', hint: '들키면 매를 맞는다. 풀리면 배에서 달아난다', values: { freedom: D }, danger: true,
        fx: [{ op: 'chance', p: 0.5, then: [{ op: 'hp', add: -15 }, { op: 'log', text: '고리가 끊어진 밤, 판자 조각을 붙잡고 근처 섬의 불빛까지 떠갔다. 이스트 블루의 끝자락이었다.', weight: 'heavy' }],
               else: [{ op: 'hp', add: -20 }, { op: 'move', island: '샤본디 제도', sea: 'sabaody' },
                      { op: 'log', text: '사슬을 갈던 손이 들켰다. 샤본디의 경매장 뒤뜰에서 해적들의 소동이 벌어진 틈에야 겨우 사슬이 풀렸다.', weight: 'heavy' },
                      { op: 'timeline', text: '노예선에 실려 샤본디 제도까지 끌려갔다' }] }] },
      { label: '옆 사슬의 아이를 다독이며 함께 버틴다', hint: '샤본디까지 끌려간다. 그 아이는 {name}의 손을 놓지 않는다', values: { freedom: D },
        fx: [{ op: 'move', island: '샤본디 제도', sea: 'sabaody' }, { op: 'person', kind: 'ally', relation: '노예선에서 손을 잡았던 아이', age: { younger: 10 } }, { op: 'hardship', add: 4 },
             { op: 'log', text: '샤본디의 경매장 뒤뜰에서 소동이 벌어졌다. 아이를 업고 맹그로브 숲으로 달아났다.', weight: 'heavy' },
             { op: 'timeline', text: '노예선에 실려 샤본디 제도까지 끌려갔다' }] },
      { label: '노예상에게 몸값을 부르라고 흥정한다', hint: '가진 돈을 다 내놓는다. 노예상이 약속을 지킬지 모른다', values: { ambition: D },
        fx: [{ op: 'money', add: -30000 }, { op: 'chance', p: 0.6, then: [{ op: 'log', text: '노예상은 돈을 세고는 가까운 섬에 {name}을(를) 내려 주었다.', weight: 'light' }],
               else: [{ op: 'move', island: '샤본디 제도', sea: 'sabaody' }, { op: 'log', text: '노예상은 돈만 챙기고 사슬을 풀지 않았다. 샤본디의 소동 틈에야 달아났다.', weight: 'heavy' }] }] },
    ],
  },
  {
    id: 'sea_conscript', kind: 'door', when: at(age(17, 32), st('civil', 'shipwright'), sea('east')),
    weight: 3, repeat: 'once', speaker: { relation: '해군 보급선의 하사' },
    title: '보급선의 징발', body: '위대한 항로로 가는 해군 보급선이 {island}에 닿아 젊은 일손을 징발한다. 한 집에 한 사람씩이다. 이웃집은 외아들을 내놓아야 할 처지다.',
    doors: [
      { label: '이웃집 막내 대신 제가 오른다', hint: '위대한 항로까지 노를 젓는다. 이웃집은 막내를 지킨다', values: { loyalty: D },
        fx: [{ op: 'move', island: '드럼 왕국', sea: 'gl_entry' }, { op: 'base', key: 'vit', add: 1 }, { op: 'person', kind: 'ally', relation: '막내를 지킨 이웃집' },
             { op: 'log', text: '보급선의 노를 저어 붉은 산을 넘었다. 눈 덮인 왕국의 항구에서 일이 끝났다.', weight: 'heavy' }, { op: 'timeline', text: '해군 보급선에 징발되어 위대한 항로로 갔다' }] },
      { label: '산으로 숨어 보급선이 떠나길 기다린다', hint: '이레를 숲에서 지낸다. 하사가 집을 뒤진다', values: { freedom: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'hardship', add: 1 }, { op: 'log', text: "하사가 집을 뒤질 동안 산속에서 이레를 버텼다. 보급선이 떠난 뒤 내려왔을 때 집에는 뒤집힌 그릇이 남아 있었다.", weight: 'light' }] },
      { label: '순순히 보급선에 오른다', hint: '노를 젓고 짐을 나른다. 돌아오는 배편은 정해져 있지 않다',
        fx: [{ op: 'move', island: '위스키 피크', sea: 'gl_entry' }, { op: 'log', text: '보급선은 선인장 바위의 항구에 짐을 내리고 일손들을 풀어 주었다.', weight: 'heavy' },
             { op: 'timeline', text: '해군 보급선에 징발되어 위대한 항로로 갔다' }] },
    ],
  },
  {
    id: 'sea_rumor', kind: 'door', when: at(age(17, 45), st(...SEAFARING), sea('east')),
    weight: 4, repeat: 'once', speaker: { relation: '늙은 뱃사람' },
    title: '해적왕이 남긴 말', body: '{island}에서 늙은 뱃사람이 해도를 펼친다. 해적왕이 처형대에서 남긴 그 말 이후로, 모든 보물은 위대한 항로의 끝에 있다고. 이 바다에서 늙어 가는 건 바보들뿐이라고.',
    doors: [
      { label: '그 말을 따라 붉은 산으로 뱃머리를 돌린다', hint: '위대한 항로에 들어선다. 이 바다와는 비교가 안 되는 바다다', values: { romance: D },
        fx: [{ op: 'move', island: '리버스 마운틴', sea: 'gl_entry' }, { op: 'log', text: '붉은 산의 물길을 거슬러 올랐다. 바다가 하늘로 솟았다가 떨어졌다.', weight: 'heavy' },
             { op: 'timeline', text: '해적왕의 말을 따라 위대한 항로에 들어섰다' }] },
      { label: '뱃사람에게 값을 치르고 해도를 캐묻는다', hint: '떠나기 전에 바다를 안다. 해도 값이 꽤 든다', values: { inquiry: D },
        fx: [{ op: 'money', add: -8000 }, { op: 'base', key: 'int', add: 1 }, { op: 'flag', id: 'glChart' }, { op: 'log', text: "늙은 뱃사람이 종이 위에 붉은 산 너머의 해류를 그렸다. 값을 치르고 구겨진 해도를 챙겼다.", weight: 'light' }] },
      { label: '보물을 쫓는 바보들에게 배와 식량을 비싸게 판다', hint: '이 바다에 남아 돈을 번다', values: { greed: D },
        fx: [{ op: 'money', add: 30000 }, { op: 'log', text: "보물을 좇는 젊은 선원들에게 식량과 배를 비싸게 팔았다. 그들의 돛이 수평선에 사라질 때도 가게 계산대에 남았다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_bounty_chase', kind: 'door', when: at(age(17, 45), st('bountyHunter'), sea('east'), { c: 'standingYears', min: 1 }),
    weight: 4, repeat: 'once', speaker: 'hero',
    title: '붉은 산 너머로 달아난 사냥감', body: '석 달을 쫓은 해적이 붉은 산 너머로 달아났다. 위대한 항로 입구에는 사냥꾼들이 모여 사는 선인장 바위의 마을이 있다고 한다. 그 너머의 사냥감은 현상금의 자릿수가 다르다.',
    doors: [
      { label: '사냥감을 쫓아 붉은 산을 넘는다', hint: '더 큰 사냥터로 간다. 사냥꾼도 사냥감이 될 수 있는 바다다', values: { ambition: D }, danger: true,
        fx: [{ op: 'move', island: '위스키 피크', sea: 'gl_entry' }, { op: 'hp', add: -10 },
             { op: 'log', text: '선인장 바위의 마을 사람들이 술잔을 들고 반겼다. 너무 반가운 얼굴들이었다.', weight: 'heavy' },
             { op: 'timeline', text: '사냥감을 쫓아 위대한 항로에 들어섰다' }] },
      { label: '그 해적의 행방을 위대한 항로로 가는 사냥꾼에게 판다', hint: '석 달의 품을 돈으로 바꾼다', values: { inquiry: D },
        fx: [{ op: 'money', add: 15000 }, { op: 'log', text: "석 달 적어 둔 해적의 항로를 사냥꾼에게 넘겼다. 그는 돈을 건네고 붉은 산 너머로 출항했다.", weight: 'light' }] },
      { label: '이 바다의 사냥감으로 만족한다', hint: '익숙한 바다에 남는다', fx: [{ op: 'hp', add: 5 }, { op: 'log', text: "붉은 산을 넘은 해적은 더 쫓지 않았다. 익숙한 항구에서 다음 수배서를 펼치고 배를 손봤다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_new_ship', kind: 'door', when: at(age(18, 45), st('pirate', 'bountyHunter', 'civil'), sea('east'), { c: 'flag', id: 'ship', has: true }, { c: 'standingYears', min: 1 }),
    weight: 5, repeat: 'once', speaker: 'hero',
    title: '붉은 산을 넘을 배', body: '손본 배가 이제 제법 튼튼하다. 조선소의 늙은 목수가 이 배라면 붉은 산의 물길도 버틸 거라고 한다. 이스트 블루의 섬들은 이제 눈을 감고도 다닐 수 있다.',
    doors: [
      { label: '돛을 올려 붉은 산으로 간다', hint: '위대한 항로에 들어선다. 이 배로 어디까지 갈지 시험한다', values: { ambition: D },
        fx: [{ op: 'move', island: '리버스 마운틴', sea: 'gl_entry' }, { op: 'log', text: '배가 붉은 산을 거슬러 올라 반대편 바다로 떨어졌다. 등 뒤로 이스트 블루가 사라졌다.', weight: 'heavy' },
             { op: 'timeline', text: '제 배로 붉은 산을 넘어 위대한 항로에 들어섰다' }] },
      { label: '한 해 더 이 바다에서 배와 사람을 다진다', hint: '서두르지 않는다. 더 단단해져서 간다', mark: 'composure', values: { loyalty: D },
        fx: [{ op: 'repairShip', mark: 'seam' }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: "늙은 목수와 선체의 약한 이음새를 다시 박았다. 선원들과 이스트 블루의 해류를 한 해 더 익히기로 했다.", weight: 'light' }] },
      { label: '배를 고깃배로 고쳐 이 바다에서 산다', hint: '모험은 접는다. 바다는 계속 곁에 있다', values: { peace: D },
        fx: [{ op: 'standing', to: 'civil' }, { op: 'money', add: 10000 }, { op: 'timeline', text: '배를 고깃배로 고쳐 이스트 블루에 남았다' }, { op: 'log', text: "배의 화물칸을 고기 저장고로 고치자 첫 어획물을 실을 수 있었다. 항구 상인이 값을 치르고 돌아갔다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_smoker_chase', kind: 'door', when: at(age(17, 20), st('marine'), sea('east'), { c: 'island', is: ['로그타운'] }, afterHistory('loguetownStorm'), beforeHistory('alabastaRain')),
    weight: 6, repeat: 'once', speaker: { canon: 'smoker' },
    title: '시가 두 대의 대령', body: '로그타운의 대령이 지부의 군함을 끌고 붉은 산으로 간다고 한다. 처형대에서 놓친 밀짚모자를 쫓겠다고, 본부의 허락 따위는 필요 없다고. 시가 연기 너머로 대령이 {name}을(를) 본다. 따라올 테냐고.',
    doors: [
      { label: '대령의 군함에 오른다', hint: '명령서 없는 추격이다. 위대한 항로의 바다를 본다', values: { justice: D },
        fx: [{ op: 'move', island: '리버스 마운틴', sea: 'gl_entry' }, { op: 'person', kind: 'ally', relation: '시가 두 대의 대령', canon: 'smoker' },
             { op: 'log', text: '흰 연기를 뿜는 대령을 따라 붉은 산을 넘었다.', weight: 'heavy' }, { op: 'timeline', text: '스모커 대령을 따라 위대한 항로에 들어섰다' }] },
      { label: '이스트 블루의 지부에 남는다', hint: '대령은 고개만 끄덕인다. 지부의 일은 누군가 해야 한다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '고개를 끄덕인 대령', canon: 'smoker' }, { op: 'log', text: "스모커의 군함이 떠난 뒤 지부의 빈 초소를 맡았다. 대령은 출항 직전 짧게 고개를 끄덕였다.", weight: 'light' }] },
      { label: '본부에 대령의 무단 출항을 보고한다', hint: '규정은 지킨다. 대령의 눈길이 싸늘하다', values: { ambition: D },
        fx: [{ op: 'fame', add: 3 }, { op: 'person', kind: 'rival', relation: '보고를 올린 일을 잊지 않는 대령', canon: 'smoker' }, { op: 'log', text: "본부에 무단 출항 보고서가 올라갔다. 스모커는 시가 연기 너머로 {name}을(를) 보고 차갑게 돌아섰다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_galley_invite', kind: 'door', when: at(age(20, 50), st('shipwright'), sea('east'), { c: 'standingYears', min: 2 }),
    weight: 5, repeat: 'once', speaker: { relation: '갈레라 컴퍼니의 직공장' },
    title: '물의 도시에서 온 편지', body: '위대한 항로의 조선 도시 워터 세븐에서 편지가 왔다. 세계 제일의 조선 회사가 {name}의 솜씨를 들었다며 직공으로 오라고 한다. 이스트 블루의 조선소와는 배의 크기부터 다르다.',
    doors: [
      { label: '물의 도시로 간다', hint: '세계 제일의 조선소에서 일한다. 이스트 블루를 떠난다', values: { ambition: D },
        fx: [{ op: 'move', island: '워터 세븐', sea: 'gl_first' }, { op: 'base', key: 'int', add: 1 },
             { op: 'log', text: '바다 위에 떠 있는 물의 도시에 내렸다. 수로마다 배가 지나갔다.', weight: 'heavy' }, { op: 'timeline', text: '워터 세븐의 조선 회사로 갔다' }] },
      { label: '이 조선소를 지키겠다고 답장한다', hint: '익숙한 망치 소리 곁에 남는다', values: { loyalty: D }, closes: true, fx: [{ op: 'base', key: 'wil', add: 1 }, { op: 'log', text: "워터 세븐의 초청장 뒤에 거절의 답장을 적었다. 다음 날도 이스트 블루 조선소에서 같은 배의 용골을 맞췄다.", weight: 'light' }] },
      { label: '손이 좋은 제자를 대신 보낸다', hint: '제자의 앞길을 연다. 제 기회는 거기서 접는다', values: { justice: D }, closes: true,
        fx: [{ op: 'person', kind: 'ally', relation: '물의 도시로 간 제자', age: { younger: 12 } }, { op: 'log', text: "제자의 손으로 쓴 지원서를 초청장에 넣어 보냈다. 떠나는 배에서 제자가 망치를 들어 마지막 인사를 했다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_merchant_hire', kind: 'door', when: at(age(16, 35), st('civil'), sea('east')),
    weight: 4, repeat: 'once', speaker: { relation: '상선의 선장' },
    title: '사막 왕국행 상선', body: '{island}에 위대한 항로의 사막 왕국으로 가는 큰 상선이 들어왔다. 갑판 일꾼을 구한다고 한다. 품삯은 이 바다의 세 배, 돌아오는 배편은 약속할 수 없다고.',
    doors: [
      { label: '갑판 일꾼으로 오른다', hint: '모르는 바다로 간다. 품삯이 두둑하다', values: { romance: D }, 
        fx: [{ op: 'money', add: 15000 }, { op: 'move', island: '알라바스타 왕국', sea: 'gl_first' },
             { op: 'log', text: '상선은 모래바람 부는 왕국의 항구에 닻을 내렸다. 품삯을 받고 배에서 내렸다.', weight: 'heavy' }, { op: 'timeline', text: '상선의 일꾼이 되어 위대한 항로로 갔다' }] },
      { label: '선장에게 장사 밑천을 대고 몫을 받기로 한다', hint: '저는 남고 돈만 보낸다. 배가 돌아올지는 모른다', values: { ambition: D },
        fx: [{ op: 'money', add: -15000 }, { op: 'chance', p: 0.5, then: [{ op: 'money', add: 40000 }, { op: 'log', text: '반년 뒤 상선이 돌아와 몫을 두 배로 쳐주었다.', weight: 'light' }],
               else: [{ op: 'log', text: '약속한 철이 지나도 상선은 돌아오지 않았다. 선장에게 맡긴 장사 밑천의 행방을 물을 사람도 없었다.', weight: 'light' }] }] },
      { label: '배에 오르려는 동네 아이를 붙잡아 말린다', hint: '아이는 원망한다. 그 상선이 돌아올지 아무도 모른다', values: { romance: D },
        fx: [{ op: 'person', kind: 'ally', relation: '바다로 가려던 동네 아이', age: { younger: 6 } }, { op: 'log', text: "동네 아이를 배에서 내려오게 하자 아이가 소매를 뿌리쳤다. 상선은 그날 밤 바람을 맞고 떠났다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_rev_call', kind: 'door', when: at(age(17, 45), st('revolution'), sea('east'), { c: 'standingYears', min: 1 }),
    weight: 5, repeat: 'once', speaker: { relation: '혁명군의 전령' },
    title: '본부의 부름', body: '혁명군의 전령이 쪽지를 내민다. 위대한 항로의 거점에 사람이 모자란다고, 이스트 블루의 일은 다른 동지에게 맡기고 오라는 명령이다.',
    doors: [
      { label: '명령대로 위대한 항로로 간다', hint: '더 큰 싸움으로 간다. 이 바다의 동지들과 헤어진다', values: { loyalty: D },
        fx: [{ op: 'move', island: '자야', sea: 'gl_first' }, { op: 'log', text: '혁명군의 배를 갈아타며 위대한 항로 깊숙이 들어갔다.', weight: 'heavy' },
             { op: 'timeline', text: '혁명군 본부의 부름을 받아 위대한 항로로 갔다' }] },
      { label: '이 바다에서 키운 조직을 두고 갈 수 없다고 답한다', hint: '명령을 어긴다. 이 바다의 동지들은 {name}을(를) 믿는다', values: { peace: D },
        fx: [{ op: 'hardship', add: 1 }, { op: 'person', kind: 'ally', relation: '이스트 블루의 동지' }, { op: 'log', text: "밀사에게 이스트 블루의 동지들 곁에 남겠다고 답했다. 명령서는 접혔고 조직의 사람들이 계속 {name}을(를) 찾아왔다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_calm_belt', kind: 'door', when: at(age(18, 45), st('pirate', 'bountyHunter', 'revolution'), sea('east'), { c: 'standingYears', min: 2 }),
    weight: 3, repeat: 'once', speaker: 'hero',
    title: '바람 없는 바다', body: '붉은 산을 돌아가지 않고 곧장 위대한 항로로 들어가는 길이 있다. 바람 한 점 없는 바다, 바다왕들의 둥지 칼름벨트를 가로지르는 것이다. 미친 짓이라고 모두가 말린다.',
    doors: [
      { label: '노를 저어 칼름벨트를 가로지른다', hint: '바다왕이 깨어나면 배째로 삼켜진다', values: { freedom: D }, special: 'freedom', danger: true,
        fx: [{ op: 'hp', add: -30 }, { op: 'fame', add: 20 }, { op: 'move', island: '알라바스타 왕국', sea: 'gl_first' },
             { op: 'chance', p: 0.3, then: [{ op: 'injury', severity: 'heavy' }, { op: 'log', text: '노를 젓던 팔이 바다왕의 지느러미에 깊이 찢겼다. 동료가 노를 이어 잡아 겨우 물길을 벗어났다.', weight: 'heavy' }],
               else: [{ op: 'log', text: '바다왕이 선체 아래를 지나가자 모두 숨을 죽였다. 노를 놓지 않은 끝에 바람이 다시 부는 바다에 닿았다.', weight: 'light' }] },
             { op: 'log', text: '바다왕의 등 위를 미끄러지듯 지나갔다. 소문이 먼저 위대한 항로에 닿았다.', weight: 'heavy' }, { op: 'timeline', text: '칼름벨트를 가로질러 위대한 항로에 들어섰다' }] },
      { label: '남들처럼 붉은 산으로 돌아간다', hint: '시간은 걸리지만 살아서 간다', values: { peace: D },
        fx: [{ op: 'move', island: '리버스 마운틴', sea: 'gl_entry' }, { op: 'timeline', text: '붉은 산을 넘어 위대한 항로에 들어섰다' }, { op: 'log', text: "무풍 지대의 바다뱀을 피해 배를 돌렸다. 시간이 더 걸렸지만 붉은 산의 물길을 넘어 위대한 항로 입구에 닿았다.", weight: 'light' }] },
      { label: '이 바다에 남는다', hint: '아직은 때가 아니다', fx: [{ op: 'log', text: "선원들에게 닻을 내리게 했다. 무풍 지대의 어두운 수평선을 접고 익숙한 바다의 항구로 돌아갔다.", weight: 'light' }] },
    ],
  },
];

export const SEA_RETURN: Turning[] = [
  // ---------------------------------------------------------------- 이스트 블루로 돌아오는 길
  {
    id: 'sea_back_broke', kind: 'door', when: at(home('loguetown'), age(18, 55), st(...SEAFARING, 'civil'), sea('gl_entry', 'gl_first')),
    weight: 3, repeat: 'once', speaker: 'hero',
    title: '빈손의 항구', body: '위대한 항로에서 가진 것을 다 잃었다. {island}의 항구에 이스트 블루로 가는 상선이 있다. 선장은 갑판 일을 하면 뱃삯을 받지 않겠다고 한다.',
    doors: [
      { label: '상선을 얻어 타고 이스트 블루로 돌아간다', hint: '바다 위의 식당에 내려 다시 시작한다', values: { peace: D },
        fx: [{ op: 'move', island: '해상 레스토랑 발라티에', sea: 'east' }, { op: 'log', text: '바다 위의 식당에 내렸다. 요리사들의 고함이 이렇게 반가울 줄 몰랐다.', weight: 'heavy' },
             { op: 'timeline', text: '빈손으로 이스트 블루에 돌아왔다' }] },
      { label: '이 바다에서 맨손으로 다시 일어선다', hint: '돌아가지 않는다. 몇 해는 바닥에서 버틴다', mark: 'unyielding', values: { ambition: D },
        fx: [{ op: 'hp', add: -10 }, { op: 'base', key: 'wil', add: 1 }, { op: 'log', text: "부서진 배에서 건진 도구로 항구 일을 다시 구했다. 손은 상했지만 며칠 뒤 다시 배를 고칠 수 있었다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_escort_east', kind: 'door', when: at(home('loguetown'), age(18, 55), st('bountyHunter', 'pirate', 'civil', 'revolution'), sea('gl_entry', 'gl_first')),
    weight: 3, repeat: 'once', speaker: { relation: '귤을 사러 온 상인' },
    title: '이스트 블루까지의 호위', body: '{island}에서 이스트 블루의 섬들과 장사하는 상인이 호위를 구한다. 코노미 제도의 귤을 사러 간다고, 붉은 산을 다시 넘는 동안만 지켜 주면 넉넉히 치르겠다고 한다.',
    doors: [
      { label: '호위를 맡아 이스트 블루로 간다', hint: '돈을 받고 옛 바다로 돌아간다', values: { loyalty: D },
        fx: [{ op: 'money', add: 20000 }, { op: 'move', island: '코노미 제도', sea: 'east' }, { op: 'log', text: '귤 향기가 나는 섬에서 상인과 헤어졌다. 이스트 블루의 바람은 순했다.', weight: 'heavy' },
             { op: 'timeline', text: '상선을 호위해 이스트 블루로 돌아왔다' }] },
      { label: '뱃길에서 상인의 짐을 가로챈다', hint: '돌아갈 필요가 없다. 상인의 비명이 남는다', values: { greed: D }, 
        fx: [{ op: 'money', add: 52000 }, { op: 'hardship', add: 2 }, { op: 'person', kind: 'enemy', relation: '짐을 빼앗긴 상인' }, { op: 'log', text: "호위하던 상선의 짐을 제 배에 옮겼다. 상인은 빈 갑판에서 이름을 외쳤고 두 배는 다른 항로로 갈라졌다.", weight: 'light' }] },
      { label: '돌아갈 생각이 없다며 거절한다', hint: '이 바다의 일을 계속한다', fx: [{ op: 'log', text: "상인의 제안을 거절하고 항구에 남았다. 동쪽으로 가는 배가 떠난 뒤 평소 하던 일터로 돌아갔다.", weight: 'light' }] },
    ],
  },
  {
    id: 'sea_ashes_home', kind: 'door', when: at(home('loguetown'), age(19, 60), st(...SEAFARING, 'civil', 'shipwright'), sea(...GL_SEAS)),
    weight: 2, repeat: 'once', speaker: 'hero',
    title: '고향에 묻어 달라던 말', body: '함께 이스트 블루를 떠나온 옛 동무가 {island}에서 숨을 거두었다. 시럽 마을의 언덕에 묻어 달라는 것이 마지막 말이었다. 유골함이 가볍다.',
    doors: [
      { label: '유골함을 안고 이스트 블루로 돌아간다', hint: '먼 뱃길을 거슬러 간다. 하던 일은 멈춘다', values: { loyalty: D },
        fx: [{ op: 'move', island: '시럽 마을', sea: 'east' }, { op: 'hardship', add: 2 },
             { op: 'log', text: '언덕 위 바다가 보이는 곳에 동무를 묻었다. 마을 아이 하나가 무덤 앞에 꽃을 놓고 갔다.', weight: 'heavy' },
             { op: 'timeline', text: '옛 동무의 유골을 안고 이스트 블루에 돌아왔다' }] },
      { label: '동무가 좋아하던 바다에 뿌린다', hint: '부탁을 저버린다. 그래도 이 바다가 더 어울린다고 여긴다', values: { romance: D },
        fx: [{ op: 'hardship', add: 1 }, { op: 'log', text: "동무가 좋아하던 바다에 재를 뿌렸다. 유골함이 비었는데도 고향에 데려가 달라던 부탁은 오래 남았다.", weight: 'light' }] },
      { label: '이스트 블루로 가는 상선에 돈을 주고 맡긴다', hint: '제 걸음은 멈추지 않는다', values: { ambition: D },
        fx: [{ op: 'money', add: -10000 }, { op: 'log', text: "이스트 블루행 상선의 선장에게 뱃삯과 유골함을 건넸다. 배가 떠난 뒤 자신의 항해를 이어 갔다.", weight: 'light' }] },
    ],
  },
];
