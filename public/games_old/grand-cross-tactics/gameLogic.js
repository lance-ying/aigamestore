// gameLogic.js - Core game logic and state management
import { gameState, GAME_PHASES, TURN_PHASES, LEVEL_CONFIGS, CARD_TYPES } from './globals.js';
import { Player, Enemy } from './entities.js';
import { drawHand } from './cards.js';
import { DamageNumber, AttackAnimation } from './animations.js';

export function initLevel(p, levelNum) {
  const config = LEVEL_CONFIGS[levelNum - 1];
  if (!config) return false;

  // Initialize player
  gameState.player = new Player(p, config.playerHP, config.playerAP);
  gameState.entities = [gameState.player];

  // Initialize enemies
  gameState.enemies = [];
  for (const enemyConfig of config.enemies) {
    const enemy = new Enemy(p, enemyConfig.type, enemyConfig.hp, enemyConfig.damage, enemyConfig.x, enemyConfig.y);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }

  // Setup hand
  gameState.hand = drawHand(p, config.deck);
  gameState.selectedCardIndex = 0;
  gameState.currentTurnPhase = TURN_PHASES.PLAYER;
  gameState.enemyTurnIndex = 0;
  gameState.enemyTurnDelay = 0;
  gameState.turnAnimations = [];
  gameState.damageNumbers = [];

  return true;
}

export function playCard(p, cardIndex) {
  if (gameState.currentTurnPhase !== TURN_PHASES.PLAYER) return;
  if (cardIndex < 0 || cardIndex >= gameState.hand.length) return;

  const card = gameState.hand[cardIndex];
  const player = gameState.player;

  if (player.currentAP < card.cost) return;

  // Pay cost
  player.currentAP -= card.cost;

  // Apply effect
  if (card.effect === 'DAMAGE') {
    const target = getRandomAliveEnemy();
    if (target) {
      const damage = card.value + player.getDamageBonus();
      const actualDamage = target.takeDamage(damage);
      gameState.turnAnimations.push(new AttackAnimation(p, player.x, player.y, target.x, target.y));
      gameState.damageNumbers.push(new DamageNumber(p, target.x, target.y, actualDamage, false));
      
      if (target.isDead()) {
        gameState.totalScore += 50;
      }
    }
  } else if (card.effect === 'AOE_DAMAGE') {
    const damage = card.value + player.getDamageBonus();
    for (const enemy of gameState.enemies) {
      if (!enemy.isDead()) {
        const actualDamage = enemy.takeDamage(damage);
        gameState.turnAnimations.push(new AttackAnimation(p, player.x, player.y, enemy.x, enemy.y));
        gameState.damageNumbers.push(new DamageNumber(p, enemy.x, enemy.y, actualDamage, false));
        
        if (enemy.isDead()) {
          gameState.totalScore += 50;
        }
      }
    }
  } else if (card.effect === 'BLOCK') {
    player.blockValue += card.value;
  } else if (card.effect === 'HEAL') {
    const actualHeal = player.heal(card.value);
    gameState.damageNumbers.push(new DamageNumber(p, player.x, player.y, actualHeal, true));
  } else if (card.effect === 'BUFF_DAMAGE') {
    player.addBuff('DAMAGE_BOOST', card.duration, card.value);
  }

  // Remove card from hand
  gameState.hand.splice(cardIndex, 1);
  if (gameState.selectedCardIndex >= gameState.hand.length) {
    gameState.selectedCardIndex = Math.max(0, gameState.hand.length - 1);
  }

  // Check for level cleared
  checkLevelCleared();
}

export function endPlayerTurn(p) {
  if (gameState.currentTurnPhase !== TURN_PHASES.PLAYER) return;

  gameState.currentTurnPhase = TURN_PHASES.ENEMY;
  gameState.enemyTurnIndex = 0;
  gameState.enemyTurnDelay = 30; // frames to wait between enemy actions
}

