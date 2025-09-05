import { fetchAuthSession } from "aws-amplify/auth";

const API_BASE = "http://localhost:3001/api"; // your Express server

async function getAccessToken() {
  const { tokens } = await fetchAuthSession();
  return tokens?.accessToken?.toString() ?? null;
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not signed in");

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) =>
    request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};
