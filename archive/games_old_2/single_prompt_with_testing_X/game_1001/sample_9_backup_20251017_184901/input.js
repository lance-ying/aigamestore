import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, ROBOT_MASTERS } from './globals.js';
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
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  }

  // Stage select
  if (gameState.stageSelectMode) {
    if (key >= '1' && key <= '6') {
      const index = parseInt(key) - 1;
      if (!gameState.robotMastersDefeated[ROBOT_MASTERS[index].name]) {
        startBossStage(p, index);
      }
    } else if (key === '0') {
      const allDefeated = ROBOT_MASTERS.every(rm => gameState.robotMastersDefeated[rm.name]);
      if (allDefeated) {
        startWilyStage(p);
      }
    }
  }

  // Weapon switch
  if (keyCode === 16 && gameState.gamePhase === GAME_PHASES.PLAYING) { // SHIFT
    gameState.currentWeapon = (gameState.currentWeapon + 1) % gameState.unlockedWeapons.length;
  }
}

export function getKeys(p) {
  if (gameState.controlMode === CONTROL_MODES.HUMAN) {
    return {
      left: p.keyIsDown(37),
      right: p.keyIsDown(39),
      up: p.keyIsDown(38),
      down: p.keyIsDown(40),
      jump: p.keyIsDown(90), // Z
      shoot: p.keyIsDown(32) // SPACE
    };
  } else {
    return getTestKeys(p);
  }
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
    // Basic movement test
    if (p.frameCount % 120 < 60) {
      keys.right = true;
    } else {
      keys.left = true;
    }
    if (p.frameCount % 60 === 0) {
      keys.jump = true;
    }
    if (p.frameCount % 30 === 0) {
      keys.shoot = true;
    }
  } else if (gameState.controlMode === CONTROL_MODES.TEST_2) {
    // Win test - aggressive play
    keys.right = true;
    keys.jump = p.frameCount % 40 < 2;
    keys.shoot = p.frameCount % 10 < 5;
    
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
  gameState.stageSelectMode = true;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function startBossStage(p, index) {
  gameState.stageSelectMode = false;
  const bossData = ROBOT_MASTERS[index];
  gameState.currentStage = new Stage('boss', bossData);
  
  if (gameState.player) {
    gameState.player.x = 100;
    gameState.player.y = 100;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
  }
  
  gameState.camera.x = 0;
  gameState.playerHealth = gameState.maxPlayerHealth;
  gameState.invincibilityFrames = 60;
}

function startWilyStage(p) {
  gameState.stageSelectMode = false;
  gameState.wilyStagePhase = 0;
  gameState.currentStage = new Stage('wily_fortress');
  
  if (gameState.player) {
    gameState.player.x = 50;
    gameState.player.y = 100;
    gameState.player.vx = 0;
    gameState.player.vy = 0;
  }
  
  gameState.camera.x = 0;
  gameState.playerHealth = gameState.maxPlayerHealth;
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.stageSelectMode = false;
  gameState.currentStage = null;
  gameState.entities = [];
  gameState.robotMastersDefeated = {};
  gameState.unlockedWeapons = ['BUSTER'];
  gameState.currentWeapon = 0;
  gameState.weaponEnergy = {};
  gameState.bossGauntletIndex = 0;
  gameState.wilyStagePhase = 0;
  gameState.score = 0;
  gameState.lives = 3;
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