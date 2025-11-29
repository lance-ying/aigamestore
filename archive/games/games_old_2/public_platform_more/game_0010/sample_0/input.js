// Input handling
import { gameState, GAME_PHASES, PLAY_PHASES } from './globals.js';
import { initializeTrialStatements, checkEvidenceMatch, advanceStatement, handleWrongEvidence } from './trial.js';
import { evidenceDatabase } from './locations.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Phase transition keys
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.playPhase = PLAY_PHASES.INVESTIGATION;
      logGameInfo(p, "Game started - Investigation phase");
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      logGameInfo(p, "Game paused");
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      logGameInfo(p, "Game resumed");
    }
    return;
  }
  
  if (keyCode === 82) { // R
    resetGame();
    logGameInfo(p, "Game reset");
    return;
  }
  
  // Gameplay keys
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.playPhase === PLAY_PHASES.INVESTIGATION) {
      handleInvestigationInput(p, keyCode);
    } else if (gameState.playPhase === PLAY_PHASES.TRIAL) {
      handleTrialInput(p, keyCode);
    }
  }
}

function handleInvestigationInput(p, keyCode) {
  if (!gameState.player) return;
  
  // Movement
  if (keyCode === 37) { // LEFT
    gameState.player.moveLeft();
  } else if (keyCode === 39) { // RIGHT
    gameState.player.moveRight();
  } else if (keyCode === 38) { // UP
    gameState.player.moveUp();
  } else if (keyCode === 40) { // DOWN
    gameState.player.moveDown();
  }
  
  // Quick travel
  if (keyCode === 16 && gameState.canQuickTravel) { // SHIFT
    gameState.currentLocation = (gameState.currentLocation + 1) % gameState.locations.length;
    gameState.player.x = 300;
    gameState.player.y = 200;
    gameState.player.targetX = 300;
    gameState.player.targetY = 200;
    gameState.transitionAlpha = 255;
  }
  
  // Examine
  if (keyCode === 32) { // SPACE
    const location = gameState.locations[gameState.currentLocation];
    
    // Check for nearby interactables
    for (let obj of location.interactables) {
      if (obj.isNearby(gameState.player.x, gameState.player.y) && !obj.examined) {
        obj.examined = true;
        const evidence = evidenceDatabase[obj.evidenceId];
        gameState.evidence.push(evidence);
        gameState.score += 100;
        logGameInfo(p, "Evidence collected: " + evidence.name);
        break;
      }
    }
    
    // Start trial if enough evidence
    if (gameState.evidence.length >= 5) {
      gameState.playPhase = PLAY_PHASES.TRIAL;
      gameState.trialStatements = initializeTrialStatements();
      gameState.currentStatement = 0;
      gameState.trialActive = true;
      logGameInfo(p, "Trial phase started");
    }
  }
}

function handleTrialInput(p, keyCode) {
  // Navigate evidence
  if (keyCode === 38) { // UP
    gameState.cursorPosition = Math.max(0, gameState.cursorPosition - 1);
  } else if (keyCode === 40) { // DOWN
    gameState.cursorPosition = Math.min(gameState.evidence.length - 1, gameState.cursorPosition + 1);
  }
  
  // Fire evidence
  if (keyCode === 90) { // Z
    if (gameState.currentStatement < gameState.trialStatements.length) {
      const statement = gameState.trialStatements[gameState.currentStatement];
      const selectedEvidence = gameState.evidence[gameState.cursorPosition];
      
      if (checkEvidenceMatch(selectedEvidence.id, statement)) {
        // Correct evidence!
        statement.contradicted = true;
        gameState.score += 200;
        logGameInfo(p, "Correct evidence used");
        
        if (advanceStatement()) {
          logGameInfo(p, "Trial won");
        }
      } else {
        // Wrong evidence
        logGameInfo(p, "Wrong evidence - mistake recorded");
        if (handleWrongEvidence()) {
          logGameInfo(p, "Game over - too many mistakes");
        }
      }
    }
  }
}

function logGameInfo(p, data) {
  if (p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

function resetGame() {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.playPhase = PLAY_PHASES.INVESTIGATION;
  gameState.score = 0;
  gameState.evidence = [];
  gameState.mistakes = 0;
  gameState.currentStatement = 0;
  gameState.currentLocation = 0;
  gameState.cursorPosition = 0;
  gameState.trialActive = false;
  gameState.statementTimer = 0;
  
  // Reset interactables
  gameState.locations.forEach(loc => {
    loc.interactables.forEach(obj => {
      obj.examined = false;
    });
  });
  
  if (gameState.player) {
    gameState.player.x = 300;
    gameState.player.y = 200;
    gameState.player.targetX = 300;
    gameState.player.targetY = 200;
  }
}