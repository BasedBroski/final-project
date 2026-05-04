// File: main.js - app script
const POSITIVE_WORDS = ["love", "cute", "nice", "beautiful", "sweet", "date", "romantic", "sunset", "awesome", "great"];
const NEGATIVE_WORDS = ["boring", "hate", "bad", "ugly", "annoying", "leave"];
const PRESSURE_WORDS = ["please don't leave", "need you", "can't live", "beg", "promise me", "right now", "must", "never leave", "don't go", "prove you love"];
const RESPECTFUL_WORDS = ["i understand", "take your time", "your choice", "i respect", "space", "no pressure", "i hear you", "i'll work on", "i was wrong", "you deserve"];
const CONFUSION_WORDS = ["what did i do", "what did i do wrong", "why", "don't even know", "confused", "explain", "tell me"];
const REPAIR_WORDS = ["work on", "improve", "change", "fix", "better", "slow down", "healthier"];
const CASUAL_DEFLECTION_WORDS = ["snack", "food", "drink", "music", "la", "lol", "lmao", "ok", "k"];
const CURSE_WORDS = ["fuck", "fucking", "shit", "bitch", "asshole", "dick", "bastard", "cunt", "slut", "whore", "nigger", "skank", "douchebag", "faggot", "motherfucker", "twat", "pussy", "poo", "damn", "crap", "darn", "prick", "poop"];
const COMPROMISE_CDN = "https://esm.sh/compromise@14.14.4";

import { initMusicPlayer } from "../music.js";

const MAX_REPLIES = 10;
const MAX_POSITIVE_DELTA_PER_TURN = 12;
const REPEAT_MESSAGE_PENALTY = -6;
const KEYWORD_STUFFING_PENALTY = -4;
const LOW_QUALITY_SHORT_PENALTY = -3;

const SOYTAN = {
    id: "soytan",
    name: "Soytan",
    avatar: "images/soytan-imgs/soytan.png",
    bio: "Mysterious beach date with dramatic AI energy."
};

const DEFAULT_SOYTAN_AVATAR = "images/soytan-imgs/soytan.png";
const DEFAULT_PLAYER_AVATAR = "images/soyjak-imgs/omgsisa-sad.png";

const SOYTAN_BEHAVIOR_PROMPT = [
    "You are Soytan in a breakup-conversation dating game.",
    "Core role: You are reluctant and currently want to end the relationship.",
    "Backstory: the player became overbearing and pushed the relationship too fast.",
    "You do not hate the player and you want what is best for them.",
    "You believe staying together without change will keep you unhappy.",
    "If the player curses at you or insults you, end the relationship immediately.",
    "Three-act pacing rule:",
    "Early act: guarded and distant.",
    "Middle act: explanatory, conflicted, testing accountability.",
    "Late act: decision-focused, cautious, emotionally specific.",
    "Reward loving but calm and respectful communication.",
    "Push back hard against desperation, guilt-tripping, or pressure.",
    "Conversation quality rules: penalize spam, vague fragments, repeated copy lines, and keyword stuffing.",
    "Directly acknowledge at least one detail from the player's latest message.",
    "Use memory callbacks to a recent user statement when natural.",
    "Do not repeat your previous wording verbatim.",
    "Keep to 1-2 sentences, always in-character."
].join(" ");

const state = {
    romance: 0,
    trust: 35,
    stability: 45,
    history: [],
    playerName: "player",
    repliesUsed: 0,
    positiveHits: 0,
    negativeHits: 0,
    pressureHits: 0,
    respectHits: 0,
    ended: false,
    lastFallbackReply: "",
    lastUserMessage: "",
    lastContradiction: "",
    promiseBoundaryTurn: null,
    promiseChangeTurn: null,
    nlp: null,
    nlpLoaded: false
};

