// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';

export function handleInput(p) {
  const player = gameState.player;
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING && player) {
    // Get action from appropriate controller
    let action;
    if (gameState.controlMode === "HUMAN") {
      action = getHumanAction(p);
    } else {
      action = window.get_automated_testing_action(gameState);
    }
    
    // Apply action
    if (action) {
      if (action.left) player.moveLeft();
      if (action.right) player.moveRight();
      if (action.jump) player.jump();
      if (action.shoot) player.shoot();
      if (action.dash) player.dash();
    }
  }
}

function getHumanAction(p) {
  const action = {
    left: p.keyIsDown(37),   // LEFT
    right: p.keyIsDown(39),  // RIGHT
    jump: p.keyIsDown(38),   // UP
    shoot: p.keyIsDown(32),  // SPACE
    dash: p.keyIsDown(90)    // Z
  };
  return action;
}

export function setupKeyHandlers(p) {
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        pauseGame(p);
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        unpauseGame(p);
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame(p);
      }
    }
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  // Initialize game
  const { Player } = require('./entities.js');
  const { generateWorld } = require('./world.js');
  
  gameState.player = new Player(p, 50, 100);
  gameState.currentWorld = 1;
  gameState.score = 0;
  gameState.powerGemsCollected = 0;
  gameState.enemiesDefeated = 0;
  gameState.cameraOffsetX = 0;
  gameState.dashUnlocked = false;
  gameState.framesSurvived = 0;
  
  generateWorld(p, gameState.currentWorld);
  gameState.entities.unshift(gameState.player);
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, message: "Game started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.noLoop();
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, message: "Game paused" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.loop();
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, message: "Game unpaused" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.entities = [];
  gameState.enemies = [];
  gameState.projectiles = [];
  gameState.powerGems = [];
  gameState.platforms = [];
  gameState.player = null;
  gameState.boss = null;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, message: "Game restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}