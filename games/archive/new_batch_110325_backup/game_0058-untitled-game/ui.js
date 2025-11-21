// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class UIManager {
  constructor(p) {
    this.p = p;
  }
  
  renderHUD() {
    const p = this.p;
    
    // Top right info panel
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(CANVAS_WIDTH - 160, 10, 150, 80, 5);
    
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text("Score: " + gameState.score, CANVAS_WIDTH - 150, 20);
    p.text("Hint Coins: " + gameState.hintCoins, CANVAS_WIDTH - 150, 40);
    p.text("Puzzles: " + gameState.solvedPuzzles.size, CANVAS_WIDTH - 150, 60);
    
    // Navigation arrows
    if (!gameState.inPuzzle && !gameState.inDialogue) {
      this.renderNavigationHints();
    }
  }
  
  renderNavigationHints() {
    const p = this.p;
    const location = require('./globals.js').LOCATIONS[gameState.currentLocation];
    
    if (!location) return;
    
    p.fill(255, 255, 255, 150);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    
    if (location.connections.up) {
      p.text("↑", CANVAS_WIDTH / 2, 30);
    }
    if (location.connections.down) {
      p.text("↓", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }
    if (location.connections.left) {
      p.text("←", 30, CANVAS_HEIGHT / 2);
    }
    if (location.connections.right) {
      p.text("→", CANVAS_WIDTH - 30, CANVAS_HEIGHT / 2);
    }
  }
  
  renderStartScreen() {
    const p = this.p;
    
    p.background(50, 30, 70);
    
    // Decorative background
    for (let i = 0; i < 10; i++) {
      p.fill(100, 50, 150, 50);
      p.noStroke();
      p.ellipse(60 + i * 60, 100 + (i % 3) * 100, 40, 40);
    }
    
    // Title
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("LAYTON'S MYSTERY", CANVAS_WIDTH / 2, 80);
    
    // Subtitle
    p.fill(200, 200, 255);
    p.textSize(18);
    p.text("The Golden Apple", CANVAS_WIDTH / 2, 120);
    
    // Instructions
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    const instructions = [
      "",
      "Help Professor Layton solve the mystery!",
      "",
      "ARROW KEYS: Move cursor & navigate",
      "SPACE: Interact & confirm",
      "Z: Use hint coin (in puzzles)",
      "",
      "Solve puzzles to progress the story.",
      "Collect hint coins for help!",
      "",
      ""
    ];
    
    let yPos = 160;
    instructions.forEach(line => {
      p.text(line, CANVAS_WIDTH / 2, yPos);
      yPos += 18;
    });
    
    // Start prompt
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
  
  renderPauseScreen() {
    const p = this.p;
    
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 20, 20);
  }
  
  renderGameOverScreen() {
    const p = this.p;
    
    p.background(30, 50, 30);
    
    // Victory decorations
    for (let i = 0; i < 20; i++) {
      p.fill(255, 215, 0, 100);
      p.noStroke();
      const x = (i * 61 + p.frameCount * 2) % CANVAS_WIDTH;
      p.ellipse(x, 50 + (i % 3) * 100, 20, 20);
    }
    
    // Title
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("MYSTERY SOLVED!", CANVAS_WIDTH / 2, 100);
    
    // Message
    p.fill(200, 255, 200);
    p.textSize(16);
    p.text("You uncovered the secret of the Golden Apple!", CANVAS_WIDTH / 2, 160);
    
    // Stats
    p.fill(255);
    p.textSize(18);
    p.text("Final Score: " + gameState.score, CANVAS_WIDTH / 2, 220);
    p.text("Puzzles Solved: " + gameState.solvedPuzzles.size, CANVAS_WIDTH / 2, 250);
    p.text("Trinkets: " + gameState.trinkets.length, CANVAS_WIDTH / 2, 280);
    
    // Restart prompt
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}