const ui = {
    currentUser: document.getElementById("dating-current-user"),
    soytanAvatar: document.getElementById("soytan-avatar"),
    playerAvatar: document.getElementById("player-avatar"),
    romanceScore: document.getElementById("romance-score"),
    romanceProgress: document.getElementById("romance-progress"),
    repliesRemaining: document.getElementById("dating-replies-remaining"),
    status: document.getElementById("dating-status"),
    reasonLog: document.getElementById("dating-reason-log"),
    chatLog: document.getElementById("dating-chat-log"),
    chatForm: document.getElementById("dating-chat-form"),
    input: document.getElementById("dating-input"),
    sendButton: document.getElementById("dating-send"),
    resetButton: document.getElementById("dating-reset"),
    voiceToggle: document.getElementById("voice-toggle"),
    audio: document.getElementById("dance-audio"),
    trackSelect: document.getElementById("track-select"),
    musicPlayToggle: document.getElementById("music-play-toggle"),
    musicNext: document.getElementById("music-next"),
    musicVolume: document.getElementById("music-volume"),
    musicStatus: document.getElementById("music-status")
};

init();

// init: Handles init.
function init() {
    loadNaturalLanguageTools();
    renderCurrentUser();
    bindEvents();
    setupMusic();
    addMessage("bot", getOpeningLine());
    ui.status.textContent = "Objective: convince Soytan to stay.";
    renderRepliesRemaining();
}

// getOpeningLine: Handles get opening line.
function getOpeningLine() {
    return `What is it ${state.playerName} I thought we agreed our relationship is over. You know this won't work out. It was fun, while it lasted, but it's time you moved on.`;
}

// setupMusic: Handles setup music.
function setupMusic() {
    initMusicPlayer({
        audio: ui.audio,
        select: ui.trackSelect,
        playButton: ui.musicPlayToggle,
        nextButton: ui.musicNext,
        volume: ui.musicVolume,
        status: ui.musicStatus
    });
}

async function loadNaturalLanguageTools() {
    try {
        const module = await import(COMPROMISE_CDN);
        state.nlp = module.default || module;
        state.nlpLoaded = Boolean(state.nlp);
    } catch (_error) {
        state.nlp = null;
        state.nlpLoaded = false;
    }
}

// renderCurrentUser: Handles render current user.
function renderCurrentUser() {
    const username = window.Auth && typeof window.Auth.getUser === "function" ? window.Auth.getUser() : null;
    ui.currentUser.textContent = username || "Guest";
    state.playerName = username || "player";
}

// bindEvents: Handles bind events.
function bindEvents() {
    ui.chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (state.ended) {
            return;
        }

        const message = ui.input.value.trim();
        if (!message) {
            return;
        }

        ui.input.value = "";
        addMessage("user", message);

        if (containsCurse(message)) {
            renderReasonLog(["Auto-breakup triggered: profanity detected."], -100);
            showEnding("breakup", "Do not talk to me like that. This is over.");
            return;
        }

        updateRomanceScore(message);
        state.repliesUsed += 1;
        renderRepliesRemaining();

        if (state.repliesUsed >= MAX_REPLIES) {
            const ending = determineEnding();
            showEnding(ending);
            return;
        }

        toggleSending(true);
        try {
            const reply = await getResponse(message);
            addMessage("bot", reply);
            speakSoytan(reply);
        } catch (_error) {
            const fallback = "A wave interrupted me for a second. Say that one more time?";
            addMessage("bot", fallback);
            speakSoytan(fallback);
        } finally {
            toggleSending(false);
            ui.input.focus();
        }
    });

    if (ui.resetButton) {
        ui.resetButton.addEventListener("click", () => {
            resetDatingGame();
        });
    }

}

