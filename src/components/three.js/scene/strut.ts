import { Quaternion, Vector3 } from "three";

/** A point in a craft's local space. */
export type Vec3 = [number, number, number];

const UP = new Vector3(0, 1, 0);

/**
 * A strut/boom that actually CONNECTS point `a` to point `b`: a cylinder centred
 * at their midpoint, its length = |b-a|, oriented from local +Y onto (b-a). This
 * keeps every boom rooted on the craft instead of floating in space.
 */
export function seg(a: Vec3, b: Vec3) {
  const va = new Vector3(...a);
  const vb = new Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const mid = va.clone().add(vb).multiplyScalar(0.5).toArray() as Vec3;
  const quat = new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()).toArray() as [
    number,
    number,
    number,
    number,
  ];
  return { mid, quat, len };
}

/** A point fraction `t` of the way from `a` to `b`. */
export function along(a: Vec3, b: Vec3, t: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
