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

const viteCli = `"${process.execPath}" node_modules/vite/bin/vite.js`

/** The production build, served as it is deployed (see tests/pwa.spec.ts). */
export const PRODUCTION_URL = "http://127.0.0.1:4174"

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
  webServer: [
    {
      // The debug hook the tests drive exists only in development builds.
      command: `${viteCli} --host 127.0.0.1 --port 5174 --strictPort`,
      url: "http://127.0.0.1:5174",
      reuseExistingServer: true
    },
    {
      // The service worker exists only in production builds.
      command: `${viteCli} build && ${viteCli} preview --host 127.0.0.1 --port 4174 --strictPort`,
      url: PRODUCTION_URL,
      // Always test a fresh build, never a stale preview.
      reuseExistingServer: false,
      timeout: 120_000
    }
  ]
})
