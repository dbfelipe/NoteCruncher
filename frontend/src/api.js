// src/api.js
import {
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
} from "aws-amplify/auth";

// ---------- Resolve API base once ----------
function isLocalhost() {
  if (typeof window === "undefined") return false;
  const { hostname } = window.location;
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]"
  );
}

function resolveApiBase() {
  // Read Vite env at build time (preferred)
  const viteBase =
    (typeof import.meta !== "undefined" && import.meta?.env?.VITE_API_URL) ||
    "https://notecrunch-backend.onrender.com"; // <- prod default

  // Optional CRA compatibility (if you still ever build with CRA)
  const craBase =
    typeof process !== "undefined" && process?.env?.REACT_APP_API_BASE_URL;

  const chosen = viteBase || craBase || "";

  // In production, require an explicit base (no silent localhost)
  if (!chosen && !isLocalhost()) {
    throw new Error(
      "API base missing. Set VITE_API_URL in Vercel (Production) and redeploy."
    );
  }

  // In dev, allow fallback to your local backend
  const base = (chosen || "http://localhost:3001").replace(/\/+$/, "");
  return `${base}/api`;
}

export const API_BASE = `${base}/api`;
// Optional: log once so you can confirm in console on Vercel builds
if (typeof window !== "undefined") {
  console.log("[api] Using API_BASE:", API_BASE);
}

// ---------- Auth helpers ----------
async function getAccessToken(forceRefresh = false) {
  const { tokens } = await fetchAuthSession({ forceRefresh });
  return tokens?.accessToken?.toString() ?? null;
}

async function ensureAccessToken() {
  let token = await getAccessToken(false);
  if (token) return token;

  try {
    // If a user exists, try a forced refresh before redirecting
    await getCurrentUser();
    token = await getAccessToken(true);
    if (token) return token;
  } catch {
    // user not signed in
  }

  // Kick off Hosted UI; control returns after redirect
  await signInWithRedirect({ provider: "Cognito" });
  throw new Error("Not authenticated");
}

// ---------- Core request ----------
async function request(path, { method = "GET", body, headers = {} } = {}) {
  let token = await ensureAccessToken();

  const doFetch = async (bearer) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${bearer}`,
        ...headers,
      },
      body: body
        ? body instanceof FormData
          ? body
          : JSON.stringify(body)
        : undefined,
    });

  let res = await doFetch(token);

  // One retry on 401 with forced refresh
  if (res.status === 401) {
    token = await getAccessToken(true);
    if (!token) throw new Error("Unauthorized");
    res = await doFetch(token);
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}${errText ? `: ${errText}` : ""}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ---------- Public API ----------
export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),

  upload: (path, formData) => request(path, { method: "POST", body: formData }),
};
