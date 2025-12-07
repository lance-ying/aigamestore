/**
 * UI Rendering
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // Score / Distance
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.text(`Dist: ${gameState.distance}m`, 20, 20);
    p.text(`Score: ${gameState.score}`, 20, 50);

    // Wall of Doom Indicator
    // Calculate distance to wall
    if (gameState.player) {
        let distToWall = gameState.player.y - gameState.wallOfDoomY; // Negative if wall is below
        // Actually, wall is below player (higher Y).
        // Let's ensure wallOfDoomY is correctly tracked.
        let dangerDist = gameState.wallOfDoomY - (gameState.player.y + gameState.player.height);
        
        if (dangerDist < 300) {
            p.textAlign(p.CENTER, p.BOTTOM);
            p.fill(255, 0, 0, p.map(dangerDist, 300, 0, 0, 255));
            p.textSize(24);
            p.text("RUN!", CANVAS_WIDTH/2, CANVAS_HEIGHT - 50);
        }
    }
}

export function renderStartScreen(p) {
    p.background(10, 10, 15);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(255, 50, 50);
    p.textSize(50);
    p.stroke(255);
    p.strokeWeight(3);
    p.text("REDUNGEON", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 60);
    
    p.fill(200);
    p.noStroke();
    p.textSize(18);
    p.text("The Wall is Coming...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 10);
    
    p.fill(255);
    p.textSize(20);
    p.text("Press ENTER to Start", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
    
    p.textSize(14);
    p.fill(150);
    p.text("Arrows: Move | Space: Dash | Shift: Shield", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

export function renderGameOver(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();

    p.textAlign(p.CENTER, p.CENTER);
    
    let isWin = gameState.gamePhase === "GAME_OVER_WIN";
    if (isWin) {
        p.fill(50, 255, 50);
        p.text("ESCAPED!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    } else {
        p.fill(255, 50, 50);
        p.textSize(40);
        p.text("YOU DIED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text(`Distance: ${gameState.distance}m`, CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 30);
    
    p.textSize(18);
    p.fill(200);
    p.text("Press R to Restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 80);
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();

    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}