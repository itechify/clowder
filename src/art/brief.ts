import {
  type Coat,
  type GatheringId,
  type HouseCatId,
  houseCat,
  type Personality
} from "../engine"
import {
  type ArtEntry,
  type CatPose,
  CHARACTER_BASE,
  CHARACTER_CANVAS,
  CHARACTER_SPAN,
  catArt,
  FREYA_STAGES,
  MOON_PHASES,
  ROOM_SCALE,
  type RoomPiece,
  type UiPiece
} from "./manifest"

/**
 * The art brief the author hands to Astra, built from the art manifest so it
 * lists exactly the images the game loads (ADR-0005): for each, a
 * ready-to-paste prompt, its size and anchor, what to attach, and the file to
 * deliver it as. `pnpm brief` writes it to `art/brief.md`.
 */

/** Where the brief is written, relative to the repo root. */
export const BRIEF = "art/brief.md"

/** Where the author delivers the image for an art key. */
const deliveredAs = (key: string) => `art/raw/${key}.png`

/**
 * The approved style reference sheet, attached to every later generation.
 * The game never loads it, so it sits outside `art/raw`.
 */
export const STYLE_SHEET = "art/reference/style-sheet.png"
/** The style reference sheet's size: one of the sizes Astra generates. */
const STYLE_SHEET_SIZE = "1536×1024"

/**
 * Photos of the real Skadi and Freya, attached to their generations. They
 * are the author's own cats, so the photos are never committed.
 */
const photosOf = (name: "skadi" | "freya") => `art/reference/photos/${name}/`

/** The Cat drawn first and in full on the style reference sheet. */
const HERO = catArt("orange", "clingy", "content")

/** One image to generate, as the brief asks for it. */
export type BriefEntry = {
  /** The art key, or null for the style reference sheet. */
  key: string | null
  /** What the image shows, in a few words. */
  title: string
  /** The file the image is saved as, relative to the repo root. */
  file: string
  /** Its exact size in pixels, width × height. */
  size: string
  /** Where on the image the game places it. */
  anchor: string
  /** Images to attach to the generation, as files or folders of files. */
  attach: string[]
  prompt: string
}

/** A set of images handed over together, in the order they are generated. */
export type Batch = { title: string; entries: BriefEntry[] }

const STYLE =
  "Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold " +
  "dark-brown outlines, chunky rounded shapes, flat cel shading with one " +
  "soft shadow tone, and a saturated, cute palette, for a cozy living room " +
  "at night."
const MATCH =
  "Match the attached style reference sheet exactly: its outline weight, " +
  "palette, shading, and proportions."
const NO_WORDS = "No words, signatures, or watermarks."

const CHARACTER =
  "Square image with a transparent background and no floor or cast shadow. " +
  "One character, full body, centred left to right and sitting on an " +
  `invisible floor line ${100 * CHARACTER_BASE.y}% of the way down, so the ` +
  `bottom ${100 * (1 - CHARACTER_BASE.y)}% stays empty but for a tail that ` +
  `may dangle into it. The character is about ` +
  `${(100 * CHARACTER_SPAN) / CHARACTER_CANVAS}% of the image wide, at the ` +
  "same scale as the hero Cat on the style reference sheet. No floating " +
  "hearts, Zs, anger marks, or blush: the game adds its own."

const coatLooks: Record<Coat, string> = {
  orange:
    "an orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle",
  black:
    "a black Cat: glossy solid black fur with cool blue-gray highlights, so its shape still reads inside dark outlines",
  white:
    "a white Cat: fluffy pure white fur with pink ears, nose, and toe beans",
  gray: "a gray Cat: soft, smoky blue-gray fur with a paler chest",
  calico: "a calico Cat: white fur with bold patches of orange and black"
}

/** The hero Cat's pose, on the style reference sheet and as its own image. */
const CLINGY_CONTENT =
  "sitting upright and eager, big round shining eyes and a small happy smile, as if hoping someone will sit beside it"

/**
 * Each Personality's content pose, and the reacting pose it takes when its
 * Neighbors earn its bonus. A reacting Cat faces the viewer's right; the game
 * mirrors it to face left.
 */
