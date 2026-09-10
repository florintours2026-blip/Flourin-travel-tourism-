import {
    registerUser,
    loginWithGoogle
} from "./auth.js";

import { auth } from "./firebase-config.js";
import { getRedirectResult, signInWithRedirect, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

import {
    saveUser
} from "./database.js";

/*==========================================================
REGISTER FORM
==========================================================*/

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();

        const email = document.getElementById("email").value.trim();

        const password = document.getElementById("password").value;

        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;

        }

        try {

            const user = await registerUser(
                fullName,
                email,
                password
            );

            await saveUser(user);

            alert("Account created successfully.");

            window.location.href = "profile.html";

        }

        catch (error) {

            alert(error.message);

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
            await signInWithRedirect(auth, googleProvider);
        } catch (error) {
            alert(error.message);
        }

    });

}


getRedirectResult(auth).then(async result => {
    if (!result?.user) return;
    try {
        await saveUser(result.user);
        window.location.href = "profile.html";
    } catch (error) {
        alert("تم تسجيل الدخول إلى Google لكن تعذر إنشاء ملف الحساب: " + error.message);
    }
}).catch(error => {
    console.error("Google redirect error", error);
    if (error?.code) alert(error.message);
});
