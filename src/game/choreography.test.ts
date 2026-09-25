import { describe, expect, it } from "vitest"
import type { RunEvent } from "../engine"
import { accepted, runWithCouch } from "../engine/testing"
import {
  type ChoreographySettings,
  choreograph,
  countedUp,
  type Play,
  skippedCues
} from "./choreography"
import { type EffectConfig, effectConfig } from "./effectConfig"

/** A Play of this Couch: the events it returns, and its Night's Target. */
function playOf(...args: Parameters<typeof runWithCouch>) {
  const run = runWithCouch(...args)
  const { events } = accepted(run, { type: "play" })
  return { events, target: run.night.target }
}

/** Settings at their plainest: 1×, full motion, no haptics. */
const plain: ChoreographySettings = {
  scoringSpeed: 1,
  reducedMotion: false,
  haptics: false
}

/** Every cue in a script, in the order they sound. */
const cuesOf = (script: ReturnType<typeof choreograph>) =>
  script.steps.flatMap((step) => step.cues)

describe("a Play's sound cues", () => {
  it("climb one pitch step per Scoring event, Repeats included", () => {
    // The Big Loaf gives each Sleepy Cat a Repeat: five Scoring events.
    const play = playOf(["sleepy", "clingy", "sleepy"], {
      shelf: ["bigLoaf"]
    })

    const scored = cuesOf(choreograph(play, plain)).filter(
      (cue) => cue.name === "catScored"
    )

    expect(scored.map((cue) => cue.pitch)).toEqual([0, 1, 2, 3, 4])
  })

  it("follow the engine's events, from Gatherings to the cleared Night", () => {
    // Three Orange Cats: a Cuddle Puddle; Do Not Touch adds Mult for the two
    // empty Seats, One Braincell as each Cat scores, then Box Goblin's ×2.
    const play = playOf(["orange sleepy", "orange sleepy", "orange clingy"], {
      shelf: ["doNotTouch", "oneBraincell", "boxGoblin"]
    })

    expect(cuesOf(choreograph(play, plain))).toEqual([
      { name: "gatheringActivated" },
      { name: "multAdded" },
      { name: "catScored", pitch: 0 },
      { name: "multAdded" },
      { name: "catScored", pitch: 1 },
      { name: "multAdded" },
      { name: "catScored", pitch: 2 },
      { name: "multAdded" },
      { name: "timesApplied" },
      { name: "scoreLanded" },
      { name: "nightCleared" }
    ])
  })

  it("end on a lost Night when the last Play falls short", () => {
    const play = playOf(["clingy"], {
      config: { playsPerNight: 1, firstTarget: 1000 }
    })

    expect(cuesOf(choreograph(play, plain))).toEqual([
      { name: "catScored", pitch: 0 },
      { name: "scoreLanded" },
      { name: "nightLost" }
    ])
  })
})

describe("a Play's pacing", () => {
  const play = playOf(["clingy"], {
    config: { playsPerNight: 1, firstTarget: 1000 }
  })

  it("gives each step its beat at 1×, the Score counting up before it lands", () => {
    const script = choreograph(play, plain)

    expect(script.steps.map((step) => step.at)).toEqual([250, 630, 1230, 1930])
    expect(script.duration).toBe(2730)
  })

  it("plays faster at a faster scoring speed", () => {
    const script = choreograph(play, { ...plain, scoringSpeed: 4 })

    expect(script.steps.map((step) => step.at)).toEqual([
      62.5, 157.5, 307.5, 482.5
    ])
    expect(script.duration).toBe(682.5)
  })
})

describe("a Play's Score", () => {
  // A lone Clingy Cat scores 10.
  const { events } = playOf(["clingy"], {
    config: { playsPerNight: 1, firstTarget: 1000 }
  })
  const tiered: EffectConfig = {
    ...effectConfig,
    tiers: [
      { from: 0, intensity: 1, countUp: 100 },
      { from: 0.5, intensity: 2, countUp: 300 }
    ]
  }
  const scoreSteps = (target: number, settings = plain) =>
    choreograph({ events, target }, settings, tiered).steps.filter(
      (step) => step.event.type === "scoreTotal"
    )

  it("counts up to the Score, then lands with a thump", () => {
    const [counting, landing] = scoreSteps(1000)

    expect(counting).toMatchObject({ prelude: true, cues: [] })
    expect(counting.countUp).toMatchObject({ to: 10, duration: 100 })
    expect(landing.at).toBe(counting.at + 100)
    expect(landing.cues).toEqual([{ name: "scoreLanded" }])
    expect(landing.particles).toBeGreaterThan(0)
  })

  it("counts up for longer when it is bigger", () => {
    const [counting] = scoreSteps(20)

    expect(counting.countUp!.duration).toBe(300)
  })

  it("counts up at the scoring speed", () => {
    const [counting, landing] = scoreSteps(20, { ...plain, scoringSpeed: 2 })

    expect(counting.countUp!.duration).toBe(150)
    expect(landing.at).toBe(counting.at + 150)
  })

  it("counts up faster and faster, landing exactly on the Score", () => {
    const countUp = { to: 1000, duration: 400, power: 3 }
    const shown = [0, 100, 200, 300, 400].map((ms) => countedUp(countUp, ms))
    const gains = shown.slice(1).map((value, i) => value - shown[i])

    expect(shown[0]).toBe(0)
    expect(shown.at(-1)).toBe(1000)
    expect(gains).toEqual([...gains].sort((a, b) => a - b))
    expect(new Set(gains).size).toBe(gains.length)
    expect(countedUp(countUp, 900)).toBe(1000)
  })
})