const personalityPoses: Record<Personality, Record<CatPose, string>> = {
  clingy: {
    content: `Clingy, content: ${CLINGY_CONTENT}.`,
    reacting:
      "Clingy, delighted by company: leaning its whole body toward the viewer's right as if snuggling into a friend just out of frame, eyes closed in a happy smile."
  },
  aloof: {
    content:
      "Aloof, content: sitting tall and composed on its own, tail wrapped neatly round its paws, half-lidded eyes glancing sideways, mouth a flat, unimpressed line.",
    reacting:
      "Aloof, offended by company: turned away toward the viewer's right with its nose in the air, eyes shut in disdain and ears flattened, as if someone has just sat down on its left."
  },
  sleepy: {
    content:
      "Sleepy, content: loafed with its paws tucked under, eyes gently closed, dozing on its own.",
    reacting:
      "Sleepy, sharing a nap: curled up in a tight ball with its tail over its nose, fast asleep and snuggled toward the viewer's right, as if a nap partner lies just out of frame."
  }
}

/** Skadi and Freya are drawn from the photos of the real cats. */
const fromPhotos = (name: string, pronoun: string) =>
  `${name}, one of the author's real cats. Draw ${pronoun} from the attached photos, keeping ${pronoun} markings, colours, and face recognisable while translating them into the style`

type HouseCatLook = { look: string; idle: string; triggered: string }

/**
 * Each House Cat's look, sitting on the Shelf when idle, and its triggered
 * pose when its effect fires during scoring.
 */
const houseCatLooks: Record<HouseCatId, HouseCatLook> = {
  oneBraincell: {
    look: "a lovably dim orange cat",
    idle: "eyes pointing two different ways and a tongue left out, a single tiny pink braincell floating over its head with a faint glow",
    triggered:
      "the braincell blazing bright and sparking, both eyes focused for once, paws raised as if it has just had an idea"
  },
  bigLoaf: {
    look: "an enormous, round gray-and-cream cat shaped just like a loaf of bread",
    idle: "loafed with every paw tucked out of sight, fast asleep",
    triggered:
      "one eye open, stretching a single paw toward the viewer's right to gently nudge a sleepy Cat just out of frame"
  },
  doNotTouch: {
    look: "a grumpy, fluffy tortoiseshell cat beside a small round warning sign: a red circle, struck through",
    idle: "sitting in a huff, narrowed eyes under cross brows, scowling",
    triggered:
      "puffed up to twice its size with its fur on end and back arched, hissing, the warning sign shaking"
  },
  skadi: {
    look: fromPhotos("Skadi", "her"),
    idle: "lying on her side, relaxed and content, looking at the viewer",
    triggered:
      "starting to roll over: twisting onto her back with her paws lifting"
  },
  copycat: {
    look: "a sly, slender cat with a pale, translucent, ghostly double of itself a step to its left",
    idle: "watching with its head tilted, the double faint and still",
    triggered:
      "the cat and its double striking exactly the same pose at the same moment, the double glowing brighter"
  },
  theVoid: {
    look: "hardly a cat at all: a cat-shaped patch of deep, starry darkness with two big round eyes",
    idle: "sitting still, stars twinkling faintly inside it, eyes calm",
    triggered: "its eyes glowing bright gold and the stars inside swirling"
  },
  freya: {
    look: fromPhotos("Freya", "her"),
    idle: "reserved: sitting turned away, tail wrapped round, peeking shyly back over her shoulder",
    triggered:
      "a warm moment: turning toward the viewer, eyes softening, with a shy smile"
  },
  treatDealer: {
    look: "a shady cat in a tan trench coat with its collar turned up",
    idle: "leaning with heavy-lidded, knowing eyes, one fish-shaped treat peeking out from inside the coat",
    triggered:
      "flinging its coat open to reveal rows of fish-shaped treats pinned inside, with a wink"
  },
  boxGoblin: {
    look: "a mischievous cat that lives in a cardboard box with its flaps folded open",
    idle: "peering out over the rim of its box, only its ears and big gleaming eyes showing",
    triggered:
      "bursting out of its box with its paws up and a gremlin grin, bits of cardboard flying"
  }
}

/** Skadi's signature pose, when Belly Up triggers. */
const BELLY_UP =
  "fully belly up, paws in the air and head upside down, her fluffy belly offered to all, adored"

