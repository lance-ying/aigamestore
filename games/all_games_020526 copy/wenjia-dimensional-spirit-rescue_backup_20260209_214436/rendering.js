// rendering.js
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, WORLD_MATERIAL, WORLD_ENERGY, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  // Background
  p.background(20, 15, 35);
  
  // Animated background particles
  for (let i = 0; i < 50; i++) {
    const x = (i * 137 + p.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (i * 219 + p.frameCount * 0.3) % CANVAS_HEIGHT;
    const world = i % 2 === 0 ? WORLD_MATERIAL : WORLD_ENERGY;
    
    if (world === WORLD_MATERIAL) {
      p.fill(100, 80, 60, 100);
    } else {
      p.fill(100, 200, 255, 80);
    }
    p.noStroke();
    p.circle(x, y, 4);
  }
  
  // New title message
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24); // Adjusted size for prominence
  p.text("press enter to begin", CANVAS_WIDTH / 2, 150); // Centered above controls
  
  // Controls box
  p.fill(40, 35, 50, 180);
  p.stroke(100, 200, 255, 150);
  p.strokeWeight(2);
  p.rect(150, 220, 300, 100, 8); // Reduced height from 120 to 100
  
  p.fill(255, 240, 200);
  p.noStroke();
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text("← → : Move", 180, 235);
  p.text("SPACE : Jump", 180, 255);
  p.text("Z : Shift Dimension", 180, 275);
  p.text("R : Restart", 180, 295); // Moved up to replace ESC instruction
}

export function renderGame(p) {
  // Draw background based on current world
  if (gameState.currentWorld === WORLD_MATERIAL) {
    // Material world - earthy tones
    p.background(60, 50, 70);
    
    // Background elements
    for (let i = 0; i < 30; i++) {
      const x = (i * 157) % CANVAS_WIDTH;
      const y = (i * 193) % CANVAS_HEIGHT;
      p.fill(80, 70, 90, 80);
      p.noStroke();
      p.circle(x, y, 40);
    }
  } else {
    // Energy world - ethereal blues
    p.background(30, 40, 80);
    
    // Background energy waves
    p.noFill();
    p.stroke(80, 150, 200, 60);
    p.strokeWeight(2);
    for (let i = 0; i < 5; i++) {
      const offset = p.frameCount * 0.5 + i * 80;
      p.beginShape();
      for (let x = 0; x < CANVAS_WIDTH + 20; x += 20) {
        const y = 200 + Math.sin((x + offset) * 0.02) * 30;
        p.vertex(x, y);
      }
      p.endShape();
    }
  }
  
  // Render platforms
  for (const platform of gameState.platforms) {
    platform.render(p, gameState.currentWorld);
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.render(p, gameState.currentWorld);
  }
  
  // Render spirit
  if (gameState.spirit) {
    gameState.spirit.render(p);
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // UI - Only render if not paused to avoid showing instructions or overlays during pause
  if (gameState.gamePhase !== PHASE_PAUSED) {
    renderUI(p);
  }
}

function renderUI(p) {
  // Score and level
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level ${gameState.currentLevel + 1}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 10, 30);
  p.text(`Lives: ${gameState.lives}`, 10, 50);
  
  // World indicator
  const worldColor = gameState.currentWorld === WORLD_MATERIAL ? 
    [255, 180, 100] : [150, 220, 255];
  p.fill(...worldColor);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`${gameState.currentWorld} WORLD`, CANVAS_WIDTH - 10, 10);
  
  // World switch hint
  p.fill(220, 220, 220, 180);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Press Z to shift dimension", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
}

export function renderGameOver(p) {
  // Semi-transparent overlay
  p.background(20, 15, 35, 220);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  if (isWin) {
    p.fill(100, 255, 150);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text("All Spirits Rescued!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 180, 180);
    p.textSize(18);
    p.text("Spirit Lost to the Void", CANVAS_WIDTH / 2, 170);
  }
  
  // Score
  p.fill(255, 240, 200);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  p.textSize(16);
  p.text(`Levels Completed: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 260);
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 40 + 215;
  p.fill(pulse, pulse, 255);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}