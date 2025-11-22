// input.js - Input handling

import { gameState, GAME_PHASE, WEAPONS } from './globals.js';
import { triggerEvent } from './events.js';
import { GameMap } from './map.js';
import { Player, Projectile } from './player.js';
import { createRandomEnemy } from './enemy.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Global controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASE.START) {
      startGame(p);
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      gameState.gamePhase = GAME_PHASE.PAUSED;
      logGameInfo(p, 'Paused');
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      logGameInfo(p, 'Resumed');
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      resetToStart(p);
    }
  }

  // Playing controls
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    handlePlayingInput(p);
  }
}

function handlePlayingInput(p) {
  const player = gameState.player;
  const map = gameState.currentMap;
  
  if (!player || !map) return;
  
  // Toggle shop with S key
  if (p.keyCode === 83) { // S
    gameState.shopOpen = !gameState.shopOpen;
    return;
  }
  
  // Handle shop interactions
  if (gameState.shopOpen) {
    handleShopInput(p);
    return;
  }
  
  // Heal with gold (H key)
  if (p.keyCode === 72) { // H
    const healCost = 100;
    const healAmount = 25;
    if (gameState.score >= healCost && player.hp < player.maxHP) {
      gameState.score -= healCost;
      player.heal(healAmount);
      gameState.eventMessage = `Healed ${healAmount} HP for ${healCost} gold!`;
      gameState.eventMessageTimer = gameState.eventMessageDuration;
    } else if (gameState.score < healCost) {
      gameState.eventMessage = `Not enough gold! Need ${healCost} gold to heal.`;
      gameState.eventMessageTimer = 60;
    } else if (player.hp >= player.maxHP) {
      gameState.eventMessage = `Already at full health!`;
      gameState.eventMessageTimer = 60;
    }
  }
  
  // Shoot with SPACE
  if (p.keyCode === 32) { // SPACE
    player.shoot(gameState.projectiles);
  }
  
  // Movement (no longer triggers enemy turns - enemies move continuously now)
  let moved = false;
  let newX = player.gridX;
  let newY = player.gridY;
  
  // Arrow keys or WASD
  if (p.keyCode === 37 || p.keyCode === 65) { // LEFT or A
    newX--;
    moved = true;
  } else if (p.keyCode === 39 || p.keyCode === 68) { // RIGHT or D
    newX++;
    moved = true;
  } else if (p.keyCode === 38 || p.keyCode === 87) { // UP or W
    newY--;
    moved = true;
  } else if (p.keyCode === 40 || p.keyCode === 83) { // DOWN or S
    newY++;
    moved = true;
  }
  
  if (moved && player.canMoveTo(newX, newY, map)) {
    player.moveTo(newX, newY, map);
    logPlayerInfo(p);
    checkTileInteraction(p);
  }
  
  // Interaction with E key
  if (p.keyCode === 69) { // E
    const tile = map.getTileAt(player.gridX, player.gridY);
    if (tile && (map.isEventTile(tile.type) || tile.type === 'EXIT')) {
      // Check if trying to exit with enemies alive
      if (tile.type === 'EXIT') {
        const activeEnemies = gameState.enemies.filter(e => e.active).length;
        if (activeEnemies > 0) {
          gameState.eventMessage = `Cannot exit! ${activeEnemies} enemies remaining!`;
          gameState.eventMessageTimer = gameState.eventMessageDuration;
          return;
        }
      }
      
      if (!tile.interacted || tile.type === 'EXIT') {
        const message = triggerEvent(tile, gameState.currentLevel, p);
        gameState.eventMessage = message;
        gameState.eventMessageTimer = gameState.eventMessageDuration;
        gameState.needsInteraction = false;
        
        // Check if exit was triggered
        if (tile.type === 'EXIT') {
          handleLevelComplete(p);
        }
      }
    }
  }
}

