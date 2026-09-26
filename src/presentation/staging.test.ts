import { describe, expect, it } from "vitest"
import { artManifest, catArt, FREYA_STAGES, houseCatArt } from "../art/manifest"
import {
  applyAction,
  type CatId,
  defaultConfig,
  previewPlay,
  type Run,
  restoreRun,
  serialiseRun,
  starCat,
  startRun
} from "../engine"
import { accepted, runWithCouch } from "../engine/testing"
import {
  eyeTint,
  eyeTints,
  FREYA_WARMS_AT,
  type Staging,
  seatingOrder,
  stage,
  stageAsleep,
  stageResults
} from "./staging"

/** Where each Cat is staged, in staging order. */
const placements = (staging: Staging) =>
  staging.cats.map(({ cat, placement }) => ({ cat, placement }))

describe("staging placements", () => {
  it("lays a fresh Night's eight Hand Cats across the rug's two rows, front row first", () => {
    const run = startRun(7)
    const [a, b, c, d, e, f, g, h] = run.night.hand

    expect(placements(stage(run))).toEqual([
      { cat: a, placement: { on: "rug", row: "front", position: 0 } },
      { cat: b, placement: { on: "rug", row: "front", position: 1 } },
      { cat: c, placement: { on: "rug", row: "front", position: 2 } },
      { cat: d, placement: { on: "rug", row: "front", position: 3 } },
      { cat: e, placement: { on: "rug", row: "back", position: 0 } },
      { cat: f, placement: { on: "rug", row: "back", position: 1 } },
      { cat: g, placement: { on: "rug", row: "back", position: 2 } },
      { cat: h, placement: { on: "rug", row: "back", position: 3 } }
    ])
  })

  it("seats Cats on their Seats, empty Seats between them, while the rug closes up", () => {
    let run = startRun(7)
    const [a, b, c, d, e, f, g, h] = run.night.hand
    run = accepted(run, { type: "place", cat: b, seat: 0 }).run
    run = accepted(run, { type: "place", cat: e, seat: 2 }).run
    run = accepted(run, { type: "place", cat: f, seat: 4 }).run

    expect(placements(stage(run))).toEqual([
      { cat: b, placement: { on: "couch", seat: 0 } },
      { cat: e, placement: { on: "couch", seat: 2 } },
      { cat: f, placement: { on: "couch", seat: 4 } },
      { cat: a, placement: { on: "rug", row: "front", position: 0 } },
      { cat: c, placement: { on: "rug", row: "front", position: 1 } },
      { cat: d, placement: { on: "rug", row: "front", position: 2 } },
      { cat: g, placement: { on: "rug", row: "front", position: 3 } },
      { cat: h, placement: { on: "rug", row: "back", position: 0 } }
    ])
  })

  it("settles an unseated Cat back into its place on the rug", () => {
    let run = startRun(7)
    const [a, b] = run.night.hand
    run = accepted(run, { type: "place", cat: a, seat: 1 }).run
    run = accepted(run, { type: "place", cat: b, seat: 3 }).run
    run = accepted(run, { type: "unseat", cat: a }).run

    expect(placements(stage(run)).find((staged) => staged.cat === a)).toEqual({
      cat: a,
      placement: { on: "rug", row: "front", position: 0 }
    })
    expect(stage(run).cats.map((staged) => staged.placement)).toContainEqual({
      on: "couch",
      seat: 3
    })
  })

  it("lays a Cat drawn by a Redraw where the Cat it replaced lay", () => {
    let run = startRun(7)
    const [, b, , d] = run.night.hand
    run = accepted(run, { type: "place", cat: b, seat: 2 }).run
    run = accepted(run, { type: "redraw", cats: [d] }).run
    const drawn = run.night.hand[3]

    expect(
      placements(stage(run)).find((staged) => staged.cat === drawn)
    ).toEqual({
      cat: drawn,
      placement: { on: "rug", row: "front", position: 2 }
    })
  })

  it("stages a Couch already played, as the household falls asleep on it", () => {
    let run = startRun(7)
    const [a, b, c] = run.night.hand
    run = accepted(run, { type: "place", cat: a, seat: 0 }).run
    run = accepted(run, { type: "place", cat: b, seat: 1 }).run
    const played = run.night.couch
    run = accepted(run, { type: "play" }).run

    const staged = placements(stageAsleep(run, played))
    expect(staged.slice(0, 2)).toEqual([
      { cat: a, placement: { on: "couch", seat: 0 } },
      { cat: b, placement: { on: "couch", seat: 1 } }
    ])
    expect(staged.find((cat) => cat.cat === c)?.placement).toEqual({
      on: "rug",
      row: "front",
      position: 0
    })
    expect(staged).toHaveLength(2 + run.night.hand.length)
  })

  it("keeps a smaller Hand to the front row", () => {
    const run = startRun(7, { ...defaultConfig, handSize: 6 })
    const [a, b, c, d] = run.night.hand

    expect(placements(stage(run)).slice(0, 4)).toEqual([
      { cat: a, placement: { on: "rug", row: "front", position: 0 } },
      { cat: b, placement: { on: "rug", row: "front", position: 1 } },
      { cat: c, placement: { on: "rug", row: "front", position: 2 } },
      { cat: d, placement: { on: "rug", row: "back", position: 0 } }
    ])
  })
})

