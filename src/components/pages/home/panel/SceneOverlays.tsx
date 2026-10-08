"use client";

import SceneLabelLayer from "#/components/pages/home/labels/SceneLabelLayer";
import PinLabels from "#/components/pages/home/gallery/PinLabels";
import JourneyLabels from "#/components/pages/home/lab/JourneyLabels";
import RecordLabel from "#/components/pages/home/lab/RecordLabel";
import PanelHost from "./PanelHost";

/**
 * The scene's DOM overlays (P27-80; were EarthGallery + LabExperiments), kept out of the
 * WebGL canvas so text and media stay crisp: the scene labels (z-45: the Earth's places,
 * Parker's journey and memory card) under the panel and the photo viewer they open
 * (PanelHost). The story's title, subtitles and timeline sit at z-30…40.
 */
const SceneOverlays = () => (
  <PanelHost>
    <SceneLabelLayer>
      <PinLabels />
      <JourneyLabels />
      <RecordLabel />
    </SceneLabelLayer>
  </PanelHost>
);

export default SceneOverlays;
