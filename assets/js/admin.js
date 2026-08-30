import { auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   FLORIN ADMIN
   FULL WEBSITE CONTROL
===================================================== */

let currentUser = null;
let offers = [];
let currentOffer = null;
let siteContent = {};


/* =====================================================
   HELPERS
===================================================== */

const $ = id =>
  document.getElementById(id);


function show(id, state = true) {

  const el = $(id);

  if (el) {
    el.classList.toggle(
      "hidden",
      !state
    );
  }

}


function esc(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function arr(value) {

  if (Array.isArray(value)) {

    return value.filter(Boolean);

  }

  if (typeof value === "string") {

    return value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

  }

  return [];

}


function date(value) {

  if (!value) return "—";

  try {

    if (value.toDate) {

      return value
        .toDate()
        .toLocaleString("ar-EG");

    }

    return new Date(value)
      .toLocaleString("ar-EG");

  } catch {

    return "—";

  }

}


/* =====================================================
   ADMIN CHECK
===================================================== */

async function checkAdmin(user) {

  if (!user) {

    console.error("FLORIN ADMIN: No authenticated user.");

    return false;

  }

  console.log(
    "FLORIN ADMIN: Logged in user:",
    user.email
  );

  console.log(
    "FLORIN ADMIN: User UID:",
    user.uid
  );

  try {

    const ref = doc(
      db,
      "admins",
      user.uid
    );

    console.log(
      "FLORIN ADMIN: Checking:",
      `admins/${user.uid}`
    );

    const snap = await getDoc(ref);

    console.log(
      "FLORIN ADMIN: Document exists:",
      snap.exists()
    );

    if (!snap.exists()) {

      console.error(
        "FLORIN ADMIN: Admin document does not exist."
      );

      return false;

    }

    const data = snap.data();

    console.log(
      "FLORIN ADMIN: Admin data:",
      data
    );

    console.log(
      "FLORIN ADMIN: Active:",
      data.active
    );

    return data.active === true;

  } catch (error) {

    console.error(
      "FLORIN ADMIN CHECK ERROR:",
      error
    );

    alert(
      "حدث خطأ أثناء التحقق من صلاحيات المدير:\n\n" +
      error.message
    );

    return false;

  }

}


/* =====================================================
   LOAD DASHBOARD
===================================================== */

async function loadDashboard() {

  await Promise.all([

    loadOffers(),

    loadUsers(),

    loadBookings(),

    loadActivity(),

    loadSiteContent()

  ]);

}


/* =====================================================
   USERS
===================================================== */

async function loadUsers() {

  const table =
    $("usersTable");

  if (!table) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "users"
        )
      );

    if ($("usersCount")) {

      $("usersCount")
        .textContent =
        snap.size;

    }

    table.innerHTML =
      snap.empty

        ? `<tr>
             <td colspan="4">
               لا توجد بيانات.
             </td>
           </tr>`

        : snap.docs
            .map(d => {

              const x =
                d.data();

              return `
                <tr>

                  <td>
                    ${esc(
                      x.name ||
                      x.displayName ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.email ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.uid ||
                      d.id
                    )}
                  </td>

                  <td>
                    ${date(
                      x.createdAt
                    )}
                  </td>

                </tr>
              `;

            })
            .join("");

  } catch (e) {

    console.error(
      "Users:",
      e
    );

    table.innerHTML =
      `<tr>
        <td colspan="4">
          تعذر تحميل العملاء.
        </td>
      </tr>`;

  }

}


/* =====================================================
   BOOKINGS
===================================================== */

async function loadBookings() {

  const table =
    $("bookingsTable");

  if (!table) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "bookings"
        )
      );

    if ($("bookingsCount")) {

      $("bookingsCount")
        .textContent =
        snap.size;

    }

    table.innerHTML =
      snap.empty

        ? `<tr>
             <td colspan="7">
               لا توجد حجوزات.
             </td>
           </tr>`

        : snap.docs
            .map(d => {

              const x =
                d.data();

              const status =
                x.status ||
                "تم الاستلام";

              return `
                <tr>

                  <td>
                    ${esc(
                      x.fullName ||
                      x.name ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.phone ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.offerName ||
                      x.offer ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.travelDate ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.travelers ||
                      x.guests ||
                      "—"
                    )}
                  </td>

                  <td>

                    <select
                      class="booking-status"
                      data-status-id="${esc(d.id)}"
                    >

                      <option
                        value="تم الاستلام"
                        ${status ===
                          "تم الاستلام"
                          ? "selected"
                          : ""}
                      >
                        تم الاستلام
                      </option>

                      <option
                        value="تم إدخال البيانات"
                        ${status ===
                          "تم إدخال البيانات"
                          ? "selected"
                          : ""}
                      >
                        تم إدخال البيانات
                      </option>

                      <option
                        value="تمت معالجة وقبول الطلب"
                        ${status ===
                          "تمت معالجة وقبول الطلب"
                          ? "selected"
                          : ""}
                      >
                        تمت معالجة وقبول الطلب
                      </option>

                    </select>

                  </td>

                  <td>

                    <button
                      class="small primary update-booking-status"
                      data-booking-id="${esc(d.id)}"
                      type="button"
                    >
                      تحديث
                    </button>

                  </td>

                </tr>
              `;

            })
            .join("");


    document
      .querySelectorAll(
        ".update-booking-status"
      )
      .forEach(button => {

        button.onclick = () =>
          updateBookingStatus(
            button.dataset.bookingId,
            button
          );

      });

  } catch (e) {

    console.error(
      "Bookings:",
      e
    );

    table.innerHTML =
      `<tr>
        <td colspan="7">
          تعذر تحميل الحجوزات.
        </td>
      </tr>`;

  }

}


