// File: game.js - app script
const SCORE_PER_SECOND = 100;

export class ChaseGame {
    constructor(config) {
        this.board = config.board;
        this.player = config.player;
        this.bot = config.bot;
        this.scoreOutput = config.scoreOutput;
        this.highScoreOutput = config.highScoreOutput;
        this.statusOutput = config.statusOutput;
        this.liveAnnouncer = config.liveAnnouncer;

        this.keyState = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        this.settings = {
            playerSpeed: 280,
            botSpeed: 165,
            botAccel: 7,
            collisionRadius: 36
        };

        this.playerPos = { x: 24, y: 24 };
        this.botPos = { x: 0, y: 0 };
        this.score = 0;
        this.highScore = 0;
        this.running = false;
        this.elapsedSeconds = 0;
        this.playerFacingScaleX = 1;
        this.lastTime = 0;
        this.rafId = null;

        this.loop = this.loop.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    init() {
        window.addEventListener("resize", this.handleResize);
        this.placeEntitiesForNewRound();
        this.render();
        this.updateScoreUi();
    }

    destroy() {
        window.removeEventListener("resize", this.handleResize);
        this.stopLoop();
    }

    setDifficulty(preset) {
        if (!preset) {
            return;
        }

        this.settings = {
            playerSpeed: preset.playerSpeed,
            botSpeed: preset.botSpeed,
            botAccel: preset.botAccel,
            collisionRadius: preset.collisionRadius
        };

        this.applyDifficultyBotSkin(preset.id);

        if (!this.running) {
            this.statusOutput.textContent = `${preset.label} selected. Press Start Chase.`;
        }
    }

    applyDifficultyBotSkin(difficultyId) {
        const skinByDifficulty = {
            easy: "images/soyjak-imgs/apeson-easy.png",
            normal: "images/soyjak-imgs/apeson-normal.png",
            hard: "images/soyjak-imgs/apeson.gif",
            rookie: "images/soyjak-imgs/apeson-easy.png",
            classic: "images/soyjak-imgs/apeson-normal.png",
            insane: "images/soyjak-imgs/apeson.gif"
        };

        const skin = skinByDifficulty[difficultyId] || skinByDifficulty.normal;
        this.bot.style.backgroundImage = `url("${skin}")`;
    }

    setHighScore(score) {
        this.highScore = Math.max(0, Math.floor(score));
        this.highScoreOutput.textContent = String(this.highScore);
    }

    start() {
        this.placeEntitiesForNewRound();
        this.score = 0;
        this.elapsedSeconds = 0;
        this.running = true;
        this.lastTime = performance.now();
        this.statusOutput.textContent = "Run. Do not let the bot touch you.";
        this.updateScoreUi();
        this.startLoop();
    }

    reset() {
        this.stopLoop();
        this.running = false;
        this.score = 0;
        this.elapsedSeconds = 0;
        this.placeEntitiesForNewRound();
        this.render();
        this.updateScoreUi();
        this.statusOutput.textContent = "Round reset. Press Start Chase to begin again.";
    }

    setInput(direction, isPressed) {
        if (!Object.prototype.hasOwnProperty.call(this.keyState, direction)) {
            return;
        }

        this.keyState[direction] = isPressed;
    }

    loop(now) {
        if (!this.running) {
            return;
        }

        const dt = Math.min((now - this.lastTime) / 1000, 0.033);
        this.lastTime = now;

        this.update(dt);
        this.render();

        if (this.isCollision()) {
            this.running = false;
            this.stopLoop();
            this.statusOutput.textContent = `Caught. Final score: ${this.score}.`;
            return;
        }

        this.rafId = window.requestAnimationFrame(this.loop);
    }

    update(dt) {
        this.elapsedSeconds += dt;
        this.score = Math.floor(this.elapsedSeconds * SCORE_PER_SECOND);

        const movement = this.getPlayerVelocity();
        this.playerPos.x += movement.vx * dt;
        this.playerPos.y += movement.vy * dt;

        const botStep = this.getBotVelocity();
        this.botPos.x += botStep.vx * dt;
        this.botPos.y += botStep.vy * dt;

        this.clampEntitiesToBoard();
        this.updateScoreUi();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreOutput.textContent = String(this.highScore);
        }
    }

