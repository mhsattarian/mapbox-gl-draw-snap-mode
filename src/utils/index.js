// Heavily inspired from work of @davidgilbertson on Github and `leaflet-geoman` project.

import { geojsonTypes } from "@mapbox/mapbox-gl-draw/src/constants";
// import {
//   bboxPolygon,
//   booleanDisjoint,
//   getCoords,
//   distance,
//   polygonToLine,
//   nearestPointOnLine,
//   midpoint,
// } from "@turf/turf";

import bboxPolygon from "@turf/bbox-polygon";
import booleanDisjoint from "@turf/boolean-disjoint";
import { getCoords } from "@turf/invariant";
import distance from "@turf/distance";
import polygonToLine from "@turf/polygon-to-line";
import nearestPointOnLine from "@turf/nearest-point-on-line";
import midpoint from "@turf/midpoint";

export const IDS = {
  VERTICAL_GUIDE: "VERTICAL_GUIDE",
  HORIZONTAL_GUIDE: "HORIZONTAL_GUIDE",
};

export const addPointTovertices = (
  map,
  vertices,
  coordinates,
  forceInclusion
) => {
  const { width: w, height: h } = map.getCanvas();
  // Just add verteices of features currently visible in viewport
  const { x, y } = map.project(coordinates);
  const pointIsOnTheScreen = x > 0 && x < w && y > 0 && y < h;

  // But do add off-screen points if forced (e.g. for the current feature)
  // So features will always snap to their own points
  if (pointIsOnTheScreen || forceInclusion) {
    vertices.push(coordinates);
  }
};

export const createSnapList = (map, draw, currentFeature) => {
  // Get all drawn features
  const features = draw.getAll().features;
  const snapList = [];

  // Get current bbox as polygon
  const bboxAsPolygon = (() => {
    const canvas = map.getCanvas(),
      w = canvas.width,
      h = canvas.height,
      cUL = map.unproject([0, 0]).toArray(),
      cUR = map.unproject([w, 0]).toArray(),
      cLR = map.unproject([w, h]).toArray(),
      cLL = map.unproject([0, h]).toArray();

    return bboxPolygon([cLL, cUR].flat());
  })();

  const vertices = [];

  // Keeps vertices for drwing guides
  const addVerticesTovertices = (coordinates, isCurrentFeature = false) => {
    if (!Array.isArray(coordinates)) throw Error("Your array is not an array");

    if (Array.isArray(coordinates[0])) {
      // coordinates is an array of arrays, we must go deeper
      coordinates.forEach((coord) => {
        addVerticesTovertices(coord);
      });
    } else {
      // If not an array of arrays, only consider arrays with two items
      if (coordinates.length === 2) {
        addPointTovertices(map, vertices, coordinates, isCurrentFeature);
      }
    }
  };

  features.forEach((feature) => {
    // For currentfeature
    if (feature.id === currentFeature.id) {
      if (currentFeature.type === geojsonTypes.POLYGON) {
        // For the current polygon, the last two points are the mouse position and back home
        // so we chop those off (else we get vertices showing where the user clicked, even
        // if they were just panning the map)
        addVerticesTovertices(
          feature.geometry.coordinates[0].slice(0, -2),
          true
        );
      }
      return;
    }

    // If this is re-running because a user is moving the map, the features might include
    // vertices or the last leg of a polygon
    if (
      feature.id === IDS.HORIZONTAL_GUIDE ||
      feature.id === IDS.VERTICAL_GUIDE
    )
      return;

    addVerticesTovertices(feature.geometry.coordinates);

    // If feature is currently on viewport add to snap list
    if (!booleanDisjoint(bboxAsPolygon, feature)) {
      snapList.push(feature);
    }
  });

  return [snapList, vertices];
};

const getNearbyvertices = (vertices, coords) => {
  const verticals = [];
  const horizontals = [];

  vertices.forEach((vertex) => {
    verticals.push(vertex[0]);
    horizontals.push(vertex[1]);
  });

  const nearbyVerticalGuide = verticals.find(
    (px) => Math.abs(px - coords.lng) < 0.009
  );

  const nearbyHorizontalGuide = horizontals.find(
    (py) => Math.abs(py - coords.lat) < 0.009
  );

  return {
    verticalPx: nearbyVerticalGuide,
    horizontalPx: nearbyHorizontalGuide,
  };
};

