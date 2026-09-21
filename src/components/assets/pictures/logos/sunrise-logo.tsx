import * as React from "react";

// Colour-changing browser extensions (Dark Reader, etc.) rewrite each shape's
// fill/stroke into inline styles before React hydrates, which trips a per-element
// hydration mismatch. suppressHydrationWarning is React's escape hatch for that;
// it only covers the element it's on, so it's applied to every painted shape.
const noExtDiff = { suppressHydrationWarning: true } as const;

const SunriseLogo = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width={props.width || 240}
      height={props.height || 193}
      viewBox="0 0 240 193"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle
        {...noExtDiff}
        cx={104.057}
        cy={125.92}
        r={41.7748}
        fill="#FFB366"
        fillOpacity={0.12}
      />
      <circle
        {...noExtDiff}
        cx={145.775}
        cy={76.7748}
        r={41.7748}
        fill="#FFB266"
        fillOpacity={0.05}
      />
      <circle
        {...noExtDiff}
        cx={197.775}
        cy={41.7748}
        r={41.7748}
        fill="#EFD2B6"
        fillOpacity={0.02}
      />
      <path
        {...noExtDiff}
        d="M85.0686 132.756C59.8996 132.756 39.4961 153.159 39.4961 178.328H130.641C130.641 153.159 110.238 132.756 85.0686 132.756Z"
        fill="#FFB266"
      />
      <path
        {...noExtDiff}
        d="M0 181.366H84.6889H169.378M30.5736 186.683H138.804M65.8862 192H103.492"
        stroke="#FFB266"
        strokeWidth={2}
      />
    </svg>
  );
};

export default SunriseLogo;