/** The staged Cat on a Seat. */
const onSeat = (staging: Staging, seat: number) =>
  staging.cats.find(({ placement: p }) => p.on === "couch" && p.seat === seat)!

/**
 * The pose and facing of the Cat on each Seat, left to right as far as the
 * last Cat seated; null for an empty Seat.
 */
const couchPoses = (run: Run, order?: CatId[]) => {
  const staging = stage(run, order)
  const { couch } = run.night
  return couch
    .slice(0, couch.findLastIndex((cat) => cat !== null) + 1)
    .map((cat, seat) => {
      if (!cat) return null
      const { pose, facing } = onSeat(staging, seat)
      return `${pose.split("/").at(-1)} ${facing}`
    })
}

/** The seated Cats, left to right, for giving an order they were placed in. */
const seated = (run: Run, ...seats: number[]) =>
  seats.map((seat) => run.night.couch[seat]!)

describe("staging poses", () => {
  it("shows each Cat in its own Coat and Personality's pose", () => {
    const run = runWithCouch(["black aloof", null, "orange clingy"])
    const staging = stage(run)
    expect(onSeat(staging, 0).pose).toBe(catArt("black", "aloof", "content"))
    expect(onSeat(staging, 2).pose).toBe(catArt("orange", "clingy", "content"))
  })

  it("keeps every Cat on the rug content, facing as drawn, whatever its Personality", () => {
    const run = startRun(7)
    for (const staged of stage(run).cats) {
      const cat = run.roster.find((c) => c.id === staged.cat)!
      expect(staged.pose).toBe(catArt(cat.coat, cat.personality, "content"))
      expect(staged.facing).toBe("right")
    }
  })

  describe("a Clingy Cat", () => {
    it("leans toward its one Neighbor, on either side", () => {
      expect(couchPoses(runWithCouch(["clingy", "sleepy"]))[0]).toBe(
        "reacting right"
      )
      expect(couchPoses(runWithCouch(["aloof", "clingy"]))[1]).toBe(
        "reacting left"
      )
    })

    it("leans toward the more recently placed of two Neighbors", () => {
      const run = runWithCouch(["aloof", "clingy", "aloof"])
      expect(couchPoses(run, seated(run, 1, 0, 2))[1]).toBe("reacting right")
      expect(couchPoses(run, seated(run, 2, 1, 0))[1]).toBe("reacting left")
    })

    it("sits content alone, or with only an empty Seat beside it", () => {
      expect(couchPoses(runWithCouch([null, "clingy"]))).toEqual([
        null,
        "content right"
      ])
      expect(couchPoses(runWithCouch(["clingy", null, "clingy"]))).toEqual([
        "content right",
        null,
        "content right"
      ])
    })
  })

  describe("an Aloof Cat", () => {
    it("is offended by any Neighbor, turning away from it", () => {
      expect(couchPoses(runWithCouch(["aloof", "sleepy"]))[0]).toBe(
        "reacting left"
      )
      expect(couchPoses(runWithCouch(["sleepy", "aloof"]))[1]).toBe(
        "reacting right"
      )
    })

    it("turns away from the more recently placed of two Neighbors", () => {
      const run = runWithCouch(["clingy", "aloof", "clingy"])
      expect(couchPoses(run, seated(run, 1, 2, 0))[1]).toBe("reacting right")
      expect(couchPoses(run, seated(run, 0, 1, 2))[1]).toBe("reacting left")
    })

    it("sits content with no Neighbors, a gap either side", () => {
      expect(couchPoses(runWithCouch(["sleepy", null, "aloof"]))[2]).toBe(
        "content right"
      )
    })
  })

  describe("a Sleepy Cat", () => {
    it("curls up facing its Sleepy Neighbor", () => {
      expect(couchPoses(runWithCouch(["sleepy", "sleepy"]))).toEqual([
        "reacting right",
        "reacting left"
      ])
    })

    it("ignores a Neighbor that is not Sleepy", () => {
      expect(couchPoses(runWithCouch(["clingy", "sleepy", "sleepy"]))[1]).toBe(
        "reacting right"
      )
      expect(couchPoses(runWithCouch(["sleepy", "aloof"]))[0]).toBe(
        "content right"
      )
    })

    it("faces the more recently placed of two Sleepy Neighbors", () => {
      const run = runWithCouch(["sleepy", "sleepy", "sleepy"])
      expect(couchPoses(run, seated(run, 1, 2, 0))[1]).toBe("reacting left")
      expect(couchPoses(run, seated(run, 0, 1, 2))[1]).toBe("reacting right")
    })

    it("naps alone across a gap", () => {
      expect(couchPoses(runWithCouch(["sleepy", null, "sleepy"]))).toEqual([
        "content right",
        null,
        "content right"
      ])
    })
  })

  it("faces the right-hand Neighbor when it is not known which was placed last", () => {
    expect(couchPoses(runWithCouch(["aloof", "clingy", "aloof"]))[1]).toBe(
      "reacting right"
    )
  })

  it("switches poses live as the Couch is arranged, before a Play", () => {
    let run = runWithCouch(["aloof", null, "clingy"])
    expect(couchPoses(run)).toEqual(["content right", null, "content right"])

    const aloof = run.night.couch[0]!
    run = accepted(run, { type: "place", cat: aloof, seat: 1 }).run
    expect(couchPoses(run)).toEqual([null, "reacting left", "reacting left"])

    run = accepted(run, { type: "unseat", cat: aloof }).run
    expect(couchPoses(run)).toEqual([null, null, "content right"])
    expect(
      stage(run).cats.find((staged) => staged.cat === aloof)?.pose
    ).toMatch(/aloof\/content$/)
  })
})

