// automated_testing_controller.js - Automated testing functions

import { gameState, GAMEPLAY_OVERWORLD, GAMEPLAY_COMBAT, COMBAT_PLAYER_TURN } from './globals.js';

let positionHistory = [];
let stuckCounter = 0;
let lastDirection = null;
let combatStrategy = "aggressive";

function getTestWinAction(gameState) {
  if (gameState.gameplayState === GAMEPLAY_OVERWORLD) {
    return getOverworldExplorationAction();
  } else if (gameState.gameplayState === GAMEPLAY_COMBAT) {
    return getCombatOptimalAction();
  }
  return null;
}

function getOverworldExplorationAction() {
  if (!gameState.player || gameState.player.isMoving) {
    return null;
  }
  
  // Track position to detect being stuck
  const currentPos = { x: gameState.player.x, y: gameState.player.y };
  positionHistory.push(currentPos);
  if (positionHistory.length > 10) {
    positionHistory.shift();
  }
  
  // Check if stuck in same area
  if (positionHistory.length >= 10) {
    const avgX = positionHistory.reduce((sum, p) => sum + p.x, 0) / positionHistory.length;
    const avgY = positionHistory.reduce((sum, p) => sum + p.y, 0) / positionHistory.length;
    const variance = positionHistory.reduce((sum, p) => sum + Math.abs(p.x - avgX) + Math.abs(p.y - avgY), 0);
    
    if (variance < 50) {
      stuckCounter++;
      if (stuckCounter > 5) {
        // Try a random different direction
        const directions = [37, 38, 39, 40];
        lastDirection = directions[Math.floor(Math.random() * directions.length)];
        stuckCounter = 0;
      }
    } else {
      stuckCounter = 0;
    }
  }
  
  // Move to explore and trigger encounters
  // Prefer moving in open areas
  const directions = [37, 38, 39, 40]; // LEFT, UP, RIGHT, DOWN
  
  if (lastDirection) {
    const dir = lastDirection;
    lastDirection = null;
    return { keyCode: dir };
  }
  
  // Move in a pattern to explore
  const pattern = Math.floor(Date.now() / 2000) % 4;
  return { keyCode: directions[pattern] };
}

function getCombatOptimalAction() {
  if (gameState.combatState !== COMBAT_PLAYER_TURN) {
    return null;
  }
  
  const character = gameState.party[gameState.selectedPartyMember];
  if (!character || !character.isAlive()) {
    return null;
  }
  
  // Priority 1: Use break attack if enemy is broken
  const brokenEnemy = gameState.enemies.find(e => e.isStunned && e.isAlive());
  if (brokenEnemy) {
    return { keyCode: 66 }; // B for break attack
  }
  
  // Priority 2: Heal if health is low
  if (character.hp < character.maxHP * 0.3 && gameState.inventory.healthPotion > 0) {
    if (gameState.combatMenu !== "ITEM") {
      // Navigate to item menu
      if (gameState.combatMenu === "MAIN") {
        if (gameState.selectedMenuOption < 2) {
          return { keyCode: 40 }; // DOWN
        } else {
          return { keyCode: 32 }; // SPACE to select
        }
      }
    } else {
      // In item menu, select health potion
      if (gameState.selectedMenuOption !== 0) {
        return { keyCode: 38 }; // UP
      } else {
        return { keyCode: 32 }; // SPACE to use
      }
    }
  }
  
  // Priority 3: Use skills to exploit weaknesses
  const aliveEnemies = gameState.enemies.filter(e => e.isAlive());
  if (aliveEnemies.length > 0) {
    const target = aliveEnemies[0];
    
    // Find skill that matches enemy weakness
    const weaknessSkill = character.skills.findIndex(s => s.element === target.weakness);
    
    if (weaknessSkill !== -1 && character.sp >= character.skills[weaknessSkill].cost) {
      if (gameState.combatMenu !== "SKILL") {
        if (gameState.combatMenu === "MAIN") {
          if (gameState.selectedMenuOption !== 1) {
            return { keyCode: gameState.selectedMenuOption < 1 ? 40 : 38 };
          } else {
            return { keyCode: 32 }; // SPACE to open skill menu
          }
        }
      } else {
        // Navigate to the right skill
        if (gameState.selectedMenuOption < weaknessSkill) {
          return { keyCode: 40 }; // DOWN
        } else if (gameState.selectedMenuOption > weaknessSkill) {
          return { keyCode: 38 }; // UP
        } else {
          return { keyCode: 32 }; // SPACE to use skill
        }
      }
    }
  }
  
  // Priority 4: Regular attack if low on SP or no good skills
  if (gameState.combatMenu === "MAIN") {
    if (gameState.selectedMenuOption !== 0) {
      return { keyCode: 38 }; // UP to attack
    } else {
      return { keyCode: 32 }; // SPACE to attack
    }
  } else {
    return { keyCode: 90 }; // Z to go back to main menu
  }
  
  return null;
}

