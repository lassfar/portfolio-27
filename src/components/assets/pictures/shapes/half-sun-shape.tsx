import clsx from "clsx";
import { RefObject } from "react";

type HalfSunShapeProps = {
  className?: string;
  ref?: RefObject<HTMLDivElement | null>;
};

const HalfSunShape = ({ className, ref }: HalfSunShapeProps) => {
  return <div className={clsx("rounded-t-full bg-peach", className)} ref={ref} />;
};

export default HalfSunShape;
