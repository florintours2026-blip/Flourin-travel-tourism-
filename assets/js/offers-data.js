
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

export const DEFAULT_OFFERS = [{"id": "dubai", "name": "رحلة إلى دبي", "country": "دبي", "duration": "5 أيام / 4 ليالٍ", "price": "يبدأ السعر من —", "image": "assets/images/offers/dubai-offer.png", "category": "رحلات سياحية", "description": "بكج سياحي إلى دبي قابل للتخصيص حسب تاريخ السفر وعدد المسافرين.", "included": ["إمكانية حجز الفندق", "إمكانية حجز تذاكر الطيران", "تنسيق النقل والجولات حسب الطلب"], "excluded": ["المصاريف الشخصية", "الخدمات الإضافية غير المؤكدة"], "notes": "السعر النهائي والتوفر يتم تأكيدهما قبل الحجز.", "active": true}, {"id": "maldives", "name": "رحلة إلى المالديف", "country": "المالديف", "duration": "5 أيام / 4 ليالٍ", "price": "يبدأ السعر من —", "image": "assets/images/offers/maldives-offer.png", "category": "رحلات سياحية", "description": "رحلة استجمام إلى المالديف مع خيارات إقامة وخدمات سفر.", "included": ["خيارات إقامة فندقية", "إمكانية حجز الطيران", "تنسيق الانتقالات حسب الباقة"], "excluded": ["المصاريف الشخصية", "الخدمات الإضافية غير المختارة"], "notes": "السعر يختلف حسب الجزيرة والفندق وتاريخ السفر.", "active": true}, {"id": "istanbul", "name": "رحلة إلى إسطنبول", "country": "إسطنبول", "duration": "6 أيام / 5 ليالٍ", "price": "يبدأ السعر من —", "image": "assets/images/offers/istanbul-offer.png", "category": "رحلات سياحية", "description": "برنامج سياحي إلى إسطنبول مع خيارات فندقية وجولات.", "included": ["خيارات فنادق", "إمكانية حجز الطيران", "تنسيق الجولات حسب الطلب"], "excluded": ["المصاريف الشخصية", "الخدمات الإضافية غير المؤكدة"], "notes": "يتم تأكيد السعر والتوفر بعد استلام بيانات السفر.", "active": true}, {"id": "umrah", "name": "رحلة عمرة", "country": "مكة المكرمة", "duration": "حسب البرنامج", "price": "يحدد حسب البرنامج", "image": "assets/images/offers/makkah-offer.png", "category": "عمرة", "description": "برامج عمرة قابلة للتخصيص وفق التاريخ والخدمات المطلوبة.", "included": ["ترتيب خدمات السفر والإقامة حسب البرنامج", "مساعدة في إجراءات الحجز", "خدمات إضافية حسب الباقة"], "excluded": ["أي رسوم أو خدمة غير مؤكدة"], "notes": "تفاصيل الفنادق والنقل والبرنامج تعتمد على الباقة والتاريخ والتوافر.", "active": true}, {"id": "egypt", "name": "اكتشف مصر", "country": "مصر", "duration": "حسب البرنامج", "price": "يحدد حسب البرنامج", "image": "assets/images/offers/egypt-offer.png", "category": "رحلات سياحية", "description": "برامج سياحية في القاهرة وشرم الشيخ وغيرها.", "included": ["خيارات إقامة", "إمكانية حجز الطيران", "جولات سياحية حسب البرنامج"], "excluded": ["المصاريف الشخصية", "الخدمات الإضافية غير المختارة"], "notes": "يتم تحديد الفندق والبرنامج والسعر النهائي قبل التأكيد.", "active": true}, {"id": "egypt-security", "name": "الموافقة الأمنية لدخول مصر", "country": "مصر", "duration": "حسب الخدمة", "price": "يحدد حسب الطلب", "image": "assets/images/offers/egypt-security-offer.png", "category": "خدمات سفر", "description": "متابعة طلب الخدمة وفق البيانات والمتطلبات المعتمدة.", "included": ["مراجعة البيانات الأولية", "توضيح المستندات المطلوبة", "متابعة الطلب بعد التأكيد"], "excluded": ["الرسوم الحكومية أو الخارجية إن وجدت"], "notes": "القبول ومدة الإنجاز يخضعان للجهة المختصة.", "active": true}, {"id": "florin", "name": "أفضل عروض السفر", "country": "FLORIN", "duration": "حسب العرض", "price": "يحدد حسب العرض", "image": "assets/images/offers/florin-offer.png", "category": "عروض FLORIN", "description": "اكتشف مجموعة من عروض السفر والباقات القابلة للتحديث من لوحة الإدارة.", "included": ["اختيارات سفر وفنادق حسب العرض", "إمكانية تخصيص الطلب", "متابعة من فريق فلورين"], "excluded": ["الخدمات غير المذكورة في العرض النهائي"], "notes": "العرض النهائي والسعر والتوفر يتم تأكيدها قبل الحجز.", "active": true}];

export async function getOffers() {
  try {
    const snap = await getDocs(collection(db, "offers"));
    if (!snap.empty) {
      return snap.docs.map(d => ({id:d.id, ...d.data()})).filter(o => o.active !== false);
    }
  } catch (e) {
    console.warn("Offers collection unavailable; using local defaults.", e);
  }
  return DEFAULT_OFFERS.filter(o => o.active !== false);
}

export async function getOffer(id) {
  const offers = await getOffers();
  return offers.find(o => o.id === id) || null;
}

function safe(v) { return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])); }

export async function renderHomeOffers() {
  const box = document.getElementById("homeOffersGrid");
  if (!box) return;
  const offers = await getOffers();
  box.innerHTML = offers.map(o => `
    <article class="offer-card">
      <img src="${safe(o.image)}" alt="${safe(o.name)}">
      <div class="offer-content">
        <span class="offer-country">${safe(o.country)}</span>
        <h3>${safe(o.name)}</h3>
        <p>${safe(o.duration)}</p>
        <a href="offer-details.html?id=${encodeURIComponent(o.id)}" class="offer-btn">عرض التفاصيل</a>
      </div>
    </article>`).join("");
}

renderHomeOffers();
