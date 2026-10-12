import { SECONDS_PER_MINUTE } from '../config';

const PAD_LENGTH = 2;

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / SECONDS_PER_MINUTE)).padStart(PAD_LENGTH, '0');
  const ss = String(s % SECONDS_PER_MINUTE).padStart(PAD_LENGTH, '0');
  return `${mm}:${ss}`;
}
