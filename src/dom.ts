export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

export const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

let toastT: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string): void {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => (t.hidden = true), 2600);
}

export const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
