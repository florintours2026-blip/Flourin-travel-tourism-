import { db } from "./firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* =====================================================
   FLORIN OFFERS DATA
   Real hotel photography sources are used for the starter
   packages. Replace remote URLs with Firebase Storage URLs
   after the admin uploads licensed photos.
===================================================== */

const REAL = {
  dubai: [
    "https://cache.marriott.com/content/dam/marriott-renditions/DXBDF/dxbdf-exterior-0556-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85",
    "https://cache.marriott.com/is/image/marriotts7prod/fp-dxbdf-8955-28385%3AWide-Hor?fit=constrain&wid=1200",
    "https://cache.marriott.com/content/dam/marriott-renditions/DXBDF/dxbdf-pool-7757-hor-wide.jpg?downsize=1200px%3A%2A&interpolation=progressive-bilinear&output-quality=85"
  ],
  maldives: [
    "https://www.asiaodysseytravel.com/images/maldives/reethi-beach-resort-4-star/reethi-beach-resort-1.jpg",
    "https://www.asiaodysseytravel.com/images/maldives/reethi-beach-resort-4-star/reethi-beach-resort-2.jpg",
    "https://www.asiaodysseytravel.com/images/maldives/reethi-beach-resort-4-star/reethi-beach-resort-3.jpg",
    "https://www.regal-diving.co.uk/uploads/images/galleries/_webp/max_indian-ocean-maldives-reethi-beach-resort-villa-interior-ahmed-rasheed-slideshow_.webp_webp_40cd750bba9870f18aada2478b24840a.webp"
  ],
  istanbul: [
    "https://int-source-images.s3-eu-west-1.amazonaws.com/images/6b874c0cb6c44c5d984fd52b14f2e65b.jpg",
    "https://int-source-images.s3-eu-west-1.amazonaws.com/images/66b6f5f84fa04b23a3e7701350c8aa60.jpg",
    "https://img3.aksam.com.tr/imgsdisk/2026/04/16/t25_hafta-sonu-gezi-rehberi-i-733.jpg"
  ],
  umrah: [
    "https://digital.ihg.com/is/image/ihg/voco-makkah-8781928005-16x5",
    "https://digital.ihg.com/is/image/ihg/voco-makkah-8803102012-4x3",
    "https://digital.ihg.com/is/image/ihg/voco-makkah-8210885181-4x3"
  ],
  egypt: [
    "https://images.jazhotels.com/3Cw6SGJMACIjSmQm_tGLiKzBWWU%3D/210x140/storage.googleapis.com%2Fjaz-prod%2Fstrapi%2F20251123_17_11_DSC_0491_HDR_Edit_a1121f44ba%2F20251123_17_11_DSC_0491_HDR_Edit_a1121f44ba.jpg",
    "https://images.jazhotels.com/T_hZU_ZptkCDelzbe1fJdADTnO0%3D/708x470/controlcenter-p1.synxis.com%2Fhotel%2F10884%2Fimages%2Froom%2Ffayrouz_queen_room_standard_garden_or_sea_side.jpg",
    "https://images.jazhotels.com/wswQYtKMBK9gfq6qC4NZJuax41k%3D/210x140/storage.googleapis.com%2Fjaz-prod%2Fstrapi%2F20251124_11_47_DSC_0403_Edit_aff4773c4e%2F20251124_11_47_DSC_0403_Edit_aff4773c4e.jpg",
    "https://images.jazhotels.com/Jo9HWoZcCFDX4szUNsuDIY6dbFw%3D/210x140/storage.googleapis.com%2Fjaz-prod%2Fstrapi%2FPool_2_d83f25ee8b%2FPool_2_d83f25ee8b.jpg"
  ]
};

const A = "assets/images/packages/";
const sourceNote = "صور حقيقية من صفحات الفنادق/مصادر الصور المذكورة في assets/images/packages/PHOTO-SOURCES.md. يجب التأكد من حقوق الاستخدام التجاري قبل النشر النهائي.";

