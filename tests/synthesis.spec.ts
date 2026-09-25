import { expect, test } from "@playwright/test"
import { cueNames, themeNames } from "../src/audio/cues"

test("a seated Cat settles into an audible purr after its chirp", async ({
  page
}) => {
  await page.goto("/")
  const purr = await page.evaluate(async () => {
    const path = "/src/audio/voices.ts"
    const { voices } = await import(path)
    const context = new OfflineAudioContext(1, 48000, 48000)
    voices.catSeated({ context, destination: context.destination, at: 0 }, 0)
    const buffer = await context.startRendering()
    const samples = buffer.getChannelData(0).slice(9600, 19200)
    return Math.sqrt(
      samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length
    )
  })
  expect(purr).toBeGreaterThan(0.003)
})

for (const name of cueNames) {
  test(`${name} renders audible, finite audio with headroom and a silent ending`, async ({
    page
  }) => {
    await page.goto("/")
    const rendered = await page.evaluate(async (name) => {
      const path = "/src/audio/voices.ts"
      const { voices } = await import(path)
      const context = new OfflineAudioContext(1, 96000, 48000)
      voices[name]({ context, destination: context.destination, at: 0 }, 0)
      const samples = (await context.startRendering()).getChannelData(0)
      return {
        finite: samples.every(Number.isFinite),
        peak: samples.reduce(
          (peak, sample) => Math.max(peak, Math.abs(sample)),
          0
        ),
        tail: samples.slice(-4800).every((sample) => sample === 0)
      }
    }, name)
    expect(rendered.finite).toBe(true)
    expect(rendered.peak).toBeGreaterThan(0.01)
    expect(rendered.peak).toBeLessThan(0.9)
    expect(rendered.tail).toBe(true)
  })
}

for (const name of themeNames) {
  test(`${name} stays audible across two aligned loops and fades when stopped`, async ({
    page
  }) => {
    test.setTimeout(60_000)
    await page.goto("/")
    const rendered = await page.evaluate(async (name) => {
      const path = "/src/audio/themes.ts"
      const { loopTheme, themes } = await import(path)
      const theme = themes[name]
      const lengths = theme.tracks.map(
        (track: { notes: [unknown, number][] }) =>
          track.notes.reduce((beats, note) => beats + note[1], 0)
      )
      const loop = (lengths[0] * 60) / theme.bpm
      const stopAt = loop * 2
      const sampleRate = 24000
      const context = new OfflineAudioContext(
        1,
        Math.ceil((stopAt + 2) * sampleRate),
        sampleRate
      )
      // Drive only the system timer from the audio clock so offline rendering
      // exercises the real lookahead scheduler without a minute's wall time.
      const interval = window.setInterval
      let pump = () => {}
      window.setInterval = ((callback: () => void) => {
        pump = callback
        return interval(callback, 1_000_000)
      }) as typeof window.setInterval
      let stop: () => void
      try {
        stop = loopTheme(context, context.destination, theme)
      } finally {
        window.setInterval = interval
      }
      for (let at = 0.2; at < stopAt; at += 0.2)
        void context.suspend(at).then(() => {
          pump()
          void context.resume()
        })
      void context.suspend(stopAt).then(() => {
        stop()
        void context.resume()
      })
      const samples = (await context.startRendering()).getChannelData(0)
      const rms = (from: number, to: number) => {
        const chunk = samples.slice(
          Math.floor(from * sampleRate),
          Math.floor(to * sampleRate)
        )
        return Math.sqrt(
          chunk.reduce((sum, value) => sum + value * value, 0) / chunk.length
        )
      }
      return {
        lengths,
        finite: samples.every(Number.isFinite),
        peak: samples.reduce(
          (peak, value) => Math.max(peak, Math.abs(value)),
          0
        ),
        first: rms(0, loop),
        second: rms(loop, stopAt),
        boundary: rms(loop - 0.1, loop + 0.1),
        tail: rms(stopAt + 1.5, stopAt + 2)
      }
    }, name)
    expect(new Set(rendered.lengths).size).toBe(1)
    expect(rendered.finite).toBe(true)
    expect(rendered.peak).toBeLessThan(0.9)
    expect(rendered.first).toBeGreaterThan(0.005)
    expect(rendered.second).toBeGreaterThan(0.005)
    expect(rendered.boundary).toBeGreaterThan(0.003)
    expect(rendered.tail).toBeLessThan(0.0001)
  })
}

test("scoring ticks climb the pentatonic ladder and finish before the next tick at 4×", async ({
  page
}) => {
  await page.goto("/")
  const ticks = await page.evaluate(async () => {
    const path = "/src/audio/voices.ts"
    const { voices } = await import(path)
    const ticks = []
    for (const pitch of [0, 1, 2, 3, 4, 5, 15, 99]) {
      const context = new OfflineAudioContext(1, 9600, 48000)
      voices.catScored(
        { context, destination: context.destination, at: 0 },
        pitch
      )
      const samples = (await context.startRendering()).getChannelData(0)
      const crossings: number[] = []
      for (let i = 960; i < 2880; i++)
        if (samples[i - 1] < 0 && samples[i] >= 0)
          crossings.push(i - samples[i] / (samples[i] - samples[i - 1]))
      ticks.push({
        frequency:
          (48000 * (crossings.length - 1)) / (crossings.at(-1)! - crossings[0]),
        tail: Math.max(...samples.slice(4560).map(Math.abs))
      })
    }
    return ticks
  })
  // C5, D5, E5, G5, A5, C6; the existing cap is C8.
  const expected = [
    523.25, 587.33, 659.26, 783.99, 880, 1046.5, 4186.01, 4186.01
  ]
  ticks.forEach((tick, i) => {
    expect(Math.abs(tick.frequency - expected[i])).toBeLessThan(3)
    expect(tick.tail).toBeLessThan(0.00001)
  })
})
