// v5 화면의 공용 조각. v4 src/ui/common.tsx의 같은 이름과 같은 마크업 · 클래스 (v4의 LifeState에 기대는 것은 옮기지 않는다).
import type { ComponentChildren } from 'preact';
import type { Who } from '../../ui/pixel/pixelArt';
import { portraitURL } from './portraits';

export const fmt = (n: number) => Math.round(n).toLocaleString('ko-KR');

export function Face({ who, size = '', title }: { who: Who; size?: '' | 'big' | 'sm' | 'xs'; title?: string }) {
  return <img class={`face ${size}`} src={portraitURL(who)} alt={title ?? ''} title={title} />;
}

export function Gauge({ value, max, kind = 'hp', thin }: { value: number; max: number; kind?: 'hp' | 'sp' | 'gold'; thin?: boolean }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div class={`gauge ${kind} ${thin ? 'thin' : ''} ${kind === 'hp' && pct < 30 ? 'low' : ''}`} role="meter" aria-valuenow={Math.round(value)} aria-valuemax={Math.round(max)}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Modal({ title, children, onClose, wide, cls = '' }: { title: string; children: ComponentChildren; onClose?: () => void; wide?: boolean; cls?: string }) {
  return (
    <div class="overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div class={`modal frame frame-pad ${wide ? 'wide' : ''} ${cls}`}>
        <div class="head">
          <span class="sign">{title}</span>
          {onClose && <button class="btn small" onClick={onClose}>닫기 ✕</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Panel({ title, children, extra, cls = '' }: { title: string; children: ComponentChildren; extra?: ComponentChildren; cls?: string }) {
  return (
    <section class={`frame frame-pad ${cls}`}>
      <div class="row between" style={{ marginBottom: 6 }}>
        <span class="sign">{title}</span>
        {extra}
      </div>
      {children}
    </section>
  );
}