describe("the seating order", () => {
  it("puts Cats newly seated after those already there, left to right", () => {
    expect(seatingOrder(["a"], ["a", null, null], ["a", "c", "b"])).toEqual([
      "a",
      "c",
      "b"
    ])
  })

  it("counts a Cat moved to another Seat as placed again", () => {
    expect(
      seatingOrder(["a", "b"], ["a", "b", null], [null, "b", "a"])
    ).toEqual(["b", "a"])
  })

  it("forgets Cats that leave the Couch", () => {
    expect(
      seatingOrder(["a", "b", "c"], ["a", "b", "c"], ["a", null, "c"])
    ).toEqual(["a", "c"])
  })
})

describe("eye tints", () => {
  it("gives the Roster a few different eye tints", () => {
    const run = startRun(7)
    const tints = new Set(stage(run).cats.map((staged) => staged.eyeTint))
    for (const tint of tints) expect(eyeTints).toContain(tint)
    const roster = new Set(run.roster.map((cat) => eyeTint(run, cat.id)))
    expect(roster.size).toBe(eyeTints.length)
  })

  it("keeps each Cat's eye tint as the Night goes on, and across a save", () => {
    let run = startRun(11)
    const tints = () =>
      new Map(stage(run).cats.map((staged) => [staged.cat, staged.eyeTint]))
    const before = tints()
    const [a, b, c] = run.night.hand
    run = accepted(run, { type: "place", cat: a, seat: 0 }).run
    run = accepted(run, { type: "place", cat: b, seat: 1 }).run
    for (const [cat, tint] of tints()) expect(tint).toBe(before.get(cat))

    run = accepted(run, { type: "redraw", cats: [c] }).run
    run = accepted(run, { type: "play" }).run
    run = restoreRun(serialiseRun(run))!
    for (const cat of run.roster)
      expect(eyeTint(run, cat.id)).toBe(eyeTint(startRun(11), cat.id))
    for (const [cat, tint] of tints())
      if (before.has(cat)) expect(tint).toBe(before.get(cat))
  })
})

