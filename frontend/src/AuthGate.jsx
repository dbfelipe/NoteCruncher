// src/AuthGate.jsx
import React from "react";
import {
  Authenticator,
  ThemeProvider,
  createTheme,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import "./amplify";

const theme = createTheme({
  name: "notecrunch",
  tokens: {
    colors: { brand: { primary: { 10: "#0ea5e9", 80: "#0284c7" } } },
    fonts: {
      default: { variable: { fontFamily: "Inter, system-ui, sans-serif" } },
    },
    radii: { medium: "16px" },
  },
});

export default function AuthGate({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <Authenticator
        components={{
          Header() {
            return (
              <div style={{ padding: 16 }}>
                <h2 style={{ margin: 0 }}>NoteCrunch</h2>
                <p style={{ margin: 0, opacity: 0.7 }}>Sign in to continue</p>
              </div>
            );
          },
        }}
        // Optional: make "Email" the label for username
        formFields={{ signIn: { username: { label: "Email" } } }}
      >
        {/* IMPORTANT: when signed in, just render children with NO wrapper */}
        {() => children}
      </Authenticator>
    </ThemeProvider>
  );
}
