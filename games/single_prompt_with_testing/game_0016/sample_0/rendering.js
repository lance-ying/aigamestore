// rendering.js - Rendering functions

import {
  gameState,
  GAME_PHASES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TIME_CONFIG,
  HUNGER_CONFIG
} from './globals.js';

export function updateCamera() {
  // Center camera on player
  gameState.cameraX = gameState.player.x - CANVAS_WIDTH / 2;
  gameState.cameraY = gameState.player.y - CANVAS_HEIGHT / 2;
}

export function drawGame(p) {
  // Sky/ground based on time of day
  const isNight = gameState.timeOfDay >= TIME_CONFIG.DAY_LENGTH;
  
  if (isNight) {
    p.background(20, 20, 40);
  } else {
    const dayProgress = gameState.timeOfDay / TIME_CONFIG.DAY_LENGTH;
    if (dayProgress < 0.1) {
      // Dawn
      const t = dayProgress / 0.1;
      p.background(
        p.lerp(40, 135, t),
        p.lerp(40, 206, t),
        p.lerp(80, 235, t)
      );
    } else if (dayProgress > 0.9) {
      // Dusk
      const t = (dayProgress - 0.9) / 0.1;
      p.background(
        p.lerp(135, 40, t),
        p.lerp(206, 60, t),
        p.lerp(235, 80, t)
      );
    } else {
      // Day
      p.background(135, 206, 235);
    }
  }
  
  // Ground
  p.fill(100, 150, 80);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw resources
  for (const resource of gameState.resources) {
    resource.draw(p, gameState.cameraX, gameState.cameraY);
  }
  
  // Draw campfire
  gameState.campfire.draw(p, gameState.cameraX, gameState.cameraY);
  
  // Draw portal
  gameState.portal.draw(p, gameState.cameraX, gameState.cameraY);
  
  // Draw rabbits
  for (const rabbit of gameState.rabbits) {
    rabbit.draw(p, gameState.cameraX, gameState.cameraY);
  }
  
  // Draw player
  gameState.player.draw(p, gameState.cameraX, gameState.cameraY);
  
  // Darkness overlay at night
  if (isNight) {
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Light around campfire
    if (gameState.campfire.lit) {
      const fireScreenX = gameState.campfire.x - gameState.cameraX;
      const fireScreenY = gameState.campfire.y - gameState.cameraY;
      
      const gradient = p.drawingContext.createRadialGradient(
        fireScreenX, fireScreenY, 0,
        fireScreenX, fireScreenY, 100
      );
      gradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
      
      p.drawingContext.fillStyle = gradient;
      p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }
  
  // UI
  drawUI(p);
}

export function drawUI(p) {
  // Hunger bar
  p.fill(50);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(10, 10, 150, 20);
  
  const hungerPercent = gameState.hunger / HUNGER_CONFIG.MAX;
  const barColor = hungerPercent > 0.5 ? [100, 200, 100] : hungerPercent > 0.25 ? [200, 200, 100] : [200, 100, 100];
  p.fill(...barColor);
  p.noStroke();
  p.rect(10, 10, 150 * hungerPercent, 20);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Hunger: ${Math.floor(gameState.hunger)}`, 15, 13);
  
  // Inventory
  let yPos = 40;
  p.fill(255);
  p.textSize(14);
  p.text(`Berries: ${gameState.inventory.berry}`, 10, yPos);
  yPos += 20;
  p.text(`Wood: ${gameState.inventory.wood}`, 10, yPos);
  yPos += 20;
  p.text(`Stone: ${gameState.inventory.stone}`, 10, yPos);
  yPos += 20;
  p.text(`Meat: ${gameState.inventory.meat}`, 10, yPos);
  yPos += 20;
  
  if (gameState.inventory.hasAxe) {
    p.text(`[Axe]`, 10, yPos);
    yPos += 20;
  }
  if (gameState.inventory.hasPickaxe) {
    p.text(`[Pickaxe]`, 10, yPos);
    yPos += 20;
  }
  
  // Time and cycles
  p.textAlign(p.RIGHT, p.TOP);
  const isNight = gameState.timeOfDay >= TIME_CONFIG.DAY_LENGTH;
  p.text(`Day ${gameState.cyclesCompleted + 1}`, CANVAS_WIDTH - 10, 10);
  p.text(isNight ? "NIGHT" : "DAY", CANVAS_WIDTH - 10, 30);
  
  if (gameState.campfire.lit) {
    const fuelPercent = Math.floor((gameState.campfire.fuel / 300) * 100);
    p.text(`Fire: ${fuelPercent}%`, CANVAS_WIDTH - 10, 50);
  }
  
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 70);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 0);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, CANVAS_HEIGHT - 30);
  }
  
  // Portal message
  if (gameState.portal.active) {
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 200, 255);
    p.textSize(18);
    p.text("Portal is open! Go to the corner!", CANVAS_WIDTH / 2, 370);
  }
}

export function drawStartScreen(p) {
  p.background(30, 20, 40);
  
  // Title with decorative elements
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 200, 100);
  p.textSize(48);
  p.text("DON'T STARVE", CANVAS_WIDTH / 2, 60);
  
  p.fill(200, 150, 100);
  p.textSize(16);
  p.text("A Wilderness Survival Game", CANVAS_WIDTH / 2, 100);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.text("You are Wilson, trapped in a mysterious wilderness.", CANVAS_WIDTH / 2, 150);
  p.text("Survive by gathering resources and managing your hunger.", CANVAS_WIDTH / 2, 170);
  p.text("At night, stay near your lit campfire or face the darkness.", CANVAS_WIDTH / 2, 190);
  p.text("Survive 5 full day-night cycles to open the portal home!", CANVAS_WIDTH / 2, 210);
  
  // Instructions
  p.fill(200, 255, 200);
  p.textSize(13);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 245);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  let y = 270;
  p.text("Arrow Keys: Move Wilson", 150, y);
  y += 20;
  p.text("SPACE: Gather resources (berries, wood, stone) / Hunt rabbits", 150, y);
  y += 20;
  p.text("Z: Craft tools (Axe: 2 wood + 1 stone, Pickaxe: 1 wood + 2 stone)", 150, y);
  y += 20;
  p.text("SHIFT: Light campfire / Add wood to campfire", 150, y);
  y += 20;
  p.text("ESC: Pause/Unpause", 150, y);
  y += 20;
  p.text("R: Restart", 150, y);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 30);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("YOU SURVIVED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text("You found the portal and escaped the wilderness!", CANVAS_WIDTH / 2, 180);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("YOU DIED", CANVAS_WIDTH / 2, 120);
    
    p.fill(255);
    p.textSize(20);
    p.text("You succumbed to the wilderness...", CANVAS_WIDTH / 2, 180);
  }
  
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Days Survived: ${gameState.cyclesCompleted}`, CANVAS_WIDTH / 2, 250);
  
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = p.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  }
}