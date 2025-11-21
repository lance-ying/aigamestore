// input.js - Input handling for human and test modes

import { gameState, GAME_PHASE } from './globals.js';

export function getPlayerInputs(p) {
  if (gameState.controlMode === 'HUMAN') {
    return {
      up: p.keyIsDown(38),
      down: p.keyIsDown(40),
      left: p.keyIsDown(37),
      right: p.keyIsDown(39),
      fire: p.keyIsDown(32),
      ability: p.keyIsDown(16)
    };
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
      ability: false
    };
  }
}

export function generateTestActions(p) {
  const actions = [];
  const frameCount = p.frameCount;
  
  if (gameState.controlMode === 'TEST_1') {
    // Basic movement test
    actions.push({
      up: frameCount % 60 < 30,
      down: false,
      left: frameCount % 120 < 60,
      right: frameCount % 120 >= 60,
      fire: frameCount % 20 === 0,
      ability: frameCount % 180 === 0
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
      
      actions.push({
        up: dy < -20,
        down: dy > 20,
        left: dx < -20,
        right: dx > 20,
        fire: dist < 200,
        ability: dist < 100 && gameState.player.ability.cooldown === 0
      });
    } else {
      actions.push({
        up: false,
        down: false,
        left: false,
        right: false,
        fire: false,
        ability: false
      });
    }
  }
  
  return actions;
}