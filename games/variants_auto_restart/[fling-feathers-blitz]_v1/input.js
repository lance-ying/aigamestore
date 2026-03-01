import { gameState, SLINGSHOT_X, SLINGSHOT_Y, MAX_PULL_DISTANCE, LAUNCH_POWER_MULTIPLIER } from './globals.js';
import { Bird } from './entities.js';
import { createLevel } from './levels.js';
import { clearPhysicsWorld } from './physics.js';
import { restartGame, clearAutoRestartTimer } from './game.js'; // Import restartGame and clearAutoRestartTimer from game.js

export function handleKeyPressed(p, key, keyCode) {
  // Track key state for continuous controls
  gameState.keysPressed[keyCode] = true;

  // Log input
  p.logs.inputs.push({
    input_type: 'keyPressed',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  // ENTER - Start game or advance level
  if (keyCode === 13) {
    if (gameState.gamePhase === "START") {
      startGame(p);
    } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
      loadNextLevel(p);
    }
  }

  // ESC - Pause/Unpause
  if (keyCode === 27) {
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

  // R - Restart
  if (keyCode === 82) {
    clearAutoRestartTimer(); // Clear any pending auto-restart
    restartGame(p); // Call the exported restartGame from game.js
  }

  // S - Switch Bird (Cycle through available birds)
  if (keyCode === 83) {
    if (gameState.gamePhase === "PLAYING" && gameState.birdsRemaining.length > 1 && gameState.activeBirds.length === 0) {
      const bird = gameState.birdsRemaining.shift();
      gameState.birdsRemaining.push(bird);
      // If aiming, the visual update happens automatically in renderer
    }
  }

  // SPACE - Toggle aiming or launch
  if (keyCode === 32 && gameState.gamePhase === "PLAYING") {
    if (!gameState.isAiming) {
      // Start aiming if bird is available and no active birds
      if (gameState.birdsRemaining.length > 0 && gameState.activeBirds.length === 0) {
        gameState.isAiming = true;
        gameState.slingshotPullPos = { x: 0, y: 0 };
      }
    } else {
      // Launch the bird
      launchBird(p);
    }
  }

  // Z - Activate bird ability
  if (keyCode === 90 && gameState.gamePhase === "PLAYING") {
    activateBirdAbility(p);
  }
}

export function handleKeyReleased(p, key, keyCode) {
  // Track key state for continuous controls
  gameState.keysPressed[keyCode] = false;

  // Log input
  p.logs.inputs.push({
    input_type: 'keyReleased',
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateAiming(p) {
  // Continuous aim adjustment when aiming and arrow keys are held
  if (gameState.isAiming && gameState.slingshotPullPos) {
    const pullSpeed = 2; // Continuous speed per frame (slower than tap-based)
    let changed = false;

    if (gameState.keysPressed[37]) { // LEFT
      gameState.slingshotPullPos.x -= pullSpeed;
      changed = true;
    }
    if (gameState.keysPressed[39]) { // RIGHT
      gameState.slingshotPullPos.x += pullSpeed;
      changed = true;
    }
    if (gameState.keysPressed[38]) { // UP
      gameState.slingshotPullPos.y -= pullSpeed;
      changed = true;
    }
    if (gameState.keysPressed[40]) { // DOWN
      gameState.slingshotPullPos.y += pullSpeed;
      changed = true;
    }

    // Clamp to max pull distance if changed
    if (changed) {
      const dist = Math.sqrt(
        gameState.slingshotPullPos.x * gameState.slingshotPullPos.x +
        gameState.slingshotPullPos.y * gameState.slingshotPullPos.y
      );
      if (dist > MAX_PULL_DISTANCE) {
        const scale = MAX_PULL_DISTANCE / dist;
        gameState.slingshotPullPos.x *= scale;
        gameState.slingshotPullPos.y *= scale;
      }
    }
  }
}

function startGame(p) {
  clearPhysicsWorld();
  
  const levelData = createLevel(1);
  
  gameState.gamePhase = "PLAYING";
  gameState.currentLevel = 1;
  gameState.score = 0;
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
  
  // Load high score
  const savedHighScore = localStorage.getItem('gameHighScore'); // Corrected key from 'flingFeathersHighScore'
  if (savedHighScore) {
    gameState.highScore = parseInt(savedHighScore);
  }

  p.logs.game_info.push({
    data: { phase: "PLAYING", level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function loadNextLevel(p) {
  clearPhysicsWorld();
  
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

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('gameHighScore', gameState.highScore.toString());
  }
}

// The restartGame function has been moved to game.js and is now imported.
// The original restartGame function is removed from this file.

function launchBird(p) {
  if (gameState.birdsRemaining.length === 0) return;

  const birdType = gameState.birdsRemaining.shift();
  const bird = new Bird(SLINGSHOT_X, SLINGSHOT_Y, birdType);
  
  // Apply launch force
  const Matter = window.Matter;
  const Body = Matter.Body;

  const vx = -gameState.slingshotPullPos.x * LAUNCH_POWER_MULTIPLIER;
  const vy = -gameState.slingshotPullPos.y * LAUNCH_POWER_MULTIPLIER;
  Body.setVelocity(bird.body, { x: vx, y: vy });
  
  gameState.activeBirds.push(bird);
  gameState.entities.push(bird);
  gameState.isAiming = false;
  gameState.slingshotPullPos = null;
}

function activateBirdAbility(p) {
  if (gameState.activeBirds.length === 0) return;

  const bird = gameState.activeBirds[0];
  if (bird && !bird.abilityUsed && bird.active) {
    const newBirds = bird.useAbility(gameState, p);
    if (newBirds) {
      gameState.activeBirds.push(...newBirds);
      gameState.entities.push(...newBirds);
    }
  }
}