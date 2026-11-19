// 로그타운의 첫 약속이 기존 알라바스타 가뭄 장편과 생애 후반으로 돌아오는 첫 코스.
import type { Cond, Fx, Turning } from '../../core/types';
import { D, flag, log, next, time, fight } from '../episodes/kit';

const event = (id: string, actor = '부두의 기록꾼 페니'): Fx => ({ op: 'lifeEvent', id, actor });
const once = (id: string, title: string, body: string, doors: Turning['doors']): Turning => ({
  id: `life_course_${id}`, title, body, kind: 'door',
  when: ['prepare', 'evidence', 'won', 'lost', 'back'].includes(id)
    ? [{ c: 'sea', is: ['gl_first'] }, { c: 'island', is: ['알라바스타 왕국'] }] : [],
  weight: 0, repeat: 'once', speaker: 'hero', doors,
});
const trained: Fx[] = [{ op: 'dream', id: 'bestSword' }, { op: 'tier', branch: 'sword', to: 1 },
  { op: 'pref', branch: 'sword', add: 60 }, { op: 'beginStyle', style: 'oneSword' }];
const finish = (id: string, line: string, nextId = 'ep_alabasta_p10'): Fx[] => [event(id), log(line), time(line), next(nextId)];
const guard: Cond = { c: 'lifePreparation', mode: 'guard' };
const duel: Cond = { c: 'lifePreparation', mode: 'duel' };

