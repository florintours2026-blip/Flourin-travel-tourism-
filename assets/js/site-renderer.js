import {
  loadSiteContent
} from "./site-content.js";


/* =====================================================
   FLORIN SITE RENDERER
   الجزء 1 من 2
===================================================== */


let CONTENT = null;


/* =====================================================
   HELPERS
===================================================== */

function $(selector) {

  return document.querySelector(selector);

}


function $all(selector) {

  return document.querySelectorAll(selector);

}


function text(selector, value) {

  const el =
    typeof selector === "string"
      ? $(selector)
      : selector;

  if (!el || value === undefined)
    return;

  el.textContent =
    value ?? "";

}


function html(selector, value) {

  const el =
    typeof selector === "string"
      ? $(selector)
      : selector;

  if (!el || value === undefined)
    return;

  el.innerHTML =
    value ?? "";

}


function attr(
  selector,
  name,
  value
) {

  const el =
    typeof selector === "string"
      ? $(selector)
      : selector;

  if (!el || value === undefined)
    return;

  el.setAttribute(
    name,
    value
  );

}


function hide(
  selector,
  state
) {

  const el =
    typeof selector === "string"
      ? $(selector)
      : selector;

  if (!el) return;

  el.style.display =
    state
      ? ""
      : "none";

}


function safeArray(value) {

  return Array.isArray(value)
    ? value
    : [];

}


/* =====================================================
   SET LINK
===================================================== */

function setLink(
  element,
  link
) {

  if (!element || !link)
    return;

  element.href =
    link;

}


/* =====================================================
   SETTINGS
===================================================== */

function renderSettings() {

  const s =
    CONTENT.settings || {};


  /* Location */

  const locationLinks =
    $all(
      ".top-left a"
    );


  if (locationLinks[0]) {

    locationLinks[0].innerHTML =
      `
        <i class="fa-solid fa-location-dot"></i>
        ${s.location || ""}
      `;

  }


  /* Phone */

  if (locationLinks[1]) {

    locationLinks[1].innerHTML =
      `
        <i class="fa-solid fa-phone"></i>
        ${s.phone || ""}
      `;


    locationLinks[1].href =
      `tel:${s.phone || ""}`;

  }


  /* Email */

  if (locationLinks[2]) {

    locationLinks[2].innerHTML =
      `
        <i class="fa-solid fa-envelope"></i>
        ${s.email || ""}
      `;


    locationLinks[2].href =
      `mailto:${s.email || ""}`;

  }


  /* Social */

  const socials =
    $all(
      ".top-right a"
    );


  if (socials[0])
    socials[0].href =
      s.facebook || "#";


  if (socials[1])
    socials[1].href =
      s.instagram || "#";


  if (socials[2])
    socials[2].href =
      s.tiktok || "#";


  if (socials[3])
    socials[3].href =
      s.youtube || "";

}


/* =====================================================
   HERO
===================================================== */

function renderHero() {

  const h =
    CONTENT.hero || {};


  const section =
    $(".hero");


  if (!section)
    return;


  hide(
    section,
    h.visible !== false
  );


  /* Badge */

  text(
    ".hero-badge",
    h.badge
  );


  /* Title */

  const title =
    $(".hero-content h1");


  if (title) {

    const span =
      title.querySelector(
        "span"
      );


    if (span) {

      title.childNodes.forEach(
        node => {

          if (
            node.nodeType ===
            Node.TEXT_NODE
          ) {

            node.textContent =
              "";

          }

        }
      );

    } else {

      title.textContent =
        h.title || "";

    }


    const normalText =
      document.createTextNode(
        `${h.title || ""} `
      );


    title.innerHTML =
      "";


    title.appendChild(
      normalText
    );


    const highlight =
      document.createElement(
        "span"
      );


    highlight.textContent =
      h.highlight || "";


    title.appendChild(
      highlight
    );

  }


  /* Description */

  text(
    ".hero-content p",
    h.description
  );


  /* Primary button */

  const buttons =
    $all(
      ".hero-buttons a"
    );


  if (buttons[0]) {

    text(
      buttons[0],
      h.primaryText
    );

    setLink(
      buttons[0],
      h.primaryLink
    );

  }


  /* Secondary button */

  if (buttons[1]) {

    text(
      buttons[1],
      h.secondaryText
    );

    setLink(
      buttons[1],
      h.secondaryLink
    );

  }


  /* Hero images */

  const slides =
    safeArray(
      h.slides
    );


  if (
    slides.length &&
    $(".hero-slider")
  ) {

    const slider =
      $(".hero-slider");


    slider.innerHTML =
      slides
        .map(
          (src, index) => `
            <img
              src="${src}"
              class="hero-slide ${
                index === 0
                  ? "active"
                  : ""
              }"
              alt="Florin"
            >
          `
        )
        .join("");


    restartHeroSlider();

  }

}


