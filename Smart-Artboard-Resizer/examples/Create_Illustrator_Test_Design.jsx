#target illustrator
/* Creates a NEW document only. Never modifies the active document. */
(function(){
 var oldCS=app.coordinateSystem;try{app.coordinateSystem=CoordinateSystem.DOCUMENTCOORDINATESYSTEM;
 var w=148/25.4*72,h=210/25.4*72,d=app.documents.add(DocumentColorSpace.RGB,w,h);
 d.artboards[0].artboardRect=[0,h,w,0];d.artboards[0].name='Fixture - A5';
 function rgb(r,g,b){var c=new RGBColor();c.red=r;c.green=g;c.blue=b;return c;}
 function shape(parent,x,y,ww,hh,c){var p=parent.pathItems.rectangle(y,x,ww,hh);p.fillColor=c;p.stroked=false;return p;}
 function text(parent,x,y,content,size){var t=parent.textFrames.add();t.contents=content;t.position=[x,y];t.textRange.characterAttributes.size=size;t.textRange.characterAttributes.fillColor=rgb(25,30,45);return t;}
 shape(d,0,h,w,h,rgb(245,241,230)).name='Background';
 text(d,25,h-35,'DESIGN IN MOTION',22).name='Heading';
 text(d,25,h-70,'An editable composition for comparison',10);
 var logo=d.groupItems.add();logo.name='Logo lockup';shape(logo,25,h-100,25,25,rgb(40,100,150));text(logo,60,h-104,'STUDIO',14);
 shape(d,25,h-165,w-50,210,rgb(90,135,155)).name='Image placeholder - replace with placed image';
 var framePath=d.pathItems.rectangle(h-405,25,w-50,65),body=d.textFrames.areaText(framePath);body.contents='Smart Reflow keeps related artwork together and adapts spacing. Check this paragraph for overflow after conversion. Add more text to test a text-heavy layout.';body.textRange.characterAttributes.size=11;body.name='Paragraph - inspect overset';
 var cta=d.groupItems.add();shape(cta,25,h-500,160,35,rgb(215,150,60));text(cta,35,h-509,'EXPLORE THE STUDIO',11);
 d.artboards.add([w+30,h,w+30+3.6*72,h-4.5*72]).name='Obstacle - custom';
 alert('A new editable test document was created. Run the resizer on Fixture - A5. The empty custom artboard tests placement around an obstacle.');
}finally{app.coordinateSystem=oldCS;}
}());
