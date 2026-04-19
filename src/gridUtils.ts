import OBR from "@owlbear-rodeo/sdk";
import { DEFAULT_PX_PER_FOOT } from "./constants";

/**
 * Returns how many pixels equal one foot in the current scene.
 * OBR exposes grid.dpi (pixels per grid square) and we read the
 * scene's "feet per square" from room metadata (set by the action panel).
 * Falls back to 30 px/ft if no scene is ready.
 */
export async function getPxPerFoot(): Promise<number> {
  try {
    const grid = await OBR.scene.grid.getDpi();   // px per grid square
    const feetPerSquare = await getFeetPerSquare();
    return grid / feetPerSquare;
  } catch {
    return DEFAULT_PX_PER_FOOT;
  }
}

/**
 * Returns the number of feet represented by one grid square.
 * Stored in room metadata so the GM can configure it from the action panel.
 */
export async function getFeetPerSquare(): Promise<number> {
  try {
    const meta = await OBR.room.getMetadata();
    const val = (meta as Record<string, unknown>)["rodeo.owlbear.speedtracker/feetPerSquare"];
    if (typeof val === "number" && val > 0) return val;
  } catch {
    // ignore
  }
  return 5; // D&D default
}

/**
 * Euclidean distance in pixels between two points.
 */
export function pixelDistance(
  ax: number, ay: number,
  bx: number, by: number
): number {
  return Math.sqrt((bx - ax) ** 2 + (by - ay) ** 2);
}

/**
 * Converts a pixel distance to feet, rounding to nearest 5 ft.
 */
export function pxToFeet(px: number, pxPerFoot: number): number {
  const raw = px / pxPerFoot;
  return Math.round(raw / 5) * 5; // snap to 5-ft increments like Foundry
}