/* =====================================================
   UPDATE BOOKING STATUS
===================================================== */

async function updateBookingStatus(
  id,
  button
) {

  const select =
    document.querySelector(
      `[data-status-id="${CSS.escape(id)}"]`
    );

  if (!select) return;

  if (!currentUser) {

    alert(
      "لم يتم التحقق من المدير."
    );

    return;

  }

  const status =
    select.value;

  if (button) {

    button.disabled = true;

    button.textContent =
      "جاري التحديث...";

  }

  try {

    await updateDoc(
      doc(
        db,
        "bookings",
        id
      ),
      {

        status,

        statusUpdatedAt:
          serverTimestamp(),

        statusUpdatedBy:
          currentUser.uid,

        statusHistory:
          arrayUnion({

            status,

            updatedBy:
              currentUser.uid,

            updatedAt:
              new Date()
                .toISOString()

          })

      }
    );

    alert(
      `تم تحديث حالة الطلب إلى: ${status}`
    );

    await loadBookings();

  } catch (e) {

    console.error(
      "Booking status:",
      e
    );

    alert(
      "تعذر تحديث حالة الطلب:\n" +
      e.message
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "تحديث";

    }

  }

}


/* =====================================================
   ACTIVITY
===================================================== */

async function loadActivity() {

  const table =
    $("activityTable");

  if (!table) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "activityLogs"
        )
      );

    if ($("activityCount")) {

      $("activityCount")
        .textContent =
        snap.size;

    }

    table.innerHTML =
      snap.empty

        ? `<tr>
             <td colspan="4">
               لا يوجد نشاط.
             </td>
           </tr>`

        : snap.docs
            .map(d => {

              const x =
                d.data();

              return `
                <tr>

                  <td>
                    ${esc(
                      x.type ||
                      x.action ||
                      x.event ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.email ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${esc(
                      x.uid ||
                      "—"
                    )}
                  </td>

                  <td>
                    ${date(
                      x.createdAt
                    )}
                  </td>

                </tr>
              `;

            })
            .join("");

  } catch (e) {

    console.error(
      "Activity:",
      e
    );

    table.innerHTML =
      `<tr>
        <td colspan="4">
          تعذر تحميل السجل.
        </td>
      </tr>`;

  }

}


/* =====================================================
   OFFERS
===================================================== */

async function loadOffers() {

  const table =
    $("offersTable");

  if (!table) return;

  try {

    const snap =
      await getDocs(
        collection(
          db,
          "offers"
        )
      );

    offers =
      snap.docs.map(d => ({

        id: d.id,

        ...d.data()

      }));


    offers.sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );


    if ($("offersCount")) {

      $("offersCount")
        .textContent =
        offers.length;

    }

    renderOffers();

  } catch (e) {

    console.error(
      "Offers:",
      e
    );

    table.innerHTML =
      `<tr>
        <td colspan="6">
          تعذر تحميل العروض.
        </td>
      </tr>`;

  }

}


/* =====================================================
   RENDER OFFERS
===================================================== */

function renderOffers() {

  const table =
    $("offersTable");

  if (!table) return;

  if (!offers.length) {

    table.innerHTML =
      `<tr>
        <td colspan="6">
          لا توجد عروض.
        </td>
      </tr>`;

    return;

  }


  table.innerHTML =
    offers.map(o => {

      const images =
        Array.isArray(o.images)
          ? o.images
          : o.image
            ? [o.image]
            : [];


      return `
        <tr>

          <td>
            <strong>
              ${esc(
                o.name ||
                "بدون اسم"
              )}
            </strong>
          </td>

          <td>
            ${esc(
              o.country ||
              o.destination ||
              "—"
            )}
          </td>

          <td>
            ${esc(
              o.price ||
              "—"
            )}
          </td>

          <td>
            ${
              o.active !== false
                ? "ظاهر"
                : "مخفي"
            }
          </td>

          <td>
            ${images.length}
            صورة
          </td>

          <td>

            <button
              class="small edit"
              data-edit="${esc(o.id)}"
              type="button"
            >
              تعديل
            </button>

            <button
              class="small delete"
              data-delete="${esc(o.id)}"
              type="button"
            >
              حذف
            </button>

          </td>

        </tr>
      `;

    }).join("");


  document
    .querySelectorAll(
      "[data-edit]"
    )
    .forEach(btn => {

      btn.onclick = () => {

        const offer =
          offers.find(
            x =>
              x.id ===
              btn.dataset.edit
          );

        if (offer) {

          openOfferEditor(
            offer
          );

        }

      };

    });


  document
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(btn => {

      btn.onclick = () =>
        removeOffer(
          btn.dataset.delete
        );

    });

}


