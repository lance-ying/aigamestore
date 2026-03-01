/**
 * User Interface Renderer
 * 
 * Handles HUD, Start/Pause/GameOver screens, and Scanline effects.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';

export function renderStartScreen(p) {
    p.background(10, 10, 15);
    drawScanlines(p);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(COLORS.PLAYER_OUTLINE);
    p.textSize(40);
    p.text("WELL OF ECHOES", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.textSize(16);
    p.fill(200);
    p.text("Explore the depths. Survive the shadows.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.fill(255);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    }
    
    // Instructions
    p.textSize(12);
    p.fill(150);
    p.text("ARROWS: Move | SPACE: Jump | Z: Item | SHIFT: Switch Item", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderHUD(p) {
    // Hearts
    const hp = gameState.player ? gameState.player.health : 0;
    for (let i = 0; i < 3; i++) {
        if (i < hp) p.fill(255, 50, 50);
        else p.fill(50, 0, 0);
        p.stroke(255);
        p.strokeWeight(1);
        p.rect(10 + i * 25, 10, 20, 20);
    }
    
    // Inventory
    p.noStroke();
    p.fill(0, 0, 0, 150);
    p.rect(CANVAS_WIDTH - 60, 10, 50, 50, 5);
    p.stroke(100);
    p.rect(CANVAS_WIDTH - 60, 10, 50, 50, 5);
    
    const item = gameState.collectedItems[gameState.equippedItemIndex];
    if (item) {
        p.push();
        p.translate(CANVAS_WIDTH - 35, 35);
        if (item === "BUBBLE_WAND") {
            p.fill(COLORS.ITEM_BUBBLE);
            p.circle(0, -4, 12);
            p.rect(-2, 0, 4, 12);
        } else if (item === "DISC") {
            p.fill(COLORS.ITEM_DISC);
            p.circle(0, 0, 20);
        }
        p.pop();
    }
    
    // Coords Debug
    if (gameState.debugMode) {
        p.fill(255);
        p.noStroke();
        p.textAlign(p.LEFT, p.TOP);
        p.text(`Room: ${gameState.currentRoomX}, ${gameState.currentRoomY}`, 10, 40);
        p.text(`FPS: ${Math.floor(p.frameRate())}`, 10, 60);
    }
}

export function renderPauseScreen(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_LOSE") {
        p.fill(255, 50, 50);
        p.textSize(40);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    } else {
        p.fill(50, 255, 50);
        p.textSize(40);
        p.text("ESCAPED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    }
    
    p.fill(255);
    p.textSize(16);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
}

export function drawScanlines(p) {
    p.stroke(0, 0, 0, 50);
    p.strokeWeight(1);
    for(let i=0; i<CANVAS_HEIGHT; i+=4) {
        p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Vignette
    p.noFill();
    p.stroke(0, 0, 0, 100);
    p.strokeWeight(50);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}