// battle.js - Battle system

import { Character, Skill } from './character.js';
import { gameState, BATTLE_PHASES } from './globals.js';

export class Battle {
  constructor(enemies) {
    this.allies = [...gameState.party];
    this.enemies = enemies;
    this.allCombatants = [...this.allies, ...this.enemies];
    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.selectedAllyIndex = 0;
    this.actionMenuSelection = 0;
    this.targetSelection = 0;
    this.skillSelection = 0;
    this.actionState = "SELECTING_ACTION"; // SELECTING_ACTION, SELECTING_TARGET, SELECTING_SKILL
    this.animationTimer = 0;
    this.currentAnimation = null;
    this.logMessages = [];
    
    this.initializeTurnOrder();
  }
  
  initializeTurnOrder() {
    this.turnOrder = this.allCombatants
      .filter(c => c.isAlive())
      .sort((a, b) => b.speed - a.speed);
    this.currentTurnIndex = 0;
  }
  
  getCurrentActor() {
    if (this.turnOrder.length === 0) return null;
    return this.turnOrder[this.currentTurnIndex];
  }
  
  addLogMessage(message) {
    this.logMessages.push(message);
    if (this.logMessages.length > 4) {
      this.logMessages.shift();
    }
  }
  
  selectAction(action) {
    const actor = this.getCurrentActor();
    if (!actor || actor.type === "ENEMY") return;
    
    if (action === "ATTACK") {
      this.actionState = "SELECTING_TARGET";
      this.targetSelection = 0;
      actor.selectedAction = { type: "ATTACK" };
    } else if (action === "SKILL") {
      if (actor.equippedSkills.length > 0) {
        this.actionState = "SELECTING_SKILL";
        this.skillSelection = 0;
      }
    } else if (action === "DEFEND") {
      actor.selectedAction = { type: "DEFEND" };
      actor.actionReady = true;
      this.actionState = "SELECTING_ACTION";
    } else if (action === "LEARN" && actor.canLearn) {
      this.actionState = "SELECTING_TARGET";
      this.targetSelection = 0;
      actor.selectedAction = { type: "LEARN" };
    }
  }
  
  selectSkill(skillIndex) {
    const actor = this.getCurrentActor();
    if (!actor || skillIndex >= actor.equippedSkills.length) return;
    
    const skill = actor.equippedSkills[skillIndex];
    if (actor.mp < skill.mpCost) {
      this.addLogMessage(`Not enough MP!`);
      this.actionState = "SELECTING_ACTION";
      return;
    }
    
    actor.selectedAction = { type: "SKILL", skill: skill };
    
    if (skill.target.includes("ALLY")) {
      this.actionState = "SELECTING_TARGET";
      this.targetSelection = 0;
    } else if (skill.target.includes("ALL")) {
      actor.actionReady = true;
      this.actionState = "SELECTING_ACTION";
    } else {
      this.actionState = "SELECTING_TARGET";
      this.targetSelection = 0;
    }
  }
  
  selectTarget(targetIndex) {
    const actor = this.getCurrentActor();
    if (!actor) return;
    
    const action = actor.selectedAction;
    if (!action) return;
    
    let targets;
    if (action.type === "SKILL" && action.skill.target.includes("ALLY")) {
      targets = this.allies.filter(a => a.isAlive());
    } else {
      targets = this.enemies.filter(e => e.isAlive());
    }
    
    if (targetIndex < 0 || targetIndex >= targets.length) return;
    
    action.target = targets[targetIndex];
    actor.actionReady = true;
    this.actionState = "SELECTING_ACTION";
  }
  
  executeAIAction(enemy) {
    // Simple AI: 70% attack, 20% skill if available, 10% defend
    const rand = Math.random();
    const aliveAllies = this.allies.filter(a => a.isAlive());
    
    if (enemy.equippedSkills.length > 0 && rand < 0.2) {
      const skill = enemy.equippedSkills[Math.floor(Math.random() * enemy.equippedSkills.length)];
      enemy.selectedAction = { type: "SKILL", skill: skill };
      if (!skill.target.includes("ALL")) {
        enemy.selectedAction.target = aliveAllies[Math.floor(Math.random() * aliveAllies.length)];
      }
    } else if (rand < 0.9) {
      enemy.selectedAction = {
        type: "ATTACK",
        target: aliveAllies[Math.floor(Math.random() * aliveAllies.length)]
      };
    } else {
      enemy.selectedAction = { type: "DEFEND" };
    }
    
    enemy.actionReady = true;
  }
  
