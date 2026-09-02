const logoInput=document.getElementById('logoInput');
const uploadEmpty=document.getElementById('uploadEmpty');
const uploadFilled=document.getElementById('uploadFilled');
const uploadThumb=document.getElementById('uploadThumb');
const fileName=document.getElementById('fileName');
const keychainEmpty=document.getElementById('keychainEmpty');
const keychainWrap=document.getElementById('keychainWrap');
const canvas=document.getElementById('keychainCanvas');
const ctx=canvas.getContext('2d');
const profileLogo=document.getElementById('profileLogo');
const profilePlaceholder=document.getElementById('profilePlaceholder');
const alternateDesignBtn=document.getElementById('alternateDesignBtn');
let originalData='';
let currentResult=null;
let currentVariant=0;

function readFile(file){
  if(!file||!file.type.startsWith('image/'))return;
  fileName.textContent=file.name;
  const r=new FileReader();
  r.onload=()=>{originalData=r.result;processLogo()};
  r.readAsDataURL(file);
}

function hasTransparency(c,x){
  const d=x.getImageData(0,0,c.width,c.height).data;
  let transparent=0,total=0;
  const step=Math.max(1,Math.floor(Math.sqrt((c.width*c.height)/50000)));
  for(let y=0;y<c.height;y+=step){
    for(let xx=0;xx<c.width;xx+=step){
      total++;
      if(d[(y*c.width+xx)*4+3]<220)transparent++;
    }
  }
  return total>0&&transparent/total>.015;
}

function colorDist(d,i,j){
  const dr=d[i]-d[j],dg=d[i+1]-d[j+1],db=d[i+2]-d[j+2];
  return Math.sqrt(dr*dr+dg*dg+db*db);
}

function floodRemoveBackground(c,x){
  if(hasTransparency(c,x))return;
  const p=x.getImageData(0,0,c.width,c.height),d=p.data;
  const w=c.width,h=c.height,total=w*h;
  const visited=new Uint8Array(total),queue=new Int32Array(total);
  let qh=0,qt=0;
  const push=pos=>{if(!visited[pos]){visited[pos]=1;queue[qt++]=pos}};
  for(let xx=0;xx<w;xx++){push(xx);push((h-1)*w+xx)}
  for(let y=1;y<h-1;y++){push(y*w);push(y*w+w-1)}
  while(qh<qt){
    const pos=queue[qh++],px=pos%w,py=(pos/w)|0,ii=pos*4;
    d[ii+3]=0;
    const neighbors=[];
    if(px>0)neighbors.push(pos-1);if(px<w-1)neighbors.push(pos+1);if(py>0)neighbors.push(pos-w);if(py<h-1)neighbors.push(pos+w);
    for(const np of neighbors){
      if(visited[np])continue;
      const ni=np*4,local=colorDist(d,ii,ni),edgeRef=(px<3||py<3||px>w-4||py>h-4)?52:34;
      if(local<=28||local<=edgeRef){visited[np]=1;queue[qt++]=np}
    }
  }
  x.putImageData(p,0,0);
}

function cropToContent(source){
  const sx=source.getContext('2d',{willReadFrequently:true}),p=sx.getImageData(0,0,source.width,source.height),d=p.data;
  let minX=source.width,minY=source.height,maxX=-1,maxY=-1,count=0;
  for(let y=0;y<source.height;y++)for(let xx=0;xx<source.width;xx++){
    const a=d[(y*source.width+xx)*4+3];
    if(a>24){count++;if(xx<minX)minX=xx;if(xx>maxX)maxX=xx;if(y<minY)minY=y;if(y>maxY)maxY=y}
  }
  if(maxX<0||maxY<0)return {canvas:source,stats:{bboxRatio:1,fillRatio:1,touches:4}};
  const rawW=maxX-minX+1,rawH=maxY-minY+1,bboxArea=rawW*rawH;
  const margin=Math.max(6,Math.round(Math.max(rawW,rawH)*.045));
  const touches=(minX<source.width*.02?1:0)+(minY<source.height*.02?1:0)+(maxX>source.width*.98?1:0)+(maxY>source.height*.98?1:0);
  const stats={bboxRatio:bboxArea/(source.width*source.height),fillRatio:count/Math.max(1,bboxArea),touches,aspect:rawW/rawH};
  minX=Math.max(0,minX-margin);minY=Math.max(0,minY-margin);maxX=Math.min(source.width-1,maxX+margin);maxY=Math.min(source.height-1,maxY+margin);
  const out=document.createElement('canvas');
  out.width=maxX-minX+1;out.height=maxY-minY+1;
  out.getContext('2d').drawImage(source,minX,minY,out.width,out.height,0,0,out.width,out.height);
  return {canvas:out,stats};
}

