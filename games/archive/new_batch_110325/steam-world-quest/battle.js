// battle.js - Battle management

import { gameState, GAME_PHASES, BATTLE_PHASES, CARD_TYPES, STATUS_EFFECTS } from './globals.js';
import { Animation } from './animation.js';

export function startBattle(p) {
  gameState.battlePhase = BATTLE_PHASES.PLAYER_SELECT;
  gameState.turnNumber = 1;
  gameState.selectedCards = [];
  gameState.currentSteam = gameState.maxSteam;
  
  // Reset hero shields
  gameState.heroes.forEach(hero => {
    hero.shield = 0;
  });
  
  // Plan enemy actions
  gameState.enemies.forEach(enemy => {
    enemy.planAction(p, gameState.heroes);
  });
  
  drawCards(p, 6);
}

export function drawCards(p, count) {
  for (let i = 0; i < count; i++) {
    if (gameState.deck.length === 0) {
      // Reshuffle discard pile
      gameState.deck = [...gameState.discardPile];
      gameState.discardPile = [];
      shuffleDeck(p);
    }
    
    if (gameState.deck.length > 0 && gameState.hand.length < 8) {
      gameState.hand.push(gameState.deck.pop());
    }
  }
}

export function shuffleDeck(p) {
  // Fisher-Yates shuffle
  for (let i = gameState.deck.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [gameState.deck[i], gameState.deck[j]] = [gameState.deck[j], gameState.deck[i]];
  }
}

export function selectCard(index) {
  if (gameState.battlePhase !== BATTLE_PHASES.PLAYER_SELECT) return false;
  if (index < 0 || index >= gameState.hand.length) return false;
  
  const card = gameState.hand[index];
  const selectedIndex = gameState.selectedCards.indexOf(index);
  
  if (selectedIndex >= 0) {
    // Deselect
    gameState.selectedCards.splice(selectedIndex, 1);
    return true;
  } else {
    // Check if can select
    if (gameState.selectedCards.length >= 3) return false;
    
    // Check steam cost
    const totalCost = gameState.selectedCards.reduce((sum, idx) => {
      return sum + gameState.hand[idx].cost;
    }, 0) + card.cost;
    
    if (totalCost > gameState.currentSteam) return false;
    
    gameState.selectedCards.push(index);
    return true;
  }
}

export function playSelectedCards(p) {
  if (gameState.battlePhase !== BATTLE_PHASES.PLAYER_SELECT) return;
  if (gameState.selectedCards.length === 0) return;
  
  gameState.battlePhase = BATTLE_PHASES.PLAYER_EXECUTE;
  
  // Calculate total cost
  const totalCost = gameState.selectedCards.reduce((sum, idx) => {
    return sum + gameState.hand[idx].cost;
  }, 0);
  
  gameState.currentSteam -= totalCost;
  
  // Execute cards
  const cardsToPlay = gameState.selectedCards.map(idx => gameState.hand[idx]);
  gameState.selectedCards.sort((a, b) => b - a);
  gameState.selectedCards.forEach(idx => {
    gameState.discardPile.push(gameState.hand[idx]);
    gameState.hand.splice(idx, 1);
  });
  gameState.selectedCards = [];
  
  // Execute each card
  cardsToPlay.forEach(card => {
    executeCard(p, card);
  });
  
  // Check if enemies defeated
  setTimeout(() => {
    if (checkBattleEnd()) {
      return;
    }
    gameState.battlePhase = BATTLE_PHASES.ENEMY_TURN;
    executeEnemyTurn(p);
  }, 500);
}

