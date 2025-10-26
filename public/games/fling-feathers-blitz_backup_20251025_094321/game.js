import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, SCORE_SMALL_PIG, SCORE_LARGE_PIG, SCORE_WOOD_BLOCK, SCORE_STONE_BLOCK, SCORE_UNUSED_BIRD } from './globals.js';
import { handleGroundCollision, checkCollision, resolveCollision, createParticleEffect } from './physics.js';
import { Bird, Pig, StructureBlock } from './entities.js';
import { createLevel } from './levels.js';
import { handleKeyPressed, handleKeyReleased, updateAiming, updateTestingControls } from './input.js';
import { renderGame } from './renderer.js';

const p5 = window.p5;
let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
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
      updateTestingControls(p);
      updatePhysics(p);
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
});

function updatePhysics(p) {
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity instanceof Bird || entity instanceof Pig || entity instanceof StructureBlock) {
      if (entity.body && entity.body.active) {
        entity.body.update();
        
        // Update trails for birds
        if (entity instanceof Bird) {
          entity.updateTrail();
        }
      }
    }
  });
  
  // Ground collisions
  gameState.entities.forEach(entity => {
    if (entity.body && entity.body.active) {
      const force = handleGroundCollision(entity.body, GROUND_Y);
      
      // Damage from ground impact
      if (force > 5) {
        if (entity instanceof Pig) {
          const damaged = entity.takeDamage(1);
          if (damaged) {
            handlePigDefeat(p, entity);
          }
        } else if (entity instanceof StructureBlock) {
          if (force > entity.durability) {
            const destroyed = entity.takeDamage(1);
            if (destroyed) {
              handleBlockDestroy(p, entity);
            }
          }
        }
      }
    }
  });
  
  // Entity collisions
  for (let i = 0; i < gameState.entities.length; i++) {
    for (let j = i + 1; j < gameState.entities.length; j++) {
      const e1 = gameState.entities[i];
      const e2 = gameState.entities[j];
      
      if (!e1.body || !e2.body || !e1.body.active || !e2.body.active) continue;
      
      if (checkCollision(e1.body, e2.body)) {
        const force = resolveCollision(e1.body, e2.body);
        
        if (force && force > 3) {
          handleCollisionDamage(p, e1, e2, force);
        }
      }
    }
  }
  
  // Update particle effects
  gameState.particleEffects = gameState.particleEffects.filter(particle => {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.2; // Gravity
    particle.life--;
    return particle.life > 0;
  });
}

function handleCollisionDamage(p, e1, e2, force) {
  const isBird1 = e1 instanceof Bird;
  const isBird2 = e2 instanceof Bird;
  const isPig1 = e1 instanceof Pig;
  const isPig2 = e2 instanceof Pig;
  const isBlock1 = e1 instanceof StructureBlock;
  const isBlock2 = e2 instanceof StructureBlock;
  
  // Bird hitting pig
  if (isBird1 && isPig2) {
    const damaged = e2.takeDamage(1);
    if (damaged) handlePigDefeat(p, e2);
  } else if (isBird2 && isPig1) {
    const damaged = e1.takeDamage(1);
    if (damaged) handlePigDefeat(p, e1);
  }
  
  // Bird or block hitting block
  if ((isBird1 || isBlock1) && isBlock2) {
    if (force > e2.durability) {
      const destroyed = e2.takeDamage(1);
      if (destroyed) handleBlockDestroy(p, e2);
    }
  }
  if ((isBird2 || isBlock2) && isBlock1) {
    if (force > e1.durability) {
      const destroyed = e1.takeDamage(1);
      if (destroyed) handleBlockDestroy(p, e1);
    }
  }
  
  // Block hitting pig
  if (isBlock1 && isPig2 && force > 4) {
    const damaged = e2.takeDamage(1);
    if (damaged) handlePigDefeat(p, e2);
  } else if (isBlock2 && isPig1 && force > 4) {
    const damaged = e1.takeDamage(1);
    if (damaged) handlePigDefeat(p, e1);
  }
}

function handlePigDefeat(p, pig) {
  const points = pig.isLarge ? SCORE_LARGE_PIG : SCORE_SMALL_PIG;
  gameState.score += points;
  gameState.levelScore += points;
  gameState.pigsRemaining--;
  
  // Particle effect
  const particles = createParticleEffect(pig.body.x, pig.body.y, [100, 200, 100], 10);
  gameState.particleEffects.push(...particles);
}

function handleBlockDestroy(p, block) {
  const points = block.material === 'WOOD' ? SCORE_WOOD_BLOCK : SCORE_STONE_BLOCK;
  gameState.score += points;
  gameState.levelScore += points;
  
  // Particle effect
  const color = block.material === 'WOOD' ? [139, 90, 43] : [120, 120, 120];
  const particles = createParticleEffect(block.body.x, block.body.y, color, 6);
  gameState.particleEffects.push(...particles);
}

function updateGameState(p) {
  // Remove inactive birds from active list
  gameState.activeBirds = gameState.activeBirds.filter(bird => {
    if (!bird.body.active) return false;
    
    // Remove birds that are too slow and near ground
    const speed = bird.body.getSpeed();
    if (speed < 1 && bird.body.y > GROUND_Y - 50) {
      bird.body.active = false;
      return false;
    }
    
    return true;
  });
  
  // Remove inactive entities
  gameState.entities = gameState.entities.filter(entity => {
    if (entity.body) return entity.body.active;
    return true;
  });
  
  // Update pig count
  gameState.pigsRemaining = gameState.entities.filter(e => e instanceof Pig && e.body.active).length;
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
    } else {
      // Level complete
      gameState.gamePhase = "LEVEL_COMPLETE";
      p.logs.game_info.push({
        data: { phase: "LEVEL_COMPLETE", level: gameState.currentLevel, score: gameState.levelScore },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Auto-advance after delay or enter press
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
  }
}

function loadNextLevel(p) {
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
  gameState.isAiming = false;
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
    localStorage.setItem('flingFeathersHighScore', gameState.highScore.toString());
  }
}

// Expose game instance and state globally
window.gameInstance = gameInstance;
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
  
  const buttonMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(buttonMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export { gameInstance };