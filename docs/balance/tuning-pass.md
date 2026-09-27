# Tuning pass

The late-game balance pass's tuning (#72, part 4 of #66), measured with `pnpm sim`. The sim player arranges every Couch perfectly but shops simply. The coherent strategies are orange + sleepy engine, antisocial household, and growing void. No purchases is a baseline, not a build. This pass follows [the baseline](baseline.md), which was measured before #69–#71.

## What changed

| Setting | Before | After |
|---|---|---|
| Cuddle Puddle per level | +10 Purr, +2 Mult | +10 Purr, +1 Mult |
| Nap Club per level | +10 Purr, +2 Mult | +10 Purr, +1 Mult |
| Personal Space per level | +10 Purr, +2 Mult | +5 Purr, +1 Mult |
| Variety Pack per level | +10 Purr, +2 Mult | unchanged |
| Full Sofa per level | +5 Purr, +1 Mult | unchanged |
| Clearing a Night | 3 on Nights 1–2, 4 later, 6 for a Disaster | 2 on Nights 1–5, 5 later, 3 for a Disaster |
| Treats per unused Play | 1 | unchanged |
| Night 1's Target | 300 | 480 |
| Target growth per Night | ×1.6 | ×1.5 |
| The Void's growth per Play | +5 base Purr | +8 base Purr |
| Disaster Target factor | ×1.0 | unchanged |

Targets are now 480, 720, 1,080, 1,620, 2,430, 3,645, 5,468, 8,201, and 12,302. They were 300, 480, 768, 1,229, 1,966, 3,146, 5,033, 8,053, and 12,885.

## Why

With Scrapbook pages at their first-draft strength, the game became far too easy. The best strategies won 84–90% of Runs, and every build cleared Night 6 at 91–100%. The levers were adjusted in the agreed order.

1. **Page strength.** Weaker pages brought the win rates down, but Night 6 stayed at 96–100% for every coherent build, while Night 9 turned into a cliff. Pages add linearly per level, so they can't lower Night 6 without making Night 9 harder too. Per-Clowder strength also balances the builds against each other:
   - Personal Space levels made the antisocial household dominant, so they're now the weakest (+5 Purr, +1 Mult).
   - Cuddle Puddle and Nap Club form together in the orange + sleepy engine, doubling each page, so they lost a Mult.
   - Variety Pack's +2 Mult is what carries the growing void's five-Cat Couches, so it stays.
2. **Treat rewards.** Fewer Treats before Night 6 mean fewer House Cats there, about 2 instead of 3–4, and more after it fill the Shelf for the last Nights. This moves difficulty into Night 6 and away from Nights 7–9. The Disaster reward drops to 3 because its Night 3 payout was buying House Cats early. At 5 or 6, the best coherent build won 39–41% of Runs.
3. **Target growth.** Even with pages and Treats tuned, a ×1.6 curve left Night 6 at 82–96% while Night 9 was lost more often than not. Growth drops to ×1.5, and Night 1's Target rises to 480 so that Night 6's Target stays about where it was (3,645, from 3,146). Night 9's Target (12,302) barely moves. The curve is now steeper early and flatter late, so Nights 3–6 ramp up instead of Night 6 being a wall. This changes Night 1's Target, which the agreed levers didn't list. Changing growth alone would only make Night 6 easier.

**The Void** grows more (+8, up from +5) because its build was hit hardest by fewer early Treats: it Recruits The Void later and has fewer Plays to grow its Black Cats. The spec tunes this amount with the simulation to keep its build within reach at Night 6.

## Against the targets

`pnpm sim --runs 100`, after:

| Strategy | Win rate | Night 6 | Night 9 |
|---|---|---|---|
| orange + sleepy engine | 25% | 84% | 44% |
| antisocial household | 21% | 67% | 50% |
| growing void | 16% | 72% | 36% |
| greedy any House Cat | 24% | 84% | 36% |
| no purchases | 0% | 54% | 0% |

- **The best coherent strategy wins 15–25% of Runs: met.** The orange + sleepy engine wins 25%, and every coherent build wins 16–25%.
- **Each Disaster Night clears 70–80% for coherent strategies: not met, though Night 6 is close.** Night 6 clears 67–84%, around the band rather than inside it. The rule of each Disaster matters more than the Target, as the Night 6 spread below shows.
  - **Night 3** clears 99–100%. Three Nights in, a household has no House Cats and a Scrapbook page or two. A Night 3 hard enough to lose would be a wall for a new player, so it stays a gentle first Disaster.
  - **Night 9** clears 36–50%. It's the final Night, and a Disaster, so its rule lands on the biggest Target. Making it easier would push wins above 25% unless Nights 6–8 got harder, which would break the Night 6 band or add a cliff mid-Run. Across candidates, Night 9 stayed at about 35–60% whenever wins were in band.
