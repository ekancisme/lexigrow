// Global test setup — runs before any test module is imported.
// auth.middleware.js fails fast when JWT_SECRET is missing, so seed a test-only value here.
process.env.JWT_SECRET ||= 'vitest-test-only-jwt-secret'
process.env.NODE_ENV ||= 'test'