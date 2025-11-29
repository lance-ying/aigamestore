// ui.js - UI rendering functions

import { gameState, GAME_PHASES, LEVEL_CONFIG } from './globals.js';

export class UIRenderer {
  constructor(p) {
    this.p = p;
  }

  drawStartScreen() {
    const p = this.p;
    
    // Animated background
    for (let i = 0; i < 400; i++) {
      let inter = p.map(i, 0, 400, 0, 1);
      let c = p.lerpColor(p.color(40, 30, 50), p.color(60, 40, 70), inter);
      p.stroke(c);
      p.line(0, i, 600, i);
    }
    
    // Animated stars
    for (let i = 0; i < 20; i++) {
      let x = (i * 47 + p.frameCount * 0.5) % 600;
      let y = (i * 71) % 400;
      let brightness = 150 + p.sin(p.frameCount * 0.05 + i) * 100;
      p.fill(brightness);
      p.noStroke();
      p.ellipse(x, y, 2, 2);
    }
    
    // Title with glow
    p.drawingContext.shadowBlur = 20;
    p.drawingContext.shadowColor = 'rgba(255, 220, 100, 0.8)';
    p.fill(255, 220, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("SHAWARMA STACK", 300, 80);
    p.drawingContext.shadowBlur = 0;
    
    // Subtitle with pulse
    let pulse = 1 + p.sin(p.frameCount * 0.05) * 0.1;
    p.fill(200, 180, 255);
    p.textSize(16 * pulse);
    p.textStyle(p.NORMAL);
    p.text("Become a Legend!", 300, 130);
    
    // Box with border
    p.stroke(100, 80, 120);
    p.strokeWeight(2);
    p.fill(30, 20, 40, 200);
    p.rect(80, 160, 440, 140, 10);
    
    // Instructions
    p.fill(220, 200, 255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.text("HOW TO PLAY:", 100, 170);
    p.textSize(12);
    p.textStyle(p.NORMAL);
    p.text("• Customers show their orders in speech bubbles", 120, 195);
    p.text("• Add exact ingredients using keyboard shortcuts", 120, 215);
    p.text("• Press SPACE to serve when order is complete", 120, 235);
    p.text("• Fast & accurate service earns bonus points!", 120, 255);
    p.text("• Don't let reputation drop to 0%!", 120, 275);
    
    // Controls box
    p.stroke(100, 80, 120);
    p.strokeWeight(2);
    p.fill(30, 20, 40, 200);
    p.rect(80, 300, 440, 60, 10);
    
    p.fill(200, 255, 200);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.textStyle(p.BOLD);
    p.text("CONTROLS:", 100, 310);
    p.textStyle(p.NORMAL);
    p.text("Z: Meat  |  Arrow Keys: Sauces  |  SPACE: Serve", 120, 330);
    p.text("ESC: Pause  |  R: Restart", 120, 348);
    
    // Start prompt with glow
    p.drawingContext.shadowBlur = 15;
    p.drawingContext.shadowColor = 'rgba(255, 255, 100, 0.5)';
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.textStyle(p.BOLD);
    const blink = p.sin(p.frameCount * 0.1) > 0;
    if (blink) {
      p.text("▶ PRESS ENTER TO START ◀", 300, 380);
    }
    p.drawingContext.shadowBlur = 0;
  }

  drawHUD() {
    const p = this.p;
    
    // Score with glow
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = 'rgba(255, 255, 100, 0.5)';
    p.fill(255, 255, 100);
    p.stroke(0);
    p.strokeWeight(3);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text(`SCORE: ${gameState.score}`, 300, 10);
    p.drawingContext.shadowBlur = 0;
    
    // Coins with glow
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowColor = 'rgba(255, 215, 0, 0.6)';
    p.fill(255, 215, 0);
    p.stroke(139, 90, 0);
    p.strokeWeight(3);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text(`💰 $${gameState.coins}`, 580, 10);
    p.drawingContext.shadowBlur = 0;
    
    // Level with border
    p.fill(100, 200, 255);
    p.stroke(0, 100, 200);
    p.strokeWeight(3);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`⭐ LEVEL ${gameState.currentLevel}`, 20, 10);
    
    // Reputation bar with fancy styling
    const repWidth = 150;
    const repX = 20;
    const repY = 35;
    
    // Outer border
    p.stroke(50);
    p.strokeWeight(3);
    p.fill(40);
    p.rect(repX - 2, repY - 2, repWidth + 4, 19, 4);
    
    // Inner background
    p.noStroke();
    p.fill(60, 60, 80);
    p.rect(repX, repY, repWidth, 15, 3);
    
    // Gradient fill
    const repColor = gameState.reputation > 0.5 ? [100, 255, 100] :
                     gameState.reputation > 0.25 ? [255, 200, 50] : [255, 50, 50];
    
    for (let i = 0; i < repWidth * gameState.reputation; i++) {
      let inter = i / (repWidth * gameState.reputation);
      let c = p.lerpColor(
        p.color(repColor[0] * 0.6, repColor[1] * 0.6, repColor[2] * 0.6),
        p.color(...repColor),
        inter
      );
      p.stroke(c);
      p.line(repX + i, repY, repX + i, repY + 15);
    }
    
    // Glow on reputation bar
    if (gameState.reputation > 0.5) {
      p.drawingContext.shadowBlur = 5;
      p.drawingContext.shadowColor = 'rgba(100, 255, 100, 0.5)';
    }
    
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.text(`REP: ${Math.floor(gameState.reputation * 100)}%`, repX + 5, repY + 3);
    p.drawingContext.shadowBlur = 0;
    
    // Level objective box
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(15, 55, 250, 40, 5);
    
    p.fill(255, 255, 200);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.NORMAL);
    p.text(`🎯 Goal: $${config.objective.coins} / ${config.objective.customers} customers`, 20, 60);
    
    // Progress indicators
    const coinProgress = Math.min(1, gameState.coins / config.objective.coins);
    const customerProgress = Math.min(1, gameState.totalCustomersThisLevel / config.objective.customers);
    
    const coinColor = coinProgress >= 1 ? [100, 255, 100] : [255, 255, 255];
    const customerColor = customerProgress >= 1 ? [100, 255, 100] : [255, 255, 255];
    
    p.fill(...coinColor);
    p.text(`💵 ${gameState.coins}/${config.objective.coins}`, 25, 77);
    p.fill(...customerColor);
    p.text(`👥 ${gameState.totalCustomersThisLevel}/${config.objective.customers}`, 140, 77);
  }

