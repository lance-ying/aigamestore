import { gameState, GAME_PHASES, SPACE_TYPES, MINIGAME_TYPES } from './globals.js';
import { Minigame } from './minigame.js';

export function spinSpinner(p, spinner) {
  if (!gameState.isSpinning && !gameState.isMoving && !gameState.awaitingDecision && !gameState.inMinigame) {
    spinner.spin(p);
    gameState.isSpinning = true;
    gameState.spinnerValue = spinner.value;
  }
}

export function updateSpinner(spinner) {
  spinner.update();
  
  if (gameState.isSpinning && !spinner.spinning) {
    gameState.isSpinning = false;
    gameState.isMoving = true;
    gameState.targetSpace = Math.min(gameState.currentSpace + spinner.value, gameState.totalSpaces - 1);
    gameState.moveProgress = 0;
  }
}

export function updateMovement(player, board) {
  if (!gameState.isMoving) return;
  
  gameState.moveProgress += 0.05;
  
  if (gameState.moveProgress >= 1) {
    gameState.currentSpace++;
    
    if (gameState.currentSpace >= gameState.targetSpace) {
      gameState.isMoving = false;
      handleSpaceLanding(board.getSpace(gameState.currentSpace));
    } else {
      gameState.moveProgress = 0;
    }
  }
  
  // Update player position
  const currentPos = board.getPosition(gameState.currentSpace);
  const nextPos = board.getPosition(gameState.currentSpace + 1);
  
  player.setPosition(
    currentPos.x + (nextPos.x - currentPos.x) * gameState.moveProgress,
    currentPos.y + (nextPos.y - currentPos.y) * gameState.moveProgress
  );
}

export function handleSpaceLanding(space) {
  if (!space) return;
  
  gameState.spacesVisited.push(space.type);
  
  switch(space.type) {
    case SPACE_TYPES.CAREER:
      presentCareerDecision();
      break;
      
    case SPACE_TYPES.EDUCATION:
      presentEducationDecision();
      break;
      
    case SPACE_TYPES.INVESTMENT:
      presentInvestmentDecision();
      break;
      
    case SPACE_TYPES.EVENT:
      startRandomMinigame();
      break;
      
    case SPACE_TYPES.PAYDAY:
      handlePayday();
      break;
      
    case SPACE_TYPES.RETIREMENT:
      handleRetirement();
      break;
      
    default:
      // Normal space - small bonus
      gameState.money += 100;
      gameState.lifePoints += 1;
      break;
  }
}

function presentCareerDecision() {
  const options = [
    { 
      text: "Entry Level Job (+$2000, +2 LP)", 
      effect: () => { 
        gameState.money += 2000; 
        gameState.lifePoints += 2; 
        gameState.careerLevel = 1;
      }
    },
    { 
      text: "Mid Career (+$5000, +5 LP, needs College)", 
      effect: () => {
        if (gameState.hasCollege) {
          gameState.money += 5000;
          gameState.lifePoints += 5;
          gameState.careerLevel = 2;
        } else {
          gameState.money += 1000;
          gameState.lifePoints += 1;
        }
      }
    },
    { 
      text: "High Level (+$10000, +10 LP, Career Lvl 2+)", 
      effect: () => {
        if (gameState.careerLevel >= 2) {
          gameState.money += 10000;
          gameState.lifePoints += 10;
          gameState.careerLevel = 3;
        } else {
          gameState.money += 2000;
          gameState.lifePoints += 2;
        }
      }
    }
  ];
  
  gameState.awaitingDecision = true;
  gameState.decisionOptions = options;
  gameState.selectedOption = 0;
}

function presentEducationDecision() {
  const options = [
    { 
      text: "Skip Education (Free, +1 LP)", 
      effect: () => { 
        gameState.lifePoints += 1; 
      }
    },
    { 
      text: "Trade School (-$3000, +3 LP)", 
      effect: () => { 
        gameState.money -= 3000;
        gameState.lifePoints += 3;
        gameState.hasCollege = false;
      }
    },
    { 
      text: "College (-$5000, +5 LP, unlocks better careers)", 
      effect: () => {
        gameState.money -= 5000;
        gameState.lifePoints += 5;
        gameState.hasCollege = true;
      }
    }
  ];
  
  gameState.awaitingDecision = true;
  gameState.decisionOptions = options;
  gameState.selectedOption = 0;
}

function presentInvestmentDecision() {
  const options = [
    { 
      text: "Safe Investment (-$2000, +$3000 assets)", 
      effect: () => { 
        if (gameState.money >= 2000) {
          gameState.money -= 2000;
          gameState.assets += 3000;
          gameState.lifePoints += 2;
        }
      }
    },
    { 
      text: "Risky Investment (-$5000, 50% for +$12000 assets)", 
      effect: () => {
        if (gameState.money >= 5000) {
          gameState.money -= 5000;
          if (Math.random() > 0.5) {
            gameState.assets += 12000;
            gameState.lifePoints += 8;
          } else {
            gameState.lifePoints += 1;
          }
        }
      }
    },
    { 
      text: "Skip Investment", 
      effect: () => { 
        gameState.lifePoints += 1; 
      }
    }
  ];
  
  gameState.awaitingDecision = true;
  gameState.decisionOptions = options;
  gameState.selectedOption = 0;
}

export function handleDecisionInput(keyCode) {
  if (!gameState.awaitingDecision) return false;
  
  if (keyCode === 38 || keyCode === 37) { // UP or LEFT
    gameState.selectedOption = (gameState.selectedOption - 1 + gameState.decisionOptions.length) % gameState.decisionOptions.length;
    return true;
  } else if (keyCode === 40 || keyCode === 39) { // DOWN or RIGHT
    gameState.selectedOption = (gameState.selectedOption + 1) % gameState.decisionOptions.length;
    return true;
  } else if (keyCode === 32) { // SPACE
    const option = gameState.decisionOptions[gameState.selectedOption];
    option.effect();
    gameState.awaitingDecision = false;
    gameState.decisionOptions = [];
    
    // Check for bankruptcy
    if (gameState.money < 0) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    }
    return true;
  }
  
  return false;
}

function startRandomMinigame() {
  const types = [MINIGAME_TYPES.TAP_TIMING, MINIGAME_TYPES.RAPID_TAP, MINIGAME_TYPES.SEQUENCE];
  const type = types[Math.floor(Math.random() * types.length)];
  
  gameState.inMinigame = true;
  gameState.minigameType = type;
  gameState.minigameComplete = false;
}

export function updateMinigame(p, minigame) {
  if (!minigame) return;
  
  minigame.update();
  
  if (minigame.complete && !gameState.minigameComplete) {
    gameState.minigameComplete = true;
    const reward = minigame.getReward();
    gameState.money += reward;
    gameState.minigameScore = minigame.score;
    
    if (minigame.isSuccess()) {
      gameState.lifePoints += 5;
    } else {
      gameState.lifePoints += 1;
    }
    
    // Exit minigame after a short delay
    setTimeout(() => {
      gameState.inMinigame = false;
      gameState.minigameType = null;
    }, 1000);
  }
}

export function handleMinigameInput(keyCode, minigame) {
  if (!gameState.inMinigame || !minigame) return false;
  
  minigame.handleInput(keyCode);
  return true;
}

function handlePayday() {
  const basePay = 1000;
  const careerBonus = gameState.careerLevel * 500;
  const total = basePay + careerBonus;
  
  gameState.money += total;
  gameState.lifePoints += 3;
}

function handleRetirement() {
  const netWorth = gameState.money + gameState.assets;
  gameState.score = netWorth;
  
  if (netWorth >= 100000) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
  } else {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }
}