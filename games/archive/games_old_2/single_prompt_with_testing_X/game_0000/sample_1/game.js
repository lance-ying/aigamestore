const p5 = window.p5;
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Engine, World, Bodies } = Matter;

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ITEM_TYPES, setControlMode } from './globals.js';
import { Miner, Claw, Item } from './entities.js';
import { initPhysics } from './physics.js';

let gameInstance = new p5(p => {
  let miner, claw;
  let lastTimeUpdate = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);

    // Create Matter.js engine and world
    gameState.engine = Engine.create();
    gameState.world = gameState.engine.world;
    gameState.world.gravity.y = 0; // No gravity for this game

    // Initialize physics
    initPhysics();

    // Initialize p5.logs (write-only)
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

    initializeGame();
  };

  function initializeGame() {
    // Create miner
    miner = new Miner(p, CANVAS_WIDTH / 2, 30);
    gameState.player = miner;

    // Create claw
    claw = new Claw(p, CANVAS_WIDTH / 2, 50);
    gameState.claw = claw;

    generateItems();
  }

  function generateItems() {
    gameState.items = [];
    const itemCount = 8 + gameState.level * 2;
    
    for (let i = 0; i < itemCount; i++) {
      const x = p.random(50, CANVAS_WIDTH - 50);
      const y = p.random(150, CANVAS_HEIGHT - 50);
      
      // Determine item type based on level and randomness
      let type;
      const rand = p.random();
      if (rand < 0.1 + gameState.level * 0.02) {
        type = "DIAMOND";
      } else if (rand < 0.3) {
        type = "LARGE_GOLD";
      } else if (rand < 0.6) {
        type = "SMALL_GOLD";
      } else {
        type = "ROCK";
      }
      
      gameState.items.push(new Item(p, x, y, type));
    }
  }

  function resetGame() {
    gameState.level = 1;
    gameState.score = 0;
    gameState.moneyTarget = 500;
    gameState.timeLimit = 60;
    gameState.timeRemaining = 60;
    gameState.clawState = "SWINGING";
    gameState.clawSwingAngle = 0;
    gameState.clawSwingDirection = 1;
    gameState.grabbedItem = null;
    gameState.powerUps = { dynamite: 0, strength: 0 };
    gameState.strengthActive = false;
    gameState.strengthFramesLeft = 0;
    
    generateItems();
  }

  function nextLevel() {
    gameState.level++;
    gameState.moneyTarget += 100 + gameState.level * 50;
    gameState.timeLimit = Math.max(45, 60 - gameState.level * 2);
    gameState.timeRemaining = gameState.timeLimit;
    gameState.clawState = "SWINGING";
    gameState.clawSwingAngle = 0;
    gameState.grabbedItem = null;
    
    generateItems();
  }

  function updateGame() {
    gameState.frameCounter++;
    
    // Update time
    if (p.frameCount - lastTimeUpdate >= 60) { // Every second
      gameState.timeRemaining--;
      lastTimeUpdate = p.frameCount;
      
      if (gameState.timeRemaining <= 0) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", reason: "time_up" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Update strength power-up
    if (gameState.strengthActive) {
      gameState.strengthFramesLeft--;
      if (gameState.strengthFramesLeft <= 0) {
        gameState.strengthActive = false;
      }
    }

    // Update claw
    claw.update();

    // Check win condition
    if (gameState.score >= gameState.moneyTarget) {
      gameState.gamePhase = "SHOP";
      p.logs.game_info.push({
        data: { gamePhase: "SHOP", level: gameState.level },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }

    // Log player position periodically
    if (gameState.frameCounter - gameState.lastPlayerLogFrame >= 30) {
      p.logs.player_info.push({
        screen_x: claw.x,
        screen_y: claw.y,
        game_x: claw.x,
        game_y: claw.y,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      gameState.lastPlayerLogFrame = gameState.frameCounter;
    }

    // Handle automated testing
    handleAutomatedTesting();
  }

  function handleAutomatedTesting() {
    if (gameState.controlMode === "TEST_1") {
      // Basic testing - deploy claw every 120 frames
      if (gameState.frameCounter % 120 === 0) {
        claw.deploy();
      }
    } else if (gameState.controlMode === "TEST_2") {
      // Win test - target high-value items
      if (gameState.clawState === "SWINGING" && gameState.frameCounter % 60 === 0) {
        // Find highest value item and try to position over it
        let bestItem = null;
        let bestValue = 0;
        
        for (let item of gameState.items) {
          if (item.value > bestValue) {
            bestValue = item.value;
            bestItem = item;
          }
        }
        
        if (bestItem) {
          const clawX = claw.startX + Math.sin(gameState.clawSwingAngle) * claw.ropeLength;
          const distance = Math.abs(clawX - bestItem.x);
          
          // Deploy if close enough to valuable item
          if (distance < 30) {
            claw.deploy();
          }
        }
      }
    }
  }

  p.draw = function() {
    // Update Matter.js physics engine
    Engine.update(gameState.engine, 1000 / 60);

    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen();
        break;
      case "PLAYING":
        updateGame();
        renderGame();
        break;
      case "PAUSED":
        renderGame();
        renderPausedOverlay();
        break;
      case "SHOP":
        renderShop();
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGameOver();
        break;
    }
  };

  function renderStartScreen() {
    p.background(20, 50, 80);
    
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("🏃‍♂️ GOLD MINER", CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(16);
    p.text("Swing your claw and grab valuable items!", CANVAS_WIDTH / 2, 150);
    p.text("Meet the money target before time runs out!", CANVAS_WIDTH / 2, 170);
    
    p.text("Gold nuggets, diamonds, and rocks await!", CANVAS_WIDTH / 2, 210);
    p.text("Heavier items slow your claw down!", CANVAS_WIDTH / 2, 230);
    
    p.fill(255, 255, 0);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 300);
    
    // Show current target
    p.fill(255);
    p.textSize(14);
    p.text(`Level ${gameState.level} Target: $${gameState.moneyTarget}`, CANVAS_WIDTH / 2, 340);
    p.text(`Time Limit: ${gameState.timeLimit} seconds`, CANVAS_WIDTH / 2, 360);
  }

  function renderGame() {
    // Sky gradient background
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const alpha = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
      p.stroke(p.lerpColor(p.color(135, 206, 235), p.color(101, 67, 33), alpha));
      p.line(0, y, CANVAS_WIDTH, y);
    }

    // Draw ground
    p.fill(101, 67, 33);
    p.noStroke();
    p.rect(0, 100, CANVAS_WIDTH, CANVAS_HEIGHT - 100);
    
    // Draw items
    for (let item of gameState.items) {
      item.render();
    }
    
    // Draw grabbed item
    if (gameState.grabbedItem) {
      gameState.grabbedItem.render();
    }

    // Draw miner
    miner.render();

    // Draw claw
    claw.render();

    // Draw UI
    renderUI();
  }

  function renderUI() {
    // Top bar background
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 80);
    
    // Score and target
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Money: $${gameState.score}`, 10, 10);
    p.text(`Target: $${gameState.moneyTarget}`, 10, 30);
    p.text(`Level: ${gameState.level}`, 10, 50);
    
    // Time
    p.textAlign(p.RIGHT, p.TOP);
    const timeColor = gameState.timeRemaining <= 10 ? [255, 0, 0] : [255, 255, 255];
    p.fill(timeColor);
    p.text(`Time: ${gameState.timeRemaining}s`, CANVAS_WIDTH - 10, 10);
    
    // Progress bar
    const progress = gameState.score / gameState.moneyTarget;
    p.fill(50);
    p.rect(CANVAS_WIDTH - 210, 30, 200, 20);
    p.fill(0, 255, 0);
    p.rect(CANVAS_WIDTH - 210, 30, progress * 200, 20);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("Progress", CANVAS_WIDTH - 110, 40);

    // Power-ups
    if (gameState.powerUps.dynamite > 0 || gameState.powerUps.strength > 0) {
      p.fill(255);
      p.textAlign(p.RIGHT, p.TOP);
      p.textSize(12);
      if (gameState.powerUps.dynamite > 0) {
        p.text(`🧨 ${gameState.powerUps.dynamite}`, CANVAS_WIDTH - 10, 55);
      }
      if (gameState.strengthActive) {
        p.fill(255, 255, 0);
        p.text("💪 ACTIVE", CANVAS_WIDTH - 80, 55);
      } else if (gameState.powerUps.strength > 0) {
        p.fill(255);
        p.text(`💪 ${gameState.powerUps.strength}`, CANVAS_WIDTH - 80, 55);
      }
    }
  }

  function renderPausedOverlay() {
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  }

  function renderShop() {
    p.background(50, 50, 100);
    
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(28);
    p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 60);
    
    p.fill(255);
    p.textSize(16);
    p.text(`Level ${gameState.level} Target: $${gameState.moneyTarget} ✓`, CANVAS_WIDTH / 2, 100);
    p.text(`Money Earned: $${gameState.score}`, CANVAS_WIDTH / 2, 120);
    
    p.textSize(20);
    p.text("SHOP", CANVAS_WIDTH / 2, 160);
    
    // Shop items
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text("💣 Dynamite - $100 (Destroy grabbed item)", 50, 200);
    p.text("💪 Strength Potion - $200 (50% faster for 10 seconds)", 50, 220);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Use ARROW KEYS to navigate, SPACE to buy", CANVAS_WIDTH / 2, 260);
    p.text("Press ENTER to continue to next level", CANVAS_WIDTH / 2, 300);
    
    p.fill(255, 255, 0);
    p.text(`Next Level Target: $${gameState.moneyTarget + 100 + (gameState.level + 1) * 50}`, CANVAS_WIDTH / 2, 340);
  }

  function renderGameOver() {
    p.background(20, 20, 20);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      p.fill(0, 255, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(32);
      p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 150);
      
      p.fill(255);
      p.textSize(16);
      p.text(`You completed Level ${gameState.level}!`, CANVAS_WIDTH / 2, 200);
    } else {
      p.fill(255, 0, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(32);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
      
      p.fill(255);
      p.textSize(16);
      p.text("Time's up! Try again!", CANVAS_WIDTH / 2, 200);
    }
    
    p.text(`Final Score: $${gameState.score}`, CANVAS_WIDTH / 2, 240);
    p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 260);
    
    p.fill(255, 255, 0);
    p.textSize(18);
    p.text("Press R to restart", CANVAS_WIDTH / 2, 320);
  }

  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        gameState.timeRemaining = gameState.timeLimit;
        lastTimeUpdate = p.frameCount;
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "SHOP") {
        nextLevel();
        gameState.gamePhase = "PLAYING";
        lastTimeUpdate = p.frameCount;
        p.logs.game_info.push({
          data: { gamePhase: "PLAYING", level: gameState.level },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 27) { // ESC - Pause/Unpause
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
      }
    }

    if (p.keyCode === 82) { // R - Restart
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame();
        gameState.gamePhase = "START";
        p.logs.game_info.push({
          data: { gamePhase: "START", action: "restart" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Game controls
    if (gameState.gamePhase === "PLAYING") {
      if (p.keyCode === 32) { // SPACE - Deploy claw
        claw.deploy();
      }
    }

    // Shop controls
    if (gameState.gamePhase === "SHOP") {
      if (p.keyCode === 32) { // SPACE - Buy item (placeholder)
        // Simple shop logic - could be expanded
      }
    }

    return false;
  };

  // Initialize the game
  gameState.gamePhase = "START";
});

// Expose globally
window.gameInstance = gameInstance;