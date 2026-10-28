import path from "path";
import { defineConfig } from "vite";

export default defineConfig(() => ({
    plugins: [],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
    server: {
        host: "0.0.0.0",
        port: 3000,
    },
}));
