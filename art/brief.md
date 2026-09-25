# Art brief

Every image the game needs, for Astra to generate (ADR-0005). Written by `pnpm brief` from the art manifest (`src/art/manifest.ts`) and its prompts (`src/art/brief.ts`); don't edit it by hand.

**0 of 87 images delivered; 86 still on fallback.**

| Batch | Delivered |
| --- | --- |
| 1. Style reference sheet | 0 of 2 |
| 2. Cat poses | 0 of 29 |
| 3. House Cats, Skadi, and Freya | 0 of 22 |
| 4. The room, badges, UI furniture, and Gathering overlays | 0 of 34 |

## How to generate and deliver

- **Order.** Generate the style reference sheet first and approve it before anything else: it is attached to every later generation, so it holds the style together. Start each batch in a fresh conversation with it attached. The hero Cat on the sheet is then generated as its own image, like every other Cat.
- **Characters.** Every Cat and House Cat is a transparent 512×512 PNG at one shared scale: about 384 px across, centred, sitting on its base 64 px above the bottom edge, which leaves room for a tail to dangle over the Shelf. A reacting Cat faces the viewer's right; the game mirrors it to face left. Leave out hearts, Zs, and anger marks: the game draws them over the art.
- **The room, UI, and Gathering overlays** are authored at 3× the game's 390×844 design size. Only the wall is opaque; everything else has a transparent background. Leave buttons and the treat jar blank: the game writes their words and numbers.
- **Sizes.** Astra generates at 1024×1024, 1536×1024, or 1024×1536. Resize, crop, or pad each image to exactly its size before saving it; the build rejects any other size.
- **Delivery.** Save each image as a PNG at its file path. A game image in `art/raw/` replaces its code-drawn fallback with no code change, and the dev server reloads when one lands. Then run `pnpm brief` to mark it delivered here.
- **Photos.** Skadi's and Freya's generations also attach every photo in `art/reference/photos/skadi/` or `art/reference/photos/freya/`. Those are the author's own cats: the folder is ignored by git, so the photos are never committed.
- **Fallback.** An image Astra can't produce consistently stays on its code-drawn fallback: list it in the batch's issue rather than holding up the batch.

Every prompt carries the style direction, so each can be pasted as it stands.

## 1. Style reference sheet

- [ ] `art/reference/style-sheet.png`
- [ ] `art/raw/cat/orange/clingy/content.png`

### Style reference sheet: `art/reference/style-sheet.png`

**Not yet delivered.**

- Size: 1536×1024
- Anchor: none: the game never shows it
- Attach: nothing

```text
A style reference sheet for Clowder, a cozy cat-collecting game set in a living room at night. Landscape. On the left, large, the hero character: an orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle, sitting upright and eager, big round shining eyes and a small happy smile, as if hoping someone will sit beside it, facing the viewer, full body on a plain background. On the right, the palette: unlabelled swatches of the five Coat colours (ginger orange, black, white, smoky gray, and a calico patch of all three) and of the room (warm cream wallpaper, wood browns, sage-green sofa, terracotta rug, night-sky blue, treat gold). Beneath the palette, the outline rules: sample strokes showing the single outline weight and dark-brown outline colour used on everything, and one sphere showing the cel shading. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night.
```

### Orange Clingy Cat, content: `art/raw/cat/orange/clingy/content.png`

**On fallback.**

- Key: `cat/orange/clingy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
An orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle. Clingy, content: sitting upright and eager, big round shining eyes and a small happy smile, as if hoping someone will sit beside it. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

## 2. Cat poses

- [ ] `art/raw/cat/orange/clingy/reacting.png`
- [ ] `art/raw/cat/orange/aloof/content.png`
- [ ] `art/raw/cat/orange/aloof/reacting.png`
- [ ] `art/raw/cat/orange/sleepy/content.png`
- [ ] `art/raw/cat/orange/sleepy/reacting.png`
- [ ] `art/raw/cat/black/clingy/content.png`
- [ ] `art/raw/cat/black/clingy/reacting.png`
- [ ] `art/raw/cat/black/aloof/content.png`
- [ ] `art/raw/cat/black/aloof/reacting.png`
- [ ] `art/raw/cat/black/sleepy/content.png`
- [ ] `art/raw/cat/black/sleepy/reacting.png`
- [ ] `art/raw/cat/white/clingy/content.png`
- [ ] `art/raw/cat/white/clingy/reacting.png`
- [ ] `art/raw/cat/white/aloof/content.png`
- [ ] `art/raw/cat/white/aloof/reacting.png`
- [ ] `art/raw/cat/white/sleepy/content.png`
- [ ] `art/raw/cat/white/sleepy/reacting.png`
- [ ] `art/raw/cat/gray/clingy/content.png`
- [ ] `art/raw/cat/gray/clingy/reacting.png`
- [ ] `art/raw/cat/gray/aloof/content.png`
- [ ] `art/raw/cat/gray/aloof/reacting.png`
- [ ] `art/raw/cat/gray/sleepy/content.png`
- [ ] `art/raw/cat/gray/sleepy/reacting.png`
- [ ] `art/raw/cat/calico/clingy/content.png`
- [ ] `art/raw/cat/calico/clingy/reacting.png`
- [ ] `art/raw/cat/calico/aloof/content.png`
- [ ] `art/raw/cat/calico/aloof/reacting.png`
- [ ] `art/raw/cat/calico/sleepy/content.png`
- [ ] `art/raw/cat/calico/sleepy/reacting.png`

### Orange Clingy Cat, reacting: `art/raw/cat/orange/clingy/reacting.png`

**On fallback.**

- Key: `cat/orange/clingy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
An orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle. Clingy, delighted by company: leaning its whole body toward the viewer's right as if snuggling into a friend just out of frame, eyes closed in a happy smile. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Orange Aloof Cat, content: `art/raw/cat/orange/aloof/content.png`

