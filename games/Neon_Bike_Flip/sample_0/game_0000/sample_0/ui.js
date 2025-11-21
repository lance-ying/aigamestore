// ui.js - UI rendering and screens
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
  }
  
  renderStartScreen() {
    const p = this.p;
    
    // Background
    p.background(10, 10, 30);
    this.renderStarfield();
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(0, 255, 255);
    p.noStroke();
    p.textSize(48);
    p.text("NEON BIKE FLIP", CANVAS_WIDTH / 2, 80);
    
    // Subtitle glow
    p.fill(255, 0, 255);
    p.textSize(20);
    p.text("Physics Stunt Platformer", CANVAS_WIDTH / 2, 130);
    
    // Instructions box
    p.fill(20, 20, 40);
    p.stroke(0, 255, 255);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH / 2, 220, 400, 120);
    
    // Instructions
    p.fill(200, 200, 255);
    p.noStroke();
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    const instructions = [
      "Navigate challenging tracks and execute perfect flips!",
      "",
      "← Arrow Left: Rotate counter-clockwise",
      "→ Arrow Right: Rotate clockwise",
      "ESC: Pause    R: Restart"
    ];
    let yPos = 170;
    for (let line of instructions) {
      p.text(line, 120, yPos);
      yPos += 22;
    }
    
    // Objectives
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 100);
    p.textSize(14);
    p.text("Complete all 5 levels without crashing!", CANVAS_WIDTH / 2, 310);
    p.text("Earn points for flips, safe landings, and distance traveled", CANVAS_WIDTH / 2, 330);
    
    // Press ENTER prompt (pulsing)
    const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
    p.fill(0, 255, 0, alpha);
    p.textSize(24);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
  
  renderPlayingUI() {
    const p = this.p;
    
    // Score (top right)
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(0, 255, 255);
    p.noStroke();
    p.textSize(20);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
    
    // Level (top left)
    p.textAlign(p.LEFT, p.TOP);
    p.fill(255, 0, 255);
    p.text(`LEVEL: ${gameState.currentLevel}`, 20, 20);
    
    // Flips indicator (if airborne)
    if (gameState.isAirborne && gameState.flipsInCurrentJump > 0) {
      p.textAlign(p.CENTER, p.TOP);
      p.fill(255, 255, 0);
      p.textSize(24);
      p.text(`${gameState.flipsInCurrentJump} FLIP${gameState.flipsInCurrentJump > 1 ? 'S' : ''}!`, CANVAS_WIDTH / 2, 50);
    }
  }
  
  renderPausedIndicator() {
    const p = this.p;
    
    // Paused text (top right, small)
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 0);
    p.noStroke();
    p.textSize(18);
    p.text("PAUSED", CANVAS_WIDTH - 20, 50);
    
    // Pause overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 255);
    p.textSize(32);
    p.text("GAME PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    p.textSize(18);
    p.fill(200, 200, 200);
    p.text("ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }
  
  renderGameOverScreen(isWin) {
    const p = this.p;
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    if (isWin) {
      p.fill(0, 255, 0);
      p.textSize(48);
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
      
      if (gameState.currentLevel === 5) {
        p.fill(255, 255, 0);
        p.textSize(32);
        p.text("ALL LEVELS COMPLETED!", CANVAS_WIDTH / 2, 150);
      }
    } else {
      p.fill(255, 0, 0);
      p.textSize(48);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
      
      p.fill(255, 100, 100);
      p.textSize(24);
      p.text("You Crashed!", CANVAS_WIDTH / 2, 150);
    }
    
    // Score
    p.fill(0, 255, 255);
    p.textSize(24);
    p.text(`Level Score: ${gameState.levelScores[gameState.currentLevel - 1]}`, CANVAS_WIDTH / 2, 200);
    p.text(`Total Score: ${gameState.totalScore}`, CANVAS_WIDTH / 2, 230);
    
    // Instructions
    const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
    p.fill(255, 255, 255, alpha);
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
  }
  
  renderStarfield() {
    const p = this.p;
    
    // Static starfield background
    p.push();
    p.randomSeed(42);
    for (let i = 0; i < 100; i++) {
      const x = p.random(CANVAS_WIDTH);
      const y = p.random(CANVAS_HEIGHT);
      const size = p.random(1, 3);
      const brightness = p.random(100, 255);
      
      p.noStroke();
      p.fill(brightness, brightness, 255, 200);
      p.circle(x, y, size);
    }
    p.pop();
  }
}