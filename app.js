const API_ENDPOINT=(window.CHILD_CARD_API||"").trim();

const $=id=>document.getElementById(id);
const builderView=$("builderView"), publicView=$("publicView");
const form=$("cardForm"), formMessage=$("formMessage"), createBtn=$("createBtn"), createBtnText=$("createBtnText");
const photoInput=$("photoInput"), photoThumb=$("photoThumb");
const resultModal=$("resultModal"), resultLink=$("resultLink");
let photoDataUrl="";
let currentLang="tr";
let currentPublicCard=null;

const I18N={
  tr:{
    pageTitle:"Akıllı Çocuk Acil Durum Kartı",
    brandTitle:"Akıllı Çocuk Acil Durum Kartı",
    brandSubtitle:"Çocuğun bilgileri için bir dakikada bağlantı oluşturun",
    heroTitle:"Çocuk ve ebeveyn bilgileri, NFC etiketi için tek bağlantıda",
    heroText:"Bilgileri girin, önizlemeyi kontrol edin ve “Bağlantı oluştur” düğmesine basın. Kopyaladığınız bağlantıyı doğrudan NFC etiketine yazabilirsiniz.",
    trust1:"Hesap gerektirmez",trust2:"Düzenleme bağlantısı yok",trust3:"Bağlantı yalnızca görüntüleme içindir",
    childInfoTitle:"Çocuk bilgileri",childInfoDesc:"Yalnızca NFC etiketi okutulduğunda görünmesini istediğiniz bilgileri ekleyin.",
    childPhoto:"Çocuk fotoğrafı",optional:"İsteğe bağlı",photoHint:"Net bir fotoğraf seçmek için dokunun",
    childNameLabel:"Çocuğun adı *",childNamePlaceholder:"Örnek: Emir Yılmaz",
    birthDateLabel:"Doğum tarihi",bloodTypeLabel:"Kan grubu",notSpecified:"Belirtilmedi",
    childLanguageLabel:"Çocuğun anladığı dil",childLanguagePlaceholder:"Türkçe, Arapça...",
    allergiesLabel:"Alerji veya önemli ilaçlar",allergiesPlaceholder:"Örnek: Penisilin alerjisi",
    medicalNoteLabel:"Tıbbi veya önemli not",medicalNotePlaceholder:"Çocuğu bulan kişinin bilmesi gereken önemli bilgi",
    areaLabel:"Şehir / Bölge",areaPlaceholder:"Örnek: İstanbul - Esenyurt",privacyHint:"Tam ev adresinin yazılmaması önerilir.",
    parentsTitle:"Ebeveyn bilgileri",parentsDesc:"İki ana telefon numarası doğrudan arama düğmesi olarak gösterilir.",
    parent1Title:"Baba / Birinci veli",parent2Title:"Anne / İkinci veli",requiredTag:"Zorunlu",
    nameLabel:"Ad *",nameLabelPlain:"Ad",phoneLabel:"Telefon numarası *",phoneLabelPlain:"Telefon numarası",
    parent1Placeholder:"Babanın adı",parent2Placeholder:"Annenin adı",
    thirdContactTitle:"Üçüncü acil durum kişisi ekle",thirdContactPlaceholder:"Dede, amca, akraba...",
    consentText:"Bu bilgileri girmeye yetkili olduğumu ve bağlantıya sahip olan herkesin bu bilgileri görebileceğini kabul ediyorum.",
    createLink:"Bağlantı oluştur",creatingLink:"Bağlantı oluşturuluyor...",
    livePreview:"Canlı önizleme",previewDesc:"Bağlantı açıldığında kart böyle görünecek",
    emergencyCard:"Acil Durum Kartı",foundText:"Bu çocuğu bulduysanız lütfen ailesiyle hemen iletişime geçin.",
    languageShort:"Dil",callParent1:"Birinci veliyi ara",callParent2:"İkinci veliyi ara",
    importantInfo:"Önemli bilgiler",noExtraInfo:"Ek bilgi yok.",allergyPrefix:"Alerji / ilaçlar: ",
    cityArea:"Şehir / Bölge",childNameFallback:"Çocuğun adı",fatherFallback:"Babanın adı",motherFallback:"Annenin adı",
    loadingCard:"Acil durum kartı açılıyor...",cannotOpen:"Kart açılamadı",checkLink:"Bağlantıyı kontrol edip tekrar deneyin.",
    linkReady:"Bağlantı hazır",linkReadyDesc:"Bu bağlantıyı kopyalayın ve NFC etiketine yazın. Kopyalama işleminden sonra formdaki bilgiler temizlenecektir.",
    copyLink:"Bağlantıyı kopyala",copied:"Kopyalandı ✓",openLink:"Bağlantıyı kontrol et",
    noEditNote:"Düzenleme bağlantısı yoktur. Yanlış bilgi varsa yeni bir kart ve yeni bir bağlantı oluşturun.",
    imageTooLarge:"Fotoğraf çok büyük. 8 MB'den küçük bir fotoğraf seçin.",imageReadError:"Fotoğraf okunamadı.",
    requiredError:"Çocuğun adını ve iki velinin temel bilgilerini tamamlayın.",phoneError:"Ana telefon numaralarını kontrol edin.",
    thirdPhoneError:"Üçüncü acil durum telefon numarasını kontrol edin.",
    backendMissing:"Site arayüzü hazır ancak bağlantı oluşturma servisi bağlı değil.",
    createFailed:"Bağlantı oluşturulamadı.",genericError:"İşlem sırasında bir hata oluştu.",
    cardNotFound:"Kart bulunamadı.",cardLoadFailed:"Kart açılamadı.",serviceMissing:"Kart servisi bağlı değil.",
    parentFallback:"Veli",thirdEmergency:"Ek acil durum kişisi",thirdFallback:"Acil durum kişisi",openWhatsApp:"WhatsApp'ı aç",
    langButton:"عربي",avatarAlt:"Çocuk fotoğrafı"
  },
  ar:{
    pageTitle:"بطاقة طوارئ الطفل الذكية",
    brandTitle:"بطاقة طوارئ الطفل الذكية",
    brandSubtitle:"أنشئ رابط معلومات الطفل خلال دقيقة",
    heroTitle:"معلومات الطفل والأهل في رابط واحد جاهز للميدالية",
    heroText:"اكتب المعلومات، شاهد المعاينة، ثم اضغط «إنشاء الرابط». بعد نسخ الرابط يمكنك برمجته مباشرة على شريحة NFC.",
    trust1:"بدون حساب",trust2:"بدون رابط تعديل",trust3:"الرابط للعرض فقط",
    childInfoTitle:"معلومات الطفل",childInfoDesc:"ضع فقط المعلومات التي تريد أن تظهر عند لمس الميدالية.",
    childPhoto:"صورة الطفل",optional:"اختياري",photoHint:"اضغط لاختيار صورة واضحة",
    childNameLabel:"اسم الطفل *",childNamePlaceholder:"مثال: محمد أحمد",
    birthDateLabel:"تاريخ الميلاد",bloodTypeLabel:"فصيلة الدم",notSpecified:"غير محدد",
    childLanguageLabel:"اللغة التي يفهمها الطفل",childLanguagePlaceholder:"العربية، التركية...",
    allergiesLabel:"الحساسية أو الأدوية المهمة",allergiesPlaceholder:"مثال: حساسية من البنسلين",
    medicalNoteLabel:"ملاحظة طبية أو مهمة",medicalNotePlaceholder:"أي معلومة مهمة لمن يجد الطفل",
    areaLabel:"المدينة / المنطقة",areaPlaceholder:"مثال: إسطنبول - إسنيورت",privacyHint:"يفضل عدم كتابة عنوان المنزل الكامل.",
    parentsTitle:"معلومات الوالدين",parentsDesc:"رقما اتصال أساسيان يظهران كأزرار مباشرة.",
    parent1Title:"الأب / ولي الأمر الأول",parent2Title:"الأم / ولي الأمر الثاني",requiredTag:"أساسي",
    nameLabel:"الاسم *",nameLabelPlain:"الاسم",phoneLabel:"رقم الهاتف *",phoneLabelPlain:"رقم الهاتف",
    parent1Placeholder:"اسم الأب",parent2Placeholder:"اسم الأم",
    thirdContactTitle:"إضافة شخص طوارئ ثالث",thirdContactPlaceholder:"الجد، العم، قريب...",
    consentText:"أؤكد أنني مخوّل بإدخال هذه المعلومات وأفهم أن من يملك رابط الميدالية يمكنه مشاهدتها.",
    createLink:"إنشاء الرابط",creatingLink:"جاري إنشاء الرابط...",
    livePreview:"معاينة مباشرة",previewDesc:"هكذا ستظهر البطاقة عند فتح الرابط",
    emergencyCard:"بطاقة طوارئ",foundText:"إذا وجدت هذا الطفل، يرجى التواصل مع عائلته فوراً.",
    languageShort:"اللغة",callParent1:"اتصل بولي الأمر الأول",callParent2:"اتصل بولي الأمر الثاني",
    importantInfo:"معلومات مهمة",noExtraInfo:"لا توجد معلومات إضافية.",allergyPrefix:"الحساسية / الأدوية: ",
    cityArea:"المدينة / المنطقة",childNameFallback:"اسم الطفل",fatherFallback:"اسم الأب",motherFallback:"اسم الأم",
    loadingCard:"جاري فتح بطاقة الطوارئ...",cannotOpen:"تعذر فتح البطاقة",checkLink:"تحقق من الرابط وحاول مرة أخرى.",
    linkReady:"الرابط جاهز",linkReadyDesc:"انسخ هذا الرابط وبرمجه على شريحة NFC. بعد النسخ سيتم مسح البيانات من هذه الصفحة.",
    copyLink:"نسخ الرابط",copied:"تم النسخ ✓",openLink:"فتح الرابط للتأكد",
    noEditNote:"لا يوجد رابط تعديل. إذا كانت هناك معلومة خاطئة، أنشئ بطاقة جديدة ورابطاً جديداً.",
    imageTooLarge:"حجم الصورة كبير جداً. اختر صورة أصغر من 8MB.",imageReadError:"تعذر قراءة الصورة.",
    requiredError:"أكمل اسم الطفل وبيانات الوالدين الأساسية.",phoneError:"تأكد من أرقام الهاتف الأساسية.",
    thirdPhoneError:"تأكد من رقم شخص الطوارئ الثالث.",
    backendMissing:"واجهة الموقع جاهزة. بقي فقط ربط خدمة الحفظ المستقلة لإنشاء الروابط الفعلية.",
    createFailed:"تعذر إنشاء الرابط.",genericError:"حدث خطأ أثناء تنفيذ الطلب.",
    cardNotFound:"البطاقة غير موجودة.",cardLoadFailed:"تعذر فتح البطاقة.",serviceMissing:"خدمة البطاقة لم يتم ربطها بعد.",
    parentFallback:"ولي الأمر",thirdEmergency:"شخص طوارئ إضافي",thirdFallback:"شخص طوارئ",openWhatsApp:"فتح WhatsApp",
    langButton:"Türkçe",avatarAlt:"صورة الطفل"
  }
};
const t=key=>I18N[currentLang][key]||key;

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
  try{return new Intl.DateTimeFormat(currentLang==="ar"?"ar":"tr-TR",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v+"T12:00:00"))}
  catch{return v}
}
function combinedMedical(card){
  const lines=[];
  if(card.allergies)lines.push(t("allergyPrefix")+card.allergies);
  if(card.medicalNote)lines.push(card.medicalNote);
  return lines.join("\n")||t("noExtraInfo");
}
function setAvatar(el,dataUrl){
  el.textContent="";
  if(dataUrl){
    const img=document.createElement("img");img.src=dataUrl;img.alt=t("avatarAlt");el.appendChild(img);
  }else{
    el.textContent="👦🏻";
  }
}
function applyStaticTranslations(){
  document.documentElement.lang=currentLang;
  document.documentElement.dir=currentLang==="ar"?"rtl":"ltr";
  document.body.classList.toggle("lang-ar",currentLang==="ar");
  document.body.classList.toggle("lang-tr",currentLang==="tr");
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key=el.dataset.i18n;
    if(I18N[currentLang][key])el.textContent=I18N[currentLang][key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    const key=el.dataset.i18nPlaceholder;
    if(I18N[currentLang][key])el.setAttribute("placeholder",I18N[currentLang][key]);
  });
  ["langToggleBuilder","langTogglePublic"].forEach(id=>{
    const btn=$(id);if(btn){btn.textContent=t("langButton");btn.setAttribute("aria-label",t("langButton"))}
  });
  if(!createBtn.disabled)createBtnText.textContent=t("createLink");
}
function setLanguage(lang){
  currentLang=lang==="ar"?"ar":"tr";
  applyStaticTranslations();
  if(currentPublicCard)renderPublic(currentPublicCard);
  else updatePreview();
}
function toggleLanguage(){setLanguage(currentLang==="tr"?"ar":"tr")}
$("langToggleBuilder")?.addEventListener("click",toggleLanguage);
$("langTogglePublic")?.addEventListener("click",toggleLanguage);

