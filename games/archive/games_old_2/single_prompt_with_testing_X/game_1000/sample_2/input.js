// input.js - Input handling
import { gameState, BIRD_TYPES } from './globals.js';
import { Bird } from './entities.js';
import { generateLevel } from './levels.js';

export function handleKeyPressed(p) {
  if (gameState.controlMode !== "HUMAN") return;
  
  // Log the input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key: p.key, keyCode: p.keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (p.keyCode === 13) { // ENTER
    if (gameState.gamePhase === "START") {
      startGame(p);
    }
  } else if (p.keyCode === 27) { // ESC
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      p.noLoop();
      logGameInfo(p);
    } else if (gameState.gamePhase === "PAUSED") {
      gameState.gamePhase = "PLAYING";
      p.loop();
      logGameInfo(p);
    }
  } else if (p.keyCode === 82) { // R
    if (gameState.gamePhase.startsWith("GAME_OVER")) {
      resetToStart(p);
    }
  }
  
  if (gameState.gamePhase === "PLAYING") {
    handleGameplayKeys(p);
  }
}

function handleGameplayKeys(p) {
  if (!gameState.launchedBird) {
    // Aiming controls
    if (p.keyCode === 37) { // LEFT
      gameState.slingshotAngle -= 2;
      gameState.slingshotAngle = p.constrain(gameState.slingshotAngle, -90, 0);
    } else if (p.keyCode === 39) { // RIGHT
      gameState.slingshotAngle += 2;
      gameState.slingshotAngle = p.constrain(gameState.slingshotAngle, -90, 0);
    } else if (p.keyCode === 40) { // DOWN
      gameState.slingshotPower -= 0.5;
      gameState.slingshotPower = p.constrain(gameState.slingshotPower, 2, 15);
    } else if (p.keyCode === 38) { // UP
      gameState.slingshotPower += 0.5;
      gameState.slingshotPower = p.constrain(gameState.slingshotPower, 2, 15);
    } else if (p.keyCode === 32) { // SPACE - Launch
      launchBird(p);
    } else if (p.keyCode === 90) { // Z - Change bird type
      cycleBirdType();
    }
  } else {
    // Mid-flight controls
    if (p.keyCode === 32 && !gameState.abilityUsed) { // SPACE - Activate ability
      activateBirdAbility(p);
    }
  }
}

export function processAutomatedAction(p, action) {
  if (!action) return;
  
  // Log the automated input
  p.logs.inputs.push({
    input_type: "automatedAction",
    data: { action },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.gamePhase === "PLAYING") {
    if (!gameState.launchedBird) {
      if (action.adjustAngle) {
        gameState.slingshotAngle += action.adjustAngle;
        gameState.slingshotAngle = p.constrain(gameState.slingshotAngle, -90, 0);
      }
      if (action.adjustPower) {
        gameState.slingshotPower += action.adjustPower;
        gameState.slingshotPower = p.constrain(gameState.slingshotPower, 2, 15);
      }
      if (action.launch) {
        launchBird(p);
      }
      if (action.changeBird) {
        cycleBirdType();
      }
    } else {
      if (action.activateAbility && !gameState.abilityUsed) {
        activateBirdAbility(p);
      }
    }
  }
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.score = 0;
  gameState.level = 1;
  gameState.birdsRemaining = 3;
  gameState.launchedBird = null;
  gameState.abilityUsed = false;
  gameState.slingshotAngle = -45;
  gameState.slingshotPower = 8;
  
  // Initialize level - using direct import
  const levelData = generateLevel(p, gameState.level);
  gameState.pigs = levelData.pigs;
  gameState.structures = levelData.structures;
  gameState.birds = [];
  gameState.particles = [];
  
  logGameInfo(p);
}

function resetToStart(p) {
  gameState.gamePhase = "START";
  gameState.entities = [];
  gameState.birds = [];
  gameState.pigs = [];
  gameState.structures = [];
  gameState.particles = [];
  gameState.launchedBird = null;
  gameState.abilityUsed = false;
  logGameInfo(p);
}

function launchBird(p) {
  if (gameState.birdsRemaining <= 0) return;
  
  const angle = p.radians(gameState.slingshotAngle);
  const power = gameState.slingshotPower;
  
  // Using direct import
  const bird = new Bird(p, 100, 330, gameState.currentBirdType);
  bird.launch(p.cos(angle) * power, p.sin(angle) * power);
  
  gameState.birds.push(bird);
  gameState.launchedBird = bird;
  gameState.birdsRemaining--;
  gameState.abilityUsed = false;
}

function activateBirdAbility(p) {
  if (!gameState.launchedBird || gameState.abilityUsed) return;
  
  const newEntities = gameState.launchedBird.activateAbility(gameState);
  newEntities.forEach(entity => {
    if (entity.constructor.name === 'Bird') {
      gameState.birds.push(entity);
    } else if (entity.constructor.name === 'Particle') {
      gameState.particles.push(entity);
    }
  });
  
  gameState.abilityUsed = true;
}

function cycleBirdType() {
  const unlockedTypes = Object.keys(BIRD_TYPES).filter(key => BIRD_TYPES[key].unlocked);
  const currentIndex = unlockedTypes.indexOf(gameState.currentBirdType);
  const nextIndex = (currentIndex + 1) % unlockedTypes.length;
  gameState.currentBirdType = unlockedTypes[nextIndex];
}

function logGameInfo(p) {
  p.logs.game_info.push({
    data: { gamePhase: gameState.gamePhase, score: gameState.score, level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function logPlayerInfo(p) {
  if (gameState.launchedBird && gameState.launchedBird.active) {
    p.logs.player_info.push({
      screen_x: gameState.launchedBird.x,
      screen_y: gameState.launchedBird.y,
      game_x: gameState.launchedBird.x,
      game_y: gameState.launchedBird.y,
      framecount: p.frameCount
    });
  }
}