import { useEffect, useRef } from 'preact/hooks';
import { drawScene, type SceneInput } from './pixelArt';

export function usePixelScene(input: SceneInput) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef(input);
  const requestDraw = useRef<(() => void) | null>(null);
  live.current = input;

  useEffect(() => {
    const element = canvas.current;
    const ctx = element?.getContext('2d');
    if (!element || !ctx) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame: number | null = null;
    let origin: number | undefined;
    let previous: SceneInput | undefined;
    let drawnAt = -Infinity;
    let strikeAt = 0;

    const schedule = (): void => { frame ??= requestAnimationFrame(paint); };
    const paint = (now: number) => {
      frame = null;
      const scene = live.current;
      origin ??= now;
      if (previous?.strike !== scene.strike) strikeAt = now;
      const w = element.clientWidth, h = element.clientHeight;
      const resized = element.width !== w || element.height !== h;
      if (w && h && (scene !== previous || resized || now - drawnAt >= 32)) {
        if (resized) { element.width = w; element.height = h; }
        const t = motion.matches ? 0 : (now - origin) / 1000;
        const strikeAge = motion.matches ? 1 : (now - strikeAt) / 1000;
        drawScene(ctx, w, h, t, scene, strikeAge);
        previous = scene;
        drawnAt = now;
      }
      if (!motion.matches) schedule();
    };

    const repaint = () => {
      drawnAt = -Infinity;
      schedule();
    };
    requestDraw.current = repaint;
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    motion.addEventListener('change', repaint);
    repaint();
    return () => {
      requestDraw.current = null;
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      motion.removeEventListener('change', repaint);
    };
  }, []);

  useEffect(() => { requestDraw.current?.(); }, [input]);
  return canvas;
}
