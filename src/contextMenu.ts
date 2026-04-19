import OBR from "@owlbear-rodeo/sdk";
import { EXT_ID, SPEED_META_KEY, USED_META_KEY } from "./constants";

export function setupContextMenu() {
  OBR.contextMenu.create({
    id: `${EXT_ID}/context-menu`,

    // Two icons: OBR shows the first one whose filter passes.
    // "Remove Speed" filter is more specific (requires metadata present),
    // so it must come first.
    icons: [
      {
        icon: "/icons/boot-remove.svg",
        label: "Remove Speed",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: `metadata/${SPEED_META_KEY}`, operator: "!=", value: undefined },
          ],
        },
      },
      {
        icon: "/icons/boot-add.svg",
        label: "Set Speed",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],

    async onClick(context) {
      const firstItem = context.items[0];
      const meta = firstItem.metadata as Record<string, unknown>;
      const hasSpeed = meta[SPEED_META_KEY] !== undefined;

      if (hasSpeed) {
        // ── Remove speed ──────────────────────────────────────────────
        await OBR.scene.items.updateItems(context.items, (items) => {
          for (const item of items) {
            const m = item.metadata as Record<string, unknown>;
            delete m[SPEED_META_KEY];
            delete m[USED_META_KEY];
          }
        });
        OBR.notification.show("Speed removed.", "DEFAULT");
      } else {
        // ── Set speed ─────────────────────────────────────────────────
        const raw = window.prompt("Enter speed in feet (e.g. 30):", "30");
        if (raw === null) return;

        const speed = parseInt(raw, 10);
        if (isNaN(speed) || speed <= 0) {
          OBR.notification.show("Invalid speed. Enter a positive whole number.", "ERROR");
          return;
        }

        await OBR.scene.items.updateItems(context.items, (items) => {
          for (const item of items) {
            const m = item.metadata as Record<string, unknown>;
            m[SPEED_META_KEY] = speed;
            m[USED_META_KEY] = 0;
          }
        });
        OBR.notification.show(`Speed set to ${speed} ft.`, "SUCCESS");
      }
    },
  });
}
