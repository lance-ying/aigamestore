import { gameState, GAME_PHASES, ROBOT_MASTERS } from './globals.js';
import { Stage } from './stage.js';

export function handleKeyPressed(p) {
  const key = p.key.toLowerCase();
  const keyCode = p.keyCode;

  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Phase controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else if (keyCode === 82) { // R
    // Manual restart takes priority and clears any pending auto-restart
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
        gameState.gamePhase === GAME_PHASES.START || // Allow R from start screen as well
        gameState.gamePhase === GAME_PHASES.PLAYING || // Allow R from playing/paused
        gameState.gamePhase === GAME_PHASES.PAUSED) {
      resetGame(p);
    }
  }

  // Weapon switch
  if (keyCode === 16 && gameState.gamePhase === GAME_PHASES.PLAYING) { // SHIFT
    gameState.currentWeapon = (gameState.currentWeapon + 1) % gameState.unlockedWeapons.length;
  }
}

export function getKeys(p) {
  // Always return human controls as it's the only mode
  return {
    left: p.keyIsDown(37),   // Arrow Left - HOLD to move continuously
    right: p.keyIsDown(39),  // Arrow Right - HOLD to move continuously
    up: p.keyIsDown(38),     // Arrow Up - HOLD to aim continuously
    down: p.keyIsDown(40),   // Arrow Down - HOLD to aim continuously
    jump: p.keyIsDown(90),   // Z key - HOLD to jump (player.js handles single-jump-per-press)
    shoot: p.keyIsDown(32)   // Space key - HOLD to shoot continuously (with cooldown)
  };
}

// Helper function to reset most game state variables without changing phase or level
function _softResetGameState(p) {
  gameState.currentStage = null;
  gameState.entities = gameState.entities.filter(e => e === gameState.player); // Keep player entity
  if (gameState.player) {
    gameState.player.x = 100; // Reset player position
    gameState.player.y = 100;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
  }
  gameState.robotMastersDefeated = {};
  gameState.unlockedWeapons = ['BUSTER'];
  gameState.currentWeapon = 0;
  gameState.weaponEnergy = {};
  gameState.bossGauntletIndex = 0;
  gameState.wilyStagePhase = 0;
  gameState.score = 0;
  gameState.lives = 5;
  gameState.playerHealth = 28;
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.drops = [];
  gameState.showBossHealthBar = false;
  gameState.stageComplete = false;
  gameState.invincibilityFrames = 0;
  gameState.yokublockTimer = 0;
  gameState.yokublockPattern = [];
  gameState.autoRestartTimer = null; // Reset auto-restart timer
  gameState.camera.x = 0; // Reset camera
}

export function startGame(p) { // Made exportable for autoRestartGame to call
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  loadLevel(p, 1);
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING, level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadLevel(p, levelNum) {
  gameState.currentLevel = levelNum;
  
  // Levels 1-6: Robot Masters (increasing difficulty)
  if (levelNum >= 1 && levelNum <= 6) {
    const bossIndex = levelNum - 1;
    const bossData = ROBOT_MASTERS[bossIndex];
    gameState.currentStage = new Stage('boss', bossData, levelNum);
  } 
  // Level 7: Wily Fortress
  else if (levelNum === 7) {
    gameState.currentStage = new Stage('wily_fortress', null, levelNum);
  }
  // Level 8: Boss Gauntlet
  else if (levelNum === 8) {
    gameState.bossGauntletIndex = 0;
    gameState.currentStage = new Stage('boss_gauntlet', null, levelNum);
  }
  // Level 9+: Victory
  else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    return;
  }
  
  if (gameState.player) {
    gameState.player.x = 50;
    gameState.player.y = 100;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
  }
  
  gameState.camera.x = 0;
  gameState.invincibilityFrames = 60;
}

export function resetGame(p) { // Used for manual 'R' key restart
  _softResetGameState(p); // Reset all common state variables
  gameState.gamePhase = GAME_PHASES.START; // Explicitly set to START phase
  gameState.currentLevel = 0; // Reset level to 0 for a fresh start from title
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function autoRestartGame(p) { // Used for automatic restart after game over
  _softResetGameState(p); // Reset all common state variables
  startGame(p); // Immediately start a new game from level 1
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING, message: "Auto-restarted game from Game Over" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}