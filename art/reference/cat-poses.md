# Cat poses — issue #37

All 30 Cat pose keys have transparent 512×512 PNGs in `art/raw/cat/`:
five Coats × three Personalities × content/reacting. The approved Orange
Clingy content hero from #36 is retained. The other 29 images were generated
with the built-in imagegen tool, attaching the approved `style-sheet.png`
and the delivered hero as a proportion and linework reference.

`cat-poses-generation.json` records each exact prompt and source filename.
Calico Clingy's reacting image received a second pass to keep its orange
and black face patches on the same sides as its content pose. Source
filenames identify the original generations; runtime loading uses only
the committed PNGs and needs no external files.

Following the brief's delivery instructions, each new image was cropped to
its nontransparent silhouette, uniformly resized to fit within 384×432 px,
and centred on a transparent 512×512 canvas. The resized silhouette was
trimmed again before alignment, since faint edge pixels can disappear when
resampling. Its bottom edge is at y=448, leaving 64 clear pixels below.
No image was stretched or recoloured.
Reacting poses face the viewer's right for the renderer to mirror.

## Verification and handoff

- All 30 keys report `delivered` through `window.__clowder.art(key)`.
- All 15 Coat/Personality combinations occur in the Hands of seeds 1–12.
  Seed 7 was visually checked on the rug and with five Cats on the Couch;
  silhouettes fit their positions and Coat badges remain visible.
- The atlas build accepts every key and canvas. The production precache is
  2.5 MB of the 15 MB budget, with every file below 2 MiB.
- No Cat key currently needs an option-D fallback.
- Typechecking, Biome, 265 unit tests, and all 28 browser tests pass.
  Browser tests ran on isolated ports because another worktree occupied
  the standard ports; the test assertions were unchanged.

Live reacting-pose switching is not implemented on this branch's baseline:
`drawCat` selects content poses. That behaviour belongs to **#32, Living
Cats**, with final asset integration in **#41**. Reacting PNGs are delivered
and load by key, but their live transitions cannot yet be reviewed in a Run.
This batch changes no renderer or rules code.

The browser-test boot helper now waits for the Couch scene, not only the
debug hook. With the full atlas, that hook can exist while art is still
loading; sending engine actions then skips the scene's scoring listener.

**Author reviewed the art in a Run on 2026-09-25**, replying in the
implementation session: “I reviewed the Run; the art looks right.”
The review used `/?seed=7`; revisit reacting transitions after #32 lands.