/* =====================================================
   HERO SLIDER
===================================================== */

function restartHeroSlider() {

  const slides =
    $all(
      ".hero-slider .hero-slide"
    );


  if (
    !slides.length
  )
    return;


  let index = 0;


  clearInterval(
    window.FLORIN_HERO_TIMER
  );


  window.FLORIN_HERO_TIMER =
    setInterval(
      () => {

        slides[index]
          .classList.remove(
            "active"
          );


        index =
          (index + 1) %
          slides.length;


        slides[index]
          .classList.add(
            "active"
          );

      },
      5000
    );

}


/* =====================================================
   SECTION HEADER
===================================================== */

function renderHeader(
  section,
  selector
) {

  if (!section)
    return;


  const root =
    $(selector);


  if (!root)
    return;


  hide(
    root,
    section.visible !== false
  );


  const badge =
    root.querySelector(
      ".section-badge"
    );


  const title =
    root.querySelector(
      ".section-header h2"
    );


  const description =
    root.querySelector(
      ".section-header p"
    );


  if (badge)
    badge.textContent =
      section.badge || "";


  if (title)
    title.textContent =
      section.title || "";


  if (description)
    description.textContent =
      section.description || "";

}


/* =====================================================
   SERVICES
===================================================== */

function renderServices() {

  const s =
    CONTENT.services || {};


  renderHeader(
    s,
    ".services"
  );


  const grid =
    $(".services-grid");


  if (!grid)
    return;


  const items =
    safeArray(
      s.items
    );


  if (!items.length)
    return;


  grid.innerHTML =
    items
      .map(
        item => `

          <article
            class="service-card"
          >

            <i
              class="${item.icon || ""}"
            ></i>

            <h3>
              ${item.title || ""}
            </h3>

            <p>
              ${item.description || ""}
            </p>

          </article>

        `
      )
      .join("");

}


/* =====================================================
   DESTINATIONS
===================================================== */

function renderDestinations() {

  const d =
    CONTENT.destinations || {};


  renderHeader(
    d,
    ".destinations"
  );


  const grid =
    $(".destination-grid");


  if (!grid)
    return;


  const items =
    safeArray(
      d.items
    );


  if (!items.length)
    return;


  grid.innerHTML =
    items
      .map(
        item => `

          <article
            class="destination-card"
          >

            <img
              src="${item.image || ""}"
              alt="${item.title || ""}"
            >

            <div
              class="overlay"
            >

              <h3>
                ${item.title || ""}
              </h3>

              <p>
                ${item.description || ""}
              </p>

              <a
                href="${item.link || "offers.html"}"
              >
                اكتشف المزيد
              </a>

            </div>

          </article>

        `
      )
      .join("");

}


/* =====================================================
   WHY FLORIN
===================================================== */

function renderWhy() {

  const w =
    CONTENT.why || {};


  renderHeader(
    w,
    ".why-florin"
  );


  const grid =
    $(".why-grid");


  if (!grid)
    return;


  const items =
    safeArray(
      w.items
    );


  if (!items.length)
    return;


  grid.innerHTML =
    items
      .map(
        item => `

          <div
            class="why-card"
          >

            <i
              class="${item.icon || ""}"
            ></i>

            <h3>
              ${item.value || ""}
            </h3>

            <span>
              ${item.label || ""}
            </span>

          </div>

        `
      )
      .join("");

}


