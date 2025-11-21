// levelManager.js - Level management and progression

import { gameState, LEVEL_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_PLAYING, PHASE_LEVEL_COMPLETE, PHASE_GAME_OVER_LOSE, PHASE_GAME_OVER_WIN } from './globals.js';
import { Player, TargetZone, Obstacle, FallingObject } from './entities.js';

export function initLevel(levelNumber) {
  const config = LEVEL_CONFIGS[levelNumber - 1];
  if (!config) return false;

  // Reset level state
  gameState.currentLevel = levelNumber;
  gameState.levelScore = 0;
  gameState.fallingObjects = [];
  gameState.obstacles = [];
  gameState.entities = [];
  
  // Initialize objectives
  gameState.levelObjectives = {
    objectsRequired: config.objectsRequired,
    objectsCaught: 0,
    objectsLost: 0,
    totalObjects: config.totalObjects,
    objectsSpawned: 0,
    timeLimit: 0,
    timeRemaining: 0
  };

  // Create player platform
  const platformY = CANVAS_HEIGHT - 40;
  gameState.player = new Player(
    CANVAS_WIDTH / 2,
    platformY,
    config.platformWidth,
    15,
    config.platformSpeed
  );
  gameState.entities.push(gameState.player);

  // Create target zone - for level 1, position it higher and make it smaller
  const targetY = levelNumber === 1 ? CANVAS_HEIGHT - 80 : CANVAS_HEIGHT - 60;
  const targetHeight = levelNumber === 1 ? 40 : 40;
  gameState.targetZone = new TargetZone(
    CANVAS_WIDTH / 2,
    targetY,
    config.targetWidth,
    targetHeight,
    config.targetSpeed
  );

  // Create obstacles
  for (const obstacleConfig of config.obstacles) {
    const obstacle = new Obstacle(
      obstacleConfig.x,
      obstacleConfig.y,
      obstacleConfig.width,
      obstacleConfig.height,
      obstacleConfig.type,
      obstacleConfig.moveRange || 0,
      obstacleConfig.moveSpeed || 0,
      obstacleConfig.angle || 0
    );
    gameState.obstacles.push(obstacle);
  }

  gameState.levelStartTime = Date.now();
  
  return config;
}

export function updateLevel(p, deltaTime) {
  const config = LEVEL_CONFIGS[gameState.currentLevel - 1];
  if (!config) return;

  // Spawn objects only until totalObjects limit is reached
  if (gameState.levelObjectives.objectsSpawned < gameState.levelObjectives.totalObjects) {
    if (p.frameCount % config.objectSpawnInterval === 0) {
      spawnObject(config);
    }
  }

  // Update player - now uses inputState for tilt controls
  if (gameState.player) {
    gameState.player.update();
  }

  // Update target zone
  if (gameState.targetZone) {
    gameState.targetZone.update();
  }

  // Update obstacles
  for (const obstacle of gameState.obstacles) {
    obstacle.update();
  }

  // Update falling objects
  for (let i = gameState.fallingObjects.length - 1; i >= 0; i--) {
    const obj = gameState.fallingObjects[i];
    obj.update();

    // Check platform collision (can now bounce multiple times)
    if (gameState.player) {
      obj.bounceOffPlatform(gameState.player);
    }

    // Check obstacle collisions
    for (const obstacle of gameState.obstacles) {
      obj.checkObstacleCollision(obstacle);
    }

    // Check target capture
    if (gameState.targetZone && obj.active) {
      if (gameState.targetZone.checkCapture(obj)) {
        obj.active = false;
        gameState.levelObjectives.objectsCaught++;
        const points = 100;
        gameState.score += points;
        gameState.levelScore += points;
        
        // Log score update
        p.logs.player_info.push({
          screen_x: obj.x,
          screen_y: obj.y,
          game_x: obj.x,
          game_y: obj.y,
          framecount: p.frameCount,
          action: 'object_caught',
          score: gameState.score
        });
      }
    }

    // Remove inactive objects
    if (!obj.active) {
      // Check if it was lost (fell out of bounds without being caught)
      if (obj.y > CANVAS_HEIGHT && gameState.levelObjectives.objectsCaught + gameState.levelObjectives.objectsLost < gameState.levelObjectives.objectsSpawned) {
        gameState.levelObjectives.objectsLost++;
      }
      gameState.fallingObjects.splice(i, 1);
    }
  }

  // Check win condition
  if (gameState.levelObjectives.objectsCaught >= gameState.levelObjectives.objectsRequired) {
    endLevel(true, p);
  }
  // Check lose condition - failed if all objects spawned but not enough caught
  else if (gameState.levelObjectives.objectsSpawned >= gameState.levelObjectives.totalObjects &&
           gameState.fallingObjects.length === 0 &&
           gameState.levelObjectives.objectsCaught < gameState.levelObjectives.objectsRequired) {
    endLevel(false, p);
  }
}

function spawnObject(config) {
  const margin = 50;
  const x = margin + Math.random() * (CANVAS_WIDTH - 2 * margin);
  const y = -20;
  const size = 12 + Math.random() * 6;
  const type = Math.random() > 0.5 ? 'circle' : 'square';
  
  const obj = new FallingObject(x, y, size, type, config.gravity);
  gameState.fallingObjects.push(obj);
  gameState.levelObjectives.objectsSpawned++;
}

function endLevel(won, p) {
  if (won) {
    // Calculate bonuses - perfect bonus only
    // Perfect bonus - awarded if caught all required without missing any
    if (gameState.levelObjectives.objectsLost === 0 && 
        gameState.levelObjectives.objectsCaught >= gameState.levelObjectives.objectsRequired) {
      gameState.score += 200;
      gameState.levelScore += 200;
    }

    // Check if game is complete
    if (gameState.currentLevel >= gameState.totalLevels) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      
      // Update high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        try {
          localStorage.setItem('gravityGuideHighScore', gameState.highScore.toString());
        } catch (e) {
          console.log('Could not save high score');
        }
      }

      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      gameState.gamePhase = PHASE_LEVEL_COMPLETE;
      p.logs.game_info.push({
        data: { phase: PHASE_LEVEL_COMPLETE, level: gameState.currentLevel, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function renderLevel(p) {
  // Render target zone
  if (gameState.targetZone) {
    gameState.targetZone.render(p);
  }

  // Render obstacles
  for (const obstacle of gameState.obstacles) {
    obstacle.render(p);
  }

  // Render falling objects
  for (const obj of gameState.fallingObjects) {
    obj.render(p);
  }

  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }

  // Render UI
  renderLevelUI(p);
}

function renderLevelUI(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(255);
  p.noStroke();
  
  // Level indicator
  const config = LEVEL_CONFIGS[gameState.currentLevel - 1];
  p.text(`LEVEL ${gameState.currentLevel}: ${config.name}`, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Objectives
  p.textAlign(p.CENTER, p.TOP);
  p.fill(255);
  p.textSize(14);
  p.text(`Objects: ${gameState.levelObjectives.objectsCaught}/${gameState.levelObjectives.objectsRequired} | Remaining: ${gameState.levelObjectives.totalObjects - gameState.levelObjectives.objectsSpawned}`, 
    CANVAS_WIDTH / 2, 35);
  
  p.pop();
}