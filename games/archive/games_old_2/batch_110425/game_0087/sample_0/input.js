// input.js - Input handling

import { gameState, GAME_PHASES, DEDUCTION_STAGES } from './globals.js';
import { createVisionCard } from './cards.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
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
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const currentCards = getCurrentCards();
  
  if (!currentCards || currentCards.length === 0) return;
  
  // Arrow keys for navigation
  if (keyCode === 37) { // LEFT
    gameState.currentSelection = (gameState.currentSelection - 1 + currentCards.length) % currentCards.length;
  } else if (keyCode === 39) { // RIGHT
    gameState.currentSelection = (gameState.currentSelection + 1) % currentCards.length;
  } else if (keyCode === 32) { // SPACE - Confirm selection
    confirmSelection(p);
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Currently no key release handling needed
}

function getCurrentCards() {
  switch (gameState.currentStage) {
    case DEDUCTION_STAGES.SUSPECT:
      return gameState.suspectCards;
    case DEDUCTION_STAGES.LOCATION:
      return gameState.locationCards;
    case DEDUCTION_STAGES.WEAPON:
      return gameState.weaponCards;
    default:
      return [];
  }
}

function confirmSelection(p) {
  const currentCards = getCurrentCards();
  const selectedIndex = gameState.currentSelection;
  
  switch (gameState.currentStage) {
    case DEDUCTION_STAGES.SUSPECT:
      gameState.selectedSuspect = selectedIndex;
      if (selectedIndex === gameState.correctSuspect) {
        gameState.correctGuesses++;
        gameState.score += 100;
      } else {
        gameState.incorrectGuesses++;
      }
      gameState.currentStage = DEDUCTION_STAGES.LOCATION;
      gameState.currentSelection = 0;
      gameState.stagesCompleted++;
      createVisionCard('LOCATION', p);
      break;
      
    case DEDUCTION_STAGES.LOCATION:
      gameState.selectedLocation = selectedIndex;
      if (selectedIndex === gameState.correctLocation) {
        gameState.correctGuesses++;
        gameState.score += 100;
      } else {
        gameState.incorrectGuesses++;
      }
      gameState.currentStage = DEDUCTION_STAGES.WEAPON;
      gameState.currentSelection = 0;
      gameState.stagesCompleted++;
      createVisionCard('WEAPON', p);
      break;
      
    case DEDUCTION_STAGES.WEAPON:
      gameState.selectedWeapon = selectedIndex;
      if (selectedIndex === gameState.correctWeapon) {
        gameState.correctGuesses++;
        gameState.score += 100;
      } else {
        gameState.incorrectGuesses++;
      }
      gameState.currentStage = DEDUCTION_STAGES.COMPLETE;
      gameState.stagesCompleted++;
      checkWinCondition(p);
      break;
  }
  
  // Log player info
  if (gameState.player) {
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}

function checkWinCondition(p) {
  // Win if at least 2 out of 3 are correct
  if (gameState.correctGuesses >= 2) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
    gameState.score += 200; // Bonus for winning
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentStage = DEDUCTION_STAGES.SUSPECT;
  gameState.currentSelection = 0;
  
  // Create vision for first stage
  createVisionCard('SUSPECT', p);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentRound = 1;
  gameState.currentStage = DEDUCTION_STAGES.SUSPECT;
  gameState.score = 0;
  gameState.currentSelection = 0;
  gameState.viewingVision = false;
  gameState.stagesCompleted = 0;
  gameState.correctGuesses = 0;
  gameState.incorrectGuesses = 0;
  gameState.selectedSuspect = null;
  gameState.selectedLocation = null;
  gameState.selectedWeapon = null;
  gameState.visionCard = null;
  
  // Regenerate cards with new correct answers
  const { createCards } = require('./cards.js');
  createCards(p);
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}