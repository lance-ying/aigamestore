import { gameState, COLORS, GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE_PX, UI_PANEL_X, UI_PANEL_WIDTH, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { CELL_TYPE } from './grid.js';
import { colorToP5, getColorObj } from './utils.js';

export function renderUI(p) {
    renderGameGrid(p);
    renderHUD(p);
}

function renderGameGrid(p) {
    const g = gameState.grid;
    const cellSize = GRID_SIZE_PX / g.width; // Assuming square grid area for now
    
    p.push();
    p.translate(GRID_OFFSET_X, GRID_OFFSET_Y);
    
    // Draw grid background
    p.stroke(40);
    p.strokeWeight(1);
    for (let x = 0; x <= g.width; x++) {
        p.line(x * cellSize, 0, x * cellSize, g.height * cellSize);
    }
    for (let y = 0; y <= g.height; y++) {
        p.line(0, y * cellSize, g.width * cellSize, y * cellSize);
    }
    
    // Draw Pipes
    // We draw pipes by checking connections in cells
    p.noFill();
    const pipeWidth = cellSize * 0.4;
    
    for (let y = 0; y < g.height; y++) {
        for (let x = 0; x < g.width; x++) {
            const cell = g.cells[y][x];
            if (cell.colorIndex === -1) continue;
            
            const cx = x * cellSize + cellSize/2;
            const cy = y * cellSize + cellSize/2;
            const col = getColorObj(cell.colorIndex);
            
            // Draw connections
            p.stroke(colorToP5(p, col));
            p.strokeWeight(pipeWidth);
            p.strokeCap(p.ROUND);
            
            if (cell.connections.n) p.line(cx, cy, cx, cy - cellSize/2);
            if (cell.connections.e) p.line(cx, cy, cx + cellSize/2, cy);
            if (cell.connections.s) p.line(cx, cy, cx, cy + cellSize/2);
            if (cell.connections.w) p.line(cx, cy - cellSize/2, cx, cy); // Bug fix: line logic
            
            // Correct logic:
            if (cell.connections.w) p.line(cx, cy, cx - cellSize/2, cy);
            
            // Draw center for rounded joints
            p.noStroke();
            p.fill(colorToP5(p, col));
            p.circle(cx, cy, pipeWidth);
        }
    }
    
    // Draw Dots (Endpoints)
    for (let y = 0; y < g.height; y++) {
        for (let x = 0; x < g.width; x++) {
            const cell = g.cells[y][x];
            if (cell.type === CELL_TYPE.DOT) {
                const cx = x * cellSize + cellSize/2;
                const cy = y * cellSize + cellSize/2;
                const col = getColorObj(cell.colorIndex);
                
                p.noStroke();
                p.fill(colorToP5(p, col));
                
                // Pulsing effect if completed
                let size = cellSize * 0.7;
                if (gameState.completedColors.includes(cell.colorIndex)) {
                    size += Math.sin(gameState.frameCount * 0.1) * 4;
                }
                
                p.circle(cx, cy, size);
                
                // Inner white dot
                p.fill(255, 255, 255, 100);
                p.circle(cx, cy, size * 0.3);
            }
        }
    }
    
    // Draw Cursor
    const cx = gameState.cursor.x * cellSize;
    const cy = gameState.cursor.y * cellSize;
    
    p.stroke(255);
    p.strokeWeight(3);
    p.noFill();
    
    // Animated cursor box
    const padding = 4 + Math.sin(gameState.frameCount * 0.2) * 2;
    p.rect(cx + padding, cy + padding, cellSize - padding*2, cellSize - padding*2, 4);
    
    // If drawing, show indicator
    if (gameState.cursor.isDrawing) {
        p.noStroke();
        p.fill(255, 255, 255, 50);
        p.rect(cx, cy, cellSize, cellSize);
    }
    
    p.pop();
}

function renderHUD(p) {
    p.push();
    p.translate(UI_PANEL_X, GRID_OFFSET_Y);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    
    p.textSize(24);
    p.text(`Level ${gameState.levelIndex}`, 0, 0);
    
    p.textSize(14);
    p.text(`Grid: ${gameState.gridWidth}x${gameState.gridHeight}`, 0, 30);
    p.text(`Flows: ${gameState.completedColors.length} / ${gameState.activeColors.length}`, 0, 50);
    
    // Controls help
    p.textSize(12);
    p.fill(180);
    let y = 120;
    const lineHeight = 20;
    p.text("CONTROLS:", 0, y); y+= lineHeight;
    p.text("Arrows: Move", 0, y); y+= lineHeight;
    p.text("Space/Z: Draw", 0, y); y+= lineHeight;
    p.text("R: Restart Level", 0, y); y+= lineHeight;
    p.text("ESC: Pause", 0, y);
    
    // Color indicators
    y = 240;
    p.text("COLORS:", 0, y);
    y += 20;
    
    const swatchSize = 20;
    gameState.activeColors.forEach((col, i) => {
        p.fill(colorToP5(p, col));
        if (gameState.completedColors.includes(i)) {
            p.stroke(255);
            p.strokeWeight(2);
        } else {
            p.noStroke();
        }
        
        p.circle(swatchSize/2, y + swatchSize/2 + i*30, swatchSize);
        
        p.fill(200);
        p.noStroke();
        p.text(gameState.completedColors.includes(i) ? "OK" : "--", 30, y + i*30 + 4);
    });
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(20, 20, 30);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(48);
    p.text("FLOW CONNECT", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(18);
    p.fill(200);
    p.text("Connect matching colors to create a flow.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text("Pair all colors, and cover the entire board.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    p.textSize(24);
    p.fill(50, 255, 50);
    if (Math.floor(p.millis() / 500) % 2 === 0) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT * 0.75);
    }
}

export function renderGameOver(p) {
    // Overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(50, 255, 50);
        p.textSize(48);
        p.text("LEVEL CLEARED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        
        p.fill(255);
        p.textSize(20);
        p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else {
        // Lose isn't really possible in this puzzle mode unless we add timer
        p.fill(255, 50, 50);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    }
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}