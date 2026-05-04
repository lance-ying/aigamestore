// input_handler.js - Input handling for human and automated control
import { gameState, GAME_PHASES } from './globals.js';
import { processChoice, resetGame } from './game_logic.js';
import { getSceneData } from './story_data.js';

export function handleKeyPress(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transition keys (always handled)
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    resetGame(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay keys (only in PLAYING phase)
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(p, key, keyCode);
  }
}

function handlePlayingInput(p, key, keyCode) {
  const scene = getSceneData(gameState.currentChapter, gameState.currentScene);
  const numChoices = scene.choices.length;
  
  // Navigation
  if (keyCode === 38) { // UP
    gameState.selectedOption = (gameState.selectedOption - 1 + numChoices) % numChoices;
  } else if (keyCode === 40) { // DOWN
    gameState.selectedOption = (gameState.selectedOption + 1) % numChoices;
  }
  
  // Selection
  else if (keyCode === 32) { // SPACE
    processChoice(p, gameState.selectedOption);
  }
  
  // Stats toggle
  else if (keyCode === 90) { // Z
    gameState.showingStats = !gameState.showingStats;
  }
}

export function handleAutomatedInput(p, action) {
  if (!action) return;
  
  // Simulate key press
  if (action.keyCode) {
    handleKeyPress(p, action.key, action.keyCode);
  }
}