// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, GAMEPLAY_OVERWORLD, GAMEPLAY_COMBAT, COMBAT_PLAYER_TURN } from './globals.js';
import { executeCombatAction } from './combat.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase-specific controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { event: "pause" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { event: "unpause" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && gameState.gameplayState === GAMEPLAY_OVERWORLD) {
    handleOverworldInput(p, keyCode);
  } else if (gameState.gamePhase === PHASE_PLAYING && gameState.gameplayState === GAMEPLAY_COMBAT) {
    handleCombatInput(p, keyCode);
  }
  
  gameState.keysPressed[keyCode] = true;
}

export function handleKeyReleased(p, keyCode) {
  gameState.keysPressed[keyCode] = false;
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.gameplayState = GAMEPLAY_OVERWORLD;
  
  p.logs.game_info.push({
    data: { event: "game_start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  // Reset to start screen
  gameState.gamePhase = PHASE_START;
  gameState.gameplayState = GAMEPLAY_OVERWORLD;
  gameState.combatState = null;
  gameState.score = 0;
  gameState.infamy = 0;
  gameState.level = 1;
  gameState.battlesWon = 0;
  gameState.encounterTimer = 0;
  gameState.inventory = { healthPotion: 3, manaPotion: 2 };
  
  // Reset party
  if (gameState.party.length > 0) {
    gameState.party.forEach(member => {
      member.hp = member.maxHP;
      member.sp = member.maxSP;
      member.level = 1;
      member.breakDamage = 0;
    });
  }
  
  // Reset player position
  if (gameState.player) {
    gameState.player.x = 64;
    gameState.player.y = 64;
    gameState.player.targetX = 64;
    gameState.player.targetY = 64;
    gameState.player.isMoving = false;
  }
  
  p.logs.game_info.push({
    data: { event: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleOverworldInput(p, keyCode) {
  if (!gameState.player || gameState.player.isMoving) return;
  
  const moveSpeed = p.keyIsDown(16) ? 64 : 32; // Shift for sprint
  let newX = gameState.player.x;
  let newY = gameState.player.y;
  
  if (keyCode === 37 || keyCode === 65) { // LEFT or A
    newX -= moveSpeed;
  } else if (keyCode === 39 || keyCode === 68) { // RIGHT or D
    newX += moveSpeed;
  } else if (keyCode === 38 || keyCode === 87) { // UP or W
    newY -= moveSpeed;
  } else if (keyCode === 40 || keyCode === 83) { // DOWN or S
    newY += moveSpeed;
  }
  
  // Check if new position is walkable
  if (gameState.map && gameState.map.isWalkable(newX, newY)) {
    gameState.player.moveTo(newX, newY);
    gameState.lastMoveTime = p.frameCount;
  }
}

function handleCombatInput(p, keyCode) {
  if (gameState.combatState !== COMBAT_PLAYER_TURN) return;
  
  const character = gameState.party[gameState.selectedPartyMember];
  if (!character || !character.isAlive()) return;
  
  if (keyCode === 90) { // Z - Back
    if (gameState.combatMenu === "SKILL" || gameState.combatMenu === "ITEM") {
      gameState.combatMenu = "MAIN";
      gameState.selectedMenuOption = 0;
    }
    return;
  }
  
  if (keyCode === 38 || keyCode === 87) { // UP
    gameState.selectedMenuOption = Math.max(0, gameState.selectedMenuOption - 1);
  } else if (keyCode === 40 || keyCode === 83) { // DOWN
    if (gameState.combatMenu === "MAIN") {
      gameState.selectedMenuOption = Math.min(2, gameState.selectedMenuOption + 1);
    } else if (gameState.combatMenu === "SKILL") {
      gameState.selectedMenuOption = Math.min(Math.min(2, character.skills.length - 1), gameState.selectedMenuOption + 1);
    } else if (gameState.combatMenu === "ITEM") {
      gameState.selectedMenuOption = Math.min(1, gameState.selectedMenuOption + 1);
    }
  } else if (keyCode === 32) { // SPACE - Confirm
    if (gameState.combatMenu === "MAIN") {
      if (gameState.selectedMenuOption === 0) {
        // Attack
        executeCombatAction(p, { type: "ATTACK" });
      } else if (gameState.selectedMenuOption === 1) {
        // Skill
        gameState.combatMenu = "SKILL";
        gameState.selectedMenuOption = 0;
      } else if (gameState.selectedMenuOption === 2) {
        // Item
        gameState.combatMenu = "ITEM";
        gameState.selectedMenuOption = 0;
      }
    } else if (gameState.combatMenu === "SKILL") {
      const skillIndex = gameState.selectedMenuOption;
      if (skillIndex < character.skills.length) {
        const skill = character.skills[skillIndex];
        if (character.sp >= skill.cost) {
          // Determine target
          const target = skill.element === "SUPPORT" ? character : gameState.enemies.find(e => e.isAlive());
          executeCombatAction(p, { type: "SKILL", skillIndex, target });
        }
      }
    } else if (gameState.combatMenu === "ITEM") {
      if (gameState.selectedMenuOption === 0 && gameState.inventory.healthPotion > 0) {
        executeCombatAction(p, { type: "ITEM", itemType: "healthPotion" });
      } else if (gameState.selectedMenuOption === 1 && gameState.inventory.manaPotion > 0) {
        executeCombatAction(p, { type: "ITEM", itemType: "manaPotion" });
      }
    }
  }
  
  // Break attack (when enemy is broken)
  if (keyCode === 66) { // B key
    const brokenEnemy = gameState.enemies.find(e => e.isStunned && e.isAlive());
    if (brokenEnemy) {
      executeCombatAction(p, { type: "BREAK_ATTACK", target: brokenEnemy });
    }
  }
}