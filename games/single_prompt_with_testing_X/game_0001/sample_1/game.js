const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Player, Enemy, Coin, Cloverleaf, Platform, Flag } from './entities.js';
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

    // Setup physics
    setupPhysics(p);

    // Initialize game
    initializeGame(p);
  };

  p.draw = function() {
    // Update Matter.js physics
    Engine.update(gameState.engine, 1000 / 60);

    // Update game logic based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        break;
      case "PAUSED":
        renderGame(p);
        renderPausedOverlay(p);
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

    // Update keys state
    gameState.keys[p.keyCode] = true;

    // Handle phase controls
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      startGame(p);
    }

    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
      }
      
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" ||
          gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame(p);
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

    // Update keys state
    gameState.keys[p.keyCode] = false;

    return false;
  };
});

function initializeGame(p) {
  // Clear existing entities
  gameState.entities = [];
  gameState.enemies = [];
  gameState.coins = [];
  gameState.cloverleaves = [];
  gameState.platforms = [];
  
  // Reset game state
  gameState.score = 0;
  gameState.playerHealth = gameState.maxHealth;
  gameState.groundContactCount = 0;
  gameState.camera = { x: 0, y: 0 };
  gameState.keys = {};
  gameState.isJumping = false;
  
  // Initialize test state
  gameState.testState = {
    startTime: Date.now(),
    phase: 'move_right',
    moveStartTime: 0,
    jumpTestCount: 0,
    enemyTestComplete: false,
    coinTestComplete: false,
    fallTestComplete: false
  };

  // Create level
  createLevel1(p);
}

function createLevel1(p) {
  // Create ground platforms
  const groundY = CANVAS_HEIGHT - 40;
  
  // Main ground
  const ground1 = new Platform(p, 150, groundY, 300, 80);
  gameState.platforms.push(ground1);
  gameState.entities.push(ground1);
  
  // Gap for pit testing
  const ground2 = new Platform(p, 500, groundY, 200, 80);
  gameState.platforms.push(ground2);
  gameState.entities.push(ground2);
  
  // More platforms
  const ground3 = new Platform(p, 800, groundY, 400, 80);
  gameState.platforms.push(ground3);
  gameState.entities.push(ground3);
  
  // Floating platforms
  const platform1 = new Platform(p, 350, groundY - 80, 100, 20);
  gameState.platforms.push(platform1);
  gameState.entities.push(platform1);
  
  const platform2 = new Platform(p, 650, groundY - 60, 80, 20);
  gameState.platforms.push(platform2);
  gameState.entities.push(platform2);

  // Create player
  gameState.player = new Player(p, 100, groundY - 100);
  gameState.entities.push(gameState.player);

  // Create enemies
  const enemy1 = new Enemy(p, 400, groundY - 30);
  gameState.enemies.push(enemy1);
  gameState.entities.push(enemy1);
  
  const enemy2 = new Enemy(p, 750, groundY - 30);
  gameState.enemies.push(enemy2);
  gameState.entities.push(enemy2);

  // Create coins
  for (let i = 0; i < 8; i++) {
    const x = 200 + i * 120;
    const y = groundY - 60 - (i % 2) * 30;
    const coin = new Coin(p, x, y);
    gameState.coins.push(coin);
    gameState.entities.push(coin);
  }

  // Create cloverleaves (health pickups)
  const clover1 = new Cloverleaf(p, 320, groundY - 50);
  gameState.cloverleaves.push(clover1);
  gameState.entities.push(clover1);
  
  const clover2 = new Cloverleaf(p, 680, groundY - 50);
  gameState.cloverleaves.push(clover2);
  gameState.entities.push(clover2);

  // Create flag at the end
  gameState.flag = new Flag(p, 1000, groundY - 80);
  gameState.entities.push(gameState.flag);
}

function startGame(p) {
  gameState.gamePhase = "PLAYING";
  gameState.testState.startTime = Date.now();
  
  p.logs.game_info.push({
    data: { gamePhase: "PLAYING" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function updateGame(p) {
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
}

function resetGame(p) {
  // Clear Matter.js world
  World.clear(gameState.world, false);
  
  // Reinitialize
  initializeGame(p);
  gameState.gamePhase = "START";
  
  p.logs.game_info.push({
    data: { gamePhase: "START", action: "restart" },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function renderStartScreen(p) {
  p.background(COLORS.SKY_BLUE);
  
  // Title
  p.fill(COLORS.WHITE);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("Lep's Adventure", CANVAS_WIDTH / 2, 100);
  
  // Description
  p.textSize(16);
  p.text("Guide Lep the leprechaun through magical worlds!", CANVAS_WIDTH / 2, 150);
  p.text("Collect coins, avoid enemies, and reach the flag!", CANVAS_WIDTH / 2, 170);
  
  // Instructions
  p.textSize(14);
  p.text("A/D or Arrow Keys: Move", CANVAS_WIDTH / 2, 210);
  p.text("W/Space/Up Arrow: Jump (hold for higher jump)", CANVAS_WIDTH / 2, 230);
  p.text("ESC: Pause, R: Restart", CANVAS_WIDTH / 2, 250);
  
  // Start prompt
  p.textSize(20);
  p.fill(COLORS.GOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 320);
  
  // Draw decorative leprechaun
  p.push();
  p.translate(CANVAS_WIDTH / 2, 280);
  p.fill(COLORS.LEPRECHAUN_GREEN);
  p.circle(0, 0, 30);
  p.fill(COLORS.LEPRECHAUN_HAT);
  p.triangle(-8, -15, 8, -15, 0, -25);
  p.pop();
}

function renderGame(p) {
  p.background(COLORS.SKY_BLUE);
  
  // Render all entities
  gameState.entities.forEach(entity => {
    if (entity.render) {
      entity.render();
    }
  });
  
  // Render UI
  renderUI(p);
}

function renderUI(p) {
  // Health hearts
  p.fill(COLORS.FLAG_RED);
  p.noStroke();
  for (let i = 0; i < gameState.maxHealth; i++) {
    const x = 20 + i * 30;
    const y = 25;
    if (i < gameState.playerHealth) {
      // Full heart
      p.push();
      p.translate(x, y);
      p.beginShape();
      p.vertex(0, 5);
      p.bezierVertex(-10, -5, -10, 0, 0, 10);
      p.bezierVertex(10, 0, 10, -5, 0, 5);
      p.endShape();
      p.pop();
    } else {
      // Empty heart outline
      p.noFill();
      p.stroke(COLORS.FLAG_RED);
      p.strokeWeight(2);
      p.push();
      p.translate(x, y);
      p.beginShape();
      p.vertex(0, 5);
      p.bezierVertex(-10, -5, -10, 0, 0, 10);
      p.bezierVertex(10, 0, 10, -5, 0, 5);
      p.endShape();
      p.pop();
    }
  }
  
  // Score
  p.fill(COLORS.WHITE);
  p.stroke(COLORS.BLACK);
  p.strokeWeight(1);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 20, 20);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level: ${gameState.level}`, 20, 60);
}

function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(COLORS.WHITE);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

function renderGameOver(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over text
  p.fill(COLORS.WHITE);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(COLORS.GOLD);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    p.fill(COLORS.WHITE);
    p.textSize(20);
    p.text("Congratulations, you reached the flag!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else {
    p.fill(COLORS.FLAG_RED);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    p.fill(COLORS.WHITE);
    p.textSize(20);
    p.text("Better luck next time!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  // Score
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Restart prompt
  p.textSize(16);
  p.fill(COLORS.GOLD);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// Expose globally
window.gameInstance = gameInstance;