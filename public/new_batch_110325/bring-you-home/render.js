// render.js - Rendering functions

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 30, 50);
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BRING YOU HOME", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.textSize(16);
  p.fill(200, 200, 255);
  p.text("Guide Polo home by rearranging the world!", CANVAS_WIDTH / 2, 140);
  
  p.textSize(14);
  p.fill(180, 180, 200);
  const instructions = [
    "← / → : Select panels to swap",
    "SPACE : Swap selected panels",
    "Z : Start Polo walking",
    "SHIFT : Rewind if in danger",
    "",
    "Avoid spikes, enemies, and gaps!",
    "Create a safe path to the exit."
  ];
  
  let yPos = 180;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 22;
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawGameScreen(p) {
  p.background(40, 40, 60);
  
  // Draw UI header
  drawUI(p);
  
  // Draw panels
  gameState.panels.forEach(panel => {
    panel.draw(p);
  });
  
  // Draw Polo
  if (gameState.player) {
    gameState.player.draw(p);
  }
  
  // Draw instructions overlay
  drawInstructions(p);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawUI(p) {
  // Background for UI
  p.fill(20, 20, 40);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 15);
  
  // World and Level
  p.text(`World ${gameState.currentWorld + 1}-${gameState.currentLevel + 1}`, 10, 35);
  
  // Polo state indicator
  let stateText = "";
  let stateColor = [255, 255, 255];
  
  if (gameState.poloState === "IDLE") {
    stateText = "Ready (Press Z)";
    stateColor = [100, 255, 100];
  } else if (gameState.poloState === "WALKING") {
    stateText = "Walking...";
    stateColor = [255, 255, 100];
  } else if (gameState.poloState === "DEAD") {
    stateText = "Danger! (Press SHIFT)";
    stateColor = [255, 100, 100];
  } else if (gameState.poloState === "SUCCESS") {
    stateText = "Success!";
    stateColor = [100, 255, 100];
  }
  
  p.fill(...stateColor);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(stateText, CANVAS_WIDTH - 10, 25);
}

function drawInstructions(p) {
  if (gameState.poloState === "IDLE") {
    p.fill(255, 255, 255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("Arrange panels, then press Z to start", CANVAS_WIDTH / 2, 230);
  }
}

export function drawGameOverScreen(p) {
  p.background(30, 30, 50);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  // Message
  p.textSize(16);
  p.fill(200, 200, 255);
  if (isWin) {
    p.text("You brought Polo home safely!", CANVAS_WIDTH / 2, 220);
    p.text("Through all worlds and dangers!", CANVAS_WIDTH / 2, 245);
  } else {
    p.text("Better luck next time!", CANVAS_WIDTH / 2, 220);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}