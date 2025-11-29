// gameLogic.js - Core game logic

import { gameState, LEVELS, ZOOM_MIN, ZOOM_MAX } from './globals.js';
import { generateArtworkForLevel } from './artworkGenerator.js';
import { startCompletionAnimation } from './rendering.js';

export function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  loadLevel(p);
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadLevel(p) {
  const artworkData = generateArtworkForLevel(gameState.currentLevel);
  
  gameState.artworkSegments = artworkData.segments;
  gameState.colorPalette = artworkData.palette;
  gameState.currentSelectedColorID = null;
  gameState.totalSegments = artworkData.segments.length;
  gameState.filledSegments = 0;
  
  // Reset camera
  gameState.canvasTransform = {
    zoomLevel: 1.0,
    panOffsetX: 0,
    panOffsetY: 0
  };
  
  // Start timing
  gameState.levelStartTime = Date.now();
  
  // Auto-select first color
  if (gameState.colorPalette.length > 0) {
    gameState.currentSelectedColorID = gameState.colorPalette[0].id;
  }
}

export function togglePause(p) {
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "PAUSED";
    p.logs.game_info.push({
      data: { phase: "PAUSED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === "PAUSED") {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function restartGame(p) {
  gameState.gamePhase = "START";
  gameState.currentLevel = 1;
  gameState.artworkSegments = [];
  gameState.colorPalette = [];
  gameState.currentSelectedColorID = null;
  gameState.completionAnimation.active = false;
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function selectNextColor() {
  if (gameState.colorPalette.length === 0) return;
  
  const currentIndex = gameState.colorPalette.findIndex(c => c.id === gameState.currentSelectedColorID);
  const nextIndex = (currentIndex + 1) % gameState.colorPalette.length;
  gameState.currentSelectedColorID = gameState.colorPalette[nextIndex].id;
}

export function tryFillSegment(segment) {
  if (segment.isFilled) return false;
  if (segment.targetColorID !== gameState.currentSelectedColorID) return false;
  
  // Fill the segment
  segment.isFilled = true;
  segment.fillColor = {
    h: segment.targetColor.hue,
    s: segment.targetColor.saturation,
    b: segment.targetColor.brightness
  };
  
  gameState.filledSegments++;
  gameState.score += 10;
  
  // Check for completion
  if (gameState.filledSegments >= gameState.totalSegments) {
    completeLevel();
  }
  
  return true;
}

export function completeLevel() {
  // Calculate bonuses
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  gameState.score += 1000; // Completion bonus
  
  const elapsed = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  const timeBonus = Math.max(0, (levelConfig.maxTime - elapsed) * 5);
  gameState.score += timeBonus;
  
  // Start animation
  startCompletionAnimation();
  
  // Move to next level or game over
  if (gameState.currentLevel < LEVELS.length) {
    setTimeout(() => {
      gameState.currentLevel++;
      loadLevel(window.gameInstance);
    }, 3000);
  } else {
    setTimeout(() => {
      gameState.gamePhase = "GAME_OVER_WIN";
      
      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        try {
          localStorage.setItem('paintByNumberHighScore', gameState.highScore.toString());
        } catch (e) {
          console.log('Could not save high score');
        }
      }
      
      window.gameInstance.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", score: gameState.score },
        framecount: window.gameInstance.frameCount,
        timestamp: Date.now()
      });
    }, 3000);
  }
}

export function updateGame(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Update player info log periodically
  if (p.frameCount % 30 === 0) {
    p.logs.player_info.push({
      screen_x: 0,
      screen_y: 0,
      game_x: gameState.canvasTransform.panOffsetX,
      game_y: gameState.canvasTransform.panOffsetY,
      framecount: p.frameCount
    });
  }
}

export function loadHighScore() {
  try {
    const saved = localStorage.getItem('paintByNumberHighScore');
    if (saved) {
      gameState.highScore = parseInt(saved) || 0;
    }
  } catch (e) {
    console.log('Could not load high score');
  }
}