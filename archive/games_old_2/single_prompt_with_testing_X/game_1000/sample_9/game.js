// game.js - Main game logic with p5.js and Matter.js

const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body, Events } = Matter;

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES,
  COLORS,
  PHYSICS
} from './globals.js';

import { 
  Player, 
  RoadSegment, 
  PoliceCar, 
  Obstacle 
} from './entities.js';

import { 
  setupCollisionHandling, 
  checkPlayerCrashed 
} from './physics.js';

let gameInstance = new p5(p => {
  let engine, world;
  let keys = {};

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    console.log("=== GAME SETUP STARTED ===");

    // Create Matter.js engine
    engine = Engine.create();
    world = engine.world;
    world.gravity.y = PHYSICS.GRAVITY;

    gameState.engine = engine;
    gameState.world = world;

    console.log("Matter.js engine created, gravity:", world.gravity.y);

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

    // Setup collision handling
    setupCollisionHandling(engine, p);

    // Initialize game
    initializeGame(p);
    
    console.log("=== GAME SETUP COMPLETE ===");
  };

  p.draw = function() {
    // Update physics
    Engine.update(engine, 1000 / 60);

    // Debug output every 60 frames
    if (p.frameCount % 60 === 0) {
      console.log(`[Frame ${p.frameCount}] Phase: ${gameState.gamePhase}, Entities: ${gameState.entities.length}, Player: ${gameState.player ? 'EXISTS' : 'NULL'}`);
      if (gameState.player) {
        console.log(`  Player pos: (${gameState.player.body.position.x.toFixed(1)}, ${gameState.player.body.position.y.toFixed(1)})`);
        console.log(`  Player vel: (${gameState.player.body.velocity.x.toFixed(2)}, ${gameState.player.body.velocity.y.toFixed(2)})`);
      }
      console.log(`  Roads: ${gameState.roadSegments.length}, Police: ${gameState.policeCars.length}, Obstacles: ${gameState.obstacles.length}`);
      console.log(`  Score: ${gameState.score}, Speed: ${gameState.gameSpeed.toFixed(2)}`);
    }

    // Handle different game phases
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      
      case GAME_PHASES.PLAYING:
        handleInput(p);
        updateGame(p);
        renderGame(p);
        break;
      
      case GAME_PHASES.PAUSED:
        renderGame(p);
        renderPausedOverlay(p);
        break;
      
      case GAME_PHASES.GAME_OVER_LOSE:
      case GAME_PHASES.GAME_OVER_WIN:
        renderGame(p);
        renderGameOver(p);
        break;
    }
  };

  p.keyPressed = function() {
    keys[p.keyCode] = true;

    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase controls
    if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) { // ENTER
      console.log("ENTER pressed - starting game");
      startGame(p);
    }

    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        console.log("Game PAUSED");
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        console.log("Game RESUMED");
        p.logs.game_info.push({
          data: { gamePhase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
        console.log("R pressed - restarting game");
        resetGame(p);
      }
    }

    return false;
  };

  p.keyReleased = function() {
    keys[p.keyCode] = false;

    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    return false;
  };

  function initializeGame(p) {
    console.log("Initializing game...");
    
    // Clear entities
    gameState.entities = [];
    gameState.roadSegments = [];
    gameState.policeCars = [];
    gameState.obstacles = [];
    
    // Create initial road
    console.log("Creating initial road segments...");
    for (let i = 0; i < 15; i++) {
      const roadY = CANVAS_HEIGHT - 50 - i * (PHYSICS.ROAD_SEGMENT_HEIGHT - 2);
      const road = new RoadSegment(
        p, 
        CANVAS_WIDTH / 2, 
        roadY,
        0
      );
      gameState.roadSegments.push(road);
      gameState.entities.push(road);
    }
    console.log(`Created ${gameState.roadSegments.length} initial road segments`);

    gameState.lastRoadX = CANVAS_WIDTH / 2;
    gameState.lastRoadY = CANVAS_HEIGHT - 50 - 14 * (PHYSICS.ROAD_SEGMENT_HEIGHT - 2);
    
    console.log("Initialization complete");
  }

  function startGame(p) {
    console.log("=== STARTING GAME ===");
    
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.distance = 0;
    gameState.scrollOffset = 0;
    gameState.gameSpeed = PHYSICS.INITIAL_SPEED;
    gameState.gameDuration = 0;
    gameState.framesSincePoliceSpawn = 0;
    gameState.framesSinceObstacleSpawn = 0;
    gameState.lastPlayerLogFrame = 0;

    // Create player
    const playerX = CANVAS_WIDTH / 2;
    const playerY = CANVAS_HEIGHT - 150;
    console.log(`Creating player at (${playerX}, ${playerY})`);
    
    gameState.player = new Player(p, playerX, playerY);
    gameState.entities.push(gameState.player);
    
    console.log(`Player created. Total entities: ${gameState.entities.length}`);
    console.log(`Player body exists: ${gameState.player.body ? 'YES' : 'NO'}`);
    if (gameState.player.body) {
      console.log(`Player position: (${gameState.player.body.position.x}, ${gameState.player.body.position.y})`);
    }

    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.PLAYING },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Initial player log
    p.logs.player_info.push({
      screen_x: gameState.player.body.position.x,
      screen_y: gameState.player.body.position.y,
      game_x: gameState.player.body.position.x,
      game_y: gameState.player.body.position.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    console.log("=== GAME STARTED ===");
  }

  function handleInput(p) {
    // Test mode controls
    if (gameState.controlMode === 'TEST_1') {
      // Basic testing - draw road straight
      if (p.frameCount % 3 === 0) {
        gameState.isDrawingRoad = true;
      }
    } else if (gameState.controlMode === 'TEST_2') {
      // Win scenario - continuous road drawing
      gameState.isDrawingRoad = true;
    } else {
      // Human controls
      if (keys[37]) { // LEFT
        gameState.roadDrawAngle -= 0.05;
      }
      if (keys[39]) { // RIGHT
        gameState.roadDrawAngle += 0.05;
      }
      
      // Limit angle
      gameState.roadDrawAngle = p.constrain(gameState.roadDrawAngle, -0.3, 0.3);
      
      // Space to draw road
      gameState.isDrawingRoad = keys[32];
    }
  }

  function updateGame(p) {
    gameState.gameDuration++;
    
    // Increase game speed over time
    gameState.gameSpeed = Math.min(
      PHYSICS.MAX_SPEED, 
      PHYSICS.INITIAL_SPEED + gameState.gameDuration * PHYSICS.SPEED_INCREMENT
    );

    // Score increases with survival time
    gameState.score = Math.floor(gameState.gameDuration / 10);
    gameState.distance = Math.floor(gameState.scrollOffset / 10);

    // Draw road segments
    if (gameState.isDrawingRoad && p.frameCount % 3 === 0) {
      const newX = gameState.lastRoadX + Math.sin(gameState.roadDrawAngle) * 15;
      const newY = gameState.lastRoadY - PHYSICS.ROAD_SEGMENT_HEIGHT + 2;
      
      // Keep road on screen
      const constrainedX = p.constrain(newX, PHYSICS.ROAD_SEGMENT_WIDTH / 2, 
                                       CANVAS_WIDTH - PHYSICS.ROAD_SEGMENT_WIDTH / 2);
      
      const road = new RoadSegment(p, constrainedX, newY, gameState.roadDrawAngle);
      gameState.roadSegments.push(road);
      gameState.entities.push(road);
      
      gameState.lastRoadX = constrainedX;
      gameState.lastRoadY = newY;
    }

    // Scroll world down (move everything down)
    gameState.scrollOffset += gameState.gameSpeed;
    
    // Move all static road segments down
    gameState.roadSegments.forEach(road => {
      if (road.body) {
        Body.setPosition(road.body, { 
          x: road.body.position.x, 
          y: road.body.position.y + gameState.gameSpeed 
        });
      }
    });

    // Spawn police cars
    gameState.framesSincePoliceSpawn++;
    const spawnRate = Math.max(60, PHYSICS.POLICE_SPAWN_RATE - gameState.gameDuration / 20);
    
    if (gameState.framesSincePoliceSpawn > spawnRate) {
      const spawnX = p.random(100, CANVAS_WIDTH - 100);
      const police = new PoliceCar(p, spawnX, -50);
      gameState.policeCars.push(police);
      gameState.entities.push(police);
      gameState.framesSincePoliceSpawn = 0;
      console.log(`Police car spawned at (${spawnX.toFixed(1)}, -50). Total police: ${gameState.policeCars.length}`);
    }

    // Spawn obstacles
    gameState.framesSinceObstacleSpawn++;
    const obstacleSpawnRate = Math.max(60, PHYSICS.OBSTACLE_SPAWN_RATE - gameState.gameDuration / 30);
    
    if (gameState.framesSinceObstacleSpawn > obstacleSpawnRate) {
      const spawnX = p.random(150, CANVAS_WIDTH - 150);
      const obstacle = new Obstacle(p, spawnX, -50);
      gameState.obstacles.push(obstacle);
      gameState.entities.push(obstacle);
      gameState.framesSinceObstacleSpawn = 0;
      console.log(`Obstacle spawned at (${spawnX.toFixed(1)}, -50). Total obstacles: ${gameState.obstacles.length}`);
    }

    // Update entities
    const beforeCount = gameState.entities.length;
    gameState.entities = gameState.entities.filter(entity => {
      if (entity.update) {
        return entity.update();
      }
      return true;
    });
    const afterCount = gameState.entities.length;
    if (beforeCount !== afterCount) {
      console.log(`Entities cleaned up: ${beforeCount} -> ${afterCount}`);
    }

    // Update player
    if (gameState.player) {
      gameState.player.update();
    }

    // Check for player crash
    checkPlayerCrashed(p);

    // Clean up arrays
    gameState.roadSegments = gameState.roadSegments.filter(r => gameState.entities.includes(r));
    gameState.policeCars = gameState.policeCars.filter(pc => gameState.entities.includes(pc));
    gameState.obstacles = gameState.obstacles.filter(o => gameState.entities.includes(o));
  }

  function renderStartScreen(p) {
    p.background(COLORS.SKY);
    
    // Title
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("ROAD RUNNER", CANVAS_WIDTH / 2, 80);
    
    // Subtitle
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.fill(255, 255, 100);
    p.text("Escape the Police!", CANVAS_WIDTH / 2, 130);
    
    // Instructions
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT);
    p.text("HOW TO PLAY:", 100, 180);
    p.textSize(14);
    p.text("• Use LEFT/RIGHT arrows to steer", 120, 210);
    p.text("• Hold SPACE to draw the road", 120, 235);
    p.text("• Avoid police cars and obstacles", 120, 260);
    p.text("• Survive as long as possible!", 120, 285);
    
    // Start prompt
    p.textAlign(p.CENTER);
    p.textSize(24);
    p.fill(100, 255, 100);
    if (p.frameCount % 60 < 30) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
    }
    
    // Draw sample car
    p.push();
    p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.fill(COLORS.PLAYER_CAR);
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(-15, -22, 30, 45);
    p.fill(150, 200, 255);
    p.rect(-10, -15, 20, 12);
    p.fill(0);
    p.noStroke();
    p.ellipse(-10, 15, 6, 8);
    p.ellipse(10, 15, 6, 8);
    p.pop();
  }

  function renderGame(p) {
    // Background
    p.background(COLORS.SKY);
    
    // Ground
    p.fill(COLORS.GROUND);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Debug: Log render call periodically
    if (p.frameCount % 120 === 0) {
      console.log(`[Render] Rendering ${gameState.entities.length} entities`);
    }
    
    // Render entities
    let renderedCount = 0;
    gameState.entities.forEach(entity => {
      if (entity.render) {
        entity.render();
        renderedCount++;
      }
    });
    
    if (p.frameCount % 120 === 0) {
      console.log(`[Render] Actually rendered ${renderedCount} entities`);
    }

    // UI
    renderUI(p);
  }

  function renderUI(p) {
    // Score
    p.fill(255);
    p.textAlign(p.LEFT);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text(`SCORE: ${gameState.score}`, 10, 30);
    
    // Distance
    p.text(`DISTANCE: ${gameState.distance}m`, 10, 55);
    
    // Speed indicator
    const speedPercent = ((gameState.gameSpeed - PHYSICS.INITIAL_SPEED) / 
                         (PHYSICS.MAX_SPEED - PHYSICS.INITIAL_SPEED)) * 100;
    p.text(`SPEED: ${Math.floor(speedPercent)}%`, 10, 80);
    
    // Police count
    p.fill(255, 100, 100);
    p.text(`POLICE: ${gameState.policeCars.length}`, CANVAS_WIDTH - 130, 30);
    
    // Road drawing indicator
    if (gameState.isDrawingRoad) {
      p.fill(100, 255, 100);
      p.textAlign(p.CENTER);
      p.textSize(16);
      p.text("DRAWING ROAD", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    } else {
      p.fill(255, 100, 100);
      p.textAlign(p.CENTER);
      p.textSize(16);
      p.text("HOLD SPACE TO DRAW!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    }
  }

  function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
    
    p.textSize(20);
    p.textStyle(p.NORMAL);
    p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }

  function renderGameOver(p) {
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.textStyle(p.BOLD);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    // Reason
    p.fill(255, 255, 100);
    p.textSize(20);
    p.text(gameState.gameOverReason || "CAUGHT!", CANVAS_WIDTH / 2, 160);
    
    // Score
    p.fill(255);
    p.textSize(32);
    p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.textSize(24);
    p.text(`DISTANCE: ${gameState.distance}m`, CANVAS_WIDTH / 2, 260);
    
    // Restart
    p.textSize(20);
    p.fill(100, 255, 100);
    if (p.frameCount % 60 < 30) {
      p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
    }
  }

  function resetGame(p) {
    console.log("=== RESETTING GAME ===");
    
    // Remove all bodies from world
    World.clear(world, false);
    
    // Reset game state
    gameState.player = null;
    gameState.entities = [];
    gameState.roadSegments = [];
    gameState.policeCars = [];
    gameState.obstacles = [];
    gameState.score = 0;
    gameState.distance = 0;
    gameState.scrollOffset = 0;
    gameState.gameSpeed = PHYSICS.INITIAL_SPEED;
    gameState.roadDrawAngle = 0;
    gameState.isDrawingRoad = false;
    gameState.gameDuration = 0;
    gameState.gamePhase = GAME_PHASES.START;
    
    // Reinitialize game
    initializeGame(p);
    
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START, action: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    console.log("=== GAME RESET COMPLETE ===");
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const btnId = modeMap[mode];
  if (btnId) {
    const btn = document.getElementById(btnId);
    if (btn) btn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};