describe("the household asleep", () => {
  it("curls every Cat up in its Coat's sleeping pose, keeping its eye tint", () => {
    const run = runWithCouch(["clingy", "aloof"])
    const awake = stage(run).cats
    const asleep = stageAsleep(run, run.night.couch).cats
    expect(asleep.map((staged) => staged.placement)).toEqual(
      awake.map((staged) => staged.placement)
    )
    asleep.forEach((staged, i) => {
      const cat = run.roster.find((c) => c.id === staged.cat)!
      expect(staged.pose).toBe(catArt(cat.coat, "sleepy", "content"))
      expect(staged.eyeTint).toBe(awake[i].eyeTint)
    })
  })
})

describe("staging the Shelf", () => {
  it("sits each House Cat in its idle pose, in Shelf order", () => {
    const run = runWithCouch([], { shelf: ["boxGoblin", "doNotTouch"] })
    expect(stage(run).houseCats).toEqual([
      {
        houseCat: "boxGoblin",
        pose: houseCatArt("boxGoblin", "idle"),
        name: "Box Goblin",
        state: null,
        inert: false
      },
      {
        houseCat: "doNotTouch",
        pose: houseCatArt("doNotTouch", "idle"),
        name: "Do Not Touch",
        state: null,
        inert: false
      }
    ])
  })

  it("shows how far Freya has warmed up tonight", () => {
    const run = runWithCouch(["aloof"], { shelf: ["freya"] })
    expect(stage(run).houseCats[0].state).toBe("×1.0")
    const warmed = accepted(run, { type: "play" }).run
    expect(stage(warmed).houseCats[0].state).toBe("×1.5")
  })

  describe("Freya warming up", () => {
    /** Freya's pose on a Shelf of her alone, `warmPlays` Plays into the Night. */
    const freyaAfter = (warmPlays: number) => {
      const run = runWithCouch([], { shelf: ["freya"] })
      return stage({ ...run, night: { ...run.night, warmPlays } }).houseCats[0]
        .pose
    }

    it("steps from reserved to affectionate, one stage per ×0.5 she gains", () => {
      expect([0, 1, 2, 3].map((warmPlays) => freyaAfter(warmPlays))).toEqual([
        houseCatArt("freya", "idle"),
        houseCatArt("freya", "warming1"),
        houseCatArt("freya", "warming2"),
        houseCatArt("freya", "warming3")
      ])
    })

    it("stays fully affectionate however much further she warms up", () => {
      expect(freyaAfter(FREYA_WARMS_AT.length + 4)).toBe(
        houseCatArt("freya", `warming${FREYA_STAGES}`)
      )
    })

    it("warms up as a Play warms her, and survives a save and resume", () => {
      const run = runWithCouch(["aloof"], { shelf: ["freya"] })
      const warmed = accepted(run, { type: "play" }).run
      expect(stage(warmed).houseCats[0].pose).toBe(
        houseCatArt("freya", "warming1")
      )
      const resumed = restoreRun(serialiseRun(warmed))!
      expect(stage(resumed).houseCats[0].pose).toBe(
        houseCatArt("freya", "warming1")
      )
    })

    it("is reserved again at the start of each Night", () => {
      // A lone Aloof Cat big enough to clear the Night in one Play.
      const run = runWithCouch(["aloof"], {
        shelf: ["freya"],
        config: { basePurr: 1_000_000 }
      })
      const cleared = accepted(run, { type: "play" }).run
      expect(stage(cleared).houseCats[0].pose).toBe(
        houseCatArt("freya", "warming1")
      )
      const next = accepted(cleared, { type: "leaveShop" }).run
      expect(next.night.number).toBe(2)
      expect(stage(next).houseCats[0].pose).toBe(houseCatArt("freya", "idle"))
    })

    it("leaves a Copycat copying her in its own pose", () => {
      const run = runWithCouch([], { shelf: ["freya", "copycat"] })
      const staged = stage({ ...run, night: { ...run.night, warmPlays: 2 } })
      expect(staged.houseCats[1].pose).toBe(houseCatArt("copycat", "idle"))
    })
  })

  it("names whom each Copycat copies, and greys out one copying nothing", () => {
    const run = runWithCouch([], {
      shelf: ["copycat", "boxGoblin", "copycat"]
    })
    expect(
      stage(run).houseCats.map(({ name, inert }) => ({ name, inert }))
    ).toEqual([
      { name: "Copycat", inert: true },
      { name: "Box Goblin", inert: false },
      { name: "Copycat as Box Goblin", inert: false }
    ])
  })

  it("shows how much base Purr The Void has grown, and a Copycat's copy of Freya", () => {
    let run = runWithCouch(["black clingy", null, "black sleepy"], {
      shelf: ["theVoid", "freya", "copycat"]
    })
    expect(stage(run).houseCats.map((h) => h.state)).toEqual([
      "+0 Purr",
      "×1.0",
      "×1.0"
    ])
    // Two Black Cats apart form Personal Space, a Gathering, so both grow.
    run = accepted(run, { type: "play" }).run
    expect(stage(run).houseCats[0].state).toBe("+10 Purr")
  })
})

