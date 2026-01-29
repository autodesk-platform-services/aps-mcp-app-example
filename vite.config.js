import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
    plugins: [viteSingleFile()],
    build: {
        sourcemap: "inline",
        rollupOptions: {
            input: "./viewer.html",
        },
        outDir: "./dist",
        emptyOutDir: false,
    },
});
