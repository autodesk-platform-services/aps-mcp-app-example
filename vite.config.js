import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
    root: "./ui",
    plugins: [viteSingleFile()],
    build: {
        rollupOptions: {
            input: "./ui/viewer.html",
        },
        outDir: "../dist",
        emptyOutDir: false,
    },
});
