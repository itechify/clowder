// The balance simulation behind `pnpm sim`: plays seeded Runs through the rules
// engine's public interface with a few simple build strategies, and reports how
// often each clears every Night. A reporting tool for tuning, not a CI gate.

import {
  type Action,
  applyAction,
  type Cat,
  type CatId,
  type Config,
  type DisasterId,
  disasterById,
  type HouseCatId,
  nightTarget,
  previewPlay,
  type Run,
  startRun
} from "../src/engine"

/** How a simulated player shops; every one arranges the Couch perfectly. */
type Strategy = {
  name: string
  /** House Cats worth Recruiting, most wanted first. */
  priority: HouseCatId[]
  adopt: (cat: Cat) => boolean
  rehome: (cat: Cat) => boolean
  /** The most Rerolls per Shop visit spent looking for a wanted House Cat. */
  rerolls: number
}

const never = () => false

const strategies: Strategy[] = [
  {
    name: "no purchases",
    priority: [],
    adopt: never,
    rehome: never,
    rerolls: 0
  },
  {
    name: "greedy any House Cat",
    priority: [
      "boxGoblin",
      "bigLoaf",
      "oneBraincell",
      "freya",
      "doNotTouch",
      "skadi",
      "copycat",
      "theVoid",
      "treatDealer"
    ],
    adopt: never,
    rehome: never,
    rerolls: 2
  },
  {
    name: "orange + sleepy engine",
    priority: ["bigLoaf", "oneBraincell", "boxGoblin", "copycat", "skadi"],
    adopt: (cat) => cat.coat === "orange" || cat.personality === "sleepy",
    rehome: (cat) => cat.coat !== "orange" && cat.personality !== "sleepy",
    rerolls: 2
  },
  {
    name: "antisocial household",
    priority: ["doNotTouch", "freya", "boxGoblin", "copycat"],
    adopt: (cat) => cat.personality === "aloof",
    rehome: (cat) => cat.personality === "clingy",
    rerolls: 2
  },
  {
    name: "growing void",
    priority: ["theVoid", "boxGoblin", "copycat", "freya"],
    adopt: (cat) => cat.coat === "black",
    rehome: (cat) => cat.coat !== "black" && cat.personality === "clingy",
    rerolls: 2
  }
]

/** Treats a strategy keeps back for a House Cat while its Shelf has room. */
const RESERVE = 6
/** A Roster is never Rehomed below this many Cats. */
const MIN_ROSTER = 16
/** The Night whose Shelf size the report averages. */
const SHELF_NIGHT = 6

const act = (run: Run, action: Action): Run => {
  const result = applyAction(run, action)
  if (!result.ok) throw new Error(`Rejected ${JSON.stringify(action)}`)
  return result.run
}

/** The highest-scoring legal Couch from the Hand, trying every arrangement. */
function bestCouch(run: Run): { score: number; couch: (CatId | null)[] } {
  const { hand, catsPerPlay } = run.night
  const couch: (CatId | null)[] = Array(run.config.seats).fill(null)
  const seated = new Set<CatId>()
  let best = { score: -1, couch: [...couch] }
  // Cats of one Kind and base Purr are interchangeable, so each Seat tries one.
  const byId = new Map(run.roster.map((cat) => [cat.id, cat]))
  const kindAndPurr = (id: CatId) => {
    const cat = byId.get(id)!
    return `${cat.coat}/${cat.personality}/${cat.basePurr}`
  }
  const fill = (seat: number, count: number) => {
    if (seat === couch.length) {
      if (count === 0) return
      const night = { ...run.night, couch: [...couch] }
      const { score } = previewPlay({ ...run, night })
      if (score > best.score) best = { score, couch: [...couch] }
      return
    }
    fill(seat + 1, count)
    if (count >= catsPerPlay) return
    const tried = new Set<string>()
    for (const id of hand) {
      if (seated.has(id) || tried.has(kindAndPurr(id))) continue
      tried.add(kindAndPurr(id))
      seated.add(id)
      couch[seat] = id
      fill(seat + 1, count + 1)
      seated.delete(id)
      couch[seat] = null
    }
  }
  fill(0, 0)
  return best
}

