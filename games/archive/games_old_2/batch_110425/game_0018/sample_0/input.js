// input.js - Input handling
import { gameState, GAME_PHASES } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Game phase transitions
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      logGameInfo(p, "PAUSED");
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      logGameInfo(p, "RESUMED");
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      restartGame(p);
    }
    return;
  }
  
  // Gameplay inputs (only during PLAYING phase)
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  const currentFaction = gameState.factions[gameState.currentFactionIndex];
  if (!currentFaction || !currentFaction.isPlayer) return;
  
  // Arrow keys - navigate clearings
  if (keyCode >= 37 && keyCode <= 40) {
    navigateClearings(keyCode);
  }
  
  // Space - confirm action
  if (keyCode === 32) {
    confirmAction(p);
  }
  
  // Z - cancel
  if (keyCode === 90) {
    cancelAction();
  }
  
  // Shift - toggle action mode
  if (keyCode === 16) {
    toggleActionMode();
  }
}

function navigateClearings(keyCode) {
  if (!gameState.selectedClearing) {
    // Select first clearing with player units
    const playerFaction = gameState.factions[gameState.currentFactionIndex];
    const clearingWithUnits = gameState.clearings.find(c => 
      c.getUnitCount(playerFaction.name) > 0
    );
    gameState.selectedClearing = clearingWithUnits || gameState.clearings[0];
    return;
  }
  
  const current = gameState.selectedClearing;
  const adjacentIds = current.adjacentIds;
  
  if (adjacentIds.length === 0) return;
  
  // Simple navigation based on direction
  let targetId = adjacentIds[0];
  
  if (keyCode === 37) { // LEFT
    targetId = adjacentIds.reduce((closest, id) => 
      gameState.clearings[id].x < gameState.clearings[closest].x ? id : closest
    , adjacentIds[0]);
  } else if (keyCode === 39) { // RIGHT
    targetId = adjacentIds.reduce((closest, id) => 
      gameState.clearings[id].x > gameState.clearings[closest].x ? id : closest
    , adjacentIds[0]);
  } else if (keyCode === 38) { // UP
    targetId = adjacentIds.reduce((closest, id) => 
      gameState.clearings[id].y < gameState.clearings[closest].y ? id : closest
    , adjacentIds[0]);
  } else if (keyCode === 40) { // DOWN
    targetId = adjacentIds.reduce((closest, id) => 
      gameState.clearings[id].y > gameState.clearings[closest].y ? id : closest
    , adjacentIds[0]);
  }
  
  gameState.selectedClearing = gameState.clearings[targetId];
}

function confirmAction(p) {
  if (!gameState.selectedClearing) return;
  
  const currentFaction = gameState.factions[gameState.currentFactionIndex];
  const clearing = gameState.selectedClearing;
  
  if (!gameState.actionMode) {
    gameState.actionMode = "MOVE";
  }
  
  if (gameState.actionMode === "MOVE") {
    executeMove(p, currentFaction, clearing);
  } else if (gameState.actionMode === "BUILD") {
    executeBuild(p, currentFaction, clearing);
  } else if (gameState.actionMode === "RECRUIT") {
    executeRecruit(p, currentFaction, clearing);
  }
  
  checkVictoryConditions(p);
}

function executeMove(p, faction, targetClearing) {
  // Move units from controlled clearings to target
  const controlledClearings = gameState.clearings.filter(c => 
    c.ruler === faction.name && c.id !== targetClearing.id
  );
  
  if (controlledClearings.length > 0) {
    const sourceClearing = controlledClearings[0];
    if (sourceClearing.adjacentIds.includes(targetClearing.id) && 
        sourceClearing.getUnitCount(faction.name) > 1) {
      sourceClearing.removeUnit(faction.name, 1);
      targetClearing.addUnit(faction.name, 1);
      
      logPlayerInfo(p);
      gameState.actionMode = null;
    }
  }
}

function executeBuild(p, faction, clearing) {
  if (faction.name === "MARQUISE" && clearing.ruler === faction.name) {
    if (clearing.getBuildingCount() < clearing.slots) {
      const buildingType = faction.workshops < 3 ? "WORKSHOP" : "SAWMILL";
      if (faction.buildBuilding(clearing, buildingType)) {
        logPlayerInfo(p);
        gameState.actionMode = null;
      }
    }
  }
}

function executeRecruit(p, faction, clearing) {
  if (clearing.ruler === faction.name) {
    clearing.addUnit(faction.name, 1);
    logPlayerInfo(p);
    gameState.actionMode = null;
    endTurn(p);
  }
}

function cancelAction() {
  gameState.actionMode = null;
}

function toggleActionMode() {
  const modes = ["MOVE", "BUILD", "RECRUIT"];
  const currentIndex = modes.indexOf(gameState.actionMode);
  gameState.actionMode = modes[(currentIndex + 1) % modes.length];
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  logGameInfo(p, "GAME_START");
}

function restartGame(p) {
  const { resetGameState } = await import('./globals.js');
  const { initializeGame } = await import('./game.js');
  resetGameState();
  initializeGame(p);
  logGameInfo(p, "RESTART");
}

function endTurn(p) {
  gameState.currentFactionIndex = (gameState.currentFactionIndex + 1) % gameState.factions.length;
  gameState.turnPhase = "MOVE";
  gameState.selectedClearing = null;
  gameState.actionMode = null;
  
  // AI turns
  const currentFaction = gameState.factions[gameState.currentFactionIndex];
  if (!currentFaction.isPlayer) {
    const { executeAITurn } = await import('./faction.js');
    executeAITurn(currentFaction, gameState.clearings);
    gameState.aiDelay = 60; // Delay before next turn
  }
}

function checkVictoryConditions(p) {
  for (const faction of gameState.factions) {
    if (faction.hasWon()) {
      if (faction.isPlayer) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        logGameInfo(p, "GAME_OVER_WIN");
      } else {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        logGameInfo(p, "GAME_OVER_LOSE");
      }
      return;
    }
  }
}

function logGameInfo(p, event) {
  p.logs.game_info.push({
    data: { event, gamePhase: gameState.gamePhase },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  if (gameState.player) {
    const playerClearing = gameState.clearings.find(c => 
      c.getUnitCount(gameState.player.name) > 0
    );
    
    if (playerClearing) {
      p.logs.player_info.push({
        screen_x: playerClearing.x,
        screen_y: playerClearing.y,
        game_x: playerClearing.x,
        game_y: playerClearing.y,
        framecount: p.frameCount
      });
    }
  }
}