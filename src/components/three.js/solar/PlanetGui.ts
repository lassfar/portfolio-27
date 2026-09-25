import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { copyValues, jumpToVoyage } from "#/components/three.js/scene/devPanel";
import {
  ASTEROIDS,
  EARTH_RADIUS,
  MOONS,
  PLANET_LOD,
  PLANET_STYLE,
  PlanetLook,
  SATURN_LOOK,
  PLANETS,
  SOLAR_MOTION,
  VOYAGE,
} from "./config";
import { planetInspect, planetTuningSnapshot, rebuildPlanets, resetPlanetTuning } from "./planetTuning";

/**
 * The planets' section of the dev tuning panel (hosted by GalaxyGui): the planets,
 * their moons, the asteroid belt and the system's pacing. It mutates `PLANETS`,
 * `MOONS`, `PLANET_STYLE`, `ASTEROIDS` and `SOLAR_MOTION` in place: most values apply
 * instantly (read every frame); the ones marked "rebuilds" re-scatter the dots or
 * redraw the orbits when you let go of the slider. "inspect" flies the camera close to
 * one body (most are specks in the wide view). "copy values" puts the JSON on the
 * clipboard to bake into `solar/config.ts`.
 */
export function buildPlanetPanel(gui: GUI) {
  const refresh = () => gui.controllersRecursive().forEach((c) => c.updateDisplay());
  const title = (id: string) => id[0].toUpperCase() + id.slice(1);

  const fView = gui.addFolder("View");
  const view = {
    system: () => jumpToVoyage(VOYAGE.flyoutEnd),
    inspect: "none",
  };
  fView.add(view, "system").name("the solar system (voyage)");
  fView
    .add(view, "inspect", ["none", ...PLANETS.map((p) => p.id), ...MOONS.map((m) => m.id)])
    .name("inspect a planet / moon")
    .onChange((id: string) => {
      planetInspect.id = id === "none" ? null : id;
      if (planetInspect.id) jumpToVoyage(VOYAGE.flyoutEnd); // where every body is in view
    });
  fView.add(planetInspect, "distance", 1.6, 12, 0.1).name("inspect distance × radius");
  fView.add(planetInspect, "sunAngle", 0, 170, 1).name("inspect angle from the Sun (°)");

  const fMotion = gui.addFolder("Orbits & motion");
  fMotion
    .add(SOLAR_MOTION, "compression", 0.2, 1, 0.01)
    .name("distances: real^this (rebuilds)")
    .onFinishChange(rebuildPlanets);
  fMotion.add(SOLAR_MOTION, "orbitPace", 0, 0.5, 0.001).name("orbit pace (the Earth, rad/s)");
  fMotion.add(SOLAR_MOTION, "dayPace", 0, 1, 0.005).name("day pace (1 Earth day, rad/s)");
  fMotion.add(SOLAR_MOTION, "moonSecondsPerDay", 0.2, 20, 0.1).name("the Moon: seconds per day");
  fMotion.add(SOLAR_MOTION, "jupiterMoonSecondsPerDay", 0.2, 40, 0.1).name("Jupiter's moons: seconds per day");

  const fStyle = gui.addFolder("All planets & moons");
  fStyle.add(PLANET_STYLE, "dotSoftness", 0.02, 0.5, 0.01).name("dot softness");
  fStyle.add(PLANET_STYLE, "shellJitter", 0, 0.3, 0.005).name("grain depth");
  fStyle.add(PLANET_STYLE, "rimStart", 0, 1, 0.01).name("grainy edge from");
  fStyle.add(PLANET_STYLE, "rimScatter", 0, 0.3, 0.005).name("grainy edge drift");
  fStyle.add(PLANET_STYLE, "ambient", 0, 1, 0.01).name("night side");
  fStyle.add(PLANET_STYLE, "core").name("solid core (hides what's behind)");
  fStyle.addColor(PLANET_STYLE, "coreColor").name("core colour");
  fStyle.add(PLANET_STYLE, "coreTint", 0, 1, 0.01).name("core: core colour ↔ planet colour");
  fStyle.add(PLANET_STYLE, "coreShade", 0, 1.5, 0.01).name("core brightness (0 = black)");
  fStyle.add(PLANET_STYLE, "thin", 0, 0.8, 0.01).name("thin the dots as we pull back");

  const fBig = gui.addFolder("Big planets (Saturn look + dust)");
  fBig.add(SATURN_LOOK, "dotWorld", 1, 40, 0.1).name("real dot size (Saturn = 10)");
  fBig.add(SATURN_LOOK, "dotSoftness", 0.02, 0.5, 0.01).name("dot softness");
  fBig.add(SATURN_LOOK, "rimStart", 0, 1, 0.01).name("grainy edge from (1 = off)");
  fBig.add(SATURN_LOOK, "rimScatter", 0, 0.3, 0.005).name("grainy edge drift");
  fBig.add(SATURN_LOOK, "shellJitter", 0, 0.3, 0.005).name("grain depth");
  fBig.add(SATURN_LOOK, "dust", 0, 0.6, 0.01).name("dust (share of dots)");
  fBig.add(SATURN_LOOK, "dustReach", 0, 1, 0.01).name("dust reach (× radius)");
  fBig.add(SATURN_LOOK, "dustOpacity", 0, 1, 0.01).name("dust opacity");
  fBig.add(SATURN_LOOK, "dustBreath", 0, 0.2, 0.001).name("dust breathing");

  const fLod = gui.addFolder("Detail (LOD)");
  fLod.add(PLANET_LOD, "dotWorld", 1, 40, 0.1).name("real dot size (Saturn = 10)");
  fLod.add(PLANET_LOD, "minDotPx", 0.5, 4, 0.05).name("smallest dot when far (px)");
  fLod.add(PLANET_LOD, "maxDotRel", 0.002, 0.1, 0.001).name("biggest dot (× body size)");
  fLod.add(PLANET_LOD, "coverage", 0.1, 2, 0.01).name("coverage up close");
  fLod.add(PLANET_LOD, "farPack", 0, 2, 0.01).name("pack closer when far");
  fLod.add(PLANET_LOD, "farCoverage", 0.5, 8, 0.05).name("…up to coverage");
  fLod.add(PLANET_LOD, "minDots", 1, 500, 1).name("fewest dots (a speck)");
  fLod.add(PLANET_LOD, "fadeBand", 0, 0.6, 0.01).name("fade band");

  const fBelt = gui.addFolder("Asteroid belt");
  fBelt.add(ASTEROIDS, "show").name("show");
  fBelt.add(ASTEROIDS, "count", 0, 40000, 500).name("dots (rebuilds)").onFinishChange(rebuildPlanets);
  fBelt.add(ASTEROIDS, "size", 0.2, 6, 0.05).name("dot size (px)");
  fBelt.add(ASTEROIDS, "maxSize", 1, 12, 0.5).name("…at most, up close (px)");
  fBelt.add(ASTEROIDS, "brightness", 0, 2, 0.01).name("brightness");
  fBelt.addColor(ASTEROIDS, "color").name("colour");
  fBelt.add(ASTEROIDS, "inner", 1.6, 3, 0.01).name("inner edge (AU, rebuilds)").onFinishChange(rebuildPlanets);
  fBelt.add(ASTEROIDS, "outer", 2.5, 4.5, 0.01).name("outer edge (AU, rebuilds)").onFinishChange(rebuildPlanets);
  fBelt.add(ASTEROIDS, "incl", 0, 25, 0.5).name("tilt spread (°, rebuilds)").onFinishChange(rebuildPlanets);
  fBelt.add(ASTEROIDS, "ecc", 0, 0.4, 0.01).name("ovalness (rebuilds)").onFinishChange(rebuildPlanets);
  fBelt.add(ASTEROIDS, "gapWidth", 0, 0.1, 0.005).name("Kirkwood gaps (AU, rebuilds)").onFinishChange(rebuildPlanets);

  for (const def of PLANETS) {
    const f = gui.addFolder(title(def.id));
    addSize(f, def);
    f.add(def, "count", 1000, 300000, 1000).name("most dots, up close (rebuilds)").onFinishChange(rebuildPlanets);
    f.add(def, "tilt", 0, 180, 0.1).name("axial tilt (°)");
    f.add(def, "day", 0.1, 300, 0.001).name("day length (Earth days)");
    def.saturnLook ??= false;
    f.add(def as { saturnLook: boolean }, "saturnLook").name("Saturn look + dust");
    f.add(def.orbit, "au", 0.2, 40, 0.001).name("distance (AU, rebuilds)").onFinishChange(rebuildPlanets);
    f.add(def.orbit, "e", 0, 0.5, 0.001).name("orbit ovalness (rebuilds)").onFinishChange(rebuildPlanets);
    f.add(def.orbit, "i", 0, 30, 0.01).name("orbit tilt (°, rebuilds)").onFinishChange(rebuildPlanets);
    addLook(f, def.look);
    f.close();
  }

  const fMoons = gui.addFolder("Moons");
  for (const moon of MOONS) {
    const f = fMoons.addFolder(`${title(moon.id)} (${moon.parent === "earth" ? "the Earth" : "Jupiter"})`);
    addSize(f, moon);
    f.add(moon, "count", 1000, 300000, 1000).name("most dots, up close (rebuilds)").onFinishChange(rebuildPlanets);
    f.add(moon, "distance", 0.1, 12, 0.01).name("distance from its planet");
    f.add(moon, "period", 0.1, 60, 0.001).name("orbit (Earth days)");
    f.add(moon, "incl", 0, 30, 0.1).name("orbit tilt (°)");
    addLook(f, moon.look);
    f.close();
  }
  fMoons.close();

  const fValues = gui.addFolder("Values");
  const actions = {
    copy: () => copyValues(copy, planetTuningSnapshot(), "copy values", "PlanetGui"),
    reset: () => {
      resetPlanetTuning();
      refresh();
    },
  };
  const copy = fValues.add(actions, "copy").name("copy values");
  fValues.add(actions, "reset").name("reset to code defaults");

  // Keep it compact: the view + pacing open, the rest one click away.
  [fStyle, fBig, fLod, fBelt].forEach((folder) => folder.close());
}

