import { authState, logoutUser } from "./auth.js";
import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const BOOTSTRAP_ADMIN_UID = "7nE6QoTEPFOk0IhwcZUnymkyzoY2";
const actions = document.querySelector(".nav-actions");
if (!actions) throw new Error("FLORIN navbar: .nav-actions not found");

let box = document.getElementById("florinAuthNav");
if (!box) {
  box = document.createElement("div");
  box.id = "florinAuthNav";
  box.className = "florin-auth-nav";
  actions.prepend(box);
}

function esc(value) {
  return String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#039;"}[c]));
}

async function checkAdmin(user) {
  if (!user) return false;
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    return user.uid === BOOTSTRAP_ADMIN_UID || (snap.exists() && (snap.data()?.active === true || snap.data()?.active === "true"));
  } catch (error) {
    console.warn("FLORIN admin check failed:", error);
    return false;
  }
}

function renderSignedOut() {
  box.innerHTML = `
    <a class="auth-nav-btn" href="login.html">تسجيل الدخول</a>
    <a class="auth-nav-btn auth-register" href="register.html">إنشاء حساب</a>
    <a class="auth-nav-admin" href="login.html?admin=1">دخول الإدارة</a>`;
}

async function renderSignedIn(user) {
  const name = (user.displayName || user.email?.split("@")[0] || "عميل").trim();
  const admin = await checkAdmin(user);
  box.innerHTML = `
    <span class="welcome-user">مرحبًا ${esc(name)}</span>
    <a class="auth-nav-btn" href="profile.html">حسابي</a>
    ${admin ? '<a class="auth-nav-admin" href="admin.html">لوحة الإدارة</a>' : ''}
    <button class="auth-nav-btn auth-logout" id="florinLogout" type="button">تسجيل الخروج</button>`;
  document.getElementById("florinLogout")?.addEventListener("click", async () => {
    try { await logoutUser(); location.replace("index.html"); }
    catch (error) { alert(error.message || "تعذر تسجيل الخروج"); }
  });
}

authState(async user => {
  if (user) await renderSignedIn(user);
  else renderSignedOut();
});
