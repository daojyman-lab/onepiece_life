import { useLayoutEffect, useRef } from 'preact/hooks';
import { actions } from '../../app/store';
import type { Life5, NewsIssue } from '../../core/types';
import { canonYear } from '../../data/world-history';
import { fmtMoney } from '../../shared/core/util';
import { Face } from '../common';

const EDITION: Record<NewsIssue['kind'], string> = {
  big: '빅 뉴스', world: '세계 정세', local: '항구 통신', bounty: '해군 수배서',
};

interface NewsProps { s: Life5; shownId: number }

function deliveredNews({ s, shownId }: NewsProps): NewsIssue[] {
  return (s.news ?? []).filter(issue => issue.logId === undefined || issue.logId <= shownId);
}

export function NewsStrip(props: NewsProps) {
  const issue = deliveredNews(props).at(-1);
  if (!issue) return null;
  return (
    <button class="news-strip" aria-haspopup="dialog" onClick={() => actions.open('news')}>
      <b class="news-coo">뉴스 쿠</b>
      <span class="news-headline">{issue.title}</span>
      <span class="news-open">신문철 열기 <span aria-hidden="true">▸</span></span>
    </button>
  );
}

function Article({ s, issue, latest }: { s: Life5; issue: NewsIssue; latest: boolean }) {
  const bounty = issue.kind === 'bounty' ? issue.amount ?? 0 : 0;
  return (
    <details class="news-issue" open={latest}>
      <summary>
        <span class="news-dateline">
          <b>{bounty > 0 ? '내 수배서' : EDITION[issue.kind]}</b> · 해원력 {canonYear(issue.age)}년 {issue.part + 1}분기
        </span>
        <strong>{issue.title}</strong>
      </summary>
      <p>{issue.body}</p>
      {bounty > 0 && (
        <figure class="poster news-poster">
          <div class="wanted" lang="en">WANTED</div>
          <Face who={{ key: `hero:${s.rng.seed}`, gender: s.hero.gender, species: s.hero.species, age: issue.age, faction: 'pirate' }} />
          <figcaption>현상금 <b>{fmtMoney(bounty)} 베리</b></figcaption>
        </figure>
      )}
    </details>
  );
}

export function NewsArchive(props: NewsProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  const issues = deliveredNews(props).reverse();
  return (
    <dialog class="news-archive" ref={ref} aria-labelledby="news-archive-title"
      onCancel={event => { event.preventDefault(); actions.close(); }}>
      <div class="news-masthead">
        <h2 id="news-archive-title">뉴스 쿠 신문철</h2>
        <button class="btn small" onClick={actions.close}>닫기 ✕</button>
      </div>
      <div class="news-issues">
        {issues.map((issue, index) => <Article s={props.s} issue={issue} latest={index === 0} key={issue.id} />)}
      </div>
    </dialog>
  );
}
