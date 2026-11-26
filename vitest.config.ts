import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// `@/ → src/` alias matching `tsconfig.json` (paths), so imports of the game
// modules (including `@/data/worlds.json`) also resolve under Vitest.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
