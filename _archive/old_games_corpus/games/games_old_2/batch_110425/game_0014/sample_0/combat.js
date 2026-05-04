// combat.js - Combat system logic

import { gameState, GAME_PHASES } from './globals.js';
import { createEnemyByWave } from './entities.js';

export function startCombat() {
  gameState.playMode = "COMBAT";
  gameState.combatTurn = "PLAYER";
  gameState.selectedAction = 0;
  gameState.menuState = "MAIN";
  gameState.combatLog = [];
  
  // Create enemy for current wave
  gameState.currentEnemy = createEnemyByWave(gameState.waveNumber);
  gameState.enemies = [gameState.currentEnemy];
  
  addCombatLog(`Wave ${gameState.waveNumber}: ${gameState.currentEnemy.name} appears!`);
}

export function executePlayerAction(action, weaponIndex = 0, skillIndex = 0) {
  const player = gameState.player;
  const enemy = gameState.currentEnemy;
  
  if (!player || !enemy) return;
  
  let damage = 0;
  let actionName = "";
  
  switch (action) {
    case "ATTACK":
      actionName = "Attack";
      damage = player.attack + Math.floor(Math.random() * 5);
      const actualDamage = enemy.takeDamage(damage);
      addCombatLog(`Aldo attacks for ${actualDamage} damage!`);
      break;
      
    case "SKILL":
      const weapon = player.weapons[weaponIndex];
      const skill = weapon.skills[skillIndex];
      
      if (player.ap >= skill.apCost) {
        actionName = skill.name;
        player.useAP(skill.apCost);
        
        if (skill.type === "physical") {
          damage = Math.floor(player.attack * skill.power + Math.floor(Math.random() * 8));
        } else {
          damage = Math.floor(player.magicAttack * skill.power + Math.floor(Math.random() * 8));
        }
        
        const actualSkillDamage = enemy.takeDamage(damage);
        addCombatLog(`${skill.name} deals ${actualSkillDamage} damage! (AP: ${player.ap}/${player.maxAP})`);
      } else {
        addCombatLog("Not enough AP!");
        return;
      }
      break;
      
    case "CHARGE":
      actionName = "Charge";
      player.charge();
      addCombatLog(`Aldo charges! AP restored to ${player.ap}/${player.maxAP}`);
      break;
      
    case "DEFEND":
      actionName = "Defend";
      addCombatLog("Aldo takes a defensive stance!");
      break;
  }
  
  // Check if enemy is defeated
  if (enemy.isDefeated()) {
    handleEnemyDefeated();
  } else {
    // Enemy turn
    gameState.combatTurn = "ENEMY";
  }
}

export function executeEnemyTurn() {
  const enemy = gameState.currentEnemy;
  const player = gameState.player;
  
  if (!enemy || !player) return;
  
  const damage = enemy.attack(player);
  const actualDamage = player.takeDamage(damage);
  addCombatLog(`${enemy.name} attacks for ${actualDamage} damage!`);
  
  // Check if player is defeated
  if (player.hp <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  } else {
    gameState.combatTurn = "PLAYER";
  }
}

function handleEnemyDefeated() {
  const enemy = gameState.currentEnemy;
  const player = gameState.player;
  
  addCombatLog(`${enemy.name} defeated!`);
  player.gainExp(enemy.expReward);
  gameState.score += enemy.expReward * 10;
  gameState.enemiesDefeated++;
  
  addCombatLog(`Gained ${enemy.expReward} EXP!`);
  
  gameState.combatVictory = true;
  gameState.victoryTimer = 0;
}

export function advanceToNextWave() {
  gameState.waveNumber++;
  
  if (gameState.waveNumber > gameState.totalWaves) {
    // Victory!
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    // Next wave
    gameState.combatVictory = false;
    gameState.playMode = "EXPLORATION";
    gameState.currentEnemy = null;
  }
}

export function addCombatLog(message) {
  gameState.combatLog.push(message);
  if (gameState.combatLog.length > 5) {
    gameState.combatLog.shift();
  }
}