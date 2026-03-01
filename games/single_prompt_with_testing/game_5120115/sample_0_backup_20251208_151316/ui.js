import { gameState, MATERIALS, LEVEL_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // HUD
    p.push();
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    
    // Budget & Score
    p.text(`Level: ${gameState.levelIndex + 1}`, 10, 10);
    p.text(`Score: ${gameState.score}`, 10, 30);
    p.text(`Budget: $${gameState.budget - gameState.currentCost}`, 10, 60);
    p.text(`Used: $${gameState.currentCost}`, 10, 80);
    
    // Material
    p.textAlign(p.RIGHT, p.TOP);
    const matName = gameState.selectedMaterial;
    const matColor = MATERIALS[matName].color;
    
    p.fill(matColor);
    p.rect(CANVAS_WIDTH - 100, 10, 90, 30);
    p.fill(255); // Text color
    if (matName === "STEEL") p.fill(0); 
    p.textAlign(p.CENTER, p.CENTER);
    p.text(matName, CANVAS_WIDTH - 55, 25);
    
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255);
    p.textSize(12);
    p.text("[Shift] to change", CANVAS_WIDTH - 10, 45);
    
    // Controls Hint
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(gameState.subPhase === "BUILD" ? "Arrows: Move | Space: Build/Select | Z: Delete | [Enter] Sim" : "[Enter] Stop Sim", CANVAS_WIDTH/2, CANVAS_HEIGHT - 10);
    
    p.pop();
}

export function renderGame(p) {
    // Background
    p.background(135, 206, 235); // Sky blue
    
    // Draw Terrain
    p.fill(34, 139, 34); // Forest Green
    p.noStroke();
    
    // Use LEVEL_CONFIG for terrain rendering
    const gapStart = LEVEL_CONFIG.gapStart;
    const gapEnd = LEVEL_CONFIG.gapEnd;
    const groundLevel = LEVEL_CONFIG.groundLevel;
    const winX = LEVEL_CONFIG.winX;
    
    p.rect(0, groundLevel, gapStart, CANVAS_HEIGHT - groundLevel); 
    p.rect(gapEnd, groundLevel, CANVAS_WIDTH - gapEnd, CANVAS_HEIGHT - groundLevel);
    
    // Draw Water
    p.fill(0, 105, 148);
    p.rect(gapStart, groundLevel + 80, gapEnd - gapStart, 20);
    
    // Draw Goal Flag
    p.fill(255, 215, 0);
    p.triangle(winX, groundLevel, winX, groundLevel - 30, winX + 20, groundLevel - 15);
    p.stroke(0);
    p.line(winX, groundLevel, winX, groundLevel - 30);
    
    // Draw Constraints (Back)
    gameState.constraints.forEach(c => c.render(p));
    
    // Draw Nodes
    gameState.nodes.forEach(n => n.render(p));
    
    // Draw Cars
    gameState.cars.forEach(car => car.render(p));
    
    // Draw Editor Cursor (if Build mode)
    if (gameState.subPhase === "BUILD") {
        p.push();
        p.stroke(255, 255, 0);
        p.strokeWeight(2);
        p.noFill();
        p.circle(gameState.cursorX, gameState.cursorY, 15);
        p.line(gameState.cursorX - 10, gameState.cursorY, gameState.cursorX + 10, gameState.cursorY);
        p.line(gameState.cursorX, gameState.cursorY - 10, gameState.cursorX, gameState.cursorY + 10);
        
        // Draw drag line if selecting
        if (gameState.selectedNode) {
            p.stroke(255, 255, 255, 150);
            p.strokeWeight(1);
            p.line(gameState.selectedNode.x, gameState.selectedNode.y, gameState.cursorX, gameState.cursorY);
            
            // Draw Distance/Cost tooltip
            const dist = Math.hypot(gameState.cursorX - gameState.selectedNode.x, gameState.cursorY - gameState.selectedNode.y);
            const matProp = MATERIALS[gameState.selectedMaterial];
            const validLen = dist <= matProp.maxLen;
            
            if (validLen) p.fill(255);
            else p.fill(255, 0, 0);
            
            p.noStroke();
            p.textAlign(p.CENTER, p.BOTTOM);
            p.text(`${Math.round(dist)} / ${matProp.maxLen}px`, gameState.cursorX, gameState.cursorY - 20);
        }
        p.pop();
    }
}

export function renderStartScreen(p) {
    p.background(30);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("POLY BRIDGE: ENGINEER", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    p.textSize(18);
    p.text("Build a bridge to get the car across!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text("Controls: Arrows Move, Space Build, Z Delete", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    p.text("Press ENTER to Start Level 1", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 70);
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    const win = gameState.gamePhase === "GAME_OVER_WIN";
    p.fill(win ? 0 : 255, win ? 255 : 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text(win ? "LEVEL COMPLETE!" : "BRIDGE COLLAPSED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
    
    p.fill(255);
    p.textSize(20);
    if (win) {
        p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 10);
        p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    } else {
        p.text("Press ENTER to Retry", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    }
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.pop();
}