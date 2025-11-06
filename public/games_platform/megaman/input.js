import { gameState, GAME_PHASES, CONTROL_MODES, ROBOT_MASTERS } from './globals.js';
import { Stage } from './stage.js';

// Track key taps (keys pressed this frame) for actions like jump and shoot
const keyTaps = {
  jump: false,
  shoot: false
};

// Track previous frame key states for edge detection
const prevKeyStates = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  shoot: false
};

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
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  }

  // Weapon switch
  if (keyCode === 16 && gameState.gamePhase === GAME_PHASES.PLAYING) { // SHIFT
    gameState.currentWeapon = (gameState.currentWeapon + 1) % gameState.unlockedWeapons.length;
  }
}

export function getKeys(p) {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    // Get current key states
    const currentStates = {
      left: p.keyIsDown(37),   // Arrow Left
      right: p.keyIsDown(39),  // Arrow Right
      up: p.keyIsDown(38),     // Arrow Up
      down: p.keyIsDown(40),   // Arrow Down
      jump: p.keyIsDown(90),   // Z key = 90
      shoot: p.keyIsDown(32)   // Space key = 32
    };

    // Set taps for newly pressed keys (jump and shoot only)
    keyTaps.jump = currentStates.jump && !prevKeyStates.jump;
    keyTaps.shoot = currentStates.shoot && !prevKeyStates.shoot;

    // Update previous states
    prevKeyStates.left = currentStates.left;
    prevKeyStates.right = currentStates.right;
    prevKeyStates.up = currentStates.up;
    prevKeyStates.down = currentStates.down;
    prevKeyStates.jump = currentStates.jump;
    prevKeyStates.shoot = currentStates.shoot;

    // Return continuous hold states for movement, taps for actions
    return {
      left: currentStates.left,      // Hold-based
      right: currentStates.right,    // Hold-based
      up: currentStates.up,          // Hold-based
      down: currentStates.down,      // Hold-based
      jump: keyTaps.jump,            // Tap-based
      shoot: keyTaps.shoot           // Tap-based
    };
  } else {
    return getTestKeys(p);
  }
}

export function clearKeyTaps() {
  // Clear taps after they've been read
  keyTaps.jump = false;
  keyTaps.shoot = false;
}

function getTestKeys(p) {
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    shoot: false
  };

  if (gameState.controlMode === CONTROL_MODES.TEST_1) {
    // Basic movement test - hold for movement, tap for actions
    if (p.frameCount % 120 < 60) {
      keys.right = true;
    } else {
      keys.left = true;
    }
    if (p.frameCount % 60 === 15) {
      keys.jump = true;
    }
    if (p.frameCount % 30 === 0) {
      keys.shoot = true;
    }
  } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    // Win test - aggressive play
    keys.right = true; // Hold right
    if (p.frameCount % 40 === 0) {
      keys.jump = true;
    }
    if (p.frameCount % 10 === 0) {
      keys.shoot = true;
    }
    
    if (gameState.player && gameState.entities.length > 1) {
      const nearestEnemy = gameState.entities.find(e => e !== gameState.player);
      if (nearestEnemy) {
        if (nearestEnemy.y < gameState.player.y - 20) {
          keys.up = true;
        } else if (nearestEnemy.y > gameState.player.y + 20) {
          keys.down = true;
        }
      }
    }
  }

  return keys;
}

function startGame(p) {
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

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentStage = null;
  gameState.currentLevel = 0;
  gameState.entities = [];
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
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}