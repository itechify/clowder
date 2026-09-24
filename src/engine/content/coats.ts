export const coats = ["orange", "black", "white", "gray", "calico"] as const

export type Coat = (typeof coats)[number]
