// rendering.js - Rendering functions
import { 
  gameState, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_SHOP,
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20);
  
  p.push();
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("GUNFIRE REBORN", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 150, 255);
  p.textSize(16);
  p.text("Roguelite FPS Adventure", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "• Battle through procedurally generated rooms",
    "• Defeat enemies and collect loot",
    "• Beat the boss at the end of each act",
    "• Complete all 3 acts to win!",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move",
    "• Space: Fire weapon",
    "• Shift: Use skill (cooldown)",
    "• Z: Swap weapon",
    "• E: Open shop (when available)",
    "",
    "TIPS:",
    "• Collect scrolls for permanent buffs",
    "• Level up by gaining experience",
    "• Different weapons have unique properties",
    "• Avoid enemy projectiles!"
  ];
  
  let y = 160;
  for (const line of instructions) {
    if (line.startsWith("OBJECTIVE:") || line.startsWith("CONTROLS:") || line.startsWith("TIPS:")) {
      p.fill(255, 200, 50);
      p.textSize(13);
    } else {
      p.fill(200);
      p.textSize(12);
    }
    p.text(line, 50, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(Date.now() / 300) > 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
  
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.background(0, 0, 0, 200);
  
  p.push();
  
  // Title
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("You've conquered all acts!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 100);
    
    p.fill(200);
    p.textSize(18);
    p.text("Better luck next time...", CANVAS_WIDTH / 2, 150);
  }
  
  // Stats
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  
  const stats = [
    `Act Reached: ${gameState.currentAct}`,
    `Rooms Cleared: ${gameState.roomsCleared}`,
    `Enemies Defeated: ${gameState.enemiesKilled}`,
    `Gold Collected: ${gameState.gold}`,
    `Final Score: ${gameState.score}`,
    `Player Level: ${gameState.player ? gameState.player.level : 1}`
  ];
  
  let y = 200;
  for (const stat of stats) {
    p.text(stat, CANVAS_WIDTH / 2, y);
    y += 25;
  }
  
  // Restart prompt
  p.fill(255, 200, 50);
  p.textSize(18);
  const flash = Math.sin(Date.now() / 300) > 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
  
  p.pop();
}

export function drawShopScreen(p) {
  // Semi-transparent overlay
  p.background(0, 0, 0, 200);
  
  p.push();
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("WEAPON SHOP", CANVAS_WIDTH / 2, 40);
  
  // Player gold
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text(`Your Gold: ${gameState.gold}`, CANVAS_WIDTH / 2, 75);
  
  // Shop items
  const startY = 110;
  const itemHeight = 80;
  
  for (let i = 0; i < gameState.shopInventory.length; i++) {
    const weapon = gameState.shopInventory[i];
    const y = startY + i * itemHeight;
    
    // Item background
    const canAfford = gameState.gold >= weapon.price;
    p.fill(canAfford ? [60, 60, 80] : [40, 40, 50]);
    p.stroke(canAfford ? [255, 215, 0] : [100, 100, 100]);
    p.strokeWeight(2);
    p.rect(50, y, CANVAS_WIDTH - 100, itemHeight - 10, 5);
    
    // Key indicator
    p.fill(255, 255, 100);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(20);
    p.text(`[${i + 1}]`, 60, y + 10);
    
    // Weapon info
    p.fill(255);
    p.textSize(18);
    p.text(weapon.getDisplayName(), 100, y + 10);
    
    // Stats
    p.textSize(12);
    p.fill(200);
    p.text(`Damage: ${weapon.damage}  Fire Rate: ${weapon.fireRate}  Mag: ${weapon.magazineSize}`, 100, y + 35);
    
    // Price
    p.textSize(16);
    p.fill(canAfford ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`${weapon.price} Gold`, CANVAS_WIDTH - 60, y + 10);
    
    // Affordability message
    if (!canAfford) {
      p.textSize(11);
      p.fill(200, 100, 100);
      p.text("Cannot afford", CANVAS_WIDTH - 60, y + 35);
    }
  }
  
  // Instructions
  p.fill(200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("Press 1, 2, or 3 to buy a weapon", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  p.text("Press E or ESC to close shop", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

export function drawUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.push();
  
  // Player health bar
  const healthBarWidth = 200;
  const healthBarHeight = 20;
  const healthPercent = player.health / player.maxHealth;
  
  p.fill(50);
  p.noStroke();
  p.rect(10, 10, healthBarWidth, healthBarHeight);
  
  p.fill(healthPercent > 0.5 ? [100, 255, 100] : healthPercent > 0.25 ? [255, 255, 100] : [255, 100, 100]);
  p.rect(10, 10, healthBarWidth * healthPercent, healthBarHeight);
  
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(10, 10, healthBarWidth, healthBarHeight);
  
  // Health text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`${Math.ceil(player.health)} / ${player.maxHealth}`, 10 + healthBarWidth / 2, 20);
  
  // Experience bar
  const expBarWidth = 200;
  const expBarHeight = 8;
  const expPercent = player.exp / player.expToNextLevel;
  
  p.fill(30);
  p.rect(10, 35, expBarWidth, expBarHeight);
  
  p.fill(150, 150, 255);
  p.rect(10, 35, expBarWidth * expPercent, expBarHeight);
  
  // Level
  p.fill(255, 255, 150);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level ${player.level}`, 10, 48);
  
  // Weapon inventory display - ALL WEAPONS
  p.fill(255, 200, 100);
  p.textSize(13);
  p.text("WEAPONS:", 10, 70);
  
  for (let i = 0; i < player.weapons.length; i++) {
    const weapon = player.weapons[i];
    const isEquipped = i === player.currentWeaponIndex;
    const yPos = 88 + i * 35;
    
    // Weapon slot background
    if (isEquipped) {
      p.fill(80, 80, 120);
    } else {
      p.fill(40, 40, 60);
    }
    p.noStroke();
    p.rect(10, yPos, 200, 30, 3);
    
    // Equipped indicator
    if (isEquipped) {
      p.fill(100, 255, 100);
      p.stroke(100, 255, 100);
      p.strokeWeight(2);
      p.noFill();
      p.rect(10, yPos, 200, 30, 3);
    }
    
    // Weapon name
    p.fill(isEquipped ? [255, 255, 100] : [200, 200, 200]);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`[${i + 1}] ${weapon.getDisplayName()}`, 15, yPos + 3);
    
    // Ammo display
    if (weapon.reloading) {
      p.fill(255, 200, 50);
      p.textSize(10);
      p.text("RELOADING...", 15, yPos + 18);
    } else {
      p.fill(150);
      p.textSize(10);
      p.text(`Ammo: ${weapon.ammo}/${weapon.magazineSize}`, 15, yPos + 18);
    }
  }
  
  // Skill cooldown
  const skillY = 70 + player.weapons.length * 35 + 10;
  const skillCooldownPercent = Math.max(0, Math.min(1, 
    (gameState.frameCount - player.lastSkillUse) / player.skillCooldown));
  
  p.fill(50);
  p.rect(10, skillY, 60, 60);
  
  if (player.skillActive) {
    p.fill(255, 255, 100);
  } else if (skillCooldownPercent >= 1) {
    p.fill(100, 255, 100);
  } else {
    p.fill(100);
  }
  p.rect(10, skillY, 60, 60);
  
  // Cooldown overlay
  if (skillCooldownPercent < 1) {
    p.fill(0, 0, 0, 150);
    const coverHeight = 60 * (1 - skillCooldownPercent);
    p.rect(10, skillY, 60, coverHeight);
  }
  
  p.stroke(255);
  p.strokeWeight(2);
  p.noFill();
  p.rect(10, skillY, 60, 60);
  
  // Skill icon
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("⚡", 40, skillY + 30);
  
  p.textSize(10);
  p.text("SHIFT", 40, skillY + 50);
  
  // Stats (right side)
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  
  const rightX = CANVAS_WIDTH - 10;
  p.text(`Act ${gameState.currentAct}`, rightX, 10);
  p.text(`Room ${gameState.currentRoom + 1}`, rightX, 28);
  p.text(`Gold: ${gameState.gold}`, rightX, 46);
  p.text(`Score: ${gameState.score}`, rightX, 64);
  p.text(`Kills: ${gameState.enemiesKilled}`, rightX, 82);
  
  // Shop available indicator
  if (gameState.shopAvailable) {
    p.fill(255, 215, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    const flash = Math.sin(gameState.frameCount * 0.1) > 0;
    if (flash) {
      p.text("SHOP AVAILABLE [E]", rightX, 110);
    }
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", rightX, 140);
  }
  
  p.pop();
}

export function drawRoom(p, room) {
  if (!room) return;
  room.draw(p);
}

export function drawEntities(p) {
  // Draw items first (background)
  for (const item of gameState.items) {
    if (!item.collected) {
      item.draw(p);
    }
  }
  
  // Draw projectiles
  for (const projectile of gameState.projectiles) {
    if (projectile.alive) {
      projectile.draw(p);
    }
  }
  
  // Draw enemies
  for (const enemy of gameState.enemies) {
    if (enemy.alive) {
      enemy.draw(p);
    }
  }
  
  // Draw player last (on top)
  if (gameState.player) {
    gameState.player.draw(p);
  }
}