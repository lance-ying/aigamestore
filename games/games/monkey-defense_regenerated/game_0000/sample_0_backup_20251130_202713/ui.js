import { gameState, TOWER_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_PATH, PATH_WIDTH } from './globals.js';
import { isPointOnPath, isOverlappingTower } from './physics.js';

export function renderBackground(p) {
    p.background(34, 139, 34); // Forest Green
    
    // Draw Path
    p.noFill();
    p.stroke(169, 169, 169); // Dark Grey
    p.strokeWeight(PATH_WIDTH);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    
    p.beginShape();
    LEVEL_PATH.forEach(pt => p.vertex(pt.x, pt.y));
    p.endShape();
    
    // Reset stroke
    p.strokeWeight(1);
    p.noStroke();
}

export function renderUI(p) {
    // Top HUD
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`$${gameState.money}`, 10, 20);
    p.text(`Lives: ${gameState.lives}`, 100, 20);
    p.text(`Wave: ${gameState.currentWave + 1}`, 200, 20);
    
    // Wave status / Instructions
    p.textAlign(p.RIGHT, p.CENTER);
    if (!gameState.waveActive) {
        p.fill(0, 255, 0);
        p.text("PRESS ENTER TO START WAVE", CANVAS_WIDTH - 10, 20);
    } else {
        p.fill(200);
        p.text("WAVE IN PROGRESS", CANVAS_WIDTH - 10, 20);
    }
    
    // Bottom Control HUD
    p.fill(0, 0, 0, 150);
    p.rect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
    
    // Selected Tower Info for Placement
    const currentType = TOWER_TYPES[gameState.selectedTowerType];
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.fill(200);
    p.text("BUILD [Space]:", 10, CANVAS_HEIGHT - 55);
    
    p.fill(currentType.color);
    p.text(`${currentType.name} ($${currentType.cost})`, 10, CANVAS_HEIGHT - 35);
    p.fill(150);
    p.text("[Z] to Switch", 10, CANVAS_HEIGHT - 20);

    // Selected Existing Tower Info
    if (gameState.selectedTower) {
        const t = gameState.selectedTower;
        const meta = TOWER_TYPES[t.typeKey];
        const nextUpgradeCost = meta.upgradeCost;
        
        p.textAlign(p.RIGHT, p.TOP);
        p.fill(255, 215, 0);
        p.text("SELECTED TOWER", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 55);
        p.fill(255);
        p.text(`Lvl ${t.level} ${meta.name}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 35);
        
        if (gameState.money >= nextUpgradeCost) p.fill(0, 255, 0);
        else p.fill(255, 100, 100);
        
        p.text(`[Shift] Upgrade ($${nextUpgradeCost})`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 20);
    }

    // Draw Cursor
    renderCursor(p, currentType);
}

function renderCursor(p, towerType) {
    const cx = gameState.cursor.x;
    const cy = gameState.cursor.y;
    
    // Visualise range of tower to build
    p.noFill();
    p.stroke(255, 255, 255, 100);
    p.circle(cx, cy, towerType.range * 2);
    
    // Validation Color
    const invalid = gameState.money < towerType.cost || isPointOnPath(cx, cy, 15) || isOverlappingTower(cx, cy, 15);
    
    p.stroke(invalid ? [255, 0, 0] : [0, 255, 0]);
    p.strokeWeight(2);
    
    // Crosshair
    const s = 10;
    p.line(cx - s, cy, cx + s, cy);
    p.line(cx, cy - s, cx, cy + s);
    
    // Ghost of tower
    p.noStroke();
    p.fill(towerType.color[0], towerType.color[1], towerType.color[2], 100);
    p.circle(cx, cy, 30);
}

export function renderStartScreen(p) {
    p.background(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PRIMATE PATROL", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(16);
    p.fill(200);
    p.text("Defend the path from the Bloons!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    p.text("Arrow Keys to Move Cursor", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text("SPACE to Build | Z to Switch Tower", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 45);
    p.text("ENTER to Start Wave", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
    
    p.fill(0, 255, 0);
    p.textSize(24);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 80);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p, win) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    
    if (win) {
        p.fill(0, 255, 0);
        p.text("VICTORY!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    } else {
        p.fill(255, 0, 0);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}