import { resetPassword } from "./auth.js";

/*==========================================================
FORGOT PASSWORD
==========================================================*/

const forgotForm = document.getElementById("forgotForm");

if (forgotForm) {

    forgotForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.getElementById("email").value.trim();

        try {

            await resetPassword(email);

            alert("Password reset email has been sent successfully.");

            window.location.href = "login.html";

        }

        catch (error) {

            switch (error.code) {

                case "auth/user-not-found":
                    alert("No account found with this email.");
                    break;

                case "auth/invalid-email":
                    alert("Please enter a valid email address.");
                    break;

                default:
                    alert(error.message);

            }

        }

    });

}
