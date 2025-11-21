// input.js - Input handling and automated testing

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_SKILL_SELECTION, PHASE_UPGRADE_MENU, KEY_ENTER, KEY_ESC, KEY_SPACE, KEY_SHIFT, KEY_Z, KEY_R, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_W, KEY_A, KEY_S, KEY_D, saveData } from './globals.js';
import { applySkill } from './skills.js';
import { advanceRoom } from './room.js';

export function handleKeyPressed(p, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === PHASE_START) {
    handleStartMenuInput(p, keyCode);
  } else if (gameState.gamePhase === PHASE_UPGRADE_MENU) {
    handleUpgradeMenuInput(p, keyCode);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    handlePlayingInput(p, keyCode);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    handlePausedInput(p, keyCode);
  } else if (gameState.gamePhase === PHASE_SKILL_SELECTION) {
    handleSkillSelectionInput(p, keyCode);
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    handleGameOverInput(p, keyCode);
  }
}

function handleStartMenuInput(p, keyCode) {
  if (keyCode === KEY_ENTER || keyCode === KEY_SPACE) {
    if (gameState.startMenuSelection === 0) {
      // Start game
      startNewGame(p);
    } else if (gameState.startMenuSelection === 1) {
      // Upgrades
      gameState.gamePhase = PHASE_UPGRADE_MENU;
      gameState.upgradeMenuSelection = 0;
    }
  } else if (keyCode === KEY_UP) {
    gameState.startMenuSelection = Math.max(0, gameState.startMenuSelection - 1);
  } else if (keyCode === KEY_DOWN) {
    gameState.startMenuSelection = Math.min(1, gameState.startMenuSelection + 1);
  }
}

function handleUpgradeMenuInput(p, keyCode) {
  const upgrades = [
    { name: "maxHPBonus", cost: 50 },
    { name: "damageBonus", cost: 75 },
    { name: "attackSpeedBonus", cost: 100 },
    { name: "goldBonus", cost: 125 }
  ];
  
  if (keyCode === KEY_SPACE || keyCode === KEY_ENTER) {
    if (gameState.upgradeMenuSelection === 4) {
      // Back
      gameState.gamePhase = PHASE_START;
      saveData();
    } else {
      const upgrade = upgrades[gameState.upgradeMenuSelection];
      if (gameState.totalGold >= upgrade.cost) {
        gameState.totalGold -= upgrade.cost;
        gameState.permanentUpgrades[upgrade.name]++;
        saveData();
      }
    }
  } else if (keyCode === KEY_UP) {
    gameState.upgradeMenuSelection = Math.max(0, gameState.upgradeMenuSelection - 1);
  } else if (keyCode === KEY_DOWN) {
    gameState.upgradeMenuSelection = Math.min(4, gameState.upgradeMenuSelection + 1);
  }
}