export function updateEnemyTurn(p) {
  if (gameState.currentTurnPhase !== TURN_PHASES.ENEMY) return;

  if (gameState.enemyTurnDelay > 0) {
    gameState.enemyTurnDelay--;
    return;
  }

  const aliveEnemies = gameState.enemies.filter(e => !e.isDead());
  
  if (gameState.enemyTurnIndex >= aliveEnemies.length) {
    // End enemy turn, start player turn
    startPlayerTurn(p);
    return;
  }

  const enemy = aliveEnemies[gameState.enemyTurnIndex];
  const action = enemy.getAction(gameState.player, gameState);

  executeEnemyAction(p, enemy, action);

  gameState.enemyTurnIndex++;
  gameState.enemyTurnDelay = 30;

  // Check game over
  if (gameState.player.currentHP <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.GAME_OVER_LOSE },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function executeEnemyAction(p, enemy, action) {
  if (action.type === 'ATTACK') {
    const damage = action.damage;
    const actualDamage = gameState.player.takeDamage(damage);
    gameState.turnAnimations.push(new AttackAnimation(p, enemy.x, enemy.y, gameState.player.x, gameState.player.y));
    gameState.damageNumbers.push(new DamageNumber(p, gameState.player.x, gameState.player.y, actualDamage, false));
  } else if (action.type === 'DOUBLE_ATTACK') {
    for (let i = 0; i < 2; i++) {
      const actualDamage = gameState.player.takeDamage(action.damage);
      gameState.turnAnimations.push(new AttackAnimation(p, enemy.x, enemy.y, gameState.player.x, gameState.player.y));
      gameState.damageNumbers.push(new DamageNumber(p, gameState.player.x, gameState.player.y, actualDamage, false));
    }
  } else if (action.type === 'WEAKEN_ATTACK') {
    const actualDamage = gameState.player.takeDamage(action.damage);
    gameState.turnAnimations.push(new AttackAnimation(p, enemy.x, enemy.y, gameState.player.x, gameState.player.y));
    gameState.damageNumbers.push(new DamageNumber(p, gameState.player.x, gameState.player.y, actualDamage, false));
    // Note: Weaken debuff would be applied to player, simplifying here
  } else if (action.type === 'SELF_HEAL') {
    enemy.currentHP = Math.min(enemy.maxHP, enemy.currentHP + action.value);
    gameState.damageNumbers.push(new DamageNumber(p, enemy.x, enemy.y, action.value, true));
  } else if (action.type === 'SUMMON') {
    const newEnemy = new Enemy(p, 'GRUNT', 50, 7, 450, 350);
    gameState.enemies.push(newEnemy);
    gameState.entities.push(newEnemy);
  }

  enemy.updateBuffs();
}

function startPlayerTurn(p) {
  gameState.currentTurnPhase = TURN_PHASES.PLAYER;
  gameState.player.resetTurn();
  
  const config = LEVEL_CONFIGS[gameState.currentLevel - 1];
  gameState.hand = drawHand(p, config.deck);
  gameState.selectedCardIndex = 0;
}

function checkLevelCleared() {
  const allDead = gameState.enemies.every(e => e.isDead());
  
  if (allDead) {
    // Add score bonuses
    gameState.totalScore += 100; // Level completion
    gameState.totalScore += gameState.player.currentHP; // HP bonus
    
    if (gameState.currentLevel >= 5) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      gameState.currentTurnPhase = TURN_PHASES.LEVEL_CLEARED;
    }
  }
}

function getRandomAliveEnemy() {
  const alive = gameState.enemies.filter(e => !e.isDead());
  if (alive.length === 0) return null;
  return alive[Math.floor(Math.random() * alive.length)];
}

export function advanceLevel(p) {
  gameState.currentLevel++;
  const success = initLevel(p, gameState.currentLevel);
  
  if (!success) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    gameState.gamePhase = GAME_PHASES.PLAYING;
  }
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p) {
  gameState.currentLevel = 1;
  gameState.totalScore = 0;
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentTurnPhase = TURN_PHASES.PLAYER;
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.hand = [];
  gameState.selectedCardIndex = 0;
  gameState.turnAnimations = [];
  gameState.damageNumbers = [];
  gameState.framesSincePhaseChange = 0;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}