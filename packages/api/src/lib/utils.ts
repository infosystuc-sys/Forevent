export const dayjs = require('dayjs-with-plugins');

// Resend free-tier only allows sending from this address until the domain is verified
export const NOREPLY_EMAIL = "onboarding@resend.dev"

export const HOST_URL = process.env.AUTH_URL ?? "http://localhost:3000"