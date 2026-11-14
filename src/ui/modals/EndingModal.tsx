import { actions } from '../../app/store';
import { josa } from '../../core/josa';
import { summary } from '../../core/meta/meta';
import type { LifeState } from '../../core/types';
import { SEA_BY_ID } from '../../data/seas';
import { Face, fmt, heroWho, Modal, ROUTE_NAMES } from '../common';

export function EndingModal({ s }: { s: LifeState }) {
  const sm = summary(s);
  const h = s.hero;
  return (
    <Modal title="인생 결산" wide>
      <div class="grid2" style={{ alignItems: 'start' }}>
        <div class="poster">
          <div class="wanted">{h.route === 'marine' ? 'MARINE' : 'WANTED'}</div>
          <Face who={heroWho(s)} size="big" />
          <div class="t14"><b>{h.surname} {h.name}</b></div>
          <div>{h.age}세 · {s.ended?.cause === '은퇴' ? '은퇴' : josa(`${s.ended?.cause}(으)로 세상을 떠남`)}</div>
          <div class="row" style={{ justifyContent: 'center', marginTop: 6 }}>
            <span class="tag">{ROUTE_NAMES[h.route]}</span><span class="tag gold">{sm.title}</span>
          </div>
          <div style={{ marginTop: 6 }}>{h.route === 'marine' ? `공적 ${fmt(h.fame)}` : `현상금 ${fmt(h.fame * 10000)} 베리`}</div>
          <div class="t9">가장 멀리 간 바다: {s.stats.maxStage}단계 · {SEA_BY_ID[s.world.seaId].name}</div>
          <div class="t9">열매: {sm.fruit ?? '없음'}</div>
          <div class="t9">넘은 보스: {sm.bosses.join(', ') || '없음'}</div>
          <div class="t9">강적전 {s.stats.eliteWins}승 {s.stats.eliteLosses}패 · 중대한 선택 {s.stats.choices}번</div>
          <div class="t9">가족: {s.people.filter((p) => p.alive && ['배우자', '아들', '딸'].includes(p.relation)).map((p) => `${p.relation} ${p.name}`).join(', ') || '없음'}</div>
          <div class="hr" />
          <div class="t9"><b>주력 기술</b></div>
          {sm.skills.map((x) => <div class="t9">{x.name} · 숙련 {x.mastery}</div>)}
        </div>
        <div class="paper" style={{ maxHeight: 420, overflowY: 'auto' }}>
          <b>연표</b>
          {s.timeline.map((t) => <div class="t9"><span class="soft">{t.age}세</span> {t.text}</div>)}
        </div>
      </div>
      <div class="t9 soft" style={{ marginTop: 6 }}>능력치와 물건은 남지 않는다. 먹어 본 열매, 만난 인물, 열어 본 기술이 도감에 남는다.</div>
      <button class="btn gold block" style={{ marginTop: 8 }} onClick={() => actions.endLife()}>명예의 전당에 남기고 처음으로</button>
    </Modal>
  );
}
