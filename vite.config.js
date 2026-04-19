import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, "background.html"),
        action: resolve(__dirname, "action.html"),
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  // Vite serves from root during dev; point pages at root-level HTML
  root: ".",
  publicDir: "public",
});