  executeAction(actor) {
    if (!actor.selectedAction) return;
    
    const action = actor.selectedAction;
    
    if (action.type === "ATTACK") {
      const target = action.target;
      const damage = Math.max(1, actor.attack + Math.floor(Math.random() * 5) - 2);
      const actualDamage = target.takeDamage(damage);
      this.addLogMessage(`${actor.name} attacks ${target.name} for ${actualDamage} damage!`);
      this.currentAnimation = {
        type: "ATTACK",
        source: actor,
        target: target,
        duration: 30
      };
    } else if (action.type === "SKILL") {
      const skill = action.skill;
      actor.mp -= skill.mpCost;
      
      if (skill.target === "ALL_ENEMIES") {
        const targets = this.enemies.filter(e => e.isAlive());
        targets.forEach(target => {
          const damage = Math.max(1, skill.power + Math.floor(Math.random() * 5));
          const actualDamage = target.takeDamage(damage);
          this.addLogMessage(`${target.name} takes ${actualDamage} damage!`);
        });
        this.addLogMessage(`${actor.name} uses ${skill.name}!`);
      } else if (skill.target === "ALL_ALLIES") {
        const targets = this.allies.filter(a => a.isAlive());
        targets.forEach(target => {
          const healAmount = target.heal(skill.power);
          this.addLogMessage(`${target.name} heals ${healAmount} HP!`);
        });
        this.addLogMessage(`${actor.name} uses ${skill.name}!`);
      } else if (skill.target.includes("ALLY")) {
        const target = action.target;
        const healAmount = target.heal(skill.power);
        this.addLogMessage(`${actor.name} heals ${target.name} for ${healAmount} HP!`);
      } else {
        const target = action.target;
        const damage = Math.max(1, skill.power + Math.floor(Math.random() * 5));
        const actualDamage = target.takeDamage(damage);
        this.addLogMessage(`${actor.name} uses ${skill.name} on ${target.name} for ${actualDamage} damage!`);
      }
      
      this.currentAnimation = {
        type: "SKILL",
        source: actor,
        target: action.target,
        duration: 40
      };
    } else if (action.type === "DEFEND") {
      actor.isDefending = true;
      this.addLogMessage(`${actor.name} defends!`);
    } else if (action.type === "LEARN" && actor.canLearn) {
      const target = action.target;
      if (target.equippedSkills.length > 0) {
        const learnedSkill = target.equippedSkills[0];
        actor.learnSkill(learnedSkill);
        this.addLogMessage(`${actor.name} learned ${learnedSkill.name}!`);
      } else {
        this.addLogMessage(`${target.name} has no skills to learn!`);
      }
    }
    
    actor.resetBattleState();
  }
  
  advanceTurn() {
    // Check if all actors are ready
    const currentActor = this.getCurrentActor();
    if (currentActor && currentActor.type === "ENEMY" && !currentActor.actionReady) {
      this.executeAIAction(currentActor);
      return false;
    }
    
    const allReady = this.turnOrder.every(actor => actor.actionReady || !actor.isAlive());
    
    if (allReady) {
      // Execute all actions
      this.turnOrder.forEach(actor => {
        if (actor.isAlive() && actor.actionReady) {
          this.executeAction(actor);
        }
      });
      
      // Reset for next turn
      this.turnOrder.forEach(actor => {
        if (actor.isAlive()) {
          actor.resetBattleState();
        }
      });
      
      // Check battle end conditions
      const alliesAlive = this.allies.some(a => a.isAlive());
      const enemiesAlive = this.enemies.some(e => e.isAlive());
      
      if (!enemiesAlive) {
        return "VICTORY";
      }
      if (!alliesAlive) {
        return "DEFEAT";
      }
      
      // Update turn order
      this.initializeTurnOrder();
      return true;
    }
    
    return false;
  }
  
  updateAnimation() {
    if (this.currentAnimation) {
      this.animationTimer++;
      if (this.animationTimer >= this.currentAnimation.duration) {
        this.currentAnimation = null;
        this.animationTimer = 0;
      }
    }
  }
}