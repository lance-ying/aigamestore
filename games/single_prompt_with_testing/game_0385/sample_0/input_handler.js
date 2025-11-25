// input_handler.js - Input handling

import { gameState, GAME_PHASES, PLAY_MODES } from './globals.js';
import { initGame, updateMenuItems, handleMenuSelection, handleBattleAction } from './game_logic.js';

export function setupInputHandlers(p) {
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        initGame(p);
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        p.logs.game_info.push({
          data: { phase: "START" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Only process game controls during PLAYING phase
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    // Handle inputs based on control mode
    if (gameState.controlMode === "HUMAN") {
      handleHumanInput(p);
    }
  };
}

function handleHumanInput(p) {
  if (gameState.playMode === PLAY_MODES.TRAINING || gameState.playMode === "feed_menu") {
    if (p.keyCode === 38) { // UP
      gameState.selectedMenuItem = Math.max(0, gameState.selectedMenuItem - 1);
    } else if (p.keyCode === 40) { // DOWN
      gameState.selectedMenuItem = Math.min(gameState.menuItems.length - 1, gameState.selectedMenuItem + 1);
    } else if (p.keyCode === 32) { // SPACE
      handleMenuSelection(p);
    } else if (p.keyCode === 90) { // Z
      if (gameState.playMode === "feed_menu") {
        gameState.playMode = PLAY_MODES.TRAINING;
        gameState.selectedMenuItem = 0;
        updateMenuItems();
      }
    }
  } else if (gameState.playMode === PLAY_MODES.BATTLE) {
    if (gameState.battleTurn === "player") {
      if (p.keyCode === 38) { // UP
        gameState.selectedSkill = Math.max(0, gameState.selectedSkill - 1);
      } else if (p.keyCode === 40) { // DOWN
        gameState.selectedSkill = Math.min(gameState.player.skills.length - 1, gameState.selectedSkill + 1);
      } else if (p.keyCode === 32) { // SPACE
        handleBattleAction(p);
      }
    }
  }
}

export function processAutomatedInput(p, action) {
  if (!action || gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Simulate key press for automated testing
  if (action.keyCode) {
    p.keyCode = action.keyCode;
    p.key = action.key || String.fromCharCode(action.keyCode);
    
    // Log the automated input
    p.logs.inputs.push({
      input_type: "automated",
      data: { key: p.key, keyCode: p.keyCode, controlMode: gameState.controlMode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Process the input
    handleHumanInput(p);
  }
}