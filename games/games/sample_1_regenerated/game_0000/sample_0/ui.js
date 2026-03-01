// ui.js - User Interface Rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    // Score
    p.push();
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textSize(24);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${gameState.score}`, 20, 20);

    // Lives / Health
    const heartX = 20;
    const heartY = 55;
    for (let i = 0; i < gameState.player.health; i++) {
        drawHeart(p, heartX + i * 30, heartY);
    }
    
    // Level Progress (Optional debug)
    // p.text(`X: ${Math.floor(gameState.player.x)}`, 20, 80);
    p.pop();
}

function drawHeart(p, x, y) {
    p.push();
    p.translate(x, y);
    p.fill(255, 0, 0);
    p.stroke(0);
    p.strokeWeight(1);
    p.beginShape();
    p.vertex(0, 0);
    p.bezierVertex(-10, -10, -20, 5, 0, 20);
    p.bezierVertex(20, 5, 10, -10, 0, 0);
    p.endShape();
    p.pop();
}

export function renderStartScreen(p) {
    p.background(50, 150, 255); // Sky blue
    
    // Decor
    drawRainbow(p);
    
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(50);
    p.text("LEP'S WORLD", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    p.textSize(20);
    p.strokeWeight(2);
    p.text("Help Lep find his gold!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.text("Arrows to Move • Space to Jump • Z to Shoot", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    
    p.textSize(24);
    if (p.frameCount % 60 < 30) {
        p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
    }
}

export function renderGameOver(p) {
    const isWin = gameState.gamePhase === "GAME_OVER_WIN";
    
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.stroke(0);
    p.strokeWeight(4);
    
    if (isWin) {
        p.fill(255, 215, 0);
        p.textSize(50);
        p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
        p.fill(255);
        p.textSize(30);
        p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else {
        p.fill(255, 50, 50);
        p.textSize(50);
        p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    }
    
    p.fill(255);
    p.textSize(20);
    p.strokeWeight(2);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.8);
    p.pop();
}

export function renderPausedOverlay(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.pop();
}

function drawRainbow(p) {
    p.push();
    p.noFill();
    p.strokeWeight(20);
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT + 100;
    const r = 500;
    const colors = [
        [255, 0, 0], [255, 127, 0], [255, 255, 0], 
        [0, 255, 0], [0, 0, 255], [75, 0, 130], [148, 0, 211]
    ];
    
    for (let i = 0; i < colors.length; i++) {
        p.stroke(colors[i]);
        p.arc(cx, cy, r + i * 40, r + i * 40, p.PI, 0);
    }
    p.pop();
}