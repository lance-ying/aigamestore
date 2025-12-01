// renderer.js
// Visual rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, HEX_SIZE, COLORS } from './globals.js';
import { Hex } from './hex_lib.js';
import { isValidMove, isValidAttack } from './logic.js';

export function renderGame(p) {
    p.push();
    
    // Center camera on grid
    p.translate(gameState.camera.x, gameState.camera.y);
    
    // Draw Background Grid
    drawGrid(p);
    
    // Draw Highlights (Danger, Path)
    drawOverlays(p);
    
    // Draw Entities (sorted by Y for simple depth)
    // Actually, entities have Z-index implicitly by drawing order. 
    // Player on top usually.
    const sortedEntities = [...gameState.entities].sort((a,b) => a.pixelPos.y - b.pixelPos.y);
    sortedEntities.forEach(e => e.render(p, {x:0, y:0}));
    
    // Draw Cursor
    if (gameState.gamePhase === "PLAYING") {
        drawCursor(p);
    }
    
    // Draw Animations / Particles
    // ...
    
    p.pop();
}

function drawGrid(p) {
    gameState.tiles.forEach((tile, key) => {
        const pix = tile.pixelPos;
        
        // Fill
        if (tile.type === 'WALL') p.fill(COLORS.HEX_WALL);
        else if (tile.type === 'EXIT') p.fill(COLORS.HEX_EXIT);
        else p.fill(COLORS.HEX_BG);
        
        p.stroke(COLORS.HEX_BORDER);
        p.strokeWeight(1);
        
        drawHex(p, pix.x, pix.y, HEX_SIZE);
        
        // Debug Coordinates
        // p.fill(100); p.noStroke(); p.textSize(8);
        // p.text(`${tile.q},${tile.r}`, pix.x, pix.y);
    });
}

function drawOverlays(p) {
    // Danger Tiles
    gameState.dangerTiles.forEach(key => {
        if (gameState.tiles.has(key)) {
            const tile = gameState.tiles.get(key);
            const pix = tile.pixelPos;
            
            p.fill(COLORS.DANGER);
            p.noStroke();
            drawHex(p, pix.x, pix.y, HEX_SIZE * 0.9);
        }
    });
}

function drawCursor(p) {
    const cPix = Hex.toPixel(gameState.cursor);
    
    // Highlight
    p.noFill();
    p.stroke(COLORS.CURSOR);
    p.strokeWeight(3);
    
    // Animate pulsing
    const scale = 1.0 + Math.sin(gameState.frameCount * 0.1) * 0.1;
    drawHex(p, cPix.x, cPix.y, HEX_SIZE * scale);
    
    // Intent Indicator
    if (gameState.turnState === "PLAYER_INPUT") {
        if (isValidMove(gameState.cursor)) {
            p.fill(0, 255, 0, 100);
            p.noStroke();
            p.circle(cPix.x, cPix.y, 10);
        } else if (isValidAttack(gameState.cursor)) {
            p.fill(255, 0, 0, 100);
            p.noStroke();
            p.circle(cPix.x, cPix.y, 10);
            
            // Draw cross
            p.stroke(255, 0, 0);
            p.strokeWeight(2);
            p.line(cPix.x - 5, cPix.y - 5, cPix.x + 5, cPix.y + 5);
            p.line(cPix.x + 5, cPix.y - 5, cPix.x - 5, cPix.y + 5);
        }
    }
}

function drawHex(p, x, y, size) {
    p.beginShape();
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30; // Pointy topped: start at -30 deg (flat top starts at 0)
        const angle_rad = Math.PI / 180 * angle_deg;
        p.vertex(x + size * Math.cos(angle_rad), y + size * Math.sin(angle_rad));
    }
    p.endShape(p.CLOSE);
}

export function renderUI(p) {
    // HUD
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.fill(COLORS.UI_TEXT);
    p.noStroke();
    
    p.text(`Depth: ${gameState.level}`, 20, 20);
    p.text(`Score: ${gameState.score}`, 20, 45);
    
    // Hearts
    if (gameState.player) {
        p.text(`HP: `, 20, 70);
        for (let i = 0; i < gameState.player.maxHp; i++) {
            if (i < gameState.player.hp) p.fill(255, 50, 50);
            else p.fill(100);
            p.circle(60 + i * 15, 78, 5);
        }
    }
    
    // Turn State
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(COLORS.UI_ACCENT);
    let stateText = "";
    if (gameState.turnState === "PLAYER_INPUT") stateText = "YOUR TURN";
    else if (gameState.turnState === "ENEMY_ACT") stateText = "ENEMY TURN";
    else stateText = "WAIT...";
    
    p.text(stateText, CANVAS_WIDTH - 20, 20);
    
    // Controls Hint
    p.textAlign(p.CENTER, p.BOTTOM);
    p.fill(150);
    p.textSize(12);
    p.text("Arrows: Move Cursor | Space: Act | Z: Wait", CANVAS_WIDTH/2, CANVAS_HEIGHT - 10);
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(COLORS.UI_TEXT);
    p.textSize(40);
    p.text("HEXA DUNGEON", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.textSize(18);
    p.fill(COLORS.UI_ACCENT);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    
    p.fill(150);
    p.textSize(14);
    p.text("Descend into the depths. Watch for danger.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_LOSE") {
        p.fill(COLORS.ENEMY_MELEE);
        p.textSize(40);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    } else {
        p.fill(COLORS.HEX_EXIT);
        p.textSize(40);
        p.text("VICTORY", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Depth: ${gameState.level}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
    
    p.textSize(18);
    p.fill(COLORS.UI_ACCENT);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    p.pop();
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}