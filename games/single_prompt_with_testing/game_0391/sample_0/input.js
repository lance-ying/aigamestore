import { gameState, GAME_PHASES, NODE_TYPES } from './globals.js';
import { loadPuzzle, resetPuzzle } from './puzzleManager.js';

let typingBuffer = '';
let cursorVisible = true;
let cursorBlinkTimer = 0;

export function setupInput(p) {
  // Cursor blink handled in draw loop
}

export function updateCursorBlink(p) {
  cursorBlinkTimer++;
  if (cursorBlinkTimer > 30) {
    cursorVisible = !cursorVisible;
    cursorBlinkTimer = 0;
  }
}

export function getCursorVisible() {
  return cursorVisible;
}

export function getTypingBuffer() {
  return typingBuffer;
}

export function handleKeyPressed(p) {
  const keyCode = p.keyCode;
  const key = p.key;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      loadPuzzle(0);
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, event: "game_started" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, event: "game_paused" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, event: "game_resumed" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      gameState.gamePhase = GAME_PHASES.START;
      gameState.score = 0;
      gameState.currentPuzzle = 0;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, event: "game_restarted" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Arrow keys - navigate
  if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) {
    handleNavigation(p, keyCode);
  }
  
  // Space - toggle edit mode
  if (keyCode === 32) {
    if (gameState.selectedNode && gameState.selectedNode.type === NODE_TYPES.COMPUTE) {
      gameState.editMode = !gameState.editMode;
      typingBuffer = '';
    }
  }
  
  // Shift - single step execution
  if (keyCode === 16) {
    if (gameState.selectedNode) {
      resetPuzzle();
    }
  }
  
  // Z - clear instruction
  if (keyCode === 90) {
    if (gameState.selectedNode && gameState.selectedNode.type === NODE_TYPES.COMPUTE) {
      if (gameState.editMode) {
        typingBuffer = '';
      } else {
        if (gameState.selectedInstructionIndex >= 0 && 
            gameState.selectedInstructionIndex < gameState.selectedNode.instructions.length) {
          gameState.selectedNode.removeInstruction(gameState.selectedInstructionIndex);
          if (gameState.selectedInstructionIndex >= gameState.selectedNode.instructions.length) {
            gameState.selectedInstructionIndex = Math.max(0, gameState.selectedNode.instructions.length - 1);
          }
        }
      }
    }
  }
}

export function handleKeyTyped(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (!gameState.editMode) return;
  if (!gameState.selectedNode || gameState.selectedNode.type !== NODE_TYPES.COMPUTE) return;
  
  const key = p.key;
  
  // Allow alphanumeric, space, and basic punctuation
  if (key.length === 1 && (key.match(/[a-zA-Z0-9 :,\-]/) || key === ' ')) {
    typingBuffer += key;
  }
}

export function handleBackspace(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (!gameState.editMode) return;
  if (!gameState.selectedNode || gameState.selectedNode.type !== NODE_TYPES.COMPUTE) return;
  
  if (p.keyCode === 8 || p.keyCode === 46) { // Backspace or Delete
    typingBuffer = typingBuffer.slice(0, -1);
  }
}

export function handleEnterInEditMode(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  if (!gameState.editMode) return;
  if (!gameState.selectedNode || gameState.selectedNode.type !== NODE_TYPES.COMPUTE) return;
  
  if (p.keyCode === 13) { // Enter
    if (typingBuffer.trim().length > 0) {
      // Add or replace instruction
      if (gameState.selectedInstructionIndex < gameState.selectedNode.instructions.length) {
        gameState.selectedNode.instructions[gameState.selectedInstructionIndex] = typingBuffer.trim();
      } else {
        gameState.selectedNode.addInstruction(typingBuffer.trim());
      }
      
      gameState.selectedInstructionIndex++;
      if (gameState.selectedInstructionIndex >= gameState.selectedNode.maxInstructions) {
        gameState.selectedInstructionIndex = gameState.selectedNode.maxInstructions - 1;
      }
      
      typingBuffer = '';
    }
  }
}

function handleNavigation(p, keyCode) {
  if (!gameState.selectedNode) return;
  
  if (gameState.editMode) {
    // Navigate instructions
    if (keyCode === 38) { // UP
      gameState.selectedInstructionIndex = Math.max(0, gameState.selectedInstructionIndex - 1);
      typingBuffer = '';
    } else if (keyCode === 40) { // DOWN
      gameState.selectedInstructionIndex = Math.min(
        gameState.selectedNode.maxInstructions - 1,
        gameState.selectedInstructionIndex + 1
      );
      typingBuffer = '';
    }
  } else {
    // Navigate nodes
    const currentIndex = gameState.nodes.indexOf(gameState.selectedNode);
    const puzzle = gameState.puzzles[gameState.currentPuzzle];
    const row = Math.floor(currentIndex / puzzle.gridWidth);
    const col = currentIndex % puzzle.gridWidth;
    
    let newRow = row;
    let newCol = col;
    
    if (keyCode === 37) newCol--; // LEFT
    if (keyCode === 39) newCol++; // RIGHT
    if (keyCode === 38) newRow--; // UP
    if (keyCode === 40) newRow++; // DOWN
    
    if (newRow >= 0 && newRow < puzzle.gridHeight && newCol >= 0 && newCol < puzzle.gridWidth) {
      const newIndex = newRow * puzzle.gridWidth + newCol;
      const newNode = gameState.nodes[newIndex];
      if (newNode.type === NODE_TYPES.COMPUTE) {
        gameState.selectedNode = newNode;
        gameState.selectedInstructionIndex = 0;
      }
    }
  }
}

export function processAutomatedInput(p, action) {
  if (!action) return;
  
  if (action.keyCode) {
    p.keyCode = action.keyCode;
    p.key = action.key || String.fromCharCode(action.keyCode);
    
    if (action.type === 'keyPressed') {
      handleKeyPressed(p);
    } else if (action.type === 'keyTyped') {
      handleKeyTyped(p);
    }
  }
  
  if (action.instruction) {
    if (gameState.selectedNode && gameState.selectedNode.type === NODE_TYPES.COMPUTE) {
      gameState.selectedNode.addInstruction(action.instruction);
    }
  }
}