/** Plays the best Couch each time, Redrawing while it falls short of pace. */
function playNight(run: Run): Run {
  while (run.night.status === "playing" && run.status === "playing") {
    let best = bestCouch(run)
    const pace = (run.night.target - run.night.score) / run.night.playsLeft
    while (
      best.score < pace &&
      run.night.redrawsLeft > 0 &&
      run.night.drawPile.length > 0
    ) {
      const kept = new Set(best.couch)
      const limit = Math.min(
        run.config.catsPerRedraw,
        run.night.drawPile.length
      )
      const unused = run.night.hand.filter((id) => !kept.has(id))
      const cats = unused.slice(0, limit)
      if (cats.length === 0) break
      run = act(run, { type: "redraw", cats })
      best = bestCouch(run)
    }
    best.couch.forEach((cat, seat) => {
      if (cat) run = act(run, { type: "place", cat, seat })
    })
    run = act(run, { type: "play" })
  }
  return run
}

/** Recruits, Rehomes, Adopts, and Rerolls as the strategy likes, then leaves. */
function visitShop(run: Run, strategy: Strategy): Run {
  let rerolls = 0
  for (;;) {
    const shop = run.shop!
    const { config } = run
    const full = run.shelf.length >= config.shelfSize
    const wanted = strategy.priority.filter((id) =>
      shop.houseCatOffers.includes(id)
    )
    const recruit = wanted.find(
      (id) => config.shop.recruitPrices[id] <= run.treats
    )
    if (!full && recruit) {
      run = act(run, { type: "recruit", houseCat: recruit })
      continue
    }
    const reserve = full || strategy.priority.length === 0 ? 0 : RESERVE
    const rehome = run.roster.find(strategy.rehome)
    if (
      rehome &&
      shop.catRehomesLeft > 0 &&
      run.roster.length > MIN_ROSTER &&
      run.treats >= config.shop.rehomeCatPrice + reserve
    ) {
      run = act(run, { type: "rehome", cat: rehome.id })
      continue
    }
    const adopt = shop.catOffers.find(strategy.adopt)
    if (adopt && run.treats - config.shop.adoptPrice >= reserve) {
      run = act(run, { type: "adopt", cat: adopt.id })
      continue
    }
    if (
      !full &&
      wanted.length === 0 &&
      rerolls < strategy.rerolls &&
      run.treats >= shop.rerollPrice + RESERVE
    ) {
      rerolls++
      run = act(run, { type: "reroll" })
      continue
    }
    return act(run, { type: "leaveShop" })
  }
}

/** Each Night's Target, in order. */
const targets = (config: Config) =>
  Array.from({ length: config.nights }, (_, i) =>
    nightTarget(config, i + 1, config.disasterNights.includes(i + 1))
  )

/** Run n's seed, spread out so neighboring Runs share no structure. */
const seedOf = (n: number) => n * 7919

/** How many Runs reached something, and how many of those cleared it. */
type Tally = { reached: number; cleared: number }

const clearRate = ({ reached, cleared }: Tally) =>
  reached === 0 ? "-" : `${Math.round((100 * cleared) / reached)}%`

