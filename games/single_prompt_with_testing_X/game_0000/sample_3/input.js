// input.js - Input handling

import { gameState, GAME_PHASES, SCREENS } from './globals.js';
import { collectNotification } from './combat.js';
import { navigateUpgradeMenu, purchaseUpgrade } from './upgrade.js';

export function handleKeyPress(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame(p);
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(keyCode);
  }
}

function handleGameplayInput(keyCode) {
  // SPACE - Collect notifications
  if (keyCode === 32) {
    const notifications = gameState.notifications.filter(n => !n.collected);
    if (notifications.length > 0) {
      collectNotification(notifications[0]);
    }
  }
  
  // LEFT/RIGHT - Switch screens
  if (keyCode === 37) { // LEFT
    gameState.currentScreen = SCREENS.COMBAT;
  }
  if (keyCode === 39) { // RIGHT
    gameState.currentScreen = SCREENS.UPGRADE;
  }
  
  // UP/DOWN - Navigate upgrade menu (when on upgrade screen)
  if (gameState.currentScreen === SCREENS.UPGRADE) {
    if (keyCode === 38) { // UP
      navigateUpgradeMenu("up");
    }
    if (keyCode === 40) { // DOWN
      navigateUpgradeMenu("down");
    }
    
    // Z - Purchase upgrade
    if (keyCode === 90) { // Z
      const upgrade = gameState.upgradeMenu.upgrades[gameState.upgradeMenu.selectedIndex];
      purchaseUpgrade(upgrade);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Initialize player position
  logPlayerInfo(p);
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset to initial state
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentScreen = SCREENS.COMBAT;
  
  // Reset player
  gameState.player.level = 1;
  gameState.player.exp = 0;
  gameState.player.expToLevel = 100;
  gameState.player.gold = 0;
  gameState.player.baseAttack = 10;
  gameState.player.baseDefense = 5;
  gameState.player.baseMaxHp = 100;
  gameState.player.attack = 10;
  gameState.player.defense = 5;
  gameState.player.maxHp = 100;
  gameState.player.hp = 100;
  
  // Reset equipment
  gameState.equipment = {
    weapon: null,
    armor: null,
    accessory: null
  };
  
  // Reset combat
  gameState.combat = {
    enemy: null,
    isInCombat: false,
    combatTimer: 0,
    attackCooldown: 0,
    enemyAttackCooldown: 0,
    playerTurn: true
  };
  
  // Reset progression
  gameState.currentZone = 1;
  gameState.zoneProgress = 0;
  gameState.zonesCleared = 0;
  gameState.enemiesDefeated = 0;
  gameState.bossesDefeated = 0;
  
  // Clear logs and notifications
  gameState.notifications = [];
  gameState.combatLog = [];
  
  // Reset upgrade menu
  gameState.upgradeMenu.selectedIndex = 0;
  gameState.upgradeMenu.scrollOffset = 0;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: 150,
    screen_y: 150,
    game_x: 150,
    game_y: 150,
    framecount: p.frameCount
  });
}