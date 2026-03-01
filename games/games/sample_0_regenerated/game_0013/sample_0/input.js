import { gameState } from './globals.js';

const keys = {};

export function setupInput() {
    window.addEventListener('keydown', (e) => {
        keys[e.keyCode] = true;
        
        // Log raw input
        window.logs.inputs.push({
            type: 'keydown',
            key: e.key,
            keyCode: e.keyCode,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });

        // Global Phase Control
        if (e.keyCode === 13) { // Enter
            if (gameState.gamePhase === 'START') {
                gameState.gamePhase = 'PLAYING';
            }
        }
        if (e.keyCode === 27) { // ESC
            if (gameState.gamePhase === 'PLAYING') {
                gameState.gamePhase = 'PAUSED';
            } else if (gameState.gamePhase === 'PAUSED') {
                gameState.gamePhase = 'PLAYING';
            }
        }
        if (e.keyCode === 82) { // R
            if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
                // Ideally trigger a reset function from game.js, handled via game loop check or custom event
                gameState.requestReset = true; 
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.keyCode] = false;
        
        window.logs.inputs.push({
            type: 'keyup',
            key: e.key,
            keyCode: e.keyCode,
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    });
}

export function updateInput() {
    // Reset frame input
    gameState.input.up = false;
    gameState.input.down = false;
    gameState.input.left = false;
    gameState.input.right = false;
    gameState.input.jump = false;

    // Handle Human Control
    if (gameState.controlMode === "HUMAN") {
        if (keys[38] || keys[87]) gameState.input.up = true;    // ArrowUp / W
        if (keys[40] || keys[83]) gameState.input.down = true;  // ArrowDown / S
        if (keys[37] || keys[65]) gameState.input.left = true;  // ArrowLeft / A
        if (keys[39] || keys[68]) gameState.input.right = true; // ArrowRight / D
        if (keys[32]) gameState.input.jump = true;              // Space
    }
    // Handle Test Modes
    else if (gameState.controlMode === "TEST_1") {
        // Random input logic
        if (gameState.frameCount % 30 === 0) {
            gameState.testInputState = {
                up: Math.random() > 0.5,
                down: Math.random() > 0.5,
                left: Math.random() > 0.7,
                right: Math.random() > 0.7
            };
        }
        if (gameState.testInputState) {
            gameState.input.up = gameState.testInputState.up;
            gameState.input.down = gameState.testInputState.down && !gameState.input.up;
            gameState.input.left = gameState.testInputState.left;
            gameState.input.right = gameState.testInputState.right && !gameState.input.left;
        }
    }
    else if (gameState.controlMode === "TEST_2") {
        // AI Solver logic
        runAISolver();
    }
}

function runAISolver() {
    if (!gameState.player) return;
    
    // Find nearest upcoming obstacle
    let nearest = null;
    let minDist = Infinity;
    
    for (const obs of gameState.obstacles) {
        // Check if obstacle is in front
        const dist = obs.position.z - gameState.player.position.z;
        if (dist > -1 && dist < minDist) {
            minDist = dist;
            nearest = obs;
        }
    }

    if (nearest && minDist < 40) { // Look ahead
        // Get target dimensions from obstacle
        const holeWidth = nearest.holeWidth || 100;
        const holeHeight = nearest.holeHeight || 100;
        const holeX = nearest.position.x;
        const holeY = nearest.holeY || 0;

        // Current Dimensions
        const curW = gameState.player.scale.x;
        const curH = gameState.player.scale.y;

        // X Alignment
        if (gameState.player.position.x < holeX - 0.2) gameState.input.right = true;
        else if (gameState.player.position.x > holeX + 0.2) gameState.input.left = true;

        // Shape shifting
        // Target a slightly smaller size than hole to be safe
        const targetH = holeHeight - 0.2;
        
        // If hole is low, we need to be short (Wide)
        // If hole is narrow, we need to be tall (Thin)
        
        // Priority: Fit height first (for barriers), then width (for pillars)
        
        // If hole is a "Bar" (low ceiling), we must be short
        if (holeHeight < 2.0) {
            if (curH > targetH) gameState.input.down = true;
        } 
        // If hole is narrow, we must be tall
        else if (holeWidth < 2.0) {
            // Being taller makes us thinner
            // width = BASE_VOLUME / height
            // targetWidth < holeWidth
            // BASE_VOLUME / height < holeWidth => height > BASE_VOLUME / holeWidth
            const reqHeight = (1.0 / (holeWidth - 0.5));
            if (curH < reqHeight) gameState.input.up = true;
        }
        else {
             // Default to standard cube if no strict constraint
             if (curH < 1.0) gameState.input.up = true;
             else if (curH > 1.0) gameState.input.down = true;
        }
    } else {
        // No immediate obstacle, recenter and normalize
        if (gameState.player.position.x < -0.5) gameState.input.right = true;
        else if (gameState.player.position.x > 0.5) gameState.input.left = true;
        
        // Return to cube shape
        if (gameState.player.scale.y < 1.0) gameState.input.up = true;
        else if (gameState.player.scale.y > 1.0) gameState.input.down = true;
    }
}