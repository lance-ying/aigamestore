// combat.js - Combat system

import { gameState, GAME_PHASES } from './globals.js';
import { Item } from './entities.js';

export class Combat {
  constructor(enemies, p) {
    this.enemies = enemies;
    this.heroes = gameState.party.filter(h => h.alive);
    this.p = p;
    this.turnQueue = [];
    this.currentTurnIndex = 0;
    this.combatLog = [];
    this.selectedAction = null;
    this.menuState = "main"; // main, skills, target
    this.selectedSkillIndex = 0;
    this.selectedTargetIndex = 0;
    this.actionInProgress = false;
    this.animationTimer = 0;
    this.initializeTurnOrder();
  }

  initializeTurnOrder() {
    // Combine heroes and enemies
    const allCombatants = [...this.heroes, ...this.enemies];
    // Sort by speed (descending)
    this.turnQueue = allCombatants.sort((a, b) => b.spd - a.spd);
    this.currentTurnIndex = 0;
  }

  getCurrentActor() {
    // Skip dead actors
    while (this.currentTurnIndex < this.turnQueue.length) {
      const actor = this.turnQueue[this.currentTurnIndex];
      if (actor.alive) {
        return actor;
      }
      this.currentTurnIndex++;
    }
    return null;
  }

  isHeroTurn() {
    const actor = this.getCurrentActor();
    return actor && this.heroes.includes(actor);
  }

  isEnemyTurn() {
    const actor = this.getCurrentActor();
    return actor && this.enemies.includes(actor);
  }

  addLog(message) {
    this.combatLog.push(message);
    if (this.combatLog.length > 5) {
      this.combatLog.shift();
    }
  }

  executeHeroAction(action) {
    const hero = this.getCurrentActor();
    if (!hero || !this.heroes.includes(hero)) return;

    this.actionInProgress = true;
    
    if (action.type === "attack") {
      const target = action.target;
      const damage = hero.basicAttack(target);
      this.addLog(`${hero.name} attacks ${target.name} for ${damage} damage!`);
      if (!target.alive) {
        this.addLog(`${target.name} defeated!`);
      }
    } else if (action.type === "skill") {
      const skill = action.skill;
      const target = action.target;
      
      if (skill.damage) {
        if (skill.target === "single") {
          const damage = skill.damage;
          const actualDamage = target.takeDamage(damage);
          this.addLog(`${hero.name} uses ${skill.name} on ${target.name} for ${actualDamage} damage!`);
          if (!target.alive) {
            this.addLog(`${target.name} defeated!`);
          }
        } else if (skill.target === "all") {
          this.addLog(`${hero.name} uses ${skill.name}!`);
          for (const enemy of this.enemies.filter(e => e.alive)) {
            const actualDamage = enemy.takeDamage(skill.damage);
            this.addLog(`${enemy.name} takes ${actualDamage} damage!`);
            if (!enemy.alive) {
              this.addLog(`${enemy.name} defeated!`);
            }
          }
        }
      }
      
      if (skill.heal) {
        if (skill.target === "ally" || skill.target === "self") {
          const healed = target.heal(skill.heal);
          this.addLog(`${hero.name} heals ${target.name} for ${healed} HP!`);
        } else if (skill.target === "all_allies") {
          this.addLog(`${hero.name} uses ${skill.name}!`);
          for (const h of this.heroes.filter(h => h.alive)) {
            const healed = h.heal(skill.heal);
            this.addLog(`${h.name} healed for ${healed} HP!`);
          }
        }
      }
      
      if (skill.selfDamage) {
        hero.takeDamage(skill.selfDamage);
        this.addLog(`${hero.name} takes ${skill.selfDamage} recoil damage!`);
      }
    }

    this.animationTimer = 30;
    setTimeout(() => {
      this.actionInProgress = false;
      this.nextTurn();
    }, 500);
  }

  executeEnemyTurn() {
    const enemy = this.getCurrentActor();
    if (!enemy || !this.enemies.includes(enemy)) return;

    this.actionInProgress = true;
    
    const action = enemy.chooseAction(this.heroes);
    if (action) {
      const actualDamage = action.target.takeDamage(action.damage);
      this.addLog(`${enemy.name} attacks ${action.target.name} for ${actualDamage} damage!`);
      if (!action.target.alive) {
        this.addLog(`${action.target.name} has fallen!`);
      }
    }

    this.animationTimer = 30;
    setTimeout(() => {
      this.actionInProgress = false;
      this.nextTurn();
    }, 500);
  }

  nextTurn() {
    this.currentTurnIndex++;
    
    // Check combat end conditions
    const heroesAlive = this.heroes.some(h => h.alive);
    const enemiesAlive = this.enemies.some(e => e.alive);
    
    if (!enemiesAlive) {
      this.endCombat(true);
      return;
    }
    
    if (!heroesAlive) {
      this.endCombat(false);
      return;
    }
    
    // Reset turn if we've gone through everyone
    if (this.currentTurnIndex >= this.turnQueue.length) {
      this.currentTurnIndex = 0;
    }
    
    // Auto-execute enemy turns
    if (this.isEnemyTurn() && !this.actionInProgress) {
      setTimeout(() => this.executeEnemyTurn(), 500);
    }
  }

  endCombat(victory) {
    if (victory) {
      this.addLog("Victory!");
      
      // Distribute rewards
      let totalExp = 0;
      let totalGold = 0;
      const droppedItems = [];
      
      for (const enemy of this.enemies) {
        totalExp += enemy.expReward;
        totalGold += enemy.goldReward;
        
        // Chance to drop item
        if (Math.random() < 0.4) {
          droppedItems.push(new Item(gameState.dungeonLevel));
        }
      }
      
      gameState.score += totalGold;
      
      for (const hero of this.heroes) {
        if (hero.alive) {
          hero.gainExp(totalExp);
        }
      }
      
      for (const item of droppedItems) {
        gameState.inventory.push(item);
      }
      
      this.addLog(`Gained ${totalExp} EXP and ${totalGold} gold!`);
      if (droppedItems.length > 0) {
        this.addLog(`Found ${droppedItems.length} item(s)!`);
      }
      
      // Remove enemies from dungeon
      for (const enemy of this.enemies) {
        gameState.dungeon.removeEnemy(enemy);
      }
      
      setTimeout(() => {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.combat = null;
      }, 2000);
    } else {
      this.addLog("Defeat...");
      setTimeout(() => {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      }, 2000);
    }
  }
}