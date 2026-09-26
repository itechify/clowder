# Balance baseline

`pnpm sim --runs 100` at `defaultConfig` before the late-game balance pass (#66), for later tuning to compare against. It took 433s.

```
Targets: 300, 480, 1152, 1229, 1966, 4719, 5033, 8053, 19328

no purchases (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:94% 4:100% 5:49% 6:0% 7:- 8:- 9:-
  lost on Night: 1:0 2:0 3:6 4:0 5:48 6:46 7:0 8:0 9:0
  win rate: 0% (0/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 86% (24/28), The Vacuum 94% (34/36)
  Night 6 clear rate by Disaster: The Doorbell 0% (0/15), The Human Wakes Up 0% (0/19), The Vacuum 0% (0/12)
  Night 9 clear rate by Disaster: -
  avg House Cats on Night 6: 0.0

greedy any House Cat (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:98% 4:100% 5:100% 6:46% 7:87% 8:18% 9:0%
  lost on Night: 1:0 2:0 3:2 4:0 5:0 6:53 7:6 8:32 9:7
  win rate: 0% (0/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 93% (26/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 69% (20/29), The Human Wakes Up 22% (8/37), The Vacuum 53% (17/32)
  Night 9 clear rate by Disaster: The Doorbell 0% (0/2), The Human Wakes Up 0% (0/4), The Vacuum 0% (0/1)
  avg House Cats on Night 6: 3.9

orange + sleepy engine (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:99% 4:100% 5:99% 6:38% 7:97% 8:50% 9:0%
  lost on Night: 1:0 2:0 3:1 4:0 5:1 6:61 7:1 8:18 9:18
  win rate: 0% (0/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 100% (28/28), The Vacuum 97% (35/36)
  Night 6 clear rate by Disaster: The Doorbell 43% (13/30), The Human Wakes Up 36% (13/36), The Vacuum 34% (11/32)
  Night 9 clear rate by Disaster: The Doorbell 0% (0/8), The Human Wakes Up 0% (0/3), The Vacuum 0% (0/7)
  avg House Cats on Night 6: 3.0

antisocial household (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:95% 4:100% 5:96% 6:41% 7:92% 8:71% 9:0%
  lost on Night: 1:0 2:0 3:5 4:0 5:4 6:54 7:3 8:10 9:24
  win rate: 0% (0/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 82% (23/28), The Vacuum 100% (36/36)
  Night 6 clear rate by Disaster: The Doorbell 63% (17/27), The Human Wakes Up 6% (2/35), The Vacuum 62% (18/29)
  Night 9 clear rate by Disaster: The Doorbell 0% (0/4), The Human Wakes Up 0% (0/15), The Vacuum 0% (0/5)
  avg House Cats on Night 6: 2.8

growing void (100 Runs)
  clear rate per Night reached: 1:100% 2:100% 3:97% 4:100% 5:71% 6:6% 7:75% 8:0% 9:-
  lost on Night: 1:0 2:0 3:3 4:0 5:28 6:65 7:1 8:3 9:0
  win rate: 0% (0/100)
  Night 3 clear rate by Disaster: The Doorbell 100% (36/36), The Human Wakes Up 96% (27/28), The Vacuum 94% (34/36)
  Night 6 clear rate by Disaster: The Doorbell 0% (0/22), The Human Wakes Up 0% (0/22), The Vacuum 16% (4/25)
  Night 9 clear rate by Disaster: -
  avg House Cats on Night 6: 2.7
```
