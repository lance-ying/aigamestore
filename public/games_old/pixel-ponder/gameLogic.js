import { gameState, GAME_PHASES, LEVELS, CANVAS_WIDTH } from './globals.js';
import { levelDifferences } from './levelData.js';

export function startLevel(p, levelNumber) {
  gameState.currentLevel = levelNumber;
  gameState.score = 0;
  gameState.differencesFound = 0;
  gameState.foundMarkers = [];
  gameState.hintActive = false;
  gameState.hintTimer = 0;
  gameState.hintTargetIndex = -1;
  
  const levelData = LEVELS[levelNumber - 1];
  gameState.timeRemaining = levelData.timeLimit;
  gameState.hintsRemaining = levelData.hints;
  
  // Load differences for this level
  gameState.differences = JSON.parse(JSON.stringify(levelDifferences[levelNumber]));
  
  gameState.gamePhase = GAME_PHASES.PLAYING;
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase,
      level: gameState.currentLevel,
      totalScore: gameState.totalScore
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGame(p, deltaTime) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  // Update time
  gameState.timeRemaining -= deltaTime;
  
  if (gameState.timeRemaining <= 0) {
    gameState.timeRemaining = 0;
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, reason: "time_out" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Update hint timer
  if (gameState.hintActive) {
    gameState.hintTimer -= deltaTime;
    if (gameState.hintTimer <= 0) {
      gameState.hintActive = false;
      gameState.hintTargetIndex = -1;
    }
  }
  
  // Update marker animations
  for (let marker of gameState.foundMarkers) {
    if (marker.opacity < 255) {
      marker.opacity = Math.min(255, marker.opacity + deltaTime * 500);
    }
  }
  
  // Check level completion
  const levelData = LEVELS[gameState.currentLevel - 1];
  if (gameState.differencesFound >= levelData.totalDifferences) {
    completeLevel(p);
  }
}

function completeLevel(p) {
  // Calculate bonuses
  const timeBonus = Math.floor(gameState.timeRemaining * 5);
  const levelBonus = gameState.levelCompleteBonus;
  
  gameState.score += timeBonus + levelBonus;
  gameState.totalScore += gameState.score;
  
  gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase,
      level: gameState.currentLevel,
      levelScore: gameState.score,
      totalScore: gameState.totalScore,
      timeBonus: timeBonus,
      levelBonus: levelBonus
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function checkDifferenceClick(p, mouseX, mouseY) {
  const imageY = 45;
  const leftX = 10;
  const rightX = 310;
  const imageWidth = 280;
  const imageHeight = 350;
  
  // Check if click is within either image
  let clickInImage = false;
  let relativeX = 0;
  let relativeY = 0;
  
  if (mouseX >= leftX && mouseX <= leftX + imageWidth &&
      mouseY >= imageY && mouseY <= imageY + imageHeight) {
    clickInImage = true;
    relativeX = mouseX - leftX;
    relativeY = mouseY - imageY;
  } else if (mouseX >= rightX && mouseX <= rightX + imageWidth &&
             mouseY >= imageY && mouseY <= imageY + imageHeight) {
    clickInImage = true;
    relativeX = mouseX - rightX;
    relativeY = mouseY - imageY;
  }
  
  if (!clickInImage) {
    return;
  }
  
  // Check if click is on a difference
  let foundDifference = false;
  
  for (let i = 0; i < gameState.differences.length; i++) {
    const diff = gameState.differences[i];
    if (diff.isFound) continue;
    
    const distance = Math.sqrt(
      Math.pow(relativeX - diff.x, 2) + Math.pow(relativeY - diff.y, 2)
    );
    
    if (distance <= diff.radius) {
      // Found a difference!
      diff.isFound = true;
      gameState.differencesFound++;
      gameState.score += gameState.correctDifferenceReward;
      
      // Add marker
      gameState.foundMarkers.push({
        x: diff.x,
        y: diff.y,
        opacity: 0
      });
      
      foundDifference = true;
      
      p.logs.player_info.push({
        screen_x: mouseX,
        screen_y: mouseY,
        game_x: relativeX,
        game_y: relativeY,
        framecount: p.frameCount,
        action: "found_difference",
        differenceIndex: i
      });
      
      break;
    }
  }
  
  if (!foundDifference) {
    // Incorrect click penalty
    gameState.score = Math.max(0, gameState.score - gameState.incorrectClickPenalty);
    
    p.logs.player_info.push({
      screen_x: mouseX,
      screen_y: mouseY,
      game_x: relativeX,
      game_y: relativeY,
      framecount: p.frameCount,
      action: "incorrect_click"
    });
  }
}

export function useHint(p) {
  if (gameState.hintsRemaining <= 0 || gameState.hintActive) {
    return;
  }
  
  // Find an unfound difference
  const unfoundIndices = [];
  for (let i = 0; i < gameState.differences.length; i++) {
    if (!gameState.differences[i].isFound) {
      unfoundIndices.push(i);
    }
  }
  
  if (unfoundIndices.length === 0) {
    return;
  }
  
  // Pick a random unfound difference
  const randomIndex = unfoundIndices[Math.floor(Math.random() * unfoundIndices.length)];
  
  gameState.hintsRemaining--;
  gameState.score = Math.max(0, gameState.score - gameState.hintPenalty);
  gameState.hintActive = true;
  gameState.hintTimer = 2.0; // 2 seconds
  gameState.hintTargetIndex = randomIndex;
  
  p.logs.player_info.push({
    framecount: p.frameCount,
    action: "used_hint",
    hintTarget: randomIndex,
    hintsRemaining: gameState.hintsRemaining
  });
}

export function resetGame(p) {
  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.totalScore = 0;
  gameState.differencesFound = 0;
  gameState.timeRemaining = 0;
  gameState.hintsRemaining = 0;
  gameState.differences = [];
  gameState.foundMarkers = [];
  gameState.hintActive = false;
  gameState.hintTimer = 0;
  gameState.hintTargetIndex = -1;
  gameState.gamePhase = GAME_PHASES.START;
  
  p.logs.game_info.push({
    data: { phase: gameState.gamePhase, action: "reset" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}