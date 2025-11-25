// ui.js - User interface rendering

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
         TOTAL_EVIDENCE, PLAYER_MAX_STAMINA, PLAYER_MAX_BATTERY } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 25);

  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 3; i > 0; i--) {
    p.fill(200, 80, 80, 40 / i);
    p.textSize(48 + i * 2);
    p.text("FIREWORK", p.width / 2, p.height / 4);
  }
  
  // Title
  p.fill(255, 120, 100);
  p.textSize(48);
  p.text("FIREWORK", p.width / 2, p.height / 4);
  
  // Subtitle
  p.fill(200, 180, 160);
  p.textSize(16);
  p.text("Investigation of the Village Massacre", p.width / 2, p.height / 4 + 40);
  
  p.pop();

  // Description box
  p.push();
  p.fill(40, 35, 45, 200);
  p.noStroke();
  p.rect(50, p.height / 2 - 80, p.width - 100, 200, 5);
  
  p.fill(220, 200, 180);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("You are Lin Lixun, a rookie police officer investigating", p.width / 2, p.height / 2 - 65);
  p.text("a mysterious massacre in a remote mountain village.", p.width / 2, p.height / 2 - 45);
  p.text("Collect all 8 pieces of evidence while avoiding spirits.", p.width / 2, p.height / 2 - 25);
  p.text("Use your flashlight to stun spirits temporarily.", p.width / 2, p.height / 2 - 5);
  
  p.fill(180, 160, 140);
  p.textSize(12);
  p.text("Arrow Keys: Move  |  Shift: Sprint  |  Z: Flashlight  |  Space: Collect Evidence", p.width / 2, p.height / 2 + 30);
  p.text("ESC: Pause  |  R: Restart", p.width / 2, p.height / 2 + 50);
  
  p.pop();

  // Press ENTER prompt with pulse effect
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.push();
  p.fill(255, 220, 150, pulseAlpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", p.width / 2, p.height - 60);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, p.width, p.height);

  p.textAlign(p.CENTER, p.CENTER);

  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    // Victory
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("CASE SOLVED", p.width / 2, p.height / 2 - 60);
    
    p.fill(200, 255, 200);
    p.textSize(18);
    p.text("All evidence collected!", p.width / 2, p.height / 2 - 10);
    p.text("The truth behind the massacre has been revealed.", p.width / 2, p.height / 2 + 15);
  } else {
    // Defeat
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("INVESTIGATION FAILED", p.width / 2, p.height / 2 - 60);
    
    p.fill(255, 200, 200);
    p.textSize(18);
    p.text("You were caught by a spirit.", p.width / 2, p.height / 2 - 10);
    p.text("The case remains unsolved...", p.width / 2, p.height / 2 + 15);
  }

  // Score
  p.fill(255, 255, 200);
  p.textSize(20);
  p.text(`Evidence Collected: ${gameState.evidenceCollected}/${TOTAL_EVIDENCE}`, p.width / 2, p.height / 2 + 50);
  p.text(`Score: ${gameState.score}`, p.width / 2, p.height / 2 + 75);

  // Restart prompt
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 255, pulseAlpha);
  p.textSize(16);
  p.text("PRESS R TO RESTART", p.width / 2, p.height - 60);

  p.pop();
}

export function renderHUD(p) {
  if (gameState.gamePhase !== PHASE_PLAYING && gameState.gamePhase !== PHASE_PAUSED) {
    return;
  }

  p.push();

  // HUD background panel
  p.fill(20, 15, 25, 200);
  p.noStroke();
  p.rect(10, 10, p.width - 20, 70, 5);

  // Evidence counter
  p.fill(255, 220, 150);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Evidence: ${gameState.evidenceCollected}/${TOTAL_EVIDENCE}`, 20, 20);

  // Score
  p.text(`Score: ${gameState.score}`, 20, 45);

  // Stamina bar
  const staminaWidth = 150;
  const staminaHeight = 12;
  const staminaX = p.width - staminaWidth - 20;
  const staminaY = 20;

  p.fill(60, 50, 50);
  p.rect(staminaX, staminaY, staminaWidth, staminaHeight);
  
  const staminaPercent = gameState.player ? gameState.player.stamina / PLAYER_MAX_STAMINA : 0;
  p.fill(100, 200, 100);
  p.rect(staminaX, staminaY, staminaWidth * staminaPercent, staminaHeight);

  p.fill(200, 200, 200);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(10);
  p.text("STAMINA", staminaX - 5, staminaY + 1);

  // Battery bar
  const batteryY = staminaY + staminaHeight + 8;

  p.fill(60, 50, 50);
  p.rect(staminaX, batteryY, staminaWidth, staminaHeight);
  
  const batteryPercent = gameState.player ? gameState.player.battery / PLAYER_MAX_BATTERY : 0;
  p.fill(255, 220, 100);
  p.rect(staminaX, batteryY, staminaWidth * batteryPercent, staminaHeight);

  p.fill(200, 200, 200);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(10);
  p.text("BATTERY", staminaX - 5, batteryY + 1);

  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", p.width - 20, 60);
  }

  p.pop();
}