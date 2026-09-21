import { saveBooking, updateBookingFiles } from './booking-database.js';
import { auth, db } from './firebase-config.js';
import { AIRPORTS } from './catalog-data.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const $=id=>document.getElementById(id); const params=new URLSearchParams(location.search);
const offer=params.get('offer')||''; const offerName=params.get('offerName')||'';
let selectedOfferSnapshot = null;
if (offer) { getDoc(doc(db, 'offers', offer)).then(s => { if (s.exists()) { selectedOfferSnapshot = { id: s.id, ...s.data() }; if (!$('offerName').value) $('offerName').value = selectedOfferSnapshot.name || ''; if (selectedOfferSnapshot.destination && !$('destination').value) $('destination').value = selectedOfferSnapshot.destination; if (selectedOfferSnapshot.type && !$('service').value) $('service').value = selectedOfferSnapshot.type === 'tour' ? 'tour' : selectedOfferSnapshot.type === 'hotel' ? 'hotel' : selectedOfferSnapshot.type === 'flight' ? 'flight' : ''; } }).catch(e => console.warn('Offer snapshot:', e)); }
$('offerId').value=offer; $('offerName').value=offerName; $('offerFrom').value=params.get('from')||''; $('offerTo').value=params.get('to')||'';
if(offerName) $('selectedOfferText').textContent=`العرض المختار: ${offerName}. أدخل بياناتك وسيراجع الفريق السعر والتوفر.`;
if(params.get('from')) $('bookingFrom').value=params.get('from'); if(params.get('to')) $('bookingTo').value=params.get('to');

function resolveAirportCode(value){const q=String(value||'').trim().toLowerCase();const exact=AIRPORTS.find(a=>String(a.iata).toLowerCase()===q||[a.city,a.cityEn,a.name,a.nameEn,a.country,a.countryEn].some(v=>String(v||'').toLowerCase()===q));return exact?.iata||AIRPORTS.find(a=>[a.iata,a.city,a.cityEn,a.name,a.nameEn,a.country,a.countryEn].some(v=>String(v||'').toLowerCase().includes(q)))?.iata||String(value||'').trim().toUpperCase();}
function setupAirportSearch(){document.querySelectorAll('[data-airport-search]').forEach(input=>{const list=document.createElement('div');list.className='airport-suggestions';input.parentElement.appendChild(list);const render=()=>{const q=input.value.trim().toLowerCase();if(!q){list.classList.remove('show');return;}const rows=AIRPORTS.filter(a=>[a.iata,a.city,a.cityEn,a.country,a.countryEn,a.name,a.nameEn].some(v=>String(v||'').toLowerCase().includes(q))).slice(0,8);list.innerHTML=rows.map(a=>`<button type="button" data-code="${a.iata}"><strong>${a.iata}</strong><span>${a.city} — ${a.name}<em>${a.country} / ${a.countryEn}</em></span></button>`).join('');list.classList.toggle('show',rows.length>0);list.querySelectorAll('button').forEach(b=>b.onclick=()=>{input.value=b.dataset.code;input.dataset.iata=b.dataset.code;list.classList.remove('show');});};input.addEventListener('input',render);input.addEventListener('focus',render);});}
setupAirportSearch();
$('service').addEventListener('change',()=>{$('airportFields').hidden=$('service').value!=='flight';});
$('travelDate').min=new Date().toISOString().slice(0,10);

const paymentDetails={
 paypal:`<b>PayPal</b><br>الحساب: <span dir="ltr">florintoursim@gmail.com</span>`,
 bankak:`<b>بنكك (Bankak)</b><br>الحساب الأول: <span dir="ltr">2525924</span> — فراس مصطفى عبدالوهاب سعيد<br>الحساب الثاني: <span dir="ltr">3235969</span> — مصطفى عبدالوهاب سعيد`,
 adib:`<b>مصرف أبوظبي الإسلامي (ADIB)</b><br>نوع الحساب: حساب توفير (Saving Account)<br>IBAN: <span dir="ltr">EG060030501200000200000762463</span>`
};
document.querySelectorAll('input[name="paymentMethod"]').forEach(r=>r.addEventListener('change',()=>{$('paymentDetails').innerHTML=paymentDetails[r.value]||'';}));

