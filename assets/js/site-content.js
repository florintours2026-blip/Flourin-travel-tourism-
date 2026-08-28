import { db } from "./firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import "./offers-data.js";


/* =====================================================
   DEFAULT SITE CONTENT
===================================================== */

export const DEFAULT_SITE_CONTENT = {

  settings: {

    location: "الجيزة - القاهرة - مصر",

    phone: "+201041936473",

    email: "info@florintours.com",

    facebook: "#",

    instagram: "#",

    tiktok: "#",

    youtube: "#",

    copyright:
      "© 2026 Florin Tours Agency. جميع الحقوق محفوظة."

  },


  /* =========================
     HERO
  ========================= */

  hero: {

    badge:
      "✈️ Florin Tours Agency",

    title:
      "اكتشف العالم مع",

    highlight:
      "فلورين",

    description:
      "رحلات طيران، فنادق، برامج سياحية، موافقات أمنية وتأشيرات، كل ما تحتاجه لرحلتك في مكان واحد.",

    primaryText:
      "استكشف العروض",

    primaryLink:
      "offers.html",

    secondaryText:
      "تواصل معنا",

    secondaryLink:
      "contact.html",

    visible: true,

    slides: [

      "assets/images/hero/hero-1.png",

      "assets/images/hero/hero-2.png",

      "assets/images/hero/hero-3.png",

      "assets/images/hero/hero-4.png",

      "assets/images/hero/hero-5.png",

      "assets/images/hero/hero-6.png",

      "assets/images/hero/hero-7.png"

    ]

  },


  /* =========================
     OFFERS HEADER
  ========================= */

  offersHeader: {

    badge:
      "أفضل العروض",

    title:
      "عروض فلورين المميزة",

    description:
      "اختر وجهتك واستمتع بأفضل الأسعار والعروض الحصرية.",

    visible: true

  },


  /* =========================
     SERVICES
  ========================= */

  services: {

    badge:
      "خدمات فلورين",

    title:
      "جميع خدمات السفر في مكان واحد",

    description:
      "نوفر لك حلول سفر متكاملة بداية من حجز الطيران وحتى استخراج التأشيرات والموافقات الأمنية.",

    visible: true,

    items: [

      {
        icon:
          "fa-solid fa-plane-departure",

        title:
          "حجز الطيران",

        description:
          "أفضل الأسعار على الرحلات المحلية والدولية.",

        link:
          "flights.html"
      },

      {
        icon:
          "fa-solid fa-hotel",

        title:
          "الفنادق",

        description:
          "أكثر من 500 ألف فندق ومنتجع حول العالم.",

        link:
          "hotels.html"
      },

      {
        icon:
          "fa-solid fa-earth-americas",

        title:
          "البرامج السياحية",

        description:
          "برامج سياحية مصممة بعناية تناسب جميع الميزانيات.",

        link:
          "tours.html"
      },

      {
        icon:
          "fa-solid fa-passport",

        title:
          "التأشيرات",

        description:
          "إنهاء جميع إجراءات التأشيرات بسرعة وأمان.",

        link:
          "visas.html"
      },

      {
        icon:
          "fa-solid fa-shield",

        title:
          "الموافقة الأمنية",

        description:
          "خدمة تقديم ومتابعة الموافقات الأمنية لدخول مصر.",

        link:
          "security-clearance.html"
      },

      {
        icon:
          "fa-solid fa-car-side",

        title:
          "الاستقبال من المطار",

        description:
          "استقبال VIP وسيارات خاصة من وإلى المطار.",

        link:
          "booking.html?type=transfer"
      }

    ]

  },


  /* =========================
     DESTINATIONS
  ========================= */

  destinations: {

    badge:
      "أشهر الوجهات",

    title:
      "اكتشف أجمل الوجهات حول العالم",

    description:
      "اختر وجهتك القادمة واستمتع بأفضل العروض السياحية.",

    visible: true,

    items: [

      {
        image:
          "assets/images/offers/maldives-offer.png",

        title:
          "المالديف",

        description:
          "جنة استوائية فوق المياه الكريستالية.",

        link:
          "offers.html"
      },

      {
        image:
          "assets/images/offers/egypt-offer.png",

        title:
          "شرم الشيخ",

        description:
          "أفضل الشواطئ والغوص في البحر الأحمر.",

        link:
          "offers.html"
      },

      {
        image:
          "assets/images/offers/egypt-offer.png",

        title:
          "دهب",

        description:
          "مدينة الهدوء والمغامرات البحرية.",

        link:
          "offers.html"
      },

      {
        image:
          "assets/images/offers/istanbul-offer.png",

        title:
          "كوالالمبور",

        description:
          "مدينة الحداثة والطبيعة والثقافة.",

        link:
          "offers.html"
      }

    ]

  },


  /* =========================
     WHY FLORIN
  ========================= */

  why: {

    badge:
      "لماذا فلورين؟",

    title:
      "شريكك الموثوق في جميع رحلاتك",

    description:
      "نقدم تجربة سفر متكاملة تجمع بين الجودة، الأسعار التنافسية، والدعم المستمر.",

    visible: true,

    items: [

      {
        icon:
          "fa-solid fa-earth-americas",

        value:
          "+120",

        label:
          "وجهة سياحية"
      },

      {
        icon:
          "fa-solid fa-plane",

        value:
          "+15000",

        label:
          "حجز طيران"
      },

      {
        icon:
          "fa-solid fa-hotel",

        value:
          "+8000",

        label:
          "فندق ومنتجع"
      },

      {
        icon:
          "fa-solid fa-face-smile",

        value:
          "+30000",

        label:
          "عميل سعيد"
      }

    ]

  },


  /* =========================
     PREMIUM OFFERS
  ========================= */

  premium: {

    badge:
      "عروض خاصة",

    title:
      "عروض هذا الشهر",

    description:
      "احجز الآن واستمتع بخصومات حصرية على أفضل الوجهات.",

    visible: true,

    items: [

      {
        image:
          "assets/images/offers/maldives-offer.png",

        discount:
          "خصم 25%",

        title:
          "المالديف",

        duration:
          "5 أيام / 4 ليالٍ",

        price:
          "56,990 ج.م",

        link:
          "offers.html"
      },

      {
        image:
          "assets/images/offers/dubai-offer.png",

        discount:
          "خصم 20%",

        title:
          "دبي",

        duration:
          "4 أيام / 3 ليالٍ",

        price:
          "36,000 ج.م",

        link:
          "offers.html"
      },

      {
        image:
          "assets/images/offers/istanbul-offer.png",

        discount:
          "خصم 18%",

        title:
          "كوالالمبور",

        duration:
          "6 أيام / 5 ليالٍ",

        price:
          "44,990 ج.م",

        link:
          "offers.html"
      }

    ]

  },


  /* =========================
     FLIGHTS
  ========================= */

  flights: {

    badge:
      "رحلات الطيران",

    title:
      "أحدث عروض الطيران",

    description:
      "اختر من بين أفضل شركات الطيران العالمية بأسعار تنافسية.",

    visible: true,

    items: [

      {
        logo: "",

        company:
          "Emirates",

        fromCode:
          "CAI",

        fromName:
          "القاهرة",

        toCode:
          "DXB",

        toName:
          "دبي",

        duration:
          "4 ساعات",

        stops:
          "مباشر",

        cabin:
          "اقتصادية",

        price:
          "8,990 ج.م",

        link:
          "booking.html?type=flight"
      },

      {
        logo: "",

        company:
          "Qatar Airways",

        fromCode:
          "CAI",

        fromName:
          "القاهرة",

        toCode:
          "KUL",

        toName:
          "كوالالمبور",

        duration:
          "10 ساعات",

        stops:
          "ترانزيت",

        cabin:
          "اقتصادية",

        price:
          "18,990 ج.م",

        link:
          "booking.html?type=flight"
      }

    ]

  },


  /* =========================
     HOTELS
  ========================= */

  hotels: {

    badge:
      "الفنادق",

    title:
      "أفضل الفنادق والمنتجعات",

    description:
      "فنادق ومنتجعات مختارة بعناية لتمنحك إقامة استثنائية.",

    visible: true,

    items: [

      {
        image:
          "assets/images/offers/maldives-offer.png",

        name:
          "Maldives Water Resort",

        stars:
          "★★★★★",

        price:
          "ابتداءً من 6,900 ج.م / الليلة",

        link:
          "booking.html?type=hotel"
      },

      {
        image:
          "assets/images/offers/dubai-offer.png",

        name:
          "Dubai Luxury Hotel",

        stars:
          "★★★★★",

        price:
          "ابتداءً من 5,500 ج.م / الليلة",

        link:
          "booking.html?type=hotel"
      },

      {
        image:
          "assets/images/offers/egypt-offer.png",

        name:
          "Sharm Elite Resort",

        stars:
          "★★★★★",

        price:
          "ابتداءً من 3,800 ج.م / الليلة",

        link:
          "booking.html?type=hotel"
      }

    ]

  },


  /* =========================
     TOURS
  ========================= */

  tours: {

    badge:
      "البرامج السياحية",

    title:
      "برامج سياحية مميزة",

    description:
      "استمتع بأفضل البرامج السياحية المصممة بعناية لتناسب جميع الأذواق.",

    visible: true,

    items: [

      {
        image:
          "assets/images/offers/maldives-offer.png",

        title:
          "برنامج المالديف",

        duration:
          "7 أيام / 6 ليالٍ",

        includes:
          "يشمل الفندق + الطيران + التنقلات",

        price:
          "ابتداءً من 56,990 ج.م",

        link:
          "tours.html"
      },

      {
        image:
          "assets/images/offers/istanbul-offer.png",

        title:
          "برنامج ماليزيا",

        duration:
          "8 أيام / 7 ليالٍ",

        includes:
          "يشمل الفندق + الطيران + الجولات",

        price:
          "ابتداءً من 44,990 ج.م",

        link:
          "tours.html"
      },

      {
        image:
          "assets/images/offers/egypt-offer.png",

        title:
          "برنامج شرم الشيخ",

        duration:
          "5 أيام / 4 ليالٍ",

        includes:
          "يشمل الفندق + الإفطار",

        price:
          "ابتداءً من 12,990 ج.م",

        link:
          "tours.html"
      }

    ]

  },

    /* =========================
     SECURITY CLEARANCE
  ========================= */

  security: {

    badge:
      "خدمات خاصة",

    title:
      "الموافقة الأمنية لدخول جمهورية مصر العربية",

    description:
      "نقدم خدمة استخراج الموافقات الأمنية للجنسيات التي تتطلب موافقة مسبقة مع متابعة الطلب حتى صدور النتيجة.",

    visible: true,

    features: [

      "✓ متابعة كاملة للطلب",

      "✓ سرعة في التنفيذ",

      "✓ فريق متخصص",

      "✓ دعم عبر واتساب"

    ],

    buttonText:
      "قدم طلبك الآن",

    buttonLink:
      "booking.html?type=security"

  },


  /* =========================
     VISAS
  ========================= */

  visas: {

    badge:
      "التأشيرات",

    title:
      "خدمات استخراج التأشيرات",

    description:
      "نقدم خدمات استخراج التأشيرات السياحية وتأشيرات الأعمال مع متابعة جميع الإجراءات.",

    visible: true,

    items: [

      {
        icon:
          "fa-solid fa-passport",

        title:
          "تأشيرات سياحية",

        description:
          "مساعدة في تجهيز وتقديم ملفات التأشيرات السياحية.",

        link:
          "visas.html?type=tourist"
      },

      {
        icon:
          "fa-solid fa-briefcase",

        title:
          "تأشيرات أعمال",

        description:
          "حلول تأشيرات الأعمال والزيارات التجارية.",

        link:
          "visas.html?type=business"
      },

      {
        icon:
          "fa-solid fa-plane-circle-check",

        title:
          "متابعة الطلب",

        description:
          "متابعة حالة طلب التأشيرة حتى ظهور النتيجة.",

        link:
          "booking.html?type=visa"
      }

    ]

  },


  /* =========================
     TESTIMONIALS
  ========================= */

  testimonials: {

    badge:
      "آراء العملاء",

    title:
      "ماذا يقول عملاؤنا؟",

    description:
      "نحرص بثقة عملائنا ونسعى دائماً لتقديم تجربة سفر استثنائية.",

    visible: true,

    items: [

      {
        rating:
          "★★★★★",

        text:
          "تجربة رائعة من أول حجز الطيران حتى الفندق، وكانت الخدمة ممتازة.",

        name:
          "عميل فلورين",

        location:
          "مصر"

      },

      {
        rating:
          "★★★★★",

        text:
          "سرعة في إنهاء الإجراءات والموافقة الأمنية وخدمة عملاء ممتازة.",

        name:
          "عميل فلورين",

        location:
          "القاهرة"

      },

      {
        rating:
          "★★★★★",

        text:
          "فريق محترم ومتعاون والأسعار كانت مناسبة جداً مقارنة بالخدمات.",

        name:
          "عميل فلورين",

        location:
          "الجيزة"

      }

    ]

  },


  /* =========================
     CTA
  ========================= */

  cta: {

    badge:
      "جاهز للسفر؟",

    title:
      "رحلتك القادمة تبدأ مع فلورين",

    description:
      "تواصل معنا الآن ودع فريقنا يساعدك في اختيار أفضل رحلة وبرنامج يناسبك.",

    buttonText:
      "ابدأ رحلتك الآن",

    buttonLink:
      "booking.html",

    visible: true

  },


  /* =========================
     CONTACT
  ========================= */

  contact: {

    badge:
      "تواصل معنا",

    title:
      "نحن هنا لخدمتك",

    description:
      "للاستفسارات والحجوزات وخدمات السفر، تواصل مع فريق فلورين.",

    visible: true,

    whatsapp:
      "+201041936473",

    phone:
      "+201041936473",

    email:
      "info@florintours.com",

    address:
      "الجيزة - القاهرة - مصر"

  },


  /* =========================
     FOOTER
  ========================= */

  footer: {

    description:
      "FLORIN Travel & Tourism Agency",

    links: [

      {
        title:
          "الرئيسية",

        link:
          "index.html"
      },

      {
        title:
          "الرحلات",

        link:
          "flights.html"
      },

      {
        title:
          "الفنادق",

        link:
          "hotels.html"
      },

      {
        title:
          "البرامج السياحية",

        link:
          "tours.html"
      },

      {
        title:
          "التأشيرات",

        link:
          "visas.html"
      },

      {
        title:
          "الموافقة الأمنية",

        link:
          "security-clearance.html"
      }

    ],

    visible:
      true

  }

};


