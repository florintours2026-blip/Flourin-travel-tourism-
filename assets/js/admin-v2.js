/* =========================================================
   FLORIN — Admin v2
   Complete admin panel logic with URL scraper integration
   ========================================================= */

import { auth, db } from './firebase-config.js';
import { AIRPORTS, AIRLINES, DEFAULT_OFFERS, EMPTY_TOUR_PACKAGE } from './catalog-data.js';
import { scrapeHotelUrl, getSourceLabel } from './url-scraper.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
const arr = v => Array.isArray(v) ? v : (String(v || '').split('\n').map(x => x.trim()).filter(Boolean));
const money = (n, c) => `${Number(n || 0).toLocaleString('en-US')} ${c || ''}`;

let currentUser = null;
let offers = [];
let airlines = [];

/* ============ Auth & Init ============ */

async function isAdmin(user) {
  if (!user) return false;
  if (user.uid === '7nE6QoTEPFOk0IhwcZUnymkyzoY2') return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (!snap.exists()) return false;
    const data = snap.data() || {};
    return data.active === true || data.active === 'true';
  } catch (error) {
    console.error('FLORIN admin check:', error);
    return false;
  }
}

window.__florinAdminStarted = true;

onAuthStateChanged(auth, async user => {
  try {
    if (!user) { location.href = 'login.html?admin=1'; return; }
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
    if (loading) { loading.hidden = true; loading.style.display = 'none'; }
    if (app) { app.hidden = false; app.style.display = ''; }
    if ($('adminName')) $('adminName').textContent = user.displayName || user.email || 'مدير النظام';
    initTabs();
    initTheme();
    initButtons();
    initModal();
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
          <p>${esc(e.message || 'حدث خطأ')}</p>
          <a href="login.html?admin=1">العودة إلى تسجيل الدخول</a>
        </div>`;
    }
  }
});

/* ============ Tabs ============ */

function initTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const panel = $(tab.dataset.tab);
      if (panel) panel.classList.add('active');
    };
  });
}

/* ============ Theme ============ */

function initTheme() {
  const btn = $('adminTheme');
  if (!btn) return;
  const saved = localStorage.getItem('florin-admin-theme') || 'dark';
  document.body.classList.toggle('light', saved === 'light');
  btn.innerHTML = saved === 'light' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  btn.onclick = () => {
    const light = !document.body.classList.contains('light');
    document.body.classList.toggle('light', light);
    localStorage.setItem('florin-admin-theme', light ? 'light' : 'dark');
    btn.innerHTML = light ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  };
}

/* ============ Modal ============ */

function openModal(html) {
  const modal = $('modal');
  const content = $('modalContent');
  if (!modal || !content) return;
  content.innerHTML = html;
  modal.hidden = false;
  modal.style.display = 'grid';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = $('modal');
  const content = $('modalContent');
  if (!modal) return;
  modal.hidden = true;
  modal.style.display = 'none';
  if (content) content.innerHTML = '';
  document.body.style.overflow = '';
}

function initModal() {
  const closeBtn = $('closeModal');
  const modalEl = $('modal');
  if (closeBtn) closeBtn.onclick = (e) => { e.preventDefault(); closeModal(); };
  if (modalEl) modalEl.onclick = (e) => { if (e.target === modalEl) closeModal(); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

/* ============ Buttons ============ */

function initButtons() {
  if ($('adminLogout')) {
    $('adminLogout').onclick = async () => {
      if (!confirm('هل تريد تسجيل الخروج؟')) return;
      await signOut(auth);
      location.href = 'index.html';
    };
  }
  if ($('seedCatalog')) {
    $('seedCatalog').onclick = async () => {
      if (!confirm('سيتم مزامنة العروض المبدئية. متابعة؟')) return;
      try {
        for (const o of DEFAULT_OFFERS) {
          await setDoc(doc(db, 'offers', o.id), { ...o, updatedAt: serverTimestamp(), updatedBy: currentUser.uid }, { merge: true });
        }
        for (const a of AIRLINES) {
          await setDoc(doc(db, 'airlines', a.id), a, { merge: true });
        }
        await loadAll();
        alert('✅ تمت المزامنة بنجاح.');
      } catch (e) {
        alert('تعذر المزامنة: ' + e.message);
      }
    };
  }
  if ($('newFlight')) $('newFlight').onclick = () => openOfferEditor({ type: 'flight', category: 'رحلات طيران', fromIata: 'CAI', toIata: 'JED', currency: 'USD', cabin: 'اقتصادية', stopover: 'مباشر' });
  if ($('newCatalog')) $('newCatalog').onclick = () => openOfferEditor({ type: 'hotel', category: 'فنادق', currency: 'USD', hotel: { stars: 5, rooms: [], amenities: [] } });
  if ($('newPackage')) $('newPackage').onclick = () => openPackageEditor();
  if ($('newAirline')) $('newAirline').onclick = () => openAirlineEditor({ id: `airline_${Date.now()}` });
  if ($('refreshBookings')) $('refreshBookings').onclick = renderBookings;
}

/* ============ Load All Data ============ */

async function loadAll() {
  try {
    const offersSnap = await getDocs(collection(db, 'offers'));
    offers = offersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const airlinesSnap = await getDocs(collection(db, 'airlines'));
    airlines = airlinesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!airlines.length) airlines = AIRLINES;
    renderStats();
    renderFlightTable();
    renderCatalogTable();
    renderPackageTable();
    renderAirlineTable();
    renderBookings();
    renderUsers();
  } catch (e) {
    console.error('loadAll error:', e);
    alert('تعذر تحميل البيانات: ' + e.message);
  }
}

/* ============ Stats ============ */

function renderStats() {
  const stats = $('stats');
  if (!stats) return;
  const flights = offers.filter(x => x.type === 'flight').length;
  const hotels = offers.filter(x => x.type === 'hotel').length;
  const tours = offers.filter(x => x.type === 'tour' || x.type === 'service').length;
  stats.innerHTML = `
    <div class="stat-card"><div class="label">عروض الطيران</div><div class="value">${flights}</div></div>
    <div class="stat-card"><div class="label">الفنادق والخدمات</div><div class="value">${hotels + tours}</div></div>
    <div class="stat-card"><div class="label">شركات الطيران</div><div class="value">${airlines.length}</div></div>
    <div class="stat-card"><div class="label">العملاء</div><div class="value">—</div></div>`;
}

/* ============ Flight Table ============ */

function renderFlightTable() {
  const root = $('flightTable');
  if (!root) return;
  const rows = offers.filter(x => x.type === 'flight').sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  root.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>العرض</th><th>المسار</th><th>الطيران</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map(o => rowOffer(o)).join('') : '<tr><td colspan="6" class="empty">لا توجد عروض.</td></tr>'}
      </tbody>
    </table>`;
  bindOfferActions();
}

/* ============ Catalog Table ============ */

function renderCatalogTable() {
  const root = $('catalogTable');
  if (!root) return;
  const rows = offers.filter(x => x.type !== 'flight');
  root.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>الصورة</th><th>العرض</th><th>الوجهة</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr>
      </thead>
      <tbody>
        ${rows.length ? rows.map(o => rowOffer(o)).join('') : '<tr><td colspan="6" class="empty">لا توجد عروض.</td></tr>'}
      </tbody>
    </table>`;
  bindOfferActions();
}

/* ============ Row Renderer ============ */

function rowOffer(o) {
  const route = o.type === 'flight' ? `${o.fromIata || ''} → ${o.toIata || ''}` : (o.destination || o.country || '—');
  const img = o.image ? `<img src="${esc(o.image)}" class="thumb" onerror="this.style.display='none'">` : '';
  return `
    <tr>
      <td>${img}</td>
      <td><b>${esc(o.name || '')}</b><br><small>${esc(o.category || '')}</small></td>
      <td>${esc(route)}</td>
      <td>${esc(money(o.price, o.currency))}</td>
      <td><span class="pill ${o.active === false ? 'off' : 'on'}">${o.active === false ? 'مخفي' : 'ظاهر'}</span></td>
      <td class="actions">
        <button data-edit="${esc(o.id)}" title="تعديل"><i class="fa-solid fa-pen"></i></button>
        <button data-toggle="${esc(o.id)}" title="${o.active === false ? 'إظهار' : 'إخفاء'}"><i class="fa-solid fa-eye${o.active === false ? '' : '-slash'}"></i></button>
        <button data-delete="${esc(o.id)}" title="حذف" class="danger"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
}

function bindOfferActions() {
  document.querySelectorAll('[data-edit]').forEach(b => {
    b.onclick = () => openOfferEditor(offers.find(o => o.id === b.dataset.edit));
  });
  document.querySelectorAll('[data-toggle]').forEach(b => {
    b.onclick = async () => {
      const o = offers.find(x => x.id === b.dataset.toggle);
      if (!o) return;
      await updateDoc(doc(db, 'offers', o.id), { active: o.active === false, updatedAt: serverTimestamp(), updatedBy: currentUser.uid });
      await loadAll();
    };
  });
  document.querySelectorAll('[data-delete]').forEach(b => {
    b.onclick = async () => {
      if (!confirm('حذف هذا العرض؟')) return;
      await deleteDoc(doc(db, 'offers', b.dataset.delete));
      await loadAll();
    };
  });
}

/* ============ OFFER EDITOR — With URL Scraper ============ */

function openOfferEditor(existing = null) {
  const isNew = !existing;
  const x = existing || {
    id: '', type: 'hotel', category: 'فنادق', name: '', country: '', destination: '',
    price: '', currency: 'USD', image: '', images: [], description: '', notes: '',
    active: true, order: 0, hotel: { name: '', stars: 5, rooms: [], amenities: [] },
    discount: { enabled: false, type: 'percent', value: 0, label: '' }
  };
  const h = x.hotel || {};

  const html = `
    <div class="editor-wrap">
      <div class="editor-header">
        <h2>${isNew ? 'إضافة عرض جديد' : 'تعديل العرض'}</h2>
        <p class="editor-sub">${isNew ? 'الصق رابط الفندق لسحب البيانات تلقائيًا، ثم أكمل الحقول الفارغة.' : 'عدّل البيانات واحفظ.'}</p>
      </div>

      ${isNew ? `
      <div class="scraper-section">
        <label class="scraper-label">
          <i class="fa-solid fa-link"></i>
          رابط الفندق (Booking / Trip / TravelGo)
        </label>
        <div class="scraper-input">
          <input type="url" id="e_sourceUrl" placeholder="https://www.booking.com/hotel/..." dir="ltr">
          <button type="button" class="btn primary" id="btnScrape">
            <i class="fa-solid fa-cloud-arrow-down"></i>
            استيراد
          </button>
        </div>
        <div id="scrapeStatus" class="scrape-status"></div>
        <div id="scrapedImages" class="scraped-images"></div>
      </div>
      ` : ''}

      <div class="editor-grid">
        <div class="field">
          <label>نوع العرض</label>
          <select id="e_type">
            <option value="flight" ${x.type === 'flight' ? 'selected' : ''}>طيران</option>
            <option value="hotel" ${x.type === 'hotel' ? 'selected' : ''}>فندق</option>
            <option value="tour" ${x.type === 'tour' ? 'selected' : ''}>رحلة سياحية</option>
            <option value="service" ${x.type === 'service' ? 'selected' : ''}>خدمة</option>
          </select>
        </div>
        <div class="field">
          <label>معرف العرض</label>
          <input id="e_id" value="${esc(x.id)}" ${existing ? 'readonly' : ''} placeholder="معرف فريد">
        </div>
        <div class="field full">
          <label>اسم العرض *</label>
          <input id="e_name" value="${esc(x.name)}" placeholder="مثال: JW Marriott Marquis Dubai">
        </div>
        <div class="field">
          <label>الدولة</label>
          <input id="e_country" value="${esc(x.country || '')}">
        </div>
        <div class="field">
          <label>الوجهة / المدينة</label>
          <input id="e_destination" value="${esc(x.destination || '')}">
        </div>
        <div class="field">
          <label>السعر *</label>
          <input id="e_price" type="number" min="0" value="${esc(x.price)}">
        </div>
        <div class="field">
          <label>العملة</label>
          <select id="e_currency">
            <option value="USD" ${x.currency === 'USD' ? 'selected' : ''}>USD</option>
            <option value="EGP" ${x.currency === 'EGP' ? 'selected' : ''}>EGP</option>
            <option value="SAR" ${x.currency === 'SAR' ? 'selected' : ''}>SAR</option>
            <option value="AED" ${x.currency === 'AED' ? 'selected' : ''}>AED</option>
            <option value="EUR" ${x.currency === 'EUR' ? 'selected' : ''}>EUR</option>
          </select>
        </div>
        <div class="field full">
          <label>الصورة الرئيسية (URL)</label>
          <input id="e_image" value="${esc(x.image || '')}" dir="ltr" placeholder="https://...">
        </div>
        <div class="field full">
          <label>صور إضافية (سطر لكل رابط)</label>
          <textarea id="e_images" rows="4" dir="ltr" placeholder="https://...">${esc(arr(x.images).filter(v => !String(v).startsWith('data:')).join('\n'))}</textarea>
        </div>
        <div class="field full">
          <label>الوصف القصير</label>
          <textarea id="e_description" rows="3">${esc(x.description || '')}</textarea>
        </div>
        <div class="field full">
          <label>ملاحظات</label>
          <textarea id="e_notes" rows="2">${esc(x.notes || '')}</textarea>
        </div>
      </div>

      <h3 class="section-title-sm"><i class="fa-solid fa-hotel"></i> بيانات الفندق</h3>
      <div class="editor-grid">
        <div class="field"><label>اسم الفندق</label><input id="e_hotel_name" value="${esc(h.name || '')}"></div>
        <div class="field">
          <label>عدد النجوم</label>
          <select id="e_hotel_stars">
            ${[1,2,3,4,5].map(n => `<option value="${n}" ${Number(h.stars || 5) === n ? 'selected' : ''}>${n} نجوم</option>`).join('')}
          </select>
        </div>
        <div class="field full"><label>أنواع الغرف (سطر لكل نوع)</label><textarea id="e_rooms" rows="3">${esc(arr(h.rooms).join('\n'))}</textarea></div>
        <div class="field full"><label>المرافق (سطر لكل مرفق)</label><textarea id="e_amenities" rows="3">${esc(arr(h.amenities).join('\n'))}</textarea></div>
        <div class="field full"><label>يشمل العرض (سطر لكل بند)</label><textarea id="e_included" rows="3">${esc(arr(x.included).join('\n'))}</textarea></div>
        <div class="field full"><label>لا يشمل العرض (سطر لكل بند)</label><textarea id="e_excluded" rows="3">${esc(arr(x.excluded).join('\n'))}</textarea></div>
      </div>

      <h3 class="section-title-sm"><i class="fa-solid fa-plane"></i> تفاصيل الطيران (اختياري)</h3>
      <div class="editor-grid">
        <div class="field"><label>مطار المغادرة IATA</label><input id="e_from" value="${esc(x.fromIata || '')}" dir="ltr" placeholder="CAI"></div>
        <div class="field"><label>مطار الوصول IATA</label><input id="e_to" value="${esc(x.toIata || '')}" dir="ltr" placeholder="DXB"></div>
        <div class="field">
          <label>شركة الطيران</label>
          <select id="e_airline">
            <option value="">بدون شركة</option>
            ${airlines.map(a => `<option value="${a.id}" ${a.id === x.airlineId ? 'selected' : ''}>${esc(a.name)} (${a.iata || ''})</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>المدة</label><input id="e_duration" value="${esc(x.duration || '')}" placeholder="2س 30د"></div>
      </div>

      <h3 class="section-title-sm"><i class="fa-solid fa-tag"></i> الخصم والترتيب</h3>
      <div class="editor-grid">
        <div class="field"><label><input type="checkbox" id="e_discount_enabled" ${x.discount?.enabled ? 'checked' : ''}> تفعيل الخصم</label></div>
        <div class="field">
          <label>نوع الخصم</label>
          <select id="e_discount_type">
            <option value="percent" ${x.discount?.type === 'percent' ? 'selected' : ''}>نسبة %</option>
            <option value="fixed" ${x.discount?.type === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option>
          </select>
        </div>
        <div class="field"><label>قيمة الخصم</label><input id="e_discount_value" type="number" min="0" value="${Number(x.discount?.value || 0)}"></div>
        <div class="field"><label>عبارة الخصم</label><input id="e_discount_label" value="${esc(x.discount?.label || '')}"></div>
        <div class="field"><label>الترتيب</label><input id="e_order" type="number" value="${Number(x.order || 0)}"></div>
        <div class="field"><label><input type="checkbox" id="e_active" ${x.active !== false ? 'checked' : ''}> نشر العرض</label></div>
      </div>

      <div class="editor-actions">
        <button type="button" class="btn primary" id="saveEditor"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>
        <button type="button" class="btn secondary" id="cancelEditor">إلغاء</button>
      </div>
    </div>
  `;

  openModal(html);

  if ($('cancelEditor')) $('cancelEditor').onclick = closeModal;
  if ($('saveEditor')) $('saveEditor').onclick = () => saveOffer(existing);
  if ($('btnScrape')) $('btnScrape').onclick = handleScrape;
}

/* ============ Scraper Handler ============ */

async function handleScrape() {
  const url = $('e_sourceUrl')?.value.trim();
  const status = $('scrapeStatus');
  const btn = $('btnScrape');

  if (!url) {
    if (status) status.innerHTML = '<span class="error">الرجاء لصق الرابط أولًا.</span>';
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الاستيراد...'; }
  if (status) status.innerHTML = '<span class="loading">🔄 جاري محاولة سحب البيانات...</span>';

  try {
    const result = await scrapeHotelUrl(url);

    if (!result.success) {
      if (status) status.innerHTML = `<span class="error">❌ ${esc(result.error)}</span>`;
      return;
    }

    if (result.title && $('e_name')) $('e_name').value = result.title;
    if (result.shortDescription && $('e_description')) $('e_description').value = result.shortDescription;
    if (result.stars && $('e_hotel_stars')) $('e_hotel_stars').value = result.stars;
    if (result.location && $('e_destination')) $('e_destination').value = result.location;

    if (result.images.length) {
      if ($('e_image')) $('e_image').value = result.images[0];
      if ($('e_images')) $('e_images').value = result.images.slice(1).join('\n');
      const preview = $('scrapedImages');
      if (preview) {
        preview.innerHTML = result.images.slice(0, 8).map(img =>
          `<img src="${esc(img)}" alt="preview" loading="lazy" onerror="this.style.display='none'">`
        ).join('');
      }
    }

    if (status) {
      status.innerHTML = `<span class="success">✅ تم الاستيراد من ${getSourceLabel(result.source)} — ${result.images.length} صورة — أكمل الحقول الفارغة.</span>`;
    }
  } catch (e) {
    console.error(e);
    if (status) status.innerHTML = `<span class="error">❌ خطأ: ${esc(e.message)}</span>`;
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> استيراد'; }
  }
}

/* ============ Save Offer ============ */

async function saveOffer(existing) {
  try {
    const id = $('e_id')?.value.trim() || `offer_${Date.now()}`;
    let images = arr($('e_images')?.value);
    const mainImage = $('e_image')?.value.trim();
    if (mainImage && !images.includes(mainImage)) images.unshift(mainImage);

    const type = $('e_type')?.value || 'hotel';
    const categoryMap = { flight: 'رحلات طيران', hotel: 'فنادق', tour: 'رحلات سياحية', service: 'خدمات سفر' };

    const data = {
      id, type,
      category: categoryMap[type] || 'عروض',
      name: $('e_name')?.value.trim() || '',
      country: $('e_country')?.value.trim() || '',
      destination: $('e_destination')?.value.trim() || '',
      price: Number($('e_price')?.value || 0),
      currency: $('e_currency')?.value || 'USD',
      image: images[0] || '',
      images,
      description: $('e_description')?.value.trim() || '',
      notes: $('e_notes')?.value.trim() || '',
      fromIata: $('e_from')?.value.trim().toUpperCase() || '',
      toIata: $('e_to')?.value.trim().toUpperCase() || '',
      airlineId: $('e_airline')?.value || '',
      duration: $('e_duration')?.value.trim() || '',
      hotel: {
        name: $('e_hotel_name')?.value.trim() || '',
        stars: Number($('e_hotel_stars')?.value || 5),
        rooms: arr($('e_rooms')?.value),
        amenities: arr($('e_amenities')?.value)
      },
      included: arr($('e_included')?.value),
      excluded: arr($('e_excluded')?.value),
      order: Number($('e_order')?.value || 0),
      active: $('e_active')?.checked !== false,
      discount: {
        enabled: $('e_discount_enabled')?.checked || false,
        type: $('e_discount_type')?.value || 'percent',
        value: Number($('e_discount_value')?.value || 0),
        label: $('e_discount_label')?.value.trim() || ''
      },
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    };

    if (!data.name) { alert('اكتب اسم العرض أولًا.'); return; }

    if (existing) {
      await updateDoc(doc(db, 'offers', id), data);
    } else {
      await setDoc(doc(db, 'offers', id), { ...data, createdAt: serverTimestamp(), createdBy: currentUser.uid });
    }

    closeModal();
    await loadAll();
    alert('✅ تم الحفظ بنجاح.');
  } catch (e) {
    console.error(e);
    alert('تعذر الحفظ: ' + e.message);
  }
}

/* ============ Packages ============ */

async function renderPackageTable() {
  try {
    const snap = await getDocs(collection(db, 'tourPackages'));
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const root = $('packageTable');
    if (!root) return;
    root.innerHTML = `
      <table class="data-table">
        <thead><tr><th>البكج</th><th>الوجهة</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map(x => `
            <tr>
              <td><b>${esc(x.name || '')}</b></td>
              <td>${esc(x.destination || '')}</td>
              <td>${esc(money(x.price, x.currency))}</td>
              <td><span class="pill ${x.active === false ? 'off' : 'on'}">${x.active === false ? 'مخفي' : 'ظاهر'}</span></td>
              <td class="actions">
                <button data-pedit="${esc(x.id)}"><i class="fa-solid fa-pen"></i></button>
                <button data-pdelete="${esc(x.id)}" class="danger"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>`).join('') : '<tr><td colspan="5" class="empty">لا توجد بكجات.</td></tr>'}
        </tbody>
      </table>`;
    document.querySelectorAll('[data-pedit]').forEach(b => { b.onclick = () => openPackageEditor(rows.find(x => x.id === b.dataset.pedit)); });
    document.querySelectorAll('[data-pdelete]').forEach(b => {
      b.onclick = async () => {
        if (!confirm('حذف هذا البكج؟')) return;
        await deleteDoc(doc(db, 'tourPackages', b.dataset.pdelete));
        renderPackageTable();
      };
    });
  } catch (e) {
    const root = $('packageTable');
    if (root) root.innerHTML = '<div class="notice">تعذر تحميل البكجات.</div>';
  }
}

function openPackageEditor(x = null) {
  const p = x || EMPTY_TOUR_PACKAGE;
  openModal(`
    <div class="editor-wrap">
      <h2>${x ? 'تعديل البكج' : 'إضافة بكج سياحي'}</h2>
      <div class="editor-grid">
        <div class="field"><label>المعرف</label><input id="p_id" value="${esc(p.id || '')}" ${x ? 'readonly' : ''}></div>
        <div class="field full"><label>اسم البكج *</label><input id="p_name" value="${esc(p.name || '')}"></div>
        <div class="field"><label>الدولة</label><input id="p_country" value="${esc(p.country || '')}"></div>
        <div class="field"><label>الوجهة</label><input id="p_destination" value="${esc(p.destination || '')}"></div>
        <div class="field"><label>المدة</label><input id="p_duration" value="${esc(p.duration || '')}"></div>
        <div class="field"><label>السعر</label><input id="p_price" value="${esc(p.price || '')}"></div>
        <div class="field full"><label>الوصف</label><textarea id="p_desc" rows="3">${esc(p.description || '')}</textarea></div>
        <div class="field full"><label>روابط الصور (سطر لكل رابط)</label><textarea id="p_images" rows="3" dir="ltr">${esc(arr(p.images).join('\n'))}</textarea></div>
        <div class="field"><label><input type="checkbox" id="p_active" ${p.active ? 'checked' : ''}> نشر</label></div>
      </div>
      <div class="editor-actions">
        <button class="btn primary" id="savePackage">حفظ</button>
        <button class="btn secondary" id="cancelPackage">إلغاء</button>
      </div>
    </div>`);
  $('cancelPackage').onclick = closeModal;
  $('savePackage').onclick = async () => {
    try {
      const id = $('p_id').value.trim() || `pkg_${Date.now()}`;
      const data = {
        name: $('p_name').value.trim(),
        country: $('p_country').value.trim(),
        destination: $('p_destination').value.trim(),
        duration: $('p_duration').value.trim(),
        price: Number($('p_price').value || 0),
        currency: 'USD',
        description: $('p_desc').value.trim(),
        images: arr($('p_images').value),
        image: arr($('p_images').value)[0] || '',
        active: $('p_active').checked,
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      };
      await setDoc(doc(db, 'tourPackages', id), data, { merge: true });
      closeModal();
      renderPackageTable();
    } catch (e) { alert(e.message); }
  };
}

/* ============ Airlines ============

function renderAirlineTable() {
  const root = $('airlineTable');
  if (!root) return;
  const all = [...AIRLINES];
  root.innerHTML = `
    <table class="data-table">
      <thead><tr><th>اللوقو</th><th>الشركة</th><th>IATA</th><th>إجراء</th></tr></thead>
      <tbody>
        ${all.map(a => `
          <tr>
            <td>${a.logo ? `<img src="${esc(a.logo)}" class="logo-thumb" onerror="this.style.display='none'">` : ''}</td>
            <td>${esc(a.name)}<br><small>${esc(a.nameEn || '')}</small></td>
            <td>${esc(a.iata || '')}</td>
            <td class="actions"><button data-aedit="${esc(a.id)}"><i class="fa-solid fa-pen"></i></button></td>
          </tr>`).join('')}
      </tbody>
    </table>`;
  document.querySelectorAll('[data-aedit]').forEach(b => {
    b.onclick = () => openAirlineEditor(all.find(x => x.id === b.dataset.aedit));
  });
}

function openAirlineEditor(a) {
  const x = a || { id: '', name: '', nameEn: '', iata: '', logo: '' };
  openModal(`
    <div class="editor-wrap">
      <h2>إدارة شركة الطيران</h2>
      <div class="editor-grid">
        <div class="field"><label>المعرف</label><input id="a_id" value="${esc(x.id)}" readonly></div>
        <div class="field full"><label>الاسم العربي</label><input id="a_name" value="${esc(x.name)}"></div>
        <div class="field"><label>English name</label><input id="a_nameEn" value="${esc(x.nameEn || '')}"></div>
        <div class="field"><label>IATA</label><input id="a_iata" value="${esc(x.iata || '')}"></div>
        <div class="field full"><label>لوقو URL</label><input id="a_logo" value="${esc(x.logo || '')}" dir="ltr"></div>
      </div>
      <div class="editor-actions">
        <button class="btn primary" id="saveAirline">حفظ</button>
        <button class="btn secondary" id="cancelAirline">إلغاء</button>
      </div>
    </div>`);
  $('cancelAirline').onclick = closeModal;
  $('saveAirline').onclick = async () => {
    try {
      await setDoc(doc(db, 'airlines', x.id), {
        name: $('a_name').value.trim(),
        nameEn: $('a_nameEn').value.trim(),
        iata: $('a_iata').value.trim().toUpperCase(),
        logo: $('a_logo').value.trim(),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.uid
      }, { merge: true });
      closeModal();
      await loadAll();
    } catch (e) { alert(e.message); }
  };
}

/* ============ Bookings ============ */

async function renderBookings() {
  try {
    const snap = await getDocs(collection(db, 'bookings'));
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const root = $('bookingTable');
    if (!root) return;
    root.innerHTML = `
      <table class="data-table">
        <thead><tr><th>الاسم</th><th>الهاتف</th><th>الخدمة</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead>
        <tbody>
          ${rows.length ? rows.map(x => `
            <tr>
              <td>${esc(x.fullName || '')}</td>
              <td>${esc(x.phone || '')}</td>
              <td>${esc(x.service || '')}</td>
              <td>${esc(x.travelDate || '')}</td>
              <td><span class="pill">${esc(x.status || 'Pending')}</span></td>
              <td><button data-bstatus="${esc(x.id)}"><i class="fa-solid fa-rotate"></i></button></td>
            </tr>`).join('') : '<tr><td colspan="6" class="empty">لا توجد طلبات.</td></tr>'}
        </tbody>
      </table>`;
    document.querySelectorAll('[data-bstatus]').forEach(b => {
      b.onclick = async () => {
        const status = prompt('الحالة: Pending / Confirmed / Cancelled / Completed', 'Confirmed');
        if (status) {
          await updateDoc(doc(db, 'bookings', b.dataset.bstatus), { status, updatedAt: serverTimestamp(), updatedBy: currentUser.uid });
          renderBookings();
        }
      };
    });
  } catch (e) {
    const root = $('bookingTable');
    if (root) root.innerHTML = '<div class="notice">تعذر تحميل الطلبات.</div>';
  }
}

async function renderUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const root = $('userTable');
    if (!root) return;
    root.innerHTML = `
      <table class="data-table">
        <thead><tr><th>الاسم</th><th>البريد</th><th>UID</th></tr></thead>
        <tbody>
          ${snap.docs.map(d => {
            const x = d.data();
            return `<tr><td>${esc(x.name || x.displayName || '')}</td><td>${esc(x.email || '')}</td><td><small>${esc(d.id)}</small></td></tr>`;
          }).join('')}
        </tbody>
      </table>`;
  } catch (e) {
    const root = $('userTable');
    if (root) root.innerHTML = '<div class="notice">تعذر تحميل العملاء.</div>';
  }
}

console.log('✅ FLORIN Admin v2 loaded with URL scraper integration');
```
