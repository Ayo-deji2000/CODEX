const assert=require('node:assert/strict'),test=require('node:test'),L=require('../shared/layout-engine');
const a=L.presets(72)[0],b=L.presets(72)[1],src={x:0,y:0,w:a.w,h:a.h};
const items=[{x:30,y:30,w:300,h:40,fontSize:26},{x:30,y:150,w:300,h:200},{x:30,y:440,w:300,h:65,fontSize:12}];
function contained(p,t){for(const o of p.items){assert(o.scale>0);assert(o.x>=p.margin-1e-7);assert(o.y>=p.margin-1e-7);assert(o.x+o.w<=t.w-p.margin+1e-7);assert(o.y+o.h<=t.h-p.margin+1e-7);}}
test('both directions and reverse conversion',()=>{for(const mode of ['smart','safe']){const p=L.plan(items,src,b,mode);contained(p,b);const q=L.plan(p.items,{x:0,y:0,w:b.w,h:b.h},a,mode);contained(q,a);for(let i=0;i<items.length;i++)assert(Math.abs(p.items[i].w/p.items[i].h-items[i].w/items[i].h)<1e-9);}});
test('no mutation; deterministic reflow differs from fit',()=>{const before=JSON.stringify(items),p=L.plan(items,src,b,'smart'),safe=L.plan(items,src,b,'safe');assert.equal(JSON.stringify(items),before);assert.deepEqual(p,L.plan(items,src,b,'smart'));assert.notEqual(p.items[1].y,safe.items[1].y);assert.equal(p.mode,'smart');});
test('overlapping logo/type lockup preserves relative geometry',()=>{const it=[{x:30,y:30,w:90,h:40},{x:50,y:40,w:180,h:40},{x:30,y:180,w:300,h:100}];const p=L.plan(it,src,b,'smart');assert.equal(p.items[0].scale,p.items[1].scale);assert(Math.abs((p.items[1].x-p.items[0].x)-20*p.items[0].scale)<1e-8);});
test('columns remain in the same section',()=>{const it=[{x:20,y:20,w:100,h:50},{x:230,y:20,w:100,h:50},{x:20,y:200,w:300,h:200}];const p=L.plan(it,src,b,'smart');assert.equal(p.items[0].y,p.items[1].y);assert(p.items[1].x>p.items[0].x);contained(p,b);});
test('background proportional cover and crop warning',()=>{const p=L.plan([{x:0,y:0,w:a.w,h:a.h,background:true},...items],src,b,'smart');assert(p.items[0].w>=b.w);assert(p.items[0].h>=b.h);assert(p.warnings.some(w=>w.includes('crop')));});
test('empty and one-section fallback',()=>{assert.deepEqual(L.plan([],src,b,'smart').items,[]);assert.equal(L.plan([items[0]],src,b,'smart').mode,'safe');});
test('preset tolerance, unknown source and explicit target',()=>{assert.equal(L.detect(a.w+.1,a.h-.1,72),0);assert.equal(L.detect(333,444,72),-1);assert.throws(()=>L.target(333,444,72,0));assert.equal(L.target(333,444,72,1).name,b.name);assert.equal(L.detect(1080,1350,300),1);});
test('placement beyond obstacles and repeated conversions',()=>{let existing=[src,{x:src.w+20,y:0,w:200,h:600}];for(let i=0;i<14;i++){const d=L.rightOf(src,existing,b.w,b.h,20);assert(existing.every(e=>!L.overlap(d,e)));assert.equal(d.y,src.y);existing.push(d);}assert.throws(()=>L.rightOf(src,existing,100,100,-1));});
test('invalid geometry and oversize text warnings',()=>{assert.throws(()=>L.plan([{x:0,y:0,w:NaN,h:3}],src,b,'smart'));const p=L.plan([{x:0,y:0,w:1000,h:1200,fontSize:9}],src,b,'safe');contained(p,b);assert(p.warnings.some(w=>w.includes('below 8')));});
test('random geometric invariants in both modes',()=>{let seed=42;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}for(let trial=0;trial<150;trial++){let it=[];for(let i=0;i<20;i++)it.push({x:rand()*300,y:rand()*500,w:rand()*100+2,h:rand()*70+2});for(const mode of ['smart','safe']){const p=L.plan(it,src,b,mode);contained(p,b);for(let i=0;i<it.length;i++)assert(Math.abs(p.items[i].w/p.items[i].h-it[i].w/it[i].h)<1e-6);}}});

test('isolated area text widens its frame without changing glyph scale',()=>{const it=[{x:30,y:20,w:300,h:50},{x:30,y:200,w:150,h:100,areaText:true}];const p=L.plan(it,src,b,'smart');assert.equal(p.items[1].reflowWidth,b.w-2*p.margin);assert.equal(p.items[0].scale,p.items[1].scale);assert(p.warnings.some(w=>w.includes('overset')));contained(p,b);});
test('area text in a multi-column band is not widened',()=>{const it=[{x:20,y:20,w:120,h:50,areaText:true},{x:230,y:20,w:120,h:50},{x:20,y:200,w:300,h:200}];const p=L.plan(it,src,b,'smart');assert.equal(p.items[0].reflowWidth,undefined);});

