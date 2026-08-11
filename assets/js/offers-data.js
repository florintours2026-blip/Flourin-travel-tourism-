
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
 details.innerHTML=`<div class="offer-details-grid">
 <div class="offer-details-media"><img src="${esc(o.image)}" alt="${esc(o.name)}"></div>
 <div class="offer-details-content"><span class="country">${esc(o.country)}</span><h2>${esc(o.name)}</h2>
 <div class="detail-meta"><span>${esc(o.duration)}</span><span>${esc(o.category)}</span><span>${esc(o.price)}</span></div>
 <p>${esc(o.description)}</p><div class="detail-columns">
 <div class="detail-box"><h3>يشمل</h3><ul>${(o.included||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
 <div class="detail-box"><h3>لا يشمل</h3><ul>${(o.excluded||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div></div>
 <div class="offer-note">${esc(o.notes)}</div>
 <a class="details-btn" style="display:flex;align-items:center;justify-content:center;min-height:48px;border-radius:13px;margin-top:18px" href="booking.html?offer=${encodeURIComponent(o.id)}&offerName=${encodeURIComponent(o.name)}">الانتقال إلى الحجز</a>
 </div></div>`;
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