/** Freya warms up in stages, from reserved to affectionate. */
const freyaStages: Record<number, string> = {
  1: "still turned mostly away, but glancing back with softened eyes",
  2: "turned halfway toward the viewer, relaxed, tail loose, with a shy smile",
  3: "fully affectionate: facing the viewer with her eyes closed happily, head tilted to rub against an unseen hand, tail up like a question mark"
}

/**
 * Each Coat's badge has its own icon as well as its colour, so a Coat reads
 * without colour vision.
 */
const badgeLooks: Record<Coat, { colour: string; icon: string }> = {
  orange: { colour: "ginger orange", icon: "a sun" },
  black: { colour: "black", icon: "a crescent moon" },
  white: { colour: "white", icon: "a snowflake" },
  gray: { colour: "smoky gray", icon: "a diamond" },
  calico: { colour: "orange, black, and white patchwork", icon: "a star" }
}

const moonLook = (phase: number) =>
  phase >= MOON_PHASES
    ? "a full moon"
    : `a waxing moon about ${Math.round((100 * phase) / MOON_PHASES)}% lit, lit on its right side`

const roomLooks: Record<Exclude<RoomPiece, "moon">, string> = {
  wall: "The back wall and floor of a cozy living room at night, seen straight on: warm cream wallpaper with soft vertical stripes over the top 47%, a cream skirting board, and warm wooden floorboards below from 48% down. Keep it simple and low in detail, since the window, shelf, sofa, and rug are separate images layered over it. It fills the whole image edge to edge, fully opaque, with no furniture.",
  window:
    "A window with a cream-painted frame and a single vertical mullion, showing a deep blue night sky with a few small stars. No moon: that is a separate image.",
  couch:
    "A plump sage-green sofa seen straight on, without its seat cushions: a tall, softly tufted backrest, rounded arms at both ends, a low base where the cushions will rest, and short wooden legs. The five seat cushions are a separate image, laid over the base. Keep the top edge of the backrest plain: the game lays a meter along it.",
  seatPad:
    "A single plump, square-ish sage-green sofa seat cushion seen straight on from slightly above, its top face lit and its front face softly piped. Five of these sit side by side on the sofa, a Cat sitting on each.",
  rug: "A cozy, woven terracotta rug with a cream border, seen from above at a gentle angle as it lies on the floor, big enough for eight Cats lounging in two rows.",
  shelf:
    "A long, narrow wooden wall shelf seen straight on: a single plank with small brackets beneath.",
  treatJar:
    "A glass jar full of fish-shaped orange cat treats, with a red lid and no label: the game writes the count beside it.",
  disasterSign:
    "A warning sign hung from a single nail by a string: a wide, rounded wooden plaque painted brick red, with a cream border, hanging from the top centre. Leave the plaque blank: the game writes tonight's trouble on it."
}

/** Each UI piece, ready (to press, or still to spend) and not. */
const uiLooks: Record<UiPiece, { ready: string; notReady: string }> = {
  playButton: {
    ready:
      "A large, chunky, tactile plump, pillowy, pill-shaped button, in warm dark brown with a soft highlight, begging to be pressed. Leave its face blank: the game writes on it.",
    notReady:
      "A large pillowy, pill-shaped button pressed flat and faded to a dusty beige-brown, clearly not pressable. Leave its face blank: the game writes on it."
  },
  redrawButton: {
    ready:
      "A small, chunky, tactile plump, pillowy, pill-shaped button, in warm dark brown with a soft highlight, ready to press. Leave its face blank: the game writes on it.",
    notReady:
      "A small pillowy, pill-shaped button pressed flat and faded to a dusty beige-brown, clearly not pressable. Leave its face blank: the game writes on it."
  },
  pip: {
    ready:
      "A small, round pip: a glowing golden bead, full and still to spend.",
    notReady: "A small, round pip already spent: an empty, hollow ring."
  },
  purrMeter: {
    ready:
      "A long, slim, rounded meter like a little bolster laid along the top of a sofa's backrest, filled end to end with a warm, glowing orange, like a cat's purr made visible. Leave its face blank: the game writes on it.",
    notReady:
      "The same long, slim, rounded meter empty: a soft cream fabric channel with a darker inset where the glow will fill it, exactly the same shape and outline as the full one. Leave its face blank: the game writes on it."
  }
}

const gatheringLooks: Record<
  GatheringId,
  { name: string; look: (span: number) => string }