/* =====================================================
   FIREBASE SITE CONTENT
===================================================== */

let cachedSiteContent = null;


/* =====================================================
   DEEP MERGE
===================================================== */

function deepMerge(defaults, custom) {

  if (!custom) {

    return defaults;

  }

  const result = Array.isArray(defaults)
    ? [...defaults]
    : { ...defaults };


  Object.keys(custom).forEach(key => {

    const value = custom[key];


    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      defaults[key] &&
      typeof defaults[key] === "object" &&
      !Array.isArray(defaults[key])
    ) {

      result[key] =
        deepMerge(defaults[key], value);

    } else {

      result[key] = value;

    }

  });


  return result;

}


/* =====================================================
   LOAD SITE CONTENT
===================================================== */

export async function loadSiteContent() {

  if (cachedSiteContent) {

    return cachedSiteContent;

  }


  try {

    const ref =
      doc(db, "siteContent", "main");

    const snapshot =
      await getDoc(ref);


    if (snapshot.exists()) {

      cachedSiteContent =
        deepMerge(
          DEFAULT_SITE_CONTENT,
          snapshot.data()
        );

    } else {

      cachedSiteContent =
        DEFAULT_SITE_CONTENT;

    }


  } catch (error) {

    console.error(
      "FLORIN: Error loading site content:",
      error
    );


    cachedSiteContent =
      DEFAULT_SITE_CONTENT;

  }


  return cachedSiteContent;

}


