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


let currentUser = null;
let offers = [];
let currentOffer = null;


const $ = id => document.getElementById(id);


function show(id, state = true) {
  const el = $(id);
  if (el) el.classList.toggle("hidden", !state);
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
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);
  }
  return [];
}


/* =========================
   ADMIN CHECK
========================= */

async function checkAdmin(user) {
  if (!user) return false;

  try {
    const ref = doc(db, "admins", user.uid);
    const snap = await getDoc(ref);

    return snap.exists() &&
           snap.data().active === true;

  } catch (error) {
    console.error("Admin check:", error);
    return false;
  }
}


/* =========================
   LOAD ALL DATA
========================= */

async function loadDashboard() {
  await Promise.all([
    loadOffers(),
    loadUsers(),
    loadBookings(),
    loadActivity()
  ]);
}


/* =========================
   USERS
========================= */

async function loadUsers() {
  const table = $("usersTable");
  if (!table) return;

  try {
    const snap = await getDocs(
      collection(db, "users")
    );

    if ($("usersCount"))
      $("usersCount").textContent = snap.size;

    table.innerHTML = snap.empty
      ? `<tr><td colspan="4">لا توجد بيانات.</td></tr>`
      : snap.docs.map(d => {
          const x = d.data();

          return `
            <tr>
              <td>${esc(x.name || x.displayName || "—")}</td>
              <td>${esc(x.email || "—")}</td>
              <td>${esc(x.uid || d.id)}</td>
              <td>${date(x.createdAt)}</td>
            </tr>
          `;
        }).join("");

  } catch (e) {
    console.error("Users:", e);
    table.innerHTML =
      `<tr><td colspan="4">تعذر تحميل العملاء.</td></tr>`;
  }
}


/* =========================
   BOOKINGS
========================= */

async function loadBookings() {
  const table = $("bookingsTable");
  if (!table) return;

  try {
    const snap = await getDocs(
      collection(db, "bookings")
    );

    if ($("bookingsCount"))
      $("bookingsCount").textContent = snap.size;

    table.innerHTML = snap.empty
      ? `<tr><td colspan="7">لا توجد حجوزات.</td></tr>`
      : snap.docs.map(d => {
          const x = d.data();
          const status = x.status || "تم الاستلام";

          return `
            <tr>
              <td>${esc(x.fullName || x.name || "—")}</td>
              <td>${esc(x.phone || "—")}</td>
              <td>${esc(x.offerName || x.offer || "—")}</td>
              <td>${esc(x.travelDate || "—")}</td>
              <td>${esc(x.travelers || x.guests || "—")}</td>

              <td>
                <select
                  class="booking-status"
                  data-status-id="${esc(d.id)}">

                  <option value="تم الاستلام"
                    ${status === "تم الاستلام" ? "selected" : ""}>
                    تم الاستلام
                  </option>

                  <option value="تم إدخال البيانات"
                    ${status === "تم إدخال البيانات" ? "selected" : ""}>
                    تم إدخال البيانات
                  </option>

                  <option value="تمت معالجة وقبول الطلب"
                    ${status === "تمت معالجة وقبول الطلب" ? "selected" : ""}>
                    تمت معالجة وقبول الطلب
                  </option>

                </select>
              </td>

              <td>
                <button
                  class="small primary update-booking-status"
                  data-booking-id="${esc(d.id)}"
                  type="button">
                  تحديث
                </button>
              </td>

            </tr>
          `;
        }).join("");

    document
      .querySelectorAll(".update-booking-status")
      .forEach(button => {
        button.onclick = () => {
          updateBookingStatus(
            button.dataset.bookingId,
            button
          );
        };
      });

  } catch (e) {

    console.error("Bookings:", e);

    table.innerHTML =
      `<tr><td colspan="7">تعذر تحميل الحجوزات.</td></tr>`;
  }
}
/* =========================
   UPDATE BOOKING STATUS
========================= */

