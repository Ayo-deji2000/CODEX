const L=require('./layout-engine.js');
function rect(layer) { const b=layer.bounds; return {x:b.left,y:b.top,w:b.right-b.left,h:b.bottom-b.top}; }
function blocked(layer){if(!layer.visible||layer.locked||layer.isBackgroundLayer)return true;const children=layer.layers;if(children)for(const c of children)if(blocked(c))return true;return false;}
function checkRelationships(layer){if(layer.isClippingMask)throw Error('Ungrouped clipping chain: '+layer.name+'. Put the complete clipping chain in a group.');if(layer.linkedLayers&&layer.linkedLayers.length)throw Error('Linked layers: '+layer.name+'. Group the linked design elements before converting.');}
async function analyze(ps,doc,direction,mode,scope='canvas'){
    if(!doc)throw Error('Open a layered document first.');
    if(!doc.width||!doc.height||!doc.resolution)throw Error('Unsupported document geometry.');
    const warnings=[],items=[],layers=[];
    let source={x:0,y:0,w:doc.width,h:doc.height}, sourceLayers=Array.from(doc.layers), artboardIndex=-1;
    const descriptors=[];
    for(const layer of doc.layers){
        const [d]=await ps.action.batchPlay([{_obj:'get',_target:[{_ref:'layer',_id:layer.id},{_ref:'document',_id:doc.id}],_options:{dialogOptions:'dontDisplay'}}],{});
        if(!d||d._obj==='error')throw Error('Cannot inspect layer '+layer.name+'.');
        descriptors.push(d);
    }
    const hasArtboards=descriptors.some(d=>d.artboardEnabled||d.artboard);
    if(hasArtboards){
        if(scope!=='artboard')throw Error('Artboard document detected. Choose Selected artboard and select a layer inside the intended artboard.');
        if(!doc.activeLayers||!doc.activeLayers.length)throw Error('Select a layer inside the intended artboard.');
        let chosen=doc.activeLayers[0];while(chosen.parent)chosen=chosen.parent;
        artboardIndex=sourceLayers.findIndex(l=>l.id===chosen.id);
        const descriptor=descriptors[artboardIndex];
        if(!descriptor||!(descriptor.artboardEnabled||descriptor.artboard))throw Error('Selected layer does not belong to a top-level artboard.');
        const r=descriptor.artboard&&descriptor.artboard.artboardRect;
        function num(v){return typeof v==='number'?v:v&&v._value;}
        if(!r)throw Error('This Photoshop version did not expose an artboard rectangle. Prepare an ordinary canvas instead.');
        const x=num(r.left),y=num(r.top),right=num(r.right),bottom=num(r.bottom);
        if(!Number.isFinite(x+y+right+bottom)||right<=x||bottom<=y)throw Error('Unsupported artboard rectangle. Source was not changed.');
        source={x,y,w:right-x,h:bottom-y};
        if(blocked(chosen))throw Error('Selected artboard contains locked/hidden content. Prepare an unlocked working copy before extracting this artboard.');
        sourceLayers=Array.from(chosen.layers||[]);
        if(!sourceLayers.length)throw Error('Selected artboard is empty. Add an editable layer before converting.');
        warnings.push('Selected artboard will be extracted from a duplicate into a separate ordinary canvas. Other copied artboards are removed. Artboard-only background settings are not layers; add an explicit background layer if required.');
    }else if(scope==='artboard')throw Error('No artboard found. Choose Active canvas.');
    const target=L.target(source.w,source.h,doc.resolution,direction);
    target.w=Math.round(target.w);target.h=Math.round(target.h);
    if(L.detect(source.w,source.h,doc.resolution)<0)warnings.push('Non-preset source; explicit target used.');
    for(const layer of sourceLayers){
        checkRelationships(layer);
        if(blocked(layer)){warnings.push('Unchanged locked/hidden/background layer or group: '+layer.name+'. Check crop and placement in the copy.');continue;}
        const b=rect(layer);if(b.w<=0||b.h<=0){warnings.push('Empty/adjustment layer unchanged: '+layer.name+'. Group adjustments with their artwork.');continue;}
        if(!Number.isFinite(b.x+b.y+b.w+b.h))throw Error('Unsupported bounds: '+layer.name);
        b.background=layer.kind!==ps.constants.LayerKind.TEXT && !(layer.layers&&layer.layers.length) && b.w>=source.w*.95 && b.h>=source.h*.95;
        if(layer.kind===ps.constants.LayerKind.TEXT){warnings.push('Review font size and overset text: '+layer.name+'. Text stays editable; paragraph width is not changed.');}
        b.x-=source.x;b.y-=source.y;layers.push(layer);items.push(b);
    }
    if(!layers.length)warnings.push('No movable content. Converted copy contains unchanged layers only.');
    return {source,target,items,layers,sourceLayers,artboardIndex,layout:L.plan(items,{x:0,y:0,w:source.w,h:source.h},target,mode),warnings};
}
async function convert(ps,source,analysis,ctx,name){
    let copy=null,autoClose=false;
    try {
        if(ctx.isCancelled)throw Error('Conversion cancelled.');
        copy=await source.duplicate(name,false);
        if(ctx.hostControl){await ctx.hostControl.registerAutoCloseDocument(copy.id);autoClose=true;}
        let roots=Array.from(copy.layers);
        if(analysis.artboardIndex>=0){
            const artboard=roots[analysis.artboardIndex],children=Array.from(artboard.layers),beforeAnchor=rect(children[0]);
            for(const child of children)await child.move(artboard,ps.constants.ElementPlacement.PLACEBEFORE);
            for(const root of roots)await root.delete();
            // The copied artboard container is now empty. All source document layers are untouched.
            roots=children;
            const r=analysis.source,afterAnchor=rect(children[0]),dx=afterAnchor.x-beforeAnchor.x,dy=afterAnchor.y-beforeAnchor.y;
            await copy.crop({left:r.x+dx,top:r.y+dy,right:r.x+r.w+dx,bottom:r.y+r.h+dy});
        }
        const sourceRoots=analysis.sourceLayers;
        // Grow first: transformations must not clip pixels while changing format.
        await copy.resizeCanvas(Math.max(copy.width,analysis.target.w),Math.max(copy.height,analysis.target.h),ps.constants.AnchorPosition.TOPLEFT);
        for(let i=0;i<analysis.layers.length;i++){
            if(ctx.isCancelled)throw Error('Conversion cancelled.');
            const index=sourceRoots.findIndex(l=>l.id===analysis.layers[i].id),layer=roots[index],o=analysis.layout.items[i];
            if(!layer)throw Error('Duplicated layer hierarchy did not match.');
            await layer.scale(o.scale*100,o.scale*100,ps.constants.AnchorPosition.TOPLEFT);
            const b=rect(layer);await layer.translate(o.x-b.x,o.y-b.y);
        }
        await copy.resizeCanvas(analysis.target.w,analysis.target.h,ps.constants.AnchorPosition.TOPLEFT);
        if(ctx.isCancelled)throw Error('Conversion cancelled.');
        if(autoClose){await ctx.hostControl.unregisterAutoCloseDocument(copy.id);autoClose=false;}
        return copy;
    }catch(e){if(copy){try{await copy.close(ps.constants.SaveOptions.DONOTSAVECHANGES);}catch(cleanup){if(!autoClose)throw Error(e.message+' Cleanup failed: close the generated copy without saving. Source is untouched.');}}throw e;}
}
module.exports={analyze,convert,rect,blocked};
