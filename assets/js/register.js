import {
    registerUser,
    loginWithGoogle
} from "./auth.js";

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

            await registerUser(
                fullName,
                email,
                password
            );

            alert("Account created successfully.");

            window.location.href = "index.html";

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

            await loginWithGoogle();

            window.location.href = "index.html";

        }

        catch (error) {

            alert(error.message);

        }

    });

}
