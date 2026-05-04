// File: auth.js - app script
(function () {
    const SESSION_KEY = "soyjakArcadeSession";
    const USERS_KEY = "soyjakArcadeUsers";
    const PROFILES_KEY = "soyjakArcadeProfiles";
    const DEMO_USER = {
        username: "player",
        password: "soy"
    };

    // readUsers: Handles read users.
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

    // writeUsers: Handles write users.
    function writeUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    // readProfiles: Handles read profiles.
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

    // writeProfiles: Handles write profiles.
    function writeProfiles(profiles) {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    }

    // readSession: Handles read session.
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

    // writeSession: Handles write session.
    function writeSession(username) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            username,
            loggedInAt: new Date().toISOString()
        }));
    }

    // isLoggedIn: Handles is logged in.
    function isLoggedIn() {
        return Boolean(readSession());
    }

    // getUser: Handles get user.
    function getUser() {
        const session = readSession();
        return session ? session.username : null;
    }

    // login: Handles login.
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

    // register: Handles register.
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

    // getProfile: Handles get profile.
    function getProfile(username) {
        if (!username) {
            return {};
        }

        const profiles = readProfiles();
        const profile = profiles[username];
        return profile && typeof profile === "object" ? profile : {};
    }

    // saveProfile: Handles save profile.
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

    // logout: Handles logout.
    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
    }

    // getLoginUrl: Handles get login url.
    function getLoginUrl() {
        return document.body.dataset.loginUrl || "html/login.html";
    }

    // getHomeUrl: Handles get home url.
    function getHomeUrl() {
        if (document.body.dataset.homeUrl) {
            return document.body.dataset.homeUrl;
        }

        const path = window.location.pathname.toLowerCase();
        return path.includes("/html/") ? "../index.html" : "index.html";
    }

    // redirectToLogin: Handles redirect to login.
    function redirectToLogin(targetPath) {
        const loginUrl = new URL(getLoginUrl(), window.location.href);
        const redirect = targetPath || `${window.location.pathname}${window.location.search}`;
        loginUrl.searchParams.set("redirect", redirect);
        window.location.assign(loginUrl.toString());
    }

    // requireLogin: Handles require login.
    function requireLogin() {
        const requires = document.body.dataset.requireLogin === "true";
        if (!requires || isLoggedIn()) {
            return;
        }

        redirectToLogin(`${window.location.pathname}${window.location.search}`);
    }

    // updateAuthControls: Handles update auth controls.
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

    // setupProtectedLinks: Handles setup protected links.
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

    // setupLogoutButton: Handles setup logout button.
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

    // updateValidationLinks: Handles update validation links.
    function updateValidationLinks() {
        if (document.body.dataset.disableValidationLinks === "true") {
            return;
        }

        const nuLink = document.querySelector("#nu-validator-link");
        const waveLink = document.querySelector("#wave-link");

        if (!nuLink && !waveLink) {
            return;
        }

        const currentUrl = new URL(window.location.href);
        currentUrl.hash = "";
        const encoded = encodeURIComponent(currentUrl.toString());

        if (nuLink) {
            nuLink.href = `https://validator.w3.org/nu/?doc=${encoded}`;
        }

        if (waveLink) {
            waveLink.href = `https://wave.webaim.org/report#/${currentUrl.toString()}`;
        }
    }

    // getSafeRedirect: Handles get safe redirect.
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
        updateValidationLinks();
        updateAuthControls();
    });
})();

