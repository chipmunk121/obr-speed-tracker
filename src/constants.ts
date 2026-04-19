// Unique namespace for this extension — change to your domain if you publish.
export const EXT_ID = "rodeo.owlbear.speedtracker";

// Metadata key stored on scene items (tokens).
// Value shape: { speed: number }  — speed in feet
export const SPEED_META_KEY = `${EXT_ID}/speed`;

// Metadata key for tracking how many feet a token has spent this turn.
// Value shape: { used: number }
export const USED_META_KEY = `${EXT_ID}/used`;

// Pixels per foot — OBR uses pixels internally.
// OBR's default grid is 150px per square; D&D default square = 5 ft.
// So 1 ft = 150 / 5 = 30 px. We'll read the scene grid to compute this dynamically.
export const DEFAULT_PX_PER_FOOT = 30;
