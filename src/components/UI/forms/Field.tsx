import clsx from "clsx";
import { CAPS_LABEL } from "#/components/UI/text/caps";
import type { FieldOwnProps, FieldProps } from "#/components/UI/forms/field.types";

/** The line it's written on: it turns peach while focused. */
const LINE = clsx(
  "w-full rounded-none border-0 border-b border-white/20 bg-transparent px-0 py-2 transition-colors duration-300 outline-none focus:border-peach",
  "text-base font-light text-white placeholder:text-white/25 sm:text-lg",
);

/** Its input's or textarea's own props: all but the field's. */
const controlOf = <T extends FieldOwnProps>({
  label: _label,
  className: _className,
  multiline: _multiline,
  ...control
}: T) => control;

/**
 * A form field (Storybook: UI/Field, P27-82): its name in small spaced capitals over a
 * single line to write on, which turns peach while focused — Contact's name, email and
 * message. `multiline` makes it a textarea. `className` places it.
 */
const Field = (props: FieldProps) => (
  <label className={clsx("flex flex-col gap-1", props.className)}>
    <span className={CAPS_LABEL}>{props.label}</span>
    {props.multiline ? (
      <textarea {...controlOf(props)} className={clsx(LINE, "resize-none")} />
    ) : (
      <input {...controlOf(props)} className={LINE} />
    )}
  </label>
);

export default Field;
