# Compatibility and API verification

Research date: 9 October 2026. Application execution/visual validation: **not performed**.

| Component | Target floor | Architecture | Verification status |
|---|---|---|---|
| Illustrator | 2020 / 24.0 | ExtendScript ES3 + ScriptUI | Documented API review, ES3 parsing, geometry and adapter mocks; actual host testing pending |
| Photoshop | 24.2 | UXP manifest v5, Photoshop API v2 | Adobe DOM/API review, syntax checks and adapter mocks; plugin loading and actual host testing pending |
| Automated tests | Node 18+ | Built-in test/assert, no dependencies | Node 24 executed |

These are implementation targets, not a claim that all versions above these floors have been certified. Verify your installed macOS and Adobe versions using ADOBE-TESTING.md. Later Adobe versions can change behavior. No support is claimed for mobile/web editions.

## Illustrator

The implementation uses `Document.artboards`, `Artboards.getActiveArtboardIndex()`, `setActiveArtboardIndex()`, `add()`, `Artboard.artboardRect`, `Document.pageItems`, PageItem `duplicate()`, `resize()`, `translate()`, `visibleBounds`, `geometricBounds`, root layers and ScriptUI controls. No supposed artboard `duplicate()` method is used: a new artboard is added and objects are duplicated independently. The resize arguments include the numeric line-width scaling percentage, not a Boolean. Coordinate-system state is restored.

The Adobe JavaScript reference confirms these legacy operations. The maintained Illustrator guide is a community rendering of the Adobe scripting reference, not a first-party SDK or a host execution test.

Sources:
- [Adobe Illustrator JavaScript scripting reference PDF, hosted on Adobe Community](https://community.adobe.com/havfw69955/attachments/havfw69955/illustrator/426671/1/Illustrator%20JavaScript%20Scripting%20Reference.pdf)
- [Artboards reference](https://ai-scripting.docsforadobe.dev/jsobjref/Artboards/)
- [PageItem reference](https://ai-scripting.docsforadobe.dev/jsobjref/PageItem/)
- [TextFrameItem reference](https://ai-scripting.docsforadobe.dev/jsobjref/TextFrameItem/)
- [TextPath reference](https://ai-scripting.docsforadobe.dev/jsobjref/TextPath/)

## Photoshop

The panel uses Adobe-documented `Document.duplicate(name, false)`, `resizeCanvas(width, height, anchor)`, `crop(bounds)`, `close(SaveOptions.DONOTSAVECHANGES)`, Layer `scale()`, `translate()`, `move()` and `delete()`, and the `bounds`, `layers`, `locked`, `visible`, `isClippingMask`, `linkedLayers`, `isBackgroundLayer`, and `id` properties. These document/layer operations are documented with minimum versions of 23.0 or earlier. The plugin sets a conservative floor of 24.2. Mutations run inside `core.executeAsModal` and register generated documents for automatic closure on cancellation/failure until conversion succeeds.

`batchPlay` is used only to read layer descriptors with explicit document/layer IDs. It is not used to invent artboard mutation commands. The selected-artboard path consumes `artboardEnabled` and `artboard.artboardRect` only when the descriptor supplies valid numeric/unit-valued coordinates. These are Action Manager descriptor fields, rather than a guaranteed artboard DOM class. Their presence is checked at runtime. Descriptor inspection and the extraction workflow still require host validation on the actual version.

Sources:
- [Adobe UXP Document API](https://developer.adobe.com/photoshop/uxp/ps_reference/classes/document/)
- [Adobe UXP Layer API](https://developer.adobe.com/photoshop/uxp/ps_reference/classes/layer/)
- [Adobe executeAsModal and cancellation](https://developer.adobe.com/photoshop/uxp/2022/ps-reference/media/executeasmodal)
- [Adobe batchPlay reference](https://developer.adobe.com/photoshop/uxp/ps_reference/media/batchplay/)
- [Adobe developer forum: reading artboardEnabled with explicit layer IDs](https://forums.creativeclouddeveloper.com/t/api-extension-batchplay-and-artboardenabled/2671)
- [Adobe Community: artboard rectangle descriptor discussion](https://community.adobe.com/questions-712/how-to-get-artboard-properties-in-photoshop-cc-2015-1101343)

No assumption is made that Illustrator and Photoshop share artboard APIs. Photoshop outputs ordinary duplicate documents. The tools do not set document units, raster resolution or color profiles.
