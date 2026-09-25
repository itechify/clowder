/** Where the delivered art's multi-atlas is, if any (scripts/artPlugin.ts). */
declare module "virtual:art-atlas" {
  const atlas: { url: string; path: string } | null
  export default atlas
}
