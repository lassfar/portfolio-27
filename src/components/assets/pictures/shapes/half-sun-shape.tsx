import clsx from "clsx";
import React, { RefObject } from "react";

type HalfSunShapeProps = {
  className?: string;
  ref?: RefObject<HTMLDivElement | null>;
};

const HalfSunShape = ({ className, ref }: HalfSunShapeProps) => {
  return (
    <div className={clsx("bg-peach rounded-t-full", className)} ref={ref} />
  );
};

export default HalfSunShape;
