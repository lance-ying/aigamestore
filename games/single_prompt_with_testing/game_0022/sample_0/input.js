// input.js - Input handling

import { gameState, MOVE_SPEED } from './globals.js';

export function handleInput(p) {
  const player = gameState.player;
  if (!player) return;

  let action = null;

  // Get action from automated testing if in test mode
  if (gameState.controlMode !== "HUMAN") {
    if (typeof window.get_automated_testing_action === 'function') {
      action = window.get_automated_testing_action(gameState);
    }
  }

  // Movement
  if (action?.left || (gameState.controlMode === "HUMAN" && p.keyIsDown(37))) {
    if (!player.isDashing) {
      player.vx = -MOVE_SPEED;
      player.facingRight = false;
    }
  }
  if (action?.right || (gameState.controlMode === "HUMAN" && p.keyIsDown(39))) {
    if (!player.isDashing) {
      player.vx = MOVE_SPEED;
      player.facingRight = true;
    }
  }

  // Look up
  player.lookingUp = action?.up || (gameState.controlMode === "HUMAN" && p.keyIsDown(38));
}

let spacePressed = false;
let downPressed = false;
let shiftPressed = false;

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  const player = gameState.player;

  // Game phase transitions
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.noLoop();
      p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.loop();
      p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      resetGame();
      p.logs.game_info.push({
        data: { phase: "START" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  // Gameplay controls
  if (gameState.gamePhase !== "PLAYING" || !player) return;

  // Jump - Space
  if (p.keyCode === 32 && !spacePressed) {
    spacePressed = true;
    player.jump();
  }

  // Ground pound - Down arrow
  if (p.keyCode === 40 && !downPressed) {
    downPressed = true;
    player.startGroundPound();
  }

  // Dash - Shift
  if (p.keyCode === 16 && !shiftPressed) {
    shiftPressed = true;
    player.startDash();
  }
}

export function handleKeyReleased(p) {
  if (p.keyCode === 32) {
    spacePressed = false;
  }
  if (p.keyCode === 40) {
    downPressed = false;
  }
  if (p.keyCode === 16) {
    shiftPressed = false;
  }
}

function resetGame() {
  const { initializeWorld } = require('./world.js');
  const { Player } = require('./entities.js');
  
  gameState.gamePhase = "START";
  gameState.score = 0;
  gameState.abilities = {
    doubleJump: false,
    groundPound: false,
    dash: false
  };
  gameState.worldSaturation = 0;
  gameState.cameraY = 0;
  gameState.goalReached = false;
  gameState.particles = [];
  gameState.player = new Player(100, 300);
  gameState.entities = [gameState.player];
  initializeWorld();
}