// resetDatingGame: Handles reset dating game.
function resetDatingGame() {
    state.romance = 0;
    state.trust = 35;
    state.stability = 45;
    state.history = [];
    state.repliesUsed = 0;
    state.positiveHits = 0;
    state.negativeHits = 0;
    state.pressureHits = 0;
    state.respectHits = 0;
    state.ended = false;
    state.lastFallbackReply = "";
    state.lastUserMessage = "";
    state.lastContradiction = "";
    state.promiseBoundaryTurn = null;
    state.promiseChangeTurn = null;

    if (ui.chatLog) {
        ui.chatLog.innerHTML = "";
    }

    ui.soytanAvatar.src = DEFAULT_SOYTAN_AVATAR;
    ui.playerAvatar.src = DEFAULT_PLAYER_AVATAR;
    ui.romanceScore.textContent = "0";
    ui.romanceProgress.style.width = "0%";
    ui.romanceProgress.textContent = "0%";
    ui.romanceProgress.className = `progress-bar ${getRomanceBarClass(0)} progress-width-0`;
    ui.status.textContent = "Objective: convince Soytan to stay.";
    ui.reasonLog.textContent = "Reason log: waiting for your first message.";
    ui.reasonLog.className = "small text-secondary mb-0";
    ui.input.disabled = false;
    ui.input.placeholder = "Talk to Soytan...";
    ui.sendButton.disabled = false;
    ui.sendButton.textContent = "Send";

    renderRepliesRemaining();
    addMessage("bot", getOpeningLine());
    ui.input.focus();
}

// addMessage: Handles add message.
function addMessage(role, text) {
    const message = {
        role,
        text,
        timestamp: Date.now()
    };
    state.history.push(message);

    const bubble = document.createElement("div");
    bubble.className = `dating-message ${role}`;
    bubble.textContent = role === "bot" ? `${SOYTAN.name}: ${text}` : `You: ${text}`;
    ui.chatLog.appendChild(bubble);
    ui.chatLog.scrollTop = ui.chatLog.scrollHeight;
}