**On fallback.**

- Key: `cat/orange/aloof/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
An orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle. Aloof, content: sitting tall and composed on its own, tail wrapped neatly round its paws, half-lidded eyes glancing sideways, mouth a flat, unimpressed line. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Orange Aloof Cat, reacting: `art/raw/cat/orange/aloof/reacting.png`

**On fallback.**

- Key: `cat/orange/aloof/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
An orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle. Aloof, offended by company: turned away toward the viewer's right with its nose in the air, eyes shut in disdain and ears flattened, as if someone has just sat down on its left. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Orange Sleepy Cat, content: `art/raw/cat/orange/sleepy/content.png`

**On fallback.**

- Key: `cat/orange/sleepy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
An orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle. Sleepy, content: loafed with its paws tucked under, eyes gently closed, dozing on its own. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Orange Sleepy Cat, reacting: `art/raw/cat/orange/sleepy/reacting.png`

**On fallback.**

- Key: `cat/orange/sleepy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
An orange tabby Cat: bright ginger fur with darker orange stripes and a cream muzzle. Sleepy, sharing a nap: curled up in a tight ball with its tail over its nose, fast asleep and snuggled toward the viewer's right, as if a nap partner lies just out of frame. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Black Clingy Cat, content: `art/raw/cat/black/clingy/content.png`

**On fallback.**

- Key: `cat/black/clingy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A black Cat: glossy solid black fur with cool blue-gray highlights, so its shape still reads inside dark outlines. Clingy, content: sitting upright and eager, big round shining eyes and a small happy smile, as if hoping someone will sit beside it. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Black Clingy Cat, reacting: `art/raw/cat/black/clingy/reacting.png`

**On fallback.**

- Key: `cat/black/clingy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A black Cat: glossy solid black fur with cool blue-gray highlights, so its shape still reads inside dark outlines. Clingy, delighted by company: leaning its whole body toward the viewer's right as if snuggling into a friend just out of frame, eyes closed in a happy smile. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Black Aloof Cat, content: `art/raw/cat/black/aloof/content.png`

**On fallback.**

- Key: `cat/black/aloof/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A black Cat: glossy solid black fur with cool blue-gray highlights, so its shape still reads inside dark outlines. Aloof, content: sitting tall and composed on its own, tail wrapped neatly round its paws, half-lidded eyes glancing sideways, mouth a flat, unimpressed line. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Black Aloof Cat, reacting: `art/raw/cat/black/aloof/reacting.png`

**On fallback.**

- Key: `cat/black/aloof/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A black Cat: glossy solid black fur with cool blue-gray highlights, so its shape still reads inside dark outlines. Aloof, offended by company: turned away toward the viewer's right with its nose in the air, eyes shut in disdain and ears flattened, as if someone has just sat down on its left. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Black Sleepy Cat, content: `art/raw/cat/black/sleepy/content.png`

**On fallback.**

- Key: `cat/black/sleepy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A black Cat: glossy solid black fur with cool blue-gray highlights, so its shape still reads inside dark outlines. Sleepy, content: loafed with its paws tucked under, eyes gently closed, dozing on its own. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Black Sleepy Cat, reacting: `art/raw/cat/black/sleepy/reacting.png`

**On fallback.**

- Key: `cat/black/sleepy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A black Cat: glossy solid black fur with cool blue-gray highlights, so its shape still reads inside dark outlines. Sleepy, sharing a nap: curled up in a tight ball with its tail over its nose, fast asleep and snuggled toward the viewer's right, as if a nap partner lies just out of frame. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### White Clingy Cat, content: `art/raw/cat/white/clingy/content.png`

**On fallback.**

- Key: `cat/white/clingy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A white Cat: fluffy pure white fur with pink ears, nose, and toe beans. Clingy, content: sitting upright and eager, big round shining eyes and a small happy smile, as if hoping someone will sit beside it. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### White Clingy Cat, reacting: `art/raw/cat/white/clingy/reacting.png`

**On fallback.**

- Key: `cat/white/clingy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A white Cat: fluffy pure white fur with pink ears, nose, and toe beans. Clingy, delighted by company: leaning its whole body toward the viewer's right as if snuggling into a friend just out of frame, eyes closed in a happy smile. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### White Aloof Cat, content: `art/raw/cat/white/aloof/content.png`

**On fallback.**

