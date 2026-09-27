const API_ENDPOINT=(window.CHILD_CARD_API||"").trim();

const $=id=>document.getElementById(id);
const builderView=$("builderView"), publicView=$("publicView");
const form=$("cardForm"), formMessage=$("formMessage"), createBtn=$("createBtn"), createBtnText=$("createBtnText");
const photoInput=$("photoInput"), photoThumb=$("photoThumb");
const resultModal=$("resultModal"), resultLink=$("resultLink");
let photoDataUrl="";

const fields={
  childName:$("childName"),birthDate:$("birthDate"),bloodType:$("bloodType"),childLanguage:$("childLanguage"),
  allergies:$("allergies"),medicalNote:$("medicalNote"),area:$("area"),
  parent1Name:$("parent1Name"),parent1Phone:$("parent1Phone"),
  parent2Name:$("parent2Name"),parent2Phone:$("parent2Phone"),
  emergencyName:$("emergencyName"),emergencyPhone:$("emergencyPhone")
};

function value(id){return (fields[id]?.value||"").trim()}
function cleanPhone(v){return String(v||"").replace(/[^+\d]/g,"")}
function phoneDisplay(v){return String(v||"").trim()}
function formatDate(v){
  if(!v)return "—";
  try{return new Intl.DateTimeFormat("ar",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v+"T12:00:00"))}
  catch{return v}
}
function combinedMedical(card){
  const lines=[];
  if(card.allergies)lines.push("الحساسية / الأدوية: "+card.allergies);
  if(card.medicalNote)lines.push(card.medicalNote);
  return lines.join("\n")||"لا توجد معلومات إضافية.";
}
function setAvatar(el,dataUrl){
  el.textContent="";
  if(dataUrl){
    const img=document.createElement("img");img.src=dataUrl;img.alt="صورة الطفل";el.appendChild(img);
  }else{
    el.textContent="👦🏻";
  }
}
function updatePreview(){
  $("previewName").textContent=value("childName")||"اسم الطفل";
  $("previewBlood").textContent=value("bloodType")||"—";
  $("previewBirth").textContent=formatDate(value("birthDate"));
  $("previewLanguage").textContent=value("childLanguage")||"—";
  $("previewParent1Name").textContent=value("parent1Name")||"اسم الأب";
  $("previewParent2Name").textContent=value("parent2Name")||"اسم الأم";
  $("previewMedical").textContent=combinedMedical({allergies:value("allergies"),medicalNote:value("medicalNote")});
  $("previewArea").textContent=value("area")||"المدينة / المنطقة";
  const p1=cleanPhone(value("parent1Phone")),p2=cleanPhone(value("parent2Phone"));
  $("previewParent1Call").href=p1?"tel:"+p1:"#";
  $("previewParent2Call").href=p2?"tel:"+p2:"#";
  setAvatar($("previewAvatar"),photoDataUrl);
}
Object.values(fields).forEach(el=>el.addEventListener("input",updatePreview));

async function compressPhoto(file){
  if(!file||!file.type.startsWith("image/"))return "";
  if(file.size>8*1024*1024)throw new Error("حجم الصورة كبير جداً. اختر صورة أصغر من 8MB.");
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=data});
  const max=720,scale=Math.min(1,max/Math.max(img.width,img.height));
  const c=document.createElement("canvas");c.width=Math.max(1,Math.round(img.width*scale));c.height=Math.max(1,Math.round(img.height*scale));
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  return c.toDataURL("image/jpeg",.72);
}
photoInput.addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    photoDataUrl=await compressPhoto(file);
    photoThumb.innerHTML="";const img=document.createElement("img");img.src=photoDataUrl;img.alt="صورة الطفل";photoThumb.appendChild(img);
    updatePreview();
  }catch(err){formMessage.textContent=err.message||"تعذر قراءة الصورة."}
});

function collectCard(){
  return{
    child_name:value("childName"),
    birth_date:value("birthDate")||null,
    blood_type:value("bloodType")||null,
    child_language:value("childLanguage")||null,
    allergies:value("allergies")||null,
    medical_note:value("medicalNote")||null,
    area:value("area")||null,
    parent1_name:value("parent1Name"),
    parent1_phone:phoneDisplay(value("parent1Phone")),
    parent2_name:value("parent2Name"),
    parent2_phone:phoneDisplay(value("parent2Phone")),
    emergency_name:value("emergencyName")||null,
    emergency_phone:phoneDisplay(value("emergencyPhone"))||null
  };
}
function validateCard(card){
  if(!card.child_name||!card.parent1_name||!card.parent1_phone||!card.parent2_name||!card.parent2_phone)return "أكمل اسم الطفل وبيانات الوالدين الأساسية.";
  if(cleanPhone(card.parent1_phone).replace("+","").length<8||cleanPhone(card.parent2_phone).replace("+","").length<8)return "تأكد من أرقام الهاتف الأساسية.";
  if(card.emergency_phone&&cleanPhone(card.emergency_phone).replace("+","").length<8)return "تأكد من رقم شخص الطوارئ الثالث.";
  return "";
}
form.addEventListener("submit",async e=>{
  e.preventDefault();formMessage.textContent="";
  if(!form.reportValidity())return;
  const card=collectCard(),problem=validateCard(card);
  if(problem){formMessage.textContent=problem;return}
  if(!API_ENDPOINT){
    formMessage.textContent="واجهة الموقع جاهزة. بقي فقط ربط خدمة الحفظ المستقلة لإنشاء الروابط الفعلية.";
    return;
  }
  createBtn.disabled=true;createBtnText.textContent="جاري إنشاء الرابط...";
  try{
    const res=await fetch(API_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"create",card,photo_data_url:photoDataUrl||null})});
    const out=await res.json().catch(()=>({}));
    if(!res.ok||!out.ok||!out.id)throw new Error(out.error||"تعذر إنشاء الرابط.");
    const url=new URL(window.location.href);url.search="";url.hash="";url.searchParams.set("id",out.id);
    resultLink.value=url.toString();
    resultModal.classList.remove("hidden");
  }catch(err){
    formMessage.textContent=err.message||"حدث خطأ أثناء إنشاء الرابط.";
  }finally{
    createBtn.disabled=false;createBtnText.textContent="إنشاء الرابط";
  }
});