  drawPausedOverlay() {
    const p = this.p;
    
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, 600, 400);
    
    // Paused indicator
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(2);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.textStyle(p.BOLD);
    p.text("⏸ PAUSED", 580, 10);
    
    // Center box
    p.fill(40, 30, 50, 230);
    p.stroke(150);
    p.strokeWeight(3);
    p.rect(150, 150, 300, 120, 15);
    
    p.noStroke();
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.textStyle(p.BOLD);
    p.text("GAME PAUSED", 300, 180);
    
    p.fill(200);
    p.textSize(14);
    p.textStyle(p.NORMAL);
    p.text("Press ESC to resume", 300, 220);
    p.text("Press R to restart", 300, 245);
  }

  drawGameOver(win) {
    const p = this.p;
    
    // Animated background
    for (let i = 0; i < 400; i++) {
      let inter = p.map(i, 0, 400, 0, 1);
      let c = win ? 
        p.lerpColor(p.color(40, 80, 40), p.color(20, 60, 20), inter) :
        p.lerpColor(p.color(80, 40, 40), p.color(60, 20, 20), inter);
      p.stroke(c);
      p.line(0, i, 600, i);
    }
    
    // Floating particles
    for (let i = 0; i < 30; i++) {
      let x = (i * 37 + p.frameCount * 0.3) % 600;
      let y = (i * 53 + p.sin(p.frameCount * 0.02 + i) * 20) % 400;
      let size = 2 + p.sin(p.frameCount * 0.05 + i) * 2;
      p.fill(255, 255, win ? 100 : 50, 100);
      p.noStroke();
      p.ellipse(x, y, size);
    }
    
    // Title with glow
    p.drawingContext.shadowBlur = 25;
    p.drawingContext.shadowColor = win ? 'rgba(100, 255, 100, 0.8)' : 'rgba(255, 100, 100, 0.8)';
    p.fill(255, 255, 100);
    p.stroke(0);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    if (win) {
      p.text("🎉 YOU WIN! 🎉", 300, 80);
      p.textSize(24);
      p.fill(200, 255, 200);
      p.strokeWeight(2);
      p.text("You are a Shawarma Legend!", 300, 130);
    } else {
      p.text("💀 GAME OVER 💀", 300, 80);
      p.textSize(18);
      p.fill(255, 200, 200);
      p.strokeWeight(2);
      p.text("Better luck next time!", 300, 130);
    }
    p.drawingContext.shadowBlur = 0;
    
    // Stats box
    p.fill(0, 0, 0, 180);
    p.stroke(100);
    p.strokeWeight(3);
    p.rect(150, 160, 300, 130, 15);
    
    // Stats
    p.fill(255, 255, 100);
    p.stroke(0);
    p.strokeWeight(2);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text(`Final Score: ${gameState.score}`, 300, 185);
    
    p.fill(255, 215, 0);
    p.textSize(16);
    p.textStyle(p.NORMAL);
    p.text(`💰 Coins Earned: $${gameState.coins}`, 300, 215);
    
    p.fill(100, 200, 255);
    p.text(`⭐ Level Reached: ${gameState.currentLevel}`, 300, 240);
    
    // High score
    if (gameState.score > gameState.highScore) {
      p.drawingContext.shadowBlur = 15;
      p.drawingContext.shadowColor = 'rgba(255, 255, 100, 0.8)';
      p.fill(255, 255, 100);
      p.stroke(255, 200, 0);
      p.strokeWeight(3);
      p.textSize(18);
      p.textStyle(p.BOLD);
      p.text("🏆 NEW HIGH SCORE! 🏆", 300, 270);
      p.drawingContext.shadowBlur = 0;
    } else {
      p.fill(200);
      p.stroke(0);
      p.strokeWeight(2);
      p.textSize(14);
      p.textStyle(p.NORMAL);
      p.text(`High Score: ${gameState.highScore}`, 300, 270);
    }
    
    // Instructions with pulse
    let pulse = 1 + p.sin(p.frameCount * 0.08) * 0.15;
    p.fill(255, 255, 200);
    p.stroke(0);
    p.strokeWeight(2);
    p.textSize(18 * pulse);
    p.textStyle(p.BOLD);
    p.text("PRESS R TO RESTART", 300, 340);
  }

  drawServeButton() {
    const p = this.p;
    const x = 500;
    const y = 350;
    
    // Button shadow
    p.fill(0, 0, 0, 100);
    p.noStroke();
    p.rect(x - 38, y - 18, 80, 40, 10);
    
    // Animated glow
    let glow = 100 + p.sin(p.frameCount * 0.1) * 50;
    p.drawingContext.shadowBlur = 15;
    p.drawingContext.shadowColor = `rgba(100, 255, 100, ${glow / 255})`;
    
    // Button gradient
    for (let i = 0; i < 40; i++) {
      let inter = i / 40;
      let c = p.lerpColor(p.color(80, 220, 80), p.color(100, 255, 100), inter);
      p.stroke(c);
      p.line(x - 40, y - 20 + i, x + 40, y - 20 + i);
    }
    
    // Button border
    p.noFill();
    p.stroke(0, 150, 0);
    p.strokeWeight(3);
    p.rect(x - 40, y - 20, 80, 40, 10);
    
    p.drawingContext.shadowBlur = 0;
    
    // Button text
    p.fill(255);
    p.stroke(0);
    p.strokeWeight(3);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.textStyle(p.BOLD);
    p.text("SERVE", x, y - 5);
    
    p.fill(255, 255, 200);
    p.textSize(10);
    p.textStyle(p.NORMAL);
    p.text("[SPACE]", x, y + 10);
  }
}