document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#signup-form");
    const usernameInput = document.querySelector("#username");
    const passwordInput = document.querySelector("#password");
    const confirmInput = document.querySelector("#confirm-password");
    const signupError = document.querySelector("#signup-error");

    if (!form || !usernameInput || !passwordInput || !confirmInput || !window.Auth) {
        return;
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmInput.value;

        if (!username || !password || !confirmPassword) {
            if (signupError) {
                signupError.textContent = "Fill out all fields.";
            }
            return;
        }

        if (username.length < 3) {
            if (signupError) {
                signupError.textContent = "Username must be at least 3 characters.";
            }
            return;
        }

        if (password.length < 4) {
            if (signupError) {
                signupError.textContent = "Password must be at least 4 characters.";
            }
            return;
        }

        if (password !== confirmPassword) {
            if (signupError) {
                signupError.textContent = "Passwords do not match.";
            }
            return;
        }

        const result = window.Auth.register(username, password);
        if (!result.ok) {
            if (signupError) {
                signupError.textContent = result.message || "Could not create account.";
            }
            return;
        }

        const loginUrl = new URL("login.html", window.location.href);
        loginUrl.searchParams.set("redirect", "../index.html");
        window.location.assign(loginUrl.toString());
    });
});
