import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Register PWA service worker only in production, unregister in development
if ("serviceWorker" in navigator) {
  if (process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(reg => console.log("NAFC SW registered:", reg.scope))
        .catch(err => console.log("SW error:", err));
    });
  } else {
    // Unregister any active service workers and clear cache on localhost
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
    if ("caches" in window) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
  }
}
