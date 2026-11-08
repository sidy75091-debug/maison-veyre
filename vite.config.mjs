import { defineConfig } from "vite";
export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("/three/build/three.core")) return "three-core";
          if (id.includes("/three/build/three.module")) return "three-renderer";
        }
      }
    },
    chunkSizeWarningLimit: 650
  },
  esbuild: { jsx: "automatic" }
});
