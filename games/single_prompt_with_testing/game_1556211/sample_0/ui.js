import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderHUD(p) {
    // Health Bar
    if (gameState.player) {
        const hp = gameState.player.hp;
        const max = gameState.player.maxHp;
        
        p.push();
        p.translate(20, 20);
        
        // Label
        p.fill(255);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(16);
        p.text("THE KID", 0, -18);
        
        // Bar background
        p.stroke(200);
        p.strokeWeight(2);
        p.fill(50, 0, 0);
        p.rect(0, 0, 150, 15);
        
        // Bar fill
        p.noStroke();
        p.fill(200, 30, 30);
        p.rect(1, 1, 148 * (hp/max), 13);
        
        // Tonic bottle icon (decoration)
        p.fill(255, 50, 50);
        p.stroke(255);
        p.circle(-10, 8, 12);
        
        p.pop();
    }
    
    // Score
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255);
    p.textSize(18);
    p.text(`FRAGMENTS: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
    p.pop();
    
    // Narration Subtitle (if any)
    if (gameState.currentNarration) {
        p.push();
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(18);
        p.fill(255, 240, 200);
        p.stroke(0);
        p.strokeWeight(3);
        p.text(`"${gameState.currentNarration}"`, CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
        p.pop();
    }
}

export function renderStartScreen(p) {
    p.background(10, 10, 20);
    p.textAlign(p.CENTER, p.CENTER);
    
    p.fill(255);
    p.textSize(40);
    p.text("THE KID'S JOURNEY", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50);
    
    p.textSize(16);
    p.fill(200);
    p.text("Proper stories are supposed to start at the beginning...", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
    
    p.fill(255, 200, 100);
    p.textSize(20);
    p.text("PRESS ENTER TO WAKE UP", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
    
    p.textSize(14);
    p.fill(150);
    p.text("Arrows: Move | Z: Hammer | Space: Bow | Shift: Roll", CANVAS_WIDTH/2, CANVAS_HEIGHT - 30);
}

export function renderGameOver(p, win) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(40);
    
    if (win) {
        p.text("THE BASTION RESTORED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.textSize(20);
        p.text("The Kid set things right.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    } else {
        p.text("CALAMITY CLAIMED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 20);
        p.textSize(20);
        p.text("Ain't no shame in falling.", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
    }
    
    p.textSize(16);
    p.fill(200);
    p.text("Press R to try again", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 60);
}

export function renderPaused(p) {
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.textSize(30);
    p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
}