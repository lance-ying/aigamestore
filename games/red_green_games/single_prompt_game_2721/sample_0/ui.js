/**
 * ui.js
 * Rendering for HUD, Start Screen, Pause, etc.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState, CONFIG } from './globals.js';
import { setFillColor } from './utils.js';

export function renderUI(p) {
    // Top Bar HUD
    p.push();
    
    // Score
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Passengers: ${gameState.passengersDelivered}`, 20, 15);
    
    // Clock / Time
    const minutes = Math.floor(gameState.timeSinceStart / 60);
    const seconds = Math.floor(gameState.timeSinceStart % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    p.textAlign(p.RIGHT, p.TOP);
    p.text(timeStr, CANVAS_WIDTH - 20, 15);

    // Line Selector (Bottom)
    drawLineSelector(p);
    
    p.pop();
}

function drawLineSelector(p) {
    const count = CONFIG.MAX_LINES;
    const spacing = 40;
    const startX = CANVAS_WIDTH / 2 - ((count - 1) * spacing) / 2;
    const y = CANVAS_HEIGHT - 30;

    for (let i = 0; i < count; i++) {
        const x = startX + i * spacing;
        const isActive = gameState.cursor.activeLineIndex === i;
        
        // Circle bubble
        if (isActive) {
            p.stroke(0);
            p.strokeWeight(2);
            p.fill(255);
            p.circle(x, y, 28);
        }
        
        // Inner Color
        setFillColor(p, COLORS.LINES[i]);
        p.noStroke();
        p.circle(x, y, isActive ? 20 : 16);
        
        // Number
        p.fill(255);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(i + 1, x, y);
    }
    
    p.fill(COLORS.TEXT);
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Active Line (Z to Switch)", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 55);
}

export function renderCursor(p) {
    const c = gameState.cursor;
    const activeColor = COLORS.LINES[c.activeLineIndex];
    
    p.push();
    p.translate(c.x, c.y);
    
    // Crosshair
    p.stroke(activeColor[0], activeColor[1], activeColor[2]);
    p.strokeWeight(2);
    p.line(-10, 0, 10, 0);
    p.line(0, -10, 0, 10);
    
    // Ring
    p.noFill();
    p.circle(0, 0, 15);
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(COLORS.TEXT);
    p.textSize(40);
    p.text("NANO TRANSIT", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(16);
    p.text("Connect stations. Transport passengers. Keep the city moving.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(20);
    p.fill(100);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    
    p.textSize(12);
    p.text("Controls: Arrows to Move, Z to Switch Line, Space to Build", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.85);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(24);
    p.text(`Total Passengers Delivered: ${gameState.passengersDelivered}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}