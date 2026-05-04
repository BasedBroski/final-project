// File: music.js - app script
const MUSIC_STATE_KEY = "soyjakMusicState";

export function initMusicPlayer(config) {
    const {
        audio,
        select,
        playButton,
        nextButton,
        volume,
        status
    } = config;

    if (!audio || !select || !playButton || !nextButton || !volume || !status) {
        return;
    }

    const tracks = Array.from(select.options).map((option) => ({
        src: option.value,
        label: option.textContent.trim()
    }));

    let index = 0;
    let isPlaying = false;

    const saved = loadMusicState();
    if (saved.trackSrc) {
        const savedIndex = tracks.findIndex((track) => track.src === saved.trackSrc);
        index = savedIndex >= 0 ? savedIndex : 0;
    }

    if (typeof saved.volume === "number") {
        audio.volume = clamp(saved.volume, 0, 1);
        volume.value = String(audio.volume);
    } else {
        audio.volume = Number(volume.value);
    }

    setTrack(index, false);

    playButton.addEventListener("click", async () => {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            playButton.textContent = "Play";
            updatePlayButtonStyle();
            status.textContent = "Paused";
            persist();
            return;
        }

        try {
            await audio.play();
            isPlaying = true;
            playButton.textContent = "Pause";
            updatePlayButtonStyle();
            status.textContent = `Playing: ${tracks[index].label}`;
            persist();
        } catch (_error) {
            status.textContent = "Autoplay blocked. Press Play again.";
        }
    });

    nextButton.addEventListener("click", async () => {
        index = (index + 1) % tracks.length;
        await setTrack(index, isPlaying);
    });

    select.addEventListener("change", async () => {
        const selectedIndex = tracks.findIndex((track) => track.src === select.value);
        index = selectedIndex >= 0 ? selectedIndex : 0;
        await setTrack(index, isPlaying);
    });

    volume.addEventListener("input", () => {
        audio.volume = clamp(Number(volume.value), 0, 1);
        persist();
    });

    audio.addEventListener("ended", async () => {
        index = (index + 1) % tracks.length;
        await setTrack(index, true);
    });

    // persist: Handles persist.
    function persist() {
        localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify({
            trackSrc: tracks[index].src,
            volume: audio.volume
        }));
    }

    async function setTrack(newIndex, autoplay) {
        index = newIndex;
        select.value = tracks[index].src;
        audio.src = tracks[index].src;
        status.textContent = `Loaded: ${tracks[index].label}`;

        if (autoplay) {
            try {
                await audio.play();
                isPlaying = true;
                playButton.textContent = "Pause";
                updatePlayButtonStyle();
                status.textContent = `Playing: ${tracks[index].label}`;
            } catch (_error) {
                isPlaying = false;
                playButton.textContent = "Play";
                updatePlayButtonStyle();
                status.textContent = "Track loaded. Press Play.";
            }
        } else {
            isPlaying = false;
            audio.pause();
            playButton.textContent = "Play";
            updatePlayButtonStyle();
        }

        persist();
    }

    // updatePlayButtonStyle: Handles update play button style.
    function updatePlayButtonStyle() {
        playButton.classList.remove("btn-primary", "btn-danger");
        playButton.classList.add(isPlaying ? "btn-danger" : "btn-primary");
    }
}

// loadMusicState: Handles load music state.
function loadMusicState() {
    try {
        const raw = localStorage.getItem(MUSIC_STATE_KEY);
        if (!raw) {
            return {};
        }

        return JSON.parse(raw);
    } catch (_error) {
        return {};
    }
}

// clamp: Handles clamp.
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

