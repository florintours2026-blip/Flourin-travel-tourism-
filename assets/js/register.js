import {
    registerUser,
    loginWithGoogle,
    getGoogleRedirectResult
} from "./auth.js";

import { saveUser } from "./database.js";

/*==========================================================
FLORIN REGISTER
==========================================================*/

const registerForm = document.getElementById("registerForm");

/* Google redirect result */
(async () => {
    try {
        const user = await getGoogleRedirectResult();
        if (user) {
            await saveUser(user);
            window.location.href = "profile.html";
        }
    } catch (error) {
        console.error("Google redirect:", error);
    }
})();

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("كلمتا المرور غير متطابقتين.");
            return;
        }

        if (password.length < 6) {
            alert("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
            return;
        }

        const button = registerForm.querySelector("button[type=submit]");
        if (button) {
            button.disabled = true;
            button.textContent = "جاري إنشاء الحساب...";
        }

        try {
            const user = await registerUser(fullName, email, password);
            await saveUser(user);
            alert("تم إنشاء الحساب بنجاح.");
            window.location.href = "profile.html";
        } catch (error) {
            console.error(error);
            const messages = {
                "auth/email-already-in-use": "البريد الإلكتروني مستخدم بالفعل.",
                "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
                "auth/weak-password": "كلمة المرور ضعيفة جدًا."
            };
            alert(messages[error.code] || error.message);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "إنشاء حساب";
            }
        }
    });
}

/*==========================================================
GOOGLE REGISTER
==========================================================*/

const googleRegister = document.getElementById("googleRegister");

if (googleRegister) {
    googleRegister.addEventListener("click", async () => {
        try {
            const user = await loginWithGoogle();
            if (user) {
                await saveUser(user);
                window.location.href = "profile.html";
            }
            /* على الجوال يتم redirect تلقائيًا */
        } catch (error) {
            console.error(error);
            alert(error.message || "تعذر التسجيل بحساب Google.");
        }
    });
}
