document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#login-form");
    const usernameInput = document.querySelector("#username");
    const passwordInput = document.querySelector("#password");
    const loginError = document.querySelector("#login-error");
    const togglePasswordButton = document.querySelector("#toggle-password");

    if (!form || !usernameInput || !passwordInput || !window.Auth) {
        return;
    }

    if (window.Auth.isLoggedIn()) {
        const destination = window.Auth.getSafeRedirect("../index.html");
        window.location.assign(destination);
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
            if (loginError) {
                loginError.textContent = "Enter both username and password.";
            }
            return;
        }

        const success = window.Auth.login(username, password);
        if (!success) {
            if (loginError) {
                loginError.textContent = "Invalid login. Check your credentials or create an account from Sign Up.";
            }
            return;
        }

        const destination = window.Auth.getSafeRedirect("../index.html");
        window.location.assign(destination);
    });

    if (togglePasswordButton) {
        togglePasswordButton.addEventListener("click", () => {
            const shouldShow = passwordInput.type === "password";
            passwordInput.type = shouldShow ? "text" : "password";
            togglePasswordButton.textContent = shouldShow ? "Hide" : "Show";
        });
    }
});
