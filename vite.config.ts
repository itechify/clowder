import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"
import { configDefaults } from "vitest/config"
import { artAtlas } from "./scripts/artPlugin.ts"

export default defineConfig({
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    artAtlas(),
    VitePWA({
      // The shell asks before a new version takes over (src/shell/pwa.ts).
      registerType: "prompt",
      injectRegister: false,
      // globPatterns already picks up the icons and the manifest.
      includeManifestIcons: false,
      manifest: {
        name: "Clowder",
        short_name: "Clowder",
        description: "A cozy cat-collecting roguelike.",
        theme_color: "#3b2a22",
        background_color: "#2e1f19",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        // Every format the game ships: code, pages, images, atlases, and fonts.
        globPatterns: ["**/*.{js,css,html,png,webp,json,woff2,woff,ttf,svg}"],
        // scripts/check-precache.mjs fails the build if anything is left out.
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true
      }
    })
  ],
  test: {
    exclude: [...configDefaults.exclude, "./.claude/**"]
  }
})
