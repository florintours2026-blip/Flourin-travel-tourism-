import { auth, db } from './firebase-config.js';
import { AIRPORTS, AIRLINES, DEFAULT_OFFERS, EMPTY_TOUR_PACKAGE } from './catalog-data.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { collection,getDocs,getDoc,doc,setDoc,updateDoc,deleteDoc,serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const $=id=>document.getElementById(id); const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let currentUser=null, offers=[], airlines=[];
const money=(n,c)=>`${Number(n||0).toLocaleString('en-US')} ${c||''}`;

async function isAdmin(user){
  if(!user) return false;
  if(user.uid==='7nE6QoTEPFOk0IhwcZUnymkyzoY2') return true;
  try{
    const snap=await getDoc(doc(db,'admins',user.uid));
    if(!snap.exists()) return false;
    const data=snap.data()||{};
    return data.active===true || data.active==='true';
  }catch(error){
    console.error('FLORIN admin check:',error);
    return false;
  }
}

async function resolveMedia(value){
  if(typeof value!=='string' || !value.startsWith('media:')) return value||'';
  const id=value.slice(6);
  try{
    const snap=await getDoc(doc(db,'media',id));
    return snap.exists() ? String(snap.data()?.data||'') : '';
  }catch(error){
    console.warn('Media read failed:',id,error);
    return '';
  }
}

async function hydrateOffers(rows){
  const cache=new Map();
  const resolve=async(v)=>{
    if(typeof v!=='string' || !v.startsWith('media:')) return v||'';
    if(!cache.has(v)) cache.set(v,resolveMedia(v));
    return cache.get(v);
  };
  return Promise.all(rows.map(async o=>({
    ...o,
    imageRef:o.image||'',
    imagesRaw:arr(o.images),
    image:await resolve(o.image),
    images:await Promise.all(arr(o.images).map(resolve))
  })));
}

function openModal(html){
 const modal=$('modal'),content=$('modalContent');
 if(!modal||!content)return;
 content.innerHTML=html;
 modal.hidden=false;
 modal.classList.add('is-open');
 modal.setAttribute('aria-hidden','false');
 modal.style.display='grid';
 document.body.style.overflow='hidden';
}
function closeModal(){
 const modal=$('modal'),content=$('modalContent');
 if(!modal)return;
 modal.hidden=true;
 modal.classList.remove('is-open');
 modal.setAttribute('aria-hidden','true');
 modal.style.display='none';
 if(content)content.innerHTML='';
 document.body.style.overflow='';
}
function arr(v){return Array.isArray(v)?v:(String(v||'').split('\n').map(x=>x.trim()).filter(Boolean));}

async function loadAll(){
 const os=await getDocs(collection(db,'offers')); offers=await hydrateOffers(os.docs.map(d=>({id:d.id,...d.data()})));
 const as=await getDocs(collection(db,'airlines')); airlines=as.docs.map(d=>({id:d.id,...d.data()}));
 if(!airlines.length) airlines=AIRLINES;
 renderStats();renderFlightTable();renderCatalogTable();renderPackageTable();renderAirlineTable();renderBookings();renderUsers();
}

