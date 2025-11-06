// input.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, 
         PHASE_GAME_OVER_LOSE, PHASE_LEVEL_COMPLETE } from './globals.js';
import { canSwap, swapGems, hasMatches, isValidPosition } from './board.js';
import { activatePlayerBooster, executeGemBlast, executeLineClear, executeColorConversion, 
         executeColorEradication } from './booster.js';
import { startLevel, processTurnEnd } from './gameLogic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode, currentPhase: gameState.gamePhase, playerTurn: gameState.playerTurn },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    handleEnter(p);
    return;
  } else if (keyCode === 27) { // ESC
    handleEscape(p);
    return;
  } else if (keyCode === 82) { // R
    handleRestart(p);
    return;
  }
  
  // Game-specific controls during PLAYING phase
  if (gameState.gamePhase === PHASE_PLAYING) {
    if (!gameState.playerTurn) {
      // Log that it's not player's turn
      if (keyCode >= 37 && keyCode <= 40) {
        p.logs.game_info.push({
          data: { message: "Input ignored - not player turn" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (gameState.boosterActive) {
      handleBoosterInput(p, keyCode);
    } else {
      // Allow cursor movement always during player turn (even during animations)
      if (keyCode === 37) { // LEFT
        gameState.cursorX = Math.max(0, gameState.cursorX - 1);
        p.logs.game_info.push({
          data: { action: "cursor_move", direction: "left", x: gameState.cursorX, y: gameState.cursorY },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (keyCode === 38) { // UP
        gameState.cursorY = Math.max(0, gameState.cursorY - 1);
        p.logs.game_info.push({
          data: { action: "cursor_move", direction: "up", x: gameState.cursorX, y: gameState.cursorY },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (keyCode === 39) { // RIGHT
        gameState.cursorX = Math.min(gameState.boardWidth - 1, gameState.cursorX + 1);
        p.logs.game_info.push({
          data: { action: "cursor_move", direction: "right", x: gameState.cursorX, y: gameState.cursorY },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (keyCode === 40) { // DOWN
        gameState.cursorY = Math.min(gameState.boardHeight - 1, gameState.cursorY + 1);
        p.logs.game_info.push({
          data: { action: "cursor_move", direction: "down", x: gameState.cursorX, y: gameState.cursorY },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (keyCode === 32 && !gameState.animatingSwap) { // SPACE - only block during swap
        handleSpace(p);
      } else if (keyCode === 16 && !gameState.animatingSwap && !gameState.animatingClear && !gameState.animatingFall) { // SHIFT
        handleShift(p);
      }
    }
  }
}

function handleEnter(p) {
  if (gameState.gamePhase === PHASE_START) {
    gameState.currentLevel = 1;
    p.logs.game_info.push({
      data: { action: "start_game", message: "Enter pressed - starting level 1" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    startLevel(p, 1);
    // Log phase change
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, phase: gameState.gamePhase, 
              message: "Game phase changed to PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
    if (gameState.currentLevel < gameState.maxLevel) {
      gameState.currentLevel++;
      startLevel(p, gameState.currentLevel);
    } else {
      // All levels complete - show win screen
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, message: "All levels complete" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function handleEscape(p) {
  if (gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_PAUSED;
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    gameState.gamePhase = PHASE_PLAYING;
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleRestart(p) {
  gameState.gamePhase = PHASE_START;
  gameState.currentLevel = 1;
  gameState.playerScore = 0;
  gameState.aiScore = 0;
  gameState.selectedGem = null;
  gameState.boosterActive = false;
  gameState.boosterState = null;
  
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, message: "Game restarted" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleSpace(p) {
  const x = gameState.cursorX;
  const y = gameState.cursorY;
  
  if (!gameState.selectedGem) {
    // Select first gem
    const gem = gameState.board[y][x];
    if (gem !== -1 && gem !== 8) { // Not empty or obstacle
      gameState.selectedGem = { x, y };
      p.logs.game_info.push({
        data: { action: "gem_selected", x, y, gem },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    // Attempt swap
    const x1 = gameState.selectedGem.x;
    const y1 = gameState.selectedGem.y;
    const x2 = x;
    const y2 = y;
    
    if (x1 === x2 && y1 === y2) {
      // Deselect
      gameState.selectedGem = null;
      p.logs.game_info.push({
        data: { action: "gem_deselected" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (canSwap(x1, y1, x2, y2)) {
      // Try swap
      swapGems(x1, y1, x2, y2);
      
      if (hasMatches()) {
        // Valid swap - animate and process
        gameState.animatingSwap = true;
        gameState.swapAnimations = [{
          x1, y1, x2, y2, progress: 0
        }];
        gameState.selectedGem = null;
        p.logs.game_info.push({
          data: { action: "valid_swap", from: {x: x1, y: y1}, to: {x: x2, y: y2} },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Invalid swap - revert
        swapGems(x1, y1, x2, y2);
        gameState.selectedGem = null;
        p.logs.game_info.push({
          data: { action: "invalid_swap", from: {x: x1, y: y1}, to: {x: x2, y: y2} },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else {
      // Not adjacent - deselect
      gameState.selectedGem = null;
      p.logs.game_info.push({
        data: { action: "invalid_selection", reason: "not_adjacent" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function handleShift(p) {
  if (gameState.playerBoosterCharge >= gameState.playerBoosterMax) {
    activatePlayerBooster(p);
    p.logs.game_info.push({
      data: { action: "booster_activated" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function handleBoosterInput(p, keyCode) {
  const state = gameState.boosterState;
  
  // Move cursor
  if (keyCode === 37) gameState.cursorX = Math.max(0, gameState.cursorX - 1);
  else if (keyCode === 38) gameState.cursorY = Math.max(0, gameState.cursorY - 1);
  else if (keyCode === 39) gameState.cursorX = Math.min(gameState.boardWidth - 1, gameState.cursorX + 1);
  else if (keyCode === 40) gameState.cursorY = Math.min(gameState.boardHeight - 1, gameState.cursorY + 1);
  else if (keyCode === 32) { // SPACE - confirm
    if (state.type === "GEM_BLAST") {
      const score = executeGemBlast(gameState.cursorX, gameState.cursorY, p);
      gameState.playerScore += score;
      gameState.playerBoosterCharge = 0;
      gameState.boosterActive = false;
      gameState.boosterState = null;
      gameState.animatingClear = true;
      processTurnEnd(p);
    } else if (state.type === "LINE_CLEAR") {
      const isRow = true; // Simplified: clear row at cursor Y
      const score = executeLineClear(isRow, gameState.cursorY, p);
      gameState.playerScore += score;
      gameState.playerBoosterCharge = 0;
      gameState.boosterActive = false;
      gameState.boosterState = null;
      gameState.animatingClear = true;
      processTurnEnd(p);
    } else if (state.type === "COLOR_CONVERSION") {
      const cursorGem = gameState.board[gameState.cursorY][gameState.cursorX];
      if (state.step === "SELECT_SOURCE") {
        if (cursorGem !== -1 && cursorGem !== 8) {
          state.sourceColor = cursorGem;
          state.step = "SELECT_TARGET";
        }
      } else {
        if (cursorGem !== -1 && cursorGem !== 8 && cursorGem !== state.sourceColor) {
          const score = executeColorConversion(state.sourceColor, cursorGem, p);
          gameState.playerScore += score;
          gameState.playerBoosterCharge = 0;
          gameState.boosterActive = false;
          gameState.boosterState = null;
          processTurnEnd(p);
        }
      }
    } else if (state.type === "COLOR_ERADICATION") {
      const cursorGem = gameState.board[gameState.cursorY][gameState.cursorX];
      if (cursorGem !== -1 && cursorGem !== 8) {
        const score = executeColorEradication(cursorGem, p);
        gameState.playerScore += score;
        gameState.playerBoosterCharge = 0;
        gameState.boosterActive = false;
        gameState.boosterState = null;
        gameState.animatingClear = true;
        processTurnEnd(p);
      }
    }
  }
}

export function processTestingInput(p) {
  // Simplified testing - AI plays for both sides
  if (gameState.gamePhase === PHASE_START) {
    handleEnter(p);
  } else if (gameState.gamePhase === PHASE_PLAYING && gameState.playerTurn && 
             !gameState.animatingSwap && !gameState.animatingClear && 
             !gameState.animatingFall && !gameState.aiThinking) {
    // Auto-play for testing
    gameState.aiThinking = true;
    gameState.aiThinkTimer = 30;
  } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
    handleEnter(p);
  }
}