async function updateBookingStatus(id, button) {

  const select = document.querySelector(
    `[data-status-id="${CSS.escape(id)}"]`
  );

  if (!select) return;

  const status = select.value;

  if (!currentUser) {
    alert("لم يتم التحقق من المدير.");
    return;
  }

  button.disabled = true;
  button.textContent = "جاري التحديث...";

  try {

    const ref = doc(db, "bookings", id);

    await updateDoc(ref, {
      status: status,
      statusUpdatedAt: serverTimestamp(),
      statusUpdatedBy: currentUser.uid,

      statusHistory: arrayUnion({
        status: status,
        updatedBy: currentUser.uid,
        updatedAt: new Date().toISOString()
      })
    });

    alert("تم تحديث حالة الطلب بنجاح");

    await loadBookings();

  } catch (e) {

    console.error("Booking status:", e);

    alert("تعذر تحديث حالة الطلب: " + e.message);

  } finally {

    button.disabled = false;
    button.textContent = "تحديث";

  }
}

/* =========================
   ACTIVITY
========================= */

async function loadActivity() {
  const table = $("activityTable");
  if (!table) return;

  try {
    const snap = await getDocs(
      collection(db, "activityLogs")
    );

    if ($("activityCount"))
      $("activityCount").textContent = snap.size;

    table.innerHTML = snap.empty
      ? `<tr><td colspan="4">لا يوجد نشاط.</td></tr>`
      : snap.docs.map(d => {
          const x = d.data();

          return `
            <tr>
              <td>${esc(x.type || x.action || x.event || "—")}</td>
              <td>${esc(x.email || "—")}</td>
              <td>${esc(x.uid || "—")}</td>
              <td>${date(x.createdAt)}</td>
            </tr>
          `;
        }).join("");

  } catch (e) {
    console.error("Activity:", e);
    table.innerHTML =
      `<tr><td colspan="4">تعذر تحميل السجل.</td></tr>`;
  }
}


/* =========================
   DATE
========================= */

function date(value) {
  if (!value) return "—";

  try {
    if (value.toDate)
      return value.toDate().toLocaleString("ar-EG");

    return new Date(value)
      .toLocaleString("ar-EG");

  } catch {
    return "—";
  }
}


/* =========================
   OFFERS
========================= */

async function loadOffers() {
  const table = $("offersTable");
  if (!table) return;

  try {
    const snap = await getDocs(
      collection(db, "offers")
    );

    offers = snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    offers.sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );

    if ($("offersCount"))
      $("offersCount").textContent = offers.length;

    renderOffers();

  } catch (e) {
    console.error("Offers:", e);

    table.innerHTML =
      `<tr><td colspan="6">تعذر تحميل العروض.</td></tr>`;
  }
}


/* =========================
   RENDER OFFERS
========================= */

function renderOffers() {
  const table = $("offersTable");
  if (!table) return;

  if (!offers.length) {
    table.innerHTML =
      `<tr><td colspan="6">لا توجد عروض.</td></tr>`;
    return;
  }

  table.innerHTML = offers.map(o => {

    const images =
      Array.isArray(o.images)
        ? o.images
        : o.image
          ? [o.image]
          : [];

    return `
      <tr>

        <td>
          <strong>${esc(o.name || "بدون اسم")}</strong>
        </td>

        <td>
          ${esc(o.country || o.destination || "—")}
        </td>

        <td>
          ${esc(o.price || "—")}
        </td>

        <td>
          ${o.active !== false ? "ظاهر" : "مخفي"}
        </td>

        <td>
          ${images.length} صورة
        </td>

        <td>

          <button
            class="small edit"
            data-edit="${esc(o.id)}">
            تعديل
          </button>

          <button
            class="small delete"
            data-delete="${esc(o.id)}">
            حذف
          </button>

        </td>

      </tr>
    `;

  }).join("");

  document.querySelectorAll("[data-edit]")
    .forEach(btn => {

      btn.onclick = () => {

        const offer =
          offers.find(
            x => x.id === btn.dataset.edit
          );

        if (offer)
          openEditor(offer);
      };

    });

  document.querySelectorAll("[data-delete]")
    .forEach(btn => {

      btn.onclick = () =>
        removeOffer(btn.dataset.delete);

    });
       }

