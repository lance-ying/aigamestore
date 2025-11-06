// controls.js - Input handling and automated testing

import { gameState, GAME_PHASES, CONTROL_MODES, PLAYER_CONFIG, LEVEL_CONFIGS } from './globals.js';
import { Player } from './player.js';

export function handleHumanInput(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Reset velocity at the start of each frame
  player.vx = 0;
  player.vy = 0;
  
  // Check current key states for arrow keys and WASD
  const leftHeld = p.keyIsDown(37) || p.keyIsDown(65);   // Left arrow or A
  const rightHeld = p.keyIsDown(39) || p.keyIsDown(68);  // Right arrow or D
  const upHeld = p.keyIsDown(38) || p.keyIsDown(87);     // Up arrow or W
  const downHeld = p.keyIsDown(40) || p.keyIsDown(83);   // Down arrow or S
  
  // Calculate movement direction based on held keys
  let dx = 0;
  let dy = 0;
  
  if (leftHeld) dx -= 1;
  if (rightHeld) dx += 1;
  if (upHeld) dy -= 1;
  if (downHeld) dy += 1;
  
  // Normalize diagonal movement to prevent faster diagonal speed
  if (dx !== 0 && dy !== 0) {
    const factor = 1 / Math.sqrt(2);
    dx *= factor;
    dy *= factor;
  }
  
  // Apply velocity continuously based on held keys
  if (dx !== 0 || dy !== 0) {
    player.vx = dx * player.speed;
    player.vy = dy * player.speed;
  }
}

export function handleTestingInput(p) {
  const player = gameState.player;
  if (!player) return;
  
  gameState.testingFrameCount++;
  
  if (gameState.controlMode === CONTROL_MODES.TEST_1) {
    // Basic movement test - move in a circle
    const angle = gameState.testingFrameCount * 0.05;
    player.vx = Math.cos(angle) * player.speed;
    player.vy = Math.sin(angle) * player.speed;
    
    // Auto-select upgrades
    if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
      setTimeout(() => {
        selectUpgrade(p, 0);
      }, 500);
    }
  } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    // Win test - aggressive play
    if (gameState.enemies.length > 0) {
      const target = gameState.enemies[0];
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 100) {
        player.vx = (dx / dist) * player.speed;
        player.vy = (dy / dist) * player.speed;
      } else {
        // Circle strafe
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        player.vx = Math.cos(angle) * player.speed;
        player.vy = Math.sin(angle) * player.speed;
      }
    } else {
      player.vx = 0;
      player.vy = 0;
    }
    
    // Auto-select best upgrades
    if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
      setTimeout(() => {
        // Prefer weapons, then stats
        let bestIndex = 0;
        for (let i = 0; i < gameState.availableUpgrades.length; i++) {
          if (gameState.availableUpgrades[i].type === "WEAPON") {
            bestIndex = i;
            break;
          }
        }
        selectUpgrade(p, bestIndex);
      }, 100);
    }
  }
}

export function selectUpgrade(p, index) {
  if (gameState.gamePhase !== GAME_PHASES.UPGRADE_SELECTION) return;
  if (index < 0 || index >= gameState.availableUpgrades.length) return;
  
  const upgrade = gameState.availableUpgrades[index];
  gameState.player.applyUpgrade(upgrade);
  
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { phase: "PLAYING", upgradeApplied: upgrade.name },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleKeyPressed(p) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (p.keyCode === 13) {
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  }
  
  // ESC or Shift - Pause/Unpause
  if (p.keyCode === 27 || p.keyCode === 16) {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    if (gameState.gamePhase.includes("GAME_OVER")) {
      resetGame(p);
    }
  }
  
  // Space - Upgrade selection
  if (p.keyCode === 32) {
    if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
      selectUpgrade(p, gameState.selectedUpgradeIndex);
    }
  }
  
  // Arrow keys - Navigate upgrades
  if (gameState.gamePhase === GAME_PHASES.UPGRADE_SELECTION) {
    if (p.keyCode === 37) { // Left
      gameState.selectedUpgradeIndex = Math.max(0, gameState.selectedUpgradeIndex - 1);
    }
    if (p.keyCode === 39) { // Right
      gameState.selectedUpgradeIndex = Math.min(gameState.availableUpgrades.length - 1, gameState.selectedUpgradeIndex + 1);
    }
  }
}

function startGame(p) {
  // Initialize player
  gameState.player = new Player(PLAYER_CONFIG.startX, PLAYER_CONFIG.startY);
  gameState.entities = [gameState.player];
  gameState.projectiles = [];
  gameState.expGems = [];
  gameState.enemies = [];
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.levelStartTime = Date.now();
  gameState.levelDuration = LEVEL_CONFIGS[1].duration;
  gameState.lastEnemySpawn = 0;
  gameState.bossSpawned = false;
  gameState.miniBossSpawned = false;
  gameState.bossDefeated = false;
  gameState.testingFrameCount = 0;
  
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.player = null;
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.expGems = [];
  gameState.enemies = [];
  gameState.availableUpgrades = [];
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}