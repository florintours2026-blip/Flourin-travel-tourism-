/*
  FLORIN supplier import panel.
  Loaded by admin.html. Uses Firebase Auth ID token.
*/

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import { AIRPORTS, AIRLINES } from './catalog-data.js';
import { db } from './firebase-config.js';
import { scrapeHotelUrl, getSourceLabel } from './url-scraper.js';
import { doc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import { searchHotels, searchFlights, apiHealth } from './florin-supplier-api.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

function injectStyles() {
  if (document.getElementById('florinSupplierStyles')) return;
  const style = document.createElement('style');
  style.id = 'florinSupplierStyles';
  style.textContent = `
    .supplier-import-panel{margin:18px 0;padding:20px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:var(--card,#151923)}
    .supplier-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .supplier-grid .full{grid-column:1/-1}
    .supplier-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:16px}
    .supplier-panel-head h3{margin:0 0 5px}
    .supplier-field label{display:block;font-size:13px;margin-bottom:6px}
    .supplier-field input,.supplier-field select{width:100%;padding:11px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:transparent;color:inherit}
    .supplier-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
    .supplier-result{margin-top:14px;padding:12px;border-radius:12px;background:rgba(255,255,255,.04);white-space:pre-wrap;overflow:auto;max-height:360px}
    .supplier-status{font-size:13px;margin-top:8px}
    @media(max-width:700px){.supplier-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function airportOptions() {
  return AIRPORTS.map(a =>
    `<option value="${esc(a.iata)}">${esc(a.city)} — ${esc(a.name)} (${esc(a.iata)})</option>`
  ).join('');
}

function airlineOptions() {
  return `<option value="">كل الشركات المهيأة</option>` + AIRLINES.map(a =>
    `<option value="${esc(a.id)}">${esc(a.name)} (${esc(a.iata)})</option>`
  ).join('');
}

function panelHtml() {
  return `
  <section class="supplier-import-panel" id="supplierImportPanel">
    <div class="supplier-panel-head">
      <div>
        <span class="eyebrow">LIVE SUPPLIERS</span>
        <h3>استيراد ومقارنة مصادر السفر</h3>
        <p>Booking · Trip · Agoda · شركات الطيران / NDC</p>
      </div>
      <button class="btn secondary" id="supplierHealth">فحص الاتصال</button>
    </div>

    <div class="supplier-grid">
      <div class="supplier-field full">
        <label>رابط الفندق</label>
        <input id="supplierHotelUrl" type="url" dir="ltr"
          placeholder="https://www.booking.com/hotel/...">
      </div>
      <div class="supplier-field">
        <label>هامش السعر</label>
        <select id="supplierRole">
          <option value="customer">عميل +20%</option>
          <option value="agent">وكيل +10%</option>
        </select>
      </div>
      <div class="supplier-field">
        <label>مصدر البحث الحي</label>
        <select id="hotelProvider">
          <option value="booking">Booking.com</option>
          <option value="trip">Trip.com</option>
          <option value="agoda">Agoda</option>
        </select>
      </div>
      <div class="supplier-field">
        <label>Booking City ID (اختياري)</label>
        <input id="hotelCityId" type="number" placeholder="مثال: 20088325">
      </div>
      <div class="supplier-field">
        <label>عدد البالغين</label>
        <input id="hotelAdults" type="number" min="1" value="2">
      </div>
      <div class="supplier-field">
        <label>تاريخ الوصول</label>
        <input id="hotelCheckin" type="date">
      </div>
      <div class="supplier-field">
        <label>تاريخ المغادرة</label>
        <input id="hotelCheckout" type="date">
      </div>
    </div>

    <div class="supplier-actions">
      <button class="btn primary" id="importHotelUrl">استيراد بيانات الفندق</button>
      <button class="btn secondary" id="searchHotelLive">بحث حي للفنادق</button>
    </div>

    <hr style="opacity:.12;margin:20px 0">

    <div class="supplier-grid">
      <div class="supplier-field">
        <label>شركة الطيران</label>
        <select id="flightAirline">${airlineOptions()}</select>
      </div>
      <div class="supplier-field">
        <label>درجة السفر</label>
        <select id="flightCabin">
          <option value="ECONOMY">Economy</option>
          <option value="PREMIUM_ECONOMY">Premium Economy</option>
          <option value="BUSINESS">Business</option>
          <option value="FIRST">First</option>
        </select>
      </div>
      <div class="supplier-field">
        <label>من</label>
        <select id="flightFrom">${airportOptions()}</select>
      </div>
      <div class="supplier-field">
        <label>إلى</label>
        <select id="flightTo">${airportOptions()}</select>
      </div>
      <div class="supplier-field">
        <label>تاريخ المغادرة</label>
        <input id="flightDeparture" type="date">
      </div>
      <div class="supplier-field">
        <label>تاريخ العودة (اختياري)</label>
        <input id="flightReturn" type="date">
      </div>
    </div>

    <div class="supplier-actions">
      <button class="btn primary" id="searchFlightsLive">بحث أسعار الطيران</button>
    </div>

    <div id="supplierStatus" class="supplier-status"></div>
    <div id="supplierResult" class="supplier-result" hidden></div>
  </section>`;
}

function mount() {
  if (document.getElementById('supplierImportPanel')) return;

  const target =
    document.querySelector('#flights') ||
    document.querySelector('#catalog') ||
    document.querySelector('main');

  if (!target) return;

  target.insertAdjacentHTML('beforebegin', panelHtml());
  bind();
}

function setStatus(message, error = false) {
  const el = document.getElementById('supplierStatus');
  if (!el) return;
  el.textContent = message;
  el.style.color = error ? '#ff7676' : '';
}

function showResult(data) {
  const el = document.getElementById('supplierResult');
  if (!el) return;
  el.hidden = false;
  el.textContent = JSON.stringify(data, null, 2);
}

function bind() {
  document.getElementById('supplierHealth').onclick = async () => {
    try {
      setStatus('جاري فحص الاتصال...');
      const data = await apiHealth();
      showResult(data);
      setStatus('تم الاتصال بالـ API.');
    } catch (e) {
      setStatus(e.message, true);
    }
  };

  document.getElementById('importHotelUrl').onclick = async () => {
    const url = document.getElementById('supplierHotelUrl').value.trim();
    const role = document.getElementById('supplierRole').value;
    if (!url) return setStatus('أدخل رابط الفندق أولًا.', true);

    try {
      setStatus('جاري استيراد بيانات الفندق...');
      const result = await scrapeHotelUrl(url);
      showResult(result);
      if (!result.success) throw new Error(result.error);
      const price = Number(prompt('أدخل السعر الذي تريد عرضه للعميل (اختياري):','0') || 0);
      const id = 'hotel_' + Date.now();
      const offer = {id,type:'hotel',category:'فنادق',name:result.title||'Hotel',country:'',destination:result.location||'',price,currency:'USD',image:result.images?.[0]||'',images:result.images||[],description:result.shortDescription||'',sourceUrl:url,sourceProvider:getSourceLabel(result.source),sourcePrice:price,hotel:{name:result.title||'',stars:Number(result.stars||5),rooms:[],amenities:[]},fulfillment:{mode:'manual',bookingByFlorin:true},active:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedBy:auth.currentUser?.uid||''};
      await setDoc(doc(db,'offers',id),offer,{merge:true});
      showResult({success:true,offer});
      setStatus('تم استيراد الفندق وحفظه في عروض FLORIN.');
    } catch (e) {
      setStatus(e.message, true);
    }
  };

  document.getElementById('searchHotelLive').onclick = async () => {
    const provider = document.getElementById('hotelProvider').value;
    const cityId = document.getElementById('hotelCityId').value;
    const checkin = document.getElementById('hotelCheckin').value;
    const checkout = document.getElementById('hotelCheckout').value;
    const adults = Number(document.getElementById('hotelAdults').value || 2);

    if (!checkin || !checkout) {
      return setStatus('أدخل تاريخ الوصول والمغادرة.', true);
    }

    try {
      setStatus('جاري طلب الأسعار من المصدر...');
      const data = await searchHotels({
        provider,
        city_id: cityId ? Number(cityId) : null,
        checkin,
        checkout,
        adults,
        rooms: 1,
        currency: 'USD',
        maximum_results: 20
      });
      showResult(data);
      setStatus('تم استلام نتيجة المصدر.');
    } catch (e) {
      setStatus(e.message, true);
    }
  };

  document.getElementById('searchFlightsLive').onclick = async () => {
    const departure = document.getElementById('flightDeparture').value;
    const from = document.getElementById('flightFrom').value;
    const to = document.getElementById('flightTo').value;
    const airline = document.getElementById('flightAirline').value;
    const returnDate = document.getElementById('flightReturn').value;
    const cabin = document.getElementById('flightCabin').value;

    if (!departure) return setStatus('اختر تاريخ المغادرة.', true);

    try {
      setStatus('جاري البحث في مصادر الطيران المهيأة...');
      const data = await searchFlights({
        airline_id: airline || null,
        from_iata: from,
        to_iata: to,
        departure_date: departure,
        return_date: returnDate || null,
        adults: 1,
        cabin,
        currency: 'USD'
      });
      showResult(data);
      setStatus('تم استلام نتائج الطيران.');
    } catch (e) {
      setStatus(e.message, true);
    }
  };
}

onAuthStateChanged(auth, user => {
  if (user) {
    injectStyles();
    // admin-v2 mounts its main app asynchronously; retry briefly.
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      mount();
      if (document.getElementById('supplierImportPanel') || attempts > 20) {
        clearInterval(timer);
      }
    }, 300);
  }
});
