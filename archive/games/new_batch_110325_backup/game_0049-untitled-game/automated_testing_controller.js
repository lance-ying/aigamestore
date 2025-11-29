// automated_testing_controller.js
import { gameState, GAME_PHASES, SCREENS, OPPONENTS } from './globals.js';

let actionHistory = [];
let stateHistory = [];
let trainingCompleted = {};
let battlesAttempted = 0;

function getTestWinAction(gameState) {
  // Strategy: Train stats systematically, then battle in order
  
  // Track state to prevent getting stuck
  const currentState = `${gameState.screen}_${gameState.selectedObject}_${gameState.trainingProgress}_${gameState.battleTurn}`;
  stateHistory.push(currentState);
  if (stateHistory.length > 300) stateHistory.shift();
  
  // Detect if stuck (same state for many frames)
  const recentStates = stateHistory.slice(-60);
  const stuckInState = recentStates.length === 60 && recentStates.every(s => s === currentState);
  
  if (gameState.screen === SCREENS.WORLD) {
    // Check if we should train more or start battling
    const totalStats = gameState.player.power + gameState.player.defence + 
                      gameState.player.speed + gameState.player.special;
    
    // Train until we have good stats (at least 150 total)
    if (totalStats < 150) {
      // Find a training dojo we haven't completed much
      const trainingObjects = gameState.worldObjects.filter(obj => obj.type === 'training');
      
      // Rotate through training types
      const trainingPriority = ['power', 'speed', 'defence', 'special', 'health'];
      for (const trainType of trainingPriority) {
        const targetTraining = trainingObjects.find(obj => obj.trainingId === trainType);
        if (targetTraining) {
          const index = gameState.worldObjects.indexOf(targetTraining);
          
          if (gameState.selectedObject === index) {
            return 32; // SPACE to enter training
          } else if (gameState.selectedObject < index) {
            return 39; // RIGHT
          } else {
            return 37; // LEFT
          }
        }
      }
    }
    
    // After training, battle opponents
    const nextOpponent = gameState.worldObjects.find(
      obj => obj.type === 'opponent' && !gameState.defeatedOpponents.includes(obj.opponentId)
    );
    
    if (nextOpponent) {
      const index = gameState.worldObjects.indexOf(nextOpponent);
      
      if (gameState.selectedObject === index) {
        battlesAttempted++;
        return 32; // SPACE to start battle
      } else if (gameState.selectedObject < index) {
        return 39; // RIGHT
      } else {
        return 37; // LEFT
      }
    }
    
    // If stuck, try moving
    if (stuckInState) {
      return Math.random() > 0.5 ? 37 : 39;
    }
  }
  
  if (gameState.screen === SCREENS.TRAINING_GAME && gameState.currentTraining) {
    // Handle different training types
    if (gameState.currentTraining === 'power' || gameState.currentTraining === 'special') {
      // Rhythm game - match arrows
      if (gameState.trainingInput.length < gameState.trainingSequence.length) {
        const expectedArrow = gameState.trainingSequence[gameState.trainingInput.length];
        return 37 + expectedArrow; // Convert 0-3 to arrow key codes
      }
    } else if (gameState.currentTraining === 'speed') {
      // Rapid tapping
      return 32; // SPACE
    } else if (gameState.currentTraining === 'defence' || gameState.currentTraining === 'health') {
      // Timing game - press at right moment
      const timing = gameState.trainingTimer % 60;
      if (timing > 27 && timing < 33) { // Slightly wider window for reliability
        return 32; // SPACE
      }
    }
    
    // If stuck in training, try space
    if (stuckInState) {
      return 32;
    }
  }
  
  if (gameState.screen === SCREENS.BATTLE && gameState.inBattle) {
    if (gameState.battleTurn === "PLAYER" && !gameState.battleAction) {
      // Intelligent battle strategy
      const healthRatio = gameState.playerBattleHealth / gameState.player.maxHealth;
      const opponentHealthRatio = gameState.opponentBattleHealth / gameState.currentOpponent.health;
      
      // If low health, defend
      if (healthRatio < 0.3) {
        if (gameState.selectedAction !== 2) return 40; // Move to defend
        return 32; // Confirm defend
      }
      
      // If opponent low health, use special attack to finish
      if (opponentHealthRatio < 0.3) {
        if (gameState.selectedAction !== 1) return 40; // Move to special
        return 32; // Confirm special
      }
      
      // Otherwise use regular attack
      if (gameState.selectedAction !== 0) return 38; // Move to attack
      return 32; // Confirm attack
    }
  }
  
  if (gameState.screen === SCREENS.EQUIPMENT) {
    // Quickly exit equipment menu
    return 90; // Z to go back
  }
  
  // Default: try space
  return 32;
}

function getRandomTestAction(gameState) {
  // Simple random testing
  const validKeys = [37, 38, 39, 40, 32, 90]; // Arrows, space, Z
  return validKeys[Math.floor(Math.random() * validKeys.length)];
}

function getBasicTestAction(gameState) {
  // Test navigation and basic interactions
  
  if (gameState.screen === SCREENS.WORLD) {
    // Cycle through objects
    if (Math.random() > 0.7) {
      return 32; // Interact
    }
    return Math.random() > 0.5 ? 37 : 39; // Navigate
  }
  
  if (gameState.screen === SCREENS.TRAINING_GAME) {
    // Random training inputs
    if (Math.random() > 0.5) {
      return 32; // Space
    }
    return 37 + Math.floor(Math.random() * 4); // Random arrow
  }
  
  if (gameState.screen === SCREENS.BATTLE) {
    if (gameState.battleTurn === "PLAYER" && !gameState.battleAction) {
      if (Math.random() > 0.7) {
        return 32; // Confirm
      }
      return Math.random() > 0.5 ? 38 : 40; // Navigate actions
    }
  }
  
  if (gameState.screen === SCREENS.EQUIPMENT) {
    return 90; // Exit
  }
  
  return 32;
}

export function get_automated_testing_action(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getRandomTestAction(gameState);
    default:
      return null;
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;