function updatePreview(){
  $("previewName").textContent=value("childName")||t("childNameFallback");
  $("previewBlood").textContent=value("bloodType")||"—";
  $("previewBirth").textContent=formatDate(value("birthDate"));
  $("previewLanguage").textContent=value("childLanguage")||"—";
  $("previewParent1Name").textContent=value("parent1Name")||t("fatherFallback");
  $("previewParent2Name").textContent=value("parent2Name")||t("motherFallback");
  $("previewMedical").textContent=combinedMedical({allergies:value("allergies"),medicalNote:value("medicalNote")});
  $("previewArea").textContent=value("area")||t("cityArea");
  const p1=cleanPhone(value("parent1Phone")),p2=cleanPhone(value("parent2Phone"));
  $("previewParent1Call").href=p1?"tel:"+p1:"#";
  $("previewParent2Call").href=p2?"tel:"+p2:"#";
  setAvatar($("previewAvatar"),photoDataUrl);
}
Object.values(fields).forEach(el=>el.addEventListener("input",updatePreview));

async function compressPhoto(file){
  if(!file||!file.type.startsWith("image/"))return "";
  if(file.size>8*1024*1024)throw new Error(t("imageTooLarge"));
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
    photoThumb.innerHTML="";const img=document.createElement("img");img.src=photoDataUrl;img.alt=t("avatarAlt");photoThumb.appendChild(img);
    updatePreview();
  }catch(err){formMessage.textContent=err.message||t("imageReadError")}
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
  if(!card.child_name||!card.parent1_name||!card.parent1_phone||!card.parent2_name||!card.parent2_phone)return t("requiredError");
  if(cleanPhone(card.parent1_phone).replace("+","").length<8||cleanPhone(card.parent2_phone).replace("+","").length<8)return t("phoneError");
  if(card.emergency_phone&&cleanPhone(card.emergency_phone).replace("+","").length<8)return t("thirdPhoneError");
  return "";
}
form.addEventListener("submit",async e=>{
  e.preventDefault();formMessage.textContent="";
  if(!form.reportValidity())return;
  const card=collectCard(),problem=validateCard(card);
  if(problem){formMessage.textContent=problem;return}
  if(!API_ENDPOINT){
    formMessage.textContent=t("backendMissing");
    return;
  }
  createBtn.disabled=true;createBtnText.textContent=t("creatingLink");
  try{
    const res=await fetch(API_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"create",card,photo_data_url:photoDataUrl||null})});
    const out=await res.json().catch(()=>({}));
    if(!res.ok||!out.ok||!out.id)throw new Error(t("createFailed"));
    const url=new URL(window.location.href);url.search="";url.hash="";url.searchParams.set("id",out.id);
    resultLink.value=url.toString();
    resultModal.classList.remove("hidden");
  }catch(err){
    formMessage.textContent=err.message||t("genericError");
  }finally{
    createBtn.disabled=false;createBtnText.textContent=t("createLink");
  }
});