describe("a cleared Night's Treats", () => {
  const steps = choreograph(
    playOf(["orange clingy"], { config: { firstTarget: 1 } }),
    plain
  ).steps
  const treats = steps.filter((step) => step.event.type === "treatsAwarded")
  const paid = treats[1]?.event as Extract<RunEvent, { type: "treatsAwarded" }>

  it("rain into the jar, one per Treat, before they are paid", () => {
    const [raining, payout] = treats

    expect(raining.prelude).toBe(true)
    expect(raining.rain!.drops).toBe(paid.treats)
    expect(payout.prelude).toBeUndefined()
    expect(payout.at).toBe(raining.at + raining.rain!.duration)
  })

  it("rain only once the Night is cleared", () => {
    const cleared = steps.findIndex(
      (step) => step.event.type === "nightCleared"
    )

    expect(steps.indexOf(treats[0])).toBe(cleared + 1)
  })
})

describe("a skipped Play", () => {
  // One Orange Cat clears the first Night when the Target is low enough.
  const play = playOf(["orange clingy"], { config: { firstTarget: 1 } })
  const script = choreograph(play, plain)
  const at = (name: string) =>
    script.steps.findIndex((step) => step.cues.some((cue) => cue.name === name))

  it("still sounds its Score landing and how the Night ends", () => {
    expect(skippedCues(script, 1)).toEqual([
      { name: "scoreLanded" },
      { name: "nightCleared" }
    ])
  })

  it("sounds only what it has not sounded yet", () => {
    expect(skippedCues(script, at("scoreLanded") + 1)).toEqual([
      { name: "nightCleared" }
    ])
    expect(skippedCues(script, script.steps.length)).toEqual([])
  })
})

describe("a Play's slams", () => {
  // Three Orange Cats: a Cuddle Puddle; Do Not Touch adds Mult for the two
  // empty Seats, One Braincell as each Cat scores, then Box Goblin's ×2.
  const play = playOf(["orange sleepy", "orange sleepy", "orange clingy"], {
    shelf: ["doNotTouch", "oneBraincell", "boxGoblin"]
  })
  const steps = choreograph(play, plain).steps

  it("slam Mult in wherever it is added, and × where it multiplies", () => {
    expect(
      steps
        .filter((step) => step.slam)
        .map((step) => [step.event.type, step.slam])
    ).toEqual([
      ["gatheringActivated", "mult"],
      ["wholePlayEffect", "mult"],
      ["catScored", "mult"],
      ["catScored", "mult"],
      ["catScored", "mult"],
      ["timesEffect", "times"]
    ])
  })

  it("hit harder for ×, with a bigger shake and a flash", () => {
    const mult = steps.find((step) => step.slam === "mult")!
    const times = steps.find((step) => step.slam === "times")!

    expect(mult.shake).toBeGreaterThan(0)
    expect(mult.flash).toBe(0)
    expect(times.shake).toBeGreaterThan(mult.shake)
    expect(times.flash).toBeGreaterThan(0)
  })

  it("leave a Cat scoring only Purr unslammed", () => {
    const steps = choreograph(playOf(["clingy"]), plain).steps

    expect(steps.some((step) => step.slam)).toBe(false)
  })
})

