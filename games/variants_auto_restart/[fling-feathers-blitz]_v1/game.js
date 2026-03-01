import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, SCORE_UNUSED_BIRD } from './globals.js';
import { initPhysicsEngine, updatePhysics, clearPhysicsWorld } from './physics.js';
import { Bird, Pig, StructureBlock } from './entities.js';
import { createLevel } from './levels.js';
import { handleKeyPressed, handleKeyReleased, updateAiming } from './input.js';
import { renderGame } from './renderer.js';

// Ensure p5 is loaded
const p5 = window.p5;
if (!p5) {
  console.error('p5.js library not loaded!');
}

let gameInstance = p5 ? new p5(p => {
  p.setup = function() {
    // Create canvas and attach to container
    const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent('game-container');
    
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize Matter.js physics
    initPhysicsEngine();
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Clear background once
    p.background(135, 206, 235);
    
    // Update game logic
    if (gameState.gamePhase === "PLAYING") {
      updateAiming(p);
      updatePhysics();
      updateGameState(p);
      checkWinLoseConditions(p);
    }
    
    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };
}) : null;

function updateGameState(p) {
  // Update trails for birds
  gameState.activeBirds.forEach(bird => {
    if (bird.active) {
      bird.updateTrail();
    }
  });
  
  // Remove inactive birds from active list
  const World = window.Matter.World;
  gameState.activeBirds = gameState.activeBirds.filter(bird => {
    if (!bird.active) {
      // Ensure body is removed from world when bird becomes inactive
      if (bird.body && gameState.matterWorld) {
        World.remove(gameState.matterWorld, bird.body);
        bird.body = null; // Clear reference to prevent stale body issues
      }
      return false;
    }
    
    // Remove birds that are too slow (settled anywhere)
    const speed = Math.sqrt(
      bird.body.velocity.x * bird.body.velocity.x +
      bird.body.velocity.y * bird.body.velocity.y
    );
    if (speed < 1) {
      bird.active = false;
      // Ensure body is removed from world
      if (bird.body && gameState.matterWorld) {
        World.remove(gameState.matterWorld, bird.body);
        bird.body = null; // Clear reference to prevent stale body issues
      }
      return false;
    }
    
    return true;
  });
  
  // Auto-start aiming for next bird if no active birds and birds remaining
  if (gameState.activeBirds.length === 0 && gameState.birdsRemaining.length > 0 && !gameState.isAiming) {
    gameState.isAiming = true;
    gameState.slingshotPullPos = { x: 0, y: 0 };
  }
  
  // Remove inactive entities and ensure their bodies are removed from world
  gameState.entities = gameState.entities.filter(entity => {
    if (!entity.active) {
      // Ensure body is removed from world when entity becomes inactive
      if (entity.body && gameState.matterWorld) {
        World.remove(gameState.matterWorld, entity.body);
        entity.body = null; // Clear reference to prevent stale body issues
      }
      return false;
    }
    return true;
  });
  
  // Update pig count
  gameState.pigsRemaining = gameState.entities.filter(e => e.type === 'pig' && e.active).length;
}

function checkWinLoseConditions(p) {
  // Check win condition
  if (gameState.pigsRemaining === 0) {
    // Add bonus for unused birds
    const bonusScore = gameState.birdsRemaining.length * SCORE_UNUSED_BIRD;
    gameState.score += bonusScore;
    gameState.levelScore += bonusScore;
    
    if (gameState.currentLevel >= gameState.totalLevels) {
      // Game complete
      gameState.gamePhase = "GAME_OVER_WIN";
      updateHighScore();
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      // Auto-restart logic for GAME_OVER_WIN
      if (!gameState.autoRestartScheduled) {
        gameState.autoRestartScheduled = true;
        gameState.autoRestartTimeoutId = setTimeout(() => {
          // Double check phase in case manual restart happened during timeout
          if (gameState.gamePhase === "GAME_OVER_WIN") {
            restartGame(p);
          }
          clearAutoRestartTimer();
        }, 1000); // 1 second delay
      }
    } else {
      // Level complete
      gameState.gamePhase = "LEVEL_COMPLETE";
      p.logs.game_info.push({
        data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevel, score: gameState.levelScore },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Auto-advance after delay (existing 3-second delay, keep this)
      setTimeout(() => {
        if (gameState.gamePhase === "LEVEL_COMPLETE") {
          loadNextLevel(p);
        }
      }, 3000);
    }
  }
  
  // Check lose condition
  if (gameState.birdsRemaining.length === 0 && gameState.activeBirds.length === 0 && gameState.pigsRemaining > 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    updateHighScore();
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_LOSE", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    // Auto-restart logic for GAME_OVER_LOSE
    if (!gameState.autoRestartScheduled) {
      gameState.autoRestartScheduled = true;
      gameState.autoRestartTimeoutId = setTimeout(() => {
        // Double check phase in case manual restart happened during timeout
        if (gameState.gamePhase === "GAME_OVER_LOSE") {
          restartGame(p);
        }
        clearAutoRestartTimer();
      }, 1000); // 1 second delay
    }
  }
}

function loadNextLevel(p) {
  clearPhysicsWorld();
  
  gameState.currentLevel++;
  const levelData = createLevel(gameState.currentLevel);
  
  if (!levelData) {
    gameState.gamePhase = "GAME_OVER_WIN";
    updateHighScore();
    return;
  }
  
  gameState.gamePhase = "PLAYING";
  gameState.levelScore = 0;
  gameState.birdsRemaining = [...levelData.birds];
  gameState.entities = [...levelData.pigs, ...levelData.structures];
  gameState.pigsRemaining = levelData.pigs.length;
  gameState.activeBirds = [];
  gameState.particleEffects = [];
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('gameHighScore', gameState.highScore.toString());
  }
}

// New: Function to clear any pending auto-restart timer
export function clearAutoRestartTimer() {
  if (gameState.autoRestartTimeoutId) {
    clearTimeout(gameState.autoRestartTimeoutId);
    gameState.autoRestartTimeoutId = null;
  }
  gameState.autoRestartScheduled = false;
}

// Moved from input.js: Function to restart the game
export function restartGame(p) {
  clearAutoRestartTimer(); // Clear any pending auto-restart
  clearPhysicsWorld();
  
  gameState.gamePhase = "START";
  gameState.currentLevel = 1; // Reset to level 1 on full restart
  gameState.score = 0;
  gameState.levelScore = 0;
  gameState.birdsRemaining = []; // Will be populated by startGame when ENTER is pressed
  gameState.entities = [];
  gameState.activeBirds = [];
  gameState.pigsRemaining = 0;
  gameState.isAiming = false;
  gameState.slingshotPullPos = null;
  gameState.particleEffects = [];
  gameState.keysPressed = {};

  // High score is typically not reset on restart, it persists.
  // The startGame function (in input.js) loads it from localStorage when a new game begins.
  // We ensure it's not accidentally cleared here.
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}


// Expose game instance and state globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof restartGame === 'function') { // Use the new exported restartGame
      restartGame(window.gameInstance);
    }
    if (typeof startGame === 'function') { // startGame is still in input.js
      startGame(window.gameInstance);
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Only 'HUMAN' mode remains
  if (mode === 'HUMAN') {
    const activeBtn = document.getElementById('humanModeBtn');
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
};

export { gameInstance };