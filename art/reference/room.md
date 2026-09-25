# Room, badges, UI, and Gatherings — issue #39

All 38 batch-four keys have PNGs under `art/raw/`: five Coat badges,
17 room pieces (including nine moon phases), eight UI states, and eight
Gathering overlays. No key in this batch needs an option-D fallback.
`pnpm brief` records the delivery in `art/brief.md`.

The built-in imagegen tool generated each image separately with the approved
`style-sheet.png` attached. `room-generation.json` records the exact prompts
and source filenames; entries marked `rejected` are superseded attempts,
not runtime assets. The meter's empty state additionally references its full
state to preserve the silhouette. Runtime loading needs only the committed
PNGs, not the source files outside the repository.

Following the brief's delivery instructions, each transparent sprite was
cropped around its visible silhouette (alpha greater than 2/255, excluding
nearly invisible stray pixels), uniformly resized to fit its manifest canvas,
and padded with transparent pixels. The original alpha within the crop is
preserved. Bottom-anchored furniture aligns to the bottom; the Shelf, Seat
pad, and Disaster sign align to the top; other sprites are centred except
Full Sofa, which fits within 1170×414 and starts at y=84 on its 1170×498
canvas to frame the upholstery below the meter. Moons
fit within 84×84 on their 96×96 canvases to maintain a consistent disc size.
The opaque wall was uniformly resized and centre-cropped to 1170×2532.
Nothing was stretched. All room/UI/Gathering canvases are at 3× design size;
badges use the manifest's 128×128 character-scale canvas.

Rejected generations included unwanted Cats in the cushion and Nap Club,
overly deep blanket/bunting strips, an insufficiently full Night-8 moon,
and mismatched meter outlines. Full Sofa's first heavy frame competed with
Cat names; its final thin translucent halo leaves names readable and frames
the upholstery below the meter. After author feedback that the cushions
looked suspended, the Couch frame was edited to raise its support deck and
front fascia to meet the cushion bottoms. Cat seating positions and the
separate cushion image are unchanged. A later attempt to extend only the
backrest also moved the support deck, so it was rejected. The meter still
sits approximately 11 design pixels above the backrest; this minor visual
review finding remains open.

## Verification

- All 38 keys report `delivered` through `window.__clowder.art(key)`.
- Agent visual inspection in Runs: seed 7 with five Cats (Variety Pack and
  Full Sofa); seed 1 with its five Black Cats (Cuddle Puddle); seed 3 with
  its three Sleepy Cats together (Nap Club), then Cats in Seats 1, 3, and 5
  (Personal Space). No browser errors.
- `room-preview.png` shows seed 7's furnished room and active Gatherings.
- `badges-grayscale.png` shows all five badges in grayscale, including at
  22 px near their in-game size: sun, crescent, snowflake, diamond, star.
- Typechecking and all 273 unit tests pass. All 48 browser tests pass.
  After the Couch and halo revisions, the art/HUD browser checks were repeated.
- The production build validates every key and canvas. The complete offline
  precache is approximately 4.2 MB of the 15 MB budget; each file is below
  2 MiB.

## Author review

**Correction awaiting author confirmation.** The author reviewed the initial
Run on 2026-09-25 and reported that the cushions looked raised off the Couch.
The frame now supports the cushion bottoms, verified by agent inspection
both empty and occupied. Refresh `/?seed=7` to review the correction.
No final author approval is claimed by this delivery.
