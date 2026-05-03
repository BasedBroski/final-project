(function () {
    const SESSION_KEY = "soyjakArcadeSession";
    const USERS_KEY = "soyjakArcadeUsers";
    const PROFILES_KEY = "soyjakArcadeProfiles";
    const DEMO_USER = {
        username: "player",
        password: "soy"
    };

    function readUsers() {
        try {
            const raw = localStorage.getItem(USERS_KEY);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
            return [];
        }
    }

    function writeUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function readProfiles() {
        try {
            const raw = localStorage.getItem(PROFILES_KEY);
            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : {};
        } catch (_error) {
            return {};
        }
    }

    function writeProfiles(profiles) {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    function readSession() {
        try {
            const raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) {
                return null;
            }

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed.username !== "string") {
                return null;
            }

            return parsed;
        } catch (_error) {
            return null;
        }
    }

    function writeSession(username) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            username,
            loggedInAt: new Date().toISOString()
        }));
    }

    function isLoggedIn() {
        return Boolean(readSession());
    }

    function getUser() {
        const session = readSession();
        return session ? session.username : null;
    }

    function login(username, password) {
        const normalized = (username || "").trim();

        if (normalized === DEMO_USER.username && password === DEMO_USER.password) {
            writeSession(normalized);
            return true;
        }

        const users = readUsers();
        const matched = users.find((user) => user.username === normalized && user.password === password);
        if (!matched) {
            return false;
        }

        writeSession(normalized);
        return true;
    }

    function register(username, password) {
        const normalized = (username || "").trim();

        if (!/^[A-Za-z0-9_-]{3,18}$/.test(normalized)) {
            return {
                ok: false,
                message: "Use 3-18 chars: letters, numbers, underscore, hyphen."
            };
        }

        if (normalized === DEMO_USER.username) {
            return {
                ok: false,
                message: "That username is reserved for the demo account."
            };
        }

        const users = readUsers();
        const exists = users.some((user) => user.username === normalized);
        if (exists) {
            return {
                ok: false,
                message: "Username already exists."
            };
        }

        users.push({
            username: normalized,
            password,
            createdAt: new Date().toISOString()
        });
        writeUsers(users);

        return { ok: true };
    }

    function getProfile(username) {
        if (!username) {
            return {};
        }

        const profiles = readProfiles();
        const profile = profiles[username];
        return profile && typeof profile === "object" ? profile : {};
    }

    function saveProfile(username, profile) {
        if (!username || !profile) {
            return;
        }

        const profiles = readProfiles();
        profiles[username] = {
            ...profile,
            updatedAt: new Date().toISOString()
        };
        writeProfiles(profiles);
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    function getLoginUrl() {
        return document.body.dataset.loginUrl || "html/login.html";
    }

    function getHomeUrl() {
        if (document.body.dataset.homeUrl) {
            return document.body.dataset.homeUrl;
        }

        const path = window.location.pathname.toLowerCase();
        return path.includes("/html/") ? "../index.html" : "index.html";
    }

    function redirectToLogin(targetPath) {
        const loginUrl = new URL(getLoginUrl(), window.location.href);
        const redirect = targetPath || `${window.location.pathname}${window.location.search}`;
        loginUrl.searchParams.set("redirect", redirect);
        window.location.assign(loginUrl.toString());
    }

    function requireLogin() {
        const requires = document.body.dataset.requireLogin === "true";
        if (!requires || isLoggedIn()) {
            return;
        }

        redirectToLogin(`${window.location.pathname}${window.location.search}`);
    }

    function updateAuthControls() {
        const userOutput = document.querySelector("[data-auth-user]");
        const loginLink = document.querySelector("[data-auth-login]");
        const signupLink = document.querySelector("[data-auth-signup]");
        const profileLink = document.querySelector("[data-auth-profile]");
        const logoutButton = document.querySelector("[data-auth-logout]");
        const username = getUser();
        const existingAvatar = document.querySelector("[data-auth-avatar]");

        if (userOutput) {
            userOutput.textContent = username ? `Signed in as ${username}` : "Not signed in";
        }

        if (userOutput) {
            if (!username) {
                if (existingAvatar) {
                    existingAvatar.remove();
                }
            } else {
                const profile = getProfile(username);
                const avatarUrl = profile && typeof profile.avatarUrl === "string" ? profile.avatarUrl : "";

                if (avatarUrl) {
                    const avatar = existingAvatar || document.createElement("img");
                    avatar.setAttribute("data-auth-avatar", "true");
                    avatar.alt = `${username} avatar`;
                    avatar.width = 28;
                    avatar.height = 28;
                    avatar.style.borderRadius = "50%";
                    avatar.style.objectFit = "cover";
                    avatar.style.border = "1px solid rgba(0, 0, 0, 0.15)";
                    avatar.style.marginLeft = "0.5rem";
                    avatar.style.marginRight = "0.5rem";
                    avatar.src = avatarUrl;

                    if (!existingAvatar) {
                        userOutput.parentNode.insertBefore(avatar, userOutput);
                    }
                } else if (existingAvatar) {
                    existingAvatar.remove();
                }
            }
        }

        if (loginLink) {
            loginLink.classList.toggle("d-none", Boolean(username));
        }

        if (signupLink) {
            signupLink.classList.toggle("d-none", Boolean(username));
        }

        if (profileLink) {
            profileLink.classList.toggle("d-none", !username);
        }

        if (logoutButton) {
            logoutButton.classList.toggle("d-none", !username);
        }
    }

    function setupProtectedLinks() {
        const links = document.querySelectorAll("[data-protected-link]");

        links.forEach((link) => {
            link.addEventListener("click", (event) => {
                if (isLoggedIn()) {
                    return;
                }

                event.preventDefault();
                const destination = new URL(link.getAttribute("href"), window.location.href);
                redirectToLogin(`${destination.pathname}${destination.search}`);
            });
        });
    }

    function setupLogoutButton() {
        const logoutButton = document.querySelector("[data-auth-logout]");
        if (!logoutButton) {
            return;
        }

        logoutButton.addEventListener("click", () => {
            logout();
            updateAuthControls();
            const homeUrl = new URL(getHomeUrl(), window.location.href);
            window.location.assign(homeUrl.toString());
        });
    }

    function getSafeRedirect(defaultPath) {
        const params = new URLSearchParams(window.location.search);
        const raw = params.get("redirect");

        if (!raw) {
            return defaultPath;
        }

        try {
            const url = new URL(raw, window.location.origin);
            if (url.origin !== window.location.origin) {
                return defaultPath;
            }

            return `${url.pathname}${url.search}${url.hash}`;
        } catch (_error) {
            return defaultPath;
        }
    }

    window.Auth = {
        isLoggedIn,
        getUser,
        login,
        register,
        logout,
        getProfile,
        saveProfile,
        requireLogin,
        redirectToLogin,
        updateAuthControls,
        getSafeRedirect
    };

    // Redirect immediately on protected pages so game scripts do not initialize first.
    requireLogin();

    document.addEventListener("DOMContentLoaded", () => {
        console.info("Login hint: username 'player' and password 'soy'.");
        setupProtectedLinks();
        setupLogoutButton();
        updateAuthControls();
    });
})();
