import { registerUser, loginWithGoogle } from "./auth.js";

const form = document.getElementById("registerForm");
const submit = form?.querySelector("button[type=submit]");

function message(error) {
  const code = error?.code || "";
  if (code === "auth/email-already-in-use") return "هذا البريد الإلكتروني مسجل بالفعل. استخدم تسجيل الدخول.";
  if (code === "auth/weak-password") return "كلمة المرور يجب أن تكون أقوى.";
  if (code === "auth/invalid-email") return "أدخل بريدًا إلكترونيًا صحيحًا.";
  if (code === "permission-denied") return "تم إنشاء الحساب، لكن تعذر حفظ ملف العميل. تأكد من نشر قواعد Firestore.";
  return error?.message || "تعذر إنشاء الحساب.";
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("fullName")?.value.trim();
  const email = document.getElementById("email")?.value.trim();
  const password = document.getElementById("password")?.value || "";
  const confirm = document.getElementById("confirmPassword")?.value || "";
  if (!name || !email || !password) return alert("أكمل جميع البيانات المطلوبة.");
  if (password !== confirm) return alert("كلمتا المرور غير متطابقتين.");
  if (submit) { submit.disabled = true; submit.textContent = "جارٍ إنشاء الحساب..."; }
  try {
    await registerUser(name, email, password);
    location.replace("profile.html");
  } catch (error) {
    console.error(error);
    alert(message(error));
    if (submit) { submit.disabled = false; submit.textContent = "إنشاء الحساب"; }
  }
});

document.getElementById("googleRegister")?.addEventListener("click", async () => {
  try {
    const user = await loginWithGoogle();
    location.replace("profile.html");
  } catch (error) {
    console.error(error);
    alert(message(error));
  }
});
