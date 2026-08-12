import {
    loginUser,
    loginWithGoogle
} from "./auth.js";

import { db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/*==========================================================
  EMAIL / PASSWORD LOGIN
==========================================================*/

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {

            alert("Please enter your email and password.");

            return;
        }

        try {

            /*
             * Login with Firebase Authentication
             */

            const user = await loginUser(email, password);


            /*
             * Check whether the logged-in user
             * is an active FLORIN administrator.
             */

            const adminRef = doc(db, "admins", user.uid);

            const adminSnap = await getDoc(adminRef);


            /*
             * ADMIN USER
             */

            if (
                adminSnap.exists() &&
                adminSnap.data().active === true
            ) {

                alert("Welcome to FLORIN Admin Panel!");

                window.location.href = "admin.html";

                return;
            }


            /*
             * NORMAL USER
             */

            alert("Welcome to FLORIN Travel!");

            window.location.href = "index.html";

        }

        catch (error) {

            console.error("Login error:", error);


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


                case "auth/invalid-email":

                    alert("Please enter a valid email address.");

                    break;


                case "auth/too-many-requests":

                    alert(
                        "Too many login attempts. Please try again later."
                    );

                    break;


                case "auth/user-disabled":

                    alert("This account has been disabled.");

                    break;


                default:

                    alert(
                        error.message ||
                        "Unable to login. Please try again."
                    );

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

            /*
             * Login using Google Authentication.
             */

            const user = await loginWithGoogle();


            /*
             * Check whether the Google account
             * is an active FLORIN administrator.
             */

            const adminRef = doc(db, "admins", user.uid);

            const adminSnap = await getDoc(adminRef);


            /*
             * GOOGLE ADMIN
             */

            if (
                adminSnap.exists() &&
                adminSnap.data().active === true
            ) {

                alert("Welcome to FLORIN Admin Panel!");

                window.location.href = "admin.html";

                return;
            }


            /*
             * NORMAL GOOGLE USER
             */

            alert("Welcome to FLORIN Travel!");

            window.location.href = "index.html";

        }

        catch (error) {

            console.error("Google login error:", error);

            alert(
                error.message ||
                "Google login failed. Please try again."
            );

        }

    });

    }
