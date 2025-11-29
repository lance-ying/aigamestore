import { gameState, CANVAS_WIDTH } from './globals.js';
import { Player, Boss } from './entities.js';

export const keys = {};

export function handleInput(p) {
    if (gameState.gamePhase !== "PLAYING") return;
    
    const player = gameState.player;
    if (!player) return;

    // Automated Testing Override
    if (gameState.controlMode !== "HUMAN") {
        if (window.get_automated_testing_action) {
            const action = window.get_automated_testing_action(gameState);
            if (action) {
                // Simulate input
                if (action.moveLeft) player.moveLeft();
                if (action.moveRight) player.moveRight();
                if (action.jump) player.jump();
                if (action.shoot) player.shoot(p);
                if (action.dash) player.dash();
                if (action.duck) player.duck();
                else player.standUp();
            }
        }
        return;
    }

    // Human Input
    if (keys[p.LEFT_ARROW]) player.moveLeft();
    if (keys[p.RIGHT_ARROW]) player.moveRight();
    if (keys[p.UP_ARROW]) { /* Maybe look up? */ }
    if (keys[p.DOWN_ARROW]) player.duck();
    else player.standUp();
    
    if (keys[32]) player.jump(); // Space
    if (keys[90]) player.shoot(p); // Z
    if (keys[16]) player.dash(); // Shift
}

export function setupInputHandlers(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        // Log input
        p.logs.inputs.push({
            type: 'press',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
        
        // Phase Controls
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                gameState.currentLevel = 1;
                gameState.score = 0;
                initGameObjects(p);
            } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
                gameState.currentLevel++;
                gameState.gamePhase = "PLAYING";
                initGameObjects(p);
            }
        }
        
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                gameState.gamePhase = "START";
                gameState.score = 0;
                gameState.currentLevel = 1;
            }
        }
    };
    
    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            type: 'release',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    };
}

// Helper to initialize game objects cleanly on start/restart
function initGameObjects(p) {
    gameState.entities = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    // Create Player
    gameState.player = new Player(100, 300);
    gameState.entities.push(gameState.player);
    
    // Reset player health on new level
    gameState.player.health = gameState.player.maxHealth;
    
    // Create Boss with current level
    gameState.boss = new Boss(CANVAS_WIDTH - 100, 250, gameState.currentLevel);
    gameState.entities.push(gameState.boss);
}