import { st } from '../state/store';
import { pick } from '../dom';

let ac: AudioContext | null = null;
export function ensureAudio(): void {
  if (!ac) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ac = new Ctor();
    } catch {
      /* no audio available */
    }
  }
  if (ac && ac.state === 'suspended') void ac.resume();
}

function tone(f: number, t: number, d: number, type: OscillatorType = 'sine', v = 0.14): void {
  if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t + d);
  o.connect(g).connect(ac.destination);
  o.start(t);
  o.stop(t + d + 0.05);
}

const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
const ready = (): boolean => st.sound && !!ac;

export const sfx = {
  fill(): void {
    if (ready()) tone(pick(SCALE), ac!.currentTime, 0.4, 'triangle', 0.13);
  },
  sticker(): void {
    if (!ready()) return;
    const t = ac!.currentTime;
    tone(1318.5, t, 0.6, 'sine', 0.08);
    tone(1975.5, t + 0.05, 0.5, 'sine', 0.05);
  },
  win(): void {
    if (!ready()) return;
    const t = ac!.currentTime;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, t + i * 0.09, 0.6, 'triangle', 0.11));
  },
};
