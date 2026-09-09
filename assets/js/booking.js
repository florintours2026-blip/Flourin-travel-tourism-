import { saveBooking } from './booking-database.js';
import { auth } from './firebase-config.js';
import { AIRPORTS } from './catalog-data.js';

const $=id=>document.getElementById(id); const params=new URLSearchParams(location.search);
const offer=params.get('offer')||''; const offerName=params.get('offerName')||'';
$('offerId').value=offer; $('offerName').value=offerName; $('offerFrom').value=params.get('from')||''; $('offerTo').value=params.get('to')||'';
if(offerName) $('selectedOfferText').textContent=`العرض المختار: ${offerName}. أدخل بياناتك وسيراجع الفريق السعر والتوفر.`;
if(params.get('from')) $('bookingFrom').value=params.get('from'); if(params.get('to')) $('bookingTo').value=params.get('to');

function setupAirportSearch(){document.querySelectorAll('[data-airport-search]').forEach(input=>{const list=document.createElement('div');list.className='airport-suggestions';input.parentElement.appendChild(list);const render=()=>{const q=input.value.trim().toLowerCase();if(!q){list.classList.remove('show');return;}const rows=AIRPORTS.filter(a=>[a.iata,a.city,a.cityEn,a.country,a.countryEn,a.name,a.nameEn].some(v=>String(v).toLowerCase().includes(q))).slice(0,8);list.innerHTML=rows.map(a=>`<button type="button" data-code="${a.iata}"><strong>${a.iata}</strong><span>${a.city} — ${a.name}</span></button>`).join('');list.classList.toggle('show',rows.length>0);list.querySelectorAll('button').forEach(b=>b.onclick=()=>{input.value=b.dataset.code;list.classList.remove('show');});};input.addEventListener('input',render);input.addEventListener('focus',render);});}
setupAirportSearch();
$('service').addEventListener('change',()=>{$('airportFields').hidden=$('service').value!=='flight';});
$('travelDate').min=new Date().toISOString().slice(0,10);
$('bookingForm').addEventListener('submit',async e=>{e.preventDefault();const data={fullName:$('fullName').value.trim(),phone:$('phone').value.trim(),email:$('email').value.trim(),country:$('country').value.trim(),service:$('service').value,destination:$('destination').value.trim(),travelDate:$('travelDate').value,travelers:Number($('travelers').value||1),notes:$('notes').value.trim(),offerId:$('offerId').value,offerName:$('offerName').value,fromIata:$('bookingFrom').value.trim().toUpperCase(),toIata:$('bookingTo').value.trim().toUpperCase(),uid:auth.currentUser?.uid||null};if(!data.fullName||!data.phone||!data.service){$('bookingStatus').textContent='يرجى إكمال الاسم والهاتف والخدمة.';return;}try{const btn=e.submitter;btn.disabled=true;btn.textContent='جاري إرسال الطلب...';const id=await saveBooking(data);$('bookingStatus').textContent=`تم استلام طلبك بنجاح${id?` — رقم الطلب ${id}`:''}.`;e.target.reset();}catch(err){console.error(err);$('bookingStatus').textContent='تعذر إرسال الطلب. تحقق من الاتصال ثم حاول مرة أخرى.';}finally{const btn=e.submitter;if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-paper-plane"></i> إرسال الطلب';}}});