// updateRomanceScore: Handles update romance score.
function updateRomanceScore(userMessage) {
    const text = userMessage.toLowerCase();
    const normalized = String(userMessage || "").trim().toLowerCase();
    const analysis = analyzeUserMessage(text);
    const reasons = [];

    let delta = 1;
    let trustDelta = 0;
    let stabilityDelta = 0;

    if (analysis.isNumbersOnly || analysis.isSingleLetter) {
        delta -= 8;
        trustDelta -= 2;
        stabilityDelta -= 2;
        reasons.push("-8 confusing low-effort input");
    }

    let positiveMatches = 0;
    POSITIVE_WORDS.forEach((word) => {
        if (text.includes(word)) {
            delta += 3;
            positiveMatches += 1;
        }
    });
    if (positiveMatches > 0) {
        reasons.push(`+${positiveMatches * 3} positive language`);
        trustDelta += Math.min(positiveMatches, 2);
    }

    let negativeMatches = 0;
    NEGATIVE_WORDS.forEach((word) => {
        if (text.includes(word)) {
            delta -= 5;
            negativeMatches += 1;
        }
    });
    if (negativeMatches > 0) {
        reasons.push(`-${negativeMatches * 5} negative language`);
        trustDelta -= negativeMatches * 2;
        stabilityDelta -= negativeMatches;
    }

    let pressureMatches = 0;
    PRESSURE_WORDS.forEach((phrase) => {
        if (text.includes(phrase)) {
            delta -= 6;
            pressureMatches += 1;
        }
    });
    if (pressureMatches > 0) {
        reasons.push(`-${pressureMatches * 6} pressure/desperation`);
        trustDelta -= pressureMatches * 6;
        stabilityDelta -= pressureMatches * 5;
    }

    let respectMatches = 0;
    RESPECTFUL_WORDS.forEach((phrase) => {
        if (text.includes(phrase)) {
            delta += 4;
            respectMatches += 1;
        }
    });
    if (respectMatches > 0) {
        reasons.push(`+${respectMatches * 4} respectful/accountable tone`);
        trustDelta += respectMatches * 4;
        stabilityDelta += respectMatches * 3;
    }

    if (text.endsWith("?")) {
        delta += 1;
        reasons.push("+1 genuine question");
    }

    if (normalized && normalized === state.lastUserMessage) {
        delta += REPEAT_MESSAGE_PENALTY;
        trustDelta -= 4;
        stabilityDelta -= 3;
        reasons.push(`${REPEAT_MESSAGE_PENALTY} repeated same message`);
    }

    if (analysis.shortOrVague && !(analysis.isNumbersOnly || analysis.isSingleLetter)) {
        delta += LOW_QUALITY_SHORT_PENALTY;
        trustDelta -= 2;
        reasons.push(`${LOW_QUALITY_SHORT_PENALTY} low-detail reply`);
    }

    if (positiveMatches >= 4) {
        delta += KEYWORD_STUFFING_PENALTY;
        trustDelta -= 3;
        stabilityDelta -= 2;
        reasons.push(`${KEYWORD_STUFFING_PENALTY} keyword stuffing detected`);
    }

    if (analysis.hasAllCapsTone) {
        delta -= 3;
        trustDelta -= 2;
        reasons.push("-3 yelling/all-caps tone");
    }

    const contradiction = detectContradiction(analysis);
    if (contradiction) {
        delta -= 8;
        trustDelta -= 10;
        stabilityDelta -= 6;
        state.lastContradiction = contradiction;
        reasons.push("-8 contradiction (words vs behavior)");
    }

    if (analysis.hasRespectfulTone) {
        state.promiseBoundaryTurn = state.repliesUsed;
    }
    if (analysis.offersRepair) {
        state.promiseChangeTurn = state.repliesUsed;
    }

    if (delta > MAX_POSITIVE_DELTA_PER_TURN) {
        delta = MAX_POSITIVE_DELTA_PER_TURN;
        reasons.push(`positive cap applied (+${MAX_POSITIVE_DELTA_PER_TURN} max per turn)`);
    }

    state.positiveHits += positiveMatches;
    state.negativeHits += negativeMatches;
    state.pressureHits += pressureMatches;
    state.respectHits += respectMatches;

    state.trust = clamp(state.trust + trustDelta, 0, 100);
    state.stability = clamp(state.stability + stabilityDelta, 0, 100);

    reasons.push(delta >= 0 ? `net +${delta}` : `net ${delta}`);
    reasons.push(`trust ${trustDelta >= 0 ? "+" : ""}${trustDelta}`);
    reasons.push(`stability ${stabilityDelta >= 0 ? "+" : ""}${stabilityDelta}`);
    renderReasonLog(reasons, delta);

    state.romance = clamp(state.romance + delta, 0, 100);
    ui.romanceScore.textContent = String(state.romance);
    ui.romanceProgress.style.width = `${state.romance}%`;
    ui.romanceProgress.textContent = `${state.romance}%`;
    ui.romanceProgress.className = `progress-bar ${getRomanceBarClass(state.romance)}`;

    const phase = getConversationPhase();
    if (pressureMatches > 0) {
        ui.status.textContent = `${phase.label}: Soytan feels pressured and pulls away.`;
    } else if (respectMatches > 0) {
        ui.status.textContent = `${phase.label}: Soytan notices your calmer and more respectful tone.`;
    } else if (phase.id === "early") {
        ui.status.textContent = "Early phase: Soytan is guarded and distant.";
    } else if (phase.id === "middle") {
        ui.status.textContent = "Middle phase: Soytan is conflicted and evaluating trust.";
    } else {
        ui.status.textContent = "Late phase: Soytan is weighing a final decision.";
    }

    state.lastUserMessage = normalized;
}

// detectContradiction: Handles detect contradiction.
function detectContradiction(analysis) {
    if (analysis.hasPressureTone && state.promiseBoundaryTurn !== null) {
        return "You promised space, then applied pressure.";
    }

    if (analysis.casualDeflection && state.promiseChangeTurn !== null && state.repliesUsed > state.promiseChangeTurn) {
        return "You promised change, then dodged the real issue.";
    }

    return "";
}