- Key: `cat/white/aloof/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A white Cat: fluffy pure white fur with pink ears, nose, and toe beans. Aloof, content: sitting tall and composed on its own, tail wrapped neatly round its paws, half-lidded eyes glancing sideways, mouth a flat, unimpressed line. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### White Aloof Cat, reacting: `art/raw/cat/white/aloof/reacting.png`

**On fallback.**

- Key: `cat/white/aloof/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A white Cat: fluffy pure white fur with pink ears, nose, and toe beans. Aloof, offended by company: turned away toward the viewer's right with its nose in the air, eyes shut in disdain and ears flattened, as if someone has just sat down on its left. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### White Sleepy Cat, content: `art/raw/cat/white/sleepy/content.png`

**On fallback.**

- Key: `cat/white/sleepy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A white Cat: fluffy pure white fur with pink ears, nose, and toe beans. Sleepy, content: loafed with its paws tucked under, eyes gently closed, dozing on its own. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### White Sleepy Cat, reacting: `art/raw/cat/white/sleepy/reacting.png`

**On fallback.**

- Key: `cat/white/sleepy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A white Cat: fluffy pure white fur with pink ears, nose, and toe beans. Sleepy, sharing a nap: curled up in a tight ball with its tail over its nose, fast asleep and snuggled toward the viewer's right, as if a nap partner lies just out of frame. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Gray Clingy Cat, content: `art/raw/cat/gray/clingy/content.png`

**On fallback.**

- Key: `cat/gray/clingy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A gray Cat: soft, smoky blue-gray fur with a paler chest. Clingy, content: sitting upright and eager, big round shining eyes and a small happy smile, as if hoping someone will sit beside it. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Gray Clingy Cat, reacting: `art/raw/cat/gray/clingy/reacting.png`

**On fallback.**

- Key: `cat/gray/clingy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A gray Cat: soft, smoky blue-gray fur with a paler chest. Clingy, delighted by company: leaning its whole body toward the viewer's right as if snuggling into a friend just out of frame, eyes closed in a happy smile. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Gray Aloof Cat, content: `art/raw/cat/gray/aloof/content.png`

**On fallback.**

- Key: `cat/gray/aloof/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A gray Cat: soft, smoky blue-gray fur with a paler chest. Aloof, content: sitting tall and composed on its own, tail wrapped neatly round its paws, half-lidded eyes glancing sideways, mouth a flat, unimpressed line. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Gray Aloof Cat, reacting: `art/raw/cat/gray/aloof/reacting.png`

**On fallback.**

- Key: `cat/gray/aloof/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A gray Cat: soft, smoky blue-gray fur with a paler chest. Aloof, offended by company: turned away toward the viewer's right with its nose in the air, eyes shut in disdain and ears flattened, as if someone has just sat down on its left. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Gray Sleepy Cat, content: `art/raw/cat/gray/sleepy/content.png`

**On fallback.**

- Key: `cat/gray/sleepy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A gray Cat: soft, smoky blue-gray fur with a paler chest. Sleepy, content: loafed with its paws tucked under, eyes gently closed, dozing on its own. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Gray Sleepy Cat, reacting: `art/raw/cat/gray/sleepy/reacting.png`

**On fallback.**

- Key: `cat/gray/sleepy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A gray Cat: soft, smoky blue-gray fur with a paler chest. Sleepy, sharing a nap: curled up in a tight ball with its tail over its nose, fast asleep and snuggled toward the viewer's right, as if a nap partner lies just out of frame. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Calico Clingy Cat, content: `art/raw/cat/calico/clingy/content.png`

**On fallback.**

- Key: `cat/calico/clingy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A calico Cat: white fur with bold patches of orange and black. Clingy, content: sitting upright and eager, big round shining eyes and a small happy smile, as if hoping someone will sit beside it. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Calico Clingy Cat, reacting: `art/raw/cat/calico/clingy/reacting.png`

**On fallback.**

- Key: `cat/calico/clingy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A calico Cat: white fur with bold patches of orange and black. Clingy, delighted by company: leaning its whole body toward the viewer's right as if snuggling into a friend just out of frame, eyes closed in a happy smile. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Calico Aloof Cat, content: `art/raw/cat/calico/aloof/content.png`

**On fallback.**

- Key: `cat/calico/aloof/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A calico Cat: white fur with bold patches of orange and black. Aloof, content: sitting tall and composed on its own, tail wrapped neatly round its paws, half-lidded eyes glancing sideways, mouth a flat, unimpressed line. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Calico Aloof Cat, reacting: `art/raw/cat/calico/aloof/reacting.png`

**On fallback.**

- Key: `cat/calico/aloof/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A calico Cat: white fur with bold patches of orange and black. Aloof, offended by company: turned away toward the viewer's right with its nose in the air, eyes shut in disdain and ears flattened, as if someone has just sat down on its left. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Calico Sleepy Cat, content: `art/raw/cat/calico/sleepy/content.png`

**On fallback.**

- Key: `cat/calico/sleepy/content`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A calico Cat: white fur with bold patches of orange and black. Sleepy, content: loafed with its paws tucked under, eyes gently closed, dozing on its own. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Calico Sleepy Cat, reacting: `art/raw/cat/calico/sleepy/reacting.png`

**On fallback.**

