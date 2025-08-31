# Study Mode — Technical Design & Explainer

This document explains how the Quizlet-style Study Mode works in the app: data flow, algorithms, UI/UX, and test scenarios. It’s written to be easy to defend in a code review or interview.

---

## High-Level Overview

The goal of Study Mode is to present one flashcard at a time, show the Question first, flip to the Answer, and provide navigation (Next/Prev) plus grading (Got it / Again). The original `cards` array remains immutable during a session. Traversal is controlled by an `order` array of indices and a `cursor` pointer. Missed cards are re-surfaced via an `againQueue` (FIFO).

---

## Data Model (Runtime State)

- **cards**: `Array<{ id, question, answer }>` — fetched from `GET /api/sets/:id/flashcards`.
- **order**: `number[]` — indices defining the study sequence (e.g., `[3,0,2,1]`).
- **cursor**: `number` — current position within `order`.
- **currentIndex**: derived: `order[cursor]`.
- **currentCard**: derived: `cards[currentIndex]`.
- **showAnswer**: `boolean` — false = Q, true = A.
- **shuffleOn**: `boolean` — whether session order is randomized.
- **againQueue**: `number[]` — FIFO for “Again” cards.
- **known**: `Set<number>` — IDs of cards marked Got it.
- **flips**, **startedAt**: analytics counters.

**Why indices, not card objects?**

- Shuffling and reordering is simpler/cheaper with small integers.
- Avoids mutating the `cards` array.
- Prevents object identity issues during edits.

---

## Algorithms & Complexity

1. **Shuffle (Fisher–Yates)**

   - Input: `[0..n-1]`.
   - Swaps random indices from end to start.
   - Complexity: `O(n)` time, `O(1)` extra space.

2. **Traversal (Array + Cursor)**

   - `currentIndex = order[cursor]`.
   - Move `cursor++` or `cursor--`.
   - Complexity: `O(1)` per move.

3. **Again Queue**

   - On “Again”: enqueue `currentIndex`.
   - At end of `order`: append `againQueue`, clear queue.
   - Complexity: `O(1)` enqueue; `O(k)` append.

4. **Got It**

   - Add `id` to `known`.
   - No requeue; card exits until restart.

5. **Progress**
   - `seen = min(cursor+1, order.length)`.
   - Denominator = `order.length + againQueue.length`.
   - Progress % = `(seen / denominator) * 100`.

---

## UI & Interaction

### Flip Animation

- CSS 3D transform with perspective.
- Container uses `perspective`; inner uses `rotateY(180deg)`.
- Front (Q) and Back (A) stacked with `backface-visibility: hidden`.

### Controls & Shortcuts

- **Buttons**: Prev, Flip, Next, Again, Got it.
- **Keyboard**:
  - Space → Flip
  - J/← → Prev
  - L/→ → Next
  - A → Again
  - G → Got it

Inputs/textarea are ignored to prevent hijacking typing.

### Session Toggles

- **Shuffle**: rebuilds order, resets cursor and queues.
- **Restart**: clears known + againQueue, rebuilds order.

---

## Control Flow

1. **Mount / Set Change** → fetch cards, build order.
2. **Render Question** → Flip to show Answer.
3. **Grade**:
   - Got it → add to known, go Next.
   - Again → enqueue, go Next.
4. **End of Deck**: if againQueue nonempty, append and continue.
5. **Session Finish**: cursor at last + againQueue empty → Done (100%).

---

## Edge Cases & Decisions

- **Empty set** → Show friendly “No cards” message + link back.
- **Single card** → Flip works; Again cycles it endlessly until Got it.
- **Edits mid-session** → Ignored until refresh.
- **Queue policy** → FIFO chosen (fairness).
- **Known tracking** → Informational only, doesn’t alter traversal.

---

## API Contracts

- `GET /api/sets/:id/flashcards` → `[{ id, question, answer }]` (ordered by `created_at DESC`).
- Create/update/delete endpoints exist but Study Mode only reads.

---

## Manual Test Scenarios

- **Empty Set**: Show “No cards”, progress 0%.
- **Single Card**: Again cycles, Got it exits.
- **Basic Flow (3 cards)**: Got it → Again → Next → missed resurfaces.
- **Prev/Next Boundaries**: No underflow or overflow.
- **Shuffle Toggle**: Rebuilds order, clears queues.
- **Restart**: Clears known + againQueue, new order.
- **Keyboard**: Matches buttons; ignores typing fields.
- **Performance**: 500 cards remain smooth.

---

## Possible Enhancements

- Type-to-Answer (auto-grade with fuzzy match).
- Leitner Boxes / SM-2 spaced repetition.
- Known-only / Unknown-only filters.
- Session persistence (localStorage/DB).
- Audio & image support.

---

## FAQ

- **Q:** Stack or queue?  
  **A:** Traversal = array+cursor. Misses = FIFO queue.
- **Q:** Why indices, not objects?  
  **A:** Cheaper, immutable, avoids object issues.
- **Q:** Is progress accurate?  
  **A:** Yes, includes pending Again cards.

---

## Open Questions

- Should Again items loop until Got it, or only once per pass?
- On Shuffle, should current card remain first or restart?
- Should we enforce strict mode (no grading before Flip)?

---

**Owner:** `Frontend — StudyMode.jsx`  
**Status:** Implemented and stable, ready for enhancements.
