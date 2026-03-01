// game.js - Main game logic with p5.js and Matter.js

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Body } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_BALLS_PER_LEVEL, TOTAL_LEVELS } from './globals.js';
import { Cannon, Ball, Bucket, MovableObject, Wall } from './entities.js';
import { setupCollisionHandling } from './physics.js';
import { getLevelConfig, getTotalLevels } from './levels.js';

let lastPlayerLogTime = 0;
const PLAYER_LOG_INTERVAL = 500;

function initializeGame(p) {
  // Clear existing entities
  gameState.entities.forEach(entity => {
    if (entity.remove) entity.remove();
  });
  
  gameState.entities = [];
  gameState.balls = [];
  gameState.buckets = [];
  gameState.movableObjects = [];
  gameState.selectedObjectIndex = -1;
  gameState.isGrabbing = false;
  
  // Get level config
  const levelConfig = getLevelConfig(gameState.currentLevel);
  gameState.ballsRemaining = levelConfig.ballCount;
  gameState.ballsFired = 0;
  gameState.bucketsFilledCount = 0;
  
  // Create cannon - Position adjusted lower for better trajectory visibility
  gameState.cannon = new Cannon(p, 80, 200);
  
  // Create boundaries (walls)
  const wallThickness = 20;
  
  // Bottom
  const bottomWall = new Wall(p, CANVAS_WIDTH / 2, CANVAS_HEIGHT + wallThickness / 2, CANVAS_WIDTH, wallThickness);
  gameState.entities.push(bottomWall);
  
  // Left
  const leftWall = new Wall(p, -wallThickness / 2, CANVAS_HEIGHT / 2, wallThickness, CANVAS_HEIGHT);
  gameState.entities.push(leftWall);
  
  // Right
  const rightWall = new Wall(p, CANVAS_WIDTH + wallThickness / 2, CANVAS_HEIGHT / 2, wallThickness, CANVAS_HEIGHT);
  gameState.entities.push(rightWall);
  
  // Create buckets
  levelConfig.buckets.forEach((bucketData, index) => {
    const bucket = new Bucket(p, bucketData.x, bucketData.y, index);
    gameState.buckets.push(bucket);
    gameState.entities.push(bucket);
  });
  
  // Create movable objects
  levelConfig.movableObjects.forEach(objData => {
    const obj = new MovableObject(
      p,
      objData.x,
      objData.y,
      objData.width,
      objData.height,
      objData.angle,
      objData.type
    );
    gameState.movableObjects.push(obj);
    gameState.entities.push(obj);
  });
}

function resetGame(p) {
  // Remove all physics bodies
  gameState.entities.forEach(entity => {
    if (entity.remove) entity.remove();
  });
  
  gameState.balls.forEach(ball => {
    if (ball.remove) ball.remove();
  });
  
  // Reset to level 1
  gameState.currentLevel = 1;
  gameState.score = 0;
  
  initializeGame(p);
}

function restartCurrentLevel(p) {
  // Remove all physics bodies
  gameState.entities.forEach(entity => {
    if (entity.remove) entity.remove();
  });
  
  gameState.balls.forEach(ball => {
    if (ball.remove) ball.remove();
  });
  
  // Keep current level but reinitialize
  
  initializeGame(p);
}

function advanceToNextLevel(p) {
  // Remove all physics bodies
  gameState.entities.forEach(entity => {
    if (entity.remove) entity.remove();
  });
  
  gameState.balls.forEach(ball => {
    if (ball.remove) ball.remove();
  });
  
  // Advance level
  gameState.currentLevel++;
  
  initializeGame(p);
}

