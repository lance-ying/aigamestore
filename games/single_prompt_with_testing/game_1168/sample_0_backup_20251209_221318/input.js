import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { generateLevel } from './levelGen.js';

export function initInput(p) {
    // Input is handled via p5 methods in game.js, but state is stored in gameState.keys
}

export function handleInput(p) {
    const { player } = gameState;
    
    // Automated Testing Override
    if (gameState.controlMode !== "HUMAN") {
        handleAutomatedInput(p);
        return;
    }

    // Game Phase transitions
    if (p.keyIsDown(13)) { // ENTER
        if (gameState.gamePhase === PHASE_START) {
            startGame(p);
        }
    }
    
    if (gameState.gamePhase === PHASE_PLAYING) {
        if (!player) return;

        // Movement
        if (p.keyIsDown(p.LEFT_ARROW)) {
            player.moveLeft();
        } else if (p.keyIsDown(p.RIGHT_ARROW)) {
            player.moveRight();
        }

        // Jump handled in keyPressed for discrete events, or here for holding
        if (p.keyIsDown(32)) { // SPACE
            // Variable jump height logic can go here (sustain jump)
        }
        
        // Shooting
        if (p.keyIsDown(90)) { // Z
            player.tryShoot(p);
        }
    }
}

function startGame(p) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.frameCount = 0;
    gameState.score = 0;
    
    // Reset seeds for consistent level generation if needed, but per run variation is good
    // However, prompt asked for reproducibility via setup seed. 
    // We will re-seed random before generation if we want exact same levels every retry
    // p.randomSeed(42); 
    
    generateLevel(p);
    
    p.logs.game_info.push({
        event: "GAME_START",
        timestamp: Date.now()
    });
}

function handleAutomatedInput(p) {
    const action = window.get_automated_testing_action(gameState);
    if (!action || !gameState.player) return;

    if (action.left) gameState.player.moveLeft();
    if (action.right) gameState.player.moveRight();
    if (action.jump) gameState.player.jump();
    if (action.shoot) gameState.player.tryShoot(p);
}

// Key Press Event Handler (Single press actions)
export function handleKeyPressed(p, keyCode) {
    
    // Global toggles
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === PHASE_PLAYING) {
            gameState.gamePhase = PHASE_PAUSED;
        } else if (gameState.gamePhase === PHASE_PAUSED) {
            gameState.gamePhase = PHASE_PLAYING;
        }
    }
    
    if (keyCode === 82) { // R
        if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
            // Restart
            gameState.gamePhase = PHASE_START;
            gameState.player = null;
        }
    }

    if (gameState.gamePhase !== PHASE_PLAYING) return;
    if (!gameState.player) return;

    // Player specific discrete actions
    if (keyCode === 32) { // SPACE
        gameState.player.jump();
    }
    
    if (keyCode === 16) { // SHIFT
        gameState.player.dash();
    }
}