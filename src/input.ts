/** Touch rules: ignore palms / multi-touch taps, block page pinch-zoom and double-tap zoom. */
const touches = new Set<number>();
let lastMulti = 0;

export function installGuards(): void {
  const add = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    touches.add(e.pointerId);
    if (touches.size > 1) lastMulti = performance.now();
  };
  const del = (e: PointerEvent) => touches.delete(e.pointerId);
  document.addEventListener('pointerdown', add, { capture: true, passive: true });
  document.addEventListener('pointerup', del, { capture: true, passive: true });
  document.addEventListener('pointercancel', del, { capture: true, passive: true });
  // buttons: swallow the click that follows a multi-finger touch
  document.addEventListener(
    'click',
    (e) => {
      if (touches.size > 1 || performance.now() - lastMulti < 350) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true,
  );
  // no pinch zoom (Safari ignores user-scalable=no), no double-tap zoom, no long-press menu
  for (const t of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(t, (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
  let lastEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastEnd < 300 && (e.target as Element).closest('#art')) e.preventDefault();
    lastEnd = now;
  }, { passive: false });
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}

/**
 * A "tap" is a single-pointer press-and-release with almost no movement.
 * It is ignored if a second finger is (or was) down meanwhile.
 */
export function onTap(el: Element, handler: (e: PointerEvent) => void): void {
  const down = new Map<number, { x: number; y: number; ok: boolean }>();
  el.addEventListener('pointerdown', (e) => {
    const p = e as PointerEvent;
    if (p.pointerType === 'mouse' && p.button !== 0) return;
    down.set(p.pointerId, { x: p.clientX, y: p.clientY, ok: touches.size <= 1 && down.size === 0 });
    if (down.size > 1) down.forEach((v) => (v.ok = false));
  });
  el.addEventListener('pointerup', (e) => {
    const p = e as PointerEvent;
    const d = down.get(p.pointerId);
    down.delete(p.pointerId);
    if (!d || !d.ok) return;
    if (Math.hypot(p.clientX - d.x, p.clientY - d.y) > 14) return;
    handler(p);
  });
  el.addEventListener('pointercancel', (e) => down.delete((e as PointerEvent).pointerId));
}
