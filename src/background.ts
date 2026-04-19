/**
 * background.ts
 *
 * This script runs in a hidden iframe at all times while the extension is
 * active. It is responsible for:
 *   1. Registering the context-menu "Set Speed / Remove Speed" items
 *   2. Registering the Speed Move tool + tool mode
 */
import OBR from "@owlbear-rodeo/sdk";
import { setupContextMenu } from "./contextMenu";
import { setupMoveTool } from "./moveTool";

OBR.onReady(() => {
  setupContextMenu();
  setupMoveTool();
});
