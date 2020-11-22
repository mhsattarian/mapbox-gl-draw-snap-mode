# Mapbox-GL Draw Snap Mode

Custom mode for `Mapbox GL Draw` that adds snapping ability while drawing features.
It provides options to show guiding lines, control snapping sensibility, and whether to snap to midpoints on each segment.

## install

```shell
npm i mapbox-gl-draw-snap-mode
```

## usage

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
    snapToMidPoints: true, // defaults to fals
  },
  guides: false,
});

draw.changeMode("draw_polygon");
```
