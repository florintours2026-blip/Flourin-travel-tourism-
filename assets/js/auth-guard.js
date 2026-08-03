import { authState } from "./auth.js";

/*==========================================================
AUTH GUARD
==========================================================*/

authState((user) => {

    if (!user) {

        window.location.replace("login.html");

        return;

    }

    console.log("User Logged In:", user.email);

});