function getBasicTestAction(gameState) {
  // Simple movement test
  if (gameState.gameplayState === GAMEPLAY_OVERWORLD) {
    if (!gameState.player || gameState.player.isMoving) {
      return null;
    }
    
    const directions = [37, 38, 39, 40];
    const randomDir = directions[Math.floor(Math.random() * directions.length)];
    return { keyCode: randomDir };
  } else if (gameState.gameplayState === GAMEPLAY_COMBAT) {
    if (gameState.combatState === COMBAT_PLAYER_TURN) {
      // Just use basic attacks
      if (gameState.combatMenu === "MAIN" && gameState.selectedMenuOption === 0) {
        return { keyCode: 32 }; // SPACE
      } else {
        return { keyCode: 38 }; // UP
      }
    }
  }
  return null;
}

function getSkillTestAction(gameState) {
  // Test skill usage
  if (gameState.gameplayState === GAMEPLAY_COMBAT && gameState.combatState === COMBAT_PLAYER_TURN) {
    const character = gameState.party[gameState.selectedPartyMember];
    
    if (gameState.combatMenu === "MAIN") {
      if (gameState.selectedMenuOption !== 1) {
        return { keyCode: 40 }; // DOWN to skill
      } else {
        return { keyCode: 32 }; // SPACE to open skill menu
      }
    } else if (gameState.combatMenu === "SKILL") {
      // Try to use first available skill
      if (character.sp >= character.skills[0].cost) {
        return { keyCode: 32 }; // SPACE to use
      } else {
        return { keyCode: 90 }; // Z to go back
      }
    }
  } else if (gameState.gameplayState === GAMEPLAY_OVERWORLD) {
    return getOverworldExplorationAction();
  }
  return null;
}

function getItemTestAction(gameState) {
  // Test item usage
  if (gameState.gameplayState === GAMEPLAY_COMBAT && gameState.combatState === COMBAT_PLAYER_TURN) {
    const character = gameState.party[gameState.selectedPartyMember];
    
    if (character.hp < character.maxHP * 0.5 && gameState.inventory.healthPotion > 0) {
      if (gameState.combatMenu === "MAIN") {
        if (gameState.selectedMenuOption !== 2) {
          return { keyCode: 40 }; // DOWN
        } else {
          return { keyCode: 32 }; // SPACE
        }
      } else if (gameState.combatMenu === "ITEM") {
        return { keyCode: 32 }; // SPACE to use item
      }
    } else {
      // Just attack
      if (gameState.combatMenu !== "MAIN") {
        return { keyCode: 90 }; // Z
      } else if (gameState.selectedMenuOption !== 0) {
        return { keyCode: 38 }; // UP
      } else {
        return { keyCode: 32 }; // SPACE
      }
    }
  } else if (gameState.gameplayState === GAMEPLAY_OVERWORLD) {
    return getOverworldExplorationAction();
  }
  return null;
}

function getRandomAction(gameState) {
  const actions = [37, 38, 39, 40, 32];
  return { keyCode: actions[Math.floor(Math.random() * actions.length)] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getSkillTestAction(gameState);
    case "TEST_4":
      return getItemTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
if (typeof window !== 'undefined') {
  window.get_automated_testing_action = get_automated_testing_action;
}

export default get_automated_testing_action;