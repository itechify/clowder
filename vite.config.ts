import { defineConfig } from "vite"
import { configDefaults } from "vitest/config"

export default defineConfig({
  build: { chunkSizeWarningLimit: 2000 },
  test: {
    exclude: [...configDefaults.exclude, "./.claude/**"]
  }
})
