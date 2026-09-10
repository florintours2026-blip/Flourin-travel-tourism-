import { auth, db, storage } from './firebase-config.js';
import { AIRPORTS, AIRLINES, DEFAULT_OFFERS, EMPTY_TOUR_PACKAGE } from './catalog-data.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js';
import {
  collection, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js';
import {
  ref as storageRef, uploadBytes, getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js';

const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>"']/g, m => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[m]));
const arr = value => Array.isArray(value)
  ? value
  : String(value ?? '').split('\n').map(x => x.trim()).filter(Boolean);
const money = (value, currency='USD') =>
  `${Number(value || 0).toLocaleString('en-US')} ${currency || ''}`.trim();

let currentUser = null;
let offers = [];
let airlines = [];
let packageRows = [];
let bookingRows = [];
let userRows = [];
let toastTimer = null;

window.__florinAdminStarted = true;

function toast(message, type='success') {
  const box = $('toast');
  if (!box) return;
  clearTimeout(toastTimer);
  box.textContent = message;
  box.className = `toast show ${type}`;
  toastTimer = setTimeout(() => box.className = 'toast', 3500);
}

function showLoadingButton(button, loadingText='جارٍ الحفظ...') {
  if (!button) return () => {};
  const old = button.innerHTML;
  button.disabled = true;
  button.dataset.oldHtml = old;
  button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText}`;
  return () => {
    button.disabled = false;
    button.innerHTML = button.dataset.oldHtml || old;
  };
}

async function isAdmin(user) {
  if (!user) return false;
  const snap = await getDoc(doc(db, 'admins', user.uid));
  if (!snap.exists()) return false;
  const data = snap.data();
  return data.active === true || data.active === 'true';
}

function openModal(html, title='') {
  const modal = $('modal');
  const content = $('modalContent');
  if (!modal || !content) return;
  content.innerHTML = html;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  const first = content.querySelector('input:not([type=file]), select, textarea, button');
  setTimeout(() => first?.focus(), 40);
}

function closeModal() {
  const modal = $('modal');
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  $('modalContent').innerHTML = '';
  document.body.classList.remove('modal-open');
}

function setTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark', dark);
  localStorage.setItem('florin_admin_theme', dark ? 'dark' : 'light');
  const icon = $('adminTheme')?.querySelector('i');
  if (icon) icon.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  $('adminTheme')?.setAttribute('title', dark ? 'الوضع الفاتح' : 'الوضع الداكن');
}

function initTheme() {
  const saved = localStorage.getItem('florin_admin_theme');
  setTheme(saved || 'light');
  $('adminTheme')?.addEventListener('click', () => {
    setTheme(document.body.classList.contains('dark') ? 'light' : 'dark');
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.admin-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });
  $('adminSide')?.classList.remove('open');
  window.scrollTo({top:0, behavior:'smooth'});
}

function initNavigation() {
  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll('[data-open-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.openTab));
  });
  $('mobileMenu')?.addEventListener('click', () => $('adminSide')?.classList.toggle('open'));
  $('closeModal')?.addEventListener('click', closeModal);
  $('modal')?.addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('modal')?.hidden) closeModal();
  });
}

function airportOptions(selected='') {
  return AIRPORTS.map(a =>
    `<option value="${esc(a.iata)}" ${a.iata === selected ? 'selected' : ''}>${esc(a.iata)} — ${esc(a.city)}</option>`
  ).join('');
}

function airlineOptions(selected='') {
  const list = airlines.length ? airlines : AIRLINES;
  return `<option value="">بدون شركة</option>` + list.map(a =>
    `<option value="${esc(a.id)}" ${a.id === selected ? 'selected' : ''}>${esc(a.name)}${a.iata ? ` (${esc(a.iata)})` : ''}</option>`
  ).join('');
}

async function loadAll() {
  const [offerSnap, airlineSnap] = await Promise.all([
    getDocs(collection(db, 'offers')),
    getDocs(collection(db, 'airlines'))
  ]);
  offers = offerSnap.docs.map(d => ({id:d.id, ...d.data()}));
  airlines = airlineSnap.docs.map(d => ({id:d.id, ...d.data()}));
  if (!airlines.length) airlines = [...AIRLINES];
  renderStats();
  renderFlightTable();
  renderCatalogTable();
  await renderPackageTable();
  renderAirlineTable();
  await renderBookings();
  await renderUsers();
}

function renderStats() {
  const flightCount = offers.filter(x => x.type === 'flight').length;
  const catalogCount = offers.filter(x => x.type !== 'flight').length;
  $('flightCount').textContent = flightCount;
  $('catalogCount').textContent = catalogCount;
  $('packageCount').textContent = packageRows.length;
  $('bookingCount').textContent = bookingRows.length;
  $('userCount').textContent = userRows.length;

  const cards = [
    ['fa-plane-departure', flightCount, 'عروض الطيران'],
    ['fa-hotel', catalogCount, 'الفنادق والخدمات'],
    ['fa-suitcase-rolling', packageRows.length, 'البكجات السياحية'],
    ['fa-clipboard-list', bookingRows.length, 'طلبات العملاء']
  ];
  $('stats').innerHTML = cards.map(([icon,value,label]) => `
    <div class="stat">
      <div class="stat-icon"><i class="fa-solid ${icon}"></i></div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>`).join('');
}

function emptyState(icon, title, text='') {
  return `<div class="empty-state"><i class="fa-solid ${icon}"></i><b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ''}</div>`;
}

function renderFlightTable() {
  const rows = offers
    .filter(x => x.type === 'flight')
    .sort((a,b) => Number(a.order||0) - Number(b.order||0));

  $('flightTable').innerHTML = rows.length ? `
    <table class="data-table">
      <thead><tr><th>العرض</th><th>المسار</th><th>شركة الطيران</th><th>السعر</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${rows.map(rowOffer).join('')}</tbody>
    </table>` : emptyState('fa-plane-slash','لا توجد عروض طيران','اضغط «إضافة رحلة» لإنشاء أول عرض.');
  bindOfferActions();
}

function renderCatalogTable() {
  const rows = offers.filter(x => x.type !== 'flight');
  $('catalogTable').innerHTML = rows.length ? `
    <table class="data-table">
      <thead><tr><th>الصورة</th><th>العرض</th><th>الوجهة</th><th>السعر</th><th>الحالة</th><th>إجراءات</th></tr></thead>
      <tbody>${rows.map(rowOffer).join('')}</tbody>
    </table>` : emptyState('fa-hotel','لا توجد فنادق أو خدمات','اضغط «إضافة عرض» لإنشاء عرض جديد.');
  bindOfferActions();
}

function rowOffer(o) {
  const company = airlines.find(a => a.id === o.airlineId) || AIRLINES.find(a => a.id === o.airlineId);
  const discount = o.discount?.enabled
    ? (o.discount.label || `${o.discount.value}${o.discount.type === 'percent' ? '%' : ''}`)
    : '';
  return `<tr>
    <td>${o.image ? `<img class="thumb" src="${esc(o.image)}" alt="">` : '<span class="pill">بدون صورة</span>'}</td>
    <td><b>${esc(o.name || 'بدون اسم')}</b><small>${esc(o.category || '')}</small></td>
    <td>${esc(o.type === 'flight' ? `${o.fromIata||''} → ${o.toIata||''}` : (o.destination || o.country || '—'))}</td>
    <td><b>${money(o.price,o.currency)}</b>${discount ? `<small class="pill">${esc(discount)}</small>` : ''}</td>
    <td><span class="pill ${o.active === false ? 'off' : ''}">${o.active === false ? 'مخفي' : 'ظاهر'}</span></td>
    <td class="actions">
      <button data-edit="${esc(o.id)}"><i class="fa-solid fa-pen"></i> تعديل</button>
      <button data-toggle="${esc(o.id)}">${o.active === false ? '<i class="fa-solid fa-eye"></i> إظهار' : '<i class="fa-solid fa-eye-slash"></i> إخفاء'}</button>
      <button class="danger-btn" data-delete="${esc(o.id)}"><i class="fa-solid fa-trash"></i> حذف</button>
    </td>
  </tr>`;
}

function bindOfferActions() {
  document.querySelectorAll('[data-edit]').forEach(btn => {
    btn.onclick = () => {
      const offer = offers.find(x => x.id === btn.dataset.edit);
      if (offer) openOfferEditor(offer);
    };
  });
  document.querySelectorAll('[data-toggle]').forEach(btn => {
    btn.onclick = async () => {
      const offer = offers.find(x => x.id === btn.dataset.toggle);
      if (!offer) return;
      try {
        await updateDoc(doc(db,'offers',offer.id), {
          active: offer.active === false,
          updatedAt: serverTimestamp(),
          updatedBy: currentUser.uid
        });
        await loadAll();
        toast('تم تحديث حالة العرض.');
      } catch (e) { showError(e); }
    };
  });
  document.querySelectorAll('[data-delete]').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('هل تريد حذف هذا العرض نهائيًا؟')) return;
      try {
        await deleteDoc(doc(db,'offers',btn.dataset.delete));
        await loadAll();
        toast('تم حذف العرض.');
      } catch (e) { showError(e); }
    };
  });
}

function discountFields(d={}) {
  return `
    <div class="field"><label><input type="checkbox" id="e_discount_enabled" ${d.enabled ? 'checked' : ''}> تفعيل الخصم</label></div>
    <div class="field"><label>نوع الخصم</label><select id="e_discount_type">
      <option value="percent" ${d.type !== 'fixed' ? 'selected' : ''}>نسبة مئوية %</option>
      <option value="fixed" ${d.type === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option>
    </select></div>
    <div class="field"><label>قيمة الخصم</label><input id="e_discount_value" type="number" min="0" value="${Number(d.value||0)}"></div>
    <div class="field"><label>عبارة الخصم</label><input id="e_discount_label" value="${esc(d.label||'')}" placeholder="مثال: خصم 15%"></div>`;
}

function openOfferEditor(existing=null) {
  const x = existing || {
    id:'', type:'flight', category:'رحلات طيران', name:'', country:'', destination:'',
    price:'', currency:'USD', image:'', images:[], description:'', notes:'',
    active:true, order:0, fromIata:'CAI', toIata:'JED', airlineId:'',
    cabin:'اقتصادية', baggage:'', duration:'', stopover:'مباشر',
    hotel:{name:'',stars:5,rooms:[],amenities:[]},
    discount:{enabled:false,type:'percent',value:0,label:''}
  };
  const h = x.hotel || {};
  openModal(`
    <h2 id="modalTitle" class="modal-title">${existing?.id ? 'تعديل العرض' : 'إضافة عرض جديد'}</h2>
    <p class="modal-subtitle">املأ البيانات ثم اضغط «حفظ العرض». يمكنك اختيار عدة صور من الهاتف.</p>
    <div class="editor-grid">
      <div class="field"><label>نوع العرض</label><select id="e_type">
        <option value="flight" ${x.type==='flight'?'selected':''}>طيران</option>
        <option value="hotel" ${x.type==='hotel'?'selected':''}>فندق</option>
        <option value="service" ${x.type==='service'?'selected':''}>خدمة</option>
      </select></div>
      <div class="field"><label>معرف العرض</label><input id="e_id" value="${esc(x.id)}" ${existing?'readonly':''} placeholder="يُنشأ تلقائيًا إن تركته فارغًا"></div>
      <div class="field full"><label>اسم العرض *</label><input id="e_name" value="${esc(x.name)}" placeholder="مثال: باقة دبي 5 نجوم"></div>
      <div class="field"><label>الدولة</label><input id="e_country" value="${esc(x.country)}" placeholder="الإمارات"></div>
      <div class="field"><label>الوجهة</label><input id="e_destination" value="${esc(x.destination)}" placeholder="دبي"></div>
      <div class="field"><label>التصنيف</label><input id="e_category" value="${esc(x.category)}" placeholder="رحلات طيران / فنادق / خدمات"></div>
      <div class="field"><label>السعر *</label><input id="e_price" type="number" min="0" step="0.01" value="${esc(x.price)}"></div>
      <div class="field"><label>العملة</label><input id="e_currency" value="${esc(x.currency||'USD')}"></div>
      <div class="field full"><label>الصورة الرئيسية (رابط اختياري)</label><input id="e_image" value="${esc(x.image||'')}" dir="ltr" placeholder="https://..."></div>
      <div class="field full"><label>رفع صور من الهاتف</label><input id="e_files" type="file" accept="image/*" multiple><div class="help">يمكن اختيار أكثر من صورة. سيتم رفعها إلى Firebase Storage عند الحفظ.</div></div>
      <div class="field full"><label>روابط صور إضافية — رابط في كل سطر</label><textarea id="e_images" rows="3" dir="ltr">${esc(arr(x.images).join('\n'))}</textarea></div>
      <div class="field"><label>مطار المغادرة</label><select id="e_from">${airportOptions(x.fromIata||'CAI')}</select></div>
      <div class="field"><label>مطار الوصول</label><select id="e_to">${airportOptions(x.toIata||'JED')}</select></div>
      <div class="field"><label>شركة الطيران</label><select id="e_airline">${airlineOptions(x.airlineId||'')}</select></div>
      <div class="field"><label>الدرجة</label><input id="e_cabin" value="${esc(x.cabin||'اقتصادية')}"></div>
      <div class="field"><label>الأمتعة</label><input id="e_baggage" value="${esc(x.baggage||'')}"></div>
      <div class="field"><label>مدة الرحلة</label><input id="e_duration" value="${esc(x.duration||'')}"></div>
      <div class="field"><label>التوقف</label><input id="e_stopover" value="${esc(x.stopover||'مباشر')}"></div>
      <div class="field"><label>اسم الفندق</label><input id="e_hotel_name" value="${esc(h.name||'')}"></div>
      <div class="field"><label>نجوم الفندق</label><input id="e_hotel_stars" type="number" min="1" max="5" value="${Number(h.stars||5)}"></div>
      <div class="field full"><label>الغرف — نوع في كل سطر</label><textarea id="e_rooms" rows="3">${esc(arr(h.rooms).join('\n'))}</textarea></div>
      <div class="field full"><label>المرافق — خدمة في كل سطر</label><textarea id="e_amenities" rows="3">${esc(arr(h.amenities).join('\n'))}</textarea></div>
      <div class="field full"><label>الوصف</label><textarea id="e_description" rows="4">${esc(x.description||'')}</textarea></div>
      <div class="field full"><label>ملاحظات</label><textarea id="e_notes" rows="3">${esc(x.notes||'')}</textarea></div>
      <div class="field"><label>ترتيب العرض</label><input id="e_order" type="number" value="${Number(x.order||0)}"></div>
      <div class="field"><label><input id="e_active" type="checkbox" ${x.active!==false?'checked':''}> نشر العرض للعملاء</label></div>
      ${discountFields(x.discount)}
    </div>
    <div class="editor-actions">
      <button class="btn primary" id="saveEditor" type="button"><i class="fa-solid fa-floppy-disk"></i> حفظ العرض</button>
      <button class="btn secondary" id="cancelEditor" type="button">إلغاء</button>
    </div>`);
  $('cancelEditor').onclick = closeModal;
  $('saveEditor').onclick = () => saveOffer(existing);
}

function collectOfferData() {
  const name = $('e_name').value.trim();
  if (!name) throw new Error('اسم العرض مطلوب.');
  const price = Number($('e_price').value || 0);
  if (!Number.isFinite(price) || price < 0) throw new Error('السعر غير صحيح.');
  return {
    type:$('e_type').value,
    category:$('e_category').value.trim(),
    name,
    country:$('e_country').value.trim(),
    destination:$('e_destination').value.trim(),
    price,
    currency:$('e_currency').value.trim() || 'USD',
    image:$('e_image').value.trim(),
    images:arr($('e_images').value),
    fromIata:$('e_from').value,
    toIata:$('e_to').value,
    airlineId:$('e_airline').value,
    cabin:$('e_cabin').value.trim(),
    baggage:$('e_baggage').value.trim(),
    duration:$('e_duration').value.trim(),
    stopover:$('e_stopover').value.trim(),
    hotel:{
      name:$('e_hotel_name').value.trim(),
      stars:Number($('e_hotel_stars').value || 5),
      rooms:arr($('e_rooms').value),
      amenities:arr($('e_amenities').value)
    },
    description:$('e_description').value.trim(),
    notes:$('e_notes').value.trim(),
    order:Number($('e_order').value || 0),
    active:$('e_active').checked,
    discount:{
      enabled:$('e_discount_enabled').checked,
      type:$('e_discount_type').value,
      value:Number($('e_discount_value').value || 0),
      label:$('e_discount_label').value.trim()
    }
  };
}

async function uploadFiles(input, path) {
  const urls = [];
  if (!input?.files?.length) return urls;
  for (const file of Array.from(input.files)) {
    if (!file.type.startsWith('image/')) throw new Error(`الملف ${file.name} ليس صورة.`);
    if (file.size >= 8 * 1024 * 1024) throw new Error(`الصورة ${file.name} أكبر من 8MB.`);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
    const fileRef = storageRef(storage, `${path}/${Date.now()}-${safeName}`);
    const snap = await uploadBytes(fileRef, file, {contentType:file.type});
    urls.push(await getDownloadURL(snap.ref));
  }
  return urls;
}

async function saveOffer(existing) {
  const isEdit = Boolean(existing?.id);
  const button = $('saveEditor');
  const restore = showLoadingButton(button, 'جارٍ الحفظ...');
  try {
    const id = $('e_id').value.trim() || `offer_${Date.now()}`;
    let data = collectOfferData();
    const manualImages = data.images.filter(Boolean);
    if (data.image && !manualImages.includes(data.image)) manualImages.unshift(data.image);

    // Save the Firestore document first so a Storage problem cannot prevent the new record itself.
    const baseData = {
      ...data,
      id,
      image:manualImages[0] || '',
      images:manualImages,
      updatedAt:serverTimestamp(),
      updatedBy:currentUser.uid
    };
    if (isEdit) {
      await updateDoc(doc(db,'offers',id), baseData);
    } else {
      await setDoc(doc(db,'offers',id), {...baseData,createdAt:serverTimestamp(),createdBy:currentUser.uid});
    }

    let finalImages = [...manualImages];
    try {
      const uploaded = await uploadFiles($('e_files'), `offers/${id}`);
      finalImages = [...new Set([...finalImages, ...uploaded])];
    } catch (uploadError) {
      await updateDoc(doc(db,'offers',id), {images:finalImages,image:finalImages[0] || ''});
      throw new Error(`تم حفظ العرض، لكن تعذر رفع الصور: ${uploadError.message}`);
    }

    await updateDoc(doc(db,'offers',id), {
      images:finalImages,
      image:finalImages[0] || '',
      updatedAt:serverTimestamp()
    });

    closeModal();
    await loadAll();
    toast(isEdit ? 'تم تعديل العرض بنجاح.' : 'تمت إضافة العرض بنجاح.');
  } catch (e) {
    showError(e);
  } finally {
    restore();
  }
}

async function renderPackageTable() {
  try {
    const snap = await getDocs(collection(db,'tourPackages'));
    packageRows = snap.docs.map(d => ({id:d.id,...d.data()}));
    $('packageTable').innerHTML = packageRows.length ? `
      <table class="data-table">
        <thead><tr><th>البكج</th><th>الدولة</th><th>الوجهة</th><th>المدة</th><th>السعر</th><th>الحالة</th><th>إجراءات</th></tr></thead>
        <tbody>${packageRows.map(p => `<tr>
          <td><b>${esc(p.name||'بدون اسم')}</b><small>${esc(p.hotelName||'')}</small></td>
          <td>${esc(p.country||'—')}</td><td>${esc(p.destination||'—')}</td><td>${esc(p.duration||'—')}</td>
          <td>${money(p.price,p.currency)}</td>
          <td><span class="pill ${p.active===false?'off':''}">${p.active===false?'مخفي':'ظاهر'}</span></td>
          <td class="actions"><button data-pedit="${esc(p.id)}"><i class="fa-solid fa-pen"></i> تعديل</button><button class="danger-btn" data-pdelete="${esc(p.id)}"><i class="fa-solid fa-trash"></i> حذف</button></td>
        </tr>`).join('')}</tbody>
      </table>` : emptyState('fa-suitcase-rolling','لا توجد بكجات سياحية','اضغط «إضافة بكج» لإنشاء بكج جديد.');
    document.querySelectorAll('[data-pedit]').forEach(b => b.onclick = () => openPackageEditor(packageRows.find(x => x.id === b.dataset.pedit)));
    document.querySelectorAll('[data-pdelete]').forEach(b => b.onclick = async () => {
      if (!confirm('هل تريد حذف هذا البكج نهائيًا؟')) return;
      try { await deleteDoc(doc(db,'tourPackages',b.dataset.pdelete)); await renderPackageTable(); renderStats(); toast('تم حذف البكج.'); }
      catch(e){ showError(e); }
    });
  } catch(e) {
    $('packageTable').innerHTML = emptyState('fa-triangle-exclamation','تعذر تحميل البكجات','تحقق من اتصال Firebase وقواعد Firestore.');
    throw e;
  }
}

function openPackageEditor(existing=null) {
  const p = existing || {...EMPTY_TOUR_PACKAGE, id:''};
  openModal(`
    <h2 id="modalTitle" class="modal-title">${existing ? 'تعديل البكج' : 'إضافة بكج سياحي'}</h2>
    <p class="modal-subtitle">أضف الفندق والبرنامج والصور. يمكن رفع عدة صور من الهاتف دفعة واحدة.</p>
    <div class="editor-grid">
      <div class="field"><label>معرف البكج</label><input id="p_id" value="${esc(p.id||'')}" ${existing?'readonly':''} placeholder="يُنشأ تلقائيًا"></div>
      <div class="field"><label>اسم البكج *</label><input id="p_name" value="${esc(p.name||'')}" placeholder="مثال: دبي الفاخرة"></div>
      <div class="field"><label>الدولة</label><input id="p_country" value="${esc(p.country||'')}" placeholder="الإمارات"></div>
      <div class="field"><label>الوجهة</label><input id="p_destination" value="${esc(p.destination||'')}" placeholder="دبي"></div>
      <div class="field"><label>المدة</label><input id="p_duration" value="${esc(p.duration||'')}" placeholder="5 أيام / 4 ليال"></div>
      <div class="field"><label>السعر</label><input id="p_price" type="number" min="0" step="0.01" value="${esc(p.price||'')}"></div>
      <div class="field"><label>العملة</label><input id="p_currency" value="${esc(p.currency||'USD')}"></div>
      <div class="field"><label>شركة الطيران</label><select id="p_airline">${airlineOptions(p.airlineId||'')}</select></div>
      <div class="field"><label>اسم الفندق</label><input id="p_hotel" value="${esc(p.hotelName||'')}"></div>
      <div class="field"><label>نجوم الفندق</label><input id="p_stars" type="number" min="1" max="5" value="${Number(p.hotelStars||5)}"></div>
      <div class="field full"><label>وصف البكج</label><textarea id="p_desc" rows="4">${esc(p.description||'')}</textarea></div>
      <div class="field full"><label>البرنامج اليومي</label><textarea id="p_itinerary" rows="5">${esc(p.itinerary||'')}</textarea></div>
      <div class="field full"><label>يشمل — بند في كل سطر</label><textarea id="p_included" rows="3">${esc(arr(p.included).join('\n'))}</textarea></div>
      <div class="field full"><label>لا يشمل — بند في كل سطر</label><textarea id="p_excluded" rows="3">${esc(arr(p.excluded).join('\n'))}</textarea></div>
      <div class="field full"><label>رفع صور البكج من الهاتف</label><input id="p_files" type="file" accept="image/*" multiple><div class="help">سيتم حفظ الروابط تلقائيًا في البكج.</div></div>
      <div class="field full"><label>روابط صور إضافية — رابط في كل سطر</label><textarea id="p_images" rows="3" dir="ltr">${esc(arr(p.images).join('\n'))}</textarea></div>
      <div class="field"><label><input id="p_active" type="checkbox" ${p.active!==false?'checked':''}> نشر البكج للعملاء</label></div>
    </div>
    <div class="editor-actions"><button class="btn primary" id="savePackage" type="button"><i class="fa-solid fa-floppy-disk"></i> حفظ البكج</button><button class="btn secondary" id="cancelPackage" type="button">إلغاء</button></div>`);
  $('cancelPackage').onclick = closeModal;
  $('savePackage').onclick = () => savePackage(existing);
}

async function savePackage(existing) {
  const button = $('savePackage');
  const restore = showLoadingButton(button,'جارٍ الحفظ...');
  try {
    const id = $('p_id').value.trim() || `pkg_${Date.now()}`;
    const name = $('p_name').value.trim();
    if (!name) throw new Error('اسم البكج مطلوب.');
    let images = arr($('p_images').value);
    const base = {
      type:'tour', category:'بكجات سياحية', name,
      country:$('p_country').value.trim(), destination:$('p_destination').value.trim(),
      duration:$('p_duration').value.trim(), price:Number($('p_price').value||0),
      currency:$('p_currency').value.trim() || 'USD', airlineId:$('p_airline').value,
      hotelName:$('p_hotel').value.trim(), hotelStars:Number($('p_stars').value||5),
      description:$('p_desc').value.trim(), itinerary:$('p_itinerary').value.trim(),
      included:arr($('p_included').value), excluded:arr($('p_excluded').value),
      images, image:images[0]||'', active:$('p_active').checked,
      updatedAt:serverTimestamp(), updatedBy:currentUser.uid
    };
    if (existing) await updateDoc(doc(db,'tourPackages',id),base);
    else await setDoc(doc(db,'tourPackages',id),{...base,id,createdAt:serverTimestamp(),createdBy:currentUser.uid});

    try {
      const uploaded = await uploadFiles($('p_files'),`packages/${id}`);
      images = [...new Set([...images,...uploaded])];
      await updateDoc(doc(db,'tourPackages',id),{images,image:images[0]||'',updatedAt:serverTimestamp()});
    } catch(uploadError) {
      throw new Error(`تم حفظ البكج، لكن تعذر رفع الصور: ${uploadError.message}`);
    }
    closeModal();
    await renderPackageTable();
    renderStats();
    toast(existing ? 'تم تعديل البكج بنجاح.' : 'تمت إضافة البكج بنجاح.');
  } catch(e) { showError(e); }
  finally { restore(); }
}

function renderAirlineTable() {
  const extras = airlines.filter(a => !AIRLINES.some(seed => seed.id === a.id));
  const rows = [...AIRLINES.map(a => ({...a,seed:true})), ...extras];
  $('airlineTable').innerHTML = `
    <table class="data-table"><thead><tr><th>اللوقو</th><th>الشركة</th><th>IATA</th><th>المصدر</th><th>إجراء</th></tr></thead>
    <tbody>${rows.map(a => `<tr>
      <td>${a.logo ? `<img class="logo-thumb" src="${esc(a.logo)}" alt="">` : '<span class="pill">بدون</span>'}</td>
      <td><b>${esc(a.name||'')}</b><small>${esc(a.nameEn||'')}</small></td>
      <td>${esc(a.iata||'')}</td><td>${String(a.logo||'').startsWith('http')?'رابط / Storage':'ملف المشروع'}</td>
      <td class="actions"><button data-aedit="${esc(a.id)}"><i class="fa-solid fa-pen"></i> تعديل / رفع لوقو</button></td>
    </tr>`).join('')}</tbody></table>`;
  document.querySelectorAll('[data-aedit]').forEach(b => b.onclick = () => openAirlineEditor(rows.find(x => x.id === b.dataset.aedit)));
}

function openAirlineEditor(existing) {
  const x = existing || {id:`airline_${Date.now()}`,name:'',nameEn:'',iata:'',logo:''};
  openModal(`
    <h2 id="modalTitle" class="modal-title">إدارة شركة الطيران</h2>
    <p class="modal-subtitle">يمكن تعديل البيانات ورفع لوقو جديد من الهاتف.</p>
    <div class="editor-grid">
      <div class="field"><label>المعرف</label><input id="a_id" value="${esc(x.id)}" readonly></div>
      <div class="field"><label>الاسم العربي</label><input id="a_name" value="${esc(x.name||'')}"></div>
      <div class="field"><label>English name</label><input id="a_nameEn" value="${esc(x.nameEn||'')}"></div>
      <div class="field"><label>IATA</label><input id="a_iata" value="${esc(x.iata||'')}"></div>
      <div class="field full"><label>رابط اللوقو الحالي</label><input id="a_logo" value="${esc(x.logo||'')}" dir="ltr"></div>
      <div class="field full"><label>رفع لوقو من الهاتف</label><input id="a_file" type="file" accept="image/*,.svg"></div>
    </div>
    <div class="editor-actions"><button class="btn primary" id="saveAirline" type="button"><i class="fa-solid fa-floppy-disk"></i> حفظ</button><button class="btn secondary" id="cancelAirline" type="button">إلغاء</button></div>`);
  $('cancelAirline').onclick = closeModal;
  $('saveAirline').onclick = async () => {
    const restore = showLoadingButton($('saveAirline'),'جارٍ الحفظ...');
    try {
      let logo = $('a_logo').value.trim();
      const uploaded = await uploadFiles($('a_file'),`airlines/${x.id}`);
      if (uploaded[0]) logo = uploaded[0];
      await setDoc(doc(db,'airlines',x.id),{
        name:$('a_name').value.trim(), nameEn:$('a_nameEn').value.trim(),
        iata:$('a_iata').value.trim().toUpperCase(), logo,
        updatedAt:serverTimestamp(),updatedBy:currentUser.uid
      },{merge:true});
      closeModal(); await loadAll(); toast('تم حفظ شركة الطيران.');
    } catch(e) { showError(e); }
    finally { restore(); }
  };
}

async function renderBookings() {
  try {
    const snap = await getDocs(collection(db,'bookings'));
    bookingRows = snap.docs.map(d => ({id:d.id,...d.data()}));
    $('bookingTable').innerHTML = bookingRows.length ? `
      <table class="data-table"><thead><tr><th>العميل</th><th>الخدمة</th><th>المسار</th><th>العرض</th><th>التاريخ</th><th>الحالة</th><th>إجراء</th></tr></thead>
      <tbody>${bookingRows.map(x => `<tr>
        <td><b>${esc(x.fullName||x.name||'—')}</b><small>${esc(x.phone||x.email||'')}</small></td>
        <td>${esc(x.service||'—')}</td><td>${esc(`${x.fromIata||''} → ${x.toIata||''}`)}</td>
        <td>${esc(x.offerName||'—')}</td><td>${esc(x.travelDate||'—')}</td>
        <td><span class="pill">${esc(x.status||'Pending')}</span></td>
        <td><button data-bstatus="${esc(x.id)}">تغيير الحالة</button></td>
      </tr>`).join('')}</tbody></table>` : emptyState('fa-clipboard-check','لا توجد طلبات عملاء');
    document.querySelectorAll('[data-bstatus]').forEach(b => b.onclick = async () => {
      const status = prompt('أدخل الحالة: Pending / Confirmed / Cancelled / Completed','Confirmed');
      if (!status) return;
      try {
        await updateDoc(doc(db,'bookings',b.dataset.bstatus),{status,updatedAt:serverTimestamp(),updatedBy:currentUser.uid});
        await renderBookings(); renderStats(); toast('تم تحديث حالة الطلب.');
      } catch(e){ showError(e); }
    });
  } catch(e) {
    $('bookingTable').innerHTML = emptyState('fa-triangle-exclamation','تعذر تحميل الطلبات','تحقق من قواعد Firestore.');
  }
}

async function renderUsers() {
  try {
    const snap = await getDocs(collection(db,'users'));
    userRows = snap.docs.map(d => ({id:d.id,...d.data()}));
    $('userTable').innerHTML = userRows.length ? `
      <table class="data-table"><thead><tr><th>الاسم</th><th>البريد</th><th>UID</th><th>التسجيل</th></tr></thead>
      <tbody>${userRows.map(x => `<tr><td><b>${esc(x.name||x.displayName||'—')}</b></td><td>${esc(x.email||'—')}</td><td dir="ltr">${esc(x.id)}</td><td>${x.createdAt?.toDate ? esc(x.createdAt.toDate().toLocaleString('ar-EG')) : '—'}</td></tr>`).join('')}</tbody></table>`
      : emptyState('fa-users-slash','لا يوجد عملاء مسجلون');
  } catch(e) {
    $('userTable').innerHTML = emptyState('fa-triangle-exclamation','تعذر تحميل العملاء','تحقق من قواعد Firestore.');
  }
}

async function seedCatalog() {
  if (!confirm('سيتم مزامنة العروض المبدئية وشركات الطيران إلى Firestore. متابعة؟')) return;
  const button = $('seedCatalog');
  const restore = showLoadingButton(button,'جارٍ المزامنة...');
  try {
    for (const offer of DEFAULT_OFFERS) {
      await setDoc(doc(db,'offers',offer.id),{...offer,updatedAt:serverTimestamp(),updatedBy:currentUser.uid},{merge:true});
    }
    for (const airline of AIRLINES) {
      await setDoc(doc(db,'airlines',airline.id),{...airline,updatedAt:serverTimestamp(),updatedBy:currentUser.uid},{merge:true});
    }
    await loadAll();
    toast('تمت مزامنة العروض والشركات بنجاح.');
  } catch(e) { showError(e); }
  finally { restore(); }
}

function showError(error) {
  console.error('FLORIN ADMIN:',error);
  const code = error?.code ? ` (${error.code})` : '';
  toast(`${error?.message || 'حدث خطأ غير متوقع'}${code}`, 'error');
  alert(`تعذر تنفيذ العملية:\n\n${error?.message || error}`);
}

async function start(user) {
  currentUser = user;
  $('adminName').textContent = user.displayName || user.email || 'مدير النظام';
  $('authLoading').hidden = true;
  $('adminApp').hidden = false;

  initTheme();
  initNavigation();
  $('adminLogout')?.addEventListener('click', async () => {
    await signOut(auth);
    location.href = 'login.html';
  });
  $('newFlight')?.addEventListener('click', () => openOfferEditor({
    id:'',type:'flight',category:'رحلات طيران',name:'',country:'',destination:'',
    price:'',currency:'USD',image:'',images:[],description:'',notes:'',active:true,order:0,
    fromIata:'CAI',toIata:'JED',airlineId:'',cabin:'اقتصادية',baggage:'',duration:'',stopover:'مباشر',
    hotel:{name:'',stars:5,rooms:[],amenities:[]},discount:{enabled:false,type:'percent',value:0,label:''}
  }));
  $('newCatalog')?.addEventListener('click', () => openOfferEditor({
    id:'',type:'hotel',category:'فنادق',name:'',country:'',destination:'',
    price:'',currency:'USD',image:'',images:[],description:'',notes:'',active:true,order:0,
    fromIata:'CAI',toIata:'JED',airlineId:'',cabin:'اقتصادية',baggage:'',duration:'',stopover:'مباشر',
    hotel:{name:'',stars:5,rooms:[],amenities:[]},discount:{enabled:false,type:'percent',value:0,label:''}
  }));
  $('newPackage')?.addEventListener('click', () => openPackageEditor());
  $('newAirline')?.addEventListener('click', () => openAirlineEditor());
  $('refreshAll')?.addEventListener('click', async () => {
    try { await loadAll(); toast('تم تحديث البيانات.'); } catch(e){ showError(e); }
  });
  $('refreshBookings')?.addEventListener('click', renderBookings);
  $('seedCatalog')?.addEventListener('click', seedCatalog);

  try { await loadAll(); }
  catch(e) { showError(e); }
}

onAuthStateChanged(auth, async user => {
  try {
    if (!user) {
      location.href = 'login.html?admin=1';
      return;
    }
    if (!(await isAdmin(user))) {
      alert('هذا الحساب ليس ضمن المدراء.');
      await signOut(auth);
      location.href = 'login.html?admin=1';
      return;
    }
    await start(user);
  } catch(e) {
    console.error(e);
    const box = $('authLoading');
    if (box) box.innerHTML = `<div class="loading-card error-card"><i class="fa-solid fa-triangle-exclamation"></i><h2>تعذر تشغيل لوحة الإدارة</h2><p>${esc(e.message||'حدث خطأ أثناء التحقق')}</p><a href="login.html?admin=1">العودة إلى تسجيل الدخول</a></div>`;
  }
});
