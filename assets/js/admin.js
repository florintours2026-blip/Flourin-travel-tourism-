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
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { DEFAULT_OFFERS } from "./offers-data.js";


/*==========================================================
  HELPERS
==========================================================*/

const $ = (id) => document.getElementById(id);

let currentUser = null;
let offers = [];


function fmt(ts) {

    if (!ts) return "—";

    try {
        return ts.toDate().toLocaleString("ar-EG");
    }

    catch {
        return String(ts);
    }
}


function esc(value) {

    return String(value ?? "").replace(
        /[&<>"']/g,
        (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char])
    );
}


function show(element, on = true) {

    element.classList.toggle("hidden", !on);
}


/*==========================================================
  ADMIN CHECK
==========================================================*/

async function isAdmin(user) {

    if (!user) return false;

    const snap = await getDoc(
        doc(db, "admins", user.uid)
    );

    return (
        snap.exists() &&
        snap.data().active === true
    );
}


/*==========================================================
  LOAD ALL DATA
==========================================================*/

async function loadAll() {

    const [
        usersSnapshot,
        bookingsSnapshot,
        activitySnapshot,
        offersSnapshot
    ] = await Promise.all([

        getDocs(
            collection(db, "users")
        ),

        getDocs(
            query(
                collection(db, "bookings"),
                orderBy("createdAt", "desc"),
                limit(200)
            )
        ),

        getDocs(
            query(
                collection(db, "activityLogs"),
                orderBy("createdAt", "desc"),
                limit(300)
            )
        ),

        getDocs(
            collection(db, "offers")
        )
    ]);


    offers = offersSnapshot.docs.map(
        (document) => ({
            id: document.id,
            ...document.data()
        })
    );


    $("usersCount").textContent =
        usersSnapshot.size;

    $("bookingsCount").textContent =
        bookingsSnapshot.size;

    $("activityCount").textContent =
        activitySnapshot.size;

    $("offersCount").textContent =
        offers.length;


    /* USERS */

    $("usersTable").innerHTML =
        usersSnapshot.docs.map((document) => {

            const data = document.data();

            return `
                <tr>
                    <td>${esc(data.name)}</td>
                    <td>${esc(data.email)}</td>
                    <td>${esc(data.uid)}</td>
                    <td>${fmt(data.createdAt)}</td>
                </tr>
            `;

        }).join("") ||

        `<tr>
            <td colspan="4">لا توجد بيانات</td>
        </tr>`;


    /* BOOKINGS */

    $("bookingsTable").innerHTML =
        bookingsSnapshot.docs.map((document) => {

            const data = document.data();

            return `
                <tr>
                    <td>${esc(data.fullName)}</td>
                    <td>${esc(data.phone)}</td>
                    <td>${esc(data.offerName || data.service)}</td>
                    <td>${esc(data.travelDate)}</td>
                    <td>${esc(data.travelers)}</td>
                    <td>${esc(data.status)}</td>
                </tr>
            `;

        }).join("") ||

        `<tr>
            <td colspan="6">لا توجد حجوزات</td>
        </tr>`;


    /* ACTIVITY */

    $("activityTable").innerHTML =
        activitySnapshot.docs.map((document) => {

            const data = document.data();

            return `
                <tr>
                    <td>${esc(data.type)}</td>
                    <td>${esc(data.email)}</td>
                    <td>${esc(data.uid)}</td>
                    <td>${fmt(data.createdAt)}</td>
                </tr>
            `;

        }).join("") ||

        `<tr>
            <td colspan="4">لا يوجد نشاط مسجل</td>
        </tr>`;


    renderOffers();
}


/*==========================================================
  RENDER OFFERS TABLE
==========================================================*/

function renderOffers() {

    $("offersTable").innerHTML =

        offers.map((offer) => {

            const imagesCount =
                Array.isArray(offer.images)
                    ? offer.images.length
                    : (offer.image ? 1 : 0);


            return `
                <tr>

                    <td>
                        <strong>
                            ${esc(offer.name)}
                        </strong>

                        <br>

                        <small>
                            ${esc(offer.category || "")}
                        </small>
                    </td>


                    <td>
                        ${esc(offer.country)}
                    </td>


                    <td>
                        ${esc(offer.price)}
                    </td>


                    <td>
                        ${offer.active === false
                            ? "مخفي"
                            : "ظاهر"}
                    </td>


                    <td>
                        ${imagesCount} صورة
                    </td>


                    <td>

                        <div class="actions">

                            <button
                                class="small edit"
                                data-edit="${esc(offer.id)}"
                            >
                                تعديل
                            </button>


                            <button
                                class="small delete"
                                data-delete="${esc(offer.id)}"
                            >
                                حذف
                            </button>

                        </div>

                    </td>

                </tr>
            `;

        }).join("") ||

        `<tr>
            <td colspan="6">
                لا توجد عروض.
                استخدم استيراد العروض الحالية.
            </td>
        </tr>`;


    document.querySelectorAll("[data-edit]")
        .forEach((button) => {

            button.onclick = () => {

                const offer = offers.find(
                    (item) =>
                        item.id === button.dataset.edit
                );

                openEditor(offer);
            };

        });


    document.querySelectorAll("[data-delete]")
        .forEach((button) => {

            button.onclick = async () => {

                if (
                    !confirm(
                        "هل أنت متأكد من حذف هذا العرض؟"
                    )
                ) {
                    return;
                }


                await deleteDoc(
                    doc(
                        db,
                        "offers",
                        button.dataset.delete
                    )
                );


                await loadAll();
            };

        });
}


