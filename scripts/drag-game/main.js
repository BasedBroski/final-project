// File: main.js - app script
import { DanceGame } from "./game.js";
import {
    addLeaderboardEntry,
    loadHighScore,
    loadLeaderboard,
    loadSettings,
    saveHighScore,
    saveSettings
} from "../storage.js";
import { initMusicPlayer } from "../music.js";
import { soyjakIdentityPool } from "./data.js";

const elements = {
    board: document.querySelector("#game-board"),
    actor: document.querySelector("#feraljak-actor"),
    scoreOutput: document.querySelector("#score-output"),
    highScoreOutput: document.querySelector("#high-score-output"),
    progressBar: document.querySelector("#score-progress"),
    statusOutput: document.querySelector("#status-message"),
    liveAnnouncer: document.querySelector("#live-announcer"),
    playerJakName: document.querySelector("#player-jak-name"),
    playerJakImage: document.querySelector("#player-jak-image"),
    recordScoreButton: document.querySelector("#record-score-btn"),
    viewLeaderboardButton: document.querySelector("#view-leaderboard-btn"),
    leaderboardList: document.querySelector("#leaderboard-list"),
    startButton: document.querySelector("#start-game"),
    resetButton: document.querySelector("#reset-game"),
    navPlayButton: document.querySelector("#nav-play"),
    navResetButton: document.querySelector("#nav-reset"),
    settingsForm: document.querySelector("#settings-form"),
    currentUserOutput: document.querySelector("#drag-current-user"),
    theme: document.querySelector("#theme"),
    audio: document.querySelector("#dance-audio"),
    trackSelect: document.querySelector("#track-select"),
    musicPlayToggle: document.querySelector("#music-play-toggle"),
    musicNext: document.querySelector("#music-next"),
    musicVolume: document.querySelector("#music-volume"),
    musicStatus: document.querySelector("#music-status"),
    nuLink: document.querySelector("#nu-validator-link"),
    waveLink: document.querySelector("#wave-link")
};

const game = new DanceGame({
    board: elements.board,
    actor: elements.actor,
    scoreOutput: elements.scoreOutput,
    highScoreOutput: elements.highScoreOutput,
    progressBar: elements.progressBar,
    statusOutput: elements.statusOutput,
    liveAnnouncer: elements.liveAnnouncer,
    onScore: saveHighScore
});

const selectedJak = pickRandomJak();
renderJakIdentity(selectedJak);
game.setPlayerJakName(selectedJak.name);
let isSneedSecretActive = false;

applyFooterValidationLinks();
renderCurrentUser();
setupSettings();
setupButtons();
setupMusic();
setupEasterEgg();
game.init();
game.setHighScore(loadHighScore());

// setupButtons: Handles setup buttons.
function setupButtons() {
    elements.startButton.addEventListener("click", () => {
        game.startRound();
    });

    elements.resetButton.addEventListener("click", () => {
        rerollJakIdentity();
        game.resetRound(false);
    });

    if (elements.navPlayButton) {
        elements.navPlayButton.addEventListener("click", () => {
            game.startRound();
            elements.board.focus();
        });
    }

    if (elements.navResetButton) {
        elements.navResetButton.addEventListener("click", () => {
            rerollJakIdentity();
            game.resetRound(false);
            elements.board.focus();
        });
    }

    elements.recordScoreButton.addEventListener("click", () => {
        const playerName = getCurrentPlayerName();
        const score = Number.parseInt(elements.scoreOutput.textContent || "0", 10);

        const snapshot = {
            playerName,
            score: Number.isFinite(score) ? Math.max(0, score) : 0,
            jakName: elements.playerJakName.textContent.trim(),
            recordedAt: new Date().toISOString()
        };

        addLeaderboardEntry(snapshot);
        game.statusOutput.textContent = `Recorded ${snapshot.playerName} with ${snapshot.score} points.`;
    });

    elements.viewLeaderboardButton.addEventListener("click", () => {
        renderLeaderboard();

        const modalElement = document.querySelector("#leaderboardModal");
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    });
}

