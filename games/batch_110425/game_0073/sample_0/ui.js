// ui.js - User interface rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, RECIPES } from './globals.js';

export function renderUI(p) {
  // Health bar
  p.push();
  p.fill(40);
  p.noStroke();
  p.rect(10, 10, 150, 12, 3);
  const healthPercent = gameState.player.health / gameState.player.maxHealth;
  p.fill(220, 50, 50);
  p.rect(10, 10, 150 * healthPercent, 12, 3);
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`HP: ${Math.ceil(gameState.player.health)}/${gameState.player.maxHealth}`, 12, 11);
  p.pop();

  // Stamina bar
  p.push();
  p.fill(40);
  p.noStroke();
  p.rect(10, 25, 150, 10, 3);
  const staminaPercent = gameState.player.stamina / gameState.player.maxStamina;
  p.fill(100, 200, 100);
  p.rect(10, 25, 150 * staminaPercent, 10, 3);
  p.pop();

  // Score and level
  p.push();
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Score: ${gameState.score}`, 10, 40);
  p.text(`Level: ${gameState.level}`, 10, 55);
  p.text(`XP: ${gameState.experience}/${gameState.experienceToNextLevel}`, 10, 70);
  p.pop();

  // Inventory
  p.push();
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Wood: ${gameState.inventory.wood}`, CANVAS_WIDTH - 10, 10);
  p.text(`Stone: ${gameState.inventory.stone}`, CANVAS_WIDTH - 10, 25);
  p.text(`Metal: ${gameState.inventory.metal}`, CANVAS_WIDTH - 10, 40);
  p.text(`Fabric: ${gameState.inventory.fabric}`, CANVAS_WIDTH - 10, 55);
  p.pop();

  // Equipment
  p.push();
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Weapon: ${gameState.equippedWeapon}`, CANVAS_WIDTH - 10, 75);
  p.text(`Tool: ${gameState.equippedTool}`, CANVAS_WIDTH - 10, 90);
  p.pop();

  // Zones cleared
  p.push();
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text(`Zones: ${gameState.clearedZones.length}/4`, 10, CANVAS_HEIGHT - 10);
  p.pop();

  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.push();
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

export function renderStartScreen(p) {
  p.background(40, 50, 45);
  
  p.push();
  p.fill(200, 220, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("DYSMANTLE", CANVAS_WIDTH / 2, 60);
  
  p.textSize(14);
  p.fill(180, 200, 180);
  p.text("Survive. Break. Craft. Escape.", CANVAS_WIDTH / 2, 100);
  
  p.textSize(12);
  p.fill(160, 180, 160);
  const instructions = [
    "Explore the post-apocalyptic island",
    "Break objects to gather resources",
    "Defeat enemies to clear zones",
    "Craft weapons and tools to progress",
    "Activate all outposts and escape!",
    "",
    "CONTROLS:",
    "Arrow Keys - Move",
    "SPACE - Attack (uses stamina)",
    "Z - Interact (break objects, craft)",
    "SHIFT - Sprint (uses stamina)",
    "ESC - Pause",
    "",
    "PRESS ENTER TO START"
  ];
  
  let y = 140;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 18;
  }
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(40, 40, 50, 200);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.textSize(36);
    p.text("ESCAPED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(180, 255, 180);
    p.textSize(16);
    p.text("You have escaped the island!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textSize(36);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 180, 180);
    p.textSize(16);
    p.text("You were defeated...", CANVAS_WIDTH / 2, 170);
  }
  
  p.fill(220, 220, 220);
  p.textSize(14);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
  p.text(`Level: ${gameState.level}`, CANVAS_WIDTH / 2, 230);
  p.text(`Zones Cleared: ${gameState.clearedZones.length}/4`, CANVAS_WIDTH / 2, 250);
  
  p.textSize(16);
  p.fill(255, 255, 150);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
  
  p.pop();
}