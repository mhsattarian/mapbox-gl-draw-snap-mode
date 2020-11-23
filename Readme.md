# Mapbox-GL Draw Snap Mode

Custom mode for [Mapbox GL Draw](https://github.com/mapbox/mapbox-gl-draw) that adds snapping ability while drawing features.
It provides options to show guiding lines, control snapping sensibility, and whether to snap to midpoints on each segment.

## install

```shell
npm i mapbox-gl-draw-snap-mode
```

## usage

See a full example in the docs folder, or check at the [**Demo**](https://mhsattarian.github.io/mapbox-gl-draw-snap-mode).

```js
import {
  SnapPolygonMode,
  SnapPointMode,
  SnapLineMode,
  SnapModeDrawStyles,
} from "./mapbox-gl-draw-snap-mode.min.js";

const draw = new MapboxDraw({
  modes: {
    ...MapboxDraw.modes,
    draw_point: SnapPointMode,
    draw_polygon: SnapPolygonMode,
    draw_line_string: SnapLineMode,
  },
  // Styling guides
  styles: SnapModeDrawStyles,
  userProperties: true,
  // Config snapping features
  snap: true,
  snapOptions: {
    snapPx: 15, // defaults to 15
    snapToMidPoints: true, // defaults to false
  },
  guides: false,
});

draw.changeMode("draw_polygon");
```

## acknowledgement

this project is heavily inspired from [work](https://github.com/mapbox/mapbox-gl-draw/issues/865) of @davidgilbertson and [`leaflet-geoman` project](https://github.com/geoman-io/leaflet-geoman).
