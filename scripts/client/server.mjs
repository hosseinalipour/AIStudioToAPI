import express from "express";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const transportHeaders = new Set([
    "connection",
    "content-encoding",
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

// Register the API before either Vite or the production static-file handler.
app.use("/api/gemini", express.raw({ limit: "100mb", type: () => true }), async (req, res) => {
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

        const upstream = await fetch(url, {
            body: !["GET", "HEAD"].includes(req.method) && Buffer.isBuffer(req.body) ? req.body : undefined,
            headers,
            method: req.method,
            redirect: "manual",
            signal: abortController.signal,
        });

        // Build's Nginx can replace HTTP errors with HTML. The client restores this status.
        res.status(upstream.status >= 400 ? 200 : upstream.status);
        upstream.headers.forEach((value, name) => {
            if (!transportHeaders.has(name) && name !== "set-cookie") res.setHeader(name, value);
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
        res.status(200).set("x-aistudio-upstream-status", "502");
        res.json({ error: { code: 502, message: "Gemini upstream connection failed" } });
    }
});

// Keep parser errors inside the same error protocol, including oversized uploads.
app.use("/api/gemini", (error, _req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.status || 500;
    res.status(200).set("x-aistudio-upstream-status", String(status));
    res.json({ error: { code: status, message: error.message } });
});

if (process.env.NODE_ENV === "production" || process.argv.includes("--preview")) {
    app.use(express.static(path.join(root, "dist")));
    app.get("*", (_req, res) => res.sendFile(path.join(root, "dist", "index.html")));
} else {
    const { createServer } = await import("vite");
    const vite = await createServer({
        appType: "spa",
        root,
        server: { middlewareMode: true },
    });
    app.use(vite.middlewares);
}

const server = app.listen(Number(process.env.PORT || 3000), "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${server.address().port} (Gemini server proxy active)`);
});
