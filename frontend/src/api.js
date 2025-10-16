// api.js
import {
  fetchAuthSession,
  getCurrentUser,
  signInWithRedirect,
} from "aws-amplify/auth";

async function getAccessToken(forceRefresh = false) {
  const { tokens } = await fetchAuthSession({ forceRefresh });
  return tokens?.accessToken?.toString() ?? null;
}

// Only redirect if truly signed out; otherwise try a one-time refresh.
async function ensureAccessToken() {
  let token = await getAccessToken(false);
  if (token) return token;

  // If a user is present, try refreshing instead of redirecting
  try {
    await getCurrentUser(); // throws if signed out
    token = await getAccessToken(true);
    if (token) return token;
  } catch {
    // not signed in
  }

  // Truly signed out → kick off Hosted UI once
  await signInWithRedirect({ provider: "Cognito" });
  throw new Error("Not authenticated");
}

async function request(path, { method = "GET", body, headers = {} } = {}) {
  // 1) get/refresh token
  let token = await ensureAccessToken();

  // 2) do the call
  let res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: body
      ? body instanceof FormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  // 3) if unauthorized, try exactly once with a forced refresh (no redirect)
  if (res.status === 401) {
    token = await getAccessToken(true);
    if (!token) throw new Error("Unauthorized");
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: body
        ? body instanceof FormData
          ? body
          : JSON.stringify(body)
        : undefined,
    });
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  // Some endpoints may return 204/empty
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function resolveApiBase() {
  // Vite (import.meta.env.*)
  const viteUrl =
    typeof import.meta !== "undefined" &&
    import.meta &&
    import.meta.env &&
    import.meta.env.VITE_API_URL;

  // CRA (process.env.REACT_APP_*)
  const craUrl =
    typeof process !== "undefined" && process.env?.REACT_APP_API_BASE_URL;

  // Final: vite > cra > default local
  return (viteUrl || craUrl || "http://localhost:3001") + "/api";
}

export const API_BASE = resolveApiBase();

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  del: (path) => request(path, { method: "DELETE" }),

  // Optional convenience for uploads (FormData)
  upload: (path, formData) => request(path, { method: "POST", body: formData }),
};