/* =====================================================
   PREMIUM OFFERS
===================================================== */

function renderPremium() {

  const p =
    CONTENT.premium || {};


  renderHeader(
    p,
    ".premium-offers"
  );


  const grid =
    $(".premium-offers .offers-grid");


  if (!grid)
    return;


  const items =
    safeArray(
      p.items
    );


  if (!items.length)
    return;


  grid.innerHTML =
    items
      .map(
        item => `

          <article
            class="offer-card"
          >

            <div
              class="premium-image"
            >

              <img
                src="${item.image || ""}"
                alt="${item.title || ""}"
              >

              <span
                class="discount"
              >
                ${item.discount || ""}
              </span>

            </div>


            <div
              class="offer-content"
            >

              <h3>
                ${item.title || ""}
              </h3>

              <p>
                ${item.duration || ""}
              </p>

              <strong>
                ${item.price || ""}
              </strong>

              <a
                href="${item.link || "offers.html"}"
              >
                احجز الآن
              </a>

            </div>

          </article>

        `
      )
      .join("");

}


/* =====================================================
   INIT PART 1
===================================================== */

async function renderPartOne() {

  try {

    CONTENT =
      await loadSiteContent();


    if (!CONTENT)
      return;


    renderSettings();

    renderHero();

    renderServices();

    renderDestinations();

    renderWhy();

    renderPremium();


  } catch (error) {

    console.error(
      "FLORIN renderer part 1:",
      error
    );

  }

}


document.addEventListener(
  "DOMContentLoaded",
  renderPartOne
);

/* =====================================================
   FLORIN SITE RENDERER
   الجزء 2 من 2
===================================================== */


/* =====================================================
   FLIGHTS
===================================================== */

function renderFlights() {

  const section =
    CONTENT.flights || {};

  renderHeader(
    section,
    ".flights-section"
  );

  const grid =
    $(".flights-section .offers-grid");

  if (!grid)
    return;

  const items =
    safeArray(section.items);

  if (!items.length)
    return;

  grid.innerHTML =
    items.map(item => `

      <article class="flight-card">

        <img
          src="${item.image || ""}"
          alt="${item.title || ""}"
        >

        <div class="flight-content">

          <h3>
            ${item.title || ""}
          </h3>

          <p>
            ${item.description || ""}
          </p>

          <strong>
            ${item.price || ""}
          </strong>

          <a
            href="${item.link || "booking.html"}"
          >
            احجز الآن
          </a>

        </div>

      </article>

    `).join("");

}


/* =====================================================
   HOTELS
===================================================== */

function renderHotels() {

  const section =
    CONTENT.hotels || {};

  renderHeader(
    section,
    ".hotels-section"
  );

  const grid =
    $(".hotels-section .offers-grid");

  if (!grid)
    return;

  const items =
    safeArray(section.items);

  if (!items.length)
    return;

  grid.innerHTML =
    items.map(item => `

      <article class="hotel-card">

        <img
          src="${item.image || ""}"
          alt="${item.title || ""}"
        >

        <div class="hotel-content">

          <h3>
            ${item.title || ""}
          </h3>

          <p>
            ${item.description || ""}
          </p>

          <span>
            ${item.stars || "★★★★★"}
          </span>

          <strong>
            ${item.price || ""}
          </strong>

          <a
            href="${item.link || "booking.html"}"
          >
            احجز الآن
          </a>

        </div>

      </article>

    `).join("");

}


/* =====================================================
   TOURS
===================================================== */

