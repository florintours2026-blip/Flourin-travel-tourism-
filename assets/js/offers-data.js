import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* Updated travel offers. Hotel galleries use official hotel/brand image URLs.
   Verify commercial image-use rights before production deployment. */

const A = "assets/images/offers/cleaned/";

export const DEFAULT_OFFERS = [
  {
    id:"dubai", name:"باقة دبي الفاخرة", country:"الإمارات العربية المتحدة", destination:"دبي",
    duration:"5 أيام / 4 ليالٍ", price:"يحدد حسب تاريخ السفر", category:"رحلات سياحية",
    description:"إقامة فاخرة في فندق 5 نجوم مع خيارات غرف وأجنحة ومرافق مميزة وبرنامج سياحي قابل للتخصيص.",
    image:A+"dubai-offer-clean.png",
    images:["https://cache.marriott.com/content/dam/marriott-renditions/DXBJW/dxbjw-exterior-0209-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85", "https://cache.marriott.com/content/dam/marriott-renditions/DXBJW/dxbjw-king-deluxe-9679-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85", "https://cache.marriott.com/content/dam/marriott-renditions/DXBJW/dxbjw-room-0206-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85", "https://cache.marriott.com/is/image/marriotts7prod/dxbjw-business-0085%3AWide-Ver?fit=constrain&wid=1200"],
    hotel:{name:"JW Marriott Marquis Hotel Dubai",stars:5,location:"Business Bay, Dubai, UAE",type:"فندق 5 نجوم",
      rooms:["Deluxe Sea View Guest Room","Deluxe Twin Guest Room","Executive Suite","Penthouse Suite"],
      amenities:["مسبح","نادي لياقة","Saray Spa","مطاعم متعددة","خدمة غرف","واي فاي"]},
    included:["4 ليالٍ في فندق 5 نجوم","اختيار نوع الغرفة حسب التوفر","إمكانية تنسيق الجولات","إمكانية إضافة الطيران والانتقالات"],
    excluded:["تذاكر الطيران ما لم تذكر في السعر","المصاريف الشخصية","الخدمات الإضافية"],
    notes:"صور الفندق من معرض Marriott الرسمي. السعر والتوفر النهائيان يؤكدان قبل الحجز.", active:true, order:1
  },
  {
    id:"maldives", name:"باقة المالديف الفاخرة", country:"المالديف", destination:"Raa Atoll",
    duration:"5 أيام / 4 ليالٍ", price:"يحدد حسب تاريخ السفر", category:"رحلات سياحية",
    description:"إقامة في منتجع 5 نجوم بفيلات فوق الماء وفيلات شاطئية مع مسابح خاصة وخيارات إقامة فاخرة.",
    image:A+"maldives-offer-clean.png",
    images:["https://assets.hyatt.com/content/dam/hyatt/hyattdam/images/2022/12/08/0856/MLDAL-P0168-Sunrise-Water-Villa-Bedroom.jpg/MLDAL-P0168-Sunrise-Water-Villa-Bedroom.16x9.jpg?imwidth=2560", "https://assets.hyatt.com/content/dam/hyatt/hyattdam/images/2022/06/07/1314/MLDAL-P0020-Water-Villa-Interior.jpg/MLDAL-P0020-Water-Villa-Interior.16x9.jpg?imwidth=2560", "https://assets.hyatt.com/content/dam/hyatt/hyattdam/images/2022/03/07/0531/MLDAL-P0014-Water-Villa-Pool-Deck.jpg/MLDAL-P0014-Water-Villa-Pool-Deck.16x9.jpg?imwidth=2560", "https://assets.hyatt.com/content/dam/hyatt/hyattdam/images/2022/06/05/0209/MLDAL-P0018-Water-Villa-Exterior.jpg/MLDAL-P0018-Water-Villa-Exterior.16x9.jpg?imwidth=2560"],
    hotel:{name:"Alila Kothaifaru Maldives",stars:5,location:"Raa Atoll, Maldives",type:"منتجع 5 نجوم",
      rooms:["One-Bedroom Lagoon Overwater Pool Villa","One-Bedroom Sunset Overwater Pool Villa","One-Bedroom Beach Pool Villa"],
      amenities:["مسبح خاص","شاطئ","رياضات مائية","غوص","سبا","مطاعم","واي فاي"]},
    included:["4 ليالٍ في منتجع 5 نجوم","اختيار الفيلا حسب التوفر","تنسيق الانتقالات","إمكانية إضافة الطيران"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","الأنشطة الإضافية"],
    notes:"صور المنتجع من صفحات Hyatt الرسمية. تحقق من حقوق الاستخدام التجاري قبل رفع الصور محليًا.", active:true, order:2
  },
  {
    id:"istanbul", name:"باقة إسطنبول الفاخرة", country:"تركيا", destination:"إسطنبول",
    duration:"6 أيام / 5 ليالٍ", price:"يحدد حسب تاريخ السفر", category:"رحلات سياحية",
    description:"إقامة في فندق 5 نجوم في إسطنبول مع غرف وأجنحة فاخرة ومرافق سبا ومطاعم وخيارات جولات.",
    image:A+"istanbul-offer-clean.png",
    images:["https://cache.marriott.com/is/image/marriotts7prod/xr-istxr-hotel-exterior--22584-77790%3AWide-Hor?fit=constrain&wid=1200", "https://cache.marriott.com/content/dam/marriott-renditions/ISTXR/istxr-king-guestroom-5681-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85", "https://cache.marriott.com/content/dam/marriott-renditions/ISTXR/istxr-grand-rooms-8005-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85"],
    hotel:{name:"The St. Regis Istanbul",stars:5,location:"Nişantaşı, Istanbul, Türkiye",type:"فندق 5 نجوم",
      rooms:["King Superior Guest Room","King Deluxe Guest Room","St. Regis Suite","Presidential Suite"],
      amenities:["سبا","مطاعم","صالة","نادي لياقة","خدمة غرف","واي فاي"]},
    included:["5 ليالٍ في فندق 5 نجوم","اختيار نوع الغرفة حسب التوفر","إمكانية تنسيق جولة البوسفور","إمكانية إضافة الطيران والانتقالات"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","الجولات غير المختارة"],
    notes:"صور الفندق من معرض Marriott الرسمي. السعر والتوفر النهائيان يؤكدان قبل الحجز.", active:true, order:3
  },
  {
    id:"umrah", name:"باقة العمرة الفاخرة", country:"المملكة العربية السعودية", destination:"مكة المكرمة",
    duration:"حسب البرنامج", price:"يحدد حسب التاريخ والخدمات", category:"عمرة",
    description:"برنامج عمرة قابل للتخصيص مع إقامة في فندق 5 نجوم قريب جدًا من المسجد الحرام وخيارات غرف وأجنحة متعددة.",
    image:A+"makkah-offer-clean.png",
    images:["https://digital.ihg.com/is/image/ihg/intercontinental-makkah-4178759574-2x1", "https://digital.ihg.com/is/image/ihg/intercontinental-makkah-6854797441-2x1", "https://digital.ihg.com/is/image/ihg/intercontinental-makkah-6352014015-2x1", "https://digital.ihg.com/is/image/ihg/intercontinental-makkah-8817018288-2x1"],
    hotel:{name:"InterContinental Dar Al Tawhid Makkah",stars:5,location:"Ibrahim Al Khalil Road, Makkah, Saudi Arabia",type:"فندق فاخر 5 نجوم",
      rooms:["Classic Room","Diplomatic Suite","Amiri Suite","Presidential Suite","Royal Suite","VIP Suite"],
      amenities:["قرب مباشر من الحرم","مصليات خاصة","مطاعم","ZamZam Café","نادي أطفال","واي فاي"]},
    included:["الإقامة حسب البرنامج","المساعدة في ترتيبات الحجز","خدمة النقل حسب الباقة","إمكانية إضافة الطيران"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","أي خدمة غير مذكورة"],
    notes:"صور الفندق من IHG الرسمي. الموقع الرسمي يذكر قرب الفندق من المسجد الحرام وخيارات غرف وأجنحة متعددة.", active:true, order:4
  },
  {
    id:"egypt", name:"اكتشف شرم الشيخ", country:"مصر", destination:"شرم الشيخ",
    duration:"حسب البرنامج", price:"يحدد حسب التاريخ", category:"رحلات سياحية",
    description:"برنامج سياحي في شرم الشيخ مع إقامة في منتجع 5 نجوم وشاطئ ومسابح ومرافق سبا.",
    image:A+"egypt-offer-clean.png",
    images:["https://cache.marriott.com/content/dam/marriott-renditions/SSHBR/sshbr-view-0100-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85", "https://cache.marriott.com/content/dam/marriott-renditions/SSHBR/sshbr-lower-lobby-5892-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85", "https://cache.marriott.com/is/image/marriotts7prod/br-sshbr-standard-guestroom---king-20757%3AWide-Hor?fit=constrain&wid=1200", "https://cache.marriott.com/is/image/marriotts7prod/br-sshbr-king-seaview-guestroom-10635%3AWide-Hor?fit=constrain&wid=1200", "https://cache.marriott.com/content/dam/marriott-renditions/SSHBR/sshbr-lobby-bar-5890-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85", "https://cache.marriott.com/content/dam/marriott-renditions/SSHBR/sshbr-pool-0089-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85"],
    hotel:{name:"Renaissance Sharm El Sheikh Golden View Beach Resort",stars:5,location:"Al Fanar Street, Sharm El Sheikh, Egypt",type:"منتجع 5 نجوم",
      rooms:["Standard Garden View King","Standard Garden View Twin","Standard Sea View King","Sea View Twin"],
      amenities:["شاطئ","مسابح","سبا","غوص وشعاب مرجانية","مركز لياقة","مطاعم وبارات","تنس"]},
    included:["الإقامة حسب البرنامج","إمكانية اختيار نوع الغرفة","إمكانية إضافة النقل والجولات","إمكانية إضافة الطيران"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","الأنشطة غير المختارة"],
    notes:"صور الفندق من معرض Marriott الرسمي وتشمل الردهة والغرف والمسابح.", active:true, order:5
  },
  {
    id:"egypt-security", name:"الموافقة الأمنية لدخول مصر", country:"مصر", destination:"مصر",
    duration:"حسب الخدمة", price:"يحدد حسب الطلب", category:"خدمات سفر",
    description:"متابعة طلب الخدمة وفق البيانات والمتطلبات المعتمدة.",
    image:A+"egypt-security-offer-clean.png", images:[A+"egypt-security-offer-clean.png"],
    included:["مراجعة البيانات الأولية","توضيح المستندات المطلوبة","متابعة الطلب بعد التأكيد"],
    excluded:["الرسوم الحكومية أو الخارجية إن وجدت"], notes:"القبول ومدة الإنجاز يخضعان للجهة المختصة.", active:true, order:6
  }
  {
    id:"dubai-flight", name:"رحلة القاهرة إلى دبي", country:"الإمارات العربية المتحدة", destination:"دبي",
    duration:"حسب تاريخ السفر", price:"يحدد حسب تاريخ السفر", category:"رحلات طيران",
    description:"خيارات رحلات جوية من القاهرة إلى دبي مع مراجعة المواعيد والتوفر والسعر النهائي قبل الحجز.",
    image:A+"dubai-offer-clean.png", images:[A+"dubai-offer-clean.png"],
    included:["مراجعة الرحلات المتاحة","مقارنة المواعيد والأسعار","تنسيق طلب الحجز"],
    excluded:["أي رسوم إضافية من شركة الطيران","الأمتعة أو الخدمات الإضافية حسب التذكرة"],
    notes:"السعر والتوفر يتغيران حسب تاريخ السفر وشركة الطيران.", active:true, order:7
  },
  {
    id:"malaysia-flight", name:"رحلة القاهرة إلى كوالالمبور", country:"ماليزيا", destination:"كوالالمبور",
    duration:"حسب تاريخ السفر", price:"يحدد حسب تاريخ السفر", category:"رحلات طيران",
    description:"خيارات رحلات جوية من القاهرة إلى كوالالمبور مع مراجعة المواعيد والتوفر والسعر النهائي قبل الحجز.",
    image:"assets/images/offers/dubai.webp", images:["assets/images/offers/dubai.webp"],
    included:["مراجعة الرحلات المتاحة","مقارنة المواعيد والأسعار","تنسيق طلب الحجز"],
    excluded:["أي رسوم إضافية من شركة الطيران","الأمتعة أو الخدمات الإضافية حسب التذكرة"],
    notes:"السعر والتوفر يتغيران حسب تاريخ السفر وشركة الطيران.", active:true, order:8
  },
  {
    id:"egypt-security", name:"الموافقة الأمنية لدخول مصر", country:"مصر", destination:"مصر",
    duration:"حسب الخدمة", price:"يحدد حسب الطلب", category:"خدمات سفر",
    description:"متابعة طلب خدمة الموافقة الأمنية وفق البيانات والمتطلبات المعتمدة.",
    image:A+"egypt-security-offer-clean.png", images:[A+"egypt-security-offer-clean.png"],
    included:["مراجعة البيانات الأولية","توضيح المستندات المطلوبة","متابعة الطلب بعد التأكيد"],
    excluded:["الرسوم الحكومية أو الخارجية إن وجدت"], notes:"القبول ومدة الإنجاز يخضعان للجهة المختصة.", active:true, order:9
  },
];

export async function getOffers() {
  try {
    const snap = await getDocs(collection(db,"offers"));
    if (!snap.empty) {
      return snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(o=>o.active!==false)
        .sort((a,b)=>Number(a.order||0)-Number(b.order||0));
    }
  } catch(e) {
    console.warn("Offers collection unavailable; using local defaults.",e);
  }
  return DEFAULT_OFFERS.filter(o=>o.active!==false)
    .sort((a,b)=>Number(a.order||0)-Number(b.order||0));
}

export async function getOffer(id) {
  const offers=await getOffers();
  return offers.find(o=>o.id===id)||null;
}

const safe=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

export async function renderHomeOffers() {
  const box=document.getElementById("homeOffersGrid");
  if(!box) return;
  const offers=await getOffers();
  box.innerHTML=offers.map(o=>`
    <article class="offer-card">
      <img src="${safe(o.image)}" alt="${safe(o.name)}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/logo/logo.png'">
      <div class="offer-content">
        <span class="offer-country">${safe(o.country)}</span>
        <h3>${safe(o.name)}</h3>
        <p>${safe(o.duration)}</p>
        <a href="offer-details.html?id=${encodeURIComponent(o.id)}" class="offer-btn">عرض التفاصيل</a>
      </div>
    </article>`).join("");
}
renderHomeOffers();
