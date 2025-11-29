// systems.js - Game systems management

import { SYSTEM_AUDIO, SYSTEM_CAMERA, SYSTEM_VENTILATION } from './globals.js';
import { Phantom } from './entities.js';

export function updateSystems(p, gameState) {
  // Update system cooldowns
  if (gameState.systems.audio.cooldown > 0) {
    gameState.systems.audio.cooldown--;
  }
  if (gameState.systems.camera.cooldown > 0) {
    gameState.systems.camera.cooldown--;
  }
  if (gameState.systems.ventilation.cooldown > 0) {
    gameState.systems.ventilation.cooldown--;
  }
  
  // Update vent cooldowns
  if (gameState.vents.left.cooldown > 0) {
    gameState.vents.left.cooldown--;
  }
  if (gameState.vents.right.cooldown > 0) {
    gameState.vents.right.cooldown--;
  }
  
  // Update reboot progress
  if (gameState.rebootingSystem) {
    gameState.rebootProgress++;
    
    if (gameState.rebootProgress >= 120) { // 2 seconds to reboot
      // System rebooted
      gameState.systems[gameState.rebootingSystem].working = true;
      gameState.systems[gameState.rebootingSystem].cooldown = 0;
      gameState.rebootingSystem = null;
      gameState.rebootProgress = 0;
    }
  }
  
  // Phantom timer and appearances
  gameState.phantomTimer++;
  
  const phantomChance = 0.001 + (gameState.currentNight * 0.0005);
  
  if (!gameState.phantomActive && gameState.phantomTimer > 300 && p.random() < phantomChance) {
    triggerPhantom(p, gameState);
  }
}

export function triggerPhantom(p, gameState) {
  // Choose random system to break
  const systems = [SYSTEM_AUDIO, SYSTEM_CAMERA, SYSTEM_VENTILATION];
  const systemToBreak = systems[Math.floor(p.random() * systems.length)];
  
  // Break the system
  if (systemToBreak === SYSTEM_AUDIO) {
    gameState.systems.audio.working = false;
  } else if (systemToBreak === SYSTEM_CAMERA) {
    gameState.systems.camera.working = false;
  } else if (systemToBreak === SYSTEM_VENTILATION) {
    gameState.systems.ventilation.working = false;
  }
  
  gameState.phantomActive = true;
  gameState.phantomTimer = 0;
  
  // Create phantom entity for visual effect
  const phantom = new Phantom(systemToBreak);
  gameState.entities.push(phantom);
  
  // Clear phantom after delay
  setTimeout(() => {
    gameState.phantomActive = false;
    const index = gameState.entities.indexOf(phantom);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
  }, 2000);
}

export function useAudioLure(gameState, targetCamera) {
  if (gameState.systems.audio.working && gameState.systems.audio.cooldown === 0) {
    gameState.springtrap.lureAway(targetCamera);
    gameState.systems.audio.cooldown = 180; // 3 second cooldown
    gameState.audioLureUsed++;
    return true;
  }
  return false;
}

export function sealVent(gameState, ventSide) {
  const vent = ventSide === 'left' ? gameState.vents.left : gameState.vents.right;
  
  if (vent.cooldown === 0) {
    vent.sealed = true;
    vent.cooldown = 300; // 5 seconds sealed
    gameState.ventSealsUsed++;
    return true;
  }
  return false;
}

export function startReboot(gameState, systemType) {
  if (!gameState.rebootingSystem) {
    gameState.rebootingSystem = systemType;
    gameState.rebootProgress = 0;
    return true;
  }
  return false;
}