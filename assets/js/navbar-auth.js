import { authState, logoutUser, isAdmin } from "./auth.js";

function addAuthControls() {
  const actions = document.querySelector(".nav-actions");
  if (!actions || document.getElementById("florinAuthNav")) return;

  const wrap = document.createElement("div");
  wrap.id = "florinAuthNav";
  wrap.className = "florin-auth-nav";
  wrap.innerHTML = `
    <a id="loginLink" href="login.html">تسجيل الدخول</a>
    <a id="registerLink" href="register.html">إنشاء حساب</a>
    <span id="navUserName" class="welcome-user"></span>
    <a id="profileLink" href="profile.html" hidden>حسابي</a>
    <a id="adminLink" href="admin.html" hidden>لوحة الإدارة</a>
    <button id="logoutLink" type="button" hidden>خروج</button>`;
  actions.insertBefore(wrap, actions.firstChild);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addAuthControls);
else addAuthControls();

// auth.js is already loaded by the module graph, so this works on every page.
authState(async (user) => {
  addAuthControls();
  const login = document.getElementById("loginLink");
  const register = document.getElementById("registerLink");
  const profile = document.getElementById("profileLink");
  const admin = document.getElementById("adminLink");
  const logout = document.getElementById("logoutLink");
  const nameEl = document.getElementById("navUserName");

  if (!user) {
    if (login) login.hidden = false;
    if (register) register.hidden = false;
    if (profile) profile.hidden = true;
    if (admin) admin.hidden = true;
    if (logout) logout.hidden = true;
    if (nameEl) nameEl.textContent = "";
    return;
  }

  const name = (user.displayName || user.email?.split("@")[0] || "عميل").trim();
  if (login) login.hidden = true;
  if (register) register.hidden = true;
  if (profile) profile.hidden = false;
  if (logout) logout.hidden = false;
  if (nameEl) nameEl.textContent = `مرحبًا ${name}`;
  if (admin) {
    try { admin.hidden = !(await isAdmin(user)); }
    catch { admin.hidden = true; }
  }

  logout?.addEventListener("click", async () => {
    await logoutUser();
    location.replace("index.html");
  }, { once: true });
});