test('zero margin removes artificial inset without distorting page-sized grouped artwork',()=>{const it=[{x:0,y:0,w:a.w,h:a.h}],p=L.plan(it,src,b,'smart',{marginRatio:0}),old=L.plan(it,src,b,'smart');assert.equal(p.mode,'safe');assert.equal(p.margin,0);assert.equal(p.items[0].y,0);assert(p.items[0].scale>old.items[0].scale);assert(Math.abs(p.items[0].w/p.items[0].h-a.w/a.h)<1e-9);assert(p.items[0].x>0);assert(p.warnings.some(w=>w.includes('bands')));assert.deepEqual(it,[{x:0,y:0,w:a.w,h:a.h}]);});
test('invalid margin is rejected without changing source input',()=>{for(const ratio of [-.01,.21,NaN])assert.throws(()=>L.plan(items,src,b,'safe',{marginRatio:ratio}),/Safe margin/);});

function sectionPoster(){return [
 {x:0,y:0,w:420,h:220,sectionBackground:true},
 {x:0,y:220,w:420,h:250,sectionBackground:true},
 {x:340,y:15,w:50,h:50}, {x:55,y:90,w:310,h:90},
 {x:140,y:235,w:140,h:20}, // pricing heading
 {x:40,y:265,w:340,h:190}, // border outline
 {x:70,y:290,w:110,h:45}, {x:240,y:290,w:110,h:45},
 {x:70,y:380,w:110,h:45}, {x:240,y:380,w:110,h:45},
 {x:60,y:510,w:300,h:55}
];}
test('section backgrounds fill target width while foreground keeps safe margins',()=>{
 const it=sectionPoster(),before=JSON.stringify(it),p=L.plan(it,{x:0,y:0,w:420,h:595},b,'smart');
 assert.equal(p.mode,'smart');assert.equal(JSON.stringify(it),before);
 assert.equal(p.items[0].clip.x,0);assert.equal(p.items[0].clip.w,b.w);assert.equal(p.items[0].clip.y,0);
 assert.equal(p.items[0].clip.y+p.items[0].clip.h,p.items[1].clip.y);
 for(let i=0;i<2;i++){const o=p.items[i],c=o.clip;assert(o.x<=c.x);assert(o.x+o.w>=c.x+c.w-1e-8);assert(o.y<=c.y+1e-8);assert(o.y+o.h>=c.y+c.h-1e-8);assert(Math.abs(o.w/o.h-it[i].w/it[i].h)<1e-9);}
 contained({...p,items:p.items.slice(2)},b);
});
test('section title, outlined frame and four cards preserve all relative distances',()=>{
 const it=sectionPoster(),p=L.plan(it,{x:0,y:0,w:420,h:595},b,'smart');
 for(let i=5;i<=9;i++){assert.equal(p.items[i].scale,p.items[4].scale);assert(Math.abs(p.items[i].x-p.items[4].x-(it[i].x-it[4].x)*p.items[i].scale)<1e-8);assert(Math.abs(p.items[i].y-p.items[4].y-(it[i].y-it[4].y)*p.items[i].scale)<1e-8);}
 assert(p.items[4].y+p.items[4].h<p.items[5].y);assert.equal(p.items[2].scale,p.items[3].scale);
});
test('section cover supports reverse conversion, empty sections and Safe Fit fallback',()=>{
 const it=sectionPoster();for(const target of [a,b])for(const mode of ['smart','safe']){const p=L.plan(it,{x:0,y:0,w:420,h:595},target,mode);assert(p.items.every(o=>Number.isFinite(o.x+o.y+o.w+o.h)));}
 const p=L.plan([{x:0,y:0,w:420,h:595,sectionBackground:true}],{x:0,y:0,w:420,h:595},b,'smart');assert.deepEqual(p.items[0].clip,{x:0,y:0,w:b.w,h:b.h});
});
test('overlapping section backgrounds fail with an actionable preflight error',()=>{
 assert.throws(()=>L.plan([{x:0,y:0,w:420,h:300,sectionBackground:true},{x:0,y:250,w:420,h:300,sectionBackground:true}],{x:0,y:0,w:420,h:595},b,'smart'),/Section backgrounds overlap/);
});

test('empty background section keeps a viewport between populated sections without overlap',()=>{
 const it=[{x:0,y:0,w:420,h:180,sectionBackground:true},{x:0,y:180,w:420,h:100,sectionBackground:true},{x:0,y:280,w:420,h:315,sectionBackground:true},{x:40,y:30,w:300,h:100},{x:40,y:320,w:300,h:170}];const p=L.plan(it,{x:0,y:0,w:420,h:595},b,'smart');
 for(let i=0;i<2;i++)assert(Math.abs(p.items[i].clip.y+p.items[i].clip.h-p.items[i+1].clip.y)<1e-9);
 assert(p.items[1].clip.h>0);assert.equal(p.items[2].clip.y+p.items[2].clip.h,b.h);
});
