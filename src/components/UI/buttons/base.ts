import type { ButtonSize } from "#/components/UI/buttons/button.types";

/**
 * What every button shares (P27-33): the site's keyboard focus ring, a 44px tap area on
 * phones, the pointer and a quiet disabled state. Their looks are their own: Button's
 * frosted pill, IconButton's liquid glass.
 */
export const BUTTON_BASE = "tap-target relative cursor-pointer focus-ring disabled:cursor-default disabled:opacity-50";

/** A button's icon, a little taller than its label's capitals (IconButton's: `large`). */
export const BUTTON_ICON_SIZE: Record<ButtonSize, number> = { small: 13, medium: 15, large: 17 };
