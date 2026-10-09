/* ES3-compatible pure geometry. Coordinates: x right, y down. */
var SARLayout = (function () {
    function finite(n) { return typeof n === 'number' && isFinite(n); }
    function box(b) { return b && finite(b.x) && finite(b.y) && finite(b.w) && finite(b.h) && b.w > 0 && b.h > 0; }
    function overlap(a,b) { return Math.min(a.x+a.w,b.x+b.w)>Math.max(a.x,b.x)+0.01 && Math.min(a.y+a.h,b.y+b.h)>Math.max(a.y,b.y)+0.01; }
    function union(a,b) { var x=Math.min(a.x,b.x), y=Math.min(a.y,b.y); return {x:x,y:y,w:Math.max(a.x+a.w,b.x+b.w)-x,h:Math.max(a.y+a.h,b.y+b.h)-y}; }
    function presets(unit) { return [{x:0,y:0,w:148/25.4*unit,h:210/25.4*unit,name:'A5'}, {x:0,y:0,w:3.6*unit,h:4.5*unit,name:'3.6 x 4.5 in'}]; }
    function detect(w,h,unit) { var p=presets(unit),i,t=Math.max(unit*0.02,1); for(i=0;i<2;i++) if(Math.abs(w-p[i].w)<=t && Math.abs(h-p[i].h)<=t) return i; return -1; }
    function target(w,h,unit,direction) { var d=detect(w,h,unit); if(direction===0 && d<0) throw Error('Source size is not a recognized preset. Choose an explicit direction.'); return presets(unit)[direction===0?1-d:direction===1?1:0]; }
    function rightOf(source,existing,w,h,gap) { var x=source.x+source.w+gap,y=source.y,i,again=true,loops=0; if(!finite(gap)||gap<0)throw Error('Gap must be a non-negative number.'); while(again){again=false; if(++loops>existing.length+2)throw Error('Cannot find a free artboard position.'); for(i=0;i<existing.length;i++){ if(overlap({x:x-gap,y:y-gap,w:w+gap*2,h:h+gap*2},existing[i])){x=existing[i].x+existing[i].w+gap;again=true;} }} return {x:x,y:y,w:w,h:h}; }
    function plan(items,source,target,mode,options) {
        if(!box(source)||!box(target))throw Error('Invalid source or destination geometry.');
        var ratio=options&&options.marginRatio!==undefined?options.marginRatio:0.05;
        if(!finite(ratio)||ratio<0||ratio>0.2)throw Error('Safe margin must be between 0 and 20 percent.');
        var i,j,k,n=items.length,margin=Math.min(target.w,target.h)*ratio,sw=target.w-margin*2,sh=target.h-margin*2;
        var out=[],warnings=[],groups=[],seen=[],bg=[],fg=[],all=null;
        for(i=0;i<n;i++){if(!box(items[i]))throw Error('Invalid bounds for element '+i);if(items[i].background)bg.push(i);else {fg.push(i);all=all?union(all,items[i]):items[i];}}
        var s=all?Math.min(sw/all.w,sh/all.h):1;
        if(mode==='smart'&&fg.length){
            // Connected components preserve overlapping compositions, then horizontal bands preserve columns.
            for(i=0;i<fg.length;i++){k=fg[i];if(seen[k])continue;var ids=[k],b=items[k];seen[k]=true;var changed=true;while(changed){changed=false;for(j=0;j<fg.length;j++){var idx=fg[j];if(seen[idx])continue;for(var q=0;q<ids.length;q++)if(overlap(items[idx],items[ids[q]])){ids.push(idx);seen[idx]=true;b=union(b,items[idx]);changed=true;break;}}}groups.push({ids:ids,b:b});}
            groups.sort(function(a,b){return a.b.y-b.b.y || a.b.x-b.b.x;});
            var rows=[];
            for(i=0;i<groups.length;i++){var g=groups[i],row=rows.length?rows[rows.length-1]:null;if(row && Math.min(row.b.y+row.b.h,g.b.y+g.b.h)>Math.max(row.b.y,g.b.y)+Math.min(row.b.h,g.b.h)*0.25){row.groups.push(g);row.b=union(row.b,g.b);}else rows.push({groups:[g],b:g.b});}
            if(rows.length<2){warnings.push('Smart Reflow could not separate the foreground into independent sections; Safe Fit used. A single group, flattened image, or connected object overlaps can cause this. Keep related section groups intact but separate the background from foreground in a working copy.');mode='safe';}
            else {
                var total=0,maxW=0,gap=Math.min(target.w,target.h)*0.025;
                for(i=0;i<rows.length;i++){total+=rows[i].b.h;maxW=Math.max(maxW,rows[i].b.w);}
                s=Math.min(sw/maxW,(sh-gap*(rows.length-1))/total);
                if(s<=0) {warnings.push('Too many sections; Safe Fit used.');mode='safe';s=Math.min(sw/all.w,sh/all.h);}
                else {var free=sh-total*s,gap2=free/(rows.length-1),y=margin;
                    for(i=0;i<rows.length;i++){var r=rows[i],rel=(r.b.x+r.b.w/2-source.x)/source.w,center=Math.max(margin+r.b.w*s/2,Math.min(target.w-margin-r.b.w*s/2,rel*target.w)),x=center-r.b.w*s/2;
                        for(j=0;j<r.groups.length;j++)for(k=0;k<r.groups[j].ids.length;k++){var id=r.groups[j].ids[k],it=items[id];out[id]={x:x+(it.x-r.b.x)*s,y:y+(it.y-r.b.y)*s,w:it.w*s,h:it.h*s,scale:s};}y+=r.b.h*s+gap2;
                    }
                    warnings.push('Smart Reflow: '+rows.length+' horizontal sections; overlapping elements stay together.');
                }
            }
        }
        if(mode!=='smart'&&all&&all.w>=source.w*.9&&all.h>=source.h*.9&&!bg.length)warnings.push('Page-spanning artwork is fitted as foreground. Safe margins add an inset; set the margin to 0% to remove that inset. Different source/target proportions can still leave side or top/bottom bands. The tool will not stretch or crop the entire composition to remove them.');
        if(mode!=='smart')for(i=0;i<fg.length;i++){k=fg[i];var a=items[k];out[k]={x:margin+(sw-all.w*s)/2+(a.x-all.x)*s,y:margin+(sh-all.h*s)/2+(a.y-all.y)*s,w:a.w*s,h:a.h*s,scale:s};}
        for(i=0;i<bg.length;i++){k=bg[i];var c=items[k],bs=Math.max(target.w/c.w,target.h/c.h);out[k]={x:(target.w-c.w*bs)/2,y:(target.h-c.h*bs)/2,w:c.w*bs,h:c.h*bs,scale:bs};warnings.push('Background '+k+' uses proportional cover; crop/bleed requires review.');}
        // Only widen isolated, simple paragraph boxes. Font glyphs keep uniform scale.
        if(mode==='smart')for(i=0;i<n;i++)if(items[i].areaText){
            var isolated=true,t=out[i];
            for(j=0;j<n;j++)if(i!==j&&!items[j].background&&Math.min(t.y+t.h,out[j].y+out[j].h)>Math.max(t.y,out[j].y)+0.01){isolated=false;break;}
            if(isolated&&sw>t.w*1.02){t.x=margin;t.w=sw;t.reflowWidth=sw;warnings.push('Paragraph '+i+' frame widened; check overset text manually.');}
        }
        for(i=0;i<n;i++){var o=out[i];if(!items[i].background&&(o.x<margin-0.01||o.y<margin-0.01||o.x+o.w>target.w-margin+0.01||o.y+o.h>target.h-margin+0.01))warnings.push('Element '+i+' exceeds safe margins.');if(items[i].fontSize&&items[i].fontSize*o.scale<8)warnings.push('Element '+i+' has text below 8 pt.');for(j=0;j<i;j++)if(!items[i].background&&!items[j].background&&overlap(o,out[j])&&!overlap(items[i],items[j]))warnings.push('New collision between elements '+j+' and '+i+'.');}
        return {items:out,warnings:warnings,mode:mode,margin:margin};
    }
    return {plan:plan,presets:presets,detect:detect,target:target,rightOf:rightOf,overlap:overlap,union:union};
}());
if(typeof module!=='undefined')module.exports=SARLayout;