/** How one strategy's Runs went, as a few report lines. */
function simulateStrategy(
  strategy: Strategy,
  runs: number,
  config: Config
): string[] {
  const { nights, disasterNights } = config
  const byNight: Tally[] = Array.from({ length: nights + 1 }, () => ({
    reached: 0,
    cleared: 0
  }))
  const byDisaster = new Map<number, Map<DisasterId, Tally>>(
    disasterNights.map((night) => [night, new Map()])
  )
  const shelves: number[] = []
  let won = 0
  for (let n = 1; n <= runs; n++) {
    let run = startRun(seedOf(n), config)
    while (run.status === "playing") {
      if (run.shop) run = visitShop(run, strategy)
      const { number, disaster } = run.night
      if (number === SHELF_NIGHT) shelves.push(run.shelf.length)
      run = playNight(run)
      const tallies = [byNight[number]]
      if (disaster) {
        const tally = byDisaster.get(number)!
        if (!tally.has(disaster))
          tally.set(disaster, { reached: 0, cleared: 0 })
        tallies.push(tally.get(disaster)!)
      }
      for (const tally of tallies) {
        tally.reached++
        if (run.status !== "lost") tally.cleared++
      }
    }
    if (run.status === "won") won++
  }
  const perNight = (f: (tally: Tally) => string | number) =>
    byNight
      .slice(1)
      .map((tally, i) => `${i + 1}:${f(tally)}`)
      .join(" ")
  const wins = { reached: runs, cleared: won }
  const lines = [
    `${strategy.name} (${runs} Runs)`,
    `  clear rate per Night reached: ${perNight(clearRate)}`,
    `  lost on Night: ${perNight((tally) => tally.reached - tally.cleared)}`,
    `  win rate: ${clearRate(wins)} (${won}/${runs})`
  ]
  for (const [night, tally] of byDisaster) {
    const rates = [...tally]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, tally]) => {
        const { reached, cleared } = tally
        const name = disasterById(id).name
        return `${name} ${clearRate(tally)} (${cleared}/${reached})`
      })
    lines.push(
      `  Night ${night} clear rate by Disaster: ${rates.join(", ") || "-"}`
    )
  }
  const average = shelves.length
    ? (shelves.reduce((a, b) => a + b, 0) / shelves.length).toFixed(1)
    : "-"
  lines.push(`  avg House Cats on Night ${SHELF_NIGHT}: ${average}`)
  return lines
}

export type SimArgs = {
  runs: number
  config: Config
  /** The names of the strategies to simulate; all of them if left out. */
  strategies?: string[]
}

/** The balance report for seeded Runs 1..runs; the same args, the same report. */
export function simulate({ runs, config, strategies: names }: SimArgs): string {
  const chosen = strategies.filter((s) => !names || names.includes(s.name))
  const unknown = names?.filter(
    (name) => !strategies.some((s) => s.name === name)
  )
  if (unknown?.length)
    throw new Error(`Unknown strategy: ${unknown.join(", ")}`)
  const sections = chosen.map((s) => simulateStrategy(s, runs, config))
  return [[`Targets: ${targets(config).join(", ")}`], ...sections]
    .map((lines) => lines.join("\n"))
    .join("\n\n")
}

/**
 * Reads `--runs N`, `--strategies a,b`, and any config setting by its path,
 * such as `--disasterTargetFactor 1` or `--shop.recruitPrices.theVoid 4`.
 */
export function simArgs(argv: string[], defaults: Config): SimArgs {
  const args: SimArgs = {
    runs: 100,
    config: structuredClone(defaults),
    strategies: undefined
  }
  for (let i = 0; i < argv.length; i += 2) {
    const [flag, value] = [argv[i], argv[i + 1]]
    if (!flag.startsWith("--") || value === undefined)
      throw new Error(`Expected --setting value, got ${flag}`)
    const key = flag.slice(2)
    if (key === "runs") {
      args.runs = Number(value)
      if (!Number.isInteger(args.runs) || args.runs < 1)
        throw new Error(`Expected a positive Run count, got ${value}`)
    } else if (key === "strategies") args.strategies = value.split(",")
    else setPath(args.config, key, JSON.parse(value))
  }
  return args
}

/** Overrides one config setting, which must exist and keep its type. */
function setPath(config: Config, path: string, value: unknown) {
  const keys = path.split(".")
  const last = keys.pop()!
  let target: Record<string, unknown> = config
  for (const key of keys) {
    if (typeof target[key] !== "object" || target[key] === null)
      throw new Error(`No config setting ${path}`)
    target = target[key] as Record<string, unknown>
  }
  if (!(last in target)) throw new Error(`No config setting ${path}`)
  const type = (v: unknown) => (Array.isArray(v) ? "array" : typeof v)
  if (type(value) !== type(target[last]))
    throw new Error(`Expected ${path} to be a ${type(target[last])}`)
  target[last] = value
}
