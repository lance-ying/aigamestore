/**
 * ui.js
 * Rendering the HUD, menus, and game screens.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderHUD(p) {
    if (!gameState.player) return;

    // 1. Health Bar
    p.push();
    p.textAlign(p.LEFT, p.TOP);
    p.fill(255);
    p.text("HP:", 10, 10);
    
    const maxHP = 100;
    const currentHP = gameState.player.health;
    const barW = 150;
    const barH = 15;
    
    p.noStroke();
    p.fill(100, 0, 0);
    p.rect(40, 10, barW, barH);
    p.fill(255, 0, 0);
    p.rect(40, 10, (currentHP / maxHP) * barW, barH);
    p.stroke(255);
    p.noFill();
    p.rect(40, 10, barW, barH);
    p.pop();

    // 2. Inventory Hotbar
    renderHotbar(p);

    // 3. Game Info (Day/Night) - Optional
    // p.text(`Time: ${Math.floor(gameState.timeOfDay * 24)}:00`, CANVAS_WIDTH - 80, 10);
}

function renderHotbar(p) {
    const slotSize = 40;
    const padding = 5;
    const inv = gameState.player.inventory;
    const totalW = inv.length * (slotSize + padding);
    const startX = (CANVAS_WIDTH - totalW) / 2;
    const startY = CANVAS_HEIGHT - slotSize - 10;

    p.push();
    p.stroke(200);
    p.strokeWeight(2);
    
    inv.forEach((slot, index) => {
        const x = startX + index * (slotSize + padding);
        
        // Background
        p.fill(0, 0, 0, 150);
        if (index === gameState.player.selectedSlot) {
            p.stroke(255, 215, 0); // Gold highlight
            p.fill(50, 50, 50, 180);
        } else {
            p.stroke(100);
        }
        
        p.rect(x, startY, slotSize, slotSize);
        
        // Item Name / Icon
        p.noStroke();
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.text(slot.name, x + slotSize/2, startY + slotSize - 8);
        
        // Count
        if (slot.type === 'block') {
            p.textAlign(p.RIGHT, p.TOP);
            p.text(slot.count, x + slotSize - 2, startY + 2);
        }
    });
    p.pop();
}

export function renderStartScreen(p) {
    p.background(30, 30, 40);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(0, 200, 255);
    p.textSize(50);
    p.text("VOXEL VENTURE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // Instructions
    p.fill(220);
    p.textSize(16);
    const instructions = 
        "Explore. Build. Survive.\n" +
        "Find the Blue Core to Win.\n\n" +
        "ARROWS to Move/Aim\n" +
        "SPACE to Jump\n" +
        "SHIFT to switch Items\n" +
        "Z to Mine/Place/Attack\n\n" +
        "PRESS ENTER TO START";
    
    p.text(instructions, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderPausedScreen(p) {
    // Overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOverWin(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(0, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("YOU FOUND THE CORE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("The world is saved.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("Press R to Play Again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

export function renderGameOverLose(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("You perished in the dark.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("Press R to Try Again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}