const calcLayerDistances = (lngLat, layer) => {
  // the point P which we want to snap (probpably the marker that is dragged)
  const P = [lngLat.lng, lngLat.lat];

  // is this a marker?
  const isMarker = layer.geometry.type === "Point";
  // is it a polygon?
  const isPolygon = layer.geometry.type === "Polygon";

  let lines = undefined;

  // the coords of the layer
  const latlngs = getCoords(layer);

  if (isMarker) {
    const [lng, lat] = latlngs;
    // return the info for the marker, no more calculations needed
    return {
      latlng: { lng, lat },
      distance: distance(latlngs, P),
    };
  }

  if (isPolygon) lines = polygonToLine(layer);
  else lines = layer;

  const nearestPoint = nearestPointOnLine(lines, P);
  const [lng, lat] = nearestPoint.geometry.coordinates;

  let segmentIndex = nearestPoint.properties.index;
  if (segmentIndex + 1 === lines.geometry.coordinates.length) segmentIndex--;

  return {
    latlng: { lng, lat },
    segment: lines.geometry.coordinates.slice(segmentIndex, segmentIndex + 2),
    distance: nearestPoint.properties.dist,
    isMarker,
  };
};

const calcClosestLayer = (lngLat, layers) => {
  let closestLayer = {};

  // loop through the layers
  layers.forEach((layer, index) => {
    // find the closest latlng, segment and the distance of this layer to the dragged marker latlng
    const results = calcLayerDistances(lngLat, layer);

    // save the info if it doesn't exist or if the distance is smaller than the previous one
    if (
      closestLayer.distance === undefined ||
      results.distance < closestLayer.distance
    ) {
      closestLayer = results;
      closestLayer.layer = layer;
    }
  });

  // return the closest layer and it's data
  // if there is no closest layer, return undefined
  return closestLayer;
};

// minimal distance before marker snaps (in pixels)
const metersPerPixel = function (latitude, zoomLevel) {
  const earthCircumference = 40075017;
  const latitudeRadians = latitude * (Math.PI / 180);
  return (
    (earthCircumference * Math.cos(latitudeRadians)) /
    Math.pow(2, zoomLevel + 8)
  );
};

// we got the point we want to snap to (C), but we need to check if a coord of the polygon
function snapToLineOrPolygon(closestLayer, snapOptions, snapVertexPriorityDistance) {
  // A and B are the points of the closest segment to P (the marker position we want to snap)
  const A = closestLayer.segment[0];
  const B = closestLayer.segment[1];

  // C is the point we would snap to on the segment.
  // The closest point on the closest segment of the closest polygon to P. That's right.
  const C = [closestLayer.latlng.lng, closestLayer.latlng.lat];

  // distances from A to C and B to C to check which one is closer to C
  const distanceAC = distance(A, C);
  const distanceBC = distance(B, C);

  // closest latlng of A and B to C
  let closestVertexLatLng = distanceAC < distanceBC ? A : B;

  // distance between closestVertexLatLng and C
  let shortestDistance = distanceAC < distanceBC ? distanceAC : distanceBC;

  // snap to middle (M) of segment if option is enabled
  if (snapOptions && snapOptions.snapToMidPoints) {
    const M = midpoint(A, B).geometry.coordinates;
    const distanceMC = distance(M, C);

    if (distanceMC < distanceAC && distanceMC < distanceBC) {
      // M is the nearest vertex
      closestVertexLatLng = M;
      shortestDistance = distanceMC;
    }
  }

  // the distance that needs to be undercut to trigger priority
  const priorityDistance = snapVertexPriorityDistance;

  // the latlng we ultemately want to snap to
  let snapLatlng;

  // if C is closer to the closestVertexLatLng (A, B or M) than the snapDistance,
  // the closestVertexLatLng has priority over C as the snapping point.
  if (shortestDistance < priorityDistance) {
    snapLatlng = closestVertexLatLng;
  } else {
    snapLatlng = C;
  }

  // return the copy of snapping point
  const [lng, lat] = snapLatlng;
  return {lng, lat};
}


function snapToPoint(closestLayer) {
  return closestLayer.latlng;
}

