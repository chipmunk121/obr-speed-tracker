/**
 * action.ts
 *
 * Drives the action panel popover. Lets the GM:
 *   • Set the scene's feet-per-square (default 5)
 *   • Reset all tokens' used movement to 0 (new turn / new round)
 *   • See a quick list of every token's speed and remaining movement
 */
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { EXT_ID, SPEED_META_KEY, USED_META_KEY } from "./constants";

const FEET_PER_SQUARE_KEY = `${EXT_ID}/feetPerSquare`;

// ── DOM references ──────────────────────────────────────────────────────────
const fpsInput     = document.getElementById("fps-input")     as HTMLInputElement;
const fpsBtn       = document.getElementById("fps-btn")       as HTMLButtonElement;
const resetBtn     = document.getElementById("reset-btn")     as HTMLButtonElement;
const tokenListEl  = document.getElementById("token-list")    as HTMLUListElement;
const statusEl     = document.getElementById("status")        as HTMLParagraphElement;

// ── Helpers ──────────────────────────────────────────────────────────────────

function setStatus(msg: string, color = "#aaa") {
  statusEl.textContent = msg;
  statusEl.style.color = color;
}

function renderTokens(items: Item[]) {
  const speedTokens = items.filter(
    (i) => i.layer === "CHARACTER" &&
           typeof (i.metadata as Record<string, unknown>)[SPEED_META_KEY] === "number"
  );

  tokenListEl.innerHTML = "";

  if (speedTokens.length === 0) {
    tokenListEl.innerHTML = '<li style="color:#666;font-style:italic">No tokens with speed.</li>';
    return;
  }

  for (const item of speedTokens) {
    const meta = item.metadata as Record<string, unknown>;
    const speed = meta[SPEED_META_KEY] as number;
    const used  = typeof meta[USED_META_KEY] === "number" ? meta[USED_META_KEY] as number : 0;
    const left  = Math.max(0, speed - used);

    const color =
      left <= 0             ? "#ff4422" :
      used / speed >= 0.75  ? "#ffcc00" :
                              "#00cc44";

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="token-name">${item.name || "Unknown"}</span>
      <span class="token-speed" style="color:${color}">${left}/${speed} ft</span>
    `;
    tokenListEl.appendChild(li);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

OBR.onReady(async () => {
  // Load saved feet-per-square
  try {
    const meta = await OBR.room.getMetadata();
    const saved = (meta as Record<string, unknown>)[FEET_PER_SQUARE_KEY];
    if (typeof saved === "number") fpsInput.value = String(saved);
  } catch { /* ignore */ }

  // Subscribe to item changes → refresh token list
  const unsub = OBR.scene.items.onChange(renderTokens);
  // Also render immediately
  OBR.scene.items.getItems().then(renderTokens);

  // ── Save feet-per-square ─────────────────────────────────────────────────
  fpsBtn.addEventListener("click", async () => {
    const val = parseInt(fpsInput.value, 10);
    if (isNaN(val) || val <= 0) {
      setStatus("Enter a positive number.", "#ff4422");
      return;
    }
    await OBR.room.setMetadata({ [FEET_PER_SQUARE_KEY]: val });
    setStatus(`Saved: ${val} ft/square`, "#00cc44");
    setTimeout(() => setStatus(""), 2000);
  });

  // ── Reset all movement ───────────────────────────────────────────────────
  resetBtn.addEventListener("click", async () => {
    const items = await OBR.scene.items.getItems(
      (item: Item) =>
        item.layer === "CHARACTER" &&
        typeof (item.metadata as Record<string, unknown>)[SPEED_META_KEY] === "number"
    );

    if (items.length === 0) {
      setStatus("No speed tokens found.", "#ffcc00");
      return;
    }

    await OBR.scene.items.updateItems(items, (drafts) => {
      for (const d of drafts) {
        (d.metadata as Record<string, unknown>)[USED_META_KEY] = 0;
      }
    });

    setStatus(`Reset ${items.length} token(s).`, "#00cc44");
    setTimeout(() => setStatus(""), 2000);
  });

  // Cleanup
  window.addEventListener("unload", () => unsub());
});