function updateGame(p) {
  // Update cannon
  if (gameState.cannon) {
    gameState.cannon.update();
  }
  
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Update balls
  gameState.balls.forEach(ball => {
    if (ball.update) {
      ball.update();
    }
  });
  
  // Check bucket status
  gameState.bucketsFilledCount = gameState.buckets.filter(b => b.filled).length;
  
  // Check win condition
  if (gameState.bucketsFilledCount === gameState.buckets.length) {
    gameState.gamePhase = "GAME_OVER_WIN";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_WIN", score: gameState.score, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition
  const allBallsSettled = gameState.balls.every(ball => !ball.active || ball.inBucket);
  if (gameState.ballsRemaining === 0 && allBallsSettled && gameState.bucketsFilledCount < gameState.buckets.length) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    p.logs.game_info.push({
      data: { gamePhase: "GAME_OVER_LOSE", score: gameState.score, level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player info periodically
  const now = Date.now();
  if (now - lastPlayerLogTime > PLAYER_LOG_INTERVAL && gameState.cannon) {
    p.logs.player_info.push({
      screen_x: gameState.cannon.x,
      screen_y: gameState.cannon.y,
      game_x: gameState.cannon.x,
      game_y: gameState.cannon.y,
      framecount: p.frameCount,
      timestamp: now
    });
    lastPlayerLogTime = now;
  }
}

function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Blinking effect
  if (p.frameCount % 60 < 40) {
    p.text("press enter to begin", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2); // Centered
  }
}

function renderGame(p) {
  // Background
  p.background(220, 230, 255);
  
  // Sky gradient
  for (let i = 0; i < CANVAS_HEIGHT / 2; i++) {
    const inter = p.map(i, 0, CANVAS_HEIGHT / 2, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 235), p.color(220, 230, 255), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Ground
  p.noStroke();
  p.fill(100, 180, 100);
  p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Render cannon
  if (gameState.cannon) {
    gameState.cannon.render();
  }
  
  // Render balls
  gameState.balls.forEach(ball => {
    if (ball.render) {
      ball.render();
    }
  });
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Panel background
  p.fill(40, 40, 60, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Level
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.LEFT, p.CENTER);
  const totalLevels = getTotalLevels();
  p.text(`Level: ${gameState.currentLevel}/${totalLevels}`, 10, 20);
  
  // Balls remaining
  p.fill(255);
  p.text(`Balls: ${gameState.ballsRemaining}`, 130, 20);
  
  // Buckets filled
  const bucketsTotal = gameState.buckets.length;
  const bucketsFilled = gameState.bucketsFilledCount;
  p.text(`Buckets: ${bucketsFilled}/${bucketsTotal}`, 230, 20);
  
  // Score
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 20);
  
  // Edit mode indicator - Improved feedback
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  
  if (gameState.isGrabbing && gameState.selectedObjectIndex >= 0) {
    p.fill(100, 255, 100);
    p.text("GRAB MODE: Arrows to move, A/D to rotate, SPACE to drop", CANVAS_WIDTH / 2, 55);
  } else if (gameState.selectedObjectIndex >= 0) {
    p.fill(255, 255, 100);
    p.text("SELECT MODE: Arrows to choose object, SPACE to grab", CANVAS_WIDTH / 2, 55);
  } else if (gameState.movableObjects.length > 0) {
    p.fill(200, 200, 200);
    p.text("Use Left/Right Arrows to select an object", CANVAS_WIDTH / 2, 55);
  }
}

function renderGameOver(p) {
  // Dim background
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Panel
  p.fill(40, 40, 60, 240);
  p.rect(100, 100, CANVAS_WIDTH - 200, CANVAS_HEIGHT - 200);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  const totalLevels = getTotalLevels();
  const isLastLevel = gameState.currentLevel >= totalLevels;
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.textSize(42);
    
    if (isLastLevel) {
      p.text("GAME COMPLETE!", CANVAS_WIDTH / 2, 150);
    } else {
      p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 150);
    }
    
    p.fill(255);
    p.textSize(24);
    p.text(`Level ${gameState.currentLevel}/${totalLevels}`, CANVAS_WIDTH / 2, 200);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 235);
    p.text(`Buckets: ${gameState.bucketsFilledCount}/${gameState.buckets.length}`, CANVAS_WIDTH / 2, 265);
    
    p.fill(255, 255, 100);
    p.textSize(18);
    
    if (isLastLevel) {
      p.text("Congratulations! You beat all levels!", CANVAS_WIDTH / 2, 305);
      p.text("Press R to play again", CANVAS_WIDTH / 2, 330);
    } else {
      p.text("Press ENTER for next level", CANVAS_WIDTH / 2, 305);
      p.text("Press R to restart this level", CANVAS_WIDTH / 2, 330);
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(42);
    p.text("LEVEL FAILED", CANVAS_WIDTH / 2, 160);
    
    p.fill(255);
    p.textSize(20);
    p.text("Not all buckets were filled!", CANVAS_WIDTH / 2, 210);
    p.text(`Level ${gameState.currentLevel}/${totalLevels}`, CANVAS_WIDTH / 2, 240);
    p.text(`Buckets: ${gameState.bucketsFilledCount}/${gameState.buckets.length}`, CANVAS_WIDTH / 2, 270);
    
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("Press R to retry this level", CANVAS_WIDTH / 2, 320);
  }
}

function handlePlayerInput(p) {
  if (gameState.gamePhase !== "PLAYING") return;
  
  // When grabbing an object, use arrow keys to move it
  if (gameState.isGrabbing && gameState.selectedObjectIndex >= 0) {
    const obj = gameState.movableObjects[gameState.selectedObjectIndex];
    const moveSpeed = 2;
    
    // Arrow key movement
    if (p.keyIsDown(37)) { // Left arrow
      const newX = obj.body.position.x - moveSpeed;
      obj.moveTo(newX, obj.body.position.y);
    }
    
    if (p.keyIsDown(39)) { // Right arrow
      const newX = obj.body.position.x + moveSpeed;
      obj.moveTo(newX, obj.body.position.y);
    }
    
    if (p.keyIsDown(38)) { // Up arrow
      const newY = obj.body.position.y - moveSpeed;
      obj.moveTo(obj.body.position.x, newY);
    }
    
    if (p.keyIsDown(40)) { // Down arrow
      const newY = obj.body.position.y + moveSpeed;
      obj.moveTo(obj.body.position.x, newY);
    }
    
    // Rotation controls
    if (p.keyIsDown(65)) { // A - rotate left
      obj.rotate(-0.05);
    }
    
    if (p.keyIsDown(68)) { // D - rotate right
      obj.rotate(0.05);
    }
  } else {
    // Selection controls (only when not grabbing)
    if (p.keyIsDown(37)) { // Left arrow
      if (p.frameCount % 10 === 0) {
        selectPreviousObject();
      }
    }
    
    if (p.keyIsDown(39)) { // Right arrow
      if (p.frameCount % 10 === 0) {
        selectNextObject();
      }
    }
  }
}

function selectNextObject() {
  if (gameState.movableObjects.length === 0) return;
  
  if (gameState.selectedObjectIndex >= 0) {
    gameState.movableObjects[gameState.selectedObjectIndex].selected = false;
  }
  
  gameState.selectedObjectIndex = (gameState.selectedObjectIndex + 1) % gameState.movableObjects.length;
  gameState.movableObjects[gameState.selectedObjectIndex].selected = true;
}

function selectPreviousObject() {
  if (gameState.movableObjects.length === 0) return;
  
  if (gameState.selectedObjectIndex >= 0) {
    gameState.movableObjects[gameState.selectedObjectIndex].selected = false;
  }
  
  gameState.selectedObjectIndex--;
  if (gameState.selectedObjectIndex < 0) {
    gameState.selectedObjectIndex = gameState.movableObjects.length - 1;
  }
  
  gameState.movableObjects[gameState.selectedObjectIndex].selected = true;
}

function toggleGrab() {
  if (gameState.selectedObjectIndex >= 0) {
    gameState.isGrabbing = !gameState.isGrabbing;
  }
}

function fireCannon() {
  if (gameState.cannon && !gameState.isGrabbing) {
    gameState.cannon.fire();
  }
}

// Main p5.js instance
let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 0.6;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Setup collision handling
    setupCollisionHandling(engine, p);
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game
    initializeGame(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    if (gameState.gamePhase === "PLAYING") {
      Engine.update(gameState.engine, 1000 / 60);
    }
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        handlePlayerInput(p); // Only human input remains
        updateGame(p);
        renderGame(p);
        break;
        
      case "PAUSED":
        // When paused, simply render the game once and stop updating
        // No overlay or text is shown, as per user request.
        renderGame(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      gameState.gamePhase = "PLAYING";
      p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // ENTER to advance to next level after winning
    if (p.keyCode === 13 && gameState.gamePhase === "GAME_OVER_WIN") {
      const totalLevels = getTotalLevels();
      
      if (gameState.currentLevel < totalLevels) {
        // Advance to next level
        advanceToNextLevel(p);
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING", level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Beat all levels, reset to level 1
        resetGame(p);
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START", message: "All levels completed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          data: { gamePhase: "PAUSED" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R - Restart current level (or reset if beat game)
      if (gameState.gamePhase === "GAME_OVER_WIN") {
        const totalLevels = getTotalLevels();
        
        if (gameState.currentLevel >= totalLevels) {
          // Beat all levels, reset to level 1
          resetGame(p);
          gameState.gamePhase = "START";
        } else {
          // Restart current level
          restartCurrentLevel(p);
          gameState.gamePhase = "PLAYING";
        }
        
        p.logs.game_info.push({
          data: { gamePhase: gameState.gamePhase, level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
        // Restart current level
        restartCurrentLevel(p);
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING", level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls (only in PLAYING phase and HUMAN mode)
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
      if (p.keyCode === 32) { // SPACE - Toggle grab
        toggleGrab();
      }
      
      if (p.keyCode === 90) { // Z - Fire cannon
        fireCannon();
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false;
  };
});

// Expose globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    state.currentLevel = levelNum;
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};

// window.setControlMode function removed as it is no longer used by the game&#x27;s UI or test modes.