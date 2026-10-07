import { accentParts } from "#/components/UI/text/accent";

/**
 * A text with its accented (`*…*`) words in peach, like the site's titles (P27-80) —
 * `accentClassName` styles them instead. Renders inline, inside its own element.
 */
const AccentText = ({
  text,
  accentClassName = "text-peach",
}: {
  text: string;
  accentClassName?: string;
}) =>
  accentParts(text).map((part, k) =>
    part.accent ? (
      <span key={k} className={accentClassName}>
        {part.text}
      </span>
    ) : (
      part.text
    ),
  );

export default AccentText;
