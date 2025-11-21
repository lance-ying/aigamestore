// gameLogic.js - Core game logic with Matter.js integration
import { gameState, GAME_PHASES } from './globals.js';
import { LEVELS } from './levels.js';
import { createBird, createPig, createBlock, removeBodies, addBody, addBodies, World, getVelocityMagnitude, setVelocity, setStatic, setPosition } from './physics.js';

const SLINGSHOT_X = 100;
const SLINGSHOT_Y = 300;
const COLLISION_GRACE_FRAMES = 90; // 1.5 seconds at 60fps

export function startGame(p) {
  console.log('[GAME] Starting game');
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
  console.log('[GAME] Restarting game');
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
    console.log('[GAME] Pausing game');
    gameState.gamePhase = GAME_PHASES.PAUSED;
    p.logs.game_info.push({
      data: { event: 'game_paused' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    console.log('[GAME] Resuming game');
    gameState.gamePhase = GAME_PHASES.PLAYING;
    p.logs.game_info.push({
      data: { event: 'game_resumed' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function loadLevel(p, levelNum) {
  console.log(`[GAME] Loading level ${levelNum}`);
  cleanupLevel(p);
  
  const levelData = LEVELS[levelNum - 1];
  if (!levelData) return;
  
  gameState.currentLevel = levelNum;
  gameState.levelComplete = false;
  gameState.birdSettled = false;
  gameState.settleTimer = 0;
  gameState.framesSinceLastAction = 0;
  gameState.collisionGracePeriod = COLLISION_GRACE_FRAMES;
  
  // Create birds inventory
  gameState.birds = levelData.birds.map(type => ({ type, available: true }));
  gameState.currentBirdIndex = 0;
  
  console.log(`[GAME] Level ${levelNum} has ${gameState.birds.length} birds`);
  
  // Create pigs using Matter.js (static initially)
  levelData.pigs.forEach(pigData => {
    const pig = createPig(pigData.x, pigData.y, pigData.boss);
    addBody(p.engine, pig);
    gameState.pigs.push(pig);
    gameState.entities.push(pig);
  });
  console.log(`[GAME] Created ${gameState.pigs.length} pigs`);
  
  // Create blocks using Matter.js (static initially)
  levelData.blocks.forEach(blockData => {
    const block = createBlock(blockData.x, blockData.y, blockData.w, blockData.h, blockData.material);
    addBody(p.engine, block);
    gameState.blocks.push(block);
    gameState.entities.push(block);
  });
  console.log(`[GAME] Created ${gameState.blocks.length} blocks`);
  
  // Load first bird into slingshot
  loadBirdInSlingshot(p);
  
  p.logs.game_info.push({
    data: { event: 'level_loaded', level: levelNum },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function loadBirdInSlingshot(p) {
  console.log('[GAME] Loading bird into slingshot');
  
  // Remove existing slingshot bird if any
  if (gameState.slingshotBird) {
    console.log('[GAME] Removing existing slingshot bird');
    removeBodies(p.engine, [gameState.slingshotBird]);
    const index = gameState.entities.indexOf(gameState.slingshotBird);
    if (index > -1) {
      gameState.entities.splice(index, 1);
    }
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
    console.log('[GAME] No birds available');
    gameState.slingshotBird = null;
    return;
  }
  
  console.log(`[GAME] Creating ${foundBird.type} bird at slingshot`);
  
  // Create new bird at slingshot position
  const bird = createBird(SLINGSHOT_X, SLINGSHOT_Y, foundBird.type);
  setStatic(bird, true); // Make static until launched
  addBody(p.engine, bird);
  
  gameState.slingshotBird = bird;
  gameState.entities.push(bird);
  gameState.slingshotPullAngle = 0;
  gameState.slingshotPullDistance = 60;
  
  console.log('[GAME] Bird loaded successfully:', {
    type: bird.birdType,
    isStatic: bird.isStatic,
    position: bird.position
  });
}

export function launchBird(p) {
  console.log('[LAUNCH] ========== LAUNCH BIRD START ==========');
  
  if (!gameState.slingshotBird) {
    console.error('[LAUNCH] ERROR: No slingshot bird to launch!');
    return;
  }
  
  if (!p.engine) {
    console.error('[LAUNCH] ERROR: Physics engine not available!');
    return;
  }
  
  const bird = gameState.slingshotBird;
  console.log('[LAUNCH] Bird to launch:', {
    type: bird.birdType,
    currentPosition: bird.position,
    isStatic: bird.isStatic,
    angle: gameState.slingshotPullAngle,
    distance: gameState.slingshotPullDistance
  });
  
  try {
    // Calculate launch velocity based on pull angle and distance
    const angle = gameState.slingshotPullAngle;
    const distance = gameState.slingshotPullDistance;
    const power = distance / gameState.maxPullDistance;
    const launchSpeed = 12 + power * 18;
    
    const velocityX = Math.cos(angle) * launchSpeed;
    const velocityY = Math.sin(angle) * launchSpeed;
    
    console.log('[LAUNCH] Calculated velocity:', { velocityX, velocityY, launchSpeed });
    
    // Make bird dynamic (not static) - bird is already at slingshot position (100, 300)
    console.log('[LAUNCH] Making bird dynamic (removing static)...');
    setStatic(bird, false);
    console.log('[LAUNCH] Bird is now dynamic:', !bird.isStatic);
    console.log('[LAUNCH] Launch position:', bird.position);
    
    // Set launch velocity using Matter.js
    console.log('[LAUNCH] Setting bird velocity...');
    setVelocity(bird, { x: velocityX, y: velocityY });
    console.log('[LAUNCH] Velocity set:', bird.velocity);
    
    // Update game state
    console.log('[LAUNCH] Updating game state...');
    gameState.birdInFlight = bird;
    gameState.slingshotBird = null;
    gameState.abilityUsed = false;
    gameState.birdSettled = false;
    gameState.settleTimer = 0;
    gameState.framesSinceLastAction = 0;
    
    // Mark bird as used
    gameState.birds[gameState.currentBirdIndex].available = false;
    
    console.log('[LAUNCH] Game state updated:', {
      birdInFlight: !!gameState.birdInFlight,
      slingshotBird: gameState.slingshotBird,
      availableBirds: gameState.birds.filter(b => b.available).length
    });
    
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
    
    console.log('[LAUNCH] ========== LAUNCH BIRD SUCCESS ==========');
  } catch (error) {
    console.error('[LAUNCH] ========== LAUNCH BIRD FAILED ==========');
    console.error('[LAUNCH] ERROR:', error);
    console.error('[LAUNCH] Stack trace:', error.stack);
  }
}

export function updateGameLogic(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Handle collision grace period and activation
  if (gameState.collisionGracePeriod > 0) {
    gameState.collisionGracePeriod--;
    
    // When grace period ends, activate physics for all level objects
    if (gameState.collisionGracePeriod === 0) {
      console.log('[GAME] Grace period ended - activating level physics');
      activateLevelPhysics();
    }
  }
  
  // Monitor bird in flight
  if (gameState.birdInFlight) {
    const velocity = getVelocityMagnitude(gameState.birdInFlight);
    const bird = gameState.birdInFlight;
    
    // Check if bird has settled or is off screen
    if (velocity < 0.5 || bird.position.y > 450 || bird.position.x < -50 || bird.position.x > 650) {
      gameState.settleTimer++;
      
      if (gameState.settleTimer > 60 || bird.position.y > 450 || bird.position.x < -50 || bird.position.x > 650) {
        console.log('[GAME] Bird settled or off-screen, loading next bird');
        gameState.birdSettled = true;
        gameState.birdInFlight = null;
        loadBirdInSlingshot(p);
      }
    } else {
      gameState.settleTimer = 0;
    }
    
    // Log bird position periodically
    if (p.frameCount % 10 === 0 && bird) {
      p.logs.player_info.push({
        screen_x: bird.position.x,
        screen_y: bird.position.y,
        game_x: bird.position.x,
        game_y: bird.position.y,
        framecount: p.frameCount
      });
    }
  }
  
  // Check win condition - all pigs destroyed
  if (gameState.pigs.length === 0 && !gameState.levelComplete) {
    gameState.levelComplete = true;
    handleLevelComplete(p);
  }
  
  // Check lose condition - no birds left and pigs remain
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

function activateLevelPhysics() {
  console.log('[GAME] Activating physics for all level objects');
  
  // Make all pigs and blocks dynamic (activate physics)
  gameState.pigs.forEach(pig => {
    if (!pig.destroyed) {
      setStatic(pig, false);
    }
  });
  
  gameState.blocks.forEach(block => {
    if (!block.destroyed) {
      setStatic(block, false);
    }
  });
  
  console.log('[GAME] Physics activated for all objects');
}

function handleLevelComplete(p) {
  console.log('[GAME] Level complete!');
  
  // Bonus points for remaining birds
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
  console.log('[GAME] Level failed!');
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
  
  console.log('[GAME] Cleaning up level');
  
  // Collect all bodies to remove
  const bodiesToRemove = [...gameState.pigs, ...gameState.blocks];
  if (gameState.slingshotBird) bodiesToRemove.push(gameState.slingshotBird);
  if (gameState.birdInFlight) bodiesToRemove.push(gameState.birdInFlight);
  
  // Remove all bodies from Matter.js world
  removeBodies(p.engine, bodiesToRemove);
  
  // Clear game state arrays
  gameState.birds = [];
  gameState.pigs = [];
  gameState.blocks = [];
  gameState.entities = [];
  gameState.slingshotBird = null;
  gameState.birdInFlight = null;
  gameState.currentBirdIndex = 0;
  gameState.slingshotAiming = false;
  gameState.abilityUsed = false;
  
  console.log('[GAME] Level cleanup complete');
}