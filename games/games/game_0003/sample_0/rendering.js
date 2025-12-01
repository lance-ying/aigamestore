import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderBackground(p) {
    // Parallax-ish background
    // Sky
    p.background(20, 30, 40);
    
    // Distant mountains (static relative to camera but slow movement)
    p.push();
    p.translate(-gameState.cameraX * 0.1, -gameState.cameraY * 0.1);
    p.fill(30, 40, 55);
    p.noStroke();
    for(let i=0; i<10; i++) {
        p.triangle(i * 300, 400, i * 300 + 150, 100, i * 300 + 300, 400);
    }
    p.pop();

    // Closer hills
    p.push();
    p.translate(-gameState.cameraX * 0.3, -gameState.cameraY * 0.3);
    p.fill(40, 50, 70);
    p.beginShape();
    p.vertex(-100, 500);
    for(let i=0; i<30; i++) {
        p.vertex(i * 100, 400 - Math.sin(i) * 50);
    }
    p.vertex(3000, 500);
    p.endShape(p.CLOSE);
    p.pop();
}

export function renderUI(p) {
    // Score / Coins
    p.push();
    p.resetMatrix(); // Ensure UI is fixed to screen
    
    // Coin Counter
    p.fill(255, 215, 0);
    p.noStroke();
    p.circle(30, 30, 20);
    p.fill(0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("$", 30, 30);
    
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(20);
    p.text(`${gameState.score} / ${gameState.totalCoinsInLevel}`, 50, 30);
    
    // Level Indicator
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`Level ${gameState.currentLevelIndex + 1}`, CANVAS_WIDTH - 20, 30);
    
    p.pop();
}

export function renderGame(p) {
    // Camera Logic
    if (gameState.player) {
        let targetX = gameState.player.x - CANVAS_WIDTH / 2;
        let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
        
        // Clamp
        targetX = Math.max(0, Math.min(targetX, gameState.worldWidth - CANVAS_WIDTH));
        targetY = Math.max(0, Math.min(targetY, gameState.worldHeight - CANVAS_HEIGHT));
        
        // Smooth
        gameState.cameraX += (targetX - gameState.cameraX) * 0.1;
        gameState.cameraY += (targetY - gameState.cameraY) * 0.1;
    }

    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);
    
    // Render entities
    gameState.platforms.forEach(ent => ent.render(p));
    gameState.hazards.forEach(ent => ent.render(p));
    gameState.collectibles.forEach(ent => ent.render(p));
    
    if (gameState.exit) gameState.exit.render(p);
    
    // Particles
    gameState.particles.forEach(pt => pt.render(p));

    if (gameState.player) gameState.player.render(p);

    p.pop();
}

export function renderStartScreen(p) {
    p.background(10, 20, 30);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("LEO'S FORTUNE (P5 Edition)", CANVAS_WIDTH/2, CANVAS_HEIGHT/3);
    
    p.textSize(16);
    p.fill(200);
    p.text("Arrow Keys to Move & Roll", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    p.text("UP/SPACE to Inflate (Float)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 25);
    p.text("DOWN to Deflate (Dive)", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
    
    p.fill(0, 255, 200);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 80);
}

export function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}

export function renderGameOver(p) {
    p.background(0, 0, 0, 200);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        p.fill(255, 215, 0);
        p.textSize(50);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("YOU WON!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
        p.fill(255);
        p.textSize(20);
        p.text("All Gold Recovered!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else {
        p.fill(255, 50, 50);
        p.textSize(50);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("GAME OVER", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    }
    
    p.fill(200);
    p.textSize(16);
    p.text("Press R to Restart Level", CANVAS_WIDTH/2, CANVAS_HEIGHT - 100);
    p.text("Press ENTER to Return to Title", CANVAS_WIDTH/2, CANVAS_HEIGHT - 70);
}

export function renderLevelComplete(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("Press ENTER for Next Level", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 40);
}