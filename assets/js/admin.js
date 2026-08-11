
import {auth, db} from "./firebase-config.js";
import {onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {collection,getDocs,getDoc,doc,setDoc,addDoc,updateDoc,deleteDoc,serverTimestamp,query,orderBy,limit} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {DEFAULT_OFFERS} from "./offers-data.js";

const $=id=>document.getElementById(id);
let currentUser=null, offers=[];

function fmt(ts){if(!ts)return "—"; try{return ts.toDate().toLocaleString("ar-EG")}catch{return String(ts)}}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function show(el,on=true){el.classList.toggle("hidden",!on)}

async function isAdmin(user){
  if(!user)return false;
  const snap=await getDoc(doc(db,"admins",user.uid));
  return snap.exists() && snap.data().active!==false;
}

async function loadAll(){
  const [us,bs,as,os]=await Promise.all([
    getDocs(collection(db,"users")),getDocs(query(collection(db,"bookings"),orderBy("createdAt","desc"),limit(200))),
    getDocs(query(collection(db,"activityLogs"),orderBy("createdAt","desc"),limit(300))),getDocs(collection(db,"offers"))
  ]);
  offers=os.docs.map(d=>({id:d.id,...d.data()}));
  $("usersCount").textContent=us.size;$("bookingsCount").textContent=bs.size;$("activityCount").textContent=as.size;$("offersCount").textContent=offers.length;
  $("usersTable").innerHTML=us.docs.map(d=>{const x=d.data();return `<tr><td>${esc(x.name)}</td><td>${esc(x.email)}</td><td>${esc(x.uid)}</td><td>${fmt(x.createdAt)}</td></tr>`}).join("")||"<tr><td colspan=4>لا توجد بيانات</td></tr>";
  $("bookingsTable").innerHTML=bs.docs.map(d=>{const x=d.data();return `<tr><td>${esc(x.fullName)}</td><td>${esc(x.phone)}</td><td>${esc(x.offerName||x.service)}</td><td>${esc(x.travelDate)}</td><td>${esc(x.travelers)}</td><td>${esc(x.status)}</td></tr>`}).join("")||"<tr><td colspan=6>لا توجد حجوزات</td></tr>";
  $("activityTable").innerHTML=as.docs.map(d=>{const x=d.data();return `<tr><td>${esc(x.type)}</td><td>${esc(x.email)}</td><td>${esc(x.uid)}</td><td>${fmt(x.createdAt)}</td></tr>`}).join("")||"<tr><td colspan=4>لا يوجد نشاط مسجل</td></tr>";
  renderOffers();
}

function renderOffers(){
 $("offersTable").innerHTML=offers.map(o=>`<tr><td><strong>${esc(o.name)}</strong><br><small>${esc(o.category||"")}</small></td><td>${esc(o.country)}</td><td>${esc(o.price)}</td><td>${o.active===false?"مخفي":"ظاهر"}</td><td><div class="actions"><button class="small edit" data-edit="${esc(o.id)}">تعديل</button><button class="small delete" data-delete="${esc(o.id)}">حذف</button></div></td></tr>`).join("")||"<tr><td colspan=5>لا توجد عروض. استخدم استيراد العروض الحالية.</td></tr>";
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openEditor(offers.find(o=>o.id===b.dataset.edit)));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(confirm("حذف هذا العرض؟")){await deleteDoc(doc(db,"offers",b.dataset.delete));await loadAll();}});
}

