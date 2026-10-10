# Architecture

## Feasibility choices

Illustrator ExtendScript has the artboard and PageItem operations needed for an MVP. JSX avoids requiring a separate installed extension. ES3 syntax keeps the script compatible with the legacy engine. Artwork belongs to layers/groups rather than artboards, so ownership is explicitly conservative.

Photoshop UXP supplies supported modern asynchronous document/layer transformations and modal transactions. A duplicate-document output preserves source profile, resolution and layer editability without relying on guessed native artboard-resize commands. The selected-artboard variant extracts children only in the copied document. No original layer moves, deletes, saves or canvas edits occur.

The shared engine is application-independent and uses x-right, y-down rectangles in points (Illustrator) or pixels (Photoshop). Adapters handle coordinate mapping and host operations. The plugin has a local copy of the ES3 engine to stay self-contained.

## Deterministic analysis

1. Gather supported root elements with finite, positive bounds. Groups and clip groups stay atomic.
2. Separate likely whole-page backgrounds using a 95%-of-source-width-and-height heuristic.
3. Build connected components using source overlaps; these preserve existing superimposed lockups.
4. Sort components top-to-bottom and left-to-right and merge substantial vertical overlaps into horizontal bands.
5. If fewer than two bands exist, fall back to Safe Fit and report the decision.
6. Allocate 5% target margins. Scale foreground bands uniformly to satisfy both the widest band and the total height with a minimum 2.5% gap. Preserve horizontal relative centers, constrained by safe margins.
7. Redistribute spare vertical space between sections, preserving their internal spacing and column relationships.
8. Widen only isolated simple Illustrator paragraph frames, keeping glyph scaling uniform. Other content aspect ratios stay unchanged.
9. Cover backgrounds uniformly, flag bleed/cropping, compare predicted output boxes to margins, and flag newly introduced foreground overlaps. Existing source overlaps are not considered new errors.

The engine does not mutate its inputs. It produces scale/position plans and human-readable warnings. The source remains available for visual comparison. This is a bounded geometric heuristic rather than semantic layout reconstruction.

## Host transactions

Illustrator analyzes all requested sources before creating anything. It snapshots source indexes, plans placement against existing and proposed artboards, adds new artboards and new layers, and duplicates roots in stacking order. All created layers/artboards are tracked for rollback; originals are not passed to transformation/deletion methods. Coordinate-system state is restored in `finally`.

Photoshop analyzes inside a modal scope, duplicates the source, registers the duplicate for automatic closure on failure, optionally extracts the selected copied artboard, expands the ordinary canvas before transformations, scales/translates copied layers, and resizes to final target pixels. On success auto-close registration is removed. On an error it closes the copy without saving; automatic modal cleanup covers cancelled-command cases. Preview tracking uses document IDs and checks whether the document still exists.

No transaction promises restoration after a host crash. The safety boundary is that destructive operations target tracked copies only.

## Section viewports

Illustrator supplies optional `sectionBackground` metadata for conservative background candidates in Smart Reflow. The shared ES3 planner excludes these candidates from foreground components, combines foreground bands assigned to the same vertical source section, and returns `clip` rectangles alongside proportional-cover geometry. The Illustrator adapter adds editable wrapper clipping groups at the duplicated object's existing stack position. `clip` is not emitted by Photoshop analysis; its adapter behavior is unchanged. Source objects are never moved into wrappers. All wrapper operations participate in existing output-layer/artboard rollback.
