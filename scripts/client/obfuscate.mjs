/**
 * File: scripts/client/obfuscate.mjs
 * Description: Lightly obfuscates the client files exported to Google AI Studio.
 * Preserves runtime functionality, console messages, and export/import structure.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JavaScriptObfuscator from "javascript-obfuscator";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = __dirname;
const srcDir = path.join(clientDir, "src");

// Light obfuscation configuration for browser (build.js -> index.ts in AI Studio)
const lightBrowserConfig = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "mangled",
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: false,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 0.75,
    target: "browser",
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
};

// Light obfuscation configuration for Node ESM (server.mjs in AI Studio)
const lightNodeConfig = {
    compact: true,
    controlFlowFlattening: false,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: "mangled",
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: false,
    stringArray: true,
    stringArrayEncoding: ["base64"],
    stringArrayThreshold: 0.75,
    target: "node",
    transformObjectKeys: false,
    unicodeEscapeSequence: false,
};

function obfuscateFile(srcPath, destPath, config, label) {
    if (!fs.existsSync(srcPath)) {
        console.error(`[Error] Source file not found: ${srcPath}`);
        process.exit(1);
    }

    console.log(`[Obfuscator] Reading ${label} from ${path.relative(process.cwd(), srcPath)}...`);
    const sourceCode = fs.readFileSync(srcPath, "utf-8");
    const result = JavaScriptObfuscator.obfuscate(sourceCode, config);
    const obfuscatedCode = result.getObfuscatedCode();

    fs.writeFileSync(destPath, obfuscatedCode, "utf-8");
    const srcSize = Buffer.byteLength(sourceCode, "utf-8");
    const outSize = Buffer.byteLength(obfuscatedCode, "utf-8");
    console.log(
        `[Obfuscator] ✅ Wrote ${label} to ${path.relative(process.cwd(), destPath)} (${srcSize} bytes -> ${outSize} bytes)`
    );
}

console.log("[Obfuscator] Starting light obfuscation for AI Studio client code...\n");

// 1. Obfuscate build.js
obfuscateFile(
    path.join(srcDir, "build.js"),
    path.join(clientDir, "build.js"),
    lightBrowserConfig,
    "build.js (browser)"
);

// 2. Obfuscate server.mjs
obfuscateFile(
    path.join(srcDir, "server.mjs"),
    path.join(clientDir, "server.mjs"),
    lightNodeConfig,
    "server.mjs (node)"
);

console.log("\n[Obfuscator] Done! Lightly obfuscated files are ready in scripts/client/.");
