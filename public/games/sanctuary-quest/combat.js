import { gameState, SCREEN_MODES, COMBAT_PHASES, addFloatingText, addFlashEffect, addParticles, addScreenShake, addAttackAnimation, addImpactEffect } from './globals.js';
import { Enemy } from './hero.js';

export function startCombat(monsterType, zone, p) {
  gameState.inCombat = true;
  gameState.combatPhase = COMBAT_PHASES.PLAYER_TURN;
  gameState.enemies = [];
  gameState.turnNumber = 1;
  gameState.heroesActedThisTurn = [];
  gameState.enemyTurnExecuted = false;
  gameState.enemyActionQueue = [];
  gameState.currentEnemyAction = null;
  
  const numEnemies = Math.min(3, 1 + Math.floor(zone / 2));
  for (let i = 0; i < numEnemies; i++) {
    gameState.enemies.push(new Enemy(monsterType, zone * 0.8));
  }
  
  gameState.combatLog = [`Turn ${gameState.turnNumber}: Encountered ${numEnemies} ${monsterType.name}(s)!`];
  gameState.selectedPartyMember = 0;
  gameState.turnTimer = 0;
  
  // Reset cooldowns for turn-based system
  gameState.party.forEach(hero => {
    hero.currentCooldown = 0;
  });
  
  // Log combat start
  if (p && p.logs) {
    p.logs.game_info.push({
      data: { event: "combat_start", enemies: numEnemies, type: monsterType.name },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateCombat(p) {
  if (!gameState.inCombat) return;
  
  gameState.turnTimer++;
  
  // Handle turn transitions
  if (gameState.combatPhase === COMBAT_PHASES.TURN_TRANSITION) {
    if (gameState.turnTimer >= 60) {
      // Transition to next phase
      if (gameState.heroesActedThisTurn.length >= gameState.party.filter(h => h.health > 0).length) {
        // All heroes acted, now enemy turn
        gameState.combatPhase = COMBAT_PHASES.ENEMY_TURN;
        gameState.turnTimer = 0;
        gameState.enemyTurnExecuted = false; // Reset flag
        prepareEnemyTurn(p);
      } else {
        // Back to player turn
        gameState.combatPhase = COMBAT_PHASES.PLAYER_TURN;
        gameState.turnTimer = 0;
      }
    }
  } else if (gameState.combatPhase === COMBAT_PHASES.ENEMY_TURN) {
    // Execute enemy actions from queue
    executeEnemyActions(p);
  }
  
  // Check combat end
  checkCombatEnd(p);
}

function prepareEnemyTurn(p) {
  gameState.combatLog.push("=== ENEMY TURN ===");
  if (gameState.combatLog.length > 8) {
    gameState.combatLog.shift();
  }
  
  // Build action queue for all enemies
  gameState.enemyActionQueue = [];
  gameState.enemies.forEach((enemy, enemyIndex) => {
    if (enemy.health > 0) {
      const aliveHeroes = gameState.party.filter(h => h.health > 0);
      if (aliveHeroes.length > 0) {
        const target = aliveHeroes[Math.floor(p.random() * aliveHeroes.length)];
        const targetIndex = gameState.party.indexOf(target);
        
        gameState.enemyActionQueue.push({
          enemyIndex: enemyIndex,
          targetIndex: targetIndex,
          startFrame: gameState.turnTimer + (enemyIndex * 45) // Stagger attacks
        });
      }
    }
  });
}

function executeEnemyActions(p) {
  // Process current action if exists
  if (gameState.currentEnemyAction) {
    const action = gameState.currentEnemyAction;
    const elapsed = gameState.turnTimer - action.executionFrame;
    
    if (elapsed === 0) {
      // Just started - create attack animation
      const enemy = gameState.enemies[action.enemyIndex];
      const target = gameState.party[action.targetIndex];
      
      const enemySpacing = 900 / (gameState.enemies.length + 1);
      const enemyX = enemySpacing * (action.enemyIndex + 1);
      const enemyY = 140;
      
      const partySpacing = 900 / (gameState.party.length + 1);
      const heroX = partySpacing * (action.targetIndex + 1);
      const heroY = 340;
      
      addAttackAnimation(enemyX, enemyY, heroX, heroY, "projectile", [255, 100, 100]);
      addFlashEffect(`enemy_${action.enemyIndex}`, [255, 150, 150]);
    } else if (elapsed === 20) {
      // Animation reached target - apply damage
      const enemy = gameState.enemies[action.enemyIndex];
      const target = gameState.party[action.targetIndex];
      
      if (enemy && enemy.health > 0 && target && target.health > 0) {
        const damage = target.takeDamage(enemy.attack);
        
        gameState.combatLog.push(`${enemy.name} attacks ${target.class} for ${damage} damage!`);
        
        const partySpacing = 900 / (gameState.party.length + 1);
        const heroX = partySpacing * (action.targetIndex + 1);
        const heroY = 340;
        
        addFlashEffect(`hero_${action.targetIndex}`, [255, 100, 100]);
        addFloatingText(heroX, heroY - 40, `-${damage}`, [255, 100, 100]);
        addParticles(heroX, heroY, 15, [255, 100, 100]);
        addImpactEffect(heroX, heroY, 40, [255, 100, 100]);
        addScreenShake(5);
        
        if (gameState.combatLog.length > 8) {
          gameState.combatLog.shift();
        }
      }
      
      // Action complete
      gameState.currentEnemyAction = null;
    }
  }
  
  // Check if we should start next action
  if (!gameState.currentEnemyAction && gameState.enemyActionQueue.length > 0) {
    const nextAction = gameState.enemyActionQueue[0];
    if (gameState.turnTimer >= nextAction.startFrame) {
      gameState.enemyActionQueue.shift();
      gameState.currentEnemyAction = {
        ...nextAction,
        executionFrame: gameState.turnTimer
      };
    }
  }
  
  // If all actions complete, end enemy turn
  if (!gameState.currentEnemyAction && gameState.enemyActionQueue.length === 0 && gameState.turnTimer > 30) {
    startNewTurn(p);
  }
}

function startNewTurn(p) {
  gameState.turnNumber++;
  gameState.combatPhase = COMBAT_PHASES.PLAYER_TURN;
  gameState.turnTimer = 0;
  gameState.heroesActedThisTurn = [];
  gameState.enemyTurnExecuted = false;
  
  // Reduce cooldowns
  gameState.party.forEach(hero => {
    if (hero.currentCooldown > 0) {
      hero.currentCooldown--;
    }
  });
  
  gameState.combatLog.push(`--- Turn ${gameState.turnNumber} ---`);
  if (gameState.combatLog.length > 8) {
    gameState.combatLog.shift();
  }
}

export function checkCombatEnd(p) {
  const allEnemiesDead = gameState.enemies.every(e => e.health <= 0);
  const allHeroesDead = gameState.party.every(h => h.health <= 0);
  
  if (allEnemiesDead) {
    endCombat(true, p);
  } else if (allHeroesDead) {
    endCombat(false, p);
  }
}

export function endCombat(victory, p) {
  if (!gameState.inCombat) return;
  
  gameState.inCombat = false;
  
  if (victory) {
    let totalExp = 0;
    let totalGold = 0;
    
    gameState.enemies.forEach(enemy => {
      totalExp += enemy.exp;
      totalGold += enemy.gold;
    });
    
    gameState.party.forEach(hero => {
      if (hero.health > 0) {
        hero.gainExperience(totalExp);
      }
    });
    
    gameState.experience += totalExp;
    gameState.gold += totalGold;
    gameState.score += totalExp * 10;
    
    gameState.combatLog.push(`Victory! Gained ${totalExp} EXP and ${totalGold} gold!`);
    
    // Visual feedback for victory
    addParticles(450, 200, 30, [255, 215, 0]);
    addScreenShake(5);
    
    // Mark cell as cleared
    const cell = gameState.dungeonMap[gameState.playerY][gameState.playerX];
    cell.type = "empty";
    
    // Return to dungeon view
    gameState.screenMode = SCREEN_MODES.DUNGEON;
    
    if (p && p.logs) {
      p.logs.game_info.push({
        data: { event: "combat_end", victory: true, exp: totalExp, gold: totalGold },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    gameState.combatLog.push("Defeat! Retreating to sanctuary...");
    gameState.screenMode = SCREEN_MODES.BASE;
    
    // Heal party partially
    gameState.party.forEach(hero => {
      hero.health = Math.floor(hero.maxHealth * 0.3);
    });
    
    if (p && p.logs) {
      p.logs.game_info.push({
        data: { event: "combat_end", victory: false },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  gameState.enemies = [];
}

export function heroAttack(heroIndex, p) {
  if (!gameState.inCombat) return;
  if (gameState.combatPhase !== COMBAT_PHASES.PLAYER_TURN) return;
  
  const hero = gameState.party[heroIndex];
  if (!hero || hero.health <= 0) return;
  
  // Check if hero already acted
  if (gameState.heroesActedThisTurn.includes(heroIndex)) {
    return;
  }
  
  const aliveEnemies = gameState.enemies.filter(e => e.health > 0);
  if (aliveEnemies.length === 0) return;
  
  const target = aliveEnemies[Math.floor(p.random() * aliveEnemies.length)];
  const targetIndex = gameState.enemies.indexOf(target);
  
  // Create attack animation
  const partySpacing = 900 / (gameState.party.length + 1);
  const heroX = partySpacing * (heroIndex + 1);
  const heroY = 340;
  
  const enemySpacing = 900 / (gameState.enemies.length + 1);
  const enemyX = enemySpacing * (targetIndex + 1);
  const enemyY = 140;
  
  addAttackAnimation(heroX, heroY, enemyX, enemyY, "slash", [255, 255, 150]);
  
  const damage = target.takeDamage(hero.attack);
  
  gameState.combatLog.push(`${hero.class} attacks ${target.name} for ${damage} damage!`);
  
  // Visual feedback
  addFlashEffect(`hero_${heroIndex}`, [255, 255, 150]);
  addFlashEffect(`enemy_${targetIndex}`, [255, 100, 100]);
  addScreenShake(6);
  
  setTimeout(() => {
    addFloatingText(enemyX, enemyY - 40, `-${damage}`, [255, 200, 100]);
    addParticles(enemyX, enemyY, 20, [255, 200, 100]);
    addImpactEffect(enemyX, enemyY, 35, [255, 200, 100]);
  }, 200);
  
  if (gameState.combatLog.length > 8) {
    gameState.combatLog.shift();
  }
  
  if (target.health <= 0) {
    gameState.combatLog.push(`${target.name} defeated!`);
    addParticles(enemyX, enemyY, 25, [200, 50, 50]);
    addScreenShake(8);
    if (gameState.combatLog.length > 8) {
      gameState.combatLog.shift();
    }
  }
  
  // Mark hero as acted
  gameState.heroesActedThisTurn.push(heroIndex);
  
  // Check if all heroes acted
  const aliveHeroes = gameState.party.filter(h => h.health > 0).length;
  if (gameState.heroesActedThisTurn.length >= aliveHeroes) {
    gameState.combatPhase = COMBAT_PHASES.TURN_TRANSITION;
    gameState.turnTimer = 0;
  }
}

export function heroAbility(heroIndex, p) {
  if (!gameState.inCombat) return;
  if (gameState.combatPhase !== COMBAT_PHASES.PLAYER_TURN) return;
  
  const hero = gameState.party[heroIndex];
  if (!hero || !hero.canUseAbility()) return;
  
  // Check if hero already acted
  if (gameState.heroesActedThisTurn.includes(heroIndex)) {
    return;
  }
  
  hero.useAbility();
  
  // Visual feedback for ability use
  addFlashEffect(`hero_${heroIndex}`, [100, 200, 255]);
  addScreenShake(7);
  
  const partySpacing = 900 / (gameState.party.length + 1);
  const heroX = partySpacing * (heroIndex + 1);
  const heroY = 340;
  
  if (hero.class === "Warrior") {
    const aliveEnemies = gameState.enemies.filter(e => e.health > 0);
    if (aliveEnemies.length > 0) {
      const target = aliveEnemies[0];
      const targetIndex = gameState.enemies.indexOf(target);
      
      const enemySpacing = 900 / (gameState.enemies.length + 1);
      const enemyX = enemySpacing * (targetIndex + 1);
      const enemyY = 140;
      
      addAttackAnimation(heroX, heroY, enemyX, enemyY, "charge", [255, 200, 50]);
      
      const damage = target.takeDamage(hero.attack * 2);
      gameState.combatLog.push(`${hero.class} uses Shield Bash for ${damage} damage!`);
      
      addFlashEffect(`enemy_${targetIndex}`, [255, 150, 50]);
      addFloatingText(enemyX, enemyY - 40, `-${damage}!`, [255, 150, 50]);
      addParticles(enemyX, enemyY, 25, [255, 200, 100]);
      addImpactEffect(enemyX, enemyY, 50, [255, 150, 50]);
      
      if (target.health <= 0) {
        gameState.combatLog.push(`${target.name} defeated!`);
        addParticles(enemyX, enemyY, 30, [200, 50, 50]);
        if (gameState.combatLog.length > 8) {
          gameState.combatLog.shift();
        }
      }
    }
  } else if (hero.class === "Mage") {
    gameState.combatLog.push(`${hero.class} casts Fireball!`);
    
    gameState.enemies.forEach((enemy, index) => {
      if (enemy.health > 0) {
        const enemySpacing = 900 / (gameState.enemies.length + 1);
        const enemyX = enemySpacing * (index + 1);
        const enemyY = 140;
        
        addAttackAnimation(heroX, heroY, enemyX, enemyY, "fireball", [255, 100, 50]);
        
        const damage = enemy.takeDamage(hero.attack * 1.5);
        
        addFlashEffect(`enemy_${index}`, [255, 100, 50]);
        addFloatingText(enemyX, enemyY - 40, `-${damage}`, [255, 150, 50]);
        addParticles(enemyX, enemyY, 20, [255, 100, 50]);
        addImpactEffect(enemyX, enemyY, 45, [255, 100, 50]);
        
        if (enemy.health <= 0) {
          gameState.combatLog.push(`${enemy.name} defeated!`);
          if (gameState.combatLog.length > 8) {
            gameState.combatLog.shift();
          }
        }
      }
    });
  } else if (hero.class === "Ranger") {
    const aliveEnemies = gameState.enemies.filter(e => e.health > 0);
    const numTargets = Math.min(2, aliveEnemies.length);
    gameState.combatLog.push(`${hero.class} uses Multi-Shot!`);
    
    for (let i = 0; i < numTargets; i++) {
      const targetIndex = gameState.enemies.indexOf(aliveEnemies[i]);
      
      const enemySpacing = 900 / (gameState.enemies.length + 1);
      const enemyX = enemySpacing * (targetIndex + 1);
      const enemyY = 140;
      
      addAttackAnimation(heroX, heroY, enemyX, enemyY, "arrow", [150, 255, 150]);
      
      const damage = aliveEnemies[i].takeDamage(hero.attack);
      
      addFlashEffect(`enemy_${targetIndex}`, [150, 255, 150]);
      addFloatingText(enemyX, enemyY - 40, `-${damage}`, [150, 255, 150]);
      addParticles(enemyX, enemyY, 15, [150, 255, 150]);
      addImpactEffect(enemyX, enemyY, 35, [150, 255, 150]);
      
      if (aliveEnemies[i].health <= 0) {
        gameState.combatLog.push(`${aliveEnemies[i].name} defeated!`);
        if (gameState.combatLog.length > 8) {
          gameState.combatLog.shift();
        }
      }
    }
  } else if (hero.class === "Cleric") {
    gameState.combatLog.push(`${hero.class} heals the party!`);
    
    gameState.party.forEach((h, index) => {
      if (h.health > 0) {
        const healAmount = 30;
        h.heal(healAmount);
        
        const partySpacing = 900 / (gameState.party.length + 1);
        const hX = partySpacing * (index + 1);
        const hY = 340;
        
        addFlashEffect(`hero_${index}`, [100, 255, 100]);
        addFloatingText(hX, hY - 40, `+${healAmount}`, [100, 255, 100]);
        addParticles(hX, hY, 15, [100, 255, 100]);
        addImpactEffect(hX, hY, 35, [100, 255, 100]);
      }
    });
  }
  
  if (gameState.combatLog.length > 8) {
    gameState.combatLog.shift();
  }
  
  // Mark hero as acted
  gameState.heroesActedThisTurn.push(heroIndex);
  
  // Check if all heroes acted
  const aliveHeroes = gameState.party.filter(h => h.health > 0).length;
  if (gameState.heroesActedThisTurn.length >= aliveHeroes) {
    gameState.combatPhase = COMBAT_PHASES.TURN_TRANSITION;
    gameState.turnTimer = 0;
  }
}