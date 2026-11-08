import { $ } from '../dom';
import { DESIGNS } from '../designs/designs';
import { RINGS, STEP_NAMES, CENTER_KEYS, RING_KEYS } from '../designs/make-pieces';
import { circD, ring } from '../geometry/primitives';
import { PALETTE, second } from '../palette';
import { buildShapes, curStickers, currentShapes, designShapes, fillFor, ringFill } from '../scene';
import { canUndo, st } from '../state/store';
import { STK, STK_NAMES, stickerEl } from '../stickers';
import { pathEl, thumbSVG } from '../svgout';
import { ui } from './ui-state';
import { renderGallery } from './gallery-view';

const art = () => $<SVGSVGElement & HTMLElement>('art');

export function renderArt(): void {
  const sh = currentShapes();
  const stk = curStickers();
  let h = '<g class="art">' + sh.map((s) => pathEl(s, fillFor(s))).join('') + '</g><g class="stks">' + stk.map(stickerEl).join('') + '</g>';
  if (st.mode === 'build' && !sh.length && !stk.length) h += '<text class="hint" y="3">Pick a center below</text>';
  art().innerHTML = h;
  art().classList.toggle('stickering', ui.tool === 'sticker');
}

const DICE =
  '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="#FFC83D"/><circle cx="15" cy="15" r="1.2" fill="#FFC83D"/><circle cx="15" cy="9" r="1.2" fill="#FFC83D"/><circle cx="9" cy="15" r="1.2" fill="#FFC83D"/></svg>';

const designThumb = (id: string): string => {
  const f = st.color.fills[id] || {};
  return thumbSVG(designShapes(id), (s) => f[s.k] || null);
};
export function renderDesignStrip(): void {
  const ids: [string, string][] = DESIGNS.map((d) => [d.id, d.name]);
  if (st.color.surprise) ids.push(['surprise', 'Surprise design']);
  $('designStrip').innerHTML =
    ids.map(([id, name]) => `<button class="thumb" data-id="${id}" aria-label="${name}" aria-pressed="${id === st.color.id}">${designThumb(id)}</button>`).join('') +
    `<button class="thumb dice" id="newSurprise" aria-label="Make a surprise design">${DICE}<span>New</span></button>`;
}
let thumbT: ReturnType<typeof setTimeout> | undefined;
export function refreshThumb(): void {
  clearTimeout(thumbT);
  thumbT = setTimeout(() => {
    const b = $('designStrip').querySelector(`[data-id="${st.color.id}"]`);
    if (b) b.innerHTML = designThumb(st.color.id);
  }, 150);
}

export function renderBuildUI(): void {
  const b = st.build;
  $('steps').innerHTML =
    STEP_NAMES.map((n, i) => {
      const r = b.rings[i];
      return `<button class="step" data-step="${i}" aria-pressed="${i === b.step}"><i style="${r ? `background:${r.c};border-color:${r.c}` : ''}"></i>${n}</button>`;
    }).join('') + `<button class="step-dice" id="buildDice" aria-label="Surprise me with a whole rangoli">${DICE}</button>`;
  const keys = (b.step === 0 ? CENTER_KEYS : RING_KEYS).concat(['none']);
  const c = PALETTE[st.ci][1];
  const c2 = second(st.ci);
  const others = buildShapes(b.rings.map((r, j) => (j === b.step ? null : r)));
  const faint = others.map((s) => pathEl(s, ringFill(b.rings[s.ring!]!, s), 'faint')).join('');
  $('optStrip').innerHTML = keys
    .map((m) => {
      const cur = b.rings[b.step];
      const sel = m === 'none' ? !cur : cur && cur.m === m;
      let inner: string;
      if (m === 'none') {
        const [r1, r2] = RINGS[b.step];
        inner = `<svg viewBox="-100 -100 200 200" class="mini"><g class="art">${faint}<path d="${b.step === 0 ? circD(22) : ring(r1, r2).d}" style="fill:none;stroke-dasharray:4 4"/></g></svg>`;
      } else {
        const rs = b.rings.map((_, j) => (j === b.step ? { m } : null));
        const sh = buildShapes(rs);
        inner = `<svg viewBox="-100 -100 200 200" class="mini"><g class="art">${faint}${sh.map((s) => pathEl(s, s.role === 'a' ? c : c2)).join('')}</g></svg>`;
      }
      return `<button class="thumb" data-m="${m}" aria-label="${m === 'none' ? 'Remove this ring' : m}" aria-pressed="${!!sel}">${inner}</button>`;
    })
    .join('');
}

export function renderPalette(): void {
  $('paletteRow').innerHTML = PALETTE.map(
    ([n, c], i) => `<button class="sw" data-ci="${i}" style="--c:${c}" aria-label="${n}" aria-pressed="${i === st.ci}"></button>`,
  ).join('');
}
export function renderStickerRow(): void {
  $('stickerRow').innerHTML =
    Object.keys(STK)
      .map((k) => `<button class="stk-btn" data-s="${k}" aria-label="${STK_NAMES[k]}" aria-pressed="${k === st.sType}"><svg viewBox="-13 -13 26 26">${STK[k]}</svg></button>`)
      .join('') + `<button class="rep" id="repBtn" aria-pressed="${st.repeat}">${st.repeat ? '×8 around' : 'Just one'}</button>`;
}

const SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
const SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

export function renderChrome(): void {
  (['color', 'build', 'gallery'] as const).forEach((m) => $('tab-' + m).setAttribute('aria-selected', String(st.mode === m)));
  const g = st.mode === 'gallery';
  const sticker = ui.tool === 'sticker';
  $('colorTop').hidden = st.mode !== 'color';
  $('buildTop').hidden = st.mode !== 'build';
  $('main').hidden = g;
  $('gallery').hidden = !g;
  $('scope').hidden = sticker;
  $('paletteRow').hidden = sticker;
  $('stickerRow').hidden = !sticker;
  $('scopeWhole').setAttribute('aria-pressed', String(st.whole));
  $('scopeOne').setAttribute('aria-pressed', String(!st.whole));
  $('soundBtn').innerHTML = st.sound ? SOUND_ON : SOUND_OFF;
  $('soundBtn').setAttribute('aria-label', st.sound ? 'Sound on' : 'Sound off');
  $('stkBtn').setAttribute('aria-pressed', String(sticker));
  ($('undoBtn') as HTMLButtonElement).disabled = !canUndo();
}

export function renderAll(): void {
  renderChrome();
  if (st.mode === 'gallery') {
    void renderGallery();
    return;
  }
  if (st.mode === 'color') renderDesignStrip();
  else renderBuildUI();
  renderArt();
}
