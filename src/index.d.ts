/**
 * Type definitions for mapbox-gl-draw-snap-mode
 *
 * This library extends mapbox-gl-draw with snap functionality for creating
 * and editing geometries that snap to existing features, vertices, and guidelines.
 */

import type MapboxDrawPlugin from "@mapbox/mapbox-gl-draw";
import type { Map } from "mapbox-gl";
import type { Feature, LineString } from "geojson";

declare namespace MapboxDraw {
	interface MapboxDrawOptions extends SnapOptions {}
}

/**
 * Identifiers for the snap guide features
 */
export const enum IDS {
	VERTICAL_GUIDE = "VERTICAL_GUIDE",
	HORIZONTAL_GUIDE = "HORIZONTAL_GUIDE",
}

/**
 * Options for configuring the snapping behavior
 */
export interface SnapOptions {
	/**
	 * The min distance **(in Kilometers)** from each vertex, where snapping to that vertex would take priority over snapping to line/segments.
	 * @default 1.25 (1250 meters)
	 */
	snapVertexPriorityDistance?: number;

	/**
	 * The min distance (in pixels) where snapping to the line/segments would take effect.
	 * @default 15
	 */
	snapPx?: number;

	/**
	 * Controls whether to snap to line/segments midpoints (an imaginary point in the middle of each segment) or not.
	 * @default false
	 */
	snapToMidPoints?: boolean;

	/**
	 * Default to all features from the draw layer (`draw.getAll().features`)
	 * @example
		```ts
		{
			snapGetFeatures: (map, draw) => [
				...map.queryRenderedFeatures({ layers: ["not-editable-layer-name"] }),
				...draw.getAll().features,
			],
		}
		```
		*/
	snapGetFeatures?: (map: Map, draw: MapboxDraw) => Feature[];
}

/**
 * Options for configuring snap modes
 */
export interface SnapModeOptions {
	/**
	 * Enable snapping to features and vertices
	 * @default true
	 */
	snap?: boolean;

	/**
	 * Enable guide lines for snapping
	 * @default true
	 */
	guides?: boolean;

	/**
	 * When creating polygons, if `false`, will use `turf.difference` on all overlapping polygons to create a polygon that does not overlap existing ones.
	 * Only applicable to SnapPolygonMode
	 * @default true
	 */
	overlap?: boolean;

	/**
	 * Configuration options for snap behavior
	 */
	snapOptions?: SnapOptions;
}

/**
 * Mode for drawing points with snapping functionality
 * Extends the default draw_point mode from mapbox-gl-draw
 */
export class SnapPointMode extends MapboxDrawPlugin.modes.draw_point {
	static onSetup(options?: SnapModeOptions): any;
	static onClick(state: any, e?: any): void;
	static onMouseMove(state: any, e: any): void;
	static toDisplayFeatures(state: any, geojson: any, display: any): void;
	static onStop(state: any): void;
}

/**
 * Mode for drawing lines with snapping functionality
 * Extends the default draw_line_string mode from mapbox-gl-draw
 */
export class SnapLineMode extends MapboxDrawPlugin.modes.draw_line_string {
	static onSetup(options?: SnapModeOptions): any;
	static onClick(state: any): void;
	static onMouseMove(state: any, e: any): void;
	static toDisplayFeatures(state: any, geojson: any, display: any): void;
	static onStop(state: any): void;
}

/**
 * Mode for drawing polygons with snapping functionality
 * Extends the default draw_polygon mode from mapbox-gl-draw
 */
export class SnapPolygonMode extends MapboxDrawPlugin.modes.draw_polygon {
	static onSetup(options?: SnapModeOptions): any;
	static onClick(state: any): void;
	static onMouseMove(state: any, e: any): void;
	static toDisplayFeatures(state: any, geojson: any, display: any): void;
	static onStop(state: any): void;
}

/**
 * Mode for directly selecting and editing features with snapping functionality
 * Extends the default direct_select mode from mapbox-gl-draw
 */
export class SnapDirectSelect extends MapboxDrawPlugin.modes.direct_select {
	static onSetup(options?: SnapModeOptions): any;
	static onMouseMove(state: any, e: any): void;
	static onTouchMove(state: any, e: any): void;
	static onDrag(state: any, e: any): void;
	static clickOnVertex(state: any, e: any): void;
	static toDisplayFeatures(state: any, geojson: any, display: any): void;
	static onStop(state: any): void;
}

/**
 * Custom map styles for the snap mode features
 * Extends the default MapboxDraw styles with additional styles for the snap guides
 */
export const SnapModeDrawStyles: any[];

// /**
//  * Utility functions for snap functionality
//  */
// export namespace Utils {
// 	/**
// 	 * IDs for guide features
// 	 */
// 	export const IDS: typeof import("./utils/index.js").IDS;

// 	/**
// 	 * Add a point to the vertices array if it's visible in the viewport
// 	 * @param map The Mapbox GL map instance
// 	 * @param vertices Array of vertices to add to
// 	 * @param coordinates Coordinates to add
// 	 * @param forceInclusion Whether to include the point even if off-screen
// 	 */
// 	export function addPointToVertices(map: Map, vertices: number[][], coordinates: { lng: number; lat: number } | number[], forceInclusion?: boolean): void;

// 	/**
// 	 * Create a list of features to snap to and all vertices
// 	 * @param map The Mapbox GL map instance
// 	 * @param draw The MapboxDraw instance
// 	 * @param currentFeature The feature being edited
// 	 * @param getFeatures Optional function to get the features to snap to
// 	 * @returns [snapList, vertices] Array containing the list of features to snap to and all vertices
// 	 */
// 	export function createSnapList(map: Map, draw: MapboxDraw, currentFeature: Feature, getFeatures?: (map: Map, draw: MapboxDraw) => Feature[]): [Feature[], number[][]];

// 	/**
// 	 * Create a guide feature for snapping
// 	 * @param id The ID for the guide feature
// 	 * @returns A new GeoJSON feature representing a guide line
// 	 */
// 	export function getGuideFeature(id: string): Feature<LineString>;

// 	/**
// 	 * Determine if a guide line should be hidden
// 	 * @param state The current state object
// 	 * @param geojson The guide feature
// 	 * @returns Whether the guide should be hidden
// 	 */
// 	export function shouldHideGuide(state: any, geojson: Feature): boolean;

// 	/**
// 	 * Perform snapping based on the current state and event
// 	 * @param state The current state object
// 	 * @param e The mouse event
// 	 * @returns The snapped coordinates
// 	 */
// 	export function snap(state: any, e: { lngLat: { lng: number; lat: number }; originalEvent: MouseEvent }): { lng: number; lat: number };
// }