export const LIFE_COURSE: Turning[] = [
  once('promise', '돌아오지 않은 배의 지도',
    '부두에서 장부를 쓰는 페니가 젖은 지도를 펼친다. 이 지도대로 떠난 작은 배는 돌아오지 않았다. 팔던 사람은 다음 배에도 같은 지도를 내민다. 페니가 묻는다. “어른이 되면 넌 어떤 사람이 될 거야?”', [
      { label: '다음에는 떠나는 사람을 지킬 수 있게 되겠다고 약속한다', hint: '페니가 장부 한 귀퉁이에 오늘 말을 적는다', values: { loyalty: D },
        fx: [{ op: 'person', kind: 'ally', relation: '부두의 기록꾼 페니', name: '페니', gender: 'f' }, event('promise_guard'), log('돌아오지 않은 배 이름 아래에 사람을 지키겠다는 약속을 남겼다. 페니가 내 손에 지도 조각을 쥐여 주었다.')] },
      { label: '누가 그린 지도든 직접 확인할 실력을 기르겠다고 한다', hint: '페니가 빈 해도 한 장을 내민다', values: { inquiry: D },
        fx: [{ op: 'person', kind: 'ally', relation: '부두의 기록꾼 페니', name: '페니', gender: 'f' }, event('promise_duel'), log('남이 그린 길만 따라가지 않겠다고 말했다. 페니가 내 이름을 쓰지 않은 빈 해도를 건넸다.')] },
      { label: '아직 바다에 나갈 생각은 없다고 말한다', hint: '오늘 본 일을 기억하며 집으로 돌아간다', values: { peace: D },
        fx: [event('declined'), log('젖은 지도는 페니에게 돌려주었다. 부두의 일을 아직 내 약속으로 삼지는 않았다.')] },
    ]),
  once('training', '지도 조각을 본 검술 사범',
    '부두의 검술 사범 엘모가 낡은 지도 조각을 알아본다. “사람 뒤에 서서 막는 칼과, 상대 앞에 서서 틈을 찾는 칼은 다르다. 어느 쪽부터 배우겠니?” 페니가 소개해 준 수련에는 돈이 들지 않는다.', [
      { label: '사람이 물러날 때까지 버티는 검을 배운다', hint: '호송에서 사람과 짐을 지킬 수련을 시작한다', values: { loyalty: D },
        fx: [...trained, { op: 'master', name: '부두 사범 엘모', branch: 'sword', cap: 4, years: 7, paid: false }, event('trained_guard'), log('엘모는 넘어질 때도 검끝을 바깥으로 향하게 했다. 사람을 등 뒤에 두고 물러서는 법부터 익혔다.')] },
      { label: '한 걸음의 빈틈을 읽는 검을 배운다', hint: '두 번째 경지에 오르면 정면 결투를 시도할 수 있다', values: { ambition: D },
        fx: [...trained, { op: 'master', name: '부두 사범 엘모', branch: 'sword', cap: 4, years: 7, paid: false }, event('trained_duel'), log('엘모는 칼을 먼저 내밀지 않았다. 상대가 발을 옮기는 순간에만 나무칼을 뻗는 연습을 거듭했다.')] },
      { label: '지금은 다른 배움을 찾겠다고 한다', hint: '지도 조각을 챙겨 도장을 나선다', values: { freedom: D },
        fx: [event('training_declined'), log('엘모는 지도 조각을 돌려주었다. 나는 아직 어떤 칼을 쓸지 정하지 않았다.')] },
    ]),
  once('departure', '페니가 맡긴 첫 소개장',
    '페니의 소개장에는 알라바스타의 낙타몰이 나디르 이름이 적혀 있다. 식수 호송을 도울 사람이 필요하다고 한다. 상선에 타면 검을 써 볼 기회가 있지만 위대한 항로의 약탈과 부상 위험을 감수해야 한다. 해군 호송대에도 자리가 있다.', [
      { label: '나디르를 만나러 알라바스타행 상선에 오른다', hint: '민간 호송 일을 맡는다. 목적지는 나노하나, 얻을 것은 현지의 길과 인연이다', when: [{ c: 'standing', is: ['child', 'civil', 'bountyHunter'] }], values: { romance: D },
        fx: [event('departed'), { op: 'standing', to: 'bountyHunter' }, { op: 'move', island: '알라바스타 왕국', sea: 'gl_first' }, next('ep_alabasta_p1'), log('소개장을 품고 상선의 호송 일을 맡았다. 리버스 마운틴을 건너 나노하나에 닿자, 나디르가 물통을 든 채 기다리고 있었다.')] },
      { label: '해군 호송 임무로 나노하나에 간다', hint: '현지의 식수 사정과 항구 안전을 조사한다. 이미 군인이면 신분을 유지한다', values: { justice: D },
        fx: [event('departed'), { op: 'lifeMilitary' }, { op: 'move', island: '알라바스타 왕국', sea: 'gl_first' }, next('ep_alabasta_p1'), log('해군 호송 명령서에 페니의 소개장을 끼웠다. 항구의 안전을 확인하는 첫 임무에서 나디르를 만나기로 했다.')] },
      { label: '소개장은 간직하고 당분간 고향에 남는다', hint: '이 항로를 택하지 않아도 배운 검술은 남는다', values: { peace: D },
        fx: [event('stayed'), log('소개장을 접어 칼집 안쪽에 넣었다. 지금 지킬 곳은 고향이라고 생각했다.')] },
    ]),
  once('prepare', '배운 검을 어디에 세울까',
    '마지막 물 수레가 협곡을 지난다. 나디르는 수레와 사람을 마을까지 지켜 달라고 한다. 장부나 교대 순서를 확보했다면 한 철 동안 증인을 찾아 공개할 수도 있다. 하잠은 같은 병력으로 협곡을 지킨다. 정면전에서 지면 상처와 치료 빚이 남고, 뒤로 물러나면 물은 떠난다.', [
      { label: '배운 호위 검술로 물 수레가 빠져나갈 길을 지킨다', hint: '몸이 검을 쓸 수 있어야 한다. 활동 가능한 지원병이 있으면 대신 앞을 맡길 수 있다', when: [guard], values: { loyalty: D },
        fx: [flag('ep_alabasta_p_ledger'), flag('ep_alabasta_nadir_trust'), ...finish('escort', '{lifeGuardMethod} 물 수레를 지켰다. 나디르와 증인이 마을에 살아 돌아왔다.'), { op: 'fame', add: 12 }] },
      { label: '남겨 둔 장부와 교대 기록을 대조하며 증인을 기다린다', hint: '한 철이 실제로 흐른다. 기록이 없거나 섬을 떠나면 호송을 놓친다', values: { inquiry: D },
        fx: [event('investigating'), { op: 'lifeWait', ready: 'life_course_evidence', otherwise: 'life_course_missed' }, log('서두르지 않고 우물 장부를 폈다. 한 철 동안 나디르와 함께 물을 받은 사람들의 증언을 모으기로 했다.')] },
      { label: '하잠의 발이 옮겨지는 틈을 노려 정면으로 맞선다', hint: '결투 수련과 검술 두 번째 경지, 회복된 몸이 필요하다. 뒤의 모래 언덕으로 물러날 수 있다', when: [duel], danger: true, values: { ambition: D },
        fx: [event('challenged'), log('엘모에게 배운 한 걸음을 떠올리며 하잠 앞에 섰다. 물 수레가 멈춘 협곡에서 퇴로를 먼저 확인했다.'), fight('b_hazam', false, { win: 'life_course_won', lose: 'life_course_lost', back: 'life_course_back' })] },
    ]),
  once('evidence', '물 받은 사람들의 이름',
    '한 철 동안 모은 증언이 기존 장부와 맞아떨어진다. 물을 받지 못했는데도 받은 것으로 적힌 사람들의 이름이 한 줄씩 드러난다. 나디르가 사피야 앞에 마지막 증언을 내려놓는다.', [
      { label: '장부와 증언을 함께 공개해 우물 열쇠를 돌려받는다', hint: '장부만으로 못 하던 일을 살아 있는 증인이 증명한다', values: { justice: D },
        fx: [flag('ep_alabasta_p_ledger'), flag('ep_alabasta_p_map'), flag('ep_alabasta_safiya_trust'), ...finish('evidence', '기다려 확보한 장부와 증언을 공개했다. 상단의 물값 장부에 마을 사람들이 자기 이름을 되찾았다.')] },
      { label: '증언 사본을 주민에게 남기고 호송 일을 마친다', hint: '원본을 잃어도 마을에 증거가 남는다', values: { freedom: D },
        fx: [flag('ep_alabasta_p_map'), event('evidence_copy'), ...finish('evidence', '물 수레의 증언 사본을 마을에 남겼다. 누가 무엇을 받았는지 이제 주민들이 직접 확인할 수 있었다.')] },
    ]),
  once('missed', '기다리던 수레는 오지 않았다',
    '필요한 기록을 구하지 못했거나 기다릴 자리를 떠난 사이에 물 수레가 지나갔다. 늦게 도착한 전갈에는 물값이 다시 올랐다는 소식이 적혀 있다.', [
      { label: '호송을 놓친 사실과 남은 빚을 장부에 남긴다', hint: '약속을 지키지 못한 결과를 지우지 않는다', values: { justice: D },
        fx: [event('missed'), log('호송을 놓쳤다고 적었다. 증거를 기다린 일만으로 물 수레를 지켰다고 할 수는 없었다.'), time('알라바스타의 호송을 놓쳤다')] },
      { label: '남은 마을 사람들에게 치료비를 보낸다', hint: '돈을 내도 놓친 수레는 돌아오지 않는다', values: { loyalty: D },
        fx: [event('missed'), { op: 'money', add: -2000 }, log('늦은 치료비를 부쳤다. 빈 수레 자국과 물값은 장부에 그대로 남았다.'), time('놓친 호송의 치료 빚을 보냈다')] },
    ]),
  once('won', '결투 뒤 남은 물통', '하잠이 곤봉을 떨어뜨렸다. 나디르는 깨지지 않은 물통을 세고, 나는 검을 거두고 사람들을 살핀다.', [
    { label: '물통을 마을에 보내고 우물 열쇠를 챙긴다', hint: '승리를 물을 돌려주는 일까지 잇는다', values: { justice: D }, fx: finish('duel_won', '결투 수련에서 배운 틈을 읽어 하잠을 이겼다. 남은 물통과 우물 열쇠를 나디르에게 돌려주었다.', 'ep_alabasta_p9') },
    { label: '먼저 다친 사람을 옮기고 열쇠를 주민에게 맡긴다', hint: '이긴 뒤에도 구조가 끝날 때까지 남는다', values: { loyalty: D }, fx: finish('duel_won', '하잠과의 결투에서 이긴 뒤에도 다친 사람을 옮겼다. 물 수레의 열쇠는 주민에게 맡겼다.', 'ep_alabasta_p9') },
  ]),
  once('lost', '패배 뒤의 치료 장부', '하잠의 호송대가 협곡을 빠져나갔다. 살아남았지만 붕대를 갈아야 한다. 나디르는 구조에 쓴 돈을 장부에 적는다.', [
    { label: '치료 빚을 내 이름으로 남기고 몸부터 추스른다', hint: '치료비를 치르고 물을 놓친 일을 기록한다', values: { justice: D }, fx: [{ op: 'money', add: -2000 }, ...finish('duel_lost', '하잠에게 패배했다. 수레를 놓친 뒤 남은 치료 빚은 내 이름으로 적었다.')] },
    { label: '나디르에게 미안하다고 말하고 피난길을 돕는다', hint: '싸움의 패배가 마을을 버릴 이유가 되지는 않는다', values: { loyalty: D }, fx: [{ op: 'hp', add: -3 }, ...finish('duel_lost', '하잠에게 패배한 뒤 나디르의 피난길을 정리했다. 놓친 물 수레를 지켰다고 말하지 않았다.')] },
  ]),
  once('back', '검을 뽑지 않은 협곡', '하잠의 병력이 지나가는 동안 모래 언덕 뒤에 숨었다. 몸은 온전하지만 물 수레는 레인베이스로 향했다.', [
    { label: '물러난 결정을 기록하고 나디르에게 알린다', hint: '다치지 않은 대가로 놓친 물을 기억한다', values: { peace: D }, fx: finish('withdrew', '하잠 앞에서 물러났다. 몸을 보전했지만 나디르가 기다린 물 수레는 돌아오지 않았다.') },
    { label: '호송대의 다음 길을 마을에 전한다', hint: '오늘 맞서지 않은 대신 다음 피해를 줄일 정보를 남긴다', values: { inquiry: D }, fx: finish('withdrew', '하잠과 싸우지 않고 호송대의 길을 기록했다. 오늘 지키지 못한 물 수레가 장부에 남았다.') },
  ]),
  once('reunion', '두 해 뒤 돌아온 부두의 기록',
    '두 해 이상 지나 페니가 남긴 부두 장부의 사본이 도착했다. 거기에는 {lifeOutcome}이 적혀 있다. 첫 소개장과 물 수레 앞에서 한 선택이 한 장에 놓인다.', [
      { label: '알라바스타에서 한 일을 숨김없이 답장에 적는다', hint: '약속과 실제 결과를 나란히 남긴다', values: { justice: D }, fx: [event('reunion'), log('첫 약속과 알라바스타의 결과를 같은 편지에 적었다. 구한 사람의 이름도 남은 빚도 지우지 않았다.')] },
      { label: '처음 검을 가르쳐 준 사람에게 장부를 보여 준다', hint: '어떤 칼을 썼는지 설명할 때가 왔다', values: { romance: D }, fx: [event('reunion'), log('사범에게 첫 소개장과 물 수레의 장부를 보냈다. 무엇을 배웠고 어디서 썼는지 처음으로 한꺼번에 이야기했다.')] },
    ]),
  once('recognition', '칼의 쓰임을 인정받는 날',
    '부두 사범 엘모의 수련장이 옛 장부의 사본을 돌려보냈다. 배운 기술이 알라바스타에서 사람을 살리거나 약탈을 멈추게 한 사실을 인정한다는 글과, 다음 경지를 배울 자리가 적혀 있다.', [
      { label: '성과를 증명한 장부를 들고 다음 경지에 도전한다', hint: '스승의 인정으로 높은 경지의 수련과 전성기를 연다', values: { ambition: D },
        fx: [event('recognized'), { op: 'master', name: '부두 사범 엘모의 수련장', branch: 'sword', cap: 6, years: 10, paid: false }, flag('prime'), log('실제로 쓴 검술을 인정받았다. 사람을 지키거나 상대의 틈을 읽어 낸 경험이 다음 수련의 문을 열었다.')] },
      { label: '더 높은 경지보다 지금 지킬 일을 택한다', hint: '인정은 받되 전성기 수련을 시작하지 않는다', values: { peace: D }, fx: [event('recognition_declined'), log('수련장의 초대를 접어 장부에 끼웠다. 지금은 더 강한 칼보다 남겨 둔 일을 돌보려 했다.')] },
    ]),
  once('legacy', '다음 손에 건네는 지도 조각',
    '오래 간직한 지도 조각과 수련 기록을 펼친다. 지금 몸으로 검을 들기 어렵더라도, 왜 그 검을 배웠고 어디에 썼는지는 다음 사람에게 남길 수 있다.', [
      { label: '배운 검술과 그 검을 쓴 이유를 다음 사람에게 전한다', hint: '부두의 첫 결심과 그 뒤 실제로 걸었던 길을 함께 가르친다', values: { loyalty: D }, fx: [
        { op: 'person', kind: 'ally', relation: '검술과 기록을 이어받은 견습', name: '린', age: { younger: 20 } },
        event('legacy', '검술과 기록을 이어받은 견습'), flag('dreamPassed'), time('첫 약속에서 배운 검술과 그 뒤의 기록을 견습 린에게 전했다'), log('견습 린에게 기술만 가르치지 않았다. 처음 약속한 날과 {lifeOutcome}까지 함께 남겼다.')] },
      { label: '지도와 장부를 묶어 항구의 기록실에 맡긴다', hint: '이루지 못한 꿈에도 다음 사람이 읽을 기록이 남는다', values: { inquiry: D }, fx: [event('legacy'), time('첫 약속과 그 뒤의 기록을 항구의 기록실에 남겼다'), log('지도 조각과 {lifeOutcome}을 기록실에 두었다. 몸이 예전 같지 않아도 다음 사람이 읽을 기록은 남길 수 있었다.')] },
    ]),
];
