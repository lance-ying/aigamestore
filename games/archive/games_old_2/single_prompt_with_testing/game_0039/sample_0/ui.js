import { gameState, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 40, 60);
  
  // Title with racing style
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 200, 0);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("RECKLESS", 300, 80);
  
  p.fill(255, 100, 0);
  p.textSize(36);
  p.text("DRIFT RACING", 300, 120);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textStyle(p.NORMAL);
  p.text("Race against AI opponents on a muddy isometric track!", 300, 170);
  p.text("Master drifting and cross the finish line first!", 300, 190);
  
  // Instructions
  p.fill(255, 255, 150);
  p.textSize(12);
  p.text("CONTROLS:", 300, 230);
  p.fill(200, 200, 200);
  p.textSize(11);
  p.text("Arrow Keys / WASD: Steer & Accelerate", 300, 250);
  p.text("Space: Boost (Limited)", 300, 270);
  p.text("ESC: Pause", 300, 290);
  
  // Race info
  p.fill(255, 200, 100);
  p.textSize(12);
  p.text("Complete 3 laps to win!", 300, 320);
  
  // Start prompt
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.fill(0, 255, 0);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text("PRESS ENTER TO START", 300, 360);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, 600, 400);
  
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", 300, 180);
  
  p.fill(200, 200, 200);
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", 300, 230);
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(0, 255, 0);
    p.textSize(56);
    p.textStyle(p.BOLD);
    p.text("VICTORY!", 300, 100);
    
    p.fill(255, 255, 100);
    p.textSize(24);
    p.text("You finished 1st place!", 300, 160);
  } else {
    p.fill(255, 100, 100);
    p.textSize(56);
    p.textStyle(p.BOLD);
    p.text("RACE OVER", 300, 100);
    
    p.fill(200, 200, 200);
    p.textSize(24);
    p.text("Better luck next time!", 300, 160);
  }
  
  // Stats
  p.fill(200, 200, 255);
  p.textSize(18);
  p.textStyle(p.NORMAL);
  const minutes = Math.floor(gameState.raceEndTime / 60000);
  const seconds = Math.floor((gameState.raceEndTime % 60000) / 1000);
  const ms = Math.floor((gameState.raceEndTime % 1000) / 10);
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`, 300, 220);
  p.text(`Final Score: ${gameState.score}`, 300, 250);
  
  // Restart prompt
  const flash = Math.sin(p.frameCount * 0.08) > 0;
  if (flash) {
    p.fill(255, 255, 0);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text("Press R to restart", 300, 320);
  }
}

export function renderHUD(p) {
  // Semi-transparent background for HUD
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(5, 5, 200, 90, 5);
  
  // Lap counter
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`Lap: ${gameState.lapCount + 1}/${gameState.maxLaps}`, 15, 15);
  
  // Checkpoint
  p.textSize(14);
  p.text(`CP: ${gameState.currentCheckpoint}/${gameState.checkpoints.length}`, 15, 40);
  
  // Score
  p.text(`Score: ${gameState.score}`, 15, 65);
  
  // Boost indicator
  p.fill(0, 0, 0, 150);
  p.rect(410, 5, 185, 40, 5);
  p.fill(255, 200, 0);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Boost: `, 420, 15);
  
  for (let i = 0; i < 3; i++) {
    if (i < gameState.boostCharges) {
      p.fill(0, 255, 0);
    } else {
      p.fill(80, 80, 80);
    }
    p.rect(480 + i * 35, 15, 30, 20, 3);
  }
  
  // Speed indicator
  if (gameState.player) {
    const velocity = gameState.player.body.velocity;
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const speedPercent = Math.min(speed / gameState.player.maxSpeed, 1);
    
    p.fill(0, 0, 0, 150);
    p.rect(215, 5, 185, 40, 5);
    p.fill(255, 255, 255);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Speed:", 225, 15);
    
    // Speed bar
    p.fill(50, 50, 50);
    p.rect(285, 15, 100, 20, 3);
    
    if (speedPercent > 0.8) {
      p.fill(255, 100, 0);
    } else if (speedPercent > 0.5) {
      p.fill(255, 200, 0);
    } else {
      p.fill(0, 255, 0);
    }
    p.rect(285, 15, 100 * speedPercent, 20, 3);
  }
  
  // Drift indicator
  if (gameState.player && gameState.player.isDrifting) {
    p.fill(255, 150, 0, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text("DRIFT!", 300, 380);
    gameState.driftScore += 0.5;
  }
}