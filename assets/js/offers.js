
import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getOffers } from "./offers-data.js";

const catalog=document.getElementById("offersCatalog");
const details=document.getElementById("offerDetails");
let selected=null;

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

function show(o){
 selected=o;
 details.classList.add("active");
 const h=o.hotel||{};
 const images=Array.isArray(o.images)&&o.images.length?o.images:(o.image?[o.image]:[]);
 details.innerHTML=`<div class="hotel-mini">
   <div class="hotel-mini-gallery">${images.slice(0,4).map((src,i)=>`<img class="${i===0?'main':''}" src="${esc(src)}" alt="${esc(o.name)}">`).join("")}</div>
   <div class="hotel-mini-content">
     <span class="country">${esc(o.country)}</span>
     <h2>${esc(o.name)}</h2>
     ${h.name?`<div class="mini-hotel"><strong>${esc(h.name)}</strong> <span class="stars">${"★".repeat(Number(h.stars||4))}</span><small>${esc(h.location||o.destination||"")}</small></div>`:""}
     <div class="detail-meta"><span>${esc(o.duration)}</span><span>${esc(o.category)}</span><span>${esc(o.price)}</span></div>
     <p>${esc(o.description)}</p>
     ${h.rooms?.length?`<div class="mini-rooms"><strong>الغرف:</strong> ${h.rooms.map(x=>esc(x)).join(" · ")}</div>`:""}
     <div class="detail-columns">
       <div class="detail-box"><h3>يشمل</h3><ul>${(o.included||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
       <div class="detail-box"><h3>لا يشمل</h3><ul>${(o.excluded||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
     </div>
     <div class="offer-note">${esc(o.notes)}</div>
     <a class="details-btn" style="display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:13px;margin-top:18px" href="offer-details.html?id=${encodeURIComponent(o.id)}">عرض الفندق والباقة بالتفصيل</a>
   </div>
 </div>`;
 details.scrollIntoView({behavior:"smooth",block:"start"});
 document.getElementById("selectedOfferId").value=o.id;
 document.getElementById("selectedOfferName").value=o.name;
}

async function init(){
 const offers=await getOffers();
 catalog.innerHTML=offers.map(o=>`<article class="offer-item">
 <img src="${esc(o.image)}" alt="${esc(o.name)}"><div class="offer-item-body">
 <span class="country">${esc(o.country)}</span><h2>${esc(o.name)}</h2><p>${esc(o.description)}</p><div class="offer-price">${esc(o.price)}</div>
 <div class="offer-actions"><a class="details-btn" href="offer-details.html?id=${encodeURIComponent(o.id)}">صفحة التفاصيل</a><button class="booking-btn-outline" data-id="${esc(o.id)}">اختيار للحجز</button></div>
 </div></article>`).join("");
 catalog.querySelectorAll("[data-id]").forEach(b=>b.addEventListener("click",()=>{const o=offers.find(x=>x.id===b.dataset.id); if(o) show(o)}));
 const params=new URLSearchParams(location.search); const id=params.get("id"); if(id){const o=offers.find(x=>x.id===id);if(o)show(o);}
}
init();

const form=document.getElementById("manualBookingForm");
if(form) form.addEventListener("submit",async e=>{
 e.preventDefault();
 const status=document.getElementById("bookingStatus");
 try{
  await addDoc(collection(db,"bookings"),{
   fullName:document.getElementById("customerName").value.trim(),
   phone:document.getElementById("customerPhone").value.trim(),
   email:document.getElementById("customerEmail").value.trim(),
   country:document.getElementById("customerCountry").value.trim(),
   travelDate:document.getElementById("travelDateOffer").value,
   travelers:Number(document.getElementById("travelerCount").value||1),
   notes:document.getElementById("customerNotes").value.trim(),
   offerId:document.getElementById("selectedOfferId").value,
   offerName:document.getElementById("selectedOfferName").value,
   status:"Pending", createdAt:serverTimestamp()
  });
  status.className="booking-status show success";status.textContent="تم إرسال طلبك بنجاح. سيتواصل معك فريق فلورين لتأكيد التفاصيل.";
  form.reset(); selected=null;
 }catch(err){console.error(err);status.className="booking-status show error";status.textContent="تعذر إرسال الطلب. تأكد من إعدادات Firebase ثم حاول مرة أخرى.";}
});
