import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: "examples",
  build: {
    outDir: "../dist-example",
  },
  resolve: {
    alias: {
      "react-xword": path.resolve(__dirname, "./src"),
    },
  },
});
