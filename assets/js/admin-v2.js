/* =========================================================
   FLORIN — Admin v2 (Complete)
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

/* ============ AUTH ============ */

async function isAdmin(user) {
  if (!user) return false;
  if (user.uid === '7nE6QoTEPFOk0IhwcZUnymkyzoY2') return true;
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    if (!snap.exists()) return false;
    const data = snap.data() || {};
    return data.active === true || data.active === 'true';
  } catch (e) {
    console.error('Admin check:', e);
    return false;
  }
}

window.__florinAdminStarted = true;

onAuthStateChanged(auth, async user => {
  try {
    if (!user) { location.href = 'login.html?admin=1'; return; }
    const ok = await isAdmin(user);
    if (!ok) {
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
    if ($('adminName')) $('adminName').textContent = user.displayName || user.email || 'مدير';
    initTabs();
    initTheme();
    initButtons();
    initModal();
    await loadAll();
  } catch (e) {
    console.error('ADMIN ERROR:', e);
    const loading = $('authLoading');
    if (loading) {
      loading.hidden = false;
      loading.style.display = 'grid';
      loading.innerHTML = '<div class="admin-auth-error"><h2>تعذر تشغيل لوحة الإدارة</h2><p>' + esc(e.message || 'خطأ') + '</p><a href="login.html?admin=1">العودة إلى تسجيل الدخول</a></div>';
    }
  }
});

/* ============ TABS ============ */

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

/* ============ THEME ============ */

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

/* ============ MODAL ============ */

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

/* ============ BUTTONS ============ */

function initButtons() {
  const logout = $('adminLogout');
  if (logout) {
    logout.onclick = async () => {
      if (!confirm('تسجيل الخروج؟')) return;
      await signOut(auth);
      location.href = 'index.html';
    };
  }

  const seed = $('seedCatalog');
  if (seed) {
    seed.onclick = async () => {
      if (!confirm('مزامنة العروض المبدئية؟')) return;
      try {
        for (const o of DEFAULT_OFFERS) {
          await setDoc(doc(db, 'offers', o.id), { ...o, updatedAt: serverTimestamp(), updatedBy: currentUser.uid }, { merge: true });
        }
        for (const a of AIRLINES) {
          await setDoc(doc(db, 'airlines', a.id), a, { merge: true });
        }
        await loadAll();
        alert('✅ تمت المزامنة.');
      } catch (e) { alert('خطأ: ' + e.message); }
    };
  }

  const nf = $('newFlight');
  if (nf) nf.onclick = () => openOfferEditor({ type: 'flight', category: 'رحلات طيران', fromIata: 'CAI', toIata: 'JED', currency: 'USD' });

  const nc = $('newCatalog');
  if (nc) nc.onclick = () => openOfferEditor({ type: 'hotel', category: 'فنادق', currency: 'USD', hotel: { stars: 5, rooms: [], amenities: [] } });

  const np = $('newPackage');
  if (np) np.onclick = () => openPackageEditor();

  const na = $('newAirline');
  if (na) na.onclick = () => openAirlineEditor({ id: 'airline_' + Date.now() });

  const rb = $('refreshBookings');
  if (rb) rb.onclick = renderBookings;
}

/* ============ LOAD ALL ============ */

async function loadAll() {
  try {
    const oSnap = await getDocs(collection(db, 'offers'));
    offers = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const aSnap = await getDocs(collection(db, 'airlines'));
    airlines = aSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!airlines.length) airlines = AIRLINES;
    renderStats();
    renderFlightTable();
    renderCatalogTable();
    renderPackageTable();
    renderAirlineTable();
    renderBookings();
    renderUsers();
  } catch (e) {
    console.error('loadAll:', e);
    alert('تعذر تحميل البيانات: ' + e.message);
  }
}

/* ============ STATS ============ */

function renderStats() {
  const stats = $('stats');
  if (!stats) return;
  const flights = offers.filter(x => x.type === 'flight').length;
  const catalog = offers.filter(x => x.type !== 'flight').length;
  stats.innerHTML =
    '<div class="stat-card"><div class="label">عروض الطيران</div><div class="value">' + flights + '</div></div>' +
    '<div class="stat-card"><div class="label">الفنادق والخدمات</div><div class="value">' + catalog + '</div></div>' +
    '<div class="stat-card"><div class="label">شركات الطيران</div><div class="value">' + airlines.length + '</div></div>' +
    '<div class="stat-card"><div class="label">العملاء</div><div class="value">—</div></div>';
}

