import { existsSync } from "node:fs"
import { defineConfig } from "@playwright/test"

const systemChromium =
  process.env.PLAYWRIGHT_BROWSER_PATH ??
  (process.platform === "linux"
    ? [
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome"
      ].find(existsSync)
    : undefined)

export default defineConfig({
  testDir: "tests",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5174",
    ...(systemChromium
      ? { launchOptions: { executablePath: systemChromium } }
      : { channel: "msedge" }),
    viewport: { width: 390, height: 844 }
  },
  reporter: "list",
  webServer: {
    // The debug hook the tests drive exists only in development builds.
    command: `"${process.execPath}" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5174 --strictPort`,
    url: "http://127.0.0.1:5174",
    reuseExistingServer: true
  }
})
