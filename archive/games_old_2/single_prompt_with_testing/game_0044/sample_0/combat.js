// combat.js - Combat system

import { gameState, COMBAT_INTRO, COMBAT_PLAYER_TURN, COMBAT_ENEMY_TURN, COMBAT_ACTION_ANIMATION, COMBAT_BREAK_ATTACK, COMBAT_VICTORY, COMBAT_DEFEAT, ELEMENT_PHYSICAL } from './globals.js';
import { Enemy } from './entities.js';

export function initiateCombat(p) {
  gameState.combatState = COMBAT_INTRO;
  gameState.currentTurn = 0;
  gameState.selectedPartyMember = 0;
  gameState.combatMenu = "MAIN";
  gameState.selectedMenuOption = 0;
  gameState.combatAnimation = null;
  gameState.animationTimer = 0;
  
  // Generate enemies based on progress
  gameState.enemies = generateEnemies(p);
  
  // Reset party break damage
  gameState.party.forEach(member => {
    member.breakDamage = 0;
  });
  
  // Log combat start
  p.logs.game_info.push({
    data: { event: "combat_start", enemies: gameState.enemies.length },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function generateEnemies(p) {
  const enemies = [];
  const level = Math.min(5, Math.floor(gameState.battlesWon / 2) + 1);
  const numEnemies = Math.min(3, 1 + Math.floor(gameState.battlesWon / 3));
  
  const enemyTypes = [
    { name: "Goblin Scout", hp: 40, str: 12, def: 5, element: "PHYSICAL", weakness: "FIRE", infamy: 20 },
    { name: "Ice Wolf", hp: 50, str: 15, def: 6, element: "ICE", weakness: "FIRE", infamy: 25 },
    { name: "Thunder Bat", hp: 35, str: 14, def: 4, element: "LIGHTNING", weakness: "ICE", infamy: 22 },
    { name: "Shadow Beast", hp: 60, str: 18, def: 8, element: "DARK", weakness: "LIGHTNING", infamy: 30 },
    { name: "Fire Imp", hp: 45, str: 16, def: 5, element: "FIRE", weakness: "ICE", infamy: 28 }
  ];
  
  for (let i = 0; i < numEnemies; i++) {
    const typeIndex = Math.floor(p.random() * enemyTypes.length);
    const template = enemyTypes[typeIndex];
    const enemy = new Enemy(
      template.name,
      template.hp + level * 10,
      template.str + level * 2,
      template.def + level * 1,
      template.element,
      template.weakness,
      template.infamy + level * 5
    );
    enemies.push(enemy);
  }
  
  return enemies;
}

export function updateCombat(p) {
  if (gameState.combatState === COMBAT_INTRO) {
    gameState.animationTimer++;
    if (gameState.animationTimer > 60) {
      gameState.combatState = COMBAT_PLAYER_TURN;
      gameState.animationTimer = 0;
    }
  }
  else if (gameState.combatState === COMBAT_ACTION_ANIMATION) {
    gameState.animationTimer++;
    if (gameState.animationTimer > 45) {
      // Check if enemies are all defeated
      if (gameState.enemies.every(e => !e.isAlive())) {
        gameState.combatState = COMBAT_VICTORY;
        gameState.animationTimer = 0;
        return;
      }
      
      // Check if any enemy is broken
      const brokenEnemy = gameState.enemies.find(e => e.isStunned && e.isAlive());
      if (brokenEnemy) {
        gameState.combatState = COMBAT_BREAK_ATTACK;
        gameState.animationTimer = 0;
      } else {
        // Move to next character or enemy turn
        gameState.currentTurn++;
        if (gameState.currentTurn < gameState.party.length) {
          gameState.selectedPartyMember = gameState.currentTurn;
          gameState.combatState = COMBAT_PLAYER_TURN;
          gameState.combatMenu = "MAIN";
          gameState.selectedMenuOption = 0;
        } else {
          gameState.combatState = COMBAT_ENEMY_TURN;
          gameState.currentTurn = 0;
        }
        gameState.animationTimer = 0;
      }
    }
  }
  else if (gameState.combatState === COMBAT_BREAK_ATTACK) {
    gameState.animationTimer++;
    if (gameState.animationTimer > 60) {
      // After break attack, continue turn order
      gameState.currentTurn++;
      if (gameState.currentTurn < gameState.party.length) {
        gameState.selectedPartyMember = gameState.currentTurn;
        gameState.combatState = COMBAT_PLAYER_TURN;
        gameState.combatMenu = "MAIN";
        gameState.selectedMenuOption = 0;
      } else {
        gameState.combatState = COMBAT_ENEMY_TURN;
        gameState.currentTurn = 0;
      }
      gameState.animationTimer = 0;
    }
  }
  else if (gameState.combatState === COMBAT_ENEMY_TURN) {
    gameState.animationTimer++;
    if (gameState.animationTimer > 40) {
      if (gameState.currentTurn < gameState.enemies.length) {
        const enemy = gameState.enemies[gameState.currentTurn];
        if (enemy.isAlive()) {
          // Enemy attacks random alive party member
          const aliveParty = gameState.party.filter(m => m.isAlive());
          if (aliveParty.length > 0) {
            const target = aliveParty[Math.floor(p.random() * aliveParty.length)];
            enemy.attack(target);
          }
        }
        gameState.currentTurn++;
        gameState.animationTimer = 0;
      } else {
        // Check if party is defeated
        if (gameState.party.every(m => !m.isAlive())) {
          gameState.combatState = COMBAT_DEFEAT;
          gameState.animationTimer = 0;
        } else {
          // Start new round
          gameState.currentTurn = 0;
          gameState.selectedPartyMember = 0;
          gameState.combatState = COMBAT_PLAYER_TURN;
          gameState.combatMenu = "MAIN";
          gameState.selectedMenuOption = 0;
          gameState.animationTimer = 0;
        }
      }
    }
  }
  else if (gameState.combatState === COMBAT_VICTORY) {
    gameState.animationTimer++;
    if (gameState.animationTimer > 90) {
      // Award infamy and items
      let totalInfamy = 0;
      gameState.enemies.forEach(enemy => {
        totalInfamy += enemy.infamyReward;
      });
      gameState.infamy += totalInfamy;
      gameState.score += totalInfamy;
      gameState.battlesWon++;
      
      // Random item drop
      if (p.random() < 0.5) {
        if (p.random() < 0.6) {
          gameState.inventory.healthPotion++;
        } else {
          gameState.inventory.manaPotion++;
        }
      }
      
      // Check for level up
      const expNeeded = gameState.level * 100;
      if (gameState.infamy >= expNeeded) {
        gameState.party.forEach(member => member.levelUp());
        gameState.level++;
      }
      
      // Check win condition
      if (gameState.battlesWon >= gameState.targetVictories) {
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          data: { event: "game_over", result: "win", score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Return to overworld
        gameState.gameplayState = "OVERWORLD";
        gameState.combatState = null;
        
        // Restore party HP/SP partially
        gameState.party.forEach(member => {
          member.hp = Math.min(member.maxHP, member.hp + 20);
          member.sp = Math.min(member.maxSP, member.sp + 10);
        });
      }
    }
  }
  else if (gameState.combatState === COMBAT_DEFEAT) {
    gameState.animationTimer++;
    if (gameState.animationTimer > 90) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      p.logs.game_info.push({
        data: { event: "game_over", result: "lose", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function executeCombatAction(p, action) {
  const character = gameState.party[gameState.selectedPartyMember];
  if (!character || !character.isAlive()) return;
  
  const aliveEnemies = gameState.enemies.filter(e => e.isAlive());
  if (aliveEnemies.length === 0) return;
  
  // Target first alive enemy for now
  const target = aliveEnemies[0];
  
  gameState.combatAnimation = action;
  
  if (action.type === "ATTACK") {
    const damage = character.attack(target);
    action.result = { damage, breakGain: 10 };
  } else if (action.type === "SKILL") {
    const result = character.useSkill(action.skillIndex, action.target || target);
    action.result = result;
  } else if (action.type === "ITEM") {
    if (action.itemType === "healthPotion" && gameState.inventory.healthPotion > 0) {
      gameState.inventory.healthPotion--;
      const healAmount = Math.min(50, character.maxHP - character.hp);
      character.hp += healAmount;
      action.result = { heal: healAmount };
    } else if (action.itemType === "manaPotion" && gameState.inventory.manaPotion > 0) {
      gameState.inventory.manaPotion--;
      const restoreAmount = Math.min(30, character.maxSP - character.sp);
      character.sp += restoreAmount;
      action.result = { restore: restoreAmount };
    }
  } else if (action.type === "BREAK_ATTACK") {
    // Powerful attack that deals double damage
    const baseDamage = character.strength * 3;
    const damage = Math.floor(baseDamage * (0.9 + Math.random() * 0.2));
    target.hp = Math.max(0, target.hp - damage);
    target.isStunned = false;
    target.breakDamage = 0;
    action.result = { damage };
  }
  
  gameState.combatState = COMBAT_ACTION_ANIMATION;
  gameState.animationTimer = 0;
}