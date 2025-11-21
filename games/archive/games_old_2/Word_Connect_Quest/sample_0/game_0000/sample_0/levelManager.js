// levelManager.js - Level management and grid utilities

import { gameState, levelData, GAME_PHASES } from './globals.js';

export function initLevel(levelIndex) {
  gameState.currentLevelIndex = levelIndex;
  gameState.levelStartTime = Date.now();
  gameState.currentWord = [];
  gameState.selectedLetters = [];
  gameState.feedbackMessage = "";
  gameState.feedbackTimer = 0;
  gameState.keyboardSelectedIndex = -1;
  
  // Reset found status for all words in the level
  const level = levelData[levelIndex];
  level.words.forEach(wordObj => {
    wordObj.found = false;
  });
}

export function getCurrentLevel() {
  return levelData[gameState.currentLevelIndex];
}

export function checkLevelComplete() {
  const level = getCurrentLevel();
  return level.words.every(wordObj => wordObj.found);
}

export function calculateTimeBonus() {
  const level = getCurrentLevel();
  const elapsedTime = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const timeDiff = level.targetTime - elapsedTime;
  return timeDiff > 0 ? timeDiff * 5 : 0;
}

export function getGridDimensions() {
  const level = getCurrentLevel();
  let maxX = 0;
  let maxY = 0;
  
  level.words.forEach(wordObj => {
    const endX = wordObj.horizontal ? wordObj.startX + wordObj.word.length - 1 : wordObj.startX;
    const endY = wordObj.horizontal ? wordObj.startY : wordObj.startY + wordObj.word.length - 1;
    maxX = Math.max(maxX, endX);
    maxY = Math.max(maxY, endY);
  });
  
  return { width: maxX + 1, height: maxY + 1 };
}

export function getGridCell(x, y) {
  const level = getCurrentLevel();
  
  for (let wordObj of level.words) {
    if (wordObj.horizontal) {
      if (y === wordObj.startY && x >= wordObj.startX && x < wordObj.startX + wordObj.word.length) {
        return {
          letter: wordObj.word[x - wordObj.startX],
          found: wordObj.found,
          wordObj: wordObj,
          letterIndex: x - wordObj.startX
        };
      }
    } else {
      if (x === wordObj.startX && y >= wordObj.startY && y < wordObj.startY + wordObj.word.length) {
        return {
          letter: wordObj.word[y - wordObj.startY],
          found: wordObj.found,
          wordObj: wordObj,
          letterIndex: y - wordObj.startY
        };
      }
    }
  }
  
  return null;
}

export function submitWord() {
  if (gameState.currentWord.length === 0) return;
  
  const wordString = gameState.currentWord.join("");
  const level = getCurrentLevel();
  
  // Check if word exists in level
  const foundWord = level.words.find(w => w.word === wordString && !w.found);
  
  if (foundWord) {
    foundWord.found = true;
    gameState.score += 100;
    gameState.feedbackMessage = `+100 ${wordString}!`;
    gameState.feedbackTimer = 60;
    
    // Check if level complete
    if (checkLevelComplete()) {
      const timeBonus = calculateTimeBonus();
      gameState.score += 500 + timeBonus;
      
      if (gameState.currentLevelIndex < levelData.length - 1) {
        // More levels to go
        setTimeout(() => {
          gameState.currentLevelIndex++;
          initLevel(gameState.currentLevelIndex);
        }, 1000);
      } else {
        // Game won!
        setTimeout(() => {
          if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('wordConnectHighScore', gameState.highScore);
            }
          }
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        }, 1000);
      }
    }
  } else if (level.words.find(w => w.word === wordString && w.found)) {
    gameState.feedbackMessage = "ALREADY FOUND!";
    gameState.feedbackTimer = 60;
  } else {
    gameState.feedbackMessage = "INVALID WORD!";
    gameState.feedbackTimer = 60;
  }
  
  gameState.currentWord = [];
  gameState.selectedLetters = [];
  gameState.keyboardSelectedIndex = -1;
}