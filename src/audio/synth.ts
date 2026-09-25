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
  /** Low-pass cutoff, in Hz, for a softer edge. */
  cutoff?: number
  /** Pitch modulation for breathy cat calls and sustained instruments. */
  vibrato?: { rate: number; cents: number }
  /** Amplitude modulation: depth 0–1, used for a rolling purr. */
  tremolo?: { rate: number; depth: number }
}

/** A modulation oscillator with the same lifetime as the sound it shapes. */
function modulate(
  context: BaseAudioContext,
  parameter: AudioParam,
  rate: number,
  depth: number,
  start: number,
  end: number
) {
  const oscillator = context.createOscillator()
  const amount = context.createGain()
  oscillator.frequency.value = rate
  amount.gain.value = depth
  oscillator.connect(amount).connect(parameter)
  oscillator.start(start)
  oscillator.stop(end)
  oscillator.onended = () => {
    oscillator.disconnect()
    amount.disconnect()
  }
}

/** A soft attack and an exact-zero ending, even when sounds overlap. */
function envelope(
  context: BaseAudioContext,
  start: number,
  end: number,
  level: number,
  attack: number
) {
  const gain = context.createGain()
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(level, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, end - 0.005)
  gain.gain.linearRampToValueAtTime(0, end)
  return gain
}

/** A tone that swells in over `attack` and fades out by its end. */
export function tone(
  { context, destination, at }: Output,
  {
    wave,
    note,
    glideTo,
    duration,
    level,
    delay = 0,
    attack = 0.005,
    cutoff,
    vibrato,
    tremolo
  }: Tone
) {
  const start = at + delay
  const end = start + duration
  const oscillator = context.createOscillator()
  oscillator.type = wave
  oscillator.frequency.setValueAtTime(frequency(note), start)
  if (glideTo !== undefined)
    oscillator.frequency.exponentialRampToValueAtTime(frequency(glideTo), end)
  const gain = envelope(context, start, end, level, attack)
  const filter = context.createBiquadFilter()
  filter.type = "lowpass"
  filter.frequency.value = cutoff ?? 18000
  filter.Q.value = 0.5
  const pulse = context.createGain()
  if (vibrato)
    modulate(
      context,
      oscillator.detune,
      vibrato.rate,
      vibrato.cents,
      start,
      end
    )
  if (tremolo) {
    pulse.gain.value = 1 - tremolo.depth / 2
    modulate(context, pulse.gain, tremolo.rate, tremolo.depth / 2, start, end)
  }
  oscillator.connect(filter).connect(pulse).connect(gain).connect(destination)
  oscillator.start(start)
  oscillator.stop(end)
  oscillator.onended = () => {
    oscillator.disconnect()
    filter.disconnect()
    pulse.disconnect()
    gain.disconnect()
  }
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
  const gain = envelope(context, start, end, level, 0.005)
  source.connect(filter).connect(gain).connect(destination)
  source.start(start)
  source.stop(end)
  source.onended = () => {
    source.disconnect()
    filter.disconnect()
    gain.disconnect()
  }
}