/* =====================================================
   DELETE OFFER
===================================================== */

async function removeOffer(id) {

  const offer =
    offers.find(
      x => x.id === id
    );

  if (!offer) return;


  if (
    !confirm(
      `حذف العرض "${offer.name || id}"؟`
    )
  ) return;


  try {

    await deleteDoc(
      doc(
        db,
        "offers",
        id
      )
    );

    alert(
      "تم حذف العرض."
    );

    await loadOffers();

  } catch (e) {

    console.error(e);

    alert(
      "تعذر حذف العرض:\n" +
      e.message
    );

  }

}


/* =====================================================
   OFFER EDITOR
===================================================== */

function openOfferEditor(
  offer = null
) {

  currentOffer =
    offer;

  let x =
    offer || {

      id: "",

      name: "",

      country: "",

      destination: "",

      category:
        "رحلات سياحية",

      duration: "",

      price: "",

      image: "",

      images: [],

      description: "",

      content: "",

      included: [],

      excluded: [],

      notes: "",

      order: 0,

      active: true

    };


  let editor =
    $("offerEditor");

  if (!editor) return;


  const images =
    arr(x.images);


  if (
    x.image &&
    !images.includes(
      x.image
    )
  ) {

    images.unshift(
      x.image
    );

  }


  editor.innerHTML = `

    <div class="offer-editor">

      <h2>
        ${
          offer
            ? "تعديل العرض"
            : "إضافة عرض جديد"
        }
      </h2>


      <div class="form-grid">

        <div class="field">

          <label>
            معرف العرض
          </label>

          <input
            id="e_id"
            value="${esc(x.id)}"
            ${offer ? "readonly" : ""}
          >

        </div>


        <div class="field">

          <label>
            اسم العرض
          </label>

          <input
            id="e_name"
            value="${esc(x.name)}"
          >

        </div>


        <div class="field">

          <label>
            الدولة
          </label>

          <input
            id="e_country"
            value="${esc(x.country)}"
          >

        </div>


        <div class="field">

          <label>
            الوجهة
          </label>

          <input
            id="e_destination"
            value="${esc(x.destination)}"
          >

        </div>


        <div class="field">

          <label>
            التصنيف
          </label>

          <input
            id="e_category"
            value="${esc(x.category)}"
          >

        </div>


        <div class="field">

          <label>
            مدة الرحلة
          </label>

          <input
            id="e_duration"
            value="${esc(x.duration)}"
          >

        </div>


        <div class="field">

          <label>
            السعر
          </label>

          <input
            id="e_price"
            value="${esc(x.price)}"
          >

        </div>


        <div class="field">

          <label>
            الترتيب
          </label>

          <input
            id="e_order"
            type="number"
            value="${Number(x.order || 0)}"
          >

        </div>

      </div>


      <h3>
        الصور
      </h3>


      <div class="field">

        <label>
          الصورة الرئيسية
        </label>

        <input
          id="e_image"
          value="${esc(x.image)}"
          dir="ltr"
        >

      </div>


      <div class="field">

        <label>
          جميع الصور
        </label>

        <textarea
          id="e_images"
          rows="5"
          dir="ltr"
        >${esc(
          images.join("\n")
        )}</textarea>

      </div>


      <div class="field">

        <label>
          الوصف المختصر
        </label>

        <textarea
          id="e_description"
          rows="4"
        >${esc(
          x.description
        )}</textarea>

      </div>


      <div class="field">

        <label>
          تفاصيل العرض
        </label>

        <textarea
          id="e_content"
          rows="8"
        >${esc(
          x.content
        )}</textarea>

      </div>


      <div class="field">

        <label>
          يشمل العرض
        </label>

        <textarea
          id="e_included"
          rows="5"
        >${esc(
          arr(x.included)
            .join("\n")
        )}</textarea>

      </div>


      <div class="field">

        <label>
          لا يشمل العرض
        </label>

        <textarea
          id="e_excluded"
          rows="5"
        >${esc(
          arr(x.excluded)
            .join("\n")
        )}</textarea>

      </div>


      <div class="field">

        <label>
          ملاحظات
        </label>

        <textarea
          id="e_notes"
          rows="4"
        >${esc(
          x.notes
        )}</textarea>

      </div>


      <label class="checkbox">

        <input
          type="checkbox"
          id="e_active"
          ${
            x.active !== false
              ? "checked"
              : ""
          }
        >

        إظهار العرض للعملاء

      </label>


      <div
        class="editor-actions"
      >

        <button
          id="saveOffer"
          class="primary"
          type="button"
        >
          حفظ العرض
        </button>

        <button
          id="cancelOffer"
          class="secondary"
          type="button"
        >
          إلغاء
        </button>

      </div>

    </div>

  `;


  show(
    "offerEditor",
    true
  );


  $("cancelOffer").onclick =
    closeOfferEditor;


  $("saveOffer").onclick =
    saveOffer;

}


