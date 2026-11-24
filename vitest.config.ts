import { defineConfig } from 'vitest/config';

// Tests run in Node against an in-memory Postgres (PGlite), which takes a few seconds to start.
export default defineConfig({ test: { include: ['tests/**/*.test.ts'], environment: 'node', testTimeout: 30_000 } });
