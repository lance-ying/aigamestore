// input_handler.js
import { gameState } from './globals.js';
import { loadStage } from './stage_loader.js';

export function handleInput(p) {
  // Game phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      gameState.gamePhase = "PLAYING";
      loadStage(gameState.currentStage, p);
      
      p.logs.game_info.push({
        event: "game_started",
        data: { stage: gameState.currentStage, world: gameState.currentWorld },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        event: "game_paused",
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        event: "game_resumed",
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }

  if (p.keyCode === 82) { // R
    gameState.gamePhase = "START";
    gameState.currentStage = 1;
    gameState.currentWorld = 1;
    gameState.stageProgress = {};
    
    p.logs.game_info.push({
      event: "game_restarted",
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }

  // Gameplay controls (only during PLAYING phase)
  if (gameState.gamePhase !== "PLAYING") return;

  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(p);
  } else {
    handleAutomatedInput(p);
  }
}

function handleHumanInput(p) {
  if (!gameState.player) return;

  const sprinting = p.keyIsDown(16); // Shift

  // Movement
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // Left Arrow or A
    gameState.player.moveLeft(sprinting);
  }
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // Right Arrow or D
    gameState.player.moveRight(sprinting);
  }

  // Jump
  if (p.keyIsDown(32)) { // Space
    if (gameState.player.isGrounded && !gameState.player.isJumping) {
      gameState.player.jump();
    }
  } else {
    gameState.player.stopJump();
  }
}

function handleAutomatedInput(p) {
  if (!gameState.player || !window.get_automated_testing_action) return;

  const action = window.get_automated_testing_action(gameState);
  
  if (!action) return;

  const sprinting = action.sprint || false;

  if (action.left) {
    gameState.player.moveLeft(sprinting);
  }
  if (action.right) {
    gameState.player.moveRight(sprinting);
  }
  if (action.jump) {
    if (gameState.player.isGrounded && !gameState.player.isJumping) {
      gameState.player.jump();
    }
  } else {
    gameState.player.stopJump();
  }
}

export function logKeyPress(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logKeyRelease(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}