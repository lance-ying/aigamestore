// input.js - Input handling

import { gameState, GAME_PHASE } from './globals.js';

export function handleKeyPressed(p, keyCode, key) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASE.START) {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      logGameInfo(p, "Game started");
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      gameState.gamePhase = GAME_PHASE.PAUSED;
      logGameInfo(p, "Game paused");
    } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
      gameState.gamePhase = GAME_PHASE.PLAYING;
      logGameInfo(p, "Game resumed");
    } else if (gameState.activeDialogue) {
      // Close dialogue
      gameState.activeDialogue = null;
    } else {
      // Close active puzzle
      const activePuzzle = gameState.interactables.find(i => i.active);
      if (activePuzzle) {
        activePuzzle.deactivate();
      }
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
      resetGame(p);
      logGameInfo(p, "Game reset to start");
    }
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    gameState.keysPressed[keyCode] = true;
    
    // Handle dialogue navigation
    if (gameState.activeDialogue) {
      handleDialogueInput(keyCode);
    }
    
    // Handle puzzle input
    const activePuzzle = gameState.interactables.find(i => i.active);
    if (activePuzzle) {
      activePuzzle.handleInput(keyCode);
    }
  }
}

export function handleKeyReleased(p, keyCode, key) {
  if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    gameState.keysPressed[keyCode] = false;
  }
}

function handleDialogueInput(keyCode) {
  const dialogue = gameState.activeDialogue;
  if (!dialogue) return;
  
  // If there are choices
  if (dialogue.choices && dialogue.choices.length > 0) {
    // Arrow up
    if (keyCode === 38) {
      dialogue.selectedChoice = (dialogue.selectedChoice - 1 + dialogue.choices.length) % dialogue.choices.length;
    }
    // Arrow down
    if (keyCode === 40) {
      dialogue.selectedChoice = (dialogue.selectedChoice + 1) % dialogue.choices.length;
    }
    // Z - confirm choice
    if (keyCode === 90) {
      const choice = dialogue.choices[dialogue.selectedChoice];
      recordAction('dialogue_choice', choice);
      gameState.activeDialogue = null;
    }
  } else {
    // No choices, just continue
    if (keyCode === 90) {
      gameState.activeDialogue = null;
    }
  }
}

function recordAction(type, data) {
  gameState.actionsRecorded++;
  gameState.actionHistory.push({
    type,
    value: data.value || null,
    timestamp: Date.now()
  });
  
  // Update personality meter
  gameState.personalityMeter = Math.min(100, gameState.actionsRecorded * 2.5);
}

function logGameInfo(p, message) {
  p.logs.game_info.push({
    data: { message, gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASE.START;
  gameState.score = 0;
  gameState.personalityMeter = 0;
  gameState.actionsRecorded = 0;
  gameState.actionHistory = [];
  gameState.activeDialogue = null;
  gameState.dialogueChoices = [];
  gameState.puzzlesSolved = [];
  gameState.keysPressed = {};
  gameState.lastInteractionFrame = 0;
  gameState.positionHistory = [];
  
  // Reset NPCs
  gameState.npcs.forEach(npc => {
    npc.interactionCount = 0;
    npc.hasInteracted = false;
  });
  
  // Reset puzzles
  gameState.interactables.forEach(item => {
    if (item.solved !== undefined) {
      item.solved = false;
      item.active = false;
      item.initializePuzzle();
    }
  });
}

export function logPlayerInfo(p) {
  if (gameState.player && p.frameCount % 30 === 0) { // Log every 30 frames
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  }
}