function renderStats(){ $('stats').innerHTML=[['✈️',offers.filter(x=>x.type==='flight').length,'عروض طيران'],['🏨',offers.filter(x=>x.type!=='flight').length,'عروض فنادق وخدمات'],['🛫',airlines.length,'شركات طيران'],['📋','—','طلبات العملاء']].map(x=>`<div class="stat"><span>${x[0]}</span><b>${x[1]}</b><span>${x[2]}</span></div>`).join(''); }
function renderFlightTable(){const rows=offers.filter(x=>x.type==='flight').sort((a,b)=>Number(a.order||0)-Number(b.order||0));$('flightTable').innerHTML=`<table class="data-table"><thead><tr><th>العرض</th><th>المسار</th><th>الطيران</th><th>السعر</th><th>الخصم</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${rows.map(o=>rowOffer(o)).join('')||`<tr><td colspan="7">لا توجد عروض. استخدم «مزامنة العروض المبدئية».</td></tr>`}</tbody></table>`;bindOfferActions();}
function renderCatalogTable(){const rows=offers.filter(x=>x.type!=='flight');$('catalogTable').innerHTML=`<table class="data-table"><thead><tr><th>الصورة</th><th>العرض</th><th>الوجهة</th><th>السعر</th><th>الخصم</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${rows.map(o=>rowOffer(o)).join('')||`<tr><td colspan="7">لا توجد عروض فنادق/خدمات.</td></tr>`}</tbody></table>`;bindOfferActions();}
function rowOffer(o){const d=o.discount?.enabled;const a=airlines.find(x=>x.id===o.airlineId)||AIRLINES.find(x=>x.id===o.airlineId);return `<tr><td>${o.image?`<img class="thumb" src="${esc(o.image)}" alt="">`:''}</td><td><b>${esc(o.name)}</b><small>${esc(o.category||'')}</small></td><td>${esc(o.type==='flight'?`${o.fromIata||''} → ${o.toIata||''}`:(o.destination||o.country||''))}</td><td>${money(o.price,o.currency)}</td><td>${d?`<span class="pill">${esc(o.discount.label||`${o.discount.value}${o.discount.type==='percent'?'%':''}`)}</span>`:'—'}</td><td><span class="pill ${o.active===false?'off':''}">${o.active===false?'مخفي':'ظاهر'}</span></td><td class="actions"><button data-edit="${esc(o.id)}">تعديل</button><button data-toggle="${esc(o.id)}">${o.active===false?'إظهار':'إخفاء'}</button><button data-delete="${esc(o.id)}">حذف</button></td></tr>`;}
function bindOfferActions(){document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openOfferEditor(offers.find(o=>o.id===b.dataset.edit)));document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{const o=offers.find(x=>x.id===b.dataset.toggle);if(o){await updateDoc(doc(db,'offers',o.id),{active:o.active===false,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});await loadAll();}});document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm('حذف العرض؟')){await deleteDoc(doc(db,'offers',b.dataset.delete));await loadAll();}});}

