/**
 * ui.js
 * Renders HUD, screens, and overlays.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_TURNS } from './globals.js';

export function renderUI(p) {
    // --- HUD (Left Side) ---
    p.noStroke();
    
    // Grid Power (Health)
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(255);
    p.text("GRID POWER", 20, 20);
    
    // Power Bar
    const barWidth = 100;
    const barHeight = 15;
    p.fill(50);
    p.rect(20, 45, barWidth, barHeight);
    
    const powerPct = gameState.gridPower / gameState.maxGridPower;
    if (powerPct > 0.5) p.fill(0, 255, 0);
    else if (powerPct > 0.2) p.fill(255, 200, 0);
    else p.fill(255, 0, 0);
    
    p.rect(20, 45, barWidth * powerPct, barHeight);
    p.noFill();
    p.stroke(150);
    for(let i=1; i<gameState.maxGridPower; i++) {
        const x = 20 + (i/gameState.maxGridPower)*barWidth;
        p.line(x, 45, x, 45+barHeight);
    }

    // Turn Counter
    p.noStroke();
    p.fill(255);
    p.text(`TURN: ${gameState.currentTurn}/${MAX_TURNS}`, 20, 80);
    p.text(`PHASE: ${gameState.turnPhase.replace('_', ' ')}`, 20, 105);

    // Tips
    p.textSize(12);
    p.fill(150);
    p.text("Controls:", 20, 300);
    p.text("ARROWS: Move Cursor", 20, 320);
    p.text("SPACE: Select/Action", 20, 335);
    p.text("Z: Cancel/Deselect", 20, 350);
    p.text("SHIFT: End Turn", 20, 365);
    p.text("ESC: Pause", 20, 380);

    // --- Unit Tooltip ---
    // If hovering over unit, show stats
    const hoverTile = gameState.grid[gameState.cursor.x][gameState.cursor.y];
    if (hoverTile.entity) {
        const ent = hoverTile.entity;
        p.fill(20, 20, 30, 230);
        p.stroke(100);
        p.rect(480, 20, 100, 120, 5);
        
        p.noStroke();
        p.fill(255);
        p.textAlign(p.CENTER, p.TOP);
        let name = "UNKNOWN";
        if (ent.type === "MECH") name = ent.mechType;
        if (ent.type === "VEK") name = ent.vekType;
        if (ent.constructor.name === "Building") name = "BLDG";
        if (ent.constructor.name === "Mountain") name = "MTN";
        
        p.text(name, 530, 30);
        p.textSize(10);
        p.text(`HP: ${ent.hp}/${ent.maxHp}`, 530, 50);
        if (ent.moveRange) p.text(`MOVE: ${ent.moveRange}`, 530, 65);
        if (ent.damage) p.text(`DMG: ${ent.damage}`, 530, 80);
    }
}

export function renderStartScreen(p) {
    p.background(20, 20, 30);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Glitchy Title Effect
    p.textSize(48);
    if (p.random() > 0.95) p.fill(255, 0, 0); else p.fill(0, 200, 255);
    p.text("BREACH", CANVAS_WIDTH/2 - 2, 100);
    if (p.random() > 0.95) p.fill(0, 255, 0); else p.fill(255);
    p.text("PROTOCOL", CANVAS_WIDTH/2 + 2, 150);
    
    p.textSize(18);
    p.fill(200);
    p.text("Protect the Grid. Defeat the Vek.", CANVAS_WIDTH/2, 220);
    
    p.fill(0, 255, 0);
    if (p.frameCount % 60 < 30) p.text("PRESS ENTER TO DEPLOY", CANVAS_WIDTH/2, 300);
}

export function renderGameOver(p, isWin) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    
    if (isWin) {
        p.fill(0, 255, 0);
        p.text("VICTORY SECURED", CANVAS_WIDTH/2, 150);
        p.textSize(20);
        p.fill(255);
        p.text("The region is safe.", CANVAS_WIDTH/2, 200);
    } else {
        p.fill(255, 0, 0);
        p.text("TIMELINE LOST", CANVAS_WIDTH/2, 150);
        p.textSize(20);
        p.fill(255);
        p.text("Grid Power Depleted.", CANVAS_WIDTH/2, 200);
    }
    
    p.textSize(16);
    p.fill(150);
    p.text("Press R to Reset Timeline", CANVAS_WIDTH/2, 300);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("SYSTEM PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(16);
    p.text("ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    p.pop();
}