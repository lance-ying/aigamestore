// input.js - Input handling

import { gameState, GAME_PHASES, PLAY_MODES } from './globals.js';
import { executePlayerAction } from './combat.js';

export function handleMenuNavigation(p, keyCode) {
  if (gameState.playMode !== "COMBAT") return;
  
  if (gameState.menuState === "MAIN") {
    handleMainMenuInput(keyCode);
  } else if (gameState.menuState === "WEAPON_SELECT") {
    handleWeaponSelectInput(keyCode);
  } else if (gameState.menuState === "SKILL_SELECT") {
    handleSkillSelectInput(keyCode);
  }
}

function handleMainMenuInput(keyCode) {
  // Main combat menu: Attack, Skills, Charge, Defend
  if (keyCode === 38) { // UP
    gameState.selectedAction = (gameState.selectedAction - 1 + 4) % 4;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedAction = (gameState.selectedAction + 1) % 4;
  } else if (keyCode === 32) { // SPACE
    if (gameState.selectedAction === 0) {
      // Attack
      executePlayerAction("ATTACK");
    } else if (gameState.selectedAction === 1) {
      // Skills - go to weapon selection
      gameState.menuState = "WEAPON_SELECT";
      gameState.selectedWeapon = 0;
    } else if (gameState.selectedAction === 2) {
      // Charge
      executePlayerAction("CHARGE");
    } else if (gameState.selectedAction === 3) {
      // Defend
      executePlayerAction("DEFEND");
    }
  }
}

function handleWeaponSelectInput(keyCode) {
  if (keyCode === 38) { // UP
    gameState.selectedWeapon = (gameState.selectedWeapon - 1 + 3) % 3;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedWeapon = (gameState.selectedWeapon + 1) % 3;
  } else if (keyCode === 32) { // SPACE
    // Select weapon, go to skill selection
    gameState.menuState = "SKILL_SELECT";
    gameState.selectedSkill = 0;
  } else if (keyCode === 90) { // Z (back)
    gameState.menuState = "MAIN";
  }
}

function handleSkillSelectInput(keyCode) {
  const weapon = gameState.player.weapons[gameState.selectedWeapon];
  const skillCount = weapon.skills.length;
  
  if (keyCode === 38) { // UP
    gameState.selectedSkill = (gameState.selectedSkill - 1 + skillCount) % skillCount;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedSkill = (gameState.selectedSkill + 1) % skillCount;
  } else if (keyCode === 32) { // SPACE
    // Execute skill
    executePlayerAction("SKILL", gameState.selectedWeapon, gameState.selectedSkill);
    gameState.menuState = "MAIN";
  } else if (keyCode === 90) { // Z (back)
    gameState.menuState = "WEAPON_SELECT";
  }
}

export function handleExplorationInput(p, keyCode) {
  if (gameState.playMode !== "EXPLORATION") return;
  
  const speed = 3;
  
  if (keyCode === 37) { // LEFT
    gameState.playerPosition.x = Math.max(50, gameState.playerPosition.x - speed);
  } else if (keyCode === 39) { // RIGHT
    gameState.playerPosition.x = Math.min(550, gameState.playerPosition.x + speed);
  } else if (keyCode === 38) { // UP
    gameState.playerPosition.y = Math.max(50, gameState.playerPosition.y - speed);
  } else if (keyCode === 40) { // DOWN
    gameState.playerPosition.y = Math.min(350, gameState.playerPosition.y + speed);
  }
}