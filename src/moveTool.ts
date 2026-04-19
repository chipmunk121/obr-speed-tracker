import OBR, { buildLabel, buildPath, Item, Vector2, PathCommand } from "@owlbear-rodeo/sdk";
import { EXT_ID, SPEED_META_KEY, USED_META_KEY } from "./constants";
import { getPxPerFoot, pixelDistance, pxToFeet } from "./gridUtils";

// Local (client-only) overlay item IDs for the ruler
const RULER_LINE_ID  = `${EXT_ID}/ruler-line`;
const RULER_LABEL_ID = `${EXT_ID}/ruler-label`;

interface DragState {
  tokenId: string;
  startPos: Vector2;
  speedFt: number;
  usedFt: number;
  pxPerFoot: number;
}

let dragState: DragState | null = null;

// ── Colour thresholds (matching Foundry VTT ruler) ────────────────────────
function rulerColor(totalFt: number, speedFt: number): string {
  const r = totalFt / speedFt;
  if (r <= 0.75) return "#00cc44"; // green
  if (r <= 1.0)  return "#ffcc00"; // yellow
  if (r <= 2.0)  return "#ff4422"; // red — dashing
  return "#880000";                 // dark red — over dash
}

function labelText(totalFt: number, speedFt: number, usedFt: number): string {
  const thisDrag  = totalFt - usedFt;
  const remaining = Math.max(0, speedFt - totalFt);
  const tag =
    totalFt > speedFt * 2 ? " [OVER DASH]" :
    totalFt > speedFt     ? " [DASHING]"   : "";
  return `${thisDrag} ft  |  ${remaining} ft left / ${speedFt} ft${tag}`;
}

// ── Overlay helpers ───────────────────────────────────────────────────────
async function clearOverlay() {
  try {
    await OBR.scene.local.deleteItems([RULER_LINE_ID, RULER_LABEL_ID]);
  } catch { /* not yet created — fine */ }
}

async function drawRuler(
  start: Vector2,
  end: Vector2,
  totalFt: number,
  speedFt: number,
  usedFt: number,
) {
  const color = rulerColor(totalFt, speedFt);
  const text  = labelText(totalFt, speedFt, usedFt);
  const mid: Vector2 = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };

  const line = buildPath()
    .id(RULER_LINE_ID)
    .position({ x: 0, y: 0 })
    .commands([
      [PathCommand.MOVE, start.x, start.y],
      [PathCommand.LINE, end.x,   end.y],
    ])
    .strokeColor(color)
    .strokeWidth(4)
    .fillColor("transparent")
    .fillOpacity(0)
    .layer("DRAWING")
    .disableHit(true)
    .locked(true)
    .build();

  const label = buildLabel()
    .id(RULER_LABEL_ID)
    .position(mid)
    .plainText(text)
    .backgroundColor(color)
    .backgroundOpacity(0.88)
    .layer("DRAWING")
    .disableHit(true)
    .locked(true)
    .build();

  await clearOverlay();
  await OBR.scene.local.addItems([line, label]);
}

// ── Tool registration ─────────────────────────────────────────────────────
export function setupMoveTool() {
  OBR.tool.create({
    id: `${EXT_ID}/tool`,
    icons: [{ icon: "/icons/boot.svg", label: "Speed Move" }],
    shortcut: "M",
    defaultMode: `${EXT_ID}/tool-mode`,
  });

  OBR.tool.createMode({
    id: `${EXT_ID}/tool-mode`,
    icons: [{ icon: "/icons/boot.svg", label: "Speed Move" }],

    // ── Pointer DOWN ────────────────────────────────────────────────
    async onToolDown(context) {
      const target = context.target;
      if (!target || target.layer !== "CHARACTER") {
        dragState = null;
        return;
      }

      const meta  = target.metadata as Record<string, unknown>;
      const speed = meta[SPEED_META_KEY];
      if (typeof speed !== "number") {
        // No speed set — allow normal OBR drag; no ruler
        dragState = null;
        return;
      }

      const used = typeof meta[USED_META_KEY] === "number"
        ? (meta[USED_META_KEY] as number) : 0;

      dragState = {
        tokenId:   target.id,
        startPos:  { x: target.position.x, y: target.position.y },
        speedFt:   speed,
        usedFt:    used,
        pxPerFoot: await getPxPerFoot(),
      };
    },

    // ── Pointer MOVE ────────────────────────────────────────────────
    async onToolMove(context) {
      if (!dragState) return;
      const cur = context.pointerPosition;
      const ft  = pxToFeet(
        pixelDistance(dragState.startPos.x, dragState.startPos.y, cur.x, cur.y),
        dragState.pxPerFoot
      );
      await drawRuler(dragState.startPos, cur, dragState.usedFt + ft, dragState.speedFt, dragState.usedFt);
    },

    // ── Pointer UP ──────────────────────────────────────────────────
    async onToolUp(context) {
      if (!dragState) return;

      const end      = context.pointerPosition;
      const ftDragged = pxToFeet(
        pixelDistance(dragState.startPos.x, dragState.startPos.y, end.x, end.y),
        dragState.pxPerFoot
      );
      const newUsed = dragState.usedFt + ftDragged;
      const { tokenId } = dragState;

      // Move the token and persist used-movement in a single update
      await OBR.scene.items.updateItems(
        (item: Item) => item.id === tokenId,
        (items) => {
          for (const item of items) {
            item.position = { x: end.x, y: end.y };
            (item.metadata as Record<string, unknown>)[USED_META_KEY] = newUsed;
          }
        }
      );

      await clearOverlay();

      const remaining = Math.max(0, dragState.speedFt - newUsed);
      const isDashing = newUsed > dragState.speedFt && newUsed <= dragState.speedFt * 2;
      OBR.notification.show(
        isDashing
          ? `Moved ${ftDragged} ft. DASHING — ${remaining} ft of dash left.`
          : `Moved ${ftDragged} ft. ${remaining} ft remaining.`,
        remaining <= 0 ? "WARNING" : "DEFAULT"
      );

      dragState = null;
    },

    async onDeactivate() {
      await clearOverlay();
      dragState = null;
    },
  });
}
