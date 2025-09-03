import "./amplify";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";

(async () => {
  try {
    await fetchAuthSession();
    console.log("OAuth session fetched / sign-in completed if code present.");
  } catch (err) {
    console.error("fetchAuthSession error:", err);
  }
})();

// Enhanced auth event logging
Hub.listen("auth", (capsule) => {
  console.log("Auth event:", capsule);

  if (capsule.payload.event === "signInWithRedirect_failure") {
    console.error("Sign in redirect failed:", capsule.payload.data);

    // Common error details
    if (capsule.payload.data.error) {
      console.error("Error code:", capsule.payload.data.error);
      console.error(
        "Error description:",
        capsule.payload.data.error_description
      );
    }
  }

  if (capsule.payload.event === "signInWithRedirect") {
    console.log("Sign in redirect initiated successfully");
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