- Key: `cat/calico/sleepy/reacting`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A calico Cat: white fur with bold patches of orange and black. Sleepy, sharing a nap: curled up in a tight ball with its tail over its nose, fast asleep and snuggled toward the viewer's right, as if a nap partner lies just out of frame. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

## 3. House Cats, Skadi, and Freya

- [ ] `art/raw/houseCat/oneBraincell/idle.png`
- [ ] `art/raw/houseCat/oneBraincell/triggered.png`
- [ ] `art/raw/houseCat/bigLoaf/idle.png`
- [ ] `art/raw/houseCat/bigLoaf/triggered.png`
- [ ] `art/raw/houseCat/doNotTouch/idle.png`
- [ ] `art/raw/houseCat/doNotTouch/triggered.png`
- [ ] `art/raw/houseCat/skadi/idle.png`
- [ ] `art/raw/houseCat/skadi/triggered.png`
- [ ] `art/raw/houseCat/copycat/idle.png`
- [ ] `art/raw/houseCat/copycat/triggered.png`
- [ ] `art/raw/houseCat/theVoid/idle.png`
- [ ] `art/raw/houseCat/theVoid/triggered.png`
- [ ] `art/raw/houseCat/freya/idle.png`
- [ ] `art/raw/houseCat/freya/triggered.png`
- [ ] `art/raw/houseCat/treatDealer/idle.png`
- [ ] `art/raw/houseCat/treatDealer/triggered.png`
- [ ] `art/raw/houseCat/boxGoblin/idle.png`
- [ ] `art/raw/houseCat/boxGoblin/triggered.png`
- [ ] `art/raw/houseCat/skadi/bellyUp.png`
- [ ] `art/raw/houseCat/freya/warming1.png`
- [ ] `art/raw/houseCat/freya/warming2.png`
- [ ] `art/raw/houseCat/freya/warming3.png`

### One Braincell, idle: `art/raw/houseCat/oneBraincell/idle.png`

**On fallback.**

