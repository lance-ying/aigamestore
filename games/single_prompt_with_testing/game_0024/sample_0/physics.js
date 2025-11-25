// physics.js - Physics and collision handling

import { Wall, Door } from './entities.js';
import { gameState } from './globals.js';

export function handlePlayerMovement(player, vx, vy) {
  // Store original position
  const originalX = player.x;
  const originalY = player.y;
  
  // Try to move
  player.x += vx;
  player.y += vy;
  
  // Check collisions with walls
  for (const entity of gameState.entities) {
    if (entity instanceof Wall) {
      if (entity.collidesWith(player.x, player.y, player.width, player.height)) {
        player.x = originalX;
        player.y = originalY;
        return false;
      }
    }
  }
  
  // Check collisions with doors
  for (const door of gameState.doors) {
    if (door.blocksPlayer(player)) {
      player.x = originalX;
      player.y = originalY;
      return false;
    }
  }
  
  // Keep player in bounds
  const halfWidth = player.width / 2;
  const halfHeight = player.height / 2;
  player.x = Math.max(20 + halfWidth, Math.min(600 - 20 - halfWidth, player.x));
  player.y = Math.max(20 + halfHeight, Math.min(400 - 20 - halfHeight, player.y));
  
  return true;
}

export function checkSwitchInteraction(player) {
  for (const sw of gameState.switches) {
    if (sw.canInteract(player)) {
      return sw;
    }
  }
  return null;
}

export function checkLightbulbPickup(player) {
  if (gameState.lightbulb && gameState.lightbulb.canPickup(player)) {
    return gameState.lightbulb;
  }
  return null;
}

export function checkSunChamberInteraction(player) {
  if (gameState.sunChamber && gameState.sunChamber.canActivate(player)) {
    return gameState.sunChamber;
  }
  return null;
}