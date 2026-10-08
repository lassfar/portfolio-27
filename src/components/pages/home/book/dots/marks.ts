/**
 * The look of the labels drawn over the calm book's figures (SVG): a pin's ring, its leader
 * line, its name, outlined in the page's black so it reads over the dots. The name's size is
 * the figure's own (the Lab's drawing is scaled).
 */
export const MARK = {
  ring: "fill-none stroke-peach/90",
  line: "stroke-light-peach/45",
  label:
    "fill-light-peach/92 stroke-rich-black stroke-4 font-light [paint-order:stroke] [stroke-linejoin:round]",
} as const;
