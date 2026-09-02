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
let originalData='';

function readFile(file){
  if(!file||!file.type.startsWith('image/'))return;
  fileName.textContent=file.name;
  const r=new FileReader();
  r.onload=()=>{originalData=r.result;processLogo()};
  r.readAsDataURL(file);
}

function hasRealTransparency(c,x){
  const d=x.getImageData(0,0,c.width,c.height).data;
  let transparent=0,total=0;
  const step=Math.max(1,Math.floor(Math.sqrt((c.width*c.height)/50000)));
  for(let y=0;y<c.height;y+=step){
    for(let xx=0;xx<c.width;xx+=step){
      const a=d[(y*c.width+xx)*4+3];total++;if(a<220)transparent++;
    }
  }
  return total&&transparent/total>.015;
}

function borderBrightness(c,x){
  const d=x.getImageData(0,0,c.width,c.height).data;
  const band=Math.max(2,Math.round(Math.min(c.width,c.height)*.035));
  let sum=0,count=0;
  function add(xx,y){const i=(y*c.width+xx)*4;if(d[i+3]<20)return;sum+=(d[i]+d[i+1]+d[i+2])/3;count++}
  for(let y=0;y<c.height;y+=2){for(let xx=0;xx<band;xx+=2){add(xx,y);add(c.width-1-xx,y)}}
  for(let xx=0;xx<c.width;xx+=2){for(let y=0;y<band;y+=2){add(xx,y);add(xx,c.height-1-y)}}
  return count?sum/count:255;
}

function autoRemoveBlackOrWhite(c,x){
  if(hasRealTransparency(c,x))return;
  const bg=borderBrightness(c,x);
  const darkBackground=bg<128;
  const p=x.getImageData(0,0,c.width,c.height),d=p.data;
  for(let i=0;i<d.length;i+=4){
    const r=d[i],g=d[i+1],b=d[i+2];
    let score;
    if(darkBackground){
      score=Math.max(r,g,b);
      const start=28,end=92;
      if(score<=start)d[i+3]=0;
      else if(score<end)d[i+3]=Math.round(255*(score-start)/(end-start));
    }else{
      score=255-Math.min(r,g,b);
      const start=24,end=84;
      if(score<=start)d[i+3]=0;
      else if(score<end)d[i+3]=Math.round(255*(score-start)/(end-start));
    }
  }
  x.putImageData(p,0,0);
}

function cropToContent(source){
  const sx=source.getContext('2d',{willReadFrequently:true});
  const p=sx.getImageData(0,0,source.width,source.height),d=p.data;
  let minX=source.width,minY=source.height,maxX=-1,maxY=-1;
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
    const a=d[(y*source.width+x)*4+3];
    if(a>35){if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y}
  }
  if(maxX<0||maxY<0)return source;
  const rawW=maxX-minX+1,rawH=maxY-minY+1;
  const margin=Math.max(6,Math.round(Math.max(rawW,rawH)*.045));
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
    autoRemoveBlackOrWhite(c,x);
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

function alphaMaskFromImage(img,w,h,x,y){
  const m=document.createElement('canvas');m.width=canvas.width;m.height=canvas.height;
  const mx=m.getContext('2d',{willReadFrequently:true});
  mx.drawImage(img,x,y,w,h);
  const p=mx.getImageData(0,0,m.width,m.height),d=p.data;
  for(let i=0;i<d.length;i+=4){const a=d[i+3];d[i]=255;d[i+1]=255;d[i+2]=255;d[i+3]=a>18?a:0}
  mx.putImageData(p,0,0);return m;
}

function coloredLayer(mask,fillStyle){
  const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;
  const lx=layer.getContext('2d');
  lx.drawImage(mask,0,0);
  lx.globalCompositeOperation='source-in';
  lx.fillStyle=fillStyle;
  lx.fillRect(0,0,layer.width,layer.height);
  lx.globalCompositeOperation='source-over';
  return layer;
}

function drawKeychain(data){
  const img=new Image();
  img.onload=()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const pad=18;
    const s=Math.min((canvas.width-pad*2)/img.width,(canvas.height-pad*2)/img.height);
    const w=img.width*s,h=img.height*s,x=(canvas.width-w)/2,y=(canvas.height-h)/2;
    const mask=alphaMaskFromImage(img,w,h,x,y);

    const radius=Math.max(9,Math.round(Math.min(w,h)*.045));
    const bodyMask=document.createElement('canvas');bodyMask.width=canvas.width;bodyMask.height=canvas.height;
    const bx=bodyMask.getContext('2d');
    for(let dy=-radius;dy<=radius;dy+=2){
      for(let dx=-radius;dx<=radius;dx+=2){
        if(dx*dx+dy*dy<=radius*radius)bx.drawImage(mask,dx,dy);
      }
    }

    const body=coloredLayer(bodyMask,'#22242d');
    ctx.save();ctx.shadowColor='rgba(0,0,0,.62)';ctx.shadowBlur=24;ctx.shadowOffsetY=18;ctx.drawImage(body,0,0);ctx.restore();

    const goldGradient=document.createElement('canvas');goldGradient.width=canvas.width;goldGradient.height=canvas.height;
    const gx=goldGradient.getContext('2d');
    const gold=gx.createLinearGradient(0,y,0,y+h);gold.addColorStop(0,'#f0d990');gold.addColorStop(.45,'#d4ad57');gold.addColorStop(1,'#a77b2f');
    gx.fillStyle=gold;gx.fillRect(0,0,goldGradient.width,goldGradient.height);
    gx.globalCompositeOperation='destination-in';gx.drawImage(mask,0,0);gx.globalCompositeOperation='source-over';
    ctx.drawImage(goldGradient,0,0);

    const highlight=document.createElement('canvas');highlight.width=canvas.width;highlight.height=canvas.height;
    const hx=highlight.getContext('2d');hx.drawImage(mask,-2,-3);hx.globalCompositeOperation='source-in';hx.fillStyle='rgba(255,244,196,.34)';hx.fillRect(0,0,highlight.width,highlight.height);hx.globalCompositeOperation='source-over';ctx.drawImage(highlight,0,0);
  };
  img.src=data;
}

logoInput.addEventListener('change',e=>readFile(e.target.files[0]));
const dz=document.getElementById('dropZone');
['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor='#7159df'}));
['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.style.borderColor=''}));
dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)readFile(f)});
const bindings=[['company','companyPreview'],['whatsapp','waPreview'],['instagram','igPreview'],['website','webPreview']];
bindings.forEach(([a,b])=>{const el=document.getElementById(a),out=document.getElementById(b);el.addEventListener('input',()=>out.textContent=el.value.trim()||el.placeholder)});
const orderBtn=document.getElementById('orderBtn');
orderBtn.addEventListener('click',e=>{e.preventDefault();const company=document.getElementById('company').value.trim()||'بدون اسم';const msg=`مرحبا، جربت معاينة الميدالية والموقع لشركة ${company} وأريد الاستفسار عن الطلب.`;window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,'_blank')});