const logoInput=document.getElementById('logoInput');
const removeBg=document.getElementById('removeBg');
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
let originalData='';

function readFile(file){
  if(!file||!file.type.startsWith('image/'))return;
  fileName.textContent=file.name;
  const r=new FileReader();
  r.onload=()=>{originalData=r.result;processLogo()};
  r.readAsDataURL(file);
}

function averageCornerColor(c,x){
  const size=Math.max(4,Math.round(Math.min(c.width,c.height)*0.08));
  const pts=[[0,0],[c.width-size,0],[0,c.height-size],[c.width-size,c.height-size]];
  let rs=0,gs=0,bs=0,count=0;
  for(const [sx,sy] of pts){
    const p=x.getImageData(sx,sy,size,size).data;
    for(let i=0;i<p.length;i+=4){
      if(p[i+3]<20)continue;
      rs+=p[i];gs+=p[i+1];bs+=p[i+2];count++;
    }
  }
  if(!count)return null;
  return [rs/count,gs/count,bs/count];
}

function removeDetectedBackground(c,x){
  const bg=averageCornerColor(c,x);
  if(!bg)return;
  const brightness=(bg[0]+bg[1]+bg[2])/3;
  const spread=Math.max(...bg)-Math.min(...bg);
  if(spread>55)return;
  const p=x.getImageData(0,0,c.width,c.height),d=p.data;
  const hard=brightness<90?48:42;
  const soft=brightness<90?105:92;
  for(let i=0;i<d.length;i+=4){
    const dr=d[i]-bg[0],dg=d[i+1]-bg[1],db=d[i+2]-bg[2];
    const dist=Math.sqrt(dr*dr+dg*dg+db*db);
    if(dist<=hard)d[i+3]=0;
    else if(dist<soft)d[i+3]=Math.min(d[i+3],Math.round(255*(dist-hard)/(soft-hard)));
  }
  x.putImageData(p,0,0);
}

function cropToContent(source){
  const sx=source.getContext('2d',{willReadFrequently:true});
  const p=sx.getImageData(0,0,source.width,source.height),d=p.data;
  let minX=source.width,minY=source.height,maxX=-1,maxY=-1;
  for(let y=0;y<source.height;y++){
    for(let x=0;x<source.width;x++){
      const a=d[(y*source.width+x)*4+3];
      if(a>24){
        if(x<minX)minX=x;if(x>maxX)maxX=x;
        if(y<minY)minY=y;if(y>maxY)maxY=y;
      }
    }
  }
  if(maxX<0||maxY<0)return source;
  const rawW=maxX-minX+1,rawH=maxY-minY+1;
  const margin=Math.max(8,Math.round(Math.max(rawW,rawH)*0.06));
  minX=Math.max(0,minX-margin);minY=Math.max(0,minY-margin);
  maxX=Math.min(source.width-1,maxX+margin);maxY=Math.min(source.height-1,maxY+margin);
  const out=document.createElement('canvas');
  out.width=maxX-minX+1;out.height=maxY-minY+1;
  out.getContext('2d').drawImage(source,minX,minY,out.width,out.height,0,0,out.width,out.height);
  return out;
}

function processLogo(){
  if(!originalData)return;
  const img=new Image();
  img.onload=()=>{
    const max=1400,scale=Math.min(1,max/Math.max(img.width,img.height));
    const c=document.createElement('canvas');
    c.width=Math.max(1,Math.round(img.width*scale));
    c.height=Math.max(1,Math.round(img.height*scale));
    const x=c.getContext('2d',{willReadFrequently:true});
    x.drawImage(img,0,0,c.width,c.height);
    if(removeBg.checked)removeDetectedBackground(c,x);
    const cropped=cropToContent(c);
    renderAll(cropped.toDataURL('image/png'));
  };
  img.src=originalData;
}

function renderAll(data){
  uploadThumb.src=data;
  uploadEmpty.classList.add('hidden');
  uploadFilled.classList.remove('hidden');
  keychainEmpty.classList.add('hidden');
  keychainWrap.classList.remove('hidden');
  profileLogo.src=data;
  profileLogo.style.display='block';
  profilePlaceholder.style.display='none';
  drawKeychain(data);
}

function drawKeychain(data){
  const img=new Image();
  img.onload=()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const pad=34;
    const s=Math.min((canvas.width-pad*2)/img.width,(canvas.height-pad*2)/img.height);
    const w=img.width*s,h=img.height*s,x=(canvas.width-w)/2,y=(canvas.height-h)/2;
    const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
    const mx=mask.getContext('2d');mx.drawImage(img,x,y,w,h);
    const radius=Math.max(7,Math.round(Math.min(w,h)*0.035));
    const body=document.createElement('canvas');body.width=canvas.width;body.height=canvas.height;
    const bx=body.getContext('2d');
    for(let dy=-radius;dy<=radius;dy+=3){
      for(let dx=-radius;dx<=radius;dx+=3){
        if(dx*dx+dy*dy<=radius*radius)bx.drawImage(mask,dx,dy);
      }
    }
    ctx.save();
    ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=24;ctx.shadowOffsetY=18;
    ctx.drawImage(body,0,0);
    ctx.globalCompositeOperation='source-in';ctx.fillStyle='#171820';ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
    ctx.save();
    ctx.drawImage(mask,0,0);
    ctx.globalCompositeOperation='source-in';
    const gold=ctx.createLinearGradient(0,y,0,y+h);gold.addColorStop(0,'#e2c576');gold.addColorStop(.5,'#c49d49');gold.addColorStop(1,'#9a742d');
    ctx.fillStyle=gold;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.restore();
    ctx.save();ctx.globalAlpha=.18;ctx.translate(5,7);ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
  };
  img.src=data;
}

logoInput.addEventListener('change',e=>readFile(e.target.files[0]));
removeBg.addEventListener('change',processLogo);
const dz=document.getElementById('dropZone');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor='#7159df'}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor=''}));
dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)readFile(f)});
const bindings=[['company','companyPreview'],['whatsapp','waPreview'],['instagram','igPreview'],['website','webPreview']];
bindings.forEach(([a,b])=>{const el=document.getElementById(a),out=document.getElementById(b);el.addEventListener('input',()=>out.textContent=el.value.trim()||el.placeholder)});
const orderBtn=document.getElementById('orderBtn');
orderBtn.addEventListener('click',e=>{
  e.preventDefault();
  const company=document.getElementById('company').value.trim()||'بدون اسم';
  const msg=`مرحبا، جربت معاينة الميدالية والموقع لشركة ${company} وأريد الاستفسار عن الطلب.`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank');
});
