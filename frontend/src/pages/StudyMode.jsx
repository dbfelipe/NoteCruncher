// src/pages/StudyMode.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudyMode() {
  const { id } = useParams();
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
        const rows = (await api.get(`/sets/${id}/flashcards`)) || [];
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
    const seen = Math.min(cursor + 1, order.length);
    const denom = order.length + againQueue.length || 1;
    return Math.round((seen / denom) * 100);
  }, [cursor, order.length, againQueue.length, cards.length]);

  const nextCard = useCallback(() => {
    setShowAnswer(false);
    if (cursor < order.length - 1) {
      setCursor((c) => c + 1);
    } else if (againQueue.length > 0) {
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
    const base = cards.map((_, i) => i);
    const newOrder = !shuffleOn ? shuffle(base) : base;
    setOrder(newOrder);
    setCursor(0);
    setShowAnswer(false);
    setAgainQueue([]);
  };

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
      <div
        className="min-h-screen px-4 py-6"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold">Study Mode</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-3 py-1 rounded-md"
            style={{ background: "var(--cream)", color: "var(--ink)" }}
          >
            ← Back
          </button>
        </div>
        <div
          className="rounded-xl border p-6 max-w-4xl mx-auto"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p style={{ color: "var(--muted)" }}>No cards in this set yet.</p>
          <Link
            to={`/sets/${id}`}
            className="inline-block mt-3 px-3 py-1 rounded-md"
            style={{ background: "var(--accent-strong)", color: "#fff" }}
          >
            Go to set
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-4 py-6"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="flex items-center justify-between mb-6 max-w-4xl mx-auto">
        <div>
          <h2 className="text-xl font-semibold">Study Mode</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Set #{id} • {cards.length} cards
          </p>
        </div>
        <Link
          to={`/sets/${id}`}
          className="text-sm px-3 py-1 rounded-md"
          style={{ background: "var(--cream)", color: "var(--ink)" }}
        >
          ← Back to set
        </Link>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2 max-w-4xl mx-auto">
        <button
          onClick={toggleShuffle}
          className="px-3 py-1.5 text-sm rounded-lg border"
          style={{
            background: shuffleOn ? "var(--cream)" : "var(--surface)",
            borderColor: "var(--border)",
            color: shuffleOn ? "var(--ink)" : "var(--text)",
          }}
        >
          {shuffleOn ? "Shuffled" : "In order"}
        </button>
        <button
          onClick={restart}
          className="px-3 py-1.5 text-sm rounded-lg border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          Restart
        </button>
        <div className="ml-auto text-sm" style={{ color: "var(--muted)" }}>
          Known: {known.size}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full rounded overflow-hidden mb-4 max-w-4xl mx-auto"
        style={{ background: "var(--surface-2)" }}
      >
        <div
          className="h-full"
          style={{ width: `${progress}%`, background: "var(--accent-strong)" }}
        />
      </div>
      <div
        className="text-xs mb-3 max-w-4xl mx-auto"
        style={{ color: "var(--muted)" }}
      >
        {progress}% complete
      </div>

      {/* Card */}
      <div className="relative select-none max-w-4xl mx-auto">
        <div className="[perspective:1000px] w-full">
          <div
            className="relative h-[260px] sm:h-[300px] w-full transition-transform duration-500 [transform-style:preserve-3d] rounded-2xl border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              transform: showAnswer ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 [backface-visibility:hidden]">
              <div
                className="uppercase tracking-wide text-[10px] mb-2"
                style={{ color: "var(--muted)" }}
              >
                Question
              </div>
              <div
                className="text-lg md:text-xl font-medium whitespace-pre-wrap"
                style={{ color: "var(--text)" }}
              >
                {currentCard?.question}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div
                className="uppercase tracking-wide text-[10px] mb-2"
                style={{ color: "var(--muted)" }}
              >
                Answer
              </div>
              <div
                className="text-lg md:text-xl font-medium whitespace-pre-wrap"
                style={{ color: "var(--text)" }}
              >
                {currentCard?.answer}
              </div>
            </div>
          </div>
        </div>
        <div
          className="flex justify-center mt-3 text-xs"
          style={{ color: "var(--muted)" }}
        >
          Press{" "}
          <span className="mx-1 font-mono border px-1 rounded">Space</span> to
          flip
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 grid grid-cols-3 gap-2 max-w-4xl mx-auto">
        <button
          onClick={prevCard}
          className="px-4 py-2 rounded-lg border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          Prev
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>
            J / ←
          </div>
        </button>
        <button
          onClick={flip}
          className="px-4 py-2 rounded-lg border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          Flip
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>
            Space
          </div>
        </button>
        <button
          onClick={nextCard}
          className="px-4 py-2 rounded-lg border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        >
          Next
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>
            L / →
          </div>
        </button>
      </div>

      {/* Grading */}
      <div className="mt-3 grid grid-cols-2 gap-2 max-w-4xl mx-auto">
        <button
          onClick={markAgain}
          className="px-4 py-2 rounded-lg border"
          style={{
            borderColor: "#b42318",
            color: "#b42318",
            background: "var(--surface)",
          }}
        >
          Again
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>
            A
          </div>
        </button>
        <button
          onClick={markKnown}
          className="px-4 py-2 rounded-lg border"
          style={{
            borderColor: "#15803d",
            color: "#15803d",
            background: "var(--surface)",
          }}
        >
          Got it
          <div className="text-[10px]" style={{ color: "var(--muted)" }}>
            G
          </div>
        </button>
      </div>

      {/* Session footer */}
      <div
        className="mt-6 text-xs flex items-center justify-between max-w-4xl mx-auto"
        style={{ color: "var(--muted)" }}
      >
        <div>Flips: {flips}</div>
        <div>Time: {Math.floor((Date.now() - startedAt) / 1000)}s</div>
      </div>
    </div>
  );
}
