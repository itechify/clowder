import { describe, expect, it } from "vitest"
import { accepted, runWithCouch } from "../engine/testing"
import { choreograph, skippedCues } from "./choreography"

/** The events a Play of this Couch returns. */
function playOf(...args: Parameters<typeof runWithCouch>) {
  return accepted(runWithCouch(...args), { type: "play" }).events
}

/** Every cue in a script, in the order they sound. */
const cuesOf = (script: ReturnType<typeof choreograph>) =>
  script.steps.flatMap((step) => step.cues)

describe("a Play's sound cues", () => {
  it("climb one pitch step per Scoring event, Repeats included", () => {
    // The Big Loaf gives each Sleepy Cat a Repeat: five Scoring events.
    const events = playOf(["sleepy", "clingy", "sleepy"], {
      shelf: ["bigLoaf"]
    })

    const scored = cuesOf(choreograph(events, { scoringSpeed: 1 })).filter(
      (cue) => cue.name === "catScored"
    )

    expect(scored.map((cue) => cue.pitch)).toEqual([0, 1, 2, 3, 4])
  })

  it("follow the engine's events, from Gatherings to the cleared Night", () => {
    // Three Orange Cats: a Cuddle Puddle; Do Not Touch adds Mult for the two
    // empty Seats, One Braincell as each Cat scores, then Box Goblin's ×2.
    const events = playOf(["orange sleepy", "orange sleepy", "orange clingy"], {
      shelf: ["doNotTouch", "oneBraincell", "boxGoblin"]
    })

    expect(cuesOf(choreograph(events, { scoringSpeed: 1 }))).toEqual([
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
    const events = playOf(["clingy"], {
      config: { playsPerNight: 1, firstTarget: 1000 }
    })

    expect(cuesOf(choreograph(events, { scoringSpeed: 1 }))).toEqual([
      { name: "catScored", pitch: 0 },
      { name: "scoreLanded" },
      { name: "nightLost" }
    ])
  })
})

describe("a Play's pacing", () => {
  const events = playOf(["clingy"], {
    config: { playsPerNight: 1, firstTarget: 1000 }
  })

  it("gives each step its beat at 1×", () => {
    const script = choreograph(events, { scoringSpeed: 1 })

    expect(script.steps.map((step) => step.at)).toEqual([250, 630, 1630])
    expect(script.duration).toBe(2430)
  })

  it("plays faster at a faster scoring speed", () => {
    const script = choreograph(events, { scoringSpeed: 4 })

    expect(script.steps.map((step) => step.at)).toEqual([62.5, 157.5, 407.5])
    expect(script.duration).toBe(607.5)
  })
})

describe("a skipped Play", () => {
  // One Orange Cat clears the first Night when the Target is low enough.
  const events = playOf(["orange clingy"], { config: { firstTarget: 1 } })
  const script = choreograph(events, { scoringSpeed: 1 })
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
