// input.js - Input handling
import { gameState, KEY_ENTER, KEY_ESC, KEY_R, KEY_SPACE, KEY_SHIFT, KEY_Z,
         KEY_LEFT, KEY_RIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, MODE_PUZZLE } from './globals.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition keys
  if (keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
    startGame();
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_PAUSED },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_ESC && gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: PHASE_PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  if (keyCode === KEY_R && (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
                            gameState.gamePhase === PHASE_GAME_OVER_LOSE)) {
    restartGame();
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.keys[keyCode] = true;
    
    if (keyCode === KEY_SPACE) {
      if (gameState.currentMode === MODE_PUZZLE) {
        handlePuzzleSelect();
      } else {
        if (gameState.player) {
          gameState.player.jump();
        }
      }
    }
    
    if (keyCode === KEY_Z) {
      if (gameState.player) {
        gameState.player.startSlide();
      }
    }
    
    if (keyCode === KEY_SHIFT) {
      if (gameState.player) {
        gameState.player.sprinting = true;
      }
    }
    
    // Arrow keys for puzzle navigation
    if (gameState.currentMode === MODE_PUZZLE) {
      handlePuzzleNavigation(keyCode);
    }
  }
}

export function handleKeyReleased(p) {
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key: p.key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.keys[keyCode] = false;
    
    if (keyCode === KEY_SHIFT) {
      if (gameState.player) {
        gameState.player.sprinting = false;
      }
    }
  }
}

let puzzleSelectedIndex = 0;

function handlePuzzleNavigation(keyCode) {
  const numItems = gameState.puzzleItems.length;
  if (numItems === 0) return;
  
  // Update selection
  if (keyCode === KEY_LEFT) {
    puzzleSelectedIndex = (puzzleSelectedIndex - 1 + numItems) % numItems;
  } else if (keyCode === KEY_RIGHT) {
    puzzleSelectedIndex = (puzzleSelectedIndex + 1) % numItems;
  }
  
  // Update visual state
  for (let i = 0; i < numItems; i++) {
    gameState.puzzleItems[i].hovered = (i === puzzleSelectedIndex);
  }
}

function handlePuzzleSelect() {
  if (gameState.puzzleItems.length === 0) return;
  
  const item = gameState.puzzleItems[puzzleSelectedIndex];
  if (!item) return;
  
  item.selected = !item.selected;
  
  if (item.selected) {
    if (!gameState.selectedItems.includes(item.id)) {
      gameState.selectedItems.push(item.id);
    }
  } else {
    const index = gameState.selectedItems.indexOf(item.id);
    if (index > -1) {
      gameState.selectedItems.splice(index, 1);
    }
  }
}

function startGame() {
  gameState.gamePhase = PHASE_PLAYING;
  gameState.currentChapter = 0;
  gameState.score = 0;
  gameState.collectedFragments = 0;
  gameState.storyChoices = [];
  
  initializeChapter(0);
  
  gameState.p.logs.game_info.push({
    data: { gamePhase: PHASE_PLAYING, action: 'game_started' },
    framecount: gameState.p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame() {
  gameState.gamePhase = PHASE_START;
  gameState.currentChapter = 0;
  gameState.score = 0;
  gameState.collectedFragments = 0;
  gameState.selectedItems = [];
  gameState.storyChoices = [];
  gameState.entities = [];
  gameState.player = null;
  
  gameState.p.logs.game_info.push({
    data: { gamePhase: PHASE_START, action: 'game_restarted' },
    framecount: gameState.p.frameCount,
    timestamp: Date.now()
  });
}

function initializeChapter(chapter) {
  gameState.currentChapter = chapter;
  gameState.currentMode = MODE_PUZZLE;
  gameState.segmentComplete = false;
  puzzleSelectedIndex = 0;
  
  // Import functions dynamically through gameState
  const { initializePuzzle } = gameState.puzzleFunctions;
  initializePuzzle(chapter);
}

// Export for use in game.js
export { startGame, restartGame, initializeChapter, puzzleSelectedIndex };