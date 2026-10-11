import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { latLngToVector3, nearestAngle, yawToFace } from "./utils";

const Y = new Vector3(0, 1, 0);

describe("yawToFace", () => {
  it("turns a place round to face a direction", () => {
    const toward = new Vector3(0.3, 0.2, 1).normalize(); // the camera, roughly in front
    for (const [lat, lng] of [
      [51.5, -0.1], // London
      [31.6, -8], // Morocco
      [-33.9, 151.2], // the far side
    ]) {
      const pin = latLngToVector3(lat, lng, 1);
      const turned = pin.clone().applyAxisAngle(Y, yawToFace(pin, toward));
      // Its east-west direction now points the same way as `toward`'s…
      expect(turned.x * toward.z - turned.z * toward.x).toBeCloseTo(0, 6);
      // …not away from it, and it faces it more than any other turn would.
      expect(turned.x * toward.x + turned.z * toward.z).toBeGreaterThan(0);
      const other = pin.clone().applyAxisAngle(Y, yawToFace(pin, toward) + 0.3);
      expect(turned.dot(toward)).toBeGreaterThan(other.dot(toward));
    }
  });
});

describe("nearestAngle", () => {
  it("takes the short way round", () => {
    expect(nearestAngle(0, 0.5)).toBeCloseTo(0.5);
    expect(nearestAngle(0, 2 * Math.PI - 0.5)).toBeCloseTo(-0.5);
    expect(nearestAngle(20, 0)).toBeCloseTo(6 * Math.PI); // three turns: 18.85, 1.15 back
  });

  it("stays within half a turn of where it is", () => {
    for (const [from, to] of [
      [13.2, -4],
      [-7, 9.9],
      [100, 0.1],
    ]) {
      const a = nearestAngle(from, to);
      expect(Math.abs(a - from)).toBeLessThanOrEqual(Math.PI + 1e-9);
      expect(Math.cos(a)).toBeCloseTo(Math.cos(to));
      expect(Math.sin(a)).toBeCloseTo(Math.sin(to));
    }
  });
});
