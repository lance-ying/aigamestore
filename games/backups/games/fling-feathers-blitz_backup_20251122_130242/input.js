import { gameState, SLINGSHOT_X, SLINGSHOT_Y, MAX_PULL_DISTANCE, LAUNCH_POWER_MULTIPLIER } from './globals.js';
import { Bird } from './entities.js';
import { createLevel } from './levels.js';
import { clearPhysicsWorld } from './physics.js';

const Matter = window.Matter;
const Body = Matter.Body;

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
    restartGame(p);
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

export function updateTestingControls(p) {
  if (gameState.controlMode === 'HUMAN') return;

  if (gameState.controlMode === 'TEST_1') {
    // Basic testing - auto-launch at medium power
    if (gameState.gamePhase === "START" && p.frameCount % 10 === 0) {
      handleKeyPressed(p, 'Enter', 13);
    }
    
    if (gameState.gamePhase === "PLAYING" && !gameState.isAiming && gameState.birdsRemaining.length > 0 && gameState.activeBirds.length === 0) {
      if (p.frameCount % 120 === 0) {
        gameState.isAiming = true;
        gameState.slingshotPullPos = { x: 30, y: 20 };
      }
    }
    
    if (gameState.isAiming && p.frameCount % 10 === 0) {
      launchBird(p);
    }
  }

  if (gameState.controlMode === 'TEST_2') {
    // Test to win - smart targeting
    if (gameState.gamePhase === "START" && p.frameCount % 10 === 0) {
      handleKeyPressed(p, 'Enter', 13);
    }
    
    if (gameState.gamePhase === "PLAYING" && !gameState.isAiming && gameState.birdsRemaining.length > 0 && gameState.activeBirds.length === 0) {
      if (p.frameCount % 120 === 0) {
        gameState.isAiming = true;
        // Aim at structures
        gameState.slingshotPullPos = { x: 45, y: 25 };
      }
    }
    
    if (gameState.isAiming && p.frameCount % 10 === 0) {
      launchBird(p);
    }
    
    // Auto-use abilities
    if (gameState.activeBirds.length > 0 && p.frameCount % 30 === 15) {
      activateBirdAbility(p);
    }
    
    // Auto-advance
    if (gameState.gamePhase === "LEVEL_COMPLETE" && p.frameCount % 120 === 60) {
      handleKeyPressed(p, 'Enter', 13);
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
  const savedHighScore = localStorage.getItem('flingFeathersHighScore');
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
    localStorage.setItem('flingFeathersHighScore', gameState.highScore.toString());
  }
}

function restartGame(p) {
  clearPhysicsWorld();
  
  gameState.gamePhase = "START";
  gameState.entities = [];
  gameState.activeBirds = [];
  gameState.birdsRemaining = [];
  gameState.isAiming = false;
  gameState.particleEffects = [];
  gameState.keysPressed = {};
  
  p.logs.game_info.push({
    data: { phase: "START" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function launchBird(p) {
  if (gameState.birdsRemaining.length === 0) return;

  const birdType = gameState.birdsRemaining.shift();
  const bird = new Bird(SLINGSHOT_X, SLINGSHOT_Y, birdType);
  
  // Apply launch force
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