function imageComplexity(c){
  const x=c.getContext('2d',{willReadFrequently:true}),d=x.getImageData(0,0,c.width,c.height).data;
  const step=Math.max(2,Math.floor(Math.sqrt((c.width*c.height)/12000)));
  let diffs=0,samples=0;
  for(let y=step;y<c.height;y+=step)for(let xx=step;xx<c.width;xx+=step){
    const i=(y*c.width+xx)*4;if(d[i+3]<30)continue;
    const j=(y*c.width+Math.max(0,xx-step))*4;if(d[j+3]<30)continue;
    diffs+=Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1])+Math.abs(d[i+2]-d[j+2]);samples++;
  }
  return samples?diffs/(samples*3):0;
}

function shouldUseBadge(stats,cleaned){
  const complexity=imageComplexity(cleaned);
  return stats.bboxRatio>.72||stats.touches>=2||(stats.fillRatio>.62&&complexity>32)||complexity>58;
}

function processLogo(){
  if(!originalData)return;
  const img=new Image();
  img.onload=()=>{
    const max=900,scale=Math.min(1,max/Math.max(img.width,img.height));
    const original=document.createElement('canvas');
    original.width=Math.max(1,Math.round(img.width*scale));original.height=Math.max(1,Math.round(img.height*scale));
    original.getContext('2d',{willReadFrequently:true}).drawImage(img,0,0,original.width,original.height);
    const cleaned=document.createElement('canvas');cleaned.width=original.width;cleaned.height=original.height;
    const cx=cleaned.getContext('2d',{willReadFrequently:true});cx.drawImage(original,0,0);floodRemoveBackground(cleaned,cx);
    const cropped=cropToContent(cleaned),badge=shouldUseBadge(cropped.stats,cropped.canvas);
    renderAll({cleanData:cropped.canvas.toDataURL('image/png'),originalData:original.toDataURL('image/png'),badge});
  };
  img.src=originalData;
}

function renderAll(result){
  currentResult=result;
  currentVariant=result.badge?1:0;
  uploadThumb.src=result.cleanData;
  uploadEmpty.classList.add('hidden');uploadFilled.classList.remove('hidden');
  keychainEmpty.classList.add('hidden');keychainWrap.classList.remove('hidden');alternateDesignBtn.classList.remove('hidden');
  profileLogo.src=originalData;
  profileLogo.style.display='block';
  profilePlaceholder.style.display='none';
  drawCurrentVariant();
}

function drawCurrentVariant(){
  if(!currentResult)return;
  if(currentVariant===0)drawFreeformKeychain(currentResult.cleanData);
  else if(currentVariant===1)drawBadgeKeychain(currentResult.originalData);
  else drawCircularKeychain(currentResult.originalData);
}

