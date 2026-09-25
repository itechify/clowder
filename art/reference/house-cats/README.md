# House Cat art — issue #38

Delivered all 22 images from batch 3 of `art/brief.md` under
`art/raw/houseCat/`: nine idle/triggered pairs, Skadi's `bellyUp`, and Freya's
`warming1`, `warming2`, and `warming3`. No option-D fallbacks were needed.

Generated with the built-in imagegen tool on 2026-09-25. Every generation
attached the approved `art/reference/style-sheet.png`. Later poses also
attached the character's original generated idle image to preserve identity.
`prompts.json` records the exact final prompts, references, and source image
basenames. Original generated images remain in the local Codex image output
directory; the game only consumes the delivered files in this repository.

Skadi's three poses used both `skadi.JPEG` and `skadi-belly.JPEG`; Freya's five
poses used `freya.JPEG`, from the main checkout's ignored
`art/reference/photos/` folder. The image tool rejected Skadi's original JPEG
input, so both photos were converted to sRGB PNG, proportionally resized within
1536×1536, and retried. These private references remain ignored and are not
committed. Skadi retains her long tabby fur, white ruff and belly, forehead
blaze, and green eyes; Freya retains her shorter gray-and-white coat, pale
green eyes, forehead blaze, and gray nose marking.

Two initial triggered candidates were discarded: One Braincell substituted a
light bulb for its brain, and The Big Loaf stood up. The final candidates keep
the pink brain and the low loaf silhouette respectively.

Each delivered PNG is 512×512 with alpha. The generated image was cropped to
the bounds of alpha greater than 8/255 (excluding nearly invisible peripheral
noise), uniformly resized to fit within 384×432, centred horizontally, and
padded with transparent pixels so its base ends at y=448. Alpha inside the
crop is preserved, including Copycat's translucent double. Narrow upright
poses are less than 384 px wide to preserve proportions; all leave the bottom
64 pixels clear. No runtime or engine code changes are needed.

Validation: all 22 keys report `delivered` through the development debug hook.
All nine House Cats were inspected on the Shelf in seeded Run fixtures, and
their triggered/signature textures were also drawn on the same Shelf through
the atlas. The current branch selects idle poses during ordinary play;
automatic pose switching belongs to the separate presentation work. The
production atlas passes the offline checks (2.7 MB total precache of 15 MB).

The author reviewed the Run captures (idle Shelf and signature poses) and the
full contact sheet in the implementation session on 2026-09-25, including the
Skadi/Freya likenesses, and explicitly approved: “Approve the delivered art”.

After integrating the latest HUD and audio changes from main, typechecking,
Biome, all 273 unit tests, all 48 browser tests, and the production build/precache
checks pass. The standards review found no violations; the spec
review's only outstanding item was author review, now satisfied above.
