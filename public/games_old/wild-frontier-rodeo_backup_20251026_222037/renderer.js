// renderer.js - Rendering functions

import { gameState, GAME_PHASES, LEVEL_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Animal } from './animal.js';
import { Obstacle } from './obstacle.js';

export class Renderer {
  constructor(p) {
    this.p = p;
  }

  draw() {
    // Clear background
    this.p.background(135, 206, 235);

    // Draw parallax background
    this.drawBackground();

    if (gameState.gamePhase === GAME_PHASES.START) {
      this.drawStartScreen();
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      this.drawGame();
      this.drawUI();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      this.drawGame();
      this.drawUI();
      this.drawPauseOverlay();
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      this.drawGame();
      this.drawGameOverWin();
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      this.drawGame();
      this.drawGameOverLose();
    }
  }

  drawBackground() {
    const offset = gameState.backgroundOffset % 800;
    
    // Sky
    this.p.fill(135, 206, 235);
    this.p.noStroke();
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - 100);
    
    // Distant mountains
    this.p.fill(100, 120, 140);
    for (let i = -1; i < 4; i++) {
      const x = i * 200 - offset * 0.2;
      this.p.triangle(x, CANVAS_HEIGHT - 100, x + 100, CANVAS_HEIGHT - 200, x + 200, CANVAS_HEIGHT - 100);
    }
    
    // Mid ground hills
    this.p.fill(120, 150, 100);
    for (let i = -1; i < 5; i++) {
      const x = i * 150 - offset * 0.4;
      this.p.ellipse(x + 75, CANVAS_HEIGHT - 80, 150, 60);
    }
    
    // Ground
    this.p.fill(90, 140, 60);
    this.p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
    
    // Ground details
    this.p.fill(80, 120, 50);
    for (let i = -1; i < 15; i++) {
      const x = i * 50 - offset * 0.8;
      this.p.ellipse(x, CANVAS_HEIGHT - 95, 40, 10);
    }
  }

  drawGame() {
    this.p.push();
    
    // Draw entities
    for (const entity of gameState.entities) {
      if (entity === gameState.player) continue;
      
      if (entity instanceof Animal) {
        entity.draw(this.p, this.p.frameCount);
        
        // Draw riding timer indicator
        if (entity === gameState.currentAnimal && gameState.ridingTimer > 0) {
          const timerWidth = 60;
          const timerHeight = 5;
          const x = entity.x - timerWidth / 2;
          const y = entity.y - entity.height / 2 - 15;
          
          this.p.fill(50, 50, 50);
          this.p.rect(x, y, timerWidth, timerHeight);
          
          const percent = gameState.ridingTimer / entity.ridingDuration;
          const color = percent > 0.5 ? [100, 200, 100] : percent > 0.25 ? [255, 200, 0] : [255, 50, 50];
          this.p.fill(...color);
          this.p.rect(x, y, timerWidth * percent, timerHeight);
        }
      } else if (entity instanceof Obstacle) {
        entity.draw(this.p);
      }
    }
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(this.p);
    }
    
    // Draw particles
    for (const particle of gameState.entities) {
      // Handled by entity draw methods
    }
    
    this.p.pop();
  }

  drawUI() {
    this.p.push();
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.textSize(16);
    this.p.fill(255);
    this.p.stroke(0);
    this.p.strokeWeight(3);
    this.p.text(`SCORE: ${String(gameState.score).padStart(6, '0')}`, 10, 10);
    
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    const config = LEVEL_CONFIG[gameState.currentLevel - 1];
    this.p.text(`LVL: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 10);
    
    // Timer
    const seconds = Math.ceil(gameState.levelTimer / 1000);
    this.p.text(`TIME: ${seconds}s`, CANVAS_WIDTH - 10, 30);
    
    this.p.noStroke();
    this.p.pop();
  }

  drawStartScreen() {
    this.p.push();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    
    // Title
    this.p.fill(0);
    this.p.textSize(48);
    this.p.text('WILD FRONTIER', CANVAS_WIDTH / 2, 80);
    this.p.textSize(36);
    this.p.text('RODEO', CANVAS_WIDTH / 2, 120);
    
    // Instructions
    this.p.textSize(16);
    this.p.fill(50);
    this.p.text('Jump from animal to animal to survive!', CANVAS_WIDTH / 2, 180);
    this.p.text('Each animal will buck you off after a few seconds.', CANVAS_WIDTH / 2, 200);
    this.p.text('Avoid obstacles and don\'t fall off the screen!', CANVAS_WIDTH / 2, 220);
    
    // Controls
    this.p.textSize(14);
    this.p.textAlign(this.p.LEFT, this.p.CENTER);
    this.p.text('SPACE: Jump to another animal', 150, 260);
    this.p.text('LEFT/RIGHT: Steer your animal', 150, 280);
    this.p.text('ESC: Pause game', 150, 300);
    
    // High score
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(18);
    this.p.fill(100, 50, 0);
    this.p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 340);
    
    // Start prompt
    this.p.textSize(20);
    this.p.fill(200, 0, 0);
    if (this.p.frameCount % 60 < 30) {
      this.p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
    }
    
    this.p.pop();
  }

  drawPauseOverlay() {
    this.p.push();
    this.p.fill(0, 0, 0, 150);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.textSize(16);
    this.p.fill(255);
    this.p.text('PAUSED', CANVAS_WIDTH - 10, 10);
    
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(24);
    this.p.text('GAME PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    this.p.textSize(16);
    this.p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
    this.p.pop();
  }

  drawGameOverWin() {
    this.p.push();
    this.p.fill(0, 0, 0, 150);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.fill(255, 215, 0);
    this.p.text('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    this.p.textSize(24);
    this.p.fill(255);
    this.p.text('You conquered all 5 levels!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    this.p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    if (gameState.score >= gameState.highScore) {
      this.p.fill(255, 215, 0);
      this.p.textSize(20);
      this.p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
    
    this.p.textSize(18);
    this.p.fill(200);
    this.p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
    
    this.p.pop();
  }

  drawGameOverLose() {
    this.p.push();
    this.p.fill(0, 0, 0, 150);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.fill(255, 50, 50);
    this.p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    this.p.textSize(20);
    this.p.fill(255);
    this.p.text(`You reached Level ${gameState.currentLevel}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    this.p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    if (gameState.score >= gameState.highScore) {
      this.p.fill(255, 215, 0);
      this.p.textSize(18);
      this.p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    }
    
    this.p.textSize(18);
    this.p.fill(200);
    this.p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
    
    this.p.pop();
  }
}