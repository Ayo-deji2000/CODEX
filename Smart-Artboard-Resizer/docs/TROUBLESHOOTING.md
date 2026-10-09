# Illustrator screenshot issues — fixed/clarified in 0.1.1

## “The requested property is not available for this type of text frame”

The previous script queried `nextFrame` and `previousFrame` on every text object. Illustrator can reject those properties for point text. Version 0.1.1 never reads either property: point text bypasses threading checks, while area/path stories are rejected if their frame count is greater than one. Text content remains editable; there is no need to outline text to work around this error.

Download and extract the complete updated project folder. Replace BOTH the old JSX and shared engine by using the new folder. In Illustrator choose File > Scripts > Other Script and open the new `illustrator/SmartArtboardResizer_Illustrator.jsx`. Analyze should show `v0.1.1` in its report.

If optional area-text geometry is unavailable, conversion retains proportional frame scaling instead of aborting during shape inspection. If Illustrator rejects a frame-width mutation, the conversion rolls back and suggests Safe Fit.

## Entire poster shrinks inside a white frame

The old default is a 5% safe margin. A whole-page group or overlap-connected composition is kept intact and falls back to Safe Fit rather than having its internal arrangement guessed. This is consistent with the screenshot; the source grouping is not confirmed without the editable file or Analyze report.

In 0.1.1:

1. Run Analyze Design and read the element count and mode/fallback warning.
2. Try Safe margin **0** if the desired result should not have the added inset. This affects positioning and scale, not source artwork.
3. Preview and compare with the original. A5 and the custom format have different aspect ratios; a single intact poster cannot both fill the target and keep all content without cropping or stretching. Zero margin therefore may leave side bands.
4. For actual section reflow, work in a separate copy with the full-page background separate from the foreground and each logical section in its own group. Preserve logo lockups, clipping groups and related image/text arrangements. Do not blindly ungroup everything. Run Smart Reflow and confirm it reports multiple independent sections.

The script does not automatically dismantle whole-page groups or crop the entire foreground poster. A corrected layout for a densely overlapping design needs the actual grouping/geometry, not only a screenshot.

If an issue remains, provide the Illustrator/macOS versions, the Analyze report, and an anonymized editable `.ai` file where possible. The screenshots establish the symptom but cannot establish source object ownership, lock state, text type or paragraph overflow.