describe("the purr meter", () => {
  /** The steps setting the purr meter on fire, by their events. */
  const fires = (play: Play, settings = plain) =>
    choreograph(play, settings)
      .steps.filter((step) => step.fire)
      .map((step) => step.event.type)

  // A lone Clingy Cat scores 10.
  it("catches fire as a Score exactly reaching the Target lands", () => {
    const play = playOf(["clingy"], { config: { firstTarget: 10 } })

    expect(fires(play)).toEqual(["scoreTotal"])
  })

  it("stays unlit by a Score just short of the Target", () => {
    const play = playOf(["clingy"], { config: { firstTarget: 11 } })

    expect(fires(play)).toEqual([])
  })

  it("stays unlit when only the Night's Plays together reach the Target", () => {
    // Two Plays of 10 clear a Target of 18, but neither alone reaches it.
    const first = accepted(
      runWithCouch(["clingy"], { config: { firstTarget: 18 } }),
      { type: "play" }
    ).run
    const cat = first.night.hand.find(
      (id) => first.roster.find((c) => c.id === id)!.personality !== "aloof"
    )!
    const seated = accepted(first, { type: "place", cat, seat: 0 }).run
    const { events } = accepted(seated, { type: "play" })

    expect(events).toContainEqual({ type: "nightCleared", score: 20 })
    expect(fires({ events, target: 18 })).toEqual([])
  })
})

describe("a Play's escalation", () => {
  /** Tiers and intensities easy to tell apart. */
  const tiered: EffectConfig = {
    ...effectConfig,
    tiers: [
      { from: 0, intensity: 1, countUp: 100 },
      { from: 0.3, intensity: 2, countUp: 200 },
      { from: 0.5, intensity: 3, countUp: 300 },
      { from: 1, intensity: 4, countUp: 400 }
    ],
    mult: { shake: 1, flash: 0, particles: 1, haptic: null },
    times: { shake: 10, flash: 0.1, particles: 10, haptic: [10] },
    landed: { shake: 1, flash: 0, particles: 1, haptic: null }
  }

  it("hits harder as the Score so far climbs through the tiers", () => {
    // The Score so far after each slam: 0, 0, 200, 480, 770, then 1540.
    const { events } = playOf(
      ["orange sleepy", "orange sleepy", "orange clingy"],
      { shelf: ["doNotTouch", "oneBraincell", "boxGoblin"] }
    )

    const slams = choreograph({ events, target: 1540 }, plain, tiered)
      .steps.filter((step) => step.slam)
      .map(({ shake, particles }) => ({ shake, particles }))

    expect(slams).toEqual([
      { shake: 1, particles: 1 },
      { shake: 1, particles: 1 },
      { shake: 1, particles: 1 },
      { shake: 2, particles: 2 },
      { shake: 3, particles: 3 },
      { shake: 40, particles: 40 }
    ])
  })

  it("lands a Score as hard as its share of the Target", () => {
    // A lone Clingy Cat scores 10.
    const { events } = playOf(["clingy"], {
      config: { playsPerNight: 1, firstTarget: 1000 }
    })
    const landing = (target: number) =>
      choreograph({ events, target }, plain, tiered).steps.find((step) =>
        step.cues.some((cue) => cue.name === "scoreLanded")
      )!.shake

    expect([100, 34, 25, 20].map(landing)).toEqual([1, 1, 2, 3])
  })
})

describe("Reduced motion", () => {
  // A Score of 1540 against a Target of 300 sets the purr meter on fire.
  const play = playOf(["orange sleepy", "orange sleepy", "orange clingy"], {
    shelf: ["doNotTouch", "oneBraincell", "boxGoblin"]
  })
  const full = choreograph(play, plain).steps
  const calm = choreograph(play, { ...plain, reducedMotion: true }).steps

  it("removes every shake, flash, and fire", () => {
    expect(full.some((step) => step.fire)).toBe(true)
    expect(full.some((step) => step.shake > 0 && step.flash > 0)).toBe(true)

    for (const step of calm) {
      expect(step.shake).toBe(0)
      expect(step.flash).toBe(0)
      expect(step.fire).toBeUndefined()
    }
  })

  it("keeps every step, cue, slam, and number", () => {
    const kept = (steps: typeof full) =>
      steps.map(({ at, event, prelude, cues, slam, countUp }) => ({
        at,
        event,
        prelude,
        cues,
        slam,
        countUp
      }))

    expect(kept(calm)).toEqual(kept(full))
  })

  it("softens particles and the treat rain, without losing them", () => {
    const softened = (step: (typeof full)[number], i: number) => [
      [calm[i].particles, step.particles],
      [calm[i].rain?.drops ?? 0, step.rain?.drops ?? 0]
    ]
    const pairs = full.flatMap(softened)

    expect(pairs.some(([calm, full]) => calm < full)).toBe(true)
    for (const [softer, stronger] of pairs) {
      expect(softer).toBeLessThanOrEqual(stronger)
      if (stronger > 0) expect(softer).toBeGreaterThan(0)
    }
  })
})