function discountFields(d={}){return `<div class="field"><label><input type="checkbox" id="e_discount_enabled" ${d.enabled?'checked':''}> تفعيل الخصم</label></div><div class="field"><label>نوع الخصم</label><select id="e_discount_type"><option value="percent" ${d.type==='percent'?'selected':''}>نسبة %</option><option value="fixed" ${d.type==='fixed'?'selected':''}>مبلغ ثابت</option></select></div><div class="field"><label>قيمة الخصم</label><input id="e_discount_value" type="number" min="0" value="${Number(d.value||0)}"></div><div class="field"><label>عبارة الخصم</label><input id="e_discount_label" value="${esc(d.label||'')}" placeholder="مثال: خصم 15%"></div>`;}
function openOfferEditor(o=null){const x=o||{id:'',type:'flight',category:'رحلات طيران',name:'',country:'',destination:'',price:'',currency:'USD',image:'',images:[],description:'',notes:'',active:true,order:0,fromIata:'CAI',toIata:'JED',airlineId:'',cabin:'اقتصادية',baggage:'',duration:'',stopover:'مباشر',hotel:{name:'',stars:5,rooms:[],amenities:[]},discount:{enabled:false,type:'percent',value:0,label:''}};const h=x.hotel||{};openModal(`<h2>${o?'تعديل العرض':'إضافة عرض'}</h2><div class="editor-grid"><div class="field"><label>نوع العرض</label><select id="e_type"><option value="flight" ${x.type==='flight'?'selected':''}>طيران</option><option value="hotel" ${x.type==='hotel'?'selected':''}>فندق</option><option value="service" ${x.type==='service'?'selected':''}>خدمة</option></select></div><div class="field"><label>معرف العرض</label><input id="e_id" value="${esc(x.id)}" ${o?'readonly':''}></div><div class="field full"><label>اسم العرض</label><input id="e_name" value="${esc(x.name)}"></div><div class="field"><label>الدولة</label><input id="e_country" value="${esc(x.country||'')}"></div><div class="field"><label>الوجهة</label><input id="e_destination" value="${esc(x.destination||'')}"></div><div class="field"><label>التصنيف</label><input id="e_category" value="${esc(x.category||'')}"></div><div class="field"><label>السعر</label><input id="e_price" type="number" min="0" value="${esc(x.price)}"></div><div class="field"><label>العملة</label><input id="e_currency" value="${esc(x.currency||'USD')}"></div><div class="field"><label>الصورة الرئيسية (مسار أو URL)</label><input id="e_image" value="${esc(x.image||'')}"></div>

<div class="field full"><label>رفع صور العرض والفندق — متعدد</label><input id="e_files" type="file" accept="image/*" multiple><div class="help">الصور تُضغط تلقائيًا وتُحفظ داخل Firestore بدون الحاجة إلى Firebase Storage أو خطة Blaze.</div></div><div class="field full"><label>صور/روابط إضافية، رابط في كل سطر</label><textarea id="e_images" rows="4">${esc(arr(x.imagesRaw||x.images).filter(v=>!String(v).startsWith('media:') && !String(v).startsWith('data:')).join('\n'))}</textarea></div><div class="field"><label>مطار المغادرة IATA</label><input id="e_from" value="${esc(x.fromIata||'CAI')}"></div><div class="field"><label>مطار الوصول IATA</label><input id="e_to" value="${esc(x.toIata||'JED')}"></div><div class="field"><label>شركة الطيران</label><select id="e_airline"><option value="">بدون شركة</option>${airlines.map(a=>`<option value="${a.id}" ${a.id===x.airlineId?'selected':''}>${esc(a.name)} (${a.iata||''})</option>`).join('')}</select></div><div class="field"><label>الدرجة</label><input id="e_cabin" value="${esc(x.cabin||'اقتصادية')}"></div><div class="field"><label>الأمتعة</label><input id="e_baggage" value="${esc(x.baggage||'')}"></div><div class="field"><label>المدة</label><input id="e_duration" value="${esc(x.duration||'')}"></div><div class="field"><label>التوقف</label><input id="e_stopover" value="${esc(x.stopover||'مباشر')}"></div><div class="field"><label>اسم الفندق</label><input id="e_hotel_name" value="${esc(h.name||'')}"></div><div class="field"><label>نجوم الفندق</label><input id="e_hotel_stars" type="number" min="1" max="5" value="${Number(h.stars||5)}"></div><div class="field full"><label>الغرف — سطر لكل نوع</label><textarea id="e_rooms" rows="3">${esc(arr(h.rooms).join('\n'))}</textarea></div><div class="field full"><label>المرافق — سطر لكل خدمة</label><textarea id="e_amenities" rows="3">${esc(arr(h.amenities).join('\n'))}</textarea></div><div class="field full"><label>الوصف</label><textarea id="e_description" rows="4">${esc(x.description||'')}</textarea></div><div class="field full"><label>ملاحظات</label><textarea id="e_notes" rows="3">${esc(x.notes||'')}</textarea></div><div class="field"><label>الترتيب</label><input id="e_order" type="number" value="${Number(x.order||0)}"></div><div class="field"><label><input id="e_active" type="checkbox" ${x.active!==false?'checked':''}> نشر العرض للعملاء</label></div>${discountFields(x.discount)}</div><div class="editor-actions"><button class="btn primary" id="saveEditor">حفظ العرض</button><button class="btn secondary" id="cancelEditor">إلغاء</button></div>`);$('cancelEditor').onclick=closeModal;$('saveEditor').onclick=()=>saveOffer(o);}
async function fileToDataURL(file){
  if(!file || !file.type.startsWith('image/')) throw new Error(`الملف ${file?.name||''} ليس صورة`);
  if(file.size>12*1024*1024) throw new Error(`الصورة ${file.name} أكبر من 12MB قبل الضغط`);
  if(file.type==='image/svg+xml'){
    const text=await file.text();
    const data='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(text)));
    if(data.length>850000) throw new Error(`ملف SVG ${file.name} كبير جدًا`);
    return data;
  }
  const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
  const max=1280;
  const scale=Math.min(1,max/Math.max(img.width,img.height));
  const w=Math.max(1,Math.round(img.width*scale)), h=Math.max(1,Math.round(img.height*scale));
  const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
  canvas.getContext('2d').drawImage(img,0,0,w,h);
  let quality=.72, data=canvas.toDataURL('image/jpeg',quality);
  while(data.length>780000 && quality>.42){quality-=.06;data=canvas.toDataURL('image/jpeg',quality);}
  if(data.length>850000) throw new Error(`تعذر ضغط الصورة ${file.name} إلى حجم مناسب لـ Firestore`);
  return data;
}

async function uploadFiles(input,path){
  if(!input?.files?.length) return [];
  const refs=[];
  for(const file of input.files){
    const data=await fileToDataURL(file);
    const media=doc(collection(db,'media'));
    await setDoc(media,{id:media.id,data,name:file.name,mime:file.type||'image/jpeg',path,createdAt:serverTimestamp(),createdBy:currentUser.uid});
    refs.push(`media:${media.id}`);
  }
  return refs;
}

