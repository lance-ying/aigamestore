// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';

export function handleInput(p, keyCode, keyPressed = true) {
  const frameCount = p.frameCount;
  
  // Log input
  if (keyPressed) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: keyCode },
      framecount: frameCount,
      timestamp: Date.now()
    });
  }
  
  // Global controls
  if (keyCode === 13 && keyPressed) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27 && keyPressed) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      resumeGame(p);
    }
    return;
  }
  
  if (keyCode === 82 && keyPressed) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode, keyPressed);
  }
}

function handleGameplayInput(p, keyCode, keyPressed) {
  if (!keyPressed) return;
  
  // Cooldown check
  if (p.frameCount - gameState.lastActionFrame < gameState.actionCooldown) {
    return;
  }
  
  // Event choice navigation
  if (gameState.showingEvent && gameState.currentEvent) {
    if (keyCode === 38) { // UP
      gameState.selectedChoice = Math.max(0, gameState.selectedChoice - 1);
      gameState.lastActionFrame = p.frameCount;
    } else if (keyCode === 40) { // DOWN
      gameState.selectedChoice = Math.min(
        gameState.currentEvent.choices.length - 1,
        gameState.selectedChoice + 1
      );
      gameState.lastActionFrame = p.frameCount;
    } else if (keyCode === 90) { // Z - confirm
      confirmEventChoice(p);
      gameState.lastActionFrame = p.frameCount;
    }
    return;
  }
  
  // Spin wheel
  if (keyCode === 32 && !gameState.spinning && !gameState.moving && !gameState.showingEvent) {
    gameState.spinning = true;
    gameState.wheelSpinning = true;
    gameState.lastActionFrame = p.frameCount;
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "start" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "pause" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resumeGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "resume" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentPosition = 0;
  gameState.knowledge = 0;
  gameState.wealth = 0;
  gameState.happiness = 0;
  gameState.turn = 0;
  gameState.spinning = false;
  gameState.moving = false;
  gameState.showingEvent = false;
  gameState.currentEvent = null;
  gameState.eventsCompleted = [];
  gameState.spinResult = 0;
  gameState.wheelSpinning = false;
  
  if (gameState.player && gameState.boardPath.length > 0) {
    const startSpace = gameState.boardPath[0];
    gameState.player.x = startSpace.x;
    gameState.player.y = startSpace.y;
    gameState.player.targetX = startSpace.x;
    gameState.player.targetY = startSpace.y;
  }
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function confirmEventChoice(p) {
  if (gameState.currentEvent && gameState.currentEvent.choices.length > 0) {
    const choice = gameState.currentEvent.choices[gameState.selectedChoice];
    
    // Import and apply
    import('./events.js').then(module => {
      module.applyEventChoice(choice);
    });
    
    gameState.showingEvent = false;
    gameState.currentEvent = null;
    gameState.selectedChoice = 0;
  }
}