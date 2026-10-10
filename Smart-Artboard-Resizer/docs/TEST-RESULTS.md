# Available verification — 10 October 2026

- Node.js 24.19.0: **45 automated tests passed**, no skipped tests.
- Geometry tests include 150 seeded randomized scenes in both modes (300 layout plans), both preset directions, reverse conversion, column preservation, overlapping lockups, margin containment, aspect-ratio invariants, conservative paragraph widening, unknown dimensions, placement obstacles and repeated conversions.
- Illustrator adapter executed in a JavaScript VM with a small mocked Adobe DOM: target dimensions, original preservation, duplicated root stacking order, locked-item exclusion, ownership rejection, failed-duplication rollback and preview discard passed.
- Photoshop adapter executed with mocked UXP document/layer operations: duplicate canvases, resolution preservation, original preservation, failed-transform cleanup, cancellation before duplication, locked/hidden retention, clipping/linked rejection, selected-artboard extraction, malformed rectangles and locked-artboard rejection passed.
- Static JavaScript syntax checks were performed for the UXP files. Illustrator/shared code was parsed as ECMAScript 3 after stripping Adobe preprocessor directives (recorded in build validation).
- The plugin engine and shared engine are byte-identical.

**Not tested:** Illustrator execution, Photoshop execution, UXP panel installation/rendering, Adobe font metrics/overset, actual raster resampling, native effects/clipping, original-to-output visual quality, artboard descriptor behavior in the target Photoshop release, and cancellation during actual host commands. All Adobe matrix entries remain NOT RUN.

The tests validate algorithmic invariants and adapter intent; they do not certify Adobe compatibility or visual quality.

## Reported host feedback and regression fixes

The user supplied Illustrator screenshots showing a converted layout fitted inside white margins and a subsequent text-frame property error. These are user-observed results from the prior build, not assistant-run host tests. The text error is reproduced with throwing point-text `nextFrame`/`previousFrame` getters in the mock. Version 0.1.1 avoids both getters entirely and uses text kind plus area/path story frame counts. Regressions cover point, area and path text, optional unavailable text-path geometry, and preservation of the threaded-story guard. Zero-margin aspect-ratio fitting and invalid margin inputs are also tested.

The later v0.1.2 report confirms Smart Reflow produced three sections; that reported conversion did not use the Safe Fit fallback. The exact native appearance cause remains unverified.

Version 0.1.2 adds three PluginItem adapter regressions: native representation/metadata is retained, nested PluginItems are reported within intact groups, and a rejected native transform removes every generated artifact without changing originals. These are mocks, not native third-party-plugin execution tests.

Version 0.1.3 adds ten regressions for edge-to-edge section viewport coverage, uniform background aspect ratio, preservation of title/frame/card relative positions, reverse targets and empty sections, ambiguous background rejection, editable native wrappers at the correct stack position, explicit plugin-background opt-in, clipping-operation rollback, image-only clipping groups and curved-frame exclusion. Tests use synthetic data; no user design is in the project or ZIP. Ghostscript rendering of the private source EPS is a source inspection, not an Illustrator conversion test.