/* =========================
   OFFER EDITOR
========================= */

function openEditor(o = null) {

  currentOffer = o;

  const e = $("offerEditor");
  if (!e) return;

  const x = o || {
    id: "",
    name: "",
    country: "",
    destination: "",
    category: "رحلات سياحية",
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

  const images = arr(x.images);
  if (x.image && !images.includes(x.image))
    images.unshift(x.image);

  e.innerHTML = `
    <div class="offer-editor">

      <h2>
        ${o ? "تعديل العرض" : "إضافة عرض جديد"}
      </h2>

      <div class="form-grid">

        <div class="field">
          <label>معرف العرض</label>
          <input id="e_id"
            value="${esc(x.id)}"
            ${o ? "readonly" : ""}
            placeholder="dubai">
        </div>

        <div class="field">
          <label>اسم العرض</label>
          <input id="e_name"
            value="${esc(x.name)}"
            placeholder="عرض دبي السياحي">
        </div>

        <div class="field">
          <label>الدولة</label>
          <input id="e_country"
            value="${esc(x.country)}"
            placeholder="الإمارات">
        </div>

        <div class="field">
          <label>الوجهة</label>
          <input id="e_destination"
            value="${esc(x.destination)}"
            placeholder="دبي">
        </div>

        <div class="field">
          <label>التصنيف</label>
          <input id="e_category"
            value="${esc(x.category)}"
            placeholder="رحلات سياحية">
        </div>

        <div class="field">
          <label>مدة الرحلة</label>
          <input id="e_duration"
            value="${esc(x.duration)}"
            placeholder="5 أيام / 4 ليالي">
        </div>

        <div class="field">
          <label>السعر</label>
          <input id="e_price"
            value="${esc(x.price)}"
            placeholder="$950">
        </div>

        <div class="field">
          <label>الترتيب</label>
          <input id="e_order"
            type="number"
            value="${Number(x.order || 0)}">
        </div>

      </div>


      <h3>الصور</h3>

      <div class="field">
        <label>الصورة الرئيسية</label>

        <input id="e_image"
          value="${esc(x.image)}"
          placeholder="assets/images/offers/main.png">
      </div>


      <div class="field">

        <label>
          جميع صور العرض
        </label>

        <textarea id="e_images"
          rows="6"
          dir="ltr"
          placeholder="ضع كل صورة في سطر مستقل">${esc(
            images.join("\n")
          )}</textarea>

        <small>
          يمكنك إضافة صورة واحدة أو عدة صور.
        </small>

      </div>


      <div id="imagePreview"></div>


      <h3>تفاصيل العرض</h3>

      <div class="field">

        <label>الوصف المختصر</label>

        <textarea id="e_description"
          rows="5"
          placeholder="وصف مختصر للعرض">${esc(
            x.description
          )}</textarea>

      </div>


      <div class="field">

        <label>
          محتويات العرض بالكامل
        </label>

        <textarea id="e_content"
          rows="10"
          placeholder="اكتب تفاصيل العرض بالكامل هنا...">${esc(
            x.content
          )}</textarea>

      </div>


      <div class="field">

        <label>
          يشمل العرض
        </label>

        <textarea id="e_included"
          rows="6"
          placeholder="خدمة في كل سطر">${esc(
            arr(x.included).join("\n")
          )}</textarea>

      </div>


      <div class="field">

        <label>
          لا يشمل العرض
        </label>

        <textarea id="e_excluded"
          rows="6"
          placeholder="خدمة في كل سطر">${esc(
            arr(x.excluded).join("\n")
          )}</textarea>

      </div>


      <div class="field">

        <label>
          ملاحظات
        </label>

        <textarea id="e_notes"
          rows="5"
          placeholder="ملاحظات وشروط العرض">${esc(
            x.notes
          )}</textarea>

      </div>


      <label class="checkbox">

        <input
          type="checkbox"
          id="e_active"
          ${x.active !== false ? "checked" : ""}
        >

        <span>
          إظهار العرض للعملاء
        </span>

      </label>


      <div class="editor-actions">

        <button
          id="saveOffer"
          class="primary"
          type="button">
          حفظ العرض
        </button>

        <button
          id="cancelOffer"
          class="secondary"
          type="button">
          إلغاء
        </button>

      </div>

    </div>
  `;

  show("offerEditor", true);

  previewImages();

  $("e_images").oninput = previewImages;
  $("e_image").oninput = previewImages;

  $("cancelOffer").onclick =
    closeEditor;

  $("saveOffer").onclick =
    saveOffer;
}


/* =========================
   IMAGE PREVIEW
========================= */

function previewImages() {

  const box = $("imagePreview");
  if (!box) return;

  const main =
    $("e_image")?.value.trim() || "";

  const list =
    $("e_images")?.value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean) || [];

  const images = [];

  if (main)
    images.push(main);

  list.forEach(x => {
    if (!images.includes(x))
      images.push(x);
  });

  box.innerHTML = images.length
    ? images.map((src, i) => `
        <div class="preview-image">
          <img
            src="${esc(src)}"
            alt="صورة ${i + 1}"
            onerror="
              this.style.display='none'
            ">
          <small>
            صورة ${i + 1}
          </small>
        </div>
      `).join("")
    : "<p>لا توجد صور.</p>";
}