function resetBuilder(){
  form.reset();photoDataUrl="";photoThumb.innerHTML="<span>＋</span>";updatePreview();
}
$("copyLinkBtn").addEventListener("click",async()=>{
  const text=resultLink.value;
  try{await navigator.clipboard.writeText(text)}
  catch{resultLink.focus();resultLink.select();document.execCommand("copy")}
  $("copyLinkBtn").textContent="تم النسخ ✓";
  resetBuilder();
  setTimeout(()=>{$("copyLinkBtn").textContent="نسخ الرابط"},1800);
});
$("openLinkBtn").addEventListener("click",()=>{if(resultLink.value)window.open(resultLink.value,"_blank","noopener")});

function appendQuickInfo(container,label,val){
  if(!val)return;
  const box=document.createElement("div"),s=document.createElement("span"),b=document.createElement("b");
  s.textContent=label;b.textContent=val;box.append(s,b);container.appendChild(box);
}
function makeContact(label,name,phone,variant){
  const wrap=document.createElement("div");wrap.className="public-contact-group";
  const call=document.createElement("a");call.className="contact-btn "+variant;call.href="tel:"+cleanPhone(phone);
  const icon=document.createElement("span");icon.className="contact-icon";icon.textContent="☎";
  const txt=document.createElement("span"),small=document.createElement("small"),bold=document.createElement("b");
  small.textContent=label;bold.textContent=name+" • "+phone;txt.append(small,bold);call.append(icon,txt);wrap.appendChild(call);
  const digits=cleanPhone(phone).replace("+","");
  if(digits){
    const wa=document.createElement("a");wa.className="wa-link";wa.href="https://wa.me/"+digits;wa.target="_blank";wa.rel="noopener";wa.textContent="فتح WhatsApp";wrap.appendChild(wa);
  }
  return wrap;
}
function renderPublic(card){
  $("publicName").textContent=card.child_name||"طفل";
  setAvatar($("publicAvatar"),card.photo_url||card.photo_data_url||"");
  const quick=$("publicQuickInfo");quick.innerHTML="";
  appendQuickInfo(quick,"فصيلة الدم",card.blood_type);
  appendQuickInfo(quick,"تاريخ الميلاد",card.birth_date?formatDate(card.birth_date):"");
  appendQuickInfo(quick,"اللغة",card.child_language);
  if(!quick.children.length)quick.classList.add("hidden");else quick.classList.remove("hidden");

  const contacts=$("publicContacts");contacts.innerHTML="";
  if(card.parent1_phone)contacts.appendChild(makeContact("اتصل بولي الأمر الأول",card.parent1_name||"ولي الأمر",card.parent1_phone,"primary-contact"));
  if(card.parent2_phone)contacts.appendChild(makeContact("اتصل بولي الأمر الثاني",card.parent2_name||"ولي الأمر",card.parent2_phone,"secondary-contact"));
  if(card.emergency_phone)contacts.appendChild(makeContact("شخص طوارئ إضافي",card.emergency_name||"شخص طوارئ",card.emergency_phone,"third-contact"));

  const med=combinedMedical({allergies:card.allergies||"",medicalNote:card.medical_note||""});
  if(card.allergies||card.medical_note){$("publicMedical").textContent=med;$("publicMedicalBlock").classList.remove("hidden")}else $("publicMedicalBlock").classList.add("hidden");
  if(card.area){$("publicArea").textContent=card.area;$("publicAreaRow").classList.remove("hidden")}else $("publicAreaRow").classList.add("hidden");
  $("publicLoading").classList.add("hidden");$("publicCard").classList.remove("hidden");
}
async function loadPublic(id){
  builderView.classList.add("hidden");publicView.classList.remove("hidden");
  if(!API_ENDPOINT){showPublicError("خدمة البطاقة لم يتم ربطها بعد.");return}
  try{
    const u=new URL(API_ENDPOINT);u.searchParams.set("id",id);
    const res=await fetch(u.toString(),{headers:{"Accept":"application/json"}});
    const out=await res.json().catch(()=>({}));
    if(!res.ok||!out.ok||!out.card)throw new Error(out.error||"البطاقة غير موجودة.");
    renderPublic(out.card);
  }catch(err){showPublicError(err.message||"تعذر فتح البطاقة.")}
}
function showPublicError(msg){
  $("publicLoading").classList.add("hidden");$("publicErrorText").textContent=msg;$("publicError").classList.remove("hidden");
}
const publicId=new URLSearchParams(location.search).get("id");
if(publicId&&/^[A-Za-z0-9_-]{6,32}$/.test(publicId))loadPublic(publicId);
else updatePreview();