> = {
  cuddlePuddle: {
    name: "Cuddle Puddle",
    look: (span) =>
      `A long, thin strip of soft pink knitted blanket, draped across ${span} Cats sitting side by side on a sofa: just the blanket.`
  },
  varietyPack: {
    name: "Variety Pack",
    look: (span) =>
      `A string of bunting strung across ${span} seats of a sofa, hanging from its top edge, with small triangle flags in turn orange, black, white, gray, and calico.`
  },
  napClub: {
    name: "Nap Club",
    look: () =>
      "Two soft, puffy periwinkle Z shapes drifting up between two sleeping Cats, one small and one large."
  },
  personalSpace: {
    name: "Personal Space",
    look: () =>
      "A round, translucent pale-blue bubble around one Cat: just the bubble, see-through in the middle."
  },
  fullSofa: {
    name: "Full Sofa",
    look: () =>
      "A warm golden glow tracing the outline of a whole sofa, as a rounded rectangle of light, to lay over the sofa exactly."
  }
}

const capitalised = (word: string) => word[0].toUpperCase() + word.slice(1)

/**
 * The prompt for a room, UI, or Gathering image, sized for its canvas: flat
 * and front-on unless it lies on the floor.
 */
const piecePrompt = (
  { canvas }: ArtEntry,
  look: string,
  { opaque = false, onFloor = false } = {}
) =>
  [
    look,
    opaque ? "" : "Transparent background.",
    onFloor ? "" : "Front-on, with no perspective.",
    `It will be resized to exactly ${canvas.width}×${canvas.height} pixels, so compose for that shape.`,
    NO_WORDS,
    STYLE,
    MATCH
  ]
    .filter(Boolean)
    .join(" ")

const characterPrompt = (subject: string) =>
  [subject, CHARACTER, NO_WORDS, STYLE, MATCH].join(" ")

/** What an image shows, and the prompt that asks for it. */
function describe(entry: ArtEntry): { title: string; prompt: string } {
  switch (entry.kind) {
    case "cat": {
      const { coat, personality, pose } = entry
      return {
        title: `${capitalised(coat)} ${capitalised(personality)} Cat, ${pose}`,
        prompt: characterPrompt(
          `${capitalised(coatLooks[coat])}. ${personalityPoses[personality][pose]}`
        )
      }
    }
    case "houseCat": {
      const { name } = houseCat(entry.houseCat)
      const { look, idle, triggered } = houseCatLooks[entry.houseCat]
      const stage = entry.pose.match(/^warming(\d+)$/)?.[1]
      const [pose, doing] =
        entry.pose === "idle"
          ? ["idle", idle]
          : entry.pose === "triggered"
            ? ["triggered", triggered]
            : entry.pose === "bellyUp"
              ? ["belly up", BELLY_UP]
              : [
                  `warming up, stage ${stage} of ${FREYA_STAGES}`,
                  `warming up, stage ${stage} of ${FREYA_STAGES} from reserved to affectionate: ${freyaStages[Number(stage)]}`
                ]
      return {
        title: `${name}, ${pose}`,
        prompt: characterPrompt(
          `A House Cat called ${name}: ${look}. On a shelf (don't draw the shelf), ${doing}.`
        )
      }
    }
    case "badge": {
      const { colour, icon } = badgeLooks[entry.coat]
      return {
        title: `${capitalised(entry.coat)} Coat badge`,
        prompt: piecePrompt(
          entry,
          `A small round badge for a ${entry.coat} Cat: a ${colour} disc with ${icon} in bold contrast in the middle. The icon's shape must read in grayscale, for players who can't tell the colours apart.`
        )
      }
    }
    case "room":
      if (entry.piece === "moon") {
        const phase = entry.phase ?? 1
        return {
          title: `Moon, Night ${phase} of ${MOON_PHASES}`,
          prompt: piecePrompt(
            entry,
            `The moon through the window on Night ${phase} of ${MOON_PHASES}, waxing across the Run: ${moonLook(phase)}, glowing softly.`
          )
        }
      }
      return {
        title: capitalised(
          entry.piece.replace(/([A-Z])/g, " $1").toLowerCase()
        ),
        prompt: piecePrompt(entry, roomLooks[entry.piece], {
          opaque: entry.piece === "wall",
          onFloor: entry.piece === "rug"
        })
      }
    case "ui": {
      const [name, ready, not] = {
        playButton: ["Play button", "ready", "disabled"],
        redrawButton: ["Redraw button", "ready", "disabled"],
        pip: ["Pip", "full", "spent"],
        purrMeter: ["Purr meter", "full", "empty"]
      }[entry.piece]
      const looks = uiLooks[entry.piece]
      return {
        title: `${name}, ${entry.ready ? ready : not}`,
        prompt: piecePrompt(entry, entry.ready ? looks.ready : looks.notReady)
      }
    }
    case "gathering": {
      const { name, look } = gatheringLooks[entry.gathering]
      const span = entry.span ?? 1
      return {
        title: entry.span ? `${name}, across ${span} Seats` : name,
        prompt: piecePrompt(entry, look(span))
      }
    }
  }
}

