// ui.js - UI rendering

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, FRUIT_TIERS, LEVELS, CONTAINER } from './globals.js';

export class UIRenderer {
  constructor(p) {
    this.p = p;
  }

  drawStartScreen() {
    this.p.push();
    this.p.background(240, 248, 255);

    // Title
    this.p.fill(34, 139, 34);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.text("FruitDrop Fusion", CANVAS_WIDTH / 2, 60);

    // Description
    this.p.fill(60);
    this.p.textSize(14);
    this.p.text("Drop fruits to create fusion reactions!", CANVAS_WIDTH / 2, 120);
    this.p.text("Match identical fruits to merge them into larger ones.", CANVAS_WIDTH / 2, 140);
    this.p.text("Create the ultimate Watermelon to win!", CANVAS_WIDTH / 2, 160);

    // Instructions box
    this.p.fill(255, 250, 220);
    this.p.rect(150, 180, 300, 140, 10);
    
    this.p.fill(60);
    this.p.textSize(16);
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.text("HOW TO PLAY:", 170, 190);
    this.p.textSize(13);
    this.p.text("← → or A/D: Move drop position", 170, 215);
    this.p.text("SPACE or ↓: Drop fruit", 170, 235);
    this.p.text("ESC: Pause game", 170, 255);
    this.p.text("R: Return to start screen", 170, 275);
    
    // High score
    if (gameState.highScore > 0) {
      this.p.fill(255, 140, 0);
      this.p.textSize(18);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 340);
    }

    // Start prompt
    this.p.fill(34, 139, 34);
    this.p.textSize(20);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);

    this.p.pop();
  }

  drawPlayingUI(levelManager) {
    this.p.push();

    // Score
    this.p.fill(255);
    this.p.textSize(18);
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.text(`SCORE: ${gameState.score}`, 10, 10);

    // Level
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.text(`LEVEL: ${gameState.currentLevel + 1}`, CANVAS_WIDTH - 10, 10);

    // Level goal
    const levelData = levelManager.getLevelData();
    this.p.textSize(12);
    this.p.textAlign(this.p.CENTER, this.p.TOP);
    this.p.fill(255, 255, 200);
    this.p.text(levelData.description, CANVAS_WIDTH / 2, 35);

    // Combo indicator
    if (gameState.comboCount > 1) {
      this.p.fill(255, 215, 0);
      this.p.textSize(16);
      this.p.textAlign(this.p.CENTER, this.p.TOP);
      this.p.text(`COMBO x${gameState.comboCount}!`, CANVAS_WIDTH / 2, 55);
    }

    // Next fruit preview
    if (gameState.nextFruit) {
      this.p.fill(255);
      this.p.textSize(14);
      this.p.textAlign(this.p.CENTER, this.p.TOP);
      this.p.text("NEXT:", 50, 60);
      
      const tierData = FRUIT_TIERS[gameState.nextFruit];
      this.p.fill(...tierData.color);
      this.p.circle(50, 100, tierData.radius * 1.5);
      
      this.p.fill(255, 255, 255, 120);
      this.p.circle(50 - tierData.radius * 0.3, 100 - tierData.radius * 0.3, tierData.radius * 0.4);
    }

    this.p.pop();
  }

  drawPausedOverlay() {
    this.p.push();
    this.p.fill(0, 0, 0, 150);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.fill(255, 215, 0);
    this.p.textSize(14);
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    
    this.p.fill(255);
    this.p.textSize(20);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.text("GAME PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    this.p.textSize(14);
    this.p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    this.p.text("Press R to return to start", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    this.p.pop();
  }

  drawGameOverScreen(isWin) {
    this.p.push();
    this.p.background(isWin ? [220, 255, 220] : [255, 220, 220]);

    // Title
    this.p.fill(isWin ? [34, 139, 34] : [220, 20, 60]);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 100);

    // Final score
    this.p.fill(60);
    this.p.textSize(24);
    this.p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 170);

    // High score
    if (gameState.score >= gameState.highScore) {
      this.p.fill(255, 140, 0);
      this.p.textSize(20);
      this.p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 210);
    } else if (gameState.highScore > 0) {
      this.p.fill(100);
      this.p.textSize(18);
      this.p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 210);
    }

    // Level reached
    this.p.fill(60);
    this.p.textSize(16);
    this.p.text(`Level Reached: ${gameState.currentLevel + 1}`, CANVAS_WIDTH / 2, 250);

    // Restart instructions
    this.p.fill(isWin ? [34, 139, 34] : [220, 20, 60]);
    this.p.textSize(20);
    this.p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
    
    this.p.fill(100);
    this.p.textSize(14);
    this.p.text("(Returns to start screen)", CANVAS_WIDTH / 2, 350);

    this.p.pop();
  }

  drawLevelTransition(levelManager) {
    this.p.push();
    this.p.fill(0, 0, 0, 200);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const levelData = levelManager.getLevelData();
    this.p.fill(255, 215, 0);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(36);
    this.p.text(`Level ${gameState.currentLevel} Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    this.p.fill(255);
    this.p.textSize(20);
    this.p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    if (gameState.currentLevel < LEVELS.length - 1) {
      const nextLevel = LEVELS[gameState.currentLevel + 1];
      this.p.textSize(18);
      this.p.text(`Next: ${nextLevel.name}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }

    this.p.pop();
  }

  drawContainer(loseLineY) {
    this.p.push();
    
    // Container walls
    this.p.fill(139, 90, 43);
    this.p.noStroke();
    
    // Bottom
    this.p.rect(CONTAINER.x, CONTAINER.y + CONTAINER.height - CONTAINER.wallThickness, 
                CONTAINER.width, CONTAINER.wallThickness);
    
    // Left wall
    this.p.rect(CONTAINER.x, CONTAINER.y, CONTAINER.wallThickness, CONTAINER.height);
    
    // Right wall
    this.p.rect(CONTAINER.x + CONTAINER.width - CONTAINER.wallThickness, CONTAINER.y, 
                CONTAINER.wallThickness, CONTAINER.height);

    // Lose line
    this.p.stroke(220, 20, 60);
    this.p.strokeWeight(2);
    this.p.drawingContext.setLineDash([5, 5]);
    this.p.line(CONTAINER.x + CONTAINER.wallThickness, loseLineY, 
                CONTAINER.x + CONTAINER.width - CONTAINER.wallThickness, loseLineY);
    this.p.drawingContext.setLineDash([]);

    this.p.pop();
  }

  drawDropIndicator(x) {
    this.p.push();
    this.p.stroke(100, 100, 100, 100);
    this.p.strokeWeight(2);
    this.p.drawingContext.setLineDash([5, 5]);
    this.p.line(x, CONTAINER.y, x, CONTAINER.y + CONTAINER.height);
    this.p.drawingContext.setLineDash([]);
    this.p.pop();
  }

  drawCurrentFruit(fruit, x) {
    this.p.push();
    const y = CONTAINER.y - 30;
    this.p.fill(...fruit.color, 200);
    this.p.noStroke();
    this.p.circle(x, y, fruit.radius * 2);
    
    // Highlight
    this.p.fill(255, 255, 255, 100);
    this.p.circle(x - fruit.radius * 0.3, y - fruit.radius * 0.3, fruit.radius * 0.5);
    this.p.pop();
  }
}