describe("haptics", () => {
  const play = playOf(["orange sleepy", "orange sleepy", "orange clingy"], {
    shelf: ["doNotTouch", "oneBraincell", "boxGoblin"]
  })
  const pulsing = (settings: ChoreographySettings) =>
    choreograph(play, settings)
      .steps.filter((step) => step.haptic)
      .map((step) => step.event.type)

  it("pulse on the big moments: × effects, the Score landing, a cleared Night", () => {
    expect(pulsing({ ...plain, haptics: true })).toEqual([
      "timesEffect",
      "scoreTotal",
      "nightCleared"
    ])
  })

  it("never pulse when disabled", () => {
    expect(pulsing(plain)).toEqual([])
  })

  it("still pulse under Reduced motion", () => {
    expect(
      pulsing({ ...plain, haptics: true, reducedMotion: true })
    ).toHaveLength(3)
  })
})

describe("House Cats' triggered poses", () => {
  /** When a script's `n`th step of an event type begins, and the step after it. */
  const during = (
    script: ReturnType<typeof choreograph>,
    type: RunEvent["type"],
    n = 0
  ) => {
    const i = script.steps.findIndex(
      (step, i, steps) =>
        step.event.type === type &&
        steps.slice(0, i).filter((s) => s.event.type === type).length === n
    )
    return { from: script.steps[i].at, to: script.steps[i + 1].at }
  }

  it("hold while each House Cat's effect fires, run together while it keeps firing", () => {
    // Do Not Touch adds Mult for the Play, One Braincell as each of the three
    // Orange Cats scores, then Box Goblin's box bursts open for its ×2.
    const script = choreograph(
      playOf(["orange sleepy", "orange sleepy", "orange clingy"], {
        shelf: ["doNotTouch", "oneBraincell", "boxGoblin"]
      }),
      plain
    )

    expect(script.poses).toEqual([
      {
        houseCat: "doNotTouch",
        pose: "houseCat/doNotTouch/triggered",
        ...during(script, "wholePlayEffect")
      },
      {
        houseCat: "oneBraincell",
        pose: "houseCat/oneBraincell/triggered",
        from: during(script, "catScored", 0).from,
        to: during(script, "catScored", 2).to
      },
      {
        houseCat: "boxGoblin",
        pose: "houseCat/boxGoblin/triggered",
        ...during(script, "timesEffect")
      }
    ])
  })

  it("roll Skadi belly-up for each Repeat she gives", () => {
    const script = choreograph(
      playOf(["clingy", null, null, null, "clingy"], { shelf: ["skadi"] }),
      plain
    )

    expect(script.poses).toEqual([
      {
        houseCat: "skadi",
        pose: "houseCat/skadi/bellyUp",
        ...during(script, "repeat", 0)
      },
      {
        houseCat: "skadi",
        pose: "houseCat/skadi/bellyUp",
        ...during(script, "repeat", 1)
      }
    ])
  })

  it("roll Skadi belly-up only for her own Repeats, not The Big Loaf's", () => {
    // The end-Seat Sleepy Cat scores, then repeats for The Big Loaf and
    // Skadi in turn; the Clingy Cat in Seat 5 repeats for Skadi alone.
    const script = choreograph(
      playOf(["sleepy", null, null, null, "clingy"], {
        shelf: ["bigLoaf", "skadi"]
      }),
      plain
    )

    expect(script.poses).toEqual([
      {
        houseCat: "bigLoaf",
        pose: "houseCat/bigLoaf/triggered",
        ...during(script, "repeat", 0)
      },
      {
        houseCat: "skadi",
        pose: "houseCat/skadi/bellyUp",
        ...during(script, "repeat", 1)
      },
      {
        houseCat: "skadi",
        pose: "houseCat/skadi/bellyUp",
        ...during(script, "repeat", 2)
      }
    ])
  })

  it("switch a Copycat as itself, after whomever it copies", () => {
    const script = choreograph(
      playOf(["clingy", "clingy", "clingy"], {
        shelf: ["boxGoblin", "copycat"]
      }),
      plain
    )

    expect(script.poses.map(({ houseCat, pose }) => [houseCat, pose])).toEqual([
      ["boxGoblin", "houseCat/boxGoblin/triggered"],
      ["copycat", "houseCat/copycat/triggered"]
    ])
  })

  it("warm Freya up through her × in one go", () => {
    // An Aloof Cat alone warms Freya up, then she multiplies the Mult.
    const script = choreograph(playOf(["aloof"], { shelf: ["freya"] }), plain)

    expect(script.poses).toEqual([
      {
        houseCat: "freya",
        pose: "houseCat/freya/triggered",
        from: during(script, "houseCatWarmedUp").from,
        to: during(script, "timesEffect").to
      }
    ])
  })
})