export const DEFAULT_OFFERS = [
  {
    id:"dubai", name:"باقة دبي الفاخرة", country:"الإمارات العربية المتحدة", destination:"دبي",
    duration:"5 أيام / 4 ليالٍ", price:"يحدد حسب تاريخ السفر", category:"رحلات سياحية",
    description:"إقامة في فندق 4 نجوم مع برنامج سياحي قابل للتخصيص في دبي.",
    image:REAL.dubai[0], images:REAL.dubai,
    hotel:{name:"Four Points by Sheraton Bur Dubai",stars:4,location:"Bur Dubai, Dubai",type:"فندق 4 نجوم",rooms:["غرفة Classic King","غرفة Classic Twin","غرفة Superior King","جناح بغرفة نوم واحدة"],amenities:["واي فاي مجاني","إفطار","مسبح على السطح","نادي لياقة","مطاعم داخل الفندق"]},
    included:["4 ليالٍ في فندق 4 نجوم","اختيار نوع الغرفة حسب التوفر","إمكانية تنسيق الجولات","إمكانية إضافة الطيران والانتقالات"],
    excluded:["تذاكر الطيران ما لم تذكر في السعر","المصاريف الشخصية","الخدمات الإضافية"],
    notes:sourceNote, active:true, order:1
  },
  {
    id:"maldives", name:"باقة المالديف", country:"المالديف", destination:"Baa Atoll",
    duration:"5 أيام / 4 ليالٍ", price:"يحدد حسب تاريخ السفر", category:"رحلات سياحية",
    description:"إقامة في منتجع 4 نجوم وسط الشاطئ واللاجون مع خيارات فيلات وغرف مطلة على البحر.",
    image:REAL.maldives[0], images:REAL.maldives,
    hotel:{name:"Reethi Beach Resort",stars:4,location:"Baa Atoll, Maldives",type:"منتجع 4 نجوم",rooms:["Water Villa","Deluxe Sunset Villa","Reethi Suite"],amenities:["شاطئ خاص","رياضات مائية","غوص وSnorkeling","سبا","مطاعم وبارات"]},
    included:["4 ليالٍ في منتجع 4 نجوم","اختيار نوع الإقامة حسب التوفر","تنسيق الانتقالات","إمكانية إضافة الطيران"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","الأنشطة البحرية الإضافية"],
    notes:sourceNote, active:true, order:2
  },
  {
    id:"istanbul", name:"باقة إسطنبول", country:"تركيا", destination:"إسطنبول",
    duration:"6 أيام / 5 ليالٍ", price:"يحدد حسب تاريخ السفر", category:"رحلات سياحية",
    description:"إقامة في فندق 4 نجوم في قلب إسطنبول القديمة مع إمكانية إضافة جولات البوسفور والمعالم التاريخية.",
    image:REAL.istanbul[0], images:REAL.istanbul,
    hotel:{name:"Sultania Hotel",stars:4,location:"Sirkeci / Sultanahmet, Istanbul",type:"فندق 4 نجوم",rooms:["غرفة Deluxe","غرفة عائلية","غرفة بسرير King"],amenities:["واي فاي مجاني","إفطار","مسبح داخلي","حمام تركي","سبا ومركز عافية"]},
    included:["5 ليالٍ في فندق 4 نجوم","اختيار نوع الغرفة حسب التوفر","إمكانية تنسيق جولة البوسفور","إمكانية إضافة الطيران والانتقالات"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","الجولات غير المختارة"],
    notes:sourceNote, active:true, order:3
  },
  {
    id:"umrah", name:"باقة العمرة", country:"المملكة العربية السعودية", destination:"مكة المكرمة",
    duration:"حسب البرنامج", price:"يحدد حسب التاريخ والخدمات", category:"عمرة",
    description:"برنامج عمرة قابل للتخصيص مع إقامة في فندق حقيقي وخيارات غرف للعائلات والمجموعات.",
    image:REAL.umrah[0], images:REAL.umrah,
    hotel:{name:"voco Makkah",stars:4,location:"إبراهيم الخليل، مكة المكرمة",type:"فندق 4 نجوم",rooms:["Deluxe Room","Grand Room","One Bedroom Suite","غرفة رباعية"],amenities:["واي فاي مجاني","خدمة نقل إلى المسجد الحرام","مطاعم","مرافق صلاة","مركز تسوق"]},
    included:["الإقامة حسب البرنامج","المساعدة في ترتيبات الحجز","خدمة النقل حسب الباقة","إمكانية إضافة الطيران"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","أي خدمة غير مذكورة"],
    notes:sourceNote, active:true, order:4
  },
  {
    id:"egypt", name:"اكتشف شرم الشيخ", country:"مصر", destination:"شرم الشيخ - خليج نعمة",
    duration:"حسب البرنامج", price:"يحدد حسب التاريخ", category:"رحلات سياحية",
    description:"برنامج سياحي في شرم الشيخ مع إقامة في منتجع 4 نجوم وشاطئ خاص على البحر الأحمر.",
    image:REAL.egypt[0], images:REAL.egypt,
    hotel:{name:"JAZ Fayrouz",stars:4,location:"Naama Bay, Sharm El Sheikh",type:"منتجع 4 نجوم",rooms:["Standard Queen / Twin","Standard Seaside View","Superior Pool View","Junior Suite"],amenities:["شاطئ رملي خاص","4 مسابح خارجية","غوص وSnorkeling","مطاعم وبارات","نادي أطفال"]},
    included:["الإقامة حسب البرنامج","إمكانية اختيار نوع الغرفة","إمكانية إضافة النقل والجولات","إمكانية إضافة الطيران"],
    excluded:["الطيران ما لم يذكر","المصاريف الشخصية","الأنشطة غير المختارة"],
    notes:sourceNote, active:true, order:5
  },
  {
    id:"egypt-security", name:"الموافقة الأمنية لدخول مصر", country:"مصر", destination:"مصر",
    duration:"حسب الخدمة", price:"يحدد حسب الطلب", category:"خدمات سفر",
    description:"متابعة طلب الخدمة وفق البيانات والمتطلبات المعتمدة.",
    image:"assets/images/offers/egypt-security-offer.png", images:["assets/images/offers/egypt-security-offer.png"],
    included:["مراجعة البيانات الأولية","توضيح المستندات المطلوبة","متابعة الطلب بعد التأكيد"],
    excluded:["الرسوم الحكومية أو الخارجية إن وجدت"], notes:"القبول ومدة الإنجاز يخضعان للجهة المختصة.", active:true, order:6
  },
  {
    id:"florin", name:"أفضل عروض السفر", country:"FLORIN", destination:"وجهات متعددة",
    duration:"حسب العرض", price:"يحدد حسب العرض", category:"عروض FLORIN",
    description:"مساحة مرنة لإضافة عروض جديدة من لوحة الإدارة.",
    image:"assets/images/offers/florin-offer.png", images:["assets/images/offers/florin-offer.png"],
    included:["اختيارات سفر وفنادق حسب العرض","إمكانية تخصيص الطلب","متابعة من فريق فلورين"],
    excluded:["الخدمات غير المذكورة في العرض النهائي"], notes:"العرض النهائي والسعر والتوفر يتم تأكيدها قبل الحجز.", active:true, order:7
  }
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
      <img src="${safe(o.image)}" alt="${safe(o.name)}" loading="lazy">
      <div class="offer-content">
        <span class="offer-country">${safe(o.country)}</span>
        <h3>${safe(o.name)}</h3>
        <p>${safe(o.duration)}</p>
        <a href="offer-details.html?id=${encodeURIComponent(o.id)}" class="offer-btn">عرض التفاصيل</a>
      </div>
    </article>`).join("");
}
renderHomeOffers();
