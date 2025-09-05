import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { completeAuth } from "../auth";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    console.log("[Callback] component mounted. href =", window.location.href);

    async function finishLogin() {
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.has("code");
      console.log("[Callback] hasCode =", hasCode);

      if (!hasCode) {
        console.log("[Callback] no code in URL → navigating /transcript");
        navigate("/transcript", { replace: true });
        return;
      }

      try {
        console.log("[Callback] calling completeAuth()");
        await completeAuth();
        console.log("[Callback] completeAuth() finished successfully");
      } catch (e) {
        console.error("[Callback] completeAuth() threw:", e);
      }

      if (cancelled) {
        console.log("[Callback] cancelled before navigation");
        return;
      }

      // Clean the URL query string
      url.search = "";
      window.history.replaceState({}, "", url.toString());
      console.log("[Callback] cleaned URL, now navigating to /transcript");

      navigate("/transcript", { replace: true });
    }

    finishLogin();

    return () => {
      cancelled = true;
      console.log("[Callback] component unmounted, cancelled =", cancelled);
    };
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-[var(--bg)]">
      <div className="text-center">
        <div className="text-lg font-medium text-[var(--text)]">
          Signing you in…
        </div>
        <div className="mt-2 text-sm text-[var(--muted)]">
          Please wait while we complete your login.
        </div>
      </div>
    </div>
  );
}
