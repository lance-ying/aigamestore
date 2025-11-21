// ui.js - UI rendering and HUD

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(15, 15, 25);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 100, 150, 100);
  p.textSize(52);
  p.text("ONLY YOU ARE HERE", CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  p.fill(200, 200, 255);
  p.textSize(50);
  p.text("ONLY YOU ARE HERE", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text("A surreal journey through fragmented memories", CANVAS_WIDTH / 2, 140);
  p.text("Navigate dream-like rooms, solve puzzles, and discover the truth", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.fill(150, 150, 180);
  p.textSize(13);
  p.textAlign(p.LEFT, p.CENTER);
  const startX = 120;
  p.text("Arrow Keys - Move forward/back, turn left/right", startX, 210);
  p.text("Space - Interact with objects", startX, 230);
  p.text("Shift - Sprint", startX, 250);
  p.text("Z - Use collected items", startX, 270);
  p.text("ESC - Pause", startX, 290);
  
  // Objective
  p.fill(255, 220, 150);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Collect all 5 memory fragments to unlock the final door", CANVAS_WIDTH / 2, 330);
  
  // Start prompt with pulse
  const alpha = Math.sin(p.frameCount * 0.1) * 100 + 155;
  p.fill(150, 255, 150, alpha);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p) {
  p.background(10, 10, 15);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    // Ending specific messages
    let endingTitle = "";
    let endingMessage = "";
    
    switch (gameState.endingType) {
      case "TRANSCENDENCE":
        endingTitle = "TRANSCENDENCE";
        endingMessage = "You've gathered all the fragments and uncovered the deepest secrets.\nYour consciousness transcends this surreal prison.";
        p.fill(255, 215, 0);
        break;
      case "ESCAPE":
        endingTitle = "ESCAPE";
        endingMessage = "With the fragments collected, you find the way out.\nBut mysteries remain unsolved...";
        p.fill(150, 255, 150);
        break;
      default:
        endingTitle = "INCOMPLETE";
        endingMessage = "You escaped, but left pieces of yourself behind.";
        p.fill(200, 200, 100);
    }
    
    p.textSize(48);
    p.text(endingTitle, CANVAS_WIDTH / 2, 100);
    
    p.fill(180, 180, 200);
    p.textSize(16);
    const lines = endingMessage.split('\n');
    lines.forEach((line, i) => {
      p.text(line, CANVAS_WIDTH / 2, 160 + i * 25);
    });
  } else {
    // Lose condition
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("LOST IN THE VOID", CANVAS_WIDTH / 2, 100);
    
    p.fill(180, 180, 200);
    p.textSize(16);
    p.text("The shadows consumed you.", CANVAS_WIDTH / 2, 160);
    p.text("Your memories fade into darkness...", CANVAS_WIDTH / 2, 185);
  }
  
  // Score
  p.fill(200, 200, 220);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  // Stats
  p.textSize(14);
  p.text(`Memory Fragments: ${gameState.collectedFragments}/${gameState.totalFragments}`, CANVAS_WIDTH / 2, 270);
  p.text(`Puzzles Solved: ${gameState.puzzlesSolved}`, CANVAS_WIDTH / 2, 290);
  p.text(`Secrets Found: ${gameState.secretsFound}`, CANVAS_WIDTH / 2, 310);
  
  // Restart prompt
  const alpha = Math.sin(p.frameCount * 0.1) * 100 + 155;
  p.fill(150, 150, 255, alpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

export function renderHUD(p) {
  // Health bar
  const healthBarWidth = 150;
  const healthBarHeight = 20;
  const healthBarX = 10;
  const healthBarY = 10;
  
  p.fill(60, 60, 80);
  p.noStroke();
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  
  const healthPercent = gameState.player ? gameState.player.health / 100 : 0;
  const healthColor = healthPercent > 0.5 ? [100, 255, 100] : (healthPercent > 0.25 ? [255, 200, 100] : [255, 100, 100]);
  p.fill(...healthColor);
  p.rect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("HEALTH", healthBarX + 5, healthBarY + 5);
  
  // Fragment counter
  p.fill(255, 220, 150);
  p.textSize(14);
  p.text(`Fragments: ${gameState.collectedFragments}/${gameState.totalFragments}`, 10, 40);
  
  // Score
  p.fill(200, 200, 255);
  p.text(`Score: ${gameState.score}`, 10, 60);
  
  // Inventory
  if (gameState.inventory.length > 0) {
    p.fill(180, 180, 200);
    p.textSize(12);
    p.text("Inventory:", 10, 80);
    gameState.inventory.forEach((item, i) => {
      const displayName = item.includes("fragment") ? "Memory" : item.replace("_", " ");
      p.text(`- ${displayName}`, 20, 95 + i * 15);
    });
  }
  
  // Room indicator
  p.fill(150, 150, 170);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`Room ${gameState.currentRoom + 1}`, CANVAS_WIDTH - 10, 10);
  
  // Interaction prompt
  if (gameState.player && canInteract(p)) {
    const alpha = Math.sin(p.frameCount * 0.15) * 80 + 175;
    p.fill(255, 255, 150, alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("[SPACE] Interact", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

function canInteract(p) {
  if (!gameState.player) return false;
  
  for (const interactable of gameState.interactables) {
    if (!interactable.active) continue;
    const dist = p.dist(gameState.player.x, gameState.player.y, interactable.x, interactable.y);
    if (dist < gameState.player.interactionRange) {
      return true;
    }
  }
  return false;
}