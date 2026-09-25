import { describe, expect, it } from "vitest"
import { artBrief, briefBatches, STYLE_SHEET } from "./brief"
import { artManifest } from "./manifest"

const batches = briefBatches(artManifest)
const entries = batches.flatMap((batch) => batch.entries)

describe("the art brief", () => {
  it("lists every key in the manifest once, delivered as a PNG named for it", () => {
    for (const { key } of artManifest) {
      const listed = entries.filter((entry) => entry.key === key)
      expect(listed).toHaveLength(1)
      expect(listed[0].file).toBe(`art/raw/${key}.png`)
    }
  })

  it("groups the images into the four delivery batches", () => {
    const kinds = (batch: (typeof batches)[number]) =>
      new Set(
        batch.entries.flatMap(
          (entry) =>
            artManifest.find(({ key }) => key === entry.key)?.kind ?? []
        )
      )
    const [style, cats, houseCats, room] = batches
    expect(batches).toHaveLength(4)

    // The style reference sheet, then one finished hero Cat in that style.
    expect(style.title).toMatch(/style reference/i)
    expect(style.entries.map((entry) => entry.file)).toEqual([
      "art/reference/style-sheet.png",
      "art/raw/cat/orange/clingy/content.png"
    ])

    expect(cats.title).toMatch(/Cat poses/)
    expect(kinds(cats)).toEqual(new Set(["cat"]))
    expect(cats.entries).toHaveLength(29)

    expect(houseCats.title).toMatch(/House Cats.*Skadi.*Freya/)
    expect(kinds(houseCats)).toEqual(new Set(["houseCat"]))
    expect(houseCats.entries).toHaveLength(22)

    expect(room.title).toMatch(/room.*badges.*UI.*Gathering/i)
    expect(kinds(room)).toEqual(new Set(["room", "badge", "ui", "gathering"]))
  })

  it("gives each image its canvas size and where its anchor sits", () => {
    const entry = (key: string) => entries.find((entry) => entry.key === key)!
    expect(entry("cat/black/sleepy/reacting")).toMatchObject({
      size: "512×512",
      anchor: expect.stringContaining("(256, 448)")
    })
    expect(entry("houseCat/freya/warming2")).toMatchObject({
      size: "512×512",
      anchor: expect.stringContaining("(256, 448)")
    })
    expect(entry("room/wall")).toMatchObject({
      size: "1170×2532",
      anchor: expect.stringContaining("(0, 0)")
    })
    expect(entry("room/couch")).toMatchObject({
      size: "1170×498",
      anchor: expect.stringContaining("(585, 498)")
    })
    for (const { size, anchor } of entries) {
      expect(size).toMatch(/^\d+×\d+$/)
      expect(anchor).not.toBe("")
    }
  })

  it("attaches the style reference sheet to everything generated after it", () => {
    const [sheet, ...rest] = entries
    expect(sheet.attach).toEqual([])
    for (const entry of rest) expect(entry.attach).toContain(STYLE_SHEET)
  })

  it("attaches the photos of Skadi and Freya to their images, and only theirs", () => {
    for (const entry of entries) {
      const photos = entry.attach.filter((file) => file !== STYLE_SHEET)
      if (entry.key?.startsWith("houseCat/skadi/"))
        expect(photos).toEqual(["art/reference/photos/skadi/"])
      else if (entry.key?.startsWith("houseCat/freya/"))
        expect(photos).toEqual(["art/reference/photos/freya/"])
      else expect(photos).toEqual([])
    }
    // Idle and triggered, plus their signature poses.
    const of = (name: string) =>
      entries.filter((entry) => entry.attach.some((f) => f.includes(name)))
    expect(of("skadi")).toHaveLength(3)
    expect(of("freya")).toHaveLength(5)
  })

  describe("prompts", () => {
    const prompt = (key: string) =>
      entries.find((entry) => entry.key === key)!.prompt

    it("gives every image its own ready-to-paste prompt in the agreed style", () => {
      const prompts = entries.map((entry) => entry.prompt)
      expect(new Set(prompts).size).toBe(prompts.length)
      for (const text of prompts) {
        expect(text).toMatch(/Cult of the Lamb/)
        expect(text).toMatch(/bold.*outlines/i)
        expect(text).toMatch(/saturated/i)
        expect(text).not.toMatch(/undefined|NaN/)
      }
    })

    it("asks for the style reference sheet's hero Cat, palette, and outline rules", () => {
      const sheet = entries[0].prompt
      expect(sheet).toMatch(/orange/i)
      expect(sheet).toMatch(/palette/i)
      expect(sheet).toMatch(/outline/i)
    })

    it("draws each Cat in its Coat and its Personality's poses", () => {
      expect(prompt("cat/calico/aloof/content")).toMatch(/calico/i)
      expect(prompt("cat/gray/clingy/reacting")).toMatch(/lean/i)
      expect(prompt("cat/white/aloof/reacting")).toMatch(/offended/i)
      expect(prompt("cat/black/sleepy/reacting")).toMatch(/curled/i)
      for (const entry of entries)
        if (entry.key?.startsWith("cat/"))
          expect(entry.prompt).toMatch(/transparent background/i)
    })

    it("shows a House Cat's effect in its triggered pose", () => {
      expect(prompt("houseCat/boxGoblin/triggered")).toMatch(/bursting/i)
      expect(prompt("houseCat/theVoid/triggered")).toMatch(/eyes glow/i)
      expect(prompt("houseCat/bigLoaf/triggered")).toMatch(/nudg/i)
      expect(prompt("houseCat/skadi/bellyUp")).toMatch(/belly/i)
      expect(prompt("houseCat/freya/warming3")).toMatch(/affectionate/i)
    })

    it("draws Skadi and Freya from their photos", () => {
      for (const entry of entries)
        if (entry.key?.match(/^houseCat\/(skadi|freya)\//))
          expect(entry.prompt).toMatch(/attached photos/i)
    })
  })

  describe("as written for the author", () => {
    const delivered = new Set([
      STYLE_SHEET,
      "art/raw/cat/orange/clingy/content.png",
      "art/raw/room/rug.png"
    ])
    const brief = artBrief(artManifest, (file) => delivered.has(file))
    /** The brief's section for one image, headed by its file. */
    const section = (file: string) => {
      const sections = brief
        .split("\n### ")
        .filter((text) => text.split("\n")[0].includes(`\`${file}\``))
      expect(sections).toHaveLength(1)
      return sections[0]
    }

    it("gives every image its prompt to paste, size, anchor, attachments, and file", () => {
      for (const entry of entries) {
        const text = section(entry.file)
        expect(text).toContain(`\n\`\`\`text\n${entry.prompt}\n\`\`\`\n`)
        expect(text).toContain(entry.size)
        expect(text).toContain(entry.anchor)
        for (const file of entry.attach) expect(text).toContain(file)
      }
    })

    it("marks which images are delivered and which are still on fallback", () => {
      expect(section("art/raw/room/rug.png")).toMatch(/Delivered/)
      expect(section("art/raw/room/couch.png")).toMatch(/On fallback/)
      expect(section(STYLE_SHEET)).toMatch(/Delivered/)
      expect(brief).toContain("- [x] `art/raw/room/rug.png`")
      expect(brief).toContain("- [ ] `art/raw/room/couch.png`")
    })

    it("counts what is delivered in each batch and overall", () => {
      const total = entries.length
      expect(brief).toMatch(/\| 1\. Style reference sheet \| 2 of 2 \|/)
      expect(brief).toMatch(/\| 2\. Cat poses \| 0 of 29 \|/)
      expect(brief).toContain(`3 of ${total} images delivered`)
    })
  })
})
