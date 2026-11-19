// 원작과 겹치는 순간 (과제 10). 원작 인물이 말하는 전환점. 로그타운에서 태어난 사람에게 열린다.
// 주인공은 루피와 같은 세대다. 주인공이 열일곱 살 무렵 원작이 시작된다(밀짚모자가 바다에 나온다).
// 그 전의 만남은 유년기에 자란 마을에서, 그 뒤의 만남은 원작의 때(나이)와 그 바다에서 온다.
// 주인공은 원작의 결말을 바꾸지 않는다: 밀짚모자의 싸움은 밀짚모자가 끝내고, 주인공은 그 곁에서 제 몫을 고른다.
// 이스트 블루의 원작 상대(버기, 쿠로, 크리크, 알비다)는 foes.ts에 있다. 맞서는 문은 경지가 있어야 열린다.
// 마을에서 오는 순간(유년기)은 town · island 조건을, 원작이 시작된 뒤의 순간은 sea 조건을 쓴다.
// 문의 말에는 가치관 이름도 숫자도 쓰지 않는다. 자리표시: {name} 이름만, {town} 태어난 마을, {island} 지금 있는 섬.
import { V } from '../balance';
import { age, at, sea, st } from './paths';
import type { Cond, Door, Turning, Values } from '../../core/types';

const D = V.value.door;
const town = (name: string): Cond[] => [{ c: 'town', is: [name] }, { c: 'island', is: [name] }];
const on = (name: string): Cond => ({ c: 'island', is: [name] });
const not = (id: string): Cond => ({ c: 'flag', id, has: false });
const READY = (min: number): Cond[] => [{ c: 'tier', branch: 'any', min }];
const fightDoor = (label: string, hint: string, values: Partial<Values>, foe: string, when?: Cond[]): Door =>
  ({ label, hint, values, danger: true, when, fx: [{ op: 'fight', foe, lethal: true, forced: false }] });
const duelDoor = (label: string, hint: string, values: Partial<Values>, foe: string, when?: Cond[]): Door =>
  ({ label, hint, values, danger: true, when, fx: [{ op: 'fight', foe, lethal: false, forced: false }] });
/** 아직 고향에 있는 아이 */
const KID = st('child');
/** 원작이 시작될 무렵 이스트 블루를 다니는 사람 */
const EAST_AROUND = st('civil', 'pirate', 'marine', 'bountyHunter', 'shipwright', 'settled', 'revolution');

