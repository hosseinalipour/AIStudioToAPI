# Create an AI Studio App from Blank

This guide creates an AI Studio App for AIStudioToAPI and obtains the link required by `AI_STUDIO_APP_URL`. Each deployment needs an App you created.

## 1. Open the blank App

Sign in to your Google account and open the [AI Studio blank App](https://aistudio.google.com/apps/bundled/blank).

Click **Remix** in the upper-right corner.

![Click Remix in the upper-right corner](../assets/ai-studio-app/01-remix.png)

## 2. Create your copy

Enter an **App name** in the dialog, update the **Description** if needed, then click **Remix app** in the lower-right corner.

![Enter a name and click Remix app](../assets/ai-studio-app/02-remix-dialog.png)

Wait for the copy to be created. When your App name appears at the top, click **Code** above the preview area to open the code editor.

![Click Code to open the editor](../assets/ai-studio-app/03-code.png)

## 3. Copy four files

In the AI Studio App root directory, copy the complete contents of these files from the current repository version:

| Repository file                                                    | App file       | Action                                         |
| ------------------------------------------------------------------ | -------------- | ---------------------------------------------- |
| [`scripts/client/build.js`](../../scripts/client/build.js)         | `index.ts`     | Replace the complete contents                  |
| [`scripts/client/index.html`](../../scripts/client/index.html)     | `index.html`   | Replace the complete contents                  |
| [`scripts/client/server.mjs`](../../scripts/client/server.mjs)     | `server.mjs`   | Create the file and copy the complete contents |
| [`scripts/client/package.json`](../../scripts/client/package.json) | `package.json` | Replace the complete contents                  |

`server.mjs` starts the page service and forwards Gemini requests. `package.json` supplies the matching startup commands and dependencies.

Keep the other blank-template files, including `vite.config.ts`, `tsconfig.json`, `index.css`, `.gitignore`, `.env.local`, and `README.md`.

## 4. Configure metadata.json and the API key

Open the App's existing `metadata.json` and replace the empty `majorCapabilities` array with:

```json
["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
```

Keep your App name, description, and `requestFramePermissions`. The complete file should follow this structure, with no comma after the last field:

```json
{
  "name": "My AIStudioToAPI",
  "description": "My AI Studio app for AIStudioToAPI",
  "requestFramePermissions": [],
  "majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]
}
```

In AI Studio's **Settings → Secrets**, confirm that a valid `GEMINI_API_KEY` is configured. The App reads the key from the server-side environment; keep the key in Secrets.

Save every file and restart the App, then continue with access permissions and the App link.

## 5. Set access permissions and copy the link

Click **Share** in the upper-right corner and ensure that the Google account running AIStudioToAPI has access to the App.

To let multiple accounts access it through a public link:

1. Under **General access**, select **Public: Anyone with the link can view**.
2. Click **Copy link** at the bottom of the sharing panel.

![Set access to Public and copy the link](../assets/ai-studio-app/05-share.png)

If the accounts already have access, keep the existing permissions and copy the App link. It should look like:

```text
https://ai.studio/apps/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

> Shared-App calls count toward the usage limits of the key configured for the App. Check the access scope before sharing publicly. See the [official AI Studio guide](https://ai.google.dev/gemini-api/docs/aistudio-build-mode).

## 6. Configure AIStudioToAPI and verify

Return to the project running AIStudioToAPI and set the environment variable to the complete link you copied:

```env
AI_STUDIO_APP_URL=https://ai.studio/apps/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

- For `npm start`, add it to `.env` in the project root.
- For `npm run dev`, add it to `.env.development` in the project root.
- For Docker, set the environment variable on the container.

Restart AIStudioToAPI after saving. Confirm that the `AI Studio App URL` entry in its startup log shows your App address.

Finally, send a request through your API client and confirm that the model reply can be received and parsed. Setup is complete.
