"use client"

import { useEffect } from "react"

/**
 * Catches errors in the root layout. Must define its own <html> and <body>
 * because it replaces the root layout when triggered.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Global Error]", error?.message || error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F5F1E8", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, maxWidth: 400, textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.1)", border: "1px solid rgba(218,165,32,0.2)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#654321", marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ color: "rgba(139,69,19,0.8)", fontSize: 14, marginBottom: 24 }}>
            {error?.message || "An unexpected error occurred. Please try again."}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{ padding: "10px 20px", borderRadius: 8, border: "2px solid #DAA520", background: "transparent", color: "#654321", fontWeight: 600, cursor: "pointer" }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{ padding: "10px 20px", borderRadius: 8, background: "#DAA520", color: "white", fontWeight: 600, textDecoration: "none" }}
            >
              Go to Homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