/* =========================
   CLOSE EDITOR
========================= */

function closeEditor() {

  currentOffer = null;

  const e = $("offerEditor");

  if (!e) return;

  e.innerHTML = "";

  show("offerEditor", false);
}


/* =========================
   GET EDITOR DATA
========================= */

function editorData() {

  const main =
    $("e_image")?.value.trim() || "";

  const lines =
    $("e_images")?.value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean) || [];

  const images = [];

  if (main)
    images.push(main);

  lines.forEach(x => {
    if (!images.includes(x))
      images.push(x);
  });

  return {

    id: $("e_id")?.value.trim() || "",

    name: $("e_name")?.value.trim() || "",

    country:
      $("e_country")?.value.trim() || "",

    destination:
      $("e_destination")?.value.trim() || "",

    category:
      $("e_category")?.value.trim() ||
      "رحلات سياحية",

    duration:
      $("e_duration")?.value.trim() || "",

    price:
      $("e_price")?.value.trim() || "",

    image:
      images[0] || "",

    images,

    description:
      $("e_description")?.value.trim() || "",

    content:
      $("e_content")?.value.trim() || "",

    included:
      arr($("e_included")?.value),

    excluded:
      arr($("e_excluded")?.value),

    notes:
      $("e_notes")?.value.trim() || "",

    order:
      Number($("e_order")?.value || 0),

    active:
      $("e_active")?.checked !== false

  };
}


/* =========================
   SAVE OFFER
========================= */