describe("staging agrees with scoring", () => {
  /** A small deterministic generator, so each arrangement is reproducible. */
  const lcg = (seed: number) => () => {
    seed = (seed * 1103515245 + 12345) % 2 ** 31
    return seed / 2 ** 31
  }

  it("shows a seated Cat reacting exactly when its Personality condition holds", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const random = lcg(seed)
      let run = startRun(seed)
      // Seat some of the Hand in random Seats, leaving random gaps.
      for (const cat of run.night.hand) {
        if (random() < 0.3) continue
        const seat = Math.floor(random() * run.config.seats)
        const result = applyAction(run, { type: "place", cat, seat })
        if (result.ok) run = result.run
      }
      const staging = stage(run)
      for (const event of previewPlay(run).scoringEvents) {
        const cat = run.roster.find((c) => c.id === event.cat)!
        // Aloof Cats earn their bonus alone, and react to company.
        const holds =
          cat.personality === "aloof" ? event.bonus === 0 : event.bonus > 0
        const { pose } = onSeat(staging, event.seat)
        expect(pose.endsWith("/reacting"), `seed ${seed}`).toBe(holds)
      }
    }
  })
})

describe("staging's art", () => {
  it("asks only for poses the art manifest has", () => {
    const keys = new Set(artManifest.map((entry) => entry.key))
    for (let seed = 1; seed <= 20; seed++) {
      const seated = runWithCouch(
        ["clingy", "clingy", "aloof", "sleepy", "sleepy"],
        {
          seed,
          shelf: ["copycat", "freya", "theVoid", "skadi", "boxGoblin"]
        }
      )
      // Freya warmed up through every stage she has, and past them.
      const run = {
        ...seated,
        night: {
          ...seated.night,
          warmPlays: seed % (FREYA_WARMS_AT.length + 2)
        }
      }
      for (const staging of [stage(run), stageAsleep(run, run.night.couch)])
        for (const { pose } of [...staging.cats, ...staging.houseCats])
          expect(keys).toContain(pose)
    }
  })
})

