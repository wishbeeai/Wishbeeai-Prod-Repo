/**
 * Optional Sentry — no-ops if @sentry/nextjs is not installed.
 */

let Sentry: typeof import("@sentry/nextjs") | null = null
try {
  Sentry = require("@sentry/nextjs")
} catch {
  // @sentry/nextjs not installed
}

export { Sentry }