/* =====================================================
   CLOSE OFFER EDITOR
===================================================== */

function closeOfferEditor() {

  currentOffer =
    null;

  const editor =
    $("offerEditor");

  if (!editor) return;

  editor.innerHTML =
    "";

  show(
     "offerEditor",
    true
  );


  $("cancelOffer").onclick =
    closeOfferEditor;


  $("saveOffer").onclick =
    saveOffer;

}


/* =====================================================
   CLOSE OFFER EDITOR
===================================================== */

function closeOfferEditor() {

  currentOffer =
    null;

  const editor =
    $("offerEditor");

  if (!editor) return;

  editor.innerHTML =
    "";

  show(
    "offerEditor",
    false
  );

}


/* =====================================================
   GET OFFER DATA
===================================================== */

function getOfferData() {

  const main =
    $("e_image")?.value
      .trim() || "";


  const lines =
    $("e_images")?.value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean) || [];


  const images = [];


  if (main) {

    images.push(main);

  }


  lines.forEach(x => {

    if (!images.includes(x)) {

      images.push(x);

    }

  });


  return {

    id:
      $("e_id")?.value
        .trim() || "",

    name:
      $("e_name")?.value
        .trim() || "",

    country:
      $("e_country")?.value
        .trim() || "",

    destination:
      $("e_destination")?.value
        .trim() || "",

    category:
      $("e_category")?.value
        .trim() ||
      "رحلات سياحية",

    duration:
      $("e_duration")?.value
        .trim() || "",

    price:
      $("e_price")?.value
        .trim() || "",

    image:
      images[0] || "",

    images,

    description:
      $("e_description")?.value
        .trim() || "",

    content:
      $("e_content")?.value
        .trim() || "",

    included:
      arr(
        $("e_included")?.value
      ),

    excluded:
      arr(
        $("e_excluded")?.value
      ),

    notes:
      $("e_notes")?.value
        .trim() || "",

    order:
      Number(
        $("e_order")?.value ||
        0
      ),

    active:
      $("e_active")?.checked !== false

  };


    /* =====================================================
   SAVE OFFER
===================================================== */

async function saveOffer() {

  if (!currentUser) {

    alert("لم يتم التحقق من صلاحيات المدير.");

    return;

  }


  const data =
    getOfferData();


  if (!data.name) {

    alert("اكتب اسم العرض أولاً.");

    return;

  }


  const button =
    $("saveOffer");


  if (button) {

    button.disabled = true;

    button.textContent =
      "جاري الحفظ...";

  }


  try {

    const id =
      data.id ||
      `offer_${Date.now()}`;


    const payload = {

      ...data,

      updatedAt:
        serverTimestamp(),

      updatedBy:
        currentUser.uid

    };


    if (currentOffer) {

      await updateDoc(
        doc(
          db,
          "offers",
          id
        ),
        payload
      );

    } else {

      payload.createdAt =
        serverTimestamp();

      payload.createdBy =
        currentUser.uid;


      await setDoc(
        doc(
          db,
          "offers",
          id
        ),
        payload
      );

    }


    alert(
      currentOffer
        ? "تم تعديل العرض بنجاح."
        : "تم إضافة العرض بنجاح."
    );


    closeOfferEditor();

    await loadOffers();


  } catch (e) {

    console.error(
      "Save offer:",
      e
    );

    alert(
      "تعذر حفظ العرض:\n" +
      e.message
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "حفظ العرض";

    }

  }

}


/* =====================================================
   SITE CONTENT
===================================================== */

async function loadSiteContent() {

  try {

    const ref =
      doc(
        db,
        "siteContent",
        "main"
      );


    const snap =
      await getDoc(ref);


    if (snap.exists()) {

      siteContent =
        snap.data();

    } else {

      siteContent =
        getDefaultSiteContent();

    }


    renderSiteEditor();


  } catch (e) {

    console.error(
      "Site content:",
      e
    );

    siteContent =
      getDefaultSiteContent();

    renderSiteEditor();

  }

}


/* =====================================================
   DEFAULT SITE CONTENT
===================================================== */