describe("the Results", () => {
  /** A Run lost on its first Night, after a single Play. */
  function lost() {
    const run = runWithCouch(["clingy", "clingy", null, "aloof"], {
      config: { playsPerNight: 1 }
    })
    return { before: run, after: accepted(run, { type: "play" }).run }
  }
  /** A one-Night Run won with a single Play. */
  function won() {
    const run = runWithCouch(["sleepy", "sleepy", "sleepy"], {
      config: { nights: 1, firstTarget: 10 }
    })
    return accepted(run, { type: "play" }).run
  }

  it("shows nothing while the Run is still playing", () => {
    expect(stageResults(startRun(1))).toBeNull()
  })

  it("titles a won Run's Results sweet dreams, and a lost one's lights out", () => {
    expect(stageResults(won())).toMatchObject({
      title: "Sweet dreams!",
      ending: "Your household made it through all 1 Nights."
    })
    expect(stageResults(lost().after)).toMatchObject({
      title: "Lights out",
      ending: "Your household fell asleep on Night 1."
    })
  })

  it("shows the Nights cleared by the moon", () => {
    const run = won()
    expect(run.stats.nightsCleared).toBe(1)
    expect(stageResults(run)!.nights).toEqual({
      cleared: 1,
      of: 1,
      moon: 1,
      label: "Nights cleared 1/1"
    })
    const { after } = lost()
    expect(stageResults(after)!.nights).toMatchObject({
      cleared: after.stats.nightsCleared,
      of: after.config.nights,
      label: `Nights cleared 0/${after.config.nights}`
    })
  })

  it("frames the Best Play's Couch as it was, each Cat content, with its Score and Night", () => {
    const { before, after } = lost()
    const { bestPlay } = after.stats
    const photo = stageResults(after)!.photo!
    expect(photo.score).toBe(bestPlay!.score)
    expect(photo.night).toBe(1)
    expect(photo.scoreLabel).toBe(`${bestPlay!.score}`)
    expect(photo.nightLabel).toBe("Night 1")
    expect(photo.seats.map((seat) => seat?.cat.id ?? null)).toEqual(
      before.night.couch
    )
    expect(photo.seats).toEqual(
      bestPlay!.couch.map(
        (cat) =>
          cat && {
            cat,
            pose: catArt(cat.coat, cat.personality, "content"),
            facing: "right",
            eyeTint: eyeTint(after, cat.id)
          }
      )
    )
  })

  it("beds the Star Cat down asleep, named with the Purr it contributed", () => {
    const { after } = lost()
    const star = starCat(after)!
    expect(stageResults(after)!.bed).toEqual({
      cat: star.cat,
      purr: star.purr,
      pose: catArt(star.cat.coat, "sleepy", "content"),
      facing: "right",
      eyeTint: eyeTint(after, star.cat.id),
      label: `Star Cat: ${star.cat.name}, ${star.purr} Purr`
    })
  })

  it("writes big numbers with thousands separators", () => {
    const { after } = lost()
    const star = starCat(after)!
    const big: Run = {
      ...after,
      stats: {
        ...after.stats,
        bestPlay: { ...after.stats.bestPlay!, score: 12_345 },
        purrByCat: { [star.cat.id]: 1240 }
      }
    }
    const results = stageResults(big)!
    expect(results.photo!.scoreLabel).toBe("12,345")
    expect(results.bed!.label).toBe(`Star Cat: ${star.cat.name}, 1,240 Purr`)
  })

  it("has no photo without a Best Play, and no cat bed without a Star Cat", () => {
    const run: Run = { ...startRun(1), status: "lost" }
    const results = stageResults(run)!
    expect(results.photo).toBeNull()
    expect(results.bed).toBeNull()
  })

  it("names the House Cats asleep on the Shelf", () => {
    const { after } = lost()
    expect(stageResults(after)!.houseCats).toEqual([])
    expect(
      stageResults({ ...after, shelf: ["boxGoblin", "doNotTouch"] })!.houseCats
    ).toEqual(["Box Goblin", "Do Not Touch"])
  })

  it("carries the Star Cat off to its bed, every other Cat asleep where it was", () => {
    const { before, after } = lost()
    const star = starCat(after)!.cat.id
    const everyone = stageAsleep(after, before.night.couch).cats
    const bedded = stageAsleep(after, before.night.couch, star).cats
    expect(everyone.map((staged) => staged.cat)).toContain(star)
    expect(bedded).toEqual(everyone.filter((staged) => staged.cat !== star))
  })
})