function renderTours() {

  const section =
    CONTENT.tours || {};

  renderHeader(
    section,
    ".tours-section"
  );

  const grid =
    $(".tours-section .offers-grid");

  if (!grid)
    return;

  const items =
    safeArray(section.items);

  if (!items.length)
    return;

  grid.innerHTML =
    items.map(item => `

      <article class="tour-card">

        <img
          src="${item.image || ""}"
          alt="${item.title || ""}"
        >

        <div class="tour-content">

          <h3>
            ${item.title || ""}
          </h3>

          <p>
            ${item.description || ""}
          </p>

          <div>
            ${item.duration || ""}
          </div>

          <strong>
            ${item.price || ""}
          </strong>

          <a
            href="${item.link || "booking.html"}"
          >
            احجز الآن
          </a>

        </div>

      </article>

    `).join("");

}


/* =====================================================
   SECURITY APPROVAL
===================================================== */

function renderSecurity() {

  const section =
    CONTENT.security || {};

  const root =
    $(".security-section");

  if (!root)
    return;

  hide(
    root,
    section.visible !== false
  );


  const badge =
    root.querySelector(
      ".section-badge"
    );

  const title =
    root.querySelector(
      "h2"
    );

  const description =
    root.querySelector(
      "p"
    );


  if (badge)
    badge.textContent =
      section.badge || "";


  if (title)
    title.textContent =
      section.title || "";


  if (description)
    description.textContent =
      section.description || "";


  const features =
    safeArray(
      section.features
    );


  const list =
    root.querySelector(
      "ul"
    );


  if (
    list &&
    features.length
  ) {

    list.innerHTML =
      features
        .map(
          item => `
            <li>
              <i
                class="fa-solid fa-check"
              ></i>
              ${item}
            </li>
          `
        )
        .join("");

  }


  const button =
    root.querySelector(
      "a"
    );


  if (button) {

    button.textContent =
      section.buttonText ||
      "قدم طلبك الآن";

    button.href =
      section.buttonLink ||
      "booking.html";

  }

}


/* =====================================================
   VISAS
===================================================== */

function renderVisas() {

  const section =
    CONTENT.visas || {};

  renderHeader(
    section,
    ".visas-section"
  );

  const grid =
    $(".visas-section .offers-grid");

  if (!grid)
    return;

  const items =
    safeArray(section.items);

  if (!items.length)
    return;

  grid.innerHTML =
    items.map(item => `

      <article class="visa-card">

        <img
          src="${item.image || ""}"
          alt="${item.title || ""}"
        >

        <div>

          <h3>
            ${item.title || ""}
          </h3>

          <p>
            ${item.description || ""}
          </p>

          <strong>
            ${item.price || ""}
          </strong>

          <a
            href="${item.link || "booking.html"}"
          >
            قدم طلبك
          </a>

        </div>

      </article>

    `).join("");

}


/* =====================================================
   TESTIMONIALS
===================================================== */

function renderTestimonials() {

  const section =
    CONTENT.testimonials || {};

  renderHeader(
    section,
    ".testimonials-section"
  );

  const grid =
    $(".testimonials-grid");

  if (!grid)
    return;

  const items =
    safeArray(section.items);

  if (!items.length)
    return;

  grid.innerHTML =
    items.map(item => `

      <article class="testimonial-card">

        <div class="testimonial-stars">
          ${item.rating || "★★★★★"}
        </div>

        <p>
          ${item.text || ""}
        </p>

        <h4>
          ${item.name || ""}
        </h4>

        <span>
          ${item.country || ""}
        </span>

      </article>

    `).join("");

}


/* =====================================================
   CTA
===================================================== */

function renderCTA() {

  const section =
    CONTENT.cta || {};

  const root =
    $(".cta-section");

  if (!root)
    return;

  hide(
    root,
    section.visible !== false
  );


  const badge =
    root.querySelector(
      ".section-badge"
    );

  const title =
    root.querySelector(
      "h2"
    );

  const description =
    root.querySelector(
      "p"
    );

  const button =
    root.querySelector(
      "a"
    );


  if (badge)
    badge.textContent =
      section.badge || "";


  if (title)
    title.textContent =
      section.title || "";


  if (description)
    description.textContent =
      section.description || "";


  if (button) {

    button.textContent =
      section.buttonText ||
      "ابدأ رحلتك الآن";

    button.href =
      section.buttonLink ||
      "booking.html";

  }

}


