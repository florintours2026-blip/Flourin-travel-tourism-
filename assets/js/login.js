import { loginUser, loginWithGoogle, isAdmin, logoutUser } from "./auth.js";

const params = new URLSearchParams(location.search);
const adminMode = params.get("admin") === "1";
const form = document.getElementById("loginForm");
const title = document.querySelector(".login-header h1");
const subtitle = document.querySelector(".login-header p");
const submit = form?.querySelector("button[type=submit]");

if (adminMode) {
  if (title) title.textContent = "دخول إدارة FLORIN";
  if (subtitle) subtitle.textContent = "سجّل الدخول بحساب المدير المصرح له.";
  if (submit) submit.textContent = "دخول لوحة الإدارة";
}

function friendlyError(error) {
  const code = error?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (code === "auth/invalid-email") return "أدخل بريدًا إلكترونيًا صحيحًا.";
  if (code === "auth/too-many-requests") return "تم تجاوز عدد محاولات الدخول. حاول لاحقًا.";
  if (code === "auth/user-disabled") return "هذا الحساب معطل.";
  if (code === "permission-denied" || /insufficient permissions/i.test(error?.message || "")) return "تعذر قراءة صلاحية الإدارة. تأكد من نشر firestore.rules ثم أعد المحاولة.";
  return error?.message || "تعذر تسجيل الدخول.";
}

async function finishLogin(user) {
  const admin = await isAdmin(user);
  if (adminMode) {
    if (!admin) {
      await logoutUser().catch(() => {});
      throw new Error("هذا الحساب ليس ضمن مديري FLORIN أو أن حساب الإدارة غير نشط.");
    }
    location.replace("admin.html");
  } else {
    location.replace(admin ? "admin.html" : "index.html");
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value || "";
  if (!email || !password) return alert("أدخل البريد الإلكتروني وكلمة المرور.");
  if (submit) { submit.disabled = true; submit.textContent = "جارٍ الدخول..."; }
  try {
    const user = await loginUser(email, password);
    await finishLogin(user);
  } catch (error) {
    console.error(error);
    alert(friendlyError(error));
    if (submit) { submit.disabled = false; submit.textContent = adminMode ? "دخول لوحة الإدارة" : "تسجيل الدخول"; }
  }
});

document.getElementById("googleLogin")?.addEventListener("click", async () => {
  try {
    const user = await loginWithGoogle();
    await finishLogin(user);
  } catch (error) {
    console.error(error);
    alert(friendlyError(error));
  }
});
