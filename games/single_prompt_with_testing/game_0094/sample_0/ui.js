// ui.js - UI rendering and game screens

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, COLORS, LEVELS } from './globals.js';
import { loadLevel, nextLevel } from './game.js';

export function renderLevelSelect(p) {
  // Sky gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(40, 80, 140),
      p.color(20, 40, 80),
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Title
  p.fill(70, 160, 230);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('SELECT LEVEL', CANVAS_WIDTH / 2, 40);
  
  // Level buttons
  const buttonWidth = 160;
  const buttonHeight = 60;
  const cols = 3;
  const startX = (CANVAS_WIDTH - (cols * buttonWidth + (cols - 1) * 20)) / 2;
  const startY = 100;
  
  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (buttonWidth + 20);
    const y = startY + row * (buttonHeight + 15);
    
    // Button background
    let buttonColor;
    if (level.difficulty === "EASY") {
      buttonColor = p.color(80, 180, 80);
    } else if (level.difficulty === "MEDIUM") {
      buttonColor = p.color(200, 150, 50);
    } else {
      buttonColor = p.color(200, 60, 60);
    }
    
    // Hover effect
    if (p.mouseX > x && p.mouseX < x + buttonWidth &&
        p.mouseY > y && p.mouseY < y + buttonHeight) {
      p.fill(p.red(buttonColor) + 40, p.green(buttonColor) + 40, p.blue(buttonColor) + 40);
      p.cursor(p.HAND);
      
      // Check for click
      if (p.mouseIsPressed && p.frameCount % 10 === 0) {
        loadLevel(window.gameInstance, level.id);
      }
    } else {
      p.fill(buttonColor);
    }
    
    p.noStroke();
    p.rect(x, y, buttonWidth, buttonHeight, 5);
    
    // Level number
    p.fill(255);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`Level ${level.id}`, x + buttonWidth / 2, y + 15);
    
    // Level name
    p.textSize(12);
    p.text(level.name, x + buttonWidth / 2, y + 35);
    
    // Difficulty badge
    p.textSize(10);
    p.text(level.difficulty, x + buttonWidth / 2, y + 50);
    
    // Completion checkmark
    if (gameState.levelsCompleted[i]) {
      p.fill(255, 220, 0);
      p.textSize(20);
      p.text('✓', x + buttonWidth - 15, y + 15);
    }
  }
  
  // Instructions
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text('Click a level to start your adventure!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function renderStartScreen(p) {
  // Sky gradient background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(40, 80, 140),
      p.color(20, 40, 80),
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Level info box
  if (gameState.currentLevelData) {
    p.fill(20, 20, 40, 200);
    p.rect(CANVAS_WIDTH / 2 - 180, 60, 360, 140, 5);
    
    p.fill(255, 220, 0);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(28);
    p.text(`Level ${gameState.currentLevelData.id}: ${gameState.currentLevelData.name}`, 
           CANVAS_WIDTH / 2, 75);
    
    p.fill(255);
    p.textSize(16);
    const diffColor = gameState.currentLevelData.difficulty === "EASY" ? [100, 255, 100] :
                      gameState.currentLevelData.difficulty === "MEDIUM" ? [255, 200, 100] :
                      [255, 100, 100];
    p.fill(...diffColor);
    p.text(`Difficulty: ${gameState.currentLevelData.difficulty}`, CANVAS_WIDTH / 2, 110);
    
    p.fill(255);
    p.textSize(14);
    p.text(`Collect ${gameState.currentLevelData.gemCount} gems to complete the level!`, 
           CANVAS_WIDTH / 2, 135);
    p.text(`Enemies: ${gameState.currentLevelData.enemyCount} (${gameState.currentLevelData.enemyTypes.basic} basic, ${gameState.currentLevelData.enemyTypes.tough} tough)`, 
           CANVAS_WIDTH / 2, 155);
    p.text(`World Width: ${gameState.currentLevelData.worldWidth}px (scrolling level)`, 
           CANVAS_WIDTH / 2, 175);
  }
  
  // Instructions box
  p.fill(20, 20, 40, 200);
  p.rect(CANVAS_WIDTH / 2 - 180, 220, 360, 110, 5);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'ARROW KEYS - Move left/right',
    'SPACE - Jump (double jump available)',
    'Z - Attack with Shovel Blade',
    'DOWN (in air) - Shovel Drop (bounce on enemies!)',
    'ESC - Pause | R - Restart'
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2 - 160, 235 + i * 18);
  }
  
  // Start prompt (pulsing)
  const pulseAlpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 0.5;
  p.fill(255, 220, 0, pulseAlpha * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
}