async function saveOffer(existing){try{const id=$('e_id').value.trim()||`offer_${Date.now()}`;let images=arr($('e_images').value);const main=$('e_image').value.trim();const safeMain=(main.startsWith('data:')&&existing?.imageRef)?existing.imageRef:main;if(safeMain&&!images.includes(safeMain))images.unshift(safeMain);const uploaded=await uploadFiles($('e_files'),`offers/${id}`);if(uploaded.length && !main) images.unshift(uploaded[0]);images=[...new Set([...images,...uploaded])];const data={id,type:$('e_type').value,category:$('e_category').value.trim(),name:$('e_name').value.trim(),country:$('e_country').value.trim(),destination:$('e_destination').value.trim(),price:Number($('e_price').value||0),currency:$('e_currency').value.trim()||'USD',image:images[0]||'',images,fromIata:$('e_from').value.trim().toUpperCase(),toIata:$('e_to').value.trim().toUpperCase(),airlineId:$('e_airline').value,cabin:$('e_cabin').value.trim(),baggage:$('e_baggage').value.trim(),duration:$('e_duration').value.trim(),stopover:$('e_stopover').value.trim(),hotel:{name:$('e_hotel_name').value.trim(),stars:Number($('e_hotel_stars').value||5),rooms:arr($('e_rooms').value),amenities:arr($('e_amenities').value)},description:$('e_description').value.trim(),notes:$('e_notes').value.trim(),order:Number($('e_order').value||0),active:$('e_active').checked,discount:{enabled:$('e_discount_enabled').checked,type:$('e_discount_type').value,value:Number($('e_discount_value').value||0),label:$('e_discount_label').value.trim()},updatedAt:serverTimestamp(),updatedBy:currentUser.uid};if(existing)await updateDoc(doc(db,'offers',id),data);else await setDoc(doc(db,'offers',id),{...data,createdAt:serverTimestamp(),createdBy:currentUser.uid});closeModal();await loadAll();}catch(e){alert(`تعذر الحفظ: ${e.message}`);}}

async function renderPackageTable(){getDocs(collection(db,'tourPackages')).then(s=>{const rows=s.docs.map(d=>({id:d.id,...d.data()}));$('packageTable').innerHTML=`<table class="data-table"><thead><tr><th>البكج</th><th>الدولة</th><th>الوجهة</th><th>المدة</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${rows.map(x=>`<tr><td><b>${esc(x.name)}</b></td><td>${esc(x.country||'')}</td><td>${esc(x.destination||'')}</td><td>${esc(x.duration||'')}</td><td>${money(x.price,x.currency)}</td><td><span class="pill ${x.active===false?'off':''}">${x.active===false?'مخفي':'ظاهر'}</span></td><td class="actions"><button data-pedit="${esc(x.id)}">تعديل</button><button data-pdelete="${esc(x.id)}">حذف</button></td></tr>`).join('')||'<tr><td colspan="7">لا توجد بكجات.</td></tr>'}</tbody></table>`;document.querySelectorAll('[data-pedit]').forEach(b=>b.onclick=()=>openPackageEditor(rows.find(x=>x.id===b.dataset.pedit)));document.querySelectorAll('[data-pdelete]').forEach(b=>b.onclick=async()=>{if(confirm('حذف البكج؟')){await deleteDoc(doc(db,'tourPackages',b.dataset.pdelete));renderPackageTable();}});}).catch(()=>{$('packageTable').innerHTML='<div class="notice">تعذر تحميل البكجات. تأكد من قواعد Firestore.</div>';});}