- **No Night is a cliff: partly met.** Nights 1–5 clear at 96–100%, Night 6 at 67–84%, Night 7 at 78–92%, and Night 8 at 72–87%. Two drops remain:
  - Night 9 falls to 36–50%, for the reason above.
  - The antisocial household drops from 96% on Night 5 to 67% on Night 6, mostly on The Human Wakes Up.
- **Every build within about 10 percentage points at Night 6: not met, 17 points (67–84%).** The growing void is 12 points behind the best build (72% against 84%), just outside the Void's own target in #66. The gap comes from how each Disaster's rule meets a build, not from Targets:
  - The antisocial household clears The Human Wakes Up only 43% of the time, because Freya warms up over Plays and that Disaster removes one.
  - The growing void clears The Vacuum only 44% of the time, because its Couches want five Cats and The Vacuum allows four.
  - Every build clears The Doorbell at 81–97%.

  Stronger Personal Space pages lift the antisocial household on Night 6. In every candidate tried, they also made it the best build by far late on, winning 32–52% of Runs.

### Follow-ups

- **The Doorbell is notably easier** than the other Disasters: 81–97% on Night 6. The spec's remedy is a harsher rule, not a higher Target.
- **The Human Wakes Up is the hardest Disaster** on Night 9: 7–41%. A softer rule would lift Night 9 without touching the curve.

## Before

