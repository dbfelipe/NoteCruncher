// src/Landing.jsx
// src/Landing.jsx
import React, { useEffect, useState } from "react";
import { currentUser, signIn } from "./auth";
import { Link } from "react-router-dom";
import "./styles/landing.css";

export default function Landing() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    currentUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const SignedInPanel = ({ user }) => {
    const name =
      user?.attributes?.given_name ||
      user?.attributes?.email ||
      user?.username ||
      "there";
    return (
      <div
        className="nc-card"
        style={{ padding: 16, fontSize: 14, color: "var(--muted)" }}
      >
        Welcome back, <span style={{ color: "var(--text)" }}>{name}</span>. Pick
        up where you left off.
      </div>
    );
  };

  return (
    <section className="nc-landing" style={{ minHeight: "85vh" }}>
      <div className="nc-orb nc-orb--1" />
      <div className="nc-orb nc-orb--2" />
      <div className="nc-orb nc-orb--3" />
      <div className="nc-grid" aria-hidden="true" />
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "48px 24px",
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 32,
        }}
      >
        {/* Left: Hero copy */}
        <div style={{ display: "grid", alignContent: "center", gap: 18 }}>
          <div
            className="nc-card"
            style={{ padding: 14, width: "fit-content" }}
          >
            <span
              style={{
                fontSize: 12,
                letterSpacing: 0.6,
                color: "var(--muted)",
              }}
            >
              AI Lecture Summaries • Flashcards • Study Mode
            </span>
          </div>

          <h1
            className="nc-gradient-text"
            style={{ fontSize: 42, lineHeight: 1.1, margin: 0 }}
          >
            Turn long lectures into interactive flashcards — then study smarter.
          </h1>

          <p
            style={{
              color: "var(--muted)",
              margin: 0,
              maxWidth: 700,
              fontSize: 16,
            }}
          >
            NoteCrunch turns YouTube links and uploads into clear takeaways and
            ready-to-study flashcards. Your progress and sets live securely in
            your account.
          </p>

          <div
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}
          >
            {user ? (
              <>
                <Link to="/transcript" className="nc-btn nc-btn--primary">
                  Create from Transcript
                </Link>
                <Link to="/sets" className="nc-btn">
                  View My Sets
                </Link>
              </>
            ) : (
              <>
                <button className="nc-btn nc-btn--primary" onClick={signIn}>
                  Sign In to Get Started
                </button>
                <Link to="/manual" className="nc-btn">
                  Try Manual Flashcards
                </Link>
              </>
            )}
          </div>

          {/* Small “stat” chips */}
          <div
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}
          >
            <div className="nc-card" style={{ padding: "10px 12px" }}>
              No staging — straight to studying
            </div>
            <div className="nc-card" style={{ padding: "10px 12px" }}>
              Secure auth via Cognito
            </div>
            <div className="nc-card" style={{ padding: "10px 12px" }}>
              Dark theme by default
            </div>
          </div>

          {user && <SignedInPanel user={user} />}
        </div>

        {/* Right: Preview card */}
        <div style={{ display: "grid", alignContent: "center" }}>
          <div className="nc-card" style={{ padding: 18 }}>
            <div
              style={{
                borderRadius: 16,
                border: "1px solid var(--border)",
                background: `linear-gradient(180deg, color-mix(in oklab, var(--surface-2) 80%, transparent), var(--surface))`,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#ff5f56",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#ffbd2e",
                  }}
                />
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: "#27c93f",
                  }}
                />
              </div>

              <div
                className="nc-card"
                style={{ padding: 14, marginBottom: 12 }}
              >
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Summary
                </div>
                <div style={{ fontSize: 14, color: "var(--text)" }}>
                  • Key idea 1: Memoryless property of exp. • Key idea 2:
                  Derivation of λ from data. • Key idea 3: Real-world queue
                  example.
                </div>
              </div>

              <div className="nc-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>
                  Flashcards (sample)
                </div>
                <ul
                  style={{
                    margin: "6px 0 0 16px",
                    color: "var(--text)",
                    fontSize: 14,
                  }}
                >
                  <li>What is the MLE of λ for exponential?</li>
                  <li>State the memoryless property.</li>
                  <li>When is Poisson a good model?</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
