# Shop and Results art — issue #56

All twelve keys are delivered under `art/raw/room/`: `dayWindow`, `sun`,
`sunbeam`, `stormClouds`, `frontDoor`, `disasterNote`, `offerTag`, `countBadge`,
`titleSign`, `photoFrame`, `catBed`, and `rosette`. No key in this batch is
rejected to permanent code-drawn fallback. `pnpm brief` updates the delivery
checklist; all 103 images in the brief are now delivered, including the
non-runtime style sheet.

The built-in imagegen tool generated each sprite separately with the
approved `style-sheet.png` from #36 attached. The day window also references
the existing night window to match its frame. `shop-results-generation.json`
records exact prompts, reference images and original source filenames.
Sources are in the generating session's Codex image directory; only the
committed PNGs are needed to build and run the game.

Rejected attempts in that log are superseded generations, not rejected
runtime keys: the first sun had pointed rays, the first sunbeam included
floorboards, and the first storm clouds had a face. The photo frame needed
two edits to widen and raise its blank plate for the existing Score and
Night labels. A front-door request failed with a service authentication
error; retrying the built-in tool succeeded. No CLI/API fallback was used.

Each sprite was cropped to the bounds of alpha greater than 2/255,
uniformly resized to fit its manifest canvas, and padded with transparent
pixels without stretching. The original alpha inside the crop is preserved.
The front door and cat bed align to the bottom, the Disaster note and offer
tag to the top, and the remaining sprites to the centre. Canvas dimensions
and anchors remain those of ADR-0005 and the manifest; no renderer or rules
changes were needed.

## Verification

- All twelve keys report `delivered` through `window.__clowder.art(key)`.
  The existing art browser test now expects their delivered images.
- Agent visual inspection at 390×844 covered the ordinary Shop, the Shop
  before a Disaster, and both won and lost Results. No page errors were
  observed in the final capture. Text remains drawn by the game.
- `shop-results-day.png` and `shop-results-storm.png` show seed 1's Shops
  before Nights 2 and 3. `shop-results-won.png` shows seed 3 with a one-Night
  Run and Target 10; `shop-results-lost.png` shows seed 7 played one Cat at
  a time. The final photo plate fits both the Score and Night labels.
- Typechecking, Biome, all 367 unit tests, and all 61 browser tests pass,
  including atlas delivery, Shop transitions, Results, and offline loading.
  An initial browser run was externally terminated after eight passing
  tests; the restarted full suite passed. The production precache is
  approximately 4.4 MB of the 15 MB budget, with all 21 precached files below
  2 MiB.
- Independent standards and spec reviews reported zero findings on each
  axis against the task's starting commit, `4cbc503`.

These screenshots record agent visual verification, not a new author
approval of the batch. The previously approved style reference is unchanged.