function getDefaultSiteContent() {

  return {

    settings: {

      location:
        "الجيزة - القاهرة - مصر",

      phone:
        "+201041936473",

      email:
        "info@florintours.com",

      facebook:
        "#",

      instagram:
        "#",

      tiktok:
        "#",

      youtube:
        "#"

    },


    hero: {

      badge:
        "✈️ Florin Tours Agency",

      title:
        "اكتشف العالم مع",

      highlight:
        "فلورين",

      description:
        "رحلات طيران، فنادق، برامج سياحية، تأشيرات وموافقات أمنية.",

      primaryText:
        "استكشف العروض",

      primaryLink:
        "offers.html",

      secondaryText:
        "تواصل معنا",

      secondaryLink:
        "contact.html",

      visible:
        true,

      slides: []

    },


    services: {

      badge:
        "خدمات فلورين",

      title:
        "جميع خدمات السفر في مكان واحد",

      description:
        "حلول سفر متكاملة للأفراد والعائلات والشركات.",

      visible:
        true,

      items: []

    },


    destinations: {

      badge:
        "أشهر الوجهات",

      title:
        "اكتشف أجمل الوجهات",

      description:
        "أفضل الوجهات السياحية حول العالم.",

      visible:
        true,

      items: []

    },


    why: {

      badge:
        "لماذا فلورين؟",

      title:
        "شريكك الموثوق في السفر",

      description:
        "خدمة احترافية وأسعار منافسة ودعم مستمر.",

      visible:
        true,

      items: []

    },


    premium: {

      badge:
        "عروض خاصة",

      title:
        "عروض هذا الشهر",

      description:
        "أفضل العروض والخصومات.",

      visible:
        true,

      items: []

    },


    flights: {

      badge:
        "رحلات الطيران",

      title:
        "أحدث عروض الطيران",

      description:
        "أفضل خيارات الطيران.",

      visible:
        true,

      items: []

    },


    hotels: {

      badge:
        "الفنادق",

      title:
        "أفضل الفنادق والمنتجعات",

      description:
        "إقامة مميزة حول العالم.",

      visible:
        true,

      items: []

    },


    tours: {

      badge:
        "البرامج السياحية",

      title:
        "برامج سياحية مميزة",

      description:
        "برامج تناسب جميع الأذواق.",

      visible:
        true,

      items: []

    },


    security: {

      badge:
        "خدمات خاصة",

      title:
        "الموافقة الأمنية",

      description:
        "خدمة متابعة الموافقات الأمنية.",

      visible:
        true,

      features: [],

      buttonText:
        "قدم طلبك الآن",

      buttonLink:
        "booking.html"

    },


    visas: {

      badge:
        "التأشيرات",

      title:
        "خدمات استخراج التأشيرات",

      description:
        "خدمات التأشيرات السياحية والتجارية.",

      visible:
        true,

      items: []

    },


    testimonials: {

      badge:
        "آراء العملاء",

      title:
        "ماذا يقول عملاؤنا؟",

      description:
        "آراء وتجارب عملائنا.",

      visible:
        true,

      items: []

    },


    cta: {

      badge:
        "جاهز للسفر؟",

      title:
        "رحلتك القادمة تبدأ مع فلورين",

      description:
        "تواصل معنا الآن.",

      buttonText:
        "ابدأ رحلتك الآن",

      buttonLink:
        "booking.html",

      visible:
        true

    },


    contact: {

      badge:
        "تواصل معنا",

      title:
        "نحن هنا لخدمتك",

      description:
        "تواصل مع فريق فلورين.",

      visible:
        true,

      whatsapp:
        "+201041936473",

      phone:
        "+201041936473",

      email:
        "info@florintours.com",

      address:
        "الجيزة - القاهرة - مصر"

    }

  };

}


/* =====================================================
   RENDER SITE EDITOR
===================================================== */

