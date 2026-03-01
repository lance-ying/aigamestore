/**
 * ui.js
 * Renders HUD, menus, and overlays.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE, gameState } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // HUD
    if (gameState.gamePhase === "PLAYING") {
        p.fill(PALETTE.ui.text);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.text(`Level ${gameState.currentLevelIndex + 1}`, 20, 20);
        
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
    }
    
    // Start Screen
    if (gameState.gamePhase === "START") {
        p.background(PALETTE.background);
        p.textAlign(p.CENTER, p.CENTER);
        
        // Title
        p.fill(PALETTE.ui.text);
        p.textSize(40);
        p.text("VALLEY OF ILLUSIONS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
        
        // Subtitle
        p.textSize(16);
        p.text("Perspective is Reality", CANVAS_WIDTH/2, CANVAS_HEIGHT/3 + 40);
        
        // Instructions
        p.textSize(14);
        p.text("Arrow Keys to Move  |  Z to Rotate World", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
        p.text("Connect the paths. Guide the Pilgrim.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 45);
        
        p.textSize(20);
        p.fill(PALETTE.crow_beak); // Gold/Orange
        if (p.frameCount % 60 < 30) {
            p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.8);
        }
    }
    
    // Pause Screen
    if (gameState.gamePhase === "PAUSED") {
        p.fill(PALETTE.ui.overlay);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        p.fill(PALETTE.ui.text);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(30);
        p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }
    
    // Game Over / Win
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        p.fill(PALETTE.ui.overlay);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        p.textAlign(p.CENTER, p.CENTER);
        
        if (gameState.gamePhase === "GAME_OVER_WIN") {
            p.fill(PALETTE.goal);
            p.textSize(40);
            p.text("JOURNEY COMPLETE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        } else {
            p.fill(PALETTE.blocks.dark);
            p.textSize(40);
            p.text("THE PATH IS LOST", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        }
        
        p.fill(PALETTE.ui.text);
        p.textSize(16);
        p.text("Press R to Restart Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    }
    
    p.pop();
}