# Adobe application acceptance tests

All host tests below are **NOT RUN**. Record actual results rather than inferring them from automated tests.

## Start with Illustrator

1. Install/run as described in INSTALLATION.md.
2. Run `examples/Create_Illustrator_Test_Design.jsx`. Confirm a NEW document opens.
3. Activate `Fixture - A5`, run the resizer, and choose Automatic / Smart Reflow / Active artboard.
4. Analyze: expect several horizontal sections and crop/text review warnings.
5. Preview: expect a custom 259.2 × 324 pt artboard positioned beyond the obstacle artboard. The source remains 419.5276 × 595.2756 pt.
6. Keep it; confirm heading/paragraph text is editable, vectors and logo group are editable, stacking is unchanged, and source objects stay in place. Look for overset area text and changes to font family/style.
7. Activate the converted artboard, run Automatic again, and expect a third A5 layout without modification of either existing version. Its arrangement may differ from the first A5.
8. Repeat with Safe Fit; compare section spacing against Smart Reflow.
9. Run Preview again and Discard. Confirm all preview-only layers/artboards disappear and all pre-existing versions remain.

For Smart Reflow quality verification, provide the Illustrator/macOS version, source and result screenshots at comparable zoom, chosen settings, the Analyze report, and examples of misplaced sections, cropped images, tiny type or overset. An anonymized editable `.ai` file helps reproduce geometric/grouping issues. Automated checks cannot decide whether the composition reads well.

## Photoshop

1. Load the UXP panel using Developer Tool. Confirm the panel renders and the console has no loading errors.
2. Make a layered 1748 × 2480 px ordinary canvas at 300 ppi. Add an unlocked editable heading, a separate paragraph text layer, a Smart Object image, logo group and CTA group; use an ordinary unlocked background layer. Preserve an original saved copy.
3. Analyze Automatic / Smart Reflow / Active canvas. Preview should open a separate unmerged 1080 × 1350 px document at 300 ppi with the same profile.
4. Use Window > Arrange for comparison. Confirm original content, dimensions and positions remain unchanged. Confirm text, shapes and Smart Objects are still editable.
5. Apply should keep the existing preview, not create another document. Save separately as PSD/PSB.
6. Reverse from the new custom document and expect approximately 1748 × 2480 px without changing either prior document.
7. Test native artboards in a document with at least two artboards, including one at negative coordinates. Select a layer INSIDE the intended artboard and choose Selected artboard. Analyze must use that board's dimensions, not the overall document canvas. Preview must extract only that artboard's editable children into a separate ordinary canvas, in original order. Explicitly verify crop origin, background appearance, group effects and no source changes.
8. Preview then Cancel; the generated document closes without saving. Test Escape cancellation during a large conversion and verify the copy closes while the source remains open and unchanged. Force-quit behavior is not guaranteed.

## Matrix to run in BOTH hosts

| Case | Expected result / checks |
|---|---|
| A5 → custom | Correct target physical dimensions / pixel rounding; source untouched |
| Custom → A5 | Correct A5 target; editable copy |
| Reverse conversion | New version; both older versions intact |
| Text-heavy | Content/font/style remain; check small type and overset manually |
| Image-heavy poster | No stretching; linked/Smart Object resources preserved; crop review |
| Logo + typography | Overlap-connected lockup/group preserved; reasonable proportions |
| Grouped vectors | Groups atomic, shapes editable, no flattening |
| Multiple artboards | Illustrator All makes matching outputs; Photoshop repeat selected board separately |
| Locked/hidden | Illustrator skips/report; Photoshop canvas copies unchanged/report; selected extraction blocks |
| Clipping masks | Masked group stays intact; Photoshop ungrouped chain blocks; verify crop |
| Empty | Illustrator can create empty output with warning; Photoshop empty canvas warns / empty artboard blocks |
| Unsupported content | Explainable stop/rollback; unsupported Photoshop transformations close copy |
| Existing artboards right | Illustrator places after obstacle with configured gap; source does not move |
| Repeated conversions | Unique new versions; no overlap of artboard rectangles; no mutation of older artwork |
| Missing images/fonts | Illustrator link stop; both hosts manual font/resource checks |
| Unknown dimensions | Automatic stops; explicit target reports non-preset source |
| Failure/cancellation | Generated artifacts cleaned; original properties unchanged |

For each test record: host version, macOS version, source dimensions/resolution/profile, selected scope, mode, target dimensions, warning text, element count/order, text content/editability, image aspect ratio, margin/collision/crop assessment, original comparison, and outcome (Pass/Fail/Needs manual review).

For exact original preservation, save the source first and compare source item coordinates/bounds, text strings, layer visibility/locks and dimensions before/after. Do not use output appearance alone as evidence of source preservation.