/** Names for the anchors the manifest uses, by their fractions. */
const anchorNames: Record<string, string> = {
  "0,0": "top left",
  "0.5,0": "top centre",
  "0.5,0.5": "centre",
  "0.5,1": "bottom centre"
}

function anchorOf({ kind, canvas, anchor }: ArtEntry): string {
  const x = Math.round(anchor.x * canvas.width)
  const y = Math.round(anchor.y * canvas.height)
  const at = `(${x}, ${y})`
  if (kind === "cat" || kind === "houseCat")
    return `${at}: the base the character sits on, centred, with ${canvas.height - y} px beneath for a dangling tail`
  const name = anchorNames[`${anchor.x},${anchor.y}`]
  return name ? `${at}: ${name}` : at
}

function fromManifest(entry: ArtEntry): BriefEntry {
  const { key, canvas } = entry
  const photos =
    entry.kind === "houseCat" &&
    (entry.houseCat === "skadi" || entry.houseCat === "freya")
      ? [photosOf(entry.houseCat)]
      : []
  return {
    key,
    ...describe(entry),
    file: deliveredAs(key),
    size: `${canvas.width}×${canvas.height}`,
    anchor: anchorOf(entry),
    attach: [STYLE_SHEET, ...photos]
  }
}

const styleSheet: BriefEntry = {
  key: null,
  title: "Style reference sheet",
  file: STYLE_SHEET,
  size: STYLE_SHEET_SIZE,
  anchor: "none: the game never shows it",
  attach: [],
  prompt: [
    "A style reference sheet for Clowder, a cozy cat-collecting game set in a living room at night. Landscape.",
    `On the left, large, the hero character: ${coatLooks.orange}, ${CLINGY_CONTENT}, facing the viewer, full body on a plain background.`,
    "On the right, the palette: unlabelled swatches of the five Coat colours (ginger orange, black, white, smoky gray, and a calico patch of all three) and of the room (warm cream wallpaper, wood browns, sage-green sofa, terracotta rug, night-sky blue, treat gold).",
    "Beneath the palette, the outline rules: sample strokes showing the single outline weight and dark-brown outline colour used on everything, and one sphere showing the cel shading.",
    NO_WORDS,
    STYLE
  ].join(" ")
}

export function briefBatches(manifest: readonly ArtEntry[]): Batch[] {
  const hero = manifest.filter((entry) => entry.key === HERO)
  const rest = manifest.filter((entry) => entry.key !== HERO)
  const of = (...kinds: ArtEntry["kind"][]) =>
    rest.filter((entry) => kinds.includes(entry.kind)).map(fromManifest)
  return [
    {
      title: "Style reference sheet",
      entries: [styleSheet, ...hero.map(fromManifest)]
    },
    { title: "Cat poses", entries: of("cat") },
    { title: "House Cats, Skadi, and Freya", entries: of("houseCat") },
    {
      title: "The room, badges, UI furniture, and Gathering overlays",
      entries: of("room", "badge", "ui", "gathering")
    }
  ]
}

