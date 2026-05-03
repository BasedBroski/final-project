import { difficultyPresets } from "./data.js";
import { ChaseGame } from "./game.js";
import { initMusicPlayer } from "../music.js";

const HIGH_SCORE_KEY = "chaseGameHighScore";
const SETTINGS_KEY = "chaseGameSettings";
const LEADERBOARD_KEY = "chaseGameLeaderboard";

const elements = {
    board: document.querySelector("#chase-board"),
    player: document.querySelector("#player-entity"),
    bot: document.querySelector("#bot-entity"),
    scoreOutput: document.querySelector("#chase-score-output"),
    highScoreOutput: document.querySelector("#chase-high-score-output"),
    statusOutput: document.querySelector("#chase-status"),
    liveAnnouncer: document.querySelector("#chase-live-announcer"),
    startButton: document.querySelector("#start-chase"),
    resetButton: document.querySelector("#reset-chase"),
    recordScoreButton: document.querySelector("#record-chase-score-btn"),
    viewLeaderboardButton: document.querySelector("#view-chase-leaderboard-btn"),
    leaderboardList: document.querySelector("#chase-leaderboard-list"),
    settingsForm: document.querySelector("#chase-settings-form"),
    currentUserOutput: document.querySelector("#chase-current-user"),
    theme: document.querySelector("#chase-theme"),
    difficulty: document.querySelector("#chase-difficulty"),
    audio: document.querySelector("#dance-audio"),
    trackSelect: document.querySelector("#track-select"),
    musicPlayToggle: document.querySelector("#music-play-toggle"),
    musicNext: document.querySelector("#music-next"),
    musicVolume: document.querySelector("#music-volume"),
    musicStatus: document.querySelector("#music-status"),
    nuLink: document.querySelector("#nu-validator-link"),
    waveLink: document.querySelector("#wave-link")
};

const game = new ChaseGame({
    board: elements.board,
    player: elements.player,
    bot: elements.bot,
    scoreOutput: elements.scoreOutput,
    highScoreOutput: elements.highScoreOutput,
    statusOutput: elements.statusOutput,
    liveAnnouncer: elements.liveAnnouncer
});

setupDifficultySelect();
renderCurrentUser();
setupSettings();
setupButtons();
setupKeyboardControls();
setupMusic();
applyFooterValidationLinks();
loadHighScore();
game.init();

function setupDifficultySelect() {
    difficultyPresets.forEach((preset, index) => {
        const option = document.createElement("option");
        option.value = preset.id;
        option.textContent = preset.label;

        if (index === 1) {
            option.selected = true;
        }

        elements.difficulty.append(option);
    });

    const selected = getSelectedDifficulty();
    game.setDifficulty(selected);

    elements.difficulty.addEventListener("change", () => {
        const preset = getSelectedDifficulty();
        game.setDifficulty(preset);
    });
}

function setupSettings() {
    const saved = loadChaseSettings();

    elements.theme.value = saved.theme;

    if (saved.difficulty && difficultyPresets.some((preset) => preset.id === saved.difficulty)) {
        elements.difficulty.value = saved.difficulty;
    }

    applyTheme(elements.theme.value);
    game.setDifficulty(getSelectedDifficulty());

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
            theme: elements.theme.value,
            difficulty: elements.difficulty.value
        };

        saveChaseSettings(payload);
        applyTheme(payload.theme);
        game.setDifficulty(getSelectedDifficulty());
        elements.statusOutput.textContent = `${getCurrentPlayerName()}, your settings were saved.`;
    });
}

function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme || "odyssey");
}

function setupButtons() {
    elements.startButton.addEventListener("click", () => {
        game.start();
        elements.board.focus();
    });

    elements.resetButton.addEventListener("click", () => {
        game.reset();
    });

    elements.recordScoreButton.addEventListener("click", () => {
        const playerName = getCurrentPlayerName();
        const score = Number.parseInt(elements.scoreOutput.textContent || "0", 10);

        const snapshot = {
            playerName,
            score: Number.isFinite(score) ? Math.max(0, score) : 0,
            difficulty: getSelectedDifficulty().label,
            recordedAt: new Date().toISOString()
        };

        addLeaderboardEntry(snapshot);
        elements.statusOutput.textContent = `Recorded ${snapshot.playerName} with ${snapshot.score} points.`;
    });

    elements.viewLeaderboardButton.addEventListener("click", () => {
        renderLeaderboard();

        const modalElement = document.querySelector("#chaseLeaderboardModal");
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.show();
    });

    window.addEventListener("beforeunload", () => {
        saveHighScore(Number.parseInt(elements.highScoreOutput.textContent || "0", 10));
    });
}

function setupKeyboardControls() {
    const map = {
        ArrowUp: "up",
        KeyW: "up",
        ArrowDown: "down",
        KeyS: "down",
        ArrowLeft: "left",
        KeyA: "left",
        ArrowRight: "right",
        KeyD: "right"
    };

    window.addEventListener("keydown", (event) => {
        const direction = map[event.code];
        if (!direction) {
            return;
        }

        event.preventDefault();
        game.setInput(direction, true);
    });

    window.addEventListener("keyup", (event) => {
        const direction = map[event.code];
        if (!direction) {
            return;
        }

        event.preventDefault();
        game.setInput(direction, false);
    });
}

function getSelectedDifficulty() {
    const selectedId = elements.difficulty.value;
    return difficultyPresets.find((preset) => preset.id === selectedId) || difficultyPresets[0];
}

function loadHighScore() {
    const raw = Number(localStorage.getItem(HIGH_SCORE_KEY));
    const score = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    game.setHighScore(score);
}

function saveHighScore(score) {
    localStorage.setItem(HIGH_SCORE_KEY, String(Math.max(0, Math.floor(score))));
}

function loadChaseSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return {
                theme: "odyssey",
                difficulty: "normal"
            };
        }

        const parsed = JSON.parse(raw);
        const difficultyMap = {
            rookie: "easy",
            classic: "normal",
            insane: "hard"
        };
        const normalizedDifficulty = difficultyMap[parsed.difficulty] || parsed.difficulty;

        return {
            theme: parsed.theme || "odyssey",
            difficulty: normalizedDifficulty || "normal"
        };
    } catch (_error) {
        return {
            theme: "odyssey",
            difficulty: "normal"
        };
    }
}

function saveChaseSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadLeaderboard() {
    try {
        const raw = sessionStorage.getItem(LEADERBOARD_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        return [];
    }
}

function addLeaderboardEntry(entry) {
    const entries = loadLeaderboard();
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);

    const topEntries = entries.slice(0, 10);
    sessionStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topEntries));
    return topEntries;
}

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
        item.textContent = `${entry.playerName} - ${entry.score} pts (${entry.difficulty})`;
        elements.leaderboardList.append(item);
    });
}

function getCurrentPlayerName() {
    const authName = window.Auth && typeof window.Auth.getUser === "function"
        ? window.Auth.getUser()
        : null;

    return authName || "Anonymous Runner";
}

function renderCurrentUser() {
    if (!elements.currentUserOutput) {
        return;
    }

    const authName = window.Auth && typeof window.Auth.getUser === "function"
        ? window.Auth.getUser()
        : null;

    elements.currentUserOutput.textContent = authName || "Guest";
}

function applyFooterValidationLinks() {
    const currentUrl = `${window.location.origin}${window.location.pathname}`;
    const encoded = encodeURIComponent(currentUrl);

    elements.nuLink.href = `https://validator.w3.org/nu/?doc=${encoded}`;
    elements.waveLink.href = `https://wave.webaim.org/report#/${encoded}`;
}

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
