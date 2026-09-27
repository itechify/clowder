import type { Title } from "../presentation/title"

/**
 * The title screen as text for screen readers, while it shows: the scene
 * draws it into the living room, so the shell only reads it out (ADR-0003).
 */
export function TitleReadout({ title }: { title: Title }) {
  const { word, partOfSpeech, meaning } = title.definition
  return (
    <section className="visually-hidden" aria-live="polite">
      <h1>Clowder</h1>
      <p>
        {word}, {partOfSpeech}: {meaning}.
      </p>
      <p>{title.buttons.map((button) => button.label).join(" or ")}.</p>
    </section>
  )
}
