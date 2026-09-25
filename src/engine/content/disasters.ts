export type DisasterId = "vacuum" | "doorbell" | "humanWakesUp"

/** The rules of a Night that a Disaster may change. */
export type NightRules = {
  /** The most Cats the Couch may hold at once. */
  catsPerPlay: number
  plays: number
  redraws: number
}

export type Disaster = {
  id: DisasterId
  name: string
  /** The rule it changes, as the player is told it. */
  rule: string
  /** Its Night's rules; any left out stay as configured. */
  changes: Partial<NightRules>
}

/** Every Disaster; each Run meets them in its own shuffled order. */
export const disasters: readonly Disaster[] = [
  {
    id: "vacuum",
    name: "The Vacuum",
    rule: "At most four Cats per Play",
    changes: { catsPerPlay: 4 }
  },
  {
    id: "doorbell",
    name: "The Doorbell",
    rule: "Only one Redraw tonight",
    changes: { redraws: 1 }
  },
  {
    id: "humanWakesUp",
    name: "The Human Wakes Up",
    rule: "Only two Plays tonight",
    changes: { plays: 2 }
  }
]

export const disasterById = (id: DisasterId): Disaster =>
  disasters.find((disaster) => disaster.id === id)!
