// input_handler.js - Input handling

import { gameState, GAME_PHASES, PLAY_PHASES, ROLES } from './globals.js';
import { initializeGame } from './game_logic.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      initializeGame(p);
      p.logs.game_info.push({
        data: { phase: "START_TO_PLAYING" },
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
        data: { phase: "PAUSED" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.logs.game_info.push({
        data: { phase: "RESUMED" },
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
      p.logs.game_info.push({
        data: { phase: "RESTART" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  // Z - Toggle role card
  if (keyCode === 90) {
    gameState.showRoleCard = !gameState.showRoleCard;
    return;
  }
  
  const phase = gameState.playPhase;
  
  // Night phase - select target
  if (phase === PLAY_PHASES.NIGHT && gameState.player.alive) {
    if (gameState.player.role === ROLES.TOWNIE) {
      // Townies have no night action
      return;
    }
    
    if (keyCode === 38) { // UP
      gameState.selectedOption = Math.max(0, gameState.selectedOption - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedOption = Math.min(gameState.menuOptions.length - 1, gameState.selectedOption + 1);
    } else if (keyCode === 32) { // SPACE
      const selectedIndex = gameState.menuOptions[gameState.selectedOption].index;
      
      if (gameState.player.role === ROLES.KILLER) {
        gameState.killerTarget = selectedIndex;
      } else if (gameState.player.role === ROLES.DOCTOR) {
        gameState.doctorTarget = selectedIndex;
      } else if (gameState.player.role === ROLES.SHERIFF) {
        gameState.sheriffTarget = selectedIndex;
        // Store investigation result
        const isKiller = gameState.players[selectedIndex].role === ROLES.KILLER;
        gameState.investigationResults.push({
          target: selectedIndex,
          isKiller: isKiller,
          day: gameState.currentDay
        });
      }
    } else if (keyCode === 16) { // SHIFT - skip turn
      if (gameState.player.role === ROLES.DOCTOR) {
        gameState.doctorTarget = -2; // -2 means deliberately skipped
      } else if (gameState.player.role === ROLES.SHERIFF) {
        gameState.sheriffTarget = -2;
      }
    }
  }
  
  // Day voting phase
  if (phase === PLAY_PHASES.DAY_VOTING && gameState.player.alive && !gameState.hasVoted) {
    if (keyCode === 38) { // UP
      gameState.selectedOption = Math.max(0, gameState.selectedOption - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedOption = Math.min(gameState.menuOptions.length - 1, gameState.selectedOption + 1);
    } else if (keyCode === 32) { // SPACE
      const selectedIndex = gameState.menuOptions[gameState.selectedOption].index;
      gameState.votes[gameState.playerIndex] = selectedIndex;
      gameState.votingTarget = selectedIndex;
      gameState.hasVoted = true;
    }
  }
  
  // Trial judgment phase
  if (phase === PLAY_PHASES.TRIAL_JUDGMENT && gameState.player.alive && 
      gameState.playerIndex !== gameState.onTrial && !gameState.hasVoted) {
    if (keyCode === 37) { // LEFT
      gameState.selectedOption = Math.max(0, gameState.selectedOption - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedOption = Math.min(2, gameState.selectedOption + 1);
    } else if (keyCode === 32) { // SPACE
      if (gameState.selectedOption === 0) {
        gameState.trialVotes.guilty++;
      } else if (gameState.selectedOption === 1) {
        gameState.trialVotes.innocent++;
      } else {
        gameState.trialVotes.abstain++;
      }
      gameState.hasVoted = true;
    }
  }
}

export function processAutomatedAction(p, action) {
  if (!action) return;
  
  // Simulate key press
  p.keyCode = action.keyCode;
  p.key = action.key;
  handleKeyPressed(p);
}