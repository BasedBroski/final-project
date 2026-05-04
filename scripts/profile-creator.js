// File: profile-creator.js - app script
document.addEventListener("DOMContentLoaded", () => {
    if (!window.Auth || !window.Auth.isLoggedIn()) {
        return;
    }

    const picInput = document.querySelector("#profilePicInput");
    const picPreview = document.querySelector("#profilePicPreview");
    const creatorUsernameOutput = document.querySelector("#profile-creator-username");
    const descInput = document.querySelector("#profileDescription");
    const twitterInput = document.querySelector("#socialTwitter");
    const instaInput = document.querySelector("#socialInstagram");
    const saveBtn = document.querySelector("#saveProfile");
    const statusOutput = document.querySelector("#profile-creator-status");

    if (!picInput || !picPreview || !descInput || !twitterInput || !instaInput || !saveBtn) {
        return;
    }

    const username = window.Auth.getUser();
    if (creatorUsernameOutput) {
        creatorUsernameOutput.textContent = username;
    }

    const profile = window.Auth.getProfile(username);

    descInput.value = profile.bio || "";
    twitterInput.value = (profile.social && profile.social.twitter) || "";
    instaInput.value = (profile.social && profile.social.instagram) || "";

    if (profile.avatarUrl) {
        picPreview.src = profile.avatarUrl;
        picPreview.style.display = "block";
    } else {
        picPreview.style.display = "none";
    }

    picInput.addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            picPreview.src = readerEvent.target.result;
            picPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    });

    saveBtn.addEventListener("click", () => {
        const payload = {
            bio: descInput.value.trim(),
            avatarUrl: picPreview.getAttribute("src") || "",
            social: {
                twitter: twitterInput.value.trim(),
                instagram: instaInput.value.trim()
            }
        };

        console.info("Profile payload JSON:", JSON.stringify(payload));

        window.Auth.saveProfile(username, payload);

        if (statusOutput) {
            statusOutput.textContent = "Profile saved. Redirecting to profile display...";
        }

        window.setTimeout(() => {
            window.location.assign("profile.html");
        }, 300);
    });
});
