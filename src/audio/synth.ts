/**
 * The building blocks of every sound (ADR-0004): enveloped oscillator tones
 * and filtered noise, scheduled on an audio context's clock.
 */

/** Where and when a sound plays. */
export type Output = {
  context: BaseAudioContext
  destination: AudioNode
  /** When it starts, on the context's clock. */
  at: number
}

/** A MIDI note number's frequency; 69 is A4 at 440 Hz. */
export const frequency = (note: number) => 440 * 2 ** ((note - 69) / 12)

type Tone = {
  wave: OscillatorType
  /** A MIDI note number... */
  note: number
  /** ...optionally gliding to another over the tone. */
  glideTo?: number
  /** In seconds. */
  duration: number
  /** Peak level, from 0 to 1. */
  level: number
  /** Seconds after `at` the tone starts. */
  delay?: number
  attack?: number
}

/** A tone that swells in over `attack` and fades out by its end. */
export function tone(
  { context, destination, at }: Output,
  { wave, note, glideTo, duration, level, delay = 0, attack = 0.005 }: Tone
) {
  const start = at + delay
  const end = start + duration
  const oscillator = context.createOscillator()
  oscillator.type = wave
  oscillator.frequency.setValueAtTime(frequency(note), start)
  if (glideTo !== undefined)
    oscillator.frequency.exponentialRampToValueAtTime(frequency(glideTo), end)
  const envelope = context.createGain()
  envelope.gain.setValueAtTime(0, start)
  envelope.gain.linearRampToValueAtTime(level, start + attack)
  envelope.gain.exponentialRampToValueAtTime(0.0001, end)
  oscillator.connect(envelope).connect(destination)
  oscillator.start(start)
  oscillator.stop(end + 0.02)
}

type Noise = {
  /** In seconds. */
  duration: number
  level: number
  /** A low-pass filter's cutoff, in Hz, sweeping down to `sweepTo`. */
  cutoff: number
  sweepTo?: number
  delay?: number
}

/** A burst of white noise through a low-pass filter. */
export function noise(
  { context, destination, at }: Output,
  { duration, level, cutoff, sweepTo, delay = 0 }: Noise
) {
  const start = at + delay
  const end = start + duration
  const length = Math.ceil(context.sampleRate * duration)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) samples[i] = Math.random() * 2 - 1
  const source = context.createBufferSource()
  source.buffer = buffer
  const filter = context.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.setValueAtTime(cutoff, start)
  if (sweepTo !== undefined)
    filter.frequency.exponentialRampToValueAtTime(sweepTo, end)
  const envelope = context.createGain()
  envelope.gain.setValueAtTime(level, start)
  envelope.gain.exponentialRampToValueAtTime(0.0001, end)
  source.connect(filter).connect(envelope).connect(destination)
  source.start(start)
  source.stop(end + 0.02)
}
