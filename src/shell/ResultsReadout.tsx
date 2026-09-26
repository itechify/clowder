import type { Results } from "../presentation/staging"

/**
 * The Results as text for screen readers, while they show: the scene draws
 * them into the sleeping living room, so the shell only reads them out
 * (ADR-0003).
 */
export function ResultsReadout({ results }: { results: Results }) {
  const { title, ending, nights, photo, houseCats, bed } = results
  return (
    <section className="visually-hidden" aria-live="polite">
      <h1>{title}</h1>
      <p>{ending}</p>
      <p>
        Nights cleared: {nights.cleared} of {nights.of}
      </p>
      {photo && (
        <p>
          Best Play: {photo.scoreLabel} on {photo.nightLabel}. Its Couch, left
          to right:{" "}
          {photo.seats.map((seat) => seat?.cat.name ?? "empty").join(", ")}.
        </p>
      )}
      <p>House Cats: {houseCats.length > 0 ? houseCats.join(", ") : "none"}</p>
      {bed && <p>{bed.label}</p>}
    </section>
  )
}
