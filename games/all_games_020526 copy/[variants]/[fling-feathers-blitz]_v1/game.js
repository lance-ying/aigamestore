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
            restartGame(p); // Calls restartGame, which now starts a new game
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
          restartGame(p); // Calls restartGame, which now starts a new game
        }
        clearAutoRestartTimer();
      }, 1000); // 1 second delay
    }
  }
}

// Exported function to load the next level (used for level complete)
export function loadNextLevel(p) {
  clearPhysicsWorld();
  clearAutoRestartTimer(); // Clear any pending auto-restart (e.g., if player presses ENTER quickly after win)

  gameState.currentLevel++;
  const levelData = createLevel(gameState.currentLevel);
  
  if (!levelData) {
    gameState.gamePhase = "GAME_OVER_WIN";
    updateHighScore();
    p.logs.game_info.push({
      data: { phase: "GAME_OVER_WIN", score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  gameState.gamePhase = "PLAYING";
  gameState.levelScore = 0;
  gameState.birdsRemaining = [...levelData.birds];
  gameState.entities = [...levelData.pigs, ...levelData.structures];
  gameState.pigsRemaining = levelData.pigs.length;
  gameState.activeBirds = [];
  gameState.particleEffects = [];
  gameState.keysPressed = {};
  
  // Auto-start aiming when level begins
  if (gameState.birdsRemaining.length > 0) {
    gameState.isAiming = true;
    gameState.slingshotPullPos = { x: 0, y: 0 };
  } else {
    gameState.isAiming = false;
  }
  
  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Exported function to update high score
export function updateHighScore() {
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

// Exported function to start a brand new game from Level 1
export function startGame(p) {
  clearPhysicsWorld();
  clearAutoRestartTimer(); // Ensure no pending auto-restart from previous game

  gameState.currentLevel = 1;
  gameState.score = 0;
  gameState.levelScore = 0;
  
  const levelData = createLevel(gameState.currentLevel);
  
  gameState.gamePhase = "PLAYING";
  gameState.birdsRemaining = [...levelData.birds];
  gameState.entities = [...levelData.pigs, ...levelData.structures];
  gameState.pigsRemaining = levelData.pigs.length;
  gameState.activeBirds = [];
  gameState.particleEffects = [];
  gameState.keysPressed = {};
  
  // Auto-start aiming when level begins
  if (gameState.birdsRemaining.length > 0) {
    gameState.isAiming = true;
    gameState.slingshotPullPos = { x: 0, y: 0 };
  } else {
    gameState.isAiming = false;
  }
  
  // Load high score
  const savedHighScore = localStorage.getItem('gameHighScore');
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
  }

  p.logs.game_info.push({
    data: { phase: "PLAYING", level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

// Exported function to restart the game (now just calls startGame to reset to level 1)
export function restartGame(p) {
  clearAutoRestartTimer(); // Clear any pending auto-restart
  startGame(p); // Start a fresh game from level 1
}


// Expose game instance and state globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Restart to level 1 first to ensure a clean slate
    startGame(window.gameInstance); 
    
    // Then advance to the desired level if it's not 1
    if (levelNum > 1 && levelNum <= state.totalLevels) {
      // Set currentLevel to 1 so loadNextLevel advances correctly
      state.currentLevel = 1; 
      for (let i = 1; i < levelNum; i++) {
        loadNextLevel(window.gameInstance);
      }
    } else if (levelNum === 1) {
      // Already handled by startGame
    } else {
      console.warn(`Attempted to load invalid level: ${levelNum}`);
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