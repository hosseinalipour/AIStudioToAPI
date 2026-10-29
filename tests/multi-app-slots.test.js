const assert = require("node:assert/strict");
const { test } = require("node:test");
const AuthSource = require("../src/auth/AuthSource");
const BrowserManager = require("../src/core/BrowserManager");

const dummyLogger = {
    debug() {},
    error() {},
    info() {},
    warn() {},
};

test("creates virtual account slots for each App URL when multiple URLs are configured", () => {
    const config = {
        aiStudioAppUrl: "https://ai.studio/apps/app-1",
        aiStudioAppUrls: [
            "https://ai.studio/apps/app-1",
            "https://ai.studio/apps/app-2",
            "https://ai.studio/apps/app-3",
        ],
        maxContexts: 2,
    };

    const authSource = new AuthSource(dummyLogger, config);

    // If an auth file exists (e.g. auth-0.json in configs/auth/), slots should be expanded
    if (authSource.availableIndices.length > 0) {
        assert.equal(authSource.availableIndices.length >= 3, true);
        assert.deepEqual(authSource.getRotationIndices().slice(0, 3), [0, 1, 2]);

        const auth0 = authSource.getAuth(0);
        const auth1 = authSource.getAuth(1);
        const auth2 = authSource.getAuth(2);

        assert.ok(auth0, "Slot #0 has auth data");
        assert.ok(auth1, "Slot #1 has fallback auth data");
        assert.ok(auth2, "Slot #2 has fallback auth data");

        assert.equal(authSource.accountNameMap.get(0).includes("Slot #0"), true);
        assert.equal(authSource.accountNameMap.get(1).includes("Slot #1"), true);
        assert.equal(authSource.accountNameMap.get(2).includes("Slot #2"), true);
    }
});

test("BrowserManager resolves target URL per slot index correctly", () => {
    const config = {
        aiStudioAppUrl: "https://ai.studio/apps/app-1",
        aiStudioAppUrls: [
            "https://ai.studio/apps/app-1",
            "https://ai.studio/apps/app-2",
            "https://ai.studio/apps/app-3",
        ],
        maxContexts: 2,
    };

    const authSource = new AuthSource(dummyLogger, config);
    const browserManager = new BrowserManager(dummyLogger, config, authSource);

    assert.equal(browserManager.getTargetUrlForAuth(0), "https://ai.studio/apps/app-1");
    assert.equal(browserManager.getTargetUrlForAuth(1), "https://ai.studio/apps/app-2");
    assert.equal(browserManager.getTargetUrlForAuth(2), "https://ai.studio/apps/app-3");
    // Cycles if index exceeds
    assert.equal(browserManager.getTargetUrlForAuth(3), "https://ai.studio/apps/app-1");
    // Fallback when null
    assert.equal(browserManager.getTargetUrlForAuth(null), "https://ai.studio/apps/app-1");
});