const checkPrioritiySnapping = (closestLayer, snapOptions, snapVertexPriorityDistance = 1.25) => {
  let snappingToPoint = !Array.isArray(closestLayer.segment);
  if (snappingToPoint) {
    return snapToPoint(closestLayer);
  } else {
    return snapToLineOrPolygon(closestLayer, snapOptions, snapVertexPriorityDistance);
  }
};

/**
 * Returns snap points if there are any, otherwise the original lng/lat of the event
 * Also, defines if vertices should show on the state object
 *
 * Mutates the state object
 *
 * @param state
 * @param e
 * @returns {{lng: number, lat: number}}
 */
export const snap = (state, e) => {
  let lng = e.lngLat.lng;
  let lat = e.lngLat.lat;

  // Holding alt bypasses all snapping
  if (e.originalEvent.altKey) {
    state.showVerticalSnapLine = false;
    state.showHorizontalSnapLine = false;

    return { lng, lat };
  }

  if (state.snapList.length <= 0) {
    return { lng, lat };
  }

  // snapping is on
  let closestLayer, minDistance, snapLatLng;
  if (state.options.snap) {
    closestLayer = calcClosestLayer({ lng, lat }, state.snapList);

    // if no layers found. Can happen when circle is the only visible layer on the map and the hidden snapping-border circle layer is also on the map
    if (Object.keys(closestLayer).length === 0) {
      return false;
    }

    const isMarker = closestLayer.isMarker;
    const snapVertexPriorityDistance = state.options.snapOptions ? state.options.snapOptions.snapVertexPriorityDistance : undefined;

    if (!isMarker) {
      snapLatLng = checkPrioritiySnapping(
        closestLayer,
        state.options.snapOptions,
        snapVertexPriorityDistance
      );
      // snapLatLng = closestLayer.latlng;
    } else {
      snapLatLng = closestLayer.latlng;
    }

    minDistance =
      ((state.options.snapOptions && state.options.snapOptions.snapPx) || 15) *
      metersPerPixel(snapLatLng.lat, state.map.getZoom());
  }

  let verticalPx, horizontalPx;
  if (state.options.guides) {
    const nearestGuidline = getNearbyvertices(state.vertices, e.lngLat);

    verticalPx = nearestGuidline.verticalPx;
    horizontalPx = nearestGuidline.horizontalPx;

    if (verticalPx) {
      // Draw a line from top to bottom

      const lngLatTop = { lng: verticalPx, lat: e.lngLat.lat + 10 };
      const lngLatBottom = { lng: verticalPx, lat: e.lngLat.lat - 10 };

      state.verticalGuide.updateCoordinate(0, lngLatTop.lng, lngLatTop.lat);
      state.verticalGuide.updateCoordinate(
        1,
        lngLatBottom.lng,
        lngLatBottom.lat
      );
    }

    if (horizontalPx) {
      // Draw a line from left to right

      const lngLatTop = { lng: e.lngLat.lng + 10, lat: horizontalPx };
      const lngLatBottom = { lng: e.lngLat.lng - 10, lat: horizontalPx };

      state.horizontalGuide.updateCoordinate(0, lngLatTop.lng, lngLatTop.lat);
      state.horizontalGuide.updateCoordinate(
        1,
        lngLatBottom.lng,
        lngLatBottom.lat
      );
    }

    state.showVerticalSnapLine = !!verticalPx;
    state.showHorizontalSnapLine = !!horizontalPx;
  }

  if (closestLayer && closestLayer.distance * 1000 < minDistance) {
    return snapLatLng;
  } else if (verticalPx || horizontalPx) {
    if (verticalPx) {
      lng = verticalPx;
    }
    if (horizontalPx) {
      lat = horizontalPx;
    }
    return { lng, lat };
  } else {
    return { lng, lat };
  }
};

export const getGuideFeature = (id) => ({
  id,
  type: geojsonTypes.FEATURE,
  properties: {
    isSnapGuide: "true", // for styling
  },
  geometry: {
    type: geojsonTypes.LINE_STRING,
    coordinates: [],
  },
});

export const shouldHideGuide = (state, geojson) => {
  if (
    geojson.properties.id === IDS.VERTICAL_GUIDE &&
    (!state.options.guides || !state.showVerticalSnapLine)
  ) {
    return true;
  }

  if (
    geojson.properties.id === IDS.HORIZONTAL_GUIDE &&
    (!state.options.guides || !state.showHorizontalSnapLine)
  ) {
    return true;
  }

  return false;
};