`pnpm sim --runs 100` at the values before this pass (after #69–#71), set by config overrides. It took 469s.

```sh
pnpm sim --runs 100 --houseCats.voidGrowth 5 --firstTarget 300 --targetGrowth 1.6 \
  --clearReward '{"early":3,"earlyNights":2,"later":4,"disaster":6,"perUnusedPlay":1}' \
  --clowderLevelBonus.cuddlePuddle '{"purr":10,"mult":2}' \
  --clowderLevelBonus.napClub '{"purr":10,"mult":2}' \
  --clowderLevelBonus.personalSpace '{"purr":10,"mult":2}' \
  --clowderLevelBonus.varietyPack '{"purr":10,"mult":2}' \
  --clowderLevelBonus.fullSofa '{"purr":5,"mult":1}'
```

```
Targets: 300, 480, 768, 1229, 1966, 3146, 5033, 8053, 12885

no purchases (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:100% 4:100% 5:100% 6:76% 7:96% 8:41% 9:0%
  lost on Night: 1:0 2:0 3:0 4:0 5:0 6:24 7:3 8:43 9:30
  win rate: 0% (0/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 100% (31/31), The Human Wakes Up 86% (32/37), The Vacuum 41% (13/32)
  Night 9 clear rate by Disaster: The Doorbell 0% (0/17), The Human Wakes Up 0% (0/8), The Vacuum 0% (0/5)
  avg House Cats on Night 6: 0.0
  avg Clowder levels at Run end: Cuddle Puddle 1.2, Nap Club 2.1, Personal Space 1.0, Variety Pack 3.8, Full Sofa 3.7

greedy any House Cat (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:100% 4:100% 5:100% 6:97% 7:100% 8:91% 9:40%
  lost on Night: 1:0 2:0 3:0 4:0 5:0 6:3 7:0 8:9 9:53
  win rate: 35% (35/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 100% (31/31), The Human Wakes Up 100% (37/37), The Vacuum 91% (29/32)
  Night 9 clear rate by Disaster: The Doorbell 53% (16/30), The Human Wakes Up 24% (7/29), The Vacuum 41% (12/29)
  avg House Cats on Night 6: 4.0
  avg Clowder levels at Run end: Cuddle Puddle 1.2, Nap Club 2.4, Personal Space 1.1, Variety Pack 4.1, Full Sofa 4.0

orange + sleepy engine (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:100% 4:100% 5:100% 6:100% 7:100% 8:100% 9:84%
  lost on Night: 1:0 2:0 3:0 4:0 5:0 6:0 7:0 8:0 9:16
  win rate: 84% (84/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 100% (31/31), The Human Wakes Up 100% (37/37), The Vacuum 100% (32/32)
  Night 9 clear rate by Disaster: The Doorbell 100% (33/33), The Human Wakes Up 74% (26/35), The Vacuum 78% (25/32)
  avg House Cats on Night 6: 3.3
  avg Clowder levels at Run end: Cuddle Puddle 4.6, Nap Club 4.5, Personal Space 1.0, Variety Pack 1.2, Full Sofa 1.7

antisocial household (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:100% 4:100% 5:100% 6:99% 7:100% 8:99% 9:92%
  lost on Night: 1:0 2:0 3:0 4:0 5:0 6:1 7:0 8:1 9:8
  win rate: 90% (90/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 100% (31/31), The Human Wakes Up 97% (36/37), The Vacuum 100% (32/32)
  Night 9 clear rate by Disaster: The Doorbell 97% (32/33), The Human Wakes Up 83% (29/35), The Vacuum 97% (29/30)
  avg House Cats on Night 6: 3.0
  avg Clowder levels at Run end: Cuddle Puddle 1.1, Nap Club 1.6, Personal Space 5.8, Variety Pack 2.4, Full Sofa 2.1

growing void (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:100% 4:100% 5:100% 6:91% 7:98% 8:78% 9:49%
  lost on Night: 1:0 2:0 3:0 4:0 5:0 6:9 7:2 8:20 9:35
  win rate: 34% (34/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 100% (31/31), The Human Wakes Up 86% (32/37), The Vacuum 88% (28/32)
  Night 9 clear rate by Disaster: The Doorbell 72% (18/25), The Human Wakes Up 17% (4/24), The Vacuum 60% (12/20)
  avg House Cats on Night 6: 2.9
  avg Clowder levels at Run end: Cuddle Puddle 1.2, Nap Club 2.4, Personal Space 1.0, Variety Pack 4.2, Full Sofa 3.7
```

## After

`pnpm sim --runs 100` at the new `defaultConfig`. It took 513s.

```
Targets: 480, 720, 1080, 1620, 2430, 3645, 5468, 8201, 12302

no purchases (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:98% 4:100% 5:100% 6:54% 7:77% 8:37% 9:0%
  lost on Night: 1:0 2:0 3:2 4:0 5:0 6:45 7:12 8:26 9:15
  win rate: 0% (0/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 94% (34/36)
  Night 6 clear rate by Disaster: The Doorbell 87% (27/31), The Human Wakes Up 51% (18/35), The Vacuum 25% (8/32)
  Night 9 clear rate by Disaster: The Doorbell 0% (0/9), The Human Wakes Up 0% (0/5), The Vacuum 0% (0/1)
  avg House Cats on Night 6: 0.0
  avg Clowder levels at Run end: Cuddle Puddle 1.2, Nap Club 2.0, Personal Space 1.0, Variety Pack 3.4, Full Sofa 3.5

greedy any House Cat (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:99% 4:100% 5:100% 6:84% 7:92% 8:87% 9:36%
  lost on Night: 1:0 2:0 3:1 4:0 5:0 6:16 7:7 8:10 9:42
  win rate: 24% (24/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 97% (35/36)
  Night 6 clear rate by Disaster: The Doorbell 97% (30/31), The Human Wakes Up 81% (29/36), The Vacuum 75% (24/32)
  Night 9 clear rate by Disaster: The Doorbell 52% (12/23), The Human Wakes Up 27% (6/22), The Vacuum 29% (6/21)
  avg House Cats on Night 6: 2.5
  avg Clowder levels at Run end: Cuddle Puddle 1.3, Nap Club 2.2, Personal Space 1.0, Variety Pack 3.6, Full Sofa 4.1

orange + sleepy engine (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:100% 4:99% 5:100% 6:84% 7:92% 8:75% 9:44%
  lost on Night: 1:0 2:0 3:0 4:1 5:0 6:16 7:7 8:19 9:32
  win rate: 25% (25/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 94% (29/31), The Human Wakes Up 86% (32/37), The Vacuum 71% (22/31)
  Night 9 clear rate by Disaster: The Doorbell 33% (6/18), The Human Wakes Up 41% (7/17), The Vacuum 55% (12/22)
  avg House Cats on Night 6: 2.0
  avg Clowder levels at Run end: Cuddle Puddle 4.3, Nap Club 4.2, Personal Space 1.0, Variety Pack 1.1, Full Sofa 1.6

antisocial household (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:99% 4:100% 5:96% 6:67% 7:78% 8:84% 9:50%
  lost on Night: 1:0 2:0 3:1 4:0 5:4 6:31 7:14 8:8 9:21
  win rate: 21% (21/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 97% (35/36)
  Night 6 clear rate by Disaster: The Doorbell 81% (25/31), The Human Wakes Up 43% (15/35), The Vacuum 83% (24/29)
  Night 9 clear rate by Disaster: The Doorbell 69% (11/16), The Human Wakes Up 7% (1/14), The Vacuum 75% (9/12)
  avg House Cats on Night 6: 1.8
  avg Clowder levels at Run end: Cuddle Puddle 1.0, Nap Club 1.5, Personal Space 4.6, Variety Pack 2.2, Full Sofa 2.1

growing void (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:99% 4:100% 5:100% 6:72% 7:86% 8:72% 9:36%
  lost on Night: 1:0 2:0 3:1 4:0 5:0 6:28 7:10 8:17 9:28
  win rate: 16% (16/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 97% (35/36)
  Night 6 clear rate by Disaster: The Doorbell 97% (30/31), The Human Wakes Up 75% (27/36), The Vacuum 44% (14/32)
  Night 9 clear rate by Disaster: The Doorbell 41% (7/17), The Human Wakes Up 13% (2/15), The Vacuum 58% (7/12)
  avg House Cats on Night 6: 1.9
  avg Clowder levels at Run end: Cuddle Puddle 1.2, Nap Club 2.1, Personal Space 1.0, Variety Pack 3.7, Full Sofa 3.7
```
