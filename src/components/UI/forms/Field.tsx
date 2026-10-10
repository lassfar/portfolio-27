import clsx from "clsx";
import { useId } from "react";
import { CircleAlert } from "lucide-react";
import Icon from "#/components/UI/icons/Icon";
import { CAPS_LABEL } from "#/components/UI/text/caps";
import type { FieldOwnProps, FieldProps } from "#/components/UI/forms/field.types";

/**
 * The line it's written on: it turns peach while focused. It shows where the field is, so
 * it stands out at 3:1 (white/40: 3.8:1, WCAG 1.4.11), and its hint reads at 4.5:1
 * (white/50: 5.2:1, WCAG 1.4.3) (P27-93).
 */
const LINE = clsx(
  "w-full rounded-none border-0 border-b border-white/40 bg-transparent px-0 py-2 transition-colors duration-300 outline-none focus:border-peach",
  "aria-invalid:border-b-2 aria-invalid:border-dark-peach",
  "text-base font-light text-white placeholder:text-white/50 sm:text-lg",
);

/** Its input's or textarea's own props: all but the field's. */
const controlOf = <T extends FieldOwnProps>({
  label: _label,
  className: _className,
  multiline: _multiline,
  error: _error,
  ...control
}: T) => control;

/**
 * A form field (Storybook: UI/Field, P27-82): its name in small spaced capitals over a
 * single line to write on, which turns peach while focused — Contact's name, email and
 * message. `multiline` makes it a textarea. With an `error` (P27-66), the line thickens in dark
 * peach and the error shows under it, read with the field (WCAG 3.3.1). `className` places it.
 */
const Field = (props: FieldProps) => {
  const errorId = useId();
  const invalid = props.error ? { "aria-invalid": true, "aria-describedby": errorId } : {};
  return (
    <div className={clsx("flex flex-col gap-1.5", props.className)}>
      <label className="flex flex-col gap-1">
        <span className={CAPS_LABEL}>{props.label}</span>
        {props.multiline ? (
          <textarea {...controlOf(props)} {...invalid} className={clsx(LINE, "resize-none")} />
        ) : (
          <input {...controlOf(props)} {...invalid} className={LINE} />
        )}
      </label>
      {props.error && (
        <p
          id={errorId}
          className={clsx(
            "flex items-start gap-1.5 text-sm font-light text-light-peach",
            "moving:animate-[fadeIn_0.4s_ease-out] calm:animate-[fade_0.3s_ease-out]",
          )}
        >
          <Icon icon={CircleAlert} size={14} className="mt-0.75 shrink-0 text-peach" />
          <span>{props.error}</span>
        </p>
      )}
    </div>
  );
};

export default Field;
