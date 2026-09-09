import { loginUser, loginWithGoogle, logoutUser } from "./auth.js";
import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const adminMode = new URLSearchParams(location.search).get("admin") === "1";
const form = document.getElementById("loginForm");
const google = document.getElementById("googleLogin");
const title = document.querySelector(".login-header h1");
const subtitle = document.querySelector(".login-header p");

if (adminMode) {
  if (title) title.textContent = "دخول الإدارة";
  if (subtitle) subtitle.textContent = "سجّل الدخول بحساب مدير FLORIN المصرح له";
}

function message(error) {
  const code = error?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (code === "auth/invalid-email") return "أدخل بريدًا إلكترونيًا صحيحًا.";
  if (code === "auth/too-many-requests") return "تمت محاولات كثيرة. حاول مرة أخرى لاحقًا.";
  if (code === "auth/user-disabled") return "هذا الحساب معطل.";
  if (code === "permission-denied") return "قواعد Firestore لا تسمح بالتحقق من صلاحية الإدارة. انشر ملف firestore.rules ثم أعد المحاولة.";
  return error?.message || "تعذر تسجيل الدخول. حاول مرة أخرى.";
}

async function continueAfterLogin(user) {
  if (!adminMode) {
    location.replace("index.html");
    return;
  }
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    if (snap.exists() && snap.data()?.active === true) {
      location.replace("admin.html");
      return;
    }
    await logoutUser();
    alert("هذا الحساب ليس مديرًا نشطًا في FLORIN. أنشئ سجلًا في admins باستخدام UID الخاص بالمدير.");
  } catch (error) {
    console.error(error);
    await logoutUser().catch(() => {});
    alert(message(error));
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value || "";
  if (!email || !password) return alert("أدخل البريد الإلكتروني وكلمة المرور.");
  try {
    const user = await loginUser(email, password);
    await continueAfterLogin(user);
  } catch (error) {
    console.error(error);
    alert(message(error));
  }
});

google?.addEventListener("click", async () => {
  try {
    const user = await loginWithGoogle();
    await continueAfterLogin(user);
  } catch (error) {
    console.error(error);
    alert(message(error));
  }
});