/* =====================================================
   CONTACT
===================================================== */

function renderContact() {

  const section =
    CONTENT.contact || {};

  const root =
    $(".contact-section");

  if (!root)
    return;

  hide(
    root,
    section.visible !== false
  );


  const badge =
    root.querySelector(
      ".section-badge"
    );

  const title =
    root.querySelector(
      "h2"
    );

  const description =
    root.querySelector(
      "p"
    );


  if (badge)
    badge.textContent =
      section.badge || "";


  if (title)
    title.textContent =
      section.title || "";


  if (description)
    description.textContent =
      section.description || "";


  const phone =
    root.querySelector(
      '[data-contact="phone"]'
    );

  const whatsapp =
    root.querySelector(
      '[data-contact="whatsapp"]'
    );

  const email =
    root.querySelector(
      '[data-contact="email"]'
    );

  const address =
    root.querySelector(
      '[data-contact="address"]'
    );


  if (phone) {

    phone.textContent =
      section.phone || "";

    phone.href =
      `tel:${section.phone || ""}`;

  }


  if (whatsapp) {

    whatsapp.textContent =
      section.whatsapp || "";

    whatsapp.href =
      `https://wa.me/${String(
        section.whatsapp || ""
      ).replace(
        /\D/g,
        ""
      )}`;

  }


  if (email) {

    email.textContent =
      section.email || "";

    email.href =
      `mailto:${section.email || ""}`;

  }


  if (address) {

    address.textContent =
      section.address || "";

  }

}


/* =====================================================
   FOOTER
===================================================== */

function renderFooter() {

  const s =
    CONTENT.settings || {};

  const footer =
    $("footer");

  if (!footer)
    return;


  const phone =
    footer.querySelector(
      '[data-footer="phone"]'
    );

  const email =
    footer.querySelector(
      '[data-footer="email"]'
    );

  const address =
    footer.querySelector(
      '[data-footer="address"]'
    );


  if (phone) {

    phone.textContent =
      s.phone || "";

    phone.href =
      `tel:${s.phone || ""}`;

  }


  if (email) {

    email.textContent =
      s.email || "";

    email.href =
      `mailto:${s.email || ""}`;

  }


  if (address) {

    address.textContent =
      s.location || "";

  }


  const facebook =
    footer.querySelector(
      '[data-social="facebook"]'
    );

  const instagram =
    footer.querySelector(
      '[data-social="instagram"]'
    );

  const tiktok =
    footer.querySelector(
      '[data-social="tiktok"]'
    );

  const youtube =
    footer.querySelector(
      '[data-social="youtube"]'
    );


  if (facebook)
    facebook.href =
      s.facebook || "#";


  if (instagram)
    instagram.href =
      s.instagram || "#";


  if (tiktok)
    tiktok.href =
      s.tiktok || "#";


  if (youtube)
    youtube.href =
      s.youtube || "#";

}


/* =====================================================
   RUN ALL RENDERERS
===================================================== */

async function renderAll() {

  try {

    CONTENT =
      await loadSiteContent();


    if (!CONTENT) {

      console.warn(
        "No FLORIN content found."
      );

      return;

    }


    renderSettings();

    renderHero();

    renderServices();

    renderDestinations();

    renderWhy();

    renderPremium();

    renderFlights();

    renderHotels();

    renderTours();

    renderSecurity();

    renderVisas();

    renderTestimonials();

    renderCTA();

    renderContact();

    renderFooter();


    console.log(
      "FLORIN website content loaded successfully."
    );


  } catch (error) {

    console.error(
      "FLORIN render error:",
      error
    );

  }

}


/* =====================================================
   REFRESH CONTENT
===================================================== */

window.refreshFlorinContent =
  renderAll;


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    renderAll();

  }
);
