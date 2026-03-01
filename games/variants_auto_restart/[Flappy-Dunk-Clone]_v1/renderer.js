import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { applyCamera } from './camera.js';

export function renderGame(p) {
    // 1. Background
    drawBackground(p);

    p.push();
    applyCamera(p);

    // 2. Draw Entities
    // Hoops
    gameState.hoops.forEach(hoop => {
        // Optimization: Only draw if on screen
        if (hoop.x > gameState.camera.x - 100 && hoop.x < gameState.camera.x + CANVAS_WIDTH + 100) {
            hoop.render(p);
        }
    });

    // Player
    if (gameState.player) {
        gameState.player.render(p);
    }

    // Particles
    gameState.particles.forEach(particle => particle.render(p));

    // Ground
    drawGround(p);

    p.pop();

    // 3. UI
    renderUI(p);
}

function drawBackground(p) {
    // Sky gradient
    let c1 = p.color(135, 206, 235);
    let c2 = p.color(60, 100, 180);
    
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
        let inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
        let c = p.lerpColor(c1, c2, inter);
        p.stroke(c);
        p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Parallax clouds?
    // Simplified for constraint: no external assets
}

function drawGround(p) {
    const groundY = CANVAS_HEIGHT - 25; // Center of ground body
    const thickness = 50;
    
    // Visible ground strip relative to camera
    const startX = gameState.camera.x - 100;
    const endX = gameState.camera.x + CANVAS_WIDTH + 100;
    
    p.fill(100, 200, 100);
    p.noStroke();
    p.rect(startX, CANVAS_HEIGHT - 50, endX - startX, 200);
    
    p.fill(80, 180, 80);
    p.rect(startX, CANVAS_HEIGHT - 50, endX - startX, 10); // Top grass trim
}

export function renderUI(p) {
    // Score
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(40);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    p.text(gameState.score, CANVAS_WIDTH / 2, 20);

    // High Score
    p.textSize(16);
    p.strokeWeight(2);
    p.text(`Best: ${gameState.highScore}`, CANVAS_WIDTH / 2, 70);

    // Bounces
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.strokeWeight(2);
    p.text(`Bounces: ${gameState.bounces}`, 20, 20);
}

export function renderStartScreen(p) {
    p.background(20, 20, 40);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.textSize(48);
    p.text("press enter to begin", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    p.textSize(16);
    p.fill(200);
    p.text("Controls: Space to Flap.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    p.text("Pass through hoops to score!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    p.text("Collect power-ups for more bounces!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

export function renderGameOver(p) {
    // Overlay
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.textSize(32);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.textSize(18);
    p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
}

export function renderPaused(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}