function openPackageEditor(x=null){const p=x||EMPTY_TOUR_PACKAGE;openModal(`<h2>${x?'تعديل البكج':'إضافة بكج سياحي'}</h2><div class="editor-grid"><div class="field"><label>معرف</label><input id="p_id" value="${esc(p.id)}" ${x?'readonly':''}></div><div class="field"><label>اسم البكج</label><input id="p_name" value="${esc(p.name)}"></div><div class="field"><label>الدولة</label><input id="p_country" value="${esc(p.country)}"></div><div class="field"><label>الوجهة</label><input id="p_destination" value="${esc(p.destination)}"></div><div class="field"><label>المدة</label><input id="p_duration" value="${esc(p.duration)}"></div><div class="field"><label>السعر</label><input id="p_price" value="${esc(p.price)}"></div><div class="field"><label>العملة</label><input id="p_currency" value="${esc(p.currency||'USD')}"></div><div class="field"><label>شركة الطيران</label><select id="p_airline"><option value="">اختر لاحقًا</option>${airlines.map(a=>`<option value="${a.id}" ${a.id===p.airlineId?'selected':''}>${esc(a.name)} (${a.iata||''})</option>`).join('')}</select></div><div class="field"><label>اسم الفندق</label><input id="p_hotel" value="${esc(p.hotelName||'')}"></div><div class="field"><label>نجوم الفندق</label><input id="p_stars" type="number" min="1" max="5" value="${Number(p.hotelStars||5)}"></div><div class="field full"><label>وصف البكج</label><textarea id="p_desc" rows="4">${esc(p.description)}</textarea></div><div class="field full"><label>البرنامج اليومي</label><textarea id="p_itinerary" rows="5">${esc(p.itinerary)}</textarea></div><div class="field full"><label>يشمل</label><textarea id="p_included" rows="3">${esc(arr(p.included).join('\n'))}</textarea></div><div class="field full"><label>لا يشمل</label><textarea id="p_excluded" rows="3">${esc(arr(p.excluded).join('\n'))}</textarea></div><div class="field full"><label>صور البكج</label><input id="p_files" type="file" accept="image/*" multiple></div><div class="field full"><label>روابط صور إضافية</label><textarea id="p_images" rows="3">${esc(arr(p.images).join('\n'))}</textarea></div><div class="field"><label><input id="p_active" type="checkbox" ${p.active?'checked':''}> نشر</label></div></div><div class="editor-actions"><button class="btn primary" id="savePackage">حفظ البكج</button><button class="btn secondary" id="cancelPackage">إلغاء</button></div>`);$('cancelPackage').onclick=closeModal;$('savePackage').onclick=async()=>{try{const id=$('p_id').value.trim()||`pkg_${Date.now()}`;let images=arr($('p_images').value);const uploads=await uploadFiles($('p_files'),`packages/${id}`);if(uploads.length && !images.length) images.unshift(uploads[0]);images=[...new Set([...images,...uploads])];const data={name:$('p_name').value.trim(),country:$('p_country').value.trim(),destination:$('p_destination').value.trim(),duration:$('p_duration').value.trim(),price:$('p_price').value.trim(),currency:$('p_currency').value.trim()||'USD',airlineId:$('p_airline').value,hotelName:$('p_hotel').value.trim(),hotelStars:Number($('p_stars').value||5),description:$('p_desc').value.trim(),itinerary:$('p_itinerary').value.trim(),included:arr($('p_included').value),excluded:arr($('p_excluded').value),images,image:images[0]||'',active:$('p_active').checked,updatedAt:serverTimestamp(),updatedBy:currentUser.uid};await setDoc(doc(db,'tourPackages',id),data,{merge:true});closeModal();renderPackageTable();}catch(e){alert(e.message)}};}