// setupSettings: Handles setup settings.
function setupSettings() {
    const saved = loadSettings();

    elements.theme.value = saved.theme;

    applyTheme(saved.theme);

    elements.theme.addEventListener("change", () => {
        applyTheme(elements.theme.value);
    });

    elements.settingsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        elements.settingsForm.classList.add("was-validated");

        if (!elements.settingsForm.checkValidity()) {
            return;
        }

        const payload = {
            theme: elements.theme.value
        };

        saveSettings(payload);
        applyTheme(payload.theme);
        game.statusOutput.textContent = `${getCurrentPlayerName()}, your settings were saved.`;
    });
}

// applyTheme: Handles apply theme.
function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
}

// applyFooterValidationLinks: Handles apply footer validation links.
function applyFooterValidationLinks() {
    const currentUrl = `${window.location.origin}${window.location.pathname}`;
    const encoded = encodeURIComponent(currentUrl);

    elements.nuLink.href = `https://validator.w3.org/nu/?doc=${encoded}`;
    elements.waveLink.href = `https://wave.webaim.org/report#/${encoded}`;
}

// setupEasterEgg: Handles setup easter egg.
function setupEasterEgg() {
    console.info("Secret hint: run window.soyjakSecret() in the console.");

    window.soyjakSecret = () => {
        isSneedSecretActive = true;

        const sneedJak = {
            name: "Sneedjak",
            image: "images/sneed-imgs/sneedpfp.webp"
        };

        renderJakIdentity(sneedJak);
        game.setPlayerJakName(sneedJak.name);
        game.setActorOverrideImage("images/sneed-imgs/farmersneed.png");
        elements.actor.src = "images/sneed-imgs/farmersneed.png";
        document.body.setAttribute("data-secret-theme", "sneed");
        game.statusOutput.textContent = "Sneed secret unleashed.";
        return "Sneed mode activated.";
    };
}

// pickRandomJak: Handles pick random jak.
function pickRandomJak() {
    const pool = soyjakIdentityPool.filter((entry) => typeof entry.image === "string" && entry.image.startsWith("images/soyjak-imgs/"));

    if (pool.length === 0) {
        return {
            name: "Mysteryjak",
            image: "images/soyjak-imgs/soyjak.png"
        };
    }

    const index = Math.floor(Math.random() * pool.length);
    return pool[index];
}

// renderJakIdentity: Handles render jak identity.
function renderJakIdentity(jak) {
    elements.playerJakName.textContent = jak.name;
    elements.playerJakImage.src = jak.image;
    elements.playerJakImage.alt = `${jak.name} avatar`;
}

// rerollJakIdentity: Handles reroll jak identity.
function rerollJakIdentity() {
    if (isSneedSecretActive) {
        return;
    }

    const newJak = pickRandomJak();
    renderJakIdentity(newJak);
    game.setPlayerJakName(newJak.name);
}

// renderLeaderboard: Handles render leaderboard.
function renderLeaderboard() {
    const entries = loadLeaderboard();
    elements.leaderboardList.innerHTML = "";

    if (entries.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.textContent = "No scores recorded yet for this session.";
        elements.leaderboardList.append(emptyItem);
        return;
    }

    entries.forEach((entry) => {
        const item = document.createElement("li");
        item.textContent = `${entry.playerName} - ${entry.score} pts (${entry.jakName})`;
        elements.leaderboardList.append(item);
    });
}

// getCurrentPlayerName: Handles get current player name.
function getCurrentPlayerName() {
    const authName = window.Auth && typeof window.Auth.getUser === "function"
        ? window.Auth.getUser()
        : null;

    return authName || "Anonymous Jak";
}

// renderCurrentUser: Handles render current user.
function renderCurrentUser() {
    if (!elements.currentUserOutput) {
        return;
    }

    const authName = window.Auth && typeof window.Auth.getUser === "function"
        ? window.Auth.getUser()
        : null;

    elements.currentUserOutput.textContent = authName || "Guest";
}

// setupMusic: Handles setup music.
function setupMusic() {
    initMusicPlayer({
        audio: elements.audio,
        select: elements.trackSelect,
        playButton: elements.musicPlayToggle,
        nextButton: elements.musicNext,
        volume: elements.musicVolume,
        status: elements.musicStatus
    });
}

