/**
 * UI Rendering
 * Handles Start Screen, HUD, Pause Menu, Game Over
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, COLORS } from './globals.js';

/**
 * Render HUD during gameplay
 */
export function renderHUD(p) {
    p.push();
    
    // Level Info
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Level ${gameState.currentLevelIndex + 1}`, 10, 10);
    p.text(`Score: ${gameState.score}`, 10, 30); // Display current score
    
    // Key Status
    p.textAlign(p.RIGHT, p.TOP);
    if (gameState.hasKey) {
        p.fill(255, 215, 0);
        p.text("KEY COLLECTED", CANVAS_WIDTH - 10, 10);
    } else {
        p.fill(150);
        p.text("FIND THE KEY", CANVAS_WIDTH - 10, 10);
    }

    // Active Agent Info
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255);
    p.textSize(12);
    p.text("Z: Switch | X: Regroup", CANVAS_WIDTH/2, 10);

    // Debug Info
    if (gameState.debugMode) {
        p.textAlign(p.LEFT, p.BOTTOM);
        p.fill(0, 255, 0);
        p.textSize(10);
        p.text(`FPS: ${Math.floor(p.frameRate())}\nEntities: ${gameState.picos.length + gameState.blocks.length}\nCam: ${Math.floor(gameState.camera.x)},${Math.floor(gameState.camera.y)}`, 10, CANVAS_HEIGHT - 10);
    }

    p.pop();
}

/**
 * Render Start Screen
 */
export function renderStartScreen(p) {
    p.background(30, 30, 40);
    
    // Animated Background Stripes
    p.push();
    p.stroke(40, 40, 50);
    p.strokeWeight(20);
    const offset = (p.frameCount * 0.5) % 40;
    for (let i = -40; i < CANVAS_WIDTH + CANVAS_HEIGHT; i += 40) {
        p.line(i + offset, 0, i - CANVAS_HEIGHT + offset, CANVAS_HEIGHT);
    }
    p.pop();

    p.textAlign(p.CENTER, p.CENTER);
    
    // Replaced game title with "press enter to begin"
    p.fill(255); 
    p.textSize(40);
    p.textStyle(p.BOLD);
    p.text("press enter to begin", CANVAS_WIDTH/2, 120);
    
    // Subtitle (preserved as it doesn't contain game name)
    p.fill(200);
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.text("Cooperate with Yourself!", CANVAS_WIDTH/2, 170);
    
    // Instructions (preserved as they don't contain game name)
    p.textSize(14);
    p.fill(150);
    p.text("Arrows: Move | Space: Jump", CANVAS_WIDTH/2, 300);
    p.text("Z: Switch Agent | X: Regroup", CANVAS_WIDTH/2, 320);
    p.text("Collect the Key -> Go to Door -> Everyone must survive", CANVAS_WIDTH/2, 350);
}

/**
 * Render Pause Screen
 */
export function renderPauseScreen(p) {
    // Dark overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
}

/**
 * Render Level Complete Screen
 */
export function renderLevelComplete(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.DOOR_UNLOCKED);
    p.textSize(40);
    p.text("LEVEL CLEARED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 30);
    
    p.fill(255);
    p.textSize(18);
    p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
}

/**
 * Render Game Over (Win/Lose)
 */
export function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(255, 215, 0);
        p.textSize(50);
        p.text("YOU WIN!", CANVAS_WIDTH/2, 150);
        p.textSize(20);
        p.fill(255);
        p.text("All levels completed!", CANVAS_WIDTH/2, 200);
        p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 230); // Display final score on win
    } else {
        p.fill(255, 50, 50);
        p.textSize(50);
        p.text("GAME OVER", CANVAS_WIDTH/2, 150);
        p.textSize(20);
        p.fill(255);
        p.text("A squad member was lost.", CANVAS_WIDTH/2, 200);
        p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 230); // Display final score on lose
    }
    
    p.fill(200);
    p.textSize(16);
    p.text("Press R to Restart Game", CANVAS_WIDTH/2, 300);
}