function openEditor(o=null){
 const x=o||{id:"",name:"",country:"",duration:"",price:"",image:"",category:"رحلات سياحية",description:"",included:[],excluded:[],notes:"",active:true};
 $("offerEditor").innerHTML=`<h3>${o?"تعديل العرض":"إضافة عرض جديد"}</h3><div class="form-grid">
 <div class="field"><label>المعرّف (ID)</label><input id="e_id" value="${esc(x.id)}" ${o?"readonly":""}></div>
 <div class="field"><label>اسم العرض</label><input id="e_name" value="${esc(x.name)}"></div>
 <div class="field"><label>الوجهة</label><input id="e_country" value="${esc(x.country)}"></div>
 <div class="field"><label>المدة</label><input id="e_duration" value="${esc(x.duration)}"></div>
 <div class="field"><label>السعر</label><input id="e_price" value="${esc(x.price)}"></div>
 <div class="field"><label>مسار الصورة أو رابطها</label><input id="e_image" value="${esc(x.image)}"></div>
 <div class="field"><label>التصنيف</label><input id="e_category" value="${esc(x.category)}"></div>
 <div class="field full"><label>الوصف</label><textarea id="e_description">${esc(x.description)}</textarea></div>
 <div class="field"><label>يشمل — كل سطر خدمة</label><textarea id="e_included">${esc((x.included||[]).join("\\n"))}</textarea></div>
 <div class="field"><label>لا يشمل — كل سطر خدمة</label><textarea id="e_excluded">${esc((x.excluded||[]).join("\\n"))}</textarea></div>
 <div class="field full"><label>ملاحظات</label><textarea id="e_notes">${esc(x.notes)}</textarea></div>
 </div><label class="checkbox"><input type="checkbox" id="e_active" ${x.active!==false?"checked":""}> إظهار العرض للعملاء</label>
 <div class="editor-actions"><button class="primary" id="saveOffer">حفظ</button><button class="secondary" id="cancelOffer">إلغاء</button></div>`;
 show($("offerEditor"));$("cancelOffer").onclick=()=>show($("offerEditor"),false);
 $("saveOffer").onclick=async()=>{
   const id=$("e_id").value.trim();if(!id||!$("e_name").value.trim()){alert("المعرّف والاسم مطلوبان");return}
   const data={name:$("e_name").value.trim(),country:$("e_country").value.trim(),duration:$("e_duration").value.trim(),price:$("e_price").value.trim(),image:$("e_image").value.trim(),category:$("e_category").value.trim(),description:$("e_description").value.trim(),included:$("e_included").value.split("\n").map(x=>x.trim()).filter(Boolean),excluded:$("e_excluded").value.split("\n").map(x=>x.trim()).filter(Boolean),notes:$("e_notes").value.trim(),active:$("e_active").checked,updatedAt:serverTimestamp(),updatedBy:currentUser.uid};
   if(o) await updateDoc(doc(db,"offers",id),data); else await setDoc(doc(db,"offers",id),{...data,createdAt:serverTimestamp(),createdBy:currentUser.uid});
   show($("offerEditor"),false);await loadAll();
 };
}

$("newOffer").onclick=()=>openEditor();
$("seedOffers").onclick=async()=>{if(!confirm("استيراد العروض الحالية إلى قاعدة البيانات؟ إذا كان العرض موجودًا لن يتم استبداله."))return;for(const o of DEFAULT_OFFERS){const ref=doc(db,"offers",o.id);const s=await getDoc(ref);if(!s.exists())await setDoc(ref,{...o,createdAt:serverTimestamp(),createdBy:currentUser.uid});}await loadAll();alert("تم استيراد العروض.");};
$("refreshBookings").onclick=loadAll;
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".tab-panel").forEach(x=>x.classList.remove("active"));b.classList.add("active");$(b.dataset.tab).classList.add("active")});
$("adminLogout").onclick=()=>signOut(auth).then(()=>location.href="index.html");

onAuthStateChanged(auth,async user=>{
 currentUser=user;
 if(!user){location.href="login.html";return}
 try{
  if(!(await isAdmin(user))){show($("dashboard"),false);show($("accessDenied"),true);return}
  $("adminWelcome").textContent=`مرحبًا ${user.displayName||user.email}`;
  show($("dashboard"),true);show($("accessDenied"),false);await loadAll();
 }catch(e){console.error(e);show($("dashboard"),false);show($("accessDenied"),true);}
});