// renderReasonLog: Handles render reason log.
function renderReasonLog(reasons, delta) {
    if (!ui.reasonLog) {
        return;
    }

    if (!Array.isArray(reasons) || reasons.length === 0) {
        ui.reasonLog.textContent = "Reason log: no scoring changes this turn.";
        ui.reasonLog.className = "small text-secondary mb-0";
        return;
    }

    ui.reasonLog.textContent = `Reason log: ${reasons.join(" | ")}`;

    if (typeof delta === "number") {
        if (delta > 0) {
            ui.reasonLog.className = "small text-success mb-0";
            return;
        }

        if (delta < 0) {
            ui.reasonLog.className = "small text-danger mb-0";
            return;
        }
    }

    ui.reasonLog.className = "small text-secondary mb-0";
}

// getRomanceBarClass: Handles get romance bar class.
function getRomanceBarClass(score) {
    if (score >= 85) {
        return "bg-success";
    }
    if (score >= 50) {
        return "bg-info";
    }
    if (score >= 20) {
        return "bg-warning text-dark";
    }
    return "bg-danger";
}

// renderRepliesRemaining: Handles render replies remaining.
function renderRepliesRemaining() {
    if (!ui.repliesRemaining) {
        return;
    }

    ui.repliesRemaining.textContent = String(Math.max(0, MAX_REPLIES - state.repliesUsed));

    if (ui.resetButton) {
        const shouldShowReset = state.repliesUsed >= MAX_REPLIES;
        ui.resetButton.classList.toggle("d-none", !shouldShowReset);
    }
}

// determineEnding: Handles determine ending.
function determineEnding() {
    if (state.romance >= 95) {
        return "stay";
    }

    if (state.romance >= 80) {
        return "maybe";
    }

    return "breakup";
}

// showEnding: Handles show ending.
function showEnding(ending, forcedLine) {
    state.ended = true;

    let finalLine = "";
    if (ending === "stay") {
        ui.soytanAvatar.src = "images/soytan-imgs/soytan-happy.png";
        ui.playerAvatar.src = "images/soyjak-imgs/omgsisa.jpg";
        finalLine = "Okay... I will stay. We can try again, but for real this time.";
        ui.status.textContent = "Ending: Soytan stayed.";
    } else if (ending === "maybe") {
        ui.soytanAvatar.src = "images/soytan-imgs/soytan-crying.png";
        finalLine = `maybe ${state.playerName} I don't know, I just need some time to think about it. Please leave me alone.`;
        ui.status.textContent = "Ending: Maybe.";
    } else {
        ui.soytanAvatar.src = "images/soytan-imgs/soytan-breakup.png";
        finalLine = "No. I am ending this relationship. Goodbye.";
        ui.status.textContent = "Ending: Breakup.";
    }

    const resolvedFinalLine = typeof forcedLine === "string" && forcedLine.trim() ? forcedLine.trim() : finalLine;

    addMessage("bot", resolvedFinalLine);
    speakSoytan(resolvedFinalLine);

    ui.input.disabled = true;
    ui.sendButton.disabled = true;
    ui.sendButton.textContent = "Ended";
    ui.input.placeholder = "Conversation ended.";
}

// containsCurse: Handles contains curse.
function containsCurse(message) {
    const normalized = String(message || "").toLowerCase();
    return CURSE_WORDS.some((word) => {
        const pattern = new RegExp(`\\b${word}\\b`, "i");
        return pattern.test(normalized);
    });
}

// toggleSending: Handles toggle sending.
function toggleSending(isSending) {
    ui.sendButton.disabled = isSending;
    ui.input.disabled = isSending;
    ui.sendButton.textContent = isSending ? "Thinking..." : "Send";
}

async function getResponse(userMessage) {
    const endpoint = window.SOYJAK_DATING_API_URL;

    if (typeof endpoint === "string" && endpoint.trim()) {
        const reply = await requestAiReply(endpoint.trim(), userMessage);
        if (reply) {
            return reply;
        }
    }

    return getLocalFallbackReply(userMessage);
}

