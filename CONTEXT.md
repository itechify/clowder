# Clowder

A cozy cat-collecting roguelike: the player arranges Cats on a Couch to form scoring Gatherings, and builds a household of House Cats that changes how scoring works across a Run.

## Run structure

**Run**:
One household, played from the first Night until the player misses a Target or clears the final Night.
_Avoid_: Game, campaign

**Night**:
One scored stage of a Run, with a single Target the player must reach within their Plays.
_Avoid_: Round, blind, level

**Target**:
The total Score, summed across a Night's Plays, needed to clear that Night.
_Avoid_: Goal, threshold

**Disaster**:
A Night that changes a rule for that Night only; revealed before the preceding Shop.
_Avoid_: Boss, boss blind

**Treats**:
The currency earned and spent within a Run.
_Avoid_: Gold, money, coins

## Cats and the household

**Cat**:
An individual, named cat in the Roster with a Coat, a Personality, and a base Purr; the thing that is drawn and played.
_Avoid_: Card, ordinary cat

**Roster**:
Every Cat the player owns in the current Run.
_Avoid_: Deck, collection

**Coat**:
A Cat's matching category: Orange, Black, White, Gray, or Calico.
_Avoid_: Color, suit

**Personality**:
A Cat's seating preference, which grants bonus Purr depending on its Neighbors: Clingy, Aloof, or Sleepy.
_Avoid_: Trait, temperament

**Kind**:
The pairing of a Coat and a Personality, such as Orange Clingy; there are fifteen.
_Avoid_: Type, breed, combination

**House Cat**:
A named character that sits on the Shelf for the rest of the Run and modifies scoring; never drawn or played.
_Avoid_: Joker, relic, modifier

**Shelf**:
The ordered row of equipped House Cats above the Couch.
_Avoid_: Joker slots

## Playing a Night

**Draw pile**:
The Roster, shuffled at the start of each Night; Cats that are played or redrawn do not return to it that Night.
_Avoid_: Deck

**Hand**:
The Cats drawn and not yet played, including any Cats placed on the Couch before a Play is committed.

**Couch**:
The play area: a single row of five Seats.
_Avoid_: Board, field

**Seat**:
One of the five positions on the Couch; may be empty.
_Avoid_: Slot, cushion

**Neighbor**:
A Cat in the occupied Seat directly to the left or right of another Cat. An empty Seat between two Cats means they are not Neighbors; the Couch does not wrap.
_Avoid_: Adjacent cat

**Play**:
Committing the Cats currently on the Couch to be scored. (The button may read "Get Comfy"; the rule is always "Play".)
_Avoid_: Hand, turn

**Redraw**:
Swapping up to three Cats from the Hand for new ones from the Draw pile.
_Avoid_: Discard, draw, mulligan

## Scoring

**Purr**:
The additive half of a Score, contributed by Cats as they score.
_Avoid_: Points, chips

**Mult**:
The multiplier half of a Score, starting at 1 and raised by Gatherings and House Cats.
_Avoid_: Multiplier bonus, xMult

**Score**:
The result of one Play: total Purr × Mult.

**Gathering**:
A named Couch arrangement (e.g. Cuddle Puddle, Nap Club) that adds Mult once per Play when present.
_Avoid_: Hand, combo, set

**Scoring event**:
One Cat adding its base Purr plus its Personality bonus, and triggering every "when a Cat scores" effect.
_Avoid_: Trigger, activation

**Repeat**:
An additional, complete Scoring event for a Cat. Repeats from different sources stack; a Repeat never causes another Repeat.
_Avoid_: Retrigger

## Shop

**Shop**:
The visit between Nights where Treats are spent, held in the living room by day.
_Avoid_: Day, Morning, store

**Adopt**:
Add a Cat to the Roster from the Shop.
_Avoid_: Buy

**Rehome**:
Permanently remove a Cat from the Roster, or a House Cat from the Shelf.
_Avoid_: Sell, destroy, delete

**Recruit**:
Add a House Cat to the Shelf from the Shop.
_Avoid_: Buy, equip

## End of a Run

**Results**:
How the household did, shown in the living room once every Cat has fallen asleep at the end of a Run.
_Avoid_: Game over, summary

**Best Play**:
The single highest-scoring Play of the Run, remembered as its Couch looked then.
_Avoid_: High score, top Play

**Star Cat**:
The Cat still in the Roster that has contributed the most Purr across the Run.
_Avoid_: MVP, best Cat
