document.addEventListener("DOMContentLoaded", () => {
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        return;
    }

    const usernameOutput = document.querySelector("#profile-username");
    const bioOutput = document.querySelector("#profile-bio");
    const avatarOutput = document.querySelector("#profile-avatar");
    const avatarPlaceholder = document.querySelector("#profile-avatar-placeholder");
    const twitterOutput = document.querySelector("#profile-twitter");
    const instagramOutput = document.querySelector("#profile-instagram");

    const username = window.Auth.getUser();
    if (usernameOutput) {
        usernameOutput.textContent = username;
    }

    const profile = window.Auth.getProfile(username);
    if (bioOutput) {
        bioOutput.textContent = profile.bio || "No bio saved yet.";
    }

    if (avatarOutput) {
        if (profile.avatarUrl) {
            avatarOutput.src = profile.avatarUrl;
            avatarOutput.style.display = "block";
            if (avatarPlaceholder) {
                avatarPlaceholder.style.display = "none";
            }
        } else {
            avatarOutput.style.display = "none";
            if (avatarPlaceholder) {
                avatarPlaceholder.style.display = "block";
            }
        }
    }

    const twitter = profile.social && profile.social.twitter ? profile.social.twitter : "";
    const instagram = profile.social && profile.social.instagram ? profile.social.instagram : "";

    if (twitterOutput) {
        if (twitter) {
            twitterOutput.href = twitter;
            twitterOutput.textContent = twitter;
        } else {
            twitterOutput.removeAttribute("href");
            twitterOutput.textContent = "Not set";
        }
    }

    if (instagramOutput) {
        if (instagram) {
            instagramOutput.href = instagram;
            instagramOutput.textContent = instagram;
        } else {
            instagramOutput.removeAttribute("href");
            instagramOutput.textContent = "Not set";
        }
    }
});
