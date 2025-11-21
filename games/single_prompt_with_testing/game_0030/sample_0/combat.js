// combat.js - Combat and shooting mechanics

import { gameState } from './globals.js';
import { VisualEffect } from './entities.js';
import { getShipAtPosition } from './shipPlacement.js';
import { getAITarget, handleAIHit } from './ai.js';

export function fireShot(x, y, p, isPlayerTurn) {
  const targetShips = isPlayerTurn ? gameState.aiShips : gameState.playerShips;
  const targetGrid = isPlayerTurn ? gameState.aiGrid : gameState.playerGrid;
  
  // Check if already targeted
  if (targetGrid.isTargeted(x, y)) {
    return { hit: false, alreadyTargeted: true };
  }
  
  // Check for hit
  let hit = false;
  let sunkShip = null;
  
  for (let ship of targetShips) {
    if (ship.checkHit(x, y)) {
      hit = true;
      targetGrid.markHit(x, y);
      gameState.effects.push(new VisualEffect(x, y, 'explosion', 20));
      
      if (ship.sunk) {
        sunkShip = ship;
      }
      
      break;
    }
  }
  
  if (!hit) {
    targetGrid.markMiss(x, y);
    gameState.effects.push(new VisualEffect(x, y, 'splash', 15));
  }
  
  // Log the shot
  p.logs.game_info.push({
    data: { 
      action: 'shot_fired', 
      player: isPlayerTurn ? 'player' : 'ai',
      x, y, hit, 
      sunk: sunkShip ? sunkShip.name : null 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  return { hit, sunk: sunkShip, alreadyTargeted: false };
}

export function executePlayerTurn(p) {
  const result = fireShot(gameState.cursorX, gameState.cursorY, p, true);
  
  if (!result.alreadyTargeted) {
    if (result.sunk) {
      gameState.score += 100;
    } else if (result.hit) {
      gameState.score += 20;
    }
    
    // Check win condition
    if (gameState.aiShips.every(ship => ship.sunk)) {
      gameState.gamePhase = "GAME_OVER_WIN";
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    endTurn();
  }
}

export function executeAITurn(p) {
  const target = getAITarget();
  
  if (target) {
    const result = fireShot(target.x, target.y, p, false);
    handleAIHit(target.x, target.y, result.hit);
    
    // Check lose condition
    if (gameState.playerShips.every(ship => ship.sunk)) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    endTurn();
  }
}

function endTurn() {
  gameState.turnNumber++;
  gameState.isPlayerTurn = !gameState.isPlayerTurn;
  
  if (gameState.isPlayerTurn) {
    // Generate resources for player
    gameState.playerResources = Math.min(gameState.playerResources + 1, 10);
  }
}