function handleShopInput(p) {
  // Number keys 1-5 to buy weapons
  const weaponKeys = {
    49: "PISTOL",   // 1
    50: "SWORD",    // 2
    51: "SHOTGUN",  // 3
    52: "RIFLE",    // 4
    53: "LASER"     // 5
  };
  
  const weaponKey = weaponKeys[p.keyCode];
  if (weaponKey) {
    const weapon = WEAPONS[weaponKey];
    
    // Check if already owned
    if (gameState.ownedWeapons.includes(weaponKey)) {
      // Select this weapon
      gameState.currentWeapon = weaponKey;
      gameState.eventMessage = `Equipped ${weapon.name}!`;
      gameState.eventMessageTimer = 60;
    } else {
      // Try to buy
      if (gameState.score >= weapon.cost) {
        gameState.score -= weapon.cost;
        gameState.ownedWeapons.push(weaponKey);
        gameState.currentWeapon = weaponKey;
        gameState.eventMessage = `Purchased ${weapon.name}!`;
        gameState.eventMessageTimer = 90;
      } else {
        gameState.eventMessage = `Not enough gold! Need ${weapon.cost} gold.`;
        gameState.eventMessageTimer = 60;
      }
    }
  }
}

function checkTileInteraction(p) {
  const player = gameState.player;
  const map = gameState.currentMap;
  const tile = map.getTileAt(player.gridX, player.gridY);
  
  if (tile && (map.isEventTile(tile.type) || tile.type === 'EXIT')) {
    if (!tile.interacted || tile.type === 'EXIT') {
      gameState.needsInteraction = true;
    } else {
      gameState.needsInteraction = false;
    }
  } else {
    gameState.needsInteraction = false;
  }
}

function handleLevelComplete(p) {
  if (gameState.currentLevel >= gameState.maxLevel) {
    // Win!
    updateHighScore();
    gameState.gamePhase = GAME_PHASE.GAME_OVER_WIN;
    logGameInfo(p, 'Win');
  } else {
    // Next level
    gameState.currentLevel++;
    gameState.gamePhase = GAME_PHASE.LEVEL_TRANSITION;
    gameState.levelTransitionTimer = gameState.levelTransitionDuration;
    logGameInfo(p, `Level ${gameState.currentLevel - 1} Complete`);
  }
}

function startGame(p) {
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.luck = 50;
  gameState.eventMessage = "";
  gameState.eventMessageTimer = 0;
  gameState.needsInteraction = false;
  gameState.weaponPower = 1;
  gameState.projectiles = [];
  gameState.currentWeapon = "PISTOL";
  gameState.ownedWeapons = ["PISTOL"];
  gameState.shopOpen = false;
  
  // Create map
  gameState.currentMap = new GameMap(1);
  
  // Create player
  const startHP = 100;
  gameState.player = new Player(
    gameState.currentMap.startX,
    gameState.currentMap.startY,
    startHP
  );
  
  // Create enemies with variety
  gameState.enemies = [];
  if (gameState.currentMap.enemySpawns) {
    gameState.currentMap.enemySpawns.forEach(spawn => {
      gameState.enemies.push(createRandomEnemy(spawn.x, spawn.y, 1));
    });
  }
  
  gameState.entities = [gameState.player];
  
  // Update phase BEFORE logging
  gameState.gamePhase = GAME_PHASE.PLAYING;
  
  logGameInfo(p, 'Game Started');
  logPlayerInfo(p);
}

function resetToStart(p) {
  gameState.gamePhase = GAME_PHASE.START;
  gameState.player = null;
  gameState.currentMap = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.shopOpen = false;
  logGameInfo(p, 'Reset to Start');
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    try {
      localStorage.setItem('adventureStarHighScore', gameState.highScore.toString());
    } catch (e) {
      console.log('Could not save high score');
    }
  }
}

function logGameInfo(p, data) {
  p.logs.game_info.push({
    data: data,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.getScreenX(),
      screen_y: gameState.player.getScreenY(),
      game_x: gameState.player.gridX,
      game_y: gameState.player.gridY,
      framecount: p.frameCount
    });
  }
}