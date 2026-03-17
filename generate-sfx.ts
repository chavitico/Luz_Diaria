// Generates minimal WAV sound effects for the Duel game
// Run: bun generate-sfx.ts

import { writeFileSync } from 'fs';
import { join } from 'path';

const SAMPLE_RATE = 22050;
const OUT = join(import.meta.dir, 'mobile/assets/audio');

function sine(freq: number, t: number): number {
  return Math.sin(2 * Math.PI * freq * t);
}

function generateTone(
  frequency: number,
  durationSec: number,
  amplitude = 14000,
  fadeMs = 20,
): Int16Array {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const fadeSamples = Math.floor(SAMPLE_RATE * (fadeMs / 1000));
  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    let env = 1.0;
    if (i < fadeSamples) env = i / fadeSamples;
    if (i > numSamples - fadeSamples) env = (numSamples - i) / fadeSamples;
    samples[i] = Math.round(amplitude * sine(frequency, t) * env);
  }
  return samples;
}

function generateSequence(
  notes: Array<{ freq: number; dur: number; amp?: number }>,
  defaultAmp = 14000,
): Int16Array {
  const parts: Int16Array[] = notes.map(({ freq, dur, amp }) =>
    generateTone(freq, dur, amp ?? defaultAmp),
  );
  const total = parts.reduce((s, p) => s + p.length, 0);
  const out = new Int16Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

function toWAV(samples: Int16Array): Buffer {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(samples[i], 44 + i * 2);
  }
  return buf;
}

function save(name: string, samples: Int16Array) {
  const path = join(OUT, name);
  writeFileSync(path, toWAV(samples));
  console.log(`✓ ${name}  (${(toWAV(samples).length / 1024).toFixed(1)} KB)`);
}

// ── tap.wav — short high click for button presses ─────────────────────────────
save('tap.wav', generateTone(880, 0.065, 10000));

// ── tick.wav — countdown tick (pre-game 3-2-1 and last seconds) ───────────────
save('tick.wav', generateTone(660, 0.095, 12000));

// ── match_found.wav — ascending chime when opponent found ─────────────────────
save('match_found.wav', generateSequence([
  { freq: 659, dur: 0.12 },
  { freq: 784, dur: 0.14 },
  { freq: 1047, dur: 0.28 },
], 14000));

// ── correct.wav — bright ascending arpeggio (C5-E5-G5) ───────────────────────
save('correct.wav', generateSequence([
  { freq: 523, dur: 0.10 },
  { freq: 659, dur: 0.10 },
  { freq: 784, dur: 0.26 },
], 14000));

// ── wrong.wav — descending dull buzz ─────────────────────────────────────────
save('wrong.wav', generateSequence([
  { freq: 277, dur: 0.12 },
  { freq: 220, dur: 0.22 },
], 13000));

// ── win.wav — triumphant 4-note ascent (C5-E5-G5-C6) ─────────────────────────
save('win.wav', generateSequence([
  { freq: 523,  dur: 0.10 },
  { freq: 659,  dur: 0.10 },
  { freq: 784,  dur: 0.10 },
  { freq: 1047, dur: 0.38 },
], 14000));

// ── lose.wav — descending melancholy (G4-E4-C4) ──────────────────────────────
save('lose.wav', generateSequence([
  { freq: 392, dur: 0.13 },
  { freq: 330, dur: 0.13 },
  { freq: 262, dur: 0.30 },
], 12000));

console.log('\nAll SFX generated successfully.');
