// combat.js - Combat logic and execution
import { gameState, CARD_TYPES } from './globals.js';
import { Enemy } from './entities.js';

export function startNewEncounter(p) {
  gameState.enemies = [];
  gameState.currentEncounter++;
  
  const numEnemies = Math.min(2 + Math.floor(gameState.currentEncounter / 2), 3);
  const enemyTypes = ["GOBLIN", "ROBOT", "DEMON"];
  
  for (let i = 0; i < numEnemies; i++) {
    const type = enemyTypes[Math.floor(p.random() * enemyTypes.length)];
    const x = 400 + i * 70;
    const y = 150 + (i % 2) * 40;
    const enemy = new Enemy(`${type} ${i + 1}`, type, x, y, gameState.currentEncounter);
    gameState.enemies.push(enemy);
    enemy.decideIntent(p);
  }
  
  gameState.turnPhase = "SELECT_CARDS";
  gameState.selectedCards = [];
  gameState.selectedHandIndex = 0;
}

export function executePlayerTurn(p) {
  gameState.turnPhase = "EXECUTING";
  
  // Execute selected cards
  for (const card of gameState.selectedCards) {
    executeCard(card, p);
  }
  
  // Discard played cards
  gameState.discardPile.push(...gameState.selectedCards);
  gameState.hand = gameState.hand.filter(c => !gameState.selectedCards.includes(c));
  gameState.selectedCards = [];
  
  // Check if enemies defeated
  gameState.enemies = gameState.enemies.filter(e => e.isAlive());
  
  if (gameState.enemies.length === 0) {
    // Battle won
    endBattle(true, p);
    return;
  }
  
  // Enemy turn
  setTimeout(() => executeEnemyTurn(p), 500);
}

function executeCard(card, p) {
  if (card.type === CARD_TYPES.ATTACK || card.damage > 0) {
    // Find target (weakest enemy)
    let target = null;
    let minHealth = Infinity;
    for (const enemy of gameState.enemies) {
      if (enemy.health < minHealth) {
        minHealth = enemy.health;
        target = enemy;
      }
    }
    
    if (target) {
      const damage = card.getDisplayDamage();
      if (card.special === "AOE") {
        // Hit all enemies
        for (const enemy of gameState.enemies) {
          enemy.takeDamage(damage);
          enemy.animOffsetX = -15;
        }
      } else {
        target.takeDamage(damage);
        target.animOffsetX = -15;
      }
    }
  }
  
  if (card.type === CARD_TYPES.DEFEND || card.defense > 0) {
    // Apply defense to weakest hero
    let weakestHero = null;
    let minHealth = Infinity;
    for (const hero of gameState.heroes) {
      if (hero.isAlive() && hero.health < minHealth) {
        minHealth = hero.health;
        weakestHero = hero;
      }
    }
    if (weakestHero) {
      weakestHero.animOffsetY = -10;
    }
  }
  
  if (card.special === "HEAL") {
    // Heal weakest hero
    let weakestHero = null;
    let minHealth = Infinity;
    for (const hero of gameState.heroes) {
      if (hero.isAlive() && hero.health < minHealth) {
        minHealth = hero.health;
        weakestHero = hero;
      }
    }
    if (weakestHero) {
      weakestHero.heal(15);
    }
  }
  
  if (card.special === "DRAW") {
    // Draw extra card
    const { drawCards } = require('./cards.js');
    drawCards(gameState.deck, gameState.hand, gameState.discardPile, 1);
  }
}

export function executeEnemyTurn(p) {
  gameState.turnPhase = "ENEMY_TURN";
  
  for (const enemy of gameState.enemies) {
    if (!enemy.isAlive()) continue;
    
    if (enemy.intentDefend) {
      // Enemy defends (no action needed for visual)
      enemy.animOffsetY = -10;
    } else {
      // Enemy attacks random alive hero
      const aliveHeroes = gameState.heroes.filter(h => h.isAlive());
      if (aliveHeroes.length > 0) {
        const target = aliveHeroes[Math.floor(p.random() * aliveHeroes.length)];
        target.takeDamage(enemy.intentDamage);
        target.animOffsetX = 15;
        enemy.animOffsetX = 10;
      }
    }
    
    // Set new intent
    enemy.decideIntent(p);
  }
  
  // Check if all heroes dead
  const aliveHeroes = gameState.heroes.filter(h => h.isAlive());
  if (aliveHeroes.length === 0) {
    endBattle(false, p);
    return;
  }
  
  // Draw new cards and start new turn
  setTimeout(() => {
    const { drawCards } = require('./cards.js');
    drawCards(gameState.deck, gameState.hand, gameState.discardPile, 3);
    gameState.turnPhase = "SELECT_CARDS";
    gameState.selectedHandIndex = 0;
  }, 800);
}

function endBattle(won, p) {
  if (won) {
    // Reward experience and gold
    const expGain = 50 + gameState.currentEncounter * 20;
    const goldGain = 40 + gameState.currentEncounter * 10;
    
    for (const hero of gameState.heroes) {
      if (hero.isAlive()) {
        hero.gainExperience(expGain);
      }
    }
    
    gameState.gold += goldGain;
    gameState.battlesWon++;
    gameState.experience += expGain;
    
    // Check if game won
    if (gameState.currentEncounter >= gameState.totalEncounters) {
      gameState.gamePhase = "GAME_OVER_WIN";
      return;
    }
    
    // Open shop
    gameState.shopOpen = true;
    gameState.selectedShopIndex = 0;
  } else {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
}