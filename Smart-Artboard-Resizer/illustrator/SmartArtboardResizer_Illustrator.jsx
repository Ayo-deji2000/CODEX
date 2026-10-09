#target illustrator
#include "../shared/layout-engine.js"
/* Smart Artboard Resizer: Illustrator 24+ (host testing pending). */
(function () {
    if(!app.documents.length){alert('Open a design document first.');return;}
    var doc=app.activeDocument,active=doc.artboards.getActiveArtboardIndex(),selection=[],i;
    if(doc.selection)for(i=0;i<doc.selection.length;i++)selection.push(doc.selection[i]);
    function rect(ab){var r=ab.artboardRect;return {x:r[0],y:-r[1],w:r[2]-r[0],h:r[1]-r[3]};}
    function bounds(it){var b=it.visibleBounds;if(it.typename==='GroupItem'&&it.clipped){for(var z=0;z<it.pageItems.length;z++){var mask=it.pageItems[z];if(mask.typename==='PathItem'&&mask.clipping){b=mask.geometricBounds;break;}if(mask.typename==='CompoundPathItem'&&mask.pathItems.length&&mask.pathItems[0].clipping){b=mask.geometricBounds;break;}}}return {x:b[0],y:-b[1],w:b[2]-b[0],h:b[1]-b[3]};}
    function blocked(it){var p=it;while(p&&p!==doc){if(p.locked||p.hidden||(p.typename==='Layer'&&!p.visible))return true;p=p.parent;}return false;}
    function nestedBlocked(it){if(blocked(it))return true; if(it.typename==='GroupItem'){for(var z=0;z<it.pageItems.length;z++)if(nestedBlocked(it.pageItems[z]))return true;}return false;}
    function simpleParagraph(it){try{
        if(it.typename!=='TextFrame'||it.kind!==TextType.AREATEXT)return false;
        var path=it.textPath,pts=path.pathPoints;if(!path.closed||pts.length!==4)return false;
        var minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,z;
        for(z=0;z<4;z++){var a=pts[z].anchor,l=pts[z].leftDirection,r=pts[z].rightDirection;if(Math.abs(a[0]-l[0])+Math.abs(a[1]-l[1])+Math.abs(a[0]-r[0])+Math.abs(a[1]-r[1])>.01)return false;minX=Math.min(minX,a[0]);maxX=Math.max(maxX,a[0]);minY=Math.min(minY,a[1]);maxY=Math.max(maxY,a[1]);}
        for(z=0;z<4;z++){var b=pts[z].anchor;if(Math.min(Math.abs(b[0]-minX),Math.abs(b[0]-maxX))>.01||Math.min(Math.abs(b[1]-minY),Math.abs(b[1]-maxY))>.01)return false;}return true;}catch(e){return false;}
    }
    function contains(a,b){return b.x>=a.x-.5&&b.y>=a.y-.5&&b.x+b.w<=a.x+a.w+.5&&b.y+b.h<=a.y+a.h+.5;}
    function rootItem(it){while(it.parent&&it.parent.typename==='GroupItem')it=it.parent;return it;}
    function has(list,it){for(var n=0;n<list.length;n++)if(list[n]===it)return true;return false;}
    function inspectText(it,issues){if(it.typename==='PluginItem'){issues.push('Plugin-managed artwork kept as one native object: '+(it.name||'unnamed PluginItem')+'. Internal content cannot be analyzed; review its live appearance and plugin editability after conversion.');return;}if(it.typename==='TextFrame'){if(it.kind!==TextType.POINTTEXT){var frames;try{frames=it.story.textFrames.length;}catch(e){throw Error('Cannot verify text threading for '+(it.name||'text frame')+'. Inspect its story in Illustrator before converting.');}if(frames>1)throw Error('Threaded text detected. Convert an unthreaded copy or isolate the complete story first.');}issues.push('Check text overset and fonts manually: '+(it.name||'text frame'));}if(it.typename==='PlacedItem'){try{if(!it.file.exists)throw Error('Missing linked image: '+it.name);}catch(e){throw Error('Resolve linked image before converting: '+it.name);}}if(it.typename==='GroupItem')for(var q=0;q<it.pageItems.length;q++)inspectText(it.pageItems[q],issues);}
    function analyze(index,selected){var src=rect(doc.artboards[index]),roots=[],items=[],issues=[],j,it,b,eligible=[];
        if(selected){for(j=0;j<selection.length;j++){if(!selection[j].typename||selection[j].typename==='TextRange')throw Error('Select complete objects with the Selection tool.');it=rootItem(selection[j]);if(!has(eligible,it))eligible.push(it);}}
        else for(j=0;j<doc.pageItems.length;j++){it=doc.pageItems[j];if(it.parent.typename==='Layer')eligible.push(it);}
        for(j=0;j<eligible.length;j++){it=eligible[j];b=bounds(it);if(!SARLayout.overlap(src,b))continue;
            if(nestedBlocked(it)){issues.push('Locked/hidden item or group skipped: '+(it.name||it.typename));continue;}
            if(!selected&&!contains(src,b))throw Error('Artwork crosses artboard '+(index+1)+'. Select the intended complete objects and use Selected artwork.');
            if(!selected){for(var a=0;a<doc.artboards.length;a++)if(a!==index&&SARLayout.overlap(rect(doc.artboards[a]),b))throw Error('Ambiguous artwork ownership. Use Selected artwork on the active artboard.');}
            if(!/^(PathItem|CompoundPathItem|GroupItem|TextFrame|PlacedItem|RasterItem|SymbolItem|MeshItem|PluginItem)$/.test(it.typename))throw Error('Unsupported '+it.typename+'. Use a separate editable copy with supported artwork.');
            if(b.w<=0||b.h<=0){issues.push('Zero-size item skipped.');continue;}
            inspectText(it,issues);if(it.typename==='GroupItem'&&it.clipped)issues.push('Clipping group preserved; review image crop: '+it.name);b.background=it.typename!=='PluginItem'&&it.typename!=='GroupItem'&&it.typename!=='TextFrame'&&b.w>=src.w*.95&&b.h>=src.h*.95;
            if(it.typename==='TextFrame'){b.areaText=simpleParagraph(it);try{b.fontSize=it.textRange.characterAttributes.size;}catch(e){}}
            b.x-=src.x;b.y-=src.y;items.push(b);roots.push(it);
        }
        if(items.length===1&&roots[0].typename==='GroupItem'&&items[0].w>=src.w*.9&&items[0].h>=src.h*.9)issues.push('The page is one large group. It will stay intact; Smart Reflow cannot rearrange its internal sections. Use a separate working copy with independent section groups and a separate background to reflow it.');
        if(!items.length)issues.push('No eligible visible, unlocked artwork. Empty destination will be created.');
        return {src:src,roots:roots,items:items,issues:issues,index:index};
    }
    var win=new Window('dialog','Smart Artboard Resizer');win.orientation='column';win.alignChildren='fill';
    win.add('statictext',undefined,'Editable copies on new artboards. Originals are always preserved.');
    var dir=win.add('dropdownlist',undefined,['Automatic direction','A5 -> 3.6 x 4.5 in','3.6 x 4.5 in -> A5']);dir.selection=0;
    var mode=win.add('dropdownlist',undefined,['Smart Reflow','Safe Fit']);mode.selection=0;
    var scope=win.add('dropdownlist',undefined,['Active artboard','All artboards','Selected artwork on active artboard']);scope.selection=0;
    var marginGroup=win.add('group');marginGroup.add('statictext',undefined,'Safe margin (% of shorter edge)');var margin=marginGroup.add('edittext',undefined,'5');margin.characters=6;
    var gapGroup=win.add('group');gapGroup.add('statictext',undefined,'Artboard gap (mm)');var gap=gapGroup.add('edittext',undefined,'10');gap.characters=6;
    win.add('statictext',undefined,'Aspect ratios, editable text and styles preserved. Locked/hidden items skipped.');
    var report=win.add('edittext',undefined,'Analyze to review ownership, sections and warnings.',{multiline:true,readonly:true,scrolling:true});report.preferredSize=[520,220];
    var actions=win.add('group'),check=actions.add('button',undefined,'Analyze Design'),preview=actions.add('button',undefined,'Preview Conversion'),apply=actions.add('button',undefined,'Apply Conversion'),cancel=actions.add('button',undefined,'Cancel',{name:'cancel'}),action=null;
    function plans(){var cs=app.coordinateSystem;app.coordinateSystem=CoordinateSystem.DOCUMENTCOORDINATESYSTEM;try{var result=[],indexes=[],count=doc.artboards.length,existing=[],j;
        if(scope.selection.index===1)for(j=0;j<count;j++)indexes.push(j);else indexes.push(active);
        for(j=0;j<count;j++)existing.push(rect(doc.artboards[j]));
        var marginPercent=Number(margin.text);if(!isFinite(marginPercent)||marginPercent<0||marginPercent>20)throw Error('Enter a safe margin from 0 to 20 percent.');
        var gapPt=Number(gap.text)*72/25.4;if(!isFinite(gapPt)||gapPt<0)throw Error('Enter a non-negative gap in millimetres.');
        for(j=0;j<indexes.length;j++){var a=analyze(indexes[j],scope.selection.index===2),target=SARLayout.target(a.src.w,a.src.h,72,dir.selection.index);if(SARLayout.detect(a.src.w,a.src.h,72)<0)a.issues.push('Non-preset source; explicit target used.');a.target=target;a.layout=SARLayout.plan(a.items,{x:0,y:0,w:a.src.w,h:a.src.h},{x:0,y:0,w:target.w,h:target.h},mode.selection.index===0?'smart':'safe',{marginRatio:marginPercent/100});a.dest=SARLayout.rightOf(a.src,existing,target.w,target.h,gapPt);existing.push(a.dest);result.push(a);}
        return result;}finally{app.coordinateSystem=cs;}
    }
    function display(ps){var lines=[];for(var j=0;j<ps.length;j++){var p=ps[j];lines.push('v0.1.2 | Artboard '+(p.index+1)+' -> '+p.target.name+'; '+p.items.length+' elements; '+p.layout.mode);lines=lines.concat(p.issues,p.layout.warnings);}return lines.join('\n');}
    check.onClick=function(){try{report.text=display(plans());}catch(e){report.text=e.message;}};
    preview.onClick=function(){action='preview';win.close(1);};apply.onClick=function(){action='apply';win.close(1);};
    if(win.show()!==1||!action)return;
    var created=[],layers=[],savedIndex=active,oldCS=app.coordinateSystem;
    function rollback(){var errors=[];for(var j=layers.length-1;j>=0;j--)try{layers[j].remove();}catch(e){errors.push('Could not remove temporary layer.');}for(var k=created.length-1;k>=0;k--)try{created[k].remove();}catch(e){errors.push('Could not remove temporary artboard.');}try{doc.artboards.setActiveArtboardIndex(savedIndex);}catch(e){}if(errors.length)alert(errors.join('\n')+' Remove only SAR-generated items manually.');}
    try {
        app.coordinateSystem=CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
        var ps=plans(),message=display(ps);
        if(!confirm(message+'\n\nContinue with duplicated artwork? Cancel leaves the document unchanged.'))return;
        for(i=0;i<ps.length;i++){var p=ps[i],d=p.dest,ab=doc.artboards.add([d.x,-d.y,d.x+d.w,-d.y-d.h]);created.push(ab);ab.name='Converted - '+p.target.name+' ('+(p.index+1)+')';
            var container=doc.layers.add();layers.push(container);container.name='SAR - '+ab.name;
            // Duplicate in reverse collection order and insert at beginning: original front-to-back order.
            for(var j=p.roots.length-1;j>=0;j--){
                var sourceItem=p.roots[j],o=p.layout.items[j],stage='duplicate';
                try{var copy=sourceItem.duplicate(container,ElementPlacement.PLACEATBEGINNING);stage='scale';copy.resize(o.scale*100,o.scale*100,true,true,true,true,o.scale*100,Transformation.TOPLEFT);
                    if(o.reflowWidth&&copy.typename==='TextFrame'){stage='widen the paragraph frame for';try{copy.textPath.width=o.reflowWidth;}catch(e){throw Error('Illustrator could not widen paragraph '+(copy.name||'text frame')+'. Retry in Safe Fit to keep the existing frame geometry.');}}
                    stage='position';var cb=bounds(copy);copy.translate(d.x+o.x-cb.x,-(d.y+o.y-cb.y));
                }catch(e){var advice=sourceItem.typename==='PluginItem'?' The plugin-managed object rejected a native operation. Check the originating plugin; do not expand or rasterize the original to bypass this.':'';throw Error('Could not '+stage+' '+sourceItem.typename+' '+(sourceItem.name||'(unnamed)')+'. '+(e.message||String(e))+advice);}
            }
        }
        app.redraw();doc.artboards.setActiveArtboardIndex(doc.artboards.length-1);
        if(action==='preview'){var review=new Window('dialog','Review converted artwork');review.add('statictext',undefined,'Review the new artboard(s). Keep or discard all generated copies.');var g=review.add('group');g.add('button',undefined,'Keep Conversion',{name:'ok'});g.add('button',undefined,'Discard Preview',{name:'cancel'});if(review.show()!==1)rollback();}
        else alert('Conversion created. Review text, crops, layer blending and reported warnings.\n'+message);
    } catch(e){rollback();alert('Conversion stopped; original artwork was preserved.\n'+e.message);}
    finally {app.coordinateSystem=oldCS;}
}());
