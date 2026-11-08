import { $, toast } from '../dom';
import { RINGS } from '../designs/make-pieces';
import { randomCfg } from '../designs/surprise';
import { burstAtCenter, burstAtEvent, celebrate } from '../fx/sparkles';
import { ensureAudio, sfx } from '../fx/sound';
import { onTap } from '../input';
import { PALETTE, second } from '../palette';
import { curStickers, currentShapes, designName, designShapes, fillFor } from '../scene';
import { clearUndo, flushSave, popUndo, pushUndo, save, st } from '../state/store';
import { newId, recipeOf, saveItem, type GalleryItem } from '../storage/gallery';
import { placeStickers, stickerEl } from '../stickers';
import { standaloneSvg } from '../svgout';
import { renderAll, renderArt, renderBuildUI, renderChrome, renderDesignStrip, renderPalette, renderStickerRow, refreshThumb } from './render';
import { ui } from './ui-state';

const art = () => $<HTMLElement>('art') as unknown as SVGSVGElement;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function svgPoint(e: PointerEvent): [number, number] | null {
  const m = art().getScreenCTM();
  if (!m) return null;
  const p = art().createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  const q = p.matrixTransform(m.inverse());
  return [Math.max(-96, Math.min(96, q.x)), Math.max(-96, Math.min(96, q.y))];
}
function pop(el: Element): void {
  el.classList.remove('pop');
  void (el as HTMLElement).getBoundingClientRect();
  el.classList.add('pop');
}

/* ---------- painting ---------- */
function onArtTap(e: PointerEvent): void {
  if (ui.tool === 'sticker') return placeSticker(e);
  const el = (e.target as Element).closest<SVGPathElement>('path[data-k]');
  if (!el) return;
  const shapes = currentShapes();
  const shape = shapes.find((s) => s.k === el.dataset.k);
  if (!shape) return;
  const c = PALETTE[st.ci][1];
  const targets = st.whole ? shapes.filter((s) => s.g === shape.g) : [shape];
  let wasComplete = false;

  if (st.mode === 'color') {
    const f = (st.color.fills[st.color.id] ??= {});
    if (targets.every((t) => f[t.k] === c)) return; // nothing would change
    wasComplete = designShapes(st.color.id).every((s) => f[s.k]);
    pushUndo();
    targets.forEach((t) => (f[t.k] = c));
  } else {
    const rg = shape.ring !== undefined ? st.build.rings[shape.ring] : null;
    if (!rg) return;
    const role = shape.role === 'a' ? 'c' : 'c2';
    if (st.whole) {
      const hasOverride = targets.some((t) => rg.o[t.k]);
      if (rg[role] === c && !hasOverride) return;
      pushUndo();
      rg[role] = c;
      targets.forEach((t) => delete rg.o[t.k]);
    } else {
      if (fillFor(shape) === c) return;
      pushUndo();
      rg.o[shape.k] = c;
    }
  }

  const keys = new Set(targets.map((t) => t.k));
  art().querySelectorAll<SVGPathElement>('.art path').forEach((p) => {
    if (!keys.has(p.dataset.k!)) return;
    p.classList.remove('blank');
    p.style.fill = c;
    pop(p);
  });
  sfx.fill();
  burstAtEvent(e, 6, 40);
  save();
  renderChrome();
  if (st.mode === 'color') {
    refreshThumb();
    const f = st.color.fills[st.color.id];
    if (!wasComplete && designShapes(st.color.id).every((s) => f[s.k])) {
      setTimeout(() => {
        celebrate();
        toast('All colored in! Tap Save to keep it.');
      }, 250);
    }
  } else renderBuildUI();
}

function placeSticker(e: PointerEvent): void {
  const p = svgPoint(e);
  if (!p) return;
  pushUndo();
  const list = curStickers();
  list.push(...placeStickers(st.sType, p[0], p[1], st.repeat));
  const layer = art().querySelector('.stks');
  if (layer) layer.innerHTML = list.map(stickerEl).join('');
  art().querySelector('.hint')?.remove();
  sfx.sticker();
  burstAtEvent(e, 8, 46);
  save();
  renderChrome();
  if (st.mode === 'color') refreshThumb();
}

/* ---------- saving ---------- */
async function saveCurrent(): Promise<void> {
  const shapes = currentShapes();
  const stk = curStickers();
  if (st.mode === 'build' && !shapes.length && !stk.length) return void toast('Add some pieces first');
  const svg = standaloneSvg(shapes, fillFor, stk);
  const base = { id: newId(), createdAt: Date.now(), svg };
  let item: GalleryItem;
  if (st.mode === 'color') {
    const id = st.color.id;
    item = {
      ...base,
      mode: 'colored',
      designName: designName(id),
      state: { designId: id, surprise: id === 'surprise' ? clone(st.color.surprise) : null, fills: clone(st.color.fills[id] || {}), stk: clone(stk) },
    };
  } else {
    item = { ...base, mode: 'made', recipe: recipeOf(st.build.rings), state: { rings: clone(st.build.rings), stk: clone(stk) } };
  }
  try {
    await saveItem(item);
    celebrate();
    toast('Saved to your gallery!');
  } catch {
    toast("Couldn't save. Is the device storage full?");
  }
}

