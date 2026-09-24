import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { extname, join } from "node:path"
import { expect, type Page, test } from "@playwright/test"
import { PRODUCTION_URL } from "../playwright.config"

test.use({ baseURL: PRODUCTION_URL })

type ManifestIcon = { src: string; sizes: string; purpose?: string }

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json"
}

/**
 * Serves the production build from dist/ as a deploy would, and lets a test
 * "deploy" a new version: the same service worker with different bytes.
 * (Playwright's routing cannot intercept a service worker's own script.)
 */
async function serveBuild() {
  let version = ""
  const server = createServer(async (request, response) => {
    const path = new URL(request.url!, "http://localhost").pathname
    const file = join("dist", path === "/" ? "index.html" : path)
    try {
      const body = await readFile(file)
      response.writeHead(200, {
        "content-type": CONTENT_TYPES[extname(file)] ?? "text/plain"
      })
      response.end(path === "/sw.js" ? `${body}\n// ${version}\n` : body)
    } catch {
      response.writeHead(404).end()
    }
  })
  await new Promise<void>((listening) =>
    server.listen(4175, "127.0.0.1", listening)
  )
  return {
    url: "http://127.0.0.1:4175/",
    deploy: (next: string) => {
      version = next
    },
    close: () => server.close()
  }
}

/** Waits until the service worker has precached the app and controls the page. */
async function visitUntilPrecached(page: Page, url = "/") {
  await page.goto(url)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
}

test("installs as a portrait, standalone app", async ({ page, request }) => {
  await page.goto("/")
  const href = await page.locator('link[rel="manifest"]').getAttribute("href")
  const manifest = await (await request.get(href!)).json()

  expect(manifest).toMatchObject({
    name: "Clowder",
    display: "standalone",
    orientation: "portrait",
    start_url: "/"
  })
  const icons: ManifestIcon[] = manifest.icons
  expect(icons.map((icon) => icon.sizes)).toEqual(
    expect.arrayContaining(["192x192", "512x512"])
  )
  expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true)
  for (const icon of icons) {
    const response = await request.get(icon.src)
    expect(response.ok()).toBe(true)
    expect(response.headers()["content-type"]).toBe("image/png")
  }
})

test("loads offline after the first visit", async ({ page, context }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await visitUntilPrecached(page)

  await context.setOffline(true)
  await page.reload()

  await expect(page.locator("#game canvas")).toBeVisible()
  const probe = await page.evaluate(() =>
    fetch("/not-precached.json").then(
      () => "online",
      () => "offline"
    )
  )
  expect(probe).toBe("offline")
  expect(errors).toEqual([])
})

test("offers to install where the browser supports it", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("#game canvas")).toBeVisible()
  const install = page.getByRole("button", { name: "Install" })
  await expect(install).toHaveCount(0)

  // Only some browsers fire beforeinstallprompt; stand in for one that does.
  const prompted = page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        let choose: (choice: { outcome: string }) => void = () => {}
        const event = Object.assign(
          new Event("beforeinstallprompt", { cancelable: true }),
          {
            userChoice: new Promise((done) => {
              choose = done
            }),
            prompt: async () => {
              choose({ outcome: "accepted" })
              resolve(true)
            }
          }
        )
        window.dispatchEvent(event)
      })
  )
  await install.click()

  expect(await prompted).toBe(true)
  await expect(install).toHaveCount(0)
})

test("offers an update when a new version is deployed", async ({ page }) => {
  const server = await serveBuild()
  try {
    await visitUntilPrecached(page, server.url)
    const update = page.getByRole("button", { name: "Update" })
    await expect(update).toHaveCount(0)

    server.deploy("a new version")
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update()
    })
    await expect(update).toBeVisible()

    const reloaded = page.waitForEvent("load")
    await update.click()
    await reloaded
    await expect(page.locator("#game canvas")).toBeVisible()
    await expect(update).toHaveCount(0)
  } finally {
    server.close()
  }
})
