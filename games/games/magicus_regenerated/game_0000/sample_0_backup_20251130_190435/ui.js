import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GRID_OFFSET_X, GRID_OFFSET_Y, TILE_SIZE, RUNE_TYPES } from './globals.js';
import { getRuneColor } from './match3.js';
import { renderParticles } from './particles.js';

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(COLORS.ACCENT);
    p.textSize(48);
    p.text("MAGICUS", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.fill(COLORS.TEXT);
    p.textSize(18);
    p.text("Match elemental runes to defeat monsters!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.textSize(24);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.7);
    }
    
    renderControls(p);
}

function renderControls(p) {
    p.textSize(12);
    p.fill(150);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Arrows: Move | Z: Swap | Space: Ultimate | R: Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
}

export function renderGame(p) {
    p.background(COLORS.BACKGROUND);
    
    // Draw Rune Legend at top
    renderRuneLegend(p);
    
    // Draw Split Layout
    
    // Left Panel: Stats & Battle Area
    p.fill(COLORS.UI_BG);
    p.noStroke();
    p.rect(0, 50, GRID_OFFSET_X - 20, CANVAS_HEIGHT - 50);
    
    renderBattleScene(p);
    renderPlayerStats(p);
    
    // Right Panel: Grid
    renderGrid(p);
    
    // Overlays
    renderParticles(p);
}

function renderRuneLegend(p) {
    const y = 25;
    const size = 15;
    const gap = 110;
    let x = 30;
    
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.noStroke();
    
    const runes = [
        { type: RUNE_TYPES.FIRE, label: "DMG" },
        { type: RUNE_TYPES.WATER, label: "HEAL" },
        { type: RUNE_TYPES.EARTH, label: "SHIELD" },
        { type: RUNE_TYPES.LIGHT, label: "MANA" },
        { type: RUNE_TYPES.DARK, label: "BONUS" }
    ];
    
    runes.forEach(rune => {
        p.fill(getRuneColor(rune.type));
        p.rect(x, y - size/2, size, size, 2);
        p.fill(COLORS.TEXT);
        p.text(rune.label, x + size + 5, y);
        x += gap;
    });
}

function renderBattleScene(p) {
    // Enemy
    if (gameState.currentEnemy) {
        const ex = 140;
        const ey = 150;
        
        // Simple Enemy Sprite
        p.push();
        p.translate(ex, ey);
        
        // Bobbing animation
        const bob = Math.sin(p.frameCount * 0.05) * 5;
        p.translate(0, bob);
        
        // Shadow
        p.fill(0, 0, 0, 100);
        p.ellipse(0, 40, 60, 20);
        
        // Body
        p.fill(COLORS.HP);
        p.stroke(255);
        p.strokeWeight(2);
        p.beginShape();
        p.vertex(0, -30);
        p.vertex(25, 0);
        p.vertex(15, 30);
        p.vertex(-15, 30);
        p.vertex(-25, 0);
        p.endShape(p.CLOSE);
        
        // Eyes
        p.fill(255);
        p.circle(-10, -5, 8);
        p.circle(10, -5, 8);
        p.fill(0);
        p.circle(-10, -5, 3);
        p.circle(10, -5, 3);
        
        // Name & HP
        p.noStroke();
        p.fill(COLORS.TEXT);
        p.textSize(16);
        p.textAlign(p.CENTER);
        p.text(gameState.currentEnemy.name, 0, -50);
        
        // HP Bar
        renderBar(p, -40, 45, 80, 10, gameState.currentEnemy.hp, gameState.currentEnemy.maxHp, COLORS.HP);
        
        p.pop();
    }
}

