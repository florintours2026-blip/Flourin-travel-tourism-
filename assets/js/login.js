import {
    loginUser,
    loginWithGoogle
} from "./auth.js";

/*==========================================================
LOGIN FORM
==========================================================*/

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();

        const password = document.getElementById("password").value;

        try {

            await loginUser(email, password);

            alert("Welcome to FLORIN Travel!");

            window.location.href = "index.html";

        }

        catch (error) {

            switch (error.code) {

                case "auth/invalid-credential":
                    alert("Incorrect email or password.");
                    break;

                case "auth/user-not-found":
                    alert("Account not found.");
                    break;

                case "auth/wrong-password":
                    alert("Incorrect password.");
                    break;

                case "auth/too-many-requests":
                    alert("Too many attempts. Please try again later.");
                    break;

                default:
                    alert(error.message);

            }

        }

    });

}

/*==========================================================
GOOGLE LOGIN
==========================================================*/

const googleLogin = document.getElementById("googleLogin");

if (googleLogin) {

    googleLogin.addEventListener("click", async () => {

        try {

            await loginWithGoogle();

            window.location.href = "index.html";

        }

        catch (error) {

            alert(error.message);

        }

    });

}
