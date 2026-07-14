import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Dummy secrets so env.ts reports password auth configured (non-production).
    env: {
      ADMIN_PASSWORD: "test-password-1234",
      SESSION_SECRET: "test-session-secret-abcdefghijklmnop",
    },
  },
});
