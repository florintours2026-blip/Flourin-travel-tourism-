import { authState, logoutUser } from "./auth.js";

const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");
const profileLink = document.getElementById("profileLink");
const logoutLink = document.getElementById("logoutLink");
const userName = document.getElementById("navUserName");
const welcomeUser = document.getElementById("welcomeUser");

function setVisible(el, visible) {
    if (el) el.style.display = visible ? "inline-flex" : "none";
}

authState((user) => {
    const loggedIn = !!user;
    setVisible(loginLink, !loggedIn);
    setVisible(registerLink, !loggedIn);
    setVisible(profileLink, loggedIn);
    setVisible(logoutLink, loggedIn);

    if (loggedIn) {
        const name = (user.displayName || user.email?.split("@")[0] || "عميل").trim();
        if (userName) userName.textContent = `مرحبًا ${name}`;
        if (welcomeUser) welcomeUser.textContent = `مرحبًا ${name}`;
    } else {
        if (userName) userName.textContent = "";
        if (welcomeUser) welcomeUser.textContent = "";
    }
});

logoutLink?.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
        await logoutUser();
        window.location.href = "index.html";
    } catch (error) {
        console.error("Logout error:", error);
        alert(error?.message || "تعذر تسجيل الخروج");
    }
});
