import { gameState } from './globals.js';

// Key State Tracking
const keys = {};
const keyPressFlags = {}; // For single-frame key presses like shoot

export function initInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        keyPressFlags[p.keyCode] = true;

        // Logging inputs
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        handleGlobalHotkeys(p);
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
}

function handleGlobalHotkeys(p) {
    const code = p.keyCode;
    
    // ENTER - Start Game
    if (code === 13) { 
        if (gameState.gamePhase === "START") {
            resetGame(p);
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Game Started");
        }
    }

    // ESC - Pause/Unpause
    if (code === 27) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo(p, "Game Paused");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Game Resumed");
        }
    }

    // R - Restart
    if (code === 82) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "START";
            logGameInfo(p, "Return to Start Screen");
        }
    }
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export function isKeyPressed(keyCode) {
    const pressed = !!keyPressFlags[keyCode];
    keyPressFlags[keyCode] = false; // Consume the press
    return pressed;
}

// Helper to reset game state
import { Player } from './entities.js';
import { Wall, Gem } from './entities.js';

export function resetGame(p) {
    gameState.score = 0;
    gameState.gemsCollected = 0;
    gameState.isCountdownActive = false;
    gameState.countdownTimer = 0;
    
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.gems = [];
    gameState.walls = [];
    
    // Create Map Walls
    gameState.walls.push(new Wall(100, 100, 40, 40));
    gameState.walls.push(new Wall(460, 100, 40, 40));
    gameState.walls.push(new Wall(100, 260, 40, 40));
    gameState.walls.push(new Wall(460, 260, 40, 40));
    gameState.walls.push(new Wall(250, 180, 100, 40)); // Center cover
    
    // Initial Gem
    gameState.gems.push(new Gem(300, 200));

    // Spawn Player
    gameState.player = new Player(300, 350); // Start at bottom center
    
    // Seed Randomness for Reproducibility handled in main setup, 
    // but procedural generation for a new game session could use p.random()
}

function logGameInfo(p, message) {
    p.logs.game_info.push({
        data: { message: message, gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}