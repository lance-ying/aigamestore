// ui.js - User Interface rendering
import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, 
    MAP_OFFSET_X, MAP_OFFSET_Y, UI_WIDTH, GAME_VIEW_WIDTH,
    COLORS, AVAILABLE_COMMANDS
} from './globals.js';

export function renderUI(p) {
    renderGameView(p);
    renderSidePanel(p);
    renderOverlay(p);
}

function renderGameView(p) {
    // Draw Grid Background
    p.noFill();
    p.stroke(COLORS.GRID_LINES);
    p.strokeWeight(1);
    
    const rows = gameState.rows;
    const cols = gameState.cols;
    
    for (let y = 0; y <= rows; y++) {
        p.line(MAP_OFFSET_X, MAP_OFFSET_Y + y * GRID_SIZE, MAP_OFFSET_X + cols * GRID_SIZE, MAP_OFFSET_Y + y * GRID_SIZE);
    }
    for (let x = 0; x <= cols; x++) {
        p.line(MAP_OFFSET_X + x * GRID_SIZE, MAP_OFFSET_Y, MAP_OFFSET_X + x * GRID_SIZE, MAP_OFFSET_Y + rows * GRID_SIZE);
    }
    
    // Draw Level Tiles
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const tile = gameState.grid[y][x];
            const posX = MAP_OFFSET_X + x * GRID_SIZE;
            const posY = MAP_OFFSET_Y + y * GRID_SIZE;
            
            if (tile === 1) { // Wall
                p.fill(COLORS.WALL);
                p.noStroke();
                p.rect(posX + 2, posY + 2, GRID_SIZE - 4, GRID_SIZE - 4, 2);
                
                // Wall detail
                p.fill(COLORS.BACKGROUND);
                p.rect(posX + 10, posY + 10, GRID_SIZE - 20, GRID_SIZE - 20);
            } else if (tile === 3) { // Exit
                p.fill(COLORS.GOAL);
                p.noStroke();
                
                // Base square
                p.rect(posX + 5, posY + 5, GRID_SIZE - 10, GRID_SIZE - 10);
                
                // Rotating frame animation
                p.push();
                p.translate(posX + GRID_SIZE/2, posY + GRID_SIZE/2);
                p.rotate(p.frameCount * 0.02);
                p.noFill();
                p.stroke(COLORS.GOAL);
                p.strokeWeight(2);
                p.rectMode(p.CENTER);
                const s = GRID_SIZE * 0.6 + p.sin(p.frameCount * 0.1) * 4;
                p.rect(0, 0, s, s);
                p.pop();
                
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(10);
                p.noStroke();
                p.text("EXIT", posX + GRID_SIZE/2, posY + GRID_SIZE/2);
            } else if (tile === 2) { // Start marker
                p.noFill();
                p.stroke(COLORS.TEXT_DIM);
                p.rect(posX + 10, posY + 10, GRID_SIZE - 20, GRID_SIZE - 20);
            }
        }
    }
}

function renderSidePanel(p) {
    const panelX = GAME_VIEW_WIDTH;
    
    // Background
    p.fill(COLORS.COMMAND_BG);
    p.noStroke();
    p.rect(panelX, 0, UI_WIDTH, CANVAS_HEIGHT);
    p.stroke(COLORS.GRID_LINES);
    p.line(panelX, 0, panelX, CANVAS_HEIGHT);
    
    // Header
    p.fill(COLORS.TEXT);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`LEVEL ${gameState.currentLevelIdx + 1}`, panelX + 20, 20);
    p.textSize(12);
    p.fill(COLORS.TEXT_DIM);
    p.text("COMMAND PALETTE", panelX + 20, 50);
    
    // Command Palette (Available Commands)
    let y = 75;
    AVAILABLE_COMMANDS.forEach((cmd, idx) => {
        // Highlight selection
        if (gameState.subPhase === "PROGRAMMING" && idx === gameState.selectedCommandIdx) {
            p.fill(COLORS.HIGHLIGHT);
            p.rect(panelX + 15, y - 2, 160, 24, 4);
            p.fill(0);
        } else {
            p.fill(COLORS.TEXT);
        }
        
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(14);
        p.text(cmd.label, panelX + 25, y + 2);
        y += 30;
    });
    
    // Program Memory Queue
    y += 20;
    p.fill(COLORS.TEXT_DIM);
    p.text(`MEMORY [${gameState.programQueue.length}/${gameState.maxCommands}]`, panelX + 20, y);
    y += 25;
    
    // Draw visual representation of queue
    const queueH = CANVAS_HEIGHT - y - 20;
    
    // Scroll view for queue if too long
    const queueStartY = y;
    let visibleCount = 0;
    const scrollOffset = Math.max(0, gameState.programQueue.length - 8);
    
    gameState.programQueue.forEach((cmdStr, idx) => {
        if (idx < scrollOffset) return;
        if (visibleCount > 8) return;
        
        const isExecuting = gameState.subPhase === "EXECUTING" && idx === gameState.executionStep - 1;
        const isPending = gameState.subPhase === "EXECUTING" && idx === gameState.executionStep;
        
        let txColor = COLORS.TEXT;
        if (isExecuting) txColor = COLORS.SUCCESS;
        if (isPending) txColor = COLORS.HIGHLIGHT;
        
        p.fill(txColor);
        p.textSize(12);
        p.text(`${idx + 1}. ${cmdStr}`, panelX + 25, y);
        
        if (isExecuting) {
            p.text(" <", panelX + 150, y);
        }
        
        y += 20;
        visibleCount++;
    });
    
    // Controls Hint
    p.textSize(10);
    p.fill(COLORS.TEXT_DIM);
    p.textAlign(p.CENTER, p.BOTTOM);
    const hint = gameState.subPhase === "PROGRAMMING" ? 
        "ARROWS: Select | SPACE: Add | ENTER: Run" : 
        "RUNNING... SHIFT: Fast Fwd | R: Reset";
    p.text(hint, panelX + UI_WIDTH/2, CANVAS_HEIGHT - 10);
}

function renderOverlay(p) {
    if (gameState.gamePhase === "START") {
        p.background(0, 0, 0, 220);
        p.fill(COLORS.PLAYER);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(40);
        p.text("EXCEPTION;", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
        p.fill(COLORS.TEXT);
        p.textSize(16);
        p.text("PROGRAM THE UNIT. BREACH THE SYSTEM.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
        p.textSize(14);
        p.fill(COLORS.HIGHLIGHT);
        p.text("PRESS [ENTER] TO INITIALIZE", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    } else if (gameState.gamePhase === "PAUSED") {
        p.fill(0, 0, 0, 150);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        p.fill(COLORS.TEXT);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(30);
        p.text("SYSTEM PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(0, 0, 0, 200);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        p.fill(COLORS.SUCCESS);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(30);
        p.text("ALL SECTORS CLEARED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.fill(COLORS.TEXT);
        p.textSize(14);
        p.text("PRESS [R] TO REBOOT SYSTEM", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    }
}