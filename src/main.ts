import '@fontsource/baloo-2/latin-500.css';
import '@fontsource/baloo-2/latin-600.css';
import '@fontsource/baloo-2/latin-700.css';
import '@fontsource/baloo-2/latin-800.css';
import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { $ } from './dom';
import { A, petal } from './geometry/primitives';
import { installGuards } from './input';
import { loadWip, requestPersistence, saveWip } from './storage/db';
import { replaceState, setSaver } from './state/store';
import { initActions, initChrome } from './ui/actions';
import { initGallery } from './ui/gallery-view';
import { renderAll } from './ui/render';

async function boot(): Promise<void> {
  installGuards();
  $('logo').innerHTML = `${A(6, 0, (a) => `<path d="${petal(10, 92, a, 0.5).d}" fill="#FFC83D"/>`).join('')}<circle r="26" fill="#E3262F"/>`;
  void requestPersistence(); // ask the browser not to evict the gallery
  replaceState(await loadWip());
  setSaver(saveWip);
  initChrome();
  initActions();
  initGallery();
  renderAll();
  registerSW({ immediate: true });
}
void boot();