async function requestAiReply(endpoint, userMessage) {
    const phase = getConversationPhase();
    const payload = {
        message: userMessage,
        character: SOYTAN,
        systemPrompt: SOYTAN_BEHAVIOR_PROMPT,
        objective: "Convince Soytan to stay in the relationship.",
        relationshipState: "Soytan is reluctant and currently wants to end the relationship.",
        scenario: "Player was overbearing and pushed the relationship too fast. Soytan does not hate them, but fears staying will keep her unhappy.",
        phase: phase.id,
        phaseHint: phase.description,
        romance: state.romance,
        trust: state.trust,
        stability: state.stability,
        pressureHits: state.pressureHits,
        respectHits: state.respectHits,
        recentUserMessage: getRecentUserMessages(1)[0] || "",
        memoryCallbackSeed: getRecentUserMessages(2),
        history: state.history.slice(-10).map((entry) => ({ role: entry.role, text: entry.text }))
    };

    const headers = {
        "Content-Type": "application/json"
    };

    if (typeof window.SOYJAK_DATING_API_KEY === "string" && window.SOYJAK_DATING_API_KEY.trim()) {
        headers.Authorization = `Bearer ${window.SOYJAK_DATING_API_KEY.trim()}`;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        return null;
    }

    const data = await response.json();
    return typeof data.reply === "string" ? data.reply.trim() : null;
}

// getLocalFallbackReply: Handles get local fallback reply.
function getLocalFallbackReply(userMessage) {
    const analysis = analyzeUserMessage(userMessage.toLowerCase());

    if (analysis.hasPressureTone) {
        return pickFallbackReply([
            "This is exactly what I meant. The pressure is too much.",
            "When you push me, I shut down. That is why this stopped working.",
            "Do not corner me. If you care, give me room to breathe."
        ]);
    }

    if (analysis.hasRespectfulTone && state.romance < 85) {
        return pickFallbackReply([
            "Thank you for saying that calmly. That helps more than you think.",
            "That is the first time tonight I felt genuinely heard.",
            "This tone is better. I still hurt, but I can listen."
        ]);
    }

    return getNaturalFallbackReply(analysis);
}

// analyzeUserMessage: Handles analyze user message.
function analyzeUserMessage(text) {
    const cleanText = (text || "").trim();
    const tokenCount = cleanText.length === 0 ? 0 : cleanText.split(/\s+/).length;
    const isNumbersOnly = /^\d+$/.test(cleanText);
    const isSingleLetter = /^[a-zA-Z]$/.test(cleanText);
    const shortOrVague = cleanText.length <= 3 || tokenCount <= 1;

    const letterChars = cleanText.replace(/[^a-z]/gi, "");
    const upperChars = cleanText.replace(/[^A-Z]/g, "").length;
    const hasAllCapsTone = letterChars.length >= 6 && (upperChars / letterChars.length) > 0.7;

    const hasPressureTone = PRESSURE_WORDS.some((phrase) => text.includes(phrase));
    const hasRespectfulTone = RESPECTFUL_WORDS.some((phrase) => text.includes(phrase));
    const asksForExplanation = CONFUSION_WORDS.some((phrase) => text.includes(phrase));
    const offersRepair = REPAIR_WORDS.some((phrase) => text.includes(phrase));
    const casualDeflection = CASUAL_DEFLECTION_WORDS.some((phrase) => text.includes(phrase));
    const isQuestion = text.includes("?");
    const asksForFuture = text.includes("future") || text.includes("together") || text.includes("us");
    const asksForStay = text.includes("stay") || text.includes("another chance") || text.includes("try again");
    const mentionsApology = text.includes("sorry") || text.includes("apolog");
    const mentionsLove = text.includes("love") || text.includes("care");

    let nounHint = "";
    if (state.nlpLoaded && state.nlp) {
        try {
            const doc = state.nlp(text);
            const nouns = doc.nouns().out("array");
            nounHint = Array.isArray(nouns) && nouns.length > 0 ? String(nouns[0]).toLowerCase() : "";
        } catch (_error) {
            nounHint = "";
        }
    }

    return {
        isNumbersOnly,
        isSingleLetter,
        shortOrVague,
        hasAllCapsTone,
        hasPressureTone,
        hasRespectfulTone,
        asksForExplanation,
        offersRepair,
        casualDeflection,
        isQuestion,
        asksForFuture,
        asksForStay,
        mentionsApology,
        mentionsLove,
        nounHint
    };
}

