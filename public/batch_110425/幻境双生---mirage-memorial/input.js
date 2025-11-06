// input.js - Input handling
import { gameState } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // Game phase controls
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame();
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      p.noLoop();
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      p.loop();
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PAUSED") {
      resetToStart();
      p.loop();
    }
  }

  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase === "PLAYING" && gameState.player) {
    if (p.keyCode === 90) { // Z - Switch worlds
      switchWorld();
    } else if (p.keyCode === 16) { // SHIFT - Interact
      interactWithObjects();
    }
  }
}

export function handleKeyReleased(p) {
  p.logs.inputs.push({
    input_type: "keyReleased",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function processGameplayInput(p) {
  if (gameState.gamePhase !== "PLAYING" || !gameState.player) return;

  let action = null;

  if (gameState.controlMode === "HUMAN") {
    // Human input
    if (p.keyIsDown(37)) { // LEFT
      gameState.player.moveLeft();
    } else if (p.keyIsDown(39)) { // RIGHT
      gameState.player.moveRight();
    } else {
      gameState.player.stopMove();
    }

    if (p.keyIsDown(32)) { // SPACE - Jump
      gameState.player.jump();
    }
  } else {
    // Automated testing input
    action = get_automated_testing_action(gameState);
    
    if (action) {
      if (action.left) {
        gameState.player.moveLeft();
      } else if (action.right) {
        gameState.player.moveRight();
      } else {
        gameState.player.stopMove();
      }

      if (action.jump) {
        gameState.player.jump();
      }

      if (action.switchWorld) {
        switchWorld();
      }

      if (action.interact) {
        interactWithObjects();
      }
    }
  }
}

function startGame() {
  gameState.gamePhase = "PLAYING";
  gameState.levelStartTime = Date.now();
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function resetToStart() {
  gameState.gamePhase = "START";
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.deathCount = 0;
  gameState.crystalsCollected = 0;
  gameState.currentWorld = 'NORMAL';
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase },
    framecount: window.gameInstance.frameCount,
    timestamp: Date.now()
  });
}

function switchWorld() {
  gameState.currentWorld = gameState.currentWorld === 'NORMAL' ? 'INNER' : 'NORMAL';
}

function interactWithObjects() {
  if (!gameState.player) return;
  
  // Check for nearby switches
  for (let sw of gameState.switches) {
    if (sw.world !== gameState.currentWorld) continue;
    
    const dx = Math.abs((gameState.player.x + gameState.player.width / 2) - (sw.x + sw.width / 2));
    const dy = Math.abs((gameState.player.y + gameState.player.height / 2) - (sw.y + sw.height / 2));
    
    if (dx < 30 && dy < 30) {
      sw.activate();
      gameState.score += 10;
      break;
    }
  }
  
  // Check for nearby blocks to push
  for (let block of gameState.movableBlocks) {
    const dx = (gameState.player.x + gameState.player.width / 2) - (block.x + block.width / 2);
    const dy = Math.abs((gameState.player.y + gameState.player.height / 2) - (block.y + block.height / 2));
    
    if (Math.abs(dx) < 30 && dy < 20) {
      const pushDir = dx > 0 ? -1 : 1;
      block.push(pushDir);
      break;
    }
  }
}