function renderPlayerStats(p) {
    // Player Avatar (Bottom Left)
    const px = 60;
    const py = 300;
    
    p.push();
    p.translate(px, py);
    
    // Avatar
    p.fill(COLORS.MANA);
    p.stroke(255);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 40, 40, 5);
    
    // Face
    p.fill(255);
    p.rect(-10, -5, 5, 5);
    p.rect(10, -5, 5, 5);
    
    p.noStroke();
    p.fill(COLORS.TEXT);
    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text(gameState.player.name, 30, -10);
    p.textSize(12);
    p.text(`Stage ${gameState.stage}/${gameState.maxStages}`, 30, 10);
    
    p.pop();
    
    // Player Bars
    const barX = 20;
    const barY = 340;
    const barW = 240;
    
    // HP
    p.textAlign(p.LEFT, p.BOTTOM);
    p.fill(COLORS.TEXT);
    p.textSize(12);
    p.text("HP", barX, barY);
    renderBar(p, barX + 25, barY - 10, 150, 10, gameState.player.hp, gameState.player.maxHp, COLORS.HP);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.text(`${Math.ceil(gameState.player.hp)}`, barX + 210, barY);
    
    // Mana / Ultimate Bar - Polished
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text("ULT", barX, barY + 20);
    
    // Glow effect if full
    if (gameState.player.mana >= gameState.player.maxMana) {
        p.drawingContext.shadowBlur = 15;
        p.drawingContext.shadowColor = COLORS.LIGHT;
    }
    
    renderBar(p, barX + 25, barY + 10, 150, 12, gameState.player.mana, gameState.player.maxMana, COLORS.MANA);
    
    p.drawingContext.shadowBlur = 0; // Reset
    
    // Shield
    if (gameState.player.shield > 0) {
        p.fill(COLORS.SHIELD);
        p.text(`Shield: ${gameState.player.shield}`, barX, barY + 40);
    }
    
    // Ultimate Ready Text
    if (gameState.player.mana >= gameState.player.maxMana) {
        p.fill(COLORS.LIGHT);
        p.textAlign(p.CENTER);
        p.textStyle(p.BOLD);
        // Pulse effect
        const scale = 1 + Math.sin(p.frameCount * 0.1) * 0.1;
        p.push();
        p.translate(140, 390);
        p.scale(scale);
        p.text("ULTIMATE READY! (SPACE)", 0, 0);
        p.pop();
    }
}

function renderBar(p, x, y, w, h, val, max, color) {
    p.noStroke();
    p.fill(50);
    p.rectMode(p.CORNER);
    p.rect(x, y, w, h, 4); // Rounded bg
    
    if (val > 0) {
        p.fill(color);
        const fillW = Math.max(0, Math.min(w, w * (val / max)));
        p.rect(x, y, fillW, h, 4); // Rounded fg
        
        // Shine effect
        p.fill(255, 255, 255, 50);
        p.rect(x, y, fillW, h/2, 4);
    }
}

function renderGrid(p) {
    p.push();
    p.translate(GRID_OFFSET_X, GRID_OFFSET_Y);
    
    // Background
    p.fill(COLORS.GRID_BG);
    p.stroke(50);
    p.rect(0, 0, TILE_SIZE * 6, TILE_SIZE * 6);
    
    // Tiles
    gameState.grid.forEach(col => {
        col.forEach(tile => {
            if (tile.type !== -1) {
                renderTile(p, tile);
            }
        });
    });
    
    // Cursor
    if (gameState.turnState === "PLAYER_INPUT") {
        const cx = gameState.cursor.c * TILE_SIZE;
        const cy = gameState.cursor.r * TILE_SIZE;
        
        p.noFill();
        p.stroke(255);
        p.strokeWeight(3);
        p.rect(cx, cy, TILE_SIZE, TILE_SIZE);
        
        // Selected Highlight
        if (gameState.selectedTile) {
            const sx = gameState.selectedTile.c * TILE_SIZE;
            const sy = gameState.selectedTile.r * TILE_SIZE;
            p.stroke(COLORS.ACCENT);
            p.rect(sx, sy, TILE_SIZE, TILE_SIZE);
        }
    }
    
    p.pop();
}

function renderTile(p, tile) {
    const x = tile.x + TILE_SIZE/2;
    const y = tile.y + TILE_SIZE/2;
    const size = TILE_SIZE * 0.8;
    const color = getRuneColor(tile.type);
    
    p.push();
    p.translate(x, y);
    p.fill(color);
    p.noStroke();
    
    // Shapes
    switch(tile.type) {
        case RUNE_TYPES.FIRE: // Triangle
            p.triangle(0, -size/2, size/2, size/2, -size/2, size/2);
            break;
        case RUNE_TYPES.WATER: // Circle
            p.circle(0, 0, size);
            break;
        case RUNE_TYPES.EARTH: // Square
            p.rectMode(p.CENTER);
            p.rect(0, 0, size, size, 4);
            break;
        case RUNE_TYPES.LIGHT: // Diamond
            p.beginShape();
            p.vertex(0, -size/2);
            p.vertex(size/2, 0);
            p.vertex(0, size/2);
            p.vertex(-size/2, 0);
            p.endShape(p.CLOSE);
            break;
        case RUNE_TYPES.DARK: // Star/Cross
            p.rectMode(p.CENTER);
            p.rect(0, 0, size, size/3);
            p.rect(0, 0, size/3, size);
            break;
    }
    
    p.pop();
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
}

export function renderGameOver(p) {
    p.fill(0, 0, 0, 220);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(isWin ? COLORS.ACCENT : COLORS.HP);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(COLORS.TEXT);
    p.textSize(24);
    p.text(isWin ? "You are the Master of Magic!" : "The monsters prevailed...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
}