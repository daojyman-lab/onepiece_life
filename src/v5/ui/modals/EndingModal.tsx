// 엔딩 창 (설계 5.8): 끝난 인생을 돌아본다. 창을 닫는 길은 명예의 전당에 남기는 것뿐이다.
// 본문은 창 안에서 스크롤하고, 맨 아래 단추는 늘 닿는다. (v4 src/ui/modals/EndingModal.tsx의 poster · paper · hr · btn gold block)
import { actions } from '../../app/store';
import type { Meta5 } from '../../core/meta';
import type { Life5 } from '../../core/types';
import { Face, Modal } from '../common';
import { endingView, heroWho5 } from '../view';

/** meta: 이 인생을 더하기 전의 도감 */
export function EndingModal({ s, meta }: { s: Life5; meta: Meta5 }) {
  const v = endingView(s, meta);
  const missed = v.unchosen.length > 0 || !!v.secret || v.newCodex.length > 0;
  return (
    <Modal title="인생 결산" cls="pend ending5">
      <div class="ending5-body stack">
        <div class="poster">
          <Face who={heroWho5(s)} size="big" />
          <div class="t14"><b>{v.name}</b></div>
          <div class="t9 soft">{v.end}</div>
          <div class="hr" />
          <div class="t9 soft">어떤 사람이었나</div>
          <div class="t14"><b>{v.persona}</b></div>
          {v.dream && <div class="t9" style={{ marginTop: 4 }}>{v.dream}</div>}
        </div>
        <section>
          <b>한 줄 인생</b>
          <div>{v.oneLine}</div>
        </section>
        <section>
          <b>세계가 기억하는 나</b>
          <div class="paper">{v.remembered}</div>
        </section>
        {v.canonWords.length > 0 && (
          <section>
            <b>원작 인물의 한마디</b>
            {v.canonWords.map((w, i) => <div key={i}><span class="soft">{w.who}</span> 「{w.line}」</div>)}
          </section>
        )}
        {v.canonMoments.length > 0 && (
          <section>
            <b>겹친 원작 순간</b>
            {v.canonMoments.map((m, i) => <div key={i} class="t9">{m}</div>)}
          </section>
        )}
        {missed && (
          <section>
            <b>가지 않은 길</b>
            {v.unchosen.map((u, i) => <div key={i} class="t9">{u}</div>)}
            {v.secret && <div class="t9">{v.secret}</div>}
            {v.newCodex.length > 0 && (
              <details class="t9">
                <summary><span class="soft">도감에 새로 채운 것</span> {v.newCodex.length}가지</summary>
                {v.newCodex.map((c, i) => <div key={i}>{c}</div>)}
              </details>
            )}
          </section>
        )}
        <details>
          <summary><b>기록</b></summary>
          {v.record.map((r) => <div key={r.label} class="row between t9"><span>{r.label}</span><b>{r.value}</b></div>)}
        </details>
      </div>
      <button class="btn gold block ending5-go" onClick={() => actions.endLife()}>명예의 전당에 남기고 처음으로</button>
    </Modal>
  );
}
