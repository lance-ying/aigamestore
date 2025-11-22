import { gameState, GAME_PHASES, PLAY_SUBSTATES } from './globals.js';

export function handleKeyPressed(p) {
  const keyCode = p.keyCode;
  
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      startGame(p);
    }
  } else if (keyCode === 27) { // ESC
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
  } else if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
        gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      resetGame(p);
    }
  } else if (keyCode === 16) { // SHIFT
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.showAttributePanel = !gameState.showAttributePanel;
    }
  }
  
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    handlePlayingInput(keyCode, p);
  }
}

function handlePlayingInput(keyCode, p) {
  if (gameState.playSubstate === PLAY_SUBSTATES.DIALOGUE && gameState.currentDialogue) {
    if (keyCode === 38) { // UP
      gameState.selectedDialogueOption = Math.max(0, gameState.selectedDialogueOption - 1);
    } else if (keyCode === 40) { // DOWN
      gameState.selectedDialogueOption = Math.min(
        gameState.currentDialogue.choices.length - 1, 
        gameState.selectedDialogueOption + 1
      );
    } else if (keyCode === 32 || keyCode === 90) { // SPACE or Z
      const success = gameState.currentDialogue.selectChoice(gameState.selectedDialogueOption, p);
      if (success || !gameState.currentDialogue.choices[gameState.selectedDialogueOption].attributeReq) {
        gameState.currentDialogue = null;
        gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
        gameState.selectedDialogueOption = 0;
      }
    }
  } else if (gameState.playSubstate === PLAY_SUBSTATES.DUEL && gameState.currentDuel) {
    if (keyCode === 37) { // LEFT
      gameState.selectedDuelStance = Math.max(0, gameState.selectedDuelStance - 1);
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedDuelStance = Math.min(2, gameState.selectedDuelStance + 1);
    } else if (keyCode === 32 || keyCode === 90) { // SPACE or Z
      if (gameState.currentDuel.resultTimer === 0) {
        const stance = gameState.currentDuel.stances[gameState.selectedDuelStance];
        const result = gameState.currentDuel.playRound(stance);
        
        if (result === 'win') {
          gameState.housePoints += 25;
          gameState.duelsWonThisYear++;
          gameState.currentDuel = null;
          gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
          gameState.selectedDuelStance = 0;
        } else if (result === 'lose') {
          gameState.housePoints -= 10;
          gameState.currentDuel = null;
          gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
          gameState.selectedDuelStance = 0;
          
          if (gameState.duelsRequiredPerYear[gameState.currentYear - 1] > 0) {
            gameOverLose("Failed critical duel", p);
          }
        } else if (result === 'tie') {
          gameState.housePoints += 5;
          gameState.currentDuel = null;
          gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
          gameState.selectedDuelStance = 0;
        }
      }
    }
  }
}

function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", year: gameState.currentYear },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  logPlayerInfo(p);
}

function resetGame(p) {
  gameState.gamePhase = GAME_PHASES.START;
  gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
  gameState.currentYear = 1;
  gameState.currentEnergy = 25;
  gameState.courage = 1;
  gameState.empathy = 1;
  gameState.knowledge = 1;
  gameState.housePoints = 0;
  gameState.currentScene = 0;
  gameState.tasksCompletedThisYear = 0;
  gameState.duelsWonThisYear = 0;
  gameState.showAttributePanel = true;
  gameState.gameOverReason = "";
  
  p.logs.game_info.push({
    data: { phase: "START", action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function gameOverWin(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER_WIN", finalScore: gameState.housePoints },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function gameOverLose(reason, p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  gameState.gameOverReason = reason;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER_LOSE", reason: reason, finalScore: gameState.housePoints },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerInfo(p) {
  p.logs.player_info.push({
    screen_x: 50,
    screen_y: 50,
    game_x: 50,
    game_y: 50,
    framecount: p.frameCount
  });
}