function resetBuilder(){
  form.reset();photoDataUrl="";photoThumb.innerHTML="<span>＋</span>";updatePreview();
}
$("copyLinkBtn").addEventListener("click",async()=>{
  const text=resultLink.value;
  try{await navigator.clipboard.writeText(text)}
  catch{resultLink.focus();resultLink.select();document.execCommand("copy")}
  $("copyLinkBtn").textContent=t("copied");
  resetBuilder();
  setTimeout(()=>{$("copyLinkBtn").textContent=t("copyLink")},1800);
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
    const wa=document.createElement("a");wa.className="wa-link";wa.href="https://wa.me/"+digits;wa.target="_blank";wa.rel="noopener";wa.textContent=t("openWhatsApp");wrap.appendChild(wa);
  }
  return wrap;
}
function renderPublic(card){
  currentPublicCard=card;
  $("publicName").textContent=card.child_name||t("childNameFallback");
  setAvatar($("publicAvatar"),card.photo_url||card.photo_data_url||"");
  const quick=$("publicQuickInfo");quick.innerHTML="";
  appendQuickInfo(quick,t("bloodTypeLabel"),card.blood_type);
  appendQuickInfo(quick,t("birthDateLabel"),card.birth_date?formatDate(card.birth_date):"");
  appendQuickInfo(quick,t("languageShort"),card.child_language);
  if(!quick.children.length)quick.classList.add("hidden");else quick.classList.remove("hidden");

  const contacts=$("publicContacts");contacts.innerHTML="";
  if(card.parent1_phone)contacts.appendChild(makeContact(t("callParent1"),card.parent1_name||t("parentFallback"),card.parent1_phone,"primary-contact"));
  if(card.parent2_phone)contacts.appendChild(makeContact(t("callParent2"),card.parent2_name||t("parentFallback"),card.parent2_phone,"secondary-contact"));
  if(card.emergency_phone)contacts.appendChild(makeContact(t("thirdEmergency"),card.emergency_name||t("thirdFallback"),card.emergency_phone,"third-contact"));

  const med=combinedMedical({allergies:card.allergies||"",medicalNote:card.medical_note||""});
  if(card.allergies||card.medical_note){$("publicMedical").textContent=med;$("publicMedicalBlock").classList.remove("hidden")}else $("publicMedicalBlock").classList.add("hidden");
  if(card.area){$("publicArea").textContent=card.area;$("publicAreaRow").classList.remove("hidden")}else $("publicAreaRow").classList.add("hidden");
  $("publicLoading").classList.add("hidden");$("publicCard").classList.remove("hidden");
}
async function loadPublic(id){
  builderView.classList.add("hidden");publicView.classList.remove("hidden");
  if(!API_ENDPOINT){showPublicError(t("serviceMissing"));return}
  try{
    const u=new URL(API_ENDPOINT);u.searchParams.set("id",id);
    const res=await fetch(u.toString(),{headers:{"Accept":"application/json"}});
    const out=await res.json().catch(()=>({}));
    if(!res.ok||!out.ok||!out.card)throw new Error(t("cardNotFound"));
    renderPublic(out.card);
  }catch(err){showPublicError(err.message||t("cardLoadFailed"))}
}
function showPublicError(msg){
  $("publicLoading").classList.add("hidden");$("publicErrorText").textContent=msg;$("publicError").classList.remove("hidden");
}
const publicId=new URLSearchParams(location.search).get("id");
applyStaticTranslations();
if(publicId&&/^[A-Za-z0-9_-]{6,32}$/.test(publicId))loadPublic(publicId);
else updatePreview();
