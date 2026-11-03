import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { Euler } from "three";
import { faceAngles, latLngToVector3, nearestAngle, PITCH_LIMIT } from "./utils";

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

describe("faceAngles", () => {
  const PLACES = [
    [51.5, -0.1], // London
    [31.6, -8], // Morocco
    [-33.9, 151.2], // the far side
    [0, 90], // on the equator, a quarter turn east
  ];
  /** The pin as the globe turns it: the pitch about x after the yaw about y (Euler XYZ). */
  const turn = (pin: Vector3, { yaw, pitch }: { yaw: number; pitch: number }) =>
    pin.clone().applyEuler(new Euler(pitch, yaw, 0, "XYZ"));

  it("brings a place to the centre, facing the camera, from any side", () => {
    for (const toward of [
      new Vector3(0, 0, 1),
      new Vector3(0.3, 0.2, 1).normalize(),
      new Vector3(-0.5, -0.3, 0.8).normalize(),
    ]) {
      for (const [lat, lng] of PLACES) {
        const pin = latLngToVector3(lat, lng, 1);
        const angles = faceAngles(pin, toward);
        // Exactly in the centre, unless that needs more tilt than the globe allows (held there).
        if (Math.abs(angles.pitch) < PITCH_LIMIT) {
          expect(turn(pin, angles).dot(toward), `${lat},${lng}`).toBeCloseTo(1, 6);
        } else {
          expect(Math.abs(angles.pitch)).toBeCloseTo(PITCH_LIMIT, 9);
        }
      }
    }
  });

  it("keeps the globe as upright as it can", () => {
    const pin = latLngToVector3(0, 40, 1);
    expect(Math.abs(faceAngles(pin, new Vector3(0, 0, 1)).pitch)).toBeCloseTo(0, 6);
  });

  it("never tilts the globe past its limit: a pole comes as near the centre as that allows", () => {
    const pole = new Vector3(0, 1, 0);
    const angles = faceAngles(pole, new Vector3(0, 0, 1));
    expect(Math.abs(angles.pitch)).toBeLessThanOrEqual(PITCH_LIMIT);
    expect(turn(pole, angles).z).toBeGreaterThan(0.9);
  });
});
