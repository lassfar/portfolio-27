import type { Shape, ShapeName } from "#/components/pages/home/book/dots/dots.types";
import { earth } from "#/components/pages/home/book/dots/shapes/earth";
import { galaxy } from "#/components/pages/home/book/dots/shapes/galaxy";
import { saturn } from "#/components/pages/home/book/dots/shapes/saturn";
import { star } from "#/components/pages/home/book/dots/shapes/star";
import { sun } from "#/components/pages/home/book/dots/shapes/sun";

/** The calm book's dotted shapes, by name (P27-93): the prototype's, P27-65. */
export const SHAPES: Readonly<Record<ShapeName, Shape>> = { star, saturn, earth, sun, galaxy };
