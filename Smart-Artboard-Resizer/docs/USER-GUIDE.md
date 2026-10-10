# Designer's guide

## Conversion

**Automatic direction** recognizes preset portrait dimensions using a tolerance of approximately 0.02 inches (and at least one unit). A5 becomes custom; custom becomes A5. Landscape orientation is not treated as either preset. For an unknown source, automatic mode stops. Explicit directions choose the target and report the non-preset source.

Illustrator uses 72 points per inch. Photoshop uses the source document resolution and rounds target dimensions to whole pixels. At 300 ppi the custom output is 1080 × 1350 px; A5 is approximately 1748 × 2480 px. Rounding changes physical size slightly. Document ruler units, resolution and color profile are not set by the tool.

## Modes

**Smart Reflow** keeps overlap-connected artwork together, identifies horizontal sections and preserves the columns within each section. It gives the target 5% margins by default (Illustrator allows 0–20%), fits the sections proportionally and distributes remaining vertical space between them. This changes section positions according to the new format rather than merely scaling all original coordinates. Groups are atomic. When fewer than two sections can be confidently identified, it reports a fallback to Safe Fit.

In Illustrator, standalone unthreaded area text with a simple rectangular, unrotated frame can have its frame widened when it occupies its own vertical band. Glyphs are scaled uniformly, and widening the underlying text path changes line breaks without stretching letters. Fonts and overset still need manual review. Grouped, rotated, curved, threaded and multi-column text do not use this frame-widening step. Photoshop text stays editable and scales uniformly; paragraph widths are retained.

**Safe Fit** centers the foreground composition within the safe area using one scale. Full-frame background candidates use proportional cover in both modes; review crop and bleed. A logo drawn across an entire page can be misclassified as a background. Group such content to avoid this simple background heuristic.

## Illustrator workflow

1. Activate the intended source with the Artboard tool.
2. For ambiguous or bleeding artwork, select complete intended objects using the Selection tool, then choose **Selected artwork on active artboard**. Selecting any part of a group promotes selection to the entire group.
3. Run the JSX, choose direction, mode, safe margin percentage (default 5%; 0–20% allowed), and artboard gap in millimetres.
4. **Analyze Design** reports eligible objects, section decisions and warnings. All Artboards snapshots the existing artboard list, so newly created outputs are not recursively converted.
5. **Preview Conversion** creates real editable duplicate artwork on new artboards. A review dialog lets you keep or discard all generated items. The modal review allows visual comparison with the visible artwork; it is not an interactive canvas editor. To zoom/edit, keep the conversion and inspect it in Illustrator.
6. **Apply Conversion** creates the same copies and leaves them for review.

The original artboards and items are never intentionally moved or resized. Generated layers are named `SAR - Converted - …`. Originals remain in their existing layers. New layers consolidate duplicated roots, so original top-level layer hierarchy and layer-level compositing are not reproduced exactly. Check stacking, blending and appearance.

Locked/hidden content, including groups containing such children, is excluded and reported. A background crossing artboard bounds triggers the ownership check; select it explicitly if you intend to include it. Threaded text, missing linked images and unrecognized object types stop the operation with instructions. PluginItem objects are duplicated and transformed as intact native objects; their internals are not reflowed. Analyze warns you to review live appearance and plugin editability. If the originating plugin rejects an operation, conversion rolls back and identifies the item.

## Photoshop workflow

For ordinary PSD/PSB-style canvases, choose **Active canvas**. Root groups remain intact. Ungrouped clipping chains or linked layers are blocked; group all related elements in a separate working copy. Locked, hidden and Background layers stay unchanged in the duplicated canvas and are reported. They may be cropped or misplaced at the target dimensions. Convert a Background layer into an ordinary unlocked layer in your own working copy if it should be repositioned.

For artboards, select a layer inside the intended top-level artboard, and choose **Selected artboard → separate document**. Analysis validates the artboard rectangle from a read-only descriptor. Conversion duplicates the entire document, extracts the copied selected artboard's children, removes other copied roots and the now-empty copied container, crops to the source artboard rectangle, then lays out the ordinary canvas. The original document stays untouched. Missing or unrecognized descriptor geometry stops safely. Locked/hidden content within the selected artboard stops extraction; prepare an unlocked working copy. Empty selected artboards are blocked.

Artboard background settings are not ordinary content layers. Add an explicit background layer if the design relies on the artboard's background color. Layer-level effects inside preserved groups remain; artboard-container effects, metadata and blending are not carried to the extracted canvas.

**Preview Conversion** opens a separate converted document. You can navigate and edit it. **Apply Conversion** keeps the existing preview; it does not re-run the operation. **Cancel / Discard Preview** closes that preview without saving, including any changes made to it. Configuration is disabled while a preview is pending. If you close a preview yourself, the next action clears its tracking. Plugin reload/closing the panel can lose preview tracking; close the generated document manually if you no longer want it.

Without a pending preview, **Apply Conversion** creates a new duplicate and keeps it. To convert multiple Photoshop artboards, repeat selected-artboard conversion for each; batch and multiple selection are not provided. There are no nonfunctional same-document placement or gap controls in the Photoshop panel.

## Review every output

Check target dimensions, readable font sizes, paragraph overset, image crops, layer effects, group integrity, safe margins, stacking and unexpected collisions. Intentional source overlaps are preserved rather than flagged as new collisions. Collision detection uses rectangles, not exact painted outlines. Background bleed is expected and reported.

Reverse conversion creates a further new version. Existing versions remain available; automatic reversal does not restore the exact original positions.

## Edge-to-edge Illustrator sections (0.1.3)

Smart Reflow enables **Edge-to-edge section backgrounds** by default. Foreground margins still default to 5%; they no longer inset detected section backgrounds. The checkbox has no effect in Safe Fit. Photoshop's background detection is unchanged.

Automatic section candidates span the source width (within 2.5% at either edge), cover at least 8% of its height, and are raster/placed images, image-only clipping groups, or simple filled rectangular paths without a stroke. Curved outline frames, text and opaque plugin artwork are not automatically treated as section backgrounds. Review candidates in Analyze Design: a wide photograph can contain important material that should not be cropped.

For an actual background that uses a live plugin or a more complex native group, rename that background root object or group to start with `SAR Background` in a separate working copy. Do not name the pricing frame, cards, a text object or a complete poster this way. Geometry checks still apply. This is an explicit permission to crop the copied object's appearance. Keep whole related section foreground groups intact when their objects cross background section boundaries.

Detected backgrounds receive proportional cover inside new clipping groups; their underlying artwork remains editable. Section foreground objects that fit within the same source background's vertical bounds retain their relative positions, including headings, outlined frames and cards. Background viewports meet between foreground sections and reach the target sides. Existing source stacking is retained by inserting each wrapper at the copied object's position. Overlapping background candidates stop before creating artwork; disable the checkbox or use Safe Fit if the source intentionally has overlapping background decorations.

For the reported pricing-poster case: start from the original artboard, choose Smart Reflow, leave the edge-to-edge checkbox enabled, and Analyze. Confirm that the top and pricing-section background objects are reported. If they are not, identify and name only those background roots as above. Preview and review the frame/title appearance. Original layer-level masks and compositing are still not reproduced by consolidation into an output layer, so this feature does not certify a fix for that separate appearance issue.
