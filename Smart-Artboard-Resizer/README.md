# Smart Artboard Resizer — 0.1.3

Convert A5 portrait (148 × 210 mm) ↔ 3.6 × 4.5 inches using editable copies.

**Status: runnable MVP candidates; Adobe host validation is pending.** Automated geometry and adapter-mock tests pass. Neither Illustrator nor Photoshop was available in the development environment. No design has been visually reviewed inside Adobe applications.

- **Illustrator:** ExtendScript JSX with ScriptUI; creates new artboards to the right, moves around existing artboards, duplicates eligible artwork, preserves groups and clipping relationships, supports active/all artboards or explicitly selected artwork. Unrelated original artwork is untouched.
- **Photoshop:** UXP API v2 panel; converts active ordinary canvases or extracts a selected artboard into a duplicated ordinary document. Uses documented document/layer DOM operations; does not resize native artboard containers or flatten artwork. The selected-artboard extraction path needs particular attention during host testing.
- **Smart Reflow:** deterministic overlap components and horizontal sections, adaptive margins, column/lockup preservation, redistributed vertical spacing, proportional transformations, conservative paragraph-frame widening in Illustrator, collision and crop warnings.
- **Safe Fit:** uniform proportional fitting of foreground artwork. Likely full-frame backgrounds use proportional cover and may extend beyond the destination.

No paid dependencies, remote service, telemetry, publication, or automatic saving.

## Fixes in 0.1.3

- Allows Illustrator PluginItem objects through documented native duplication and proportional transformation, retaining their representation as atomic artwork. No expansion, rasterization or tracing conversion is performed. Plugin-specific native-operation failures roll back all generated items with an object-specific message.

## Fixes in 0.1.1

- Avoids reading unavailable point-text threading properties. Area/path stories are checked via their frame count; threaded stories remain blocked.
- Makes optional paragraph-shape inspection nonfatal.
- Adds an Illustrator safe-margin setting (0–20%) and explicit warnings for whole-page grouped compositions and Safe Fit fallback. Zero margin removes the configured inset; aspect-ratio bands can still remain.
- Includes regression tests reproducing throwing text-frame getters. Read [troubleshooting](docs/TROUBLESHOOTING.md) for the reported screenshot symptoms.

## Start

1. Read [compatibility](docs/COMPATIBILITY.md) and [limitations](docs/KNOWN-LIMITATIONS.md).
2. Follow [macOS installation](docs/INSTALLATION.md).
3. Use **Analyze Design**, review the warnings, then **Preview Conversion**.
4. Compare against the original and keep or discard the copy.
5. Follow the [Adobe test matrix](docs/ADOBE-TESTING.md) before production use.

For Illustrator, first run `examples/Create_Illustrator_Test_Design.jsx`. It creates a new test document with editable text, a logo group, paragraph text, background and an obstacle artboard. An image placeholder is a vector rectangle; replace it with your own placed image to test links and cropping.

## Repository

```text
illustrator/SmartArtboardResizer_Illustrator.jsx
photoshop/{manifest.json,index.html,main.js,adapter.js,layout-engine.js}
shared/layout-engine.js
examples/Create_Illustrator_Test_Design.jsx
tests/{run.js,layout.test.js,illustrator.test.js,photoshop.test.js}
docs/{INSTALLATION.md,USER-GUIDE.md,COMPATIBILITY.md,KNOWN-LIMITATIONS.md,ARCHITECTURE.md,ADOBE-TESTING.md,TEST-RESULTS.md}
```

`photoshop/layout-engine.js` is an identical copy of the shared engine so the plugin can be loaded independently. Keep these copies identical when editing.

## Automated verification

Node.js 18+ (Node 24 used during development):

```sh
npm test
```

No dependency installation is required. Tests cover pure geometry, mock Illustrator execution, mock Photoshop transformations, rollback, preview discard, ownership ambiguity, dimension tolerance, original preservation, artboard extraction and rejection of unsupported inputs. Mocks do not verify Adobe rendering, font behavior, clipping behavior, UXP panel loading or host cancellation.

## Completion boundary

Host visual QA and acceptance remain outstanding. Smart Reflow infers geometric relationships, not design meaning. Reverse conversion creates a new composition and does not guarantee reproduction of the original arrangement. The Photoshop output is a separate canvas document, not another artboard in the same document.

### Illustrator 0.1.3 update

Smart Reflow now has an enabled-by-default edge-to-edge section-background option. Supported background copies use editable proportional-cover clipping groups while foreground margins remain independent. Foreground within a detected section preserves relative positions. See the [user guide](docs/USER-GUIDE.md#edge-to-edge-illustrator-sections-013) for detection and explicit background naming. Verified by 45 automated tests; native Illustrator 2026 appearance checks remain pending.
