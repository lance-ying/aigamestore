import { gameState, GAME_PHASES, PLAY_SUBSTATES } from './globals.js';
import { createScenesForYear } from './scenes.js';
import { createDialoguesForYear } from './dialogue.js';
import { createDuelsForYear } from './duel.js';
import { gameOverWin, gameOverLose } from './input.js';

let availableDialogues = [];
let availableDuels = [];

export function initializeYear(p) {
  const scenes = createScenesForYear(gameState.currentYear, p);
  gameState.interactiveObjects = [];
  
  for (const scene of scenes) {
    gameState.interactiveObjects.push(...scene.objects);
  }
  
  availableDialogues = createDialoguesForYear(gameState.currentYear, p);
  availableDuels = createDuelsForYear(gameState.currentYear, p);
  
  gameState.currentScene = 0;
  gameState.tasksCompletedThisYear = 0;
  gameState.duelsWonThisYear = 0;
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  updateEnergy(p);
  
  if (gameState.playSubstate === PLAY_SUBSTATES.LEVEL_TRANSITION) {
    updateLevelTransition(p);
  } else if (gameState.playSubstate === PLAY_SUBSTATES.DUEL && gameState.currentDuel) {
    gameState.currentDuel.update();
  }
  
  checkYearCompletion(p);
  
  if (gameState.controlMode !== "HUMAN") {
    handleAutomatedControl(p);
  }
}

function updateEnergy(p) {
  const currentTime = Date.now();
  if (currentTime - gameState.lastEnergyRegen >= gameState.energyRegenInterval) {
    gameState.currentEnergy = Math.min(gameState.maxEnergy, gameState.currentEnergy + gameState.energyRegenRate);
    gameState.lastEnergyRegen = currentTime;
  }
}

function updateLevelTransition(p) {
  gameState.transitionTimer++;
  if (gameState.transitionTimer >= gameState.transitionDuration) {
    gameState.transitionTimer = 0;
    gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
    initializeYear(p);
    
    if (availableDialogues.length > 0) {
      gameState.currentDialogue = availableDialogues.shift();
      gameState.playSubstate = PLAY_SUBSTATES.DIALOGUE;
    }
  }
}

function checkYearCompletion(p) {
  const tasksRequired = gameState.tasksRequiredPerYear[gameState.currentYear - 1];
  const duelsRequired = gameState.duelsRequiredPerYear[gameState.currentYear - 1];
  
  if (gameState.tasksCompletedThisYear >= tasksRequired && 
      gameState.duelsWonThisYear >= duelsRequired &&
      gameState.playSubstate === PLAY_SUBSTATES.EXPLORATION) {
    
    const bonus = (gameState.courage + gameState.empathy + gameState.knowledge) * 2;
    gameState.housePoints += 100 + bonus;
    
    if (gameState.housePoints < 0) {
      gameOverLose("House Points too low", p);
      return;
    }
    
    if (gameState.currentYear >= 5) {
      gameOverWin(p);
    } else {
      gameState.currentYear++;
      gameState.playSubstate = PLAY_SUBSTATES.LEVEL_TRANSITION;
      
      p.logs.game_info.push({
        data: { phase: "LEVEL_TRANSITION", newYear: gameState.currentYear },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export function handleObjectClick(x, y, p) {
  if (gameState.playSubstate !== PLAY_SUBSTATES.EXPLORATION) return;
  
  for (const obj of gameState.interactiveObjects) {
    if (!obj.completed && obj.isClicked(x, y, p)) {
      if (gameState.currentEnergy >= obj.energyCost) {
        gameState.currentEnergy -= obj.energyCost;
        obj.completed = true;
        gameState.tasksCompletedThisYear++;
        gameState.housePoints += 10;
        
        p.logs.player_info.push({
          screen_x: x,
          screen_y: y,
          game_x: x,
          game_y: y,
          framecount: p.frameCount
        });
        
        if (availableDialogues.length > 0 && Math.random() < 0.3) {
          gameState.currentDialogue = availableDialogues.shift();
          gameState.playSubstate = PLAY_SUBSTATES.DIALOGUE;
        } else if (availableDuels.length > 0 && Math.random() < 0.4) {
          gameState.currentDuel = availableDuels.shift();
          gameState.playSubstate = PLAY_SUBSTATES.DUEL;
          gameState.selectedDuelStance = 0;
        }
        
        return;
      }
    }
  }
}

function handleAutomatedControl(p) {
  if (gameState.controlMode === "TEST_1") {
    if (p.frameCount % 60 === 0 && gameState.playSubstate === PLAY_SUBSTATES.EXPLORATION) {
      for (const obj of gameState.interactiveObjects) {
        if (!obj.completed && gameState.currentEnergy >= obj.energyCost) {
          handleObjectClick(obj.x, obj.y, p);
          break;
        }
      }
    }
    
    if (gameState.playSubstate === PLAY_SUBSTATES.DIALOGUE && gameState.currentDialogue) {
      if (p.frameCount % 30 === 0) {
        gameState.currentDialogue.selectChoice(0, p);
        gameState.currentDialogue = null;
        gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
      }
    }
    
    if (gameState.playSubstate === PLAY_SUBSTATES.DUEL && gameState.currentDuel) {
      if (p.frameCount % 60 === 0 && gameState.currentDuel.resultTimer === 0) {
        const result = gameState.currentDuel.playRound('Aggressive');
        if (result !== 'continue') {
          if (result === 'win') {
            gameState.housePoints += 25;
            gameState.duelsWonThisYear++;
          } else if (result === 'lose') {
            gameState.housePoints -= 10;
          } else if (result === 'tie') {
            gameState.housePoints += 5;
          }
          gameState.currentDuel = null;
          gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
        }
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    gameState.currentEnergy = gameState.maxEnergy;
    
    if (p.frameCount % 20 === 0 && gameState.playSubstate === PLAY_SUBSTATES.EXPLORATION) {
      for (const obj of gameState.interactiveObjects) {
        if (!obj.completed) {
          handleObjectClick(obj.x, obj.y, p);
          break;
        }
      }
    }
    
    if (gameState.playSubstate === PLAY_SUBSTATES.DIALOGUE && gameState.currentDialogue) {
      if (p.frameCount % 20 === 0) {
        let choiceIndex = 0;
        for (let i = 0; i < gameState.currentDialogue.choices.length; i++) {
          const choice = gameState.currentDialogue.choices[i];
          if (!choice.attributeReq || gameState[choice.attributeReq.attr] >= choice.attributeReq.value) {
            choiceIndex = i;
            break;
          }
        }
        gameState.currentDialogue.selectChoice(choiceIndex, p);
        gameState.currentDialogue = null;
        gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
      }
    }
    
    if (gameState.playSubstate === PLAY_SUBSTATES.DUEL && gameState.currentDuel) {
      if (p.frameCount % 30 === 0 && gameState.currentDuel.resultTimer === 0) {
        const stances = ['Aggressive', 'Defensive', 'Sneaky'];
        const stance = stances[p.frameCount % 3];
        const result = gameState.currentDuel.playRound(stance);
        if (result !== 'continue') {
          if (result === 'win') {
            gameState.housePoints += 25;
            gameState.duelsWonThisYear++;
          } else if (result === 'lose') {
            gameState.housePoints -= 10;
          } else if (result === 'tie') {
            gameState.housePoints += 5;
          }
          gameState.currentDuel = null;
          gameState.playSubstate = PLAY_SUBSTATES.EXPLORATION;
        }
      }
    }
  }
}