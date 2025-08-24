// src/pages/StudyMode.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Fisher–Yates shuffle
function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudyMode() {
  const { id } = useParams(); // set id from route
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [order, setOrder] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffleOn, setShuffleOn] = useState(true);
  const [known, setKnown] = useState(new Set());
  const [againQueue, setAgainQueue] = useState([]);

  const [startedAt] = useState(Date.now());
  const [flips, setFlips] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `http://localhost:3001/api/sets/${id}/flashcards`
        );
        const rows = res.data || [];
        setCards(rows);
        const initial = rows.map((_, idx) => idx);
        setOrder(shuffleOn ? shuffle(initial) : initial);
      } catch (e) {
        console.error(e);
        setError("Failed to load flashcards.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const currentIndex = useMemo(() => {
    if (order.length === 0) return null;
    return order[cursor] ?? null;
  }, [order, cursor]);

  const currentCard = currentIndex !== null ? cards[currentIndex] : null;

  const progress = useMemo(() => {
    if (!cards.length) return 0;
    // progress based on distinct seen positions + items still in againQueue
    const seen = Math.min(cursor + 1, order.length);
    const denom = order.length + againQueue.length || 1;
    return Math.round((seen / denom) * 100);
  }, [cursor, order.length, againQueue.length, cards.length]);

  const nextCard = useCallback(() => {
    setShowAnswer(false);
    if (cursor < order.length - 1) {
      setCursor((c) => c + 1);
    } else if (againQueue.length > 0) {
      // end reached: append againQueue and continue
      setOrder((prev) => [...prev, ...againQueue]);
      setAgainQueue([]);
      setCursor((c) => c + 1);
    }
  }, [cursor, order.length, againQueue.length]);

  const prevCard = useCallback(() => {
    setShowAnswer(false);
    setCursor((c) => Math.max(0, c - 1));
  }, []);

  const markKnown = useCallback(() => {
    if (!currentCard) return;
    setKnown((prev) => new Set(prev).add(currentCard.id));
    nextCard();
  }, [currentCard, nextCard]);

  const markAgain = useCallback(() => {
    if (!currentCard) return;
    // re-queue this card to the end (simple spaced repetition)
    setAgainQueue((q) => [...q, currentIndex]);
    nextCard();
  }, [currentCard, currentIndex, nextCard]);

  const flip = useCallback(() => {
    setShowAnswer((s) => !s);
    setFlips((f) => f + 1);
  }, []);

  const restart = () => {
    setKnown(new Set());
    setAgainQueue([]);
    setCursor(0);
    setShowAnswer(false);
    const base = cards.map((_, i) => i);
    setOrder(shuffleOn ? shuffle(base) : base);
  };

  const toggleShuffle = () => {
    setShuffleOn((s) => !s);
    // rebuild the order; reset position
    const base = cards.map((_, i) => i);
    const newOrder = !shuffleOn ? shuffle(base) : base; // state hasn't toggled yet
    setOrder(newOrder);
    setCursor(0);
    setShowAnswer(false);
    setAgainQueue([]);
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (
        e.target &&
        (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        flip();
      }
      if (e.key.toLowerCase() === "j" || e.key === "ArrowLeft") prevCard();
      if (e.key.toLowerCase() === "l" || e.key === "ArrowRight") nextCard();
      if (e.key.toLowerCase() === "g") markKnown();
      if (e.key.toLowerCase() === "a") markAgain();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flip, prevCard, nextCard, markKnown, markAgain]);

  if (loading) return <div className="p-6">Loading study mode…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  if (!cards.length) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Study Mode</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:underline"
          >
            ← Back
          </button>
        </div>
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <p className="text-gray-700">No cards in this set yet.</p>
          <Link
            to={`/sets/${id}`}
            className="inline-block mt-3 text-blue-600 hover:underline"
          >
            Go to set
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xl font-semibold">Study Mode</h2>
          <p className="text-sm text-gray-500">
            Set #{id} • {cards.length} cards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/sets/${id}`}
            className="text-blue-600 text-sm hover:underline"
          >
            ← Back to set
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={toggleShuffle}
          className={`px-3 py-1.5 text-sm rounded border ${
            shuffleOn ? "bg-gray-100" : "bg-white"
          } hover:bg-gray-50`}
        >
          {shuffleOn ? "Shuffled" : "In order"}
        </button>
        <button
          onClick={restart}
          className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50"
        >
          Restart
        </button>
        <div className="ml-auto text-sm text-gray-500">Known: {known.size}</div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full bg-gray-200 rounded overflow-hidden mb-4">
        <div className="h-full bg-blue-600" style={{ width: `${progress}%` }} />
      </div>
      <div className="text-xs text-gray-500 mb-3">{progress}% complete</div>

      {/* Card (flip animation) */}
      <div className="relative select-none">
        <div className="[perspective:1000px] w-full">
          <div
            className={`relative h-[260px] sm:h-[300px] w-full transition-transform duration-500 [transform-style:preserve-3d] border rounded-2xl bg-white shadow-md`}
            style={{
              transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front = Question */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 [backface-visibility:hidden]">
              <div className="uppercase tracking-wide text-[10px] text-gray-500 mb-2">
                Question
              </div>
              <div className="text-lg md:text-xl font-medium whitespace-pre-wrap">
                {currentCard?.question}
              </div>
            </div>
            {/* Back = Answer */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="uppercase tracking-wide text-[10px] text-gray-500 mb-2">
                Answer
              </div>
              <div className="text-lg md:text-xl font-medium whitespace-pre-wrap">
                {currentCard?.answer}
              </div>
            </div>
          </div>
        </div>

        {/* Flip hint */}
        <div className="flex justify-center mt-3 text-xs text-gray-500">
          Press{" "}
          <span className="mx-1 font-mono border px-1 rounded">Space</span> to
          flip
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        <button
          onClick={prevCard}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Prev
          <div className="text-[10px] text-gray-500">J / ←</div>
        </button>
        <button
          onClick={flip}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Flip
          <div className="text-[10px] text-gray-500">Space</div>
        </button>
        <button
          onClick={nextCard}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Next
          <div className="text-[10px] text-gray-500">L / →</div>
        </button>
      </div>

      {/* Grading */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={markAgain}
          className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
        >
          Again
          <div className="text-[10px] text-gray-500">A</div>
        </button>
        <button
          onClick={markKnown}
          className="px-4 py-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50"
        >
          Got it
          <div className="text-[10px] text-gray-500">G</div>
        </button>
      </div>

      {/* Session footer */}
      <div className="mt-6 text-xs text-gray-500 flex items-center justify-between">
        <div>Flips: {flips}</div>
        <div>Time: {Math.floor((Date.now() - startedAt) / 1000)}s</div>
      </div>
    </div>
  );
}