/* ---------- wiring ---------- */
export function initActions(): void {
  onTap(art(), onArtTap);
  document.addEventListener('pointerdown', ensureAudio, { passive: true });

  $('designStrip').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    if (b.id === 'newSurprise') {
      if (st.color.id === 'surprise') pushUndo();
      st.color.surprise = randomCfg();
      st.color.fills.surprise = {};
      st.color.stk.surprise = [];
      st.color.id = 'surprise';
      renderDesignStrip();
      renderArt();
      renderChrome();
      save();
      sfx.sticker();
      $('designStrip').querySelector('[data-id="surprise"]')?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
      toast('A brand-new design, just for you!');
      return;
    }
    st.color.id = b.dataset.id!;
    $('designStrip').querySelectorAll('[data-id]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderArt();
    renderChrome();
    save();
  });

  $('steps').addEventListener('click', (e) => {
    const b = (e.target as Element).closest('button');
    if (!b) return;
    if (b.id === 'buildDice') {
      pushUndo();
      st.build.rings = randomCfg().map((m) => {
        const ci = Math.floor(Math.random() * 12);
        return { m, c: PALETTE[ci][1], c2: second(ci), o: {} };
      });
      st.build.step = 3;
      renderBuildUI();
      renderArt();
      renderChrome();
      save();
      celebrate();
      return;
    }
    st.build.step = +b.dataset.step!;
    renderBuildUI();
    save();
  });

  let advT: ReturnType<typeof setTimeout> | undefined;
  $('optStrip').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button[data-m]');
    if (!b) return;
    const m = b.dataset.m!;
    const i = st.build.step;
    pushUndo();
    st.build.rings[i] = m === 'none' ? null : { m, c: PALETTE[st.ci][1], c2: second(st.ci), o: {} };
    renderArt();
    renderBuildUI();
    renderChrome();
    save();
    if (m === 'none') return;
    sfx.fill();
    burstAtCenter(14, 0.35);
    clearTimeout(advT);
    if (i < RINGS.length - 1) {
      advT = setTimeout(() => {
        if (st.mode === 'build' && st.build.step === i) {
          st.build.step = i + 1;
          renderBuildUI();
          save();
        }
      }, 550);
    } else toast('Lovely! Add diyas and flowers with Stickers, then Save.');
  });

  $('paletteRow').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-ci]');
    if (!b) return;
    st.ci = +b.dataset.ci!;
    $('paletteRow').querySelectorAll('[data-ci]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (st.mode === 'build') renderBuildUI();
    save();
  });
  $('stickerRow').addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('button');
    if (!b) return;
    if (b.id === 'repBtn') st.repeat = !st.repeat;
    else st.sType = b.dataset.s!;
    renderStickerRow();
    save();
  });

  $('scopeWhole').addEventListener('click', () => setScope(true));
  $('scopeOne').addEventListener('click', () => setScope(false));
  function setScope(whole: boolean): void {
    st.whole = whole;
    renderChrome();
    save();
    toast(whole ? 'Whole ring: one tap colors every matching piece' : 'One piece: color each piece yourself');
  }

  document.querySelector('.tabs')!.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-mode]');
    if (!b) return;
    st.mode = b.dataset.mode as typeof st.mode;
    renderAll();
    save();
  });
  $('soundBtn').addEventListener('click', () => {
    st.sound = !st.sound;
    ensureAudio();
    renderChrome();
    save();
    if (st.sound) sfx.fill();
  });
  $('undoBtn').addEventListener('click', () => {
    if (!popUndo()) return;
    renderAll();
    save();
  });
  $('clearBtn').addEventListener('click', () => {
    pushUndo();
    if (st.mode === 'color') {
      st.color.fills[st.color.id] = {};
      st.color.stk[st.color.id] = [];
    } else {
      st.build.rings = [null, null, null, null];
      st.build.stk = [];
      st.build.step = 0;
    }
    renderAll();
    save();
    toast('Cleared. Tap Undo to bring it back.');
  });
  $('stkBtn').addEventListener('click', () => {
    ui.tool = ui.tool === 'sticker' ? 'paint' : 'sticker';
    renderStickerRow();
    renderChrome();
    $('art').classList.toggle('stickering', ui.tool === 'sticker');
    if (ui.tool === 'sticker') toast('Tap the rangoli to add stickers');
  });
  $('saveBtn').addEventListener('click', () => void saveCurrent());

  // iOS may suspend the page without warning: write the work-in-progress straight away
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
  addEventListener('pagehide', flushSave);
}

export function initChrome(): void {
  renderPalette();
  renderStickerRow();
  clearUndo();
}