function renderSiteEditor() {

  const container =
    $("siteContentEditor");


  if (!container) {

    console.warn(
      "siteContentEditor not found."
    );

    return;

  }


  const s =
    siteContent.settings || {};

  const h =
    siteContent.hero || {};

  const services =
    siteContent.services || {};

  const destinations =
    siteContent.destinations || {};

  const why =
    siteContent.why || {};

  const premium =
    siteContent.premium || {};

  const flights =
    siteContent.flights || {};

  const hotels =
    siteContent.hotels || {};

  const tours =
    siteContent.tours || {};

  const security =
    siteContent.security || {};

  const visas =
    siteContent.visas || {};

  const testimonials =
    siteContent.testimonials || {};

  const cta =
    siteContent.cta || {};

  const contact =
    siteContent.contact || {};


  container.innerHTML = `

    <div class="site-editor">


      <!-- SETTINGS -->

      <section class="admin-section">

        <h2>
          ⚙️ الإعدادات العامة
        </h2>

        <div class="form-grid">

          ${input(
            "sc_location",
            "الموقع",
            s.location
          )}

          ${input(
            "sc_phone",
            "رقم الهاتف",
            s.phone
          )}

          ${input(
            "sc_email",
            "البريد الإلكتروني",
            s.email
          )}

          ${input(
            "sc_facebook",
            "Facebook",
            s.facebook
          )}

          ${input(
            "sc_instagram",
            "Instagram",
            s.instagram
          )}

          ${input(
            "sc_tiktok",
            "TikTok",
            s.tiktok
          )}

          ${input(
            "sc_youtube",
            "YouTube",
            s.youtube
          )}

        </div>

      </section>


      <!-- HERO -->

      <section class="admin-section">

        <h2>
          🖼️ الواجهة الرئيسية Hero
        </h2>

        ${checkbox(
          "sc_hero_visible",
          "إظهار الـ Hero",
          h.visible !== false
        )}

        <div class="form-grid">

          ${input(
            "sc_hero_badge",
            "الشارة",
            h.badge
          )}

          ${input(
            "sc_hero_title",
            "العنوان",
            h.title
          )}

          ${input(
            "sc_hero_highlight",
            "الكلمة المميزة",
            h.highlight
          )}

          ${input(
            "sc_hero_primary",
            "نص الزر الأول",
            h.primaryText
          )}

          ${input(
            "sc_hero_primary_link",
            "رابط الزر الأول",
            h.primaryLink
          )}

          ${input(
            "sc_hero_secondary",
            "نص الزر الثاني",
            h.secondaryText
          )}

          ${input(
            "sc_hero_secondary_link",
            "رابط الزر الثاني",
            h.secondaryLink
          )}

        </div>

        ${textarea(
          "sc_hero_description",
          "وصف Hero",
          h.description
        )}

        ${textarea(
          "sc_hero_slides",
          "صور السلايدر - رابط كل صورة في سطر",
          arr(h.slides).join("\n")
        )}

      </section>


      <!-- SERVICES -->

      ${sectionEditor(
        "services",
        "🧳 خدمات فلورين",
        services
      )}


      <!-- DESTINATIONS -->

      ${sectionEditor(
        "destinations",
        "🌍 الوجهات السياحية",
        destinations
      )}


      <!-- WHY -->

      ${sectionEditor(
        "why",
        "⭐ لماذا فلورين؟",
        why
      )}


      <!-- PREMIUM -->

      ${sectionEditor(
        "premium",
        "🔥 العروض الخاصة",
        premium
      )}


      <!-- FLIGHTS -->

      ${sectionEditor(
        "flights",
        "✈️ رحلات الطيران",
        flights
      )}


      <!-- HOTELS -->

      ${sectionEditor(
        "hotels",
        "🏨 الفنادق",
        hotels
      )}


      <!-- TOURS -->

      ${sectionEditor(
        "tours",
        "🗺️ البرامج السياحية",
        tours
      )}


      <!-- SECURITY -->

      <section class="admin-section">

        <h2>
          🛡️ الموافقة الأمنية
        </h2>

        ${checkbox(
          "sc_security_visible",
          "إظهار القسم",
          security.visible !== false
        )}

        <div class="form-grid">

          ${input(
            "sc_security_badge",
            "الشارة",
            security.badge
          )}

          ${input(
            "sc_security_title",
            "العنوان",
            security.title
          )}

          ${input(
            "sc_security_button",
            "نص الزر",
            security.buttonText
          )}

          ${input(
            "sc_security_link",
            "رابط الزر",
            security.buttonLink
          )}

        </div>

        ${textarea(
          "sc_security_description",
          "الوصف",
          security.description
        )}

        ${textarea(
          "sc_security_features",
          "المميزات - كل ميزة في سطر",
          arr(
            security.features
          ).join("\n")
        )}

      </section>


      <!-- VISAS -->

      ${sectionEditor(
        "visas",
        "🛂 التأشيرات",
        visas
      )}


      <!-- TESTIMONIALS -->

      ${sectionEditor(
        "testimonials",
        "💬 آراء العملاء",
        testimonials
      )}


      <!-- CTA -->

      <section class="admin-section">

        <h2>
          🎯 الدعوة لاتخاذ إجراء CTA
        </h2>

        ${checkbox(
          "sc_cta_visible",
          "إظهار القسم",
          cta.visible !== false
        )}

        <div class="form-grid">

          ${input(
            "sc_cta_badge",
            "الشارة",
            cta.badge
          )}

          ${input(
            "sc_cta_title",
            "العنوان",
            cta.title
          )}

          ${input(
            "sc_cta_button",
            "نص الزر",
            cta.buttonText
          )}

          ${input(
            "sc_cta_link",
            "رابط الزر",
            cta.buttonLink
          )}

        </div>

        ${textarea(
          "sc_cta_description",
          "الوصف",
          cta.description
        )}

      </section>


      <!-- CONTACT -->

      <section class="admin-section">

        <h2>
          📞 بيانات التواصل
        </h2>

        ${checkbox(
          "sc_contact_visible",
          "إظهار القسم",
          contact.visible !== false
        )}

        <div class="form-grid">

          ${input(
            "sc_contact_badge",
            "الشارة",
            contact.badge
          )}

          ${input(
            "sc_contact_title",
            "العنوان",
            contact.title
          )}

          ${input(
            "sc_contact_whatsapp",
            "واتساب",
            contact.whatsapp
          )}

          ${input(
            "sc_contact_phone",
            "الهاتف",
            contact.phone
          )}

          ${input(
            "sc_contact_email",
            "البريد",
            contact.email
          )}

          ${input(
            "sc_contact_address",
            "العنوان",
            contact.address
          )}

        </div>

        ${textarea(
          "sc_contact_description",
          "الوصف",
          contact.description
        )}

      </section>


      <div class="site-save-bar">

        <button
          id="saveSiteContent"
          class="primary"
          type="button"
        >
          💾 حفظ جميع تغييرات الموقع
        </button>

        <button
          id="reloadSiteContent"
          class="secondary"
          type="button"
        >
          🔄 إعادة تحميل
        </button>

      </div>


    </div>

  `;


  const save =
    $("saveSiteContent");


  if (save) {

    save.onclick =
      saveSiteContent;

  }


  const reload =
    $("reloadSiteContent");


  if (reload) {

    reload.onclick =
      loadSiteContent;

  }

}