function mrzDate(v, future=false){if(!/^\d{6}$/.test(v))return '';const y=Number(v.slice(0,2)),m=v.slice(2,4),d=v.slice(4,6);const now=new Date().getFullYear()%100;const year=(future?(y>=now?2000+y:2100+y):(y<=now?2000+y:1900+y));return `${year}-${m}-${d}`;}
function parseMRZ(text){
  const lines=String(text||'').toUpperCase().replace(/\r/g,'').split(/\n+/).map(x=>x.replace(/[^A-Z0-9<]/g,'')).filter(x=>x.length>=25);
  let l1=lines.find(x=>x.startsWith('P<')&&x.length>=40), l2=lines.find(x=>/^\w{1,3}[A-Z0-9<]{35,}$/.test(x)&&x.includes('<')&&/\d{6}/.test(x));
  if(!l1||!l2){for(let i=0;i<lines.length-1;i++){if(lines[i].startsWith('P<')&&lines[i+1].length>=35){l1=lines[i];l2=lines[i+1];break;}}}
  if(!l1||!l2)return null;
  const parts=l1.slice(5).split('<<');
  const surname=(parts[0]||'').replace(/</g,' ').trim(); const given=(parts[1]||'').replace(/</g,' ').trim();
  return {surname,given,name:[given,surname].filter(Boolean).join(' '),passportNumber:l2.slice(0,9).replace(/</g,''),nationality:l2.slice(10,13).replace(/</g,''),dob:mrzDate(l2.slice(13,19)),sex:(l2.slice(20,21)==='<'?'':l2.slice(20,21)),expiry:mrzDate(l2.slice(21,27),true),mrz:[l1,l2].join('\n')};
}
$('scanPassport')?.addEventListener('click',async()=>{
 const file=$('passportImage').files?.[0]; if(!file){$('passportScanStatus').textContent='اختر صورة الجواز أولًا.';return;}
 if(!window.Tesseract){$('passportScanStatus').textContent='تعذر تشغيل قارئ الجواز. يمكنك إدخال البيانات يدويًا.';return;}
 const status=$('passportScanStatus'); status.textContent='جاري قراءة الجواز...';
 try{const result=await window.Tesseract.recognize(file,'eng',{logger:m=>{if(m.status==='recognizing text')status.textContent=`جاري قراءة الجواز... ${Math.round((m.progress||0)*100)}%`;}});const parsed=parseMRZ(result.data.text);if(!parsed){status.textContent='لم يتم العثور على منطقة MRZ بوضوح. أعد تصوير صفحة البيانات أو أدخلها يدويًا.';return;}
 $('passportNumber').value=parsed.passportNumber||'';$('passportName').value=parsed.name||'';$('passportNationality').value=parsed.nationality||'';$('passportDob').value=parsed.dob||'';$('passportExpiry').value=parsed.expiry||'';$('passportSex').value=parsed.sex||'';status.textContent='تم استخراج البيانات. راجعها قبل الإرسال.';
 }catch(e){console.error(e);status.textContent='تعذر قراءة الصورة. أدخل البيانات يدويًا.';}
});

$('bookingForm').addEventListener('submit',async e=>{e.preventDefault();
 const paymentMethod=document.querySelector('input[name="paymentMethod"]:checked')?.value||''; const receipt=$('paymentReceipt').files?.[0];
 if(!paymentMethod){$('bookingStatus').textContent='يرجى اختيار طريقة الدفع.';return;} if(!receipt){$('bookingStatus').textContent='صورة إيصال الدفع/التحويل إلزامية.';return;}
 const passportFile=$('passportImage').files?.[0]||null;
 const data={fullName:$('fullName').value.trim(),phone:$('phone').value.trim(),email:$('email').value.trim(),country:$('country').value.trim(),service:$('service').value,destination:$('destination').value.trim(),travelDate:$('travelDate').value,travelers:Number($('travelers').value||1),notes:$('notes').value.trim(),offerId:$('offerId').value,offerName:$('offerName').value,fromIata:resolveAirportCode($('bookingFrom').dataset.iata||$('bookingFrom').value),toIata:resolveAirportCode($('bookingTo').dataset.iata||$('bookingTo').value),uid:auth.currentUser?.uid||null,sourceUrl:selectedOfferSnapshot?.sourceUrl||'',sourceProvider:selectedOfferSnapshot?.sourceProvider||'',offerSnapshot:selectedOfferSnapshot||{id:offer,name:offerName},requestedPrice:selectedOfferSnapshot?.price ?? null,paymentMethod,paymentAccount:paymentDetails[paymentMethod].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(),passport:{number:$('passportNumber').value.trim(),name:$('passportName').value.trim(),nationality:$('passportNationality').value.trim(),dob:$('passportDob').value,expiry:$('passportExpiry').value,sex:$('passportSex').value}};
 if(!data.fullName||!data.phone||!data.service){$('bookingStatus').textContent='يرجى إكمال الاسم والهاتف والخدمة.';return;}
 try{const btn=e.submitter;btn.disabled=true;btn.textContent='جاري إرسال الطلب...';$('bookingStatus').textContent='جاري رفع الإيصال وبيانات الجواز...';const id=await saveBooking(data,receipt,passportFile);$('bookingStatus').textContent=`تم استلام طلبك بنجاح — رقم الطلب ${id}.`;e.target.reset();$('paymentDetails').innerHTML='';}catch(err){console.error(err);$('bookingStatus').textContent='تعذر إرسال الطلب أو رفع الملفات. تحقق من الاتصال ثم حاول مرة أخرى.';}finally{const btn=e.submitter;if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-paper-plane"></i> إرسال الطلب';}}});
