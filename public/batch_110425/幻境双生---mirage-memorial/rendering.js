// rendering.js - Rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Animated background
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    const x = (p.frameCount * 0.5 + i * 50) % (CANVAS_WIDTH + 100) - 50;
    const y = (i * 37) % CANVAS_HEIGHT;
    p.fill(100, 150, 255, 30);
    p.circle(x, y, 3);
    p.fill(200, 100, 255, 30);
    p.circle(CANVAS_WIDTH - x, CANVAS_HEIGHT - y, 3);
  }
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.fill(100, 200, 255);
  p.text("幻境双生", CANVAS_WIDTH / 2, 60);
  p.textSize(24);
  p.fill(200, 150, 255);
  p.text("MIRAGE MEMORIAL", CANVAS_WIDTH / 2, 95);
  
  // Description
  p.textSize(12);
  p.fill(200, 200, 220);
  p.text("Navigate dual worlds to solve puzzles", CANVAS_WIDTH / 2, 140);
  p.text("Switch dimensions to manipulate the environment", CANVAS_WIDTH / 2, 160);
  p.text("Collect all crystals and reach the exit!", CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(13);
  p.fill(150, 220, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("← → : Move", 100, 230);
  p.text("SPACE : Jump", 100, 250);
  p.text("Z : Switch World", 100, 270);
  p.text("SHIFT : Interact", 100, 290);
  
  p.textAlign(p.RIGHT, p.CENTER);
  p.text("ESC : Pause", 500, 230);
  p.text("R : Restart", 500, 250);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  const alpha = Math.sin(p.frameCount * 0.1) * 50 + 200;
  p.fill(255, 255, 150, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  
  // Level indicator
  p.textSize(12);
  p.fill(180, 180, 200);
  p.text(`Level: ${gameState.currentLevel} / ${gameState.totalLevels}`, CANVAS_WIDTH / 2, 320);
}

export function renderPlayingScreen(p) {
  // Background with world-specific color
  if (gameState.currentWorld === 'NORMAL') {
    p.background(30, 40, 70);
  } else {
    p.background(50, 30, 70);
  }
  
  // World indicator background
  p.push();
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  p.pop();
  
  // Render entities in order
  gameState.hazards.forEach(h => h.render(p, gameState.currentWorld));
  gameState.platforms.forEach(plat => plat.render(p, gameState.currentWorld));
  gameState.doors.forEach(door => door.render(p, gameState.currentWorld));
  gameState.switches.forEach(sw => sw.render(p, gameState.currentWorld));
  gameState.crystals.forEach(crystal => crystal.render(p, gameState.currentWorld));
  gameState.movableBlocks.forEach(block => block.render(p));
  
  if (gameState.exitPortal) {
    gameState.exitPortal.render(p, gameState.currentWorld);
  }
  
  if (gameState.player) {
    gameState.player.render(p, gameState.currentWorld);
  }
  
  // UI Elements
  renderUI(p);
}

export function renderUI(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  // World indicator
  p.fill(gameState.currentWorld === 'NORMAL' ? 100 : 200,
         gameState.currentWorld === 'NORMAL' ? 150 : 100,
         255);
  p.text(`World: ${gameState.currentWorld === 'NORMAL' ? 'Normal' : 'Inner'}`, 10, 8);
  
  // Score/Crystals
  p.fill(255, 255, 100);
  p.text(`Crystals: ${gameState.crystalsCollected}/${gameState.totalCrystals}`, 180, 8);
  
  // Level
  p.fill(200, 200, 220);
  p.text(`Level: ${gameState.currentLevel}/${gameState.totalLevels}`, 350, 8);
  
  // Deaths
  p.fill(255, 100, 100);
  p.text(`Deaths: ${gameState.deathCount}`, 480, 8);
  
  p.pop();
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
  
  // Overlay
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(255, 255, 255);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 75);
  
  p.pop();
  
  // Small indicator in top right
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.fill(255, 200, 100);
  p.text("PAUSED", CANVAS_WIDTH - 10, 8);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  if (isWin) {
    p.fill(100, 255, 150);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 100);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Stats
  p.textSize(16);
  p.fill(200, 200, 220);
  p.text(`Crystals Collected: ${gameState.crystalsCollected}/${gameState.totalCrystals}`, CANVAS_WIDTH / 2, 180);
  p.text(`Deaths: ${gameState.deathCount}`, CANVAS_WIDTH / 2, 210);
  p.text(`Level: ${gameState.currentLevel}/${gameState.totalLevels}`, CANVAS_WIDTH / 2, 240);
  
  // Score
  p.textSize(24);
  p.fill(255, 255, 100);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 280);
  
  // Instructions
  p.textSize(16);
  const alpha = Math.sin(p.frameCount * 0.1) * 50 + 200;
  p.fill(255, 255, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}