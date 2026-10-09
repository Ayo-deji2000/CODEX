const ps=require('photoshop'),adapter=require('./adapter.js');
let previewDoc=null,busy=false;
const el=id=>document.getElementById(id);
function say(text){el('report').textContent=text;}
function report(a){return a.target.name+' ('+a.target.w+' × '+a.target.h+' px)\n'+a.layers.length+' movable elements; '+a.layout.mode+'\n'+a.warnings.concat(a.layout.warnings).join('\n');}
function availablePreview(){if(previewDoc&&!Array.from(ps.app.documents).some(d=>d.id===previewDoc.id))previewDoc=null;return previewDoc;}
async function run(action){if(busy)return;busy=true;for(const id of ['analyze','preview','apply','cancel'])el(id).disabled=true;
try{
    availablePreview();
    if(action==='cancel'){
        if(previewDoc){await ps.core.executeAsModal(async()=>{await previewDoc.close(ps.constants.SaveOptions.DONOTSAVECHANGES);},{commandName:'Discard Resizer Preview'});previewDoc=null;}
        say('Preview discarded. Source remains untouched.');return;
    }
    if(previewDoc){
        if(action!=='apply')throw Error('Review the open preview, then Apply to keep it or Cancel to discard it.');
        previewDoc=null;say('Converted document kept. Save it separately as PSD/PSB. Source remains untouched.');return;
    }
    const source=ps.app.documents.length?ps.app.activeDocument:null,direction=Number(el('direction').value),mode=el('mode').value,scope=el('scope').value;
    let a,copy;
    await ps.core.executeAsModal(async ctx=>{
        a=await adapter.analyze(ps,source,direction,mode,scope);
        if(action==='analyze')return;
        copy=await adapter.convert(ps,source,a,ctx,'Converted - '+a.target.name+' - '+Date.now());
    },{commandName:'Smart Artboard Resizer'});
    say(report(a)+(action==='analyze'?'\nAnalyze complete. Review warnings before conversion.':'\nReview the duplicate beside the original using Window > Arrange.'));
    if(action==='preview'){previewDoc=copy;say(el('report').textContent+'\nApply keeps this preview. Cancel closes it without saving, including any edits you make to the preview.');}
}catch(e){say('Conversion stopped. '+e.message);}finally{busy=false;for(const id of ['analyze','preview','apply','cancel'])el(id).disabled=false;for(const id of ['direction','mode','scope'])el(id).disabled=!!availablePreview();}}
for(const id of ['analyze','preview','apply','cancel'])el(id).addEventListener('click',()=>run(id));
