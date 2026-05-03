import { stageTemplates } from "./data.js";

const SCORE_SCALE = 0.03;

export class DanceGame {
    constructor(config) {
        this.board = config.board;
        this.actor = config.actor;
        this.scoreOutput = config.scoreOutput;
        this.highScoreOutput = config.highScoreOutput;
        this.progressBar = config.progressBar;
        this.statusOutput = config.statusOutput;
        this.liveAnnouncer = config.liveAnnouncer;
        this.onScore = config.onScore;

        this.score = 0;
        this.highScore = 0;
        this.totalDistance = 0;
        this.lastPointer = null;
        this.dragging = false;
        this.playing = false;
        this.multiplier = SCORE_SCALE;
        this.stages = [];
        this.playerJakName = "Blushjak";
        this.actorOverrideImage = null;

        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
    }

    init() {
        this.board.addEventListener("pointermove", this.handlePointerMove);
        this.board.addEventListener("pointerup", this.handlePointerUp);
        this.board.addEventListener("pointerleave", this.handlePointerUp);
        this.actor.addEventListener("pointerdown", this.handlePointerDown);

        this.resetRound(true);
    }

    setHighScore(score) {
        this.highScore = Math.max(0, Math.floor(score));
        this.highScoreOutput.textContent = String(this.highScore);
    }

    setPlayerJakName(name) {
        this.playerJakName = name || "Blushjak";
    }

    setActorOverrideImage(src) {
        this.actorOverrideImage = src || null;
    }

    startRound() {
        this.playing = true;
        this.resetRound(false);
        this.statusOutput.textContent = `Dance started, ${this.playerJakName}. Show your moves.`;
    }

    resetRound(keepPaused) {
        this.playing = keepPaused ? false : true;
        this.score = 0;
        this.totalDistance = 0;
        this.lastPointer = null;
        this.dragging = false;

        this.stages = this.buildRoundStages();
        this.moveActorBelowCenter();
        this.applyStage(this.stages[0]);
        this.updateScoreUi();

        if (keepPaused) {
            this.statusOutput.textContent = `Welcome ${this.playerJakName}. Press Start Dance to begin.`;
        }
    }

    buildRoundStages() {
        return stageTemplates;
    }

    handlePointerDown(event) {
        if (!this.playing) {
            return;
        }

        this.dragging = true;
        this.lastPointer = {
            x: event.clientX,
            y: event.clientY
        };
        this.actor.setPointerCapture(event.pointerId);
    }

    handlePointerMove(event) {
        if (!this.dragging || !this.playing) {
            return;
        }

        const boardRect = this.board.getBoundingClientRect();
        const actorRect = this.actor.getBoundingClientRect();

        const deltaX = event.clientX - this.lastPointer.x;
        const deltaY = event.clientY - this.lastPointer.y;

        const left = this.clamp(
            this.actor.offsetLeft + deltaX,
            0,
            boardRect.width - actorRect.width
        );

        const top = this.clamp(
            this.actor.offsetTop + deltaY,
            0,
            boardRect.height - actorRect.height
        );

        this.actor.style.left = `${left}px`;
        this.actor.style.top = `${top}px`;

        this.totalDistance += Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
        this.score = Math.floor(this.totalDistance * this.multiplier);
        this.lastPointer = {
            x: event.clientX,
            y: event.clientY
        };

        const activeStage = this.getStageForScore(this.score);
        this.applyStage(activeStage);
        this.updateScoreUi();

        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreOutput.textContent = String(this.highScore);
            if (this.onScore) {
                this.onScore(this.highScore);
            }
        }
    }

    handlePointerUp() {
        this.dragging = false;
        this.lastPointer = null;
    }

    getStageForScore(score) {
        let currentStage = this.stages[0];

        for (let i = 0; i < this.stages.length; i += 1) {
            if (score >= this.stages[i].minScore) {
                currentStage = this.stages[i];
            }
        }

        return currentStage;
    }

    applyStage(stage) {
        if (!stage) {
            return;
        }

        this.actor.src = this.actorOverrideImage || stage.image;
        this.statusOutput.textContent = stage.message.replace("{jak}", this.playerJakName);
    }

    updateScoreUi() {
        const maxScore = this.stages[this.stages.length - 1].minScore;
        const percent = Math.min((this.score / maxScore) * 100, 100);

        this.scoreOutput.textContent = String(this.score);
        this.progressBar.style.width = `${percent}%`;
        this.progressBar.setAttribute("aria-valuenow", String(Math.round(percent)));
        this.liveAnnouncer.textContent = `Score is now ${this.score}.`;
    }

    moveActorBelowCenter() {
        const boardRect = this.board.getBoundingClientRect();
        const actorRect = this.actor.getBoundingClientRect();

        const centeredLeft = (boardRect.width - actorRect.width) / 2;
        const centeredTop = (boardRect.height - actorRect.height) / 2;

        const targetTop = this.clamp(
            centeredTop + (actorRect.height * 0.35),
            0,
            boardRect.height - actorRect.height
        );

        this.actor.style.left = `${Math.max(0, centeredLeft)}px`;
        this.actor.style.top = `${targetTop}px`;
    }

    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}
