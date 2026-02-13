import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN

Sentry.init({
  dsn,
  tracesSampleRate: 0.1,
  debug: false,
  environment: process.env.NODE_ENV,
  enabled: !!dsn,
})
