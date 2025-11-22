// input.js - Input handling

import { gameState, GAME_PHASES, WEAPONS } from './globals.js';
import { fireWeapon } from './weapons.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart
  if (keyCode === 82) {
    resetToStart(p);
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    // SPACE - Fire weapon
    if (keyCode === 32) {
      fireWeapon(300, 200);
    }
    
    // SHIFT - Reset Buddy
    if (keyCode === 16) {
      if (gameState.buddy) {
        gameState.buddy.reset(300, 200);
      }
    }
    
    // Z - Select Hand
    if (keyCode === 90) {
      gameState.activeWeaponIndex = 0;
    }
    
    // Arrow keys - Cycle weapons and outfits
    if (keyCode === 37) { // LEFT
      cycleWeapon(-1);
    }
    if (keyCode === 39) { // RIGHT
      cycleWeapon(1);
    }
    if (keyCode === 38) { // UP
      cycleOutfit(-1);
    }
    if (keyCode === 40) { // DOWN
      cycleOutfit(1);
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.score = 0;
  gameState.currentLevel = 1;
  initializeLevel(p);
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.PLAYING, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.comboMultiplier = 1;
  gameState.usedWeapons.clear();
  
  p.logs.game_info.push({
    data: { gamePhase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function initializeLevel(p) {
  const level = gameState.currentLevel - 1;
  if (level >= 0 && level < 5) {
    const levelData = [
      { targetScore: 1000, timeLimit: 180, gravity: 0.5 },
      { targetScore: 3500, timeLimit: 150, gravity: 0.5 },
      { targetScore: 7000, timeLimit: 180, gravity: 0.1 },
      { targetScore: 12000, timeLimit: 120, gravity: 0.5 },
      { targetScore: 20000, timeLimit: 100, gravity: 0.3 }
    ][level];
    
    gameState.levelTargetScore = levelData.targetScore;
    gameState.levelTimeRemaining = levelData.timeLimit * 60;
    gameState.score = 0;
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.comboMultiplier = 1;
    gameState.usedWeapons.clear();
    gameState.lastActionTime = Date.now();
    gameState.framesSinceAction = 0;
    
    // Unlock weapons based on level
    if (level >= 1) gameState.unlockedWeapons = [0, 1, 2];
    if (level >= 2) gameState.unlockedWeapons = [0, 1, 2, 3];
    if (level >= 3) gameState.unlockedWeapons = [0, 1, 2, 3, 4];
  }
}

function cycleWeapon(direction) {
  const unlocked = gameState.unlockedWeapons;
  const currentIndex = unlocked.indexOf(gameState.activeWeaponIndex);
  let newIndex = (currentIndex + direction + unlocked.length) % unlocked.length;
  gameState.activeWeaponIndex = unlocked[newIndex];
}

function cycleOutfit(direction) {
  const unlocked = gameState.unlockedOutfits;
  const currentIndex = unlocked.indexOf(gameState.currentOutfitIndex);
  let newIndex = (currentIndex + direction + unlocked.length) % unlocked.length;
  gameState.currentOutfitIndex = unlocked[newIndex];
}