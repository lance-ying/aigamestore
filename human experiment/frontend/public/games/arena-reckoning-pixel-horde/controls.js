// controls.js - Input handling

import { gameState, GAME_PHASES, CONTROL_MODES, PLAYER_CONFIG, LEVEL_CONFIGS } from './globals.js';
import { Player } from './player.js';

export function handleHumanInput(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Movement
  player.vx = 0;
  player.vy = 0;
  
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // Left
    player.vx = -player.speed;
  }
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // Right
    player.vx = player.speed;
  }
  if (p.keyIsDown(38) || p.keyIsDown(87)) { // Up
    player.vy = -player.speed;
  }
  if (p.keyIsDown(40) || p.keyIsDown(83)) { // Down
    player.vy = player.speed;
  }
  
  // Normalize diagonal movement
  if (player.vx !== 0 && player.vy !== 0) {
    const factor = 1 / Math.sqrt(2);
    player.vx *= factor;
    player.vy *= factor;
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