- Key: `houseCat/oneBraincell/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called One Braincell: a lovably dim orange cat. On a shelf (don't draw the shelf), eyes pointing two different ways and a tongue left out, a single tiny pink braincell floating over its head with a faint glow. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### One Braincell, triggered: `art/raw/houseCat/oneBraincell/triggered.png`

**On fallback.**

- Key: `houseCat/oneBraincell/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called One Braincell: a lovably dim orange cat. On a shelf (don't draw the shelf), the braincell blazing bright and sparking, both eyes focused for once, paws raised as if it has just had an idea. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### The Big Loaf, idle: `art/raw/houseCat/bigLoaf/idle.png`

**On fallback.**

- Key: `houseCat/bigLoaf/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called The Big Loaf: an enormous, round gray-and-cream cat shaped just like a loaf of bread. On a shelf (don't draw the shelf), loafed with every paw tucked out of sight, fast asleep. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### The Big Loaf, triggered: `art/raw/houseCat/bigLoaf/triggered.png`

**On fallback.**

- Key: `houseCat/bigLoaf/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called The Big Loaf: an enormous, round gray-and-cream cat shaped just like a loaf of bread. On a shelf (don't draw the shelf), one eye open, stretching a single paw toward the viewer's right to gently nudge a sleepy Cat just out of frame. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Do Not Touch, idle: `art/raw/houseCat/doNotTouch/idle.png`

**On fallback.**

- Key: `houseCat/doNotTouch/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Do Not Touch: a grumpy, fluffy tortoiseshell cat beside a small round warning sign: a red circle, struck through. On a shelf (don't draw the shelf), sitting in a huff, narrowed eyes under cross brows, scowling. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Do Not Touch, triggered: `art/raw/houseCat/doNotTouch/triggered.png`

**On fallback.**

- Key: `houseCat/doNotTouch/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Do Not Touch: a grumpy, fluffy tortoiseshell cat beside a small round warning sign: a red circle, struck through. On a shelf (don't draw the shelf), puffed up to twice its size with its fur on end and back arched, hissing, the warning sign shaking. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Skadi (Belly Up), idle: `art/raw/houseCat/skadi/idle.png`

**On fallback.**

- Key: `houseCat/skadi/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/skadi/`

```text
A House Cat called Skadi (Belly Up): Skadi, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), lying on her side, relaxed and content, looking at the viewer. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Skadi (Belly Up), triggered: `art/raw/houseCat/skadi/triggered.png`

**On fallback.**

- Key: `houseCat/skadi/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/skadi/`

```text
A House Cat called Skadi (Belly Up): Skadi, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), starting to roll over: twisting onto her back with her paws lifting. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Copycat, idle: `art/raw/houseCat/copycat/idle.png`

**On fallback.**

- Key: `houseCat/copycat/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Copycat: a sly, slender cat with a pale, translucent, ghostly double of itself a step to its left. On a shelf (don't draw the shelf), watching with its head tilted, the double faint and still. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Copycat, triggered: `art/raw/houseCat/copycat/triggered.png`

**On fallback.**

- Key: `houseCat/copycat/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Copycat: a sly, slender cat with a pale, translucent, ghostly double of itself a step to its left. On a shelf (don't draw the shelf), the cat and its double striking exactly the same pose at the same moment, the double glowing brighter. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### The Void, idle: `art/raw/houseCat/theVoid/idle.png`

**On fallback.**

- Key: `houseCat/theVoid/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called The Void: hardly a cat at all: a cat-shaped patch of deep, starry darkness with two big round eyes. On a shelf (don't draw the shelf), sitting still, stars twinkling faintly inside it, eyes calm. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### The Void, triggered: `art/raw/houseCat/theVoid/triggered.png`

**On fallback.**

- Key: `houseCat/theVoid/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called The Void: hardly a cat at all: a cat-shaped patch of deep, starry darkness with two big round eyes. On a shelf (don't draw the shelf), its eyes glowing bright gold, the stars inside swirling, the darkness swelling a little larger. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Freya (Slow to Warm Up), idle: `art/raw/houseCat/freya/idle.png`

**On fallback.**

- Key: `houseCat/freya/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/freya/`

```text
A House Cat called Freya (Slow to Warm Up): Freya, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), reserved: sitting turned away, tail wrapped round, peeking shyly back over her shoulder. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Freya (Slow to Warm Up), triggered: `art/raw/houseCat/freya/triggered.png`

**On fallback.**

- Key: `houseCat/freya/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/freya/`

```text
A House Cat called Freya (Slow to Warm Up): Freya, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), a warm moment: turning toward the viewer, eyes softening, with a shy smile. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Treat Dealer, idle: `art/raw/houseCat/treatDealer/idle.png`

**On fallback.**

- Key: `houseCat/treatDealer/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Treat Dealer: a shady cat in a tan trench coat with its collar turned up. On a shelf (don't draw the shelf), leaning with heavy-lidded, knowing eyes, one fish-shaped treat peeking out from inside the coat. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Treat Dealer, triggered: `art/raw/houseCat/treatDealer/triggered.png`

**On fallback.**

- Key: `houseCat/treatDealer/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Treat Dealer: a shady cat in a tan trench coat with its collar turned up. On a shelf (don't draw the shelf), flinging its coat open to reveal rows of fish-shaped treats pinned inside, with a wink. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Box Goblin, idle: `art/raw/houseCat/boxGoblin/idle.png`

**On fallback.**

- Key: `houseCat/boxGoblin/idle`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Box Goblin: a mischievous cat that lives in a cardboard box with its flaps folded open. On a shelf (don't draw the shelf), peering out over the rim of its box, only its ears and big gleaming eyes showing. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Box Goblin, triggered: `art/raw/houseCat/boxGoblin/triggered.png`

**On fallback.**

- Key: `houseCat/boxGoblin/triggered`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`

```text
A House Cat called Box Goblin: a mischievous cat that lives in a cardboard box with its flaps folded open. On a shelf (don't draw the shelf), bursting out of its box with its paws up and a gremlin grin, bits of cardboard flying. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Skadi (Belly Up), belly up: `art/raw/houseCat/skadi/bellyUp.png`

**On fallback.**

- Key: `houseCat/skadi/bellyUp`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/skadi/`

```text
A House Cat called Skadi (Belly Up): Skadi, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), fully belly up, paws in the air and head upside down, her fluffy belly offered to all, adored. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Freya (Slow to Warm Up), warming up, stage 1 of 3: `art/raw/houseCat/freya/warming1.png`

**On fallback.**

- Key: `houseCat/freya/warming1`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/freya/`

```text
A House Cat called Freya (Slow to Warm Up): Freya, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), warming up, stage 1 of 3 from reserved to affectionate: still turned mostly away, but glancing back with softened eyes. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Freya (Slow to Warm Up), warming up, stage 2 of 3: `art/raw/houseCat/freya/warming2.png`

**On fallback.**

- Key: `houseCat/freya/warming2`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/freya/`

```text
A House Cat called Freya (Slow to Warm Up): Freya, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), warming up, stage 2 of 3 from reserved to affectionate: turned halfway toward the viewer, relaxed, tail loose, with a shy smile. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Freya (Slow to Warm Up), warming up, stage 3 of 3: `art/raw/houseCat/freya/warming3.png`

**On fallback.**

- Key: `houseCat/freya/warming3`
- Size: 512×512
- Anchor: (256, 448): the base the character sits on, centred, with 64 px beneath for a dangling tail
- Attach: `art/reference/style-sheet.png`, `art/reference/photos/freya/`

```text
A House Cat called Freya (Slow to Warm Up): Freya, one of the author's real cats. Draw her from the attached photos, keeping her markings, colours, and face recognisable while translating them into the style. On a shelf (don't draw the shelf), warming up, stage 3 of 3 from reserved to affectionate: fully affectionate: facing the viewer with her eyes closed happily, head tilted to rub against an unseen hand, tail up like a question mark. Square image with a transparent background and no floor or cast shadow. One character, full body, centred left to right and sitting on an invisible floor line seven-eighths of the way down, so the bottom eighth stays empty but for a tail that may dangle into it. The character is about three-quarters of the image wide, at the same scale as the hero Cat on the style reference sheet. No floating hearts, Zs, or anger marks: the game adds its own. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

## 4. The room, badges, UI furniture, and Gathering overlays

- [ ] `art/raw/badge/orange.png`
- [ ] `art/raw/badge/black.png`
- [ ] `art/raw/badge/white.png`
- [ ] `art/raw/badge/gray.png`
- [ ] `art/raw/badge/calico.png`
- [ ] `art/raw/room/wall.png`
- [ ] `art/raw/room/window.png`
- [ ] `art/raw/room/moon/1.png`
- [ ] `art/raw/room/moon/2.png`
- [ ] `art/raw/room/moon/3.png`
- [ ] `art/raw/room/moon/4.png`
- [ ] `art/raw/room/moon/5.png`
- [ ] `art/raw/room/moon/6.png`
- [ ] `art/raw/room/moon/7.png`
- [ ] `art/raw/room/moon/8.png`
- [ ] `art/raw/room/moon/9.png`
- [ ] `art/raw/room/couch.png`
- [ ] `art/raw/room/rug.png`
- [ ] `art/raw/room/shelf.png`
- [ ] `art/raw/room/treatJar.png`
- [ ] `art/raw/ui/playButton/ready.png`
- [ ] `art/raw/ui/redrawButton/ready.png`
- [ ] `art/raw/ui/pip/full.png`
- [ ] `art/raw/ui/playButton/disabled.png`
- [ ] `art/raw/ui/redrawButton/disabled.png`
- [ ] `art/raw/ui/pip/spent.png`
- [ ] `art/raw/gathering/cuddlePuddle/3.png`
- [ ] `art/raw/gathering/cuddlePuddle/4.png`
- [ ] `art/raw/gathering/cuddlePuddle/5.png`
- [ ] `art/raw/gathering/varietyPack/4.png`
- [ ] `art/raw/gathering/varietyPack/5.png`
- [ ] `art/raw/gathering/napClub.png`
- [ ] `art/raw/gathering/personalSpace.png`
- [ ] `art/raw/gathering/fullSofa.png`

### Orange Coat badge: `art/raw/badge/orange.png`

**On fallback.**

- Key: `badge/orange`
- Size: 128×128
- Anchor: (64, 64): centre
- Attach: `art/reference/style-sheet.png`

```text
A small round badge for a orange Cat: a ginger orange disc with a sun in bold contrast in the middle. The icon's shape must read in grayscale, for players who can't tell the colours apart. Transparent background. Front-on, with no perspective. It will be resized to exactly 128×128 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Black Coat badge: `art/raw/badge/black.png`

**On fallback.**

- Key: `badge/black`
- Size: 128×128
- Anchor: (64, 64): centre
- Attach: `art/reference/style-sheet.png`

```text
A small round badge for a black Cat: a black disc with a crescent moon in bold contrast in the middle. The icon's shape must read in grayscale, for players who can't tell the colours apart. Transparent background. Front-on, with no perspective. It will be resized to exactly 128×128 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### White Coat badge: `art/raw/badge/white.png`

**On fallback.**

- Key: `badge/white`
- Size: 128×128
- Anchor: (64, 64): centre
- Attach: `art/reference/style-sheet.png`

```text
A small round badge for a white Cat: a white disc with a snowflake in bold contrast in the middle. The icon's shape must read in grayscale, for players who can't tell the colours apart. Transparent background. Front-on, with no perspective. It will be resized to exactly 128×128 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Gray Coat badge: `art/raw/badge/gray.png`

**On fallback.**

- Key: `badge/gray`
- Size: 128×128
- Anchor: (64, 64): centre
- Attach: `art/reference/style-sheet.png`

```text
A small round badge for a gray Cat: a smoky gray disc with a diamond in bold contrast in the middle. The icon's shape must read in grayscale, for players who can't tell the colours apart. Transparent background. Front-on, with no perspective. It will be resized to exactly 128×128 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Calico Coat badge: `art/raw/badge/calico.png`

**On fallback.**

- Key: `badge/calico`
- Size: 128×128
- Anchor: (64, 64): centre
- Attach: `art/reference/style-sheet.png`

```text
A small round badge for a calico Cat: a orange, black, and white patchwork disc with a star in bold contrast in the middle. The icon's shape must read in grayscale, for players who can't tell the colours apart. Transparent background. Front-on, with no perspective. It will be resized to exactly 128×128 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Wall: `art/raw/room/wall.png`

**On fallback.**

- Key: `room/wall`
- Size: 1170×2532
- Anchor: (0, 0): top left
- Attach: `art/reference/style-sheet.png`

```text
The back wall and floor of a cozy living room at night, seen straight on: warm cream wallpaper with soft vertical stripes over the top 56%, and warm wooden floorboards below. Keep it simple and low in detail, since the window, shelf, sofa, and rug are separate images layered over it. It fills the whole image edge to edge, fully opaque, with no furniture. Front-on, with no perspective. It will be resized to exactly 1170×2532 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Window: `art/raw/room/window.png`

**On fallback.**

- Key: `room/window`
- Size: 516×240
- Anchor: (258, 120): centre
- Attach: `art/reference/style-sheet.png`

```text
A window with a cream-painted frame and a single vertical mullion, showing a deep blue night sky with a few small stars. No moon: that is a separate image. Transparent background. Front-on, with no perspective. It will be resized to exactly 516×240 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 1 of 9: `art/raw/room/moon/1.png`

**On fallback.**

- Key: `room/moon/1`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 1 of 9, waxing across the Run: a waxing moon about 11% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 2 of 9: `art/raw/room/moon/2.png`

**On fallback.**

- Key: `room/moon/2`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 2 of 9, waxing across the Run: a waxing moon about 22% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 3 of 9: `art/raw/room/moon/3.png`

**On fallback.**

- Key: `room/moon/3`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 3 of 9, waxing across the Run: a waxing moon about 33% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 4 of 9: `art/raw/room/moon/4.png`

**On fallback.**

- Key: `room/moon/4`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 4 of 9, waxing across the Run: a waxing moon about 44% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 5 of 9: `art/raw/room/moon/5.png`

**On fallback.**

- Key: `room/moon/5`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 5 of 9, waxing across the Run: a waxing moon about 56% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 6 of 9: `art/raw/room/moon/6.png`

**On fallback.**

- Key: `room/moon/6`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 6 of 9, waxing across the Run: a waxing moon about 67% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 7 of 9: `art/raw/room/moon/7.png`

**On fallback.**

- Key: `room/moon/7`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 7 of 9, waxing across the Run: a waxing moon about 78% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 8 of 9: `art/raw/room/moon/8.png`

**On fallback.**

- Key: `room/moon/8`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 8 of 9, waxing across the Run: a waxing moon about 89% lit, lit on its right side, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Moon, Night 9 of 9: `art/raw/room/moon/9.png`

**On fallback.**

- Key: `room/moon/9`
- Size: 96×96
- Anchor: (48, 48): centre
- Attach: `art/reference/style-sheet.png`

```text
The moon through the window on Night 9 of 9, waxing across the Run: a full moon, glowing softly. Transparent background. Front-on, with no perspective. It will be resized to exactly 96×96 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Couch: `art/raw/room/couch.png`

**On fallback.**

- Key: `room/couch`
- Size: 1170×498
- Anchor: (585, 498): bottom centre
- Attach: `art/reference/style-sheet.png`

```text
A plump sage-green sofa seen straight on, with five separate seat cushions evenly spaced across it, rounded arms at both ends, and short wooden legs. Keep the top edge of the backrest plain: the game lays a meter along it. Transparent background. Front-on, with no perspective. It will be resized to exactly 1170×498 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Rug: `art/raw/room/rug.png`

**On fallback.**

- Key: `room/rug`
- Size: 1050×735
- Anchor: (525, 368): centre
- Attach: `art/reference/style-sheet.png`

```text
A cozy, woven terracotta rug with a cream border, seen from slightly above, big enough for eight Cats lounging in two rows. Transparent background. Front-on, with no perspective. It will be resized to exactly 1050×735 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Shelf: `art/raw/room/shelf.png`

**On fallback.**

- Key: `room/shelf`
- Size: 1098×72
- Anchor: (549, 0): top centre
- Attach: `art/reference/style-sheet.png`

```text
A long, narrow wooden wall shelf seen straight on: a single plank with small brackets beneath. Transparent background. Front-on, with no perspective. It will be resized to exactly 1098×72 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Treat jar: `art/raw/room/treatJar.png`

**On fallback.**

- Key: `room/treatJar`
- Size: 132×156
- Anchor: (66, 156): bottom centre
- Attach: `art/reference/style-sheet.png`

```text
A glass jar full of fish-shaped orange cat treats, with a red lid and no label: the game writes the count beside it. Transparent background. Front-on, with no perspective. It will be resized to exactly 132×156 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Play button, ready: `art/raw/ui/playButton/ready.png`

**On fallback.**

- Key: `ui/playButton/ready`
- Size: 690×174
- Anchor: (345, 87): centre
- Attach: `art/reference/style-sheet.png`

```text
A large, chunky, tactile pill-shaped button like a plump cushion, in warm dark brown with a soft highlight, begging to be pressed. Leave its face blank: the game writes on it. Transparent background. Front-on, with no perspective. It will be resized to exactly 690×174 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Redraw button, ready: `art/raw/ui/redrawButton/ready.png`

**On fallback.**

- Key: `ui/redrawButton/ready`
- Size: 324×174
- Anchor: (162, 87): centre
- Attach: `art/reference/style-sheet.png`

```text
A small, chunky, tactile pill-shaped button like a plump cushion, in warm dark brown with a soft highlight, ready to press. Leave its face blank: the game writes on it. Transparent background. Front-on, with no perspective. It will be resized to exactly 324×174 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Pip, full: `art/raw/ui/pip/full.png`

**On fallback.**

- Key: `ui/pip/full`
- Size: 42×42
- Anchor: (21, 21): centre
- Attach: `art/reference/style-sheet.png`

```text
A small, round pip: a glowing golden bead, full and still to spend. Transparent background. Front-on, with no perspective. It will be resized to exactly 42×42 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Play button, disabled: `art/raw/ui/playButton/disabled.png`

**On fallback.**

- Key: `ui/playButton/disabled`
- Size: 690×174
- Anchor: (345, 87): centre
- Attach: `art/reference/style-sheet.png`

```text
A large pill-shaped cushion button pressed flat and faded to a dusty beige-brown, clearly not pressable. Leave its face blank: the game writes on it. Transparent background. Front-on, with no perspective. It will be resized to exactly 690×174 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Redraw button, disabled: `art/raw/ui/redrawButton/disabled.png`

**On fallback.**

- Key: `ui/redrawButton/disabled`
- Size: 324×174
- Anchor: (162, 87): centre
- Attach: `art/reference/style-sheet.png`

```text
A small pill-shaped cushion button pressed flat and faded to a dusty beige-brown, clearly not pressable. Leave its face blank: the game writes on it. Transparent background. Front-on, with no perspective. It will be resized to exactly 324×174 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Pip, spent: `art/raw/ui/pip/spent.png`

**On fallback.**

- Key: `ui/pip/spent`
- Size: 42×42
- Anchor: (21, 21): centre
- Attach: `art/reference/style-sheet.png`

```text
A small, round pip already spent: an empty, hollow ring. Transparent background. Front-on, with no perspective. It will be resized to exactly 42×42 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Cuddle Puddle, across 3 Seats: `art/raw/gathering/cuddlePuddle/3.png`

**On fallback.**

- Key: `gathering/cuddlePuddle/3`
- Size: 624×54
- Anchor: (312, 27): centre
- Attach: `art/reference/style-sheet.png`

```text
A long, thin strip of soft pink knitted blanket, draped across 3 Cats sitting side by side on a sofa: just the blanket. Transparent background. Front-on, with no perspective. It will be resized to exactly 624×54 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Cuddle Puddle, across 4 Seats: `art/raw/gathering/cuddlePuddle/4.png`

**On fallback.**

- Key: `gathering/cuddlePuddle/4`
- Size: 834×54
- Anchor: (417, 27): centre
- Attach: `art/reference/style-sheet.png`

```text
A long, thin strip of soft pink knitted blanket, draped across 4 Cats sitting side by side on a sofa: just the blanket. Transparent background. Front-on, with no perspective. It will be resized to exactly 834×54 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Cuddle Puddle, across 5 Seats: `art/raw/gathering/cuddlePuddle/5.png`

**On fallback.**

- Key: `gathering/cuddlePuddle/5`
- Size: 1044×54
- Anchor: (522, 27): centre
- Attach: `art/reference/style-sheet.png`

```text
A long, thin strip of soft pink knitted blanket, draped across 5 Cats sitting side by side on a sofa: just the blanket. Transparent background. Front-on, with no perspective. It will be resized to exactly 1044×54 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Variety Pack, across 4 Seats: `art/raw/gathering/varietyPack/4.png`

**On fallback.**

- Key: `gathering/varietyPack/4`
- Size: 810×42
- Anchor: (405, 0): top centre
- Attach: `art/reference/style-sheet.png`

```text
A string of bunting strung across 4 seats of a sofa, hanging from its top edge, with small triangle flags in turn orange, black, white, gray, and calico. Transparent background. Front-on, with no perspective. It will be resized to exactly 810×42 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Variety Pack, across 5 Seats: `art/raw/gathering/varietyPack/5.png`

**On fallback.**

- Key: `gathering/varietyPack/5`
- Size: 1020×42
- Anchor: (510, 0): top centre
- Attach: `art/reference/style-sheet.png`

```text
A string of bunting strung across 5 seats of a sofa, hanging from its top edge, with small triangle flags in turn orange, black, white, gray, and calico. Transparent background. Front-on, with no perspective. It will be resized to exactly 1020×42 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Nap Club: `art/raw/gathering/napClub.png`

**On fallback.**

- Key: `gathering/napClub`
- Size: 126×72
- Anchor: (63, 36): centre
- Attach: `art/reference/style-sheet.png`

```text
Two soft, puffy periwinkle Z shapes drifting up between two sleeping Cats, one small and one large. Transparent background. Front-on, with no perspective. It will be resized to exactly 126×72 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Personal Space: `art/raw/gathering/personalSpace.png`

**On fallback.**

- Key: `gathering/personalSpace`
- Size: 204×204
- Anchor: (102, 102): centre
- Attach: `art/reference/style-sheet.png`

```text
A round, translucent pale-blue bubble around one Cat: just the bubble, see-through in the middle. Transparent background. Front-on, with no perspective. It will be resized to exactly 204×204 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```

### Full Sofa: `art/raw/gathering/fullSofa.png`

**On fallback.**

- Key: `gathering/fullSofa`
- Size: 1170×498
- Anchor: (585, 249): centre
- Attach: `art/reference/style-sheet.png`

```text
A warm golden glow tracing the outline of a whole sofa, as a rounded rectangle of light, to lay over the sofa exactly. Transparent background. Front-on, with no perspective. It will be resized to exactly 1170×498 pixels, so compose for that shape. No words, signatures, or watermarks. Style: Cult of the Lamb-inspired cute 2D game art, with thick, bold dark-brown outlines, chunky rounded shapes, flat cel shading with one soft shadow tone, and a saturated, cute palette, for a cozy living room at night. Match the attached style reference sheet exactly: its outline weight, palette, shading, and proportions.
```
