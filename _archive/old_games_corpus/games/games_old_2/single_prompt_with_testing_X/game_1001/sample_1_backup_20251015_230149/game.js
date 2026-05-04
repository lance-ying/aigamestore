const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies, Body } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Vehicle } from './entities.js';
import { generateTerrain, generateCoins, renderTerrain } from './terrain.js';
import { setupPhysics } from './physics.js';

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Create Matter.js engine and world
    const engine = Engine.create();
    const world = engine.world;
    world.gravity.y = 1;
    
    gameState.engine = engine;
    gameState.world = world;
    
    // Initialize p5.logs
    p.logs = {
      game_info: [],
      player_info: [],
      inputs: []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup physics collision handling
    setupPhysics();
    
    // Generate terrain and collectibles
    generateTerrain(p);
    generateCoins(p);
  };
  
  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        checkGameOver(p);
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
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
      startGame(p);
    }
    
    if (p.keyCode === 27) { // ESC
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
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || 
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
      }
    }
    
    return false;
  };
  
  function startGame(p) {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.coins = 0;
    gameState.fuel = 100;
    gameState.distance = 0;
    gameState.crashed = false;
    gameState.won = false;
    gameState.testModeTimer = 0;
    
    // Create player vehicle
    gameState.player = new Vehicle(p, 100, CANVAS_HEIGHT - 150);
    gameState.entities.push(gameState.player);
    
    p.logs.game_info.push({
      data: { gamePhase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function updateGame(p) {
    // Handle controls
    if (gameState.player) {
      if (gameState.controlMode === "HUMAN") {
        handleHumanControls(p);
      } else if (gameState.controlMode === "TEST_1") {
        handleTestMode1(p);
      } else if (gameState.controlMode === "TEST_2") {
        handleTestMode2(p);
      }
      
      gameState.player.update();
    }
    
    // Update collectibles
    for (let coin of gameState.collectibles) {
      coin.update();
    }
    
    // Update camera to follow player
    if (gameState.player) {
      gameState.camera.x = gameState.player.chassis.position.x - CANVAS_WIDTH / 3;
      gameState.camera.y = 0;
    }
  }
  
  function handleHumanControls(p) {
    // Arrow Right or D - Accelerate
    if (p.keyIsDown(39) || p.keyIsDown(68)) {
      gameState.player.accelerate();
    }
    
    // Arrow Left or A - Brake
    if (p.keyIsDown(37) || p.keyIsDown(65)) {
      gameState.player.brake();
    }
    
    // Space - Balance
    if (p.keyIsDown(32)) {
      gameState.player.balance();
    }
  }
  
  function handleTestMode1(p) {
    // Basic testing - just accelerate
    gameState.testModeTimer++;
    if (gameState.testModeTimer > 30) {
      gameState.player.accelerate();
    }
  }
  
  function handleTestMode2(p) {
    // Win condition test - aggressive acceleration and balance
    gameState.player.accelerate();
    
    // Balance when tilting
    const angle = gameState.player.chassis.angle % (2 * Math.PI);
    const normalizedAngle = angle < 0 ? angle + 2 * Math.PI : angle;
    
    if (normalizedAngle > 0.3 || normalizedAngle < -0.3) {
      gameState.player.balance();
    }
  }
  
  function checkGameOver(p) {
    if (gameState.crashed) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_LOSE", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.won) {
      gameState.gamePhase = "GAME_OVER_WIN";
      p.logs.game_info.push({
        data: { gamePhase: "GAME_OVER_WIN", score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function renderGame(p) {
    // Sky gradient
    for (let i = 0; i < CANVAS_HEIGHT; i++) {
      const inter = p.map(i, 0, CANVAS_HEIGHT, 0, 1);
      const c = p.lerpColor(p.color(135, 206, 250), p.color(255, 248, 220), inter);
      p.stroke(c);
      p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Render terrain
    renderTerrain(p);
    
    // Render collectibles
    for (let coin of gameState.collectibles) {
      coin.render();
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render();
    }
    
    // UI
    renderUI(p);
  }
  
  function renderUI(p) {
    // HUD background
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 80);
    
    // Score
    p.fill(255);
    p.textSize(18);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Score: ${gameState.score}`, 10, 10);
    
    // Coins
    p.fill(255, 215, 0);
    p.text(`Coins: ${gameState.coins}`, 10, 35);
    
    // Distance
    p.fill(100, 200, 255);
    p.text(`Distance: ${gameState.distance}m`, 10, 60);
    
    // Fuel bar
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255);
    p.text('Fuel:', CANVAS_WIDTH - 160, 10);
    
    p.stroke(100);
    p.strokeWeight(2);
    p.noFill();
    p.rect(CANVAS_WIDTH - 150, 10, 140, 20);
    
    const fuelColor = gameState.fuel > 50 ? p.color(0, 255, 0) : 
                      gameState.fuel > 25 ? p.color(255, 200, 0) : 
                      p.color(255, 0, 0);
    p.noStroke();
    p.fill(fuelColor);
    p.rect(CANVAS_WIDTH - 148, 12, (gameState.fuel / 100) * 136, 16);
    
    // Speed indicator
    if (gameState.player) {
      const speed = Math.sqrt(
        Math.pow(gameState.player.chassis.velocity.x, 2) + 
        Math.pow(gameState.player.chassis.velocity.y, 2)
      );
      p.fill(255);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(`Speed: ${Math.floor(speed * 2)} km/h`, CANVAS_WIDTH - 10, 40);
    }
  }
  
  function renderStartScreen(p) {
    p.background(20, 30, 50);
    
    // Title
    p.fill(255, 215, 0);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("HILL CLIMB RACING", CANVAS_WIDTH / 2, 80);
    
    // Subtitle
    p.fill(200);
    p.textSize(20);
    p.text("with Bill the Racer", CANVAS_WIDTH / 2, 130);
    
    // Instructions box
    p.fill(40, 50, 70);
    p.stroke(100, 120, 150);
    p.strokeWeight(2);
    p.rect(CANVAS_WIDTH / 2 - 200, 170, 400, 160, 10);
    
    // Instructions
    p.fill(255);
    p.noStroke();
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    const instructions = [
      "→ / D: Accelerate",
      "← / A: Brake/Reverse",
      "SPACE: Balance (shift weight)",
      "",
      "Collect coins and reach the finish!",
      "Don't crash or run out of fuel!"
    ];
    
    let yPos = 185;
    for (let line of instructions) {
      p.text(line, CANVAS_WIDTH / 2 - 180, yPos);
      yPos += 24;
    }
    
    // Start prompt
    p.fill(255, 215, 0);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    
    // Blinking effect
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
    }
  }
  
  function renderPausedOverlay(p) {
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    p.textSize(20);
    p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
  
  function renderGameOver(p) {
    // Darken background
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Result box
    p.fill(40, 50, 70);
    p.stroke(100, 120, 150);
    p.strokeWeight(3);
    p.rect(CANVAS_WIDTH / 2 - 200, 80, 400, 240, 10);
    
    p.noStroke();
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      p.fill(0, 255, 100);
      p.textSize(48);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("YOU WIN!", CANVAS_WIDTH / 2, 130);
      
      p.fill(255);
      p.textSize(20);
      p.text("Congratulations!", CANVAS_WIDTH / 2, 180);
    } else {
      p.fill(255, 50, 50);
      p.textSize(48);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("CRASHED!", CANVAS_WIDTH / 2, 130);
      
      p.fill(255);
      p.textSize(20);
      p.text("Better luck next time!", CANVAS_WIDTH / 2, 180);
    }
    
    // Stats
    p.fill(255, 215, 0);
    p.textSize(18);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Coins Collected: ${gameState.coins}`, CANVAS_WIDTH / 2, 245);
    p.text(`Distance: ${gameState.distance}m`, CANVAS_WIDTH / 2, 270);
    
    // Restart prompt
    p.fill(255);
    p.textSize(20);
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
      p.text("Press R to Restart", CANVAS_WIDTH / 2, 310);
    }
  }
  
  function resetGame(p) {
    // Clear all entities
    if (gameState.player) {
      World.remove(gameState.world, [
        gameState.player.chassis,
        gameState.player.frontWheel,
        gameState.player.backWheel,
        gameState.player.frontAxle,
        gameState.player.backAxle
      ]);
    }
    
    // Clear ground bodies
    for (let body of gameState.groundBodies) {
      World.remove(gameState.world, body);
    }
    
    // Reset game state
    gameState.player = null;
    gameState.entities = [];
    gameState.score = 0;
    gameState.coins = 0;
    gameState.fuel = 100;
    gameState.distance = 0;
    gameState.terrain = [];
    gameState.collectibles = [];
    gameState.groundBodies = [];
    gameState.camera = { x: 0, y: 0 };
    gameState.lastLoggedX = 0;
    gameState.crashed = false;
    gameState.won = false;
    gameState.gamePhase = "START";
    
    // Regenerate terrain
    generateTerrain(p);
    generateCoins(p);
    
    p.logs.game_info.push({
      data: { gamePhase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  const modes = ['HUMAN', 'TEST_1', 'TEST_2'];
  
  buttons.forEach((btnId, idx) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      if (modes[idx] === mode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
};