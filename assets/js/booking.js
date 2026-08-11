
import { saveBooking } from "./booking-database.js";
import { auth } from "./firebase-config.js";

const serviceSelect=document.getElementById("service");
const dynamicFields=document.getElementById("dynamicFields");
const params=new URLSearchParams(location.search);
const offerId=params.get("offer")||"";
const offerName=params.get("offerName")||"";

if(offerId) {
  const hidden=document.createElement("input");
  hidden.type="hidden"; hidden.id="offerId"; hidden.value=offerId; document.getElementById("bookingForm")?.appendChild(hidden);
  const hiddenName=document.createElement("input");
  hiddenName.type="hidden"; hiddenName.id="offerName"; hiddenName.value=offerName; document.getElementById("bookingForm")?.appendChild(hiddenName);
  const title=document.querySelector(".booking-header p");
  if(title) title.textContent=`العرض المختار: ${offerName}. أدخل بياناتك وسيتواصل معك فريق فلورين لتأكيد السعر والتوفر والتفاصيل.`;
}

if(serviceSelect){
 serviceSelect.addEventListener("change",()=>{
  const service=serviceSelect.value; dynamicFields.innerHTML="";
  if(service==="flight") dynamicFields.innerHTML=`<div class="form-grid"><div class="form-group"><label>Flight Class</label><select id="flightClass"><option>Economy</option><option>Business</option><option>First Class</option></select></div><div class="form-group"><label>Trip Type</label><select id="tripType"><option>Round Trip</option><option>One Way</option></select></div></div>`;
  if(service==="hotel") dynamicFields.innerHTML=`<div class="form-grid"><div class="form-group"><label>Hotel Stars</label><select id="hotelStars"><option>3 Stars</option><option>4 Stars</option><option>5 Stars</option></select></div><div class="form-group"><label>Number of Nights</label><input type="number" id="nights" min="1" value="1"></div></div>`;
  if(service==="visa") dynamicFields.innerHTML=`<div class="form-group"><label>Visa Type</label><select id="visaType"><option>Tourist</option><option>Business</option><option>Work</option><option>Study</option></select></div>`;
  if(service==="security") dynamicFields.innerHTML=`<div class="form-group"><label>Security Clearance Type</label><select id="securityType"><option>National Security</option><option>Military Security</option></select></div>`;
 });
}

const form=document.getElementById("bookingForm");
if(form) form.addEventListener("submit",async e=>{
 e.preventDefault();
 const data={
  fullName:document.getElementById("fullName").value.trim(),
  phone:document.getElementById("phone").value.trim(),
  email:document.getElementById("email").value.trim(),
  country:document.getElementById("country").value,
  service:document.getElementById("service").value,
  destination:document.getElementById("destination").value,
  travelDate:document.getElementById("travelDate").value,
  travelers:Number(document.getElementById("travelers").value||1),
  notes:document.getElementById("notes").value.trim(),
  offerId:document.getElementById("offerId")?.value||"",
  offerName:document.getElementById("offerName")?.value||"",
  uid:auth.currentUser?.uid||null
 };
 if(!data.fullName||!data.phone||!data.service){alert("يرجى إكمال الاسم والهاتف والخدمة.");return;}
 try{
  await saveBooking(data);
  alert("تم إرسال طلب الحجز بنجاح. سيتواصل معك فريق فلورين.");
  form.reset(); dynamicFields.innerHTML="";
 }catch(err){console.error(err);alert("تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.");}
});
