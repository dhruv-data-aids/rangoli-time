import { $, esc, toast } from '../dom';
import { designShapes } from '../scene';
import { pushUndo, st, save } from '../state/store';
import { deleteItem, exportGallery, importGallery, listItems, type GalleryItem } from '../storage/gallery';
import { shareFile, stamp } from '../share';
import { pathEl, svgDataUrl, svgToPng } from '../svgout';
import { ui } from './ui-state';
import { renderAll } from './render';

const dateOf = (t: number): string => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const badgeOf = (it: GalleryItem): string => (it.mode === 'colored' ? `Colored · ${it.designName}` : 'Made by me');

let items: GalleryItem[] = [];
let viewing: GalleryItem | null = null;

export async function renderGallery(): Promise<void> {
  items = await listItems();
  const f = ui.galleryFilter;
  const shown = items.filter((i) => f === 'all' || i.mode === f);
  const chip = (id: typeof f, label: string) => `<button class="chip" data-filter="${id}" aria-pressed="${f === id}">${label}</button>`;
  let body: string;
  if (!items.length) {
    body = `<div class="empty"><svg viewBox="-100 -100 200 200"><g class="art">${designShapes('lotus').map((s) => pathEl(s, null)).join('')}</g></svg><div>No rangolis saved yet.<br>Color one or make your own, then tap Save.</div><button class="pill" id="goColor">Start coloring</button></div>`;
  } else if (!shown.length) {
    body = `<div class="empty"><div>Nothing here yet.<br>${f === 'colored' ? 'Color a design' : 'Make a rangoli'} and tap Save.</div></div>`;
  } else {
    body = `<div class="ggrid">${shown
      .map(
        (it) =>
          `<button class="gcard" data-id="${esc(it.id)}" aria-label="${esc(badgeOf(it))}, ${dateOf(it.createdAt)}"><img src="${svgDataUrl(it.svg)}" alt="" draggable="false"><span class="badge ${it.mode === 'made' ? 'made' : ''}">${esc(badgeOf(it))}</span><span class="gdate">${dateOf(it.createdAt)}</span></button>`,
      )
      .join('')}</div>`;
  }
  $('gallery').innerHTML =
    `<div class="ghead"><h2>Your rangolis<small>${items.length}</small></h2><div class="chips" role="group" aria-label="Filter">${chip('all', 'All')}${chip('colored', 'Colored')}${chip('made', 'Made')}</div></div>` +
    `<div class="gtools"><button id="gExport">Export gallery</button><button id="gImport">Import gallery</button></div>` +
    body;
}

/* ---------- viewer ---------- */
let delArm = false;
let delT: ReturnType<typeof setTimeout> | undefined;
function resetDelete(): void {
  delArm = false;
  clearTimeout(delT);
  $('vDel').textContent = 'Delete';
  $('vDel').classList.remove('armed');
}
function openViewer(it: GalleryItem): void {
  viewing = it;
  ($('vart') as HTMLImageElement).src = svgDataUrl(it.svg);
  $('vBadge').innerHTML = `${esc(badgeOf(it))}<small>${dateOf(it.createdAt)}</small>`;
  resetDelete();
  $('viewer').hidden = false;
  ($('vKeep') as HTMLButtonElement).focus();
}
function closeViewer(): void {
  $('viewer').hidden = true;
  viewing = null;
  resetDelete();
}

function keepWorking(it: GalleryItem): void {
  if (it.mode === 'colored') {
    const s = it.state;
    st.color.id = s.designId; // switch first so Undo restores the design we are about to overwrite
    if (s.designId === 'surprise' && !st.color.surprise) st.color.surprise = s.surprise;
    pushUndo('color');
    if (s.surprise) st.color.surprise = s.surprise;
    st.color.fills[s.designId] = { ...s.fills };
    st.color.stk[s.designId] = s.stk.map((x) => ({ ...x }));
    st.mode = 'color';
  } else {
    pushUndo('build');
    st.build = { rings: JSON.parse(JSON.stringify(it.state.rings)), step: 3, stk: it.state.stk.map((x) => ({ ...x })) };
    st.mode = 'build';
  }
  save();
  closeViewer();
  renderAll();
  toast('Back to work! Undo brings back what was here before.');
}

async function savePicture(it: GalleryItem): Promise<void> {
  try {
    const blob = await svgToPng(it.svg);
    const name = it.mode === 'colored' ? it.designName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'my-rangoli';
    const r = await shareFile(new File([blob], `rangoli-${name}-${stamp()}.png`, { type: 'image/png' }));
    if (r === 'shared') toast('Picture ready!');
    else if (r === 'downloaded') toast('Picture downloaded');
  } catch {
    toast("Couldn't make the picture. Please try again.");
  }
}

async function doExport(): Promise<void> {
  try {
    const json = await exportGallery();
    const r = await shareFile(new File([json], `rangoli-time-backup-${stamp()}.json`, { type: 'application/json' }));
    if (r === 'shared') toast('Backup ready. Save it to Files or iCloud Drive.');
    else if (r === 'downloaded') toast('Backup downloaded');
  } catch {
    toast("Couldn't export. Please try again.");
  }
}

async function doImport(file: File): Promise<void> {
  try {
    const res = await importGallery(await file.text());
    toast(res.added ? `Added ${res.added} rangoli${res.added === 1 ? '' : 's'}${res.skipped ? ` (${res.skipped} already here)` : ''}` : res.skipped ? 'Those rangolis are already in your gallery' : 'Nothing could be added from that file');
    await renderGallery();
  } catch (e) {
    toast((e as Error).message || "Couldn't read that file.");
  }
}

export function initGallery(): void {
  $('gallery').addEventListener('click', (e) => {
    const t = e.target as Element;
    const chip = t.closest<HTMLElement>('[data-filter]');
    if (chip) {
      ui.galleryFilter = chip.dataset.filter as typeof ui.galleryFilter;
      void renderGallery();
      return;
    }
    const card = t.closest<HTMLElement>('[data-id]');
    if (card) {
      const it = items.find((x) => x.id === card.dataset.id);
      if (it) openViewer(it);
      return;
    }
    if (t.closest('#goColor')) {
      st.mode = 'color';
      renderAll();
      save();
    } else if (t.closest('#gExport')) void doExport();
    else if (t.closest('#gImport')) $<HTMLInputElement>('importFile').click();
  });
  $<HTMLInputElement>('importFile').addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0];
    input.value = '';
    if (f) void doImport(f);
  });
  $('vClose').addEventListener('click', closeViewer);
  $('viewer').addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') closeViewer(); });
  $('vKeep').addEventListener('click', () => viewing && keepWorking(viewing));
  $('vPic').addEventListener('click', () => viewing && void savePicture(viewing));
  $('vDel').addEventListener('click', async () => {
    if (!viewing) return;
    if (!delArm) {
      delArm = true;
      $('vDel').textContent = 'Tap again to delete';
      $('vDel').classList.add('armed');
      delT = setTimeout(resetDelete, 2800);
      return;
    }
    const id = viewing.id;
    closeViewer();
    await deleteItem(id);
    await renderGallery();
    toast('Deleted');
  });
}
