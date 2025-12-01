import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_TYPES, PATH_POINTS } from './globals.js';
import { isValidPlacement } from './physics.js';

export function renderBackground(p) {
    p.background(34, 139, 34); // Forest Green
    
    // Draw Path
    p.noFill();
    p.stroke(210, 180, 140); // Tan/Dirt path
    p.strokeWeight(30);
    p.strokeCap(p.ROUND);
    p.strokeJoin(p.ROUND);
    
    p.beginShape();
    for (const pt of PATH_POINTS) {
        p.vertex(pt.x, pt.y);
    }
    p.endShape();
    
    // Path Border
    p.stroke(139, 69, 19, 100);
    p.strokeWeight(34);
    p.noFill();
    p.beginShape();
    for (const pt of PATH_POINTS) {
        p.vertex(pt.x, pt.y);
    }
    p.endShape();
}

export function renderUI(p) {
    // Top Bar
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    
    // Stats
    const heartSymbol = "♥";
    const moneySymbol = "$";
    
    p.fill(255, 100, 100);
    p.text(`${heartSymbol} ${gameState.lives}`, 20, 20);
    
    p.fill(255, 215, 0);
    p.text(`${moneySymbol} ${gameState.money}`, 100, 20);
    
    p.fill(200);
    p.text(`Wave: ${gameState.wave - 1}`, 200, 20);
    p.text(`Score: ${gameState.score}`, 300, 20);
    
    // Selected Tower Info
    const selectedTower = TOWER_TYPES[gameState.cursor.selectedTowerIndex];
    p.textAlign(p.RIGHT, p.CENTER);
    p.fill(200, 200, 255);
    p.text(`Build (Z): ${selectedTower.name} ($${selectedTower.cost})`, CANVAS_WIDTH - 20, 20);
    
    // Cursor Rendering
    renderCursor(p);
}

function renderCursor(p) {
    const cx = gameState.cursor.x;
    const cy = gameState.cursor.y;
    
    // Draw crosshair
    p.stroke(255);
    p.strokeWeight(2);
    p.line(cx - 10, cy, cx + 10, cy);
    p.line(cx, cy - 10, cx, cy + 10);
    
    // Hover logic
    const hoveredTower = gameState.towers.find(t => 
        p.dist(t.x, t.y, cx, cy) < 15
    );
    
    if (hoveredTower) {
        // Show Upgrade info
        p.textAlign(p.CENTER);
        p.fill(255);
        p.noStroke();
        p.textSize(12);
        p.text(`SHIFT to Upgrade ($${hoveredTower.upgradeCost})`, cx, cy - 30);
        
        // Draw tower range
        p.noFill();
        p.stroke(255, 255, 255, 150);
        p.circle(hoveredTower.x, hoveredTower.y, hoveredTower.range * 2);
    } else {
        // Show Build Preview
        const type = TOWER_TYPES[gameState.cursor.selectedTowerIndex];
        const canAfford = gameState.money >= type.cost;
        const isValid = isValidPlacement(cx, cy);
        
        // Range preview
        p.noFill();
        if (canAfford && isValid) p.stroke(255, 255, 255, 100);
        else p.stroke(255, 0, 0, 100);
        p.circle(cx, cy, type.range * 2);
        
        // Ghost tower
        p.noStroke();
        const c = p.color(type.color);
        c.setAlpha(100);
        p.fill(c);
        p.circle(cx, cy, 20);
        
        if (!canAfford) {
            p.fill(255, 0, 0);
            p.textSize(10);
            p.textAlign(p.CENTER);
            p.text("Too Expensive", cx, cy - 20);
        } else if (!isValid) {
            p.fill(255, 0, 0);
            p.textSize(10);
            p.textAlign(p.CENTER);
            p.text("Invalid Spot", cx, cy - 20);
        }
    }
}

export function renderStartScreen(p) {
    p.background(30);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(255, 215, 0);
    p.textSize(40);
    p.text("MONKEY DEFENSE", CANVAS_WIDTH/2, 100);
    
    p.fill(200);
    p.textSize(16);
    p.text("Stop the Bloons from reaching the end!", CANVAS_WIDTH/2, 160);
    p.text("Controls:", CANVAS_WIDTH/2, 200);
    p.text("ARROWS: Move Cursor | Z: Switch Tower", CANVAS_WIDTH/2, 230);
    p.text("SPACE: Build Tower | SHIFT: Upgrade", CANVAS_WIDTH/2, 255);
    
    p.fill(0, 255, 0);
    p.textSize(24);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 320);
}

export function renderGameOver(p, isWin) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    if (isWin) {
        p.fill(0, 255, 0);
        p.textSize(48);
        p.text("VICTORY!", CANVAS_WIDTH/2, 150);
    } else {
        p.fill(255, 0, 0);
        p.textSize(48);
        p.text("GAME OVER", CANVAS_WIDTH/2, 150);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 220);
    p.text(`Waves Survived: ${gameState.wave - 1}`, CANVAS_WIDTH/2, 250);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, 320);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}