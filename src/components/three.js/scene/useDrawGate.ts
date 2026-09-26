import { RefObject, useEffect, useRef } from "react";
import { BufferGeometry, Object3D } from "three";

/**
 * Skip an object's draw while `shown()` is false — without hiding it.
 *
 * For that one draw its geometry's draw count is set to 0 (then restored), so the GPU
 * does no vertex or pixel work. Unlike `visible = false`, the object stays in the render
 * list exactly as before — sorted, culled and bound to its shader — so shaders still
 * compile on the same frames as always (no stutter when it first appears) and any other
 * owner of the draw range (the planets' level of detail) is left untouched.
 *
 * `shown` is read at draw time, after every useFrame has run, so it always sees this
 * frame's values. Gate only on the object's exact "outputs nothing" condition (e.g. its
 * opacity is 0), so it can never pop in or vanish early.
 */
export function useDrawGate(ref: RefObject<Object3D | null>, shown: () => boolean) {
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const object = ref.current;
    if (!object) return;
    const before = object.onBeforeRender;
    const after = object.onAfterRender;
    let gated: BufferGeometry | null = null;
    let savedCount = 0;
    object.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
      before.call(this, renderer, scene, camera, geometry, material, group);
      if (!shownRef.current()) {
        gated = geometry;
        savedCount = geometry.drawRange.count;
        geometry.drawRange.count = 0;
      }
    };
    object.onAfterRender = function (renderer, scene, camera, geometry, material, group) {
      if (gated) {
        gated.drawRange.count = savedCount;
        gated = null;
      }
      after.call(this, renderer, scene, camera, geometry, material, group);
    };
    return () => {
      object.onBeforeRender = before;
      object.onAfterRender = after;
    };
  }, [ref]);
}
