/**
 * UI Rendering: Grid, HUD, Menus
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, COLORS, COMMANDS, LEVELS, MAX_COMMANDS } from './globals.js';
import { TILES } from './levels.js';

export function renderGame(p) {
    drawBackground(p);
    drawGrid(p);
    drawEntities(p);
    drawEffects(p);
    drawHUD(p);
}

function drawBackground(p) {
    p.background(COLORS.BACKGROUND);
}

function drawGrid(p) {
    const grid = gameState.grid;
    if (!grid) return;

    p.push();
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const tile = grid[y][x];
            const px = GRID_OFFSET_X + x * TILE_SIZE;
            const py = GRID_OFFSET_Y + y * TILE_SIZE;

            // Stroke
            p.stroke(COLORS.GRID_LINES);
            p.strokeWeight(1);

            // Fill based on tile
            if (tile === TILES.WALL) {
                p.fill(COLORS.WALL);
                p.rect(px, py, TILE_SIZE, TILE_SIZE);
                // 3D effect top
                p.fill(COLORS.WALL[0] + 20, COLORS.WALL[1] + 20, COLORS.WALL[2] + 20);
                p.rect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === TILES.GOAL) {
                p.fill(COLORS.GOAL[0], COLORS.GOAL[1], COLORS.GOAL[2], 100);
                p.rect(px, py, TILE_SIZE, TILE_SIZE);
                p.noFill();
                p.stroke(COLORS.GOAL);
                p.rect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
            } else if (tile === TILES.HAZARD) {
                p.fill(COLORS.HAZARD[0], COLORS.HAZARD[1], COLORS.HAZARD[2], 50 + p.sin(p.frameCount * 0.2) * 20);
                p.rect(px, py, TILE_SIZE, TILE_SIZE);
            } else {
                p.noFill();
                p.rect(px, py, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    p.pop();
}

function drawEntities(p) {
    gameState.enemies.forEach(e => e.render(p));
    
    // Draw inactive units first
    gameState.units.forEach((u, index) => {
        if (index !== gameState.activeUnitIndex) u.render(p, false);
    });
    
    // Draw active unit on top
    if (gameState.units[gameState.activeUnitIndex]) {
        gameState.units[gameState.activeUnitIndex].render(p, true);
    }
}

function drawEffects(p) {
    for (let i = gameState.effects.length - 1; i >= 0; i--) {
        const effect = gameState.effects[i];
        effect.update();
        effect.render(p);
        if (effect.life <= 0) {
            gameState.effects.splice(i, 1);
        }
    }
}

function drawHUD(p) {
    // Bottom Panel
    const panelY = CANVAS_HEIGHT - 100;
    p.fill(COLORS.UI_BG);
    p.stroke(COLORS.UI_BORDER);
    p.rect(0, panelY, CANVAS_WIDTH, 100);

    // Level Info
    p.fill(COLORS.TEXT);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.noStroke();
    p.text(`LEVEL ${gameState.currentLevelIndex + 1}`, 10, 10);
    p.text(LEVELS[gameState.currentLevelIndex].description, 80, 10);

    // Active Robot Info
    p.text(`UNIT ${gameState.activeUnitIndex + 1} // PROGRAMMING`, 20, panelY + 10);

    // Command Slots
    const slotWidth = 50;
    const slotGap = 10;
    const startX = 20;
    const startY = panelY + 35;

    const activeUnit = gameState.units[gameState.activeUnitIndex];
    if (!activeUnit) return;

    for (let i = 0; i < MAX_COMMANDS; i++) {
        const x = startX + i * (slotWidth + slotGap);
        const y = startY;
        
        // Slot BG
        const isSelected = (!gameState.isSimulating && i === gameState.selectedSlotIndex);
        const isExecuting = (gameState.isSimulating && i === gameState.simulationStep);

        p.strokeWeight(2);
        if (isExecuting) {
            p.stroke(0, 255, 0);
            p.fill(50, 60, 50);
        } else if (isSelected) {
            p.stroke(255, 200, 0);
            p.fill(COLORS.UI_BG);
        } else {
            p.stroke(COLORS.UI_BORDER);
            p.fill(20);
        }
        
        p.rect(x, y, slotWidth, 40, 4);

        // Command Icon
        drawCommandIcon(p, activeUnit.commands[i], x + slotWidth / 2, y + 20);
    }

    // Status / Help
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(12);
    p.fill(150);
    if (gameState.isSimulating) {
        p.text("SIMULATING...", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
    } else {
        p.text("ARROWS: EDIT | SPACE: CLEAR | Z: RUN", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
    }
}

function drawCommandIcon(p, cmd, x, y) {
    p.push();
    p.translate(x, y);
    p.noStroke();
    p.rectMode(p.CENTER);

    switch (cmd) {
        case COMMANDS.MOVE:
            p.fill(COLORS.COMMAND_MOVE);
            p.triangle(0, -8, -6, 4, 6, 4);
            break;
        case COMMANDS.TURN_LEFT:
            p.fill(COLORS.COMMAND_TURN_L);
            p.arc(0, 0, 16, 16, p.PI, p.PI + p.HALF_PI);
            p.triangle(-8, 0, -4, -4, -4, 4);
            break;
        case COMMANDS.TURN_RIGHT:
            p.fill(COLORS.COMMAND_TURN_R);
            p.arc(0, 0, 16, 16, -p.HALF_PI, 0);
            p.triangle(8, 0, 4, -4, 4, 4);
            break;
        case COMMANDS.ATTACK:
            p.fill(COLORS.COMMAND_ATTACK);
            p.circle(0, 0, 10);
            p.stroke(255);
            p.strokeWeight(2);
            p.line(-6, -6, 6, 6);
            p.line(6, -6, -6, 6);
            break;
        case COMMANDS.WAIT:
            p.fill(COLORS.COMMAND_WAIT);
            p.rect(0, 0, 10, 10);
            break;
        default:
            p.fill(COLORS.COMMAND_EMPTY);
            p.circle(0, 0, 4);
    }
    p.pop();
}

export function renderStartScreen(p) {
    p.background(COLORS.BACKGROUND);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Glitch title effect
    p.fill(255, 0, 0, 100);
    p.textSize(60);
    p.text("EXCEPTION", CANVAS_WIDTH / 2 + p.random(-2, 2), CANVAS_HEIGHT / 3);
    
    p.fill(0, 255, 255, 100);
    p.text("EXCEPTION", CANVAS_WIDTH / 2 + p.random(-2, 2), CANVAS_HEIGHT / 3);
    
    p.fill(255);
    p.text("EXCEPTION", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);

    p.textSize(20);
    p.fill(COLORS.TEXT);
    p.text("SYSTEM CORRUPTION DETECTED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(16);
    p.fill(150);
    p.text("PROGRAM UNITS TO RESOLVE ANOMALIES", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
    p.fill(COLORS.GOAL);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO INITIALIZE", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
    }
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(30);
    p.text("SYSTEM PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function renderGameOver(p) {
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    
    if (isWin) {
        p.fill(COLORS.GOAL);
        p.text("SYSTEM RESTORED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        p.textSize(20);
        p.fill(255);
        p.text("ALL ANOMALIES CLEARED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    } else {
        p.fill(COLORS.HAZARD);
        p.text("FATAL ERROR", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        p.textSize(20);
        p.fill(255);
        p.text("UNIT TERMINATED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    }
    
    p.textSize(16);
    p.fill(150);
    p.text("PRESS R TO REBOOT", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
}