/* ============ FLIGHT TABLE ============ */

function renderFlightTable() {
  const root = $('flightTable');
  if (!root) return;
  const rows = offers.filter(x => x.type === 'flight').sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  root.innerHTML = '<table class="data-table"><thead><tr><th>العرض</th><th>المسار</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>' +
    (rows.length ? rows.map(o => rowOffer(o)).join('') : '<tr><td colspan="5" class="empty">لا توجد عروض.</td></tr>') +
    '</tbody></table>';
  bindOfferActions();
}

/* ============ CATALOG TABLE ============ */

function renderCatalogTable() {
  const root = $('catalogTable');
  if (!root) return;
  const rows = offers.filter(x => x.type !== 'flight');
  root.innerHTML = '<table class="data-table"><thead><tr><th>الصورة</th><th>العرض</th><th>الوجهة</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>' +
    (rows.length ? rows.map(o => rowOffer(o)).join('') : '<tr><td colspan="6" class="empty">لا توجد عروض.</td></tr>') +
    '</tbody></table>';
  bindOfferActions();
}

/* ============ ROW ============ */

function rowOffer(o) {
  const route = o.type === 'flight' ? (o.fromIata || '') + ' → ' + (o.toIata || '') : (o.destination || o.country || '—');
  const img = o.image ? '<img src="' + esc(o.image) + '" class="thumb" onerror="this.style.display=\'none\'">' : '';
  return '<tr>' +
    '<td>' + img + '</td>' +
    '<td><b>' + esc(o.name || '') + '</b><br><small>' + esc(o.category || '') + '</small></td>' +
    '<td>' + esc(route) + '</td>' +
    '<td>' + esc(money(o.price, o.currency)) + '</td>' +
    '<td><span class="pill ' + (o.active === false ? 'off' : 'on') + '">' + (o.active === false ? 'مخفي' : 'ظاهر') + '</span></td>' +
    '<td class="actions">' +
    '<button data-edit="' + esc(o.id) + '"><i class="fa-solid fa-pen"></i></button>' +
    '<button data-toggle="' + esc(o.id) + '"><i class="fa-solid fa-eye' + (o.active === false ? '' : '-slash') + '"></i></button>' +
    '<button data-delete="' + esc(o.id) + '" class="danger"><i class="fa-solid fa-trash"></i></button>' +
    '</td></tr>';
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

/* ============ OFFER EDITOR ============ */

function openOfferEditor(existing) {
  const isNew = !existing;
  const x = existing || {
    id: '', type: 'hotel', category: 'فنادق', name: '', country: '', destination: '',
    price: '', currency: 'USD', image: '', images: [], description: '', notes: '',
    active: true, order: 0, hotel: { name: '', stars: 5, rooms: [], amenities: [] },
    discount: { enabled: false, type: 'percent', value: 0, label: '' }
  };
  const h = x.hotel || {};

  let html = '<div class="editor-wrap">';
  html += '<div class="editor-header"><h2>' + (isNew ? 'إضافة عرض جديد' : 'تعديل العرض') + '</h2>';
  html += '<p class="editor-sub">' + (isNew ? 'الصق رابط الفندق لسحب البيانات تلقائيًا.' : 'عدّل البيانات واحفظ.') + '</p></div>';

  if (isNew) {
    html += '<div class="scraper-section">';
    html += '<label class="scraper-label"><i class="fa-solid fa-link"></i> رابط الفندق (Booking / Trip / TravelGo)</label>';
    html += '<div class="scraper-input">';
    html += '<input type="url" id="e_sourceUrl" placeholder="https://www.booking.com/hotel/..." dir="ltr">';
    html += '<button type="button" class="btn primary" id="btnScrape"><i class="fa-solid fa-cloud-arrow-down"></i> استيراد</button>';
    html += '</div>';
    html += '<div id="scrapeStatus" class="scrape-status"></div>';
    html += '<div id="scrapedImages" class="scraped-images"></div>';
    html += '</div>';
  }

  html += '<div class="editor-grid">';
  html += '<div class="field"><label>نوع العرض</label><select id="e_type">';
  html += '<option value="flight"' + (x.type === 'flight' ? ' selected' : '') + '>طيران</option>';
  html += '<option value="hotel"' + (x.type === 'hotel' ? ' selected' : '') + '>فندق</option>';
  html += '<option value="tour"' + (x.type === 'tour' ? ' selected' : '') + '>رحلة سياحية</option>';
  html += '<option value="service"' + (x.type === 'service' ? ' selected' : '') + '>خدمة</option>';
  html += '</select></div>';

  html += '<div class="field"><label>معرف العرض (بالإنجليزية)</label><input id="e_id" value="' + esc(x.id) + '"' + (existing ? ' readonly' : '') + ' placeholder="hotel-dubai-01" dir="ltr"></div>';

  html += '<div class="field full"><label>اسم العرض *</label><input id="e_name" value="' + esc(x.name) + '" placeholder="JW Marriott Marquis Dubai"></div>';

  html += '<div class="field"><label>الدولة</label><input id="e_country" value="' + esc(x.country || '') + '"></div>';
  html += '<div class="field"><label>الوجهة / المدينة</label><input id="e_destination" value="' + esc(x.destination || '') + '"></div>';
  html += '<div class="field"><label>السعر *</label><input id="e_price" type="number" min="0" value="' + esc(x.price) + '"></div>';
  html += '<div class="field"><label>العملة</label><select id="e_currency">';
  ['USD','EGP','SAR','AED','EUR'].forEach(c => {
    html += '<option value="' + c + '"' + (x.currency === c ? ' selected' : '') + '>' + c + '</option>';
  });
  html += '</select></div>';

  html += '<div class="field full"><label>الصورة الرئيسية (URL)</label><input id="e_image" value="' + esc(x.image || '') + '" dir="ltr" placeholder="https://..."></div>';
  html += '<div class="field full"><label>صور إضافية (سطر لكل رابط)</label><textarea id="e_images" rows="4" dir="ltr">' + esc(arr(x.images).filter(v => !String(v).startsWith('data:')).join('\n')) + '</textarea></div>';
  html += '<div class="field full"><label>الوصف القصير</label><textarea id="e_description" rows="3">' + esc(x.description || '') + '</textarea></div>';
  html += '<div class="field full"><label>ملاحظات</label><textarea id="e_notes" rows="2">' + esc(x.notes || '') + '</textarea></div>';
  html += '</div>';

  html += '<h3 class="section-title-sm"><i class="fa-solid fa-hotel"></i> بيانات الفندق</h3>';
  html += '<div class="editor-grid">';
  html += '<div class="field"><label>اسم الفندق</label><input id="e_hotel_name" value="' + esc(h.name || '') + '"></div>';
  html += '<div class="field"><label>عدد النجوم</label><select id="e_hotel_stars">';
  [1,2,3,4,5].forEach(n => {
    html += '<option value="' + n + '"' + (Number(h.stars || 5) === n ? ' selected' : '') + '>' + n + ' نجوم</option>';
  });
  html += '</select></div>';
  html += '<div class="field full"><label>أنواع الغرف (سطر لكل نوع)</label><textarea id="e_rooms" rows="3">' + esc(arr(h.rooms).join('\n')) + '</textarea></div>';
  html += '<div class="field full"><label>المرافق (سطر لكل مرفق)</label><textarea id="e_amenities" rows="3">' + esc(arr(h.amenities).join('\n')) + '</textarea></div>';
  html += '<div class="field full"><label>يشمل العرض (سطر لكل بند)</label><textarea id="e_included" rows="3">' + esc(arr(x.included).join('\n')) + '</textarea></div>';
  html += '<div class="field full"><label>لا يشمل العرض (سطر لكل بند)</label><textarea id="e_excluded" rows="3">' + esc(arr(x.excluded).join('\n')) + '</textarea></div>';
  html += '</div>';

  html += '<h3 class="section-title-sm"><i class="fa-solid fa-plane"></i> تفاصيل الطيران</h3>';
  html += '<div class="editor-grid">';
  html += '<div class="field"><label>مطار المغادرة</label><input id="e_from" value="' + esc(x.fromIata || '') + '" dir="ltr" placeholder="CAI"></div>';
  html += '<div class="field"><label>مطار الوصول</label><input id="e_to" value="' + esc(x.toIata || '') + '" dir="ltr" placeholder="DXB"></div>';
  html += '<div class="field"><label>شركة الطيران</label><select id="e_airline"><option value="">بدون</option>';
  airlines.forEach(a => {
    html += '<option value="' + a.id + '"' + (a.id === x.airlineId ? ' selected' : '') + '>' + esc(a.name) + '</option>';
  });
  html += '</select></div>';
  html += '<div class="field"><label>المدة</label><input id="e_duration" value="' + esc(x.duration || '') + '"></div>';
  html += '</div>';

  html += '<h3 class="section-title-sm"><i class="fa-solid fa-tag"></i> الخصم</h3>';
  html += '<div class="editor-grid">';
  html += '<div class="field"><label><input type="checkbox" id="e_discount_enabled"' + (x.discount && x.discount.enabled ? ' checked' : '') + '> تفعيل الخصم</label></div>';
  html += '<div class="field"><label>النوع</label><select id="e_discount_type">';
  html += '<option value="percent"' + (x.discount && x.discount.type === 'percent' ? ' selected' : '') + '>نسبة %</option>';
  html += '<option value="fixed"' + (x.discount && x.discount.type === 'fixed' ? ' selected' : '') + '>مبلغ ثابت</option>';
  html += '</select></div>';
  html += '<div class="field"><label>القيمة</label><input id="e_discount_value" type="number" value="' + Number(x.discount && x.discount.value || 0) + '"></div>';
  html += '<div class="field"><label>عبارة</label><input id="e_discount_label" value="' + esc(x.discount && x.discount.label || '') + '"></div>';
  html += '<div class="field"><label>الترتيب</label><input id="e_order" type="number" value="' + Number(x.order || 0) + '"></div>';
  html += '<div class="field"><label><input type="checkbox" id="e_active"' + (x.active !== false ? ' checked' : '') + '> نشر</label></div>';
  html += '</div>';

  html += '<div class="editor-actions">';
  html += '<button type="button" class="btn primary" id="saveEditor"><i class="fa-solid fa-floppy-disk"></i> حفظ</button>';
  html += '<button type="button" class="btn secondary" id="cancelEditor">إلغاء</button>';
  html += '</div></div>';

  openModal(html);

  const cancelBtn = $('cancelEditor');
  if (cancelBtn) cancelBtn.onclick = closeModal;
  const saveBtn = $('saveEditor');
  if (saveBtn) saveBtn.onclick = () => saveOffer(existing);
  const scrapeBtn = $('btnScrape');
  if (scrapeBtn) scrapeBtn.onclick = handleScrape;
}

/* ============ SCRAPER ============ */

async function handleScrape() {
  const urlInput = $('e_sourceUrl');
  const url = urlInput ? urlInput.value.trim() : '';
  const status = $('scrapeStatus');
  const btn = $('btnScrape');

  if (!url) {
    if (status) status.innerHTML = '<span class="error">الرجاء لصق الرابط.</span>';
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الاستيراد...'; }
  if (status) status.innerHTML = '<span class="loading">🔄 جاري السحب...</span>';

  try {
    const result = await scrapeHotelUrl(url);

    if (!result.success) {
      if (status) status.innerHTML = '<span class="error">❌ ' + esc(result.error) + '</span>';
      return;
    }

    const nameField = $('e_name');
    const descField = $('e_description');
    const starsField = $('e_hotel_stars');
    const destField = $('e_destination');
    const mainImg = $('e_image');
    const imagesField = $('e_images');
    const preview = $('scrapedImages');

    if (result.title && nameField) nameField.value = result.title;
    if (result.shortDescription && descField) descField.value = result.shortDescription;
    if (result.stars && starsField) starsField.value = result.stars;
    if (result.location && destField) destField.value = result.location;

    if (result.images && result.images.length) {
      if (mainImg) mainImg.value = result.images[0];
      if (imagesField) imagesField.value = result.images.slice(1).join('\n');
      if (preview) {
        preview.innerHTML = result.images.slice(0, 8).map(img => {
          return '<img src="' + esc(img) + '" loading="lazy" onerror="this.style.display=\'none\'">';
        }).join('');
      }
    }

    if (status) status.innerHTML = '<span class="success">✅ تم الاستيراد من ' + getSourceLabel(result.source) + ' — ' + result.images.length + ' صورة</span>';
  } catch (e) {
    console.error(e);
    if (status) status.innerHTML = '<span class="error">❌ خطأ: ' + esc(e.message) + '</span>';
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> استيراد'; }
  }
}

/* ============ SAVE OFFER ============ */

async function saveOffer(existing) {
  try {
    const idField = $('e_id');
    let id = idField ? idField.value.trim() : '';
    if (!id) id = 'offer_' + Date.now();
    id = id.replace(/[^a-zA-Z0-9_\-]/g, '_');

    const imagesField = $('e_images');
    let images = arr(imagesField ? imagesField.value : '');
    const mainImgField = $('e_image');
    const mainImage = mainImgField ? mainImgField.value.trim() : '';
    if (mainImage && images.indexOf(mainImage) === -1) images.unshift(mainImage);

    const typeField = $('e_type');
    const type = typeField ? typeField.value : 'hotel';
    const categoryMap = { flight: 'رحلات طيران', hotel: 'فنادق', tour: 'رحلات سياحية', service: 'خدمات سفر' };

    const nameField = $('e_name');
    const name = nameField ? nameField.value.trim() : '';
    if (!name) { alert('اكتب اسم العرض أولًا.'); return; }

    const data = {
      id: id,
      type: type,
      category: categoryMap[type] || 'عروض',
      name: name,
      country: $('e_country') ? $('e_country').value.trim() : '',
      destination: $('e_destination') ? $('e_destination').value.trim() : '',
      price: Number($('e_price') ? $('e_price').value : 0),
      currency: $('e_currency') ? $('e_currency').value : 'USD',
      image: images[0] || '',
      images: images,
      description: $('e_description') ? $('e_description').value.trim() : '',
      notes: $('e_notes') ? $('e_notes').value.trim() : '',
      fromIata: $('e_from') ? $('e_from').value.trim().toUpperCase() : '',
      toIata: $('e_to') ? $('e_to').value.trim().toUpperCase() : '',
      airlineId: $('e_airline') ? $('e_airline').value : '',
      duration: $('e_duration') ? $('e_duration').value.trim() : '',
      hotel: {
        name: $('e_hotel_name') ? $('e_hotel_name').value.trim() : '',
        stars: Number($('e_hotel_stars') ? $('e_hotel_stars').value : 5),
        rooms: arr($('e_rooms') ? $('e_rooms').value : ''),
        amenities: arr($('e_amenities') ? $('e_amenities').value : '')
      },
      included: arr($('e_included') ? $('e_included').value : ''),
      excluded: arr($('e_excluded') ? $('e_excluded').value : ''),
      order: Number($('e_order') ? $('e_order').value : 0),
      active: $('e_active') ? $('e_active').checked : true,
      discount: {
        enabled: $('e_discount_enabled') ? $('e_discount_enabled').checked : false,
        type: $('e_discount_type') ? $('e_discount_type').value : 'percent',
        value: Number($('e_discount_value') ? $('e_discount_value').value : 0),
        label: $('e_discount_label') ? $('e_discount_label').value.trim() : ''
      },
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.uid
    };

    if (existing) {
      await updateDoc(doc(db, 'offers', id), data);
    } else {
      data.createdAt = serverTimestamp();
      data.createdBy = currentUser.uid;
      await setDoc(doc(db, 'offers', id), data);
    }

    closeModal();
    await loadAll();
    alert('✅ تم الحفظ بنجاح.');
  } catch (e) {
    console.error(e);
    alert('تعذر الحفظ: ' + e.message);
  }
}

/* ============ PACKAGES ============ */

async function renderPackageTable() {
  try {
    const snap = await getDocs(collection(db, 'tourPackages'));
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const root = $('packageTable');
    if (!root) return;
    let html = '<table class="data-table"><thead><tr><th>البكج</th><th>الوجهة</th><th>السعر</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
    if (rows.length) {
      rows.forEach(x => {
        html += '<tr>';
        html += '<td><b>' + esc(x.name || '') + '</b></td>';
        html += '<td>' + esc(x.destination || '') + '</td>';
        html += '<td>' + esc(money(x.price, x.currency)) + '</td>';
        html += '<td><span class="pill ' + (x.active === false ? 'off' : 'on') + '">' + (x.active === false ? 'مخفي' : 'ظاهر') + '</span></td>';
        html += '<td class="actions">';
        html += '<button data-pedit="' + esc(x.id) + '"><i class="fa-solid fa-pen"></i></button>';
        html += '<button data-pdelete="' + esc(x.id) + '" class="danger"><i class="fa-solid fa-trash"></i></button>';
        html += '</td></tr>';
      });
    } else {
      html += '<tr><td colspan="5" class="empty">لا توجد بكجات.</td></tr>';
    }
    html += '</tbody></table>';
    root.innerHTML = html;

    document.querySelectorAll('[data-pedit]').forEach(b => {
      b.onclick = () => openPackageEditor(rows.find(x => x.id === b.dataset.pedit));
    });
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

function openPackageEditor(x) {
  const p = x || EMPTY_TOUR_PACKAGE;
  let html = '<div class="editor-wrap">';
  html += '<h2>' + (x ? 'تعديل البكج' : 'إضافة بكج') + '</h2>';
  html += '<div class="editor-grid">';
  html += '<div class="field"><label>المعرف</label><input id="p_id" value="' + esc(p.id || '') + '"' + (x ? ' readonly' : '') + ' placeholder="pkg-dubai-01" dir="ltr"></div>';
  html += '<div class="field full"><label>اسم البكج *</label><input id="p_name" value="' + esc(p.name || '') + '"></div>';
  html += '<div class="field"><label>الدولة</label><input id="p_country" value="' + esc(p.country || '') + '"></div>';
  html += '<div class="field"><label>الوجهة</label><input id="p_destination" value="' + esc(p.destination || '') + '"></div>';
  html += '<div class="field"><label>المدة</label><input id="p_duration" value="' + esc(p.duration || '') + '"></div>';
  html += '<div class="field"><label>السعر</label><input id="p_price" value="' + esc(p.price || '') + '"></div>';
  html += '<div class="field full"><label>الوصف</label><textarea id="p_desc" rows="3">' + esc(p.description || '') + '</textarea></div>';
  html += '<div class="field full"><label>روابط الصور (سطر لكل رابط)</label><textarea id="p_images" rows="4" dir="ltr">' + esc(arr(p.images).join('\n')) + '</textarea></div>';
  html += '<div class="field"><label><input type="checkbox" id="p_active"' + (p.active ? ' checked' : '') + '> نشر</label></div>';
  html += '</div>';
  html += '<div class="editor-actions"><button class="btn primary" id="savePackage">حفظ</button><button class="btn secondary" id="cancelPackage">إلغاء</button></div>';
  html += '</div>';
  openModal(html);

  const cancelBtn = $('cancelPackage');
  if (cancelBtn) cancelBtn.onclick = closeModal;
  const saveBtn = $('savePackage');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      try {
        let id = $('p_id') ? $('p_id').value.trim() : '';
        if (!id) id = 'pkg_' + Date.now();
        const imagesList = arr($('p_images') ? $('p_images').value : '');
        const data = {
          name: $('p_name') ? $('p_name').value.trim() : '',
          country: $('p_country') ? $('p_country').value.trim() : '',
          destination: $('p_destination') ? $('p_destination').value.trim() : '',
          duration: $('p_duration') ? $('p_duration').value.trim() : '',
          price: Number($('p_price') ? $('p_price').value : 0),
          currency: 'USD',
          description: $('p_desc') ? $('p_desc').value.trim() : '',
          images: imagesList,
          image: imagesList[0] || '',
          active: $('p_active') ? $('p_active').checked : true,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        };
        await setDoc(doc(db, 'tourPackages', id), data, { merge: true });
        closeModal();
        renderPackageTable();
      } catch (e) { alert(e.message); }
    };
  }
}

/* ============ AIRLINES ============ */

function renderAirlineTable() {
  const root = $('airlineTable');
  if (!root) return;
  let html = '<table class="data-table"><thead><tr><th>اللوقو</th><th>الشركة</th><th>IATA</th><th>إجراء</th></tr></thead><tbody>';
  AIRLINES.forEach(a => {
    html += '<tr>';
    html += '<td>' + (a.logo ? '<img src="' + esc(a.logo) + '" class="logo-thumb" onerror="this.style.display=\'none\'">' : '') + '</td>';
    html += '<td>' + esc(a.name) + '<br><small>' + esc(a.nameEn || '') + '</small></td>';
    html += '<td>' + esc(a.iata || '') + '</td>';
    html += '<td class="actions"><button data-aedit="' + esc(a.id) + '"><i class="fa-solid fa-pen"></i></button></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  root.innerHTML = html;

  document.querySelectorAll('[data-aedit]').forEach(b => {
    b.onclick = () => openAirlineEditor(AIRLINES.find(x => x.id === b.dataset.aedit));
  });
}

function openAirlineEditor(a) {
  const x = a || { id: '', name: '', nameEn: '', iata: '', logo: '' };
  let html = '<div class="editor-wrap"><h2>إدارة شركة الطيران</h2>';
  html += '<div class="editor-grid">';
  html += '<div class="field"><label>المعرف</label><input id="a_id" value="' + esc(x.id) + '" readonly></div>';
  html += '<div class="field full"><label>الاسم العربي</label><input id="a_name" value="' + esc(x.name) + '"></div>';
  html += '<div class="field"><label>English name</label><input id="a_nameEn" value="' + esc(x.nameEn || '') + '" dir="ltr"></div>';
  html += '<div class="field"><label>IATA</label><input id="a_iata" value="' + esc(x.iata || '') + '" dir="ltr"></div>';
  html += '<div class="field full"><label>لوقو URL</label><input id="a_logo" value="' + esc(x.logo || '') + '" dir="ltr"></div>';
  html += '</div>';
  html += '<div class="editor-actions"><button class="btn primary" id="saveAirline">حفظ</button><button class="btn secondary" id="cancelAirline">إلغاء</button></div>';
  html += '</div>';
  openModal(html);

  const cancelBtn = $('cancelAirline');
  if (cancelBtn) cancelBtn.onclick = closeModal;
  const saveBtn = $('saveAirline');
  if (saveBtn) {
    saveBtn.onclick = async () => {
      try {
        const id = $('a_id') ? $('a_id').value.trim() : '';
        await setDoc(doc(db, 'airlines', id), {
          name: $('a_name') ? $('a_name').value.trim() : '',
          nameEn: $('a_nameEn') ? $('a_nameEn').value.trim() : '',
          iata: $('a_iata') ? $('a_iata').value.trim().toUpperCase() : '',
          logo: $('a_logo') ? $('a_logo').value.trim() : '',
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        }, { merge: true });
        closeModal();
        await loadAll();
      } catch (e) { alert(e.message); }
    };
  }
}

/* ============ BOOKINGS ============ */

async function renderBookings() {
  try {
    const snap = await getDocs(collection(db, 'bookings'));
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const root = $('bookingTable');
    if (!root) return;
    let html = '<table class="data-table"><thead><tr><th>الاسم</th><th>الهاتف</th><th>الخدمة</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>';
    if (rows.length) {
      rows.forEach(x => {
        html += '<tr>';
        html += '<td>' + esc(x.fullName || '') + '</td>';
        html += '<td>' + esc(x.phone || '') + '</td>';
        html += '<td>' + esc(x.service || '') + '</td>';
        html += '<td>' + esc(x.travelDate || '') + '</td>';
        html += '<td><span class="pill">' + esc(x.status || 'Pending') + '</span></td>';
        html += '<td><button data-bstatus="' + esc(x.id) + '"><i class="fa-solid fa-rotate"></i></button></td>';
        html += '</tr>';
      });
    } else {
      html += '<tr><td colspan="6" class="empty">لا توجد طلبات.</td></tr>';
    }
    html += '</tbody></table>';
    root.innerHTML = html;

    document.querySelectorAll('[data-bstatus]').forEach(b => {
      b.onclick = async () => {
        const status = prompt('الحالة: Pending / Confirmed / Cancelled / Completed', 'Confirmed');
        if (status) {
          await updateDoc(doc(db, 'bookings', b.dataset.bstatus), {
            status: status,
            updatedAt: serverTimestamp(),
            updatedBy: currentUser.uid
          });
          renderBookings();
        }
      };
    });
  } catch (e) {
    const root = $('bookingTable');
    if (root) root.innerHTML = '<div class="notice">تعذر تحميل الطلبات.</div>';
  }
}

/* ============ USERS ============ */

async function renderUsers() {
  try {
    const snap = await getDocs(collection(db, 'users'));
    const root = $('userTable');
    if (!root) return;
    let html = '<table class="data-table"><thead><tr><th>الاسم</th><th>البريد</th><th>UID</th></tr></thead><tbody>';
    snap.docs.forEach(d => {
      const x = d.data();
      html += '<tr>';
      html += '<td>' + esc(x.name || x.displayName || '') + '</td>';
      html += '<td>' + esc(x.email || '') + '</td>';
      html += '<td><small>' + esc(d.id) + '</small></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    root.innerHTML = html;
  } catch (e) {
    const root = $('userTable');
    if (root) root.innerHTML = '<div class="notice">تعذر تحميل العملاء.</div>';
  }
}

console.log('✅ FLORIN Admin v2 loaded with URL scraper');
