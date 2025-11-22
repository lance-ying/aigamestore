// input.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { executeAction } from './actions.js';
import { moveExpedition, combatAction } from './expedition.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
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
  
  if (keyCode === 82) { // R
    restartGame(p);
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.loop();
    }
    return;
  }
  
  // Gameplay inputs
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  if (gameState.inExpedition) {
    handleExpeditionInput(p, keyCode);
  } else {
    handleVillageInput(p, keyCode);
  }
}

function handleVillageInput(p, keyCode) {
  const actions = gameState.availableActions;
  
  if (keyCode === 38) { // UP
    gameState.selectedActionIndex = Math.max(0, gameState.selectedActionIndex - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.selectedActionIndex = Math.min(actions.length - 1, gameState.selectedActionIndex + 1);
  } else if (keyCode === 32 || keyCode === 90) { // SPACE or Z
    if (actions.length > 0 && actions[gameState.selectedActionIndex]) {
      const action = actions[gameState.selectedActionIndex];
      if (action.canAfford) {
        executeAction(action.key, p);
      }
    }
  }
  
  // Clamp selection
  if (gameState.selectedActionIndex >= actions.length) {
    gameState.selectedActionIndex = Math.max(0, actions.length - 1);
  }
}

function handleExpeditionInput(p, keyCode) {
  if (gameState.inCombat) {
    if (keyCode === 37) { // LEFT
      gameState.selectedActionIndex = 0;
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedActionIndex = 1;
    } else if (keyCode === 32 || keyCode === 90) { // SPACE or Z
      const action = gameState.selectedActionIndex === 0 ? 'attack' : 'flee';
      combatAction(action);
    }
  } else {
    if (keyCode === 32 || keyCode === 90) { // SPACE or Z - forward
      moveExpedition('forward');
    } else if (keyCode === 16) { // SHIFT - return
      moveExpedition('return');
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  // Reset game state
  gameState.wood = 0;
  gameState.food = 0;
  gameState.fur = 0;
  gameState.fireTemp = 0;
  gameState.population = 0;
  gameState.maxPopulation = 0;
  gameState.huts = 0;
  gameState.workshops = 0;
  gameState.unlockedActions = new Set(['lightFire', 'collectWood']);
  gameState.selectedActionIndex = 0;
  gameState.inExpedition = false;
  gameState.playerHealth = 100;
  gameState.supplies = 0;
  gameState.inCombat = false;
  gameState.locationsVisited = new Set(['village']);
  gameState.narrativeStage = 0;
  gameState.hasCompletedGame = false;
  gameState.framesSinceStart = p.frameCount;
  gameState.lastWoodGatherFrame = p.frameCount;
  gameState.lastFireDecayFrame = p.frameCount;
  gameState.lastPopulationCheckFrame = p.frameCount;
  gameState.combatLog = [];
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.PLAYING },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.selectedActionIndex = 0;
  
  p.logs.game_info.push({
    data: { phase: GAME_PHASES.START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}