export function executeCard(p, card) {
  const livingHeroes = gameState.heroes.filter(h => !h.isDead());
  const livingEnemies = gameState.enemies.filter(e => !e.isDead());
  
  if (livingEnemies.length === 0) return;
  
  switch (card.type) {
    case CARD_TYPES.ATTACK:
      if (card.effect.aoe) {
        // AOE attack
        livingEnemies.forEach(enemy => {
          const damage = card.effect.damage + livingHeroes[0].getAttackBonus();
          const actualDamage = enemy.takeDamage(damage);
          gameState.animations.push(new Animation(
            "DAMAGE",
            enemy.x,
            enemy.y,
            { amount: actualDamage, duration: 30 }
          ));
        });
      } else if (card.effect.hits) {
        // Multi-hit
        const target = livingEnemies[Math.floor(p.random() * livingEnemies.length)];
        for (let i = 0; i < card.effect.hits; i++) {
          setTimeout(() => {
            const damage = card.effect.damage + livingHeroes[0].getAttackBonus();
            const actualDamage = target.takeDamage(damage);
            gameState.animations.push(new Animation(
              "DAMAGE",
              target.x,
              target.y,
              { amount: actualDamage, duration: 30 }
            ));
          }, i * 200);
        }
      } else {
        // Single target
        const target = livingEnemies[Math.floor(p.random() * livingEnemies.length)];
        const damage = card.effect.damage + livingHeroes[0].getAttackBonus();
        const actualDamage = target.takeDamage(damage);
        gameState.animations.push(new Animation(
          "DAMAGE",
          target.x,
          target.y,
          { amount: actualDamage, duration: 30 }
        ));
      }
      break;
      
    case CARD_TYPES.DEFEND:
      if (card.effect.shield) {
        if (card.effect.allHeroes) {
          livingHeroes.forEach(hero => {
            hero.addShield(card.effect.shield);
            gameState.animations.push(new Animation(
              "SHIELD",
              hero.x,
              hero.y,
              { amount: card.effect.shield, duration: 30 }
            ));
          });
        } else {
          const target = livingHeroes[0];
          target.addShield(card.effect.shield);
          gameState.animations.push(new Animation(
            "SHIELD",
            target.x,
            target.y,
            { amount: card.effect.shield, duration: 30 }
          ));
        }
      }
      
      if (card.effect.heal) {
        if (card.effect.allHeroes) {
          livingHeroes.forEach(hero => {
            const healed = hero.heal(card.effect.heal);
            if (healed > 0) {
              gameState.animations.push(new Animation(
                "HEAL",
                hero.x,
                hero.y,
                { amount: healed, duration: 30 }
              ));
            }
          });
        } else {
          const target = livingHeroes[0];
          const healed = target.heal(card.effect.heal);
          if (healed > 0) {
            gameState.animations.push(new Animation(
              "HEAL",
              target.x,
              target.y,
              { amount: healed, duration: 30 }
            ));
          }
        }
      }
      break;
      
    case CARD_TYPES.SPECIAL:
      if (card.effect.status) {
        if (card.effect.target === "enemy") {
          const target = livingEnemies[Math.floor(p.random() * livingEnemies.length)];
          target.statusEffects[card.effect.status] = {
            value: card.effect.value,
            duration: card.effect.duration
          };
        } else {
          livingHeroes.forEach(hero => {
            hero.addStatusEffect(card.effect.status, card.effect.value, card.effect.duration);
          });
        }
      }
      break;
  }
}

export function executeEnemyTurn(p) {
  const livingEnemies = gameState.enemies.filter(e => !e.isDead());
  const livingHeroes = gameState.heroes.filter(h => !h.isDead());
  
  livingEnemies.forEach((enemy, index) => {
    setTimeout(() => {
      if (enemy.nextAction && enemy.nextAction.type === "ATTACK") {
        const target = enemy.nextAction.target;
        if (!target.isDead()) {
          const damage = Math.max(1, enemy.attack - enemy.getAttackPenalty());
          const actualDamage = target.takeDamage(damage);
          
          gameState.animations.push(new Animation(
            "ATTACK",
            enemy.x,
            enemy.y,
            { targetX: target.x, targetY: target.y, duration: 20 }
          ));
          
          setTimeout(() => {
            gameState.animations.push(new Animation(
              "DAMAGE",
              target.x,
              target.y,
              { amount: actualDamage, duration: 30 }
            ));
          }, 200);
        }
      }
      
      if (index === livingEnemies.length - 1) {
        setTimeout(() => {
          if (checkBattleEnd()) {
            return;
          }
          endTurn(p);
        }, 500);
      }
    }, index * 600);
  });
}

export function endTurn(p) {
  gameState.turnNumber++;
  gameState.currentSteam = Math.min(gameState.maxSteam, gameState.currentSteam + 1);
  
  // Update status effects
  gameState.heroes.forEach(hero => hero.updateStatusEffects());
  gameState.enemies.forEach(enemy => enemy.updateStatusEffects());
  
  // Plan next enemy actions
  gameState.enemies.forEach(enemy => {
    if (!enemy.isDead()) {
      enemy.planAction(p, gameState.heroes);
    }
  });
  
  // Draw cards
  drawCards(p, 2);
  
  gameState.battlePhase = BATTLE_PHASES.PLAYER_SELECT;
}

export function checkBattleEnd() {
  const livingHeroes = gameState.heroes.filter(h => !h.isDead());
  const livingEnemies = gameState.enemies.filter(e => !e.isDead());
  
  if (livingEnemies.length === 0) {
    // Victory
    const totalGold = gameState.enemies.reduce((sum, e) => sum + e.goldReward, 0);
    const totalExp = gameState.enemies.reduce((sum, e) => sum + e.expReward, 0);
    
    gameState.gold += totalGold;
    gameState.experience += totalExp;
    gameState.score += totalGold + totalExp;
    
    // Level up heroes
    gameState.heroes.forEach(hero => {
      if (gameState.experience >= hero.level * 50) {
        hero.levelUp();
      }
    });
    
    gameState.battleNumber++;
    
    if (gameState.battleNumber > 3) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      return true;
    }
    
    // Start next battle
    setTimeout(() => {
      initBattle();
    }, 2000);
    
    return false;
  }
  
  if (livingHeroes.length === 0) {
    // Defeat
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    return true;
  }
  
  return false;
}

export function initBattle() {
  // Import Enemy module
  import('./enemy.js').then(module => {
    gameState.enemies = module.createEnemyWave(gameState.battleNumber);
    gameState.entities = [...gameState.heroes, ...gameState.enemies];
  });
}