/** How to generate and deliver every image, whatever its batch. */
const RULES = [
  `**Order.** Generate the style reference sheet first and approve it before anything else: it is attached to every later generation, so it holds the style together. Start each batch in a fresh conversation with it attached. The hero Cat on the sheet is then generated as its own image, like every other Cat.`,
  `**Characters.** Every Cat and House Cat is a transparent ${CHARACTER_CANVAS}×${CHARACTER_CANVAS} PNG at one shared scale: about ${CHARACTER_SPAN} px across, centred, sitting on its base ${CHARACTER_CANVAS * (1 - CHARACTER_BASE.y)} px above the bottom edge, which leaves room for a tail to dangle over the Shelf. A character turned to one side, like a reacting Cat, faces the viewer's right; the game mirrors it to face left. Leave out hearts, Zs, anger marks, and blush: the game draws them over the art.`,
  `**The room, UI, and Gathering overlays** are authored at ${ROOM_SCALE}× the game's 390×844 design size. Only the wall is opaque; everything else has a transparent background. Leave buttons and the treat jar blank: the game writes their words and numbers.`,
  "**Sizes.** Astra generates at 1024×1024, 1536×1024, or 1024×1536. Resize, crop, or pad each image to exactly its size before saving it, without stretching; the build rejects any other size. For a long, thin piece such as the shelf or a blanket, generate it wide, spanning the whole width, then crop to its shape.",
  "**Delivery.** Save each image as a PNG at its file path. A game image in `art/raw/` replaces its code-drawn fallback with no code change, and the dev server reloads when one lands. Then run `pnpm brief` to mark it delivered here. A content Clingy or Aloof Cat, whose eyes are open, also needs its eyes measured in `src/art/eyes.ts` for the game to tint and blink them; until then it shows its own eyes.",
  "**Photos.** Skadi's and Freya's generations also attach every photo in `art/reference/photos/skadi/` or `art/reference/photos/freya/`. Those are the author's own cats: the folder is ignored by git, so the photos are never committed.",
  "**Fallback.** An image Astra can't produce consistently stays on its code-drawn fallback: list it in the batch's issue rather than holding up the batch."
]

const inCode = (file: string) => `\`${file}\``

function renderEntry(entry: BriefEntry, delivered: boolean): string {
  const attach =
    entry.attach.length > 0 ? entry.attach.map(inCode).join(", ") : "nothing"
  return [
    `### ${entry.title}: ${inCode(entry.file)}`,
    "",
    delivered
      ? "**Delivered.**"
      : entry.key
        ? "**On fallback.**"
        : "**Not yet delivered.**",
    "",
    ...(entry.key ? [`- Key: ${inCode(entry.key)}`] : []),
    `- Size: ${entry.size}`,
    `- Anchor: ${entry.anchor}`,
    `- Attach: ${attach}`,
    "",
    "```text",
    entry.prompt,
    "```"
  ].join("\n")
}

/**
 * The art brief as markdown, marking each image delivered when
 * `isDelivered` finds its file.
 */
export function artBrief(
  manifest: readonly ArtEntry[],
  isDelivered: (file: string) => boolean
): string {
  const batches = briefBatches(manifest)
  const done = (entries: BriefEntry[]) =>
    entries.filter((entry) => isDelivered(entry.file)).length
  const all = batches.flatMap((batch) => batch.entries)
  // The style reference sheet has no fallback: the game never shows it.
  const onFallback = all.filter(
    (entry) => entry.key && !isDelivered(entry.file)
  ).length
  const lines = [
    "# Art brief",
    "",
    "Every image the game needs, for Astra to generate (ADR-0005). Written by `pnpm brief` from the art manifest (`src/art/manifest.ts`) and its prompts (`src/art/brief.ts`); don't edit it by hand.",
    "",
    `**${done(all)} of ${all.length} images delivered; ${onFallback} still on fallback.**`,
    "",
    "| Batch | Delivered |",
    "| --- | --- |",
    ...batches.map(
      (batch, index) =>
        `| ${index + 1}. ${batch.title} | ${done(batch.entries)} of ${batch.entries.length} |`
    ),
    "",
    "## How to generate and deliver",
    "",
    ...RULES.map((rule) => `- ${rule}`),
    "",
    "Every prompt carries the style direction, so each can be pasted as it stands."
  ]
  batches.forEach((batch, index) => {
    lines.push("", `## ${index + 1}. ${batch.title}`, "")
    for (const entry of batch.entries)
      lines.push(
        `- [${isDelivered(entry.file) ? "x" : " "}] ${inCode(entry.file)}`
      )
    for (const entry of batch.entries)
      lines.push("", renderEntry(entry, isDelivered(entry.file)))
  })
  return `${lines.join("\n")}\n`
}
