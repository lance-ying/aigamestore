import { gameState, COMMAND_TYPES } from './globals.js';
import { availableCommands } from './commands.js';
import { startGame, executeProgram, addCommandToProgram, removeLastCommand, resetLevel } from './game_logic.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame();
      p.logs.game_info.push({
        data: { event: "game_start" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      gameState.gamePhase = "START";
      p.logs.game_info.push({
        data: { event: "restart" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.logs.game_info.push({
        data: { event: "pause" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { event: "unpause" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === "PLAYING" && !gameState.isExecuting) {
    // Arrow keys - navigate commands
    if (keyCode === 38) { // UP
      gameState.selectedCommandIndex = (gameState.selectedCommandIndex - 1 + availableCommands.length) % availableCommands.length;
    } else if (keyCode === 40) { // DOWN
      gameState.selectedCommandIndex = (gameState.selectedCommandIndex + 1) % availableCommands.length;
    }
    
    // Space - add command
    if (keyCode === 32) { // SPACE
      const selectedCommand = availableCommands[gameState.selectedCommandIndex];
      addCommandToProgram(selectedCommand.type);
    }
    
    // Shift - remove command
    if (keyCode === 16) { // SHIFT
      removeLastCommand();
    }
    
    // Z - execute program
    if (keyCode === 90) { // Z
      executeProgram(p);
    }
  }
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  if (action.keyCode) {
    handleKeyPressed(p, action.key, action.keyCode);
  }
}