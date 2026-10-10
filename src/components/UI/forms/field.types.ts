import type { ComponentProps, ReactNode } from "react";

/** The field's own props; the rest go to its input or textarea. */
export interface FieldOwnProps {
  /** Its name, shown above it (it labels the control). */
  label: string;
  /** Places it (e.g. across a form's two columns). */
  className?: string;
  /** A textarea for a longer text (it doesn't resize). */
  multiline?: boolean;
  /** What's wrong with its value, shown under the line and read with it (it may hold a fix to tap). */
  error?: ReactNode;
}

export type FieldProps = FieldOwnProps &
  (
    | ({ multiline?: false } & Omit<ComponentProps<"input">, "className">)
    | ({ multiline: true } & Omit<ComponentProps<"textarea">, "className">)
  );
