import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { selectUpgrade } from './upgrades.js';

export function handleKeyPressed(p) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER - Start game
  if (p.keyCode === 13 && gameState.gamePhase === PHASE_START) {
    startGame(p);
    return;
  }
  
  // ESC - Pause/Unpause
  if (p.keyCode === 27) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.loop();
    }
    return;
  }
  
  // R - Restart
  if (p.keyCode === 82) {
    restartGame(p);
    return;
  }
  
  // Upgrade selection (during level up)
  if (gameState.pendingLevelUp && gameState.gamePhase === PHASE_PLAYING) {
    if (p.keyCode === 49) selectUpgrade(0); // 1
    if (p.keyCode === 50) selectUpgrade(1); // 2
    if (p.keyCode === 51) selectUpgrade(2); // 3
    
    if (!gameState.pendingLevelUp) {
      p.loop(); // Resume game after selecting upgrade
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING && !gameState.pendingLevelUp) {
    if (p.keyCode === 32) { // Space - Dash
      if (gameState.player) gameState.player.dash(p);
    }
    if (p.keyCode === 90) { // Z - Special ability
      if (gameState.player) gameState.player.useSpecialAbility(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = PHASE_PLAYING;
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, event: "game_started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  // Reset game state
  gameState.gamePhase = PHASE_START;
  gameState.player = null;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.experienceOrbs = [];
  gameState.particles = [];
  gameState.score = 0;
  gameState.elapsedTime = 0;
  gameState.waveLevel = 1;
  gameState.nextWaveTime = 30 * 60;
  gameState.bossTime = 5 * 60 * 60;
  gameState.currentBoss = null;
  gameState.pendingLevelUp = false;
  gameState.upgradeChoices = [];
  gameState.cameraShake = 0;
  
  // Resume loop if paused
  p.loop();
  
  // Log restart
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, event: "game_restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updatePlayerMovement(p) {
  if (!gameState.player || gameState.pendingLevelUp) return;
  
  const speed = gameState.player.moveSpeed * gameState.player.speedMultiplier;
  let vx = 0;
  let vy = 0;
  
  if (p.keyIsDown(37) || p.keyIsDown(65)) vx -= speed; // Left
  if (p.keyIsDown(39) || p.keyIsDown(68)) vx += speed; // Right
  if (p.keyIsDown(38) || p.keyIsDown(87)) vy -= speed; // Up
  if (p.keyIsDown(40) || p.keyIsDown(83)) vy += speed; // Down
  
  // Normalize diagonal movement
  if (vx !== 0 && vy !== 0) {
    const mag = Math.sqrt(vx * vx + vy * vy);
    vx = (vx / mag) * speed;
    vy = (vy / mag) * speed;
  }
  
  gameState.player.vx = vx;
  gameState.player.vy = vy;
  
  // Update angle for dash
  if (vx !== 0 || vy !== 0) {
    gameState.player.angle = p.atan2(vy, vx);
  }
}