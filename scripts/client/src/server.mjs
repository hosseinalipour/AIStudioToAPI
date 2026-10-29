import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { createServer, preview } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const transportHeaders = new Set([
    "connection",
    "content-length",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
]);

function installGeminiProxy(server) {
    server.middlewares.use("/api/gemini", async (req, res) => {
        const abortController = new AbortController();
        res.on("close", () => {
            if (!res.writableEnded) abortController.abort();
        });

        try {
            const url = new URL("https://generativelanguage.googleapis.com" + req.url);
            url.searchParams.delete("key");
            const headers = new Headers();
            for (const [name, value] of Object.entries(req.headers)) {
                if (
                    transportHeaders.has(name) ||
                    ["authorization", "x-api-key", "x-goog-api-key", "cookie", "origin", "referer"].includes(name)
                ) {
                    continue;
                }
                if (value !== undefined) headers.set(name, String(value));
            }
            headers.set("user-agent", "aistudio-build");
            if (process.env.GEMINI_API_KEY) headers.set("x-goog-api-key", process.env.GEMINI_API_KEY);

            let body;
            if (!["GET", "HEAD"].includes(req.method)) {
                const chunks = [];
                let size = 0;
                for await (const chunk of req) {
                    size += chunk.length;
                    if (size > 100 * 1024 * 1024) {
                        throw Object.assign(new Error("Request body exceeds 100 MB"), { status: 413 });
                    }
                    chunks.push(chunk);
                }
                body = Buffer.concat(chunks);
            }

            const upstream = await fetch(url, {
                body,
                headers,
                method: req.method,
                redirect: "manual",
                signal: abortController.signal,
            });
            res.statusCode = upstream.status >= 400 ? 200 : upstream.status;
            upstream.headers.forEach((value, name) => {
                // Fetch has already decompressed the response body.
                if (!transportHeaders.has(name) && !["content-encoding", "set-cookie"].includes(name)) {
                    res.setHeader(name, value);
                }
            });
            res.setHeader("x-aistudio-upstream-status", String(upstream.status));
            res.setHeader("x-accel-buffering", "no");
            if (upstream.body) {
                await pipeline(Readable.fromWeb(upstream.body), res, { signal: abortController.signal });
            } else {
                res.end();
            }
        } catch (error) {
            if (abortController.signal.aborted || res.destroyed) return;
            if (res.headersSent) {
                res.destroy(error);
                return;
            }
            const status = error.status || 502;
            res.writeHead(200, {
                "content-type": "application/json",
                "x-aistudio-upstream-status": String(status),
            });
            res.end(JSON.stringify({ error: { code: status, message: error.message } }));
        }
    });
    console.info("[GeminiProxy] native fetch route ready");
}

const port = Number(process.env.PORT || 3000);
const options = {
    configFile: false,
    plugins: [
        {
            configurePreviewServer: installGeminiProxy,
            configureServer: installGeminiProxy,
            name: "gemini-api-proxy",
        },
    ],
    preview: { host: "0.0.0.0", port },
    resolve: { alias: { "@": root } },
    root,
    server: { host: "0.0.0.0", port },
};

if (process.argv.includes("--preview")) {
    const server = await preview(options);
    server.printUrls();
} else {
    const server = await createServer(options);
    await server.listen();
    server.printUrls();
}
