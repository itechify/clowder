# Scrapbook art and sound — issue #73

All three keys introduced by #71 are delivered under `art/raw/room/`:
`scrapbook` (162×120), `scrapbookOpen` (1128×750), and `scrapbookPage`
(336×558). Every Gathering uses the same blank page sprite, with its name,
requirement, level and reward drawn by the game. There are no separate
Gathering-page keys in the manifest. No key needs permanent option-D fallback.
The regenerated brief records all 106 images delivered, including its
non-runtime reference images.

The built-in imagegen tool generated the sprites using the approved #36
style sheet. `scrapbook-generation.json` records exact prompts, references
and source paths. Each image was cropped to the bounds of alpha greater
than 2/255, uniformly resized to fit its manifest canvas, and centred with
transparent padding. Alpha inside the crop is preserved; no sprite was
stretched. The committed PNGs are sufficient to build and run the game.

The initial open spread was too shallow: the game's “Tap to close” hint
landed on the cover. An imagegen edit made the spread taller and its border
thinner. The final image keeps the fifth Gathering row and close hint on
cream paper. The log marks the initial generation as superseded.

The spec review also caught the first page sprite's patterned tape touching
the wrapped “Personal Space” heading. An imagegen edit reduced the tape to
a thin strip at the top, leaving the lettering entirely on cream paper.

`pageChosen`, the only new cue from #71, now has its finished synthesized
voice in `src/audio/voices.ts`: two paper rustles, rising felt notes, then a
soft binding tap and music-box sixth at the default 650 ms page landing.
Its tail finishes at 1.13 seconds, within the default 1.2-second page moment.
It uses the existing Web Audio primitives, cue routing, SFX volume and mute;
no audio files ship. Reduced motion retains the cue through the existing
choreography.

## Verification and author review

The existing delivery test was first run with the Scrapbook keys required
to be delivered; it failed on exactly those three missing images. With the
PNGs installed it passes. The existing Scrapbook browser checks verify the
choice, page-chosen cue, reload, and opening the book by night and in the
Shop. Web Audio rendering verifies the new voice is audible, finite, below
the clipping threshold, and ends in silence.

Agent visual inspection at 390×844 covered a seed-1 Run, undiscovered
Gatherings, three offered pages, choosing a page, and the Shop's book with
a level-2 Gathering. No browser page errors were observed. The final
captures are `scrapbook-art-room.png`, `scrapbook-art-view.png`,
`scrapbook-art-choice.png`, and `scrapbook-art-shop.png`.

Typechecking, Biome and all 407 unit tests pass. The production atlas build
and precache check pass: 21 files, each under 2 MiB, totalling 4.5 MB of the
15 MB budget. The full browser suite passed 63 of 69 tests, including every
Scrapbook, art-delivery and synthesis test. Retrying the six failures with
fresh servers passed the two audio tests and the scoring-completion test.
Two effects tests still timed out waiting for scoring to finish, and the
Shop ability-detail test exceeded its 30-second test timeout. These three
browser failures remain unresolved; the suite is not fully green.
After installing the thinner tape, the art-delivery and page-choice browser
checks were run again and both passed.

The machine was under heavy load during verification. A separate checkout
of the unchanged baseline passed the scoring-cue and big-Score effects
checks in roughly 19 seconds each, so the comparison suggests timing
sensitivity but does not prove the failures are unrelated to this delivery.
No test timeouts or game timing were changed.

The independent standards review reported no findings. The spec review's
tape-overlap finding was corrected in the final page sprite; author review
remains outstanding.

Author review in a Run remains pending. Run `pnpm dev`, open `/?seed=1`,
tap the Scrapbook beside the rug, then clear the first Night and choose a
page with SFX enabled. Review the page lettering, paper and cover style,
flight sound and landing, then open the Scrapbook in the Shop. The approved
style reference and agent screenshots do not constitute author approval of
this delivery.