function renderAirlineTable(){const rows=[...AIRLINES.map(x=>({...x,seed:true})),...airlines.filter(x=>!AIRLINES.some(a=>a.id===x.id))];$('airlineTable').innerHTML=`<table class="data-table"><thead><tr><th>اللوقو</th><th>الشركة</th><th>IATA</th><th>مصدر اللوقو</th><th>إجراء</th></tr></thead><tbody>${rows.map(a=>`<tr><td>${a.logo?`<img class="logo-thumb" src="${esc(a.logo)}" alt="">`:''}</td><td>${esc(a.name)}<small>${esc(a.nameEn||'')}</small></td><td>${esc(a.iata||'')}</td><td>${String(a.logo||'').startsWith('http')?'خارجي':'داخل الملفات'}</td><td class="actions"><button data-aedit="${esc(a.id)}">تعديل/رفع لوقو</button></td></tr>`).join('')}</tbody></table>`;document.querySelectorAll('[data-aedit]').forEach(b=>b.onclick=()=>openAirlineEditor(rows.find(x=>x.id===b.dataset.aedit)));}
function openAirlineEditor(a){const x=a||{id:'',name:'',nameEn:'',iata:'',logo:''};openModal(`<h2>إدارة شركة الطيران</h2><div class="editor-grid"><div class="field"><label>المعرف</label><input id="a_id" value="${esc(x.id)}" readonly></div><div class="field"><label>الاسم العربي</label><input id="a_name" value="${esc(x.name)}"></div><div class="field"><label>English name</label><input id="a_nameEn" value="${esc(x.nameEn||'')}"></div><div class="field"><label>IATA</label><input id="a_iata" value="${esc(x.iata||'')}"></div><div class="field full"><label>لوقو محفوظ حاليًا</label><input id="a_logo" value="${esc(x.logo||'')}"></div><div class="field full"><label>رفع اللوقو من الهاتف</label><input id="a_file" type="file" accept="image/*,.svg"></div></div><p class="help">بعد رفع اللوقو وربط العرض بهذه الشركة، سيظهر تلقائيًا في كارت الرحلة.</p><div class="editor-actions"><button class="btn primary" id="saveAirline">حفظ</button><button class="btn secondary" id="cancelAirline">إلغاء</button></div>`);$('cancelAirline').onclick=closeModal;$('saveAirline').onclick=async()=>{try{let logo=$('a_logo').value.trim();const files=await uploadFiles($('a_file'),`airlines/${x.id}`);if(files[0]){logo=await resolveMedia(files[0]);await deleteDoc(doc(db,'media',files[0].slice(6)));}await setDoc(doc(db,'airlines',x.id),{name:$('a_name').value.trim(),nameEn:$('a_nameEn').value.trim(),iata:$('a_iata').value.trim().toUpperCase(),logo,updatedAt:serverTimestamp(),updatedBy:currentUser.uid},{merge:true});closeModal();await loadAll();}catch(e){alert(e.message)}};}