/* =====================================================
   GET SECTION
===================================================== */

export async function getSiteSection(section) {

  const content =
    await loadSiteContent();

  return content[section] || null;

}


/* =====================================================
   GET SETTING
===================================================== */

export async function getSiteSetting(key) {

  const content =
    await loadSiteContent();

  return content.settings?.[key] || "";

}


/* =====================================================
   CHECK SECTION VISIBILITY
===================================================== */

export async function isSectionVisible(section) {

  const content =
    await loadSiteContent();

  if (!content[section]) {

    return false;

  }

  if (
    typeof content[section].visible ===
    "undefined"
  ) {

    return true;

  }

  return content[section].visible === true;

}


/* =====================================================
   REFRESH CONTENT
===================================================== */

export function clearSiteContentCache() {

  cachedSiteContent = null;

}


/* =====================================================
   GLOBAL FLORIN CONTENT
===================================================== */

if (typeof window !== "undefined") {

  window.FLORIN_SITE_CONTENT = {

    async load() {

      return await loadSiteContent();

    },


    async get(section) {

      return await getSiteSection(section);

    },


    async setting(key) {

      return await getSiteSetting(key);

    },


    async visible(section) {

      return await isSectionVisible(section);

    },


    refresh() {

      clearSiteContentCache();

    }

  };

}


/* =====================================================
   EXPORT DEFAULT
===================================================== */

export default {

  loadSiteContent,

  getSiteSection,

  getSiteSetting,

  isSectionVisible,

  clearSiteContentCache

};
