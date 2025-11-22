// input.js
import { gameState, GAME_PHASES, initializeGame, tryCombination } from './globals.js';
import get_automated_testing_action from './automated_testing_controller.js';

export function handleKeyPressed(p) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase controls (always available)
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      pauseGame(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      unpauseGame(p);
    }
    return;
  }
  
  if (p.keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay controls (only in PLAYING phase)
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(p);
  }
}

function handleHumanInput(p) {
  const keyCode = p.keyCode;
  
  // Arrow Up - Move cursor up
  if (keyCode === 38) {
    if (gameState.elementCursor > 0) {
      gameState.elementCursor--;
    }
  }
  
  // Arrow Down - Move cursor down
  if (keyCode === 40) {
    if (gameState.elementCursor < gameState.discoveredElements.length - 1) {
      gameState.elementCursor++;
    }
  }
  
  // Space - Select element or combine
  if (keyCode === 32) {
    const selectedElement = gameState.discoveredElements[gameState.elementCursor];
    
    if (!selectedElement) return;
    
    // If both slots are filled, try combination
    if (gameState.selectedSlots[0] && gameState.selectedSlots[1]) {
      attemptCombination(p);
    } else {
      // Add to next empty slot
      if (!gameState.selectedSlots[0]) {
        gameState.selectedSlots[0] = selectedElement;
      } else if (!gameState.selectedSlots[1]) {
        gameState.selectedSlots[1] = selectedElement;
      }
    }
  }
  
  // Z - Clear selection
  if (keyCode === 90) {
    gameState.selectedSlots = [null, null];
    gameState.message = "Selection cleared";
    gameState.messageTimer = 30;
  }
}

export function processAutomatedInput(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (gameState.controlMode === "HUMAN") return;
  
  // Get action from automated controller
  const action = get_automated_testing_action(gameState);
  
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = action.key;
  
  // Log automated input
  p.logs.inputs.push({
    input_type: "automated",
    data: { key: action.key, keyCode: action.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Process the input
  handleHumanInput(p);
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  initializeGame();
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", message: "Game started" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function pauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PAUSED;
  
  p.logs.game_info.push({
    data: { phase: "PAUSED" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function unpauseGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", message: "Game resumed" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { phase: "START", message: "Game restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function attemptCombination(p) {
  const elem1 = gameState.selectedSlots[0];
  const elem2 = gameState.selectedSlots[1];
  
  if (!elem1 || !elem2) return;
  
  gameState.combinationAttempts++;
  
  const result = tryCombination(elem1, elem2);
  
  if (result && !gameState.discoveredElements.includes(result)) {
    // Success! New element discovered
    gameState.discoveredElements.push(result);
    gameState.successfulCombinations++;
    gameState.score = gameState.discoveredElements.length;
    gameState.lastCombinationSuccess = true;
    gameState.message = `Discovered: ${result}!`;
    gameState.messageTimer = 90;
    
    // Start animation
    gameState.animatingElement = result;
    gameState.animationTimer = 60;
    
    // Log discovery
    p.logs.game_info.push({
      data: { 
        event: "discovery", 
        element: result,
        combination: `${elem1}+${elem2}`,
        totalElements: gameState.discoveredElements.length
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Check win condition
    if (gameState.discoveredElements.length >= gameState.totalElements) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", message: "All elements discovered!" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Clear selection after short delay
    gameState.selectedSlots = [null, null];
  } else if (result && gameState.discoveredElements.includes(result)) {
    // Already discovered
    gameState.lastCombinationSuccess = false;
    gameState.message = `Already have: ${result}`;
    gameState.messageTimer = 60;
  } else {
    // Invalid combination
    gameState.lastCombinationSuccess = false;
    gameState.message = "Invalid combination";
    gameState.messageTimer = 60;
  }
}