const BEFORE: Turning[] = [
  // ---------------------------------------------------------------- 원작이 시작되기 전 (유년기)
  {
    // v4 cc_ace_thugs. 에이스는 주인공보다 세 살 위, 주인공이 열네 살 때 바다로 떠난다
    id: 'cn_ace_thugs', kind: 'door', when: at(age(10, 14), KID, not('left_home_young'), { c: 'town', is: ['후샤 마을', '고아 왕국 그레이 터미널'] }, { c: 'island', is: ['후샤 마을', '고아 왕국 그레이 터미널'] }),
    weight: 8, repeat: 'once', speaker: { canon: 'ace' },
    title: '쇠파이프의 소년', body: '그레이 터미널 어귀에서 어른 불량배 다섯이 주근깨 소년 하나를 둘러쌌다. 소년은 쇠파이프를 고쳐 쥐고 한 발도 물러서지 않는다. 눈이 마주치자 소년이 소리친다. 구경할 거면 꺼지라고.',
    doors: [
      { label: '돌을 집어 들고 소년의 등 뒤에 선다', hint: '어린 주먹 둘로 어른 다섯을 상대한다. 이기든 지든 그 소년이 {name}을(를) 기억한다', values: { loyalty: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '쇠파이프의 소년', canon: 'ace' },
             { op: 'log', text: '불량배들이 달아난 뒤, 소년은 고맙다는 말 대신 제 몫의 고기를 반 뜯어 던졌다.', weight: 'heavy' }] },
      { label: '숲으로 달려가 산적 일가를 부른다', hint: '어른들이 오기 전에 끝날 수도 있다. 다치지는 않는다', values: { loyalty: D },
        fx: [{ op: 'chance', p: 0.5, then: [{ op: "log", text: "산적들이 달려왔을 때 소년은 아직 쇠파이프를 휘두르고 있었다. 어른들이 불량배를 쫓아내자 소년이 흙투성이 얼굴로 쳐다보았다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '주근깨 소년', canon: 'ace' }],
               else: [{ op: 'log', text: '산적들을 끌고 돌아왔을 때 소년은 이미 혼자 불량배들을 눕혀 놓고 사라진 뒤였다.', weight: 'light' }] }] },
      { label: '소년과 불량배 누가 이기나 내기를 건다', hint: '구경꾼들 사이에서 몇 푼을 번다. 소년의 눈길이 차갑다', values: { greed: D }, 
        fx: [{ op: "log", text: "구경꾼들이 동전을 건넸다. 주근깨 소년은 불량배를 쓰러뜨리고도 {name}을(를) 차갑게 노려보았다.", weight: "light" }, { op: 'money', add: 2000 }, { op: 'person', kind: 'rival', relation: '구경꾼을 노려보던 소년', canon: 'ace' }] },
    ],
  },
  {
    // 사보의 가출. 주인공이 열 살 무렵. 성벽 안 귀족 집 아이만
    id: 'cn_sabo_wall', kind: 'door', when: at(age(9, 12), KID, not('left_home_young'), ...town('고아 왕국 그레이 터미널'), { c: 'wealth', min: 'comfortable' }),
    weight: 8, repeat: 'once', speaker: { canon: 'sabo' },
    title: '담을 넘는 도련님', body: '밤중에 귀족 거리의 담장 위에서 모자를 쓴 소년과 눈이 마주쳤다. 이웃 귀족 집 외아들이다. 소년은 손가락을 입술에 대더니, 이 집에서는 숨이 막혀 못 살겠다고 속삭인다.',
    doors: [
      { label: '못 본 척 창문을 닫는다', hint: '소년의 비밀을 지킨다. 다음 날 아침 귀족 거리가 발칵 뒤집힌다', values: { loyalty: D },
        fx: [{ op: "log", text: "창문을 닫자 담장 너머 발소리가 멀어졌다. 다음 날 귀족들이 사라진 도련님을 찾아 거리를 뒤졌다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '담을 넘던 도련님', canon: 'sabo' }, { op: 'flag', id: 'sawSabo' }] },
      { label: '소년의 아버지에게 알린다', hint: '소년은 끌려 들어가고, {name}의 집은 칭찬을 받는다', values: { ambition: D },
        fx: [{ op: "log", text: "소년의 아버지가 경비를 데리고 달려왔다. 붙잡혀 끌려가는 소년이 담장 위에서 {name}을(를) 돌아보았다.", weight: "light" }, { op: 'money', add: 5000 }, { op: 'person', kind: 'rival', relation: '담장의 도련님', canon: 'sabo' }] },
      { label: '창틀을 넘어 소년을 따라간다', hint: '성벽 밖의 밤을 처음 본다. 들키면 집에 갇힌다', values: { freedom: D }, mark: 'rebel', danger: true,
        fx: [{ op: 'person', kind: 'ally', relation: '성벽 밖을 보여 준 도련님', canon: 'sabo' },
             { op: 'chance', p: 0.4, then: [{ op: 'flag', id: 'grounded' }, { op: 'log', text: '새벽에 담을 넘다 들켰다. 한 해 동안 성문 밖에 나가지 못했다.', weight: 'light' }],
               else: [{ op: 'log', text: '쓰레기 산의 불빛 아래서 소년이 꿈을 이야기했다. 자유롭게 바다에 나가겠다고.', weight: 'heavy' }] }] },
    ],
  },
  {
    // 가프가 손자를 산적 일가에 맡기러 들른다
    id: 'cn_garp_fusha', kind: 'door', when: at(age(8, 13), KID, not('left_home_young'), ...town('후샤 마을')),
    weight: 8, repeat: 'once', speaker: { canon: 'garp' },
    title: '해군 영웅의 주먹', body: '군함이 후샤 마을 부두에 닿고, 해군 영웅 가프가 내렸다. 손자 녀석을 찾는다며 마을을 휘젓더니 {name}을(를) 보고 멈춰 선다. 다부진 녀석이라며, 해군이 되겠다면 지금부터 단련해 주겠다고 한다.',
    doors: [
      { label: '해군이 되겠다고 가슴을 편다', hint: '그 자리에서 산길 달리기와 주먹 세례가 시작된다. 몸이 남아나지 않는다', values: { justice: D }, mark: 'unyielding',
        fx: [{ op: "log", text: "가프가 웃으며 산길로 내몰았다. 돌아왔을 때는 다리가 풀렸지만, 영웅은 주먹을 다시 들어 올렸다.", weight: "light" }, { op: 'hp', add: -15 }, { op: 'mastery', branch: 'fist', add: 10 }, { op: 'person', kind: 'ally', relation: '주먹이 무거운 해군 영웅', canon: 'garp' }, { op: 'flag', id: 'garpPromise' }] },
      { label: '해적이 될 거라고 대꾸한다', hint: '사랑의 주먹이 정수리에 떨어진다. 영웅은 웃으며 녀석들은 다 똑같다고 한다', values: { freedom: D }, mark: 'rebel',
        fx: [{ op: "log", text: "가프의 주먹에 정수리가 울렸다. 그는 해적이 되겠다는 말을 듣고도 손자를 떠올린 듯 껄껄 웃었다.", weight: "light" }, { op: 'hp', add: -10 }, { op: 'person', kind: 'ally', relation: '꿀밤을 먹인 해군 영웅', canon: 'garp' }] },
      { label: '손자가 숨은 산길을 알려 주고 센베이를 얻는다', hint: '영웅은 기뻐하고, 산속의 손자는 {name}을(를) 고자질쟁이로 기억한다', values: { greed: D }, 
        fx: [{ op: "log", text: "가프는 산길을 듣자마자 센베이를 쥐여 주고 뛰어갔다. 산 위에서 손자의 성난 고함이 내려왔다.", weight: "light" }, { op: 'money', add: 2000 }, { op: 'flag', id: 'toldGarp' }] },
    ],
  },
];

const EAST_ARC: Turning[] = [
  // ---------------------------------------------------------------- 원작이 시작된 무렵의 이스트 블루 (열여섯 ~ 열아홉)
  {
    // v4 cc_luffy_meat. 처형대 이전의 만남 (path_follow_luffy와 겹치지 않게)
    id: 'cn_luffy_meat', kind: 'door', when: at(age(16, 17), EAST_AROUND, sea('east'), not('sawLuffy')),
    weight: 7, repeat: 'once', speaker: { canon: 'luffy' },
    title: '고기를 노리는 소년', body: '{island}의 노점에서 고기 한 덩이를 사 들었더니, 밀짚모자를 쓴 소년이 침을 흘리며 따라온다. 작은 배 하나로 해적왕이 되러 간다고, 함께 갈 사람을 찾는 중이라고 웃는다.',
    doors: [
      { label: '고기를 반 나눠 주고 꿈 이야기를 듣는다', hint: '해 질 때까지 이야기한다. 그 웃음이 오래 남는다', values: { romance: D }, 
        fx: [{ op: "log", text: "소년은 고기를 반쯤 입에 넣은 채 해적왕이 되겠다고 했다. 해가 질 때까지 배와 동료 이야기가 이어졌다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '고기를 나눠 먹은 밀짚모자 소년', canon: 'luffy' }, { op: 'flag', id: 'metLuffy' }] },
      { label: '그 작은 배에 같이 탄다', hint: '몇 섬을 함께 건넌다. 제 길은 제가 정해야 한다는 것도 배운다', values: { romance: D }, danger: true,
        fx: [{ op: 'person', kind: 'ally', relation: '몇 섬을 함께 간 밀짚모자 소년', canon: 'luffy' }, { op: 'hp', add: -10 }, { op: 'mastery', branch: 'observation', add: 5 },
             { op: 'log', text: '밀짚모자의 작은 배로 섬 둘을 건넜다. 소용돌이를 빠져나온 다음 날, 각자의 바다로 갈라졌다.', weight: 'heavy' }] },
      { label: '고기는 못 준다며 등을 돌린다', hint: '소년은 아쉬워하며 다른 냄새를 쫓아간다. 별일은 없다', 
        fx: [{ op: "log", text: "고기를 꼭 쥐고 돌아서자 소년은 다른 노점의 냄새를 맡고 달려갔다. 밀짚모자가 인파 속으로 사라졌다.", weight: "light" }, { op: 'flag', id: 'metLuffy' }] },
    ],
  },
  {
    id: 'cn_coby_alvida', kind: 'door', when: at(age(16, 17), EAST_AROUND, sea('east')),
    weight: 6, repeat: 'once', speaker: { canon: 'coby' },
    title: '해적선의 잡일꾼', body: '{island} 앞바다에 알비다 해적단의 배가 닻을 내렸다. 갑판을 닦는 분홍 머리 소년이 몰래 {name}의 소매를 잡는다. 두 해째 붙잡혀 잡일을 하는데, 사실은 해군이 되고 싶다고 떨리는 목소리로 말한다.',
    doors: [
      { label: '밤에 작은 배를 대어 소년을 빼낸다', hint: '알비다의 쇠몽둥이가 쫓아올 수 있다', values: { justice: D }, danger: true,
        fx: [{ op: 'chance', p: 0.65, then: [{ op: "log", text: "소년이 작은 배에 뛰어올랐다. 둘이 노를 저어 해적선의 불빛을 벗어나자 그가 처음으로 해군의 제복을 입고 싶다고 또렷이 말했다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '해적선에서 빼낸 분홍 머리 소년', canon: 'coby' }, { op: 'fame', add: 2 }],
               else: [{ op: 'hp', add: -20 }, { op: 'log', text: '알비다의 쇠몽둥이에 갑판 너머로 날아갔다. 소년은 그날 밤 다른 누군가의 손에 풀려났다고 들었다.', weight: 'heavy' }] }] },
      duelDoor('알비다에게 소년을 걸고 겨루자고 한다', '이기면 소년을 데려가고, 지면 같은 갑판을 닦는다', { justice: D }, 'b_alvida', READY(1)),
      { label: '해군이 되고 싶으면 제 발로 뛰어내리라고 한다', hint: '손은 빌려주지 않는다. 소년이 스스로 해낼지는 모른다', values: { freedom: D },
        fx: [{ op: "log", text: "코비는 난간 아래의 작은 배를 한참 내려다보았다. 떨리는 손으로 밧줄을 붙잡고 스스로 내려가기 시작했다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '뛰어내리라던 말을 기억하는 소년', canon: 'coby' }] },
    ],
  },
  {
    // 셸스 타운. 조로가 모건의 기지 마당에 묶여 있다. 그 마을에 사는 사람만
    id: 'cn_zoro_stake', kind: 'door', when: at(age(16, 18), st('child', 'civil', 'settled', 'shipwright'), ...town('셸스 타운')),
    weight: 8, repeat: 'once', speaker: { canon: 'zoro' },
    title: '기지 마당의 사내', body: '모건 대령의 기지 마당에 초록 머리 사내가 기둥에 묶여 있다. 대령 집 도련님이 풀어놓은 늑대에게서 마을 아이를 지켜 준 죄라고 한다. 한 달 굶으면 풀어 준다는데, 벌써 아흐레째다.',
    doors: [
      { label: '담 너머로 주먹밥을 던져 준다', hint: '들키면 같은 마당에 묶인다. 사내는 흙 묻은 밥도 남김없이 먹는다', values: { romance: D }, danger: true,
        fx: [{ op: 'person', kind: 'ally', relation: '주먹밥을 얻어먹은 검객', canon: 'zoro' },
             { op: 'chance', p: 0.3, then: [{ op: 'hp', add: -15 }, { op: 'log', text: '보초에게 들켜 기지 뒤뜰에서 매를 맞았다.', weight: 'light' }] , else: [{ op: "log", text: "보초가 돌아오기 전에 주먹밥이 기둥 옆에 떨어졌다. 검객은 흙을 털지도 않고 다 먹었다.", weight: "light" }]}] },
      { label: '대령 집 도련님이 한 짓을 마을 사람들 앞에서 떠든다', hint: '아무도 대꾸하지 않는다. 대령의 귀에 들어간다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: "log", text: "광장에 모인 사람들은 대답하지 않았지만 도련님이 지나가자 수군거렸다. 그날부터 기지 보초가 {name}의 집 앞을 지켰다.", weight: "light" }, { op: 'flag', id: 'baseGrudge' }, { op: 'hardship', add: 1 }] },
      { label: '사내에게 칼 쓰는 법을 묻는다', hint: '묶인 사내가 웃는다. 굶은 목소리로도 말은 짧고 정확하다', values: { inquiry: D },
        fx: [{ op: "log", text: "묶인 검객은 칼을 쥘 손의 각도부터 바로잡았다. 굶은 채로도 틀린 자세는 단번에 알아챘다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 6 }, { op: 'person', kind: 'rival', relation: '기둥에 묶여 있던 검객', canon: 'zoro' }] },
    ],
  },
  {
    // 오렌지 마을. 버기가 마을을 차지했다. 그 마을에 사는 사람만
    id: 'cn_buggy_orange', kind: 'door', when: at(age(16, 18), st('child', 'civil', 'settled', 'shipwright'), sea('east'), ...town('오렌지 마을')),
    weight: 7, repeat: 'once', speaker: { canon: 'buggy' },
    title: '광대 해적단의 대포', body: '오렌지 마을 광장에 서커스 북이 울렸다. 외발자전거가 천막을 한 바퀴 돌고, 버기의 흰 장갑 한 짝이 손목에서 떨어져 나와 관객에게 박수를 재촉했다. 도망간 사람들 대신 사자만 앞발을 쳤다. 버기가 심지에 불을 붙이자 집 한 채가 통째로 날아갔다. 부들 촌장이 창을 들고 빈 객석을 가로질렀다.',
    doors: [
      fightDoor('촌장 앞을 막고 광대 선장에게 맞선다', '몸이 토막 나는 선장이다. 목숨을 건 싸움이 된다', { justice: D }, 'b_buggy', READY(1)),
      { label: '촌장을 끌어안고 언덕으로 데려간다', hint: '촌장은 화를 내며 버둥거린다. 둘 다 산다', values: { justice: D },
        fx: [{ op: 'hp', add: -8 }, { op: 'log', text: '언덕 위에서 촌장은 한참 울었다. 그날 저녁, 밀짚모자의 소년이 광대 선장을 하늘로 날려 보냈다는 소식이 왔다.', weight: 'heavy' },
             { op: 'timeline', text: '광대 해적단이 오렌지 마을을 차지한 날, 촌장을 언덕으로 데려갔다', canon: 'buggy' }] },
      { label: '광대 해적단의 잡일을 거들고 품삯을 받는다', hint: '마을을 턴 해적들 밑에서 일한다. 마을 사람들이 {name}을(를) 보지 않는다', values: { greed: D },
        fx: [{ op: "log", text: "버기의 부하가 품삯을 던져 주었다. 언덕에서 내려온 마을 사람들은 털린 집을 지나며 {name}을(를) 피했다.", weight: "light" }, { op: 'money', add: 8000 }, { op: 'hardship', add: 1 }, { op: 'person', kind: 'ally', relation: '품삯을 준 광대 선장', canon: 'buggy' },
             { op: 'timeline', text: '광대 해적단이 마을을 차지한 날, 그 밑에서 잡일을 했다', canon: 'buggy' }] },
    ],
  },
  {
    // 시럽 마을. 집사 클라하도르의 정체가 드러나는 밤. 그 마을에 사는 사람만
    id: 'cn_kuro_slope', kind: 'door', when: at(age(16, 18), st('child', 'civil', 'settled', 'shipwright'), sea('east'), ...town('시럽 마을')),
    weight: 8, repeat: 'once', speaker: { canon: 'usopp' },
    title: '해적이 온다는 마지막 거짓말', body: '우솝이 또 해적이 쳐들어온다고 외치며 마을을 달린다. 이번에는 얼굴이 하얗다. 저택의 집사가 해적이었다고, 내일 새벽 북쪽 해안으로 해적들이 올라온다고. 마을 사람들은 빗자루를 들고 그를 쫓는다.',
    doors: [
      { label: '우솝과 함께 북쪽 언덕길에 기름을 뿌린다', hint: '아무도 믿지 않는 싸움에 낀다. 새벽에 무엇이 올라올지 모른다', values: { loyalty: D }, mark: 'fellowship', danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '언덕을 함께 지킨 거짓말쟁이', canon: 'usopp' },
             { op: 'log', text: '새벽 언덕에서 해적들이 미끄러졌다. 그 뒤의 일은 밀짚모자를 쓴 소년이 끝냈다. 마을은 그날 밤 아무 일도 없었던 줄 안다.', weight: 'heavy' }] },
      duelDoor('저택으로 가서 집사의 앞을 막아선다', '안경을 밀어 올리는 손이 칼날처럼 빠르다', { justice: D }, 'b_kuro', READY(1)),
      { label: '저택의 아가씨에게 몰래 알리러 간다', hint: '아가씨는 믿지 않을 수도 있다. 저택의 경비에게 쫓겨날 수도 있다', values: { justice: D },
        fx: [{ op: 'person', kind: 'ally', relation: '저택의 아가씨', canon: 'kaya' }, { op: 'chance', p: 0.5, then: [{ op: "log", text: "저택의 아가씨는 떨리는 손으로 문을 열고 우솝의 말을 다시 들었다. 새벽이 되기 전 창문마다 빗장이 걸렸다.", weight: "light" }, { op: 'hp', add: -5 }] , else: [{ op: "log", text: "경비가 말을 끊고 문밖으로 밀어냈다. 저택 안에서는 아무도 북쪽 해안의 경고를 듣지 않았다.", weight: "light" }]}] },
    ],
  },
  {
    // 해상 레스토랑 발라티에에 굶주린 크리크 함대가 온다
    id: 'cn_baratie_krieg', kind: 'door', when: at(age(16, 19), EAST_AROUND, sea('east')),
    weight: 6, repeat: 'once', speaker: { canon: 'sanji' },
    title: '굶주린 함대', body: '발라티에에서 접시를 받던 날, 너덜너덜한 거대 함선이 식당에 닿았다. 굶주린 해적 함대의 제독이 밥을 내놓으라며 총을 겨눈다. 금발의 요리사는 묵묵히 쌀밥을 볶는다. 굶은 사람은 누구든 먹인다고.',
    doors: [
      fightDoor('제독의 총구 앞에 선다', '온몸이 무기인 함대의 제독이다. 목숨을 건 싸움이 된다', { dominion: D }, 'b_krieg', READY(1)),
      { label: '요리사를 도와 굶은 해적들에게 밥을 나른다', hint: '적에게 밥을 먹이는 일이다. 손님들의 눈총을 받는다', values: { peace: D },
        fx: [{ op: "log", text: "굶주린 해적들이 접시를 빼앗듯 받아 들었다. 상디는 손님들의 눈총에도 다음 냄비를 끓이라고 했다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '굶은 이는 누구든 먹이던 요리사', canon: 'sanji' }, { op: 'base', key: 'vit', add: 1 },
             { op: 'timeline', text: '발라티에에서 굶주린 해적들에게 밥을 날랐다', canon: 'sanji' }] },
      { label: '거대 함선을 반으로 가른 검사의 칼끝을 지켜본다', hint: '세계 최강의 검이 무엇인지 본다. 숨을 쉬는 것도 잊는다', values: { inquiry: D },
        fx: [{ op: 'mastery', branch: 'sword', add: 8 }, { op: 'flag', id: 'sawMihawk' },
             { op: 'log', text: '매의 눈을 한 검사가 칼 한 번으로 거대 함선을 갈랐다. 그 칼날이 꿈에 나왔다.', weight: 'heavy' },
             { op: 'timeline', text: '발라티에에서 세계 최강의 검을 보았다', canon: 'mihawk' }] },
    ],
  },
  {
    // 코코야시 마을. 밀짚모자가 아론 파크로 간다. 그 마을에 사는 사람만
    id: 'cn_arlong_park', kind: 'door', when: at(age(16, 18), st('child', 'civil', 'settled', 'shipwright'), ...town('코코야시 마을')),
    weight: 8, repeat: 'once', speaker: { canon: 'nami' },
    title: '여덟 해의 끝', body: '나미가 제 어깨의 문신을 칼로 찌르며 울었다. 여덟 해를 모은 돈은 해군에게 빼앗겼다. 밀짚모자를 쓴 소년이 제 모자를 그녀에게 씌워 주고 아론 파크로 걸어간다. 마을 사람들이 무기를 들고 그 뒤를 따른다.',
    doors: [
      { label: '마을 사람들과 아론 파크 문 앞까지 따라간다', hint: '어인들의 졸개가 막아선다. 그 너머에서 성벽이 무너지는 소리가 난다', values: { loyalty: D }, danger: true,
        fx: [{ op: 'hp', add: -15 }, { op: 'person', kind: 'ally', relation: '귤밭의 항해사', canon: 'nami' },
             { op: 'log', text: '아론 파크의 탑이 무너졌다. 마을 사람들이 귤밭에서 사흘 밤낮 잔치를 벌였다.', weight: 'heavy' }] },
      { label: '귤밭에 남아 다친 사람들의 상처를 싸맨다', hint: '싸움은 남의 손에 맡긴다. 노지코와 함께 밤을 새운다', values: { peace: D },
        fx: [{ op: "log", text: "노지코와 함께 붕대를 감는 동안 멀리서 탑 무너지는 소리가 났다. 상처 입은 이웃들이 귤밭으로 하나씩 모였다.", weight: "light" }, { op: 'person', kind: 'ally', relation: '귤밭의 언니', canon: 'nojiko' }, { op: 'base', key: 'int', add: 1 },
             { op: 'timeline', text: '아론 파크가 무너지던 날, 귤밭에서 다친 사람들을 돌봤다', canon: 'nami' }] },
      { label: '해군 지부로 가서 돈을 빼앗아 간 대령을 고발한다', hint: '같은 해군이 들어줄지 모른다. 쥐 같은 대령이 앙심을 품는다', values: { justice: D }, mark: 'rebel',
        fx: [{ op: 'flag', id: 'reportedNezumi' }, { op: 'chance', p: 0.5, then: [{ op: "log", text: "지부의 해군이 빼앗긴 돈의 기록을 접수했다. 쥐 대령은 멀리서 {name}을(를) 노려보며 부하에게 이름을 물었다.", weight: "light" }, { op: 'fame', add: 3 }], else: [{ op: "log", text: "지부는 고발장을 받지도 않았다. 돌아서는 길에 대령의 부하들이 골목을 막고 밀쳐 넘어뜨렸다.", weight: "light" }, { op: 'hp', add: -10 }] }] },
    ],
  },
  {
    // v4 cc_tashigi_swords. 로그타운 무기점
    id: 'cn_tashigi_swords', kind: 'door', when: at(age(14, 22), st('child', 'civil', 'pirate', 'bountyHunter', 'shipwright', 'settled'), on('로그타운')),
    weight: 6, repeat: 'once', needs: ['sword'], speaker: { canon: 'tashigi' },
    title: '명검을 쫓는 여검사', body: '잇폰마츠의 무기점에서 안경 쓴 해군 여검사가 진열장 구석의 낡은 칼을 유심히 본다. 이름난 칼이 해적 손에 들어가는 꼴은 못 본다며, 그 칼이 사실은 명검이라고 귓속말을 한다.',
    doors: [
      { label: '목검으로 여검사와 한 판 겨뤄 본다', hint: '해군 쪽 사람들에게 솜씨가 알려진다. 입대하라는 말을 듣는다', values: { ambition: D },
        fx: [{ op: "log", text: "목검을 맞대자 여검사가 빠르게 빈틈을 찔렀다. 겨루기가 끝난 뒤 지켜보던 해군이 입대할 생각은 없느냐고 물었다.", weight: "light" }, { op: 'hp', add: -8 }, { op: 'mastery', branch: 'sword', add: 8 }, { op: 'person', kind: 'ally', relation: '명검을 쫓는 여검사', canon: 'tashigi' }, { op: 'flag', id: 'marineContact' }] },
      { label: '해적이 사 가기 전에 그 낡은 칼을 산다', hint: '대금을 치르고 진열장의 칼을 가져간다', when: [{ c: 'money', min: 20000 }, { c: 'weapon', id: 'loguetown_meito', has: false }], values: { romance: D },
        fx: [{ op: 'buyWeapon', id: 'loguetown_meito' }, { op: "log", text: "돈을 치르고 칼을 빼자 낡은 칼집과 달리 날이 곧게 빛났다. 타시기는 칼의 이름을 다시 한번 알려 주었다.", weight: "light" }, { op: 'mastery', branch: 'sword', add: 10 }, { op: 'flag', id: 'meitoBought' }, { op: 'person', kind: 'ally', relation: '명검을 골라 준 여검사', canon: 'tashigi' },
             { op: 'timeline', text: '로그타운 무기점에서 명검 한 자루를 손에 넣었다', canon: 'tashigi' }] },
      { label: '칼의 내력을 함께 뒤적이며 이야기를 나눈다', hint: '칼을 보는 눈이 트인다. 손에 남는 것은 없다', values: { inquiry: D },
        fx: [{ op: "log", text: "무기점 장부를 함께 뒤지며 칼에 남은 문양을 읽었다. 타시기는 다음에 다른 명검을 보면 알려 달라고 했다.", weight: "light" }, { op: 'base', key: 'int', add: 1 }, { op: 'person', kind: 'ally', relation: '칼 이야기를 나눈 여검사', canon: 'tashigi' }] },
    ],
  },
];

export const CANON_EAST: Turning[] = [...BEFORE, ...EAST_ARC];
