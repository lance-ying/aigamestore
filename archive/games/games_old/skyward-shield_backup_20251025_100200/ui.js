import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, LEVEL_CONFIG } from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
  }

  drawStartScreen() {
    const p = this.p;
    
    p.background(135, 206, 235);
    
    // Title
    p.fill(255);
    p.stroke(50);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("SKYWARD SHIELD", CANVAS_WIDTH / 2, 80);
    
    // Description
    p.noStroke();
    p.textSize(16);
    p.fill(255);
    p.text("Guide your balloon upward!", CANVAS_WIDTH / 2, 150);
    p.text("Use your shield to push obstacles away", CANVAS_WIDTH / 2, 175);
    p.text("Reach the target height to complete each level", CANVAS_WIDTH / 2, 200);
    
    // Instructions
    p.textSize(14);
    p.fill(255, 255, 200);
    p.text("CONTROLS:", CANVAS_WIDTH / 2, 240);
    p.textSize(12);
    p.fill(255);
    p.text("Arrow Keys: Move Shield", CANVAS_WIDTH / 2, 265);
    p.text("SHIFT + Arrows: Move Shield Faster", CANVAS_WIDTH / 2, 285);
    p.text("SPACE/ESC: Pause", CANVAS_WIDTH / 2, 305);
    p.text("R: Restart", CANVAS_WIDTH / 2, 325);
    
    // Start prompt
    p.textSize(20);
    p.fill(255, 255, 100);
    const flash = Math.sin(p.frameCount * 0.1) > 0;
    if (flash) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 365);
    }
  }

  drawPlayingUI(score, level, targetHeight, currentHeight) {
    const p = this.p;
    
    // Score
    p.fill(255);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(20);
    p.text(`SCORE: ${score.toString().padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
    
    // Level
    p.textAlign(p.LEFT, p.TOP);
    p.text(`LEVEL: ${level}`, 10, 10);
    
    // Progress bar
    const progress = Math.min(currentHeight / targetHeight, 1);
    const barWidth = 150;
    const barHeight = 10;
    const barX = CANVAS_WIDTH / 2 - barWidth / 2;
    const barY = 10;
    
    p.fill(50, 50, 50);
    p.rect(barX, barY, barWidth, barHeight);
    p.fill(100, 255, 100);
    p.rect(barX, barY, barWidth * progress, barHeight);
    
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(10);
    p.fill(255);
    p.text(`${Math.floor(currentHeight)}/${targetHeight}`, CANVAS_WIDTH / 2, barY + barHeight + 2);
  }

  drawPausedOverlay() {
    const p = this.p;
    
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }

  drawGameOverScreen(won) {
    const p = this.p;
    
    p.background(won ? [100, 200, 100] : [200, 100, 100]);
    
    // Title
    p.fill(255);
    p.stroke(50);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text(won ? "CONGRATULATIONS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
    
    // Message
    p.noStroke();
    p.textSize(20);
    if (won) {
      p.text("YOU CLEARED ALL LEVELS!", CANVAS_WIDTH / 2, 160);
    } else {
      p.text("Balloon hit an obstacle!", CANVAS_WIDTH / 2, 160);
    }
    
    // Score
    p.textSize(24);
    p.fill(255, 255, 200);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
    
    // High score
    const highScore = gameState.highScores.length > 0 ? gameState.highScores[0] : 0;
    p.textSize(18);
    p.fill(255);
    p.text(`HIGH SCORE: ${highScore}`, CANVAS_WIDTH / 2, 245);
    
    // Restart prompt
    p.textSize(20);
    p.fill(255, 255, 100);
    const flash = Math.sin(p.frameCount * 0.1) > 0;
    if (flash) {
      p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
    }
  }

  drawLevelTransition() {
    const p = this.p;
    
    p.background(0, 0, 0, 200);
    
    p.fill(255, 255, 100);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text(`LEVEL ${gameState.currentLevel - 1} COMPLETE!`, CANVAS_WIDTH / 2, 150);
    
    p.textSize(24);
    p.fill(255);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    
    if (gameState.currentLevel <= 4) {
      p.textSize(20);
      p.fill(200, 255, 200);
      p.text(`GET READY FOR LEVEL ${gameState.currentLevel}!`, CANVAS_WIDTH / 2, 250);
    }
  }
}