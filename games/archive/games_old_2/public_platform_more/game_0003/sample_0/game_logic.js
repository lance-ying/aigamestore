// game_logic.js - Core game logic and state management

import {
  gameState,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  ROUND_WIN_REQUIREMENT,
  WEAPON_UPGRADE_COST,
  ARMOR_UPGRADE_COST,
  MAGIC_UPGRADE_COST,
  TOTAL_PROVINCES
} from './globals.js';
import { Player } from './player.js';
import { EnemyAI } from './enemy_ai.js';

export function initializeGame(p) {
  gameState.player = new Player(150, 320, true);
  gameState.enemy = null;
  gameState.entities = [gameState.player];
  gameState.score = 0;
  gameState.coins = 0;
  gameState.gems = 0;
  gameState.currentProvince = 1;
  gameState.currentRound = 1;
  gameState.playerRoundsWon = 0;
  gameState.enemyRoundsWon = 0;
  gameState.roundInProgress = false;
  gameState.roundTimer = 0;
  gameState.weapons = 0;
  gameState.armor = 0;
  gameState.magic = 0;
  gameState.showUpgradeMenu = false;
  gameState.enemiesDefeated = 0;
  gameState.comboCounter = 0;
  gameState.lastHitTime = 0;
}

export function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  startNewRound(p);
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, province: gameState.currentProvince },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function startNewRound(p) {
  gameState.currentRound = gameState.playerRoundsWon + gameState.enemyRoundsWon + 1;
  gameState.roundInProgress = true;
  gameState.roundTimer = 0;
  gameState.comboCounter = 0;
  
  // Reset player
  gameState.player.x = 150;
  gameState.player.y = 320;
  gameState.player.reset();
  
  // Create new enemy with scaling difficulty
  const difficulty = gameState.currentProvince;
  gameState.enemy = new Player(450, 320, false);
  gameState.enemy.damage = 1.0 + difficulty * 0.15;
  gameState.enemy.defense = 1.0 + difficulty * 0.1;
  gameState.enemy.maxHealth = 100 + difficulty * 10;
  gameState.enemy.health = gameState.enemy.maxHealth;
  
  // Apply player upgrades
  gameState.player.damage = 1.0 + gameState.weapons * 0.2;
  gameState.player.defense = 1.0 + gameState.armor * 0.15;
  gameState.player.speed = 1.0 + gameState.magic * 0.1;
  
  gameState.enemyAI = new EnemyAI(gameState.enemy, difficulty);
  
  gameState.entities = [gameState.player, gameState.enemy];
}

export function checkRoundEnd(p) {
  if (!gameState.roundInProgress) return;
  
  if (gameState.player.health <= 0) {
    gameState.enemyRoundsWon++;
    gameState.roundInProgress = false;
    gameState.roundTimer = 120; // Delay before next round
    
    if (gameState.enemyRoundsWon >= ROUND_WIN_REQUIREMENT) {
      // Player lost the match
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (gameState.enemy.health <= 0) {
    gameState.playerRoundsWon++;
    gameState.roundInProgress = false;
    gameState.roundTimer = 120;
    
    // Award coins
    const coinsEarned = 20 + gameState.currentProvince * 5;
    gameState.coins += coinsEarned;
    gameState.score += 100;
    
    if (gameState.playerRoundsWon >= ROUND_WIN_REQUIREMENT) {
      // Player won the match
      gameState.enemiesDefeated++;
      gameState.score += 500;
      
      if (gameState.currentProvince >= TOTAL_PROVINCES) {
        // Won the entire game!
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_WIN },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Show upgrade menu and advance to next province
        gameState.showUpgradeMenu = true;
      }
    }
  }
}

export function advanceToNextProvince(p) {
  gameState.currentProvince++;
  gameState.currentRound = 1;
  gameState.playerRoundsWon = 0;
  gameState.enemyRoundsWon = 0;
  gameState.showUpgradeMenu = false;
  startNewRound(p);
}

export function purchaseUpgrade(type) {
  let cost, current;
  
  switch (type) {
    case 'weapon':
      cost = WEAPON_UPGRADE_COST;
      current = gameState.weapons;
      break;
    case 'armor':
      cost = ARMOR_UPGRADE_COST;
      current = gameState.armor;
      break;
    case 'magic':
      cost = MAGIC_UPGRADE_COST;
      current = gameState.magic;
      break;
    default:
      return false;
  }
  
  if (gameState.coins >= cost) {
    gameState.coins -= cost;
    
    switch (type) {
      case 'weapon': gameState.weapons++; break;
      case 'armor': gameState.armor++; break;
      case 'magic': gameState.magic++; break;
    }
    
    return true;
  }
  
  return false;
}

export function resetGame(p) {
  gameState.gamePhase = PHASE_START;
  initializeGame(p);
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}