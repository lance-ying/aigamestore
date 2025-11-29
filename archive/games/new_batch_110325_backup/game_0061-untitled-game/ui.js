// ui.js - User interface rendering

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  // Score and inventory
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderHUD(p);
    renderMessages(p);
  }
}

function renderHUD(p) {
  p.push();
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Zone name
  p.text(`Zone: ${gameState.currentZone}`, 10, 30);
  
  // Inventory
  p.textSize(12);
  p.text(`Keys: ${gameState.keysCollected.join(', ') || 'None'}`, 10, 50);
  
  // Secrets found
  p.text(`Secrets: ${gameState.secretsFound.length}`, 10, 70);
  
  // Speed indicator
  const speedText = gameState.isRunning ? "Running [Z]" : "Walking [Z]";
  p.textAlign(p.RIGHT, p.TOP);
  p.text(speedText, p.width - 10, 10);
  
  // Puzzle status
  if (gameState.machineryActive) {
    p.fill(100, 255, 100, 200);
    p.text("Machinery: Active", p.width - 10, 30);
  }
  
  p.pop();
}

function renderMessages(p) {
  if (gameState.messageQueue.length === 0) return;
  
  p.push();
  p.fill(255, 255, 255, 230);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  
  const message = gameState.messageQueue[0];
  const y = p.height - 50;
  
  // Background
  p.fill(0, 0, 0, 150);
  p.rect(p.width/2 - 200, y - 15, 400, 30);
  
  p.fill(255, 255, 255, 230);
  p.text(message, p.width / 2, y);
  
  p.pop();
  
  // Remove message after delay
  if (gameState.frameCount % 120 === 0 && gameState.messageQueue.length > 0) {
    gameState.messageQueue.shift();
  }
}

export function renderStartScreen(p) {
  p.push();
  p.fill(20, 20, 30);
  p.rect(0, 0, p.width, p.height);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 150, 200, 50);
  p.textSize(48);
  p.text("SOLO TÚ POR AQUÍ", p.width / 2 + 2, p.height / 4 + 2);
  
  p.fill(200, 220, 255);
  p.textSize(48);
  p.text("SOLO TÚ POR AQUÍ", p.width / 2, p.height / 4);
  
  p.fill(180, 200, 230);
  p.textSize(16);
  p.text("Only You Here", p.width / 2, p.height / 4 + 40);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  const instructions = [
    "Navigate through a surreal dreamscape",
    "Solve puzzles and uncover secrets",
    "Find keys to unlock the final door",
    "",
    "CONTROLS:",
    "Arrow Keys - Move and turn",
    "Space - Interact with objects",
    "Z - Toggle walk/run speed",
    "ESC - Pause game",
    "",
    "PRESS ENTER TO START"
  ];
  
  let yPos = p.height / 2 - 50;
  for (const line of instructions) {
    p.text(line, p.width / 2, yPos);
    yPos += 20;
  }
  
  // Pulsing prompt
  const alpha = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(255, 255, 150, alpha);
  p.textSize(18);
  p.text("PRESS ENTER TO START", p.width / 2, p.height - 50);
  
  p.pop();
}

export function renderPausedScreen(p) {
  p.push();
  p.fill(255, 255, 255, 200);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", p.width - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Darkened overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, p.width, p.height);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  // Win or lose message
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("ESCAPE", p.width / 2, p.height / 3);
    
    p.fill(200, 255, 200);
    p.textSize(18);
    p.text("You found the way out", p.width / 2, p.height / 3 + 50);
    
    // Ending type
    const endingText = determineEnding();
    p.fill(220, 220, 255);
    p.textSize(14);
    p.text(endingText, p.width / 2, p.height / 2);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("LOST", p.width / 2, p.height / 3);
    
    p.fill(255, 200, 200);
    p.textSize(18);
    p.text("Trapped in the dreamscape", p.width / 2, p.height / 3 + 50);
  }
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, p.width / 2, p.height / 2 + 50);
  
  // Stats
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text(`Keys Collected: ${gameState.keysCollected.length}`, p.width / 2, p.height / 2 + 90);
  p.text(`Secrets Found: ${gameState.secretsFound.length}`, p.width / 2, p.height / 2 + 110);
  p.text(`Puzzles Solved: ${gameState.puzzlesSolved.length}`, p.width / 2, p.height / 2 + 130);
  
  // Restart prompt
  const alpha = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(255, 255, 255, alpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", p.width / 2, p.height - 50);
  
  p.pop();
}

function determineEnding() {
  const secrets = gameState.secretsFound.length;
  const narratives = gameState.narrativeFragments.length;
  
  if (secrets >= 5 && narratives >= 5) {
    return "ENDING: The Truth Revealed";
  } else if (gameState.machineryActive && secrets >= 3) {
    return "ENDING: Mechanical Awakening";
  } else if (gameState.keysCollected.length === 2 && secrets >= 2) {
    return "ENDING: Dual Path";
  } else if (gameState.keysCollected.includes('red')) {
    return "ENDING: Crimson Exit";
  } else if (gameState.keysCollected.includes('blue')) {
    return "ENDING: Azure Passage";
  } else {
    return "ENDING: Basic Escape";
  }
}