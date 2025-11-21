import { gameState, SCREEN_MODES, addFloatingText, addFlashEffect, addParticles } from './globals.js';
import { Enemy } from './hero.js';

export function startCombat(monsterType, zone, p) {
  gameState.inCombat = true;
  gameState.enemies = [];
  
  const numEnemies = Math.min(3, 1 + Math.floor(zone / 2));
  for (let i = 0; i < numEnemies; i++) {
    gameState.enemies.push(new Enemy(monsterType, zone * 0.8));
  }
  
  gameState.combatLog = [`Encountered ${numEnemies} ${monsterType.name}(s)!`];
  gameState.selectedPartyMember = 0;
  gameState.turnTimer = 0;
  
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
  
  // Update cooldowns
  gameState.party.forEach(hero => hero.updateCooldown());
  gameState.enemies.forEach(enemy => enemy.updateTimer());
  
  // Enemy attacks
  if (gameState.turnTimer % 60 === 0) {
    gameState.enemies.forEach((enemy, enemyIndex) => {
      if (enemy.canAttack() && enemy.health > 0) {
        const aliveHeroes = gameState.party.filter(h => h.health > 0);
        if (aliveHeroes.length > 0) {
          const target = aliveHeroes[Math.floor(p.random() * aliveHeroes.length)];
          const targetIndex = gameState.party.indexOf(target);
          const damage = target.takeDamage(enemy.attack);
          
          gameState.combatLog.push(`${enemy.name} attacks ${target.class} for ${damage} damage!`);
          
          // Visual feedback
          addFlashEffect(`hero_${targetIndex}`, [255, 100, 100]);
          addFloatingText(0, 0, `-${damage}`, [255, 100, 100]); // Position will be set in rendering
          
          if (gameState.combatLog.length > 8) {
            gameState.combatLog.shift();
          }
          
          enemy.performAttack();
        }
      }
    });
  }
  
  // Check combat end
  checkCombatEnd(p);
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
    addParticles(450, 200, 20, [255, 215, 0]);
    
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
  
  const hero = gameState.party[heroIndex];
  if (!hero || hero.health <= 0) return;
  
  const aliveEnemies = gameState.enemies.filter(e => e.health > 0);
  if (aliveEnemies.length === 0) return;
  
  const target = aliveEnemies[Math.floor(p.random() * aliveEnemies.length)];
  const targetIndex = gameState.enemies.indexOf(target);
  const damage = target.takeDamage(hero.attack);
  
  gameState.combatLog.push(`${hero.class} attacks ${target.name} for ${damage} damage!`);
  
  // Visual feedback
  addFlashEffect(`hero_${heroIndex}`, [255, 255, 100]);
  addFlashEffect(`enemy_${targetIndex}`, [255, 100, 100]);
  addFloatingText(0, 0, `-${damage}`, [255, 200, 100]); // Position set in rendering
  
  if (gameState.combatLog.length > 8) {
    gameState.combatLog.shift();
  }
  
  if (target.health <= 0) {
    gameState.combatLog.push(`${target.name} defeated!`);
    addParticles(0, 0, 15, [200, 50, 50]); // Position set in rendering
  }
}

export function heroAbility(heroIndex, p) {
  if (!gameState.inCombat) return;
  
  const hero = gameState.party[heroIndex];
  if (!hero || !hero.canUseAbility()) return;
  
  hero.useAbility();
  
  // Visual feedback for ability use
  addFlashEffect(`hero_${heroIndex}`, [100, 200, 255]);
  
  if (hero.class === "Warrior") {
    const aliveEnemies = gameState.enemies.filter(e => e.health > 0);
    if (aliveEnemies.length > 0) {
      const target = aliveEnemies[0];
      const targetIndex = gameState.enemies.indexOf(target);
      const damage = target.takeDamage(hero.attack * 2);
      gameState.combatLog.push(`${hero.class} uses Shield Bash for ${damage} damage!`);
      
      addFlashEffect(`enemy_${targetIndex}`, [255, 150, 50]);
      addFloatingText(0, 0, `-${damage}!`, [255, 150, 50]);
      addParticles(0, 0, 10, [255, 200, 100]);
    }
  } else if (hero.class === "Mage") {
    gameState.enemies.forEach((enemy, index) => {
      if (enemy.health > 0) {
        const damage = enemy.takeDamage(hero.attack * 1.5);
        gameState.combatLog.push(`Fireball hits ${enemy.name} for ${damage} damage!`);
        
        addFlashEffect(`enemy_${index}`, [255, 100, 50]);
        addFloatingText(0, 0, `-${damage}`, [255, 150, 50]);
      }
    });
    addParticles(450, 120, 25, [255, 100, 50]);
  } else if (hero.class === "Ranger") {
    const aliveEnemies = gameState.enemies.filter(e => e.health > 0);
    const numTargets = Math.min(2, aliveEnemies.length);
    for (let i = 0; i < numTargets; i++) {
      const targetIndex = gameState.enemies.indexOf(aliveEnemies[i]);
      const damage = aliveEnemies[i].takeDamage(hero.attack);
      gameState.combatLog.push(`Multi-Shot hits ${aliveEnemies[i].name} for ${damage} damage!`);
      
      addFlashEffect(`enemy_${targetIndex}`, [150, 255, 150]);
      addFloatingText(0, 0, `-${damage}`, [150, 255, 150]);
    }
    addParticles(0, 0, 15, [150, 255, 150]);
  } else if (hero.class === "Cleric") {
    gameState.party.forEach((h, index) => {
      if (h.health > 0) {
        h.heal(30);
        addFlashEffect(`hero_${index}`, [100, 255, 100]);
        addFloatingText(0, 0, `+30`, [100, 255, 100]);
      }
    });
    gameState.combatLog.push(`${hero.class} heals the party!`);
    addParticles(450, 300, 20, [100, 255, 100]);
  }
  
  if (gameState.combatLog.length > 8) {
    gameState.combatLog.shift();
  }
}