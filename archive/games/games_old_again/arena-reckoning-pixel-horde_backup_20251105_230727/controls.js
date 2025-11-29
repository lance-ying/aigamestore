// controls.js - Input handling and automated testing

import { gameState, GAME_PHASES, CONTROL_MODES, PLAYER_CONFIG, LEVEL_CONFIGS } from './globals.js';
import { Player } from './player.js';

// Track key states for tap detection
const prevKeyStates = {
  left: false,
  right: false,
  up: false,
  down: false
};

const currKeyStates = {
  left: false,
  right: false,
  up: false,
  down: false
};

// Target position for smooth movement
let targetX = null;
let targetY = null;
let isMovingToTarget = false;

export function handleHumanInput(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Update current key states
  currKeyStates.left = p.keyIsDown(37) || p.keyIsDown(65);
  currKeyStates.right = p.keyIsDown(39) || p.keyIsDown(68);
  currKeyStates.up = p.keyIsDown(38) || p.keyIsDown(87);
  currKeyStates.down = p.keyIsDown(40) || p.keyIsDown(83);
  
  // Tap-based movement distance (same as before)
  const tapDistance = 25;
  
  // Detect taps (key just pressed this frame, not held from previous frame)
  const leftTapped = currKeyStates.left && !prevKeyStates.left;
  const rightTapped = currKeyStates.right && !prevKeyStates.right;
  const upTapped = currKeyStates.up && !prevKeyStates.up;
  const downTapped = currKeyStates.down && !prevKeyStates.down;
  
  // If a tap occurred, set new target position
  if (leftTapped || rightTapped || upTapped || downTapped) {
    // Calculate discrete movement vector
    let dx = 0;
    let dy = 0;
    
    if (leftTapped) dx -= tapDistance;
    if (rightTapped) dx += tapDistance;
    if (upTapped) dy -= tapDistance;
    if (downTapped) dy += tapDistance;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      const factor = 1 / Math.sqrt(2);
      dx *= factor;
      dy *= factor;
    }
    
    // Set target position
    targetX = player.x + dx;
    targetY = player.y + dy;
    isMovingToTarget = true;
  }
  
  // Smooth movement towards target
  if (isMovingToTarget && targetX !== null && targetY !== null) {
    const distToTarget = Math.sqrt(
      Math.pow(targetX - player.x, 2) + 
      Math.pow(targetY - player.y, 2)
    );
    
    // If close enough to target, snap to it and stop
    if (distToTarget < 0.5) {
      player.x = targetX;
      player.y = targetY;
      isMovingToTarget = false;
      player.vx = 0;
      player.vy = 0;
    } else {
      // Smooth easing towards target (ease-out)
      // Move 20% of remaining distance each frame for smooth deceleration
      const easeFactor = 0.2;
      const dx = (targetX - player.x) * easeFactor;
      const dy = (targetY - player.y) * easeFactor;
      
      player.x += dx;
      player.y += dy;
      
      // Set velocity for visual effects (if needed)
      player.vx = dx;
      player.vy = dy;
    }
  } else {
    // No movement
    player.vx = 0;
    player.vy = 0;
  }
  
  // Update previous key states for next frame
  prevKeyStates.left = currKeyStates.left;
  prevKeyStates.right = currKeyStates.right;
  prevKeyStates.up = currKeyStates.up;
  prevKeyStates.down = currKeyStates.down;
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
  
  // Reset movement state
  targetX = null;
  targetY = null;
  isMovingToTarget = false;
  
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
  
  // Reset movement state
  targetX = null;
  targetY = null;
  isMovingToTarget = false;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}