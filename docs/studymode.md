Study Mode — Technical Design & Explainer

This document explains how the Quizlet‑style Study Mode works in the app: data flow, algorithms, UI/UX, and test scenarios. It’s written to be easy to defend in a code review or interview.

High‑Level Overview

Goal: Present one flashcard at a time, show the Question first, flip to Answer, and provide Next/Prev navigation plus Got it / Again grading.

Key idea: Keep the original cards array immutable during a session. The study traversal is controlled by an order array of indices and a cursor pointer into that array.

Missed cards: A lightweight “spaced repeat” is implemented via an againQueue (FIFO queue) that re‑surfaces missed cards after the first pass.

Data Model (Runtime State)

cards: Array<{ id, question, answer }> — fetched from GET /api/sets/:id/flashcards.

order: number[] — array of indices into cards defining current study sequence (e.g., [3,0,2,1]).

cursor: number — points to the current position within order.

currentIndex: number | null — derived: order[cursor].

currentCard: Flashcard | null — derived: cards[currentIndex].

showAnswer: boolean — false = show Q, true = show A.

shuffleOn: boolean — whether session order is randomized.

againQueue: number[] — queue of indices for “Again” cards (FIFO).

known: Set<number> — IDs of cards marked “Got it.”

flips: number, startedAt: number — simple session analytics.

Why indices instead of card objects?

Shuffling and reordering is cheaper and simpler with small integers.

Avoids mutating the cards array; edits elsewhere won’t scramble the session.

Algorithms & Complexity

1. Fisher–Yates Shuffle (Uniform Random Permutation)

Input: initial = [0, 1, …, n-1].

Process: For i = n-1 → 1, swap i with random j ∈ [0, i].

Complexity: O(n) time, O(1) extra space (O(n) if copying).

Why: Guarantees each permutation is equally likely.

2. Array + Cursor Traversal

Current item: currentIndex = order[cursor] ⇒ currentCard = cards[currentIndex].

Next: cursor++ (bounded by order.length - 1).

Prev: cursor-- (bounded by 0).

Complexity: O(1) per move; simple and predictable.

3. "Again" Queue (FIFO)

On Again: push currentIndex into againQueue.

At end of order: append againQueue to order and clear againQueue.

Effect: Missed cards reappear in the order they were missed.

Complexity: O(1) per enqueue; O(k) to append k misses once per pass.

4. "Got it" Handling

Add currentCard.id to known and advance. No requeue.

Effect: Card exits the review cycle unless the user restarts.

5. Progress Computation

seen = min(cursor + 1, order.length).

Denominator: order.length + againQueue.length (accounts for items still queued to review).

Progress %: round((seen / denominator) \* 100).

Reasoning: Users see honest progress that includes pending “Again” cards.

UI & Interaction Model
Flip Animation

Technique: 3D transform with perspective.

Container uses CSS perspective; inner card uses transform-style: preserve-3d and rotates with rotateY(180deg) when showAnswer is true.

Front (Question) and Back (Answer) faces are absolutely stacked with backface-visibility: hidden; the Back is pre‑rotated by rotateY(180deg).

Controls & Shortcuts

Buttons: Prev, Flip, Next, Again, Got it.

Keyboard: Space → Flip; J/← → Prev; L/→ → Next; A → Again; G → Got it.

Inputs/textarea are ignored by the hotkeys to avoid hijacking typing.

Session Toggles

Shuffle: rebuilds order (shuffled or in‑order), resets cursor and queues.

Restart: clears known/againQueue, resets cursor, rebuilds order.

Control Flow (Lifecycle)

Mount / set change: fetch cards, build order (shuffled or not).

Render Question → Flip: toggle showAnswer.

Grade:

Got it: add id to known, go Next.

Again: push index to againQueue, go Next.

End of deck: if againQueue has items, append them to order and continue.

Session finish: when cursor reaches the final item and againQueue is empty, you’re done (100%).

Edge Cases & Decisions

Empty set: Show friendly message + link back.

Edits mid‑session: By design, the session is stable after load; refresh to pick up changes.

Known tracking: purely informational; does not change traversal beyond skipping requeue.

Queue policy: FIFO (fairness). LIFO (stack) is intentionally not used because it over‑weights newest misses.

API Contracts (assumed)

GET /api/sets/:id/flashcards → [{ id, question, answer, ... }] ordered by created_at DESC (frontend reorders for studying).

Create/update/delete endpoints exist but Study Mode only reads.

Manual Test Scenarios (Additive)

Empty Set: Expect “No cards” UI and link back. Progress 0%.

Single Card: Flip works; Again should cycle it endlessly until Got it.

Basic Flow (3 cards):

Start with Q1 → Flip → Got it → Q2 → Again → Q3 → end → Q2 resurfaces.

Progress shows pending “Again”.

Prev/Next Boundaries: At first card, Prev doesn’t go below 0; at last, Next stops unless againQueue extends deck.

Shuffle Toggle: Rebuilds order; cursor resets; againQueue cleared.

Restart: Clears known and againQueue, rebuilds from current shuffle setting.

Keyboard: Space/J/L/A/G match buttons; typing in inputs doesn’t trigger shortcuts.

Performance: With 500 cards, navigation stays snappy; flip anim remains smooth.

Possible Enhancements

Type‑to‑Answer Mode: Hide answer until the user types; auto‑grade with fuzzy match (Levenshtein) and send wrong answers to againQueue.

Leitner Boxes / SM‑2: Replace simple queue with spaced‑repetition scheduling.

Known‑only / Unknown‑only filters: Drill subsets.

Session Persistence: Save progress and queues per set in localStorage or DB.

Audio & Images: Extend cards to support media (TTS for Q/A, image front/back).

FAQ (How to Explain Quickly)

Q: Is this a stack or a queue? A: The main traversal is array + cursor. Missed items use a queue (FIFO) so they reappear in the order you missed them.

Q: Why store indices instead of card objects in order? A: It keeps cards immutable, makes reshuffling/appending cheap, and avoids object identity issues.

Q: How accurate is the progress bar? A: It counts both the items you’ve seen and items still in the againQueue, so it doesn’t jump from 90% to 100% while misses still remain.

Open Questions (confirm expected behavior)

Should Again items loop until marked Got it, or only once per session pass?

On Shuffle, should we preserve the current card at the front, or always restart from the first?

Do we want a strict mode (no grading buttons until after Flip)?

Owner: Frontend — StudyMode.jsx

Status: Implemented and stable; ready for iterative enhancement.
