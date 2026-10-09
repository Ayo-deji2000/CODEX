# macOS installation

## Illustrator

Target: Illustrator 2020 (24.0) or newer; compatibility has not been tested inside Illustrator.

1. Extract the complete project folder to a stable location, such as `Documents/Smart-Artboard-Resizer`.
2. Keep `illustrator/` next to `shared/`; the JSX includes `../shared/layout-engine.js`.
3. Open Illustrator and an editable design.
4. Choose **File > Scripts > Other Script…** and open `illustrator/SmartArtboardResizer_Illustrator.jsx`.
5. Choose Analyze, then Preview. Keep the generated artboard or discard it.

You do not need to install into the application bundle or restart Illustrator when using Other Script. Do not copy only the JSX without its shared engine. This implementation is for desktop Illustrator, not Illustrator on iPad or web.

Run the sample generator through the same menu. It creates a new document rather than modifying the active document.

## Photoshop

Target: Photoshop 24.2+ and the Adobe UXP Developer Tool. The panel is a local development plugin, not a signed marketplace or double-click `.ccx` installer.

1. Install Adobe UXP Developer Tool through Creative Cloud.
2. Enable Photoshop's developer mode in its **Plugins** preferences when the installed version requires it; restart Photoshop if prompted.
3. In UXP Developer Tool choose **Add Plugin**, and select `photoshop/manifest.json`.
4. Load the plugin into Photoshop, then open **Plugins > Smart Artboard Resizer**.
5. Use an ordinary layered canvas with **Active canvas**, or select a layer inside a top-level artboard and choose **Selected artboard → separate document**.
6. Analyze, preview, compare the open documents with **Window > Arrange**, then Apply to keep the preview or Cancel to close it without saving.
7. Save kept outputs separately as PSD or PSB. The plugin never saves the source or output automatically.

Keep all files inside `photoshop/` together. No network or filesystem permission is required by the panel. Reload the plugin in Developer Tool after code changes. Use its debugger/console for loading failures and report the Photoshop version plus the exact message.
