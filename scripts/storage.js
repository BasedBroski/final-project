// File: storage.js - app script
const SETTINGS_KEY = "soyjakDanceSettings";
const HIGH_SCORE_KEY = "soyjakDanceHighScore";
const LEADERBOARD_KEY = "soyjakDanceLeaderboard";

// normalizeTheme: Handles normalize theme.
function normalizeTheme(theme) {
    switch (theme) {
        case "sunset":
            return "sneed";
        case "mint":
            return "downfall";
        case "mono":
            return "prom";
        case "arcade":
            return "odyssey";
        default:
            return theme || "sneed";
    }
}

export function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);

        if (!raw) {
            return {
                playerName: "",
                theme: "sneed"
            };
        }

        const parsed = JSON.parse(raw);

        return {
            playerName: parsed.playerName || "",
            theme: normalizeTheme(parsed.theme)
        };
    } catch (_error) {
        return {
            playerName: "",
            theme: "sneed"
        };
    }
}

export function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadHighScore() {
    const value = Number(localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(value) ? Math.max(0, value) : 0;
}

export function saveHighScore(score) {
    localStorage.setItem(HIGH_SCORE_KEY, String(Math.max(0, Math.floor(score))));
}

export function loadLeaderboard() {
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

export function addLeaderboardEntry(entry) {
    const entries = loadLeaderboard();
    entries.push(entry);
    entries.sort((a, b) => b.score - a.score);

    const topEntries = entries.slice(0, 10);
    sessionStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topEntries));
    return topEntries;
}