    getPlayerVelocity() {
        let x = 0;
        let y = 0;

        if (this.keyState.left) {
            x -= 1;
        }
        if (this.keyState.right) {
            x += 1;
        }
        if (this.keyState.up) {
            y -= 1;
        }
        if (this.keyState.down) {
            y += 1;
        }

        if (x === 0 && y === 0) {
            return { vx: 0, vy: 0 };
        }

        const length = Math.sqrt((x * x) + (y * y));
        const normalizedX = x / length;
        const normalizedY = y / length;

        return {
            vx: normalizedX * this.settings.playerSpeed,
            vy: normalizedY * this.settings.playerSpeed
        };
    }

    getBotVelocity() {
        const dx = this.playerPos.x - this.botPos.x;
        const dy = this.playerPos.y - this.botPos.y;
        const distance = Math.sqrt((dx * dx) + (dy * dy));

        if (distance <= 0.001) {
            return { vx: 0, vy: 0 };
        }

        const normalizedX = dx / distance;
        const normalizedY = dy / distance;
        const speed = this.settings.botSpeed + (this.elapsedSeconds * this.settings.botAccel);

        return {
            vx: normalizedX * speed,
            vy: normalizedY * speed
        };
    }

    isCollision() {
        const dx = this.playerPos.x - this.botPos.x;
        const dy = this.playerPos.y - this.botPos.y;
        const distance = Math.sqrt((dx * dx) + (dy * dy));

        return distance <= this.settings.collisionRadius;
    }

    clampEntitiesToBoard() {
        const boardWidth = this.board.clientWidth;
        const boardHeight = this.board.clientHeight;

        const playerHalf = this.player.offsetWidth / 2;
        const botHalf = this.bot.offsetWidth / 2;

        this.playerPos.x = clamp(this.playerPos.x, playerHalf, boardWidth - playerHalf);
        this.playerPos.y = clamp(this.playerPos.y, playerHalf, boardHeight - playerHalf);

        this.botPos.x = clamp(this.botPos.x, botHalf, boardWidth - botHalf);
        this.botPos.y = clamp(this.botPos.y, botHalf, boardHeight - botHalf);
    }

    placeEntitiesForNewRound() {
        const boardWidth = this.board.clientWidth;
        const boardHeight = this.board.clientHeight;

        this.playerPos.x = boardWidth * 0.2;
        this.playerPos.y = boardHeight * 0.2;
        this.botPos.x = boardWidth * 0.8;
        this.botPos.y = boardHeight * 0.8;
    }

    render() {
        const dx = this.botPos.x - this.playerPos.x;

        // Only mirror left/right based on which horizontal side the bot is on.
        if (Math.abs(dx) > 1) {
            this.playerFacingScaleX = dx >= 0 ? 1 : -1;
        }

        this.player.style.transform = `translate(${this.playerPos.x}px, ${this.playerPos.y}px) scaleX(${this.playerFacingScaleX})`;
        this.bot.style.transform = `translate(${this.botPos.x}px, ${this.botPos.y}px)`;
    }

    updateScoreUi() {
        this.scoreOutput.textContent = String(this.score);
        this.liveAnnouncer.textContent = `Score is now ${this.score}.`;
    }

    handleResize() {
        this.clampEntitiesToBoard();
        this.render();
    }

    startLoop() {
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId);
        }

        this.rafId = window.requestAnimationFrame(this.loop);
    }

    stopLoop() {
        if (this.rafId) {
            window.cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}

// clamp: Handles clamp.
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