/*==========================================================
  OFFER EDITOR
==========================================================*/

function openEditor(offer = null) {


    const data = offer || {

        id: "",

        name: "",

        country: "",

        duration: "",

        price: "",

        image: "",

        images: [],

        category: "رحلات سياحية",

        description: "",

        content: "",

        included: [],

        excluded: [],

        notes: "",

        order: 0,

        active: true

    };


    const images = Array.isArray(data.images)
        ? data.images
        : (
            data.image
                ? [data.image]
                : []
        );


    $("offerEditor").innerHTML = `

        <h3>
            ${offer
                ? "تعديل العرض"
                : "إضافة عرض جديد"}
        </h3>


        <div class="form-grid">


            <!-- ID -->

            <div class="field">

                <label>
                    المعرّف (ID)
                </label>

                <input
                    id="e_id"
                    value="${esc(data.id)}"
                    ${offer ? "readonly" : ""}
                >

            </div>


            <!-- NAME -->

            <div class="field">

                <label>
                    اسم العرض
                </label>

                <input
                    id="e_name"
                    value="${esc(data.name)}"
                >

            </div>


            <!-- COUNTRY -->

            <div class="field">

                <label>
                    الدولة / الوجهة
                </label>

                <input
                    id="e_country"
                    value="${esc(data.country)}"
                >

            </div>


            <!-- CATEGORY -->

            <div class="field">

                <label>
                    التصنيف
                </label>

                <input
                    id="e_category"
                    value="${esc(data.category)}"
                >

            </div>


            <!-- DURATION -->

            <div class="field">

                <label>
                    مدة الرحلة
                </label>

                <input
                    id="e_duration"
                    value="${esc(data.duration)}"
                >

            </div>


            <!-- PRICE -->

            <div class="field">

                <label>
                    السعر
                </label>

                <input
                    id="e_price"
                    value="${esc(data.price)}"
                >

            </div>


            <!-- ORDER -->

            <div class="field">

                <label>
                    ترتيب العرض
                </label>

                <input
                    id="e_order"
                    type="number"
                    value="${Number(data.order || 0)}"
                >

            </div>


            <!-- MAIN IMAGE -->

            <div class="field full">

                <label>
                    الصورة الرئيسية
                </label>

                <input
                    id="e_image"
                    value="${esc(data.image || images[0] || "")}"
                    placeholder="assets/images/offers/dubai-offer.png"
                >

                <small>
                    اكتب مسار الصورة الموجودة داخل المشروع.
                </small>

            </div>


            <!-- MULTIPLE IMAGES -->

            <div class="field full">

                <label>
                    صور العرض — صورة في كل سطر
                </label>

                <textarea
                    id="e_images"
                    rows="6"
                    placeholder="assets/images/offers/dubai-offer.png
assets/images/offers/dubai-2.png
assets/images/offers/dubai-3.png"
                >${esc(images.join("\n"))}</textarea>

                <small>
                    يمكنك إضافة عدد غير محدود من مسارات الصور الموجودة في المشروع.
                </small>

            </div>


            <!-- DESCRIPTION -->

            <div class="field full">

                <label>
                    الوصف المختصر
                </label>

                <textarea
                    id="e_description"
                    rows="4"
                >${esc(data.description)}</textarea>

            </div>


            <!-- FULL CONTENT -->

            <div class="field full">

                <label>
                    📝 محتويات العرض بالكامل
                </label>

                <textarea
                    id="e_content"
                    rows="12"
                    placeholder="اكتب هنا جميع تفاصيل ومحتويات العرض...

مثال:

✈️ تذاكر الطيران
🏨 الإقامة الفندقية
🍳 الإفطار
🚐 الاستقبال والتوصيل
🗺️ الجولات السياحية
🛂 التأشيرة حسب الجنسية
📞 الدعم والمتابعة

يمكنك كتابة النص بالتفصيل."
                >${esc(data.content)}</textarea>

            </div>


            <!-- INCLUDED -->

            <div class="field">

                <label>
                    يشمل — خدمة في كل سطر
                </label>

                <textarea
                    id="e_included"
                    rows="8"
                >${esc(
                    (data.included || [])
                        .join("\n")
                )}</textarea>

            </div>


            <!-- EXCLUDED -->

            <div class="field">

                <label>
                    لا يشمل — خدمة في كل سطر
                </label>

                <textarea
                    id="e_excluded"
                    rows="8"
                >${esc(
                    (data.excluded || [])
                        .join("\n")
                )}</textarea>

            </div>


            <!-- NOTES -->

            <div class="field full">

                <label>
                    ملاحظات
                </label>

                <textarea
                    id="e_notes"
                    rows="6"
                >${esc(data.notes)}</textarea>

            </div>


        </div>


        <label class="checkbox">

            <input
                type="checkbox"
                id="e_active"
                ${data.active !== false
                    ? "checked"
                    : ""}
            >

            إظهار العرض للعملاء

        </label>


        <div class="editor-actions">

            <button
                class="primary"
                id="saveOffer"
            >
                حفظ العرض
            </button>


            <button
                class="secondary"
                id="cancelOffer"
            >
                إلغاء
            </button>

        </div>
    `;


    show($("offerEditor"));


    $("cancelOffer").onclick = () => {

        show(
            $("offerEditor"),
            false
        );

    };


    $("saveOffer").onclick =
        async () => {


        const id =
            $("e_id").value.trim();


        const name =
            $("e_name").value.trim();


        if (!id || !name) {

            alert(
                "المعرّف واسم العرض مطلوبان."
            );

            return;
        }


        /*
         * الصور
         */

        const imageList =
            $("e_images")
                .value
                .split("\n")
                .map(
                    (item) =>
                        item.trim()
                )
                .filter(Boolean);


        /*
         * الصورة الرئيسية
         */

        const mainImage =
            $("e_image")
                .value
                .trim();


        /*
         * إذا كانت الصورة الرئيسية
         * غير موجودة داخل القائمة
         * نضيفها تلقائيًا.
         */

        if (
            mainImage &&
            !imageList.includes(mainImage)
        ) {

            imageList.unshift(
                mainImage
            );

        }


        /*
         * البيانات الجديدة
         */

        const updatedData = {

            name,

            country:
                $("e_country")
                    .value
                    .trim(),

            category:
                $("e_category")
                    .value
                    .trim(),

            duration:
                $("e_duration")
                    .value
                    .trim(),

            price:
                $("e_price")
                    .value
                    .trim(),

            image:
                mainImage ||
                imageList[0] ||
                "",

            images:
                imageList,

            description:
                $("e_description")
                    .value
                    .trim(),

            content:
                $("e_content")
                    .value
                    .trim(),

            included:
                $("e_included")
                    .value
                    .split("\n")
                    .map(
                        (item) =>
                            item.trim()
                    )
                    .filter(Boolean),

            excluded:
                $("e_excluded")
                    .value
                    .split("\n")
                    .map(
                        (item) =>
                            item.trim()
                    )
                    .filter(Boolean),

            notes:
                $("e_notes")
                    .value
                    .trim(),

            order:
                Number(
                    $("e_order")
                        .value || 0
                ),

            active:
                $("e_active")
                    .checked,

            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentUser.uid

        };


        try {


            /*
             * UPDATE
             */

            if (offer) {

                await updateDoc(

                    doc(
                        db,
                        "offers",
                        id
                    ),

                    updatedData

                );

            }


            /*
             * CREATE
             */

            else {

                await setDoc(

                    doc(
                        db,
                        "offers",
                        id
                    ),

                    {

                        ...updatedData,

                        createdAt:
                            serverTimestamp(),

                        createdBy:
                            currentUser.uid

                    }

                );

            }


            show(
                $("offerEditor"),
                false
            );


            await loadAll();


            alert(
                "تم حفظ العرض بنجاح."
            );

        }

        catch (error) {

            console.error(
                "Save offer error:",
                error
            );


            alert(
                "حدث خطأ أثناء حفظ العرض:\n" +
                error.message
            );

        }

    };

}


/*==========================================================
  NEW OFFER
==========================================================*/

$("newOffer").onclick = () => {

    openEditor();

};


/*==========================================================
  IMPORT DEFAULT OFFERS
==========================================================*/

$("seedOffers").onclick =
    async () => {


    if (
        !confirm(
            "استيراد العروض الحالية إلى قاعدة البيانات؟\n\nالعروض الموجودة لن يتم استبدالها."
        )
    ) {

        return;
    }


    for (
        const offer
        of DEFAULT_OFFERS
    ) {


        const ref =
            doc(
                db,
                "offers",
                offer.id
            );


        const snapshot =
            await getDoc(ref);


        if (!snapshot.exists()) {

            await setDoc(

                ref,

                {

                    ...offer,

                    images:
                        offer.images ||
                        (
                            offer.image
                                ? [offer.image]
                                : []
                        ),

                    content:
                        offer.content ||
                        of
