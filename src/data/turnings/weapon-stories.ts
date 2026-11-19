import type { Cond, Fx, Turning } from '../../core/types';
import { log, on } from '../episodes/kit';
import { kid } from './childhood';
import { ACTIVE, GROWN, age, chose, known, st } from './paths';
import { ITEM_BY_ID } from '../../shared/data/items';

const fair = on('후샤 마을', '시럽 마을', '오렌지 마을', '코코야시 마을', '로그타운');
const basketFriend = '장날에 바구니를 잡아 준 아이';
const meetFriend: Fx = { op: 'person', kind: 'ally', relation: basketFriend };
const missing = (id: string): Cond => ({ c: 'weapon', id, has: false });
const ownsAny = (...ids: string[]): Cond => ({ c: 'anyOf', conditions: ids.map(id => ({ c: 'weapon', id, has: true })) });
const wanoForge = on('와노쿠니', '쿠리', '하나노미야코');
const knucklePrice = ITEM_BY_ID.fi3.price;

export const WEAPON_STORIES: Turning[] = [
  {
    id: 'weapon_fair_slingshot', kind: 'door', repeat: 'once', weight: 7, speaker: 'hero', needs: ['arms'],
    when: [...kid(6, 9), fair, missing('fair_slingshot')],
    title: '바구니에 든 천 공',
    body: '장난감 장수가 손수 깎은 새총을 빌려준다. 처음 보는 아이가 맞은편에 쪼그리고 앉아 바구니를 꼭 잡아 준다. 천 공이 겨우 바구니에 들자 둘이 한꺼번에 소리를 지른다. 장수는 기념으로 새총을 가져가도 좋다고 한다.',
    doors: [
      { label: '이름을 묻고 새총을 받아 간다', hint: '함께 논 아이와 인사를 나누고 나무 새총을 가져간다',
        fx: [meetFriend, { op: 'receiveWeapon', id: 'fair_slingshot' },
          log('바구니를 잡아 준 아이의 이름은 {person:장날에 바구니를 잡아 준 아이}였다. 장날의 나무 새총과 천 공 하나를 얻었다.', 'light')] },
      { label: '바구니를 잡아 준 아이에게 새총을 맡긴다', hint: '다음 장날에도 다른 아이들이 놀 수 있게 한다',
        fx: [meetFriend,
          log('{person:장날에 바구니를 잡아 준 아이}에게 새총을 맡겼다. 이번에는 자리를 바꿔 바구니를 잡았다. 해가 지도록 천 공을 주우러 다녔다.', 'light')] },
    ],
  },
  {
    id: 'weapon_zou_gloves', kind: 'door', repeat: 'once', weight: 6, speaker: 'hero',
    when: [...kid(10, 15), on('고래숲', '쿠라우 도시', '조', '조우'), missing('fi1')],
    title: '큰 나무 아래 걸린 장갑',
    body: '밍크족 아이들이 나뭇가지에 매단 헝겊 자루를 번갈아 두드린다. 기다리는 줄에서 가장 큰 아이가 두 손을 펴 보인다. 부쩍 자라서 장갑이 손가락 마디에 걸린다. 아직 멀쩡한 가죽 장갑에 다음 임자를 찾는다고 한다.',
    doors: [
      { label: '장갑을 물려받고 줄 맨 뒤에 선다', hint: '다음 차례를 기다리며 가죽 장갑을 고쳐 낀다', needs: ['arms'],
        fx: [{ op: 'receiveWeapon', id: 'fi1' }, log('손바닥에 헝겊 자국이 밴 가죽 장갑을 물려받았다. 마침내 차례가 오자 장갑을 준 아이가 옆에서 자루를 잡아 주었다.', 'light')] },
      { label: '뒤에 서 있던 작은 아이에게 차례를 양보한다', hint: '작은 손에도 장갑이 맞는지 함께 본다',
        fx: [log('작은 아이가 양손을 가슴께까지 번쩍 들어 보였다. 가죽 장갑은 그 아이 차지가 됐다.', 'light')] },
    ],
  },
  {
    id: 'weapon_sky_bell', kind: 'door', repeat: 'once', weight: 5, speaker: 'hero',
    when: [age(16, 24), st(...ACTIVE), on('엔젤섬', '스카이피아'), missing('bell_dial')],
    title: '안개가 걷힌 종루',
    body: '하얀 안개가 내려 구름길이 보이지 않는다. 종지기 혼자서는 앞을 못 보는 길손들을 맞으면서 안개 종까지 울릴 수 없다. 저녁까지 어느 쪽이든 맡아 주면, 종 그림이 그려진 여분의 충격 다이얼을 사례로 주겠다고 한다.',
    doors: [
      { label: '해 질 때까지 종루를 맡는다', hint: '안개가 걷히면 종지기의 충격 다이얼을 받는다',
        fx: [{ op: 'receiveWeapon', id: 'bell_dial' }, log('안개 속을 돌아오던 길손들이 종소리를 따라 구름길을 찾았다. 종지기가 건넨 충격 다이얼 옆면에는 작은 종이 그려져 있었다.', 'light')] },
      { label: '사례는 사양하고 길손을 맞으러 간다', hint: '종지기는 종루에 남고 길 잃은 사람들이 쉴 자리를 마련한다',
        fx: [log('길손들을 처마 밑으로 들여 따뜻한 차를 나눴다. 안개가 걷히자 마지막 길손이 종루를 향해 모자를 흔들었다.', 'light')] },
    ],
  },
  {
    id: 'weapon_dock_watch', kind: 'door', repeat: 'once', weight: 9, speaker: { relation: '도크의 경비' },
    when: [age(16, 30), st(...ACTIVE), on('워터 세븐', '워터 세븐 뒷골목'),
      chose('w7k_dock_nails', 1, 3), known('도크의 경비', 'ally'), missing('sw1')],
    title: '경비실 문 뒤의 칼집',
    body: '어릴 적 녹슨 못을 주워도 된다고 했던 {person:도크의 경비}이(가) 경비실 문턱에 앉아 있다. 오늘이 마지막 근무라며 짐을 싸다가 문 뒤에서 때 묻은 칼집을 꺼낸다. 첫 월급으로 산 무명 검이다. 혹시 쓸 데가 있겠느냐고 묻는다.',
    doors: [
      { label: '검을 받아 들고 마지막 퇴근길을 함께 걷는다', hint: '도크에서 처음 만난 이의 무명 검을 물려받는다',
        fx: [{ op: 'receiveWeapon', id: 'sw1' }, log('{person:도크의 경비}에게 무명 검을 물려받았다. 경비실에 마지막으로 자물쇠를 채우고 나란히 물길을 따라 걸었다.')] },
      { label: '검은 간직하라 하고 이삿짐을 들어 준다', hint: '옛 이야기를 나누며 집까지 바래다준다',
        fx: [log('{person:도크의 경비}이(가) 칼집을 제 짐에 넣었다. 집으로 가는 길에 못 한 자루로 빵을 사 먹던 이야기를 하며 같이 웃었다.', 'light')] },
    ],
  },
  {
    id: 'weapon_marine_jitte', kind: 'door', repeat: 'once', weight: 4, speaker: 'hero',
    when: [age(20, 40), st('marine'), { c: 'standingYears', min: 4 },
      on('셸스 타운', '로그타운', '에니에스 로비'), missing('sw_ss')],
    title: '복무 기념품 대장',
    body: '보급관이 복무 연수를 확인하더니 기념품 대장을 펼친다. 오래 복무한 대원에게 주는 해루석 십수가 한 자루 남았다. 대장 옆에는 십수 대신 저녁 식탁에 올릴 특식을 신청한 사람들의 이름도 있다.',
    doors: [
      { label: '대장에 서명하고 십수를 받는다', hint: '복무를 기념해 해루석 십수를 지급받는다',
        fx: [{ op: 'receiveWeapon', id: 'sw_ss' }, log('복무 기념품 대장에 서명하고 해루석 십수를 받았다. 십수와 함께 받은 종이에는 입대하던 해가 적혀 있었다.')] },
      { label: '당직 인원 몫까지 특식을 신청한다', hint: '오늘 저녁은 늦게 오는 사람도 따뜻하게 먹는다', meal: true,
        fx: [{ op: 'hp', add: 4 }, log('조리장이 저녁 당직이 끝날 때까지 큰 냄비를 불 위에 올려 두었다. 기념품 대장에는 특식 한 끼라고 적혔다.', 'light')] },
      { label: '체술 대원에게 주는 장갑을 신청한다', hint: '보급관에게 손 치수를 재고 해루석 장갑을 받는다',
        when: [{ c: 'tier', branch: 'fist', min: 2 }, missing('fi_ss')],
        fx: [{ op: 'receiveWeapon', id: 'fi_ss' }, log('보급관이 체술 대원에게 주는 해루석 장갑을 꺼냈다. 제 손에 맞는 한 켤레를 고르고 수령란에 이름을 썼다.')] },
    ],
  },
  {
    id: 'weapon_drum_staff', kind: 'door', repeat: 'once', weight: 6, speaker: 'hero',
    when: [age(25, 40), st(...ACTIVE), on('드럼 왕국'), missing('snow_staff')],
    title: '눈 속에 묻힌 표지판',
    body: '밤새 눈이 내려 진료소를 가리키는 화살표가 묻혔다. 길잡이가 산길을 한 바퀴 돌며 표지판을 다시 세울 참이다. 손이 모자란다며 눈금이 새겨진 봉 하나를 내민다. 같이 다녀오면 기념으로 가져도 좋다고 한다.',
    doors: [
      { label: '봉을 받아 들고 표지판을 찾아 나선다', hint: '산길을 돌고 눈금 새긴 길잡이봉을 가져온다', needs: ['arms'],
        fx: [{ op: 'receiveWeapon', id: 'snow_staff' }, log('표지판을 전부 세우고 나자 저 아래 마을에서도 진료소 화살표가 보였다. 길잡이가 준 봉에는 오늘 내린 눈만큼 젖은 자국이 남았다.', 'light')] },
      { label: '첫 갈림길에 서서 진료소 가는 길을 알려 준다', hint: '표지판이 돌아올 때까지 길잡이와 일을 나눈다',
        fx: [log('갈림길에 해가 드는 동안 진료소를 찾는 사람들을 안내했다. 저녁 무렵 길잡이가 마지막 화살표를 세우고 모자를 흔들었다.', 'light')] },
    ],
  },
  {
    id: 'weapon_prime_spear', kind: 'door', repeat: 'once', weight: 9, speaker: 'hero',
    when: [{ c: 'prime' }, st(...ACTIVE), { c: 'tier', branch: 'polearm', min: 2 },
      on('어인섬', '류구 왕국', '와노쿠니', '하나노미야코'), missing('sp2')],
    title: '기수에게 돌아가는 창',
    body: '무예제에서 긴 병기를 다뤄 본 사람을 불러 행렬의 맨 앞자리를 맡긴다. 장인들이 기수에게 주려고 벼린 강철창 끝에서 비단 깃발이 펄럭인다. 행렬이 돌아오면 깃발은 광장에 걸고 창은 기수가 가져가는 것이 관례다.',
    doors: [
      { label: '깃발을 들고 행렬의 맨 앞에 선다', hint: '행렬을 마치고 이름난 강철창을 받는다', needs: ['arms'],
        fx: [{ op: 'receiveWeapon', id: 'sp2' }, log('광장으로 돌아와 깃발을 내려 장인들에게 건넸다. 행렬 내내 빛나던 강철창은 기수의 몫으로 남았다.')] },
      { label: '기수 자리를 양보하고 광장에서 행렬을 맞는다', hint: '다른 기수가 가져온 깃발을 광장에 건다',
        fx: [log('행렬이 광장에 돌아왔을 때 기수가 깃발을 건넸다. 아이들에게 잘 보이게 깃발을 높이 걸어 주었다.', 'light')] },
    ],
  },
  {
    id: 'weapon_wano_blades', kind: 'door', repeat: 'once', weight: 7, speaker: 'hero',
    when: [age(41), st(...ACTIVE), { c: 'tier', branch: 'sword', min: 2 },
      ownsAny('sw1', 'style_oneSword', 'style_iai', 'wano_heirloom', 'loguetown_meito'), wanoForge, missing('sw2')],
    title: '새 칼 옆의 빈자리',
    body: '칼 전시를 준비하던 장인이 칼집째 한 자루 빌릴 수 있느냐고 묻는다. 새 칼 옆에는 임자가 있는 칼을 놓고, 누가 왜 이 칼을 골랐는지 들려주고 싶다고 한다. 사흘 동안 빌려주면 전시가 끝날 때 양업물 한 자루를 사례로 주겠다고 한다.',
    doors: [
      { label: '칼을 빌려주고 칼집에 얽힌 사연도 적어 준다', hint: '전시가 끝나면 빌려준 검과 양업물 검을 함께 가져온다',
        fx: [{ op: 'receiveWeapon', id: 'sw2' }, log('사흘 뒤에 가 보니 사람들이 칼집 앞에서 사연을 읽고 있었다. 전시가 끝난 뒤 맡긴 칼을 돌려받고 장인이 약속한 양업물 검도 받았다.')] },
      { label: '칼은 가져가고 칼집 그림을 남긴다', hint: '장인은 그림을 새 칼 옆에 걸어 둔다',
        fx: [log('장인은 칼집을 그린 종이를 전시대에 걸었다. 그림을 구경하던 아이가 저 긴 칼을 차고는 어떻게 앉느냐고 물었다.', 'light')] },
    ],
  },
  {
    id: 'weapon_retired_fair', kind: 'door', repeat: 'once', weight: 9, speaker: { relation: basketFriend },
    when: [age(55), st('retired'), fair, chose('weapon_fair_slingshot', 1, 30), known(basketFriend, 'ally'), missing('fair_slingshot')],
    title: '천 공 하나가 든 소포',
    body: '장날 바구니를 잡아 주던 {person:장날에 바구니를 잡아 준 아이}에게서 소포가 왔다. “올해부턴 애들이 공 던지는 놀이를 하더라. 이건 네가 갖고 싶을 것 같아서.” 오래전 그 아이에게 맡겼던 나무 새총이 천 공과 나란히 누워 있다.',
    doors: [
      { label: '새총을 간직하고 고맙다는 편지를 쓴다', hint: '어릴 적 장날의 새총을 기념으로 보관한다',
        fx: [{ op: 'receiveWeapon', id: 'fair_slingshot', stow: true }, log('{person:장날에 바구니를 잡아 준 아이}에게 잘 받았다고 썼다. 돌아온 새총 옆에 천 공을 놓으니 둘이 번갈아 바구니를 잡던 날이 생각났다.')] },
      { label: '동무와 의논해 장난감 가게에 기증한다', hint: '새총과 천 공은 다음 장날부터 가게에 전시된다',
        fx: [log('{person:장날에 바구니를 잡아 준 아이}와(과) 편지를 주고받아 새총을 장난감 가게에 기증했다. 얼마 뒤 천 공과 새총이 나란히 놓인 진열장의 그림이 도착했다.', 'light')] },
    ],
  },
  {
    id: 'weapon_veteran_rifles', kind: 'door', repeat: 'once', weight: 6, speaker: 'hero',
    when: [age(28), st('marine', 'bountyHunter', 'cp'), { c: 'standingYears', min: 4 }, { c: 'tier', branch: 'gun', min: 3 },
      ownsAny('style_rifle', 'style_sniper'), on('로그타운', '워터 세븐', '샤본디 제도', '에니에스 로비'),
      { c: 'anyOf', conditions: [missing('gu3'), missing('gu_ss')] }],
    title: '호송 조합의 두 궤짝',
    body: '호송 조합이 경력 있는 사수에게 새로 들인 장비를 살펴 달라고 한다. 한 궤짝에는 먼바다 경계에 쓰는 장거리 저격총이, 다른 궤짝에는 바다 짐승을 물리던 해루석 작살총이 들었다. 조합장은 일을 마친 품삯으로 마음에 드는 쪽을 한 자루 고르라고 한다.',
    doors: [
      { label: '먼바다 경계용 총을 살펴보고 가져간다', hint: '검수를 마치고 장거리 저격총을 받는다', when: [missing('gu3')],
        fx: [{ op: 'receiveWeapon', id: 'gu3' }, log('검수표 끝에 이름을 쓰고 장거리 저격총을 받았다. 갈매기 깃털이 그려진 조합의 보관증이 궤짝 안에 들어 있었다.')] },
      { label: '작살총을 살펴보고 그쪽을 고른다', hint: '검수를 마치고 해루석 작살총을 받는다', when: [missing('gu_ss')],
        fx: [{ op: 'receiveWeapon', id: 'gu_ss' }, log('조합장에게 검수표를 건넸다. 품삯으로 받은 해루석 작살총의 궤짝에는 바닷물이 말라붙은 자국이 있었다.')] },
      { label: '검수표만 건네고 두 자루 모두 남겨 둔다', hint: '다음 호송에 나갈 사수들에게 장비를 남긴다',
        fx: [log('검수표를 받은 조합장이 두 궤짝에 다음 호송선의 이름표를 달았다.', 'light')] },
    ],
  },
  {
    id: 'weapon_kabuto_exhibit', kind: 'door', repeat: 'once', weight: 7, speaker: 'hero',
    when: [age(35), st(...GROWN), { c: 'tier', branch: 'gun', min: 4 }, ownsAny('style_slingshot'),
      chose('style_refine_slingshot', 0, 3), on('시럽 마을', '드레스로자', '엘바프'), missing('gu4')],
    title: '가면 옆에 놓인 카부토',
    body: '저격왕 이야기를 싣고 다니는 순회 전시회가 열렸다. 마지막 전시물은 장인이 저격왕의 카부토를 본떠 만든 대형 새총이다. 장인이 관람객들에게 작은 새총과 큰 새총을 나란히 보여 줄 사수를 찾는다. 마지막 공연을 도와주면 카부토의 새 임자가 되어 달라고 한다.',
    doors: [
      { label: '익숙한 새총을 가져와 마지막 공연을 맡는다', hint: '공연이 끝나면 장인이 만든 대형 새총 카부토를 받는다', needs: ['arms'],
        fx: [{ op: 'receiveWeapon', id: 'gu4' }, log('작은 새총과 나란히 놓자 앞줄의 아이들이 카부토의 크기에 놀라 일어섰다. 막이 내린 뒤 장인이 약속대로 카부토를 건넸다.')] },
      { label: '공연 뒤에도 카부토를 전시해 달라고 청한다', hint: '새총을 관람객들에게 남겨 둔다',
        fx: [log('장인은 카부토를 다시 전시장 벽에 걸었다. 전시장 문을 나서는 길에 아이들이 저격왕 노래를 부르는 소리가 들렸다.', 'light')] },
    ],
  },
  {
    id: 'weapon_knuckle_forge', kind: 'door', repeat: 'once', weight: 5, speaker: 'hero',
    when: [age(28), st(...GROWN), { c: 'tier', branch: 'fist', min: 4 }, on('에그헤드', '와노쿠니', '쿠리'),
      { c: 'anyOf', conditions: [missing('fi2'), missing('fi3')] }],
    title: '두 벌의 손 본',
    body: '장인이 체술가의 손 본을 뜨고 있다. 온갖 크기의 손이 작업대에 석고로 남았다. 본을 남겨 주면 강철 너클 한 벌을 사례로 주고, 손님이 재료값을 대면 해루석으로도 한 벌 맞춰 주겠다고 한다.',
    doors: [
      { label: '손 본을 남기고 강철 너클을 받는다', hint: '사례로 만든 강철 너클을 가져간다', when: [missing('fi2')], needs: ['arms'],
        fx: [{ op: 'receiveWeapon', id: 'fi2' }, log('작업대에 제 손 모양이 하나 늘었다. 장인은 굳은 석고 옆에 맞춤 강철 너클 한 벌을 놓아 두었다.')] },
      { label: '해루석 재료값을 치르고 너클을 주문한다', hint: '장인이 손에 맞게 만든 해루석 너클을 받는다',
        when: [missing('fi3'), { c: 'money', min: knucklePrice }], needs: ['arms'],
        fx: [{ op: 'money', add: -knucklePrice, trade: true }, { op: 'receiveWeapon', id: 'fi3' }, log('장인이 석고 본에 꼭 맞는 해루석 너클을 완성했다. 재료값을 치른 영수증과 너클을 함께 가져왔다.')] },
      { label: '다른 체술가들이 남겨 놓은 본을 둘러본다', hint: '주문 없이 공방을 구경한다',
        fx: [log('손가락 길이도 굳은살이 박인 자리도 똑같은 본은 둘이 없었다. 장인이 기억하는 손님들의 이야기를 듣고 나왔다.', 'light')] },
    ],
  },
  {
    id: 'weapon_elbaf_gauntlet', kind: 'door', repeat: 'once', weight: 8, speaker: 'hero',
    when: [age(35), st(...GROWN), { c: 'tier', branch: 'fist', min: 4 }, ownsAny('fi2', 'fi_ss', 'fi3'),
      { c: 'anyOf', conditions: [chose('isl_elbaf_giant', 0, 1), chose('isl_elbaf_giant', 1, 1)] },
      on('엘바프'), missing('fi4')],
    title: '엘바프의 손님맞이 건틀릿',
    body: '엘바프의 전사들이 예전에 찾아왔던 손님을 알아보고 대장간으로 이끈다. 거인 장인은 손님이 오면 자기 솜씨로 꼭 맞는 건틀릿을 한 벌 선물하는 게 이 집 풍습이라고 한다. 전사들의 손만 봐 와서 다른 곳에서 수련한 사람의 장비도 한번 구경하고 싶단다.',
    doors: [
      { label: '장인 옆에 앉아 건틀릿을 맞춘다', hint: '지니고 온 장비는 돌려받고 엘바프 장인의 건틀릿도 받는다', needs: ['arms'],
        fx: [{ op: 'receiveWeapon', id: 'fi4' }, log('거인 장인이 완성한 건틀릿을 작업대에서 건네주었다. 주먹을 쥐었다 펴 보이자 대장간 천장이 떨리도록 웃었다.')] },
      { label: '손 장비만 견본으로 보여 주고 돌아온다', hint: '장인은 다음 방문객을 위해 치수를 적어 둔다',
        fx: [log('장인이 두 손가락으로 조심스럽게 견본을 받아 살폈다. 제 장비를 돌려받고 나올 때까지 커다란 연필이 바쁘게 움직였다.', 'light')] },
    ],
  },
  {
    id: 'weapon_meito_custody', kind: 'door', repeat: 'once', weight: 6, speaker: 'hero',
    when: [age(35), st(...GROWN), { c: 'tier', branch: 'sword', min: 4 }, ownsAny('sw2', 'wano_heirloom', 'loguetown_meito'),
      wanoForge, missing('sw3')],
    title: '명검 대장의 빈 줄',
    body: '칼을 감정하는 모임에서 대업물 한 자루를 내놓았다. 앞선 임자가 세상을 떠나며 칼을 쓸 줄도, 돌볼 줄도 아는 사람에게 맡겨 달랬다고 한다. 모임의 서기가 가지고 온 검을 살펴보고 빈 줄을 짚는다. 맡겠다면 이름을 적고 해마다 칼의 소식을 전해 달라고 한다.',
    doors: [
      { label: '대장에 이름을 적고 대업물을 맡는다', hint: '앞선 임자의 기록과 함께 대업물 검을 받는다',
        fx: [{ op: 'receiveWeapon', id: 'sw3' }, log('앞선 임자의 이름 아래 제 이름을 적었다. 서기는 대업물 검과 함께 이제까지 손질을 맡았던 공방들의 주소를 건넸다.')] },
      { label: '다음 임자가 정해질 때까지 전시를 돕는다', hint: '대업물은 감정 모임에 남는다',
        fx: [log('칼 옆에 앞선 임자의 이야기를 적은 팻말을 세웠다. 새 임자를 적는 줄은 비워 두었다.', 'light')] },
    ],
  },
  {
    id: 'weapon_meito_return', kind: 'door', repeat: 'once', weight: 8, speaker: 'hero',
    when: [age(45), st(...GROWN), chose('weapon_meito_custody', 0, 8), ownsAny('sw3'),
      { c: 'tier', branch: 'sword', min: 5 }, { c: 'tier', branch: 'armament', min: 4 }, wanoForge,
      { c: 'anyOf', conditions: [missing('sw4'), missing('sw5')] }],
    title: '명검 대장의 두 번째 서명',
    body: '와노의 감정 모임에서 오래전에 맡긴 대업물을 다시 보자고 청했다. 무장색에 길든 날에 검은빛이 남아 있다. 감정사들은 이 칼을 흑도로 기록할 수 있다고 한다. 오랫동안 명검을 맡아 온 사람에게만 허락하는 자리라며, 별도로 보관해 온 최상대업물의 칼상자도 연다.',
    doors: [
      { label: '새 후견인으로 서명하고 최상대업물을 맡는다', hint: '기존 대업물과 함께 최상대업물 검을 보관한다', when: [missing('sw4')],
        fx: [{ op: 'receiveWeapon', id: 'sw4' }, log('두 번째 이름을 적었다. 새로 맡은 최상대업물은 앞서 맡았던 대업물 곁에 놓였다. 두 칼상자에는 서로 다른 임자들의 이름이 적혀 있었다.')] },
      { label: '함께한 대업물을 흑도로 정식 감정받는다', hint: '소장한 대업물 한 자루가 흑도로 바뀐다', when: [missing('sw5')],
        fx: [{ op: 'giveAwayWeapon', id: 'sw3' }, { op: 'receiveWeapon', id: 'sw5' },
          log('감정사가 오래된 칼 번호 옆에 흑도라고 적었다. 처음 대업물을 맡을 때의 칼집 그대로, 달라진 이름을 받아 돌아왔다.')] },
      { label: '새 검도 감정서도 사양하고 오래된 칼을 가져간다', hint: '맡아 온 대업물을 그대로 간직한다',
        fx: [log('감정사가 칼상자를 덮었다. 처음 맡았을 때처럼 대업물 한 자루를 안고 돌아왔다.', 'light')] },
    ],
  },
];
