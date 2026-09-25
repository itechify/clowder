# Style reference — issue #36

`style-sheet.png` is the 1536×1024 reference for later art batches. The author
approved it in the implementation session on 2026-09-25: “Approve this style
and record approval.” The [issue comment](https://github.com/itechify/clowder/issues/36#issuecomment-5829467041)
records that approval.

The sheet stays outside `art/raw/`, as specified by the art brief: it is a
generation reference, not a game texture. Its matching Orange Clingy hero is
`art/raw/cat/orange/clingy/content.png`, loaded through
`cat/orange/clingy/content` without renderer changes.

Both images were generated with the built-in imagegen tool. The exact prompts
are saved in `style-sheet-prompt.txt` and `hero-prompt.txt`. The hero's second
pass shortened the torso to fit the character canvas while retaining its face,
markings, palette, and outline style.

The hero was cropped to its visible silhouette, uniformly resized to 353×432
(within the brief's approximately 384 px width), and padded to 512×512. The
silhouette starts at (79, 16) and ends at the y=448 baseline, leaving the bottom
64 pixels transparent. This preserves its proportions and alpha rather than
stretching the image to fill the nominal width.

Attach the approved sheet to later generations; use the delivered hero for the
in-game character scale. No other batch is delivered by this issue.