function drawFreeformKeychain(data){
  const img=new Image();
  img.onload=()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const pad=32,s=Math.min((canvas.width-pad*2)/img.width,(canvas.height-pad*2)/img.height),w=img.width*s,h=img.height*s,x=(canvas.width-w)/2,y=(canvas.height-h)/2;
    const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;mask.getContext('2d').drawImage(img,x,y,w,h);
    const radius=Math.max(8,Math.round(Math.min(w,h)*.035));
    const bodyMask=document.createElement('canvas');bodyMask.width=canvas.width;bodyMask.height=canvas.height;const bx=bodyMask.getContext('2d');
    for(let dy=-radius;dy<=radius;dy+=2)for(let dx=-radius;dx<=radius;dx+=2)if(dx*dx+dy*dy<=radius*radius)bx.drawImage(mask,dx,dy);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.58)';ctx.shadowBlur=24;ctx.shadowOffsetY=18;ctx.drawImage(bodyMask,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#20222a';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
    ctx.save();ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-in';const gold=ctx.createLinearGradient(0,y,0,y+h);gold.addColorStop(0,'#f0d990');gold.addColorStop(.5,'#d2a84e');gold.addColorStop(1,'#a77728');ctx.fillStyle=gold;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
  };
  img.src=data;
}

function roundRectPath(c,x,y,w,h,r){
  const rr=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+rr,y);c.arcTo(x+w,y,x+w,y+h,rr);c.arcTo(x+w,y+h,x,y+h,rr);c.arcTo(x,y+h,x,y,rr);c.arcTo(x,y,x+w,y,rr);c.closePath();
}

function drawBadgeKeychain(data){
  const img=new Image();
  img.onload=()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const size=Math.min(canvas.width,canvas.height)*.72,x=(canvas.width-size)/2,y=(canvas.height-size)/2+8,r=size*.14;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.62)';ctx.shadowBlur=28;ctx.shadowOffsetY=18;roundRectPath(ctx,x-10,y-10,size+20,size+20,r+8);ctx.fillStyle='#20222a';ctx.fill();ctx.restore();
    ctx.save();roundRectPath(ctx,x,y,size,size,r);ctx.clip();ctx.fillStyle='#f2eee7';ctx.fillRect(x,y,size,size);const s=Math.max(size/img.width,size/img.height),w=img.width*s,h=img.height*s;ctx.drawImage(img,x+(size-w)/2,y+(size-h)/2,w,h);ctx.restore();
    ctx.save();roundRectPath(ctx,x,y,size,size,r);ctx.lineWidth=8;ctx.strokeStyle='#c9a24e';ctx.stroke();ctx.restore();
  };
  img.src=data;
}

function drawCircularKeychain(data){
  const img=new Image();
  img.onload=()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const size=Math.min(canvas.width,canvas.height)*.72,cx=canvas.width/2,cy=canvas.height/2+8,r=size/2;
    ctx.save();ctx.shadowColor='rgba(0,0,0,.62)';ctx.shadowBlur=28;ctx.shadowOffsetY=18;ctx.beginPath();ctx.arc(cx,cy,r+10,0,Math.PI*2);ctx.fillStyle='#20222a';ctx.fill();ctx.restore();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.fillStyle='#f2eee7';ctx.fillRect(cx-r,cy-r,size,size);const s=Math.max(size/img.width,size/img.height),w=img.width*s,h=img.height*s;ctx.drawImage(img,cx-w/2,cy-h/2,w,h);ctx.restore();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.lineWidth=8;ctx.strokeStyle='#c9a24e';ctx.stroke();ctx.restore();
  };
  img.src=data;
}

alternateDesignBtn.addEventListener('click',()=>{if(!currentResult)return;currentVariant=(currentVariant+1)%3;drawCurrentVariant()});
logoInput.addEventListener('change',e=>readFile(e.target.files[0]));
const dz=document.getElementById('dropZone');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor='#7159df'}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor=''}));
dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)readFile(f)});
const bindings=[['company','companyPreview'],['whatsapp','waPreview'],['instagram','igPreview'],['website','webPreview']];
bindings.forEach(([a,b])=>{const el=document.getElementById(a),out=document.getElementById(b);el.addEventListener('input',()=>out.textContent=el.value.trim()||el.placeholder)});