/* =====================================================
   INPUT HELPERS
===================================================== */

function input(
  id,
  label,
  value = ""
) {

  return `

    <div class="field">

      <label for="${id}">
        ${esc(label)}
      </label>

      <input
        id="${id}"
        type="text"
        value="${esc(value)}"
      >

    </div>

  `;

}


function textarea(
  id,
  label,
  value = ""
) {

  return `

    <div class="field full">

      <label for="${id}">
        ${esc(label)}
      </label>

      <textarea
        id="${id}"
        rows="5"
      >${esc(value)}</textarea>

    </div>

  `;

}


function checkbox(
  id,
  label,
  checked
) {

  return `

    <label class="checkbox">

      <input
        id="${id}"
        type="checkbox"
        ${checked ? "checked" : ""}
      >

      ${esc(label)}

    </label>

  `;

}


/* =====================================================
   SECTION EDITOR
===================================================== */

function sectionEditor(
  key,
  title,
  data
) {

  data =
    data || {};


  return `

    <section class="admin-section">

      <h2>
        ${title}
      </h2>

      ${checkbox(
        `sc_${key}_visible`,
        "إظهار القسم",
        data.visible !== false
      )}

      <div class="form-grid">

        ${input(
          `sc_${key}_badge`,
          "الشارة",
          data.badge
        )}

        ${input(
          `sc_${key}_title`,
          "العنوان",
          data.title
        )}

      </div>

      ${textarea(
        `sc_${key}_description`,
        "الوصف",
        data.description
      )}

      <div class="field full">

        <label>
          البيانات الإضافية
        </label>

        <textarea
          id="sc_${key}_items"
          rows="8"
          dir="ltr"
        >${esc(
          JSON.stringify(
            data.items || [],
            null,
            2
          )
        )}</textarea>

        <small>
          يمكن تعديل البيانات بصيغة JSON.
        </small>

      </div>

    </section>

  `;

}


/* =====================================================
   READ FIELD
===================================================== */

function val(id) {

  const el =
    $(id);

  return el
    ? el.value.trim()
    : "";

}


function bool(id) {

  const el =
    $(id);

  return el
    ? el.checked
    : false;

}


/* =====================================================
   PARSE JSON
===================================================== */

function jsonValue(
  id,
  fallback = []
) {

  try {

    const text =
      val(id);


    if (!text) {

      return fallback;

    }


    const result =
      JSON.parse(text);


    return result;

  } catch (e) {

    throw new Error(
      `بيانات ${id} ليست JSON صحيحة.`
    );

  }

}


/* =====================================================
   COLLECT SITE CONTENT
===================================================== */

function collectSiteContent() {

  const data = {


    settings: {

      location:
        val("sc_location"),

      phone:
        val("sc_phone"),

      email:
        val("sc_email"),

      facebook:
        val("sc_facebook"),

      instagram:
        val("sc_instagram"),

      tiktok:
        val("sc_tiktok"),

      youtube:
        val("sc_youtube")

    },


    hero: {

      badge:
        val("sc_hero_badge"),

      title:
        val("sc_hero_title"),

      highlight:
        val("sc_hero_highlight"),

      description:
        val("sc_hero_description"),

      primaryText:
        val("sc_hero_primary"),

      primaryLink:
        val("sc_hero_primary_link"),

      secondaryText:
        val("sc_hero_secondary"),

      secondaryLink:
        val("sc_hero_secondary_link"),

      visible:
        bool("sc_hero_visible"),

      slides:
        arr(
          val("sc_hero_slides")
        )

    }

  };


  const sections = [

    "services",

    "destinations",

    "why",

    "premium",

    "flights",

    "hotels",

    "tours",

    "visas",

    "testimonials"

  ];


  sections.forEach(
    key => {

      const old =
        siteContent[key] || {};


      data[key] = {

        ...old,

        badge:
          val(
            `sc_${key}_badge`
          ),

        title:
          val(
            `sc_${key}_title`
          ),

        description:
          val(
            `sc_${key}_description`
          ),

        visible:
          bool(
            `sc_${key}_visible`
          ),

        items:
          jsonValue(
            `sc_${key}_items`,
            old.items || []
          )

      };

    }
  );


  data.security = {

    ...(siteContent.security || {}),

    badge:
      val(
        "sc_security_badge"
      ),

    title:
      val(
        "sc_security_title"
      ),

    description:
      val(
        "sc_security_description"
      ),

    visible:
      bool(
        "sc_security_visible"
      ),

    features:
      arr(
        val(
          "sc_security_features"
        )
      ),

    buttonText:
      val(
        "sc_security_button"
      ),

    buttonLink:
      val(
        "sc_security_link"
      )

  };


  data.cta = {

    ...(siteContent.cta || {}),

    badge:
      val("sc_cta_badge"),

    title:
      val("sc_cta_title"),

    description:
      val(
        "sc_cta_description"
      ),

    buttonText:
      val("sc_cta_button"),

    buttonLink:
      val("sc_cta_link"),

    visible:
      bool("sc_cta_visible")

  };


  data.contact = {

    ...(siteContent.contact || {}),

    badge:
      val(
        "sc_contact_badge"
      ),

    title:
      val(
        "sc_contact_title"
      ),

    description:
      val(
        "sc_contact_description"
      ),

    visible:
      bool(
        "sc_contact_visible"
      ),

        whatsapp:
      val(
        "sc_contact_whatsapp"
      ),

    phone:
      val(
        "sc_contact_phone"
      ),

    email:
      val(
        "sc_contact_email"
      ),

    address:
      val(
        "sc_contact_address"
      )

  };


  return data;

}


