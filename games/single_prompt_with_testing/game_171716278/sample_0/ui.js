// ui.js
// User Interface rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
    p.push();
    
    // HUD
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.text(`Score: ${Math.floor(gameState.score)}`, 20, 20);
    
    // Debug info (optional, hidden in production usually but good for verifying physics)
    // p.textSize(12);
    // p.text(`Speed: ${gameState.player ? Math.floor(gameState.player.vx * 10) : 0}`, 20, 50);
    
    // Night Distance Indicator
    if (gameState.player) {
        const distToNight = gameState.player.x - gameState.nightX;
        const safeZone = 600;
        let urgency = p.map(distToNight, 0, safeZone, 1, 0, true);
        
        if (urgency > 0) {
            p.noStroke();
            p.fill(255, 0, 0, urgency * 100);
            p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            
            p.fill(255, 100, 100);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(16);
            if (distToNight < 300) {
                p.text("THE NIGHT IS CLOSE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
            }
        }
    }
    
    p.pop();
}

export function renderStartScreen(p) {
    p.background(100, 180, 255);
    drawBackgroundHills(p); // Reuse game background for aesthetic
    
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(4);
    
    p.textSize(60);
    p.text("TINY WINGS", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    
    p.strokeWeight(2);
    p.textSize(24);
    p.text("Press ENTER to Start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.textSize(16);
    p.text("Controls: DOWN/SPACE to Dive, RELEASE to Glide", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    p.pop();
}

export function renderPausedScreen(p) {
    p.push();
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(20);
    p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.pop();
}

export function renderGameOverScreen(p) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    
    p.textSize(48);
    p.text("NIGHT CAUGHT YOU!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.textSize(32);
    p.fill(255, 215, 0);
    p.text(`Final Score: ${Math.floor(gameState.score)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    p.fill(255);
    p.textSize(20);
    p.text("Press R to Try Again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    p.pop();
}

function drawBackgroundHills(p) {
    // Static version of background for start screen
    p.noStroke();
    p.fill(100, 200, 100);
    p.beginShape();
    p.vertex(0, CANVAS_HEIGHT);
    for(let i=0; i<=CANVAS_WIDTH; i+=10) {
        p.vertex(i, CANVAS_HEIGHT - 100 + Math.sin(i * 0.01) * 50);
    }
    p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.endShape();
}