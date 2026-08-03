import { authState, logoutUser } from "./auth.js";

/*==========================================================
PROFILE PAGE
==========================================================*/

const userName = document.getElementById("userName");

const userEmail = document.getElementById("userEmail");

const profileAvatar = document.querySelector(".profile-avatar");

const logoutBtn = document.getElementById("logoutBtn");

/*==========================================================
LOAD USER DATA
==========================================================*/

authState((user) => {

    if (!user) return;

    userName.textContent = user.displayName || "FLORIN Traveler";

    userEmail.textContent = user.email;

    if (user.photoURL) {

        profileAvatar.src = user.photoURL;

    }

});

/*==========================================================
LOGOUT
==========================================================*/

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            await logoutUser();

            alert("You have been logged out successfully.");

            window.location.href = "login.html";

        }

        catch (error) {

            alert(error.message);

        }

    });

}
