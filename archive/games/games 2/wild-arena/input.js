// input.js - Input handling for human and test modes

import { gameState, GAME_PHASE } from './globals.js';

export function getPlayerInputs(p) {
  if (gameState.controlMode === 'HUMAN') {
    // Return current tap states and clear them
    const taps = { ...gameState.keyTaps };
    
    // Clear all taps after reading (single-tap behavior)
    gameState.keyTaps = {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      ability: false,
      weapon1: false,
      weapon2: false,
      weapon3: false
    };
    
    return taps;
  } else {
    // Test mode inputs
    if (gameState.testModeActions.length > 0) {
      return gameState.testModeActions[0];
    }
    return {
      up: false,
      down: false,
      left: false,
      right: false,
      fire: false,
      ability: false,
      weapon1: false,
      weapon2: false,
      weapon3: false
    };
  }
}

export function generateTestActions(p) {
  const actions = [];
  const frameCount = p.frameCount;
  
  if (gameState.controlMode === 'TEST_1') {
    // Basic movement test - trigger taps periodically
    actions.push({
      up: frameCount % 20 === 0,
      down: frameCount % 20 === 10,
      left: frameCount % 30 === 0,
      right: frameCount % 30 === 15,
      fire: frameCount % 15 === 0,
      ability: frameCount % 180 === 0,
      weapon1: false,
      weapon2: false,
      weapon3: false
    });
  } else if (gameState.controlMode === 'TEST_2') {
    // Aggressive winning strategy
    const enemies = gameState.entities.filter(e => e.constructor.name === 'Enemy' && e.active);
    
    if (enemies.length > 0 && gameState.player) {
      const nearestEnemy = enemies.reduce((nearest, enemy) => {
        const dist = p.dist(gameState.player.x, gameState.player.y, enemy.x, enemy.y);
        const nearestDist = p.dist(gameState.player.x, gameState.player.y, nearest.x, nearest.y);
        return dist < nearestDist ? enemy : nearest;
      }, enemies[0]);
      
      const dx = nearestEnemy.x - gameState.player.x;
      const dy = nearestEnemy.y - gameState.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Tap movement every few frames to approach enemy
      const shouldMove = frameCount % 8 === 0;
      
      actions.push({
        up: shouldMove && dy < -20,
        down: shouldMove && dy > 20,
        left: shouldMove && dx < -20,
        right: shouldMove && dx > 20,
        fire: frameCount % 10 === 0 && dist < 200,
        ability: dist < 100 && gameState.player.ability.cooldown === 0,
        weapon1: frameCount % 300 === 0,
        weapon2: frameCount % 300 === 100,
        weapon3: frameCount % 300 === 200
      });
    } else {
      actions.push({
        up: false,
        down: false,
        left: false,
        right: false,
        fire: false,
        ability: false,
        weapon1: false,
        weapon2: false,
        weapon3: false
      });
    }
  }
  
  return actions;
}