function handlePlayingInput(p, keyCode) {
  if (keyCode === KEY_ESC) {
    gameState.gamePhase = PHASE_PAUSED;
    gameState.pauseMenuSelection = 0;
    p.logs.game_info.push({
      data: { phase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handlePausedInput(p, keyCode) {
  if (keyCode === KEY_ESC) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (keyCode === KEY_SPACE || keyCode === KEY_ENTER) {
    if (gameState.pauseMenuSelection === 0) {
      // Resume
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.pauseMenuSelection === 1) {
      // Main menu
      returnToMainMenu(p);
    }
  } else if (keyCode === KEY_UP) {
    gameState.pauseMenuSelection = Math.max(0, gameState.pauseMenuSelection - 1);
  } else if (keyCode === KEY_DOWN) {
    gameState.pauseMenuSelection = Math.min(1, gameState.pauseMenuSelection + 1);
  }
}

function handleSkillSelectionInput(p, keyCode) {
  let selectedIndex = -1;
  
  if (keyCode === KEY_SPACE) {
    selectedIndex = 0;
  } else if (keyCode === KEY_Z) {
    selectedIndex = 1;
  } else if (keyCode === KEY_SHIFT) {
    selectedIndex = 2;
  }
  
  if (selectedIndex >= 0 && selectedIndex < gameState.skillOptions.length) {
    const skill = gameState.skillOptions[selectedIndex];
    applySkill(skill.id, gameState.player);
    
    gameState.gamePhase = PHASE_PLAYING;
    advanceRoom(p);
    
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, skillSelected: skill.id },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleGameOverInput(p, keyCode) {
  if (keyCode === KEY_R) {
    returnToMainMenu(p);
  }
}

export function updatePlayerMovement(p) {
  if (!gameState.player || gameState.gamePhase !== PHASE_PLAYING) return;
  
  let dx = 0;
  let dy = 0;
  
  if (gameState.controlMode === "HUMAN") {
    if (p.keyIsDown(KEY_LEFT) || p.keyIsDown(KEY_A)) dx -= 1;
    if (p.keyIsDown(KEY_RIGHT) || p.keyIsDown(KEY_D)) dx += 1;
    if (p.keyIsDown(KEY_UP) || p.keyIsDown(KEY_W)) dy -= 1;
    if (p.keyIsDown(KEY_DOWN) || p.keyIsDown(KEY_S)) dy += 1;
  } else {
    // Automated testing
    const action = getAutomatedAction(p);
    dx = action.dx;
    dy = action.dy;
  }
  
  const isMoving = dx !== 0 || dy !== 0;
  gameState.player.isMoving = isMoving;
  
  if (isMoving) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx = (dx / length) * gameState.player.speed;
    dy = (dy / length) * gameState.player.speed;
    
    gameState.player.x += dx;
    gameState.player.y += dy;
    
    // Keep in bounds
    const margin = 40;
    gameState.player.x = Math.max(margin, Math.min(CANVAS_WIDTH - margin, gameState.player.x));
    gameState.player.y = Math.max(margin, Math.min(CANVAS_HEIGHT - margin, gameState.player.y));
  }
}

function getAutomatedAction(p) {
  // Basic automated testing: move randomly and avoid enemies
  let dx = 0;
  let dy = 0;
  
  if (gameState.controlMode === "TEST_1") {
    // Basic movement - circle around center
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const angle = p.frameCount * 0.02;
    const targetX = centerX + Math.cos(angle) * 100;
    const targetY = centerY + Math.sin(angle) * 80;
    
    dx = targetX - gameState.player.x;
    dy = targetY - gameState.player.y;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 5) {
      dx = dx / dist;
      dy = dy / dist;
    } else {
      dx = 0;
      dy = 0;
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Win mode - stay still and let auto-attack work, dodge when needed
    if (gameState.enemies.length > 0) {
      // Find closest enemy
      let closestDist = Infinity;
      let closestEnemy = null;
      
      for (const enemy of gameState.enemies) {
        if (enemy.hp > 0) {
          const dist = Math.sqrt(
            Math.pow(enemy.x - gameState.player.x, 2) + 
            Math.pow(enemy.y - gameState.player.y, 2)
          );
          if (dist < closestDist) {
            closestDist = dist;
            closestEnemy = enemy;
          }
        }
      }
      
      // If enemy too close, dodge
      if (closestEnemy && closestDist < 80) {
        dx = gameState.player.x - closestEnemy.x;
        dy = gameState.player.y - closestEnemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          dx = dx / dist;
          dy = dy / dist;
        }
      }
      
      // Check for incoming projectiles
      for (const proj of gameState.projectiles) {
        if (!proj.isPlayerProjectile) {
          const dist = Math.sqrt(
            Math.pow(proj.x - gameState.player.x, 2) + 
            Math.pow(proj.y - gameState.player.y, 2)
          );
          if (dist < 50) {
            // Dodge perpendicular to projectile direction
            dx += -proj.vy;
            dy += proj.vx;
          }
        }
      }
    }
  }
  
  return { dx, dy };
}

export function handleAutomatedSkillSelection(p) {
  if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_SKILL_SELECTION) {
    // Auto-select first skill after a short delay
    if (p.frameCount % 30 === 0) {
      handleSkillSelectionInput(p, KEY_SPACE);
    }
  }
}

function startNewGame(p) {
  const { Player } = require('./entities.js');
  const { loadRoom } = require('./room.js');
  const { loadSavedData } = require('./globals.js');
  
  // Reset game state
  loadSavedData();
  gameState.score = 0;
  gameState.gold = 0;
  gameState.currentLevel = 1;
  gameState.currentRoom = 1;
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.enemies = [];
  gameState.currentSkills = [];
  gameState.roomCleared = false;
  gameState.levelTransitionTimer = 180;
  gameState.roomEnemiesKilled = 0;
  gameState.levelEnemiesKilled = 0;
  
  // Create player
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  gameState.entities.push(gameState.player);
  
  // Load first room
  loadRoom(p);
  
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, event: "game_start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function returnToMainMenu(p) {
  saveData();
  
  gameState.gamePhase = PHASE_START;
  gameState.startMenuSelection = 0;
  gameState.player = null;
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.enemies = [];
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}