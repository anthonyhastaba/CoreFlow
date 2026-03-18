import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

async function init() {
  let publishableKey: string;

  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error(`/api/config responded with ${res.status}`);
    const data = await res.json();
    if (!data.clerkPublishableKey) throw new Error("clerkPublishableKey missing from /api/config response");
    publishableKey = data.clerkPublishableKey;
  } catch (err) {
    console.error("[init] Failed to load config:", err);
    document.getElementById("root")!.innerHTML = `
      <div style="min-height:100vh;background:#0a0a0f;display:flex;align-items:center;justify-content:center;font-family:sans-serif;color:#ef4444;padding:2rem;text-align:center;">
        <div>
          <p style="font-size:1rem;margin:0">Failed to load app configuration. Please try refreshing.</p>
        </div>
      </div>
    `;
    return;
  }

  createRoot(document.getElementById("root")!).render(
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  );
}

// Show a dark screen while config loads
document.getElementById("root")!.innerHTML = `
  <div style="min-height:100vh;background:#0a0a0f;"></div>
`;

init();
