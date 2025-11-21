// ui.js - UI rendering functions

import { gameState, GAME_PHASES, LEVEL_CONFIG } from './globals.js';

export class UIRenderer {
  constructor(p) {
    this.p = p;
  }

  drawStartScreen() {
    const p = this.p;
    
    p.background(40, 30, 50);
    
    // Title
    p.fill(255, 220, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("SHAWARMA STACK", 300, 80);
    
    // Subtitle
    p.fill(200);
    p.textSize(16);
    p.text("Become a Legend!", 300, 130);
    
    // Instructions
    p.fill(220);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text("HOW TO PLAY:", 100, 170);
    p.textSize(12);
    p.text("• Customers show their orders in speech bubbles", 120, 195);
    p.text("• Add exact ingredients using keyboard shortcuts", 120, 215);
    p.text("• Press SPACE to serve when order is complete", 120, 235);
    p.text("• Fast & accurate service earns bonus points!", 120, 255);
    p.text("• Don't let reputation drop to 0%!", 120, 275);
    
    // Controls
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text("CONTROLS:", 100, 305);
    p.text("Z: Meat  |  Arrow Keys: Sauces  |  SPACE: Serve", 120, 325);
    p.text("ESC: Pause  |  R: Restart", 120, 345);
    
    // Start prompt
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    const blink = p.sin(p.frameCount * 0.1) > 0;
    if (blink) {
      p.text("PRESS ENTER TO START", 300, 380);
    }
  }

  drawHUD() {
    const p = this.p;
    
    // Score
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.text(`SCORE: ${gameState.score}`, 300, 10);
    
    // Coins
    p.fill(255, 215, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text(`$${gameState.coins}`, 580, 10);
    
    // Level
    p.fill(100, 200, 255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`LEVEL ${gameState.currentLevel}`, 20, 10);
    
    // Reputation bar
    const repWidth = 150;
    const repX = 20;
    const repY = 35;
    
    p.fill(100);
    p.noStroke();
    p.rect(repX, repY, repWidth, 15, 3);
    
    const repColor = gameState.reputation > 0.5 ? [100, 200, 100] :
                     gameState.reputation > 0.25 ? [255, 200, 50] : [255, 50, 50];
    p.fill(...repColor);
    p.rect(repX, repY, repWidth * gameState.reputation, 15, 3);
    
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`REP: ${Math.floor(gameState.reputation * 100)}%`, repX + 5, repY + 3);
    
    // Level objective
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    p.fill(200);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Goal: $${config.objective.coins} / ${config.objective.customers} customers`, 20, 60);
    p.text(`Served: ${gameState.totalCustomersThisLevel} | Earned: $${gameState.coins}`, 20, 75);
  }

  drawPausedOverlay() {
    const p = this.p;
    
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", 580, 10);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("GAME PAUSED", 300, 180);
    
    p.textSize(14);
    p.text("Press ESC to resume", 300, 220);
    p.text("Press R to restart", 300, 245);
  }

  drawGameOver(win) {
    const p = this.p;
    
    p.background(win ? [40, 80, 40] : [80, 40, 40]);
    
    // Title
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    if (win) {
      p.text("YOU WIN!", 300, 80);
      p.textSize(24);
      p.fill(200);
      p.text("You are a Shawarma Legend!", 300, 130);
    } else {
      p.text("GAME OVER", 300, 80);
      p.textSize(18);
      p.fill(200);
      p.text("Better luck next time!", 300, 130);
    }
    
    // Stats
    p.fill(255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, 300, 180);
    p.textSize(16);
    p.text(`Coins Earned: $${gameState.coins}`, 300, 210);
    p.text(`Level Reached: ${gameState.currentLevel}`, 300, 235);
    
    // High score
    if (gameState.score > gameState.highScore) {
      p.fill(255, 255, 100);
      p.textSize(18);
      p.text("NEW HIGH SCORE!", 300, 270);
    } else {
      p.fill(200);
      p.textSize(14);
      p.text(`High Score: ${gameState.highScore}`, 300, 270);
    }
    
    // Instructions
    p.fill(255, 255, 200);
    p.textSize(18);
    p.text("PRESS R TO RESTART", 300, 340);
  }

  drawServeButton() {
    const p = this.p;
    const x = 500;
    const y = 350;
    
    p.fill(100, 200, 100);
    p.stroke(0);
    p.strokeWeight(3);
    p.rect(x - 40, y - 20, 80, 40, 10);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("SERVE", x, y - 5);
    p.textSize(10);
    p.text("[SPACE]", x, y + 10);
  }
}