async function renderBookings(){try{const s=await getDocs(collection(db,'bookings'));const rows=s.docs.map(d=>({id:d.id,...d.data()}));$('bookingTable').innerHTML=`<table class="data-table"><thead><tr><th>الاسم</th><th>الهاتف</th><th>الخدمة</th><th>المسار</th><th>العرض</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.fullName||'')}</td><td>${esc(x.phone||'')}</td><td>${esc(x.service||'')}</td><td>${esc(`${x.fromIata||''} → ${x.toIata||''}`)}</td><td>${esc(x.offerName||'')}</td><td>${esc(x.travelDate||'')}</td><td><span class="pill">${esc(x.status||'Pending')}</span></td><td><button data-bstatus="${x.id}">تغيير الحالة</button></td></tr>`).join('')||'<tr><td colspan="8">لا توجد طلبات.</td></tr>'}</tbody></table>`;document.querySelectorAll('[data-bstatus]').forEach(b=>b.onclick=async()=>{const status=prompt('الحالة: Pending / Confirmed / Cancelled / Completed','Confirmed');if(status){await updateDoc(doc(db,'bookings',b.dataset.bstatus),{status,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});renderBookings();}});}catch(e){$('bookingTable').innerHTML='<div class="notice">تعذر تحميل الطلبات.</div>';}}
async function renderUsers(){try{const s=await getDocs(collection(db,'users'));$('userTable').innerHTML=`<table class="data-table"><thead><tr><th>الاسم</th><th>البريد</th><th>UID</th><th>تاريخ التسجيل</th></tr></thead><tbody>${s.docs.map(d=>{const x=d.data();return `<tr><td>${esc(x.name||x.displayName||'')}</td><td>${esc(x.email||'')}</td><td>${esc(d.id)}</td><td>${x.createdAt?.toDate?esc(x.createdAt.toDate().toLocaleString('ar-EG')):''}</td></tr>`}).join('')}</tbody></table>`;}catch(e){$('userTable').innerHTML='<div class="notice">تعذر تحميل العملاء.</div>';}}

window.__florinAdminStarted = true;

onAuthStateChanged(auth, async user => {
  try {
    if (!user) {
      location.href = 'login.html?admin=1';
      return;
    }

    const admin = await isAdmin(user);

    if (!admin) {
      alert('هذا الحساب ليس ضمن المدراء.');
      await signOut(auth);
      location.href = 'login.html?admin=1';
      return;
    }

    currentUser = user;

    const loading = $('authLoading');
    const app = $('adminApp');

    if (loading) {
      loading.hidden = true;
      loading.style.display = 'none';
    }

    if (app) {
      app.hidden = false;
      app.style.display = '';
    }

    if ($('adminName')) {
      $('adminName').textContent =
        user.displayName || user.email || 'مدير النظام';
    }

    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.onclick = () => {
        document.querySelectorAll('.admin-tab').forEach(x =>
          x.classList.remove('active')
        );

        document.querySelectorAll('.admin-panel').forEach(x =>
          x.classList.remove('active')
        );

        tab.classList.add('active');

        const panel = $(tab.dataset.tab);

        if (panel) {
          panel.classList.add('active');
        }
      };
    });

    if ($('adminLogout')) {
      $('adminLogout').onclick = async () => {
        await signOut(auth);
        location.href = 'login.html';
      };
    }

    if ($('adminTheme')) {
      const savedTheme=localStorage.getItem('florin-theme')||'dark';
      document.body.classList.toggle('light',savedTheme==='light');
      document.documentElement.classList.toggle('light',savedTheme==='light');
      $('adminTheme').textContent=savedTheme==='light'?'☀':'◐';
      $('adminTheme').onclick=()=>{
        const light=!document.body.classList.contains('light');
        document.body.classList.toggle('light',light);
        document.documentElement.classList.toggle('light',light);
        localStorage.setItem('florin-theme',light?'light':'dark');
        $('adminTheme').textContent=light?'☀':'◐';
      };
    }

    const modalElement = $('modal');
    const closeModalButton = $('closeModal');

    if (closeModalButton) {
      closeModalButton.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      };
    }

    if (modalElement) {
      modalElement.hidden = true;
      modalElement.style.display = 'none';

      modalElement.onclick = e => {
        if (e.target === modalElement) {
          closeModal();
        }
      };
    }

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });

    if ($('newFlight')) {
      $('newFlight').onclick = () =>
        openOfferEditor({
          type: 'flight',
          category: 'رحلات طيران',
          name: '',
          country: '',
          destination: '',
          price: 0,
          currency: 'USD',
          image: '',
          images: [],
          fromIata: 'CAI',
          toIata: 'JED',
          airlineId: '',
          cabin: 'اقتصادية',
          baggage: '',
          duration: '',
          stopover: 'مباشر',
          active: true,
          discount: {
            enabled: false,
            type: 'percent',
            value: 0,
            label: ''
          }
        });
    }

    if ($('newCatalog')) {
      $('newCatalog').onclick = () =>
        openOfferEditor({
          type: 'hotel',
          category: 'فنادق',
          name: '',
          country: '',
          destination: '',
          price: 0,
          currency: 'USD',
          image: '',
          images: [],
          active: true,
          discount: {
            enabled: false,
            type: 'percent',
            value: 0,
            label: ''
          },
          hotel: {
            stars: 5,
            rooms: [],
            amenities: []
          }
        });
    }

    if ($('newPackage')) {
      $('newPackage').onclick = () => openPackageEditor();
    }

    if ($('newAirline')) {
      $('newAirline').onclick = () =>
        openAirlineEditor({
          id: `airline_${Date.now()}`,
          name: '',
          nameEn: '',
          iata: '',
          logo: ''
        });
    }

    if ($('refreshBookings')) {
      $('refreshBookings').onclick = renderBookings;
    }

    if ($('seedCatalog')) {
      $('seedCatalog').onclick = async () => {
        if (
          !confirm(
            'مزامنة 20 رحلة + عروض الفنادق والخدمات إلى Firestore؟'
          )
        ) {
          return;
        }

        try {
          for (const o of DEFAULT_OFFERS) {
            await setDoc(
              doc(db, 'offers', o.id),
              {
                ...o,
                updatedAt: serverTimestamp(),
                updatedBy: currentUser.uid
              },
              { merge: true }
            );
          }

          for (const a of AIRLINES) {
            await setDoc(
              doc(db, 'airlines', a.id),
              a,
              { merge: true }
            );
          }

          await loadAll();

          alert('تمت المزامنة.');
        } catch (e) {
          alert(`تعذر مزامنة العروض: ${e.message}`);
        }
      };
    }

    await loadAll();

  } catch (e) {
    console.error('FLORIN ADMIN ERROR:', e);

    const loading = $('authLoading');

    if (loading) {
      loading.hidden = false;
      loading.style.display = 'grid';

      loading.innerHTML = `
        <div class="admin-auth-error">
          <h2>تعذر تشغيل لوحة الإدارة</h2>
          <p>${esc(e.message || 'حدث خطأ أثناء التحقق من صلاحيات الإدارة')}</p>
          <a href="login.html?admin=1">العودة إلى تسجيل الدخول</a>
        </div>
      `;
    }
  }
});