export function renderUI(p) {
  // Semi-transparent background for HUD
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Level info
  p.fill(...COLORS.ui);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  if (gameState.currentLevelData) {
    p.text(`Lv${gameState.currentLevelData.id}: ${gameState.currentLevelData.name}`, 10, 10);
  }
  
  // Score
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 28);
  
  // Gems collected
  p.push();
  p.translate(200, 32);
  p.rotate(gameState.frameCount * 0.05);
  p.fill(255, 220, 0);
  p.noStroke();
  p.star(0, 0, 8, 4, 5);
  p.pop();
  
  p.fill(...COLORS.ui);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`${gameState.gemsCollected} / ${gameState.totalGems}`, 215, 32);
  
  // Health bar
  if (gameState.player) {
    const barWidth = 150;
    const barHeight = 20;
    const barX = CANVAS_WIDTH - barWidth - 15;
    const barY = 15;
    const healthRatio = gameState.player.health / gameState.player.maxHealth;
    
    // Background
    p.fill(...COLORS.healthBg);
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // Health fill (gradient effect)
    const healthColor = healthRatio > 0.5 ? 
      p.lerpColor(p.color(255, 220, 0), p.color(0, 255, 0), (healthRatio - 0.5) * 2) :
      p.lerpColor(p.color(255, 0, 0), p.color(255, 220, 0), healthRatio * 2);
    
    p.fill(healthColor);
    p.rect(barX, barY, barWidth * healthRatio, barHeight, 3);
    
    // Border
    p.noFill();
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight, 3);
    
    // Health text
    p.fill(...COLORS.ui);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(`HP: ${Math.ceil(gameState.player.health)}`, barX + barWidth / 2, barY + barHeight / 2);
  }
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused box
  p.fill(20, 20, 40, 230);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 80, 300, 160, 10);
  
  // Paused text
  p.fill(255, 220, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.fill(255);
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.textSize(16);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderLevelComplete(p) {
  // Background overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result box
  p.fill(20, 60, 20, 230);
  p.rect(CANVAS_WIDTH / 2 - 180, CANVAS_HEIGHT / 2 - 100, 360, 200, 10);
  
  // Title
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Message
  p.fill(255);
  p.textSize(18);
  if (gameState.currentLevelData) {
    p.text(`${gameState.currentLevelData.name} conquered!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  }
  
  // Stats
  p.textSize(16);
  p.fill(255, 220, 0);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 15);
  p.fill(255);
  p.textSize(14);
  p.text(`Gems: ${gameState.gemsCollected} | Enemies: ${gameState.enemiesDefeated}`, 
         CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
  
  // Next level instruction (pulsing)
  const pulseAlpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 0.5;
  p.fill(255, 255, 255, pulseAlpha * 255);
  p.textSize(20);
  if (gameState.currentLevel < LEVELS.length) {
    p.text('Press ENTER for Next Level', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  } else {
    p.text('All Levels Complete!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
  }
  p.fill(200, 200, 200, pulseAlpha * 255);
  p.textSize(16);
  p.text('Press ESC for Level Select', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Result box
  const boxColor = isWin ? p.color(20, 60, 20, 230) : p.color(60, 20, 20, 230);
  p.fill(boxColor);
  p.rect(CANVAS_WIDTH / 2 - 180, CANVAS_HEIGHT / 2 - 100, 360, 200, 10);
  
  // Title
  const titleColor = isWin ? p.color(100, 255, 100) : p.color(255, 100, 100);
  p.fill(titleColor);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'VICTORY!' : 'DEFEATED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Message
  p.fill(255);
  p.textSize(18);
  if (isWin) {
    p.text('All levels conquered!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text('Shovelry prevails!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
  } else {
    p.text('The quest continues...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  }
  
  // Stats
  p.textSize(16);
  p.fill(255, 220, 0);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35);
  p.fill(255);
  p.textSize(14);
  p.text(`Gems: ${gameState.gemsCollected} | Enemies: ${gameState.enemiesDefeated}`, 
         CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  
  // Restart instruction (pulsing)
  const pulseAlpha = (Math.sin(gameState.frameCount * 0.1) + 1) * 0.5;
  p.fill(255, 255, 255, pulseAlpha * 255);
  p.textSize(20);
  p.text('Press ESC for Level Select', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
}

export function renderBackground(p) {
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(...COLORS.sky),
      p.color(30, 60, 100),
      inter
    );
    p.stroke(c);
    p.line(gameState.cameraX, i, gameState.cameraX + CANVAS_WIDTH, i);
  }
  
  // Clouds (parallax)
  p.noStroke();
  p.fill(255, 255, 255, 100);
  const cloudOffset = (gameState.frameCount * 0.2 + gameState.cameraX * 0.3) % (CANVAS_WIDTH + 200);
  
  // Cloud 1
  p.circle(gameState.cameraX + cloudOffset - 100, 60, 30);
  p.circle(gameState.cameraX + cloudOffset - 80, 55, 40);
  p.circle(gameState.cameraX + cloudOffset - 60, 60, 30);
  
  // Cloud 2
  p.circle(gameState.cameraX + cloudOffset + 100, 100, 25);
  p.circle(gameState.cameraX + cloudOffset + 120, 95, 35);
  p.circle(gameState.cameraX + cloudOffset + 140, 100, 25);
  
  // Mountains in background (parallax)
  p.fill(40, 60, 80, 150);
  const mountainOffset = gameState.cameraX * 0.5;
  p.triangle(mountainOffset, CANVAS_HEIGHT - 100, 
             mountainOffset + 150, CANVAS_HEIGHT - 250, 
             mountainOffset + 300, CANVAS_HEIGHT - 100);
  p.triangle(mountainOffset + 200, CANVAS_HEIGHT - 100, 
             mountainOffset + 400, CANVAS_HEIGHT - 200, 
             mountainOffset + 600, CANVAS_HEIGHT - 100);
  
  // Ground
  p.fill(...COLORS.ground);
  p.rect(0, GROUND_Y, gameState.worldWidth, CANVAS_HEIGHT - GROUND_Y);
  
  // Ground texture
  p.stroke(70, 50, 30);
  p.strokeWeight(1);
  for (let i = 0; i < gameState.worldWidth; i += 15) {
    p.line(i, GROUND_Y, i + 10, CANVAS_HEIGHT);
  }
  for (let j = GROUND_Y; j < CANVAS_HEIGHT; j += 10) {
    p.line(0, j, gameState.worldWidth, j);
  }
}

// Helper for star drawing
p5.prototype.star = function(x, y, radius1, radius2, npoints) {
  const angle = (Math.PI * 2) / npoints;
  const halfAngle = angle / 2.0;
  this.beginShape();
  for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius1;
    let sy = y + Math.sin(a) * radius1;
    this.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius2;
    sy = y + Math.sin(a + halfAngle) * radius2;
    this.vertex(sx, sy);
  }
  this.endShape(this.CLOSE);
};