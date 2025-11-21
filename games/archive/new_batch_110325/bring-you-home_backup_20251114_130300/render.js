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
    "← / → : Move cursor between panels",
    "SPACE : Select panel (select 2 to swap)",
    "Z : Start Polo walking",
    "SHIFT : Rewind if in danger",
    "",
    "TIP: You can move the EXIT to create",
    "a shorter safe path! Only START is fixed.",
    "",
    "Avoid spikes, enemies, and gaps!"
  ];
  
  let yPos = 170;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  });
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
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
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 12);
  
  // World and Level
  p.text(`World ${gameState.currentWorld + 1}-${gameState.currentLevel + 1}`, 10, 28);
  
  // Polo state indicator
  let stateText = "";
  let stateColor = [255, 255, 255];
  
  if (gameState.poloState === "IDLE") {
    stateText = "Arrange panels (Z to start)";
    stateColor = [100, 255, 100];
  } else if (gameState.poloState === "WALKING") {
    stateText = "Walking...";
    stateColor = [255, 255, 100];
  } else if (gameState.poloState === "DEAD") {
    stateText = "Danger! (SHIFT to rewind)";
    stateColor = [255, 100, 100];
  } else if (gameState.poloState === "SUCCESS") {
    stateText = "Success!";
    stateColor = [100, 255, 100];
  }
  
  p.fill(...stateColor);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(stateText, CANVAS_WIDTH - 10, 20);
  
  // Selection instructions
  if (gameState.poloState === "IDLE") {
    p.fill(200, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    const selCount = gameState.selectedPanels.length;
    if (selCount === 0) {
      p.text("◄► = Move cursor | SPACE = Select panel", CANVAS_WIDTH / 2, 55);
    } else if (selCount === 1) {
      p.text("◄► = Move cursor | SPACE = Select 2nd panel to swap", CANVAS_WIDTH / 2, 55);
    } else if (selCount === 2) {
      p.text("Swapping panels...", CANVAS_WIDTH / 2, 55);
    }
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