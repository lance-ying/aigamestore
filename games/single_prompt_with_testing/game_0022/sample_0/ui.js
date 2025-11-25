// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  const saturation = gameState.worldSaturation;
  
  // Score
  p.fill(200 + 55 * saturation, 200 + 55 * saturation, 200 + 55 * saturation);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Abilities UI
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const abilityY = 35;
  
  // Double Jump
  const djColor = gameState.abilities.doubleJump ? [200, 50, 50] : [80, 80, 80];
  p.fill(...djColor);
  p.text("❤ Double Jump (Space x2)", 10, abilityY);
  
  // Ground Pound
  const gpColor = gameState.abilities.groundPound ? [50, 100, 200] : [80, 80, 80];
  p.fill(...gpColor);
  p.text("◆ Ground Pound (↓)", 10, abilityY + 18);
  
  // Dash
  const dashColor = gameState.abilities.dash ? [220, 200, 50] : [80, 80, 80];
  p.fill(...dashColor);
  p.text("★ Dash (Shift)", 10, abilityY + 36);
  
  // Instructions hint
  if (gameState.worldSaturation < 0.5) {
    p.fill(200, 200, 200, 150);
    p.textSize(11);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Collect colored orbs to gain abilities", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
  
  // Goal hint when all abilities unlocked
  if (gameState.worldSaturation >= 1 && !gameState.goalReached) {
    p.fill(255, 200, 255, 200 + 55 * Math.sin(p.frameCount * 0.1));
    p.textSize(14);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Reach the light above!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255, 255, 255);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function renderStartScreen(p) {
  const saturation = 0.2;
  
  // Background
  p.background(30 + 60 * saturation, 30 + 60 * saturation, 40 + 80 * saturation);
  
  // Title
  p.fill(200, 180, 220);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("GRIS", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(180, 160, 200);
  p.textSize(16);
  p.text("A Journey Through Sorrow", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(13);
  p.textAlign(p.CENTER, p.TOP);
  const desc = "Guide Gris through her faded world.\nCollect colored orbs to unlock dress abilities.\nRestore color and reach the light above.";
  p.text(desc, CANVAS_WIDTH / 2, 160);
  
  // Controls
  p.fill(220, 220, 220);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    "← → : Move",
    "Space: Jump",
    "↑ : Look Up",
    "",
    "Abilities (unlock by collecting orbs):",
    "  ❤ Red: Double Jump (Space x2)",
    "  ◆ Blue: Ground Pound (↓)",
    "  ★ Yellow: Dash (Shift)"
  ];
  let y = 230;
  for (const line of controls) {
    p.text(line, 150, y);
    y += 16;
  }
  
  // Start prompt
  p.fill(255, 255, 255, 200 + 55 * Math.sin(p.frameCount * 0.1));
  p.textSize(18);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function renderGameOverScreen(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Win message
  p.fill(255, 220, 255);
  p.textSize(42);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Journey Complete", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Message
  p.fill(220, 200, 220);
  p.textSize(16);
  p.text("Color has returned to your world", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Restart prompt
  p.fill(255, 255, 255, 200 + 55 * Math.sin(p.frameCount * 0.1));
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}