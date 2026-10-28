const assert = require("node:assert/strict");
const { test } = require("node:test");
const ConfigLoader = require("../src/utils/ConfigLoader");

const logger = { debug() {}, error() {}, info() {}, warn() {} };

function loadWithAppUrl(value) {
    const previous = process.env.AI_STUDIO_APP_URL;
    try {
        if (value === undefined) delete process.env.AI_STUDIO_APP_URL;
        else process.env.AI_STUDIO_APP_URL = value;
        return new ConfigLoader(logger).loadConfiguration();
    } finally {
        if (previous === undefined) delete process.env.AI_STUDIO_APP_URL;
        else process.env.AI_STUDIO_APP_URL = previous;
    }
}

for (const value of [undefined, "", "   "]) {
    test(`requires an explicit app URL when configured as ${JSON.stringify(value)}`, () => {
        assert.throws(() => loadWithAppUrl(value), /AI_STUDIO_APP_URL is required/);
    });
}

for (const value of [
    "not-a-url",
    "http://ai.studio/apps/my-app",
    "https://example.com/apps/my-app",
    "https://ai.studio/apps/",
    "https://ai.studio/apps/my-app?key=test",
    "https://ai.studio/apps/my-app#preview",
]) {
    test(`rejects invalid app URL without falling back: ${value}`, () => {
        assert.throws(() => loadWithAppUrl(value), /AI_STUDIO_APP_URL is required/);
    });
}

test("uses the explicitly configured app", () => {
    assert.equal(
        loadWithAppUrl("https://ai.studio/apps/my-own-app").aiStudioAppUrl,
        "https://ai.studio/apps/my-own-app"
    );
});

test("normalizes whitespace and trailing slash on the configured app", () => {
    assert.equal(
        loadWithAppUrl("  https://ai.studio/apps/my-own-app/  ").aiStudioAppUrl,
        "https://ai.studio/apps/my-own-app"
    );
});
