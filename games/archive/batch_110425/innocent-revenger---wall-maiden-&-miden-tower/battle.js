// battle.js
import { gameState, BATTLE_PHASES, GAME_PHASES } from './globals.js';
import { Character, WallMaiden } from './character.js';

export function initializeBattle(floorNumber) {
  gameState.battlePhase = BATTLE_PHASES.SELECT_CHARACTER;
  gameState.selectedCharacterIndex = 0;
  gameState.selectedActionIndex = 0;
  gameState.selectedTargetIndex = 0;
  gameState.actionsQueue = [];
  gameState.animationQueue = [];
  gameState.currentAnimation = null;
  
  // Reset party action flags
  gameState.party.forEach(char => {
    char.actionTaken = false;
  });
  
  // Generate enemies based on floor
  generateEnemies(floorNumber);
  
  // Calculate turn order based on speed
  calculateTurnOrder();
}

export function generateEnemies(floorNumber) {
  gameState.enemies = [];
  
  const enemyCount = Math.min(2 + Math.floor(floorNumber / 2), 4);
  const baseLevel = floorNumber * 2;
  
  for (let i = 0; i < enemyCount; i++) {
    const enemy = new Character(
      `Enemy ${i + 1}`,
      3 + (i % 2),
      i < 2 ? 1 : 3,
      true
    );
    
    enemy.level = baseLevel + Math.floor(Math.random() * 3);
    enemy.maxHp = 60 + enemy.level * 8;
    enemy.hp = enemy.maxHp;
    enemy.attack = 12 + enemy.level * 2;
    enemy.defense = 8 + enemy.level * 1.5;
    enemy.magic = 10 + enemy.level * 1.5;
    enemy.speed = 8 + enemy.level * 0.8;
    
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
}

export function calculateTurnOrder() {
  const allCombatants = [...gameState.party, ...gameState.enemies];
  gameState.turnOrder = allCombatants
    .filter(c => c.isAlive())
    .sort((a, b) => {
      const aStats = a.calculateStats();
      const bStats = b.calculateStats();
      return bStats.speed - aStats.speed;
    });
  gameState.currentTurnIndex = 0;
}

export function executeAction(actor, action, target) {
  const animation = {
    type: action.type,
    actor: actor,
    target: target,
    startTime: Date.now(),
    duration: 500
  };
  
  gameState.currentAnimation = animation;
  
  let damage = 0;
  const actorStats = actor.calculateStats();
  
  switch (action.type) {
    case "attack":
      damage = Math.floor(actorStats.attack * (0.8 + Math.random() * 0.4));
      const actualDamage = target.takeDamage(damage);
      gameState.totalDamageDealt += actualDamage;
      break;
      
    case "magic":
      damage = Math.floor(actorStats.magic * (0.9 + Math.random() * 0.3));
      if (actor.mp >= 10) {
        actor.mp -= 10;
        target.takeDamage(damage);
      }
      break;
      
    case "defend":
      actor.defense = Math.floor(actor.defense * 1.5);
      break;
      
    case "wallMerge":
      if (actor.type === "WallMaiden") {
        actor.mergeWithWall();
      }
      break;
      
    case "heal":
      if (actor.mp >= 15) {
        actor.mp -= 15;
        target.heal(40);
      }
      break;
  }
  
  return damage;
}

export function processEnemyTurn() {
  const aliveEnemies = gameState.enemies.filter(e => e.isAlive());
  
  if (aliveEnemies.length === 0) {
    endBattle(true);
    return;
  }
  
  const enemy = aliveEnemies[0];
  const aliveParty = gameState.party.filter(p => p.isAlive());
  
  if (aliveParty.length === 0) {
    endBattle(false);
    return;
  }
  
  // Simple AI: attack random alive party member
  const target = aliveParty[Math.floor(Math.random() * aliveParty.length)];
  const action = { type: "attack", name: "Attack" };
  
  executeAction(enemy, action, target);
}

export function endBattle(victory) {
  if (victory) {
    gameState.battlesWon++;
    
    // Award experience
    const expGain = gameState.currentFloor * 50;
    gameState.party.forEach(member => {
      member.gainExp(expGain);
    });
    
    // Award items
    if (Math.random() < 0.4) {
      const itemId = Math.floor(Math.random() * 4) + 1;
      const ITEM_DATABASE = [
        { id: 1, name: "Health Potion", type: "consumable", effect: "heal", value: 50 },
        { id: 2, name: "Iron Sword", type: "weapon", effect: "attack", value: 15 },
        { id: 3, name: "Steel Shield", type: "armor", effect: "defense", value: 12 },
        { id: 4, name: "Magic Ring", type: "accessory", effect: "magic", value: 10 }
      ];
      const item = ITEM_DATABASE.find(i => i.id === itemId);
      if (item) {
        gameState.inventory.push({...item});
      }
    }
    
    gameState.score += gameState.currentFloor * 100;
    
    // Progress to next floor
    gameState.currentFloor++;
    
    if (gameState.currentFloor > gameState.maxFloor) {
      // Win condition
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    } else {
      // Next battle
      initializeBattle(gameState.currentFloor);
    }
  } else {
    // Lose condition
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
  
  gameState.battlePhase = BATTLE_PHASES.BATTLE_END;
}

export function checkBattleEnd() {
  const aliveParty = gameState.party.filter(p => p.isAlive());
  const aliveEnemies = gameState.enemies.filter(e => e.isAlive());
  
  if (aliveEnemies.length === 0) {
    endBattle(true);
    return true;
  }
  
  if (aliveParty.length === 0) {
    endBattle(false);
    return true;
  }
  
  return false;
}

export function getAvailableActions(character) {
  const actions = [
    { type: "attack", name: "Attack", cost: 0 },
    { type: "defend", name: "Defend", cost: 0 }
  ];
  
  if (character.mp >= 10) {
    actions.push({ type: "magic", name: "Magic Attack", cost: 10 });
  }
  
  if (character.mp >= 15) {
    actions.push({ type: "heal", name: "Heal Ally", cost: 15 });
  }
  
  if (character.type === "WallMaiden" && !character.isWallMerged) {
    actions.push({ type: "wallMerge", name: "Wall Merge", cost: 0 });
  }
  
  return actions;
}

export function getValidTargets(action) {
  if (action.type === "heal") {
    return gameState.party.filter(p => p.isAlive());
  } else if (action.type === "wallMerge" || action.type === "defend") {
    return [gameState.party[gameState.selectedCharacterIndex]];
  } else {
    return gameState.enemies.filter(e => e.isAlive());
  }
}