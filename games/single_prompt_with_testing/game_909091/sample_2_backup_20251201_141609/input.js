/**
 * Input handling and automated testing control
 */
import { gameState } from './globals.js';

export function handleInput(p) {
    const player = gameState.player;
    if (!player) return;

    let inputLeft = false;
    let inputRight = false;
    let inputJump = false;

    // 1. Get Control Inputs based on Mode
    if (gameState.controlMode === "HUMAN") {
        if (p.keyIsDown(p.LEFT_ARROW)) inputLeft = true;
        if (p.keyIsDown(p.RIGHT_ARROW)) inputRight = true;
        // Jumping is handled in keyPressed event for single actuation
    } else {
        const action = get_automated_testing_action(gameState, p);
        if (action) {
            if (action.left) inputLeft = true;
            if (action.right) inputRight = true;
            if (action.jump) inputJump = true;
        }
    }

    // 2. Apply Movement
    if (inputLeft) player.move(-1);
    else if (inputRight) player.move(1);
    else player.move(0);

    // 3. Automated Jumping (Human jumping is in keyPress)
    if (inputJump && gameState.controlMode !== "HUMAN") {
        // Debounce jump for bot
        if (p.frameCount % 20 === 0) {
            player.jump();
        }
    }
    
    // Log inputs
    if (inputLeft || inputRight || inputJump) {
         p.logs.inputs.push({
            left: inputLeft,
            right: inputRight,
            jump: inputJump,
            framecount: p.frameCount
         });
    }
}

// Automated Testing Controller
export function get_automated_testing_action(gameState, p) {
    const player = gameState.player;
    if (!player) return null;

    if (gameState.controlMode === "TEST_1") {
        // TEST_1: Basic Movement Sanity
        // Move Right for 60 frames, then jump
        const cycle = p.frameCount % 120;
        return {
            left: false,
            right: cycle < 60,
            jump: cycle > 60 && cycle < 65
        };
    } 
    else if (gameState.controlMode === "TEST_2") {
        // TEST_2: Climb Strategy (Win)
        // Zig Zag up
        const targetX = CANVAS_WIDTH / 2;
        
        // Simple heuristic: Move towards center, but if hitting wall, switch
        // Just oscillate left and right to climb walls
        const cycle = Math.floor(p.frameCount / 60) % 2;
        
        return {
            left: cycle === 0,
            right: cycle === 1,
            jump: true // Spam jump to wall jump and climb
        };
    }
    return null;
}

// Global key handlers
export function handleKeyPress(p, keyCode) {
    // Game Flow Controls
    if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ phase: "PLAYING", time: Date.now() });
        }
    }
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart is handled in game.js via window reload or reset function
            // We'll set a flag or call a global reset if possible, 
            // but usually we just reset state.
            window.resetGame(p);
        }
    }

    // Player Actions (Human)
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
        if (keyCode === 32 || keyCode === 38 || keyCode === 90) { // Space, Up, Z
            if (gameState.player) gameState.player.jump();
        }
    }
}