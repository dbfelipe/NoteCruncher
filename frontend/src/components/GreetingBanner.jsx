// src/components/GreetingBanner.jsx
import React from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";

export default function GreetingBanner() {
  const { user } = useAuthenticator((c) => [c.user]);
  if (!user) return null;
  const name =
    user?.attributes?.given_name ||
    user?.attributes?.email ||
    user?.username ||
    "there";
  return (
    <div
      style={{
        padding: "8px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        background: "var(--bg, #fafafa)",
      }}
    >
      <span>Welcome, {name}.</span>
    </div>
  );
}