async function saveOffer() {

  const data = editorData();

  if (!data.id) {
    alert("اكتب معرف العرض.");
    return;
  }

  if (!data.name) {
    alert("اكتب اسم العرض.");
    return;
  }

  if (!currentUser) {
    alert("لم يتم التحقق من المدير.");
    return;
  }

  const button = $("saveOffer");

  if (button) {
    button.disabled = true;
    button.textContent = "جاري الحفظ...";
  }

  try {

    const ref =
      doc(db, "offers", data.id);

    const old =
      await getDoc(ref);

    const payload = {

      name: data.name,
      country: data.country,
      destination: data.destination,
      category: data.category,
      duration: data.duration,
      price: data.price,

      image: data.image,
      images: data.images,

      description:
        data.description,

      content:
        data.content,

      included:
        data.included,

      excluded:
        data.excluded,

      notes:
        data.notes,

      order:
        data.order,

      active:
        data.active,

      updatedAt:
        serverTimestamp(),

      updatedBy:
        currentUser.uid
    };

    if (old.exists()) {

      await updateDoc(
        ref,
        payload
      );

      alert("تم تحديث العرض.");

    } else {

      await setDoc(
        ref,
        {
          ...payload,

          createdAt:
            serverTimestamp(),

          createdBy:
            currentUser.uid
        }
      );

      alert("تم إنشاء العرض.");

    }

    closeEditor();

    await loadOffers();

  } catch (e) {

    console.error(e);

    alert(
      "حدث خطأ أثناء الحفظ:\n" +
      e.message
    );

  } finally {

    if (button) {
      button.disabled = false;
      button.textContent = "حفظ العرض";
    }

  }
}


/* =========================
   DELETE OFFER
========================= */

async function removeOffer(id) {

  const offer =
    offers.find(x => x.id === id);

  if (!offer) return;

  if (
    !confirm(
      `حذف العرض "${offer.name || id}"؟`
    )
  ) return;

  try {

    await deleteDoc(
      doc(db, "offers", id)
    );

    alert("تم حذف العرض.");

    await loadOffers();

  } catch (e) {

    console.error(e);

    alert(
      "تعذر حذف العرض:\n" +
      e.message
    );

  }
                }

/* =========================
   START ADMIN
========================= */

onAuthStateChanged(auth, async user => {

  if (!user) {
    show("accessDenied", true);
    show("dashboard", false);
    return;
  }

  currentUser = user;

  const allowed =
    await checkAdmin(user);

  if (!allowed) {
    show("accessDenied", true);
    show("dashboard", false);
    return;
  }

  show("accessDenied", false);
  show("dashboard", true);

  const welcome =
    $("adminWelcome");

  if (welcome) {
    welcome.textContent =
      `مرحبًا ${user.email || ""}`;
  }

  await loadDashboard();

  initTabs();
  initButtons();
});


/* =========================
   BUTTONS
========================= */

function initButtons() {

  const newOffer =
    $("newOffer");

  if (newOffer) {
    newOffer.onclick = () =>
      openEditor();
  }


  const refresh =
    $("refreshBookings");

  if (refresh) {

    refresh.onclick = async () => {

      refresh.disabled = true;
      refresh.textContent =
        "جاري التحديث...";

      await loadDashboard();

      refresh.disabled = false;
      refresh.textContent =
        "تحديث";
    };
  }


  const logout =
    $("adminLogout");

  if (logout) {

    logout.onclick = async () => {

      if (
        !confirm(
          "هل تريد تسجيل الخروج؟"
        )
      ) return;

      try {

        await signOut(auth);

        location.href =
          "index.html";

      } catch (e) {

        alert(
          "تعذر تسجيل الخروج."
        );

      }
    };
  }


  /* استيراد العروض الموجودة
     من Firestore لا يحتاج أي تعديل
     يدوي للكود. */

  const seed =
    $("seedOffers");

  if (seed) {

    seed.onclick = async () => {

      alert(
        "العروض الموجودة في Firestore تظهر تلقائيًا في لوحة الإدارة."
      );

      await loadOffers();
    };
  }
}


/* =========================
   TABS
========================= */

function initTabs() {

  document
    .querySelectorAll(".tab")
    .forEach(button => {

      button.onclick = () => {

        document
          .querySelectorAll(".tab")
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

        if (panel)
          panel.classList.add(
            "active"
          );
      };

    });
}


/* =========================
   GLOBAL ERROR HANDLER
========================= */

window.addEventListener(
  "error",
  event => {

    console.error(
      "Admin error:",
      event.error
    );

  }
);


/* =========================
   FIRESTORE CONNECTION TEST
========================= */

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


/* =========================
   END ADMIN.JS
========================= */

console.log(
  "FLORIN Admin Panel loaded."
);
