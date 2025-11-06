// input_handler.js - Handle player inputs
import { gameState, GAME_PHASES } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  const player = gameState.player;
  if (!player || player.health <= 0) return;
  
  if (gameState.controlMode === "HUMAN") {
    // Human controls
    if (p.keyIsDown(37)) { // Left arrow
      player.moveLeft();
    }
    if (p.keyIsDown(39)) { // Right arrow
      player.moveRight();
    }
    if (p.keyIsDown(38)) { // Up arrow
      player.jump();
    }
    if (p.keyIsDown(90)) { // Z key
      player.attack();
    }
    if (p.keyIsDown(32)) { // Space
      player.useSkill(0);
    }
    if (p.keyIsDown(16)) { // Shift
      player.useSkill(1);
    }
  } else {
    // Automated testing mode
    const action = get_automated_testing_action(gameState);
    if (action) {
      if (action.left) player.moveLeft();
      if (action.right) player.moveRight();
      if (action.jump) player.jump();
      if (action.attack) player.attack();
      if (action.skill1) player.useSkill(0);
      if (action.skill2) player.useSkill(1);
    }
  }
}

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (p.keyCode === 27) { // ESC
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
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.gameStartTime = Date.now();
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", event: "game_start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.score = 0;
  gameState.wave = 1;
  gameState.enemiesInWave = 0;
  gameState.enemiesDefeated = 0;
  gameState.bossActive = false;
  gameState.waveComplete = false;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.drops = [];
  gameState.player = null;
  
  p.logs.game_info.push({
    data: { phase: "START", event: "game_reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}