/* =====================================================
   SAVE SITE CONTENT
===================================================== */

async function saveSiteContent() {

  if (!currentUser) {

    alert(
      "لم يتم التحقق من صلاحيات المدير."
    );

    return;

  }


  const button =
    $("saveSiteContent");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "⏳ جاري حفظ الموقع...";

  }


  try {

    const data =
      collectSiteContent();


    data.updatedAt =
      serverTimestamp();


    data.updatedBy =
      currentUser.uid;


    await setDoc(

      doc(
        db,
        "siteContent",
        "main"
      ),

      data,

      {
        merge:
          true
      }

    );


    siteContent =
      data;


    alert(
      "✅ تم حفظ جميع تغييرات الموقع بنجاح."
    );


  } catch (e) {

    console.error(
      "Save site content:",
      e
    );


    alert(
      "❌ تعذر حفظ محتوى الموقع:\n" +
      e.message
    );


  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "💾 حفظ جميع تغييرات الموقع";

    }

  }

}


/* =====================================================
   START ADMIN
===================================================== */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      show(
        "accessDenied",
        true
      );

      show(
        "dashboard",
        false
      );

      return;

    }


    currentUser =
      user;


    const allowed =
      await checkAdmin(
        user
      );


    if (!allowed) {

      show(
        "accessDenied",
        true
      );

      show(
        "dashboard",
        false
      );

      return;

    }


    show(
      "accessDenied",
      false
    );

    show(
      "dashboard",
      true
    );


    const welcome =
      $("adminWelcome");


    if (welcome) {

      welcome.textContent =
        `مرحبًا ${user.email || ""}`;

    }


    await loadDashboard();


    initTabs();

    initButtons();

  }
);


/* =====================================================
   BUTTONS
===================================================== */

function initButtons() {


  const newOffer =
    $("newOffer");


  if (newOffer) {

    newOffer.onclick =
      () =>
        openOfferEditor();

  }


  const refresh =
    $("refreshBookings");


  if (refresh) {

    refresh.onclick =
      async () => {

        refresh.disabled =
          true;

        refresh.textContent =
          "جاري التحديث...";


        await loadDashboard();


        refresh.disabled =
          false;

        refresh.textContent =
          "تحديث";

      };

  }


  const logout =
    $("adminLogout");


  if (logout) {

    logout.onclick =
      async () => {

        if (
          !confirm(
            "هل تريد تسجيل الخروج؟"
          )
        ) return;


        try {

          await signOut(
            auth
          );


          location.href =
            "index.html";


        } catch (e) {

          alert(
            "تعذر تسجيل الخروج."
          );

        }

      };

  }


  const seed =
    $("seedOffers");


  if (seed) {

    seed.onclick =
      async () => {

        await loadOffers();

        alert(
          "تم تحديث قائمة العروض."
        );

      };

  }

}


/* =====================================================
   TABS
===================================================== */

function initTabs() {

  document
    .querySelectorAll(
      ".tab"
    )
    .forEach(button => {

      button.onclick =
        () => {

          document
            .querySelectorAll(
              ".tab"
            )
            .forEach(x =>
              x.classList.remove(
                "active"
              )
            );


          document
            .querySelectorAll(
              ".tab-panel"
            )
            .forEach(x =>
              x.classList.remove(
                "active"
              )
            );


          button.classList.add(
            "active"
          );


          const id =
            button.dataset.tab;


          const panel =
            $(id);


          if (panel) {

            panel.classList.add(
              "active"
            );

          }

        };

    });

}


/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

window.addEventListener(
  "error",
  event => {

    console.error(
      "FLORIN Admin error:",
      event.error
    );

  }
);


/* =====================================================
   CONNECTION TEST
===================================================== */

async function testConnection() {

  try {

    await getDocs(
      collection(
        db,
        "offers"
      )
    );


    console.log(
      "FLORIN Admin: Firestore connected."
    );


  } catch (e) {

    console.error(
      "Firestore connection failed:",
      e
    );

  }

}


console.log(
  "FLORIN Admin Panel loaded."
);
