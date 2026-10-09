const assert=require('node:assert/strict'),test=require('node:test'),A=require('../photoshop/adapter');
function setup(options={}){
 let id=0,closed=0;
 function layer(name,x,y,w,h){return {id:++id,name,kind:'normal',visible:true,locked:false,linkedLayers:[],bounds:{left:x,top:y,right:x+w,bottom:y+h},async scale(sx,sy){if(options.fail)throw Error('Injected transform failure');const b=this.bounds;b.right=b.left+(b.right-b.left)*sx/100;b.bottom=b.top+(b.bottom-b.top)*sy/100;},async translate(x,y){const b=this.bounds;b.left+=x;b.right+=x;b.top+=y;b.bottom+=y;}};}
 const source={id:7,width:148/25.4*300,height:210/25.4*300,resolution:300,layers:[layer('Title',100,100,1200,150),layer('Image',100,500,1200,800),layer('CTA',100,1600,1200,200)],async duplicate(name,merge){assert.equal(merge,false);const d={...this,id:8,name,layers:this.layers.map(l=>({...l,id:++id,bounds:{...l.bounds}})),async resizeCanvas(w,h){this.width=w;this.height=h;},async close(){closed++;}};return d;}};
 const ps={action:{async batchPlay(){return [{artboardEnabled:!!options.artboard}];}},constants:{LayerKind:{TEXT:'text'},AnchorPosition:{TOPLEFT:'topLeft'},SaveOptions:{DONOTSAVECHANGES:'discard'}}};
 return {source,ps,closed:()=>closed};
}
function snapshot(d){return JSON.stringify({width:d.width,height:d.height,resolution:d.resolution,layers:d.layers.map(l=>({id:l.id,bounds:l.bounds,visible:l.visible,locked:l.locked}))});}
test('duplicate workflow preserves source and editable layer hierarchy',async()=>{const {source,ps}=setup(),before=snapshot(source),a=await A.analyze(ps,source,0,'smart'),copy=await A.convert(ps,source,a,{isCancelled:false},'Converted');assert.equal(snapshot(source),before);assert.equal(copy.width,1080);assert.equal(copy.height,1350);assert.equal(copy.resolution,300);assert.equal(copy.layers.length,3);assert.equal(copy.layers[0].name,'Title');assert.notEqual(copy.layers[0].id,source.layers[0].id);});
test('failed transform closes generated document only',async()=>{const x=setup({fail:true}),before=snapshot(x.source),a=await A.analyze(x.ps,x.source,0,'smart');await assert.rejects(A.convert(x.ps,x.source,a,{isCancelled:false},'Copy'),/Injected/);assert.equal(x.closed(),1);assert.equal(snapshot(x.source),before);});
test('cancellation before mutation does not duplicate',async()=>{const x=setup(),a=await A.analyze(x.ps,x.source,0,'safe');await assert.rejects(A.convert(x.ps,x.source,a,{isCancelled:true},'Copy'),/cancelled/);assert.equal(x.closed(),0);});
test('artboard input is rejected before document mutation',async()=>{const x=setup({artboard:true}),before=snapshot(x.source);await assert.rejects(A.analyze(x.ps,x.source,0,'smart'),/Artboard document/);assert.equal(snapshot(x.source),before);});
test('locked and hidden copied layers are unchanged; group is atomic',async()=>{const x=setup();x.source.layers[0].locked=true;x.source.layers[1].visible=false;const a=await A.analyze(x.ps,x.source,0,'safe');assert.equal(a.layers.length,1);const copy=await A.convert(x.ps,x.source,a,{isCancelled:false},'Copy');assert.deepEqual(copy.layers[0].bounds,x.source.layers[0].bounds);assert.deepEqual(copy.layers[1].bounds,x.source.layers[1].bounds);assert(A.blocked({visible:true,locked:false,layers:[{visible:false}]}));});
test('ungrouped clipping/linked content blocks conversion',async()=>{const x=setup();x.source.layers[0].isClippingMask=true;await assert.rejects(A.analyze(x.ps,x.source,0,'smart'),/clipping/);x.source.layers[0].isClippingMask=false;x.source.layers[0].linkedLayers=[x.source.layers[1]];await assert.rejects(A.analyze(x.ps,x.source,0,'smart'),/Linked/);});
test('no document and unknown size need actionable instructions',async()=>{const x=setup();await assert.rejects(A.analyze(x.ps,null,0,'smart'),/Open/);x.source.width=777;await assert.rejects(A.analyze(x.ps,x.source,0,'smart'),/explicit/);const a=await A.analyze(x.ps,x.source,1,'safe');assert(a.warnings.some(w=>w.includes('Non-preset')));});
function artboardSetup(fail=false){
 const x=setup(),children=x.source.layers,rect={left:200,top:100,right:200+x.source.width,bottom:100+x.source.height};
 for(const c of children){c.bounds.left+=200;c.bounds.right+=200;c.bounds.top+=100;c.bounds.bottom+=100;}
 const board={id:123,name:'A5 artboard',kind:'group',visible:true,locked:false,layers:children},other={id:124,name:'Other artboard',kind:'group',visible:true,locked:false,layers:[]};
 for(const c of children)c.parent=board;
 x.source.layers=[board,other];x.source.activeLayers=[children[0]];
 x.ps.constants.ElementPlacement={PLACEBEFORE:'before'};
 x.ps.action.batchPlay=async()=>[{artboardEnabled:true,artboard:{artboardRect:rect}}];
 x.source.duplicate=async function(name){
   const copy={id:8,name,width:this.width+200,height:this.height+100,resolution:300,layers:[],async crop(r){assert.equal(r.left,200);assert.equal(r.top,100);this.width=r.right-r.left;this.height=r.bottom-r.top;for(const l of this.layers)await l.translate(-r.left,-r.top);},async resizeCanvas(w,h){this.width=w;this.height=h;},async close(){this.closed=true;}};
   const cloneBoard={...board,layers:children.map(l=>({...l,bounds:{...l.bounds}}))},cloneOther={...other,layers:[]};copy.layers=[cloneBoard,cloneOther];
   for(const c of cloneBoard.layers){c.parent=cloneBoard;c.move=async function(relative,placement){assert.equal(placement,'before');if(fail)throw Error('Extraction failed');cloneBoard.layers.splice(cloneBoard.layers.indexOf(this),1);copy.layers.splice(copy.layers.indexOf(relative),0,this);this.parent=null;};}
   for(const g of copy.layers)g.delete=async function(){copy.layers.splice(copy.layers.indexOf(this),1);};
   return copy;
 };
 return {...x,children,board};
}
test('selected Photoshop artboard extracts editable children in original order into duplicate canvas',async()=>{const x=artboardSetup(),before=JSON.stringify(x.children.map(l=>l.bounds)),a=await A.analyze(x.ps,x.source,0,'smart','artboard');assert.equal(a.artboardIndex,0);assert.equal(a.source.x,200);const c=await A.convert(x.ps,x.source,a,{isCancelled:false},'Copy');assert.equal(c.width,1080);assert.equal(c.height,1350);assert.deepEqual(c.layers.map(l=>l.name),['Title','Image','CTA']);assert.equal(JSON.stringify(x.children.map(l=>l.bounds)),before);assert.equal(x.source.layers.length,2);assert.equal(x.board.layers.length,3);});
test('Photoshop artboard extraction refuses malformed geometry and locked content',async()=>{const x=artboardSetup();x.ps.action.batchPlay=async()=>[{artboardEnabled:true,artboard:{}}];await assert.rejects(A.analyze(x.ps,x.source,0,'smart','artboard'),/rectangle/);const y=artboardSetup();y.children[0].locked=true;await assert.rejects(A.analyze(y.ps,y.source,0,'smart','artboard'),/locked\/hidden/);});