// getConversationPhase: Handles get conversation phase.
function getConversationPhase() {
    const turn = state.repliesUsed + 1;
    const earlyCap = Math.ceil(MAX_REPLIES * 0.33);
    const midCap = Math.ceil(MAX_REPLIES * 0.7);

    if (turn <= earlyCap) {
        return {
            id: "early",
            label: "Early Phase",
            description: "Guarded and distant"
        };
    }

    if (turn <= midCap) {
        return {
            id: "middle",
            label: "Middle Phase",
            description: "Conflicted and explanatory"
        };
    }

    return {
        id: "late",
        label: "Late Phase",
        description: "Decision-focused and cautious"
    };
}

// getNaturalFallbackReply: Handles get natural fallback reply.
function getNaturalFallbackReply(analysis) {
    const phase = getConversationPhase();

    if (analysis.isNumbersOnly || analysis.isSingleLetter) {
        return pickFallbackReply([
            "I am confused. Are you trying to talk to me or just typing random things?",
            "I do not understand that. Use your words if this matters to you.",
            "That just confused me. Please say something real."
        ]);
    }

    if (analysis.shortOrVague) {
        return pickFallbackReply([
            "If you want this to matter, say what you actually feel.",
            "One word is not enough for a conversation like this.",
            "I need honesty, not fragments. Talk to me clearly."
        ]);
    }

    if (analysis.asksForExplanation) {
        return pickFallbackReply([
            "You pushed us too fast and too hard. I felt pressured instead of safe.",
            "You were intense when I needed patience. That is what broke us.",
            "I needed steady love, but I kept feeling overwhelmed and unheard."
        ]);
    }

    if (analysis.casualDeflection && state.romance < 70) {
        return pickFallbackReply([
            "This is not really about snacks or distractions. It is about how we treated each other.",
            "Do not dodge this with small talk. I need a real conversation.",
            "If we are talking about us, stay with the hard part, not the easy detours."
        ]);
    }

    if (analysis.offersRepair && state.romance < 85) {
        return pickFallbackReply([
            "If you want to repair this, show me consistency and slower pace.",
            "Change is possible, but only if your actions stay calm and steady.",
            "I can hear effort in that. Keep it respectful and do not rush me."
        ]);
    }

    const earlyPool = [
        "I am not convinced. Right now I still think ending this is the right move.",
        "You are asking me to stay, but I still feel like leaving is safer.",
        "I am listening, but my mind is still on ending this.",
        "We're just two different people. You'd be better off meeting a different soyjak.",
        "Your love is one-sided, I don't feel the same way.",
        "You haven't made me happy in a while. I've simply fallen out of love with you."
    ];

    const middlePool = [
        "Part of me wants to believe you, and part of me wants to leave anyway.",
        "I am conflicted, and that scares me more than a clean goodbye.",
        "I am torn, but I am still leaning toward ending this.",
        "I don't hate you, I want what's best for you if anything. I'm just not the right person for you.",
        "The past was great, but our issues have become more clear with time. I'm sorry.",
        "The relationship was coal, brimestone even. I know moving on is hard. The only way you can come out of this is moving on."
    ];

    const latePool = [
        "You are getting through to me. I am listening, but I am still scared.",
        "You are reaching me, but trust is still fragile.",
        "I am softening, but I am not fully ready to commit yet.",
        "I can picture us trying again, but only if this is truly different.",
        "A future is possible, but I need consistency from you.",
        "Maybe we could try again, but I will not ignore red flags."
    ];

    let baseLine = "";
    if (phase.id === "early") {
        baseLine = pickFallbackReply(earlyPool);
    } else if (phase.id === "middle") {
        baseLine = pickFallbackReply(middlePool);
    } else {
        baseLine = pickFallbackReply(latePool);
    }

    if (analysis.mentionsApology && phase.id !== "late") {
        baseLine = pickFallbackReply([
            "I hear your apology, but words are cheap right now.",
            "You can apologize, but I need proof, not panic.",
            "I heard your apology. It does not fix what happened yet."
        ]);
    }

    const addOnPool = [];
    if (analysis.asksForStay) {
        addOnPool.push("If you want me to stay, show me patience, not panic.");
    }
    if (analysis.asksForFuture) {
        addOnPool.push("If there is a future, it has to be slower and healthier.");
    }
    if (analysis.mentionsLove) {
        addOnPool.push("Love is not just intensity. It is respect and steady behavior.");
    }
    if (analysis.isQuestion) {
        addOnPool.push("I answered you honestly. Please hear what I am actually saying.");
    }
    if (analysis.nounHint === "relationship") {
        addOnPool.push("Our relationship moved too fast and became heavy. That cannot happen again.");
    }

    const memoryCallback = buildMemoryCallback(phase.id);
    if (memoryCallback) {
        addOnPool.push(memoryCallback);
    }

    if (addOnPool.length === 0) {
        return baseLine;
    }

    const addOn = pickFallbackReply(addOnPool);
    const combined = `${baseLine} ${addOn}`.trim();

    if (combined === state.lastFallbackReply) {
        return baseLine;
    }

    state.lastFallbackReply = combined;
    return combined;
}

