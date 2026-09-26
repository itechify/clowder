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
and anchors remain those of ADR-0005 and the manifest. The initial art
delivery needed no renderer or rules changes.

## Shop legibility correction

Author feedback on the initial delivery identified illegible Freya offer
text, thin Kind count badges, undersized Nightfall text, and vertically
misaligned Rehome text. A seed-1 browser probe measured Freya's name at
6.8 design pixels and her ability at 5.3: the tag layout scaled every line
to fit a fixed height. Nightfall similarly shrank from 26 to 15.7 pixels.

The author chose to keep four offers and tap a visitor or tag for details.
Tags now show names at 12 pixels and a Kind or `View ability` at 11 pixels,
without shrinking. The detail panel shows the full name, title and ability
(16 pixels). Tapping outside or Close dismisses it without activating a
Shop control underneath. Adopt and Recruit remain one-tap actions below
the tags.

The count badge was regenerated taller, fitted uniformly into the same
96×60 manifest canvas, and displayed at 32×24 design pixels. The final
visible badge is about 19 pixels high, up from 12. The generation log
marks the original as superseded and records both revision attempts.
Secondary button artwork now compensates for its transparent vertical
padding; its label and price sit together in the centre. Nightfall's label
renders at 26 pixels, and Rehome's at 20.

`shop-legibility-after.png` shows the corrected Shop, and
`shop-offer-details.png` shows Freya's full ability. These supersede the
initial Shop previews for the tag, badge and button layout. The new browser
regression exercises opening details from both the tag and visitor,
dismissing by Close and outside tap, and preserving Treats and Run state.
Seed 4 also verifies that One Braincell wraps at 12 pixels without shrinking.

## Shop spacing and window correction

Further author feedback identified door leaves behind the outer visitors,
off-centre Orange and Calico pile panels, weather in front of the window
frame, and crowded spacing around Reroll and the household heading.

The doorway was edited with the built-in image tool so the open leaves sit
at its outer edges. Its visible artwork was uniformly fitted inside
1116×336 pixels and bottom-centred on the unchanged 1116×390 canvas. All
four visitors now stand inside the opening. The generation log records the
exact edit prompt and supersedes the original doorway.

The pile fan and its panel now share a centre, including the panel's
minimum width when clamping it to the screen. A browser probe reproduced
33-pixel offsets on both edge piles before the fix, and zero afterward;
the public layout test covers both edges. Reroll moved down 16 pixels,
offers down 6 pixels, and the household heading down 26 pixels, with the
pile rows adjusted to fit below it. The selected Shelf hint stays on one
line to keep the space above Reroll clear.

Weather is masked to the two panes, behind both the outer frame and central
mullion. Phaser 4's external Mask filter handles WebGL; the GeometryMask
path handles Canvas. This also applies to the moon during Shop transitions.
A rendered-pixel probe compared visible and hidden weather: the settled
sun changed 907 pixels inside the panes, storm weather changed 2,542, and
neither changed any pixels outside. Disabling the filter reproduces 138 changed pixels outside the panes.
The Canvas fallback also passed the visible/hidden weather comparison. The masks are released with their objects and Scene.

`shop-layout-day.png` and `shop-layout-storm.png` show the final room;
`shop-layout-orange.png` and `shop-layout-calico.png` show the centred edge
pile panels. These supersede the earlier Shop room layout previews.

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
- Typechecking, Biome, all 368 unit tests, and all 62 browser tests pass,
  including atlas delivery, Shop transitions, Results, and offline loading.
  The production precache is approximately 4.5 MB of the 15 MB budget,
  with all 21 precached files below 2 MiB.
- Independent standards and spec reviews reported zero findings on each
  axis for both the original delivery (against `4cbc503`) and the legibility
  correction (against `b45c6cf`). The final layout review (against
  `35f56f6`) found no standards violations and no spec findings; it noted
  one non-blocking maintenance concern about the panel width calculation
  also used by Cat placement. The existing `fanX` interface is retained,
  covered by the edge-centering regression test.

These screenshots record agent visual verification, not a new author
approval of the batch. The previously approved style reference is unchanged.
