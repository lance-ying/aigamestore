// gameLogic.js - Core game logic
import { gameState, GAME_PHASES } from './globals.js';
import { LEVELS } from './levels.js';
import { createBird, createPig, createBlock, createConstraint, removeBodies, World, getVelocityMagnitude, setVelocity } from './physics.js';

const SLINGSHOT_X = 100;
const SLINGSHOT_Y = 300;

export function startGame(p) {
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  loadLevel(p, 1);
  
  p.logs.game_info.push({
    data: { event: 'game_started', level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function restartGame(p) {
  cleanupLevel(p);
  gameState.gamePhase = GAME_PHASES.START;
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  p.logs.game_info.push({
    data: { event: 'game_restarted' },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function togglePause(p) {
  if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: { event: 'game_paused' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { event: 'game_resumed' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function loadLevel(p, levelNum) {
  cleanupLevel(p);
  
  const levelData = LEVELS[levelNum - 1];
  if (!levelData) return;
  
  gameState.currentLevel = levelNum;
  gameState.levelComplete = false;
  gameState.birdSettled = false;
  gameState.settleTimer = 0;
  gameState.framesSinceLastAction = 0;
  
  // Create birds
  gameState.birds = levelData.birds.map(type => ({ type, available: true }));
  gameState.currentBirdIndex = 0;
  
  // Create pigs
  levelData.pigs.forEach(pigData => {
    const pig = createPig(pigData.x, pigData.y, pigData.boss);
    World.add(p.engine.world, pig);
    gameState.pigs.push(pig);
    gameState.entities.push(pig);
  });
  
  // Create blocks
  levelData.blocks.forEach(blockData => {
    const block = createBlock(blockData.x, blockData.y, blockData.w, blockData.h, blockData.material);
    World.add(p.engine.world, block);
    gameState.blocks.push(block);
    gameState.entities.push(block);
  });
  
  // Load first bird
  loadBirdInSlingshot(p);
  
  p.logs.game_info.push({
    data: { event: 'level_loaded', level: levelNum },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadBirdInSlingshot(p) {
  if (gameState.slingshotBird) {
    removeBodies(p.engine, [gameState.slingshotBird]);
    const index = gameState.entities.indexOf(gameState.slingshotBird);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
  }
  
  if (gameState.slingshotConstraint) {
    World.remove(p.engine.world, gameState.slingshotConstraint);
    gameState.slingshotConstraint = null;
  }
  
  // Find next available bird
  let foundBird = null;
  for (let i = 0; i < gameState.birds.length; i++) {
    const idx = (gameState.currentBirdIndex + i) % gameState.birds.length;
    if (gameState.birds[idx].available) {
      foundBird = gameState.birds[idx];
      gameState.currentBirdIndex = idx;
      break;
    }
  }
  
  if (!foundBird) {
    gameState.slingshotBird = null;
    return;
  }
  
  const bird = createBird(SLINGSHOT_X, SLINGSHOT_Y, foundBird.type);
  bird.isStatic = true;
  World.add(p.engine.world, bird);
  gameState.slingshotBird = bird;
  gameState.entities.push(bird);
  gameState.slingshotPullAngle = 0;
  gameState.slingshotPullDistance = 60;
}

export function launchBird(p) {
  if (!gameState.slingshotBird) return;
  
  const bird = gameState.slingshotBird;
  bird.isStatic = false;
  
  const angle = gameState.slingshotPullAngle;
  const power = gameState.slingshotPullDistance / gameState.maxPullDistance;
  const launchSpeed = 12 + power * 18;
  
  const velocityX = Math.cos(angle) * launchSpeed;
  const velocityY = Math.sin(angle) * launchSpeed;
  
  setVelocity(bird, { x: velocityX, y: velocityY });
  
  gameState.birdInFlight = bird;
  gameState.slingshotBird = null;
  gameState.abilityUsed = false;
  gameState.birdSettled = false;
  gameState.settleTimer = 0;
  gameState.framesSinceLastAction = 0;
  
  // Mark bird as used
  gameState.birds[gameState.currentBirdIndex].available = false;
  
  p.logs.game_info.push({
    data: { event: 'bird_launched', birdType: bird.birdType, angle, power },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  p.logs.player_info.push({
    screen_x: bird.position.x,
    screen_y: bird.position.y,
    game_x: bird.position.x,
    game_y: bird.position.y,
    framecount: p.frameCount
  });
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Check if bird in flight has settled
  if (gameState.birdInFlight) {
    const velocity = getVelocityMagnitude(gameState.birdInFlight);
    
    if (velocity < 0.5 || gameState.birdInFlight.position.y > 400) {
      gameState.settleTimer++;
      
      if (gameState.settleTimer > 60 || gameState.birdInFlight.position.y > 400) {
        gameState.birdSettled = true;
        gameState.birdInFlight = null;
        loadBirdInSlingshot(p);
      }
    } else {
      gameState.settleTimer = 0;
    }
    
    // Log player position periodically
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.birdInFlight.position.x,
        screen_y: gameState.birdInFlight.position.y,
        game_x: gameState.birdInFlight.position.x,
        game_y: gameState.birdInFlight.position.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Check win condition
  if (gameState.pigs.length === 0 && !gameState.levelComplete) {
    gameState.levelComplete = true;
    handleLevelComplete(p);
  }
  
  // Check lose condition
  if (!gameState.slingshotBird && !gameState.birdInFlight && gameState.pigs.length > 0) {
    const anyBirdsLeft = gameState.birds.some(b => b.available);
    if (!anyBirdsLeft) {
      gameState.framesSinceLastAction++;
      if (gameState.framesSinceLastAction > 120) {
        handleLevelFailed(p);
      }
    }
  }
}

function handleLevelComplete(p) {
  // Bonus for remaining birds
  const remainingBirds = gameState.birds.filter(b => b.available).length;
  const birdBonus = remainingBirds * 100;
  gameState.score += birdBonus;
  
  // Level completion bonus
  gameState.score += 500;
  
  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flingFeathersHighScore', gameState.highScore.toString());
    }
  }
  
  p.logs.game_info.push({
    data: { event: 'level_complete', level: gameState.currentLevel, score: gameState.score, bonus: birdBonus + 500 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  setTimeout(() => {
    if (gameState.currentLevel < gameState.totalLevels) {
      loadLevel(p, gameState.currentLevel + 1);
    } else {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { event: 'game_complete', finalScore: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }, 2000);
}

function handleLevelFailed(p) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('flingFeathersHighScore', gameState.highScore.toString());
    }
  }
  
  p.logs.game_info.push({
    data: { event: 'level_failed', level: gameState.currentLevel, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function cleanupLevel(p) {
  if (!p.engine) return;
  
  const bodiesToRemove = [...gameState.pigs, ...gameState.blocks];
  if (gameState.slingshotBird) bodiesToRemove.push(gameState.slingshotBird);
  if (gameState.birdInFlight) bodiesToRemove.push(gameState.birdInFlight);
  
  removeBodies(p.engine, bodiesToRemove);
  
  gameState.birds = [];
  gameState.pigs = [];
  gameState.blocks = [];
  gameState.entities = [];
  gameState.slingshotBird = null;
  gameState.birdInFlight = null;
  gameState.currentBirdIndex = 0;
  gameState.slingshotAiming = false;
  gameState.abilityUsed = false;
}