/** A body's size, shown in Earth radii (it's stored in world units). */
function addSize(f: GUI, body: { size: number }) {
  const sizer = {
    get earthRadii() {
      return body.size / EARTH_RADIUS;
    },
    set earthRadii(v: number) {
      body.size = v * EARTH_RADIUS;
    },
  };
  f.add(sizer, "earthRadii", 0.05, 15, 0.001).name("size, Earth radii (rebuilds)").onFinishChange(rebuildPlanets);
}

/** A surface's colours + features (planetShaders.ts). */
function addLook(f: GUI, L: PlanetLook) {
  f.addColor(L, "base").name("main colour");
  f.addColor(L, "deep").name("deepest colour (gradient belts)");
  f.addColor(L, "dark").name("dark colour");
  f.addColor(L, "light").name("light colour");
  f.addColor(L, "accent").name("patch colour");
  f.add(L, "bands", 0, 20, 0.1).name("belts");
  f.add(L, "gradient").name("gradient belts (like the Saturn)");
  f.add(L, "bandContrast", 0, 1, 0.01).name("belt contrast");
  f.add(L, "bandWarp", 0, 3, 0.01).name("belt turbulence");
  f.add(L, "flow", 0, 0.3, 0.001).name("drift speed");
  f.add(L, "mottle", 0, 1, 0.01).name("dark regions / craters");
  f.add(L, "mottleScale", 0.5, 15, 0.1).name("…their detail");
  f.add(L, "accentPatches", 0, 1, 0.01).name("patches");
  f.add(L, "caps", 0, 1, 0.005).name("polar caps from (0 = none)");
  f.add(L, "clouds", 0, 1, 0.01).name("cloud streaks");
  f.add(L, "haze", 0, 1, 0.01).name("haze");
  const fSpot = f.addFolder("Storm spot");
  fSpot.add(L.spot, "strength", 0, 1, 0.01).name("strength (0 = none)");
  fSpot.add(L.spot, "lat", -80, 80, 0.5).name("latitude (°)");
  fSpot.add(L.spot, "lon", -180, 180, 1).name("longitude (°)");
  fSpot.add(L.spot, "size", 1, 40, 0.1).name("size (°)");
  fSpot.add(L.spot, "aspect", 0.5, 4, 0.05).name("width ÷ height");
  fSpot.addColor(L.spot, "color").name("colour");
  fSpot.close();
}
