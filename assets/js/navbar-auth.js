import { authState, logoutUser } from "./auth.js";

/*==========================================================
NAVBAR AUTH
==========================================================*/

const loginLink = document.getElementById("loginLink");
const profileLink = document.getElementById("profileLink");
const logoutLink = document.getElementById("logoutLink");
const userName = document.getElementById("navUserName");

authState((user) => {

    if (user) {

        if (loginLink) {
            loginLink.style.display = "none";
        }

        if (profileLink) {
            profileLink.style.display = "inline-flex";
        }

        if (logoutLink) {
            logoutLink.style.display = "inline-flex";
        }

        if (userName) {
            userName.textContent = user.displayName || user.email;
        }

    } else {

        if (loginLink) {
            loginLink.style.display = "inline-flex";
        }

        if (profileLink) {
            profileLink.style.display = "none";
        }

        if (logoutLink) {
            logoutLink.style.display = "none";
        }

        if (userName) {
            userName.textContent = "";
        }

    }

});

/*==========================================================
LOGOUT
==========================================================*/

if (logoutLink) {

    logoutLink.addEventListener("click", async (event) => {

        event.preventDefault();

        try {

            await logoutUser();

            window.location.href = "index.html";

        }

        catch (error) {

            alert(error.message);

        }

    });

}
