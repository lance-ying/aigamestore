// game_logic.js - Core game logic

import { GAME_PHASES, WINS_TO_WIN, PLAYER_DEFAULTS, gameState } from './globals.js';
import { Character } from './character.js';
import { EnemyAI } from './ai.js';
import { generateUpgradeOptions } from './upgrades.js';
import { createExplosion } from './particle.js';
import { logGameInfo } from './input.js';

let enemyAI = null;

export function initGame(p) {
  gameState.player = new Character(150, 200, true);
  gameState.enemy = new Character(450, 200, false);
  gameState.entities = [gameState.player, gameState.enemy];
  enemyAI = new EnemyAI(gameState.enemy, gameState.player);
  
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.playerRoundWins = 0;
  gameState.enemyRoundWins = 0;
  gameState.roundNumber = 1;
  gameState.score = 0;
}

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  logGameInfo(p, { phase: 'PLAYING', round: gameState.roundNumber });
}

export function resetRound() {
  gameState.player.reset();
  gameState.enemy.reset();
  gameState.player.x = 150;
  gameState.player.y = 200;
  gameState.enemy.x = 450;
  gameState.enemy.y = 200;
  gameState.projectiles = [];
  gameState.particles = [];
}

export function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Update characters
  if (gameState.player) {
    gameState.player.update();
  }
  
  if (gameState.enemy) {
    gameState.enemy.update();
    
    // Enemy AI
    const actions = enemyAI.update();
    let dx = 0;
    let dy = 0;
    if (actions.left) dx -= 1;
    if (actions.right) dx += 1;
    if (actions.up) dy -= 1;
    if (actions.down) dy += 1;
    
    if (dx !== 0 || dy !== 0) {
      gameState.enemy.move(dx, dy);
    }
    if (actions.shoot) gameState.enemy.shoot();
    if (actions.shield) gameState.enemy.activateShield();
    if (actions.dash) gameState.enemy.dash();
  }
  
  // Update projectiles
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    gameState.projectiles[i].update();
    if (gameState.projectiles[i].dead) {
      gameState.projectiles.splice(i, 1);
    }
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update();
    if (gameState.particles[i].dead) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Check round end conditions
  if (gameState.player && gameState.player.isDead()) {
    endRound(p, 'enemy');
  } else if (gameState.enemy && gameState.enemy.isDead()) {
    endRound(p, 'player');
  }
}

export function endRound(p, winner) {
  gameState.roundWinner = winner;
  gameState.gamePhase = GAME_PHASES.ROUND_END;
  gameState.roundEndTimer = 120; // 2 seconds
  
  if (winner === 'player') {
    gameState.playerRoundWins++;
    createExplosion(gameState.enemy.x, gameState.enemy.y, [255, 80, 80], 40);
  } else {
    gameState.enemyRoundWins++;
    createExplosion(gameState.player.x, gameState.player.y, [80, 150, 255], 40);
  }
  
  logGameInfo(p, { 
    phase: 'ROUND_END', 
    winner: winner,
    round: gameState.roundNumber,
    playerWins: gameState.playerRoundWins,
    enemyWins: gameState.enemyRoundWins
  });
  
  // Check game over
  if (gameState.playerRoundWins >= WINS_TO_WIN) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    logGameInfo(p, { phase: 'GAME_OVER_WIN' });
  } else if (gameState.enemyRoundWins >= WINS_TO_WIN) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    logGameInfo(p, { phase: 'GAME_OVER_LOSE' });
  }
}

export function updateRoundEnd(p) {
  gameState.roundEndTimer--;
  
  if (gameState.roundEndTimer <= 0) {
    // Check if game is over
    if (gameState.playerRoundWins >= WINS_TO_WIN || 
        gameState.enemyRoundWins >= WINS_TO_WIN) {
      return; // Already handled in endRound
    }
    
    // Otherwise, prepare upgrade selection for loser
    const loser = gameState.roundWinner === 'player' ? 'enemy' : 'player';
    gameState.upgradeOptions = generateUpgradeOptions(3);
    gameState.selectedUpgrade = 0;
    gameState.gamePhase = GAME_PHASES.UPGRADE_SELECT;
    
    logGameInfo(p, { 
      phase: 'UPGRADE_SELECT',
      loser: loser,
      options: gameState.upgradeOptions.map(u => u.name)
    });
  }
}

export function applyUpgradeAndContinue(p) {
  const loser = gameState.roundWinner === 'player' ? gameState.enemy : gameState.player;
  const upgrade = gameState.upgradeOptions[gameState.selectedUpgrade];
  
  loser.applyUpgrade(upgrade);
  
  if (loser === gameState.enemy) {
    enemyAI.increaseDifficulty();
  }
  
  logGameInfo(p, { 
    upgrade_applied: upgrade.name,
    to: gameState.roundWinner === 'player' ? 'enemy' : 'player'
  });
  
  // Start next round
  gameState.roundNumber++;
  resetRound();
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  logGameInfo(p, { 
    phase: 'PLAYING',
    round: gameState.roundNumber
  });
}

export function getEnemyAI() {
  return enemyAI;
}