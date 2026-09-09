import {
    registerUser,
    loginWithGoogle
} from "./auth.js";

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

            const user = await loginWithGoogle();

            await saveUser(user);

            window.location.href = "profile.html";

        }

        catch (error) {

            alert(error.message);

        }

    });

}
