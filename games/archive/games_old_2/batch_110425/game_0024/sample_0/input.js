// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame();
    }
  } else if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame();
    }
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame();
    }
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.player) {
    if (keyCode === 32) { // SPACE
      gameState.player.interact(p);
    } else if (keyCode === 90) { // Z
      gameState.player.useItem(p);
    }
  }
}

export function handleKeyReleased(p, key, keyCode) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processMovement(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING || !gameState.player) return;
  
  const sprint = p.keyIsDown(16); // SHIFT
  
  if (p.keyIsDown(38)) { // UP ARROW
    gameState.player.move(1, sprint);
  }
  if (p.keyIsDown(40)) { // DOWN ARROW
    gameState.player.move(-1, sprint);
  }
  if (p.keyIsDown(37)) { // LEFT ARROW
    gameState.player.turn(-1);
  }
  if (p.keyIsDown(39)) { // RIGHT ARROW
    gameState.player.turn(1);
  }
}

function startGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.frameCount = 0;
  
  // Activate shadow entity in room 2 and 3
  if (gameState.shadowEntity) {
    gameState.shadowEntity.active = true;
  }
  
  // Log game start
  window.gameInstance.logs.game_info.push({
    data: { phase: "PLAYING", action: "game_started" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame() {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  window.gameInstance.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame() {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  window.gameInstance.logs.game_info.push({
    data: { phase: "PLAYING", action: "resumed" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function restartGame() {
  // Reset game state
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentRoom = 0;
  gameState.score = 0;
  gameState.collectedFragments = 0;
  gameState.inventory = [];
  gameState.doorUnlocked = false;
  gameState.puzzlesSolved = 0;
  gameState.secretsFound = 0;
  gameState.endingType = null;
  
  // Reset player
  if (gameState.player) {
    gameState.player.x = 100;
    gameState.player.y = 200;
    gameState.player.health = 100;
    gameState.player.angle = 0;
  }
  
  // Reset interactables
  gameState.interactables.forEach(i => {
    if (i.type === "fragment" || i.type === "key" || i.type === "mechanism") {
      i.active = true;
    }
    if (i.type === "door" && i.data.isFinal) {
      i.data.locked = true;
    }
  });
  
  // Reset shadow entity
  if (gameState.shadowEntity) {
    gameState.shadowEntity.active = false;
    gameState.shadowEntity.x = 300;
    gameState.shadowEntity.y = 200;
  }
  
  window.gameInstance.logs.game_info.push({
    data: { phase: "START", action: "restarted" },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}