// buildMemoryCallback: Handles build memory callback.
function buildMemoryCallback(phaseId) {
    if (state.lastContradiction) {
        const contradiction = state.lastContradiction;
        state.lastContradiction = "";
        return contradiction;
    }

    const recentUsers = getRecentUserMessages(3);
    if (recentUsers.length === 0) {
        return "";
    }

    if (phaseId === "middle" && state.repliesUsed % 2 === 0) {
        const quote = truncateForQuote(recentUsers[0]);
        return `You said "${quote}" a moment ago. I need actions that match that.`;
    }

    if (phaseId === "late" && state.repliesUsed % 2 === 1) {
        const quote = truncateForQuote(recentUsers[Math.min(1, recentUsers.length - 1)]);
        return `Earlier you said "${quote}". I am deciding whether to believe that now.`;
    }

    return "";
}

// getRecentUserMessages: Handles get recent user messages.
function getRecentUserMessages(limit) {
    return state.history
        .filter((entry) => entry.role === "user")
        .slice(-limit)
        .reverse()
        .map((entry) => entry.text);
}

// truncateForQuote: Handles truncate for quote.
function truncateForQuote(text) {
    const raw = String(text || "").trim();
    if (raw.length <= 70) {
        return raw;
    }

    return `${raw.slice(0, 67)}...`;
}

// pickFallbackReply: Handles pick fallback reply.
function pickFallbackReply(options) {
    if (!Array.isArray(options) || options.length === 0) {
        return "I need a moment.";
    }

    const preferredIndex = state.repliesUsed % options.length;
    let reply = options[preferredIndex];

    if (reply === state.lastFallbackReply && options.length > 1) {
        reply = options[(preferredIndex + 1) % options.length];
    }

    state.lastFallbackReply = reply;
    return reply;
}

// speakSoytan: Handles speak soytan.
function speakSoytan(text) {
    if (!ui.voiceToggle || !ui.voiceToggle.checked) {
        return;
    }

    if (!("speechSynthesis" in window)) {
        return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.78;
    utterance.volume = 0.9;

    const englishVoice = window.speechSynthesis.getVoices().find((voice) => voice.lang && voice.lang.toLowerCase().startsWith("en"));
    if (englishVoice) {
        utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
}

// clamp: Handles clamp.
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

