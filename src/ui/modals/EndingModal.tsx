// 엔딩 창 (통합 기획 10장): 끝난 인생을 장면 하나씩 넘기며 돌아본다. 마지막 장면은 "너에게 원피스는 무엇이었나?".
// 창을 닫는 길은 마지막 장면의 단추(명예의 전당에 남기기)뿐이다. 장면은 화면을 누르거나 단추로 넘긴다.
import { useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { actions } from '../../app/store';
import type { Meta5 } from '../../core/meta';
import type { Life5 } from '../../core/types';
import { Face, Modal } from '../common';
import { endingView, heroWho5 } from '../view';
import { PowerSpark } from '../screens/Goals';

/** meta: 이 인생을 더하기 전의 도감 */
export function EndingModal({ s, meta }: { s: Life5; meta: Meta5 }) {
  const v = endingView(s, meta);
  const missed = v.unchosen.length > 0 || !!v.secret || v.newCodex.length > 0;
  const scenes: { key: string; body: ComponentChildren }[] = [
    { key: 'end', body: (
      <div class="scene5 center">
        <Face who={heroWho5(s)} size="big" />
        <div class="t14"><b>{v.name}</b></div>
        <div class="t9 soft">{v.end}</div>
      </div>
    ) },
    { key: 'life', body: (
      <div class="scene5">
        <div class="t9 soft">한 줄 인생</div>
        <div class="t11">{v.oneLine}</div>
      </div>
    ) },
    { key: 'who', body: (
      <div class="scene5 center">
        <div class="t9 soft">어떤 사람이었나</div>
        <div class="t14"><b>{v.persona}</b></div>
        {v.dream && <div class="t9" style={{ marginTop: 8 }}>{v.dream}</div>}
      </div>
    ) },
    { key: 'world', body: (
      <div class="scene5">
        <div class="t9 soft">세계가 기억하는 나</div>
        <div class="paper">{v.remembered}</div>
      </div>
    ) },
    ...(v.canonWords.length || v.canonMoments.length ? [{ key: 'canon', body: (
      <div class="scene5">
        {v.canonWords.length > 0 && <div class="t9 soft">원작 인물의 한마디</div>}
        {v.canonWords.map((w, i) => <div key={i}><span class="soft">{w.who}</span> 「{w.line}」</div>)}
        {v.canonMoments.length > 0 && <div class="t9 soft" style={{ marginTop: 8 }}>겹친 원작 순간</div>}
        {v.canonMoments.map((m, i) => <div key={i} class="t9">{m}</div>)}
      </div>
    ) }] : []),
    ...(missed ? [{ key: 'road', body: (
      <div class="scene5">
        <div class="t9 soft">가지 않은 길</div>
        {v.unchosen.map((u, i) => <div key={i} class="t9">{u}</div>)}
        {v.secret && <div class="t9">{v.secret}</div>}
        {v.newCodex.length > 0 && (
          <details class="t9">
            <summary><span class="soft">도감에 새로 채운 것</span> {v.newCodex.length}가지</summary>
            {v.newCodex.map((c, i) => <div key={i}>{c}</div>)}
          </details>
        )}
      </div>
    ) }] : []),
    { key: 'goals', body: (
      <div class="scene5">
        <div class="t9 soft">항해의 목표</div>
        {v.goals.dreamVow && <div class="t9">★ {v.goals.dreamVow}</div>}
        {v.goals.promises.map((p, i) => <div key={i} class="t9">{p}</div>)}
        {!v.goals.dreamVow && v.goals.promises.length === 0 && <div class="t9">누구와도 약속하지 않고, 바람 부는 대로 살았다.</div>}
        <div class="t9 soft" style={{ marginTop: 8 }}>성장</div>
        <div class="t9">마지막 Lv {v.growth.level} · 가장 강했을 때 Lv {v.growth.peakLevel} ({v.growth.peakGrade}급)</div>
        <PowerSpark points={v.growth.history} w={260} h={48} />
      </div>
    ) },
    { key: 'record', body: (
      <div class="scene5">
        <div class="t9 soft">기록</div>
        {v.record.map((r) => <div key={r.label} class="row between t9"><span>{r.label}</span><b>{r.value}</b></div>)}
      </div>
    ) },
    { key: 'onepiece', body: (
      <div class="scene5 center">
        <div class="t11 soft">너에게 원피스는 무엇이었나?</div>
        <div class="t14 onepiece5"><b>{v.onePiece}</b></div>
      </div>
    ) },
  ];
  const [at, setAt] = useState(0);
  const last = at === scenes.length - 1;
  const next = () => setAt((i) => Math.min(scenes.length - 1, i + 1));
  return (
    <Modal title="인생 결산" cls="pend ending5">
      <div class="ending5-body" onClick={(e) => { if (!(e.target as HTMLElement).closest('details')) next(); }}>
        <div key={scenes[at].key} class="scene5-wrap">{scenes[at].body}</div>
      </div>
      <div class="row between ending5-nav t9">
        <button class="btn" disabled={at === 0} onClick={() => setAt((i) => Math.max(0, i - 1))}>◀</button>
        <span class="soft">{at + 1} / {scenes.length}</span>
        {!last && <button class="btn" onClick={next}>다음 ▶</button>}
        {last && <span />}
      </div>
      {last && <button class="btn gold block ending5-go" onClick={() => actions.endLife()}>명예의 전당에 남기고 처음으로</button>}
    </Modal>
  );
}
